#!/bin/bash
set -euo pipefail

# Credential and ClusterDeployment operations always target the k0rdent
# management cluster. Unlike kind, k0s-in-docker keeps its kubeconfig in a
# standalone file instead of merging into ~/.kube/config.
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

    # The adopted cluster shares a Docker network with the k0rdent cluster so
    # that the k0rdent controllers can reach the adopted API server directly.
    docker network create k0rdent-net 2>/dev/null || true
    docker network connect k0rdent-net k0rdent 2>/dev/null || true

    if docker ps --filter name='^adopted$' -q | grep -q .; then
        echo "Adopted cluster already exists"
    else
        # Publish the ingress ports the test harness checks (test_webpage.sh
        # hits 127.0.0.1:50080 / 50443) plus the API server port. The old kind
        # config also mapped NodePort (40080/40443) and postgres (55432), but
        # nothing in the harness uses them and, being in the ephemeral range,
        # they intermittently collide with in-use ports on CI runners (docker
        # run then fails with "address already in use", exit 125).
        docker run -d --name adopted --hostname adopted \
            --network k0rdent-net `# shared network with the k0rdent cluster` \
            -v /var/lib/k0s -v /var/log/pods `# this is where k0s stores its data` \
            --tmpfs /run `# this is where k0s stores runtime data` \
            --privileged `# this is the easiest way to enable container-in-container workloads` \
            -p 6444:6443 `# publish the Kubernetes API server port` \
            -p 50080:80 `# web (ingress http)` \
            -p 50443:443 `# web (ingress https)` \
            docker.io/k0sproject/k0s:v1.36.3-k0s.0

        echo "Waiting for adopted kubeconfig..."
        until docker exec adopted k0s kubeconfig admin > kcfg_adopted 2>/dev/null; do
            sleep 2
        done
    fi

    # Make the node's mounts recursively shared (kind does this in its node
    # entrypoint, the k0s image does not). Without it, workloads that hostPath-
    # mount a path with mount propagation (e.g. istio-cni's /var/run/netns,
    # node-exporter's /, velero's node-agent) fail to start with
    # "path ... is mounted on ... but it is not a shared or slave mount".
    docker exec adopted mount --make-rshared /

    # Local kubeconfig for host access via the published API port. k0s already
    # includes 127.0.0.1 in the API certificate SANs, so TLS stays valid. Using
    # 127.0.0.1 (not the container IP) keeps this working on macOS too, where
    # container IPs are not routable from the host.
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

    # Drop the malformed trailing-dot SAN from the kube-apiserver cert so
    # FIPS-only workloads (e.g. flux-operator) can talk to the API. Done before
    # k0rdent connects and before any service is deployed.
    ./scripts/fix_adopted_cert_sans.sh adopted

    # Give the adopted cluster a default StorageClass (openebs hostpath); k0s
    # ships none out of the box.
    TEST_MODE=adopted ./scripts/install_openebs.sh

    # Internal kubeconfig handed to k0rdent: k0s sets the server to the
    # container's Docker-network IP, which is reachable from the k0rdent
    # controllers and is present in the API certificate SANs.
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
# For adopted the kubeconfig (kcfg_adopted) is already written above, and k0s
# ships metrics-server in kube-system, so no extra setup is needed here.
chmod 0600 "kcfg_$TEST_MODE" # set minimum attributes to kubeconfig (owner read/write)

if kubectl get ns | grep "projectsveltos"; then
    NAMESPACE=projectsveltos ./scripts/wait_for_deployment.sh
fi
