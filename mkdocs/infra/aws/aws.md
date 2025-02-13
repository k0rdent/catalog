---
tags:
  - AWS
  - Kubernetes
title: "Amazon Web Services"
description: "Deploy kubernetes clusters with k0rdent on AWS infrastructure."
logo: "https://upload.wikimedia.org/wikipedia/commons/9/93/Amazon_Web_Services_Logo.svg"
---
![logo](https://upload.wikimedia.org/wikipedia/commons/9/93/Amazon_Web_Services_Logo.svg){ align="right", width="100" }
# Amazon Web Services
=== "Description"

    k0rdent, as a multi-cluster Kubernetes management platform, integrates with AWS to provide a seamless experience for managing and deploying Kubernetes clusters and applications on the AWS cloud. Here's how this integration works:

    - Cluster Deployment: k0rdent can deploy Kubernetes clusters on AWS using CAPI. 
    - Infrastructure Management: k0rdent can provision and manage AWS infrastructure resources, such as EC2 instances, VPCs, and security groups, required for your Kubernetes clusters.
    - Centralized Management: Manage your AWS-based Kubernetes clusters from the k0rdent control plane, along with clusters on other platforms.
    - Cost Optimization: k0rdent can provide insights into your AWS spending and help you optimize resource allocation for your Kubernetes deployments.
    - Security and Compliance: k0rdent integrates with AWS security services to ensure your Kubernetes clusters and applications are secure and compliant with industry standards.

    ## References
    - [Commercial support](https://aws.amazon.com/contact-us/)
    - [Official docs](https://docs.k0rdent.io/latest/template-aws/)

=== "Install"

    Install template to k0rdent
    ~~~yaml
    # k0rdent includes the template for AWS out of the box
    ~~~
    
    Verify cluster template
    ~~~yaml
    kubectl get clustertemplate -n kcm-system
    # NAME                            VALID
    # aws-hosted-cp-0-1-0             true
    ~~~

    Create a cluster on AWS
    ~~~yaml
    apiVersion: k0rdent.mirantis.com/v1alpha1
    kind: ClusterDeployment
    metadata:
      name: my-azure-clusterdeployment1
      namespace: kcm-system
    spec:
      template: aws-standalone-cp-0-1-0
      credential: aws-cluster-identity-cred
      config:
        clusterLabels: {}
        region: us-east-2
        controlPlane:
          instanceType: t3.small
        worker:
          instanceType: t3.small
    ~~~
