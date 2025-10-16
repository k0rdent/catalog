#!/bin/bash
set -euo pipefail

if [[ "$TEST_MODE" == adopted ]]; then
    cldname="adopted"
else
    cldname="$TEST_MODE-example-$USER"
fi

kubectl delete cld -n kcm-system "$cldname"

CLDNAME="$cldname" ./scripts/wait_for_cluster_removal.sh

if [[ "$TEST_MODE" == adopted ]]; then
    helm uninstall adopted-credential -n kcm-system
    kind delete cluster -n adopted
fi
