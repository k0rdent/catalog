#!/bin/bash

while true; do
    pods=$(kubectl get pods -n "$EXAMPLE" --no-headers 2>&1)
    echo "$pods"

    if grep "No resources" <<< "$pods"; then
        break
    fi

    echo "Some pods found..."
    sleep 3
done
