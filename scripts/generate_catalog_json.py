#!/usr/bin/env python3
"""Generate catalog.json from apps/*/data.yaml for the React TSX frontend.
Copies local logo files to the output directory so they can be served as static assets.
"""

import colorsys
import json
import os
import re
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


def hex_to_rgb(h: str) -> tuple:
    h = h.lstrip('#')
    if len(h) == 3:
        h = h[0]*2 + h[1]*2 + h[2]*2
    return tuple(int(h[i:i+2], 16) for i in (0, 2, 4))


def is_boring_color(r, g, b) -> bool:
    """Filter out near-white, near-black, and very desaturated colors."""
    if r > 220 and g > 220 and b > 220:
        return True
    if r < 30 and g < 30 and b < 30:
        return True
    _, s, v = colorsys.rgb_to_hsv(r/255, g/255, b/255)
    if s < 0.1 and v > 0.5:
        return True  # grayish
    return False


def extract_color_from_svg(filepath: str) -> str | None:
    """Extract the dominant non-boring color from an SVG file."""
    try:
        with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
            content = f.read()
    except Exception:
        return None

    # Find all hex colors in fill, stroke, stop-color, and style attributes
    hex_colors = re.findall(r'(?:fill|stroke|stop-color|color)\s*[:=]\s*["\']?\s*(#[0-9a-fA-F]{3,6})\b', content)
    # Also find hex colors in style blocks
    hex_colors += re.findall(r'#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})\b', content)
    hex_colors = ['#' + c.lstrip('#') for c in hex_colors]

    # Count occurrences, filter boring colors
    counts = {}
    for c in hex_colors:
        try:
            r, g, b = hex_to_rgb(c)
        except (ValueError, IndexError):
            continue
        if is_boring_color(r, g, b):
            continue
        normalized = f"#{r:02x}{g:02x}{b:02x}"
        counts[normalized] = counts.get(normalized, 0) + 1

    if not counts:
        return None

    # Return the most frequent non-boring color
    return max(counts, key=counts.get)


def extract_color_from_png(filepath: str) -> str | None:
    """Extract dominant color from a PNG by sampling pixels using Pillow."""
    try:
        from PIL import Image
    except ImportError:
        return None
    try:
        img = Image.open(filepath).convert('RGBA')
        img = img.resize((32, 32), Image.LANCZOS)
        counts = {}
        for pixel in img.getdata():
            r, g, b, a = pixel
            if a < 128:
                continue  # skip transparent
            if is_boring_color(r, g, b):
                continue
            # Quantize to reduce unique colors
            qr, qg, qb = (r // 16) * 16, (g // 16) * 16, (b // 16) * 16
            key = f"#{qr:02x}{qg:02x}{qb:02x}"
            counts[key] = counts.get(key, 0) + 1
        if not counts:
            return None
        return max(counts, key=counts.get)
    except Exception:
        return None


def extract_brand_color(app_name: str, logo_path: str) -> str | None:
    """Extract brand color from a local logo file."""
    rel_path = logo_path.lstrip('./')
    filepath = os.path.join(APPS_DIR, app_name, rel_path)
    if not os.path.exists(filepath):
        return None
    if filepath.lower().endswith('.svg'):
        return extract_color_from_svg(filepath)
    if filepath.lower().endswith('.png'):
        return extract_color_from_png(filepath)
    return None


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

    if data.get('type') == 'infra':
        return None

    utils.try_add_charts_data(app_name, data)

    charts = data.get('charts', [])
    versions = charts[0]['versions'] if charts else []
    chart_name = charts[0]['name'] if charts else app_name

    # Handle logo: copy local files, keep remote URLs as-is
    logo_raw = data.get('logo', '')
    logo = logo_raw
    brand_color = None
    if logo_raw.startswith('./') or (logo_raw and not logo_raw.startswith('http')):
        brand_color = extract_brand_color(app_name, logo_raw)
        logo = copy_local_logo(app_name, logo_raw)

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
        'brandColor': brand_color,
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
