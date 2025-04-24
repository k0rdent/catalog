# k0rdent applications testing

## Requirements
- `helm` - The Kubernetes package manager (`brew install helm`)
- `kind` - [Local Kubernetes cluster tool](https://kind.sigs.k8s.io/) (for local testing only)
- Mothership Kubernetes cluster with [k0rdent 0.2.0 installed](https://docs.k0rdent.io/v0.2.0/admin/installation/install-k0rdent/).
    - You can install local `k0rdent` cluster using:
    ~~~bash
    ./scripts/deploy_k0rdent.sh
    ~~~
- `python3` - To run helper script.
- AWS account configured for k0rdent ([guide](https://docs.k0rdent.io/v0.1.0/admin-prepare/#aws), steps 1-8)
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

Setup python for testing scripts.
~~~bash
source ./scripts/setup_python.sh
~~~

## Run example
Universal workflow to run any example:

### Setup testing cluster
~~~bash
# argo-cd, cert-manager, dapr, dex, external-dns, external-secrets,
# ingress-nginx, istio, kube-prometheus-stack, kubecost, kubernetes-dashboard, kyverno,
# msr, netapp, nvidia, open-webui, opencost, prometheus, pure, velero
export APP="dapr"
export TEST_MODE="local" # Supported values: aws, azure, local

# Add adopted cluster to k0rdent
./scripts/deploy_cld.sh
~~~

### Deploy application
Create a testing application release, verify it's installed and it exposess frontend if needed.
Then uninstall it and verify it was really removed. You can use this section over and over
for a different applications.
~~~bash
# Install k0rdent service template
./scripts/install_servicetemplates.sh

# Deploy service using multiclusterservice
# Note: there is complete configurable values list in $APP/values-orig.yaml folder.
./scripts/deploy_mcs.sh

# Test webpage if exposed
./scripts/test_webpage.sh
~~~

Test application uninstallation:
~~~bash
# Cleaning section
# Remove multiclusterservice
./scripts/remove_mcs.sh
~~~

Delete testing cluster:
~~~bash
# Be careful, you can use existing cluster for other examples!!!
./scripts/remove_cld.sh
~~~
