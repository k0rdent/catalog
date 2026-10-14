#!/bin/bash
set -euo pipefail

# Verify the AWS credentials before anything is provisioned.
#
# Usage: ./scripts/check_aws_creds.sh
#
# Worth doing up front: with bad credentials k0rdent still creates the
# ClusterDeployment, CAPA then cannot reach AWS, and the cluster can no longer
# be deleted either - its finalizers wait on calls that will never succeed.

command -v aws >/dev/null 2>&1 || { echo "❌ AWS CLI not found"; exit 1; }

# GetCallerIdentity needs no permissions at all, so a failure here means the
# keys themselves are wrong or expired, not that something is merely denied.
if ! arn=$(aws sts get-caller-identity --query Arn --output text 2>&1); then
    echo "❌ AWS credentials are not valid"
    echo "$arn"
    exit 1
fi
echo "✅ Authenticated as $arn"
