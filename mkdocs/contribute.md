# How to Contribute an Application

To add an application to the k0rdent open-source applications catalog, create a pull request (PR) in the **[catalog repository](https://github.com/k0rdent/catalog)**.

The PR should include the following updates:

## Add a catalog application page
Add a `mkdocs/app/<my-app>/data.yaml` file (e.g. [this](https://github.com/k0rdent/catalog/blob/main/mkdocs/apps/dapr/data.yaml)).

## Add a working example
Create an app folder with testing files in [apps](https://github.com/k0rdent/catalog/tree/main/apps) folder (e.g. [this](https://github.com/k0rdent/catalog/tree/main/apps/dapr)).

Ensure the example works with a [common testing workflow](https://github.com/k0rdent/catalog/blob/main/docs/testing.md#run-example) so that anyone can easily verify its functionality (at least `local` mode).

## Don't create a wrapper chart
The old approach creating "wrapper charts" (e.g. [this](https://github.com/k0rdent/catalog/tree/main/charts/dex)) is deprecated. It would require a lot of additional work with maintenance and upgrading new versions. Instead install your application service template using **k0rdent Generic Service Template** helm chart, like this:

~~~bash
helm upgrade --install dapr oci://ghcr.io/k0rdent/catalog/charts/kgst -n kcm-system \
    --set "helm.repository.url=https://dapr.github.io/helm-charts/" \
    --set "helm.charts[0].name=dapr" \
    --set "helm.charts[0].version=1.14.4" \
    --set "helm.charts[1].name=dapr-dashboard" \
    --set "helm.charts[1].version=0.15.0"
~~~

You can use `scripts/show_install_cmd.py` to generate installation command for your app from `apps/<app>/helm-values-kgst.yaml` file, e.g.:
~~~bash
EXAMPLE=dapr python3 scripts/show_install_cmd.py
~~~

We are going to use this automatically in app doc in near future.
