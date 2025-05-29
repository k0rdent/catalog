#!/bin/bash
set -euo pipefail

chart=apps/$APP/example
helm dependency build $chart

ns=$(./scripts/get_mcs_namespace.sh)
for i in aws azure gcp; do
  kubectl -n kcm-system get secret ${i}-cluster-${GITHUB_RUN_ID}-kubeconfig -o jsonpath='{.data.value}' | base64 -d > ${GITHUB_RUN_ID}/${i}/${i}-cluster-${GITHUB_RUN_ID}.kubeconfig
  KUBECONFIG="${GITHUB_RUN_ID}/${i}/${i}-cluster-${GITHUB_RUN_ID}.kubeconfig" helm upgrade --install $APP $chart -n $ns --create-namespace
done
wfd=$(python3 ./scripts/utils.py get-wait-for-pods $APP)
WAIT_FOR_PODS=$wfd NAMESPACE=$ns ./scripts/wait_for_deployment_multi.sh
