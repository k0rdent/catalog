#!/bin/bash
set -euo pipefail

# Chart version of k0rdent (kcm) to install. Callers that also apply a Management
# resource have to keep its `release:` in sync (see deploy_k0rdent_aws.sh).
KCM_VERSION="${KCM_VERSION:-1.13.0}"

# Pin the node image: k0sind's default tracks a newer k0s than the cluster
# templates provision, and bumping Kubernetes is not this script's job.
K0S_IMAGE="${K0S_IMAGE:-docker.io/k0sproject/k0s:v1.36.3-k0s.0}"

# KCM_SRC_DIR set: build kcm from that checkout (scripts/kcm_source.sh),
# otherwise install the published chart from ghcr.
if [[ -n "${KCM_SRC_DIR:-}" ]]; then
    source ./scripts/kcm_source.sh
fi

if k0sind get clusters 2>/dev/null | grep -qx k0rdent; then
    echo "k0rdent cluster already exists"
    k0sind get kubeconfig -n k0rdent > kcfg_k0rdent
else
    k0sind create cluster --name k0rdent --image "$K0S_IMAGE" \
        --kubeconfig kcfg_k0rdent --wait 5m
fi
chmod 0600 "kcfg_k0rdent" # set minimum attributes to kubeconfig (owner read/write)

# Must be set before the wait loops (k0sind writes the file, not ~/.kube/config).
export KUBECONFIG=kcfg_k0rdent

# The same wait the KCM and sveltos namespaces use, rather than a loop of its
# own: it prints the pods that moved instead of the whole table every two
# seconds, it bounds the wait, and it names the stuck container when the
# cluster does not come up. It also sits out an empty namespace, which is what
# the appear-then-ready pair here used to do.
TEST_MODE="k0rdent" NAMESPACE=kube-system ./scripts/wait_for_deployment.sh

# Allow workloads in cp node
kubectl taint nodes --all node-role.kubernetes.io/control-plane:NoSchedule- 2>/dev/null || true

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
        connect_network "$DOCKER_NETWORK" k0rdent-control-plane
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
