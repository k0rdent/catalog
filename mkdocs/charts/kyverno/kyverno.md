![logo](https://github.com/kyverno/kyverno/raw/main/img/logo.png){ align="right", width="150" }
# Kyverno

=== "Description"

    Dex is an identity service that acts as a bridge between your Kubernetes cluster and various identity providers. Think of it as a gatekeeper that verifies who you are before granting you access to your Kubernetes resources.

    ## References
    - [Official docs](https://kyverno.github.io/kyverno/)
    - [Commercial support](https://nirmata.com/nirmata-enterprise-for-kyverno/)

=== "Install"

    Install Service template
    ~~~bash
    helm install kyverno oci://ghcr.io/k0rdent/catalog/charts/kyverno-service-template -n kcm-system
    ~~~

    Verify service template
    ~~~bash
    kubectl get servicetemplates -A
    # NAMESPACE    NAME                VALID
    # kcm-system   kyverno-3-2-6       true
    ~~~

    ## Usage
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
