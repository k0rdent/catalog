---
tags:
  - Policy
  - Security
title: "Kyverno"
description: "Kubernetes Native Policy Management."
logo: "https://github.com/kyverno/kyverno/raw/main/img/logo.png"
---
![logo](https://github.com/kyverno/kyverno/raw/main/img/logo.png){ align="right", width="150" }
# Kyverno

=== "Description"

    Kyverno is a powerful open-source policy engine designed specifically for Kubernetes. It allows you to define and enforce policies that govern the configuration and behavior of your Kubernetes resources, ensuring security, compliance, and operational best practices. 
    Here's a breakdown of its key features:

    - Kubernetes Native: Kyverno is built for Kubernetes, using the same YAML format and API objects as Kubernetes itself, making it easy to learn and use.
    - Policy-as-Code: Define policies as code, enabling version control, collaboration, and automation. 
    - Validation and Mutation: Kyverno can validate resources against policies before they are created or modified, and it can also mutate resources to enforce compliance. 
    - Image Verification: Verify the integrity and provenance of container images, ensuring that only trusted images are deployed. 
    - Resource Validation: Validate resource configurations against security and compliance standards, preventing misconfigurations. 
    - RBAC Integration: Integrates with Kubernetes RBAC to control who can create, modify, and apply policies.

    <br>
    Looking for Commercial Support? [LEARN MORE](https://nirmata.com/nirmata-enterprise-for-kyverno/){ target="_blank" .bold }
    

=== "Install"

    Install Service template
    ~~~bash
    # k0rdent includes the template for Kyverno out of the box
    ~~~

    Verify service template
    ~~~bash
    kubectl get servicetemplates -A
    # NAMESPACE    NAME                VALID
    # kcm-system   kyverno-3-2-6       true
    ~~~

    Deploy service template
    ~~~yaml
    apiVersion: k0rdent.mirantis.com/v1alpha1
    kind: ClusterDeployment
    # kind: MultiClusterService
    ...
      serviceSpec:
        services:
          - template: kyverno-3-2-6
            name: kyverno
            namespace: kyverno
    ~~~

    <br>
    - [Official docs](https://kyverno.github.io/kyverno/){ target="_blank" }
