#!/usr/bin/env python3
"""Generate catalog.json from apps/*/data.yaml for the React TSX frontend.
Copies local logo files to the output directory so they can be served as static assets.
"""

import json
import os
import shutil
import sys
import yaml

sys.path.append(os.path.dirname(os.path.abspath(__file__)))
import utils

CATALOG_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
APPS_DIR = os.path.join(CATALOG_ROOT, 'apps')
VERSION = os.environ.get('VERSION', 'v1.8.0')
# OUTPUT_DIR can be overridden for Docker builds where repo is read-only
OUTPUT_DIR = os.environ.get('OUTPUT_DIR', os.path.join(CATALOG_ROOT, 'tsweb', 'public'))
OUTPUT_FILE = os.path.join(OUTPUT_DIR, 'catalog.json')


def get_tested(data: dict) -> bool:
    for key in ['validated_amd64', 'validated_arm64', 'validated_aws', 'validated_azure', 'validated_local']:
        if data.get(key) == 'y':
            return True
    return False


def get_support_tier(data: dict) -> str:
    st = data.get('support_type', 'Community').lower()
    if st == 'enterprise':
        return 'enterprise'
    if st == 'partner':
        return 'partner'
    return 'community'


def copy_local_logo(app_name: str, logo_path: str) -> str:
    """Copy a local logo file to OUTPUT_DIR/logos/<app>/<filename> and return the public URL path."""
    # Strip leading ./
    rel_path = logo_path.lstrip('./')
    src = os.path.join(APPS_DIR, app_name, rel_path)
    if not os.path.exists(src):
        print(f"  Warning: logo not found: {src}")
        return logo_path

    filename = os.path.basename(rel_path)
    dst_dir = os.path.join(OUTPUT_DIR, 'logos', app_name)
    os.makedirs(dst_dir, exist_ok=True)
    dst = os.path.join(dst_dir, filename)
    shutil.copy2(src, dst)
    return f"logos/{app_name}/{filename}"


def process_app(app_name: str) -> dict | None:
    app_path = os.path.join(APPS_DIR, app_name)
    data_file = os.path.join(app_path, 'data.yaml')

    if not os.path.isdir(app_path) or not os.path.exists(data_file):
        return None

    with open(data_file, 'r', encoding='utf-8') as f:
        data = yaml.safe_load(f.read())

    if data is None:
        return None

    utils.try_add_charts_data(app_name, data)

    charts = data.get('charts', [])
    versions = charts[0]['versions'] if charts else []
    chart_name = charts[0]['name'] if charts else app_name

    # Handle logo: copy local files, keep remote URLs as-is
    logo = data.get('logo', '')
    if logo.startswith('./') or (logo and not logo.startswith('http')):
        logo = copy_local_logo(app_name, logo)

    entry = {
        'name': app_name,
        'title': data.get('title', app_name),
        'desc': data.get('summary', ''),
        'description': data.get('description', ''),
        'support': get_support_tier(data),
        'tested': get_tested(data),
        'tags': data.get('tags', []),
        'version': versions[0] if versions else '',
        'versions': versions[:5],
        'chartName': chart_name,
        'type': data.get('type', 'app'),
        'logo': logo,
        'doc_link': data.get('doc_link', ''),
        'created': data.get('created', ''),
        'docs': f"https://catalog.k0rdent.io/{VERSION}/apps/{app_name}/",
    }

    return entry


def main():
    os.makedirs(os.path.dirname(OUTPUT_FILE), exist_ok=True)

    catalog = []
    for app_name in sorted(os.listdir(APPS_DIR)):
        entry = process_app(app_name)
        if entry:
            catalog.append(entry)

    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        json.dump(catalog, f, indent=2, ensure_ascii=False)

    print(f"Generated {OUTPUT_FILE} with {len(catalog)} entries")


if __name__ == '__main__':
    main()
