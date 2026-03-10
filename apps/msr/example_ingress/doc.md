#### Install template to k0rdent

{{ install_code }}

#### Verify service template

{{ verify_code }}

#### Deploy service template

{{ deploy_code }}

#### Testing in child cluster
Get `admin` user password:
~~~bash
kubectl get secret msr-harbor-core -n msr -o jsonpath="{.data.HARBOR_ADMIN_PASSWORD}" | base64 -d; echo
~~~

You can now access your MSR web UI at `https://msr4.example.url`.
