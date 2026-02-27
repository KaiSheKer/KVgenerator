# Local Acceptance Report (20260227-010959)

## Build and Test
- lint_typecheck: PASS
- build: PASS

## Service
- port: 3010
- service_started_by_script: no (reused existing service)
- server_log: /tmp/kv-generator-dev-20260227-010959.log

## Smoke Status
- GET /: 200
- GET /prompts: 200
- GET /generate: 200

## API Smoke (/api/generate)
- POST /api/generate: 200
- response_head: {"dataUrl":"data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEBLAEsAAD/6xeISlAAAQAAAAEAABd+anVtYgAAAB5qdW1kYzJwYQARABCAAACqADibcQNjMnBhAAAAF1hqdW1iAAAAR2p1bWRjMm1hABEAEIAAAKoAOJtxA3VybjpjMnBhOjUxNDhhMzAyLWY4YzctYTAzYi0xNzA3LTQwODRiMmYxYjVkMQAAABMBanVtYgAAAChqdW1kYzJjc

## Model Routing (configured)
- analysis_model: gemini-3-flash-preview (fixed in code)
- image_model: gemini-3-pro-image-preview (fixed in code)
- fallback_switch(KV_IMAGE_FALLBACK_TO_FLASH): false

## Notes
- This script keeps the dev server running for manual acceptance.
- To stop service: lsof -ti:3010 | xargs kill
