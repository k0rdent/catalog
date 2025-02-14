---
tags:
  - Finops
  - Observability
title: "Kubecost"
description: "Monitor your cloud costs."
logo: "https://raw.githubusercontent.com/kubecost/.github/9602bea0c06773da66ba43cb9ce5e1eb2b797c32/kubecost_logo.png"
---
![logo](https://raw.githubusercontent.com/kubecost/.github/9602bea0c06773da66ba43cb9ce5e1eb2b797c32/kubecost_logo.png){ align="right", width="100" }
# Kubecost

=== "Description"

    Kubecost is a powerful tool designed to help teams running Kubernetes manage and optimize their cloud infrastructure spending. It provides real-time visibility into the costs associated with your Kubernetes deployments, enabling you to understand where your money is going and identify opportunities for savings.

    <br>
    Looking for Commercial Support? [LEARN MORE](https://www.kubecost.com/){ target="_blank" .bold }

=== "Install"

    Install Service template
    ~~~bash
    helm install kubecost oci://ghcr.io/k0rdent/catalog/charts/kubecost-service-template -n kcm-system
    ~~~

    Verify service template
    ~~~bash
    kubectl get servicetemplates -A
    # NAMESPACE    NAME                      VALID
    # kcm-system   kubecost-2-5-3            true
    ~~~

    Deploy service template
    ~~~yaml
    apiVersion: k0rdent.mirantis.com/v1alpha1
    kind: ClusterDeployment
    # kind: MultiClusterService
    ...
      serviceSpec:
        services:
          - template: kubecost-2-5-3
            name: kubecost
            namespace: kubecost
            values: |
              cost-analyzer:
                kubecostToken: <kubecost-token>
                global:
                  grafana:
                    enabled: true
                prometheus:
                  server:
                    persistentVolume:
                      size: 1Gi
                persistentVolume:
                  enabled: true
                  size: 1Gi
                ingress:
                  enabled: true
                  className: nginx
                  hosts: ['kubecost.example.com']
    ~~~

    <br>
    - [Official docs](https://docs.kubecost.com/){ target="_blank" }
