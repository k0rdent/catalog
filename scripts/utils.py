import yaml
from collections import defaultdict
import argparse
from jinja2 import Template
import textwrap
import os
import ruyaml
import sys

mcs_tpl = """
apiVersion: k0rdent.mirantis.com/v1beta1
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


def chart_2_mcs_str(chart_dict: dict, chart_folder: str, app_name: str, app_metadata: dict):
    template = Template(mcs_tpl)
    chart_values_data = get_chart_values_data(chart_folder)
    print(f"Chart folder: {chart_folder}")
    namespace = app_metadata.get('test_namespace', app_name)
    mcs_services = get_mcs_services(namespace, chart_dict, chart_values_data)
    data = {"app": app_name, "services": mcs_services}
    rendered = template.render(data).strip() + "\n"
    return rendered


def render_mcs(args):
    app = args.app
    chart_folder = f"apps/{app}/example"
    chart_dict = read_yaml_file(f"{chart_folder}/Chart.yaml")
    app_metadata = get_app_data(app)
    output = chart_2_mcs_str(chart_dict, chart_folder, app, app_metadata)
    print(output)
    with open(f"apps/{app}/mcs.yaml", "w", encoding='utf-8') as file:
        file.write(output)


def get_servicetemplate_install_cmd(repo: str, charts: list) -> str:
    cmd_lines = []
    for chart in charts:
        repo_args = ""
        kgst_repo = repo
        if repo != "oci://registry.mirantis.com/k0rdent-enterprise-catalog":
            kgst_repo = "oci://ghcr.io/k0rdent/catalog/charts"
            if 'REPO_URL' in os.environ:
                repo_args = f'--set "repo.spec.url={os.environ['REPO_URL']}" --set "repo.name={chart['name']}" '
        cmd_lines.append(f'helm upgrade --install {chart['name']} {kgst_repo}/kgst {repo_args}--set "chart={chart['name']}:{chart['version']}" -n kcm-system')
    cmd = "\n".join(cmd_lines)
    return cmd


def init_ruyaml():
    yml = ruyaml.YAML()
    yml.preserve_quotes = True
    yml.indent(mapping=4, sequence=4, offset=2)
    yml.width = 10000
    return yml


def get_app_data(app: str) -> dict:
    app_data_path = f"apps/{app}/data.yaml"
    app_data = read_yaml_file(app_data_path)
    return app_data


def write_app_data(app: str, ruyaml_dict: dict) -> dict:
    app_data_path = f"apps/{app}/data.yaml"
    with open(app_data_path, "w", encoding='utf-8') as file:
        yml = init_ruyaml()
        yml.dump(ruyaml_dict, file)
        yml.dump(ruyaml_dict, sys.stdout)


def get_example_chart(app: str) -> dict:
    chart_path = f"apps/{app}/example/Chart.yaml"
    chart_dict = read_yaml_file(chart_path)
    return chart_dict


def read_yaml_file(yaml_file_path: str) -> dict:
    with open(yaml_file_path, "r", encoding='utf-8') as file:
        yml = init_ruyaml()
        chart = yml.load(file)
        return chart


def write_example_chart(app: str, ruyaml_dict: dict) -> dict:
    chart_path = f"apps/{app}/example/Chart.yaml"
    with open(chart_path, "w", encoding='utf-8') as file:
        yml = init_ruyaml()
        yml.dump(ruyaml_dict, file)
        yml.dump(ruyaml_dict, sys.stdout)


def get_chart_values_data(chart_folder: str) -> dict:
    chart_values_path = f"{chart_folder}/values.yaml"
    if not os.path.exists(chart_values_path):
        return dict()
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
    chart_dict = get_example_chart(app)
    repos = chart_2_repos(chart_dict)
    for repo in repos:
        charts = repos[repo]
        cmd = get_servicetemplate_install_cmd(repo, charts)
        print(cmd)


def chart_2_install_code(chart_dict: dict) -> str:
    repos = chart_2_repos(chart_dict)
    output = ""
    for repo in repos:
        charts = repos[repo]
        cmd = get_servicetemplate_install_cmd(repo, charts)
        output += f"~~~bash\n{cmd}\n~~~\n"
    return output


def chart_2_deploy_code(chart_dict: dict, chart_folder: str, app_name: str, app_metadata: dict):
    mcs = chart_2_mcs_str(chart_dict, chart_folder, app_name, app_metadata)
    output = f"~~~yaml\n{mcs}\n~~~\n"
    return output


def charts_2_verify_code(charts: list) -> str:
    verify_code_lines = ['~~~bash']
    verify_code_lines.append('kubectl get servicetemplates -A')
    verify_code_lines.append('# NAMESPACE    NAME                            VALID')
    for chart in charts:
        template_name = f"{chart['name']}-{chart['version'].replace('.', '-')}".ljust(32)
        verify_code_lines.append(f"# kcm-system   {template_name}true")
    verify_code_lines.append('~~~')
    cmd = '\n'.join(verify_code_lines)
    return cmd


def print_test_vars(args):
    app = args.app
    app_data = get_app_data(app)
    default = True
    if app_data.get('type', 'app') == 'infra':
        default = False
    test_install_servicetemplates = str(app_data.get('test_install_servicetemplates', default)).lower()
    print(f"INSTALL_SERVICETEMPLATES={test_install_servicetemplates}")
    test_deploy_chart = str(app_data.get('test_deploy_chart', False)).lower()
    print(f"DEPLOY_CHART={test_deploy_chart}")
    test_deploy_multiclusterservice = str(app_data.get('test_deploy_multiclusterservice', default)).lower()
    print(f"DEPLOY_MULTICLUSTERSERVICE={test_deploy_multiclusterservice}")
    test_check_images = str(app_data.get('test_check_images', default)).lower()
    print(f"CHECK_IMAGES={test_check_images}")
    test_check_images_args = app_data.get('test_check_images_args', '')
    print(f"CHECK_IMAGES_ARGS={test_check_images_args}")


def get_wait_for_pods(args):
    app = args.app
    app_data = get_app_data(app)
    if 'test_wait_for_pods' in app_data:
        print(f"{app_data['test_wait_for_pods']}")


def get_wait_for_running(args):
    app = args.app
    app_data = get_app_data(app)
    if 'test_wait_for_running' in app_data:
        print(f"{app_data['test_wait_for_running']}".lower())


def get_wait_for_creating(args):
    app = args.app
    app_data = get_app_data(app)
    if 'test_wait_for_creating' in app_data:
        print(f"{app_data['test_wait_for_creating']}".lower())


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Catalog dev tool.',
                                        formatter_class=argparse.ArgumentDefaultsHelpFormatter)  # To show default values in help.
    subparsers = parser.add_subparsers(dest="command", required=True)

    render = subparsers.add_parser("render-mcs", help="Render MultiClusterService using app example chart")
    render.add_argument("app")
    render.set_defaults(func=render_mcs)

    install = subparsers.add_parser("install-servicetemplates", help="Install app example service templates")
    install.add_argument("app")
    install.set_defaults(func=install_servicetemplates)

    print_vars = subparsers.add_parser("print-test-vars", help="Print testing env vars values")
    print_vars.add_argument("app")
    print_vars.set_defaults(func=print_test_vars)

    get_pods = subparsers.add_parser("get-wait-for-pods", help="Print WAIT_FOR_PODS value")
    get_pods.add_argument("app")
    get_pods.set_defaults(func=get_wait_for_pods)

    get_running = subparsers.add_parser("get-wait-for-running", help="Print WAIT_FOR_RUNNING value")
    get_running.add_argument("app")
    get_running.set_defaults(func=get_wait_for_running)

    get_creating = subparsers.add_parser("get-wait-for-creating", help="Print WAIT_FOR_RUNNING value")
    get_creating.add_argument("app")
    get_creating.set_defaults(func=get_wait_for_creating)

    args = parser.parse_args()
    args.func(args)
