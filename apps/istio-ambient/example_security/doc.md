![logo]({{ logo_big }}){ align="right", width="100" }

# Service Mesh mTLS encryption with Istio - Ambient mode

This k0rdent solution example demonstrates how to deploy Istio in ambient mode together with kube-prometheus-stack, enabling mTLS-based service mesh security without sidecar injection. In this setup, Istio’s ambient dataplane (ztunnel and optional waypoint proxies) transparently secures traffic for Prometheus, Grafana, and related monitoring components at the namespace level.

#### Prerequisites
Deploy k0rdent {{ version }}: [QuickStart](https://docs.k0rdent.io/{{ version }}/admin/installation/install-k0rdent/){ target="_blank" }

#### Install template to k0rdent
{{ install_code }}

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
    - template: istio-cni-1-28-3
      name: istio-cni
      namespace: istio-system
      values: |
        cni:
          profile: ambient
    - template: istiod-1-28-3
      name: istiod
      namespace: istio-system
      values: |
        istiod:
          profile: ambient
    - template: istio-ztunnel-1-28-3
      name: istio-ztunnel
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
                        storage: 20Gi
~~~

#### Additional config in child cluster(s)
First, verify that the ambient dataplane components are running correctly. In ambient mode, ztunnel is responsible for intercepting and securing traffic at Layer 4. You can inspect its logs to confirm it is connected to the control plane (istiod) and receiving configuration via XDS:
~~~bash
kubectl logs -f -n istio-system ds/ztunnel
# ...
# 2026-02-23T18:31:12.134269Z     info    xds::client:xds{id=5}   received response       type_url="type.googleapis.com/istio.workload.Address" size=0 removes=1
# 2026-02-23T18:31:18.619090Z     info    xds::client:xds{id=5}   received response       type_url="type.googleapis.com/istio.security.Authorization" size=0 removes=0
~~~

##### Enroll the Monitoring Namespace into Ambient Mode
Label the prometheus namespace to enable Istio ambient dataplane.
After labeling, restart the workloads so that existing pods are fully captured by ztunnel:
~~~bash
kubectl label ns prometheus istio.io/dataplane-mode=ambient
kubectl rollout restart deploy,sts,ds -n prometheus
~~~
The namespace label activates ambient mode for all pods in the namespace.
The rollout restart ensures that running Deployments, StatefulSets, and DaemonSets are recreated so their traffic is redirected through ztunnel.

##### Verify Traffic Is Secured by ztunnel
After the restart, monitor the ztunnel logs to confirm that traffic from Prometheus components is being intercepted and handled by the ambient dataplane:
~~~bash
kubectl logs -f -n istio-system ds/ztunnel
# ...
# 2026-02-23T20:06:51.237208Z     info    access  connection complete     src.addr=10.244.0.182:56240 src.workload="prometheus-prometheus-kube-prometheus-prometheus-0" src.namespace="prometheus" dst.addr=172.18.0.4:10250 direction="outbound" bytes_sent=28915 bytes_recv=2266434 duration="1187524ms"
# 2026-02-23T20:06:51.237267Z     info    access  connection complete     src.addr=10.244.0.182:50454 src.workload="prometheus-prometheus-kube-prometheus-prometheus-0" src.namespace="prometheus" dst.addr=172.18.0.4:10250 direction="outbound" bytes_sent=10048 bytes_recv=383177 duration="1185155ms"
# 2026-02-23T20:06:51.237340Z     info    access  connection complete     src.addr=10.244.0.182:56218 src.workload="prometheus-prometheus-kube-prometheus-prometheus-0" src.namespace="prometheus" dst.addr=172.18.0.4:10250 direction="outbound" bytes_sent=311745 bytes_recv=25868486 duration="1194673ms"
~~~
These log entries demonstrate that:

-	Traffic originates from a Prometheus workload in the prometheus namespace.
-	Connections are intercepted by ztunnel.
-	The traffic is routed outbound through the ambient dataplane.
-	Connection metadata (source workload, namespace, destination address, bytes transferred, and duration) is recorded.

The presence of these structured access logs confirms that Prometheus traffic is being captured and secured by Istio ambient mode. Even though pods do not run sidecars, all communication is transparently handled by ztunnel, providing mTLS-based encryption and workload identity at Layer 4.

[More info in Istio docs](https://istio.io/latest/docs/ambient/overview/)
