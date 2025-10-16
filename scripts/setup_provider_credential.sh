#!/bin/bash
set -euo pipefail

cred_name="$TEST_MODE-credential"
if kubectl get credential "$cred_name" -n kcm-system &>/dev/null; then
    echo "Credential $cred_name already exists"
    echo "(Remove using: helm uninstall $cred_name -n kcm-system)"
    exit 0
fi

if [[ "$TEST_MODE" == aws ]]; then
    helm upgrade --install aws-credential oci://ghcr.io/k0rdent/catalog/charts/aws-credential \
        --version 1.0.0 \
        -n kcm-system

    kubectl patch secret aws-credential-secret -n kcm-system -p='{"stringData":{"AccessKeyID":"'$AWS_ACCESS_KEY_ID'"}}'
    kubectl patch secret aws-credential-secret -n kcm-system -p='{"stringData":{"SecretAccessKey":"'$AWS_SECRET_ACCESS_KEY'"}}'
elif [[ "$TEST_MODE" == azure ]]; then
    helm upgrade --install azure-credential oci://ghcr.io/k0rdent/catalog/charts/azure-credential \
        --version 1.0.0 \
        -n kcm-system \
        --set "spAppID=${AZURE_SP_APP_ID}" \
        --set "spTenantID=${AZURE_SP_TENANT_ID}" \
        --set "subID=${AZURE_SUB_ID}"

    kubectl patch secret azure-credential-secret -n kcm-system -p='{"stringData":{"clientSecret":"'$AZURE_SP_PASSWORD'"}}'
    kubectl patch secret azure-credential-secret-aks -n kcm-system -p='{"stringData":{"AZURE_CLIENT_SECRET":"'$AZURE_SP_PASSWORD'"}}'
elif [[ "$TEST_MODE" == gcp ]]; then
    helm upgrade --install gcp-credential oci://ghcr.io/k0rdent/catalog/charts/gcp-credential \
        --version 0.0.1 \
        -n kcm-system

    kubectl patch secret gcp-cloud-sa -n kcm-system -p='{"data":{"credentials":"'$GCP_B64ENCODED_CREDENTIALS'"}}'
elif [[ "$TEST_MODE" == adopted ]]; then
    helm upgrade --install adopted-credential oci://ghcr.io/k0rdent/catalog/charts/adopted-credential \
    --version 0.0.1 \
    -n kcm-system
fi
