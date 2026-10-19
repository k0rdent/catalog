#!/bin/bash
# Build kcm from the checkout in KCM_SRC_DIR and serve
# it to the k0rdent cluster. Taken from ksm-tests.

if [[ ! -d "$KCM_SRC_DIR" ]]; then
    echo "KCM_SRC_DIR '$KCM_SRC_DIR' is not a directory"
    exit 1
fi
KCM_DIR="$KCM_SRC_DIR"
KCM_CHART_DIR="$KCM_DIR/templates/provider/kcm"

IMG="${IMG:-localhost/kcm/controller:latest}"
IMG_TELEMETRY="${IMG_TELEMETRY:-localhost/kcm/telemetry:latest}"

# Shared with the local registry so KCM can reach it by container name.
DOCKER_NETWORK="${DOCKER_NETWORK:-k0rdent-net}"
REGISTRY_NAME="${REGISTRY_NAME:-kcm-registry}"
REGISTRY_PORT="${REGISTRY_PORT:-5001}"
REGISTRY_IMAGE="${REGISTRY_IMAGE:-registry:2}"
TEMPLATES_REPO_URL="oci://$REGISTRY_NAME:5000/charts"

container_exists() {
    [[ -n "$(docker ps -a --filter "name=^$1\$" --format '{{.Names}}')" ]]
}

container_running() {
    [[ -n "$(docker ps --filter "name=^$1\$" --format '{{.Names}}')" ]]
}

ensure_network() {
    docker network inspect "$1" >/dev/null 2>&1 || docker network create "$1" >/dev/null
}

connect_network() {
    local network="$1" container="$2"
    if ! docker network inspect "$network" --format '{{range .Containers}}{{.Name}} {{end}}' \
        | tr ' ' '\n' | grep -qx "$container"; then
        docker network connect "$network" "$container"
        echo "Connected '$container' to network '$network'"
    fi
}

# The k0s-in-docker equivalent of `kind load docker-image`.
import_image_into_k0s() {
    local image="$1" container="$2"
    echo "Importing $image into $container"
    docker save "$image" | docker exec -i "$container" k0s ctr -n k8s.io images import - >/dev/null
}

kcm_chart_version() {
    yq -r '.version' "$KCM_CHART_DIR/Chart.yaml"
}

kcm_source_build() {
    echo "Building KCM from $KCM_DIR ($(git -C "$KCM_DIR" describe --tags --always --dirty))"
    # Template names must match the chart versions in this tree.
    make -C "$KCM_DIR" templates-generate
    # The controller looks up kcm-templates by its build version, so it must match the pushed chart.
    make -C "$KCM_DIR" docker-build IMG="$IMG" IMG_TELEMETRY="$IMG_TELEMETRY" VERSION="$(kcm_chart_version)"
}

kcm_registry_deploy() {
    ensure_network "$DOCKER_NETWORK"
    if container_exists "$REGISTRY_NAME"; then
        container_running "$REGISTRY_NAME" || docker start "$REGISTRY_NAME" >/dev/null
        REGISTRY_PORT="$(docker port "$REGISTRY_NAME" 5000 | head -1 | awk -F: '{print $NF}')"
    else
        docker run -d --restart=always \
            --name "$REGISTRY_NAME" \
            --network "$DOCKER_NETWORK" \
            -p "127.0.0.1:$REGISTRY_PORT:5000" \
            "$REGISTRY_IMAGE" >/dev/null
    fi
    connect_network "$DOCKER_NETWORK" "$REGISTRY_NAME"
    until curl -fsS "http://127.0.0.1:$REGISTRY_PORT/v2/" -o /dev/null; do
        sleep 2
    done
    echo "Registry ready: push to oci://127.0.0.1:$REGISTRY_PORT/charts, cluster reads $TEMPLATES_REPO_URL"
}

# Images go into the node's containerd, template charts into the local registry.
kcm_source_push() {
    local container="$1"
    import_image_into_k0s "$IMG" "$container"
    import_image_into_k0s "$IMG_TELEMETRY" "$container"
    # helm-push skips versions already in the registry, so re-runs are cheap.
    make -C "$KCM_DIR" helm-push REGISTRY_REPO="oci://127.0.0.1:$REGISTRY_PORT/charts"
}

# Points the deployments at the built images and KCM at the local registry.
kcm_source_values() {
    local file="$1"
    cat > "$file" <<EOF
image:
  repository: ${IMG%:*}
  tag: ${IMG##*:}
  pullPolicy: IfNotPresent
controller:
  templatesRepoURL: $TEMPLATES_REPO_URL
  insecureRegistry: true
regional:
  telemetry:
    controller:
      image:
        repository: ${IMG_TELEMETRY%:*}
        tag: ${IMG_TELEMETRY##*:}
        pullPolicy: IfNotPresent
EOF
}
