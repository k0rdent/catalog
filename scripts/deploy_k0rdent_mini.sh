#!/bin/bash
set -euo pipefail

export KUBECONFIG=kcfg_k0rdent
export HELM_VALUES=./scripts/config/min-kcm-values.yaml
./scripts/deploy_k0rdent.sh
kubectl apply -f ./scripts/config/min-kcm-management.yaml
kubectl create ns projectsveltos
./scripts/deploy_k0rdent.sh
