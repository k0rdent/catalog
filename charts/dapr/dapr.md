## Dapr
Install Service template
~~~bash
helm install dapr oci://ghcr.io/k0rdent/catalog/charts/dapr-service-template
~~~

Check the template is available:
~~~bash
kubectl get servicetemplates -A
# NAMESPACE    NAME                       VALID
# kcm-system   dapr-1-14-4                true
~~~

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

[Official docs](https://docs.dapr.io/)
