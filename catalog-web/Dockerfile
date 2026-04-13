FROM python:3.12-slim AS builder
WORKDIR /build
COPY scripts/ scripts/
COPY apps/ apps/
COPY mkdocs/ mkdocs/
COPY overrides/ overrides/
COPY mkdocs.yml .
RUN pip install --no-cache-dir -r scripts/requirements.txt
RUN OUTPUT_DIR=/build/dist ./scripts/build_web.sh

FROM nginx:alpine
COPY catalog-web/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /build/dist/ /usr/share/nginx/html/
EXPOSE 80
