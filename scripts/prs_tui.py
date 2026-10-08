"""Pick merge requests in a curses list, then run one bulk action on the selection.

    export GH_TOKEN="<my classic GitHub token with rights (e.g. public_repo)"
    python3 ./scripts/prs_tui.py --repo k0rdent/catalog --match ': automated update$'

Keys: arrows / j k move, space toggles, a all, n none, i invert, / filter,
      Enter confirm selection, q quit.

The forge layer is kept behind the Forge interface so a GitLab backend can be
added next to GitHubForge without touching the TUI.
"""
import argparse
import concurrent.futures
import curses
import json
import os
import re
import subprocess
import sys
import time
import urllib.error
import urllib.parse
import urllib.request


class PullRequest:
    """A merge request, in forge-neutral terms."""

    def __init__(self, number, title, author, url, source_branch, target_branch,
                 source_project=None, head_sha=None):
        self.number = number
        self.title = title
        self.author = author
        self.url = url
        self.source_branch = source_branch
        self.target_branch = target_branch
        self.source_project = source_project
        self.head_sha = head_sha
        # Filled in by Forge.load_details().
        self.changed_files = None
        self.additions = 0
        self.deletions = 0
        self.commits = None
        self.mergeable = None
        self.state = "..."
        self.checks = "..."
        self.loaded = False

    @property
    def clean(self) -> bool:
        return (self.loaded and self.mergeable is True and self.state == "clean"
                and "FAILING" not in self.checks)


class ForgeError(Exception):
    pass


class Forge:
    """What the TUI needs from a hosting platform."""

    token_env = ""

    def list_open(self) -> list:
        raise NotImplementedError

    def load_details(self, pr: PullRequest):
        raise NotImplementedError

    def merge(self, pr: PullRequest) -> str:
        """Merge the request. Returns a short result note, raises ForgeError."""
        raise NotImplementedError

    def close(self, pr: PullRequest) -> str:
        """Close the request without merging."""
        raise NotImplementedError

    def delete_source_branch(self, pr: PullRequest) -> str:
        raise NotImplementedError


