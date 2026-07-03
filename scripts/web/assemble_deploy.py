#!/usr/bin/env python3
"""Assemble the final deploy directory from SPA build + catalog data.

Used by both gh-pages-deploy workflow and Dockerfile.

Expects:
    tsweb/dist/   - SPA build output (from build-spa.sh)
    tsweb/public/ - catalog data (from build_catalog_data.py)
    versions.yaml - version configuration

Produces:
    tsweb/deploy/ - complete deployment directory
"""

import json
import os
import shutil
import subprocess
import yaml

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
VERSIONS_FILE = os.path.join(ROOT_DIR, 'versions.yaml')
DIST_DIR = os.path.join(ROOT_DIR, 'tsweb', 'dist')
PUBLIC_DIR = os.path.join(ROOT_DIR, 'tsweb', 'public')
DEPLOY_DIR = os.path.join(ROOT_DIR, 'tsweb', 'deploy')
SPA_ROUTES = ['contribute', 'solutions', 'infra', 'configurator']
REDIRECT_HTML = '<html><head><meta http-equiv="refresh" content="0;url=latest/"></head></html>'


def create_spa_stubs(target_dir: str):
    """Place index.html at known SPA routes so direct URL access works."""
    index_html = os.path.join(DIST_DIR, 'index.html')
    for route in SPA_ROUTES:
        route_dir = os.path.join(target_dir, route)
        os.makedirs(route_dir, exist_ok=True)
        shutil.copy2(index_html, os.path.join(route_dir, 'index.html'))


def assemble_latest():
    """Copy SPA bundle into /latest/ with 404 fallbacks and route stubs."""
    latest_dir = os.path.join(DEPLOY_DIR, 'latest')
    os.makedirs(latest_dir, exist_ok=True)

    # SPA bundle
    for item in os.listdir(DIST_DIR):
        src = os.path.join(DIST_DIR, item)
        dst = os.path.join(latest_dir, item)
        if os.path.isdir(src):
            shutil.copytree(src, dst, dirs_exist_ok=True)
        else:
            shutil.copy2(src, dst)

    # 404 fallbacks
    index_html = os.path.join(DIST_DIR, 'index.html')
    shutil.copy2(index_html, os.path.join(DEPLOY_DIR, '404.html'))
    shutil.copy2(index_html, os.path.join(latest_dir, '404.html'))

    # Root redirect
    with open(os.path.join(DEPLOY_DIR, 'index.html'), 'w') as f:
        f.write(REDIRECT_HTML)

    create_spa_stubs(latest_dir)

    # versions.json
    versions_json = os.path.join(PUBLIC_DIR, 'versions.json')
    if os.path.exists(versions_json):
        shutil.copy2(versions_json, os.path.join(latest_dir, 'versions.json'))


def assemble_versions(cfg: dict):
    """Copy versioned data and create SPA stubs per version."""
    index_html = os.path.join(DIST_DIR, 'index.html')
    versions_json = os.path.join(PUBLIC_DIR, 'versions.json')

    for v in cfg['versions']:
        src = os.path.join(PUBLIC_DIR, v)
        dst = os.path.join(DEPLOY_DIR, v)
        if not os.path.exists(src):
            continue

        shutil.copytree(src, dst, dirs_exist_ok=True)

        # SPA for direct URL access
        shutil.copy2(index_html, os.path.join(dst, 'index.html'))
        shutil.copy2(index_html, os.path.join(dst, '404.html'))

        # SPA assets
        assets_src = os.path.join(DIST_DIR, 'assets')
        assets_dst = os.path.join(dst, 'assets')
        if os.path.exists(assets_src) and not os.path.exists(assets_dst):
            shutil.copytree(assets_src, assets_dst)

        create_spa_stubs(dst)

        if os.path.exists(versions_json):
            shutil.copy2(versions_json, os.path.join(dst, 'versions.json'))


def assemble_latest_data(cfg: dict):
    """/latest/ gets the latest version's data and logos."""
    latest = cfg['latest']
    latest_src = os.path.join(PUBLIC_DIR, latest)
    latest_deploy = os.path.join(DEPLOY_DIR, 'latest')

    if os.path.exists(latest_src):
        shutil.copytree(latest_src, latest_deploy, dirs_exist_ok=True)

    logos_src = os.path.join(latest_src, 'logos')
    if os.path.exists(logos_src):
        shutil.copytree(logos_src, os.path.join(latest_deploy, 'logos'), dirs_exist_ok=True)


def add_git_sha():
    """Write current git commit SHA to deploy directory."""
    sha = subprocess.run(['git', 'rev-parse', 'HEAD'], capture_output=True, text=True, check=True).stdout.strip()
    with open(os.path.join(DEPLOY_DIR, 'sha.json'), 'w') as f:
        json.dump({'sha': sha[:8]}, f)


def main():
    os.chdir(ROOT_DIR)

    print("==> Assembling deploy folder...")

    if os.path.exists(DEPLOY_DIR):
        shutil.rmtree(DEPLOY_DIR)

    with open(VERSIONS_FILE) as f:
        cfg = yaml.safe_load(f)

    assemble_latest()
    assemble_versions(cfg)
    assemble_latest_data(cfg)
    add_git_sha()

    print(f"  Assembled {len(cfg['versions'])} versions, latest={cfg['latest']}")
    print("==> Deploy folder assembled.")


if __name__ == '__main__':
    main()
