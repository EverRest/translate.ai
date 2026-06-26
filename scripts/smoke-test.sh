#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BASE_URL="${API_BASE_URL:-http://localhost:3000/api/v1}"

echo "==> Smoke test against ${BASE_URL}"

health_code="$(curl -s -o /dev/null -w '%{http_code}' "${BASE_URL%/api/v1}/api/v1/health")"
if [[ "$health_code" != "200" ]]; then
  echo "Health check failed: HTTP $health_code"
  exit 1
fi
echo "OK health"

metrics_code="$(curl -s -o /dev/null -w '%{http_code}' "${BASE_URL%/api/v1}/metrics")"
if [[ "$metrics_code" != "200" ]]; then
  echo "Metrics check failed: HTTP $metrics_code"
  exit 1
fi
echo "OK metrics"

suffix="$(date +%s)"
register_payload="$(cat <<EOF
{"tenantName":"Smoke Org ${suffix}","email":"smoke-${suffix}@example.com","password":"password123"}
EOF
)"

register_response="$(curl -s -X POST "${BASE_URL}/auth/register" \
  -H 'Content-Type: application/json' \
  -d "$register_payload")"

token="$(node -e "const body=JSON.parse(process.argv[1]); if(!body?.data?.accessToken){process.exit(1)}; process.stdout.write(body.data.accessToken)" "$register_response")"

me_code="$(curl -s -o /dev/null -w '%{http_code}' "${BASE_URL}/auth/me" \
  -H "Authorization: Bearer ${token}")"
if [[ "$me_code" != "200" ]]; then
  echo "Auth me failed: HTTP $me_code"
  exit 1
fi
echo "OK register + me"

projects_code="$(curl -s -o /dev/null -w '%{http_code}' "${BASE_URL}/projects" \
  -H "Authorization: Bearer ${token}")"
if [[ "$projects_code" != "200" ]]; then
  echo "Projects list failed: HTTP $projects_code"
  exit 1
fi
echo "OK projects list"

echo "Smoke test passed."
