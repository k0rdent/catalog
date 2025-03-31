# Contributing Applications to the k0rdent Catalog
Thank you for your interest in contributing to the k0rdent catalog! This guide will walk you through the process of adding your applications/ services.

## Prerequisites
- Basic understanding of YAML.
- A publicly accessible repository for your application's metadata (e.g., GitHub, GitLab).
- The application should be well-documented and functional.

## Contribution Process
1. **Fork the Repository:**
    - Fork the k0rdent catalog repository to your own GitHub (or equivalent) account.
2. **Create a New Application Metadata File:**
    - Navigate to the apps/ directory in your forked repository.
    - Create a new `data.yaml` file.
    - **Populate the YAML File**:
    - Follow the schema below to structure your application's metadata.
    - **Required Fields**:
        - `title` (string): The application's name.
        - `tags` (array of strings): Keywords or tags related to the application.
        - `summary` (string): A brief description of the application.
        - `logo` (string): A relative link to the app logo ("./assets/your-app.svg").
        - `description` (string): Description of the application or service.
        - `install_code` (string): How to install the service template for your application to k0rdent.
        - `verify_code` (string): Command to verify the application.
        - `deploy_code` (string): Example of how the application can be deployed to a k0rdent managed cluster.
        - `support_link` (string): Support link for the application.
        - `doc_link` (string): Documentation for the application.
    - Example:
    ~~~yaml
    title: "Dapr"
    tags:
      - Monitoring
      - Application Runtime
    summary: "Portable, event-driven runtime."
    logo: "./assets/dapr-logo.svg"
    description: |
      Dapr (Distributed Application Runtime) is an open-source, portable, event-driven runtime that makes it easy for developers to build resilient, microservices applications that run on the cloud and edge. Dapr provides APIs that abstract away the complexities of common challenges when building distributed applications, such as: 
      Service-to-service invocation: Enables reliable and secure communication between microservices. 
    
      State management: Provides a consistent way to manage application state. 
    
      Publish and subscribe: Allows microservices to communicate asynchronously through message brokers. 
    
      Bindings: Connects applications to external systems and services (e.g., databases, message queues, cloud services). 
    
      Actors: Provides a framework for building stateful, concurrent objects. 
    
      Observability: Offers built-in observability features, including tracing, metrics, and logging.
    install_code: |
      ~~~bash
      helm upgrade --install dapr oci://ghcr.io/k0rdent/catalog/charts/kgst -n kcm-system \
        --set "helm.repository.url=https://dapr.github.io/helm-charts/" \
        --set "helm.charts[0].name=dapr" \
        --set "helm.charts[0].version=1.14.4" \
        --set "helm.charts[1].name=dapr-dashboard" \
        --set "helm.charts[1].version=0.15.0"
      ~~~
    verify_code: |
      ~~~bash
      kubectl get servicetemplates -A
      # NAMESPACE    NAME                       VALID
      # kcm-system   dapr-1-14-4                true
      # kcm-system   dapr-dashboard-0-15-0      true
      ~~~
    deploy_code: |
      ~~~yaml
      apiVersion: k0rdent.mirantis.com/v1alpha1
      kind: ClusterDeployment
      # kind: MultiClusterService
      ...
        serviceSpec:
          services:
            - template: dapr-1-14-4
              name: dapr
              namespace: dapr
            - template: dapr-dashboard-0-15-0
              name: dapr-dashboard
              namespace: dapr
              values: |
                ingress:
                  enabled: true
                  className: nginx
                  host: 'dapr.example.com'
      ~~~
    support_link: https://www.diagrid.io/conductor
    doc_link: https://docs.dapr.io/
    use_ingress: true
    ~~~

3. **Validate Your YAML File:**
    - Ensure your YAML file is valid by using a YAML validator. This will prevent errors during the review process.
4. **Commit and Push Your Changes:**
    - Commit your new YAML file to your forked repository.
    - Push your changes to your remote branch.
5. **Create a Pull Request (PR):**
    - Go to the k0rdent catalog repository on GitHub.
    - Click "New Pull Request".
    - Select your forked repository and branch.
    - Provide a clear and concise title and description for your PR.
    - Explain the changes you've made and why you're adding the application.
6. **Review and Feedback:**
    - The k0rdent maintainers will review your PR.
    - They may provide feedback or request changes.
    - Address any feedback and update your PR accordingly.
7. **Merge:**
    - Once your PR is approved, it will be merged into the main k0rdent catalog.

## Important Considerations
- **Accuracy:** Ensure all information in your YAML file is accurate and up-to-date.
- **Clarity:** Write clear and concise descriptions.
- **Maintainability:** Only add applications that are actively maintained.
- **License:** Ensure the application's license is compatible with the k0rdent catalog.
- **Testing:** It is highly recommended to test the install, uninstall, and update commands before submitting the PR.
- **Consistency:** Try to follow the existing style and conventions in the catalog.

By following these guidelines, you can help expand the k0rdent application catalog and make it more useful for everyone. Thank you for your contribution!
