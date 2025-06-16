#!/bin/bash
set -eo pipefail

# Generate catalog index and schema
echo "Generating catalog index and schema..."
python3 scripts/generate_index.py

# Ensure "site_url" field in mkdocs.yml (stay on the same page on version switch)
if [[ -n "$SITE_URL" ]]; then
    echo "site url found: $SITE_URL"
    echo "site_url: $SITE_URL" >> mkdocs.yml
    KIND_CLUSTER="k0rdent"
else
    echo "SITE_URL not found"
fi

# Build gh pages with a different versions support
rm -rf mkdocs/apps mkdocs/infra
VERSION="v0.1.0" mkdocs build # generate md files
VERSION="v0.1.0" mike deploy v0.1.0
rm -rf mkdocs/apps mkdocs/infra
VERSION="v0.2.0" mkdocs build # generate md files
VERSION="v0.2.0" mike deploy v0.2.0
rm -rf mkdocs/apps mkdocs/infra
VERSION="v0.3.0" mkdocs build # generate md files
VERSION="v0.3.0" mike deploy v0.3.0
rm -rf mkdocs/apps mkdocs/infra
VERSION="v1.0.0" mkdocs build # generate md files
VERSION="v1.0.0" mike deploy v1.0.0 latest stable --update-aliases
mike set-default latest

# Ensure CNAME file in gh-pages to set custom domain
git stash
git checkout gh-pages
echo "catalog.k0rdent.io" > CNAME
git add CNAME
git commit -m "Add CNAME to set custom domain"
git push origin gh-pages -f
