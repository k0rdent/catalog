#### Install template to k0rdent

{{ install_code }}

#### Verify service template

{{ verify_code }}

#### Deploy service template

{{ deploy_code }}

#### Testing in child cluster
Get `admin` user password:
~~~bash
kubectl get secret harbor-core -n harbor -o jsonpath="{.data.HARBOR_ADMIN_PASSWORD}" | base64 -d; echo
~~~

You can now access your Harbor web UI at `http://harbor.local`.
