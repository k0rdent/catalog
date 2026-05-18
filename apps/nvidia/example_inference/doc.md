# AI Inference Stack (NVIDIA)

A fully integrated stack for deploying and serving LLMs and ML models in production. Combines GPU provisioning, model serving, observability, and autoscaling into a single validated blueprint for organizations running LLM inference and real-time prediction workloads.

#### Prerequisites
Deploy k0rdent {{ version }}: [QuickStart](https://docs.k0rdent.io/{{ version }}/admin/installation/install-k0rdent/){ target="_blank" }

#### Install template to k0rdent
{{ install_code  }}

#### Verify service template
{{ verify_code }}

#### Create child cluster
... on Azure
~~~yaml
apiVersion: k0rdent.mirantis.com/v1beta1
kind: ClusterDeployment
metadata:
  name: azure-example-cluster
  labels:
    group: demo
spec:
  template: {{ azure_standalone_cp }}
  credential: azure-credential
  config:
    controlPlaneNumber: 1
    workersNumber: 1
    location: "westus"
    subscriptionID: SUBSCRIPTION_ID_SUBSCRIPTION_ID # Enter the Subscription ID used earlier
    controlPlane:
      vmSize: Standard_A4_v2
    worker:
      image:
        marketplace:
          publisher: "Canonical"
          offer: "0001-com-ubuntu-minimal-jammy"
          sku: "minimal-22_04-lts"
          version: "22.04.202502270"
      rootVolumeSize: 32
      # Small Azure instance with NVIDIA GPU
      vmSize: Standard_NC4as_T4_v3
~~~

... or on AWS
~~~yaml
apiVersion: k0rdent.mirantis.com/v1beta1
kind: ClusterDeployment
metadata:
  name: aws-example-cluster
  labels:
    group: demo
spec:
  template: {{ aws_standalone_cp }}
  credential: aws-credential
  config:
    controlPlane:
      instanceType: t3.small
    controlPlaneNumber: 1
    publicIP: false
    region: eu-central-1
    worker:
      # Small AWS instance with NVIDIA GPU
      instanceType: g4dn.xlarge
      # AMI Catalog - Community AMIs:
      #  Find region specific AMI ID with title:
      #  "ubuntu/images/hvm-ssd/ubuntu-jammy-22.04-amd64-server"
      #  eu-central-1: ami-0162f0739222cca1c, us-east-2: ami-00eb69d236edcfaf8, ap-south-1: ami-0b738b0c888af81f7
      amiID: "ami-0162f0739222cca1c"
      imageLookup: {org: "", format: "", baseOS: ""}
      rootVolumeSize: 100
    workersNumber: 1
~~~

#### Deploy services

NVIDIA GPU setup:
~~~yaml
apiVersion: k0rdent.mirantis.com/v1beta1
kind: MultiClusterService
metadata:
  name: gpu-operator
spec:
  clusterSelector:
    matchLabels:
      group: demo
  serviceSpec:
    services:
    - template: gpu-operator-26-3-1
      name: gpu-operator
      namespace: gpu-operator
      values: |
        gpu-operator:
          operator:
            defaultRuntime: containerd
          toolkit:
            env:
              - name: CONTAINERD_CONFIG
                value: /run/k0s/containerd-cri.toml
              - name: RUNTIME_DROP_IN_CONFIG
                value: /etc/k0s/containerd.d/nvidia.toml
              - name: CONTAINERD_SOCKET
                value: /run/k0s/containerd.sock
              - name: CONTAINERD_RUNTIME_CLASS
                value: nvidia
          # optionally, create DCGM-Exporter ServiceMonitor
          dcgmExporter:
            serviceMonitor:
              enabled: true
              interval: 15s
              honorLabels: true
              additionalLabels: {}
~~~

AI inference app:
~~~yaml
apiVersion: k0rdent.mirantis.com/v1beta1
kind: MultiClusterService
metadata:
  name: open-webui
  namespace: kcm-system
spec:
  clusterSelector:
    matchLabels:
      group: demo
  serviceSpec:
    services:
    - template: traefik-39-0-8
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
    - template: open-webui-14-1-0
      name: open-webui
      namespace: open-webui
      dependsOn:
      - name: traefik
        namespace: traefik
      values: |
        open-webui:
          ollama:
            ollama:
              gpu:
                enabled: true
                type: amd
                number: 1
              models:
                pull: ['gemma3:4b']
                run: ['gemma3:4b']
          persistentVolume:
            enabled: true
          ingress:
            enabled: true
            host: ''
~~~
