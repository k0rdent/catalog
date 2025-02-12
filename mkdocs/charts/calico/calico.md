![logo](https://docs.tigera.io/img/calico-logo.png){ align="right", width="100" }
# Calico

=== "Description"

    Calico is a networking and security solution specifically designed for Kubernetes clusters, allowing containers and pods to communicate securely across the network by utilizing a layer-3 based routing approach, effectively managing network policies and providing robust security controls for cloud-native applications; essentially, it acts as a container network interface (CNI) plugin within Kubernetes to manage network connectivity between pods within a cluster.

    ## References
    - [Commercial support](https://www.tigera.io/customer-success/)
    - [Official docs](https://docs.tigera.io/calico)

=== "Install"

    Install template to k0rdent
    ~~~bash
    helm install tigera-operator oci://ghcr.io/k0rdent/catalog/charts/tigera-operator-service-template -n kcm-system
    ~~~

    Verify service template
    ~~~bash
    kubectl get servicetemplates -A
    # NAMESPACE    NAME                       VALID
    # kcm-system   tigera-operator-3-29-2     true
    ~~~

    Deploy service template
    ~~~yaml
    apiVersion: k0rdent.mirantis.com/v1alpha1
    kind: ClusterDeployment
    # kind: MultiClusterService
    ...
      serviceSpec:
        services:
          - template: tigera-operator-3-29-2
            name: tigera-operator
            namespace: tigera-operator
    ~~~
