#!/usr/bin/env bash
# Generate all versioned catalog JSON data into tsweb/public/
# Used by both gh-pages-deploy workflow and Dockerfile
#
# Environment variables:
#   OUTPUT_DIR  - output directory (default: tsweb/public)
#   SITE_URL    - site URL for absolute links (default: empty = relative)
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$ROOT_DIR"

export OUTPUT_DIR="${OUTPUT_DIR:-tsweb/public}"
mkdir -p "$OUTPUT_DIR"

echo "==> Generating catalog data for all versions..."
python3 scripts/generate_catalog_json.py --all-versions

echo "==> Generating index.json for all versions..."
python3 -c "
import yaml, subprocess, shutil, os

with open('versions.yaml') as f:
    cfg = yaml.safe_load(f)

for v in cfg['versions']:
    subprocess.run(['python3', 'scripts/generate_index.py'], env={**os.environ, 'VERSION': v}, check=True)
    dst = os.path.join('$OUTPUT_DIR', v)
    os.makedirs(dst, exist_ok=True)
    shutil.copy2('mkdocs/index.json', os.path.join(dst, 'index.json'))
    os.makedirs(os.path.join(dst, 'schema'), exist_ok=True)
    if os.path.exists('mkdocs/schema/index.json'):
        shutil.copy2('mkdocs/schema/index.json', os.path.join(dst, 'schema/index.json'))

print(f'Generated index.json for {len(cfg[\"versions\"])} versions')
"

echo "==> Catalog data generation complete."
