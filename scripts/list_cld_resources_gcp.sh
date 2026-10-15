#!/bin/bash
set -euo pipefail

# List the GCP resources the ClusterDeployment owns, so they can be deleted by
# hand if the normal teardown never ran.
#
# Usage: TEST_MODE=gcp [CLD_NAME=...] ./scripts/list_cld_resources_gcp.sh
#
# Matches on the name prefix, not on labels: GCP resources are project-scoped
# with no equivalent of an AWS tag filter or an Azure resource group, and CAPG
# names everything after the cluster. Anything it creates under a different
# name would be missed here.

./scripts/check_test_mode.sh -x
[[ "$TEST_MODE" == gcp ]] || { echo "Only TEST_MODE=gcp is supported, got '$TEST_MODE'"; exit 1; }
command -v gcloud >/dev/null 2>&1 || { echo "❌ gcloud CLI not found"; exit 1; }

# Same naming convention as deploy_cld.sh / remove_cld.sh.
cld_name="${CLD_NAME:-$TEST_MODE-example-$USER}"

# Keep the caller's own gcloud session untouched.
CLOUDSDK_CONFIG=$(mktemp -d)
key=$(mktemp)
export CLOUDSDK_CONFIG
trap 'rm -rf "$CLOUDSDK_CONFIG" "$key"' EXIT
chmod 600 "$key"
base64 -d <<<"$GCP_B64ENCODED_CREDENTIALS" > "$key"
gcloud auth activate-service-account --key-file="$key" >/dev/null 2>&1 \
    || { echo "❌ Could not authenticate, run ./scripts/check_gcp_creds.sh"; exit 1; }

echo "Cluster: $cld_name"
echo "Project: $GCP_PROJECT"
echo ""

found=0
for kind in instances disks addresses firewall-rules forwarding-rules \
            target-pools health-checks routers networks; do
    out=$(gcloud compute "$kind" list --project "$GCP_PROJECT" \
        --filter="name~^${cld_name}" --format='value(name)' 2>/dev/null || true)
    [[ -z "$out" ]] && continue
    while IFS= read -r n; do
        printf '  %-55s %s\n' "$n" "$kind"
        found=$((found + 1))
    done <<<"$out"
done

if [[ "$found" -eq 0 ]]; then
    echo "No resources found. Either everything is cleaned up, or the cluster"
    echo "runs in another project - rerun with GCP_PROJECT set to it."
    exit 0
fi

echo ""
echo "$found resource(s). Delete them with the normal teardown while the"
echo "management cluster is still alive:  TEST_MODE=gcp ./scripts/remove_cld.sh"
