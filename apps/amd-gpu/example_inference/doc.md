# AI Inference Stack (AMD)

A fully integrated stack for deploying and serving LLMs and ML models in production. Combines GPU provisioning, model serving, observability, and autoscaling into a single validated blueprint for organizations running LLM inference and real-time prediction workloads.

#### Prerequisites
Deploy k0rdent {{ version }}: [QuickStart](https://docs.k0rdent.io/{{ version }}/admin/installation/install-k0rdent/){ target="_blank" }

#### Install template to k0rdent
{{ install_code  }}

#### Verify service template
{{ verify_code }}

#### Create Azure child cluster
~~~yaml
apiVersion: k0rdent.mirantis.com/v1beta1
kind: ClusterDeployment
metadata:
  name: aws-example-cluster
  namespace: kcm-system
  labels:
    group: demo
spec:
  template: {{ azure_standalone_cp }}
  credential: azure-credential
  config:
    controlPlaneNumber: 1
    workersNumber: 1 
    location: "westus"
    subscriptionID: SUBSCRIPTION_ID # Enter the Subscription ID
    controlPlane:
      vmSize: Standard_A4_v2
    worker:
      image:
        marketplace:
          publisher: "microsoft-dsvm"
          offer: "ubuntu-hpc"
          sku: "2204-rocm" # Ubuntu 22.04 with AMD driver pre-installed
          version: "22.04.2025041101"
      rootVolumeSize: 500 # Big disk needed for testing images
      # 8x AMD Instinct MI300 GPUs (expensive!)
      vmSize: Standard_ND96is_MI300X_v5
~~~

#### Deploy services

AMD GPU setup:
~~~yaml
apiVersion: k0rdent.mirantis.com/v1beta1
kind: MultiClusterService
metadata:
  name: amd-gpu-setup
  namespace: kcm-system
spec:
  clusterSelector:
    matchLabels:
      group: demo
  serviceSpec:
    continueOnError: false
    priority: 100
    provider: {}
    services:
    - name: cert-manager
      namespace: cert-manager
      template: cert-manager-1-20-2
      values: |
        cert-manager:
          crds:
            enabled: true
    - name: amd-gpu
      namespace: kube-amd-gpu
      template: amd-gpu-v1-4-1
      dependsOn:
      - name: cert-manager
        namespace: cert-manager
      values: |
        gpu-operator-charts:
          crds:
            defaultCR:
              install: false
    - name: raw-dc
      namespace: kube-amd-gpu
      template: raw-2-0-2
      dependsOn:
      - name: amd-gpu
        namespace: kube-amd-gpu
      values: |
        raw:
          resources:
          - apiVersion: amd.com/v1alpha1
            kind: DeviceConfig
            metadata:
              name: amd-gpu-operator
              namespace: kube-amd-gpu
            spec:
              driver:
                enable: false
              devicePlugin:
                devicePluginImage: rocm/k8s-device-plugin:latest
                nodeLabellerImage: rocm/k8s-device-plugin:labeller-latest
                enableNodeLabeller: true
              selector:
                feature.node.kubernetes.io/amd-vgpu: "true"
    - name: raw-gpu-pod
      namespace: kube-amd-gpu
      template: raw-2-0-2
      dependsOn:
      - name: raw-dc
        namespace: kube-amd-gpu
      values: |
        raw:
          resources:
          - apiVersion: v1
            kind: Pod
            metadata:
             name: amd-smi
            spec:
             containers:
             - image: docker.io/rocm/pytorch:latest # 20GB image !
               name: amd-smi
               command: ["/bin/bash"]
               args: ["-c","amd-smi version && amd-smi monitor -ptum"]
               resources:
                  limits:
                    amd.com/gpu: 1
                  requests:
                    amd.com/gpu: 1
             restartPolicy: Never
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
