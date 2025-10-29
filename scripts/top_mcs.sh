#!/bin/bash
set -euo pipefail

KUBECONFIG="kcfg_$TEST_MODE" kubectl top nodes
ns=$(./scripts/get_mcs_namespace.sh)
KUBECONFIG="kcfg_$TEST_MODE" kubectl top pods -n "$ns"
