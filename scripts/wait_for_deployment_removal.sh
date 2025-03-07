#!/bin/bash
set -euo pipefail

while true; do
    pods=$(KUBECONFIG=kcfg kubectl get pods -n "$NAMESPACE" --no-headers 2>&1)
    echo "$pods"

    if grep "No resources" <<< "$pods"; then
        break
    fi

    echo "Some pods found..."
    sleep 3
done
