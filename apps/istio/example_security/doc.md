![logo]({{ logo_big }}){ align="right", width="100" }

# Service Mesh mTLS encryption with Istio

This k0rdent solution example demonstrates how to deploy Istio together with kube-prometheus-stack, with Istio providing mTLS-based service mesh security for Prometheus, Grafana, and related monitoring components. The example shows how to secure internal communication between monitoring services using Istio’s traffic encryption, authentication, and authorization features.

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
  name: istio-security
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
~~~

#### Additional config in child cluster(s)
Security is ensured by enabling Istio automatic sidecar injection in the prometheus (or monitoring) namespace.
When injection is enabled, Istio adds an istio-proxy sidecar container to every Pod in that namespace.

This ensures that communication between Prometheus, Grafana, Alertmanager, and other monitoring components
is encrypted and controlled by the service mesh.

Check the pods containers count before Istio is enabled in `prometheus` namespace:
~~~bash
kubectl get pod -n prometheus
# NAME                                                     READY   STATUS    RESTARTS   AGE
# alertmanager-prometheus-kube-prometheus-alertmanager-0   2/2     Running   0          6m37s
# prometheus-grafana-796fdf74cd-lz8k9                      3/3     Running   0          6m38s
# prometheus-kube-prometheus-operator-8ccbd698c-phmrn      1/1     Running   0          6m38s
# prometheus-kube-state-metrics-6f8fc77ffb-kc5n2           1/1     Running   0          6m38s
# prometheus-prometheus-kube-prometheus-prometheus-0       2/2     Running   0          6m37s
# prometheus-prometheus-node-exporter-kbx7b                1/1     Running   0          6m38s
~~~

Now add `istio-injection=enabled` label to `prometheus` namespace and restart its workloads:
~~~bash
# Add istio label to prometheus namespace
kubectl label ns prometheus istio-injection=enabled
# Restart prometheus workloads - to start with istio-proxy sidecars
kubectl rollout restart deploy,sts,ds -n prometheus
~~~

Check the pods containers count again. The number has increased by one, as Istio added the `istio-proxy` sidecar container to each pod,
except `prometheus-prometheus-node-exporter-` ([`hostNework: true` case](https://istio.io/latest/docs/ops/common-problems/injection/#the-result-of-sidecar-injection-was-not-what-i-expected)):
~~~bash
kubectl get pod -n prometheus
# NAME                                                     READY   STATUS    RESTARTS   AGE
# alertmanager-prometheus-kube-prometheus-alertmanager-0   3/3     Running   0          119s
# prometheus-grafana-5cd77ccd-tlfkh                        4/4     Running   0          2m
# prometheus-kube-prometheus-operator-5bc444996c-zfh2l     2/2     Running   0          2m
# prometheus-kube-state-metrics-5797bb8c48-l8t89           2/2     Running   0          2m
# prometheus-prometheus-kube-prometheus-prometheus-0       3/3     Running   0          119s
# prometheus-prometheus-node-exporter-lzvzg                1/1     Running   0          2m
~~~

[More info in Istio docs](https://istio.io/latest/docs/concepts/security/)
