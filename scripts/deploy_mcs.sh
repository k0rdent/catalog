#!/bin/bash
set -euo pipefail

kubectl apply -f apps/$EXAMPLE/mcs.yaml

NAMESPACE=$EXAMPLE ./scripts/wait_for_deployment.sh
