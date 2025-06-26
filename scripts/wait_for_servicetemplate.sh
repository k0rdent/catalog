#!/bin/bash
set -euo pipefail

# Timeout after 10 minutes (600 seconds)
TIMEOUT=$((10 * 60))
SECONDS=0

while (( SECONDS < TIMEOUT )); do
    output=$(KUBECONFIG="kcfg_k0rdent" kubectl get servicetemplate -A --no-headers)
    echo "$output"
    if grep -q -v "true" <<< "$output"; then
        echo "⏳ Some service templates not validated! (${SECONDS}s elapsed)"
        sleep 3
        continue
    fi
    echo "✅ All servicetemplates OK"
    break
done

if (( SECONDS >= TIMEOUT )); then
    echo "❌ Timeout reached after ${TIMEOUT}s: Some service templates are still not validated"
    echo "🔍 Final service template status:"
    KUBECONFIG="kcfg_k0rdent" kubectl get servicetemplate -A -o wide
    exit 1
fi
