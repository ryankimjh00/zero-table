#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p docs
java -jar target/zero-table-api.jar --spring.main.web-application-type=none --app.command=catalog --app.schedule-enabled=false
curl -fsS "${API_BASE_URL:-http://localhost:8080}/v3/api-docs" -o docs/openapi.json
curl -fsS "${API_BASE_URL:-http://localhost:8080}/v3/api-docs.yaml" -o docs/openapi.yaml
echo '데이터 사전 및 OpenAPI JSON/YAML 갱신 완료'
