#!/bin/bash
set -euo pipefail

# k0s generates the kube-apiserver serving certificate with a SAN list that
# includes the trailing-dot FQDN "kubernetes.default.svc.<clusterDomain>." .
# Go's FIPS-mode x509 parser rejects that as a malformed dNSName, so FIPS-only
# workloads (e.g. flux-operator) crash-loop with
#   tls: failed to parse certificate from server: x509: SAN dNSName is malformed
# when they talk to the in-cluster API.
#
# Regenerate the serving cert (signed by the existing k0s CA, reusing the same
# key) with the trailing-dot SAN dropped, then restart kube-apiserver. The CA is
# untouched, so existing kubeconfigs keep working; only the leaf SANs change.
#
# Usage: ./scripts/fix_adopted_cert_sans.sh [container]   (default: adopted)

CONTAINER="${1:-adopted}"
PKI="/var/lib/k0s/pki"

workdir="$(mktemp -d)"
trap 'rm -rf "$workdir"' EXIT

docker cp "$CONTAINER:$PKI/ca.crt" "$workdir/ca.crt"
docker cp "$CONTAINER:$PKI/ca.key" "$workdir/ca.key"
docker cp "$CONTAINER:$PKI/server.key" "$workdir/server.key"
docker cp "$CONTAINER:$PKI/server.crt" "$workdir/server.crt"

# Current SANs; drop any DNS entry that ends with a dot (the malformed FQDN).
# Parse from -text (portable across OpenSSL and macOS LibreSSL, which lacks -ext).
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

# Restart just kube-apiserver (the k0s supervisor brings it back with the new
# cert); a full container restart would make k0s regenerate the cert.
docker exec "$CONTAINER" pkill -f kube-apiserver || true

echo "Regenerated $CONTAINER kube-apiserver cert without the trailing-dot SAN; waiting for API to come back..."
until docker exec "$CONTAINER" k0s kubectl get --raw=/readyz >/dev/null 2>&1; do
    sleep 2
done
echo "✅ kube-apiserver is back up with cleaned SANs."
