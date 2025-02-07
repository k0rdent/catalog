![logo](https://github.com/cert-manager/cert-manager/blob/master/logo/logo-small.png?raw=true){ align="right", width="200" }
# Cert manager

## Installation
This service template is typically pre-installed in k0rdent. If not
install it:
~~~bash
helm install cert-manager oci://ghcr.io/k0rdent/catalog/charts/cert-manager-service-template -n kcm-system
~~~

Check the template is available:
~~~bash
kubectl get servicetemplates -A
# NAMESPACE    NAME                       VALID
# kcm-system   cert-manager-1-16-2        true
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
      - template: cert-manager-1-16-2
        name: cert-manager
        namespace: cert-manager
~~~

## References
- [Official docs](https://kubernetes.github.io/cert-manager/)
