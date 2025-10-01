#!/bin/bash
set -euo pipefail

kind_cluster="${KIND_CLUSTER:-k0rdent}"
if kind get clusters | grep "${kind_cluster}"; then
    echo "${kind_cluster} kind cluster already exists"
else
    kind create cluster -n "${kind_cluster}"
fi

kind get kubeconfig -n "${kind_cluster}" > "kcfg_${kind_cluster}"
chmod 0600 "kcfg_${kind_cluster}" # set minimum attributes to kubeconfig (owner read/write)

if [[ ${DEBUG:-} == "true" ]]; then
  HELM_EXTRA_FLAGS="--debug"
else
  HELM_EXTRA_FLAGS=""
fi

if helm get notes kcm -n kcm-system; then
    echo "k0rdent chart (kcm) already installed"
elif [[ -z "${HELM_VALUES:-}" ]]; then
    echo "Installing kcm with default values"
    helm install kcm oci://ghcr.io/k0rdent/kcm/charts/kcm \
      --version 1.4.0 -n kcm-system --create-namespace \
      --timeout=20m $HELM_EXTRA_FLAGS
else
    echo "Installing kcm chart with values $HELM_VALUES"
    helm install kcm oci://ghcr.io/k0rdent/kcm/charts/kcm \
      --version 1.4.0 -n kcm-system --create-namespace -f "$HELM_VALUES" \
      --timeout=20m $HELM_EXTRA_FLAGS
fi

if kubectl get ns | grep "kcm-system"; then
    TEST_MODE="${kind_cluster}" NAMESPACE=kcm-system ./scripts/wait_for_deployment.sh
fi

if kubectl get ns | grep "projectsveltos"; then
    TEST_MODE="${kind_cluster}" NAMESPACE=projectsveltos ./scripts/wait_for_deployment.sh
fi
