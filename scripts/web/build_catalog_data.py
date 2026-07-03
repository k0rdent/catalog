#!/usr/bin/env python3
"""Generate all versioned catalog JSON data into tsweb/public/.

Used by both gh-pages-deploy workflow and Dockerfile.

Environment variables:
    OUTPUT_DIR  - output directory (default: tsweb/public)
    SITE_URL    - site URL for absolute links (default: empty = relative)
"""

import os
import shutil
import subprocess
import sys
import yaml

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
VERSIONS_FILE = os.path.join(ROOT_DIR, 'versions.yaml')


def main():
    os.chdir(ROOT_DIR)

    output_dir = os.environ.setdefault('OUTPUT_DIR', 'tsweb/public')
    os.makedirs(output_dir, exist_ok=True)

    print("==> Generating catalog data for all versions...")
    subprocess.run([sys.executable, 'scripts/web/generate_catalog_json.py', '--all-versions'], check=True)

    print("==> Generating index.json for all versions...")
    with open(VERSIONS_FILE) as f:
        cfg = yaml.safe_load(f)

    for v in cfg['versions']:
        env = {**os.environ, 'VERSION': v}
        subprocess.run([sys.executable, 'scripts/web/generate_index.py'], env=env, check=True)

        dst = os.path.join(output_dir, v)
        os.makedirs(dst, exist_ok=True)
        shutil.copy2('tsweb/md/index.json', os.path.join(dst, 'index.json'))

        schema_src = 'tsweb/md/schema/index.json'
        if os.path.exists(schema_src):
            os.makedirs(os.path.join(dst, 'schema'), exist_ok=True)
            shutil.copy2(schema_src, os.path.join(dst, 'schema/index.json'))

    print(f"  Generated index.json for {len(cfg['versions'])} versions")
    print("==> Catalog data generation complete.")


if __name__ == '__main__':
    main()
