#!/bin/bash
set -euo pipefail

if docker ps --filter name='^k0rdent$' -q | grep -q .; then
    docker rm -vf k0rdent
else
    echo "k0rdent cluster not found"
fi
# Remove the shared adopted network (no-op if still in use).
docker network rm k0rdent-net 2>/dev/null || true
rm -rf ./kcfg_k0rdent ./kcfg_k0rdent.bak