class GitHubForge(Forge):
    API = "https://api.github.com"
    token_env = "GH_TOKEN"

    def __init__(self, repo: str, token: str, merge_method: str = "rebase"):
        self.repo = repo
        self.token = token
        self.merge_method = merge_method

    def _call(self, method: str, path: str, payload: dict = None):
        url = path if path.startswith("http") else f"{self.API}{path}"
        data = json.dumps(payload).encode() if payload is not None else None
        request = urllib.request.Request(url, data=data, method=method)
        request.add_header("Accept", "application/vnd.github+json")
        request.add_header("User-Agent", "k0rdent-catalog-prs-tui")
        request.add_header("Authorization", f"Bearer {self.token}")
        if data:
            request.add_header("Content-Type", "application/json")
        try:
            with urllib.request.urlopen(request, timeout=60) as response:
                body = response.read()
                return response.status, (json.loads(body) if body else None), response.headers
        except urllib.error.HTTPError as e:
            body = e.read()
            try:
                body = json.loads(body)
            except ValueError:
                body = {"message": body.decode(errors="replace")}
            return e.code, body, e.headers

    @staticmethod
    def _error(body: dict) -> str:
        message = (body or {}).get("message", "unknown error")
        for err in (body or {}).get("errors", []) or []:
            detail = err.get("message") if isinstance(err, dict) else str(err)
            if detail:
                message += f" ({detail})"
        return message

    def list_open(self) -> list:
        prs = []
        url = f"{self.API}/repos/{self.repo}/pulls?state=open&per_page=100&sort=created&direction=asc"
        while url:
            status, body, headers = self._call("GET", url)
            if status != 200:
                raise ForgeError(f"cannot list pull requests: {self._error(body)}")
            for item in body:
                head = item["head"]
                prs.append(PullRequest(
                    number=item["number"],
                    title=item["title"],
                    author=item["user"]["login"],
                    url=item["html_url"],
                    source_branch=head["ref"],
                    target_branch=item["base"]["ref"],
                    source_project=head["repo"]["full_name"] if head.get("repo") else None,
                    head_sha=head["sha"],
                ))
            next_page = re.search(r'<([^>]+)>\s*;\s*rel="next"', headers.get("Link", ""))
            url = next_page.group(1) if next_page else None
        return prs

    def load_details(self, pr: PullRequest):
        # The list endpoint has no mergeability, and the first single read only
        # starts GitHub computing it, so give it a couple of tries.
        body = None
        for attempt in range(3):
            status, body, _ = self._call("GET", f"/repos/{self.repo}/pulls/{pr.number}")
            if status != 200:
                pr.state = f"http {status}"
                pr.checks = "-"
                pr.loaded = True
                return
            if body.get("mergeable") is not None:
                break
            time.sleep(1 + attempt)
        pr.changed_files = body.get("changed_files")
        pr.additions = body.get("additions", 0)
        pr.deletions = body.get("deletions", 0)
        pr.commits = body.get("commits")
        pr.mergeable = body.get("mergeable")
        pr.state = body.get("mergeable_state") or "?"
        pr.checks = self._checks(pr.head_sha)
        # Set last: the picker reads this to tell a loaded row from a pending one.
        pr.loaded = True

    def _checks(self, sha: str) -> str:
        status, body, _ = self._call("GET", f"/repos/{self.repo}/commits/{sha}/check-runs?per_page=100")
        if status != 200:
            return "unavailable"
        runs = body.get("check_runs", [])
        if not runs:
            return "none"
        counts = {}
        for run in runs:
            key = run["conclusion"] if run["status"] == "completed" else run["status"]
            counts[key] = counts.get(key, 0) + 1
        bad = {"failure", "timed_out", "cancelled", "action_required"}
        summary = ", ".join(f"{count} {name}" for name, count in sorted(counts.items()))
        return summary + ("  FAILING" if bad & set(counts) else "")

    def merge(self, pr: PullRequest) -> str:
        payload = {"merge_method": self.merge_method, "sha": pr.head_sha}
        status, body, _ = self._call("PUT", f"/repos/{self.repo}/pulls/{pr.number}/merge", payload)
        if status == 200:
            return f"merged {body.get('sha', '')[:12]}"
        raise ForgeError(f"HTTP {status}: {self._error(body)}")

    def delete_source_branch(self, pr: PullRequest) -> str:
        if not pr.source_project:
            raise ForgeError("source repository is gone")
        ref = urllib.parse.quote(pr.source_branch)
        status, body, _ = self._call("DELETE", f"/repos/{pr.source_project}/git/refs/heads/{ref}")
        if status in (200, 204):
            return f"deleted {pr.source_project}:{pr.source_branch}"
        if status == 422:
            return "branch already gone"
        raise ForgeError(f"HTTP {status}: {self._error(body)}")

    def close(self, pr: PullRequest) -> str:
        status, body, _ = self._call("PATCH", f"/repos/{self.repo}/pulls/{pr.number}",
                                     {"state": "closed"})
        if status == 200:
            return "closed"
        raise ForgeError(f"HTTP {status}: {self._error(body)}")


