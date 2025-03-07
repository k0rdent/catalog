import yaml
from collections import defaultdict
import argparse


def get_install_cmd(release: str, repo: str, prefix: str | None, charts: list) -> str:
    cmd_lines = []
    cmd_lines.append(f'helm upgrade --install {release} oci://ghcr.io/k0rdent/catalog/charts/kgst -n kcm-system')
    cmd_lines.append(f'    --set "helm.repository.url={repo}"')
    if prefix:
        cmd_lines.append(f'    --set "prefix={prefix}"')

    for i, chart in enumerate(charts):
        cmd_lines.append(f'    --set "helm.charts[{i}].name={chart['name']}"')
        cmd_lines.append(f'    --set "helm.charts[{i}].version={chart['version']}"')

    cmd = " \\\n".join(cmd_lines)
    return cmd


def show_install_cmd(args: str):
    app = args.app
    helm_config_path = f"apps/{app}/helm-values-kgst.yaml"
    helm_config = None
    with open(helm_config_path, "r", encoding='utf-8') as file:
        helm_config = yaml.safe_load(file)

    repo = helm_config['helm']['repository']['url']
    prefix = helm_config.get('prefix')
    charts = helm_config['helm']['charts']
    cmd = get_install_cmd(repo, prefix, charts)
    print(cmd)


def get_chart_data(app: str) -> dict:
    chart_path = f"apps/{app}/example/Chart.yaml"
    with open(chart_path, "r", encoding='utf-8') as file:
        chart = yaml.safe_load(file)
        return chart


def chart_2_repos(chart: dict) -> dict:
    """Get unique repos from chart deps"""
    
    repos = defaultdict(list)
    for dep in chart['dependencies']:
        repos[dep['repository']].append(dep)

    return repos


def kgst_install_deps(args):
    app = args.app
    chart = get_chart_data(app)
    repos = chart_2_repos(chart)
    for repo in repos:
        charts = repos[repo]
        release = charts[0]['name']
        cmd = get_install_cmd(release, repo, None, charts)
        print(cmd)


parser = argparse.ArgumentParser(description='Catalog dev tool.',
                                    formatter_class=argparse.ArgumentDefaultsHelpFormatter)  # To show default values in help.
subparsers = parser.add_subparsers(dest="command", required=True)

show = subparsers.add_parser("show-install-cmd", help="Show 'kgst' install command")
show.add_argument("app")
show.set_defaults(func=show_install_cmd)

install = subparsers.add_parser("kgst-install-deps", help="Install example chart deps using 'kgst'")
install.add_argument("app")
install.set_defaults(func=kgst_install_deps)

args = parser.parse_args()
args.func(args)
