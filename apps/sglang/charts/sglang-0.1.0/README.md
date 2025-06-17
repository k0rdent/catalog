# SGLang Helm Chart

This Helm chart deploys SGLang on Kubernetes, leveraging the LeaderWorkerSet controller.

## Prerequisites

Before installing this chart, you must have:

- Kubernetes cluster with GPU support
- Helm 3.0+

## Configuration

The following table lists the configurable parameters of the SGLang chart and their default values.

| Parameter                           | Description                                        | Default                        |
|-------------------------------------|----------------------------------------------------|--------------------------------|
| `replicaCount`                      | Number of replicas                                 | `1`                            |
| `leaderWorkerSize`                  | Size of the leader-worker group                    | `2`                            |
| `restartPolicy`                     | Restart policy for the leader-worker group         | `"RecreateGroupOnPodRestart"`  |
| `image.repository`                  | SGLang container image repository                  | `lmsysorg/sglang`              |
| `image.tag`                         | SGLang container image tag                         | `latest`                       |
| `image.pullPolicy`                  | Image pull policy                                  | `IfNotPresent`                 |
| `huggingFaceToken`                  | Hugging Face token for model downloads             | `""`                           |
| `model.path`                        | Model path                                         | `"mistralai/Mistral-7B-v0.3"`  |
| `model.tensorParallelism`           | Tensor parallelism value                           | `"2"`                          |
| `model.trustRemoteCode`             | Whether to trust remote code                       | `true`                         |
| `service.type`                      | Kubernetes Service type                            | `ClusterIP`                    |
| `service.port`                      | Port for the service                               | `40000`                        |
| `resources.limits.nvidia.com/gpu`   | GPU resource limits                                | `1`                            |
| `readinessProbe.initialDelaySeconds`| Initial delay for readiness probe                  | `600`                          |
| `readinessProbe.periodSeconds`      | Period for readiness probe                         | `10`                           |
