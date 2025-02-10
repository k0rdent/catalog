![logo](https://upload.wikimedia.org/wikipedia/commons/9/93/Amazon_Web_Services_Logo.svg){ align="right", width="100" }
# Amazon Web Services
=== "Description"

    K0rdent, as a multi-cluster Kubernetes management platform, integrates with AWS to provide a seamless experience for managing and deploying Kubernetes clusters and applications on the AWS cloud. Here's how this integration works:
    Cluster Deployment: K0rdent can deploy Kubernetes clusters on AWS using CAPI.

    Infrastructure Management: K0rdent can provision and manage AWS infrastructure resources, such as EC2 instances, VPCs, and security groups, required for your Kubernetes clusters.

    Centralized Management: Manage your AWS-based Kubernetes clusters from the K0rdent control plane, along with clusters on other platforms.

    Cost Optimization: K0rdent can provide insights into your AWS spending and help you optimize resource allocation for your Kubernetes deployments.

    Security and Compliance: K0rdent integrates with AWS security services to ensure your Kubernetes clusters and applications are secure and compliant with industry standards.

    ## References
    - [Commercial support](https://aws.amazon.com/contact-us/)

=== "Install"

    k0rdent includes the cluster template for AWS out of the box

    ~~~yaml
    apiVersion: k0rdent.mirantis.com/v1alpha1
    kind: ClusterDeployment
    metadata:
      name: my-azure-clusterdeployment1
      namespace: kcm-system
    spec:
      template: aws-standalone-cp-0-1-0
    ~~~
