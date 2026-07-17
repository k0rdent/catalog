#!/usr/bin/env python3
"""Download latest scan report artifacts from GitHub Actions.

Finds the most recent successful run of helm-app-scan.yml and downloads
all scan-report-* artifacts into scan-reports/{app}/.

Requires:
    GH_TOKEN environment variable (GitHub token with actions:read)
    gh CLI installed

Environment variables:
    GITHUB_REPOSITORY  - owner/repo (e.g. k0rdent/catalog)
    GH_TOKEN           - GitHub token for API access
"""

import json
import os
import shutil
import subprocess
import sys
import tempfile


def run(cmd: list[str]) -> subprocess.CompletedProcess:
    return subprocess.run(cmd, capture_output=True, text=True)


def get_latest_scan_run(repo: str) -> str | None:
    """Find the latest successful run ID of helm-app-scan.yml."""
    res = run(["gh", "api",
               f"repos/{repo}/actions/workflows/helm-app-scan.yml/runs?status=success&per_page=1",
               "--jq", ".workflow_runs[0].id"])
    if res.returncode != 0:
        return None
    run_id = res.stdout.strip()
    return run_id if run_id and run_id != "null" else None


def list_scan_artifacts(repo: str, run_id: str) -> list[dict]:
    """List all scan-report-* artifacts from a workflow run."""
    res = run(["gh", "api",
               f"repos/{repo}/actions/runs/{run_id}/artifacts?per_page=100",
               "--jq", '.artifacts[] | select(.name | startswith("scan-report-")) | {"name": .name, "id": .id}'])
    if res.returncode != 0 or not res.stdout.strip():
        return []
    artifacts = []
    for line in res.stdout.strip().split("\n"):
        if line.strip():
            artifacts.append(json.loads(line))
    return artifacts


def download_artifact(repo: str, artifact: dict, output_dir: str):
    """Download and unzip a single scan artifact."""
    name = artifact["name"]
    artifact_id = artifact["id"]
    app = name.removeprefix("scan-report-")

    app_dir = os.path.join(output_dir, app)
    os.makedirs(app_dir, exist_ok=True)

    tmp = tempfile.NamedTemporaryFile(suffix=".zip", delete=False)
    tmp.close()

    res = subprocess.run(
        ["gh", "api", f"repos/{repo}/actions/artifacts/{artifact_id}/zip"],
        capture_output=True)
    if res.returncode != 0:
        print(f"  Warning: failed to download {name}")
        os.unlink(tmp.name)
        return

    with open(tmp.name, "wb") as f:
        f.write(res.stdout)

    subprocess.run(["unzip", "-o", tmp.name, "-d", app_dir], capture_output=True)
    os.unlink(tmp.name)
    print(f"  Downloaded: {app}")


def main():
    repo = os.environ.get("GITHUB_REPOSITORY", "")
    if not repo:
        print("Error: GITHUB_REPOSITORY not set")
        sys.exit(1)

    if not shutil.which("gh"):
        print("Error: gh CLI not installed")
        sys.exit(1)

    output_dir = os.environ.get("OUTPUT_DIR", "scan-reports")

    print("==> Downloading latest scan reports...")
    run_id = get_latest_scan_run(repo)
    if not run_id:
        print("  No successful scan workflow run found, skipping")
        return

    print(f"  Run ID: {run_id}")
    artifacts = list_scan_artifacts(repo, run_id)
    if not artifacts:
        print("  No scan artifacts found")
        return

    for artifact in artifacts:
        download_artifact(repo, artifact, output_dir)

    print(f"  Downloaded {len(artifacts)} scan reports")


if __name__ == "__main__":
    main()
