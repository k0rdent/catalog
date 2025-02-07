# K0rdent Catalog
This catalog repository contains verified and tested service templates supported by [k0rdent](https://k0rdent.github.io/docs/), allowing you to easily install and manage services across multiple Kubernetes clusters simultaneously.

## Requirements
- Working *k0rdent* setup ([details](https://docs.k0rdent.io/latest/admin-installation/#install-k0rdent)).
- [kubectl](https://kubernetes.io/docs/reference/kubectl/) Kubernetes CLI client.
- [helm](https://helm.sh/) CLI client.

## Setup
The easiest way to install and use a *k0rdent* service template is to keep it in the main *k0rdent* namespace. Typically, this is kcm-system, but it can be any other name specified by the user during *k0rdent* installation.

~~~bash
kubectl config set-context --current --namespace=kcm-system
~~~

# Service Templates
- ## [ingress-nginx](./charts/ingress-nginx/ingress-nginx.md)
- ## [kubecost](./charts/kubecost/kubecost.md)
- ## [argo](./charts/argo/argo.md)
- ## [dapr](./charts/dapr/dapr.md)
- ## [netapp](./charts/netapp/netapp.md)
- ## [pure](./charts/pure/pure.md)
