![logo]({{ logo_big }}){ align="right", width="100" }

# Kiali usage for traffic monitoring

This k0rdent solution example demonstrates how to deploy Istio together with kube-prometheus-stack and Kiali to provide full observability for applications running inside a service mesh. Istio generates detailed service mesh telemetry, Prometheus collects and stores the metrics, and Kiali visualizes service topology, traffic flow, and runtime behavior.

#### Prerequisites
Deploy k0rdent {{ version }}: [QuickStart](https://docs.k0rdent.io/{{ version }}/admin/installation/install-k0rdent/){ target="_blank" }

#### Install template to k0rdent
{{ install_code  }}

#### Verify service template
{{ verify_code }}

#### Deploy service templates

##### Deploy istio
~~~yaml
apiVersion: k0rdent.mirantis.com/v1beta1
kind: MultiClusterService
metadata:
  name: kiali-istio-prometheus
spec:
  clusterSelector:
    matchLabels:
      group: demo
  serviceSpec:
    services:
    - template: istio-base-1-28-3
      name: istio-base
      namespace: istio-system
    - template: istiod-1-28-3
      name: istiod
      namespace: istio-system
    - template: istio-gateway-1-28-3
      name: istio-gateway
      namespace: istio-system
    - template: kube-prometheus-stack-81-6-3
      name: prometheus
      namespace: prometheus
      values: |
        kube-prometheus-stack:
          prometheus:
            prometheusSpec:
              storageSpec:
                volumeClaimTemplate:
                  spec:
                    accessModes:
                      - ReadWriteOnce
                    resources:
                      requests:
                        storage: 5Gi
    - template: kiali-operator-2-21-0
      name: kiali-operator
      namespace: kiali
      values: |
        kiali-operator:
          cr:
            create: true
            namespace: istio-system
            spec:
              auth:
                strategy: anonymous
              external_services:
                prometheus:
                  url: http://prometheus-kube-prometheus-prometheus.prometheus:9090
~~~

#### Additional config in child cluster(s)

Enable Istio in `prometheus` namespace:
~~~bash
# Add istio label to prometheus namespace
kubectl label ns prometheus istio-injection=enabled
# Restart prometheus workloads - to start with istio-proxy sidecars
kubectl rollout restart deploy,sts,ds -n prometheus
~~~

Setup traffic metrics scraping for Prometheus:
~~~yaml
apiVersion: monitoring.coreos.com/v1
kind: PodMonitor
metadata:
  name: istio-sidecars
  namespace: istio-system
  labels:
    release: prometheus
spec:
  namespaceSelector:
    any: true
  selector:
    matchLabels:
      security.istio.io/tlsMode: istio
  podMetricsEndpoints:
    - port: http-envoy-prom
      path: /stats/prometheus
      interval: 15s
~~~

Expose Kiali web UI
~~~bash
kubectl port-forward svc/kiali -n istio-system 20001:20001
~~~

Check "Traffic Graph" for `prometheus` namespace in <http://localhost:20001>.

#### Troubleshooting
To see the “Traffic Graph”, Prometheus must properly collect the `istio_*` metrics. If you cannot see the graph in Kiali, ensure that the metrics are being stored in Prometheus. You can verify this using the Prometheus UI:
~~~bash
kubectl port-forward svc/prometheus-kube-prometheus-prometheus -n prometheus 9090:9090
~~~

[More info in Kiali docs](https://kiali.io/docs/installation/installation-guide/accessing-kiali/)
