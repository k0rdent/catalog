#!/bin/bash

mcs="apps/$APP/mcs.yaml"

if [[ ! -e "$mcs" ]]; then
    python3 ./scripts/utils.py render-mcs $APP > /dev/null
fi

yq '.spec.serviceSpec.services[0].namespace' "$mcs"
