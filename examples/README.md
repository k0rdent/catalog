# k0rdent examples

## Requirements
- Mothership Kubernetes cluster with [k0rdent 0.1.0 installed](https://docs.k0rdent.io/v0.1.0/admin-installation/#install-k0rdent).
- AWS account configured for k0rdent ([guide](https://docs.k0rdent.io/v0.1.0/admin-prepare/#aws), steps 1-8)
- `helm` - The Kubernetes package manager (`brew install helm`)
- Google Chrome or Chromium browser for web pages testing (Optionally)

## Environment
Prepare setup script with your env vars (credentials, secrets, passwords)
~~~bash
cp ./scripts/set_envs_template.sh ./scripts/set_envs.sh
chmod 0600 ./scripts/set_envs.sh  # allow access for file owner only
~~~

Fill vars in your `./scripts/set_envs.sh`. Set environment variables using prepared script.
~~~bash
source ./scripts/set_envs.sh
~~~

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
# open-webui, kubecost, opencost, external-dns, argo-cd
export EXAMPLE="open-webui"

# Deploy testing AWS cluster with unique name
sed "s/SUFFIX/${USER}/g" $EXAMPLE/cld.yaml | kubectl apply -f -
./scripts/wait_for_cluster.sh

# Install k0rdent service template
helm upgrade --install $EXAMPLE oci://ghcr.io/k0rdent/catalog/charts/kgst \
  -n kcm-system \
  -f $EXAMPLE/helm-values-kgst.yaml

# Store kubeconfig file for managed AWS cluster
kubectl get secret aws-example-$USER-kubeconfig -o=jsonpath={.data.value} | base64 -d > kcfg

# Deploy service using multiclusterservice
# Note: there is complete configurable values list in $EXAMPLE/values-orig.yaml folder.
kubectl apply -f $EXAMPLE/mcs-aws.yaml
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

## Tested applications

| Application |         AWS        |        Azure       |
| ----------- | ------------------ | ------------------ |
| Open-WebUI  | :white_check_mark: |                    |
| OpenCost    | :white_check_mark: |                    |
| ExternalDNS | :white_check_mark: |                    |
| Argo CD     | :white_check_mark: |                    |
