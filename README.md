# k0rdent service templates
[k0rdent](https://k0rdent.github.io/docs/) supported service templates.

For testing you can use [k0rdent demo setup](https://github.com/k0rdent/demos?tab=readme-ov-file#demo-cluster-setup).

## Setup k0rdent-core helm repository
This is done automatically during k0rdent installation:
~~~bash
helm install k0rdent-core ./charts/k0rdent-core/k0rdent-core-1.0.0 -n k0rdent
kubectl get helmrepositories -A # Check repository was successfully added
kubectl get servicetemplate -A # Check service templates
~~~

## Setup k0rdent-catalog helm repository
Setup additional k0rdent supported service templates:
~~~bash
helm install k0rdent-catalog ./charts/k0rdent-catalog/k0rdent-catalog-1.0.0 -n k0rdent
kubectl get helmrepositories -A # Check repository was successfully added
kubectl get servicetemplate -A # Check service templates
~~~
