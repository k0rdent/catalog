#!/bin/bash

kubectl delete multiclusterservice $APP -n kcm-system

ns=$(./scripts/get_mcs_namespace.sh)
NAMESPACE=$ns ./scripts/wait_for_deployment_removal_multi.sh
