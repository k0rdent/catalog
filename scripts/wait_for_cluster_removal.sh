#!/bin/bash

while true; do
    if ! kubectl get cld | grep aws-example-$USER; then
        echo "Cluster not found"
        break
    fi
    echo "Cluster still found"
    sleep 3
done
