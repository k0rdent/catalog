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


def get_latest_scan_run(repo: str) -> dict | None:
    """Find the latest successful run of helm-app-scan.yml. Returns {id, created_at} or None."""
    res = run(["gh", "api",
               f"repos/{repo}/actions/workflows/helm-app-scan.yml/runs?status=success&per_page=1",
               "--jq", '.workflow_runs[0] | {id: .id, created_at: .created_at}'])
    if res.returncode != 0 or not res.stdout.strip():
        return None
    data = json.loads(res.stdout.strip())
    if not data.get("id"):
        return None
    return data


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

    summarize_app(app, app_dir)


def summarize_app(app: str, app_dir: str):
    """Print scan report files and CVE summary for an app."""
    files = sorted(f for f in os.listdir(app_dir) if f.endswith(".json"))
    if not files:
        print(f"  {app}: (empty)")
        return

    total_images = 0
    total_cves = 0
    by_severity = {}

    for fname in files:
        with open(os.path.join(app_dir, fname)) as f:
            results = json.load(f)
        images = set()
        file_cves = 0
        for r in results:
            images.add(r.get("Image", ""))
            for v in r.get("Vulnerabilities") or []:
                file_cves += 1
                sev = v.get("Severity", "UNKNOWN")
                by_severity[sev] = by_severity.get(sev, 0) + 1
        total_images += len(images)
        total_cves += file_cves
        print(f"  {app}/{fname} ({len(images)} images, {file_cves} CVEs)")

    sev_parts = []
    for sev in ["CRITICAL", "HIGH", "MEDIUM", "LOW", "UNKNOWN"]:
        if sev in by_severity:
            sev_parts.append(f"{sev}: {by_severity[sev]}")
    summary = ", ".join(sev_parts) if sev_parts else "no CVEs"
    print(f"  {app}: total {total_images} images, {total_cves} CVEs ({summary})")


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
    scan_run = get_latest_scan_run(repo)
    if not scan_run:
        print("  No successful scan workflow run found, skipping")
        return

    print(f"  Run ID: {scan_run['id']} ({scan_run.get('created_at', 'unknown')})")
    artifacts = list_scan_artifacts(repo, str(scan_run["id"]))
    if not artifacts:
        print("  No scan artifacts found")
        return

    for artifact in artifacts:
        download_artifact(repo, artifact, output_dir)

    print(f"==> Downloaded {len(artifacts)} scan reports")


if __name__ == "__main__":
    main()
