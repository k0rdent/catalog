#!/bin/bash
set -euo pipefail

./scripts/setup_provider_credential.sh

if [[ "$TEST_MODE" =~ ^(aws|azure)$ ]]; then
    if [[ -e "apps/$APP/$TEST_MODE-cld.yaml" ]]; then
        echo "App specific $TEST_MODE-cld.yaml found."
        cld_file="apps/$APP/$TEST_MODE-cld.yaml"
    else
        echo "No app specific $TEST_MODE-cld.yaml found, using default config."
        cld_file="providers/$TEST_MODE-cld.yaml"
    fi
    sed -e "s/USER/${USER}/g" -e "s/AZURE_SUB_ID/${AZURE_SUB_ID}/g" "$cld_file" | kubectl apply -n kcm-system -f -
    cldname="$TEST_MODE-example-$USER"
else
    cldname="adopted"
    if kind get clusters | grep "$cldname"; then
        echo "Adopted kind cluster already exists"
    else
        k0rdent_ctx=$(kubectl config current-context)
        kind create cluster --config providers/kind-adopted-cluster.yaml
        kubectl config use-context "$k0rdent_ctx"
    fi

    ADOPTED_KUBECONFIG=$(kind get kubeconfig --internal -n adopted | openssl base64 -A)
    kubectl patch secret adopted-credential-secret -n kcm-system -p='{"data":{"value":"'$ADOPTED_KUBECONFIG'"}}'
    kubectl apply -n kcm-system -f providers/adopted-cld.yaml
fi

CLDNAME=$cldname ./scripts/wait_for_cld.sh

if [[ "$TEST_MODE" == aws ]]; then
    # Store kubeconfig file for managed AWS cluster
    kubectl get secret aws-example-$USER-kubeconfig -n kcm-system -o=jsonpath={.data.value} | base64 -d > "kcfg_$TEST_MODE"
else
    # store adopted cluster kubeconfig
    kind get kubeconfig -n adopted > "kcfg_$TEST_MODE"
fi
chmod 0600 "kcfg_$TEST_MODE" # set minimum attributes to kubeconfig (owner read/write)
