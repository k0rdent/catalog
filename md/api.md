# API Endpoint - index.json

The `index.json` endpoint provides a machine-readable index of all applications
in the **k0rdent catalog**. It is intended for automation, CLI tooling, CI pipelines,
and dynamic catalog discovery inside multi-cluster environments.

## Endpoints
- Index: <https://catalog.k0rdent.io/v1.5.0/index.json>
- Index Schema: <https://catalog.k0rdent.io/v1.5.0/schema/index.json>

## Response Format
A simplified example:
~~~json
{
  "metadata": {
    "generated": "2025-11-14T11:50:22.769056",
    "version": "1.0.0"
  },
  "addons": [
    {
      "name": "ingress-nginx",
      "description": "The NGINX Ingress Controller is a solution for managing external access to applications running in a Kubernetes cluster.",
      "logo": "https://catalog.k0rdent.io/latest/apps/ingress-nginx/assets/nginx_logo.svg",
      "docsUrl": "https://catalog.k0rdent.io/latest/apps/ingress-nginx/",
      "supportType": "community",
      "deprecated": false,
      "charts": [
        {
          "name": "ingress-nginx",
          "versions": [
            "4.13.0",
            "4.12.3",
            "4.11.5"
          ]
        }
      ],
      "metadata": {
        "owner": "k0rdent-team",
        "lastUpdated": "2025-11-14",
        "dependencies": [],
        "tags": [
          "Networking"
        ],
        "quality": {
          "tested": false,
          "securityScanned": false
        }
      }
    }
  ]
}
~~~

## Usage Examples
List all available Catalog apps:
~~~bash
curl -s https://catalog.k0rdent.io/v1.5.0/index.json | jq -r '.addons[].name'
~~~

Show `ingress` app charts:
~~~bash
APP=ingress
curl -s https://catalog.k0rdent.io/v1.5.0/index.json | jq -r ".addons[] | select(.name | contains(\"$APP\")) | .charts"
~~~

Install Service Template:
~~~bash
CHART=istio-base
VERSION=$(curl -s https://catalog.k0rdent.io/v1.5.0/index.json | jq -r "[.addons[].charts[] | select(.name==\"$CHART\")][0].versions[0]")
echo "$CHART: $VERSION"
if [[ $VERSION != "null" ]]; then
    helm upgrade --install $CHART oci://ghcr.io/k0rdent/catalog/charts/kgst --set "chart=$CHART:$VERSION" -n kcm-system
fi
~~~