class Picker:
    """Checkbox list over the loaded pull requests."""

    HELP = "space toggle  a all  n none  i invert  / filter  Enter confirm  q quit"

    def __init__(self, prs: list):
        self.prs = prs
        self.selected = set()
        self.filter = ""
        self.cursor = 0
        self.top = 0

    @property
    def visible(self) -> list:
        if not self.filter:
            return self.prs
        needle = self.filter.lower()
        return [pr for pr in self.prs
                if needle in pr.title.lower() or needle in str(pr.number)
                or needle in pr.source_branch.lower()]

    def run(self, screen) -> list:
        curses.curs_set(0)
        # Non-blocking, so rows filled in by the loader threads show up on their own.
        screen.timeout(250)
        while True:
            self._draw(screen)
            key = screen.getch()
            if key == -1:  # redraw tick, no input
                continue
            rows = self.visible
            if key in (curses.KEY_DOWN, ord('j')):
                self.cursor = min(self.cursor + 1, max(len(rows) - 1, 0))
            elif key in (curses.KEY_UP, ord('k')):
                self.cursor = max(self.cursor - 1, 0)
            elif key == curses.KEY_NPAGE:
                self.cursor = min(self.cursor + 10, max(len(rows) - 1, 0))
            elif key == curses.KEY_PPAGE:
                self.cursor = max(self.cursor - 10, 0)
            elif key == curses.KEY_HOME:
                self.cursor = 0
            elif key == curses.KEY_END:
                self.cursor = max(len(rows) - 1, 0)
            elif key == ord(' ') and rows:
                number = rows[self.cursor].number
                self.selected ^= {number}
            elif key == ord('a'):
                self.selected |= {pr.number for pr in rows}
            elif key == ord('n'):
                self.selected -= {pr.number for pr in rows}
            elif key == ord('i'):
                self.selected ^= {pr.number for pr in rows}
            elif key == ord('/'):
                self.filter = self._prompt(screen, "filter: ")
                self.cursor = self.top = 0
            elif key in (curses.KEY_ENTER, 10, 13):
                return [pr for pr in self.prs if pr.number in self.selected]
            elif key in (ord('q'), 27):
                return []

    def _prompt(self, screen, label: str) -> str:
        height, width = screen.getmaxyx()
        curses.echo()
        curses.curs_set(1)
        screen.timeout(-1)  # getstr must block, unlike the redraw loop
        screen.move(height - 1, 0)
        screen.clrtoeol()
        screen.addnstr(height - 1, 0, label, width - 1)
        try:
            value = screen.getstr(height - 1, len(label), 60).decode(errors="replace")
        except curses.error:
            value = ""
        screen.timeout(250)
        curses.noecho()
        curses.curs_set(0)
        return value.strip()

    def _draw(self, screen):
        screen.erase()
        height, width = screen.getmaxyx()
        rows = self.visible
        body_height = max(height - 4, 1)

        if self.cursor >= len(rows):
            self.cursor = max(len(rows) - 1, 0)
        if self.cursor < self.top:
            self.top = self.cursor
        elif self.cursor >= self.top + body_height:
            self.top = self.cursor - body_height + 1

        pending = sum(1 for pr in self.prs if not pr.loaded)
        header = (f"{len(rows)}/{len(self.prs)} shown   {len(self.selected)} selected"
                  + (f"   loading {len(self.prs) - pending}/{len(self.prs)}" if pending else "")
                  + (f"   filter: {self.filter!r}" if self.filter else ""))
        screen.addnstr(0, 0, header, width - 1, curses.A_BOLD)

        for offset in range(body_height):
            index = self.top + offset
            if index >= len(rows):
                break
            pr = rows[index]
            mark = "x" if pr.number in self.selected else " "
            flag = " " if pr.clean else "!"
            line = (f"[{mark}]{flag} #{pr.number:<6} {pr.title[:48]:<48} "
                    f"{str(pr.changed_files or '?'):>3}f  {pr.state:<9} {pr.checks}")
            attr = curses.A_REVERSE if index == self.cursor else curses.A_NORMAL
            screen.addnstr(1 + offset, 0, line, width - 1, attr)

        if rows:
            current = rows[self.cursor]
            detail = f"{current.url}  ({current.source_project}:{current.source_branch})"
            screen.addnstr(height - 2, 0, detail, width - 1, curses.A_DIM)
        screen.addnstr(height - 1, 0, self.HELP, width - 1, curses.A_BOLD)
        screen.refresh()


ACTIONS = {
    "1": ("merge", "merge only, keep source branches"),
    "2": ("merge+delete", "merge, then delete the source branch"),
    "3": ("close", "close without merging, keep source branches"),
    "4": ("close+delete", "close without merging, then delete the source branch"),
    "5": ("delete", "delete source branches only, leave the requests open"),
}


def choose_action(count: int) -> str:
    print(f"\n{count} pull request(s) selected. Bulk action:")
    for key, (name, description) in ACTIONS.items():
        print(f"  {key}) {name:<13} {description}")
    print("  q) cancel")
    while True:
        try:
            choice = input("> ").strip().lower()
        except EOFError:
            return None
        if choice == "q" or choice == "":
            return None
        if choice in ACTIONS:
            return ACTIONS[choice][0]
        print("  unknown choice")


