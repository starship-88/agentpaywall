#!/usr/bin/env bash
# Local demo: stub 402 → pay → 200, then optional adversarial cap hit.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
API_HOST="${API_HOST:-127.0.0.1}"
API_PORT="${API_PORT:-40211}"
BASE="http://$API_HOST:$API_PORT"

if [[ -f "$ROOT/.env" ]]; then
  set -a
  # shellcheck disable=SC1091
  source "$ROOT/.env"
  set +a
fi

if ! curl -sf "$BASE/health" >/dev/null; then
  echo "API is not running at $BASE"
  echo "Start it: npm run dev:api"
  exit 1
fi

echo "==> status"
curl -s "$BASE/v1/status" | head -c 800
echo
echo

echo "==> unpaid GET /v1/fx (expect 402)"
curl -sS -D - "$BASE/v1/fx?pair=USD-MXN" -o /tmp/agentpaywall-fx.json | head -n 20
echo "body:"
head -c 400 /tmp/agentpaywall-fx.json
echo
echo

echo "==> agent pays once"
node "$ROOT/packages/agent/src/index.js" --pair USD-MXN --verbose

if [[ "${1:-}" == "--until-cap" ]]; then
  echo
  echo "==> adversarial: pay until cap"
  node "$ROOT/packages/agent/src/index.js" --pair USD-MXN --until-cap
fi

echo
echo "Web UI: npm run dev:web  (http://127.0.0.1:${WEB_PORT:-41791})"
echo "Judges: docs/JUDGES.md"
