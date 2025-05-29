# Testing Methodology

The **k0rdent Catalog** is a curated collection of applications that have been **verified to work across diverse Kubernetes environments**, including **Azure**, **AWS**, and **local testing clusters** such as **Kind**. Every listed application is validated for deployability and lifecycle compatibility with k0rdent’s orchestration capabilities, ensuring reliable operation in real-world multi-cluster scenarios.

## What We Test

For each catalog application, we verify:

- Successful **installation** of the app's **Service Template** using the provided Helm chart.
- Deployment of a corresponding **MultiClusterDeployment** on one or more **child clusters**.
- **Full k0rdent cluster creation**, ensuring end-to-end testing through the complete orchestration stack.
- Proper **uninstallation and cleanup**.

## How Testing Is Performed

Our testing process is designed to be **repeatable, transparent, and easy to reproduce**. You can validate applications using one of the following approaches:

### 1. Local Testing via Helper Scripts

After cloning the Catalog repository, local testing can be performed using the provided guide and scripts:

- A [testing guide](./testing-guide.md) outlines setup steps and requirements.
- **Helper scripts** enable testing in any or all of the following environments:
  - ✅ **Azure** Kubernetes clusters
  - ✅ **AWS** EKS clusters
  - ✅ **Local clusters** (Kind)

During this process:

- A full **k0rdent cluster** is created, including management and child clusters.
- The **Service Template** is installed.
- The **MultiClusterDeployment** is applied to one or more child clusters.
- Functionality is verified, followed by clean uninstallation.

This method allows contributors and testers to replicate production-like setups locally.

### 2. GitHub Actions-Based Testing

k0rdent Catalog leverages **GitHub Actions** to automate testing workflows using [Actions script](../.github/workflows/helm-app-deploy.yml):

- ✅ **Automated validation on pull requests**:
  - Each application contribution or update triggers an automated test run.
  - Verifies that the changes are valid and maintain compatibility.

- ✅ **On-demand subset testing**:
  - GitHub workflows can be triggered manually to test **any subset of applications**.
  - Useful for focused testing, CI-based validation, or regression checks.

Each CI test run:

- Provisions a dedicated **k0rdent testing cluster**.
- Installs the application and tests full orchestration through the k0rdent framework.
- Ensures reproducibility in controlled, isolated environments.

---

These methods ensure that all applications in the k0rdent Catalog are continuously verified, reproducible, and ready for deployment at scale across diverse Kubernetes platforms.
