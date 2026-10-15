#!/bin/bash
set -euo pipefail

# Verify the GCP credentials before anything is provisioned.
#
# Usage: ./scripts/check_gcp_creds.sh
#
# Worth doing up front: with bad credentials k0rdent still creates the
# ClusterDeployment, CAPG then cannot reach GCP, and the cluster can no longer
# be deleted either - its finalizers wait on calls that will never succeed.

command -v gcloud >/dev/null 2>&1 || { echo "❌ gcloud CLI not found"; exit 1; }

# Activating a service account rewrites the gcloud config, so point it at a
# throwaway directory and leave the caller's own session alone.
CLOUDSDK_CONFIG=$(mktemp -d)
export CLOUDSDK_CONFIG
trap 'rm -rf "$CLOUDSDK_CONFIG"' EXIT

key=$(mktemp)
chmod 600 "$key"
trap 'rm -rf "$CLOUDSDK_CONFIG" "$key"' EXIT
if ! base64 -d <<<"$GCP_B64ENCODED_CREDENTIALS" > "$key" 2>/dev/null; then
    echo "❌ GCP_B64ENCODED_CREDENTIALS is not valid base64"
    exit 1
fi

if ! out=$(gcloud auth activate-service-account --key-file="$key" 2>&1); then
    echo "❌ GCP service account key is not valid"
    echo "$out"
    exit 1
fi
account=$(gcloud config get-value account 2>/dev/null)
echo "✅ Authenticated as $account"

# A valid key is not enough - CAPG needs access to the project itself.
if ! out=$(gcloud projects describe "$GCP_PROJECT" --format='value(name)' 2>&1); then
    echo "❌ No access to project '$GCP_PROJECT'"
    echo "$out"
    exit 1
fi
echo "✅ Project $GCP_PROJECT reachable ($out)"
