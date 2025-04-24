#!/bin/bash

while true; do
    pods=$(KUBECONFIG="kcfg_$TEST_MODE" kubectl get pods -n "$NAMESPACE" --no-headers 2>&1)
    echo "$TEST_MODE/$NAMESPACE"
    if grep "No resources" <<< "$pods"; then
        echo "✅ All pods removed!"
        break
    fi
    echo "$pods"

    echo "⏳ Some pods found..."
    sleep 3
done
