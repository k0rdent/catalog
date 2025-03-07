# How to Contribute an Application

To add an application to the k0rdent open-source applications catalog, create a pull request (PR) in the **[catalog repository](https://github.com/k0rdent/catalog)**.

The PR should include the following updates:

## Add a catalog application page
Add a `mkdocs/app/<my-app>/data.yaml` file (e.g. [this](https://github.com/k0rdent/catalog/blob/main/mkdocs/apps/dapr/data.yaml)).

## Add a working example
Create an app folder with testing files in [apps](https://github.com/k0rdent/catalog/tree/main/apps) folder (e.g. [this](https://github.com/k0rdent/catalog/tree/main/apps/dapr)).

Ensure the example works with a [common testing workflow](https://github.com/k0rdent/catalog/blob/main/docs/testing.md#run-example) so that anyone can easily verify its functionality (at least `local` mode).
