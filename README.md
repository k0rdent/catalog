# k0rdent service templates
[k0rdent](https://k0rdent.github.io/docs/) supported services templates.

## Requirements
- Working k0rdent setup ([details](https://k0rdent.github.io/docs/quick-start/installation/#requirements)).

## Dapr
Install Service template for Dapr
~~~bash
helm install dapr oci://ghcr.io/k0rdent/catalog/charts/dapr-service-template
~~~

Check dapr template is available:
~~~bash
kubectl get servicetemplates
# NAMESPACE    NAME                       VALID
# kcm-system   dapr-1-14-4                true
~~~

Use dapr template in k0rdent manifests `ClusterDeployment` or `MultiClusterService`:
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
~~~

## Nginx Ingress by F5
Install Service template for Nginx Ingress
~~~bash
helm install nginx-ingress oci://ghcr.io/k0rdent/catalog/charts/nginx-ingress-service-template
~~~
...

## Istio by Tetrate
Install Service template for Istio
~~~bash
helm install tetrate-istio oci://ghcr.io/k0rdent/catalog/charts/tetrate-istio-service-template
~~~
...
