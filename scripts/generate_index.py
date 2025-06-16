#!/usr/bin/env python3

import os
import json
import yaml
import glob
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional
import re
import logging

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Constants
CATALOG_ROOT = Path(__file__).parent.parent
APPS_DIR = CATALOG_ROOT / "apps"
SCHEMA_FILE = CATALOG_ROOT / "schema" / "index.json"
INDEX_FILE = CATALOG_ROOT / "index.json"
BASE_URL = "https://catalog.k0rdent.io/latest"

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
        match = re.search(r'-service-template-([0-9]+\.[0-9]+\.[0-9]+)$', chart_dir)
        if match:
            versions.append(match.group(1))
    
    # Sort versions in descending order
    versions.sort(key=lambda x: [int(n) for n in x.split('.')], reverse=True)
    return versions

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

def generate_index() -> None:
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
    try:
        with open(INDEX_FILE, 'w', encoding='utf-8') as f:
            json.dump(index, f, indent=2, ensure_ascii=False)
        logger.info(f"Index generated successfully at {INDEX_FILE}")
    except Exception as e:
        logger.error(f"Error writing index file: {e}")
        raise

def validate_index() -> bool:
    """Validate the generated index against the schema."""
    try:
        import jsonschema
    except ImportError:
        logger.error("jsonschema package not found. Install it with: pip install jsonschema")
        return False

    try:
        with open(SCHEMA_FILE, 'r', encoding='utf-8') as f:
            schema = json.load(f)
        with open(INDEX_FILE, 'r', encoding='utf-8') as f:
            index = json.load(f)
        
        jsonschema.validate(instance=index, schema=schema)
        logger.info("Index validation successful")
        return True
    except jsonschema.exceptions.ValidationError as e:
        logger.error(f"Index validation failed: {e}")
        return False
    except Exception as e:
        logger.error(f"Error during validation: {e}")
        return False

if __name__ == "__main__":
    try:
        generate_index()
        if not validate_index():
            logger.error("Index validation failed")
            exit(1)
    except Exception as e:
        logger.error(f"Error generating index: {e}")
        exit(1) 