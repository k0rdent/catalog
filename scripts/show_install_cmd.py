import os
import yaml

app = os.environ.get('APP')
if not app:
    raise "Set APP env var"

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
