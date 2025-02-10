![logo](https://raw.githubusercontent.com/purestorage/helm-charts/master/pure-csi/pure-storage.png){ align="right", width="100" }
# Pure Storage

## Installation
Install Service template
~~~bash
helm install pure-k8s-plugin oci://ghcr.io/k0rdent/catalog/charts/pure-k8s-plugin-service-template -n kcm-system
helm install pure-csi oci://ghcr.io/k0rdent/catalog/charts/pure-csi-service-template -n kcm-system
~~~

Check the template is available:
~~~bash
kubectl get servicetemplates -A
# NAMESPACE    NAME                      VALID
# kcm-system   pure-csi-1-2-0            true
# kcm-system   pure-k8s-plugin-2-7-1     true
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
      - template: pure-k8s-plugin-2-7-1
        name: pure-k8s-plugin
        namespace: pure-k8s-plugin
    services:
      - template: pure-csi-1-2-0
        name: pure-csi
        namespace: pure-csi
~~~

## References
- [Official docs](https://github.com/purestorage/helm-charts)
