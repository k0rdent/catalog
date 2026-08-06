#!/bin/bash
set -euo pipefail

if docker ps --filter name='^k0rdent$' -q | grep -q .; then
    echo "k0rdent cluster already exists"
else
    docker run -d --name k0rdent --hostname k0rdent \
        -v /var/lib/k0s -v /var/log/pods `# this is where k0s stores its data` \
        --tmpfs /run `# this is where k0s stores runtime data` \
        --privileged `# this is the easiest way to enable container-in-container workloads` \
        -p 6443:6443 `# publish the Kubernetes API server port` \
        -p 60080:80 `# additional ports - for web` \
        -p 60443:443 \
        docker.io/k0sproject/k0s:v1.36.3-k0s.0

    echo "Waiting for kubeconfig..."
    until docker exec k0rdent k0s kubeconfig admin > kcfg_k0rdent 2>/dev/null; do
        sleep 2
    done

    docker exec k0rdent k0s kubeconfig admin > kcfg_k0rdent
    sed -i.bak '5s#.*#    server: https://127.0.0.1:6443#' kcfg_k0rdent # replace docker internal ip
    chmod 0600 "kcfg_k0rdent" # set minimum attributes to kubeconfig (owner read/write)
fi

# Use the k0rdent cluster kubeconfig for all subsequent kubectl/helm calls.
# Unlike kind, k0s-in-docker does not merge into ~/.kube/config, so this must be
# set before the wait loops below (otherwise kubectl targets the wrong cluster).
export KUBECONFIG=kcfg_k0rdent

echo "Waiting for kube-system pods..."
until kubectl get pods -n kube-system --no-headers 2>/dev/null | grep -q .; do
    kubectl get pods -n kube-system || true
    sleep 2
done

echo "Waiting for kube-system pods to become Ready..."
until kubectl wait -n kube-system --for=condition=Ready pod --all --timeout=2s 2>/dev/null; do
    kubectl get pods -n kube-system
    sleep 2
done

# Allow workloads in cp node
kubectl taint nodes k0rdent node-role.kubernetes.io/control-plane:NoSchedule- 2>/dev/null || true

if [[ ${DEBUG:-} == "true" ]]; then
  HELM_EXTRA_FLAGS="--debug"
else
  HELM_EXTRA_FLAGS=""
fi

if helm get notes kcm -n kcm-system >/dev/null 2>&1; then
    echo "k0rdent chart (kcm) already installed"
elif [[ -z "${HELM_VALUES:-}" ]]; then
    echo "Installing kcm with default values"
    helm install kcm oci://ghcr.io/k0rdent/kcm/charts/kcm \
      --version 1.10.0 -n kcm-system --create-namespace \
      --timeout=20m $HELM_EXTRA_FLAGS
else
    echo "Installing kcm chart with values $HELM_VALUES"
    helm install kcm oci://ghcr.io/k0rdent/kcm/charts/kcm \
      --version 1.10.0 -n kcm-system --create-namespace -f "$HELM_VALUES" \
      --timeout=20m $HELM_EXTRA_FLAGS
fi

if kubectl get ns | grep "kcm-system"; then
    TEST_MODE="k0rdent" NAMESPACE=kcm-system ./scripts/wait_for_deployment.sh
fi

# kcm reconciles its components (kcm -> capi -> projectsveltos) in stages with
# gaps in between, so the cluster can momentarily look settled before the
# projectsveltos provider is even deployed. Gate on the Management's Ready
# condition, which only flips true once every component is installed and
# healthy, so the projectsveltos wait below sees the complete set of pods.
if kubectl get management kcm >/dev/null 2>&1; then
    echo "Waiting for Management 'kcm' to become Ready..."
    mgmt_timeout=$((25 * 60))
    mgmt_elapsed=0
    until [[ "$(kubectl get management kcm -o jsonpath='{.status.conditions[?(@.type=="Ready")].status}' 2>/dev/null)" == "True" ]]; do
        kubectl get management kcm 2>/dev/null || true
        if (( mgmt_elapsed >= mgmt_timeout )); then
            echo "❌ Timeout: Management 'kcm' did not become Ready"
            kubectl get management kcm -o yaml 2>/dev/null | grep -A30 "conditions:" || true
            exit 1
        fi
        sleep 5
        mgmt_elapsed=$((mgmt_elapsed + 5))
    done
    echo "✅ Management 'kcm' is Ready"
fi

if kubectl get ns | grep "projectsveltos"; then
    TEST_MODE="k0rdent" NAMESPACE=projectsveltos ./scripts/wait_for_deployment.sh
fi

# Optionally give the k0rdent cluster a default StorageClass (openebs hostpath).
if [[ "${INSTALL_OPENEBS:-}" == "true" ]]; then
    TEST_MODE=k0rdent ./scripts/install_openebs.sh
fi
