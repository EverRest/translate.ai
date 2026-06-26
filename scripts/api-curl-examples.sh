#!/usr/bin/env bash
# translate.ai — ready curl examples for local Docker (localhost:3000)
# Usage:
#   source scripts/api-curl-examples.sh && login && create_job_inline
#   ./scripts/api-curl-examples.sh login

set -euo pipefail

BASE="${BASE:-http://localhost:3000/api/v1}"
EMAIL="${EMAIL:-admin@translate.ai}"
PASSWORD="${PASSWORD:-admin123}"

# From Settings → Profile / Organization
TENANT_ID="${TENANT_ID:-e30f2506-1b79-46c8-9cf6-af55de97ace0}"
USER_ID="${USER_ID:-7efbd145-7cd4-4fc3-b070-0fe551e8ed6b}"

# Project "test" (GET /projects)
PROJECT_ID="${PROJECT_ID:-abb78b08-5d78-4ca3-8e00-1d81db8f6013}"

json_field() {
  python3 -c "import sys,json; d=json.load(sys.stdin); print($1)" 2>/dev/null
}

login() {
  echo "→ POST /auth/login"
  TOKEN=$(curl -s -X POST "$BASE/auth/login" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}" \
    | json_field "d['data']['accessToken']")
  export TOKEN
  echo "TOKEN set (expires in ~1h)"
}

health() {
  echo "→ GET /health (no auth)"
  curl -s "$BASE/health" | python3 -m json.tool
}

me() {
  echo "→ GET /auth/me"
  curl -s "$BASE/auth/me" -H "Authorization: Bearer $TOKEN" | python3 -m json.tool
}

list_projects() {
  echo "→ GET /projects"
  curl -s "$BASE/projects" -H "Authorization: Bearer $TOKEN" | python3 -m json.tool
}

create_project() {
  local name="${1:-My project}"
  echo "→ POST /projects"
  curl -s -X POST "$BASE/projects" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"name\":\"$name\",\"description\":\"Created via curl\"}" | python3 -m json.tool
}

add_language() {
  local code="${1:-de}"
  echo "→ POST /projects/$PROJECT_ID/languages"
  curl -s -X POST "$BASE/projects/$PROJECT_ID/languages" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"code\":\"$code\"}" | python3 -m json.tool
}

add_key() {
  local key="${1:-greeting.hello}"
  local text="${2:-Hello world}"
  echo "→ POST /projects/$PROJECT_ID/keys"
  curl -s -X POST "$BASE/projects/$PROJECT_ID/keys" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"key\":\"$key\",\"sourceText\":\"$text\"}" | python3 -m json.tool
}

create_api_key() {
  local name="${1:-integration}"
  echo "→ POST /projects/$PROJECT_ID/api-keys"
  local resp
  resp=$(curl -s -X POST "$BASE/projects/$PROJECT_ID/api-keys" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"name\":\"$name\"}")
  echo "$resp" | python3 -m json.tool
  API_KEY=$(echo "$resp" | json_field "d['data']['secret']")
  export API_KEY
  echo "API_KEY set — copy now, shown once"
}

add_webhook() {
  local url="${1:-https://example.com/webhooks/translate}"
  echo "→ POST /projects/$PROJECT_ID/webhooks"
  curl -s -X POST "$BASE/projects/$PROJECT_ID/webhooks" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"url\":\"$url\",\"enabled\":true}" | python3 -m json.tool
}

# Catalog flow: keys must exist on project (add_key first)
create_job_catalog() {
  local provider="${1:-ollama}"
  echo "→ POST /jobs (JWT + existing keys)"
  curl -s -X POST "$BASE/jobs" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "{
      \"projectId\": \"$PROJECT_ID\",
      \"languages\": [\"de\", \"fr\"],
      \"keys\": [\"greeting.hello\"],
      \"provider\": \"$provider\"
    }" | python3 -m json.tool
}

# Inline flow: auto-creates keys + languages (no pre-setup)
create_job_inline() {
  local auth="${1:-jwt}"
  local provider="${2:-ollama}"
  echo "→ POST /jobs (inline keyItems, auth=$auth)"
  if [[ "$auth" == "api_key" ]]; then
    [[ -n "${API_KEY:-}" ]] || { echo "Run create_api_key first"; return 1; }
    curl -s -X POST "$BASE/jobs" \
      -H "Authorization: Bearer $API_KEY" \
      -H "Content-Type: application/json" \
      -d "{
        \"languages\": [\"de\"],
        \"keyItems\": [
          { \"key\": \"greeting.hello\", \"sourceText\": \"Hello world\" },
          { \"key\": \"cart.checkout\", \"sourceText\": \"Checkout\" }
        ],
        \"provider\": \"$provider\"
      }" | python3 -m json.tool
  else
    curl -s -X POST "$BASE/jobs" \
      -H "Authorization: Bearer $TOKEN" \
      -H "Content-Type: application/json" \
      -d "{
        \"projectId\": \"$PROJECT_ID\",
        \"languages\": [\"de\"],
        \"keyItems\": [
          { \"key\": \"greeting.hello\", \"sourceText\": \"Hello world\" },
          { \"key\": \"cart.checkout\", \"sourceText\": \"Checkout\" }
        ],
        \"provider\": \"$provider\"
      }" | python3 -m json.tool
  fi
}

get_job() {
  local job_id="${1:?job id required}"
  local auth_header="${2:-$TOKEN}"
  echo "→ GET /jobs/$job_id"
  curl -s "$BASE/jobs/$job_id" \
    -H "Authorization: Bearer $auth_header" | python3 -m json.tool
}

export_translations() {
  local lang="${1:-de}"
  echo "→ GET /projects/$PROJECT_ID/export?format=json&language=$lang"
  curl -s "$BASE/projects/$PROJECT_ID/export?format=json&language=$lang&status=draft" \
    -H "Authorization: Bearer ${API_KEY:-$TOKEN}"
  echo
}

lookup_translations() {
  echo "→ POST /projects/$PROJECT_ID/translations/lookup"
  curl -s -X POST "$BASE/projects/$PROJECT_ID/translations/lookup" \
    -H "Authorization: Bearer ${API_KEY:-$TOKEN}" \
    -H "Content-Type: application/json" \
    -d '{"items":[{"key":"greeting.hello","language":"de"}]}' | python3 -m json.tool
}

case "${1:-}" in
  login) login ;;
  health) health ;;
  me) login; me ;;
  projects) login; list_projects ;;
  api-key) login; create_api_key "${2:-integration}" ;;
  job-inline) login; create_job_inline jwt "${2:-ollama}" ;;
  job-api-key)
    login
    create_api_key "${2:-integration}"
    create_job_inline api_key "${3:-ollama}"
    ;;
  *)
    cat <<EOF
Commands:
  login          Get JWT → export TOKEN
  health         Health check (no auth)
  me             Profile (needs login)
  projects       List projects
  api-key [name] Create project API key → export API_KEY
  job-inline     Create job with keyItems (JWT)
  job-api-key    Create API key + job with keyItems (API key auth)

When sourced, call functions directly:
  source scripts/api-curl-examples.sh
  login && create_job_inline
  login && add_key cart.total "Total" && create_job_catalog ollama

Env overrides: BASE, EMAIL, PASSWORD, PROJECT_ID, TENANT_ID, USER_ID
EOF
    ;;
esac
