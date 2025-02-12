![logo](https://raw.githubusercontent.com/dexidp/website/9ac240c84d3e34766814cd9ece76710cf075ba23/static/favicons/favicon.png){ align="right", width="100" }
# Dex

=== "Description"

    Dex is an identity service that acts as a bridge between your Kubernetes cluster and various identity providers. Think of it as a gatekeeper that verifies who you are before granting you access to your Kubernetes resources.

    ## References
    - [Commercial support](https://dexidp.io/docs/guides/kubernetes/)
    - [Official docs](https://dexidp.io/docs/)

=== "Install"

    Install Service template
    ~~~bash
    # k0rdent includes the template for Dex out of the box
    ~~~

    Verify service template
    ~~~bash
    kubectl get servicetemplates -A
    # NAMESPACE    NAME             VALID
    # kcm-system   dex-0-19-1       true
    ~~~

    Deploy service template
    ~~~yaml
    apiVersion: k0rdent.mirantis.com/v1alpha1
    kind: ClusterDeployment
    # kind: MultiClusterService
    ...
    serviceSpec:
        services:
        - template: dex-0-19-1
            name: dex
            namespace: dex
    ~~~
