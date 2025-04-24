#!/bin/bash
set -euo pipefail

while true; do
    output=$(KUBECONFIG="kcfg_k0rdent" kubectl get servicetemplate -A --no-headers)
    echo "$output"
    if grep -q -v "true" <<< "$output"; then
        echo "⏳ Some service templates not validated!"
        sleep 3
        continue
    fi
    echo "✅ All servicetemplates OK"
    break
done
