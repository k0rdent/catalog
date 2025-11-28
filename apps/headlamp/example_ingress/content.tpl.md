#### Install template to k0rdent

{{ install_code }}

#### Verify service template

{{ verify_code }}

#### Deploy service template

{{ deploy_code }}

Create access token in the child cluster:
~~~yaml
apiVersion: v1
kind: Secret
type: kubernetes.io/service-account-token
metadata:
    name: headlamp-token
    namespace: headlamp
    annotations:
    kubernetes.io/service-account.name: headlamp
    kubernetes.io/service-account.namespace: headlamp
~~~

Get the token and use it to authenticate:
~~~bash
kubectl get secrets headlamp-token -n headlamp -o jsonpath='{.data.token}' | base64 -d; echo
~~~
