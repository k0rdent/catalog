#!/bin/bash
set -euo pipefail

# ClusterDeployment/credential ops target the k0rdent management cluster.
export KUBECONFIG=kcfg_k0rdent

./scripts/check_test_mode.sh

if [[ "$TEST_MODE" == adopted ]]; then
    cldname="adopted"
else
    cldname="$TEST_MODE-example-$USER"
fi

kubectl delete cld -n kcm-system "$cldname"

CLDNAME="$cldname" ./scripts/wait_for_cluster_removal.sh

if [[ "$TEST_MODE" == adopted ]]; then
    helm uninstall adopted-credential -n kcm-system
    if docker ps --filter name='^adopted$' -q | grep -q .; then
        docker rm -vf adopted
    fi
    rm -f ./kcfg_adopted ./kcfg_adopted.bak
fi
