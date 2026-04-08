#!/usr/bin/env python3
"""Fetch GitHub stars and GHCR pull counts, store in per-app YAML files.

Usage:
    python3 scripts/update_api_data.py stars                          # update stars for all apps
    python3 scripts/update_api_data.py stars cert-manager nginx       # specific apps
    python3 scripts/update_api_data.py stars --max-age PT6H           # skip data < 6 hours old
    python3 scripts/update_api_data.py stars --max-age P0D            # force update
    python3 scripts/update_api_data.py pulls                          # not implemented yet
"""

import argparse
import json
import os
import re
import sys
import urllib.request
from datetime import datetime, timedelta, timezone

import yaml

CATALOG_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
APPS_DIR = os.path.join(CATALOG_ROOT, 'apps')


def load_dotenv():
    env_file = os.path.join(CATALOG_ROOT, '.env')
    if os.path.exists(env_file):
        with open(env_file) as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#') and '=' in line:
                    k, v = line.split('=', 1)
                    if v and k.strip() not in os.environ:
                        os.environ[k.strip()] = v.strip()


def parse_iso8601_duration(duration: str) -> timedelta:
    """Parse ISO 8601 duration (P1D, PT6H, P7D, PT30M) to timedelta."""
    m = re.match(
        r'^P(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?)?$',
        duration
    )
    if not m:
        raise ValueError(f"Invalid ISO 8601 duration: {duration}")
    return timedelta(
        days=int(m.group(1) or 0),
        hours=int(m.group(2) or 0),
        minutes=int(m.group(3) or 0),
        seconds=int(m.group(4) or 0),
    )


def should_skip(yaml_file: str, max_age: timedelta) -> bool:
    """Check if existing YAML data is fresh enough to skip."""
    if not os.path.exists(yaml_file):
        return False
    with open(yaml_file) as f:
        data = yaml.safe_load(f)
    if not data or 'updated' not in data:
        return False
    updated = datetime.fromisoformat(data['updated'].replace('Z', '+00:00'))
    return (datetime.now(timezone.utc) - updated) < max_age


def get_chart_name(app_name: str) -> str:
    """Get the first chart name from charts.yaml."""
    charts_file = os.path.join(APPS_DIR, app_name, 'charts', 'charts.yaml')
    if not os.path.exists(charts_file):
        return ""
    with open(charts_file) as f:
        data = yaml.safe_load(f)
    charts = data.get('charts', {})
    return next(iter(charts)) if charts else ""


def get_all_app_names() -> list:
    return sorted([
        d for d in os.listdir(APPS_DIR)
        if os.path.isdir(os.path.join(APPS_DIR, d))
        and os.path.exists(os.path.join(APPS_DIR, d, 'data.yaml'))
    ])


def fetch_github_stars(github_repo: str) -> int:
    """Fetch star count from GitHub API."""
    if not github_repo:
        return 0
    url = f"https://api.github.com/repos/{github_repo}"
    req = urllib.request.Request(url, headers={
        "Accept": "application/vnd.github.v3+json",
        "User-Agent": "k0rdent-catalog",
    })
    token = os.environ.get("GITHUB_TOKEN", "")
    if token:
        req.add_header("Authorization", f"token {token}")
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read())
            return data.get("stargazers_count", 0)
    except Exception as e:
        print(f"  Warning: GitHub stars failed for {github_repo}: {e}")
        return 0


# --- Subcommand: stars ---

