#!/usr/bin/env python3
"""Scan container images of catalog apps for vulnerabilities using Trivy.

Extracts images from each app's example Helm chart and runs Trivy on each.

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

ROOT_DIR = Path(__file__).parent.parent
APPS_DIR = ROOT_DIR / "apps"
OUTPUT_DIR = Path(os.environ.get("OUTPUT_DIR", "scan-reports"))


def run(cmd, **kwargs):
    return subprocess.run(cmd, capture_output=True, text=True, **kwargs)


def extract_images(app: str) -> list[str]:
    example_chart = APPS_DIR / app / "example"
    if not example_chart.is_dir():
        return []

    # Build helm dependencies
    run(["helm", "dependency", "build", str(example_chart), "--skip-refresh"])

    # Render templates and extract image references
    result = run(["helm", "template", "chart", str(example_chart)])
    if result.returncode != 0:
        print(f"  Warning: helm template failed for {app}")
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


def scan_app(app: str):
    print(f"==> Scanning {app}...")

    images = extract_images(app)
    if not images:
        print("  No images found, skipping")
        return

    app_dir = OUTPUT_DIR / app
    app_dir.mkdir(parents=True, exist_ok=True)

    all_results = []
    for image in images:
        print(f"  Scanning: {image}")
        report = scan_image(image)
        if report is None:
            continue
        for r in report.get("Results", []):
            r["Image"] = image
            all_results.append(r)

    # Write report
    report_path = app_dir / "trivy-report.json"
    with open(report_path, "w") as f:
        json.dump(all_results, f, indent=2)

    # Print summary
    scanned_images = {r.get("Image") for r in all_results}
    by_severity = {}
    total = 0
    for r in all_results:
        for v in r.get("Vulnerabilities") or []:
            total += 1
            s = v.get("Severity", "UNKNOWN")
            by_severity[s] = by_severity.get(s, 0) + 1

    print(f"  Images scanned: {len(scanned_images)}")
    print(f"  Total CVEs: {total}")
    for s in ["CRITICAL", "HIGH", "MEDIUM", "LOW", "UNKNOWN"]:
        if s in by_severity:
            print(f"    {s}: {by_severity[s]}")
    print(f"  Report: {report_path}")


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
