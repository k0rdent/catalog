import yaml
import json
from collections import defaultdict
import argparse


def show_install_cmd(args: str):
    app = args.app
    helm_config_path = f"apps/{app}/helm-values-kgst.yaml"
    helm_config = None
    with open(helm_config_path, "r", encoding='utf-8') as file:
        helm_config = yaml.safe_load(file)

    cmd_lines = []
    cmd_lines.append(f'helm upgrade --install {app} oci://ghcr.io/k0rdent/catalog/charts/kgst -n kcm-system')
    cmd_lines.append(f'    --set "helm.repository.url={helm_config['helm']['repository']['url']}"')
    if 'prefix' in helm_config:
        cmd_lines.append(f'    --set "prefix={helm_config['prefix']}"')

    for i, chart in enumerate(helm_config['helm']['charts']):
        cmd_lines.append(f'    --set "helm.charts[{i}].name={chart['name']}"')
        cmd_lines.append(f'    --set "helm.charts[{i}].version={chart['version']}"')

    print(" \\\n".join(cmd_lines))


def get_chart_data(app: str):
    chart_path = f"apps/{app}/example/Chart.yaml"
    with open(chart_path, "r", encoding='utf-8') as file:
        chart = yaml.safe_load(file)
        return chart


def chart_2_repos(chart: dict):
    """Get unique repos from chart deps"""
    
    repos = defaultdict(list)
    for dep in chart['dependencies']:
        repos[dep['repository']].append(dep)
    
    print(json.dumps(repos, indent=2))
    return repos


def install_svc_tpls(repos: dict):
    for repo in repos:
        print(repo)

def install_repos(args):
    app = args.app
    chart = get_chart_data(app)
    repos = chart_2_repos(chart)
    install_svc_tpls(repos)

parser = argparse.ArgumentParser(description='Catalog dev tool.',
                                    formatter_class=argparse.ArgumentDefaultsHelpFormatter)  # To show default values in help.
subparsers = parser.add_subparsers(dest="command", required=True)

show = subparsers.add_parser("show-install-cmd", help="Show 'kgst' install command")
show.add_argument("app")
show.set_defaults(func=show_install_cmd)

install = subparsers.add_parser("install-deps", help="Install example chart deps using 'kgst'")
install.add_argument("app")
install.set_defaults(func=install_repos)

args = parser.parse_args()
args.func(args)
