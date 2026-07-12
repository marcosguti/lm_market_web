#!/usr/bin/env bash
set -euo pipefail
source ~/.nvm/nvm.sh
nvm use 22
cd /home/marco/lm_market_web

find src -path '*/test/*.test.*' | sort | while read -r f; do
  case "$f" in
    src/api/*|src/utils/*|src/constants/*|src/types/*) continue ;;
  esac
  echo "=== $f ==="
  if timeout 30 npm run test:ui -- "$f" > /tmp/ui-bisect.out 2>&1; then
    tail -2 /tmp/ui-bisect.out
  else
    echo "TIMEOUT/FAIL: $f"
    tail -10 /tmp/ui-bisect.out
  fi
done
