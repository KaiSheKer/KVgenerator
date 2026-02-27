#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

PORT="${PORT:-3000}"
REPORT_DIR="docs/reports"
TIMESTAMP="$(date +%Y%m%d-%H%M%S)"
REPORT_FILE="$REPORT_DIR/local-acceptance-$TIMESTAMP.md"
SERVER_LOG="/tmp/kv-generator-dev-$TIMESTAMP.log"

mkdir -p "$REPORT_DIR"

echo "[1/6] Running lint + typecheck"
npm run test

echo "[2/6] Building app"
npm run build

echo "[3/6] Ensuring local server is available on port $PORT"
SERVER_PID=""
if lsof -ti:"$PORT" >/dev/null 2>&1; then
  echo "Port $PORT is already in use. Reusing existing service."
else
  echo "Starting next dev on port $PORT ..."
  npm run dev -- --hostname 127.0.0.1 --port "$PORT" >"$SERVER_LOG" 2>&1 &
  SERVER_PID=$!

  for _ in {1..45}; do
    if curl -sS "http://127.0.0.1:$PORT" >/dev/null 2>&1; then
      break
    fi
    sleep 1
  done

  if ! curl -sS "http://127.0.0.1:$PORT" >/dev/null 2>&1; then
    echo "Server failed to start. Check log: $SERVER_LOG"
    exit 1
  fi
fi

echo "[4/6] Smoke testing pages"
HOME_STATUS="$(curl -sS -o /tmp/kv_home_$TIMESTAMP.html -w "%{http_code}" "http://127.0.0.1:$PORT/")"
PROMPTS_STATUS="$(curl -sS -o /tmp/kv_prompts_$TIMESTAMP.html -w "%{http_code}" "http://127.0.0.1:$PORT/prompts")"
GENERATE_STATUS="$(curl -sS -o /tmp/kv_generate_$TIMESTAMP.html -w "%{http_code}" "http://127.0.0.1:$PORT/generate")"

echo "[5/6] Smoke testing /api/generate"
API_PAYLOAD='{"prompt":"9:16 vertical poster, clean studio still life with one orange on neutral background, no CTA, no frame.","width":900,"height":1600,"enforceHardConstraints":true}'
API_STATUS="$(curl -sS -o /tmp/kv_api_generate_$TIMESTAMP.json -w "%{http_code}" -H "Content-Type: application/json" -X POST "http://127.0.0.1:$PORT/api/generate" --data "$API_PAYLOAD" || true)"
API_BODY_HEAD="$(head -c 260 /tmp/kv_api_generate_$TIMESTAMP.json 2>/dev/null || true)"

echo "[6/6] Writing report -> $REPORT_FILE"
cat > "$REPORT_FILE" <<REPORT
# Local Acceptance Report ($TIMESTAMP)

## Build and Test
- lint_typecheck: PASS
- build: PASS

## Service
- port: $PORT
- service_started_by_script: $( [ -n "$SERVER_PID" ] && echo "yes (pid=$SERVER_PID)" || echo "no (reused existing service)" )
- server_log: $SERVER_LOG

## Smoke Status
- GET /: $HOME_STATUS
- GET /prompts: $PROMPTS_STATUS
- GET /generate: $GENERATE_STATUS

## API Smoke (/api/generate)
- POST /api/generate: $API_STATUS
- response_head: ${API_BODY_HEAD:-<empty>}

## Model Routing (configured)
- analysis_model: gemini-3-flash-preview (fixed in code)
- image_model: gemini-3-pro-image-preview (fixed in code)
- fallback_switch(KV_IMAGE_FALLBACK_TO_FLASH): ${KV_IMAGE_FALLBACK_TO_FLASH:-false}

## Notes
- This script keeps the dev server running for manual acceptance.
- To stop service: lsof -ti:$PORT | xargs kill
REPORT

echo "Done."
echo "Report: $REPORT_FILE"
echo "Open: http://127.0.0.1:$PORT"
