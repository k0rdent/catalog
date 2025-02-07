# Ingress Nginx

## Installation
This service template is typically pre-installed in k0rdent. If not
install it:
~~~bash
helm install ingress-nginx oci://ghcr.io/k0rdent/catalog/charts/ingress-nginx-service-template
~~~

Check the template is available:
~~~bash
kubectl get servicetemplates -A
# NAMESPACE    NAME                       VALID
# kcm-system   ingress-nginx-4-11-3       true
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
      - template: ingress-nginx-4-11-3
        name: ingress-nginx
        namespace: ingress-nginx
        values: |
          ingress-nginx:
            controller:
              hostPort:
                enable: true
~~~

## References
- [Official docs](https://kubernetes.github.io/ingress-nginx/)
