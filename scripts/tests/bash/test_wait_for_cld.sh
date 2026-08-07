#!/bin/bash
# Tests for scripts/wait_for_cld.sh using a mocked kubectl.
# shellcheck source=scripts/tests/bash/helpers.sh
source "$(dirname "${BASH_SOURCE[0]}")/helpers.sh"

setup_mock_bin

# Mock kubectl so that `kubectl get cld ...` reports the cluster as Ready
# (second column == "True"), which is what wait_for_cld.sh checks for.
write_mock kubectl <<'EOF'
#!/bin/bash
echo "adopted   True   0/0   adopted-cluster-1-0-2   Ready   5m"
EOF

out=$(CLDNAME=adopted bash "$SCRIPTS_DIR/wait_for_cld.sh" 2>&1)
assert_eq "ready cluster -> exit 0" 0 "$?"
assert_contains "reports cluster ready" "$out" "Cluster is ready"

rm -rf "$MOCK_BIN"
finish
