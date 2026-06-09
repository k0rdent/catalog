# AI Infrastructure Observability with Cost Attribution
Running GPU-accelerated AI workloads across multiple Kubernetes clusters demands visibility into both performance and cost. Teams need real-time GPU utilization metrics, alerting on model serving latency, and per-workload cost attribution to make informed decisions about infrastructure spend.

The k0rdent Catalog simplifies deploying and managing production-ready platform services across multiple Kubernetes clusters. Catalog applications are packaged as service templates that can be installed once and then deployed consistently across many clusters using MultiClusterService resources.

This solution deploys a focused observability stack consisting of:

- Traefik – provides a standard Kubernetes ingress controller for exposing dashboards
- kube-prometheus-stack – deploys Prometheus, Alertmanager, and Grafana with pre-built DCGM GPU dashboards for AI infrastructure monitoring
- OpenCost – provides per-workload GPU and compute cost allocation using Prometheus metrics

Together, these components provide AI infrastructure observability with FinOps cost attribution:

- GPU utilization, memory, and temperature metrics are collected and visualized in Grafana
- OpenCost computes per-pod, per-namespace, and per-label costs in real time using actual cloud pricing APIs
- Prometheus scrapes OpenCost metrics so cost data appears alongside performance dashboards
- Traefik exposes Grafana and OpenCost UI for external access

Using the k0rdent Catalog service templates, this stack can be installed once and then deployed automatically to any number of clusters. This ensures consistent observability and cost tracking across your entire AI infrastructure.

#### Prerequisites
Deploy k0rdent {{ version }}: [QuickStart](https://docs.k0rdent.io/{{ version }}/admin/installation/install-k0rdent/){ target="_blank" }

#### Install template to k0rdent
{{ install_code  }}

#### Verify service template
{{ verify_code }}

#### Deploy stack
{{ deploy_code }}

#### Testing in child cluster
1. Get Grafana `admin` user password:
~~~bash
kubectl get secret monitoring-grafana -n monitoring -o jsonpath="{.data.admin-password}" | base64 -d; echo
~~~

2. Access Grafana frontend, login using credentials (`admin`, password from `kubectl get secret...` output).

3. Verify Prometheus targets include the `opencost` scrape job under Status > Targets.

4. Access OpenCost UI at the configured ingress host to view per-workload cost breakdowns.

5. In Grafana, check the pre-built DCGM GPU dashboards for GPU utilization metrics (requires NVIDIA GPU Operator on the cluster).
