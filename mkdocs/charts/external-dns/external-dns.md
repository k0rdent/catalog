---
title: "ExternalDNS"
description: "Synchronizes exposed Kubernetes Services and Ingresses with DNS providers."
logo: "https://github.com/kubernetes-sigs/external-dns/raw/master/docs/img/external-dns.png"
---
![logo](https://github.com/kubernetes-sigs/external-dns/raw/master/docs/img/external-dns.png){ align="right", width="200" }
# ExternalDNS

=== "Description"

    ExternalDNS makes Kubernetes resources discoverable via public DNS servers. Like KubeDNS, it retrieves a list of resources (Services, Ingresses, etc.) from the Kubernetes API to determine a desired list of DNS records. Unlike KubeDNS, however, it’s not a DNS server itself, but merely configures other DNS providers accordingly—e.g. AWS Route 53 or Google Cloud DNS.

    In a broader sense, ExternalDNS allows you to control DNS records dynamically via Kubernetes resources in a DNS provider-agnostic way.

    

=== "Installation"

    Install Service template
    ~~~bash
    helm upgrade --install external-dns oci://ghcr.io/k0rdent/catalog/charts/kgst -n kcm-system \
      --set "helm.repository.url=https://kubernetes-sigs.github.io/external-dns/" \
      --set "helm.charts[0].name=external-dns" \
      --set "helm.charts[0].version=1.15.2"
    ~~~

    Verify service template
    ~~~bash
    kubectl get servicetemplates -A
    # NAMESPACE    NAME                       VALID
    # kcm-system   external-dns-1-15-2        true
    ~~~

    Deploy service template
    ~~~yaml
    apiVersion: k0rdent.mirantis.com/v1alpha1
    kind: ClusterDeployment
    # kind: MultiClusterService
    ...
      serviceSpec:
        services:
          - template: external-dns-1-15-2
            name: external-dns
            namespace: external-dns
            values: |
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

    <br>
    - [Official docs](https://kubernetes-sigs.github.io/external-dns/latest/){ target="_blank" }
