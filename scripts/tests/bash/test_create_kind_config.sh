#!/bin/bash
# Tests for scripts/create_kind_config.sh
# shellcheck source=scripts/tests/bash/helpers.sh
source "$(dirname "${BASH_SOURCE[0]}")/helpers.sh"

workdir="$(mktemp -d)"
cd "$workdir" || exit 1

# Defaults: 1 control-plane + 1 worker (MASTERS/WORKERS unset).
bash "$SCRIPTS_DIR/create_kind_config.sh" >/dev/null
assert_eq "default control-plane count" 1 "$(grep -c 'role: control-plane' kind-config.yaml)"
assert_eq "default worker count" 1 "$(grep -c 'role: worker' kind-config.yaml)"
assert_contains "has kind apiVersion" "$(cat kind-config.yaml)" "kind.x-k8s.io/v1alpha4"

# Custom counts.
MASTERS=3 WORKERS=2 bash "$SCRIPTS_DIR/create_kind_config.sh" >/dev/null
assert_eq "3 control-plane nodes" 3 "$(grep -c 'role: control-plane' kind-config.yaml)"
assert_eq "2 worker nodes" 2 "$(grep -c 'role: worker' kind-config.yaml)"

cd / && rm -rf "$workdir"
finish
