# k0rdent Catalog
The k0rdent Catalog Repo is a central repository and discovery platform designed to streamline the selection, deployment, and management of services and infrastructure within the k0rdent ecosystem. It serves as a comprehensive resource for users to explore and access a wide range of curated tools, applications, and configurations tailored for Kubernetes cluster enhancement.

## Repository structure
- `.github/workflows` - GitHub scripts for automatical testing.
- `apps` - Catalog Applications metadata, resource files, Helm charts, and testing config files.
- `md` - Documentation files.
  - [Apps testing guide](md/testing_guide.md)
  - [Testing methodology](md/testing_methodology.md)
- `scripts` - Tools for testing and contributing services to k0rdent.
- `tsweb` - Catalog web UI source (React SPA).

## Useful links
- [Catalog Web](https://catalog.k0rdent.io/) - Public web UI of the k0rdent catalog, listing all available applications and their metadata.
- [Applications Testing Guide](md/testing_guide.md) - Guide describing how applications are tested and validated before being added to the catalog.
- [Contribution guide](https://catalog.k0rdent.io/latest/contribute/) - How to contribute new applications or updates to the catalog, including style and review guidelines.
- [Catalog Index](https://catalog.k0rdent.io/latest/index.json) - Machine-readable index of all catalog entries, used by k0rdent UI and related tooling.
- [Catalog Index Schema](https://catalog.k0rdent.io/latest/schema/index.json) - JSON Schema describing the structure of the catalog index, useful for validation and automation.
