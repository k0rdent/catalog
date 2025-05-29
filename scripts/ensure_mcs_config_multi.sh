#!/bin/bash
set -euo pipefail

echo "Generating MultiClusterService config for $APP"
python3 ./scripts/utils.py render-mcs-multi $APP

