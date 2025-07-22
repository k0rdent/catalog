#!/usr/bin/env python3

import json
import yaml
import glob
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional
import re
import logging
import jsonschema

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Constants
CATALOG_ROOT = Path(__file__).parent.parent
APPS_DIR = CATALOG_ROOT / "apps"
SCHEMA_FILE = CATALOG_ROOT / "mkdocs" / "schema" / "index.json"
INDEX_FILE = CATALOG_ROOT / "mkdocs" / "index.json"
BASE_URL = "https://catalog.k0rdent.io/latest"

def generate_schema() -> Dict:
    """Generate the JSON schema for the catalog index."""
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
                    "required": [
                        "name",
                        "description",
                        "logo",
                        "latestVersion",
                        "versions",
                        "chartUrl",
                        "docsUrl",
                        "supportType",
                        "deprecated"
                    ],
                    "properties": {
                        "name": {
                            "type": "string",
                            "description": "The add-on name (e.g. 'prometheus')",
                            "pattern": "^[a-z0-9-]+$"
                        },
                        "description": {
                            "type": "string",
                            "description": "A short summary of the add-on",
                            "minLength": 10
                        },
                        "logo": {
                            "type": "string",
                            "format": "uri",
                            "description": "Absolute URL to the logo image"
                        },
                        "latestVersion": {
                            "type": "string",
                            "description": "Latest version of the add-on (e.g. '27.5.1')",
                            "pattern": "^[v]?[0-9]+\\.[0-9]+\\.[0-9]+$"
                        },
                        "versions": {
                            "type": "array",
                            "items": {
                                "type": "string",
                                "pattern": "^[v]?[0-9]+\\.[0-9]+\\.[0-9]+$"
                            },
                            "description": "List of available versions",
                            "minItems": 1
                        },
                        "chartUrl": {
                            "type": "string",
                            "format": "uri",
                            "description": "Absolute URL to the chart's st-charts.yaml or tarball"
                        },
                        "docsUrl": {
                            "type": "string",
                            "format": "uri",
                            "description": "Absolute URL to the add-on's documentation"
                        },
                        "supportType": {
                            "type": "string",
                            "enum": ["community", "enterprise", "partner"],
                            "description": "Type of support provided"
                        },
                        "deprecated": {
                            "type": "boolean",
                            "description": "Whether the add-on is deprecated"
                        },
                        "metadata": {
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
                    }
                }
            }
        }
    }

def get_chart_versions(app_dir: Path) -> List[str]:
    """Extract available versions from chart directories."""
    versions = []
    charts_dir = app_dir / "charts"
    if not charts_dir.exists():
        return versions

    # Look for service template charts
    chart_dirs = glob.glob(str(charts_dir / "*-service-template-*"))
    for chart_dir in chart_dirs:
        # Extract version from directory name
        match = re.search(r'-service-template-(.+)$', chart_dir)
        if match:
            versions.append(match.group(1))
    
    # Sort versions in descending order
    unique_versions = list(set(versions))
    unique_versions.sort(reverse=True)
    return unique_versions

def get_chart_url(app_name: str, version: str) -> str:
    """Generate the chart URL for a specific version."""
    return f"{BASE_URL}/apps/{app_name}/charts/{app_name}-service-template-{version}/st-charts.yaml"

def get_docs_url(app_name: str) -> str:
    """Generate the documentation URL for an add-on."""
    return f"{BASE_URL}/apps/{app_name}/"

def normalize_logo_url(logo: str, app_name: str) -> str:
    """Convert relative logo paths to absolute URLs."""
    if logo.startswith(('http://', 'https://')):
        return logo
    if logo.startswith('./'):
        return f"{BASE_URL}/apps/{app_name}/{logo[2:]}"
    return f"{BASE_URL}/apps/{app_name}/{logo}"

def process_addon(app_dir: Path) -> Optional[Dict]:
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

    # Get available versions
    versions = get_chart_versions(app_dir)
    if not versions:
        logger.warning(f"No versions found for {app_name}")
        return None

    latest_version = versions[0]

    # Extract metadata
    addon = {
        "name": app_name,
        "description": data.get("description", "").split('\n')[0].strip(),  # First line only
        "logo": normalize_logo_url(data.get("logo", ""), app_name),
        "latestVersion": latest_version,
        "versions": versions,
        "chartUrl": get_chart_url(app_name, latest_version),
        "docsUrl": get_docs_url(app_name),
        "supportType": data.get("support_type", "community").lower(),
        "deprecated": data.get("deprecated", False),
        "metadata": {
            "owner": data.get("owner", "k0rdent-team"),
            "lastUpdated": datetime.fromtimestamp(app_dir.stat().st_mtime).strftime('%Y-%m-%d'),
            "dependencies": data.get("dependencies", []),
            "tags": data.get("tags", []),
            "quality": {
                "tested": data.get("tested", False),
                "securityScanned": data.get("security_scanned", False)
            }
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
        addon = process_addon(app_dir)
        if addon:
            addons.append(addon)

    # Create the index
    index = {
        "metadata": {
            "generated": datetime.utcnow().isoformat(),
            "version": "1.0.0"
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
