#!/usr/bin/env python3
"""Generate index.json with catalog schema and metadata.

Usage:
    python3 scripts/web/generate_index.py                  # single version from VERSION env
    python3 scripts/web/generate_index.py --all-versions   # all versions from versions.yaml

Environment variables:
    VERSION    - catalog version (default: v1.5.0)
    SITE_URL   - site URL for absolute links (default: https://catalog.k0rdent.io)
    OUTPUT_DIR - output directory (default: tsweb/public)
"""

import copy
import json
import os
import sys
import yaml
from datetime import datetime
from pathlib import Path
from typing import Dict, Optional

import jsonschema
from packaging.version import Version

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import utils

CATALOG_ROOT = Path(__file__).parent.parent.parent
APPS_DIR = CATALOG_ROOT / "apps"
VERSIONS_FILE = CATALOG_ROOT / "versions.yaml"
SITE_URL = os.getenv("SITE_URL", "https://catalog.k0rdent.io")

DEFAULT_CHART_REPOS = {
    "community": "oci://ghcr.io/k0rdent/catalog/charts",
    "enterprise": "oci://registry.mirantis.com/k0rdent-enterprise-catalog",
    "partner": "oci://ghcr.io/k0rdent/catalog/charts",
}

# Cache: app_name -> raw yaml dict (before charts enrichment)
_data_cache = {}
# Cache: app_name -> charts data from utils.try_add_charts_data
_charts_cache = {}


def _load_app_data(app_name: str) -> Optional[dict]:
    """Load and cache app data.yaml with charts enrichment."""
    if app_name not in _data_cache:
        data_yaml = APPS_DIR / app_name / "data.yaml"
        if not data_yaml.exists():
            _data_cache[app_name] = None
            return None
        with open(data_yaml, 'r', encoding='utf-8') as f:
            _data_cache[app_name] = yaml.safe_load(f)
    data = _data_cache[app_name]
    if data is None:
        return None
    # Deep copy so mutations don't affect cache
    data = copy.deepcopy(data)
    if app_name not in _charts_cache:
        utils.try_add_charts_data(app_name, data)
        _charts_cache[app_name] = data.get('charts', [])
    else:
        data['charts'] = _charts_cache[app_name]
    return data


def addons_items(version: str):
    required_names = []
    props = dict()
    required_names.append("name")
    props["name"] = {
        "type": "string",
        "description": "The add-on name (e.g. 'prometheus')",
        "pattern": "^[a-z0-9-]+$"
    }
    required_names.append("description")
    props["description"] = {
        "type": "string",
        "description": "A short summary of the add-on",
        "minLength": 10
    }
    required_names.append("logo")
    props["logo"] = {
        "type": "string",
        "format": "uri",
        "description": "Absolute URL to the logo image"
    }
    if Version(version) <= Version("v1.0.0"):
        required_names.append("latestVersion")
        props["latestVersion"] = {
            "type": "string",
            "description": "DEPRECATED, use 'charts' field - Latest version of the add-on",
        }
        required_names.append("versions")
        props["versions"] = {
            "type": "array",
            "items": {"type": "string"},
            "description": "DEPRECATED, use 'charts' field - List of available versions",
            "minItems": 1
        }
        required_names.append("chartUrl")
        props["chartUrl"] = {
            "type": "string",
            "format": "uri",
            "description": "DEPRECATED, adopt kgst approach - Absolute URL to the chart"
        }
    required_names.append("docsUrl")
    props["docsUrl"] = {
        "type": "string",
        "format": "uri",
        "description": "Absolute URL to the add-on's documentation"
    }
    required_names.append("supportType")
    props["supportType"] = {
        "type": "string",
        "enum": ["community", "enterprise", "partner"],
        "description": "Type of support provided"
    }
    required_names.append("deprecated")
    props["deprecated"] = {
        "type": "boolean",
        "description": "Whether the add-on is deprecated"
    }
    required_names.append("charts")
    chart_props = dict()
    chart_required_props = []
    chart_required_props.append("name")
    chart_props["name"] = {"type": "string", "description": "Chart name"}
    chart_required_props.append("versions")
    chart_props["versions"] = {
        "type": "array",
        "items": {"type": "string"},
        "description": "List of chart versions"
    }
    chart_required_props.append("appVersions")
    chart_props["appVersions"] = {
        "type": "array",
        "items": {"type": "string"},
        "description": "List of chart appVersions"
    }
    if Version(version) > Version("v1.0.0"):
        chart_required_props.append("repository")
        chart_props["repository"] = {"type": "string", "description": "Chart repository"}
    props["charts"] = {
        "type": "array",
        "items": {
            "type": "object",
            "required": chart_required_props,
            "properties": chart_props,
            "description": "Application charts"
        }
    }
    props["metadata"] = {
        "type": "object",
        "properties": {
            "owner": {"type": "string", "description": "Team or individual responsible"},
            "lastUpdated": {"type": "string", "format": "date", "description": "Last update date"},
            "dependencies": {"type": "array", "items": {"type": "string"}, "description": "Dependencies"},
            "tags": {"type": "array", "items": {"type": "string"}, "description": "Categories and labels"},
            "quality": {
                "type": "object",
                "properties": {
                    "tested": {"type": "boolean", "description": "Whether tested"},
                    "securityScanned": {"type": "boolean", "description": "Whether security scanned"}
                }
            }
        }
    }
    return required_names, props


