"""Unit tests for scripts/chart_ctl.py (pure logic only)."""
import chart_ctl


def test_semver_parts_valid():
    assert chart_ctl._semver_parts("1.2.3") == (1, 2, 3)
    assert chart_ctl._semver_parts("v1.2.3") == (1, 2, 3)
    assert chart_ctl._semver_parts("10.0.11") == (10, 0, 11)


def test_semver_parts_extra_components():
    # Only the first three numeric components matter.
    assert chart_ctl._semver_parts("1.2.3.4") == (1, 2, 3)


def test_semver_parts_invalid_returns_none():
    assert chart_ctl._semver_parts("1.2") is None
    assert chart_ctl._semver_parts("abc") is None
    assert chart_ctl._semver_parts("1.2.x") is None


def test_service_template_name():
    assert chart_ctl.service_template_name("traefik", "41.0.2") == "traefik-41-0-2"


def test_try_ignore_prefix_v_strips_when_prev_has_no_v():
    chart = {"version": "v1.2.3"}
    chart_ctl.try_ignore_prefix_v(chart, "1.2.2")
    assert chart["version"] == "1.2.3"


def test_try_ignore_prefix_v_keeps_when_prev_has_v():
    chart = {"version": "v1.2.3"}
    chart_ctl.try_ignore_prefix_v(chart, "v1.2.2")
    assert chart["version"] == "v1.2.3"


def test_get_last_deps_dedups_by_dep_name():
    cfg = {
        "st-charts": [
            {"dep_name": "traefik", "version": "1.0.0"},
            {"dep_name": "openebs", "version": "4.5.1"},
            {"dep_name": "traefik", "version": "2.0.0"},
        ]
    }
    last = chart_ctl.get_last_deps(cfg)
    assert set(last.keys()) == {"traefik", "openebs"}
    # Later entry wins.
    assert last["traefik"]["version"] == "2.0.0"


def test_prune_old_patches_keeps_latest_patch_per_minor():
    charts = [
        {"dep_name": "a", "name": "a", "version": "1.0.0"},
        {"dep_name": "a", "name": "a", "version": "1.0.5"},
        {"dep_name": "a", "name": "a", "version": "1.1.2"},
        {"dep_name": "b", "name": "b", "version": "2.0.1"},
    ]
    # app dir does not exist -> no filesystem removal happens, only list logic.
    pruned = chart_ctl.prune_old_patches("nonexistent-app", charts)
    versions = sorted((c["dep_name"], c["version"]) for c in pruned)
    assert versions == [("a", "1.0.5"), ("a", "1.1.2"), ("b", "2.0.1")]


def test_prune_old_patches_keeps_non_semver():
    charts = [
        {"dep_name": "a", "name": "a", "version": "main"},
        {"dep_name": "a", "name": "a", "version": "1.0.0"},
        {"dep_name": "a", "name": "a", "version": "1.0.1"},
    ]
    pruned = chart_ctl.prune_old_patches("nonexistent-app", charts)
    versions = sorted(c["version"] for c in pruned)
    assert versions == ["1.0.1", "main"]


def test_oci_registry_path_plain_host():
    assert chart_ctl.oci_registry_path("oci://ghcr.io/kserve/charts", "kserve") == (
        "ghcr.io", "kserve/charts/kserve")


def test_oci_registry_path_strips_trailing_slash():
    assert chart_ctl.oci_registry_path("oci://ghcr.io/k0rdent/catalog/charts/", "valkey") == (
        "ghcr.io", "k0rdent/catalog/charts/valkey")


def test_oci_registry_path_maps_docker_hub():
    assert chart_ctl.oci_registry_path("oci://docker.io/envoyproxy", "gateway-helm") == (
        "registry-1.docker.io", "envoyproxy/gateway-helm")


def test_oci_registry_path_docker_hub_official_repo():
    # A single path segment on Docker Hub lives under the implicit "library" namespace.
    assert chart_ctl.oci_registry_path("oci://docker.io", "n8n") == (
        "registry-1.docker.io", "library/n8n")


def test_latest_stable_tag_picks_highest():
    assert chart_ctl.latest_stable_tag(["1.2.0", "1.10.0", "1.9.0"]) == "1.10.0"


def test_latest_stable_tag_keeps_v_prefix():
    # Helm's own range resolution drops these; we must not.
    assert chart_ctl.latest_stable_tag(["v0.15.0", "v0.16.0"]) == "v0.16.0"


def test_latest_stable_tag_skips_prereleases():
    assert chart_ctl.latest_stable_tag(["v0.16.0", "v0.17.0-rc0"]) == "v0.16.0"


def test_latest_stable_tag_ignores_non_versions():
    assert chart_ctl.latest_stable_tag(["latest", "main", "sha-abc123", "1.0.0"]) == "1.0.0"


def test_latest_stable_tag_compares_across_v_prefix():
    # Mixed tagging must not hide a newer release behind a prefix difference.
    assert chart_ctl.latest_stable_tag(["1.6.0", "v2.2.1"]) == "v2.2.1"


def test_latest_stable_tag_without_releases():
    assert chart_ctl.latest_stable_tag(["latest", "1.0.0-rc1"]) is None


def test_oci_chart_ref():
    assert chart_ctl.oci_chart_ref("oci://quay.io/strimzi-helm/", "strimzi-kafka-operator") == (
        "oci://quay.io/strimzi-helm/strimzi-kafka-operator")


class _Args:
    def __init__(self, app):
        self.app = app
        self.update_cfg = True
        self.generate_charts = True
        self.update_example = True
        self.rewrite_charts = True


