---
tags:
  - Backup 
  - Recovery
title: "Velero"
description: "Open source tool to safely backup and restore."
logo: "https://cdn-images-1.medium.com/max/1600/1*-9mb3AKnKdcL_QD3CMnthQ.png"
---
![logo](https://cdn-images-1.medium.com/max/1600/1*-9mb3AKnKdcL_QD3CMnthQ.png){ align="right", width="150" }
# Velero

=== "Description"

    Velero is an open source tool to safely backup and restore, perform disaster recovery, and migrate Kubernetes cluster resources and persistent volumes.
    

=== "Installation"

    #### Prerequisites

    Deploy k0rdent: [QuickStart](https://docs.k0rdent.io/v0.1.0/guide-to-quickstarts/#guide-to-quickstarts)

    #### Install template to k0rdent
    ~~~bash
    # k0rdent includes the template for Velero out of the box
    ~~~

    #### Verify service template
    ~~~bash
    kubectl get servicetemplates -A
    # NAMESPACE    NAME                VALID
    # kcm-system   velero-8-1-0        true
    ~~~

    #### Deploy service template
    ~~~yaml
    apiVersion: k0rdent.mirantis.com/v1alpha1
    kind: ClusterDeployment
    # kind: MultiClusterService
    ...
      serviceSpec:
        services:
          - template: velero-8-1-0
            name: velero
            namespace: velero
    ~~~

    - [Official docs](https://vmware-tanzu.github.io/helm-charts/){ target="_blank" }
