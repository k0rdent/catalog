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
