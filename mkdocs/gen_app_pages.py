import os
import yaml
from jinja2 import Template

required_fields = ['title', 'tags', 'summary', 'logo', 'description', 'install_code', 'verify_code', 'deploy_code',
                   'support_link', 'doc_link']

def changed(file, content):
    if os.path.exists(file):
        with open(file, 'r', encoding='utf-8') as f:
            if f.read() == content:
                return False
    return True


def validate_metadata(file: str, data: dict):
    for required_field in required_fields:
        if required_field not in data:
            raise Exception(f"Required field '{required_field}' not found in {file}")

def generate_apps():
    apps_dir = 'mkdocs/apps'
    template_path = 'mkdocs/apps/app.tpl.md'

    # Read template
    with open(template_path, 'r', encoding='utf-8') as f:
        template_content = f.read()
    template = Template(template_content)

    # Iterate over each app directory
    for app in os.listdir(apps_dir):
        app_path = os.path.join(apps_dir, app)
        data_file = os.path.join(app_path, 'data.yaml')
        md_file = os.path.join(app_path, app + '.md')

        if os.path.isdir(app_path) and os.path.exists(data_file):
            with open(data_file, 'r', encoding='utf-8') as f:
                metadata = yaml.safe_load(f)
                validate_metadata(data_file, metadata)

            # Render the template with metadata
            rendered_md = template.render(**metadata)

            if changed(md_file, rendered_md):
                # Write the generated markdown
                with open(md_file, 'w', encoding='utf-8') as f:
                    f.write(rendered_md)

generate_apps()
