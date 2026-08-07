#!/bin/bash
set -euo pipefail

# Regenerate the k0s kube-apiserver cert without the trailing-dot SAN
# "kubernetes.default.svc.<domain>." that FIPS-only clients (flux-operator)
# reject as malformed. Signed by the existing CA (kubeconfigs keep working).
# Usage: ./scripts/fix_adopted_cert_sans.sh [container]   (default: adopted)

CONTAINER="${1:-adopted}"
PKI="/var/lib/k0s/pki"

workdir="$(mktemp -d)"
trap 'rm -rf "$workdir"' EXIT

docker cp "$CONTAINER:$PKI/ca.crt" "$workdir/ca.crt"
docker cp "$CONTAINER:$PKI/ca.key" "$workdir/ca.key"
docker cp "$CONTAINER:$PKI/server.key" "$workdir/server.key"
docker cp "$CONTAINER:$PKI/server.crt" "$workdir/server.crt"

# Read SANs via -text (portable; macOS LibreSSL lacks -ext).
sans=$(openssl x509 -in "$workdir/server.crt" -noout -text \
    | awk '/Subject Alternative Name/{getline; print}' \
    | tr ',' '\n' | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')

if ! grep -q 'DNS:.*\.$' <<<"$sans"; then
    echo "No trailing-dot SAN on $CONTAINER kube-apiserver cert; nothing to do."
    exit 0
fi

{
    echo "[req]"
    echo "distinguished_name = dn"
    echo "req_extensions = v3"
    echo "prompt = no"
    echo "[dn]"
    echo "O = kubernetes"
    echo "CN = kubernetes"
    echo "[v3]"
    echo "keyUsage = critical, digitalSignature, keyEncipherment"
    echo "extendedKeyUsage = serverAuth"
    echo "subjectAltName = @alt"
    echo "[alt]"
    d=0
    i=0
    while read -r entry; do
        case "$entry" in
            DNS:*.)  ;; # drop the malformed trailing-dot FQDN
            DNS:*)   d=$((d+1)); echo "DNS.$d = ${entry#DNS:}" ;;
            "IP Address:"*) i=$((i+1)); echo "IP.$i = ${entry#IP Address:}" ;;
        esac
    done <<<"$sans"
} > "$workdir/san.cnf"

openssl req -new -key "$workdir/server.key" -out "$workdir/server.csr" -config "$workdir/san.cnf"
openssl x509 -req -in "$workdir/server.csr" -CA "$workdir/ca.crt" -CAkey "$workdir/ca.key" \
    -CAcreateserial -out "$workdir/server.new.crt" -days 365 \
    -extfile "$workdir/san.cnf" -extensions v3

docker cp "$workdir/server.new.crt" "$CONTAINER:$PKI/server.crt"
docker exec "$CONTAINER" chown kube-apiserver "$PKI/server.crt"
docker exec "$CONTAINER" chmod 0644 "$PKI/server.crt"

# Restart only kube-apiserver (a full container restart would regenerate the cert).
docker exec "$CONTAINER" pkill -f kube-apiserver || true

echo "Regenerated $CONTAINER kube-apiserver cert without the trailing-dot SAN; waiting for API to come back..."
until docker exec "$CONTAINER" k0s kubectl get --raw=/readyz >/dev/null 2>&1; do
    sleep 2
done
echo "✅ kube-apiserver is back up with cleaned SANs."
