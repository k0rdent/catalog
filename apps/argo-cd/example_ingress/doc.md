#### Install template to k0rdent

{{ install_code }}

#### Verify service template

{{ verify_code }}

#### Deploy service template

{{ deploy_code }}

#### Testing in child cluster
Get `admin` user password:
~~~bash
kubectl get secret argocd-initial-admin-secret -n argo-cd -o jsonpath="{.data.password}" | base64 -d; echo
~~~

You can now access your ArgoCD web UI at `https://argocd.example.com`.
