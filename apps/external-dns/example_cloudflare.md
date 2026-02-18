##### Configuration with Cloudflare
Use ExternalDNS to leverage Cloudflare provider.

~~~yaml
apiVersion: k0rdent.mirantis.com/v1beta1
kind: ClusterDeployment
# kind: MultiClusterService
...
  serviceSpec:
    services:
      - template: external-dns-1-20-0
        name: external-dns
        namespace: external-dns
        values: |
          external-dns:
            provider:
              name: cloudflare
            env:
            - name: CF_API_TOKEN
              valueFrom:
                secretKeyRef:
                  name: dns-tokens
                  key: cloudflare
~~~

You need to have your DNS provider access secret in your managed cluster, e.g. for Cloudflare:
~~~bash
CF_API_TOKEN=<your-cloudflare-api-token>
kubectl create secret generic dns-tokens --from-literal=cloudflare=${CF_API_TOKEN} -n external-dns
~~~
