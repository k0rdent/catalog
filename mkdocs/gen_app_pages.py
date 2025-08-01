import os
import shutil
import yaml
import jinja2
import json
import mkdocs_gen_files

required_fields = ['title', 'tags', 'summary', 'logo', 'description', 'created']
allowed_fields = ['title', 'tags', 'summary', 'logo', 'logo_big', 'created', 'description', 'install_code', 'verify_code',
                  'deploy_code', 'type', 'support_link', 'doc_link', 'test_namespace', 'use_ingress', 'support_type',
                  'exclude_versions', 'prerequisites', 'test_deploy_chart', 'test_install_servicetemplates',
                  'test_deploy_multiclusterservice', 'test_wait_for_pods', 'test_wait_for_running', 'show_install_tab',
                  'examples', 'charts']
allowed_tags = ['AI/Machine Learning', 'Application Runtime', 'Authentication', 'Backup and Recovery',
                'CI/CD', 'Container Registry', 'Database', 'Developer Tools', 'Drivers and plugins',
                'Monitoring', 'Networking', 'Security', 'Serverless', 'Storage']
allowed_support_types = ['Enterprise', 'Community', 'Partner']
summary_chars_limit = 90
valid_versions = ['v0.1.0', 'v0.2.0', 'v0.3.0', 'v1.0.0', 'v1.1.0', 'v1.1.1', 'v1.2.0']

VERSION = os.environ.get('VERSION', 'v1.1.1')


def changed(file, content):
    if os.path.exists(file):
        with open(file, 'r', encoding='utf-8') as f:
            if f.read() == content:
                return False
    return True


def validate_summary(file: str, data: dict):
    summary_chars = len(data['summary'])
    if summary_chars > summary_chars_limit:
        raise Exception(f"Exceeded 'summary chars limit' ({summary_chars} > {summary_chars_limit}) in {file}")


def validate_support_type(file: str, data: dict):
    support_type = data.get('support_type', 'Community')
    if support_type not in allowed_support_types:
        raise Exception(f"No allowed support_type found '{support_type}' in {file}, use ({allowed_support_types})")

    if 'support_type' not in data:
        data['support_type'] = support_type


def validate_show_install_tab(file: str, data: dict):
    show_install_tab = data.get('show_install_tab', True)
    if not isinstance(show_install_tab, bool):
        raise Exception(f"Field 'show_install_tab' needs to be a bool! ({file})")
    if 'show_install_tab' not in data:
        data['show_install_tab'] = show_install_tab


def try_validate_versions(file: str, data: dict):
    if 'exclude_versions' not in data:
        return
    if not isinstance(data['exclude_versions'], list):
        raise Exception(f"Field 'exclude_versions' needs to be an array if used! ({file})")
    for exclude_version in data['exclude_versions']:
        if exclude_version not in valid_versions:
            raise Exception(f"Version '{exclude_version}' not valid ({valid_versions})")


def try_validate_wait_for_pods(file: str, data: dict):
    if 'test_wait_for_pods' not in data:
        return
    if not isinstance(data['test_wait_for_pods'], str):
        raise Exception(f"Field 'test_wait_for_pods' needs to be a string, e.g. 'pod1- pod2-' if used! ({file})")


def validate_charts_info(file: str, data: dict):
    if not data.get('show_install_tab', True):
        return
    if 'install_code' in data:
        return
    if 'charts' not in data:
        raise Exception(f"No 'charts' array found in {file}.")
    if not isinstance(data['charts'], list):
        raise Exception(f"Field 'charts' must an array of objects with 'name' and 'version' fields.")


def validate_metadata(file: str, data: dict):
    validate_support_type(file, data)
    for required_field in required_fields:
        if required_field not in data:
            raise Exception(f"Required field '{required_field}' not found in {file}")

    for field in data:
        if field not in allowed_fields:
            raise Exception(f"Data field '{field}' from {file} not allowed")

    if not isinstance(data['tags'], list):
        raise Exception(f"Field 'tags' needs to be an array! ({file})")
    for tag in data['tags']:
        if tag not in allowed_tags:
            raise Exception(f"Unsupported tag '{tag}' found in {file}. Allowed tags: {allowed_tags}")

    if data.get('type', 'app') != 'infra':
        if len(data['tags']) == 0:
            raise Exception(f"No application tag found in {file}. Set at least one from tags: {allowed_tags}")
        validate_charts_info(file, data)

    validate_summary(file, data)
    try_validate_versions(file, data)
    try_validate_wait_for_pods(file, data)
    validate_show_install_tab(file, data)


