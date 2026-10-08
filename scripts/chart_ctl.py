import yaml
import argparse
from jinja2 import Template
import os
import subprocess
import pathlib
import re
import json
import sys
import shutil
import urllib.error
import urllib.parse
import urllib.request
from packaging.version import InvalidVersion, Version
import utils

# Docker Hub is addressed by a different host in the registry API than in chart repository URLs.
DOCKER_HUB_HOSTS = {"docker.io", "index.docker.io"}


def _semver_parts(version: str):
    """Return (major, minor, patch) as ints, or None if not semver."""
    parts = version.lstrip('v').split('.')
    if len(parts) >= 3 and all(p.isdigit() for p in parts[:3]):
        return (int(parts[0]), int(parts[1]), int(parts[2]))
    return None


chart_app_tpl = """apiVersion: v2
name: {{ name }}
description: A Helm chart that references the official "{{ name }}" Helm chart.
type: application
version: {{ version }}
dependencies:
  - name: {{ dep_name }}
    version: {{ version }}
    repository: {{ repository }}

"""


def read_charts_cfg(app: str, allow_return_none: bool = False) -> dict:
    helm_config_path = f"apps/{app}/charts/st-charts.yaml"
    if not os.path.exists(helm_config_path):
        if allow_return_none:
            return None
        raise Exception(f"{helm_config_path} file not found")
    with open(helm_config_path, "r", encoding='utf-8') as file:
        cfg = yaml.safe_load(file)
    return cfg


def try_generate_lock_file(chart_dir: str) -> bool:
    chart_path = pathlib.Path(chart_dir)
    lock_file = chart_path / "Chart.lock"
    if lock_file.exists():
        return False
    subprocess.run(["helm", "dependency", "update", str(chart_path)], check=True)
    if not lock_file.exists():
        raise RuntimeError("helm dependency update ran, but Chart.lock was not created")
    return True


def generate_app_chart(app: str, cfg: dict):
    folder_path = try_create_chart_folders(app, cfg['name'], cfg['version'], False)
    chart = Template(chart_app_tpl).render(**cfg)
    with open(f"{folder_path}/Chart.yaml", "w", encoding='utf-8') as f:
        f.write(chart)
    try_generate_lock_file(folder_path)


def try_create_chart_folders(app: str, name: str, version: str, templates: bool) -> str:
    chart_path = f"apps/{app}/charts/{name}-{version}"
    if not os.path.exists(chart_path):
        os.makedirs(chart_path)
    if templates:
        templates_path = f"{chart_path}/templates"
        if not os.path.exists(templates_path):
            os.makedirs(templates_path)
    return chart_path


def generate(args: str):
    app = args.app
    cfg = read_charts_cfg(app)
    generate_charts_info(app, cfg, args.rewrite_charts)
    if cfg.get('generate_charts', True):
        for chart in cfg['st-charts']:
            generate_app_chart(app, chart)


def get_last_deps(cfg: dict):
    last_deps = dict()
    for chart in cfg['st-charts']:
        last_deps[chart['dep_name']] = chart
    return last_deps


def service_template_name(chart_name: str, version: str) -> str:
    st_version = version.replace('.', '-')
    return f"{chart_name}-{st_version}"


def update_data_service_templates_docs(app_data: dict, st_updates: dict):
    keys = ['deploy_code']
    for key in keys:
        if key not in app_data:
            continue
        s = app_data[key]
        for old_st, new_st in st_updates.items():
            s = s.replace(old_st, new_st)
        app_data[key] = s


def update_example_chart(args, updates_dict: dict) -> bool:
    chart_data = utils.get_example_chart(args.app, 'example')
    changed = False
    for dep in chart_data['dependencies']:
        if dep['name'] in updates_dict:
            if dep['version'] != updates_dict[dep['name']]['version']:
                dep['version'] = updates_dict[dep['name']]['version']
                changed = True
    if changed:
        utils.write_example_chart(args.app, chart_data)


def try_ignore_prefix_v(up_to_date_chart: dict, prev_version: str):
    if prev_version.startswith('v'):
        return
    if up_to_date_chart['version'].startswith('v'):
        up_to_date_chart['version'] = up_to_date_chart['version'][1:]


def write_charts_cfg(app: str, s: str) -> dict:
    helm_config_path = f"apps/{app}/charts/st-charts.yaml"
    with open(helm_config_path, "w", encoding='utf-8') as file:
        file.write(s)


