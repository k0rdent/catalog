#!/bin/bash

while true; do
    sleep 3
    ingress=$(kubectl get ingress -n $EXAMPLE --no-headers)
    echo "$ingress"
    address=$(echo "$ingress" | awk '{print $4}')
    if [[ -z "$address" ]]; then
        echo "No ingress address found"
        continue
    fi
    echo "Ingress address: $address"

    host=$(echo "$ingress" | awk '{print $3}')
    if [[ -z "$host" ]]; then
        echo "No ingress host found"
        continue
    fi
    echo "Ingress host: $host"

    if [[ "$EXAMPLE_MODE" == local ]]; then
        ip="127.0.0.1:50080"
    else
        ip=$(dig +short "$address" | head -n 1)
        if [[ -z "$ip" ]]; then
            echo "No ip address found"
            continue
        fi
    fi
    echo "IP address: $ip"

    http_code=$(curl -H "Host: $host" "http://$ip" -o /dev/null -s -w "%{http_code}\n")
    echo "HTTP code: $http_code"

    if [[ "$USE_CHROME" == yes ]]; then
        "$CHROME_CMD" --host-resolver-rules="MAP $host $ip" "http://$host"
    fi
    exit 0
done
