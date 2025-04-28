# Kyverno Guardrails Documentation

## Overview

The Kyverno Guardrails chart provides a collection of security policies for Kubernetes clusters using Kyverno. These policies enforce best practices for security, compliance, and operational excellence.

## Policies Included

The following policies are included in the Kyverno Guardrails chart:

1. **Disallow Bare Pods** - Prevents creation of pods outside of controllers (Deployments, StatefulSets, etc.)
2. **Disallow CRI Socket Mount** - Prevents containers from mounting the container runtime socket
3. **Disallow Default Namespace** - Prevents resources from being created in the default namespace
4. **Disallow Empty Ingress Host** - Ensures all Ingress resources have a host specified
5. **Disallow Helm Tiller** - Prevents deployment of legacy Helm Tiller
6. **Disallow Latest Image Tag** - Prevents use of the 'latest' tag for container images
7. **Disallow NodePort** - Prevents creation of Services with type NodePort
8. **Require Drop All Capabilities** - Enforces dropping all Linux capabilities for containers
9. **Require Drop CAP_NET_RAW** - Enforces dropping the NET_RAW capability specifically
10. **Require Labels** - Enforces specific labels on resources
11. **Require Pod Probes** - Enforces the use of liveness, readiness, and startup probes
12. **Require Pod Requests and Limits** - Enforces resource requests and limits for containers
13. **Require Read-Only Root Filesystem** - Enforces containers to use read-only root filesystems
14. **Restrict Image Registries** - Limits which image registries can be used
15. **Restrict Service External IPs** - Controls which external IPs can be used in Services

## Configuration Options

The Kyverno Guardrails chart can be customized using the following configuration options in the `values.yaml` file:

### Global Settings

- `global.policyAction`: Sets the default enforcement level for all policies. Valid values are "audit" or "enforce" (case-insensitive). Default is "Enforce".
- `global.background`: Determines whether policies scan existing resources or only apply to newly created ones. Default is "true".

### Individual Policy Configuration

Each policy can be individually configured with the following options:

- `<policy-name>.enabled`: Enable or disable the policy. Default is "true" for all policies.
- `<policy-name>.policyAction`: Override the global enforcement level for this specific policy.
- `<policy-name>.background`: Override the global background scanning behavior for this specific policy.

### Policy-Specific Configuration

#### Disallow Default Namespace

- `disallowDefaultNamespace.resources`: A list of resource kinds to be validated:

  > NOTE:
  > If no resources are specified, the following resources will be validated:
  > Pod, Deployment, StatefulSet, DaemonSet, Job, CronJob

  ```yaml
  disallowDefaultNamespace:
    resources:
    - Deployment
    - StatefulSet
  ```

#### Require Labels

- `requireLabels.resources`: A map of resource kinds to required labels. For example:
   
  ```yaml
  requireLabels:
    resources:
      Pod:
      - "app.kubernetes.io/name"
      - "app.kubernetes.io/instance"
      Deployment:
      - "app.kubernetes.io/name"
      - "app.kubernetes.io/instance"
      - "app.kubernetes.io/version"
      StatefulSet:
      - "app.kubernetes.io/name"
      - "app.kubernetes.io/component"
  ```

#### Require Pod Probes

- `requirePodProbes.livenessProbe`: Require liveness probes. Default is "true".
- `requirePodProbes.readinessProbe`: Require readiness probes. Default is "true".
- `requirePodProbes.startupProbe`: Require startup probes. Default is "true".

  ```yaml
  requirePodProbes:
    livenessProbe: true
    readinessProbe: true
    startupProbe: true
  ```

#### Require Pod Requests and Limits

- `requirePodRequestsLimits.requireRequests.cpu`: Require cpu requests. Default is "true".
- `requirePodRequestsLimits.requireRequests.memory`: Require memory requests. Default is "true".
- `requirePodRequestsLimits.requireLimits`: Require resource limits. Default is "true".

  ```yaml
  requirePodRequestsLimits:
    requireRequests:
      cpu: true
      memory: true
    requireLimits: true
  ```

#### Restrict Image Registries

- `restrictImageRegistries.allowedRegistries`: A list of allowed image registries. For example:

  > NOTE:
  > At least one registry must be specified, otherwise all registries are forbidden.

  ```yaml
  restrictImageRegistries:
    allowedRegistries:
    - docker.io/
    - quay.io/
  ```
  
#### Restrict Service External IPs

- `restrictServiceExternalIPs.allowedIPs`: A list of allowed external IPs. For example:

  > NOTE:
  > At least one IP must be specified, otherwise all IPs are forbidden.

  ```yaml
  restrictServiceExternalIPs:
    allowedIPs:
    - "37.10.11.53"
    - "153.10.20.1"
  ```
