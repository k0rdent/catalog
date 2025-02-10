![logo](https://cdn-images-1.medium.com/max/1600/1*-9mb3AKnKdcL_QD3CMnthQ.png){ align="right", width="150" }
# Velero

## Installation
This service template is typically pre-installed in k0rdent. If not
install it:
~~~bash
helm install velero oci://ghcr.io/k0rdent/catalog/charts/velero-service-template -n kcm-system
~~~

Check the template is available:
~~~bash
kubectl get servicetemplates -A
# NAMESPACE    NAME                VALID
# kcm-system   velero-8-1-0        true
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
      - template: velero-8-1-0
        name: velero
        namespace: velero
~~~

## References
- [Official docs](https://vmware-tanzu.github.io/helm-charts/)
