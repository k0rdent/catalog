---
tags:
  - Finops
  - Observability
title: "OpenCost"
description: "Monitor your cloud costs."
logo: "https://github.com/opencost/opencost-website/blob/d8f2a459dd958bf3033dc479f0c0a7677bae03ca/static/img/opencostpig.png?raw=true"
---
![logo](https://github.com/opencost/opencost-website/blob/d8f2a459dd958bf3033dc479f0c0a7677bae03ca/static/img/opencostpig.png?raw=true){ align="right", width="100" }
# OpenCost

=== "Description"

    OpenCost is a vendor-neutral open-source project for measuring and allocating cloud infrastructure and container costs in real-time.
    It's specifically designed for Kubernetes cost monitoring, providing visibility into your spending and helping you understand how resources are being used.

    <br>
    Looking for Commercial Support? [LEARN MORE](https://www.kubecost.com/kubernetes-cost-optimization/kubecost-vs-opencost/){ target="_blank" .bold }

=== "Install"

    #### Prerequisites

    Deploy k0rdent: [QuickStart](https://docs.k0rdent.io/v0.1.0/guide-to-quickstarts/#guide-to-quickstarts)

    #### Install template to k0rdent
    ~~~bash
    helm upgrade --install opencost oci://ghcr.io/k0rdent/catalog/charts/kgst -n kcm-system \
      --set "helm.repository.url=https://opencost.github.io/opencost-helm-chart" \
      --set "helm.charts[0].name=opencost" \
      --set "helm.charts[0].version=1.43.2"
    ~~~

    #### Verify service template
    ~~~bash
    kubectl get servicetemplates -A
    # NAMESPACE    NAME                           VALID
    # kcm-system   opencost-1-43-2                true
    ~~~

    #### Deploy service template
    ~~~yaml
    apiVersion: k0rdent.mirantis.com/v1alpha1
    kind: ClusterDeployment
    # kind: MultiClusterService
    ...
      serviceSpec:
        services:
          - template: opencost-1-43-2
            name: opencost
            namespace: opencost
            values: |
              opencost:
                ui:
                  ingress:
                    enabled: true
                    ingressClassName: nginx
                    hosts:
                      - host: 'opencost.example.com'
    ~~~

    - [Official docs](https://opencost.io/){ target="_blank" }
