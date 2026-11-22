#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
export LOCAL_UID="$(id -u)"
export LOCAL_GID="$(id -g)"
mkdir -p data
./mvnw -q package
exec docker compose up --build "$@"