def write_charts_info(app: str, s: str) -> dict:
    charts_info_path = f"apps/{app}/charts/charts.yaml"
    with open(charts_info_path, "w", encoding='utf-8') as file:
        file.write(s)


def prune_old_patches(app: str, charts: list) -> list:
    """Keep only the latest patch per (dep_name, major, minor). Remove chart dirs for pruned versions."""
    best = {}
    for chart in charts:
        sv = _semver_parts(chart['version'])
        if sv is None:
            continue
        key = (chart['dep_name'], sv[0], sv[1])
        if key not in best or sv[2] > _semver_parts(best[key]['version'])[2]:
            best[key] = chart

    pruned = []
    for chart in charts:
        sv = _semver_parts(chart['version'])
        if sv is None:
            pruned.append(chart)
            continue
        key = (chart['dep_name'], sv[0], sv[1])
        if chart is best[key]:
            pruned.append(chart)
        else:
            print(f"Pruning superseded patch version: {chart['dep_name']} {chart['version']}")
            chart_dir = f"apps/{app}/charts/{chart['name']}-{chart['version']}"
            if os.path.isdir(chart_dir):
                shutil.rmtree(chart_dir)
                print(f"  Removed {chart_dir}")
    return pruned


def update_charts_cfg(args: str, updates_list: list, cfg: dict):
    if len(updates_list) > 0 and args.update_cfg:
        cfg['st-charts'].extend(updates_list)
        cfg['st-charts'] = prune_old_patches(args.app, cfg['st-charts'])
        output = yaml.dump(cfg, sort_keys=False)
        print(output)
        write_charts_cfg(args.app, output)


def oci_chart_ref(repository: str, chart: str) -> str:
    return f"{repository.rstrip('/')}/{chart}"


def oci_registry_path(repository: str, chart: str):
    """Split an OCI chart reference into registry API host and repository path."""
    host, _, path = oci_chart_ref(repository, chart)[len("oci://"):].partition('/')
    if host in DOCKER_HUB_HOSTS:
        host = "registry-1.docker.io"
        if '/' not in path:
            path = f"library/{path}"
    return host, path


def registry_get(url: str, token: str = None):
    request = urllib.request.Request(url, headers={"User-Agent": "k0rdent-catalog"})
    if token:
        request.add_header("Authorization", f"Bearer {token}")
    return urllib.request.urlopen(request, timeout=60)


def registry_auth_token(challenge: str) -> str:
    """Resolve a pull token from a Www-Authenticate challenge (Docker registry v2 auth)."""
    params = dict(re.findall(r'(\w+)="([^"]*)"', challenge))
    realm = params.pop("realm", None)
    if not realm:
        return None
    url = f"{realm}?{urllib.parse.urlencode(params)}" if params else realm
    with registry_get(url) as response:
        body = json.load(response)
    return body.get("token") or body.get("access_token")


def oci_list_tags(repository: str, chart: str) -> list:
    host, path = oci_registry_path(repository, chart)
    url = f"https://{host}/v2/{path}/tags/list?n=1000"
    token = None
    tags = []
    while url:
        try:
            response = registry_get(url, token)
        except urllib.error.HTTPError as e:
            if e.code == 401 and token is None:
                token = registry_auth_token(e.headers.get("Www-Authenticate", ""))
                if token:
                    continue
            raise
        with response:
            tags.extend(json.load(response).get("tags") or [])
            link = response.headers.get("Link", "")
        next_page = re.search(r'<([^>]+)>\s*;\s*rel="?next"?', link)
        url = urllib.parse.urljoin(url, next_page.group(1)) if next_page else None
    return tags


def latest_stable_tag(tags: list) -> str:
    """Highest release tag, ignoring pre-releases and anything not version-like."""
    latest, latest_version = None, None
    for tag in tags:
        try:
            version = Version(tag)
        except InvalidVersion:
            continue
        if version.is_prerelease:
            continue
        if latest_version is None or version > latest_version:
            latest, latest_version = tag, version
    return latest


def show_chart(reference: str, version: str = None) -> dict:
    args = ["helm", "show", "chart", reference]
    if version:
        args += ["--version", version]
    result = subprocess.run(args, check=True, capture_output=True, text=True)
    return yaml.safe_load(result.stdout)


def get_latest_https_chart(chart: str, repository: str) -> dict:
    subprocess.run(["helm", "repo", "add", chart, repository], check=True)
    try:
        subprocess.run(["helm", "repo", "update"], check=True)
        return show_chart(f"{chart}/{chart}")
    finally:
        subprocess.run(["helm", "repo", "remove", chart], check=True)


