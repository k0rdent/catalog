#!/bin/bash
# AWS k0rdent provider
export AWS_ACCESS_KEY_ID="FILL"
export AWS_SECRET_ACCESS_KEY="FILL"
export AWS_EC2_FAMILY="t3" # (t3 - amd64, t4g - arm64, ...)
export AWS_REGION="eu-central-1"

# Azure k0rdent provider
export AZURE_SP_PASSWORD="FILL"
export AZURE_SP_APP_ID="FILL"
export AZURE_SP_TENANT_ID="FILL"
export AZURE_SUB_ID="FILL"
export AZURE_LOCATION="westus"

# GCP (Google) k0rdent provider
export GCP_B64ENCODED_CREDENTIALS="FILL"
export GCP_PROJECT="FILL"
export GCP_REGION="us-west1"

# Try run in terminal $CHROME_CMD, fix if it doesn't work
export CHROME_CMD="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
export USE_CHROME=yes # set "no" to disable
