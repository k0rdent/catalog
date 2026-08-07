"""Unit tests for scripts/scan_app.py (pure parsing helpers only)."""
import scan_app


def test_is_valid_image_ref_accepts_registry_paths():
    assert scan_app._is_valid_image_ref("ghcr.io/k0rdent/catalog:1.0") is True
    assert scan_app._is_valid_image_ref("library/nginx") is True
    assert scan_app._is_valid_image_ref("registry.example.com/app") is True


def test_is_valid_image_ref_rejects_bare_names():
    assert scan_app._is_valid_image_ref("nginx") is False
    assert scan_app._is_valid_image_ref("busybox") is False


def test_is_valid_image_ref_rejects_templated():
    assert scan_app._is_valid_image_ref("{{ .Values.image }}") is False
    assert scan_app._is_valid_image_ref("ghcr.io/{{ .Values.repo }}") is False


def test_parse_images_extracts_and_sorts_unique():
    rendered = """
    spec:
      containers:
        - image: ghcr.io/k0rdent/traefik:41.0.2
        - image: "docker.io/library/nginx:1.25"
        - image: ghcr.io/k0rdent/traefik:41.0.2
    """
    images = scan_app._parse_images(rendered)
    assert images == [
        "docker.io/library/nginx:1.25",
        "ghcr.io/k0rdent/traefik:41.0.2",
    ]


def test_parse_images_skips_bare_and_templated():
    rendered = """
        - image: nginx
        - image: {{ .Values.image.repository }}
        - image: quay.io/prometheus/prometheus:v2.0
    """
    images = scan_app._parse_images(rendered)
    assert images == ["quay.io/prometheus/prometheus:v2.0"]


def test_parse_images_empty_when_none():
    assert scan_app._parse_images("no images here") == []
