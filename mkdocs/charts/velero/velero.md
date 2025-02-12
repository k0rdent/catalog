![logo](https://cdn-images-1.medium.com/max/1600/1*-9mb3AKnKdcL_QD3CMnthQ.png){ align="right", width="150" }
# Velero

## Installation
Install Service template
~~~bash
# k0rdent includes the template for Velero out of the box
~~~

Verify service template
~~~bash
kubectl get servicetemplates -A
# NAMESPACE    NAME                VALID
# kcm-system   velero-8-1-0        true
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
      - template: velero-8-1-0
        name: velero
        namespace: velero
~~~

## References
- [Official docs](https://vmware-tanzu.github.io/helm-charts/)
