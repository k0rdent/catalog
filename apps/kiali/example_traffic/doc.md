![logo]({{ logo_big }}){ align="right", width="100" }

# Service Mesh Traffic Monitoring with Kiali

This k0rdent solution example demonstrates how to deploy Istio together with kube-prometheus-stack and Kiali to provide full observability for applications running inside a service mesh. Istio generates detailed service mesh telemetry, Prometheus collects and stores the metrics, and Kiali visualizes service topology, traffic flow, and runtime behavior.

#### Prerequisites
Deploy k0rdent {{ version }}: [QuickStart](https://docs.k0rdent.io/{{ version }}/admin/installation/install-k0rdent/){ target="_blank" }

#### Install template to k0rdent
{{ install_code  }}

#### Verify service template
{{ verify_code }}

#### Deploy service templates

##### Deploy istio
{{ deploy_code }}

#### UI access

Check "Traffic Graph" for `prometheus` namespace in <http://localhost>.

#### Troubleshooting
To see the “Traffic Graph”, Prometheus must properly collect the `istio_*` metrics. If you cannot see the graph in Kiali, ensure that the metrics are being stored in Prometheus. You can verify this using the Prometheus UI:
~~~bash
kubectl port-forward svc/prometheus-kube-prometheus-prometheus -n prometheus 9090:9090
~~~

[More info in Kiali docs](https://kiali.io/docs/installation/installation-guide/accessing-kiali/)
