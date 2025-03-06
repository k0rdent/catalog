#!/bin/bash

if [[ "$EXAMPLE_MODE" == local ]]; then
    cldname="adopted"
else
    cldname="aws-example-$USER"
fi

kubectl delete cld "$cldname"

while true; do
    if ! kubectl get cld | grep "$cldname"; then
        echo "Cluster not found"
        break
    fi
    echo "Cluster still found"
    sleep 3
done

if [[ "$EXAMPLE_MODE" == local ]]; then
    helm uninstall adopted-credential -n kcm-system
    kind delete cluster -n adopted
fi
