# k0rdent service templates
[k0rdent](https://k0rdent.github.io/docs/) supported service templates.

For testing you can use [k0rdent demo setup](https://github.com/k0rdent/demos?tab=readme-ov-file#demo-cluster-setup).

## Setup k0rdent-catalog helm repository
Setup extra helm repository and service templates using prepared manifests:
~~~bash
kubectl apply -f manifests/setup # Configure a new k0rdent helm repository and service templates
kubectl get helmrepositories -A # Check repository was successfully added
kubectl get servicetemplate -A # Check service templates
~~~

## Use it in managed cluster(s)

### Using MultiClusterService
~~~bash
kubectl apply -f manifests/global-nginx-ingress-f5.yaml
kubectl apply -f manifests/global-dapr.yaml
kubectl get multiclusterservices
# NAME             AGE
# global-dapr      9m27s
~~~

### Using ClusterDeployment
Update your managed cluster manifest `spec.services` section, e.g.:
~~~yaml
apiVersion: k0rdent.mirantis.com/v1alpha1
kind: ClusterDeployment
# ...
spec:
  services:
    - template: dapr-1-14-4
      name: managed-dapr
      namespace: dapr-system
# ...
~~~
