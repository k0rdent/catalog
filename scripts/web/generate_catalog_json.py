#!/usr/bin/env python3
"""Generate catalog.json from apps/*/data.yaml for the React TSX frontend.
Copies local logo files to the output directory so they can be served as static assets.
"""

import copy
import glob
import jinja2
import json
import markdown
import os
import re
import shutil
import sys
import yaml
from datetime import datetime, timezone

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import utils

CATALOG_ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
APPS_DIR = os.path.join(CATALOG_ROOT, 'apps')
VERSIONS_FILE = os.path.join(CATALOG_ROOT, 'versions.yaml')

# Mutable build context — set per-version by build_version()
VERSION = os.environ.get('VERSION', 'v1.8.0')
BASE_METADATA = {}
OUTPUT_DIR = ''
OUTPUT_FILE = ''

# Loaded once at import
CONFIGURATOR_DIR = os.path.join(CATALOG_ROOT, 'configurator')
CONFIGURATOR_DEFAULT = {}
_cfg_path = os.path.join(CONFIGURATOR_DIR, 'config.yaml')
if os.path.exists(_cfg_path):
    CONFIGURATOR_DEFAULT = utils.read_yaml_file(_cfg_path)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def get_base_metadata(version: str) -> dict:
    base = {"version": version}
    base.update(utils.version2template_names(version))
    return base


def get_tested(data: dict) -> bool:
    return any(data.get(k) == 'y' for k in
               ['validated_amd64', 'validated_arm64', 'validated_aws', 'validated_azure', 'validated_local'])


def get_support_tier(data: dict) -> str:
    st = data.get('support_type', 'Community').lower()
    if st in ('enterprise', 'partner'):
        return st
    return 'community'


_app_template_cache = {}  # app_name -> jinja2.Template
_yaml_cache = {}  # path -> dict


def read_app_data(app_name: str) -> dict | None:
    """Read and render an app's data.yaml, returning None if missing."""
    if app_name not in _app_template_cache:
        data_file = os.path.join(APPS_DIR, app_name, 'data.yaml')
        if not os.path.exists(data_file):
            _app_template_cache[app_name] = None
            return None
        with open(data_file, 'r', encoding='utf-8') as f:
            _app_template_cache[app_name] = jinja2.Template(f.read())
    tpl = _app_template_cache[app_name]
    if tpl is None:
        return None
    return yaml.safe_load(tpl.render(**BASE_METADATA))


def read_yaml(path: str) -> dict | None:
    if path not in _yaml_cache:
        if not os.path.exists(path):
            _yaml_cache[path] = None
        else:
            _yaml_cache[path] = utils.read_yaml_file(path)
    return _yaml_cache[path]


def write_json(path: str, data, indent: int = None):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=indent, ensure_ascii=False)


def copy_local_logo(app_name: str, logo_path: str) -> str:
    rel_path = logo_path.lstrip('./')
    src = os.path.join(APPS_DIR, app_name, rel_path)
    if not os.path.exists(src):
        raise FileNotFoundError(f"Logo not found: {src}")
    filename = os.path.basename(rel_path)
    dst_dir = os.path.join(OUTPUT_DIR, 'logos', app_name)
    os.makedirs(dst_dir, exist_ok=True)
    dst = os.path.join(dst_dir, filename)
    if not os.path.exists(dst):
        shutil.copy2(src, dst)
    return f"logos/{app_name}/{filename}"


def resolve_logo(app_name: str, data: dict) -> tuple[str, str | None]:
    """Return (logo_url, brand_color) handling local vs remote logos."""
    logo_raw = data.get('logo', '')
    brand_color = data.get('brand_color', None)
    if logo_raw.startswith('./') or (logo_raw and not logo_raw.startswith('http')):
        return copy_local_logo(app_name, logo_raw), brand_color
    return logo_raw, brand_color


def read_api_stats(app_path: str) -> tuple[int, int]:
    stars = pulls = 0
    stars_path = os.path.join(app_path, 'stars.yaml')
    if os.path.exists(stars_path):
        with open(stars_path) as f:
            stars = (yaml.safe_load(f) or {}).get('gh_stars', 0)
    pulls_path = os.path.join(app_path, 'pulls.yaml')
    if os.path.exists(pulls_path):
        with open(pulls_path) as f:
            pulls = (yaml.safe_load(f) or {}).get('gh_pulls', 0)
    return stars, pulls


