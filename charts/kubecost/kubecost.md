## Kubecost
Install Service template
~~~bash
helm install kubecost oci://ghcr.io/k0rdent/catalog/charts/kubecost-service-template
~~~

Check the template is available:
~~~bash
kubectl get servicetemplates -A
# NAMESPACE    NAME                      VALID
# kcm-system   kubecost-2-5-3            true
~~~

Use the template in k0rdent manifests `ClusterDeployment` or `MultiClusterService`:
~~~yaml
apiVersion: k0rdent.mirantis.com/v1alpha1
kind: ClusterDeployment
# kind: MultiClusterService
...
  serviceSpec:
    services:
      - template: kubecost-2-5-3
        name: kubecost
        namespace: kubecost
        values: |
          cost-analyzer:
            kubecostToken: <kubecost-token>
            ingress:
              enabled: true
              className: nginx
              hosts: []
~~~

[Official docs](https://docs.kubecost.io/)
