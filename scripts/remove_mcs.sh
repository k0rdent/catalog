#!/bin/bash

kubectl delete multiclusterservice $EXAMPLE

NAMESPACE=$EXAMPLE ./scripts/wait_for_deployment_removal.sh
