#!/bin/bash
set -euo pipefail

while true; do
    pods=$(KUBECONFIG="kcfg_$TEST_MODE" kubectl get pods -n "$NAMESPACE" --no-headers 2>&1)
    echo "$TEST_MODE/$NAMESPACE"
    echo "$pods"  # Print the pod list to stdout

    # Extract statuses
    statusList=$(echo "$pods" | awk '{print $3}')
    pattern="!((/Running/ && (/1\/1/ || /2\/2/ || /3\/3/ || /4\/4/ || /5\/5/ || /6\/6/ || /7\/7/)) || /Completed/)"
    if ! grep -q "Running" <<< "$statusList"; then
        echo "No running pods found..."
    elif ! awk "$pattern" <<< "$pods" | grep -q .; then
        echo "Only running pods found"
        break
    else
        echo "Some pods are not in Running state"
    fi

    sleep 3
done
