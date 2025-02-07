![logo](https://raw.githubusercontent.com/kubecost/.github/9602bea0c06773da66ba43cb9ce5e1eb2b797c32/kubecost_logo.png){ align="right", width="100" }
# Kubecost

## Installation
Install Service template
~~~bash
helm install kubecost oci://ghcr.io/k0rdent/catalog/charts/kubecost-service-template
~~~

Check the template is available:
~~~bash
kubectl get servicetemplates -A
# NAMESPACE    NAME                      VALID
# kcm-system   kubecost-2-5-3            true
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

## References
- [Official docs](https://docs.kubecost.io/)
