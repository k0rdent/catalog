![logo](https://github.com/cert-manager/cert-manager/blob/master/logo/logo-small.png?raw=true){ align="right", width="200" }
# Cert manager

## Installation
Install template to k0rdent
~~~bash
# k0rdent includes the template for Cert-manager out of the box
~~~

Verify service template
~~~bash
kubectl get servicetemplates -A
# NAMESPACE    NAME                       VALID
# kcm-system   cert-manager-1-16-2        true
~~~

## Usage
Deploy service template
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
