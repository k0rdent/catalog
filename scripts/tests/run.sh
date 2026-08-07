#!/bin/bash
set -euo pipefail

# Convenience runner for the Python unit tests.
# Creates (and reuses) a local virtualenv so it works on machines with an
# externally-managed Python (PEP 668) without touching system packages.
#
# Usage:
#   ./scripts/tests/run.sh                # run all Python unit tests
#   ./scripts/tests/run.sh -k parse_human # pass extra args straight to pytest

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"

VENV="$ROOT/.venv-test"
if [[ ! -d "$VENV" ]]; then
    echo "Creating test virtualenv in $VENV"
    python3 -m venv "$VENV"
fi
# shellcheck disable=SC1091
source "$VENV/bin/activate"

python3 -m pip install --quiet --upgrade pip
python3 -m pip install --quiet -r scripts/requirements.txt pytest

exec python3 -m pytest scripts/tests "$@"
