##### Configuration without GPU
Tested on worker `instanceType: t3.xlarge` and `rootVolumeSize: 32`:
~~~yaml
apiVersion: k0rdent.mirantis.com/v1beta1
kind: ClusterDeployment
metadata:
  name: aws-example
spec:
  template: {{ aws_standalone_cp }}
  credential: aws-credential
  config:
    ...
    worker:
      instanceType: t3.xlarge
      rootVolumeSize: 32
    workersNumber: 1
~~~

Tested service configuration:
~~~yaml
apiVersion: k0rdent.mirantis.com/v1beta1
kind: MultiClusterService
metadata:
  name: open-webui
spec:
  clusterSelector:
    matchLabels:
      group: demo
  serviceSpec:
    services:
    - template: open-webui-8-12-3
      name: open-webui
      namespace: open-webui
      values: |
        open-webui:
          ollama:
            ollama:
              models:
                pull: [smollm:135m]
                run: [smollm:135m]
          ingress:
            enabled: true
            class: "nginx"
            host: 'openwebui.example.com'
~~~
