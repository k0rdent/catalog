import yaml
import argparse
from jinja2 import Template
import os
import subprocess
import pathlib


chart_app_tpl = """apiVersion: v2
name: {{ name }}
description: A Helm chart to refer the official "{{ name }}" helm chart
type: application
version: {{ version }}
dependencies:
{%- for dep in dependencies %}
  - name: {{ dep.name }}
    version: {{ dep.version }}
    repository: {{ dep.repository }}
{% endfor %}
"""

chart_st_tpl = """apiVersion: v2
name: {{ name }}-service-template
description: k0rdent service template for "{{ name }}"
type: application
version: {{ version }}
dependencies:
  - name: k0rdent-catalog
    version: 1.0.0
    repository: oci://ghcr.io/k0rdent/catalog/charts

"""

st_tpl = """apiVersion: k0rdent.mirantis.com/v1alpha1
kind: ServiceTemplate
metadata:
  name: {{ name }}-{{ version | replace(".", "-") }}
  annotations:
    helm.sh/resource-policy: keep
spec:
  helm:
    chartSpec:
      chart: {{ name }}
      version: {{ version }}
      interval: 10m0s
      sourceRef:
        kind: HelmRepository
        name: k0rdent-catalog

"""

def read_charts_cfg(app: str) -> dict:
    helm_config_path = f"apps/{app}/charts/st-charts.yaml"
    if not os.path.exists(helm_config_path):
        raise Exception(f"{helm_config_path} file not found")
    with open(helm_config_path, "r", encoding='utf-8') as file:
        cfg = yaml.safe_load(file)
    return cfg


def generate_charts(app: str, cfg: dict):
    generate_app_chart(app, cfg)
    generate_st_chart(app, cfg)


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


def generate_st_chart(app: str, cfg: dict):
    folder_path = try_create_chart_folders(app, f"{cfg['name']}-service-template",
                                           cfg['version'], True)
    chart = Template(chart_st_tpl).render(**cfg)
    with open(f"{folder_path}/Chart.yaml", "w", encoding='utf-8') as f:
        f.write(chart)
    st = Template(st_tpl).render(**cfg)
    with open(f"{folder_path}/templates/service-template.yaml", "w", encoding='utf-8') as f:
        f.write(st)
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


parser = argparse.ArgumentParser(description='Catalog charts CLI tool.',
                                    formatter_class=argparse.ArgumentDefaultsHelpFormatter)  # To show default values in help.
subparsers = parser.add_subparsers(dest="command", required=True)

show = subparsers.add_parser("generate", help="Generate charts from config")
show.add_argument("app")
show.set_defaults(func=generate)

args = parser.parse_args()
args.func(args)
