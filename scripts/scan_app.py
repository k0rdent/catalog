#!/usr/bin/env python3
"""Scan container images of catalog apps for vulnerabilities using Trivy.

Scans every chart at every version listed in apps/{app}/charts/st-charts.yaml.
Uses local chart directory if available, otherwise pulls from remote registry.

Usage:
    python3 scripts/scan_app.py cert-manager          # scan a single app
    python3 scripts/scan_app.py cert-manager cilium    # scan multiple apps
    python3 scripts/scan_app.py                        # scan all apps

Environment variables:
    OUTPUT_DIR  - directory for scan reports (default: scan-reports)
"""

import argparse
import json
import os
import re
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

import yaml

ROOT_DIR = Path(__file__).parent.parent
APPS_DIR = ROOT_DIR / "apps"
OUTPUT_DIR = Path(os.environ.get("OUTPUT_DIR", "scan-reports"))


def run(cmd, **kwargs):
    return subprocess.run(cmd, capture_output=True, text=True, **kwargs)


# ---------------------------------------------------------------------------
# Chart discovery
# ---------------------------------------------------------------------------

def get_charts(app: str) -> list[dict]:
    """Read st-charts.yaml, return [{name, version, dep_name, repository}, ...]."""
    st_file = APPS_DIR / app / "charts" / "st-charts.yaml"
    if not st_file.exists():
        return []
    with open(st_file) as f:
        data = yaml.safe_load(f)
    return [
        {
            "name": item["name"],
            "version": str(item["version"]),
            "dep_name": item.get("dep_name", item["name"]),
            "repository": item.get("repository", ""),
        }
        for item in data.get("st-charts", [])
    ]


# ---------------------------------------------------------------------------
# Image extraction
# ---------------------------------------------------------------------------

def _add_helm_repos(chart_dir: Path):
    """Add helm repos required by chart dependencies."""
    chart_yaml = chart_dir / "Chart.yaml"
    if not chart_yaml.exists():
        return
    with open(chart_yaml) as f:
        chart_data = yaml.safe_load(f)
    for dep in chart_data.get("dependencies", []):
        repo = dep.get("repository", "")
        if repo and not repo.startswith("oci://"):
            repo_name = repo.rstrip("/").rsplit("/", 1)[-1]
            run(["helm", "repo", "add", repo_name, repo])


def _template_chart(chart_dir: Path) -> str | None:
    """Build dependencies and template a chart directory. Returns rendered YAML or None."""
    _add_helm_repos(chart_dir)

    res = run(["helm", "dependency", "build", str(chart_dir)])
    if res.returncode != 0:
        print("    Warning: helm dependency build failed")
        return None

    res = run(["helm", "template", "chart", str(chart_dir)])
    if res.returncode != 0:
        print("    Warning: helm template failed")
        return None

    return res.stdout


def _parse_images(rendered_yaml: str) -> list[str]:
    """Extract unique image references from rendered Helm YAML."""
    images = set()
    for match in re.findall(r'image:\s*["\']?([^"\'\s]+)', rendered_yaml):
        if "{{" not in match:
            images.add(match)
    return sorted(images)


def _pull_remote_chart(dep_name: str, version: str, repository: str) -> Path | None:
    """Pull a chart from remote registry into a temp directory. Returns chart path or None."""
    tmp_dir = tempfile.mkdtemp(prefix="scan-chart-")
    if repository.startswith("oci://"):
        ref = f"{repository.rstrip('/')}/{dep_name}"
    else:
        # HTTP repo — add it first
        repo_name = repository.rstrip("/").rsplit("/", 1)[-1]
        run(["helm", "repo", "add", repo_name, repository])
        run(["helm", "repo", "update"])
        ref = f"{repo_name}/{dep_name}"

    res = run(["helm", "pull", ref, "--version", version, "--untar", "-d", tmp_dir])
    if res.returncode != 0:
        print(f"    Warning: helm pull failed for {ref}:{version}")
        shutil.rmtree(tmp_dir)
        return None

    # Find the unpacked chart directory
    for entry in Path(tmp_dir).iterdir():
        if entry.is_dir():
            return entry

    shutil.rmtree(tmp_dir)
    return None


def extract_images(app: str, chart: dict) -> list[str]:
    """Extract images from a chart — local directory first, remote registry as fallback."""
    name = chart["name"]
    version = chart["version"]

    # Try local chart directory
    local_dir = APPS_DIR / app / "charts" / f"{name}-{version}"
    if local_dir.is_dir():
        rendered = _template_chart(local_dir)
        return _parse_images(rendered) if rendered else []

    # Fallback: pull from remote
    repository = chart.get("repository", "")
    dep_name = chart.get("dep_name", name)
    if not repository:
        print("    No local chart and no repository configured")
        return []

    print(f"    Pulling from {repository}...")
    remote_dir = _pull_remote_chart(dep_name, version, repository)
    if not remote_dir:
        return []

    rendered = _template_chart(remote_dir)
    images = _parse_images(rendered) if rendered else []

    # Cleanup temp directory
    shutil.rmtree(remote_dir.parent)
    return images


# ---------------------------------------------------------------------------
# Scanning
# ---------------------------------------------------------------------------

def scan_image(image: str) -> dict | None:
    result = run(["trivy", "image", "--format", "json", "--quiet", image])
    if result.returncode != 0:
        print(f"    Warning: failed to scan {image}")
        return None
    return json.loads(result.stdout)


def scan_chart(app: str, chart: dict, app_dir: Path):
    """Scan a single chart version and write {chartName}-{version}.json."""
    name = chart["name"]
    version = chart["version"]
    print(f"  Chart: {name}-{version}")

    images = extract_images(app, chart)
    if not images:
        print("    No images found, skipping")
        return

    all_results = []
    for image in images:
        print(f"    Scanning: {image}")
        report = scan_image(image)
        if report is None:
            continue
        for r in report.get("Results", []):
            r["Image"] = image
            all_results.append(r)

    report_path = app_dir / f"{name}-{version}.json"
    with open(report_path, "w") as f:
        json.dump(all_results, f, indent=2)

    total = sum(len(r.get("Vulnerabilities") or []) for r in all_results)
    scanned = len({r.get("Image") for r in all_results})
    print(f"    {scanned} images, {total} CVEs → {report_path}")


def scan_app(app: str):
    print(f"==> Scanning {app}...")

    charts = get_charts(app)
    if not charts:
        print("  No charts found, skipping")
        return

    app_dir = OUTPUT_DIR / app
    app_dir.mkdir(parents=True, exist_ok=True)

    for chart in charts:
        scan_chart(app, chart, app_dir)


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------

def get_all_apps() -> list[str]:
    return sorted(
        d.name for d in APPS_DIR.iterdir()
        if d.is_dir() and d.name != "k0rdent-utils"
    )


def main():
    for cmd in ["trivy", "helm"]:
        if not shutil.which(cmd):
            print(f"Error: {cmd} is not installed")
            sys.exit(1)

    parser = argparse.ArgumentParser(description="Scan catalog app images for CVEs")
    parser.add_argument("apps", nargs="*", help="Apps to scan (default: all)")
    args = parser.parse_args()

    os.chdir(ROOT_DIR)

    apps = args.apps if args.apps else get_all_apps()
    for app in apps:
        scan_app(app)

    print("==> Scan complete.")


if __name__ == "__main__":
    main()
