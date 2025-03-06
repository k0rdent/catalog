#!/bin/bash

KUBECONFIG=kcfg helm uninstall $EXAMPLE -n $EXAMPLE

NAMESPACE=$EXAMPLE ./scripts/wait_for_deployment_removal.sh
