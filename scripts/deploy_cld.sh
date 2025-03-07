#!/bin/bash

if [[ "$EXAMPLE_MODE" == aws ]]; then
    sed "s/SUFFIX/${USER}/g" providers/aws-cld.yaml | kubectl apply -f -
    cldname="aws-example-$USER"
else
    cldname="adopted"
    if kind get clusters | grep "$cldname"; then
        echo "Adopted kind cluster already exists"
    else
        kind create cluster --config providers/kind-adopted-cluster.yaml
    fi

    ADOPTED_KUBECONFIG=$(kind get kubeconfig --internal -n adopted | base64)
    kubectl patch secret adopted-credential-secret -n kcm-system -p='{"data":{"value":"'$ADOPTED_KUBECONFIG'"}}'
    kubectl apply -f providers/adopted-cld.yaml
fi

CLDNAME=$cldname ./scripts/wait_for_cld.sh


if [[ "$EXAMPLE_MODE" == aws ]]; then
    # Store kubeconfig file for managed AWS cluster
    kubectl get secret aws-example-$USER-kubeconfig -o=jsonpath={.data.value} | base64 -d > kcfg
else
    # store adopted cluster kubeconfig
    kind get kubeconfig -n adopted > kcfg
fi
chmod 0600 kcfg # set minimum attributes to kubeconfig (owner read/write)
