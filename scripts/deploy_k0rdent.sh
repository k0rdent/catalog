#!/bin/bash
set -euo pipefail

# Chart version of k0rdent (kcm) to install. Callers that also apply a Management
# resource have to keep its `release:` in sync (see deploy_k0rdent_aws.sh).
KCM_VERSION="${KCM_VERSION:-1.12.0}"

# KCM_SRC_DIR set: build kcm from that checkout (scripts/kcm_source.sh),
# otherwise install the published chart from ghcr.
if [[ -n "${KCM_SRC_DIR:-}" ]]; then
    source ./scripts/kcm_source.sh
fi

if docker ps --filter name='^k0rdent$' -q | grep -q .; then
    echo "k0rdent cluster already exists"
else
    port_args=(-p 6443:6443)
    if [[ "${K0RDENT_EXPOSE_PORTS:-0}" == "1" ]]; then  # Avoid ephemeral port range conflicts in CI.
        port_args+=(-p 60080:80 -p 60443:443)
    fi
    # KCM pulls the template charts from the local registry by container name.
    net_args=()
    if [[ -n "${KCM_SRC_DIR:-}" ]]; then
        ensure_network "$DOCKER_NETWORK"
        net_args=(--network "$DOCKER_NETWORK")
    fi
    docker run -d --name k0rdent --hostname k0rdent \
        -v /var/lib/k0s -v /var/log/pods \
        --tmpfs /run \
        --privileged \
        "${port_args[@]}" ${net_args[@]+"${net_args[@]}"} \
        docker.io/k0sproject/k0s:v1.36.3-k0s.0

    echo "Waiting for kubeconfig..."
    until docker exec k0rdent k0s kubeconfig admin > kcfg_k0rdent 2>/dev/null; do
        sleep 2
    done

    docker exec k0rdent k0s kubeconfig admin > kcfg_k0rdent
    sed -i.bak '5s#.*#    server: https://127.0.0.1:6443#' kcfg_k0rdent # replace docker internal ip
    chmod 0600 "kcfg_k0rdent" # set minimum attributes to kubeconfig (owner read/write)
fi

# Must be set before the wait loops (k0s-in-docker doesn't merge into ~/.kube/config).
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
else
    values_args=()
    if [[ -n "${KCM_SRC_DIR:-}" ]]; then
        kcm_source_build
        kcm_registry_deploy
        connect_network "$DOCKER_NETWORK" k0rdent
        kcm_source_push k0rdent
        mkdir -p .work
        kcm_source_values .work/kcm-values-source.yaml
        values_args+=(-f .work/kcm-values-source.yaml)
        # flux2 and rbac-manager come from remote repos, kcm-regional from file://.
        helm dependency update "$KCM_CHART_DIR"
        chart_ref=("$KCM_CHART_DIR")
        echo "Installing kcm $(kcm_chart_version) from $KCM_DIR"
    else
        chart_ref=(oci://ghcr.io/k0rdent/kcm/charts/kcm --version "$KCM_VERSION")
        echo "Installing kcm $KCM_VERSION"
    fi
    if [[ -n "${HELM_VALUES:-}" ]]; then
        echo "Using values $HELM_VALUES"
        values_args+=(-f "$HELM_VALUES")
    fi
    helm install kcm "${chart_ref[@]}" \
      -n kcm-system --create-namespace ${values_args[@]+"${values_args[@]}"} \
      --timeout=20m $HELM_EXTRA_FLAGS
fi

if kubectl get ns | grep "kcm-system"; then
    TEST_MODE="k0rdent" NAMESPACE=kcm-system ./scripts/wait_for_deployment.sh
fi

# Gate on Management Ready (kcm->capi->projectsveltos reconcile in stages, so it
# can look settled mid-way) before waiting on projectsveltos pods below.
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
