#!/bin/bash
# Tests for scripts/check_test_mode.sh
# shellcheck source=scripts/tests/bash/helpers.sh
source "$(dirname "${BASH_SOURCE[0]}")/helpers.sh"

for mode in aws azure gcp adopted; do
    TEST_MODE="$mode" bash "$SCRIPTS_DIR/check_test_mode.sh" >/dev/null 2>&1
    assert_eq "'$mode' is accepted (exit 0)" 0 "$?"
done

out=$(TEST_MODE=bogus bash "$SCRIPTS_DIR/check_test_mode.sh" 2>&1)
rc=$?
assert_eq "'bogus' is rejected (exit 1)" 1 "$rc"
assert_contains "prints invalid-mode error" "$out" "Invalid TEST_MODE='bogus'"
assert_contains "lists allowed values" "$out" "aws, azure, gcp, adopted"

out=$(TEST_MODE="" bash "$SCRIPTS_DIR/check_test_mode.sh" 2>&1)
assert_eq "empty TEST_MODE is rejected (exit 1)" 1 "$?"

finish