def test_check_updates_skips_generation_when_nothing_changed(monkeypatch, capsys):
    """A no-op run must not rewrite generated files, or it opens a churn PR."""
    cfg = {"st-charts": [{"name": "a", "dep_name": "a", "version": "1.0.0",
                          "repository": "oci://example.com/charts"}]}
    monkeypatch.setattr(chart_ctl, "read_charts_cfg", lambda *a, **k: cfg)
    # Upstream reports the very version we already track.
    monkeypatch.setattr(chart_ctl, "get_latest_chart",
                        lambda chart, repo, current: ("1.0.0", {"appVersion": "v1.0.0"}))
    called = []
    monkeypatch.setattr(chart_ctl, "generate", lambda *a: called.append("generate"))
    monkeypatch.setattr(chart_ctl, "update_example_chart", lambda *a: called.append("example"))
    monkeypatch.setattr(chart_ctl, "update_charts_cfg", lambda *a: called.append("cfg"))

    chart_ctl.check_updates(_Args("demo"))

    assert "generate" not in called
    assert "example" not in called
    assert "No updates found" in capsys.readouterr().out


def test_check_updates_generates_when_version_changed(monkeypatch):
    cfg = {"st-charts": [{"name": "a", "dep_name": "a", "version": "1.0.0",
                          "repository": "oci://example.com/charts"}]}
    monkeypatch.setattr(chart_ctl, "read_charts_cfg", lambda *a, **k: cfg)
    monkeypatch.setattr(chart_ctl, "get_latest_chart",
                        lambda chart, repo, current: ("1.1.0", {"appVersion": "1.1.0"}))
    called = []
    monkeypatch.setattr(chart_ctl, "generate", lambda *a: called.append("generate"))
    monkeypatch.setattr(chart_ctl, "update_example_chart", lambda *a: called.append("example"))
    monkeypatch.setattr(chart_ctl, "update_charts_cfg", lambda *a: called.append("cfg"))

    chart_ctl.check_updates(_Args("demo"))

    assert called == ["cfg", "generate", "example"]


def test_get_latest_chart_oci_records_the_tag(monkeypatch):
    """OCI is addressed by tag, which is not always the chart version."""
    monkeypatch.setattr(chart_ctl, "oci_list_tags", lambda repo, chart: ["v2.2.0", "v2.2.1"])
    monkeypatch.setattr(chart_ctl, "show_chart",
                        lambda ref, version=None: {"version": "v2.2.1", "appVersion": "v2.2.1"})
    version, _ = chart_ctl.get_latest_chart("agentgateway", "oci://cr.example.dev/charts", "1.1.0")
    # Not '2.2.1': stripping the prefix yields a tag that does not exist.
    assert version == "v2.2.1"


def test_get_latest_chart_oci_keeps_tag_differing_from_chart_version(monkeypatch):
    # lws publishes tag '0.11.1' for a chart whose version field is 'v0.11.1'.
    monkeypatch.setattr(chart_ctl, "oci_list_tags", lambda repo, chart: ["0.11.0", "0.11.1"])
    monkeypatch.setattr(chart_ctl, "show_chart",
                        lambda ref, version=None: {"version": "v0.11.1", "appVersion": "v0.11.1"})
    version, _ = chart_ctl.get_latest_chart("lws", "oci://registry.k8s.io/lws/charts", "0.7.0")
    assert version == "0.11.1"


def test_get_latest_chart_https_strips_prefix_v(monkeypatch):
    monkeypatch.setattr(chart_ctl, "get_latest_https_chart",
                        lambda chart, repo: {"version": "v1.2.3", "appVersion": "1.2.3"})
    version, _ = chart_ctl.get_latest_chart("x", "https://example.com/charts", "1.2.2")
    assert version == "1.2.3"


def test_read_known_app_versions(tmp_path):
    charts_file = tmp_path / "charts.yaml"
    charts_file.write_text(
        "charts:\n  mysql-operator:\n  - version: 2.2.3\n    appVersion: 9.2.0-2.2.3\n")
    known = chart_ctl.read_known_app_versions(str(charts_file))
    assert known[("mysql-operator", "2.2.3")] == "9.2.0-2.2.3"


def test_read_known_app_versions_missing_file(tmp_path):
    assert chart_ctl.read_known_app_versions(str(tmp_path / "nope.yaml")) == {}


def test_latest_stable_tag_tiebreak_prefers_recorded_spelling():
    # Both spellings of the same release exist; keep the one already in use.
    assert chart_ctl.latest_stable_tag(["v1.1.0", "1.1.0"], "1.1.0") == "1.1.0"
    assert chart_ctl.latest_stable_tag(["1.1.0", "v1.1.0"], "v1.1.0") == "v1.1.0"


def test_latest_stable_tag_tiebreak_is_order_independent():
    # The registry may return tags in any order; the pick must not depend on it.
    assert (chart_ctl.latest_stable_tag(["v1.1.0", "1.1.0"], "0.9.0")
            == chart_ctl.latest_stable_tag(["1.1.0", "v1.1.0"], "0.9.0"))


def test_latest_stable_tag_tiebreak_follows_current_prefix_style():
    # Not the recorded version itself, but the same style, so the entry stays consistent.
    assert chart_ctl.latest_stable_tag(["1.2.0", "v1.2.0"], "v1.1.0") == "v1.2.0"
    assert chart_ctl.latest_stable_tag(["v1.2.0", "1.2.0"], "1.1.0") == "1.2.0"


def test_latest_stable_tag_tiebreak_without_current_version():
    assert chart_ctl.latest_stable_tag(["v1.1.0", "1.1.0"]) == "1.1.0"


def test_latest_stable_tag_tiebreak_does_not_beat_a_higher_version():
    assert chart_ctl.latest_stable_tag(["1.1.0", "v2.0.0"], "1.1.0") == "v2.0.0"