# ---------------------------------------------------------------------------
# Markdown to HTML
# ---------------------------------------------------------------------------

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
    html = md_code_to_html(text)

    def img_replace(m):
        src = m.group(2).strip()
        if not src:
            return ''
        alt = m.group(1)
        width = m.group(3)
        style = f'max-width:{width}px' if width else 'max-width:100%'
        return f'<img src="{src}" alt="{alt}" style="{style}" />'
    html = re.sub(r'!\[([^\]]*)\]\(([^)]*)\)(?:\{[^}]*width="(\d+)"[^}]*\})?(?:\{[^}]*\})?', img_replace, html)

    html = re.sub(r'\[([^\]]+)\]\(([^)]+)\)(?:\{[^}]*\})?', r'<a href="\2" target="_blank">\1</a>', html)
    html = re.sub(r'\*\*(.+?)\*\*', r'<strong>\1</strong>', html)
    html = re.sub(r'`([^`]+)`', r'<code>\1</code>', html)

    pre_blocks = {}
    def stash_pre(m):
        key = f'__PRE_{len(pre_blocks)}__'
        pre_blocks[key] = m.group(0)
        return key
    html = re.sub(r'<pre>.*?</pre>', stash_pre, html, flags=re.DOTALL)

    for level in range(4, 0, -1):
        html = re.sub(rf'^#{{{level}}}\s+(.+)$', rf'<h{level}>\1</h{level}>', html, flags=re.MULTILINE)

    parts = re.split(r'\n\n+', html)
    result = []
    for part in parts:
        part = part.strip()
        if not part:
            continue
        if re.match(r'^__PRE_\d+__$', part) or re.match(r'^<(?:pre|h[1-6]|table|img|div|ul|ol)', part):
            result.append(part)
            continue
        lines = part.split('\n')
        if all(ln.strip().startswith(('- ', '* ')) for ln in lines if ln.strip()):
            items = [f'<li>{ln.strip().lstrip("-* ").strip()}</li>' for ln in lines if ln.strip()]
            result.append('<ul>' + ''.join(items) + '</ul>')
            continue
        if all(re.match(r'^\d+\.\s', ln.strip()) for ln in lines if ln.strip()):
            ol_pat = re.compile(r'^[0-9]+[.]\s*')
            items = ['<li>' + ol_pat.sub('', ln.strip()) + '</li>' for ln in lines if ln.strip()]
            result.append('<ol>' + ''.join(items) + '</ol>')
            continue
        result.append(f'<p>{part}</p>')
    html = '\n'.join(result)

    for key, val in pre_blocks.items():
        html = html.replace(key, val)
    return html


# ---------------------------------------------------------------------------
# Install code generation
# ---------------------------------------------------------------------------

def _load_example_chart(metadata: dict) -> dict | None:
    path = os.path.join(metadata.get('app_path', ''), 'example', 'Chart.yaml')
    return read_yaml(path)


def _substitute_versions(chart_dict: dict, metadata: dict, version: str) -> dict:
    """Deep-copy chart_dict and override versions for the app's own charts."""
    chart_dict = copy.deepcopy(chart_dict)
    if version and metadata.get('charts'):
        app_chart_names = {c['name'] for c in metadata['charts']}
        for dep in chart_dict.get('dependencies', []):
            if dep['name'] in app_chart_names:
                dep['version'] = version
    return chart_dict


def kgst_install(chart_name: str, chart_version: str, enterprise: bool) -> str:
    kgst = 'oci://ghcr.io/k0rdent/catalog/charts/kgst'
    if enterprise:
        kgst = "oci://registry.mirantis.com/k0rdent-enterprise-catalog/kgst"
    return f'helm upgrade --install {chart_name} {kgst} \\\n  --set "chart={chart_name}:{chart_version}" \\\n  -n kcm-system'


