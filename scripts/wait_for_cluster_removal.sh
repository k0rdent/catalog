#!/bin/bash
set -euo pipefail

# Timeout after 15 minutes (900 seconds) - cluster removal should be faster than creation
TIMEOUT=$((15 * 60))
SECONDS=0

while (( SECONDS < TIMEOUT )); do
    cld_out=$(kubectl get cld -n kcm-system)
    if ! echo "$cld_out" | grep "$CLDNAME"; then
        echo "✅ Cluster not found!"
        break
    fi
    echo "$cld_out"
    echo "⏳ Cluster still found... (${SECONDS}s elapsed)"
    sleep 3
done

if (( SECONDS >= TIMEOUT )); then
    echo "❌ Timeout reached after ${TIMEOUT}s: Cluster '$CLDNAME' is still not removed"
    echo "🔍 Final cluster status:"
    kubectl get cld -n kcm-system -o wide
    exit 1
fi
