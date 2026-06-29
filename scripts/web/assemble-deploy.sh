#!/usr/bin/env bash
# Assemble the final deploy directory from SPA build + catalog data
# Used by both gh-pages-deploy workflow and Dockerfile
#
# Expects:
#   tsweb/dist/   - SPA build output (from build-spa.sh)
#   tsweb/public/ - catalog data (from build-catalog-data.sh)
#   versions.yaml - version configuration
#
# Produces:
#   tsweb/deploy/ - complete deployment directory
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"
cd "$ROOT_DIR"

echo "==> Assembling deploy folder..."

rm -rf tsweb/deploy
mkdir -p tsweb/deploy/latest

# SPA bundle goes into /latest/ (the default entry point)
cp -r tsweb/dist/* tsweb/deploy/latest/
cp tsweb/dist/index.html tsweb/deploy/404.html
cp tsweb/dist/index.html tsweb/deploy/latest/404.html
echo '<html><head><meta http-equiv="refresh" content="0;url=latest/"></head></html>' > tsweb/deploy/index.html

# SPA route stubs — place index.html at known SPA routes
for route in contribute solutions infra configurator; do
  mkdir -p "tsweb/deploy/latest/$route"
  cp tsweb/dist/index.html "tsweb/deploy/latest/$route/index.html"
done

# Copy versions.json to root for the SPA version selector
cp tsweb/public/versions.json tsweb/deploy/latest/versions.json

# Copy versioned data and create SPA stubs per version
python3 -c "
import yaml, shutil, os

with open('versions.yaml') as f:
    cfg = yaml.safe_load(f)

for v in cfg['versions']:
    src = os.path.join('tsweb/public', v)
    dst = os.path.join('tsweb/deploy', v)
    if os.path.exists(src):
        shutil.copytree(src, dst, dirs_exist_ok=True)
        # Each version also needs the SPA for direct URL access
        shutil.copy2('tsweb/dist/index.html', os.path.join(dst, 'index.html'))
        shutil.copy2('tsweb/dist/index.html', os.path.join(dst, '404.html'))
        # Copy SPA assets
        assets_src = os.path.join('tsweb/dist/assets')
        assets_dst = os.path.join(dst, 'assets')
        if os.path.exists(assets_src) and not os.path.exists(assets_dst):
            shutil.copytree(assets_src, assets_dst)
        # SPA route stubs for versioned paths
        for route in ['contribute', 'solutions', 'infra', 'configurator']:
            route_dir = os.path.join(dst, route)
            os.makedirs(route_dir, exist_ok=True)
            shutil.copy2('tsweb/dist/index.html', os.path.join(route_dir, 'index.html'))
        # Copy versions.json to each version folder
        shutil.copy2('tsweb/public/versions.json', os.path.join(dst, 'versions.json'))

# /latest/ gets the latest version's data
latest = cfg['latest']
latest_src = os.path.join('tsweb/public', latest)
if os.path.exists(latest_src):
    shutil.copytree(latest_src, 'tsweb/deploy/latest', dirs_exist_ok=True)
# Shared logos at root level (from latest)
logos_src = os.path.join(latest_src, 'logos')
if os.path.exists(logos_src):
    shutil.copytree(logos_src, 'tsweb/deploy/latest/logos', dirs_exist_ok=True)

print(f'Assembled {len(cfg[\"versions\"])} versions, latest={latest}')
"

echo "==> Deploy folder assembled."
