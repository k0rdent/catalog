# k0rdent Catalog
The k0rdent Catalog Repo is a central repository and discovery platform designed to streamline the selection, deployment, and management of services and infrastructure within the k0rdent ecosystem. It serves as a comprehensive resource for users to explore and access a wide range of curated tools, applications, and configurations tailored for Kubernetes cluster enhancement.

## Repository structure
- `.github/workflows` - GitHub scripts for automatical testing.
- `apps` - Catalog Applications metadata, resource files, Helm charts, and testing config files.
- `docs` - Additional repo documentation files
- `mkdocs` - [MkDocs](https://www.mkdocs.org/) source files for the Catalog web site.
  - [Apps testing guide](mkdocs/testing_guide.md)
  - [Testing methodology](mkdocs/testing_methodology.md)
- `overrides` - Catalog HTML files (MkDocs customization files).
- `scripts` - Tools for testing and contributing services to k0rdent.
- `mkdocs.yml` - MkDocs main config file to generate the Catalog web site.

## Useful links
- [Catalog Web](https://catalog.k0rdent.io/)
- [Applications Testing Guide](mkdocs/testing_guide.md)
- [Previewing Docs](mkdocs/dev.md)
- [Contribution guide](https://catalog.k0rdent.io/latest/contribute/)
