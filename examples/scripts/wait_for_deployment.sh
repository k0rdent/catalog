#!/bin/bash

while true; do
    pods=$(kubectl get pods -n "$EXAMPLE" --no-headers 2>&1)
    echo "$pods"  # Print the pod list to stdout

    # Extract statuses
    statusList=$(echo "$pods" | awk '{print $3}')

    if ! grep -q "Running" <<< "$statusList"; then
        echo "No running pods found..."
    elif ! grep -q -v "Running" <<< "$statusList"; then
        echo "Only running pods found"
        break
    else
        echo "Some pods are not in Running state"
    fi

    sleep 3
done
