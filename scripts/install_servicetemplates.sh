#!/bin/bash
set -euo pipefail

echo "Installing k0rdent service templates based on apps/$APP/example/Chart.yaml deps"
install_st_commands=$(python3 ./scripts/utils.py install-servicetemplates $APP)
bash -c "$install_st_commands"

./scripts/wait_for_servicetemplate.sh
