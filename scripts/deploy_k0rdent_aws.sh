#!/bin/bash
set -euo pipefail

# Deploy k0rdent (kcm) with the AWS cluster provider only.
#
# The default install brings up every provider k0rdent ships, which costs a lot
# of time and memory on a CI runner. Same trick as deploy_k0rdent_mini.sh: install
# the chart with createManagement disabled, then apply a Management that lists
# only what aws-standalone-cp needs.
#
# Usage: KCM_VERSION=1.12.0 ./scripts/deploy_k0rdent_aws.sh

export KUBECONFIG=kcfg_k0rdent
export KCM_VERSION="${KCM_VERSION:-1.12.0}"

# The Management references a release named after the chart version.
kcm_release="kcm-${KCM_VERSION//./-}"
echo "Deploying k0rdent $KCM_VERSION (release $kcm_release) with the AWS provider only"

export HELM_VALUES=./scripts/config/min-kcm-values.yaml
./scripts/deploy_k0rdent.sh

sed "s/KCM_RELEASE/${kcm_release}/" ./scripts/config/aws-kcm-management.yaml | kubectl apply -f -

kubectl create ns projectsveltos --dry-run=client -o yaml | kubectl apply -f -

# Second pass waits for the Management to go Ready and for the provider pods.
./scripts/deploy_k0rdent.sh

echo "Enabled providers:"
kubectl get management kcm -o jsonpath='{range .spec.providers[*]}  - {.name}{"\n"}{end}'
