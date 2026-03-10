![logo]({{ logo_big }}){ align="right", width="100" }

# Observe aggregated cluster logs in Grafana
Modern platform environments rarely consist of a single Kubernetes cluster. Organizations commonly operate multiple clusters across cloud providers, edge environments, and on-premise infrastructure. Observability in such environments becomes significantly more challenging: logs, metrics, and access endpoints are distributed across clusters, making troubleshooting and monitoring difficult.

The k0rdent Catalog simplifies deploying and managing production-ready platform services across multiple Kubernetes clusters. Catalog applications are packaged as service templates that can be installed once and then deployed consistently across many clusters using MultiClusterService resources.

![](./assets/grafana-logs.png){ align="right", width="600" }

This demo demonstrates how the k0rdent Catalog can be used to deploy a centralized observability stack consisting of:

- Traefik – provides a standard Kubernetes ingress controller for exposing services
- kube-prometheus-stack – deploys Prometheus, Alertmanager, and Grafana for cluster metrics and monitoring
- Alloy – collects telemetry data from clusters
- Loki – stores and indexes logs collected from the clusters

Together, these components provide a multi-cluster observability solution:

- Metrics from all clusters are collected and visualized in Grafana
- Logs from multiple clusters are aggregated in Loki
- Alloy acts as the telemetry pipeline collecting and forwarding logs and metrics
- Traefik exposes the observability services for external access

Using the k0rdent Catalog service templates, this stack can be installed once and then deployed automatically to any number of clusters. This ensures consistent configuration while reducing operational complexity.

In this guide, we will deploy the observability stack using k0rdent Catalog templates and demonstrate how logs from multiple clusters are aggregated and visualized in a single location.

#### Prerequisites
Deploy k0rdent {{ version }}: [QuickStart](https://docs.k0rdent.io/{{ version }}/admin/installation/install-k0rdent/){ target="_blank" }

#### Install template to k0rdent
{{ install_code  }}

#### Verify service template
{{ verify_code }}

#### Deploy stack
~~~yaml
apiVersion: k0rdent.mirantis.com/v1beta1
kind: MultiClusterService
metadata:
  name: logs
spec:
  clusterSelector:
    matchLabels:
      group: demo
  serviceSpec:
    services:
    - template: traefik-39-0-5
      name: traefik
      namespace: traefik
      values: |
        traefik:
          deployment:
            kind: DaemonSet
          ports:
            web:
              port: 8000
              hostPort: 80
            websecure:
              port: 8443
              hostPort: 443
    - template: kube-prometheus-stack-81-6-3
      name: prometheus
      namespace: prometheus
      values: |
        kube-prometheus-stack:
          grafana:
            ingress:
              enabled: true
              hosts: ['']
            additionalDataSources:
              - name: Loki
                type: loki
                access: proxy
                url: http://loki.logging.svc.cluster.local:3100
                isDefault: false
    - template: alloy-1-6-1
      name: alloy
      namespace: logging
      values: |
        alloy:
          alloy:
            configMap:
              content: |
                  discovery.kubernetes "pods" {
                    role = "pod"
                  }

                  discovery.relabel "pods" {
                    targets = discovery.kubernetes.pods.targets

                    rule {
                      source_labels = ["__meta_kubernetes_namespace"]
                      target_label  = "namespace"
                    }

                    rule {
                      source_labels = ["__meta_kubernetes_pod_name"]
                      target_label  = "pod"
                    }

                    rule {
                      source_labels = ["__meta_kubernetes_container_name"]
                      target_label  = "container"
                    }

                    rule {
                      source_labels = ["__meta_kubernetes_pod_label_app_kubernetes_io_name"]
                      target_label = "app"
                    }
                  }

                  loki.write "default" {
                    endpoint {
                      url = "http://loki.logging.svc.cluster.local:3100/loki/api/v1/push"
                    }
                  }

                  loki.source.kubernetes "pods" {
                    targets    = discovery.relabel.pods.output
                    forward_to = [loki.write.default.receiver]
                  }
    - template: loki-6-53-0
      name: loki
      namespace: logging
      values: |
        loki:
          deploymentMode: SingleBinary
          loki:
            auth_enabled: false

            commonConfig:
              replication_factor: 1

            storage:
              type: filesystem

            schemaConfig:
              configs:
                - from: 2024-01-01
                  store: tsdb
                  object_store: filesystem
                  schema: v13
                  index:
                    prefix: index_
                    period: 24h

            storage_config:
              filesystem:
                directory: /var/loki/chunks

            compactor:
              working_directory: /var/loki/compactor

          singleBinary:
            replicas: 1
          read:
            replicas: 0
          write:
            replicas: 0
          backend:
            replicas: 0

          persistence:
            enabled: true
            size: 2Gi
~~~

#### Testing in child cluster
1. Get Grafana `admin` user password:
~~~bash
kubectl get secret prometheus-grafana -n prometheus -o jsonpath="{.data.admin-password}" | base64 -d; echo
~~~

2. Access Grafana frontend, login using credentials (`admin`, password from `kubectl get secret...` output).

3. Use Grafana `Explore` tab to see logs from any cluster namespace (query e.g.: `{namespace="logging"}`). See the screenshot above.

[More info in Grafana docs](https://grafana.com/docs/alloy/latest/collect/logs-in-kubernetes/)
