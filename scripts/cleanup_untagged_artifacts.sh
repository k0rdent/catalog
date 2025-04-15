#!/bin/bash
set -euo pipefail

echo "Starting cleanup for owner: $REPO_OWNER"
echo "Dry run mode: $DRY_RUN"

if gh api "users/$REPO_OWNER" &>/dev/null; then
  api_base="users/$REPO_OWNER"
else
  api_base="orgs/$REPO_OWNER"
fi
echo "Using API base: $api_base"

# Get all container packages for user/org
gh api "$api_base/packages?package_type=container" --paginate > packages-all.json
jq --arg prefix "$PKG_PREFIX" '[.[] | select(.name | startswith($prefix))]' packages-all.json > packages.json

package_count=$(jq length packages.json)
echo "Found $package_count container packages"

for i in $(seq 0 $((package_count - 1))); do
  pkg_name=$(jq -r ".[$i].name" packages.json)
  echo ""
  echo "🔍 Processing package: $pkg_name"
  encoded_pkg_name=$(jq -rn --arg p "$pkg_name" '$p|@uri')
  # Get all versions of the package
  gh api "$api_base/packages/container/${encoded_pkg_name}/versions" --paginate > versions.json
  # Get untagged version IDs
  untagged_ids=$(jq -r '.[] | select(.metadata.container.tags == []) | .id' versions.json)
  count=$(echo "$untagged_ids" | wc -l)
  if [ -z "$untagged_ids" ]; then
    echo "✅ No untagged versions found."
    continue
  fi
  echo "⚠️ Found $count untagged version(s)."
  if [ "$DRY_RUN" = "true" ]; then
    echo "📝 Would delete the following versions:"
    echo "$untagged_ids"
  else
    echo "🗑️ Deleting $count untagged version(s)..."
    echo "$untagged_ids" | while read version_id; do
      echo "Deleting version $version_id..."
      gh api --method DELETE "$api_base/packages/container/${encoded_pkg_name}/versions/$version_id"
    done
  fi
done
