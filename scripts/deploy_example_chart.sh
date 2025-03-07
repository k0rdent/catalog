#!/bin/bash
set -euo pipefail

chart=apps/$APP/example
helm dependency update $chart
helm dependency build $chart
KUBECONFIG=kcfg helm upgrade --install $APP $chart -n $APP --create-namespace

NAMESPACE=$APP ./scripts/wait_for_deployment.sh
