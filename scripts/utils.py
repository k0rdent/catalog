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
        service_namespace = dep.get('mcs_namespace', namespace)
        service_name = dep.get('mcs_name', dep_name)
        service = dict(
            template = get_service_template(dep_name, dep['version']),
            name = service_name,
            namespace = service_namespace
        )
        dep_index = dep.get('mcs_dep_index', None)
        if dep_index is not None:
            service['dependsOn'] = [dict(
                name=services[dep_index]['name'],
                namespace=services[dep_index]['namespace']
            )]
        if service_name in chart_values_data:
            service['values'] = ValuesClass(chart_values_data[service_name])
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
    example_folder_name = args.example_folder_name
    chart_folder = f"apps/{app}/{example_folder_name}"
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
                repo_args = f'--set "repo.spec.url={os.environ["REPO_URL"]}" --set "repo.name={chart["name"]}" '
        cmd_lines.append(f'helm upgrade --install {chart["name"]} {kgst_repo}/kgst {repo_args}--set "chart={chart["name"]}:{chart["version"]}" -n kcm-system')
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


def get_example_chart(app: str, example_folder_name: str) -> dict:
    chart_path = f"apps/{app}/{example_folder_name}/Chart.yaml"
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
    example_folder_name = args.example_folder_name
    chart_dict = get_example_chart(app, example_folder_name)
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


def try_add_charts_data(app: str, metadata: dict):
    app_path = os.path.join('apps', app)
    charts_file = os.path.join(app_path, 'charts', 'charts.yaml')
    if not os.path.exists(charts_file):
        return
    if 'charts' in metadata:
        raise Exception(f'Mixed "charts" info in data.yaml and charts.yaml ({app})')
    with open(charts_file, 'r', encoding='utf-8') as f:
        charts_dict = yaml.safe_load(f.read())
        charts_versions = []
        for chart_name, chart_versions_arr in charts_dict['charts'].items():
            versions = []
            appVersions = []
            for chart in reversed(chart_versions_arr):
                versions.append(chart['version'])
                appVersions.append(chart['appVersion'])
            charts_versions.append(dict(name=chart_name, versions=versions, appVersions=appVersions))
        metadata['charts'] = charts_versions


