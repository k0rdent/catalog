![logo](https://github.com/kyverno/kyverno/raw/main/img/logo.png){ align="right", width="150" }
# Kyverno

## Installation
This service template is typically pre-installed in k0rdent. If not
install it:
~~~bash
helm install ingress-nginx oci://ghcr.io/k0rdent/catalog/charts/kyverno-service-template -n kcm-system
~~~

Check the template is available:
~~~bash
kubectl get servicetemplates -A
# NAMESPACE    NAME                VALID
# kcm-system   kyverno-3-2-6       true
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
      - template: kyverno-3-2-6
        name: kyverno
        namespace: kyverno
~~~

## References
- [Official docs](https://kyverno.github.io/kyverno/)
