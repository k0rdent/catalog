#!/bin/bash

# Batch 1: ./scripts/test_app_e2e.sh ingress-nginx dex kyverno velero cert-manager external-secrets
# Batch 2: ./scripts/test_app_e2e.sh tika arangodb argo-cd cadvisor ceph clearml cloudcasa cluster-autoscaler
# Batch 3: ./scripts/test_app_e2e.sh envoy-gateway external-dns falco
# Batch 4: ./scripts/test_app_e2e.sh finops-agent flux-operator gatekeeper grafana
# Batch 5: ./scripts/test_app_e2e.sh harbor harness headlamp hpe-csi
# Batch 6: ./scripts/test_app_e2e.sh istio istio-ambient jenkins jupyterhub
# Batch 7: ./scripts/test_app_e2e.sh kagent knative kserve kubecost kubeflow-spark-operator

# Batch 10: gitlab open-webui

set -euo pipefail

if [ $# -eq 0 ]; then
  echo "Usage: $0 APP1 [APP2 ...]"
  exit 1
fi

for app in "$@"; do
  if [ ! -d "./apps/$app" ]; then
    echo "❌ App '$app' not found!"
    exit 1
  fi
done

total=$#
count=0
for app in "$@"; do
  count=$((count + 1))
  echo "Testing end 2 end '$app' in '$TEST_MODE' [$count/$total]"
  APP="$app" ./scripts/install_servicetemplates.sh
  APP="$app" ./scripts/deploy_mcs.sh
  APP="$app" ./scripts/remove_mcs.sh

  echo "✅ '$app' tested end 2 end (✅ installed, ✅ deployed, ✅ removed) [$count/$total]"
done
