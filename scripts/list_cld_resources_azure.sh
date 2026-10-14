#!/bin/bash
set -euo pipefail

# List the Azure resources the ClusterDeployment owns, so they can be deleted by
# hand if the normal teardown never ran.
#
# Usage: TEST_MODE=azure [CLD_NAME=...] ./scripts/list_cld_resources_azure.sh
#
# Simpler than the AWS side: CAPZ puts everything into one resource group named
# after the cluster, so there is no tag to match and no ordering to worry about
# - deleting the group takes the whole cluster with it.

./scripts/check_test_mode.sh -x
[[ "$TEST_MODE" == azure ]] || { echo "Only TEST_MODE=azure is supported, got '$TEST_MODE'"; exit 1; }

# Same naming convention as deploy_cld.sh / remove_cld.sh.
cld_name="${CLD_NAME:-$TEST_MODE-example-$USER}"
api="https://management.azure.com/subscriptions/${AZURE_SUB_ID}/resourceGroups/${cld_name}"

token=$(curl -sS -X POST \
    "https://login.microsoftonline.com/${AZURE_SP_TENANT_ID}/oauth2/v2.0/token" \
    -H "Content-Type: application/x-www-form-urlencoded" \
    --data-urlencode "client_id=${AZURE_SP_APP_ID}" \
    --data-urlencode "client_secret=${AZURE_SP_PASSWORD}" \
    --data-urlencode "scope=https://management.azure.com/.default" \
    --data-urlencode "grant_type=client_credentials" \
    | python3 -c 'import sys,json; print(json.load(sys.stdin).get("access_token",""))')
[[ -n "$token" ]] || { echo "❌ Could not authenticate, run ./scripts/check_azure_creds.sh"; exit 1; }

echo "Cluster:        $cld_name"
echo "Resource group: $cld_name"
echo ""

curl -sS -H "Authorization: Bearer $token" "${api}/resources?api-version=2021-04-01" \
    | python3 -c '
import sys, json
d = json.load(sys.stdin)
if "error" in d:
    print("Resource group not found - either everything is cleaned up, or the")
    print("cluster was created under a different name.")
    raise SystemExit(0)
items = d.get("value", [])
for r in items:
    print("  %-60s %s" % (r["name"], r["type"]))
print()
print("%d resource(s). Delete them with the normal teardown while the management" % len(items))
print("cluster is still alive:  TEST_MODE=azure ./scripts/remove_cld.sh")
print("Otherwise the whole group goes in one step:")
print("  az group delete --name %s --yes" % "'"$cld_name"'")
'
