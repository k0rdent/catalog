#!/bin/bash
set -euo pipefail

for repo in $(yq -r '.dependencies[].repository' "$CHART_LOCK" | sort -u); do
  if [[ "$repo" == oci://* ]]; then
    echo "Skipping OCI repo: $repo"
    continue
  fi
  name=$(basename "$repo")
  echo "Adding repo '$name' => $repo"
  helm repo add "$name" "$repo"
done