def try_copy_assets(app: str, apps_dir: str, dst_dir: str, is_infra: bool):
    src_dir = os.path.join(apps_dir, app, "assets")
    subdir = "infra" if is_infra else "apps"
    dst_dir = os.path.join(dst_dir, subdir, app, "assets")
    if os.path.exists(src_dir) and os.path.isdir(src_dir):
        shutil.copytree(src_dir, dst_dir, dirs_exist_ok=True)
        print(f"Assets copied from {src_dir} to {dst_dir}")


def version2template_names(version: str) -> str:
    # find templates/provider/kcm-templates/files/templates/ | grep -E "//adopted|//aws|//azure|//gcp|//docker|//remote|//vsphere|//openstack" | sort
    if version == "v0.1.0":
        return {
            "adopted_cluster": "adopted-cluster-0-1-0",
            "aws_eks": "aws-eks-0-1-0",
            "aws_hosted_cp": "aws-hosted-cp-0-1-0",
            "aws_standalone_cp": "aws-standalone-cp-0-1-0",
            "azure_aks": "azure-aks-0-1-0",
            "azure_hosted_cp": "azure-hosted-cp-0-1-0",
            "azure_standalone_cp": "azure-standalone-cp-0-1-0",
            "openstack_standalone_cp": "openstack-standalone-cp-0-1-0",
            "vsphere_hosted_cp": "vsphere-hosted-cp-0-1-0",
            "vsphere_standalone_cp": "vsphere-standalone-cp-0-1-0"
        }
    if version == "v0.2.0":
        return {
            "adopted_cluster": "adopted-cluster-0-2-0",
            "aws_eks": "aws-eks-0-2-0",
            "aws_hosted_cp": "aws-hosted-cp-0-2-0",
            "aws_standalone_cp": "aws-standalone-cp-0-2-0",
            "azure_aks": "azure-aks-0-2-0",
            "azure_hosted_cp": "azure-hosted-cp-0-2-0",
            "azure_standalone_cp": "azure-standalone-cp-0-2-0",
            "docker_hosted_cp": "docker-hosted-cp-0-2-0",
            "gcp_gke": "gcp-gke-0-2-0",
            "gcp_hosted_cp": "gcp-hosted-cp-0-2-0",
            "gcp_standalone_cp": "gcp-standalone-cp-0-2-0",
            "openstack_standalone_cp": "openstack-standalone-cp-0-2-0",
            "remote_cluster": "remote-cluster-0-2-0",
            "vsphere_hosted_cp": "vsphere-hosted-cp-0-2-0",
            "vsphere_standalone_cp": "vsphere-standalone-cp-0-2-0"
        }
    if version == "v0.3.0":
        return {
            "adopted_cluster": "adopted-cluster-0-2-0",
            "aws_eks": "aws-eks-0-2-0",
            "aws_hosted_cp": "aws-hosted-cp-0-2-1",
            "aws_standalone_cp": "aws-standalone-cp-0-2-1",
            "azure_aks": "azure-aks-0-2-0",
            "azure_hosted_cp": "azure-hosted-cp-0-2-2",
            "azure_standalone_cp": "azure-standalone-cp-0-2-2",
            "docker_hosted_cp": "docker-hosted-cp-0-2-0",
            "gcp_gke": "gcp-gke-0-2-0",
            "gcp_hosted_cp": "gcp-hosted-cp-0-2-1",
            "gcp_standalone_cp": "gcp-standalone-cp-0-2-1",
            "openstack_standalone_cp": "openstack-standalone-cp-0-2-2",
            "remote_cluster": "remote-cluster-0-2-1",
            "vsphere_hosted_cp": "vsphere-hosted-cp-0-2-1",
            "vsphere_standalone_cp": "vsphere-standalone-cp-0-2-1"
        }
    if version == "v1.0.0":
        return {
            "adopted_cluster": "adopted-cluster-1-0-0",
            "aws_eks": "aws-eks-1-0-0",
            "aws_hosted_cp": "aws-hosted-cp-1-0-0",
            "aws_standalone_cp": "aws-standalone-cp-1-0-0",
            "azure_aks": "azure-aks-1-0-0",
            "azure_hosted_cp": "azure-hosted-cp-1-0-0",
            "azure_standalone_cp": "azure-standalone-cp-1-0-0",
            "docker_hosted_cp": "docker-hosted-cp-1-0-0",
            "gcp_gke": "gcp-gke-1-0-0",
            "gcp_hosted_cp": "gcp-hosted-cp-1-0-0",
            "gcp_standalone_cp": "gcp-standalone-cp-1-0-0",
            "openstack_standalone_cp": "openstack-standalone-cp-1-0-0",
            "remote_cluster": "remote-cluster-1-0-0",
            "vsphere_hosted_cp": "vsphere-hosted-cp-1-0-0",
            "vsphere_standalone_cp": "vsphere-standalone-cp-1-0-0"
        }
    if version == "v1.1.0":
        return {
            "adopted_cluster": "adopted-cluster-1-0-1",
            "aws_eks": "aws-eks-1-0-2",
            "aws_hosted_cp": "aws-hosted-cp-1-0-9",
            "aws_standalone_cp": "aws-standalone-cp-1-0-10",
            "azure_aks": "azure-aks-1-0-1",
            "azure_hosted_cp": "azure-hosted-cp-1-0-8",
            "azure_standalone_cp": "azure-standalone-cp-1-0-8",
            "docker_hosted_cp": "docker-hosted-cp-1-0-2",
            "gcp_gke": "gcp-gke-1-0-3",
            "gcp_hosted_cp": "gcp-hosted-cp-1-0-9",
            "gcp_standalone_cp": "gcp-standalone-cp-1-0-9",
            "openstack_standalone_cp": "openstack-standalone-cp-1-0-9",
            "remote_cluster": "remote-cluster-1-0-8",
            "vsphere_hosted_cp": "vsphere-hosted-cp-1-0-8",
            "vsphere_standalone_cp": "vsphere-standalone-cp-1-0-9"
        }
    if version == "v1.1.1":
        return {
            "adopted_cluster": "adopted-cluster-1-0-1",
            "aws_eks": "aws-eks-1-0-2",
            "aws_hosted_cp": "aws-hosted-cp-1-0-9",
            "aws_standalone_cp": "aws-standalone-cp-1-0-10",
            "azure_aks": "azure-aks-1-0-1",
            "azure_hosted_cp": "azure-hosted-cp-1-0-8",
            "azure_standalone_cp": "azure-standalone-cp-1-0-8",
            "docker_hosted_cp": "docker-hosted-cp-1-0-2",
            "gcp_gke": "gcp-gke-1-0-3",
            "gcp_hosted_cp": "gcp-hosted-cp-1-0-9",
            "gcp_standalone_cp": "gcp-standalone-cp-1-0-9",
            "openstack_standalone_cp": "openstack-standalone-cp-1-0-9",
            "remote_cluster": "remote-cluster-1-0-8",
            "vsphere_hosted_cp": "vsphere-hosted-cp-1-0-8",
            "vsphere_standalone_cp": "vsphere-standalone-cp-1-0-9"
        }
    if version == "v1.2.0":
        return {
            "adopted_cluster": "adopted-cluster-1-0-1",
            "aws_eks": "aws-eks-1-0-3",
            "aws_hosted_cp": "aws-hosted-cp-1-0-12",
            "aws_standalone_cp": "aws-standalone-cp-1-0-12",
            "azure_aks": "azure-aks-1-0-1",
            "azure_hosted_cp": "azure-hosted-cp-1-0-14",
            "azure_standalone_cp": "azure-standalone-cp-1-0-13",
            "docker_hosted_cp": "docker-hosted-cp-1-0-2",
            "gcp_gke": "gcp-gke-1-0-4",
            "gcp_hosted_cp": "gcp-hosted-cp-1-0-14",
            "gcp_standalone_cp": "gcp-standalone-cp-1-0-12",
            "openstack_hosted_cp": "openstack-hosted-cp-1-0-3",
            "openstack_standalone_cp": "openstack-standalone-cp-1-0-13",
            "remote_cluster": "remote-cluster-1-0-12",
            "vsphere_hosted_cp": "vsphere-hosted-cp-1-0-11",
            "vsphere_standalone_cp": "vsphere-standalone-cp-1-0-11"
        }
    raise Exception(f"Unsupported version '{version}' found")


