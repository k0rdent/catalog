#!/bin/bash
set -euo pipefail

./scripts/setup_provider_credential.sh

if [[ "$TEST_MODE" == aws ]]; then
    sed "s/SUFFIX/${USER}/g" providers/aws-cld.yaml | kubectl apply -f -
    cldname="aws-example-$USER"
else
    cldname="adopted"
    if kind get clusters | grep "$cldname"; then
        echo "Adopted kind cluster already exists"
    else
        k0rdent_ctx=$(kubectl config current-context)
        kind create cluster --config providers/kind-adopted-cluster.yaml
        kubectl config use-context "$k0rdent_ctx"
    fi

    ADOPTED_KUBECONFIG=$(kind get kubeconfig --internal -n adopted | base64 -w 0)
    kubectl patch secret adopted-credential-secret -n kcm-system -p='{"data":{"value":"'$ADOPTED_KUBECONFIG'"}}'
    kubectl apply -f providers/adopted-cld.yaml
fi

CLDNAME=$cldname ./scripts/wait_for_cld.sh

if [[ "$TEST_MODE" == aws ]]; then
    # Store kubeconfig file for managed AWS cluster
    kubectl get secret aws-example-$USER-kubeconfig -o=jsonpath={.data.value} | base64 -d > "kcfg_$TEST_MODE"
else
    # store adopted cluster kubeconfig
    kind get kubeconfig -n adopted > "kcfg_$TEST_MODE"
fi
chmod 0600 "kcfg_$TEST_MODE" # set minimum attributes to kubeconfig (owner read/write)
