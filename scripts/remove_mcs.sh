#!/bin/bash
set -euo pipefail

kubectl delete multiclusterservice $EXAMPLE -n kcm-system

NAMESPACE=$EXAMPLE ./scripts/wait_for_deployment_removal.sh
