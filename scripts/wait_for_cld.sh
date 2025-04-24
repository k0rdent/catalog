#!/bin/bash
set -euo pipefail

while true; do
    cld_out=$(kubectl get cld -n kcm-system | grep "$CLDNAME")
    if echo "$cld_out" | awk '{print $2}' | grep 'True'; then
        echo "✅ Cluster is ready!"
        break
    fi
    echo "$cld_out"
    echo "⏳ Waiting for cluster..."
    sleep 3
done
