---
tags:
  - CI/CD
title: "ArgoCD"
description: "Declarative, GitOps continuous delivery tool for Kubernetes."
logo: "https://argo-cd.readthedocs.io/en/stable/assets/logo.png"
---
![logo](https://argo-cd.readthedocs.io/en/stable/assets/logo.png){ align="right", width="100" }
# Argo CD

=== "Description"

    Argo CD is an open-source tool for implementing GitOps in Kubernetes. It automates the deployment and lifecycle management of applications by continuously synchronizing the desired state declared in a Git repository with the live state in the cluster. k0rdent integration:

    - Centralized Management: Manage Argo CD instances and application deployments across multiple clusters from the K0rdent control plane. 
    - Simplified Deployment: k0rdent can automate the deployment and configuration of Argo CD in your clusters, reducing manual effort.
    - Policy-Driven Deployments: Leverage k0rdent's policy engine to enforce security and compliance policies for your Argo CD deployments and application configurations.

    <br>
    Looking for Commercial Support? [LEARN MORE](https://akuity.io/security-hardened-argo-cd){ target="_blank" .bold }
    

=== "Install"

    #### Prerequisites

    Deploy k0rdent: [docs.k0rdent.io](https://docs.k0rdent.io/)

    #### Install template to k0rdent
    ~~~bash
    helm install argocd oci://ghcr.io/k0rdent/catalog/charts/argo-cd-service-template -n kcm-system
    ~~~

    #### Verify service template
    ~~~bash
    kubectl get servicetemplates -A
    # NAMESPACE    NAME                       VALID
    # kcm-system   argo-cd-7-8-0              true
    ~~~

    #### Deploy service template
    ~~~yaml
    apiVersion: k0rdent.mirantis.com/v1alpha1
    kind: ClusterDeployment
    # kind: MultiClusterService
    ...
      serviceSpec:
        services:
          - template: argo-cd-7-8-0
            name: argocd
            namespace: argocd
    ~~~

    - [Official docs](https://argo-cd.readthedocs.io/en/stable/){ target="_blank" }
