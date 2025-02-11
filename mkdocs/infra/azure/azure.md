![logo](https://upload.wikimedia.org/wikipedia/commons/9/93/Amazon_Web_Services_Logo.svg){ align="right", width="100" }
# Microsoft Azure
=== "Description"

    K0rdent streamlines the deployment, management, and monitoring of Kubernetes clusters on Microsoft Azure, simplifying container orchestration in the cloud. Here's how it works:
    Deployment:
    Automated Cluster Creation: K0rdent provides a user-friendly interface or API to easily provision Kubernetes clusters on Microsoft Azure. Define your desired cluster configuration, including:
    - Region and availability zones
    - Virtual machine sizes and node counts
    - Kubernetes version
    - Networking options

    Infrastructure as Code: Leverage infrastructure-as-code capabilities to define and manage your Azure infrastructure and Kubernetes deployments in a declarative manner.

    Simplified Configuration: K0rdent handles the complexities of configuring network settings, security policies, and storage integration for your Azure hosted Kubernetes clusters.

    ## References
    - [Commercial support](https://azure.microsoft.com/en-us/support/)

=== "Install"
    
    k0rdent includes the cluster template for Azure out of the box

    ~~~yaml
    apiVersion: k0rdent.mirantis.com/v1alpha1
    kind: ClusterDeployment
    metadata:
      name: my-azure-clusterdeployment1
      namespace: kcm-system
    spec:
      template: azure-standalone-cp-0-1-0
    ~~~