def run_action(forge: Forge, prs: list, action: str):
    merged = closed = deleted = failed = 0
    for index, pr in enumerate(prs, 1):
        print(f"[{index}/{len(prs)}] #{pr.number} {pr.title}")
        try:
            if action in ("merge", "merge+delete"):
                print(f"  {forge.merge(pr)}")
                merged += 1
            if action in ("close", "close+delete"):
                print(f"  {forge.close(pr)}")
                closed += 1
            if action in ("merge+delete", "close+delete", "delete"):
                print(f"  {forge.delete_source_branch(pr)}")
                deleted += 1
        except ForgeError as e:
            print(f"  FAILED: {e}")
            failed += 1
    print(f"\nmerged: {merged}  closed: {closed}  branches deleted: {deleted}  failed: {failed}")


def default_repo() -> str:
    try:
        url = subprocess.run(["git", "remote", "get-url", "origin"], check=True,
                             capture_output=True, text=True).stdout.strip()
    except (subprocess.CalledProcessError, FileNotFoundError):
        return None
    match = re.search(r'github\.com[:/](.+?)(?:\.git)?$', url)
    return match.group(1) if match else None


def main():
    parser = argparse.ArgumentParser(description=__doc__,
                                     formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--repo", default=default_repo(),
                        help="owner/name (default: the 'origin' remote)")
    parser.add_argument("--match", default=None, help="only PRs whose title matches this regex")
    parser.add_argument("--author", default=None, help="only PRs opened by this login")
    parser.add_argument("--merge-method", default="rebase",
                        choices=["rebase", "merge", "squash"], help="how to merge")
    parser.add_argument("--dry-run", action="store_true",
                        help="print the selection instead of acting on it")
    args = parser.parse_args()

    token = os.environ.get("GH_TOKEN", "")
    if not token:
        sys.exit("GH_TOKEN is not set")
    if not args.repo:
        sys.exit("Cannot determine the repository, pass --repo owner/name")

    forge = GitHubForge(args.repo, token, args.merge_method)
    try:
        prs = forge.list_open()
    except ForgeError as e:
        sys.exit(str(e))

    if args.match:
        pattern = re.compile(args.match)
        prs = [pr for pr in prs if pattern.search(pr.title)]
    if args.author:
        prs = [pr for pr in prs if pr.author == args.author]
    if not prs:
        print(f"No open pull requests in {args.repo} match.")
        return

    if not sys.stdin.isatty():
        sys.exit("The picker needs an interactive terminal.")

    def load(pr):
        try:
            forge.load_details(pr)
        except Exception as e:  # a broken row must not take the loader down
            pr.state = "error"
            pr.checks = str(e)[:40]
            pr.loaded = True

    # Details cost two requests per PR, so fill them in behind the picker
    # instead of making the user wait for all of them up front.
    pool = concurrent.futures.ThreadPoolExecutor(max_workers=8)
    for pr in prs:
        pool.submit(load, pr)
    try:
        selection = curses.wrapper(Picker(prs).run)
    finally:
        pool.shutdown(wait=False, cancel_futures=True)
    if not selection:
        print("Nothing selected.")
        return

    for pr in selection:
        flag = "" if pr.clean else "   <-- not clean"
        print(f"  #{pr.number} {pr.title}{flag}")
    if args.dry_run:
        print(f"\n--dry-run: {len(selection)} selected, nothing done.")
        return

    action = choose_action(len(selection))
    if action is None:
        print("Cancelled.")
        return
    unclean = [pr for pr in selection if not pr.clean]
    question = f"Type 'yes' to {action} {len(selection)} pull request(s)"
    if unclean:
        question += f" ({len(unclean)} of them not clean)"
    try:
        if input(question + ": ").strip() != "yes":
            print("Cancelled.")
            return
    except EOFError:
        print("Cancelled.")
        return
    run_action(forge, selection, action)


if __name__ == "__main__":
    main()
