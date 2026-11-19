#!/bin/bash
set -euo pipefail

if k0sind get clusters 2>/dev/null | grep -qx k0rdent; then
    k0sind delete cluster --name k0rdent --kubeconfig kcfg_k0rdent
else
    echo "k0rdent cluster not found"
fi
rm -rf ./kcfg_k0rdent ./kcfg_k0rdent.bak
