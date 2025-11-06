#!/bin/bash
set -euo pipefail

./scripts/setup_provider_credential.sh

if [[ "$TEST_MODE" =~ ^(aws|azure|gcp)$ ]]; then
    if [[ -e "apps/$APP/$TEST_MODE-cld.yaml" ]]; then
        echo "App specific $TEST_MODE-cld.yaml found."
        cld_file="apps/$APP/$TEST_MODE-cld.yaml"
    else
        echo "No app specific $TEST_MODE-cld.yaml found, using default config."
        cld_file="./scripts/config/$TEST_MODE-cld.yaml"
    fi
    cld_cfg_str=$(sed -e "s/USER/${USER}/g" -e "s/AZURE_SUB_ID/${AZURE_SUB_ID}/g" \
        -e "s/GCP_PROJECT/${GCP_PROJECT}/g" \
        "$cld_file")
    echo "$cld_cfg_str"
    if [[ "$@" == --dry-run ]]; then
        echo "DRY-RUN mode: ClusterDeployment not created!"
        exit 0
    else
        echo "$cld_cfg_str" | kubectl apply -n kcm-system -f -
    fi
    cld_name="$TEST_MODE-example-$USER"
elif [[ "$TEST_MODE" == adopted ]]; then
    cld_name="adopted"
    if kind get clusters | grep "$cld_name"; then
        echo "Adopted kind cluster already exists"
    else
        k0rdent_ctx=$(kubectl config current-context)
        kind create cluster --config ./scripts/config/kind-adopted-cluster.yaml
        kubectl config use-context "$k0rdent_ctx"
    fi

    ADOPTED_KUBECONFIG=$(kind get kubeconfig --internal -n adopted | openssl base64 -A)
    kubectl patch secret adopted-credential-secret -n kcm-system -p='{"data":{"value":"'$ADOPTED_KUBECONFIG'"}}'
    kubectl apply -n kcm-system -f ./scripts/config/adopted-cld.yaml
    kubectl apply -n kcm-system -f ./scripts/config/adopted-cld.yaml
else
    echo "Unsupported TEST_MODE: '$TEST_MODE'. Allowed values: aws, azure, gcp, adopted"
    exit 1
fi

CLDNAME=$cld_name ./scripts/wait_for_cld.sh

if [[ "$TEST_MODE" =~ ^(aws|azure|gcp)$ ]]; then
    # Store kubeconfig file for managed AWS cluster
    kubectl get secret $cld_name-kubeconfig -n kcm-system -o=jsonpath={.data.value} | base64 -d > "kcfg_$TEST_MODE"
else
    # store adopted cluster kubeconfig
    kind get kubeconfig -n adopted > "kcfg_adopted"
    helm repo add metrics-server https://kubernetes-sigs.github.io/metrics-server/
    helm repo update
    KUBECONFIG=kcfg_adopted helm install metrics-server metrics-server/metrics-server \
        -n kube-system --create-namespace \
        --set "args={--kubelet-insecure-tls,--kubelet-preferred-address-types=InternalIP,Hostname}"
    NAMESPACE=kube-system ./scripts/wait_for_deployment.sh
fi
chmod 0600 "kcfg_$TEST_MODE" # set minimum attributes to kubeconfig (owner read/write)

if kubectl get ns | grep "projectsveltos"; then
    NAMESPACE=projectsveltos ./scripts/wait_for_deployment.sh
fi