def cmd_stars(args):
    load_dotenv()
    max_age = parse_iso8601_duration(args.max_age)
    app_names = args.apps if args.apps else get_all_app_names()

    token = os.environ.get("GITHUB_TOKEN", "")
    if not token:
        print("Warning: GITHUB_TOKEN not set. Requests may be rate-limited (60/hour).")

    print(f"Updating stars for {len(app_names)} apps (max-age: {args.max_age})")
    updated = 0
    for app_name in app_names:
        data_file = os.path.join(APPS_DIR, app_name, 'data.yaml')
        stars_file = os.path.join(APPS_DIR, app_name, 'stars.yaml')

        if not os.path.exists(data_file):
            print(f"  {app_name}: skipped (no data.yaml)")
            continue

        if should_skip(stars_file, max_age):
            print(f"  {app_name}: skipped (fresh)")
            continue

        with open(data_file) as f:
            data = yaml.safe_load(f)

        github_repo = data.get('github_repo', '')
        if not github_repo:
            print(f"  {app_name}: skipped (no github_repo)")
            continue

        stars = fetch_github_stars(github_repo)

        with open(stars_file, 'w') as f:
            yaml.dump({
                'gh_stars': stars,
                'updated': datetime.now(timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ'),
            }, f, default_flow_style=False, sort_keys=False)

        print(f"  {app_name}: {stars} stars")
        updated += 1

    print(f"Done: {updated} updated, {len(app_names) - updated} skipped")


# --- Subcommand: pulls ---

def parse_human_count(s: str) -> int:
    """Convert '336k' -> 336000, '4.28k' -> 4280, '1.2m' -> 1200000."""
    s = s.strip().lower()
    if s.endswith('m'):
        return int(float(s[:-1]) * 1_000_000)
    if s.endswith('k'):
        return int(float(s[:-1]) * 1_000)
    return int(s.replace(',', ''))


def scrape_ghcr_pulls() -> dict:
    """Scrape all pages of GitHub packages to get chart_name -> pull_count."""
    pulls = {}
    page = 1
    while True:
        url = f"https://github.com/orgs/k0rdent/packages?repo_name=catalog&page={page}"
        req = urllib.request.Request(url, headers={"User-Agent": "k0rdent-catalog"})
        try:
            with urllib.request.urlopen(req, timeout=15) as resp:
                html = resp.read().decode('utf-8')
        except Exception as e:
            print(f"  Warning: Failed to fetch page {page}: {e}")
            break

        names = re.findall(r'title="catalog/charts/([^"]+)"', html)
        counts = re.findall(
            r'octicon-download.*?</svg>\s*([\d,.]+[kKmM]?)\s*</span>',
            html, re.DOTALL
        )

        if not names:
            break

        for name, count in zip(names, counts):
            pulls[name] = parse_human_count(count)

        # Check if there's a next page
        if f'page={page + 1}' not in html:
            break
        page += 1
        print(f"  Scraped page {page - 1}: {len(names)} packages")

    print(f"  Total: {len(pulls)} packages scraped")
    return pulls


def cmd_pulls(args):
    max_age = parse_iso8601_duration(args.max_age)
    app_names = args.apps if args.apps else get_all_app_names()

    print(f"Fetching GHCR pull counts...")
    all_pulls = scrape_ghcr_pulls()

    print(f"Updating pulls for {len(app_names)} apps (max-age: {args.max_age})")
    updated = 0
    for app_name in app_names:
        pulls_file = os.path.join(APPS_DIR, app_name, 'pulls.yaml')

        if should_skip(pulls_file, max_age):
            continue

        # Get first chart name for this app
        chart_name = get_chart_name(app_name)
        if not chart_name:
            continue

        count = all_pulls.get(chart_name, 0)

        with open(pulls_file, 'w') as f:
            yaml.dump({
                'gh_pulls': count,
                'updated': datetime.now(timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ'),
            }, f, default_flow_style=False, sort_keys=False)

        if count > 0:
            print(f"  {app_name}: {count:,} pulls ({chart_name})")
        updated += 1

    print(f"Done: {updated} updated, {len(app_names) - updated} skipped")


# --- Main ---

def main():
    parser = argparse.ArgumentParser(
        description='Update API data (GitHub stars, GHCR pulls) for catalog apps.',
    )
    subparsers = parser.add_subparsers(dest='command', required=True)

    # stars subcommand
    stars_parser = subparsers.add_parser('stars', help='Fetch GitHub star counts')
    stars_parser.add_argument('apps', nargs='*', help='App names to update (default: all)')
    stars_parser.add_argument('--max-age', default='P1D',
                              help='Skip data newer than this ISO 8601 duration (default: P1D). Use P0D to force.')
    stars_parser.set_defaults(func=cmd_stars)

    # pulls subcommand
    pulls_parser = subparsers.add_parser('pulls', help='Fetch GHCR pull counts from GitHub packages page')
    pulls_parser.add_argument('apps', nargs='*', help='App names to update (default: all)')
    pulls_parser.add_argument('--max-age', default='P1D',
                              help='Skip data newer than this ISO 8601 duration (default: P1D). Use P0D to force.')
    pulls_parser.set_defaults(func=cmd_pulls)

    args = parser.parse_args()
    args.func(args)


if __name__ == '__main__':
    main()
