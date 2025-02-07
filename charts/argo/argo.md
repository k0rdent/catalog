![logo](https://argo-cd.readthedocs.io/en/stable/assets/logo.png){ align="right", width="100" }
# ArgoCD

## Installation
Install Service template
~~~bash
helm install argocd oci://ghcr.io/k0rdent/catalog/charts/argo-cd-service-template
~~~

Check the template is available:
~~~bash
kubectl get servicetemplates -A
# NAMESPACE    NAME                       VALID
# kcm-system   argo-cd-7-8-0              true
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
      - template: argo-cd-7-8-0
        name: argocd
        namespace: argocd
~~~

## References
- [Official docs](https://argo-cd.readthedocs.io/en/stable/)
