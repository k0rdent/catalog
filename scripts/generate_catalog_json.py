#!/usr/bin/env python3
"""Generate catalog.json from apps/*/data.yaml for the React TSX frontend.
Copies local logo files to the output directory so they can be served as static assets.
"""

import colorsys
import jinja2
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
VERSIONS_FILE = os.path.join(CATALOG_ROOT, 'versions.yaml')
VERSION = os.environ.get('VERSION', 'v1.8.0')

def get_base_metadata(version: str) -> dict:
    """Build the Jinja2 template context for rendering data.yaml files."""
    base = {"version": version}
    base.update(utils.version2template_names(version))
    return base

BASE_METADATA = get_base_metadata(VERSION)
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


## --- Markdown to HTML conversion ---

def md_code_to_html(text: str) -> str:
    def replace_block(m):
        lang = m.group(1) or ''
        code = m.group(2).strip()
        code = code.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')
        return f'<pre><code class="language-{lang}">{code}</code></pre>'
    return re.sub(r'~~~(\w*)\n(.*?)~~~', replace_block, text, flags=re.DOTALL)


def md_to_html(text: str) -> str:
    if not text:
        return ''
    # Code blocks first (must be before other processing)
    html = md_code_to_html(text)

    # Images: ![alt](src){ width="600" } or ![alt](src)
    # Strip MkDocs-style attributes like { align="right", width="600" }
    # Skip images with empty src
    def img_replace(m):
        src = m.group(2).strip()
        if not src:
            return ''
        alt = m.group(1)
        width = m.group(3)
        if width:
            return f'<img src="{src}" alt="{alt}" style="max-width:{width}px" />'
        return f'<img src="{src}" alt="{alt}" style="max-width:100%" />'
    html = re.sub(r'!\[([^\]]*)\]\(([^)]*)\)(?:\{[^}]*width="(\d+)"[^}]*\})?(?:\{[^}]*\})?', img_replace, html)

    # Links: [text](url){ target="_blank" } or [text](url)
    html = re.sub(r'\[([^\]]+)\]\(([^)]+)\)(?:\{[^}]*\})?', r'<a href="\2" target="_blank">\1</a>', html)

    # Bold
    html = re.sub(r'\*\*(.+?)\*\*', r'<strong>\1</strong>', html)

    # Inline code
    html = re.sub(r'`([^`]+)`', r'<code>\1</code>', html)

    # Protect <pre> blocks from heading conversion
    pre_blocks = {}
    def stash_pre(m):
        key = f'__PRE_{len(pre_blocks)}__'
        pre_blocks[key] = m.group(0)
        return key
    html = re.sub(r'<pre>.*?</pre>', stash_pre, html, flags=re.DOTALL)

    # Headings: # h1, ## h2, ... #### h4
    html = re.sub(r'^#{4}\s+(.+)$', r'<h4>\1</h4>', html, flags=re.MULTILINE)
    html = re.sub(r'^#{3}\s+(.+)$', r'<h3>\1</h3>', html, flags=re.MULTILINE)
    html = re.sub(r'^#{2}\s+(.+)$', r'<h2>\1</h2>', html, flags=re.MULTILINE)
    html = re.sub(r'^#{1}\s+(.+)$', r'<h1>\1</h1>', html, flags=re.MULTILINE)

    # Restore <pre> blocks
    for key, val in pre_blocks.items():
        html = html.replace(key, val)

    # Split into blocks by double newlines
    parts = re.split(r'\n\n+', html)
    result = []
    for part in parts:
        part = part.strip()
        if not part:
            continue
        # Already block-level elements
        if re.match(r'^<(?:pre|h[1-6]|table|img|div|ul|ol)', part):
            result.append(part)
            continue
        # Unordered list: lines starting with -
        lines = part.split('\n')
        if all(ln.strip().startswith('- ') or ln.strip().startswith('* ') for ln in lines if ln.strip()):
            items = [f'<li>{ln.strip().lstrip("-* ").strip()}</li>' for ln in lines if ln.strip()]
            result.append('<ul>' + ''.join(items) + '</ul>')
            continue
        # Ordered list: lines starting with 1. 2. etc
        if all(re.match(r'^\d+\.\s', ln.strip()) for ln in lines if ln.strip()):
            items = [f'<li>{re.sub(r"^[0-9]+[.]\\s*", "", ln.strip())}</li>' for ln in lines if ln.strip()]
            result.append('<ol>' + ''.join(items) + '</ol>')
            continue
        # Regular paragraph
        result.append(f'<p>{part}</p>')
    return '\n'.join(result)


