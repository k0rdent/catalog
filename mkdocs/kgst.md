# k0rdent Generic Service Template (kgst)

## Overview
`kgst` is a Helm chart we use to make k0rdent Service Template installation easy and reliable.

Its main purpose is to install Service Templates for k0rdent Catalog apps. However, it can also be used to quickly create a Service Template using any existing application Helm chart.

## Usage

### Install Service Template from k0rdent Catalog
By default, `kgst` references applications from the k0rdent Catalog:
~~~bash
helm upgrade --install ingress-nginx oci://ghcr.io/k0rdent/catalog/charts/kgst --set "chart=ingress-nginx:4.13.0" -n kcm-system
~~~

Command output:
~~~bash
# Release "ingress-nginx" does not exist. Installing it now.
# Pulled: ghcr.io/k0rdent/catalog/charts/kgst:2.0.0
# Digest: sha256:b1d431106b07dfe38c0c841d94e442425b7cca2ff0aa1b21b9b8761b428c3e15
# NAME: ingress-nginx
# LAST DEPLOYED: Wed Sep 24 09:57:36 2025
# NAMESPACE: kcm-system
# STATUS: deployed
# REVISION: 1
# TEST SUITE: None
# NOTES:
# k0rdent Generic Service Template
# ================================
# Helm repository name: k0rdent-catalog
# Service template:
# - ingress-nginx-4-13-0
# 
# Check resources:
# kubectl get helmrepository k0rdent-catalog -n kcm-system
# kubectl get servicetemplate ingress-nginx-4-13-0 -n kcm-system
~~~

### Install Service Template from upstream Helm chart
It can also be used to install a Service Template from any existing application Helm chart:
~~~bash
helm upgrade --install grafana oci://ghcr.io/k0rdent/catalog/charts/kgst \
  --set "repo.spec.url=https://grafana.github.io/helm-charts" \
  --set "repo.name=grafana" \
  --set "chart=grafana:9.3.6" -n kcm-system
~~~

Command output:
~~~bash
# Release "grafana" does not exist. Installing it now.
# Pulled: ghcr.io/k0rdent/catalog/charts/kgst:2.0.0
# Digest: sha256:b1d431106b07dfe38c0c841d94e442425b7cca2ff0aa1b21b9b8761b428c3e15
# NAME: grafana
# LAST DEPLOYED: Wed Sep 24 09:53:38 2025
# NAMESPACE: kcm-system
# STATUS: deployed
# REVISION: 1
# TEST SUITE: None
# NOTES:
# k0rdent Generic Service Template
# ================================
# Helm repository name: grafana
# Service template:
# - grafana-9-3-6
# 
# Check resources:
# kubectl get helmrepository grafana -n kcm-system
# kubectl get servicetemplate grafana-9-3-6 -n kcm-system
~~~

## Automatic validation

### Chart format check
`kgst` ensures the correct format of the `chart` argument to prevent common mistakes:
~~~bash
helm upgrade --install dex oci://ghcr.io/k0rdent/catalog/charts/kgst --set "chart=dex-0.23.0" -n kcm-system
~~~

Command output:
~~~bash
# Pulled: ghcr.io/k0rdent/catalog/charts/kgst:2.0.0
# Digest: sha256:b1d431106b07dfe38c0c841d94e442425b7cca2ff0aa1b21b9b8761b428c3e15
# Error: execution error at (kgst/templates/service-template.yaml:3:5): Invalid 'chart' format: must be 'name:version' (e.g. 'ingress-nginx:4.11.5')
~~~

### Chart 'Verify Job'
By default, `kgst` performs basic automatic Service Template verification to prevent the use of invalid Helm chart configurations and to follow the _Fail-Fast_ approach. It runs a `Verify Job` using the referenced Helm chart. If the job fails, the Service Template is not installed, and the command prints an error message:
~~~bash
helm upgrade --install foo oci://ghcr.io/k0rdent/catalog/charts/kgst --set "chart=foo:1.2.3" -n kcm-system
~~~

Command output:
~~~bash
# Pulled: ghcr.io/k0rdent/catalog/charts/kgst:2.0.0
# Digest: sha256:b1d431106b07dfe38c0c841d94e442425b7cca2ff0aa1b21b9b8761b428c3e15
# Error: UPGRADE FAILED: pre-upgrade hooks failed: 1 error occurred:
#         * job verify-job-foo-1-2-3 failed: BackoffLimitExceeded
~~~

If necessary, the verification job can be disabled using `--set "skipVerifyJob=true"` option.

## Links
- `kgst` Helm chart [source code](https://github.com/k0rdent/catalog/tree/main/apps/k0rdent-utils/charts/kgst-2.0.0) at github.com/k0rdent-catalog.
- `kgst` [Helm values](https://github.com/k0rdent/catalog/blob/main/apps/k0rdent-utils/charts/kgst-2.0.0/values.yaml).
