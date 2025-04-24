#!/bin/bash

while true; do
    cld_out=$(kubectl get cld -n kcm-system)
    if ! echo "$cld_out" | grep "$CLDNAME"; then
        echo "✅ Cluster not found!"
        break
    fi
    echo "$cld_out"
    echo "⏳ Cluster still found"
    sleep 3
done
