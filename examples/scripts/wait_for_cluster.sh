#!/bin/bash

while true; do
    if kubectl get cld | grep aws-example-$USER | grep 'ClusterDeployment is ready'; then
        break
    fi
    echo "Waiting for cluster..."
    sleep 3
done
