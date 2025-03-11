#!/bin/bash
set -euo pipefail

yq '.spec.serviceSpec.services[0].namespace' apps/$APP/mcs.yaml
