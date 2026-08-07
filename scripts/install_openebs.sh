#!/bin/bash
set -euo pipefail

# Install OpenEBS (hostpath localpv default StorageClass) into kcfg_$TEST_MODE.
# Usage: TEST_MODE=adopted|k0rdent ./scripts/install_openebs.sh

TEST_MODE="${TEST_MODE:?TEST_MODE must be set (e.g. adopted, k0rdent)}"
KCFG="kcfg_$TEST_MODE"

if [[ ! -f "$KCFG" ]]; then
    echo "Kubeconfig '$KCFG' not found for TEST_MODE='$TEST_MODE'"
    exit 1
fi

export KUBECONFIG="$KCFG"

if helm status openebs -n openebs >/dev/null 2>&1; then
    echo "openebs already installed in '$TEST_MODE' cluster"
else
    echo "Installing openebs into '$TEST_MODE' cluster"
    helm install openebs oci://ghcr.io/k0rdent/catalog/charts/openebs \
        --version 4.5.1 -n openebs --create-namespace \
        -f ./scripts/config/openebs-values.yaml --timeout=10m
fi

NAMESPACE=openebs ./scripts/wait_for_deployment.sh
