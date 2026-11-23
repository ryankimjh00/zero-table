#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
export API_CONFIG_PATH="${API_CONFIG_PATH:-$PWD/.local/api-config.json}"
exec java -jar target/zero-table-api.jar --spring.main.web-application-type=none --app.schedule-enabled=false --app.command=collect "--app.collection-plan=${1:-./config/collection-plan.json}"
