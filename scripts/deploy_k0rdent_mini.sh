#!/bin/bash
set -euo pipefail

# Deploy k0rdent (kcm) with the AWS cluster provider only.
#
# The default install brings up every provider k0rdent ships, which costs a lot
# of time and memory on a CI runner. Same trick as deploy_k0rdent_mini.sh: install
# the chart with createManagement disabled, then apply a Management that lists
# only what aws-standalone-cp needs.
#
# Usage: TEST_MODE=aws KCM_VERSION=1.12.0 ./scripts/deploy_k0rdent_mini.sh
#        TEST_MODE=aws KCM_SRC_DIR=~/repos/kcm ./scripts/deploy_k0rdent_mini.sh

export KUBECONFIG=kcfg_k0rdent
export KCM_VERSION="${KCM_VERSION:-1.12.0}"

kcm_mgmt_file="./scripts/config/$TEST_MODE-kcm-management.yaml"
if [[ ! -e "$kcm_mgmt_file" ]]; then
    echo "File '$kcm_mgmt_file' not found! Maybe wrong TEST_MODE: $TEST_MODE ?"
    exit 1
fi

export HELM_VALUES=./scripts/config/min-kcm-values.yaml
./scripts/deploy_k0rdent.sh

# The Management references a release named after the chart version.
if [[ -n "${KCM_SRC_DIR:-}" ]]; then
    source ./scripts/kcm_source.sh
    KCM_VERSION="$(kcm_chart_version)"
fi
kcm_release="kcm-${KCM_VERSION//./-}"
echo "Applying Management (release $kcm_release) with the $TEST_MODE provider only"

# Management reinstalls kcm, so core.kcm.config must repeat the install values,
# otherwise a source build reverts to the published images.
{
    sed "s/KCM_RELEASE/${kcm_release}/" "$kcm_mgmt_file"
    if [[ -n "${KCM_SRC_DIR:-}" ]]; then
        echo "  core:"
        echo "    kcm:"
        echo "      config: $(helm get values kcm -n kcm-system -o json | tr -d "\n")"
    fi
} | kubectl apply -f -

kubectl create ns projectsveltos --dry-run=client -o yaml | kubectl apply -f -

# Second pass waits for the Management to go Ready and for the provider pods.
./scripts/deploy_k0rdent.sh

echo "Enabled providers:"
kubectl get management kcm -o jsonpath='{range .spec.providers[*]}  - {.name}{"\n"}{end}'
