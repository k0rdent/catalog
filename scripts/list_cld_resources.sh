#!/bin/bash
set -euo pipefail

# List the AWS resources the ClusterDeployment owns, so they can be deleted by
# hand if the normal teardown never ran. The management cluster lives on a CI
# runner, and once that is gone nothing in AWS knows these resources exist -
# their tags are the only thing left to find them by.
#
# Usage: TEST_MODE=aws [AWS_REGION=eu-central-1] ./scripts/list_cld_resources.sh
#
# Only resources tagged `owned` are listed. CAPA tags anything it created that
# way, marks resources merely borrowed from elsewhere as `shared`, and leaves
# bring-your-own infrastructure untagged - so nothing pre-existing shows up here.

./scripts/check_test_mode.sh

if [[ "$TEST_MODE" != aws ]]; then
    echo "Only TEST_MODE=aws is supported, got '$TEST_MODE'"
    exit 1
fi

if ! command -v aws >/dev/null 2>&1; then
    echo "❌ AWS CLI not found"
    exit 1
fi

# Same naming convention as deploy_cld.sh / remove_cld.sh.
cldname="$TEST_MODE-example-$USER"
tag_key="sigs.k8s.io/cluster-api-provider-aws/cluster/${cldname}"

echo "Cluster: $cldname"
echo "Tag:     $tag_key=owned"
echo ""

arns=$(aws resourcegroupstaggingapi get-resources \
    --tag-filters "Key=$tag_key,Values=owned" \
    --query 'ResourceTagMappingList[].ResourceARN' --output text \
    | tr '\t' '\n' | sed '/^$/d')

if [[ -z "$arns" ]]; then
    # The API is regional, so an empty result can just mean the wrong region.
    echo "No resources found in region '$(aws configure get region || echo unset)'."
    echo "Set AWS_REGION if the cluster runs elsewhere."
    exit 0
fi

while IFS= read -r arn; do echo "  $arn"; done <<<"$arns"
echo ""
echo "$(wc -l <<<"$arns") resource(s). Delete them with the normal teardown while"
echo "the management cluster is still alive:  TEST_MODE=aws ./scripts/remove_cld.sh"
