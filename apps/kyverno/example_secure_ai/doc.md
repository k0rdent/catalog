# Secure AI Platform

A hardened security stack for organizations running AI in regulated environments.
Combines policy enforcement, secrets management, runtime threat detection, and
audit logging to meet SOC 2, HIPAA, and FedRAMP requirements.

#### Install template to k0rdent

{{ install_code }}

#### Verify service template

{{ verify_code }}

#### Deploy service

{{ deploy_code }}

#### Verify Kyverno policy enforcement

~~~bash
# List installed Kyverno policies
kubectl get clusterpolicy

# Test policy enforcement with a non-compliant pod
kubectl run test-pod --image=nginx --dry-run=server -o yaml
~~~

#### Verify Falco runtime security

~~~bash
# Check Falco is running and detecting events
kubectl logs -n falco -l app.kubernetes.io/name=falco --tail=20

# Trigger a test alert
kubectl exec -it $(kubectl get pod -l app.kubernetes.io/name=falco -n falco -o name | head -1) \
  -n falco -- falco-event-generator
~~~

#### Verify cert-manager certificates

~~~bash
# Check cert-manager is ready
kubectl get pods -n cert-manager

# Verify ClusterIssuer is available
kubectl get clusterissuer
~~~

#### Verify Gatekeeper admission control

~~~bash
# List OPA constraint templates
kubectl get constrainttemplates

# Check Gatekeeper audit results
kubectl get constraints -o wide
~~~
