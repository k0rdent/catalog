#!/bin/bash
set -euo pipefail

# List the AWS resources the ClusterDeployment owns, so they can be deleted by
# hand if the normal teardown never ran. Once the management cluster is gone,
# their tags are the only thing left to find them by.
#
# Usage: [CLD_NAME=...] ./scripts/list_cld_resources_aws.sh [-x]
#
#   -x  also show each resource's state, which costs one API call per resource
#
# Only resources tagged `owned` are listed. CAPA marks resources it merely
# borrowed as `shared` and leaves bring-your-own infrastructure untagged, so
# nothing pre-existing shows up here.

want_state=false
[[ "${1:-}" == "-x" ]] && want_state=true

TEST_MODE=aws ./scripts/check_test_mode.sh -x
command -v aws >/dev/null 2>&1 || { echo "❌ AWS CLI not found"; exit 1; }

# Same naming convention as deploy_cld.sh / remove_cld.sh.
cld_name="${CLD_NAME:-aws-example-$USER}"
tag_key="sigs.k8s.io/cluster-api-provider-aws/cluster/${cld_name}"

echo "Cluster: $cld_name"
echo "Tag:     $tag_key=owned"
echo "Region:  $AWS_REGION"
echo ""

arns=$(aws resourcegroupstaggingapi get-resources --region "$AWS_REGION" \
    --tag-filters "Key=$tag_key,Values=owned" \
    --query 'ResourceTagMappingList[].ResourceARN' --output text \
    | tr '\t' '\n' | sed '/^$/d')

if [[ -z "$arns" ]]; then
    # Some app templates pin their own region (cilium uses us-west-1 for its
    # hardcoded AMI), so an empty result can just mean the cluster is elsewhere.
    echo "No resources found. Either everything is cleaned up, or the cluster"
    echo "runs in another region - rerun with AWS_REGION set to it."
    exit 0
fi

# One id at a time: the tagging API lags behind deletions, and a single
# already-gone id would fail a whole batch.
state_of() {  # $1 = <type>/<id> from the end of an ARN
    local id="${1#*/}"
    case "${1%%/*}" in
        instance)          set -- describe-instances --instance-ids 'Reservations[].Instances[].State.Name' ;;
        natgateway)        set -- describe-nat-gateways --nat-gateway-ids 'NatGateways[].State' ;;
        network-interface) set -- describe-network-interfaces --network-interface-ids 'NetworkInterfaces[].Status' ;;
        volume)            set -- describe-volumes --volume-ids 'Volumes[].State' ;;
        *) return 0 ;;
    esac
    aws ec2 "$1" --region "$AWS_REGION" "$2" "$id" --query "$3" --output text 2>/dev/null || echo gone
}

while IFS= read -r arn; do
    state=""
    $want_state && state=$(state_of "${arn##*:}")
    if [[ -n "$state" ]]; then printf '  %-70s [%s]\n' "$arn" "$state"; else echo "  $arn"; fi
done <<<"$arns"

echo ""
echo "$(wc -l <<<"$arns") resource(s). With -x, 'terminated', 'deleted' and 'gone'"
echo "are tombstones that clear on their own; anything else is a real leftover."
