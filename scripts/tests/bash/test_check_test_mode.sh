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

# -x additionally requires the provider variables of the mode.
# env -u: the assertions must not depend on a sourced scripts/set_envs.sh.
out=$(env -u AWS_ACCESS_KEY_ID -u AWS_SECRET_ACCESS_KEY -u AWS_EC2_FAMILY \
    TEST_MODE=aws bash "$SCRIPTS_DIR/check_test_mode.sh" -x 2>&1)
rc=$?
assert_eq "'-x' rejects aws without credentials (exit 1)" 1 "$rc"
assert_contains "names every missing aws variable" "$out" \
    "AWS_ACCESS_KEY_ID AWS_SECRET_ACCESS_KEY AWS_EC2_FAMILY"

out=$(env -u AWS_SECRET_ACCESS_KEY TEST_MODE=aws AWS_ACCESS_KEY_ID=a AWS_EC2_FAMILY=t3 \
    bash "$SCRIPTS_DIR/check_test_mode.sh" -x 2>&1)
assert_eq "'-x' rejects a partially set aws env (exit 1)" 1 "$?"
assert_contains "names only the missing one" "$out" "requires: AWS_SECRET_ACCESS_KEY"

TEST_MODE=aws AWS_ACCESS_KEY_ID=a AWS_SECRET_ACCESS_KEY=b AWS_EC2_FAMILY=t3 \
    bash "$SCRIPTS_DIR/check_test_mode.sh" -x >/dev/null 2>&1
assert_eq "'-x' accepts a complete aws env (exit 0)" 0 "$?"

TEST_MODE=adopted bash "$SCRIPTS_DIR/check_test_mode.sh" -x >/dev/null 2>&1
assert_eq "'-x' accepts adopted, which needs no variables (exit 0)" 0 "$?"

out=$(env -u AZURE_SP_APP_ID TEST_MODE=azure bash "$SCRIPTS_DIR/check_test_mode.sh" -x 2>&1)
assert_contains "names the azure variables" "$out" "AZURE_SP_APP_ID"

out=$(env -u GCP_B64ENCODED_CREDENTIALS TEST_MODE=gcp bash "$SCRIPTS_DIR/check_test_mode.sh" -x 2>&1)
assert_contains "names the gcp variables" "$out" "GCP_B64ENCODED_CREDENTIALS"

# Without the flag the old behaviour stands: no variables needed.
TEST_MODE=aws bash "$SCRIPTS_DIR/check_test_mode.sh" >/dev/null 2>&1
assert_eq "without '-x' aws still passes with no credentials (exit 0)" 0 "$?"

finish
