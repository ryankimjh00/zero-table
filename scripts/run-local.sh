#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
export API_CONFIG_PATH="${API_CONFIG_PATH:-$PWD/.local/api-config.json}"
./mvnw -q package
exec java -jar target/zero-table-api.jar "$@"
