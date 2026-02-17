#!/bin/bash
# AWS k0rdent provider
export AWS_ACCESS_KEY_ID="FILL"
export AWS_SECRET_ACCESS_KEY="FILL"
export AWS_EC2_FAMILY="t3" # (t3 - amd64, t4g - arm64, ...)

# Azure k0rdent provider
export AZURE_SP_PASSWORD="FILL"
export AZURE_SP_APP_ID="FILL"
export AZURE_SP_TENANT_ID="FILL"
export AZURE_SUB_ID="FILL"

# GCP (Google) k0rdent provider
export GCP_B64ENCODED_CREDENTIALS="FILL"
export GCP_PROJECT="FILL"

# Try run in terminal $CHROME_CMD, fix if it doesn't work
export CHROME_CMD="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
export USE_CHROME=yes # set "no" to disable