def generate_schema(version: str) -> Dict:
    required_names, props = addons_items(version)
    return {
        "$schema": "http://json-schema.org/draft-07/schema#",
        "type": "object",
        "required": ["addons", "metadata"],
        "properties": {
            "metadata": {
                "type": "object",
                "required": ["generated", "version"],
                "properties": {
                    "generated": {"type": "string", "format": "date-time", "description": "When this index was generated"},
                    "version": {"type": "string", "description": "Version of the index schema"}
                }
            },
            "addons": {
                "type": "array",
                "items": {
                    "type": "object",
                    "required": required_names,
                    "properties": props
                }
            }
        }
    }


def get_tested(data: dict) -> bool:
    return any(data.get(k) == 'y' for k in
               ['validated_amd64', 'validated_arm64', 'validated_aws', 'validated_azure', 'validated_local'])


def get_charts(data: dict, version: str) -> list:
    """Build charts list with repository info. Returns new list (no mutation)."""
    charts = copy.deepcopy(data.get('charts', []))
    if Version(version) >= Version("v1.0.0"):
        support_type = data.get("support_type", "community").lower()
        default_repo = DEFAULT_CHART_REPOS.get(support_type, DEFAULT_CHART_REPOS["community"])
        for chart in charts:
            chart["repository"] = chart.get("repository", default_repo)
    return charts


def process_addon(app_name: str, version: str, base_url: str) -> Optional[Dict]:
    app_dir = APPS_DIR / app_name
    data = _load_app_data(app_name)
    if data is None or data.get('type') == 'infra':
        return None

    if not data.get('charts'):
        return None

    versions = data['charts'][0]['versions']
    latest_version = versions[0]

    logo = data.get("logo", "")
    if logo.startswith(('http://', 'https://')):
        logo_url = logo
    else:
        filename = os.path.basename(logo.lstrip('./'))
        logo_url = f"{base_url}/logos/{app_name}/{filename}"

    addon = {
        "name": app_name,
        "description": data.get("description", "").split('\n')[0].strip(),
        "logo": logo_url,
        "docsUrl": f"{base_url}/apps/{app_name}/",
        "supportType": data.get("support_type", "community").lower(),
        "deprecated": data.get("deprecated", False),
        "charts": get_charts(data, version),
        "metadata": {
            "owner": data.get("owner", "k0rdent-team"),
            "lastUpdated": datetime.fromtimestamp(app_dir.stat().st_mtime).strftime('%Y-%m-%d'),
            "dependencies": data.get("dependencies", []),
            "tags": data.get("tags", []),
            "quality": {
                "tested": get_tested(data),
                "securityScanned": data.get("security_scanned", False)
            }
        }
    }

    if Version(version) <= Version("v1.0.0"):
        addon["latestVersion"] = latest_version
        addon["versions"] = versions
        addon["chartUrl"] = f"{base_url}/apps/{app_name}/charts/{app_name}-service-template-{latest_version}/st-charts.yaml"

    return addon


def build_version(version: str, output_dir: str):
    """Build index.json and schema for a single version."""
    base_url = f"{SITE_URL.rstrip('/')}/{version}"

    addons = []
    for app_dir in sorted(APPS_DIR.iterdir()):
        if not app_dir.is_dir() or app_dir.name.startswith('.'):
            continue
        addon = process_addon(app_dir.name, version, base_url)
        if addon:
            addons.append(addon)

    index = {
        "metadata": {
            "generated": datetime.utcnow().isoformat(),
            "version": version.replace('v', '')
        },
        "addons": sorted(addons, key=lambda x: x["name"])
    }

    schema = generate_schema(version)

    # Validate
    jsonschema.validate(instance=index, schema=schema)

    # Write index
    index_path = os.path.join(output_dir, 'index.json')
    os.makedirs(os.path.dirname(index_path), exist_ok=True)
    with open(index_path, 'w', encoding='utf-8') as f:
        json.dump(index, f, indent=2, ensure_ascii=False)

    # Write schema
    schema_dir = os.path.join(output_dir, 'schema')
    os.makedirs(schema_dir, exist_ok=True)
    with open(os.path.join(schema_dir, 'index.json'), 'w', encoding='utf-8') as f:
        json.dump(schema, f, indent=2, ensure_ascii=False)

    print(f"  {version}: index.json ({len(addons)} addons)")


def main():
    os.chdir(CATALOG_ROOT)

    if '--all-versions' in sys.argv:
        output_dir = os.environ.get('OUTPUT_DIR', 'tsweb/public')
        with open(VERSIONS_FILE) as f:
            cfg = yaml.safe_load(f)
        for v in cfg['versions']:
            build_version(v, os.path.join(output_dir, v))
    else:
        version = os.getenv("VERSION", "v1.5.0")
        output_dir = os.environ.get('OUTPUT_DIR', str(CATALOG_ROOT / "tsweb" / "md"))
        build_version(version, output_dir)


if __name__ == '__main__':
    main()
