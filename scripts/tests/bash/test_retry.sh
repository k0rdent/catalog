#!/bin/bash
# Tests for scripts/retry.sh
# shellcheck source=scripts/tests/bash/helpers.sh
source "$(dirname "${BASH_SOURCE[0]}")/helpers.sh"

# SLEEP=0 keeps the retry loop instant.

# Command that succeeds on the first attempt.
out=$(MAX_RETRIES=3 SLEEP=0 bash "$SCRIPTS_DIR/retry.sh" true 2>&1)
assert_eq "success -> exit 0" 0 "$?"
assert_contains "reports success" "$out" "Command succeeded"

# Command that always fails -> exhausts retries.
out=$(MAX_RETRIES=3 SLEEP=0 bash "$SCRIPTS_DIR/retry.sh" false 2>&1)
assert_eq "always-failing -> exit 1" 1 "$?"
assert_contains "reports giving up after MAX_RETRIES" "$out" "failed after 3 attempts"

# Command that fails once then succeeds -> retried and eventually passes.
counter="$(mktemp)"
echo 0 > "$counter"
# The body must NOT expand now; it runs later under `retry.sh bash -c`.
# shellcheck disable=SC2016
body='n=$(cat "'"$counter"'"); n=$((n+1)); echo "$n" > "'"$counter"'"; [ "$n" -ge 2 ]'
out=$(MAX_RETRIES=5 SLEEP=0 bash "$SCRIPTS_DIR/retry.sh" bash -c "$body" 2>&1)
assert_eq "fails-then-succeeds -> exit 0" 0 "$?"
assert_eq "ran exactly 2 attempts" 2 "$(cat "$counter")"
rm -f "$counter"

finish
