---
tags:
  - Registry
title: "Mirantis Secure Registry"
description: "Mirantis Secure Registry (MSR) 4 is an Enterprise-grade container registry solution."
logo: "./charts/msr/msr_logo.svg"
---
![logo](./msr_logo.svg){ align="right", width="100" }
# Mirantis Secure Registry

=== "Description"

    Mirantis Secure Registry (MSR) 4 is an Enterprise-grade container registry solution based on CNCF Harbor that can be integrated easily with k0rdent managed clusters.

    <br>
    This chart contains Mirantis Secure Registry 4 without the high-availability for the storage layer (Postgres & Redis). Please check the following link for more information on high-availability. [LEARN MORE](https://docs.mirantis.com/msr/4.0/install/installation-with-high-availability.html){ target="_blank" .bold }

    <br>
    Looking for Commercial Support? [LEARN MORE](https://docs.mirantis.com/msr/4.0/get-support.html){ target="_blank" .bold }

=== "Install"

    #### Prerequisites

    Deploy k0rdent: [QuickStart](https://docs.k0rdent.io/v0.1.0/guide-to-quickstarts/#guide-to-quickstarts)

    #### Install template to k0rdent
    ~~~bash
    helm upgrade --install harbor oci://ghcr.io/k0rdent/catalog/charts/kgst -n kcm-system \
      --set "helm.repository.url=https://registry.mirantis.com/charts/harbor/helm" \
      --set "helm.charts[0].name=harbor" \
      --set "helm.charts[0].version=4.0.1"
    ~~~

    #### Verify service template
    ~~~bash
    kubectl get servicetemplates -A
    # NAMESPACE    NAME                          VALID
    # kcm-system   harbor-4-0-1                  true
    ~~~

    #### Deploy service template
    ~~~yaml
    apiVersion: k0rdent.mirantis.com/v1alpha1
    kind: ClusterDeployment
    # kind: MultiClusterService
    ...
      serviceSpec:
        services:
          - template: harbor-4-0-1
            name: msr4
            namespace: msr4
            values: |
              expose:
                type: ingress
                tls:
                  enabled: true
                  certSource: secret
                  secret:
                    secretName: "wildcard-tls"
                ingress:
                  controller: default
                  annotations:
                    kubernetes.io/ingress.class: "nginx"
                    nginx.ingress.kubernetes.io/ssl-redirect: "true"
                    nginx.ingress.kubernetes.io/proxy-body-size: "0"
                  hosts:
                    core: msr4.example.url
              externalURL: msr4.example.url
    ~~~

    - [Official docs](https://docs.mirantis.com/msr/4.0/overview.html){ target="_blank" }