def generate_install_code(metadata: dict, version: str) -> str | None:
    if 'install_code' in metadata:
        return metadata['install_code']
    chart_dict = _load_example_chart(metadata)
    if chart_dict and 'dependencies' in chart_dict:
        return utils.chart_2_install_code(_substitute_versions(chart_dict, metadata, version))
    if 'charts' not in metadata:
        return None
    lines = ['~~~bash']
    enterprise = metadata.get('support_type') == 'Enterprise'
    for chart in metadata['charts']:
        ver = version or chart['versions'][0]
        lines.append(kgst_install(chart['name'], ver, enterprise))
    lines.append('~~~')
    return '\n'.join(lines)


def generate_verify_code(metadata: dict, version: str) -> str | None:
    if 'verify_code' in metadata:
        return metadata['verify_code']
    chart_dict = _load_example_chart(metadata)
    if chart_dict and 'dependencies' in chart_dict:
        return utils.charts_2_verify_code(_substitute_versions(chart_dict, metadata, version)['dependencies'])
    if 'charts' not in metadata:
        return None
    charts = [{'name': c['name'], 'version': version or c['versions'][0]} for c in metadata['charts']]
    return utils.charts_2_verify_code(charts)


def generate_deploy_code(metadata: dict, version: str = None) -> str | None:
    if 'deploy_code' in metadata:
        deploy_md = metadata['deploy_code']
        if version and metadata.get('charts'):
            for chart in metadata['charts']:
                default_ver = chart['versions'][0]
                deploy_md = deploy_md.replace(
                    chart['name'] + '-' + default_ver.replace('.', '-'),
                    chart['name'] + '-' + version.replace('.', '-'))
        return deploy_md
    chart_folder = os.path.join(metadata.get('app_path', ''), 'example')
    chart_dict = read_yaml(os.path.join(chart_folder, 'Chart.yaml'))
    if not chart_dict:
        return None
    if version and 'dependencies' in chart_dict:
        chart_dict = _substitute_versions(chart_dict, metadata, version)
    return utils.chart_2_deploy_code(chart_dict, chart_folder, metadata['app'], metadata)


def _render_version_data(data: dict, ver: str) -> dict:
    return {
        'version': ver,
        'installHtml': md_to_html(generate_install_code(data, ver) or ''),
        'verifyHtml': md_to_html(generate_verify_code(data, ver) or ''),
        'deployHtml': md_to_html(generate_deploy_code(data, ver) or ''),
    }


# ---------------------------------------------------------------------------
# Examples and install.json
# ---------------------------------------------------------------------------

def _render_chart_codes(chart_folder: str, app_name: str, metadata: dict) -> dict:
    chart_dict = read_yaml(os.path.join(chart_folder, 'Chart.yaml'))
    if not chart_dict:
        return {}
    return {
        'install_code': utils.chart_2_install_code(chart_dict),
        'verify_code': utils.charts_2_verify_code(chart_dict['dependencies']),
        'deploy_code': utils.chart_2_deploy_code(chart_dict, chart_folder, app_name, metadata),
    }


def extract_examples(app_name: str, metadata: dict, app_path: str) -> list:
    examples = []
    for key, item in metadata.get('examples', {}).items():
        if item.get('type') == 'solution':
            continue
        example = {'title': item.get('title', key)}
        chart_folder = os.path.join(app_path, item['chart_folder']) if 'chart_folder' in item else None

        if chart_folder:
            chart_dict = read_yaml(os.path.join(chart_folder, 'Chart.yaml'))
            if chart_dict:
                example['installHtml'] = md_to_html(utils.chart_2_install_code(chart_dict))
                example['verifyHtml'] = md_to_html(utils.charts_2_verify_code(chart_dict['dependencies']))
                example['deployHtml'] = md_to_html(utils.chart_2_deploy_code(chart_dict, chart_folder, app_name, metadata))

        if 'content_template_file' in item:
            file_path = os.path.join(app_path, item['content_template_file'])
            if os.path.exists(file_path):
                with open(file_path, 'r', encoding='utf-8') as f:
                    merged = dict(BASE_METADATA)
                    merged.update(metadata)
                    merged.update(item)
                    if chart_folder:
                        merged.update(_render_chart_codes(chart_folder, app_name, merged))
                    example['contentHtml'] = md_to_html(jinja2.Template(f.read()).render(**merged))
        elif 'content' in item:
            example['contentHtml'] = md_to_html(item['content'])
        examples.append(example)
    return examples


