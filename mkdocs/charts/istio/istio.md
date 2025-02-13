---
title: "Istio"
description: "Networking and security solution specifically designed for Kubernetes clusters."
logo: "https://istio.io/latest/favicons/android-192x192.png"
---
![logo](https://istio.io/latest/favicons/android-192x192.png){ align="right", width="100" }
# Istio

=== "Description"

    Istio is an open source service mesh that layers transparently onto existing distributed applications. Istio’s powerful features provide a uniform and more efficient way to secure, connect, and monitor services. Istio is the path to load balancing, service-to-service authentication, and monitoring – with few or no service code changes.

    <br>
    Looking for Commercial Support? [LEARN MORE](https://tetrate.io/){ target="_blank" .bold }

=== "Install"

    Install Service template
    ~~~bash
    helm install istio-base oci://ghcr.io/k0rdent/catalog/charts/istio-base-service-template -n kcm-system
    helm install istiod oci://ghcr.io/k0rdent/catalog/charts/istiod-service-template -n kcm-system
    ~~~

    Verify service template
    ~~~bash
    kubectl get servicetemplates -A
    # NAMESPACE    NAME                      VALID
    # kcm-system   ingress-nginx-4-11-3      true
    # kcm-system   istio-base-1-24-3         true
    ~~~

    Deploy service template
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
          - template: istiod-1-24-3
            name: istiod
            namespace: istio-system
    ~~~

    <br>
    - [Official docs](https://istio.io/latest/docs/ambient/install/helm/){ target="_blank" }