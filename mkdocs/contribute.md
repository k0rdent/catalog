# How to Contribute an Application

To add an application to the k0rdent open-source application catalog, create a pull request (PR) in the **[catalog repository](https://github.com/k0rdent/catalog)**.

The PR should only include a new application folder.

## Catalog Application Folder
Add a new application folder under `/apps/<new-app>` (e.g., [/apps/dapr](https://github.com/k0rdent/catalog/tree/main/apps/dapr)) containing the following:

- A metadata file named `data.yaml` ([example](https://github.com/k0rdent/catalog/blob/main/apps/dapr/data.yaml)) with the app description and installation instructions.
- A logo in the `assets` folder (e.g., `assets/my-some-logo.svg`) and a relative link to it in `data.yaml` (see [example](https://github.com/k0rdent/catalog/blob/main/apps/dapr/data.yaml#L5)). Please use the SVG format if possible.
- A simple example Helm chart (containing only dependencies and values, e.g., [example](https://github.com/k0rdent/catalog/tree/main/apps/dapr/example)). This allows users to easily test the app [locally or in the cloud](https://github.com/k0rdent/catalog/blob/main/docs/testing.md) and ensures it is automatically tested by the Catalog GitHub Actions workflow.
