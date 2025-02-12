![logo](https://raw.githubusercontent.com/NetApp/trident/master/logo/trident.png){ align="right", width="100" }
# NetApp

## Installation
Install Service template
~~~bash
helm install trident-operator oci://ghcr.io/k0rdent/catalog/charts/trident-operator-service-template -n kcm-system
~~~

Verify service template
~~~bash
kubectl get servicetemplates -A
# NAMESPACE    NAME                          VALID
# kcm-system   trident-operator-100-2410-0   true
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
      - template: trident-operator-100-2410-0
        name: trident-operator
        namespace: trident-operator
~~~

## References
- [Official docs](https://docs.netapp.com/us-en/trident/index.html)
