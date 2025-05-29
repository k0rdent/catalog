#!/bin/bash
set -euo pipefail

TIMEOUT=$((25 * 60))
NAMESPACE=${NAMESPACE:-default}
WAIT_FOR_PODS=${WAIT_FOR_PODS:-""}

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' 

check_cluster() {
    local kubeconfig="$1"
    local cluster_name="$2"

    local seconds=0

    echo -e "\n${BLUE}============================================================"
    echo -e "🔍 Checking deployment status in cluster: $cluster_name"
    echo -e "🔍 Namespace: $NAMESPACE"
    echo -e "🕒 Timestamp: $(date '+%Y-%m-%d %H:%M:%S')"
    echo -e "============================================================${NC}\n"

    while (( seconds < TIMEOUT )); do
        echo "$cluster_name/$NAMESPACE"
        pods=$(KUBECONFIG="$kubeconfig" kubectl get pods -n "$NAMESPACE" --no-headers 2>&1)
        echo "$pods"
        pods_json=$(KUBECONFIG="$kubeconfig" kubectl get pods -n "$NAMESPACE" -o json 2>/dev/null || true)

        if [[ -z "$pods_json" ]]; then
            echo -e "${YELLOW}[$cluster_name] No pods found or error getting pods${NC}"
            sleep 3
            ((seconds+=3))
            continue
        fi

        all_ready=true
        pod_count=$(jq '.items | length' <<< "$pods_json")
        if [[ "$pod_count" -eq 0 ]]; then
            echo -e "${YELLOW}[$cluster_name] ⏳ No pods found in the namespace yet${NC}"
            sleep 3
            ((seconds+=3))
            continue
        fi

        echo -e "${BLUE}[$cluster_name] Checking $pod_count pods...${NC}"

        for row in $(jq -r '.items[] | @base64' <<< "$pods_json"); do
            _jq() {
                echo "${row}" | base64 --decode | jq -r "${1}"
            }

            name=$(_jq '.metadata.name')
            status=$(_jq '.status.phase')
            ready_containers=$(_jq 'if .status.containerStatuses != null then [.status.containerStatuses[] | select(.ready == true)] | length else 0 end')
            total_containers=$(_jq 'if .status.containerStatuses != null then .status.containerStatuses | length else 0 end')

            if [[ "$status" == "Succeeded" ]]; then
                continue
            elif [[ "$status" == "Running" ]]; then
                if [[ "$ready_containers" -ne "$total_containers" ]]; then
                    all_ready=false
                fi
            else
                all_ready=false
            fi
        done

        for wait_for_pod in ${WAIT_FOR_PODS}; do
            if ! jq -r '.items[].metadata.name' <<< "$pods_json" | grep -q "$wait_for_pod"; then
                all_ready=false
                echo -e "${RED}[$cluster_name] Expected pod '$wait_for_pod' not found!${NC}"
                break
            fi
        done

        if $all_ready; then
            echo -e "${GREEN}[$cluster_name] ✅ All pods are ready!${NC}"
            return 0
        else
            echo -e "${YELLOW}[$cluster_name] ⏳ Some pods are not ready yet...${NC}"
        fi

        sleep 3
        ((seconds+=3))
    done

    echo -e "${RED}[$cluster_name] ❌ Timeout reached: Some pods are still not ready${NC}"
    echo -e "${BLUE}[$cluster_name] 🔍 Dumping pod statuses for debugging...${NC}"

    for row in $(jq -r '.items[] | @base64' <<< "$pods_json"); do
        _jq() {
            echo "${row}" | base64 --decode | jq -r "${1}"
        }

        pod_name=$(_jq '.metadata.name')
        pod_phase=$(_jq '.status.phase')

        echo "📦 Pod: $pod_name (Phase: $pod_phase)"

        container_count=$(_jq '.status.containerStatuses | length')
        for (( i=0; i<container_count; i++ )); do
            cname=$(_jq ".status.containerStatuses[$i].name")
            ready=$(_jq ".status.containerStatuses[$i].ready")
            state=$(_jq ".status.containerStatuses[$i].state | keys[0]")
            reason=$(_jq ".status.containerStatuses[$i].state.${state}.reason // \"-\"")
            message=$(_jq ".status.containerStatuses[$i].state.${state}.message // \"-\"")

            echo " └─ Container: $cname"
            echo "    • Ready: $ready"
            echo "    • State: $state"
            echo "    • Reason: $reason"
            echo "    • Message: $message"
        done
        echo ""
    done

    return 1
}

declare -A CLUSTERS

CLUSTERS["${GITHUB_RUN_ID}/aws/aws-cluster-${GITHUB_RUN_ID}.kubeconfig"]="aws-cluster"
CLUSTERS["${GITHUB_RUN_ID}/azure/azure-cluster-${GITHUB_RUN_ID}.kubeconfig"]="azure-cluster"
CLUSTERS["${GITHUB_RUN_ID}/gcp/gcp-cluster-${GITHUB_RUN_ID}.kubeconfig"]="gcp-cluster"

for kubeconfig in "${!CLUSTERS[@]}"; do
    check_cluster "$kubeconfig" "${CLUSTERS[$kubeconfig]}" &
done

wait
