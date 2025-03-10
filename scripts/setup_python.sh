#!/bin/bash

if [[ -e ".venv" ]]; then
    echo "Python environment exists."
else
    python3 -m venv .venv
fi

source .venv/bin/activate

pip install -r ./scripts/requirements.txt