def get_latest_oci_chart(chart: str, repository: str):
    """Resolve the newest release from the registry tag list.

    `helm show chart --version '>=0.0.0'` would be shorter, but Helm drops every
    'v'-prefixed tag when resolving a range, which silently returns a stale
    version (or no version at all) for charts tagged that way.
    """
    tag = latest_stable_tag(oci_list_tags(repository, chart))
    if tag is None:
        raise RuntimeError(f"no release tags found in '{oci_chart_ref(repository, chart)}'")
    return tag, show_chart(oci_chart_ref(repository, chart), tag)


def get_latest_chart(chart: str, repository: str, current_version: str):
    """Return (version to record, chart metadata) for the newest release."""
    if repository.startswith("https"):
        metadata = get_latest_https_chart(chart, repository)
        # An index is keyed by the chart version, so that is what we store.
        try_ignore_prefix_v(metadata, current_version)
        return metadata['version'], metadata
    if repository.startswith("oci://"):
        # A registry is keyed by tag, which is not always the chart version
        # (lws tags 0.11.1 for chart v0.11.1, agentgateway tags v2.2.1). Storing
        # anything but the tag breaks every later `helm ... --version` call.
        return get_latest_oci_chart(chart, repository)
    print(f"Unsupported repo '{repository}' to automatically check updates, skipping.")
    return None, None


def check_updates(args: str):
    cfg = read_charts_cfg(args.app, allow_return_none=True)
    if cfg is None:
        print('Charts config not found.')
        return
    last_deps = get_last_deps(cfg)
    updates_list = []
    updates_dict = {}
    for chart, data in last_deps.items():
        try:
            latest_version, _ = get_latest_chart(chart, data['repository'], data['version'])
        except (subprocess.CalledProcessError, urllib.error.URLError, RuntimeError) as e:
            # One unreachable repo (private registry, outage) must not fail the whole app.
            print(f"::warning::Cannot check updates for '{chart}' in '{data['repository']}': {e}")
            continue
        if latest_version is None:
            continue
        print(f"Last version found: {latest_version}")
        if latest_version != data['version']:
            print(f"::warning::Update found for '{chart}': {data['version']} -> {latest_version}")
            item = data.copy()
            item['version'] = latest_version
            updates_list.append(item)
            updates_dict[item['name']] = item
    update_charts_cfg(args, updates_list, cfg)
    if not updates_list:
        # Regenerating anyway would rewrite charts.yaml from upstream metadata and
        # open a pull request for cosmetic churn (e.g. appVersion '1.0.0' vs 'v1.0.0')
        # with no version change behind it.
        print("No updates found, leaving generated files untouched.")
        return
    if args.generate_charts:
        generate(args)
    if args.update_example:
        update_example_chart(args, updates_dict)


def read_known_app_versions(charts_file: str) -> dict:
    """Map (chart name, version) -> appVersion already recorded in charts.yaml."""
    if not os.path.exists(charts_file):
        return {}
    with open(charts_file, "r", encoding='utf-8') as file:
        known = yaml.safe_load(file) or {}
    return {(name, str(entry.get('version'))): entry.get('appVersion', '')
            for name, entries in (known.get('charts') or {}).items()
            for entry in entries or []}


def generate_charts_info(app: str, cfg: dict, rewrite: bool):
    if cfg is None:
        print('Charts config not found.')
        return
    charts_file = f"apps/{app}/charts/charts.yaml"
    if os.path.exists(charts_file) and not rewrite:
        print(f"{charts_file} already exists!")
        return
    deps = cfg['st-charts']
    repos = dict()
    out_charts = dict()
    known_app_versions = read_known_app_versions(charts_file)
    for data in deps:
        repo = data['dep_name']
        if data['repository'].startswith("http") and data['repository'] not in repos:
            repo_name = repo
            subprocess.run(["helm", "repo", "add", repo_name, data['repository']], check=True)
            subprocess.run(["helm", "repo", "update"], check=True)
            repos[data['repository']] = repo_name
        elif data['repository'].startswith("oci"):
            repo_name = data['repository']
        else:
            repo_name = repos.get(data['repository'])
        args = ["helm", "show", "chart", f"{repo_name}/{repo}", "--version", data['version']]
        result = subprocess.run(args, check=False, capture_output=True, text=True)
        name = data['name']
        if result.returncode != 0:
            # Upstreams drop old versions from the index (mysql-operator keeps only
            # the latest). Keep what we already recorded rather than failing the app.
            previous = known_app_versions.get((name, str(data['version'])), '')
            print(f"::warning::'{repo_name}/{repo}' no longer offers version "
                  f"{data['version']}, keeping appVersion '{previous}'")
            up_to_date_chart = {'appVersion': previous}
        else:
            up_to_date_chart = yaml.safe_load(result.stdout)
        out_chart = dict(
            version=str(data['version']),
            appVersion=up_to_date_chart.get('appVersion', '')
        )
        print(out_chart)
        if name not in out_charts:
            out_charts[name] = []
        out_charts[name].append(out_chart)
    for _, repo in repos.items():
        subprocess.run(["helm", "repo", "remove", repo], check=True)
    output = yaml.dump(dict(charts=out_charts), sort_keys=False)
    print(output)
    write_charts_info(app, output)