def generate_install_json(app_name: str, data: dict, app_path: str):
    data['app'] = app_name
    data['app_path'] = app_path
    data['test_namespace'] = data.get('test_namespace', app_name)
    data.update(BASE_METADATA)

    if not data.get('show_install_tab', True):
        return None

    charts = data.get('charts', [])
    all_versions = charts[0]['versions'] if charts else []

    if all_versions:
        versions_data = [_render_version_data(data, ver) for ver in all_versions[:5]]
    elif data.get('install_code') or data.get('verify_code') or data.get('deploy_code'):
        versions_data = [_render_version_data(data, '')]
    else:
        versions_data = []

    prereq = data.get('prerequisites', '')
    default_prereq = f'Deploy k0rdent {VERSION}: <a href="https://docs.k0rdent.io/{VERSION}/admin/installation/install-k0rdent/" target="_blank">QuickStart</a>'

    install_data = {
        'versions': versions_data,
        'prerequisitesHtml': md_to_html(prereq) if prereq else default_prereq,
        'docLink': data.get('doc_link', ''),
        'examples': extract_examples(app_name, data, app_path),
    }

    write_json(os.path.join(OUTPUT_DIR, 'apps', app_name, 'install.json'), install_data, indent=2)
    return install_data


# ---------------------------------------------------------------------------
# App processing
# ---------------------------------------------------------------------------

def get_last_updated(app_name: str) -> str:
    locks = glob.glob(f'apps/{app_name}/charts/*/Chart.lock')
    dates = []
    for lf in locks:
        with open(lf) as f:
            gen = yaml.safe_load(f).get('generated', '')
        if gen:
            dates.append(datetime.fromisoformat(str(gen).replace('Z', '+00:00')).astimezone(timezone.utc))
    return max(dates).strftime('%Y-%m-%d') if dates else ''


def process_app(app_name: str) -> dict | None:
    app_path = os.path.join(APPS_DIR, app_name)
    data = read_app_data(app_name)
    if data is None:
        return None

    utils.try_add_charts_data(app_name, data)

    charts = data.get('charts', [])
    versions = charts[0]['versions'] if charts else []
    chart_name = charts[0]['name'] if charts else app_name

    logo, brand_color = resolve_logo(app_name, data)
    stars, pulls = read_api_stats(app_path)

    generate_install_json(app_name, data, app_path)

    # Generate per-app scan.json from trivy reports (if available)
    has_scan = generate_scan_json(app_name, OUTPUT_DIR)

    return {
        'name': app_name,
        'title': data.get('title', app_name),
        'desc': data.get('summary', ''),
        'description': data.get('description', ''),
        'support': get_support_tier(data),
        'tested': get_tested(data),
        'validated': {k: data.get(f'validated_{k}', '-') for k in ['amd64', 'arm64', 'aws', 'azure', 'local']},
        'tags': data.get('tags', []),
        'version': versions[0] if versions else '',
        'versions': versions[:5],
        'chartName': chart_name,
        'type': data.get('type', 'app'),
        'infraGroup': data.get('infra_group', ''),
        'logo': logo,
        'brandColor': brand_color,
        'doc_link': data.get('doc_link', ''),
        'supportLink': data.get('support_link', ''),
        'created': data.get('created', ''),
        'lastUpdated': get_last_updated(app_name) or data.get('created', ''),
        'githubRepo': data.get('github_repo', ''),
        'stars': stars,
        'pulls': pulls,
        'descriptionHtml': md_to_html(data.get('description', '')),
        'showInstall': data.get('show_install_tab', True),
        'whyInCatalog': data.get('why_in_catalog', ''),
        'docs': f"https://catalog.k0rdent.io/{VERSION}/apps/{app_name}/",
        'hasScan': has_scan,
    }


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


# ---------------------------------------------------------------------------
# Metadata and contribute page
# ---------------------------------------------------------------------------