## --- Install code generation (from gen_app_pages.py logic) ---

def kgst_install(chart_name: str, chart_version: str, enterprise: bool) -> str:
    kgst = 'oci://ghcr.io/k0rdent/catalog/charts/kgst'
    if enterprise:
        kgst = "oci://registry.mirantis.com/k0rdent-enterprise-catalog/kgst"
    return f'helm upgrade --install {chart_name} {kgst} \\\n  --set "chart={chart_name}:{chart_version}" \\\n  -n kcm-system'


def generate_install_code(metadata: dict, version: str) -> str | None:
    if 'install_code' in metadata:
        return metadata['install_code']
    if 'charts' not in metadata:
        return None
    lines = ['~~~bash']
    for chart in metadata['charts']:
        enterprise = metadata.get('support_type') == 'Enterprise'
        ver = version if version else chart['versions'][0]
        lines.append(kgst_install(chart['name'], ver, enterprise))
    lines.append('~~~')
    return '\n'.join(lines)


def generate_verify_code(metadata: dict, version: str) -> str | None:
    if 'verify_code' in metadata:
        return metadata['verify_code']
    if 'charts' not in metadata:
        return None
    charts = []
    for chart in metadata['charts']:
        ver = version if version else chart['versions'][0]
        charts.append({'name': chart['name'], 'version': ver})
    return utils.charts_2_verify_code(charts)


def generate_deploy_code(metadata: dict, version: str = None) -> str | None:
    if 'deploy_code' in metadata:
        deploy_md = metadata['deploy_code']
        if version and metadata.get('charts'):
            # For manual deploy_code, substitute template version strings
            for chart in metadata['charts']:
                default_ver = chart['versions'][0]
                old_slug = chart['name'] + '-' + default_ver.replace('.', '-')
                new_slug = chart['name'] + '-' + version.replace('.', '-')
                deploy_md = deploy_md.replace(old_slug, new_slug)
        return deploy_md
    chart_folder = os.path.join(metadata.get('app_path', ''), 'example')
    if not os.path.exists(chart_folder):
        return None
    chart_file = os.path.join(chart_folder, 'Chart.yaml')
    if not os.path.exists(chart_file):
        return None
    chart_dict = utils.read_yaml_file(chart_file)
    if version and 'dependencies' in chart_dict:
        # Override dependency versions for version-specific deploy code
        import copy
        chart_dict = copy.deepcopy(chart_dict)
        for dep in chart_dict['dependencies']:
            if metadata.get('charts'):
                for mc in metadata['charts']:
                    if dep['name'] == mc['name']:
                        dep['version'] = version
                        break
    return utils.chart_2_deploy_code(chart_dict, chart_folder, metadata['app'], metadata)


def extract_examples(app_name: str, metadata: dict, app_path: str) -> list:
    examples = []
    for key, item in metadata.get('examples', {}).items():
        if item.get('type') == 'solution':
            continue
        example = {'title': item.get('title', key)}
        if 'chart_folder' in item:
            chart_folder = os.path.join(app_path, item['chart_folder'])
            chart_file = os.path.join(chart_folder, 'Chart.yaml')
            if os.path.exists(chart_file):
                chart_dict = utils.read_yaml_file(chart_file)
                example['installHtml'] = md_to_html(utils.chart_2_install_code(chart_dict))
                example['verifyHtml'] = md_to_html(utils.charts_2_verify_code(chart_dict['dependencies']))
                example['deployHtml'] = md_to_html(utils.chart_2_deploy_code(chart_dict, chart_folder, app_name, metadata))
        if 'content_template_file' in item:
            file_path = os.path.join(app_path, item['content_template_file'])
            if os.path.exists(file_path):
                with open(file_path, 'r', encoding='utf-8') as f:
                    tpl = jinja2.Template(f.read())
                    merged = dict(BASE_METADATA)
                    merged.update(metadata)
                    merged.update(item)
                    example['contentHtml'] = md_to_html(tpl.render(**merged))
        elif 'content' in item:
            example['contentHtml'] = md_to_html(item['content'])
        examples.append(example)
    return examples


