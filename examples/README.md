# k0rdent examples

## Requirements
- Mothership Kubernetes cluster with [k0rdent 0.1.0 installed](https://docs.k0rdent.io/v0.1.0/admin-installation/#install-k0rdent).
- AWS account configured for k0rdent ([guide](https://docs.k0rdent.io/v0.1.0/admin-prepare/#aws), steps 1-8)
- `helm` - The Kubernetes package manager (`brew install helm`)
- Google Chrome or Chromium browser for web pages testing (Optionally)
- `kind` - [Local Kubernetes cluster tool](https://kind.sigs.k8s.io/) (for local testing only)

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

## Test workflows
- [Testing in AWS](./aws.md)
- [Testing locally](local.md)

## Tested applications

| Application          |         AWS        |        Azure       |
| -------------------- | ------------------ | ------------------ |
| Argo CD              | :white_check_mark: |                    |
| Cert Manager         | :white_check_mark: |                    |
| Dapr                 | :white_check_mark: |                    |
| Dex                  | :white_check_mark: |                    |
| External DNS         | :white_check_mark: |                    |
| External Secrets     | :white_check_mark: |                    |
| Ingress Nginx        | :white_check_mark: |                    |
| KubeCost             | :white_check_mark: |                    |
| Kubernetes Dashboard | :white_check_mark: |                    |
| Kyverno              | :white_check_mark: |                    |
| Open-WebUI           | :white_check_mark: |                    |
| OpenCost             | :white_check_mark: |                    |
| Prometheus           | :white_check_mark: |                    |
| Velero               | :white_check_mark: |                    |