def generate_contribute_html(output_dir: str):
    contribute_md = os.path.join(CATALOG_ROOT, 'tsweb', 'md', 'contribute.md')
    if not os.path.exists(contribute_md):
        raise FileNotFoundError(f"Contribute file not found: {contribute_md}")
    with open(contribute_md, 'r', encoding='utf-8') as f:
        content = f.read()
    content = re.sub(r'\{[^}]*target="_blank"[^}]*\}', '', content)
    content = re.sub(r'\[\]\(\)\{[^}]*\}', '', content)
    content = re.sub(r'\{[^}]*#[a-z-]+[^}]*\}', '', content)
    html = markdown.markdown(content, extensions=['fenced_code', 'tables', 'toc'],
                             extension_configs={'toc': {'permalink': '#', 'permalink_class': 'anchor-link'}})
    html = html.replace('<a href="http', '<a target="_blank" rel="noreferrer" style="color:#00c8c8" href="http')
    write_json(os.path.join(output_dir, 'contribute.json'), {'contentHtml': html})


# ---------------------------------------------------------------------------
# Solutions
# ---------------------------------------------------------------------------

def _merge_infra(global_infra: list, override: list | None) -> list:
    if not override:
        return global_infra
    g_providers = {p['id']: p for p in global_infra if 'id' in p}
    result = []
    for ov_provider in override:
        g_prov = g_providers.get(ov_provider.get('id', ''), {})
        merged = dict(g_prov)
        for k, v in ov_provider.items():
            if k != 'clds':
                merged[k] = v
        if 'clds' in ov_provider:
            g_clds = {c.get('id', ''): c for c in g_prov.get('clds', []) if 'id' in c}
            merged['clds'] = []
            for ov_cld in ov_provider['clds']:
                m = dict(g_clds.get(ov_cld.get('id', ''), {}))
                m.update({k: v for k, v in ov_cld.items() if v is not None})
                merged['clds'].append(m)
        result.append(merged)
    return result


def _build_solution_configurator(sol_id: str, ex: dict, chart_folder: str) -> list | None:
    global_infra = CONFIGURATOR_DEFAULT.get('infra', [])
    use_case_infra = None
    for uc in CONFIGURATOR_DEFAULT.get('use_cases', []):
        if uc.get('example', '').replace('.', '_') == sol_id:
            use_case_infra = uc.get('infra')
            break

    infra_cfg = ex.get('configurator') or _merge_infra(global_infra, use_case_infra)
    if not infra_cfg or not isinstance(infra_cfg, list):
        return None

    base_dir = chart_folder if ex.get('configurator') else CONFIGURATOR_DIR
    configurator_data = []
    for provider in infra_cfg:
        entry = {
            'title': provider.get('title', ''),
            'subtitle': provider.get('subtitle', ''),
            'icon': provider.get('icon', '☁'),
            'id': provider.get('id', ''),
        }
        if provider.get('cost'):
            entry['cost'] = provider['cost']
        clds_out = []
        for cld_item in provider.get('clds', []):
            file_path = cld_item.get('cld', '')
            full_path = os.path.join(base_dir, file_path)
            if not os.path.exists(full_path):
                raise FileNotFoundError(f"CLD file not found: {full_path}")
            with open(full_path, 'r', encoding='utf-8') as cf:
                rendered = jinja2.Template(cf.read()).render(**BASE_METADATA)
            clds_out.append({
                'id': cld_item.get('id', ''),
                'title': cld_item.get('title', ''),
                'subtitle': cld_item.get('subtitle', ''),
                'icon': cld_item.get('icon', '◈'),
                'cld': rendered,
            })
        entry['clds'] = clds_out
        configurator_data.append(entry)
    return configurator_data


