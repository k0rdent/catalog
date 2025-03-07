#!/bin/bash

helm upgrade --install $EXAMPLE oci://ghcr.io/k0rdent/catalog/charts/kgst \
  -n kcm-system \
  -f apps/$EXAMPLE/helm-values-kgst.yaml
