#!/bin/bash
set -euo pipefail

# Emit a kind-compatible cluster config for <name> on stdout, for k0sind
# --config. Only the ingress port mappings need it; the no-CNI case goes
# through --k0s-config instead.
#
# EXPOSE_PORTS=1 publishes 80/443 on the host - test_webpage.sh reaches the
# adopted cluster's ingress that way. Off by default: the ports clash in CI.
#
# The API server port is left to k0sind, so parallel environments don't
# collide; `k0sind get kubeconfig` carries the real address.

name="${1:?cluster name required}"

case "$name" in
    k0rdent) http=60080 https=60443 ;;
    *)       http=50080 https=50443 ;;
esac

echo "kind: Cluster"
echo "apiVersion: kind.x-k8s.io/v1alpha4"
echo "name: $name"
if [[ "${DISABLE_CNI:-false}" == true ]]; then
    printf 'networking:\n  disableDefaultCNI: true\n  kubeProxyMode: "none"\n'
fi
echo "nodes:"
echo "  - role: control-plane"
if [[ "${EXPOSE_PORTS:-0}" == "1" ]]; then
    echo "    extraPortMappings:"
    printf '      - {containerPort: 80, hostPort: %s, protocol: TCP}\n' "$http"
    printf '      - {containerPort: 443, hostPort: %s, protocol: TCP}\n' "$https"
fi
