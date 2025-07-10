#!/bin/bash
set -euo pipefail

if [[ -z "${CRED_NAME:-}" ]]; then
    CRED_NAME="credential"
fi

if [[ "$TEST_MODE" == aws ]]; then
    helm upgrade --install aws-${CRED_NAME} oci://ghcr.io/k0rdent/catalog/charts/aws-credential \
        --version 0.0.1 \
        -n kcm-system

    kubectl patch secret aws-${CRED_NAME}-secret -n kcm-system -p='{"stringData":{"AccessKeyID":"'$AWS_ACCESS_KEY_ID'"}}'
    kubectl patch secret aws-${CRED_NAME}-secret -n kcm-system -p='{"stringData":{"SecretAccessKey":"'$AWS_SECRET_ACCESS_KEY'"}}'
elif [[ "$TEST_MODE" == azure ]]; then
    helm upgrade --install azure-credential oci://ghcr.io/k0rdent/catalog/charts/azure-credential \
        --version 1.0.0 \
        -n kcm-system \
        --set "spAppID=${AZURE_SP_APP_ID}" \
        --set "spTenantID=${AZURE_SP_TENANT_ID}" \
        --set "subID=${AZURE_SUB_ID}"

    kubectl patch secret azure-${CRED_NAME}-secret -n kcm-system -p='{"stringData":{"clientSecret":"'$AZURE_SP_PASSWORD'"}}'
    kubectl patch secret azure-${CRED_NAME}-secret-aks -n kcm-system -p='{"stringData":{"AZURE_CLIENT_SECRET":"'$AZURE_SP_PASSWORD'"}}'
else
    helm upgrade --install adopted-${CRED_NAME} oci://ghcr.io/k0rdent/catalog/charts/adopted-credential \
    --version 0.0.1 \
    -n kcm-system
fi
