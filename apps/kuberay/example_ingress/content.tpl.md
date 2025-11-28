#### Install template to k0rdent

{{ install_code }}

#### Verify service template

{{ verify_code }}

#### Deploy service template

{{ deploy_code }}

Now you need to create an Ingress rule manually in the child cluster(s):
~~~yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
name: kuberay-dashboard
namespace: kuberay
spec:
ingressClassName: nginx
rules:
    - host: kuberay.example.com
    http:
        paths:
        - path: /
            pathType: Prefix
            backend:
            service:
                name: ray-cluster-kuberay-head-svc
                port:
                number: 8265
~~~

You can now access your KubeRay web UI at `kuberay.example.com`.
