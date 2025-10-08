#!/bin/bash
set -euo pipefail

if [ $# -eq 0 ]; then
  echo "Usage: $0 APP1 [APP2 ...]"
  exit 1
fi

total=$#
count=0
for app in "$@"; do
  ((count++))
  echo "Testing end 2 end '$app' in '$TEST_MODE' [$count/$total]"
  APP="$app" ./scripts/install_servicetemplates.sh
  APP="$app" ./scripts/deploy_mcs.sh
  APP="$app" ./scripts/remove_mcs.sh

  echo "✅ '$app' tested end 2 end (✅ installed, ✅ deployed, ✅ removed) [$count/$total]"
done
