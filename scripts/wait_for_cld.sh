#!/bin/bash
set -euo pipefail

while true; do
    cld_out=$(kubectl get cld -n kcm-system | grep "$CLDNAME")
    if echo "$cld_out" | grep 'ClusterDeployment is ready'; then
        break
    fi
    echo "$cld_out"
    echo "Waiting for cluster..."
    sleep 3
done
