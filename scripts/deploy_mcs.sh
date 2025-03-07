#!/bin/bash
set -euo pipefail

kubectl apply -f apps/$APP/mcs.yaml

NAMESPACE=$APP ./scripts/wait_for_deployment.sh
