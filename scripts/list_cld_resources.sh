#!/bin/bash
set -euo pipefail

# List the AWS resources belonging to the ClusterDeployment, so they can be
# deleted by hand if the normal teardown never ran (the management cluster lives
# on a CI runner, and once that is gone nothing in AWS knows these resources
# exist).
#
# Usage: TEST_MODE=aws ./scripts/list_cld_resources.sh
#
# Reads two independent sources:
#   1. the management cluster, which holds the IDs CAPA wrote back
#   2. AWS itself, by the tag CAPA puts on everything it creates
# The second one keeps working after the management cluster is gone.

export KUBECONFIG=kcfg_k0rdent

./scripts/check_test_mode.sh

if [[ "$TEST_MODE" != aws ]]; then
    echo "Only TEST_MODE=aws is supported, got '$TEST_MODE'"
    exit 1
fi

# Same naming convention as deploy_cld.sh / remove_cld.sh.
cldname="$TEST_MODE-example-$USER"

# Everything CAPA creates carries this tag.
tag_key="sigs.k8s.io/cluster-api-provider-aws/cluster/${cldname}"

echo "Cluster:  $cldname"
echo "Tag:      $tag_key=owned"
echo ""

region=""

# --- 1. From the management cluster ------------------------------------------
if kubectl get awscluster "$cldname" -n kcm-system >/dev/null 2>&1; then
    awscluster=$(kubectl get awscluster "$cldname" -n kcm-system -o json)
    region=$(jq -r '.spec.region // empty' <<<"$awscluster")

    echo "── From the management cluster (AWSCluster/$cldname, region ${region:-unknown})"
    jq -r '
      .spec.network as $n
      | [ "vpc               \($n.vpc.id // "-")",
          "internetGateway   \($n.vpc.internetGatewayId // "-")" ]
        + [ $n.subnets[]? | "subnet            \(.id)\(if .natGatewayId then "  natGateway \(.natGatewayId)" else "" end)" ]
        + [ .status.networkStatus.securityGroups // {} | to_entries[] | "securityGroup     \(.value.id)  (\(.key))" ]
        + [ .status.networkStatus.apiServerElb.name // empty | "loadBalancer      \(.)" ]
        + [ .status.networkStatus.natGatewaysIPs[]? | "natGatewayIP      \(.)" ]
      | .[]' <<<"$awscluster" | sed 's/^/  /'

    machines=$(kubectl get awsmachine -n kcm-system \
        -l "cluster.x-k8s.io/cluster-name=$cldname" -o json 2>/dev/null || echo '{"items":[]}')
    # providerID looks like aws:///<availability-zone>/<instance-id>.
    jq -r '.items[] | select(.spec.providerID) | "  instance          \(.spec.providerID | split("/") | last)"' \
        <<<"$machines"
    echo ""
else
    echo "── No AWSCluster '$cldname' in the management cluster"
    echo "   (already deleted, or kcfg_k0rdent is not the management cluster)"
    echo ""
fi

# --- 2. From AWS, by tag ------------------------------------------------------
if ! command -v aws >/dev/null 2>&1; then
    echo "── AWS CLI not found, skipping the tag lookup. Install it and rerun, or query manually:"
    echo "   aws resourcegroupstaggingapi get-resources \\"
    echo "     --tag-filters Key=$tag_key,Values=owned"
    exit 0
fi

region_args=()
# ${a[@]+...} keeps an empty array working under `set -u` on bash 3.2 (macOS).
[[ -n "$region" ]] && region_args=(--region "$region")

echo "── From AWS, tagged $tag_key=owned"
arns=$(aws resourcegroupstaggingapi get-resources ${region_args[@]+"${region_args[@]}"} \
    --tag-filters "Key=$tag_key,Values=owned" \
    --query 'ResourceTagMappingList[].ResourceARN' --output text 2>/dev/null \
    | tr '\t' '\n' | sed '/^$/d')

if [[ -n "$arns" ]]; then
    while IFS= read -r arn; do echo "  $arn"; done <<<"$arns"
else
    echo "  (nothing returned - either all cleaned up, or the tag differs)"
fi

# The tagging API does not cover every networking resource, so ask EC2 directly.
# Response keys and the filter flag differ per subcommand, hence the explicit table.
echo ""
echo "── EC2 networking with the same tag key (the tagging API can miss these)"
ec2_queries=(
    "describe-vpcs|Vpcs[].VpcId|--filters"
    "describe-subnets|Subnets[].SubnetId|--filters"
    "describe-internet-gateways|InternetGateways[].InternetGatewayId|--filters"
    "describe-nat-gateways|NatGateways[].NatGatewayId|--filter"
    "describe-security-groups|SecurityGroups[].GroupId|--filters"
    "describe-route-tables|RouteTables[].RouteTableId|--filters"
    "describe-network-interfaces|NetworkInterfaces[].NetworkInterfaceId|--filters"
    "describe-addresses|Addresses[].AllocationId|--filters"
    "describe-instances|Reservations[].Instances[].InstanceId|--filters"
)
for entry in "${ec2_queries[@]}"; do
    IFS='|' read -r subcmd query filter_flag <<<"$entry"
    out=$(aws ec2 "$subcmd" ${region_args[@]+"${region_args[@]}"} \
        "$filter_flag" "Name=tag-key,Values=$tag_key" \
        --query "$query" --output text 2>/dev/null || true)
    [[ -n "$out" ]] && echo "  ${subcmd#describe-}: $(echo "$out" | tr '\n\t' '  ')"
done

echo ""
echo "Delete with the normal teardown while the management cluster is alive:"
echo "  TEST_MODE=aws ./scripts/remove_cld.sh"
