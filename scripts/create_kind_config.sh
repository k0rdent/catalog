#!/bin/bash
set -euo pipefail


MASTERS=${MASTERS:-1}
WORKERS=${WORKERS:-1}

echo "Creating KIND config with $MASTERS masters and $WORKERS workers"

cat <<EOF > kind-config.yaml
kind: Cluster
apiVersion: kind.x-k8s.io/v1alpha4
nodes:
EOF

for i in $(seq 1 $MASTERS); do
  echo "- role: control-plane" >> kind-config.yaml
done

for i in $(seq 1 $WORKERS); do
  echo "- role: worker" >> kind-config.yaml
done
