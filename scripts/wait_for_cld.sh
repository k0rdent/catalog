#!/bin/bash

while true; do
    cld_out=$(kubectl get cld | grep "$CLDNAME")
    if echo "$cld_out" | grep 'ClusterDeployment is ready'; then
        break
    fi
    echo "cld_out"
    echo "Waiting for cluster..."
    sleep 3
done
