#!/bin/bash
set -euo pipefail

# Credential/ClusterDeployment ops target the k0rdent management cluster.
export KUBECONFIG=kcfg_k0rdent

./scripts/setup_provider_credential.sh

# shellcheck source=scripts/export_cluster_template_names.sh
source ./scripts/export_cluster_template_names.sh

if [[ "$TEST_MODE" =~ ^(aws|azure|gcp)$ ]]; then
    cld_name="${CLD_NAME:-$TEST_MODE-example-$USER}"
    app="${APP:-}"
    cld_file="apps/$app/$TEST_MODE-cld.yaml"
    if [[ -e "$cld_file" ]]; then
        echo "App specific '$cld_file' found."
    else
        cld_file="./scripts/config/$TEST_MODE-cld.yaml"
        echo -e "App specific '$TEST_MODE-cld.yaml' not found, using default: $cld_file"
    fi
    cld_cfg_str=$(sed -e "s/USER/${USER}/g" \
        -e "s/AWS_EC2_FAMILY/${AWS_EC2_FAMILY:-FILL}/g" -e "s/AWS_REGION/${AWS_REGION:-FILL}/g" \
        -e "s/AZURE_SUB_ID/${AZURE_SUB_ID:-FILL}/g" -e "s/AZURE_LOCATION/${AZURE_LOCATION:-FILL}/g" \
        -e "s/GCP_PROJECT/${GCP_PROJECT:-FILL}/g" -e "s/GCP_REGION/${GCP_REGION:-FILL}/g" \
        -e "s/CT_AWS_STANDALONE_CP/${CT_AWS_STANDALONE_CP}/g" -e "s/CT_AWS_EKS/${CT_AWS_EKS}/g" \
        -e "s/CT_AZURE_STANDALONE_CP/${CT_AZURE_STANDALONE_CP}/g" -e "s/CT_AZURE_AKS/${CT_AZURE_AKS}/g" \
        -e "s/CT_GCP_STANDALONE_CP/${CT_GCP_STANDALONE_CP}/g" -e "s/CT_GCP_GKE/${CT_GCP_GKE}/g" \
        -e "s/CLD_NAME/${cld_name}/g"\
        "$cld_file")
    echo "$cld_cfg_str"
    for arg in "$@"; do
        if [[ "$arg" == "--dry-run" ]]; then
            echo "DRY-RUN mode: ClusterDeployment not created!"
            exit 0
        fi
    done
    echo "$cld_cfg_str" | kubectl apply -n kcm-system -f -
elif [[ "$TEST_MODE" == adopted ]]; then
    cld_name=adopted

    # Both clusters land on kind's own bridge network, so the k0rdent
    # controllers reach the adopted API without an extra network.
    if kind get clusters 2>/dev/null | grep -qx adopted; then
        echo "Adopted cluster already exists"
    else
        mkdir -p .work
        nocni="${TEST_ADOPTED_NOCNI:-false}"
        if [[ "$nocni" == true ]]; then
            echo "TEST_ADOPTED_NOCNI=true: starting the adopted cluster without a CNI"
        fi
        EXPOSE_PORTS="${ADOPTED_EXPOSE_PORTS:-0}" DISABLE_CNI="$nocni" \
            ./scripts/create_kind_config.sh adopted > .work/kind-adopted.yaml
        # Without a CNI no node ever reports Ready, so there is nothing to wait for.
        wait_args=(--wait 5m)
        if [[ "$nocni" == true ]]; then
            wait_args=()
        fi
        kind create cluster --config .work/kind-adopted.yaml --kubeconfig kcfg_adopted \
            ${wait_args[@]+"${wait_args[@]}"}
    fi

    kind get kubeconfig -n adopted > kcfg_adopted
    chmod 0600 kcfg_adopted

    if [[ "${TEST_ADOPTED_NOCNI:-false}" == true ]]; then
        echo "Waiting for the adopted node to register (stays NotReady until the CNI is deployed)..."
        until KUBECONFIG=kcfg_adopted kubectl get nodes --no-headers 2>/dev/null | grep -q .; do
            sleep 2
        done
        KUBECONFIG=kcfg_adopted kubectl get nodes
    fi

    # Allow workloads on the single control-plane node.
    KUBECONFIG=kcfg_adopted kubectl taint nodes --all node-role.kubernetes.io/control-plane:NoSchedule- 2>/dev/null || true

    if [[ "${TEST_ADOPTED_PVC:-false}" == true ]]; then
        # kind ships the 'standard' local-path StorageClass, so there is nothing
        # to install. Stacking openebs on top of it is what broke ceph before.
        echo "Skipping openebs install (kind provides a default StorageClass)"
    fi

    # kind ships no metrics-server, and deploy_mcs.sh/top_mcs.sh run `kubectl top`.
    if [[ "${TEST_ADOPTED_NOCNI:-false}" == true ]]; then
        echo "Skipping metrics-server install (no CNI yet)"
    elif KUBECONFIG=kcfg_adopted helm status metrics-server -n kube-system >/dev/null 2>&1; then
        echo "metrics-server already installed"
    else
        helm repo add metrics-server https://kubernetes-sigs.github.io/metrics-server/ >/dev/null
        helm repo update metrics-server >/dev/null
        KUBECONFIG=kcfg_adopted helm install metrics-server metrics-server/metrics-server \
            -n kube-system \
            --set "args={--kubelet-insecure-tls,--kubelet-preferred-address-types=InternalIP,Hostname}"
    fi

    # Internal kubeconfig for k0rdent (server reachable from the kind network).
    ADOPTED_KUBECONFIG=$(kind get kubeconfig --internal -n adopted | openssl base64 -A)
    kubectl patch secret adopted-credential-secret -n kcm-system -p='{"data":{"value":"'"$ADOPTED_KUBECONFIG"'"}}'
    sed -e "s/CT_ADOPTED_CLUSTER/${CT_ADOPTED_CLUSTER}/g" \
        ./scripts/config/adopted-cld.yaml | kubectl apply -n kcm-system -f -
else
    echo "Unsupported TEST_MODE: '$TEST_MODE'. Allowed values: aws, azure, gcp, adopted"
    exit 1
fi

CLDNAME=$cld_name ./scripts/wait_for_cld.sh

if [[ "$TEST_MODE" =~ ^(aws|azure|gcp)$ ]]; then
    # Store kubeconfig file for managed cluster
    kubectl get secret "$cld_name"-kubeconfig -n kcm-system -o jsonpath='{.data.value}' | base64 -d > "kcfg_$TEST_MODE"
fi
# For adopted, kcfg_adopted is already written above.
chmod 0600 "kcfg_$TEST_MODE"

if [[ "${TEST_ADOPTED_NOCNI:-false}" == true ]]; then
    # Nothing in kube-system can reach Ready before a CNI exists, and here the
    # CNI is the app under test - deploy_mcs.sh waits once it is deployed.
    echo "Skipping the kube-system and projectsveltos waits (no CNI in the '$TEST_MODE' cluster yet)"
else
    # Ensure running pods in kube-system
    NAMESPACE=kube-system ./scripts/wait_for_deployment.sh

    if kubectl get ns | grep "projectsveltos"; then
        NAMESPACE=projectsveltos ./scripts/wait_for_deployment.sh
    fi
fi

KUBECONFIG="kcfg_$TEST_MODE" kubectl get pods -A
echo "✅ k0rdent '$TEST_MODE' child cluster is ready!"
