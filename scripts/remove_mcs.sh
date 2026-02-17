#!/bin/bash

kubectl delete mcs "$APP" --wait=false

ns=$(./scripts/get_mcs_namespace.sh)

check_clusters() {
  for test_mode in ${TEST_MODE//,/ }; do
    (
        export NAMESPACE=$ns
        # shellcheck disable=SC2030
        export TEST_MODE=$test_mode
        ./scripts/wait_for_deployment_removal.sh
    )
  done
}

check_clusters
# for multi-cluster mode check it again in the end for better output readability
# shellcheck disable=SC2031
if [[ "$TEST_MODE" == *,* ]]; then
  echo -e "\nLet's check all clusters ($TEST_MODE) once again:"
  check_clusters
fi

kubectl delete multiclusterservice "$APP" 2>/dev/null

if kubectl get mcs "$APP" 2>/dev/null; then
    echo "❌ Multicluster service '$APP' not removed!"
    exit 1
fi
echo "✅ Multicluster service '$APP' removed!"

# shellcheck disable=SC2031
KUBECONFIG="kcfg_$TEST_MODE" kubectl top nodes
