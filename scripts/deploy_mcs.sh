#!/bin/bash
set -euo pipefail

./scripts/ensure_mcs_config.sh

kubectl apply -f apps/$APP/mcs.yaml

wfd=$(python3 ./scripts/utils.py get-wait-for-pods $APP)
ns=$(./scripts/get_mcs_namespace.sh)
WAIT_FOR_PODS=$wfd NAMESPACE=$ns ./scripts/wait_for_deployment.sh
