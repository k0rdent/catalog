"""Unit tests for scripts/update_api_data.py (pure logic only, no HTTP)."""
from datetime import datetime, timedelta, timezone

import pytest
import update_api_data as uad


def test_parse_iso8601_duration_days():
    assert uad.parse_iso8601_duration("P1D") == timedelta(days=1)
    assert uad.parse_iso8601_duration("P7D") == timedelta(days=7)


def test_parse_iso8601_duration_time_components():
    assert uad.parse_iso8601_duration("PT6H") == timedelta(hours=6)
    assert uad.parse_iso8601_duration("PT30M") == timedelta(minutes=30)
    assert uad.parse_iso8601_duration("PT45S") == timedelta(seconds=45)


def test_parse_iso8601_duration_combined():
    assert uad.parse_iso8601_duration("P1DT2H30M") == timedelta(days=1, hours=2, minutes=30)


def test_parse_iso8601_duration_invalid_raises():
    with pytest.raises(ValueError):
        uad.parse_iso8601_duration("1 day")
    with pytest.raises(ValueError):
        uad.parse_iso8601_duration("XYZ")
    with pytest.raises(ValueError):
        uad.parse_iso8601_duration("6H")  # missing leading P


def test_parse_human_count_thousands():
    assert uad.parse_human_count("336k") == 336000
    assert uad.parse_human_count("4.28k") == 4280


def test_parse_human_count_millions():
    assert uad.parse_human_count("1.2m") == 1_200_000


def test_parse_human_count_plain_and_commas():
    assert uad.parse_human_count("42") == 42
    assert uad.parse_human_count("1,234") == 1234


def test_parse_human_count_uppercase_and_whitespace():
    assert uad.parse_human_count("  2K ") == 2000


def _write_yaml(path, text):
    path.write_text(text)
    return str(path)


def test_should_skip_missing_file(tmp_path):
    assert uad.should_skip(str(tmp_path / "missing.yaml"), timedelta(days=1)) is False


def test_should_skip_no_updated_field(tmp_path):
    f = _write_yaml(tmp_path / "data.yaml", "foo: bar\n")
    assert uad.should_skip(f, timedelta(days=1)) is False


def test_should_skip_fresh_data(tmp_path):
    now = datetime.now(timezone.utc).isoformat()
    f = _write_yaml(tmp_path / "data.yaml", f"updated: '{now}'\n")
    assert uad.should_skip(f, timedelta(days=1)) is True


def test_should_skip_stale_data(tmp_path):
    old = (datetime.now(timezone.utc) - timedelta(days=3)).isoformat()
    f = _write_yaml(tmp_path / "data.yaml", f"updated: '{old}'\n")
    assert uad.should_skip(f, timedelta(days=1)) is False
