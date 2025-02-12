![logo](https://raw.githubusercontent.com/external-secrets/external-secrets/main/assets/eso-logo-large.png){ align="right", width="200" }
# External secrets

## Installation
Install Service template
~~~bash
# k0rdent includes the template for External-secrets out of the box
~~~

Verify service template
~~~bash
kubectl get servicetemplates -A
# NAMESPACE    NAME                      VALID
# kcm-system   external-secrets-0-11-0   true
~~~

## Usage
Deploy service template
~~~yaml
apiVersion: k0rdent.mirantis.com/v1alpha1
kind: ClusterDeployment
# kind: MultiClusterService
...
  serviceSpec:
    services:
      - template: external-secrets-0-11-0
        name: external-secrets
        namespace: external-secrets
~~~

## References
- [Official docs](https://external-secrets.io/v0.11.0/)
