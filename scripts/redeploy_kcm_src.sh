#!/bin/bash
set -euo pipefail

# Rebuild kcm images from KCM_SRC_DIR and roll them out to the running k0rdent cluster.
# Go code only: changed charts/templates need a version bump and a full redeploy.
#
# Usage: KCM_SRC_DIR=~/repos/kcm ./scripts/redeploy_kcm_src.sh

export KUBECONFIG=kcfg_k0rdent

if [[ -z "${KCM_SRC_DIR:-}" ]]; then
    echo "KCM_SRC_DIR is required"
    exit 1
fi
source ./scripts/kcm_source.sh

kcm_source_images
import_image_into_k0s "$IMG" k0rdent
import_image_into_k0s "$IMG_TELEMETRY" k0rdent

# Same tag and pullPolicy IfNotPresent: a restart picks up the freshly imported image.
kubectl -n kcm-system rollout restart deploy/kcm-controller-manager deploy/kcm-regional-telemetry
kubectl -n kcm-system rollout status deploy/kcm-controller-manager deploy/kcm-regional-telemetry --timeout=5m
