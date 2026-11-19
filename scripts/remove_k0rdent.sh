#!/bin/bash
set -euo pipefail

if kind get clusters 2>/dev/null | grep -qx k0rdent; then
    kind delete cluster -n k0rdent
else
    echo "k0rdent cluster not found"
fi
rm -rf ./kcfg_k0rdent ./kcfg_k0rdent.bak
