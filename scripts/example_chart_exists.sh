#!/bin/bash
set -euo pipefail

chart="apps/$EXAMPLE/example/Chart.yaml"

if [[ -e "$chart" ]]; then
    echo "Example chart $chart exist."
else
    echo "Example chart $chart not found!"
    exit 1
fi
