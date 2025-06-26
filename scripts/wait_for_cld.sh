#!/bin/bash
set -euo pipefail

# Timeout after 15 minutes (900 seconds) - clusters can take longer to provision
TIMEOUT=$((15 * 60))
SECONDS=0

while (( SECONDS < TIMEOUT )); do
    cld_out=$(kubectl get cld -n kcm-system | grep "$CLDNAME")
    if echo "$cld_out" | awk '{print $2}' | grep 'True'; then
        echo "✅ Cluster is ready!"
        break
    fi
    echo "$cld_out"
    echo "⏳ Waiting for cluster... (${SECONDS}s elapsed)"
    sleep 3
done

if (( SECONDS >= TIMEOUT )); then
    echo "❌ Timeout reached after ${TIMEOUT}s: Cluster '$CLDNAME' is still not ready"
    echo "🔍 Final cluster status:"
    kubectl get cld -n kcm-system -o wide
    exit 1
fi
