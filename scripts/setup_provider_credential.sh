#!/bin/bash
set -euo pipefail

if [[ "$TEST_MODE" == aws ]]; then
    helm upgrade --install aws-credential oci://ghcr.io/k0rdent/catalog/charts/aws-credential \
        --version 0.0.1 \
        -n kcm-system

    kubectl patch secret aws-credential-secret -n kcm-system -p='{"stringData":{"AccessKeyID":"'$AWS_ACCESS_KEY_ID'"}}'
    kubectl patch secret aws-credential-secret -n kcm-system -p='{"stringData":{"SecretAccessKey":"'$AWS_SECRET_ACCESS_KEY'"}}'
elif [[ "$TEST_MODE" == azure ]]; then
    helm upgrade --install azure-credential oci://ghcr.io/k0rdent/catalog/charts/azure-credential \
        --version 0.0.1 \
        -n kcm-system \
        --set "spAppID=${AZURE_SP_APP_ID}" \
        --set "spTenantID=${AZURE_SP_TENANT_ID}"

    kubectl patch secret azure-credential-secret -n kcm-system -p='{"stringData":{"clientSecret":"'$AZURE_SP_PASSWORD'"}}'
else
    helm upgrade --install adopted-credential oci://ghcr.io/k0rdent/catalog/charts/adopted-credential \
    --version 0.0.1 \
    -n kcm-system
fi