def generate_install_json(app_name: str, data: dict, app_path: str):
    """Generate per-app install.json with HTML install content."""
    data['app'] = app_name
    data['app_path'] = app_path
    data['test_namespace'] = data.get('test_namespace', app_name)
    data.update(BASE_METADATA)

    show_install = data.get('show_install_tab', True)
    if not show_install:
        return None

    # Generate install/verify/deploy for each chart version
    versions_data = []
    charts = data.get('charts', [])
    all_versions = charts[0]['versions'] if charts else []
    for ver in all_versions[:5]:
        install_md = generate_install_code(data, ver)
        verify_md = generate_verify_code(data, ver)
        deploy_md = generate_deploy_code(data, ver)
        versions_data.append({
            'version': ver,
            'installHtml': md_to_html(install_md) if install_md else '',
            'verifyHtml': md_to_html(verify_md) if verify_md else '',
            'deployHtml': md_to_html(deploy_md) if deploy_md else '',
        })

    # Prerequisites
    prereq = data.get('prerequisites', '')
    default_prereq = f'Deploy k0rdent {VERSION}: <a href="https://docs.k0rdent.io/{VERSION}/admin/installation/install-k0rdent/" target="_blank">QuickStart</a>'

    # Examples
    examples = extract_examples(app_name, data, app_path)

    install_data = {
        'versions': versions_data,
        'prerequisitesHtml': md_to_html(prereq) if prereq else default_prereq,
        'docLink': data.get('doc_link', ''),
        'examples': examples,
    }

    # Write to per-app directory
    out_dir = os.path.join(OUTPUT_DIR, 'apps', app_name)
    os.makedirs(out_dir, exist_ok=True)
    out_file = os.path.join(out_dir, 'install.json')
    with open(out_file, 'w', encoding='utf-8') as f:
        json.dump(install_data, f, indent=2, ensure_ascii=False)

    return install_data


def process_app(app_name: str) -> dict | None:
    app_path = os.path.join(APPS_DIR, app_name)
    data_file = os.path.join(app_path, 'data.yaml')

    if not os.path.isdir(app_path) or not os.path.exists(data_file):
        return None

    with open(data_file, 'r', encoding='utf-8') as f:
        tpl = jinja2.Template(f.read())
        rendered = tpl.render(**BASE_METADATA)
        data = yaml.safe_load(rendered)

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

    # Generate per-app install.json
    generate_install_json(app_name, data, app_path)

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
        'showInstall': data.get('show_install_tab', True),
        'docs': f"https://catalog.k0rdent.io/{VERSION}/apps/{app_name}/",
    }

    return entry


def generate_fetched_metadata(catalog: list, output_dir: str):
    """Generate fetched_metadata.json for backward compatibility with MkDocs frontend."""
    site_url = os.environ.get('SITE_URL', 'https://catalog.k0rdent.io')
    base_url = f"{site_url.rstrip('/')}/{VERSION}"
    items = []
    for app in catalog:
        support = app.get('support', 'community')
        if support == 'enterprise':
            support_type = 'Enterprise'
        elif support == 'partner':
            support_type = 'Enterprise'
        else:
            support_type = 'Community'
        logo = app.get('logo', '')
        if logo and not logo.startswith('http'):
            logo = f"{base_url}/{logo}"
        items.append({
            'link': './apps/' + app['name'],
            'title': app.get('title', app['name']),
            'description': app.get('desc', ''),
            'type': app.get('type', 'app'),
            'logo': logo,
            'tags': app.get('tags', []),
            'created': app.get('created', ''),
            'support_type': support_type,
            'appDir': app['name'],
        })
    out_file = os.path.join(output_dir, 'fetched_metadata.json')
    with open(out_file, 'w', encoding='utf-8') as f:
        json.dump(items, f, indent=2, ensure_ascii=False)