def ensure_big_logo(metadata: dict):
    if 'logo_big' not in metadata:
        metadata['logo_big'] = metadata['logo']


def kgst_install(chart_name: str, chart_version: str, kcm_version: str, enterprise: bool):
    kgst = 'oci://ghcr.io/k0rdent/catalog/charts/kgst'
    k0rdentAPIFlag = ''
    if enterprise:
        kgst = "oci://registry.mirantis.com/k0rdent-enterprise-catalog/kgst"
    if kcm_version in ['v0.1.0', 'v0.2.0', 'v0.3.0']:
        k0rdentAPIFlag = '\\\n  --set "k0rdentApiVersion=v1alpha1" '
    return f'helm upgrade --install {chart_name} {kgst} --set "chart={chart_name}:{chart_version}" {k0rdentAPIFlag}-n kcm-system'


def ensure_install_code(metadata: dict):
    if 'install_code' in metadata:
        return
    if 'charts' not in metadata:
        return

    install_code_lines = ['~~~bash']
    for chart in metadata['charts']:
        enterprise = metadata.get('support_type') == 'Enterprise'
        install_code_lines.append(kgst_install(chart['name'], chart['versions'][0], VERSION, enterprise))
    install_code_lines.append('~~~')
    metadata['install_code'] = '\n'.join(install_code_lines)


