---
title: "NetApp"
description: "NetApp's Trident CSI storage provisioner using the Trident Operator."
logo: "https://raw.githubusercontent.com/NetApp/trident/master/logo/trident.png"
---
![logo](https://raw.githubusercontent.com/NetApp/trident/master/logo/trident.png){ align="right", width="100" }
# NetApp

=== "Description"

    NetApp Trident is a Container Storage Interface (CSI) that integrates with Kubernetes to manage and consume storage resources. It's an open-source project that helps containerized applications meet their storage needs.

    <br>
    Looking for Commercial Support? [LEARN MORE](https://docs.netapp.com/us-en/trident/get-help.html){ target="_blank" .bold }

=== "Installation"

    Install Service template
    ~~~bash
    helm install trident-operator oci://ghcr.io/k0rdent/catalog/charts/trident-operator-service-template -n kcm-system
    ~~~

    Verify service template
    ~~~bash
    kubectl get servicetemplates -A
    # NAMESPACE    NAME                          VALID
    # kcm-system   trident-operator-100-2410-0   true
    ~~~

    Deploy service template
    ~~~yaml
    apiVersion: k0rdent.mirantis.com/v1alpha1
    kind: ClusterDeployment
    # kind: MultiClusterService
    ...
      serviceSpec:
        services:
          - template: trident-operator-100-2410-0
            name: trident-operator
            namespace: trident-operator
    ~~~

    <br>
    - [Official docs](https://docs.netapp.com/us-en/trident/index.html){ target="_blank" }
