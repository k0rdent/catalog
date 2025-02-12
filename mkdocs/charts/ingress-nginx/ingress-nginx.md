![logo](https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/Nginx_logo.svg/500px-Nginx_logo.svg.png){ align="right", width="200" }
# Ingress Nginx

## Installation
Install Service template
~~~bash
# k0rdent includes the template for Ingress-nginx out of the box
~~~

Verify service template
~~~bash
kubectl get servicetemplates -A
# NAMESPACE    NAME                       VALID
# kcm-system   ingress-nginx-4-11-3       true
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
