import os
import json
import mkdocs_gen_files
import yaml
import glob

paths = glob.glob("./mkdocs/apps/*/*.md") + glob.glob("./mkdocs/infra/*/*.md")
metadata_list = []

for file_path in paths:
    if not os.path.exists(file_path):
        print(f"⚠️ Warning: {file_path} not found, skipping...")
        continue

    with open(file_path, "r", encoding="utf-8") as f:
        lines = f.readlines()

    # Extract metadata from YAML front matter (first lines of the file)
    metadata = {}
    if lines[0].strip() == "---":  # Check if YAML front matter exists
        yaml_content = []
        for line in lines[1:]:
            if line.strip() == "---":
                break
            yaml_content.append(line)
        metadata = yaml.safe_load("\n".join(yaml_content)) or {}

    metadata_list.append({
        "link": os.path.dirname(file_path).replace("./mkdocs", ".") + "/",
        "title": metadata.get("title", "No Title"),
        "type": metadata.get("type", " "),
        "logo": metadata.get("logo", " "),
        "tags": metadata.get("tags", []),
        "created": metadata.get("created", " "),
        "support_type": metadata.get("support_type", "Community"),
        "description": metadata.get("description", "No Description"),
        "appDir": file_path.replace("\\", "/").split("/")[-2], # ensure it works for windows (backslashes)
    })

# Save extracted metadata as JSON
with mkdocs_gen_files.open("fetched_metadata.json", "w") as f:
    json.dump(metadata_list, f, indent=2)

print("✅ Metadata extracted and saved to fetched_metadata.json")
