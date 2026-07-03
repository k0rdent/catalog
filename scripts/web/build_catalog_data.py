#!/usr/bin/env python3
"""Generate all versioned catalog JSON data into tsweb/public/.

Used by both gh-pages-deploy workflow and Dockerfile.

Environment variables:
    OUTPUT_DIR  - output directory (default: tsweb/public)
    SITE_URL    - site URL for absolute links (default: empty = relative)
"""

import os
import subprocess
import sys

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


def main():
    os.chdir(ROOT_DIR)

    os.environ.setdefault('OUTPUT_DIR', 'tsweb/public')
    os.makedirs(os.environ['OUTPUT_DIR'], exist_ok=True)

    print("==> Generating catalog data for all versions...")
    subprocess.run([sys.executable, 'scripts/web/generate_catalog_json.py', '--all-versions'], check=True)

    print("==> Generating index.json for all versions...")
    subprocess.run([sys.executable, 'scripts/web/generate_index.py', '--all-versions'], check=True)

    print("==> Catalog data generation complete.")


if __name__ == '__main__':
    main()
