#!/bin/bash

find apps -path "apps/*/charts/st-charts.yaml" | cut -d'/' -f2 | sort -u | while read -r app; do
    python3 ./scripts/chart_ctl.py generate "$app"
done
