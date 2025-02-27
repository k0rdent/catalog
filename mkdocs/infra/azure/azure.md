---
tags:
  - Infrastructure
title: "Microsoft Azure"
description: "Deploy kubernetes clusters with k0rdent on Microsoft Azure infrastructure."
logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/fa/Microsoft_Azure.svg/1200px-Microsoft_Azure.svg.png"
---
![logo](https://upload.wikimedia.org/wikipedia/commons/thumb/f/fa/Microsoft_Azure.svg/1200px-Microsoft_Azure.svg.png){ align="right", width="100" }
# Microsoft Azure
=== "Description"

    K0rdent streamlines the deployment, management, and monitoring of Kubernetes clusters on Microsoft Azure, simplifying container orchestration in the cloud. Here's how it works:

    - Automated Cluster Creation: K0rdent provides a user-friendly interface or API to easily provision Kubernetes clusters on Microsoft Azure. Define your desired cluster configuration, including:
    	-  Region and availability zones
    	-  Virtual machine sizes and node counts
    	-  Kubernetes version
    	-  Networking options
    - Infrastructure as Code: Leverage infrastructure-as-code capabilities to define and manage your Azure infrastructure and Kubernetes deployments in a declarative manner.
    - Simplified Configuration: K0rdent handles the complexities of configuring network settings, security policies, and storage integration for your Azure hosted Kubernetes clusters.


    <br>
    Looking for Commercial Support? [LEARN MORE](https://azure.microsoft.com/en-us/support/){ target="_blank" .bold }

=== "Install"

    #### Prerequisites

    Deploy k0rdent: [QuickStart](https://docs.k0rdent.io/v0.1.0/guide-to-quickstarts/#guide-to-quickstarts)

    #### Install template to k0rdent
    ~~~yaml
    # k0rdent includes the template for Azure out of the box
    ~~~

    #### Verify cluster template
    ~~~yaml
    kubectl get clustertemplate -n kcm-system
    # NAME                            VALID
    # azure-hosted-cp-0-1-0           true 
    ~~~

    #### Create a cluster on Microsoft Azure
    ~~~yaml
    apiVersion: k0rdent.mirantis.com/v1alpha1
    kind: ClusterDeployment
    metadata:
      name: my-azure-clusterdeployment1
      namespace: kcm-system
    spec:
      template: azure-standalone-cp-0-1-0 # name of the clustertemplate
      credential: azure-cluster-identity-cred
      config:
        clusterLabels: {}
        location: "AZURE_LOCATION" # Select your desired Azure Location
        subscriptionID: SUBSCRIPTION_ID_SUBSCRIPTION_ID # Enter the Subscription ID used earlier
        controlPlane:
          vmSize: Standard_A4_v2
        worker:
          vmSize: Standard_A4_v2
    ~~~

    - [Official docs](https://docs.k0rdent.io/latest/template-azure/){ target="_blank" }