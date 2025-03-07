#!/bin/bash
set -euo pipefail

KUBECONFIG=kcfg helm uninstall $APP -n $APP

NAMESPACE=$APP ./scripts/wait_for_deployment_removal.sh
