"""Unit tests for scripts/utils.py (pure logic only, no cluster/network access)."""
import pytest
import utils
import yaml


def test_get_service_template_replaces_dots():
    assert utils.get_service_template("traefik", "41.0.2") == "traefik-41-0-2"
    assert utils.get_service_template("openebs", "4.5.1") == "openebs-4-5-1"


def test_version2template_names_known_version():
    mapping = utils.version2template_names("v1.10.0")
    assert mapping["adopted_cluster"] == "adopted-cluster-1-0-2"
    assert mapping["aws_eks"] == "aws-eks-1-0-10"


def test_version2template_names_unknown_version_raises():
    with pytest.raises(Exception, match="Unsupported version"):
        utils.version2template_names("v0.0.0-does-not-exist")


def test_chart_2_repos_groups_by_repository():
    chart = {
        "dependencies": [
            {"name": "a", "version": "1.0.0", "repository": "oci://repo-x"},
            {"name": "b", "version": "2.0.0", "repository": "oci://repo-x"},
            {"name": "c", "version": "3.0.0", "repository": "oci://repo-y"},
        ]
    }
    repos = utils.chart_2_repos(chart)
    assert set(repos.keys()) == {"oci://repo-x", "oci://repo-y"}
    assert [d["name"] for d in repos["oci://repo-x"]] == ["a", "b"]
    assert [d["name"] for d in repos["oci://repo-y"]] == ["c"]


def test_get_servicetemplate_install_cmd_default_repo(monkeypatch):
    monkeypatch.delenv("REPO_URL", raising=False)
    charts = [{"name": "traefik", "version": "41.0.2"}]
    cmd = utils.get_servicetemplate_install_cmd("oci://ghcr.io/k0rdent/catalog/charts", charts)
    assert "helm upgrade --install traefik" in cmd
    assert "oci://ghcr.io/k0rdent/catalog/charts/kgst" in cmd
    assert '--set "chart=traefik:41.0.2"' in cmd
    assert "-n kcm-system" in cmd
    # Without REPO_URL there must be no repo override args.
    assert "repo.spec.url" not in cmd


def test_get_servicetemplate_install_cmd_with_repo_url(monkeypatch):
    monkeypatch.setenv("REPO_URL", "oci://ghcr.io/fork/catalog/charts")
    charts = [{"name": "traefik", "version": "41.0.2"}]
    cmd = utils.get_servicetemplate_install_cmd("oci://ghcr.io/k0rdent/catalog/charts", charts)
    assert '--set "repo.spec.url=oci://ghcr.io/fork/catalog/charts"' in cmd
    assert '--set "repo.name=traefik"' in cmd


def test_get_servicetemplate_install_cmd_enterprise_repo_untouched(monkeypatch):
    # Enterprise repo is used verbatim and never gets a REPO_URL override.
    monkeypatch.setenv("REPO_URL", "oci://ghcr.io/fork/catalog/charts")
    enterprise = "oci://registry.mirantis.com/k0rdent-enterprise-catalog"
    charts = [{"name": "app", "version": "1.2.3"}]
    cmd = utils.get_servicetemplate_install_cmd(enterprise, charts)
    assert f"{enterprise}/kgst" in cmd
    assert "repo.spec.url" not in cmd


def test_charts_2_verify_code_lists_templates():
    charts = [
        {"name": "traefik", "version": "41.0.2"},
        {"name": "openebs", "version": "4.5.1"},
    ]
    code = utils.charts_2_verify_code(charts)
    assert "kubectl get servicetemplates -A" in code
    assert "traefik-41-0-2" in code
    assert "openebs-4-5-1" in code
    assert code.startswith("~~~bash")
    assert code.rstrip().endswith("~~~")


def test_chart_2_install_code_wraps_in_bash_fence():
    chart = {"dependencies": [{"name": "a", "version": "1.0.0", "repository": "oci://repo-x"}]}
    code = utils.chart_2_install_code(chart)
    assert code.count("~~~bash") == 1
    assert "helm upgrade --install a" in code


def test_valuesclass_dedents_lines():
    vc = utils.ValuesClass(["    key: value", "    nested:", "      x: 1"])
    assert vc.s == "key: value\nnested:\n  x: 1"


def test_get_chart_values_data_splits_per_dependency(tmp_path):
    values = (
        "traefik:\n"
        "  deployment:\n"
        "    kind: DaemonSet\n"
    )
    (tmp_path / "values.yaml").write_text(values)
    data = utils.get_chart_values_data(str(tmp_path))
    assert "traefik" in data
    joined = "\n".join(data["traefik"])
    assert "deployment:" in joined
    assert "kind: DaemonSet" in joined


def test_get_chart_values_data_missing_file_returns_empty(tmp_path):
    assert utils.get_chart_values_data(str(tmp_path)) == {}


def test_get_mcs_services_yaml_structure():
    chart_data = {"dependencies": [{"name": "traefik", "version": "41.0.2"}]}
    out = utils.get_mcs_services("traefik", chart_data, {})
    services = yaml.safe_load(out)
    assert services[0]["template"] == "traefik-41-0-2"
    assert services[0]["name"] == "traefik"
    assert services[0]["namespace"] == "traefik"


def test_chart_2_mcs_str_produces_valid_yaml(tmp_path):
    (tmp_path / "values.yaml").write_text(
        "traefik:\n  deployment:\n    kind: DaemonSet\n"
    )
    chart_dict = {"dependencies": [{"name": "traefik", "version": "41.0.2"}]}
    out = utils.chart_2_mcs_str(chart_dict, str(tmp_path), "traefik", {})
    # Must be valid, single-document YAML (regression guard against stray
    # indented '...' document-end markers leaking out of the values block).
    docs = list(yaml.safe_load_all(out))
    assert len(docs) == 1
    doc = docs[0]
    assert doc["kind"] == "MultiClusterService"
    assert doc["metadata"]["name"] == "traefik"
    assert doc["spec"]["serviceSpec"]["services"][0]["template"] == "traefik-41-0-2"
