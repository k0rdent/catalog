#!/bin/bash
set -uo pipefail

# Runner for the bash script tests. Discovers test_*.sh next to this file,
# runs each in its own process, and reports a summary. No dependencies beyond
# bash + coreutils, so it runs the same on Linux and macOS.
#
# Usage:
#   ./scripts/tests/bash/run.sh              # run all bash tests
#   ./scripts/tests/bash/run.sh test_retry.sh  # run a single test file

DIR="$(cd "$(dirname "$0")" && pwd)"

if [[ $# -gt 0 ]]; then
    tests=()
    for arg in "$@"; do tests+=("$DIR/$arg"); done
else
    tests=("$DIR"/test_*.sh)
fi

total=0
failed=0
for t in "${tests[@]}"; do
    echo "== $(basename "$t") =="
    if ! bash "$t"; then
        failed=$((failed + 1))
    fi
    total=$((total + 1))
done

echo
echo "Test files: $((total - failed))/$total passed"
[[ "$failed" -eq 0 ]]
