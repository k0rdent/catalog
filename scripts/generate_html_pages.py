#!/usr/bin/env python3
"""Generate static HTML detail pages for each app in the catalog."""

import os
import re
import shutil
import sys
import yaml
import jinja2

sys.path.append(os.path.dirname(os.path.abspath(__file__)))
import utils

CATALOG_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
APPS_DIR = os.path.join(CATALOG_ROOT, 'apps')
TEMPLATES_DIR = os.environ.get('TEMPLATES_DIR', os.path.join(CATALOG_ROOT, 'tsweb', 'templates'))
DIST_DIR = os.environ.get('DIST_DIR', os.path.join(CATALOG_ROOT, 'tsweb', 'dist'))
VERSION = os.environ.get('VERSION', 'v1.8.0')
BASE_PATH = os.environ.get('BASE_PATH', '/')


def md_code_to_html(text: str) -> str:
    """Convert ~~~lang ... ~~~ code blocks to <pre><code>."""
    def replace_block(m):
        lang = m.group(1) or ''
        code = m.group(2).strip()
        code = code.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')
        return f'<pre><code class="language-{lang}">{code}</code></pre>'
    return re.sub(r'~~~(\w*)\n(.*?)~~~', replace_block, text, flags=re.DOTALL)


def md_to_html(text: str) -> str:
    """Minimal markdown to HTML conversion for descriptions."""
    if not text:
        return ''
    # Code blocks first
    html = md_code_to_html(text)
    # Bold
    html = re.sub(r'\*\*(.+?)\*\*', r'<strong>\1</strong>', html)
    # Links
    html = re.sub(r'\[([^\]]+)\]\(([^)]+)\)', r'<a href="\2" target="_blank">\1</a>', html)
    # Paragraphs — split on double newlines
    parts = re.split(r'\n\n+', html)
    result = []
    for part in parts:
        part = part.strip()
        if not part:
            continue
        if part.startswith('<pre>') or part.startswith('<h') or part.startswith('<table'):
            result.append(part)
        else:
            result.append(f'<p>{part}</p>')
    return '\n'.join(result)


def get_jinja_env():
    env = jinja2.Environment(
        loader=jinja2.FileSystemLoader(TEMPLATES_DIR),
        autoescape=False,
    )
    return env


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
    data['app'] = app_name
    data['app_path'] = app_path

    # Handle local logos: copy to dist and rewrite path
    logo = data.get('logo', '')
    if logo.startswith('./') or (logo and not logo.startswith('http')):
        rel_path = logo.lstrip('./')
        src = os.path.join(app_path, rel_path)
        if os.path.exists(src):
            is_infra = data.get('type', 'app') == 'infra'
            subdir = 'infra' if is_infra else 'apps'
            logo_dst_dir = os.path.join(DIST_DIR, subdir, app_name, 'assets')
            os.makedirs(logo_dst_dir, exist_ok=True)
            filename = os.path.basename(rel_path)
            shutil.copy2(src, os.path.join(logo_dst_dir, filename))
            data['logo'] = f'assets/{filename}'
        else:
            print(f"  Warning: logo not found: {src}")

    # Convert markdown fields to HTML
    data['description_html'] = md_to_html(data.get('description', ''))
    data['show_install_tab'] = data.get('show_install_tab', True)
    data['support_type'] = data.get('support_type', 'Community')

    # Convert code blocks
    for field in ['install_code', 'verify_code', 'deploy_code', 'prerequisites']:
        val = data.get(field)
        if val and isinstance(val, str):
            data[f'{field}_html'] = md_code_to_html(val)
        else:
            data[f'{field}_html'] = ''

    # Process examples
    if 'examples' in data:
        for key, example in data['examples'].items():
            for efield in ['install_code', 'verify_code', 'deploy_code', 'content']:
                if efield in example:
                    example[f'{efield}_html'] = md_to_html(example[efield])
                else:
                    example[f'{efield}_html'] = ''

    data['version'] = VERSION
    data['base_path'] = BASE_PATH
    return data


def generate_app_pages(env: jinja2.Environment):
    template = env.get_template('app_detail.html')
    count = 0

    for app_name in sorted(os.listdir(APPS_DIR)):
        data = process_app(app_name)
        if data is None:
            continue

        is_infra = data.get('type', 'app') == 'infra'
        subdir = 'infra' if is_infra else 'apps'
        out_dir = os.path.join(DIST_DIR, subdir, app_name)
        os.makedirs(out_dir, exist_ok=True)

        html = template.render(**data)
        out_file = os.path.join(out_dir, 'index.html')
        with open(out_file, 'w', encoding='utf-8') as f:
            f.write(html)
        count += 1

    print(f"Generated {count} app detail pages in {DIST_DIR}")


def generate_404_page():
    """Copy index.html as 404.html for GitHub Pages SPA routing."""
    index_html = os.path.join(DIST_DIR, 'index.html')
    four04_html = os.path.join(DIST_DIR, '404.html')
    if os.path.exists(index_html):
        import shutil
        shutil.copy2(index_html, four04_html)
        print(f"Generated 404.html")


def main():
    os.makedirs(DIST_DIR, exist_ok=True)
    env = get_jinja_env()
    generate_app_pages(env)
    generate_404_page()


if __name__ == '__main__':
    main()
