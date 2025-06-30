#!/bin/bash
set -euo pipefail

# Timeout after 10 minutes (600 seconds) - pod removal should be relatively quick (set 10 mins due to cert-manager)
TIMEOUT=$((10 * 60))
SECONDS=0

while (( SECONDS < TIMEOUT )); do
    pods=$(KUBECONFIG="kcfg_$TEST_MODE" kubectl get pods -n "$NAMESPACE" --no-headers 2>&1)
    echo "$TEST_MODE/$NAMESPACE"
    if grep "No resources" <<< "$pods"; then
        echo "✅ All pods removed!"
        break
    fi
    echo "$pods"

    echo "⏳ Some pods found... (${SECONDS}s elapsed)"
    sleep 3
done

if (( SECONDS >= TIMEOUT )); then
    echo "❌ Timeout reached after ${TIMEOUT}s: Some pods in namespace '$NAMESPACE' are still not removed"
    echo "🔍 Final pod status:"
    KUBECONFIG="kcfg_$TEST_MODE" kubectl get pods -n "$NAMESPACE" -o wide 2>&1 || true
    exit 1
fi
