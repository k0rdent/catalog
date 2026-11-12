#!/bin/bash

# export GITHUB_TOKEN=xxxxx
# export APP=ingress-nginx
# export DST_REPO=josca/k0rdent-catalog
# export OWNER=josca-test
# export UPDATE_SUMMARY="5.0.33 -> 5.0.34"  # optional, appended to the title

echo "app: $APP, DST_REPO: $DST_REPO, OWNER: $OWNER"
set -euo pipefail

branch="${APP}-update"
head="${OWNER}:${branch}"
echo "${head}"

api_url="https://api.github.com/repos/$DST_REPO/pulls"

summary="${UPDATE_SUMMARY:-}"
title="${APP}: automated update${summary:+ ($summary)}"
echo "title: $title"

# Create PR
response=$(curl -s -w "\n%{http_code}" -X POST \
-H "Authorization: Bearer $GITHUB_TOKEN" \
-H "Accept: application/vnd.github+json" \
"$api_url" \
-d @- <<EOF
{
    "title": "${title}",
    "head": "${head}",
    "base": "main",
    "body": "This PR was created automatically by CI."
}
EOF
)

http_code=$(echo "$response" | tail -1)
body=$(echo "$response" | sed '$d')

if [ "$http_code" -ge 400 ]; then
    echo "Error: GitHub API returned HTTP $http_code"
    echo "$body"
    exit 1
fi

echo "$body"
