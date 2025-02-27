---
tags:
    - Service mesh 
    - Networking
title: "Istio"
description: "Open source service mesh that layers transparently onto existing distributed applications."
logo: "https://istio.io/latest/favicons/android-192x192.png"
---
![logo](https://istio.io/latest/favicons/android-192x192.png){ align="right", width="100" }
# Istio

=== "Description"

    Istio is an open source service mesh that layers transparently onto existing distributed applications. Istio’s powerful features provide a uniform and more efficient way to secure, connect, and monitor services. Istio is the path to load balancing, service-to-service authentication, and monitoring – with few or no service code changes.

    <br>
    Looking for Commercial Support? [LEARN MORE](https://tetrate.io/){ target="_blank" .bold }

=== "Install"

    #### Prerequisites

    Deploy k0rdent: [QuickStart](https://docs.k0rdent.io/v0.1.0/guide-to-quickstarts/#guide-to-quickstarts)

    #### Install template to k0rdent
    ~~~bash
    helm upgrade --install istio oci://ghcr.io/k0rdent/catalog/charts/kgst -n kcm-system \
      --set "helm.repository.url=https://istio-release.storage.googleapis.com/charts" \
      --set "prefix=istio-" \
      --set "helm.charts[0].name=base" \
      --set "helm.charts[0].version=1.24.3" \
      --set "helm.charts[1].name=istiod" \
      --set "helm.charts[1].version=1.24.3"
    ~~~

    #### Verify service template
    ~~~bash
    kubectl get servicetemplates -A
    # NAMESPACE    NAME                      VALID
    # kcm-system   istio-base-1-24-3         true
    # kcm-system   istio-istiod-1-24-3       true
    ~~~

    #### Deploy service template
    ~~~yaml
    apiVersion: k0rdent.mirantis.com/v1alpha1
    kind: ClusterDeployment
    # kind: MultiClusterService
    ...
      serviceSpec:
        services:
          - template: istio-base-1-24-3
            name: istio-base
            namespace: istio-system
          - template: istio-istiod-1-24-3
            name: istio-istiod
            namespace: istio-system
    ~~~

    - [Official docs](https://istio.io/latest/docs/ambient/install/helm/){ target="_blank" }