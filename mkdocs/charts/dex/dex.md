![logo](https://raw.githubusercontent.com/dexidp/website/9ac240c84d3e34766814cd9ece76710cf075ba23/static/favicons/favicon.png){ align="right", width="100" }
# Dex

=== "Description"

    Dex is an identity service that acts as a bridge between your Kubernetes cluster and various identity providers. Think of it as a gatekeeper that verifies who you are before granting you access to your Kubernetes resources.

    ## References
    - [Official docs](https://dexidp.io/docs/)
    - [Commercial support](https://dexidp.io/docs/guides/kubernetes/)

=== "Install"

    This service template is typically pre-installed in k0rdent. If not
    install it:
    ~~~bash
    helm install dex oci://ghcr.io/k0rdent/catalog/charts/dex-service-template -n kcm-system
    ~~~

    Check the template is available:
    ~~~bash
    kubectl get servicetemplates -A
    # NAMESPACE    NAME             VALID
    # kcm-system   dex-0-19-1       true
    ~~~

    ## Usage
    Use the template in k0rdent manifests `ClusterDeployment` or `MultiClusterService`:
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
