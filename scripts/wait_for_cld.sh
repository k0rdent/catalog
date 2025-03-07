#!/bin/bash

while true; do
    cld_out=$(kubectl get cld | grep "$CLDNAME")
    echo "$cld_out"
    if echo "$cld_out" | grep 'ClusterDeployment is ready'; then
        break
    fi
    echo "Waiting for cluster..."
    sleep 3
done
