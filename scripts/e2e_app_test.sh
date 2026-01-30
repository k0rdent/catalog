#!/bin/bash

# .medium:
# Batch 1: ./scripts/e2e_app_test.sh ingress-nginx dex kyverno velero cert-manager external-secrets
# Batch 2: ./scripts/e2e_app_test.sh tika arangodb argo-cd cadvisor ceph clearml cloudcasa cluster-autoscaler
# Batch 3: ./scripts/e2e_app_test.sh envoy-gateway external-dns falco
# Batch 4: ./scripts/e2e_app_test.sh finops-agent flux-operator gatekeeper grafana
# Batch 5: ./scripts/e2e_app_test.sh harbor harness headlamp hpe-csi
# Batch 6: ./scripts/e2e_app_test.sh istio istio-ambient jenkins jupyterhub
# Batch 7: ./scripts/e2e_app_test.sh kagent keda knative kube-prometheus-stack kubecost
# Batch 8: ./scripts/e2e_app_test.sh kubeflow-spark-operator kuberay kyverno-guardrails
# Batch 9: ./scripts/e2e_app_test.sh local-ai metallb milvus minio mirantis-kyverno-guardrails
# Batch 10: ./scripts/e2e_app_test.sh mirantis-velero mlflow mongodb msr mysql
# Batch 11: ./scripts/e2e_app_test.sh n8n nats netapp nginx-ingress-f5 nirmata
# Batch 12: ./scripts/e2e_app_test.sh node-feature-discovery nvidia opencost
# Batch 13: ./scripts/e2e_app_test.sh penpot postgresql postgresql-operator prometheus pure
# Batch 14: ./scripts/e2e_app_test.sh qdrant rabbitmq redis stacklight strimzi-kafka-operator
# Batch 15: ./scripts/e2e_app_test.sh teleport tetrate-istio valkey
# Batch 16: ./scripts/e2e_app_test.sh victoriametrics wandb
# .xlarge
# Batch 17: ./scripts/e2e_app_test.sh elasticsearch open-webui
# .2xlarge
# Batch 18: ./scripts/e2e_app_test.sh gitlab kserve

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
