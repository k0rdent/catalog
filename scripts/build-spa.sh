#!/usr/bin/env bash
# Build the React SPA with Vite
# Used by both gh-pages-deploy workflow and Dockerfile
#
# Environment variables:
#   BASE_PATH - base URL path for the SPA (default: /latest/)
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$ROOT_DIR/tsweb"

export BASE_PATH="${BASE_PATH:-/latest/}"

echo "==> Installing Node dependencies..."
npm ci --ignore-scripts 2>/dev/null || npm install

echo "==> Building SPA with BASE_PATH=$BASE_PATH..."
npx vite build

echo "==> SPA build complete."
