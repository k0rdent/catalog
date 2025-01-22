# Test charts locally in "kind" cluster

## Setup
Create local testing cluster
~~~bash
kind create cluster --config testing_cluster/kind-cluster.yaml -n testing-cluster
~~~

Add `k0rdent-catalog` helm charts repo:
~~~bash
helm repo add k0rdent-catalog https://k0rdent.github.io/catalog/charts/
helm search repo k0rdent-catalog # check repo content
~~~

## Usage

### Install 'nginx-ingress-f5'
Install `nginx-ingress-f5` using helm chart:
~~~bash
helm install nginx-ingress-f5 k0rdent-catalog/nginx-ingress-f5 --namespace nginx-ingress-f5 --create-namespace --set nginx-ingress.controller.hostPort.enable=true
~~~

### Install 'dapr'
Install `dapr` using helm chart:
~~~bash
helm install dapr k0rdent-catalog/dapr --namespace dapr-system --create-namespace
kubectl apply -f testing_cluster/ingress-dapr.yaml
~~~
