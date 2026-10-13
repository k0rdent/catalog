#!/bin/bash
set -euo pipefail

# Usage: check_test_mode.sh [-x]
#
#   (no flag)  validate TEST_MODE only
#   -x         also require the provider variables that mode needs
#
# The flag is opt-in on purpose: remove_cld.sh deletes a cluster and must keep
# working without credentials, while everything that provisions should fail here
# rather than halfway through, on a bare "unbound variable".

check_vars=false
while getopts ':x' opt; do
    case "$opt" in
        x) check_vars=true ;;
        *) echo "Usage: $0 [-x]"; exit 1 ;;
    esac
done

if [[ ! "$TEST_MODE" =~ ^(aws|azure|gcp|adopted)$ ]]; then
  echo "❌ Invalid TEST_MODE='$TEST_MODE'"
  echo "Allowed values: aws, azure, gcp, adopted"
  exit 1
fi

if [[ "$check_vars" == true ]]; then
    case "$TEST_MODE" in
        aws)     required=(AWS_ACCESS_KEY_ID AWS_SECRET_ACCESS_KEY AWS_EC2_FAMILY) ;;
        azure)   required=(AZURE_SP_APP_ID AZURE_SP_PASSWORD AZURE_SP_TENANT_ID AZURE_SUB_ID) ;;
        gcp)     required=(GCP_B64ENCODED_CREDENTIALS GCP_PROJECT) ;;
        adopted) required=() ;;
    esac

    missing=()
    # ${a[@]+...} keeps an empty array working under `set -u` on bash 3.2 (macOS).
    for var in ${required[@]+"${required[@]}"}; do
        [[ -n "${!var:-}" ]] || missing+=("$var")
    done

    if [[ ${#missing[@]} -gt 0 ]]; then
        echo "❌ TEST_MODE='$TEST_MODE' requires: ${missing[*]}"
        echo "Set them in ./scripts/set_envs.sh locally, or as repository secrets in CI."
        exit 1
    fi
fi
