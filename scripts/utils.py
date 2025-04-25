import yaml
from collections import defaultdict
import argparse
from jinja2 import Template
import textwrap
import os

mcs_tpl = """
apiVersion: k0rdent.mirantis.com/v1alpha1
kind: MultiClusterService
metadata:
  name: {{ app }}
spec:
  clusterSelector:
    matchLabels:
      group: demo
  serviceSpec:
    services:
    {{ services | replace("\n", "\n    ") }}
"""

class ValuesClass:
    """Dump service values string using | notation"""

    def __init__(self, lines: list):
        self.s = textwrap.dedent("\n".join(lines))


def representer(dumper, data):
    return dumper.represent_scalar('tag:yaml.org,2002:str', data.s, style="|")


yaml.add_representer(ValuesClass, representer)


def get_service_template(name: str, version: str) -> str:
    template_version = str.replace(version, '.', '-')
    return f"{name}-{template_version}"


def get_mcs_services(namespace: str, chart_data: dict, chart_values_data: dict):
    deps = chart_data['dependencies']
    services = []
    for dep in deps:
        dep_name = dep['name']
        service = dict(
            template = get_service_template(dep_name, dep['version']),
            name = dep_name,
            namespace = namespace
        )
        if dep_name in chart_values_data:
            service['values'] = ValuesClass(chart_values_data[dep_name])
        services.append(service)
    return yaml.dump(services, sort_keys=False, default_flow_style=False)


def render_mcs_template(app: str):
    template = Template(mcs_tpl)
    chart_data = get_chart_data(app)
    chart_values_data = get_chart_values_data(app)
    app_data = get_app_data(app)
    namespace = app_data.get('test_namespace', app)
    mcs_services = get_mcs_services(namespace, chart_data, chart_values_data)
    data = {"app": app, "services": mcs_services}
    rendered = template.render(data).strip() + "\n"
    return rendered


def render_mcs(args):
    app = args.app
    output = render_mcs_template(app)
    print(output)
    with open(f"apps/{app}/mcs.yaml", "w", encoding='utf-8') as file:
        file.write(output)


def get_servicetemplate_install_cmd(repo: str, charts: list) -> str:
    cmd_lines = []
    for chart in charts:
        cmd_lines.append(f'helm install {chart['name']} {repo}/{chart['name']}-service-template \\')
        cmd_lines.append(f'  --version {chart['version']} -n kcm-system')
    cmd = "\n".join(cmd_lines)
    return cmd


def get_app_data(app: str) -> dict:
    app_data_path = f"apps/{app}/data.yaml"
    with open(app_data_path, "r", encoding='utf-8') as file:
        app_data = yaml.safe_load(file)
        return app_data


def get_chart_data(app: str) -> dict:
    chart_path = f"apps/{app}/example/Chart.yaml"
    with open(chart_path, "r", encoding='utf-8') as file:
        chart = yaml.safe_load(file)
        return chart


def get_chart_values_data(app: str) -> dict:
    chart_values_path = f"apps/{app}/example/values.yaml"
    with open(chart_values_path, "r", encoding='utf-8') as file:
        deps = [dep for dep in yaml.safe_load(file) or []]
        if not deps:
            return dict()
        file.seek(0)
        dep = ""
        i_next = 0
        values_lines = dict()
        for line in file.read().split('\n'):
            if len(deps) > i_next and str.startswith(line, f"{deps[i_next]}:"):
                dep = deps[i_next]
                values_lines[dep] = []
                i_next += 1
            else:
                values_lines[dep].append(line)
        return values_lines


def chart_2_repos(chart: dict) -> dict:
    """Get unique repos from chart deps"""
    
    repos = defaultdict(list)
    for dep in chart['dependencies']:
        repos[dep['repository']].append(dep)

    return repos


def install_servicetemplates(args):
    app = args.app
    chart = get_chart_data(app)
    repos = chart_2_repos(chart)
    for repo in repos:
        charts = repos[repo]
        cmd = get_servicetemplate_install_cmd(repo, charts)
        print(cmd)


def print_test_vars(args):
    app = args.app
    app_data = get_app_data(app)
    test_install_servicetemplates = str(app_data.get('test_install_servicetemplates', True)).lower()
    print(f"INSTALL_SERVICETEMPLATES={test_install_servicetemplates}")
    test_deploy_chart = str(app_data.get('test_deploy_chart', True)).lower()
    print(f"DEPLOY_CHART={test_deploy_chart}")
    test_deploy_multiclusterservice = str(app_data.get('test_deploy_multiclusterservice', True)).lower()
    print(f"DEPLOY_MULTICLUSTERSERVICE={test_deploy_multiclusterservice}")


def get_wait_for_pods(args):
    app = args.app
    app_data = get_app_data(app)
    if 'test_wait_for_pods' in app_data:
        print(f"{app_data['test_wait_for_pods']}")


parser = argparse.ArgumentParser(description='Catalog dev tool.',
                                    formatter_class=argparse.ArgumentDefaultsHelpFormatter)  # To show default values in help.
subparsers = parser.add_subparsers(dest="command", required=True)

install = subparsers.add_parser("render-mcs", help="Render MultiClusterService using app example chart")
install.add_argument("app")
install.set_defaults(func=render_mcs)

install = subparsers.add_parser("install-servicetemplates", help="Install app example service templates")
install.add_argument("app")
install.set_defaults(func=install_servicetemplates)

install = subparsers.add_parser("print-test-vars", help="Print testing env vars values")
install.add_argument("app")
install.set_defaults(func=print_test_vars)

install = subparsers.add_parser("get-wait-for-pods", help="Print WAIT_FOR_PODS value")
install.add_argument("app")
install.set_defaults(func=get_wait_for_pods)

args = parser.parse_args()
args.func(args)
