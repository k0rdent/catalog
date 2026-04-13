#!/bin/bash
set -eo pipefail

# Build all catalog versions into OUTPUT_DIR using mkdocs
# Usage: OUTPUT_DIR=dist ./scripts/build_web.sh
#        SITE_URL=https://catalog.example.com OUTPUT_DIR=dist ./scripts/build_web.sh

OUTPUT_DIR="${OUTPUT_DIR:-dist}"
SITE_URL="${SITE_URL:-}"

VERSIONS=(
    v0.1.0
    v0.2.0
    v0.3.0
    v1.0.0
    v1.1.1
    v1.2.0
    v1.3.1
    v1.4.0
    v1.5.0
    v1.6.0
    v1.7.0
    v1.8.0
)
LATEST_VERSION="v1.8.0"

# Optionally set site_url in mkdocs.yml
if [[ -n "$SITE_URL" ]]; then
    echo "site_url: $SITE_URL" >> mkdocs.yml
    echo "Using site_url: $SITE_URL"
fi

echo "Building ${#VERSIONS[@]} versions into $OUTPUT_DIR"

for VERSION in "${VERSIONS[@]}"; do
    echo "  Building $VERSION..."
    rm -rf mkdocs/apps mkdocs/infra mkdocs/solutions
    VERSION="$VERSION" mkdocs build --site-dir "$OUTPUT_DIR/$VERSION" --quiet
done

# Copy latest version as /latest/
echo "  Copying $LATEST_VERSION -> latest/"
cp -r "$OUTPUT_DIR/$LATEST_VERSION" "$OUTPUT_DIR/latest"

# Root redirect to /latest/
cat > "$OUTPUT_DIR/index.html" <<'EOF'
<html><head><meta http-equiv="refresh" content="0;url=latest/"></head></html>
EOF

echo "Build complete: $OUTPUT_DIR"
ls -d "$OUTPUT_DIR"/*/
