# Run k0rdent apps locally

## Setup local testing cluster
Create testing local cluster to adopt:
~~~bash
kind create cluster --config providers/kind-adopted-cluster.yaml
# store adopted cluster kubeconfig
kind get kubeconfig -n adopted > kcfg
chmod 0400 kcfg # set minimum attributes to kubeconfig
~~~

Switch to master k0rdent clusterCreate adopted-credential resources using helm chart:
~~~bash
helm upgrade --install adopted-credential oci://ghcr.io/k0rdent/catalog/charts/adopted-credential \
  --version 0.0.1 \
  -n kcm-system
~~~

Set adopted cluster kubeconfig in credential secret:
~~~bash
# store kubeconfig secret for credential object
ADOPTED_KUBECONFIG=$(kind get kubeconfig --internal -n adopted | base64)
kubectl patch secret adopted-credential-secret -n kcm-system -p='{"data":{"value":"'$ADOPTED_KUBECONFIG'"}}'
~~~

Add adopted cluster to k0rdent:
~~~bash
kubectl apply -f providers/adopted-cld.yaml
~~~

## Run example
Universal workflow to run any example:
~~~bash
# open-webui, kubecost, opencost, external-dns, argo-cd, dapr, kubernetes-dashboard
# ingress-nginx, external-secrets, cert-manager, dex, velero, kyverno, prometheus
export EXAMPLE="open-webui"
export EXAMPLE_MODE="local"

# Install k0rdent service template
helm upgrade --install $EXAMPLE oci://ghcr.io/k0rdent/catalog/charts/kgst \
  -n kcm-system \
  -f $EXAMPLE/helm-values-kgst.yaml

# Deploy service using multiclusterservice
# Note: there is complete configurable values list in $EXAMPLE/values-orig.yaml folder.
kubectl apply -f $EXAMPLE/mcs.yaml
KUBECONFIG=kcfg ./scripts/wait_for_deployment.sh

# Test webpage if exposed
KUBECONFIG=kcfg ./scripts/test_webpage.sh

# Cleaning section
# Remove multiclusterservice
kubectl delete multiclusterservice $EXAMPLE
KUBECONFIG=kcfg ./scripts/wait_for_deployment_removal.sh
~~~

Delete testing cluster:
~~~bash
# Be careful, you can use existing cluster for other examples!!!
kubectl delete cld adopted
kind delete cluster -n adopted
~~~
