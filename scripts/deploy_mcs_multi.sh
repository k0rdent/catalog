#!/bin/bash
set -euo pipefail

./scripts/ensure_mcs_config_multi.sh

sed -i "s/CLUSTER_LABEL/${GITHUB_RUN_ID}/g"  apps/$APP/mcs.yaml
kubectl apply -f apps/$APP/mcs.yaml

wfd=$(python3 ./scripts/utils.py get-wait-for-pods $APP)
ns=$(./scripts/get_mcs_namespace.sh)
WAIT_FOR_PODS=$wfd NAMESPACE=$ns ./scripts/wait_for_deployment_multi.sh
