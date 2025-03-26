# Contribute an Application

You can easily add an application to the k0rdent catalog using a pull request to the **[Catalog repository](https://github.com/k0rdent/catalog)**.

The PR should only include a new application folder:

## Enterprise Application
Add a new Enterprise application folder `/apps/<new-app>` ([example](https://github.com/k0rdent/catalog/tree/main/apps/nirmata)) containing:

- App logo: `/apps/<new-app>/assets/<new-app>_logo.svg`, SVG format preferably.
- App metadata file: `/apps/<new-app>/data.yaml` ([example](https://github.com/k0rdent/catalog/blob/main/apps/nirmata/data.yaml)) with app info:

~~~yaml
tags: # App categories tags, check allowed values below
  - Security
  - Networking
title: "App Title"
summary: "New advanced database"
logo: "./assets/new-app_logo.svg"
description: |
  Longer application description
  with some interesting details.
  It can contain images, links, titles,
  bullet points and any structured text
  in Markdown format.

support_link: https://app.support.link/docs
support_type: Enterprise
~~~

- Allowed app `tags` values: `AI/Machine Learning`, `Monitoring`, `Networking`, `Security`,
  `Storage`, `CI/CD`, `Application Runtime`, `Drivers and plugins`, `Backup and Recovery`,
  `Authentication`, `Database`, `Developer Tools`, `Serverless`.

## Open Source Application
Add a new OSS application folder `/apps/<new-app>` ([example](https://github.com/k0rdent/catalog/tree/main/apps/dapr)) containing:

- App logo: `/apps/<new-app>/assets/<new-app>_logo.svg`, SVG format preferably.
- App metadata file: `/apps/<new-app>/data.yaml` ([example](https://github.com/k0rdent/catalog/blob/main/apps/dapr/data.yaml)) with app info.
- Add a simple example helm chart (just dependencies and values, e.g. [example](https://github.com/k0rdent/catalog/tree/main/apps/dapr/example)).
  - Having this everyone can easily test the app [locally or in cloud](https://github.com/k0rdent/catalog/blob/main/docs/testing.md) and it's automatically tested in Catalog GitHub action.
