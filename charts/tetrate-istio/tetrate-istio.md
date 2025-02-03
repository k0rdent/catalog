## Istio by Tetrate
Install Service template
~~~bash
helm install tetrate-istio oci://ghcr.io/k0rdent/catalog/charts/tetrate-istio-service-template
~~~

Check the template is available:
~~~bash
kubectl get servicetemplates
# NAMESPACE    NAME                      VALID
# kcm-system   nginx-ingress-2-0-0       true
~~~

Use the template in k0rdent manifests `ClusterDeployment` or `MultiClusterService`:
~~~yaml
apiVersion: k0rdent.mirantis.com/v1alpha1
kind: ClusterDeployment
# kind: MultiClusterService
...
  serviceSpec:
    services:
      - template: tetrate-istio-1-24-20001
        name: tetrate-istio
        namespace: tetrate-istio
~~~

[Official docs](https://docs.tetrate.io/istio-distro/)
