#!/bin/bash
set -euo pipefail

for i in aws azure gcp; do
  kubectl delete -f  "${GITHUB_RUN_ID}/${i}/cluster.yaml" --force &
done
