# Run k0rdent apps in AWS

## Cloud provider credentials
Create AWS credential resources using helm chart:
~~~bash
helm upgrade --install aws-credential oci://ghcr.io/k0rdent/catalog/charts/aws-credential \
  --version 0.0.1 \
  -n kcm-system \
  -f providers/values-aws-credential.yaml
~~~

Set real secrets values from env vars:
~~~bash
kubectl patch secret aws-credential-secret -n kcm-system -p='{"stringData":{"AccessKeyID":"'$AWS_ACCESS_KEY_ID'"}}'
kubectl patch secret aws-credential-secret -n kcm-system -p='{"stringData":{"SecretAccessKey":"'$AWS_SECRET_ACCESS_KEY'"}}'
~~~

## Run example
Universal workflow to run any example:
~~~bash
# open-webui, kubecost, opencost, external-dns, argo-cd, dapr, kubernetes-dashboard
# ingress-nginx, external-secrets, cert-manager, dex, velero, kyverno, prometheus
export EXAMPLE="open-webui"

# Deploy testing AWS cluster with unique name
sed "s/SUFFIX/${USER}/g" apps/$EXAMPLE/cld.yaml | kubectl apply -f -
./scripts/wait_for_cluster.sh

# Install k0rdent service template
helm upgrade --install $EXAMPLE oci://ghcr.io/k0rdent/catalog/charts/kgst \
  -n kcm-system \
  -f $EXAMPLE/helm-values-kgst.yaml

# Store kubeconfig file for managed AWS cluster
kubectl get secret aws-example-$USER-kubeconfig -o=jsonpath={.data.value} | base64 -d > kcfg
chmod 0400 kcfg # set minimum attributes to kubeconfig

# Deploy service using multiclusterservice
# Note: there is complete configurable values list in $EXAMPLE/values-orig.yaml folder.
kubectl apply -f apps/$EXAMPLE/mcs.yaml
KUBECONFIG=kcfg ./scripts/wait_for_deployment.sh

# Test webpage if exposed
KUBECONFIG=kcfg ./scripts/test_webpage.sh

# Cleaning section
# Remove multiclusterservice
kubectl delete multiclusterservice $EXAMPLE
KUBECONFIG=kcfg ./scripts/wait_for_deployment_removal.sh

# Remove cluster
# Be careful, you can use existing cluster for other examples!!!
kubectl delete cld aws-example-$USER
./scripts/wait_for_cluster_removal.sh
~~~
