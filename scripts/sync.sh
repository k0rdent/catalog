#!/bin/bash
set -euo pipefail
# export SYNC_REMOTE=108.130.16.138
# export SYNC_USER=ubuntu
# ./scripts/sync.sh -vurn

rsync --exclude '.git' --exclude 'kcfg_*' \
      -e ssh ./scripts "$SYNC_USER@$SYNC_REMOTE:/home/$SYNC_USER/k0rdent-catalog" "$@"
