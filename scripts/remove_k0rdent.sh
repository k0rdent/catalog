#!/bin/bash
set -euo pipefail

if kind get clusters | grep "k0rdent"; then
    kind delete cluster -n k0rdent
else
    echo "k0rdent cluster not found"
fi
rm kcfg_k0rdent
