#!/bin/bash

kubectl delete mcs $APP --wait=false

ns=$(./scripts/get_mcs_namespace.sh)
NAMESPACE=$ns ./scripts/wait_for_deployment_removal.sh
kubectl delete multiclusterservice $APP 2>/dev/null

if kubectl get mcs "$APP" 2>/dev/null; then
    echo "❌ Multicluster service '$APP' not removed!"
    exit 1
fi
echo "✅ Multicluster service '$APP' removed!"
