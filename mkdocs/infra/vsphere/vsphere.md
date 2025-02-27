---
tags:
    - Infrastructure
title: "VMware vSphere"
description: "Deploy kubernetes clusters with k0rdent on VMware vSphere infrastructure."
logo: "https://upload.wikimedia.org/wikipedia/commons/2/2e/VMware-vSphere-7.jpg"
---
![logo](https://upload.wikimedia.org/wikipedia/commons/2/2e/VMware-vSphere-7.jpg){ align="right", width="150" }
# VMware vSphere

=== "Description"

    K0rdent streamlines the deployment, management, and monitoring of Kubernetes clusters on VMware vSphere, simplifying container orchestration in the cloud.

    <br>
    Looking for Commercial Support? [LEARN MORE](https://www.vmware.com/products/cloud-infrastructure/vsphere){ target="_blank" .bold }
    

=== "Install"

    #### Prerequisites

    Deploy k0rdent: [QuickStart](https://docs.k0rdent.io/v0.1.0/guide-to-quickstarts/#guide-to-quickstarts)

    #### Install template to k0rdent
    ~~~yaml
    # k0rdent includes the template for vSphere out of the box
    ~~~
    
    Verify cluster template
    ~~~yaml
    kubectl get clustertemplate -n kcm-system
    # NAME                            VALID
    # vsphere-hosted-cp-0-1-0         true
    ~~~

    Create a cluster on vSphere
    ~~~yaml
    apiVersion: k0rdent.mirantis.com/v1alpha1
    kind: ClusterDeployment
    metadata:
      name: cluster-1
    spec:
      template: vsphere-hosted-cp-0-1-0
      credential: vsphere-credential
      config:
        clusterLabels: {}
        vsphere:
          server: vcenter.example.com
          thumbprint: "00:00:00"
          datacenter: "DC"
          datastore: "/DC/datastore/DC"
          resourcePool: "/DC/host/vCluster/Resources/ResPool"
          folder: "/DC/vm/example"
        controlPlaneEndpointIP: "<VSPHERE_SERVER>"
        ssh:
          user: ubuntu
          publicKey: |
            ssh-rsa AAA...
        rootVolumeSize: 50
        cpus: 2
        memory: 4096
        vmTemplate: "/DC/vm/template"
        network: "/DC/network/Net"
        k0smotron:
          service:
            annotations:
              kube-vip.io/loadbalancerIPs: "<VSPHERE_LOADBALANCER_IP>"
    ~~~

    - [Official docs](https://docs.k0rdent.io/latest/template-vsphere/){ target="_blank" }