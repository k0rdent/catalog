#!/bin/bash
set -euo pipefail

kubectl delete multiclusterservice $APP -n kcm-system

NAMESPACE=$APP ./scripts/wait_for_deployment_removal.sh
