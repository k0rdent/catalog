![logo](https://upload.wikimedia.org/wikipedia/commons/9/93/Amazon_Web_Services_Logo.svg){ align="right", width="100" }
# Amazon Web Services
k0rdent includes the cluster template for AWS out of the box

~~~yaml
apiVersion: k0rdent.mirantis.com/v1alpha1
kind: ClusterDeployment
metadata:
    name: my-azure-clusterdeployment1
    namespace: kcm-system
spec:
    template: aws-standalone-cp-0-1-0
~~~
