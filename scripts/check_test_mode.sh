#!/bin/bash
set -euo pipefail

if [[ ! "$TEST_MODE" =~ ^(aws|azure|gcp|adopted)$ ]]; then
  echo "❌ Invalid TEST_MODE='$TEST_MODE'"
  echo "Allowed values: aws, azure, gcp, adopted"
  exit 1
fi
