#!/bin/bash
set -euo pipefail

if ./scripts/example_chart_exists.sh; then
  python3 ./scripts/utils.py render-mcs $APP
fi

kubectl apply -f apps/$APP/mcs.yaml

NAMESPACE=$APP ./scripts/wait_for_deployment.sh
