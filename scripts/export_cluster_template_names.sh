#!/bin/bash

# Export CT_* with the ClusterTemplate names installed in the management
# cluster, so the *-cld.yaml files do not pin a version that goes stale with
# every k0rdent release.
#
# Must be sourced - the exports have to reach the caller:
#   source ./scripts/export_cluster_template_names.sh

cluster_templates=$(kubectl get clustertemplate -n kcm-system \
    -o custom-columns=NAME:.metadata.name --no-headers)

# Newest template of one family, e.g. aws-standalone-cp -> aws-standalone-cp-1-0-43.
# The release installs every template regardless of the enabled providers.
ct_of() {
    echo "$cluster_templates" | grep "^$1-[0-9]" | sort -V | tail -1
}

export CT_ADOPTED_CLUSTER CT_AWS_STANDALONE_CP CT_AWS_EKS \
    CT_AZURE_STANDALONE_CP CT_AZURE_AKS CT_GCP_STANDALONE_CP CT_GCP_GKE

CT_ADOPTED_CLUSTER=$(ct_of adopted-cluster)
CT_AWS_STANDALONE_CP=$(ct_of aws-standalone-cp)
CT_AWS_EKS=$(ct_of aws-eks)
CT_AZURE_STANDALONE_CP=$(ct_of azure-standalone-cp)
CT_AZURE_AKS=$(ct_of azure-aks)
CT_GCP_STANDALONE_CP=$(ct_of gcp-standalone-cp)
CT_GCP_GKE=$(ct_of gcp-gke)
