#!/bin/bash
set -euo pipefail

if ! ./scripts/example_chart_exists.sh; then
  helm upgrade --install $APP oci://ghcr.io/k0rdent/catalog/charts/kgst \
  -n kcm-system \
  -f apps/$APP/helm-values-kgst.yaml
  exit 0
fi
