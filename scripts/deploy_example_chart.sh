#!/bin/bash
set -euo pipefail

chart=apps/$EXAMPLE/example
helm dependency build $chart
KUBECONFIG=kcfg helm upgrade --install $EXAMPLE $chart -n $EXAMPLE --create-namespace 

NAMESPACE=$EXAMPLE ./scripts/wait_for_deployment.sh
