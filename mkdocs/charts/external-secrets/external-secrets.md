---
title: "External-secrets"
description: "External secret management."
logo: "https://raw.githubusercontent.com/external-secrets/external-secrets/main/assets/eso-logo-large.png"
---
![logo](https://raw.githubusercontent.com/external-secrets/external-secrets/main/assets/eso-logo-large.png){ align="right", width="200" }
# External secrets

=== "Description"

    The External Secrets Operator extends Kubernetes with Custom Resources, which define where secrets live and how to synchronize them. The controller fetches secrets from an external API and creates Kubernetes secrets. If the secret from the external API changes, the controller will reconcile the state in the cluster and update the secrets accordingly.

    <br>
    Looking for Commercial Support? [LEARN MORE](https://external-secrets.io/latest/introduction/stability-support/){ target="_blank" .bold }
    

=== "Installation"

    Install Service template
    ~~~bash
    # k0rdent includes the template for External-secrets out of the box
    ~~~

    Verify service template
    ~~~bash
    kubectl get servicetemplates -A
    # NAMESPACE    NAME                      VALID
    # kcm-system   external-secrets-0-11-0   true
    ~~~

    Deploy service template
    ~~~yaml
    apiVersion: k0rdent.mirantis.com/v1alpha1
    kind: ClusterDeployment
    # kind: MultiClusterService
    ...
      serviceSpec:
        services:
          - template: external-secrets-0-11-0
            name: external-secrets
            namespace: external-secrets
    ~~~

    <br>
    - [Official docs](https://external-secrets.io/v0.11.0/){ target="_blank" }
