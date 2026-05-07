#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
POSTGRES_FORMULA="${POSTGRES_FORMULA:-postgresql@16}"
WEB_HOST="${WEB_HOST:-127.0.0.1}"
WEB_PORT="${WEB_PORT:-3000}"
CRM_HOST="${CRM_HOST:-127.0.0.1}"
CRM_PORT="${CRM_PORT:-3002}"
CRM_DB_HOST="${CRM_DB_HOST:-127.0.0.1}"
CRM_DB_PORT="${CRM_DB_PORT:-5433}"
CRM_DB_USER="${CRM_DB_USER:-$(id -un)}"
CRM_DB_PASSWORD="${CRM_DB_PASSWORD-}"
CRM_DB_NAME="${CRM_DB_NAME:-nba}"
CRM_DB_SCHEMA="${CRM_DB_SCHEMA:-crm}"

STARTED_PIDS=()
CLEANED_UP=0

log() {
  printf '[crm-web] %s\n' "$*"
}

is_listening() {
  nc -z "$1" "$2" >/dev/null 2>&1
}

wait_for_port() {
  local host="$1"
  local port="$2"
  local service_name="$3"
  local retries="${4:-40}"
  local attempt=1

  while [ "$attempt" -le "$retries" ]; do
    if is_listening "$host" "$port"; then
      return 0
    fi

    sleep 1
    attempt=$((attempt + 1))
  done

  log "$service_name did not become ready on $host:$port"
  return 1
}

cleanup() {
  if [ "$CLEANED_UP" -eq 1 ]; then
    return
  fi

  CLEANED_UP=1

  local exit_code=$?

  if [ "${#STARTED_PIDS[@]}" -gt 0 ]; then
    log "Stopping started services..."
    kill "${STARTED_PIDS[@]}" >/dev/null 2>&1 || true
  fi

  exit "$exit_code"
}

trap cleanup INT TERM EXIT

ensure_local_postgres() {
  if is_listening "$CRM_DB_HOST" "$CRM_DB_PORT"; then
    log "PostgreSQL is already listening on $CRM_DB_HOST:$CRM_DB_PORT"
    return 0
  fi

  if [ "$CRM_DB_HOST" != "127.0.0.1" ] && [ "$CRM_DB_HOST" != "localhost" ]; then
    log "CRM_DB_HOST=$CRM_DB_HOST is not reachable and cannot be auto-started."
    return 1
  fi

  if ! command -v brew >/dev/null 2>&1; then
    log "Homebrew is unavailable, and PostgreSQL is not running on $CRM_DB_HOST:$CRM_DB_PORT."
    return 1
  fi

  local formula_prefix
  formula_prefix="$(brew --prefix "$POSTGRES_FORMULA" 2>/dev/null || true)"

  if [ -z "$formula_prefix" ] || [ ! -x "$formula_prefix/bin/pg_ctl" ]; then
    log "$POSTGRES_FORMULA is not installed. Install it with: brew install $POSTGRES_FORMULA"
    return 1
  fi

  local homebrew_prefix
  homebrew_prefix="$(brew --prefix)"

  local pgdata
  pgdata="${PGDATA:-$homebrew_prefix/var/$POSTGRES_FORMULA}"

  if [ ! -f "$pgdata/PG_VERSION" ]; then
    log "PGDATA is not initialized at $pgdata"
    log "Run once: $formula_prefix/bin/initdb -D $pgdata"
    return 1
  fi

  local logfile
  logfile="${TMPDIR:-/tmp}/nba-crm-postgres.log"

  log "Starting PostgreSQL from $pgdata on port $CRM_DB_PORT"
  "$formula_prefix/bin/pg_ctl" -D "$pgdata" -l "$logfile" -o "-p $CRM_DB_PORT" start >/dev/null
  wait_for_port "$CRM_DB_HOST" "$CRM_DB_PORT" "PostgreSQL"
}

start_crm_api() {
  if is_listening "$CRM_HOST" "$CRM_PORT"; then
    log "CRM API is already listening on http://$CRM_HOST:$CRM_PORT"
    return 0
  fi

  log "Starting CRM API on http://$CRM_HOST:$CRM_PORT"
  (
    cd "$ROOT_DIR"
    CRM_HOST="$CRM_HOST" \
    CRM_PORT="$CRM_PORT" \
    CRM_DB_HOST="$CRM_DB_HOST" \
    CRM_DB_PORT="$CRM_DB_PORT" \
    CRM_DB_USER="$CRM_DB_USER" \
    CRM_DB_PASSWORD="$CRM_DB_PASSWORD" \
    CRM_DB_NAME="$CRM_DB_NAME" \
    CRM_DB_SCHEMA="$CRM_DB_SCHEMA" \
    CRM_DB_SYNC=true \
    pnpm --filter @nba/crm dev
  ) &
  STARTED_PIDS+=("$!")

  wait_for_port "$CRM_HOST" "$CRM_PORT" "CRM API"
}

start_web() {
  if is_listening "$WEB_HOST" "$WEB_PORT"; then
    log "Web is already listening on http://$WEB_HOST:$WEB_PORT"
    return 0
  fi

  log "Starting Web on http://$WEB_HOST:$WEB_PORT"
  (
    cd "$ROOT_DIR/apps/web"
    NUXT_CRM_API_BASE="http://$CRM_HOST:$CRM_PORT" \
    pnpm exec nuxt dev --host "$WEB_HOST" --port "$WEB_PORT"
  ) &
  STARTED_PIDS+=("$!")

  wait_for_port "$WEB_HOST" "$WEB_PORT" "Web"
}

monitor_started_processes() {
  if [ "${#STARTED_PIDS[@]}" -eq 0 ]; then
    return 0
  fi

  while true; do
    for pid in "${STARTED_PIDS[@]}"; do
      if ! kill -0 "$pid" >/dev/null 2>&1; then
        wait "$pid"
        return $?
      fi
    done

    sleep 1
  done
}

ensure_local_postgres
start_crm_api
start_web

log "CRM Web is ready:"
log "  - CRM page: http://$WEB_HOST:$WEB_PORT/crm"
log "  - CRM API:  http://$CRM_HOST:$CRM_PORT/health"
log "  - DB:       postgres://$CRM_DB_USER@$CRM_DB_HOST:$CRM_DB_PORT/$CRM_DB_NAME"

monitor_started_processes