def _build_solution_detail(ex: dict, app_name: str, app_path: str, chart_folder: str, data: dict) -> dict:
    detail = {}
    chart_dict = read_yaml(os.path.join(chart_folder, 'Chart.yaml'))

    if chart_dict:
        ctx = {'app': app_name, 'app_path': app_path,
               'test_namespace': data.get('test_namespace', app_name), **BASE_METADATA}
        detail['deployHtml'] = md_to_html(utils.chart_2_deploy_code(chart_dict, chart_folder, app_name, ctx))
        detail['deployYaml'] = utils.chart_2_mcs_str(chart_dict, chart_folder, app_name, ctx)

    if ex.get('content_template_file'):
        content_path = os.path.join(app_path, ex['content_template_file'])
        if os.path.exists(content_path):
            with open(content_path, 'r', encoding='utf-8') as f:
                merged = dict(BASE_METADATA)
                merged.update(data)
                merged.update(ex)
                if chart_dict:
                    merged.update(_render_chart_codes(chart_folder, app_name, merged))
                detail['contentHtml'] = md_to_html(jinja2.Template(f.read()).render(**merged))

    return detail


def extract_solutions(output_dir: str) -> list:
    solutions = []
    for app_name in sorted(os.listdir(APPS_DIR)):
        app_path = os.path.join(APPS_DIR, app_name)
        data = read_app_data(app_name)
        if not data or not data.get('examples'):
            continue

        logo_raw = data.get('logo', '')
        if logo_raw.startswith('./') or (logo_raw and not logo_raw.startswith('http')):
            logo = f"logos/{app_name}/{os.path.basename(logo_raw.lstrip('./'))}"
        else:
            logo = logo_raw

        for key, ex in data['examples'].items():
            if ex.get('type') != 'solution':
                continue
            chart_folder = os.path.join(app_path, ex.get('chart_folder', ''))

            components = []
            seen = set()
            chart_dict = read_yaml(os.path.join(chart_folder, 'Chart.yaml'))
            if chart_dict:
                for dep in chart_dict.get('dependencies', []):
                    comp_key = (dep['name'], dep['version'])
                    if comp_key not in seen:
                        seen.add(comp_key)
                        components.append({
                            'name': dep['name'], 'version': dep['version'],
                            'role': dep.get('solution_role', ''), 'why': dep.get('solution_why', ''),
                        })

            sol_id = f"{app_name}_{key}"
            badge_color = {'community': '#00d48a', 'partner': '#00c8c8', 'mirantis-certified': '#00c8c8'
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

            configurator = _build_solution_configurator(sol_id, ex, chart_folder)
            if configurator:
                sol_entry['configurator'] = configurator

            solutions.append(sol_entry)

            detail = _build_solution_detail(ex, app_name, app_path, chart_folder, data)
            write_json(os.path.join(output_dir, 'apps', app_name, f'solution_{key}.json'), detail, indent=2)

    return solutions


def _summarize_scan_results(results: list) -> dict:
    """Summarize trivy scan results into compact image-level data."""
    images = {}
    for r in results:
        img = r.get('Image', r.get('Target', 'unknown'))
        if img not in images:
            images[img] = {'image': img, 'critical': 0, 'high': 0, 'medium': 0, 'low': 0, 'total': 0}
        for v in r.get('Vulnerabilities') or []:
            sev = v.get('Severity', 'UNKNOWN').lower()
            if sev in images[img]:
                images[img][sev] += 1
            images[img]['total'] += 1
    img_list = list(images.values())
    return {
        'images': img_list,
        'totalImages': len(img_list),
        'totalVulnerabilities': sum(i['total'] for i in img_list),
    }


def generate_scan_json(app_name: str, output_dir: str) -> bool:
    """Read per-chart-version trivy reports and generate scan.json for the frontend."""
    scan_dir = os.path.join(CATALOG_ROOT, 'scan-reports', app_name)
    if not os.path.isdir(scan_dir):
        return False

    # Read all {chartName}-{version}.json files
    charts = {}
    for fname in sorted(os.listdir(scan_dir)):
        if not fname.endswith('.json'):
            continue
        # Parse "cert-manager-1.20.2.json" -> chart="cert-manager", version="1.20.2"
        base = fname[:-5]  # strip .json
        # Version is the last dash-separated segment that starts with a digit
        parts = base.split('-')
        version_idx = None
        for i in range(len(parts) - 1, 0, -1):
            if parts[i] and parts[i][0].isdigit():
                version_idx = i
                break
        if version_idx is None:
            continue
        chart_name = '-'.join(parts[:version_idx])
        version = '-'.join(parts[version_idx:])

        with open(os.path.join(scan_dir, fname), 'r', encoding='utf-8') as f:
            results = json.load(f)

        if chart_name not in charts:
            charts[chart_name] = {'versions': [], 'scans': {}}
        charts[chart_name]['versions'].append(version)
        charts[chart_name]['scans'][version] = _summarize_scan_results(results)

    if not charts:
        return False

    # Sort versions descending (latest first)
    for chart_data in charts.values():
        chart_data['versions'].sort(key=lambda v: [int(x) if x.isdigit() else x for x in v.split('.')], reverse=True)

    scan_data = {'charts': charts}

    out_dir = os.path.join(output_dir, 'apps', app_name)
    os.makedirs(out_dir, exist_ok=True)
    with open(os.path.join(out_dir, 'scan.json'), 'w', encoding='utf-8') as f:
        json.dump(scan_data, f, indent=2, ensure_ascii=False)

    return True


# ---------------------------------------------------------------------------
# Build pipeline
# ---------------------------------------------------------------------------

def build_version(version: str, output_dir: str):
    global VERSION, BASE_METADATA, OUTPUT_DIR, OUTPUT_FILE
    VERSION = version
    BASE_METADATA = get_base_metadata(version)
    OUTPUT_DIR = output_dir
    OUTPUT_FILE = os.path.join(output_dir, 'catalog.json')
    os.makedirs(output_dir, exist_ok=True)
    print(f"  {version}: building...")

    catalog, infra, install_count = [], [], 0
    for app_name in sorted(os.listdir(APPS_DIR)):
        entry = process_app(app_name)
        if not entry:
            continue
        if entry.get('type') == 'infra':
            infra.append(entry)
        else:
            catalog.append(entry)
            if os.path.exists(os.path.join(output_dir, 'apps', app_name, 'install.json')):
                install_count += 1

    solutions = extract_solutions(output_dir)

    configurator_solutions = [
        {'icon': item.get('icon', '◈'), 'title': item.get('title', ''),
         'subtitle': item.get('subtitle', ''), 'solId': item.get('example', '').replace('.', '_')}
        for item in CONFIGURATOR_DEFAULT.get('use_cases', [])
    ]

    write_json(OUTPUT_FILE, {
        'apps': catalog, 'solutions': solutions, 'infra': infra,
        'configuratorSolutions': configurator_solutions,
    }, indent=2)

    generate_fetched_metadata(catalog, output_dir)
    generate_contribute_html(output_dir)
    print(f"  {version}: {len(catalog)} apps, {len(infra)} infra, {len(solutions)} solutions")


def _copy_latest_to_root(base_output: str, latest: str):
    latest_dir = os.path.join(base_output, latest)
    for fname in ['catalog.json', 'fetched_metadata.json']:
        src = os.path.join(latest_dir, fname)
        if os.path.exists(src):
            shutil.copy2(src, os.path.join(base_output, fname))
    for subdir in ['apps', 'logos']:
        src = os.path.join(latest_dir, subdir)
        dst = os.path.join(base_output, subdir)
        if os.path.exists(src):
            if os.path.exists(dst):
                shutil.rmtree(dst)
            shutil.copytree(src, dst)


def load_versions() -> dict:
    with open(VERSIONS_FILE, 'r') as f:
        return yaml.safe_load(f)


def main():
    base_output = os.environ.get('OUTPUT_DIR', os.path.join(CATALOG_ROOT, 'tsweb', 'public'))

    if '--all-versions' in sys.argv:
        versions_config = load_versions()
        versions = versions_config['versions']
        latest = versions_config['latest']

        os.makedirs(base_output, exist_ok=True)
        write_json(os.path.join(base_output, 'versions.json'), versions_config, indent=2)
        print(f"Generated {base_output}/versions.json")

        for v in versions:
            build_version(v, os.path.join(base_output, v))

        _copy_latest_to_root(base_output, latest)
        print(f"Built {len(versions)} versions, latest={latest}")
    else:
        version = os.environ.get('VERSION', 'v1.8.0')
        build_version(version, base_output)
        print(f"Generated {base_output}/catalog.json")


if __name__ == '__main__':
    main()
