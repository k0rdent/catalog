##### Configuration with GPU
This setup requires corresponding cluster setup, see [NVIDIA GPU Operator](../../../{{ version }}/apps/nvidia/#install){ target="_blank" }

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
              gpu:
                enabled: true
                type: 'nvidia'
                number: 1
              models:
                pull: [llama3.2:3b]
                run: [llama3.2:3b]
          ingress:
            enabled: true
            class: "nginx"
            host: 'openwebui.example.com'
~~~
