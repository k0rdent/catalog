# k0rdent service templates
[k0rdent](https://k0rdent.github.io/docs/) supported services templates.

## Install k0rdent catalog
Install catalog services templates:
~~~bash
helm install k0rdent-catalog oci://ghcr.io/k0rdent/catalog/charts/k0rdent-catalog --version 1.0.0 -n k0rdent
kubectl get helmrepositories -A # Check repository was successfully added
kubectl get servicetemplate -A # Check service templates
~~~
