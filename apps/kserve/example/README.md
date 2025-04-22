# KServe Example

This directory contains a simple example of deploying a scikit-learn model using KServe.

## Prerequisites

- KServe installed (both CRD and Controller components)
- A Kubernetes cluster with access to the internet (to download the model)

## Deployment

1. First, create the kserve namespace if it doesn't exist:

```bash
kubectl create namespace kserve
```

2. Apply the inference service manifest:

```bash
kubectl apply -f inference-service.yaml
```

3. Check the status of the deployment:

```bash
kubectl get inferenceservices -n kserve
# NAME           URL                                               READY   PREV   LATEST   PREVROLLEDOUTREVISION   LATESTREADYREVISION                      AGE
# sklearn-iris   http://sklearn-iris.kserve.example.com           True           100                              sklearn-iris-predictor-default-00001     2m
```

## Testing the Model

Once the service is ready, you can send a prediction request:

```bash
# Port-forward the service
kubectl port-forward -n kserve svc/sklearn-iris-predictor 8080:80

# In another terminal, send a test request
curl -v -H "Host: sklearn-iris.kserve.example.com" http://localhost:8080/v1/models/sklearn-iris:predict -d '{"instances": [[6.8, 2.8, 4.8, 1.4]]}'
```

The expected response should be something like:

```json
{
  "predictions": [1]
}
```

## About the Model

This example uses the classic Iris dataset with a scikit-learn model that classifies iris flowers into one of three species based on their sepal and petal measurements. 