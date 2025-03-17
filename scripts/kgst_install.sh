#!/bin/bash
set -euo pipefail

if ! ./scripts/example_chart_exists.sh; then
  helm upgrade --install $APP oci://ghcr.io/k0rdent/catalog/charts/kgst \
  -n kcm-system \
  -f apps/$APP/helm-values-kgst.yaml
else
  echo "Installing k0rdent service templates based on apps/$APP/example/Chart.yaml deps"
  kgst_commands=$(python3 ./scripts/utils.py kgst-install-deps $APP)
  bash -c "$kgst_commands"
fi

./scripts/wait_for_servicetemplate.sh
