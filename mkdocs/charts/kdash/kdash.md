---
tags:
  - Observability
title: "Kubernetes Dashboard"
description: "General purpose, web-based UI for Kubernetes clusters."
logo: "https://raw.githubusercontent.com/kubernetes/kubernetes/master/logo/logo.svg"
---
![logo](https://raw.githubusercontent.com/kubernetes/kubernetes/master/logo/logo.svg){ align="right", width="100" }
# Kubernetes Dashboard

=== "Description"

    Kubernetes Dashboard is a general purpose, web-based UI for Kubernetes clusters. It allows users to manage applications running in the cluster and troubleshoot them, as well as manage the cluster itself.

=== "Install"

    Install Service template
    ~~~bash
    helm upgrade --install kubernetes-dashboard oci://ghcr.io/k0rdent/catalog/charts/kgst -n kcm-system \
      --set "helm.repository.url=https://kubernetes.github.io/dashboard/" \
      --set "helm.charts[0].name=kubernetes-dashboard" \
      --set "helm.charts[0].version=7.10.4"
    ~~~

    Verify service template
    ~~~bash
    kubectl get servicetemplates -A
    # NAMESPACE    NAME                          VALID
    # kcm-system   kubernetes-dashboard-7-10-4   true
    ~~~

    Deploy service template
    ~~~yaml
    apiVersion: k0rdent.mirantis.com/v1alpha1
    kind: ClusterDeployment
    # kind: MultiClusterService
    ...
      serviceSpec:
        services:
          - template: kubernetes-dashboard-7-10-4
            name: kubernetes-dashboard
            namespace: kubernetes-dashboard
            values: |
              app:
                ingress:
                  enabled: true
                  ingressClassName: nginx
                  pathType: Prefix
                  hosts: ['k8s-dashboard.example.com']
    ~~~

    <br>
    - [Official docs](https://kubernetes.io/docs/tasks/access-application-cluster/web-ui-dashboard/){ target="_blank" }
