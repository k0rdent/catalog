![logo](https://argo-cd.readthedocs.io/en/stable/assets/logo.png){ align="right", width="100" }
# ArgoCD

=== "Description"

    Argo CD is an open-source tool for implementing GitOps in Kubernetes. It automates the deployment and lifecycle management of applications by continuously synchronizing the desired state declared in a Git repository with the live state in the cluster. k0rdent integration:

    - Centralized Management: Manage Argo CD instances and application deployments across multiple clusters from the K0rdent control plane. 
    - Simplified Deployment: K0rdent can automate the deployment and configuration of Argo CD in your clusters, reducing manual effort.
    - Policy-Driven Deployments: Leverage K0rdent's policy engine to enforce security and compliance policies for your Argo CD deployments and application configurations.

    ## References
    - [Commercial support](https://akuity.io/security-hardened-argo-cd)
    - [Official docs](https://argo-cd.readthedocs.io/en/stable/)

=== "Install"

    Install cluster template to k0rdent
    ~~~bash
    helm install argocd oci://ghcr.io/k0rdent/catalog/charts/argo-cd-service-template -n kcm-system
    ~~~

    Verify service template
    ~~~bash
    kubectl get servicetemplates -A
    # NAMESPACE    NAME                       VALID
    # kcm-system   argo-cd-7-8-0              true
    ~~~

    Deploy service template
    ~~~yaml
    apiVersion: k0rdent.mirantis.com/v1alpha1
    kind: ClusterDeployment
    # kind: MultiClusterService
    ...
      serviceSpec:
        services:
          - template: argo-cd-7-8-0
            name: argocd
            namespace: argocd
    ~~~