def ensure_verify_code(metadata: dict):
    if 'verify_code' in metadata:
        return
    if 'charts' not in metadata:
        return

    verify_code_lines = ['~~~bash']
    verify_code_lines.append('kubectl get servicetemplates -A')
    verify_code_lines.append('# NAMESPACE    NAME                            VALID')
    for chart in metadata['charts']:
        template_name = f"{chart['name']}-{chart['versions'][0].replace('.', '-')}".ljust(32)
        verify_code_lines.append(f"# kcm-system   {template_name}true")
    verify_code_lines.append('~~~')
    metadata['verify_code'] = '\n'.join(verify_code_lines)


def metadata_support_type(metadata: dict):
    support_type = metadata.get("support_type", "Community")
    if support_type == 'Partner':
        support_type = 'Enterprise' # Temporarily map 'Partner' to 'Enterprise' in web
    return support_type


def json_metadata_item(metadata: dict, app: str, is_infra: bool) -> dict:
    item = {
        "link": os.path.join('.', 'infra' if is_infra else 'apps', app),
        "title": metadata.get("title", "No Title"),
        "type": metadata.get("type", " "),
        "logo": metadata.get("logo", " "),
        "tags": metadata.get("tags", []),
        "created": metadata.get("created", " "),
        "support_type": metadata_support_type(metadata),
        "description": metadata.get("summary", "No Description"),
        "appDir": app,
    }
    return item


def generate_apps():
    apps_dir = 'apps'
    dst_dir = 'mkdocs'
    template_path = 'mkdocs/app.tpl.md'
    json_metadata = []

    base_metadata = dict(
        version=VERSION
    )
    base_metadata.update(version2template_names(VERSION))

    # Read template
    with open(template_path, 'r', encoding='utf-8') as f:
        template_content = f.read()
    template = jinja2.Template(template_content)

    # Iterate over each app directory
    for app in os.listdir(apps_dir):
        app_path = os.path.join(apps_dir, app)
        data_file = os.path.join(app_path, 'data.yaml')
        metadata = dict()
        if os.path.isdir(app_path) and os.path.exists(data_file):
            with open(data_file, 'r', encoding='utf-8') as f:
                metadata_tpl = jinja2.Template(f.read())
                metadata_str = metadata_tpl.render(**base_metadata)
                metadata = yaml.safe_load(metadata_str)
                validate_metadata(data_file, metadata)
                ensure_big_logo(metadata)
                ensure_install_code(metadata)
                ensure_verify_code(metadata)
                metadata.update(base_metadata)
        else:
            continue
        if 'exclude_versions' in metadata and VERSION in metadata['exclude_versions']:
            print(f"Skip {app} in version {VERSION}")
            continue
        dst_app_path = os.path.join(dst_dir, app_path)
        is_infra = metadata.get("type", "app") == "infra"
        if is_infra:
            dst_app_path = dst_app_path.replace("/apps/", "/infra/")
        json_metadata.append(json_metadata_item(metadata, app, is_infra))
        if not os.path.exists(dst_app_path):
            os.makedirs(dst_app_path)
        md_file = os.path.join(dst_app_path, 'index.md')
        try_copy_assets(app, apps_dir, dst_dir, is_infra)
        # Render the template with metadata
        rendered_md = template.render(**metadata)
        if changed(md_file, rendered_md):
            # Write the generated markdown
            with open(md_file, 'w', encoding='utf-8') as f:
                f.write(rendered_md)
        with mkdocs_gen_files.open("fetched_metadata.json", "w") as f:
            json.dump(json_metadata, f, indent=2)

generate_apps()
