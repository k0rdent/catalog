#!/bin/bash
set -euo pipefail

echo "Checking already installed"
if helm list -n kcm-system | grep "$APP"; then
    echo "✅ App '$APP' service template already installed."
else
    echo "Not installed yet"
    example_folder=${EXAMPLE_FOLDER:-example}
    echo "Installing k0rdent service templates based on apps/$APP/$example_folder/Chart.yaml deps"
    install_st_commands=$(python3 ./scripts/utils.py install-servicetemplates "$APP" -e "$example_folder")
    echo "$install_st_commands"
    bash -c "$install_st_commands" || true
fi

./scripts/wait_for_servicetemplate.sh
