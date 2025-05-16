#!/bin/bash
set -euo pipefail

ns=$(./scripts/get_mcs_namespace.sh)
for i in aws azure gcp; do
  KUBECONFIG="${GITHUB_RUN_ID}/${i}/${i}-cluster-${GITHUB_RUN_ID}.kubeconfig" helm uninstall $APP -n $ns
done


NAMESPACE=$ns ./scripts/wait_for_deployment_removal_multi.sh
