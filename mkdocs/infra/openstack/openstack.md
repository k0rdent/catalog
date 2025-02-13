![logo](https://avatars.githubusercontent.com/u/324574?s=200&v=4){ align="right", width="100" }
# OpenStack
=== "Description"

    K0rdent streamlines the deployment, management, and monitoring of Kubernetes clusters on OpenStack,simplifying container orchestration in the cloud.

    ## References
    - [Commercial support](https://www.mirantis.com/software/mirantis-openstack-for-kubernetes/)
    - [Official docs](https://docs.k0rdent.io/latest/template-openstack/)

=== "Install"

    Install template to k0rdent
    ~~~yaml
    # k0rdent includes the template for OpenStack out of the box
    ~~~
    
    Verify cluster template
    ~~~yaml
    kubectl get clustertemplate -n kcm-system
    # NAME                            VALID
    # openstack-standalone-cp-0-1-0   true
    ~~~

    Create a cluster on OpenStack
    ~~~yaml
    apiVersion: k0rdent.mirantis.com/v1alpha1
    kind: ClusterDeployment
    metadata:
      name: my-openstack-cluster-deployment
      namespace: kcm-system
    spec:
      template: openstack-standalone-cp-0-1-0
      credential: openstack-cluster-identity-cred
      config:
        clusterLabels: {}
        clusterLabels:
          k0rdent: demo
        controlPlaneNumber: 1
        workersNumber: 1
        controlPlane:
          sshPublicKey: my-public-key
          flavor: m1.medium
          image:
            filter:
              name: ubuntu-22.04-x86_64
        worker:
          sshPublicKey: my-public-key
          flavor: m1.medium
          image:
            filter:
              name: ubuntu-22.04-x86_64
        authURL: https://my-keystone-openstack-url.com
        identityRef:
          name: openstack-cloud-config
          cloudName: openstack
          region: RegionOne
    ~~~
