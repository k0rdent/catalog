![logo](https://raw.githubusercontent.com/external-secrets/external-secrets/main/assets/eso-logo-large.png){ align="right", width="200" }
# External secrets

## Installation
This service template is typically pre-installed in k0rdent. If not
install it:
~~~bash
helm install external-secrets oci://ghcr.io/k0rdent/catalog/charts/external-secrets-service-template -n kcm-system
~~~

Check the template is available:
~~~bash
kubectl get servicetemplates -A
# NAMESPACE    NAME                      VALID
# kcm-system   external-secrets-0-11-0   true
~~~

## Usage
Use the template in k0rdent manifests `ClusterDeployment` or `MultiClusterService`:
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
        values: |
          external-secrets:
            controller:
              hostPort:
                enable: true
~~~

## References
- [Official docs](https://external-secrets.io/v0.11.0/)
