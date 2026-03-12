#!/bin/bash
set -euo pipefail

mcs="apps/$APP/mcs.yaml"

if [[ -e "$mcs" ]]; then
    echo "MultiClusterService config '$mcs' exist."
    cat "$mcs"
else
    example_folder=${EXAMPLE_FOLDER:-example}
    echo "MultiClusterService config '$mcs' not found, generating..."
    python3 ./scripts/utils.py render-mcs "$APP" -e "$example_folder"
fi
