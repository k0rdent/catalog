#!/bin/bash
set -euo pipefail

if [[ -z "${KIND_CLUSTER:-}" ]]; then
    KIND_CLUSTER="k0rdent"
fi

if kind get clusters | grep "$KIND_CLUSTER"; then
    echo "$KIND_CLUSTER kind cluster already exists"
else
    kind create cluster -n "$KIND_CLUSTER"
fi

if [[ ! -e "kcfg_k0rdent" ]]; then
    kind get kubeconfig -n "$KIND_CLUSTER" > "kcfg_k0rdent"
    chmod 0600 "kcfg_k0rdent" # set minimum attributes to kubeconfig (owner read/write)
fi

if helm get notes kcm -n kcm-system; then
    echo "k0rdent chart (kcm) already installed"
elif [[ -z "${HELM_VALUES:-}" ]]; then
    helm install kcm oci://ghcr.io/k0rdent/kcm/charts/kcm \
      --version 0.2.0 -n kcm-system --create-namespace
else
    helm install kcm oci://ghcr.io/k0rdent/kcm/charts/kcm \
      --version 0.2.0 -n kcm-system --create-namespace -f "$HELM_VALUES"
fi

if kubectl get ns | grep "kcm-system"; then
    TEST_MODE=k0rdent NAMESPACE=kcm-system ./scripts/wait_for_deployment.sh
fi

if kubectl get ns | grep "projectsveltos"; then
    TEST_MODE=k0rdent NAMESPACE=projectsveltos ./scripts/wait_for_deployment.sh
fi
