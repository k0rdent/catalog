---
tags:
  - Application Runtime
title: "Dapr"
description: "Portable, event-driven runtime."
logo: "./charts/dapr/dapr-logo.svg"
---
![dapr](./dapr-logo.svg){ align="right", width="100" }
# Dapr

=== "Description"

    Dapr (Distributed Application Runtime) is an open-source, portable, event-driven runtime that makes it easy for developers to build resilient, microservices applications that run on the cloud and edge. Dapr provides APIs that abstract away the complexities of common challenges when building distributed applications, such as: 
    Service-to-service invocation: Enables reliable and secure communication between microservices. 

    State management: Provides a consistent way to manage application state. 

    Publish and subscribe: Allows microservices to communicate asynchronously through message brokers. 

    Bindings: Connects applications to external systems and services (e.g., databases, message queues, cloud services). 

    Actors: Provides a framework for building stateful, concurrent objects. 

    Observability: Offers built-in observability features, including tracing, metrics, and logging.

    <br>
    Looking for Commercial Support? [LEARN MORE](https://www.diagrid.io/conductor){ target="_blank" .bold }
    

=== "Install"

    #### Prerequisites

    Deploy k0rdent: [QuickStart](https://docs.k0rdent.io/v0.1.0/guide-to-quickstarts/#guide-to-quickstarts)

    #### Install template to k0rdent
    ~~~bash
    helm install dapr oci://ghcr.io/k0rdent/catalog/charts/dapr-service-template -n kcm-system
    ~~~

    #### Verify service template
    ~~~bash
    kubectl get servicetemplates -A
    # NAMESPACE    NAME                       VALID
    # kcm-system   dapr-1-14-4                true
    ~~~

    #### Deploy service template
    ~~~yaml
    apiVersion: k0rdent.mirantis.com/v1alpha1
    kind: ClusterDeployment
    # kind: MultiClusterService
    ...
      serviceSpec:
        services:
          - template: dapr-1-14-4
            name: dapr
            namespace: dapr-system
            values: |
              dapr-dashboard:
                ingress:
                  enabled: true
                  className: nginx
                  host: 'dapr.example.com'
    ~~~

    - [Official docs](https://docs.dapr.io/){ target="_blank" }
