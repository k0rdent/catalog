#!/bin/bash
set -euo pipefail

echo "Checking already installed"
if helm list -n kcm-system | grep "$APP"; then
    echo "✅ App '$APP' service template already installed."
else
    echo "Not installed yet"
    echo "Installing k0rdent service templates based on apps/$APP/example/Chart.yaml deps"
    install_st_commands=$(python3 ./scripts/utils.py install-servicetemplates $APP)
    bash -c "$install_st_commands" || true
fi

./scripts/wait_for_servicetemplate.sh
