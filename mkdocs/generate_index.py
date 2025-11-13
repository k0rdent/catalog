#!/usr/bin/env python3

import json
import yaml
from datetime import datetime
from pathlib import Path
from typing import Dict, Optional
import logging
import jsonschema
import os
from packaging.version import Version

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Constants
CATALOG_ROOT = Path(__file__).parent.parent
APPS_DIR = CATALOG_ROOT / "apps"
SCHEMA_FILE = CATALOG_ROOT / "mkdocs" / "schema" / "index.json"
INDEX_FILE = CATALOG_ROOT / "mkdocs" / "index.json"
VERSION = os.getenv("VERSION", "v1.5.0")
BASE_URL = f"https://catalog.k0rdent.io/{VERSION}"
DEFAULT_CHART_REPOS = {
    "community": "oci://ghcr.io/k0rdent/catalog/charts",
    "enterprise": "oci://registry.mirantis.com/k0rdent-enterprise-catalog",
    "partner": "oci://ghcr.io/k0rdent/catalog/charts",
}


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
            "description": "DEPRECATED, use 'charts' field - Latest version of the add-on (e.g. '27.5.1')",
        }
        required_names.append("versions")
        props["versions"] = {
            "type": "array",
            "items": {
                "type": "string",
            },
            "description": "DEPRECATED, use 'charts' field - List of available versions",
            "minItems": 1
        }
        required_names.append("chartUrl")
        props["chartUrl"] = {
            "type": "string",
            "format": "uri",
            "description": "DEPRECATED, adopt kgst approach - Absolute URL to the chart's st-charts.yaml or tarball"
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
    chart_props["name"] = {
        "type": "string",
        "description": "Chart name"
    }
    chart_required_props.append("versions")
    chart_props["versions"] = {
        "type": "array",
        "items": {
            "type": "string"
        },
        "description": "List of chart versions"
    }
    if Version(version) > Version("v1.0.0"):
        chart_required_props.append("repository")
        chart_props["repository"] = {
            "type": "string",
            "description": "Chart repository"
        }
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
            "owner": {
                "type": "string",
                "description": "Team or individual responsible for the add-on"
            },
            "lastUpdated": {
                "type": "string",
                "format": "date",
                "description": "Last update date of the add-on"
            },
            "dependencies": {
                "type": "array",
                "items": {
                    "type": "string"
                },
                "description": "List of add-on dependencies"
            },
            "tags": {
                "type": "array",
                "items": {
                    "type": "string"
                },
                "description": "Categories and labels for the add-on"
            },
            "quality": {
                "type": "object",
                "properties": {
                    "tested": {
                        "type": "boolean",
                        "description": "Whether the add-on has been tested"
                    },
                    "securityScanned": {
                        "type": "boolean",
                        "description": "Whether the add-on has been security scanned"
                    }
                }
            }
        }
    }
    return required_names, props


