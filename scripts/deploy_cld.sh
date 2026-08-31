#!/bin/bash
set -euo pipefail

# Credential/ClusterDeployment ops target the k0rdent management cluster.
export KUBECONFIG=kcfg_k0rdent

./scripts/setup_provider_credential.sh

if [[ "$TEST_MODE" =~ ^(aws|azure|gcp)$ ]]; then
    if [[ -e "apps/$APP/$TEST_MODE-cld.yaml" ]]; then
        cld_file="apps/$APP/$TEST_MODE-cld.yaml"
        echo "App specific '$cld_file' found."
    else
        cld_file="./scripts/config/$TEST_MODE-cld.yaml"
        echo -e "apps/$APP/$TEST_MODE-cld.yaml not found, using default: $cld_file"
    fi
    cld_cfg_str=$(sed -e "s/USER/${USER}/g" -e "s/AZURE_SUB_ID/${AZURE_SUB_ID}/g" \
        -e "s/GCP_PROJECT/${GCP_PROJECT}/g" -e "s/AWS_EC2_FAMILY/${AWS_EC2_FAMILY}/g" \
        "$cld_file")
    echo "$cld_cfg_str"
    for arg in "$@"; do
        if [[ "$arg" == "--dry-run" ]]; then
            echo "DRY-RUN mode: ClusterDeployment not created!"
            exit 0
        fi
    done
    echo "$cld_cfg_str" | kubectl apply -n kcm-system -f -
    cld_name="$TEST_MODE-example-$USER"
elif [[ "$TEST_MODE" == adopted ]]; then
    cld_name="adopted"

    # Shared network so the k0rdent controllers can reach the adopted API.
    docker network create k0rdent-net 2>/dev/null || true
    docker network connect k0rdent-net k0rdent 2>/dev/null || true

    if docker ps --filter name='^adopted$' -q | grep -q .; then
        echo "Adopted cluster already exists"
    else
        container_args=(-p 6444:6443)
        if [[ "${ADOPTED_EXPOSE_PORTS:-0}" == "1" ]]; then  # Avoid ephemeral port range conflicts in CI.
            container_args+=(-p 50080:80 -p 50443:443)
        fi
        k0s_cmd=(k0s controller --enable-worker)
        if [[ "${TEST_ADOPTED_NOCNI:-false}" == true ]]; then  # Avoid ephemeral port range conflicts in CI.
            echo "TEST_ADOPTED_NOCNI=true: starting the adopted cluster without a CNI"
            container_args+=(-e "K0S_CONFIG=$(cat ./scripts/config/k0s-nocni.yaml)")
            k0s_cmd=(k0s controller --enable-worker --config=/etc/k0s/config.yaml)
        fi
        docker run -d --name adopted --hostname adopted \
            --network k0rdent-net \
            -v /var/lib/k0s -v /var/log/pods \
            --tmpfs /run \
            --privileged \
            "${container_args[@]}" \
            docker.io/k0sproject/k0s:v1.36.3-k0s.0 \
            "${k0s_cmd[@]}"

        echo "Waiting for adopted kubeconfig..."
        until docker exec adopted k0s kubeconfig admin > kcfg_adopted 2>/dev/null; do
            sleep 2
        done
    fi

    # Recursively-shared mounts so propagation hostPath mounts work (kind does
    # this; the k0s image doesn't).
    docker exec adopted mount --make-rshared /

    # Local kubeconfig via the published API port (127.0.0.1 keeps macOS working).
    docker exec adopted k0s kubeconfig admin > kcfg_adopted
    sed -i.bak 's#server:.*#server: https://127.0.0.1:6444#' kcfg_adopted
    chmod 0600 kcfg_adopted

    if [[ "${TEST_ADOPTED_NOCNI:-false}" == true ]]; then
        echo "Waiting for the adopted node to register (stays NotReady until the CNI is deployed)..."
        until KUBECONFIG=kcfg_adopted kubectl get node adopted >/dev/null 2>&1; do
            KUBECONFIG=kcfg_adopted kubectl get nodes || true
            sleep 2
        done
        KUBECONFIG=kcfg_adopted kubectl get nodes
    else
        echo "Waiting for adopted kube-system pods to become Ready..."
        until KUBECONFIG=kcfg_adopted kubectl wait -n kube-system --for=condition=Ready pod --all --timeout=2s 2>/dev/null; do
            KUBECONFIG=kcfg_adopted kubectl get pods -n kube-system || true
            sleep 2
        done
    fi

    # Allow workloads on the single control-plane node.
    KUBECONFIG=kcfg_adopted kubectl taint nodes adopted node-role.kubernetes.io/control-plane:NoSchedule- 2>/dev/null || true

    if [[ "${TEST_ADOPTED_NOCNI:-false}" == true ]]; then
        # kube-proxy is disabled, so a CNI needs the real API endpoint to bootstrap.
        # k0s ships no kube-public/cluster-info, which is where charts look it up
        # (e.g. cilium's k8sServiceHost: auto).
        api_host=$(KUBECONFIG=kcfg_adopted kubectl get node adopted \
            -o jsonpath='{.status.addresses[?(@.type=="InternalIP")].address}')
        echo "Publishing kube-public/cluster-info with API endpoint $api_host:6443"
        KUBECONFIG=kcfg_adopted kubectl create configmap cluster-info -n kube-public \
            --from-literal=kubeconfig="$(printf 'apiVersion: v1\nkind: Config\nclusters:\n- name: k0s\n  cluster:\n    server: https://%s:6443\n' "$api_host")" \
            --dry-run=client -o yaml | KUBECONFIG=kcfg_adopted kubectl apply -f -

        # openebs is skipped: its pods cannot start before the CNI is deployed, so
        # this mode leaves the cluster without a default StorageClass.
        echo "Skipping openebs install (no CNI yet)"
    fi

    if [[ "${TEST_ADOPTED_PVC:-false}" == true ]]; then
        # Default StorageClass (openebs hostpath); k0s ships none.
        TEST_MODE=adopted ./scripts/install_openebs.sh
    fi

    # Internal kubeconfig for k0rdent (k0s sets the server to the container IP).
    ADOPTED_KUBECONFIG=$(docker exec adopted k0s kubeconfig admin | openssl base64 -A)
    kubectl patch secret adopted-credential-secret -n kcm-system -p='{"data":{"value":"'"$ADOPTED_KUBECONFIG"'"}}'
    kubectl apply -n kcm-system -f ./scripts/config/adopted-cld.yaml
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
    echo "Skipping the projectsveltos wait (no CNI in the '$TEST_MODE' cluster yet)"
elif kubectl get ns | grep "projectsveltos"; then
    NAMESPACE=projectsveltos ./scripts/wait_for_deployment.sh
fi
