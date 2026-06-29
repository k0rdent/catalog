# k0rdent-catalog-web container image
# Multi-stage build: generate data + build SPA → serve with nginx

# Stage 1: Build
FROM node:22 AS build

# Install Python
RUN apt-get update && apt-get install -y --no-install-recommends python3 python3-pip python3-venv && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /catalog
COPY scripts/requirements.txt scripts/requirements.txt
RUN pip3 install --break-system-packages -r scripts/requirements.txt

COPY . .

# Generate catalog data for all versions
RUN bash scripts/build-catalog-data.sh

# Build the React SPA
ENV BASE_PATH=/latest/
RUN bash scripts/build-spa.sh

# Assemble the deploy directory
RUN bash scripts/assemble-deploy.sh

# Stage 2: Serve
FROM nginx:alpine

COPY --from=build /catalog/tsweb/deploy/ /usr/share/nginx/html/
COPY scripts/container/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

LABEL org.opencontainers.image.source="https://github.com/k0rdent/catalog"
LABEL org.opencontainers.image.description="k0rdent Catalog Web UI"
