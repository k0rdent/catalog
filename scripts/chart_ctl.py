import yaml
import argparse
from jinja2 import Template
import os
import subprocess
import pathlib
import re
import json
import sys
import utils
from ruyaml.scalarstring import SingleQuotedScalarString


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
    for chart in cfg['st-charts']:
        generate_app_chart(app, chart)
    generate_charts_info(app, cfg, args.rewrite_charts)


def get_last_deps(cfg: dict):
    last_deps = dict()
    for chart in cfg['st-charts']:
        last_deps[chart['dep_name']] = chart
    return last_deps


def service_template_name(chart_name: str, version: str) -> str:
    st_version = version.replace('.', '-')
    return f"{chart_name}-{st_version}"


def update_data_chart_versions(app_data: dict, updates_dict: dict) -> dict:
    st_updates = dict()
    for chart in app_data['charts']:
        if chart['name'] in updates_dict:
            if chart['versions'][0] != updates_dict[chart['name']]['version']:
                chart['versions'].insert(0,
                    SingleQuotedScalarString(updates_dict[chart['name']]['version']))
                old_st = service_template_name(chart['name'], chart['versions'][1])
                new_st = service_template_name(chart['name'], chart['versions'][0])
                st_updates[old_st] = new_st
    return st_updates


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


def update_app_data(args, updates_dict: dict):
    app_data = utils.get_app_data(args.app)
    st_updates = update_data_chart_versions(app_data, updates_dict)
    update_data_service_templates_docs(app_data, st_updates)
    if len(st_updates) > 0:
        utils.write_app_data(args.app, app_data)


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


def update_charts_cfg(args: str, updates_list: list, cfg: dict):
    if len(updates_list) > 0 and args.update_cfg:
        cfg['st-charts'].extend(updates_list)
        output = yaml.dump(cfg, sort_keys=False)
        print(output)
        write_charts_cfg(args.app, output)


def check_updates(args: str):
    cfg = read_charts_cfg(args.app, allow_return_none=True)
    if cfg is None:
        print('Charts config not found.')
        return
    last_deps = get_last_deps(cfg)
    updates_list = []
    updates_dict = {}
    for chart, data in last_deps.items():
        if not data['repository'].startswith("https"):
            print(f"Unsupported repo '{data['repository']}' to automatically check updates, skipping.")
            continue
        subprocess.run(["helm", "repo", "add", chart, data['repository']], check=True)
        subprocess.run(["helm", "repo", "update"], check=True)
        result = subprocess.run(["helm", "show", "chart", f"{chart}/{chart}"], check=True, capture_output=True, text=True)
        up_to_date_chart = yaml.safe_load(result.stdout)
        print(f"Last version found: {up_to_date_chart['version']}")
        try_ignore_prefix_v(up_to_date_chart, data['version'])
        if up_to_date_chart['version'] != data['version']:
            print(f"::warning::Update found for '{chart}': {data['version']} -> {up_to_date_chart['version']}")
            item = data.copy()
            item['version'] = up_to_date_chart['version']
            updates_list.append(item)
            updates_dict[item['name']] = item
        subprocess.run(["helm", "repo", "remove", chart], check=True)
    update_charts_cfg(args, updates_list, cfg)
    if args.generate_charts:
        generate(args)
    if args.update_data:
        update_app_data(args, updates_dict)
    if args.update_example:
        update_example_chart(args, updates_dict)


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
        result = subprocess.run(args, check=True, capture_output=True, text=True)
        up_to_date_chart = yaml.safe_load(result.stdout)
        name = up_to_date_chart['name']
        out_chart = dict(
            version=up_to_date_chart.get('version', ''),
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
    check_upd.add_argument("--update-data", "-d", action="store_true", default=False,
                        help="Update app data.yaml file")
    check_upd.add_argument("--update-example", "-e", action="store_true", default=False,
                        help="Update app example file")
    check_upd.set_defaults(func=check_updates)

    check_images_parser = subparsers.add_parser("check-images", help="Generate charts from config")
    check_images_parser.add_argument("app")
    check_images_parser.set_defaults(func=check_images)

    args = parser.parse_args()
    args.func(args)
