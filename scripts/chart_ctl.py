import yaml
import argparse
from jinja2 import Template
import os
import subprocess
import pathlib
import re
import json
import sys


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


def write_charts_cfg(app: str, s: str) -> dict:
    helm_config_path = f"apps/{app}/charts/st-charts.yaml"
    with open(helm_config_path, "w", encoding='utf-8') as file:
        file.write(s)


def generate_charts(app: str, cfg: dict):
    generate_app_chart(app, cfg)


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
    if cfg.get('service_template_only', False):
        return
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
    for chart in cfg['st-charts']:
        generate_charts(app, chart)


def get_last_deps(cfg: dict):
    last_deps = dict()
    for chart in cfg['st-charts']:
        last_deps[chart['dep_name']] = chart
    return last_deps


def check_updates(args: str):
    app = args.app
    update_cfg = args.update_cfg
    cfg = read_charts_cfg(app, allow_return_none=True)
    if cfg is None:
        print('Charts config not found.')
        return
    last_deps = get_last_deps(cfg)
    updates = []
    for chart, data in last_deps.items():
        if not data['repository'].startswith("https"):
            print(f"Unsupported repo '{data['repository']}' to automatically check updates, skipping.")
            continue
        subprocess.run(["helm", "repo", "add", chart, data['repository']], check=True)
        subprocess.run(["helm", "repo", "update"], check=True)
        result = subprocess.run(["helm", "show", "chart", f"{chart}/{chart}"], check=True, capture_output=True, text=True)
        up_to_date_chart = yaml.safe_load(result.stdout)
        print(f"Last version found: {up_to_date_chart['version']}")
        if up_to_date_chart['version'] != data['version']:
            print(f"::warning::Update found for '{chart}': {data['version']} -> {up_to_date_chart['version']}")
            item = data.copy()
            item['version'] = up_to_date_chart['version']
            updates.append(item)
        subprocess.run(["helm", "repo", "remove", chart], check=True)
    if len(updates) > 0 and update_cfg:
        cfg['st-charts'].extend(updates)
        output = yaml.dump(cfg, sort_keys=False)
        print(output)
        write_charts_cfg(app, output)


def check_image_arch(image: str):
    print(f"- {image} ", end="")
    manifest = subprocess.run(["crane", "manifest", image], check=True, capture_output=True, text=True)
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
    print(f"({", ".join(archs)})")


def check_images(args: str):
    app = args.app
    cfg = read_charts_cfg(app, allow_return_none=True)
    if cfg is None:
        print('Charts config not found.')
        return
    chart = cfg['st-charts'][-1]
    check_image_args = os.getenv("CHECK_IMAGES_ARGS", '')
    repo_url = os.environ.get('REPO_URL', "oci://ghcr.io/k0rdent/catalog/charts")
    args = ["helm", "template", "chart", f"{repo_url}/{chart['name']}", "--version", chart['version']]
    if check_image_args != '':
        args.extend(check_image_args.split(' '))
    print(f"Run: {' '.join(args)}")
    try:
        result = subprocess.run(args, check=True, capture_output=True, text=True)
    except subprocess.CalledProcessError as e:
        print("Command failed!")
        print("Return code:", e.returncode)
        print("Command:", e.cmd)
        print("STDOUT:", e.stdout)
        print("STDERR:", e.stderr, file=sys.stderr)
    image_regex = r'(?:[a-zA-Z0-9\-_.]+(?:[.:][a-zA-Z0-9\-_.]+)?\/)?[a-zA-Z0-9\-_.]+(?:\/[a-zA-Z0-9\-_.]+)*(?::[a-zA-Z0-9\-_.]+)'
    matches = re.findall(r'image:\s*["\']?(' + image_regex + r')["\']?', result.stdout)
    images = sorted(set(filter(lambda x: "{{" not in x and "}}" not in x, matches)))
    if len(images) == 0:
        return
    print(f"{len(images)} images found:")
    for image in images:
        check_image_arch(image)


parser = argparse.ArgumentParser(description='Catalog charts CLI tool.',
                                    formatter_class=argparse.ArgumentDefaultsHelpFormatter)  # To show default values in help.
subparsers = parser.add_subparsers(dest="command", required=True)

show = subparsers.add_parser("generate", help="Generate charts from config")
show.add_argument("app")
show.set_defaults(func=generate)

check_upd = subparsers.add_parser("check-updates", help="Generate charts from config")
check_upd.add_argument("app")
check_upd.add_argument("--update-cfg", "-u", action="store_true", default=False,
                    help="Update app 'st-charts.yaml' config")
check_upd.set_defaults(func=check_updates)

check_images_parser = subparsers.add_parser("check-images", help="Generate charts from config")
check_images_parser.add_argument("app")
check_images_parser.set_defaults(func=check_images)

args = parser.parse_args()
args.func(args)
