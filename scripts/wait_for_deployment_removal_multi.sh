#!/bin/bash
set -euo pipefail

NAMESPACE=${NAMESPACE:-default}

check_pods_removed() {
    local kubeconfig="$1"
    local cluster_name="$2"

    echo "🔍 Watching pod deletion in cluster '$cluster_name' (namespace: $NAMESPACE)"

    while true; do
        pods=$(KUBECONFIG="$kubeconfig" kubectl get pods -n "$NAMESPACE" --no-headers 2>&1 || true)

        echo "[$cluster_name/$NAMESPACE]"

        if grep -q "No resources found" <<< "$pods"; then
            echo "[$cluster_name] ✅ All pods removed!"
            break
        fi

        echo "$pods"
        echo "[$cluster_name] ⏳ Some pods still found..."
        sleep 3
    done
}

# Declare your kubeconfigs and readable cluster names
declare -A CLUSTERS

CLUSTERS["${GITHUB_RUN_ID}/aws/aws-cluster-${GITHUB_RUN_ID}.kubeconfig"]="aws-cluster"
CLUSTERS["${GITHUB_RUN_ID}/azure/azure-cluster-${GITHUB_RUN_ID}.kubeconfig"]="azure-cluster"
CLUSTERS["${GITHUB_RUN_ID}/gcp/gcp-cluster-${GITHUB_RUN_ID}.kubeconfig"]="gcp-cluster"


for kubeconfig in "${!CLUSTERS[@]}"; do
    check_pods_removed "$kubeconfig" "${CLUSTERS[$kubeconfig]}" &
done

wait
