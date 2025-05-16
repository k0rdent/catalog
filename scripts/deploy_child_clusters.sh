#!/bin/bash
set -euo pipefail

aws_master_number=$(echo "$aws_settings" | jq -r '.master_number')
aws_master_instance_type=$(echo "$aws_settings" | jq -r '.master_type')
aws_worker_number=$(echo "$aws_settings" | jq -r '.worker_number')
aws_worker_instance_type=$(echo "$aws_settings" | jq -r '.worker_type')

azure_master_number=$(echo "$azure_settings" | jq -r '.master_number')
azure_master_instance_type=$(echo "$azure_settings" | jq -r '.master_type')
azure_worker_number=$(echo "$azure_settings" | jq -r '.worker_number')
azure_worker_instance_type=$(echo "$azure_settings" | jq -r '.worker_type')

gcp_master_number=$(echo "$gcp_settings" | jq -r '.master_number')
gcp_master_instance_type=$(echo "$gcp_settings" | jq -r '.master_type')
gcp_worker_number=$(echo "$gcp_settings" | jq -r '.worker_number')
gcp_worker_instance_type=$(echo "$gcp_settings" | jq -r '.worker_type')


for i in aws azure gcp; do
  mkdir -p "${GITHUB_RUN_ID}/${i}"
  cp "/home/runner/${i}/cluster.yaml" "${GITHUB_RUN_ID}/${i}/cluster.yaml"

master_number_var="${i}_master_number"
master_instance_var="${i}_master_instance_type"
worker_number_var="${i}_worker_number"
worker_instance_var="${i}_worker_instance_type"
cluster_name="$(echo "${i,,}")-cluster-${GITHUB_RUN_ID}"


  sed -i "s/MASTER_NUMBER/${!master_number_var}/g" "${GITHUB_RUN_ID}/${i}/cluster.yaml"
  sed -i "s/WORKER_NUMBER/${!worker_number_var}/g" "${GITHUB_RUN_ID}/${i}/cluster.yaml"
  sed -i "s/MASTER_INSTANCE/${!master_instance_var}/g" "${GITHUB_RUN_ID}/${i}/cluster.yaml"
  sed -i "s/WORKER_INSTANCE/${!worker_instance_var}/g" "${GITHUB_RUN_ID}/${i}/cluster.yaml"
  sed -i "s/CLUSTER_LABEL/${GITHUB_RUN_ID}/g" "${GITHUB_RUN_ID}/${i}/cluster.yaml"
  sed -i "s/CLUSTER_NAME/${cluster_name}/g" "${GITHUB_RUN_ID}/${i}/cluster.yaml"

  kubectl create -f  "${GITHUB_RUN_ID}/${i}/cluster.yaml"
done










