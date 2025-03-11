#!/bin/bash
set -euo pipefail

if kind get clusters | grep "k0rdent"; then
    echo "k0rdent kind cluster already exists"
else
    kind create cluster -n k0rdent
    kind get kubeconfig -n k0rdent > "kcfg_k0rdent"
    chmod 0600 "kcfg_k0rdent" # set minimum attributes to kubeconfig (owner read/write)
fi

if helm get notes kcm -n kcm-system; then
    echo "k0rdent chart (kcm) already installed"
else
    helm install kcm oci://ghcr.io/k0rdent/kcm/charts/kcm --version 0.1.0 -n kcm-system --create-namespace
fi

TEST_MODE=k0rdent NAMESPACE=kcm-system ./scripts/wait_for_deployment.sh
TEST_MODE=k0rdent NAMESPACE=projectsveltos ./scripts/wait_for_deployment.sh
