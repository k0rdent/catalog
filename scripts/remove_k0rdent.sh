#!/bin/bash
set -euo pipefail

kind_cluster="${KIND_CLUSTER:-k0rdent}"
if kind get clusters | grep "k0rdent"; then
    kind delete cluster -n "${kind_cluster}"
else
    echo "${kind_cluster} cluster not found"
fi
rm "kcfg_${kind_cluster}"
