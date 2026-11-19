#!/bin/bash
set -euo pipefail

# Emit a kind cluster config for <name> on stdout.
# Usage: create_kind_config.sh <name>
#
# The API server port is left to kind (a free ephemeral one), so parallel
# environments don't fight over it; `kind get kubeconfig` has the real address.
#
# EXPOSE_PORTS=1  publish the HTTP/HTTPS (and NodePort) mappings. Off by
#                 default: they clash with the ephemeral port range in CI.
# DISABLE_CNI=true  no CNI and no kube-proxy, for apps that provide them
#                 themselves. The node stays NotReady until the app is deployed.
# WORKERS=n       extra worker nodes (default 0, control-plane schedules pods).

name="${1:?cluster name required}"

# Host ports kept from the pre-k0s kind setup so existing docs/NodePort tests
# keep working.
case "$name" in
    k0rdent) extra_ports=(80:60080 443:60443) ;;
    adopted) extra_ports=(80:50080 443:50443 30080:40080 30443:40443 5432:55432) ;;
    *)       extra_ports=() ;;
esac

cat <<EOF
kind: Cluster
apiVersion: kind.x-k8s.io/v1alpha4
name: $name
EOF

if [[ "${DISABLE_CNI:-false}" == true ]]; then
    echo "networking:"
    echo "  disableDefaultCNI: true"
    echo "  kubeProxyMode: \"none\""
fi

echo "nodes:"
echo "  - role: control-plane"
if [[ "${EXPOSE_PORTS:-0}" == "1" && ${#extra_ports[@]} -gt 0 ]]; then
    echo "    extraPortMappings:"
    for mapping in "${extra_ports[@]}"; do
        echo "      - containerPort: ${mapping%%:*}"
        echo "        hostPort: ${mapping##*:}"
        echo "        protocol: TCP"
    done
fi
for _ in $(seq 1 "${WORKERS:-0}"); do
    echo "  - role: worker"
done