def version2template_names(version: str) -> dict:
    # python3 ./scripts/find_cluster_templates.py ../kcm/templates/provider/kcm-templates/files/templates
    mapping = {
        "v0.1.0": {"adopted_cluster":"adopted-cluster-0-1-0","aws_eks":"aws-eks-0-1-0","aws_hosted_cp":"aws-hosted-cp-0-1-0","aws_standalone_cp":"aws-standalone-cp-0-1-0","azure_aks":"azure-aks-0-1-0","azure_hosted_cp":"azure-hosted-cp-0-1-0","azure_standalone_cp":"azure-standalone-cp-0-1-0","openstack_standalone_cp":"openstack-standalone-cp-0-1-0","vsphere_hosted_cp":"vsphere-hosted-cp-0-1-0","vsphere_standalone_cp":"vsphere-standalone-cp-0-1-0"},
        "v0.2.0": {"adopted_cluster":"adopted-cluster-0-2-0","aws_eks":"aws-eks-0-2-0","aws_hosted_cp":"aws-hosted-cp-0-2-0","aws_standalone_cp":"aws-standalone-cp-0-2-0","azure_aks":"azure-aks-0-2-0","azure_hosted_cp":"azure-hosted-cp-0-2-0","azure_standalone_cp":"azure-standalone-cp-0-2-0","docker_hosted_cp":"docker-hosted-cp-0-2-0","gcp_gke":"gcp-gke-0-2-0","gcp_hosted_cp":"gcp-hosted-cp-0-2-0","gcp_standalone_cp":"gcp-standalone-cp-0-2-0","openstack_standalone_cp":"openstack-standalone-cp-0-2-0","remote_cluster":"remote-cluster-0-2-0","vsphere_hosted_cp":"vsphere-hosted-cp-0-2-0","vsphere_standalone_cp":"vsphere-standalone-cp-0-2-0"},
        "v0.3.0": {"adopted_cluster":"adopted-cluster-0-2-0","aws_eks":"aws-eks-0-2-0","aws_hosted_cp":"aws-hosted-cp-0-2-1","aws_standalone_cp":"aws-standalone-cp-0-2-1","azure_aks":"azure-aks-0-2-0","azure_hosted_cp":"azure-hosted-cp-0-2-2","azure_standalone_cp":"azure-standalone-cp-0-2-2","docker_hosted_cp":"docker-hosted-cp-0-2-0","gcp_gke":"gcp-gke-0-2-0","gcp_hosted_cp":"gcp-hosted-cp-0-2-1","gcp_standalone_cp":"gcp-standalone-cp-0-2-1","openstack_standalone_cp":"openstack-standalone-cp-0-2-2","remote_cluster":"remote-cluster-0-2-1","vsphere_hosted_cp":"vsphere-hosted-cp-0-2-1","vsphere_standalone_cp":"vsphere-standalone-cp-0-2-1"},
        "v1.0.0": {"adopted_cluster":"adopted-cluster-1-0-0","aws_eks":"aws-eks-1-0-0","aws_hosted_cp":"aws-hosted-cp-1-0-0","aws_standalone_cp":"aws-standalone-cp-1-0-0","azure_aks":"azure-aks-1-0-0","azure_hosted_cp":"azure-hosted-cp-1-0-0","azure_standalone_cp":"azure-standalone-cp-1-0-0","docker_hosted_cp":"docker-hosted-cp-1-0-0","gcp_gke":"gcp-gke-1-0-0","gcp_hosted_cp":"gcp-hosted-cp-1-0-0","gcp_standalone_cp":"gcp-standalone-cp-1-0-0","openstack_standalone_cp":"openstack-standalone-cp-1-0-0","remote_cluster":"remote-cluster-1-0-0","vsphere_hosted_cp":"vsphere-hosted-cp-1-0-0","vsphere_standalone_cp":"vsphere-standalone-cp-1-0-0"},
        "v1.1.0": {"adopted_cluster":"adopted-cluster-1-0-1","aws_eks":"aws-eks-1-0-2","aws_hosted_cp":"aws-hosted-cp-1-0-9","aws_standalone_cp":"aws-standalone-cp-1-0-10","azure_aks":"azure-aks-1-0-1","azure_hosted_cp":"azure-hosted-cp-1-0-8","azure_standalone_cp":"azure-standalone-cp-1-0-8","docker_hosted_cp":"docker-hosted-cp-1-0-2","gcp_gke":"gcp-gke-1-0-3","gcp_hosted_cp":"gcp-hosted-cp-1-0-9","gcp_standalone_cp":"gcp-standalone-cp-1-0-9","openstack_standalone_cp":"openstack-standalone-cp-1-0-9","remote_cluster":"remote-cluster-1-0-8","vsphere_hosted_cp":"vsphere-hosted-cp-1-0-8","vsphere_standalone_cp":"vsphere-standalone-cp-1-0-9"},
        "v1.1.1": {"adopted_cluster":"adopted-cluster-1-0-1","aws_eks":"aws-eks-1-0-2","aws_hosted_cp":"aws-hosted-cp-1-0-9","aws_standalone_cp":"aws-standalone-cp-1-0-10","azure_aks":"azure-aks-1-0-1","azure_hosted_cp":"azure-hosted-cp-1-0-8","azure_standalone_cp":"azure-standalone-cp-1-0-8","docker_hosted_cp":"docker-hosted-cp-1-0-2","gcp_gke":"gcp-gke-1-0-3","gcp_hosted_cp":"gcp-hosted-cp-1-0-9","gcp_standalone_cp":"gcp-standalone-cp-1-0-9","openstack_standalone_cp":"openstack-standalone-cp-1-0-9","remote_cluster":"remote-cluster-1-0-8","vsphere_hosted_cp":"vsphere-hosted-cp-1-0-8","vsphere_standalone_cp":"vsphere-standalone-cp-1-0-9"},
        "v1.2.0": {"adopted_cluster":"adopted-cluster-1-0-1","aws_eks":"aws-eks-1-0-3","aws_hosted_cp":"aws-hosted-cp-1-0-12","aws_standalone_cp":"aws-standalone-cp-1-0-12","azure_aks":"azure-aks-1-0-1","azure_hosted_cp":"azure-hosted-cp-1-0-14","azure_standalone_cp":"azure-standalone-cp-1-0-13","docker_hosted_cp":"docker-hosted-cp-1-0-2","gcp_gke":"gcp-gke-1-0-4","gcp_hosted_cp":"gcp-hosted-cp-1-0-14","gcp_standalone_cp":"gcp-standalone-cp-1-0-12","openstack_hosted_cp":"openstack-hosted-cp-1-0-3","openstack_standalone_cp":"openstack-standalone-cp-1-0-13","remote_cluster":"remote-cluster-1-0-12","vsphere_hosted_cp":"vsphere-hosted-cp-1-0-11","vsphere_standalone_cp":"vsphere-standalone-cp-1-0-11"},
        "v1.3.1": {"adopted_cluster":"adopted-cluster-1-0-1","aws_eks":"aws-eks-1-0-3","aws_hosted_cp":"aws-hosted-cp-1-0-13","aws_standalone_cp":"aws-standalone-cp-1-0-12","azure_aks":"azure-aks-1-0-1","azure_hosted_cp":"azure-hosted-cp-1-0-16","azure_standalone_cp":"azure-standalone-cp-1-0-13","docker_hosted_cp":"docker-hosted-cp-1-0-2","gcp_gke":"gcp-gke-1-0-4","gcp_hosted_cp":"gcp-hosted-cp-1-0-14","gcp_standalone_cp":"gcp-standalone-cp-1-0-12","openstack_hosted_cp":"openstack-hosted-cp-1-0-5","openstack_standalone_cp":"openstack-standalone-cp-1-0-15","remote_cluster":"remote-cluster-1-0-13","vsphere_hosted_cp":"vsphere-hosted-cp-1-0-12","vsphere_standalone_cp":"vsphere-standalone-cp-1-0-11"},
        "v1.4.0": {"adopted_cluster":"adopted-cluster-1-0-1","aws_eks":"aws-eks-1-0-3","aws_hosted_cp":"aws-hosted-cp-1-0-14","aws_standalone_cp":"aws-standalone-cp-1-0-14","azure_aks":"azure-aks-1-0-1","azure_hosted_cp":"azure-hosted-cp-1-0-17","azure_standalone_cp":"azure-standalone-cp-1-0-15","docker_hosted_cp":"docker-hosted-cp-1-0-2","gcp_gke":"gcp-gke-1-0-5","gcp_hosted_cp":"gcp-hosted-cp-1-0-15","gcp_standalone_cp":"gcp-standalone-cp-1-0-14","openstack_hosted_cp":"openstack-hosted-cp-1-0-6","openstack_standalone_cp":"openstack-standalone-cp-1-0-16","remote_cluster":"remote-cluster-1-0-14","vsphere_hosted_cp":"vsphere-hosted-cp-1-0-13","vsphere_standalone_cp":"vsphere-standalone-cp-1-0-13"},
        "v1.5.0": {"adopted_cluster":"adopted-cluster-1-0-1","aws_eks":"aws-eks-1-0-3","aws_hosted_cp":"aws-hosted-cp-1-0-16","aws_standalone_cp":"aws-standalone-cp-1-0-16","azure_aks":"azure-aks-1-0-1","azure_hosted_cp":"azure-hosted-cp-1-0-19","azure_standalone_cp":"azure-standalone-cp-1-0-17","docker_hosted_cp":"docker-hosted-cp-1-0-4","gcp_gke":"gcp-gke-1-0-6","gcp_hosted_cp":"gcp-hosted-cp-1-0-16","gcp_standalone_cp":"gcp-standalone-cp-1-0-15","openstack_hosted_cp":"openstack-hosted-cp-1-0-7","openstack_standalone_cp":"openstack-standalone-cp-1-0-17","remote_cluster":"remote-cluster-1-0-15","vsphere_hosted_cp":"vsphere-hosted-cp-1-0-15","vsphere_standalone_cp":"vsphere-standalone-cp-1-0-15"},
        "v1.6.0": {"adopted_cluster":"adopted-cluster-1-0-1","aws_eks":"aws-eks-1-0-4","aws_hosted_cp":"aws-hosted-cp-1-0-21","aws_standalone_cp":"aws-standalone-cp-1-0-20","azure_aks":"azure-aks-1-0-2","azure_hosted_cp":"azure-hosted-cp-1-0-23","azure_standalone_cp":"azure-standalone-cp-1-0-20","docker_hosted_cp":"docker-hosted-cp-1-0-4","gcp_gke":"gcp-gke-1-0-7","gcp_hosted_cp":"gcp-hosted-cp-1-0-20","gcp_standalone_cp":"gcp-standalone-cp-1-0-18","openstack_hosted_cp":"openstack-hosted-cp-1-0-13","openstack_standalone_cp":"openstack-standalone-cp-1-0-22","remote_cluster":"remote-cluster-1-0-19","vsphere_hosted_cp":"vsphere-hosted-cp-1-0-19","vsphere_standalone_cp":"vsphere-standalone-cp-1-0-18"},
        "v1.7.0": {"adopted_cluster":"adopted-cluster-1-0-1","aws_eks":"aws-eks-1-0-4","aws_hosted_cp":"aws-hosted-cp-1-0-21","aws_standalone_cp":"aws-standalone-cp-1-0-20","azure_aks":"azure-aks-1-0-2","azure_hosted_cp":"azure-hosted-cp-1-0-23","azure_standalone_cp":"azure-standalone-cp-1-0-20","docker_hosted_cp":"docker-hosted-cp-1-0-4","gcp_gke":"gcp-gke-1-0-7","gcp_hosted_cp":"gcp-hosted-cp-1-0-20","gcp_standalone_cp":"gcp-standalone-cp-1-0-18","kubevirt_hosted_cp":"kubevirt-hosted-cp-1-0-1","kubevirt_standalone_cp":"kubevirt-standalone-cp-1-0-1","openstack_hosted_cp":"openstack-hosted-cp-1-0-13","openstack_standalone_cp":"openstack-standalone-cp-1-0-22","remote_cluster":"remote-cluster-1-0-19","vsphere_hosted_cp":"vsphere-hosted-cp-1-0-19","vsphere_standalone_cp":"vsphere-standalone-cp-1-0-18"},
        "v1.8.0": {"adopted_cluster":"adopted-cluster-1-0-1","aws_eks":"aws-eks-1-0-6","aws_hosted_cp":"aws-hosted-cp-1-0-24","aws_standalone_cp":"aws-standalone-cp-1-0-23","azure_aks":"azure-aks-1-0-4","azure_hosted_cp":"azure-hosted-cp-1-0-26","azure_standalone_cp":"azure-standalone-cp-1-0-23","docker_hosted_cp":"docker-hosted-cp-1-0-5","gcp_gke":"gcp-gke-1-0-8","gcp_hosted_cp":"gcp-hosted-cp-1-0-23","gcp_standalone_cp":"gcp-standalone-cp-1-0-21","kubevirt_hosted_cp":"kubevirt-hosted-cp-1-0-4","kubevirt_standalone_cp":"kubevirt-standalone-cp-1-0-4","openstack_hosted_cp":"openstack-hosted-cp-1-0-16","openstack_standalone_cp":"openstack-standalone-cp-1-0-25","remote_cluster":"remote-cluster-1-0-22","vsphere_hosted_cp":"vsphere-hosted-cp-1-0-22","vsphere_standalone_cp":"vsphere-standalone-cp-1-0-21"},
    }
    if version not in mapping:
        raise Exception(f"Unsupported version '{version}' found")
    return mapping[version]


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Catalog dev tool.',
                                        formatter_class=argparse.ArgumentDefaultsHelpFormatter)  # To show default values in help.
    subparsers = parser.add_subparsers(dest="command", required=True)

    render = subparsers.add_parser("render-mcs", help="Render MultiClusterService using app example chart")
    render.add_argument("--example-folder-name", "-e", help="Example folder name (default: example)", required=True,
                        default="example")
    render.add_argument("app")
    render.set_defaults(func=render_mcs)

    install = subparsers.add_parser("install-servicetemplates", help="Install app example service templates")
    install.add_argument("app")
    install.add_argument("--example-folder-name", "-e", help="Example folder name (default: example)", required=True,
                         default="example")
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
