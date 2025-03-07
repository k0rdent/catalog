#!/bin/bash
set -euo pipefail

if [[ "$EXAMPLE_MODE" == aws ]]; then
    helm upgrade --install aws-credential oci://ghcr.io/k0rdent/catalog/charts/aws-credential \
        --version 0.0.1 \
        -n kcm-system \
        -f providers/values-aws-credential.yaml

    kubectl patch secret aws-credential-secret -n kcm-system -p='{"stringData":{"AccessKeyID":"'$AWS_ACCESS_KEY_ID'"}}'
    kubectl patch secret aws-credential-secret -n kcm-system -p='{"stringData":{"SecretAccessKey":"'$AWS_SECRET_ACCESS_KEY'"}}'
else
    helm upgrade --install adopted-credential oci://ghcr.io/k0rdent/catalog/charts/adopted-credential \
    --version 0.0.1 \
    -n kcm-system
fi
