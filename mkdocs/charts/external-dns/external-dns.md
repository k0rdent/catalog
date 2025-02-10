![logo](https://github.com/kubernetes-sigs/external-dns/raw/master/docs/img/external-dns.png){ align="right", width="200" }
# ExternalDNS

## Installation
Install Service template
~~~bash
helm install external-dns oci://ghcr.io/k0rdent/catalog/charts/external-dns-service-template -n kcm-system
~~~

Check the template is available:
~~~bash
kubectl get servicetemplates -A
# NAMESPACE    NAME                       VALID
# kcm-system   external-dns-1-15-1        true
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
      - template: external-dns-1-15-1
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
                    name: cloudflare-api-key
                    key: apiKey
~~~

You need to have your DNS provider access secret in your managed cluster, e.g. for Cloudflare:
~~~bash
CF_API_TOKEN=<your-cloudflare-api-token>
kubectl create secret generic cloudflare-api-key --from-literal=apiKey=${CF_API_TOKEN} -n external-dns
~~~

## References
- [Official docs](https://kubernetes-sigs.github.io/external-dns/latest/)
