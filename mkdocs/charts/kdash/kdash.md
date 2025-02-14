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
    helm install kubernetes-dashboard oci://ghcr.io/k0rdent/catalog/charts/kubernetes-dashboard-service-template -n kcm-system
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
              kubernetes-dashboard:
                app:
                  ingress:
                    enabled: true
                    ingressClassName: nginx
                    pathType: Prefix
                    hosts: ['k8s-dashboard.example.com']
    ~~~

    <br>
    - [Official docs](https://kubernetes.io/docs/tasks/access-application-cluster/web-ui-dashboard/){ target="_blank" }
