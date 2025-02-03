## Nginx Ingress by F5
Install Service template
~~~bash
helm install nginx-ingress oci://ghcr.io/k0rdent/catalog/charts/nginx-ingress-service-template
~~~

Check the template is available:
~~~bash
kubectl get servicetemplates -A
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
      - template: nginx-ingress-2-0-0
        name: nginx-ingress
        namespace: nginx-ingress
        values: |
          nginx-ingress:
            controller:
              hostPort:
                enable: true
~~~

[Official docs](https://docs.nginx.com/nginx-ingress-controller/)
