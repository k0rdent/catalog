#!/bin/bash

# export GITHUB_TOKEN=xxxxx
# export APP=ingress-nginx
# export DST_REPO=josca/k0rdent-catalog
# export OWNER=josca-test

echo "app: $APP, DST_REPO: $DST_REPO, OWNER: $OWNER"
set -euo pipefail

branch="${APP}-update"
head="${OWNER}:${branch}"
echo "${head}"

api_url="https://api.github.com/repos/$DST_REPO/pulls"

# Create PR
curl --fail -X POST \
-H "Authorization: Bearer $GITHUB_TOKEN" \
-H "Accept: application/vnd.github+json" \
"$api_url" \
-d @- <<EOF
{
    "title": "${APP}: Automated update",
    "head": "${head}",
    "base": "main",
    "body": "This PR was created automatically by CI."
}
EOF
