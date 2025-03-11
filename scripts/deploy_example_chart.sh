#!/bin/bash
set -euo pipefail

chart=apps/$APP/example
helm dependency build $chart

ns=$(./scripts/get_mcs_namespace.sh)
KUBECONFIG="kcfg_$TEST_MODE" helm upgrade --install $APP $chart -n $ns --create-namespace

NAMESPACE=$ns ./scripts/wait_for_deployment.sh
