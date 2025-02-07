![dapr](./dapr-logo.svg){ align="right", width="100" }
# Dapr

## Installation
Install Service template
~~~bash
helm install dapr oci://ghcr.io/k0rdent/catalog/charts/dapr-service-template -n kcm-system
~~~

Check the template is available:
~~~bash
kubectl get servicetemplates -A
# NAMESPACE    NAME                       VALID
# kcm-system   dapr-1-14-4                true
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
      - template: dapr-1-14-4
        name: dapr
        namespace: dapr-system
        values: |
          dapr-dashboard:
            ingress:
              enabled: true
              className: nginx
              host: 'dapr.local'
~~~

## References
- [Official docs](https://docs.dapr.io/)
