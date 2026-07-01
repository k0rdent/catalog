#!/usr/bin/env python3
"""Scan container images of catalog apps for vulnerabilities using Trivy.

Scans every chart at every version listed in apps/{app}/charts/charts.yaml.

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
from pathlib import Path

import yaml

ROOT_DIR = Path(__file__).parent.parent
APPS_DIR = ROOT_DIR / "apps"
OUTPUT_DIR = Path(os.environ.get("OUTPUT_DIR", "scan-reports"))


def run(cmd, **kwargs):
    return subprocess.run(cmd, capture_output=True, text=True, **kwargs)


def get_charts(app: str) -> list[dict]:
    """Read charts.yaml, return [{name, version}, ...]."""
    charts_file = APPS_DIR / app / "charts" / "charts.yaml"
    if not charts_file.exists():
        return []
    with open(charts_file) as f:
        data = yaml.safe_load(f)
    result = []
    for name, versions in (data.get("charts") or {}).items():
        for v in versions:
            result.append({"name": name, "version": v["version"]})
    return result


def extract_images(chart_dir: Path) -> list[str]:
    """Template a chart directory and extract image references."""
    if not chart_dir.is_dir():
        return []

    # Add helm repos required by chart dependencies
    chart_yaml = chart_dir / "Chart.yaml"
    if chart_yaml.exists():
        with open(chart_yaml) as f:
            chart_data = yaml.safe_load(f)
        for dep in chart_data.get("dependencies", []):
            repo = dep.get("repository", "")
            if repo and not repo.startswith("oci://"):
                repo_name = repo.rstrip("/").rsplit("/", 1)[-1]
                run(["helm", "repo", "add", repo_name, repo])

    res = run(["helm", "dependency", "build", str(chart_dir)])
    if res.returncode != 0:
        print(f"  Warning: helm dependency build failed for {chart_dir}")
        return []

    result = run(["helm", "template", "chart", str(chart_dir)])
    if result.returncode != 0:
        print(f"  Warning: helm template failed for {chart_dir}")
        return []

    images = set()
    for match in re.findall(r'image:\s*["\']?([^"\'\s]+)', result.stdout):
        if "{{" not in match:
            images.add(match)

    return sorted(images)


def scan_image(image: str) -> dict | None:
    result = run(["trivy", "image", "--format", "json", "--quiet", image])
    if result.returncode != 0:
        print(f"  Warning: failed to scan {image}")
        return None
    return json.loads(result.stdout)


def scan_chart(app: str, chart_name: str, version: str, app_dir: Path):
    """Scan a single chart version and write {chartName}-{version}.json."""
    chart_dir = APPS_DIR / app / "charts" / f"{chart_name}-{version}"
    print(f"  Chart: {chart_name}-{version}")

    images = extract_images(chart_dir)
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

    report_path = app_dir / f"{chart_name}-{version}.json"
    with open(report_path, "w") as f:
        json.dump(all_results, f, indent=2)

    # Summary
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
        scan_chart(app, chart["name"], chart["version"], app_dir)


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
