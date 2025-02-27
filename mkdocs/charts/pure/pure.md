---
tags:
  - Storage 
  - CSI
title: "Pure"
description: "Storage service."
logo: "https://raw.githubusercontent.com/purestorage/helm-charts/master/pure-csi/pure-storage.png"
---
![logo](https://raw.githubusercontent.com/purestorage/helm-charts/master/pure-csi/pure-storage.png){ align="right", width="100" }
# Pure Storage

=== "Description"

    Pure Storage CSI is a plugin that allows Kubernetes to access storage on Pure Storage's FlashArray and FlashBlade devices. CSI stands for Container Storage Interface. It's a standard that enables storage systems to communicate with Kubernetes.

    <br>
    Looking for Commercial Support? [LEARN MORE](https://support.purestorage.com/){ target="_blank" .bold }
    

=== "Installation"

    #### Prerequisites

    Deploy k0rdent: [QuickStart](https://docs.k0rdent.io/v0.1.0/guide-to-quickstarts/#guide-to-quickstarts)

    #### Install template to k0rdent
    ~~~bash
    helm install pure-k8s-plugin oci://ghcr.io/k0rdent/catalog/charts/pure-k8s-plugin-service-template -n kcm-system
    helm install pure-csi oci://ghcr.io/k0rdent/catalog/charts/pure-csi-service-template -n kcm-system
    ~~~

    #### Verify service template
    ~~~bash
    kubectl get servicetemplates -A
    # NAMESPACE    NAME                      VALID
    # kcm-system   pure-csi-1-2-0            true
    # kcm-system   pure-k8s-plugin-2-7-1     true
    ~~~

    #### Deploy service template
    ~~~yaml
    apiVersion: k0rdent.mirantis.com/v1alpha1
    kind: ClusterDeployment
    # kind: MultiClusterService
    ...
      serviceSpec:
        services:
          - template: pure-k8s-plugin-2-7-1
            name: pure-k8s-plugin
            namespace: pure-k8s-plugin
        services:
          - template: pure-csi-1-2-0
            name: pure-csi
            namespace: pure-csi
    ~~~

    - [Official docs](https://github.com/purestorage/helm-charts){ target="_blank" }
