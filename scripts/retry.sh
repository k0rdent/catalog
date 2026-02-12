#!/bin/bash
set -euo pipefail

# Defaults (can be overridden via env)
MAX_RETRIES="${MAX_RETRIES:-60}"
SLEEP_SECONDS="${SLEEP:-10}"

attempt=1

while true; do
  echo "Attempt ${attempt}/${MAX_RETRIES}: $*"

  if "$@"; then
    echo "Command succeeded"
    exit 0
  fi

  if [[ "$attempt" -ge "$MAX_RETRIES" ]]; then
    echo "Command failed after ${MAX_RETRIES} attempts"
    exit 1
  fi

  echo "Command failed. Retrying in ${SLEEP_SECONDS}s..."
  sleep "$SLEEP_SECONDS"

  attempt=$((attempt + 1))
done
