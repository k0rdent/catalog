#!/bin/bash
set -euo pipefail

# Verify the Azure credentials before anything is provisioned.
#
# Usage: ./scripts/check_azure_creds.sh
#
# Worth doing up front: with bad credentials k0rdent still creates the
# ClusterDeployment, CAPZ then cannot reach Azure, and the cluster can no longer
# be deleted either - its finalizers wait on calls that will never succeed.
#
# Uses the OAuth client-credentials flow directly rather than `az login`, which
# would need the Azure CLI and would rewrite the caller's local az session.

token=$(curl -sS -X POST \
    "https://login.microsoftonline.com/${AZURE_SP_TENANT_ID}/oauth2/v2.0/token" \
    -H "Content-Type: application/x-www-form-urlencoded" \
    --data-urlencode "client_id=${AZURE_SP_APP_ID}" \
    --data-urlencode "client_secret=${AZURE_SP_PASSWORD}" \
    --data-urlencode "scope=https://management.azure.com/.default" \
    --data-urlencode "grant_type=client_credentials" \
    | python3 -c 'import sys,json; d=json.load(sys.stdin); print(d.get("access_token") or "ERR:"+d.get("error_description","unknown"))')

if [[ "$token" == ERR:* || -z "$token" ]]; then
    echo "❌ Azure service principal credentials are not valid"
    echo "${token#ERR:}"
    exit 1
fi
echo "✅ Service principal ${AZURE_SP_APP_ID} authenticated in tenant ${AZURE_SP_TENANT_ID}"

# A token only proves the app id, secret and tenant are right - the
# subscription id is a separate value and CAPZ needs access to it.
name=$(curl -sS -H "Authorization: Bearer $token" \
    "https://management.azure.com/subscriptions/${AZURE_SUB_ID}?api-version=2020-01-01" \
    | python3 -c 'import sys,json; d=json.load(sys.stdin); print(d.get("displayName") or "ERR:"+str(d.get("error",{}).get("message","unknown")))')

if [[ "$name" == ERR:* || -z "$name" ]]; then
    echo "❌ No access to subscription '${AZURE_SUB_ID}'"
    echo "${name#ERR:}"
    exit 1
fi
echo "✅ Subscription ${AZURE_SUB_ID} reachable ($name)"
