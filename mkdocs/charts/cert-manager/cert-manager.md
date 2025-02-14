---
tags:
  - Security
  - Certificates
title: "Cert-manager"
description: "Management and issuance of TLS certificates."
logo: "https://github.com/cert-manager/cert-manager/blob/master/logo/logo-small.png?raw=true"
---
![logo](https://github.com/cert-manager/cert-manager/blob/master/logo/logo-small.png?raw=true){ align="right", width="200" }
# Cert manager

=== "Description"

    Cert-manager is a Kubernetes add-on that automates the management of TLS certificates. It can issue, renew, and validate certificates from various sources, including public and private issuers.

    <br>
    Looking for Commercial Support? [LEARN MORE](https://cert-manager.io/support/){ target="_blank" .bold }

=== "Install"

    Install template to k0rdent
    ~~~bash
    # k0rdent includes the template for Cert-manager out of the box
    ~~~

    Verify service template
    ~~~bash
    kubectl get servicetemplates -A
    # NAMESPACE    NAME                       VALID
    # kcm-system   cert-manager-1-16-2        true
    ~~~

    Deploy service template
    ~~~yaml
    apiVersion: k0rdent.mirantis.com/v1alpha1
    kind: ClusterDeployment
    # kind: MultiClusterService
    ...
      serviceSpec:
        services:
          - template: cert-manager-1-16-2
            name: cert-manager
            namespace: cert-manager
    ~~~

    <br>
    - [Official docs](https://kubernetes.github.io/cert-manager/){ target="_blank" }