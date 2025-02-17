---
tags:
    - GPU 
    - AI
title: "Nvidia GPU Operator"
description: "NVIDIA GPU Operator creates/configures/manages GPUs atop Kubernetes."
logo: "./charts/nvidia/GPUoperator-cropped.png"
---
![logo](./GPUoperator-cropped.png){ align="right", width="200" }
# Nvidia GPU Operator

=== "Description"

    The NVIDIA GPU Operator for Kubernetes is a powerful tool that simplifies the management of GPUs in your Kubernetes clusters. It automates the deployment and configuration of all the necessary software components to enable GPUs, making it easier to run GPU-accelerated workloads like AI/ML training and high-performance computing.

    <br>
    Looking for Commercial Support? [LEARN MORE](https://docs.nvidia.com/datacenter/cloud-native/gpu-operator/latest/index.html){ target="_blank" .bold }

=== "Installation"

    Install Service template
    ~~~bash
    helm install gpu-operator oci://ghcr.io/k0rdent/catalog/charts/gpu-operator-service-template -n kcm-system
    ~~~

    Verify service template
    ~~~bash
    kubectl get servicetemplates -A
    # NAMESPACE    NAME                          VALID
    # kcm-system   gpu-operator-24-9-2           true
    ~~~

    Deploy service template
    ~~~yaml
    apiVersion: k0rdent.mirantis.com/v1alpha1
    kind: ClusterDeployment
    # kind: MultiClusterService
    ...
      serviceSpec:
        services:
          - template: gpu-operator-24-9-2
            name: gpu-operator
            namespace: gpu-operator
    ~~~