def check_image_arch(image: str):
    print(f"- {image} ", end="")
    args = ["crane", "manifest", image]
    manifest = bash_cmd_run(args)
    if manifest is None:
        return
    manifest_dict = json.loads(manifest.stdout)
    if "manifests" not in manifest_dict:
        print(f"::warning::No manifest found for '{image}'!")
        return
    archs = []
    for item in manifest_dict['manifests']:
        archs.append(item.get('platform', {}).get('architecture', ''))
    for required_arch in ["amd64", "arm64"]:
        if required_arch not in archs:
            print(f"\n::warning::Required architecture '{required_arch}' not found for image '{image}'")
    print(f"({', '.join(archs)})")


def bash_cmd_run(args: list, check: bool = True, capture_output: bool = True, text: bool = True):
    try:
        result = subprocess.run(args, check=check, capture_output=capture_output, text=text)
        return result
    except subprocess.CalledProcessError as e:
        print(f"Running: {' '.join(args)}")
        print("Command failed!")
        print("Return code:", e.returncode)
        print("Command:", e.cmd)
        print("STDOUT:", e.stdout)
        print("STDERR:", e.stderr, file=sys.stderr)
        return None


def check_images(args: str):
    app = args.app
    example_chart = f"apps/{app}/example"
    args_build = ["helm", "dependency", "build", example_chart]
    bash_cmd_run(args_build)
    args = ["helm", "template", "chart", example_chart]
    result = bash_cmd_run(args)
    if result is None:
        return
    image_regex = r'(?:[a-zA-Z0-9\-_.]+(?:[.:][a-zA-Z0-9\-_.]+)?\/)?[a-zA-Z0-9\-_.]+(?:\/[a-zA-Z0-9\-_.]+)*(?::[a-zA-Z0-9\-_.]+)'
    matches = re.findall(r'image:\s*["\']?(' + image_regex + r')["\']?', result.stdout)
    images = sorted(set(filter(lambda x: "{{" not in x and "}}" not in x, matches)))
    if len(images) == 0:
        return
    print(f"{len(images)} images found:")
    for image in images:
        check_image_arch(image)


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Catalog charts CLI tool.',
                                        formatter_class=argparse.ArgumentDefaultsHelpFormatter)  # To show default values in help.
    subparsers = parser.add_subparsers(dest="command", required=True)

    show = subparsers.add_parser("generate", help="Generate charts from config")
    show.add_argument("app")
    show.add_argument("--rewrite-charts", "-r", action="store_true", default=False,
                      help="Rewrite existing 'charts.yaml' config")
    show.set_defaults(func=generate)

    check_upd = subparsers.add_parser("check-updates", help="Generate charts from config")
    check_upd.add_argument("app")
    check_upd.add_argument("--update-cfg", "-u", action="store_true", default=False,
                        help="Update app 'st-charts.yaml' config")
    check_upd.add_argument("--generate-charts", "-g", action="store_true", default=False,
                        help="Generate charts from updated st-charts.yaml config")
    check_upd.add_argument("--update-example", "-e", action="store_true", default=False,
                        help="Update app example file")
    check_upd.add_argument("--rewrite-charts", "-r", action="store_true", default=True,
                        help="Rewrite existing 'charts.yaml' config")
    check_upd.set_defaults(func=check_updates)

    check_images_parser = subparsers.add_parser("check-images", help="Generate charts from config")
    check_images_parser.add_argument("app")
    check_images_parser.set_defaults(func=check_images)

    args = parser.parse_args()
    args.func(args)
