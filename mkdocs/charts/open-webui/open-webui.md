---
tags:
  - AI
title: "Open WebUI"
description: "A User-Friendly Web Interface for Chat Interactions."
logo: "https://raw.githubusercontent.com/open-webui/open-webui/main/static/favicon.png"
---
![logo](https://raw.githubusercontent.com/open-webui/open-webui/main/static/favicon.png){ align="right", width="200" }
# Open WebUI

=== "Description"

    Open WebUI is an extensible, feature-rich, and user-friendly self-hosted AI platform designed to operate entirely offline. It supports various LLM runners like Ollama and OpenAI-compatible APIs, with built-in inference engine for RAG, making it a powerful AI deployment solution.

=== "Install"

    Install template to k0rdent
    ~~~bash
    helm install open-webui oci://ghcr.io/k0rdent/catalog/charts/open-webui-service-template -n kcm-system
    ~~~

    Verify service template
    ~~~bash
    kubectl get servicetemplates -A
    # NAMESPACE    NAME                       VALID
    # kcm-system   open-webui-5-13-0          true
    ~~~

    Deploy service template
    ~~~yaml
    apiVersion: k0rdent.mirantis.com/v1alpha1
    kind: ClusterDeployment
    # kind: MultiClusterService
    ...
      serviceSpec:
        services:
          - template: open-webui-5-13-0
            name: open-webui
            namespace: open-webui
            values: |
              open-webui:
                ingress:
                  enabled: true
                  class: "nginx"
                  host: "open-webui.example.com"
    ~~~

    <br>
    - [Official docs](https://docs.openwebui.com/){ target="_blank" }