def extract_solutions(output_dir: str) -> list:
    """Extract solution data from all apps and generate per-solution detail JSON files."""
    solutions = []
    for app_name in sorted(os.listdir(APPS_DIR)):
        app_path = os.path.join(APPS_DIR, app_name)
        data_file = os.path.join(app_path, 'data.yaml')
        if not os.path.isdir(app_path) or not os.path.exists(data_file):
            continue
        with open(data_file, 'r', encoding='utf-8') as f:
            tpl = jinja2.Template(f.read())
            rendered = tpl.render(**BASE_METADATA)
            data = yaml.safe_load(rendered)
        if not data or not data.get('examples'):
            continue

        # Get app logo for the solution card
        logo_raw = data.get('logo', '')
        logo = logo_raw
        if logo_raw.startswith('./') or (logo_raw and not logo_raw.startswith('http')):
            filename = os.path.basename(logo_raw.lstrip('./'))
            logo = f"logos/{app_name}/{filename}"

        for key, ex in data['examples'].items():
            if ex.get('type') != 'solution':
                continue
            chart_folder = os.path.join(app_path, ex.get('chart_folder', ''))
            chart_file = os.path.join(chart_folder, 'Chart.yaml')

            # Extract unique components from Chart.yaml dependencies (by name+version, ordered)
            components = []
            seen_components = set()
            if os.path.exists(chart_file):
                chart_dict = utils.read_yaml_file(chart_file)
                for dep in chart_dict.get('dependencies', []):
                    comp_key = (dep['name'], dep['version'])
                    if comp_key not in seen_components:
                        seen_components.add(comp_key)
                        components.append({
                            'name': dep['name'],
                            'version': dep['version'],
                            'role': dep.get('solution_role', ''),
                            'why': dep.get('solution_why', ''),
                        })

            sol_id = f"{app_name}_{key}"
            badge_color = {
                'community': '#00d48a',
                'partner': '#00c8c8',
                'mirantis-certified': '#00c8c8',
            }.get(ex.get('tier', 'community'), '#00d48a')

            sol_entry = {
                'id': sol_id,
                'title': ex.get('card_title', ex.get('title', key)),
                'category': ex.get('category', ''),
                'tier': ex.get('tier', 'community'),
                'badge': ex.get('badge', 'Validated'),
                'badgeColor': badge_color,
                'icon': ex.get('icon', '◈'),
                'logo': logo,
                'appName': app_name,
                'tagline': ex.get('tagline', ex.get('card_summary', '')),
                'desc': ex.get('card_summary', ''),
                'useCases': ex.get('use_cases', []),
                'components': components,
                'clouds': ex.get('clouds', []),
                'k8s': ex.get('k8s', []),
            }
            solutions.append(sol_entry)

            # Generate per-solution detail JSON (deploy YAML + rendered content)
            detail = {}
            if os.path.exists(chart_file):
                chart_dict = utils.read_yaml_file(chart_file)
                deploy_md = utils.chart_2_deploy_code(chart_dict, chart_folder, app_name, {
                    'app': app_name, 'app_path': app_path,
                    'test_namespace': data.get('test_namespace', app_name),
                    **BASE_METADATA
                })
                detail['deployHtml'] = md_to_html(deploy_md)
                # Raw YAML for copy button
                detail['deployYaml'] = utils.chart_2_mcs_str(chart_dict, chart_folder, app_name, {
                    'app': app_name, 'app_path': app_path,
                    'test_namespace': data.get('test_namespace', app_name),
                    **BASE_METADATA
                })

            if ex.get('content_template_file'):
                content_path = os.path.join(app_path, ex['content_template_file'])
                if os.path.exists(content_path):
                    with open(content_path, 'r', encoding='utf-8') as f:
                        content_tpl = jinja2.Template(f.read())
                        merged = dict(BASE_METADATA)
                        merged.update(data)
                        merged.update(ex)
                        # Generate install/verify/deploy for content template
                        if os.path.exists(chart_file):
                            chart_dict = utils.read_yaml_file(chart_file)
                            merged['install_code'] = utils.chart_2_install_code(chart_dict)
                            merged['verify_code'] = utils.charts_2_verify_code(chart_dict['dependencies'])
                            merged['deploy_code'] = utils.chart_2_deploy_code(chart_dict, chart_folder, app_name, merged)
                        detail['contentHtml'] = md_to_html(content_tpl.render(**merged))

            sol_detail_dir = os.path.join(output_dir, 'apps', app_name)
            os.makedirs(sol_detail_dir, exist_ok=True)
            sol_detail_file = os.path.join(sol_detail_dir, f'solution_{key}.json')
            with open(sol_detail_file, 'w', encoding='utf-8') as f:
                json.dump(detail, f, indent=2, ensure_ascii=False)

    return solutions


