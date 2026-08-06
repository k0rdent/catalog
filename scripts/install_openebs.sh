#!/bin/bash
set -euo pipefail

# Installs OpenEBS into the cluster identified by TEST_MODE (uses kcfg_$TEST_MODE).
# Configures the hostpath localpv provisioner as the default StorageClass and
# disables the heavier engines/side-cars (see scripts/config/openebs-values.yaml).
#
# Standalone and reusable: called for the adopted cluster from deploy_cld.sh and
# can also be invoked for the k0rdent cluster, e.g.:
#   TEST_MODE=adopted  ./scripts/install_openebs.sh
#   TEST_MODE=k0rdent  ./scripts/install_openebs.sh

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
