# How to Contribute an Application

To add an application to the k0rdent open-source applications catalog, create a pull request (PR) in the **[catalog repository](https://github.com/k0rdent/catalog)**.

The PR should only include a new application folder:

## Catalog application folder
Add a new application folder `/apps/<new-app>` ([like this](https://github.com/k0rdent/catalog/tree/main/apps/dapr)) containing:

- App metadata file `data.yaml` ([like this](https://github.com/k0rdent/catalog/blob/main/apps/dapr/data.yaml)) with app description
  and installation instructions.
- Optionally add logo to `assets` folder (`assets/my-some-logo.svg`) and use a relative link in `data.yaml` ([like this](https://github.com/k0rdent/catalog/blob/main/apps/dapr/data.yaml#L5)). Please, use SVG format if possible.
- Add a simple example helm chart (just dependencies and values, e.g. [this](https://github.com/k0rdent/catalog/tree/main/apps/dapr/example)).
  - Having this everyone can easily test the app [locally or in cloud](https://github.com/k0rdent/catalog/blob/main/docs/testing.md) and it's automatically tested in Catalog GitHub action.
