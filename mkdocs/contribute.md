# Contributing Application to the k0rdent Catalog
Thank you for your interest in contributing to the k0rdent catalog! This guide will walk you through the process of adding your application.

## Prerequisites
- Basic understanding of YAML.
- A publicly accessible repository at GitHub for your application's metadata.
- The application should be well-documented and functional.

## Contribution Process
### 1. Fork the Repository:
- Fork the [k0rdent catalog repository](https://github.com/k0rdent/catalog/fork){ target="_blank" } to your own GitHub (or equivalent) account.

### 2. Create the Application Helm Charts
Before adding metadata, you need to provide Helm charts for your application. These charts enable deployment within k0rdent clusters and will be stored in the catalog registry as a central source of verified application charts.

-	#### Create the `charts` directory
  Inside your application folder (e.g., `apps/dapr/`), create a `charts/` directory.

-	#### Include Helm Charts
  Your directory must include:
	  -	An **app chart** referencing the original upstream application chart.
    - A **service-template** chart to register the app in the mothership as a service template.
    - An `st-charts.yaml` file. It defines how charts are generated to be consistent with the rest of the catalog charts. Example:
    ~~~yaml
    st-charts:
      - name: dapr
        version: 1.14.4
        dependencies:
          - name: dapr
            version: 1.14.4
            repository: https://dapr.github.io/helm-charts/ # upstream helm repository
      - name: dapr-dashboard
        version: 0.15.0
        dependencies:
          - name: dapr-dashboard
            version: 0.15.0
            repository: https://dapr.github.io/helm-charts/
    ~~~
    -	Generate Charts Automatically. Use the `chart_ctl.py` script from the repository to generate the app and service-template charts based on `st-charts.yaml`. Example:
    ~~~bash
    python3 ./scripts/chart_ctl.py generate dapr
    ~~~
### 3. Create a New Application Metadata File:
- Create an `assets` folder and add a logo to it (e.g., `assets/dapr_logo.svg`). Please use the SVG format if possible.
- Create a new `data.yaml` file.
- **Populate the YAML File**:
- Follow the schema below to structure your application's metadata.
- #### Required Fields:
    - `title` (string): The application's name.
    - `tags` (array of strings): Keywords or tags related to the application. Please ensure that at least one tag is used. Allowed tags are `AI/Machine Learning`, `Application Runtime`, `Authentication`, `Backup and Recovery`, `CI/CD`, `Container Registry`, `Database`, `Developer Tools`, `Drivers and plugins`, `Monitoring`, `Networking`, `Security`, `Serverless`, `Storage`.
    - `summary` (string): A brief description of the application.
    - `logo` (string): A relative link to the app logo (e.g., `./assets/dapr_logo.svg`).
    - `description` (string): Description of the application or service.
    - `install_code` (string): How to install the service template for your application to k0rdent.
    - `verify_code` (string): Command to verify the application.
    - `deploy_code` (string): Example of how the application can be deployed to a k0rdent managed cluster.
- #### Optional Fields:
    - `support_link` (string): Support link for the application. Omit if commercial support is not available for the application.
    - `doc_link` (string): Documentation for the application.
    - `logo_big` (string): A relative link to a larger version of the app logo (e.g., `./assets/dapr_logo_big.svg`). Displayed on the application detail page.
    - `prerequisites` (string): Custom *Prerequisites* section of the application detail page.
- #### Example:
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
    helm install dapr oci://ghcr.io/k0rdent/catalog/charts/dapr-service-template \
      --version 1.14.4 -n kcm-system
    helm install dapr-dashboard oci://ghcr.io/k0rdent/catalog/charts/dapr-dashboard-service-template \
      --version 0.15.0 -n kcm-system
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
    kind: MultiClusterService
    metadata:
      name: dapr
    spec:
      clusterSelector:
        matchLabels:
          group: demo
      serviceSpec:
        services:
        - template: dapr-1-14-4
          name: dapr
          namespace: dapr
        - template: dapr-dashboard-0-15-0
          name: dapr-dashboard
          namespace: dapr
          values: |
            dapr-dashboard:
              ingress:
                enabled: true
                className: nginx
                host: 'dapr.example.com'
    ~~~
  support_link: https://www.diagrid.io/conductor
  doc_link: https://docs.dapr.io/
  use_ingress: true
  ~~~

### 4. Validate Your YAML File:
- Ensure your YAML file is valid by using a YAML validator. This will prevent errors during the review process.

### 5. Add a Helm Chart Example:
- Add an `example` folder containing an example Helm chart. It will be used for application testing in different environments (AWS, Azure, GitHub CI, and local setups). It is also used in GitHub CI to automate the initial stage of application verification.
- Add a Helm Chart config file at `example/Chart.yaml` with dependencies, e.g.:
~~~yaml
apiVersion: v2
name: example
type: application
version: 1.14.4
dependencies:
  - name: dapr
    version: 1.14.4
    repository: oci://ghcr.io/k0rdent/catalog/charts
  - name: dapr-dashboard
    version: 0.15.0
    repository: oci://ghcr.io/k0rdent/catalog/charts
~~~

- Add a Helm chart values file at `example/values.yaml`. Include any explicit configuration parameters needed for a working deployment. If the default configuration is sufficient, leave this file empty. Ensure the file contains the correct top-level keys. Example file:
~~~yaml
dapr-dashboard: # example chart top-level key
  dapr-dashboard: # app chart top-level key
    ingress:
      enabled: true
      className: nginx
      host: 'dapr.example.com'
~~~

### 6. Added files overview:
- This is how the added files for a new app `abc` should look:
  ~~~
  apps/dapr
  ├── assets
  │   └── dapr_logo.svg
  ├── charts
  |   ├──dapr-1.2.3
  |   ├──dapr-service-template-1.2.3
  |   └──st-charts.yaml
  ├── data.yaml
  └── example
      ├── Chart.yaml
      └── values.yaml
  ~~~
- You can also check existing apps in the Catalog (e.g., [here](https://github.com/k0rdent/catalog/tree/main/apps/ingress-nginx)).
### 7. Commit and Push Your Changes:
- Commit your changes to your forked repository.
- Push your changes to your remote branch.
### 8. Create a Pull Request (PR):
- Go to the k0rdent catalog repository on GitHub.
- Click "New Pull Request".
- Select your forked repository and branch.
- Provide a clear and concise title and description for your PR.
- Explain the changes you've made and why you're adding the application.
### 9. Review and Feedback:
- The k0rdent maintainers will review your PR.
- They may provide feedback or request changes.
- Address any feedback and update your PR accordingly.
### 10. Merge:
- Once your PR is approved, it will be merged into the main k0rdent catalog.

## Important Considerations
- **Accuracy:** Ensure all information in your YAML file is accurate and up-to-date.
- **Clarity:** Write clear and concise descriptions.
- **Maintainability:** Only add applications that are actively maintained.
- **License:** Ensure the application's license is compatible with the k0rdent catalog.
- **Testing:** It is highly recommended to test the install, uninstall, and update commands before submitting the PR.
- **Consistency:** Try to follow the existing style and conventions in the catalog.

By following these guidelines, you can help expand the k0rdent application catalog and make it more useful for everyone. Thank you for your contribution!
