#### Install template to k0rdent

{{ install_code }}

#### Verify service template

{{ verify_code }}

#### Deploy service template

{{ deploy_code }}

Get the token and use it to authenticate:
~~~bash
kubectl get secrets headlamp-token -n headlamp -o jsonpath='{.data.token}' | base64 -d; echo
~~~
