![logo](https://raw.githubusercontent.com/kubecost/.github/9602bea0c06773da66ba43cb9ce5e1eb2b797c32/kubecost_logo.png){ align="right", width="100" }
# Kubecost

=== "Description"

    Kubecost is a powerful tool designed to help teams running Kubernetes manage and optimize their cloud infrastructure spending. It provides real-time visibility into the costs associated with your Kubernetes deployments, enabling you to understand where your money is going and identify opportunities for savings.

    ## References
    - [Official docs](https://docs.kubecost.com/)
    - [Commercial support](https://www.kubecost.com/)

=== "Install"

    Install Service template
    ~~~bash
    helm install kubecost oci://ghcr.io/k0rdent/catalog/charts/kubecost-service-template -n kcm-system
    ~~~

    Verify service template
    ~~~bash
    kubectl get servicetemplates -A
    # NAMESPACE    NAME                      VALID
    # kcm-system   kubecost-2-5-3            true
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
          - template: kubecost-2-5-3
            name: kubecost
            namespace: kubecost
            values: |
              cost-analyzer:
                kubecostToken: <kubecost-token>
                global:
                  grafana:
                    enabled: true
                prometheus:
                  server:
                    persistentVolume:
                      size: 1Gi
                persistentVolume:
                  enabled: true
                  size: 1Gi
                ingress:
                  enabled: true
                  className: nginx
                  hosts: ['kubecost.example.com']
    ~~~
