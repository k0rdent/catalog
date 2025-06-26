#!/bin/bash
set -euo pipefail

# Timeout after 10 minutes (600 seconds) - ingress setup can take time
TIMEOUT=$((10 * 60))
SECONDS=0

while (( SECONDS < TIMEOUT )); do
    echo "$TEST_MODE/$APP"
    ingress=$(KUBECONFIG="kcfg_$TEST_MODE" kubectl get ingress -n $APP --no-headers)
    echo "$ingress"
    address=$(echo "$ingress" | awk '{print $4}')
    if [[ -z "$address" ]]; then
        echo "No ingress address found (${SECONDS}s elapsed)"
        sleep 3
        continue
    fi
    echo "Ingress address: $address"

    host=$(echo "$ingress" | awk '{print $3}')
    if [[ -z "$host" ]]; then
        echo "No ingress host found (${SECONDS}s elapsed)"
        sleep 3
        continue
    fi
    echo "Ingress host: $host"

    ip_regex='^([0-9]{1,3}\.){3}[0-9]{1,3}$'
    if [[ "$TEST_MODE" == local ]]; then
        if echo "$ingress" | grep "443"; then # use port 443 if exposed
            ip="127.0.0.1:50443"
        else
            ip="127.0.0.1:50080"
        fi
    elif [[ "$address" =~ $ip_regex ]]; then # ingress ADDRESS column can contains both ip address (azure) and hostname (aws)
        ip="$address"
    else
        ip=$(dig +short "$address" | head -n 1)
        if [[ -z "$ip" ]]; then
            echo "No ip address found (${SECONDS}s elapsed)"
            sleep 3
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

if (( SECONDS >= TIMEOUT )); then
    echo "❌ Timeout reached after ${TIMEOUT}s: Webpage test failed"
    echo "🔍 Final ingress status:"
    KUBECONFIG="kcfg_$TEST_MODE" kubectl get ingress -n $APP -o wide || true
    exit 1
fi
