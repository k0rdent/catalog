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
        # Publish only the ports the harness uses (ingress 50080/50443 + API);
        # extra ephemeral-range ports intermittently clash on CI runners.
        docker run -d --name adopted --hostname adopted \
            --network k0rdent-net \
            -v /var/lib/k0s -v /var/log/pods \
            --tmpfs /run \
            --privileged \
            -p 6444:6443 \
            -p 50080:80 \
            -p 50443:443 \
            docker.io/k0sproject/k0s:v1.36.3-k0s.0

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

    echo "Waiting for adopted kube-system pods to become Ready..."
    until KUBECONFIG=kcfg_adopted kubectl wait -n kube-system --for=condition=Ready pod --all --timeout=2s 2>/dev/null; do
        KUBECONFIG=kcfg_adopted kubectl get pods -n kube-system || true
        sleep 2
    done

    # Allow workloads on the single control-plane node.
    KUBECONFIG=kcfg_adopted kubectl taint nodes adopted node-role.kubernetes.io/control-plane:NoSchedule- 2>/dev/null || true

    # Drop the malformed trailing-dot apiserver SAN (breaks FIPS-only clients).
    ./scripts/fix_adopted_cert_sans.sh adopted

    # Default StorageClass (openebs hostpath); k0s ships none.
    TEST_MODE=adopted ./scripts/install_openebs.sh

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

if kubectl get ns | grep "projectsveltos"; then
    NAMESPACE=projectsveltos ./scripts/wait_for_deployment.sh
fi
