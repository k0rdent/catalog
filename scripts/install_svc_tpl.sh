#!/bin/bash
set -euo pipefail

helm upgrade --install $APP oci://ghcr.io/k0rdent/catalog/charts/kgst \
  -n kcm-system \
  -f apps/$APP/helm-values-kgst.yaml
