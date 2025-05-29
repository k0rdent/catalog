#!/bin/bash

TIMEOUT=$((60 * 60))  
SECONDS=0
SLEEP_INTERVAL=10

while (( SECONDS < TIMEOUT )); do
  NOT_READY=$(kubectl get clusterdeployment -o jsonpath='{range .items[*]}{.metadata.name} {.status.conditions[?(@.type=="Ready")].status}{"\n"}{end}' | awk '$2 != "True"')

  if [ -z "$NOT_READY" ]; then
    echo "✅ All Clusters are ready."
    exit 0
  else
    echo "⏳ Still waiting for readiness..."
    echo "$NOT_READY"
  fi

  sleep "$SLEEP_INTERVAL"
done

echo "❌ Timeout after $((TIMEOUT / 60)) minutes: Some Clusters are still not ready."
echo "🔍 Inspecting problematic deployments..."

# Loop over each not-ready deployment and describe it
for name in $(echo "$NOT_READY" | awk '{print $1}'); do
  echo -e "\n--- 🔎 kubectl describe clusterdeployment $name ---"
  kubectl describe clusterdeployment "$name"

  echo -e "\n--- 📄 kubectl get clusterdeployment $name -o yaml | grep 'message' ---"
  kubectl get clusterdeployment "$name" -o yaml | grep -i 'message'
done

exit 1
