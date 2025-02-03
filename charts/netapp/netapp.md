## NetApp
Install Service template
~~~bash
helm install trident-operator oci://ghcr.io/k0rdent/catalog/charts/trident-operator-service-template
~~~

Check the template is available:
~~~bash
kubectl get servicetemplates -A
# NAMESPACE    NAME                          VALID
# kcm-system   trident-operator-100-2410-0   true
~~~

Use the template in k0rdent manifests `ClusterDeployment` or `MultiClusterService`:
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

[Official docs](https://docs.netapp.com/us-en/trident/index.html)
