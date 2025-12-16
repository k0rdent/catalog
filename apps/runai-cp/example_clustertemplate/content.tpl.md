#### Install template to k0rdent
  This example clustertemplate uses Cilium CNI and requires the operator.
  ~~~bash
  helm upgrade --install cilium oci://ghcr.io/k0rdent/catalog/charts/kgst --set "chart=cilium:1.18.2" -n kcm-system
  ~~~

#### Verify service template

  ~~~bash
    kubectl get servicetemplates -A
    # NAMESPACE    NAME                            VALID
    [..]
    # kcm-system    cilium-1-18-2    true
  ~~~

### Example clustertemplate
  The clustertemplate is an example and you can create your own based on your needs. This should just speed up your deployment.

#### Clustertemplate HelmRepository
  ~~~yaml
  apiVersion: source.toolkit.fluxcd.io/v1
  kind: HelmRepository
  metadata:
    labels:
      k0rdent.mirantis.com/managed: 'true'
    name: mirantis-templates
    namespace: kcm-system
  spec:
    interval: 1m0s
    type: oci
    url: oci://registry.mirantis.com/k0rdent-ai/example/charts
  ~~~

#### Clustertemplate
  ~~~yaml
  apiVersion: k0rdent.mirantis.com/v1beta1
  kind: ClusterTemplate
  metadata:
    name: aws-generic-cilium-clustertemplate-0-1-0
    namespace: kcm-system
  spec:
    helm:
      chartSpec:
        chart: aws-cp-standalone-generic-cilium
        interval: 10m0s
        sourceRef:
          kind: HelmRepository
          name: mirantis-templates
        version: 0.1.0
  ~~~

#### Cilium config values
  ~~~yaml
  kind: ConfigMap
  apiVersion: v1
  metadata:
    name: service-cilium-values
    namespace: kcm-system
  data:
    cilium-values: |
      cilium:
        cluster:
          name: cilium

        hubble:
          tls:
            enabled: false
          auto:
            method: helm
            certManagerIssuerRef: {}
          ui:
            enabled: false
            ingress:
              enabled: false
          relay:
            enabled: false

        ipv4:
          enabled: true

        ipv6:
          enabled: false

        envoy:
          enabled: false

        egressGateway:
          enabled: false

        kubeProxyReplacement: "true"

        serviceAccounts:
          cilium:
            name: cilium
          operator:
            name: cilium-operator

        localRedirectPolicy: true

        ipam:
          mode: cluster-pool
          operator:
            clusterPoolIPv4PodCIDRList:
            - "192.168.224.0/20"
            - "192.168.210.0/20"
            clusterPoolIPv6PodCIDRList:
            - "fd00::/104"

        tunnelProtocol: geneve
  ~~~

#### Clusterdeployment example
  > **Attention!**
  >
  > You need to update all necessary parameters, like machine flavors, key names, etc.
  >
  > This clusterdeployment provides a very small footprint, it doesn't provide any HA. You would need to increasae the number of nodes to distribute pods properly.

  ~~~yaml
  apiVersion: k0rdent.mirantis.com/v1beta1
  kind: ClusterDeployment
  metadata:
    name: runai-cp
    namespace: kcm-system
  spec:
    ipamClaim: {}
    propagateCredentials: true
    credential: aws-cluster-identity-cred                       # Update if necesarry 
    template: aws-generic-cilium-clustertemplate-0-1-0
    config:
      awscluster:
        network:
          cni:
            cniIngressRules:
            - description: vxlan (cilium)
              fromPort: 8472
              protocol: udp
              toPort: 8472
            - description: geneve (cilium)
              fromPort: 6081
              protocol: udp
      clusterLabels:
        group: runai-cp
        type: aws
      bastion: 
        enabled: true
        disableIngressRules: false 
        allowedCIDRBlocks: [] 
        instanceType: t3.small 
        ami: "ami-0becc523130ac9d5d"                                                   
      workers:
        - name: cpu
          type: worker
          preStartCommands:
            - "apt update" 
            - "apt install nfs-common -y"
          labels:
            node-role.kubernetes.io/runai-cpu-worker: "true"
          amiID: ami-0becc523130ac9d5d                          # EU-north-1 - Ubuntu 22.04
          instanceType: t3.2xlarge
          number: 1
          rootVolumeSize: 120
          publicIP: false
          iamInstanceProfile: control-plane.cluster-api-provider-aws.sigs.k8s.io
        - name: system
          type: worker
          preStartCommands:
            - "apt update" 
            - "apt install nfs-common -y"
          labels:
            node-role.kubernetes.io/runai-system: "true"
          amiID: ami-0becc523130ac9d5d
          instanceType: t3.2xlarge
          number: 1
          rootVolumeSize: 120
          publicIP: false    
          iamInstanceProfile: control-plane.cluster-api-provider-aws.sigs.k8s.io  
        - name: worker
          type: gpu
          preStartCommands:
            - "apt update" 
            - "apt install nfs-common -y"
          labels:
            node-role.kubernetes.io/runai-gpu-worker: "true"          
            node.kubernetes.io/role: runai-gpu-worker
            nvidia.com/gpu: "true"
          amiID: ami-0becc523130ac9d5d
          instanceType: g6e.2xlarge
          iamInstanceProfile: control-plane.cluster-api-provider-aws.sigs.k8s.io
          number: 1
          rootVolumeSize: 120
          publicIP: true
      controlPlane:
        amiID: ami-0becc523130ac9d5d
        instanceType: c5.xlarge
        number: 1
        rootVolumeSize: 100
      k0s:
        version: v1.34.2+k0s.0
        network:  # Disable default network, to install cilium CNI
          calico: null
          provider: custom
          kubeProxy:
            disabled: true
      region: eu-north-1                                                              # Update if necesarry
      sshKeyName: runai                                                               # Update if necesarry
      clusterIdentity: 
        name: "aws-cluster-identity" 
        kind: "AWSClusterStaticIdentity" 
    serviceSpec:
      stopOnConflict: false
      syncMode: Continuous
      continueOnError: true
      priority: 100
      services:
        - name: cilium
          namespace: kube-system
          template: cilium-1-18-2
          valuesFrom:
            - kind: ConfigMap
              name: service-cilium-values
          values: |
            cilium:
              k8sServiceHost: {{"{{ .Cluster.spec.controlPlaneEndpoint.host }}"}}
              k8sServicePort: {{"{{ .Cluster.spec.controlPlaneEndpoint.port }}"}}
  ~~~