#!/bin/bash
set -euo pipefail

./scripts/ensure_mcs_config.sh

kubectl apply -f apps/$APP/mcs.yaml

wfd=$(python3 ./scripts/utils.py get-wait-for-pods $APP)
wfr=$(python3 ./scripts/utils.py get-wait-for-running $APP)
wfc=$(python3 ./scripts/utils.py get-wait-for-creating $APP)
ns=$(./scripts/get_mcs_namespace.sh)

check_clusters() {
  for test_mode in ${TEST_MODE//,/ }; do
    (
        export WAIT_FOR_PODS=$wfd
        export WAIT_FOR_RUNNING=$wfr
        export WAIT_FOR_CREATING=$wfc
        export NAMESPACE=$ns
        export TEST_MODE=$test_mode
        ./scripts/wait_for_deployment.sh
        KUBECONFIG="kcfg_$TEST_MODE" kubectl top nodes
    )
  done
}

check_clusters

# for multi-cluster mode check it again in the end for better output readability
if [[ "$TEST_MODE" == *,* ]]; then
  echo -e "\nLet's check all clusters ($TEST_MODE) once again:"
  check_clusters
fi
