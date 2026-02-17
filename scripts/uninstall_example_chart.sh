#!/bin/bash
set -euo pipefail

ns=$(./scripts/get_mcs_namespace.sh)
KUBECONFIG="kcfg_$TEST_MODE" helm uninstall "$APP" -n "$ns"

NAMESPACE=$ns ./scripts/wait_for_deployment_removal.sh
