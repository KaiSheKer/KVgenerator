#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

echo "========================================="
echo "KV Generator Deployment Verification"
echo "========================================="

echo "Checking key files for one-pass chain..."
REQUIRED_FILES=(
  "lib/utils/promptGenerator.ts"
  "lib/api/gemini.ts"
  "lib/api/nanobanana.ts"
  "app/api/analyze/route.ts"
  "app/api/generate/route.ts"
  "app/prompts/page.tsx"
  "app/generate/page.tsx"
)

for file in "${REQUIRED_FILES[@]}"; do
  if [ -f "$file" ]; then
    echo "  [OK] $file"
  else
    echo "  [MISSING] $file"
    exit 1
  fi
done

echo "Running static checks..."
npm run test

echo "Build check..."
npm run build

echo "Quick port check..."
if lsof -ti:3000 >/dev/null 2>&1; then
  echo "  [OK] http://localhost:3000 is active"
else
  echo "  [WARN] Port 3000 is not active (run npm run dev)"
fi

echo "========================================="
echo "Verification complete"
echo "========================================="