def build_version(version: str, output_dir: str):
    """Build catalog.json, install.json, and solution files for a single version."""
    global VERSION, BASE_METADATA, OUTPUT_DIR, OUTPUT_FILE
    VERSION = version
    BASE_METADATA = get_base_metadata(version)
    OUTPUT_DIR = output_dir
    OUTPUT_FILE = os.path.join(output_dir, 'catalog.json')
    os.makedirs(output_dir, exist_ok=True)

    catalog = []
    install_count = 0
    for app_name in sorted(os.listdir(APPS_DIR)):
        entry = process_app(app_name)
        if entry:
            catalog.append(entry)
            if os.path.exists(os.path.join(output_dir, 'apps', app_name, 'install.json')):
                install_count += 1

    solutions = extract_solutions(output_dir)

    # Write catalog.json as nested format with solutions
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        json.dump({'apps': catalog, 'solutions': solutions}, f, indent=2, ensure_ascii=False)

    generate_fetched_metadata(catalog, output_dir)

    print(f"  {version}: {len(catalog)} apps, {len(solutions)} solutions, {install_count} install.json files")


def load_versions() -> dict:
    with open(VERSIONS_FILE, 'r') as f:
        return yaml.safe_load(f)


def main():
    base_output = os.environ.get('OUTPUT_DIR', os.path.join(CATALOG_ROOT, 'tsweb', 'public'))

    if '--all-versions' in sys.argv:
        versions_config = load_versions()
        versions = versions_config['versions']
        latest = versions_config['latest']

        # Write versions.json for the SPA
        versions_json = os.path.join(base_output, 'versions.json')
        os.makedirs(base_output, exist_ok=True)
        with open(versions_json, 'w') as f:
            json.dump(versions_config, f, indent=2)
        print(f"Generated {versions_json}")

        # Build each version into its own subdirectory
        for v in versions:
            ver_output = os.path.join(base_output, v)
            build_version(v, ver_output)

        # Copy latest version data to root (for backward compat / default)
        latest_dir = os.path.join(base_output, latest)
        for fname in ['catalog.json', 'fetched_metadata.json']:
            src = os.path.join(latest_dir, fname)
            dst = os.path.join(base_output, fname)
            if os.path.exists(src):
                shutil.copy2(src, dst)
        # Copy latest apps/ install.json files to root
        latest_apps = os.path.join(latest_dir, 'apps')
        root_apps = os.path.join(base_output, 'apps')
        if os.path.exists(latest_apps):
            if os.path.exists(root_apps):
                shutil.rmtree(root_apps)
            shutil.copytree(latest_apps, root_apps)
        # Copy latest logos to root
        latest_logos = os.path.join(latest_dir, 'logos')
        root_logos = os.path.join(base_output, 'logos')
        if os.path.exists(latest_logos):
            if os.path.exists(root_logos):
                shutil.rmtree(root_logos)
            shutil.copytree(latest_logos, root_logos)

        print(f"Built {len(versions)} versions, latest={latest}")
    else:
        # Single version mode (backward compat)
        version = os.environ.get('VERSION', 'v1.8.0')
        build_version(version, base_output)
        print(f"Generated {base_output}/catalog.json")


if __name__ == '__main__':
    import sys
    main()
