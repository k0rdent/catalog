#!/bin/bash
set -euo pipefail

echo "Uninstalling k0rdent service templates based on apps/$APP/example/Chart.yaml deps"
uninstall_st_commands=$(python3 ./scripts/utils.py uninstall-servicetemplates $APP)
bash -c -x "$uninstall_st_commands" 