def generate_schema() -> Dict:
    """Generate the JSON schema for the catalog index."""
    required_names, props = addons_items(VERSION)
    return {
        "$schema": "http://json-schema.org/draft-07/schema#",
        "type": "object",
        "required": ["addons", "metadata"],
        "properties": {
            "metadata": {
                "type": "object",
                "required": ["generated", "version"],
                "properties": {
                    "generated": {
                        "type": "string",
                        "format": "date-time",
                        "description": "When this index was generated"
                    },
                    "version": {
                        "type": "string",
                        "description": "Version of the index schema"
                    }
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

def get_chart_url(app_name: str, version: str) -> str:
    """Generate the chart URL for a specific version."""
    return f"{BASE_URL}/apps/{app_name}/charts/{app_name}-service-template-{version}/st-charts.yaml"

def get_docs_url(app_name: str) -> str:
    """Generate the documentation URL for an add-on."""
    return f"{BASE_URL}/apps/{app_name}/"

def get_support_type(data: dict) -> str:
    return data.get("support_type", "community").lower()

def get_charts(data: dict, version: str) -> list:
    charts = data["charts"]
    if Version(version) >= Version("v1.0.0"):
        support_type = get_support_type(data)
        default_repo = DEFAULT_CHART_REPOS[support_type]
        for chart in charts:
            chart["repository"] = chart.get("repository", default_repo)
    return charts

def normalize_logo_url(logo: str, app_name: str) -> str:
    """Convert relative logo paths to absolute URLs."""
    if logo.startswith(('http://', 'https://')):
        return logo
    if logo.startswith('./'):
        return f"{BASE_URL}/apps/{app_name}/{logo[2:]}"
    return f"{BASE_URL}/apps/{app_name}/{logo}"

def process_addon(app_dir: Path, version: str) -> Optional[Dict]:
    """Process a single add-on directory and extract its metadata."""
    app_name = app_dir.name
    data_yaml = app_dir / "data.yaml"
    
    if not data_yaml.exists():
        logger.warning(f"No data.yaml found in {app_dir}")
        return None

    try:
        with open(data_yaml, 'r', encoding='utf-8') as f:
            data = yaml.safe_load(f)
    except Exception as e:
        logger.error(f"Error reading {data_yaml}: {e}")
        return None

    if len(data.get('charts', [])) == 0:
        return None

    # Get available versions
    versions = data['charts'][0]['versions']
    latest_version = versions[0]

    # Extract metadata
    addon = dict()
    addon["name"] = app_name
    addon["description"] = data.get("description", "").split('\n')[0].strip()  # First line only
    addon["logo"] = normalize_logo_url(data.get("logo", ""), app_name)
    if Version(version) <= Version("v1.0.0"):
        addon["latestVersion"] = latest_version
        addon["versions"] = versions
        addon["chartUrl"] = get_chart_url(app_name, latest_version)
    addon["docsUrl"] = get_docs_url(app_name)
    addon["supportType"] = get_support_type(data)
    addon["deprecated"] = data.get("deprecated", False)
    addon["charts"] = get_charts(data, version)
    addon["metadata"] = {
        "owner": data.get("owner", "k0rdent-team"),
        "lastUpdated": datetime.fromtimestamp(app_dir.stat().st_mtime).strftime('%Y-%m-%d'),
        "dependencies": data.get("dependencies", []),
        "tags": data.get("tags", []),
        "quality": {
            "tested": data.get("tested", False),
            "securityScanned": data.get("security_scanned", False)
        }
    }
    return addon

def generate_index(schema: dict) -> None:
    """Generate the catalog index file."""
    addons = []
    
    # Process each add-on directory
    for app_dir in APPS_DIR.iterdir():
        if not app_dir.is_dir() or app_dir.name.startswith('.'):
            continue

        logger.info(f"Processing {app_dir.name}")
        addon = process_addon(app_dir, VERSION)
        if addon:
            addons.append(addon)

    # Create the index
    index = {
        "metadata": {
            "generated": datetime.utcnow().isoformat(),
            "version": VERSION.replace('v', '') # remove 'v' prefix to keep format
        },
        "addons": sorted(addons, key=lambda x: x["name"])
    }

    # Write the index file
    with open(INDEX_FILE, 'w', encoding='utf-8') as f:
        json.dump(index, f, indent=2, ensure_ascii=False)
    logger.info(f"Index generated successfully at {INDEX_FILE}")
    validate_index(schema)


def validate_index(schema: dict) -> bool:
    """Validate the generated index against the schema."""

    with open(INDEX_FILE, 'r', encoding='utf-8') as f:
        index = json.load(f)
    jsonschema.validate(instance=index, schema=schema)
    logger.info("Index validation successful")


def generate_schema_file() -> dict:
    """Generate the schema file for external use."""
    schema = generate_schema()
    
    # Ensure schema directory exists
    SCHEMA_FILE.parent.mkdir(parents=True, exist_ok=True)

    with open(SCHEMA_FILE, 'w', encoding='utf-8') as f:
        json.dump(schema, f, indent=2, ensure_ascii=False)
    logger.info(f"Schema generated successfully at {SCHEMA_FILE}")
    return schema

schema = generate_schema_file()
generate_index(schema)
