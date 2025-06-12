#!/bin/bash
set -euo pipefail

while true; do
    echo "$TEST_MODE/$APP"
    ingress=$(KUBECONFIG="kcfg_$TEST_MODE" kubectl get ingress -n $APP --no-headers)
    echo "$ingress"
    address=$(echo "$ingress" | awk '{print $4}')
    if [[ -z "$address" ]]; then
        echo "No ingress address found"
        sleep 3
        continue
    fi
    echo "Ingress address: $address"

    host=$(echo "$ingress" | awk '{print $3}')
    if [[ -z "$host" ]]; then
        echo "No ingress host found"
        sleep 3
        continue
    fi
    echo "Ingress host: $host"

    ip_regex='^([0-9]{1,3}\.){3}[0-9]{1,3}$'
    protocol="http"
    if [[ "$TEST_MODE" == local ]]; then
        if echo "$ingress" | grep "443"; then # use port 443 if exposed
            ip="127.0.0.1:50443"
            protocol="https"
        else
            ip="127.0.0.1:50080"
        fi
    elif [[ "$address" =~ $ip_regex ]]; then # ingress ADDRESS column can contains both ip address (azure) and hostname (aws)
        ip="$address"
    else
        ip=$(dig +short "$address" | head -n 1)
        if [[ -z "$ip" ]]; then
            echo "No ip address found"
            sleep 3
            continue
        fi
    fi
    echo "IP address: $ip"

    http_code=$(curl -H "Host: $host" "http://$ip" -o /dev/null -s -w "%{http_code}\n")
    echo "HTTP code: $http_code"

    if [[ "$USE_CHROME" == yes ]]; then
        "$CHROME_CMD" --host-resolver-rules="MAP $host $ip" "$protocol://$host"
    fi
    exit 0
done
