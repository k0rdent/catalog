#!/bin/bash
set -euo pipefail

if ./scripts/example_chart_exists.sh; then
  python3 ./scripts/utils.py render-mcs $APP
fi

kubectl apply -f apps/$APP/mcs.yaml

wfd=$(python3 ./scripts/utils.py get-wait-for-pods $APP)
ns=$(./scripts/get_mcs_namespace.sh)
WAIT_FOR_PODS=$wfd NAMESPACE=$ns ./scripts/wait_for_deployment.sh
