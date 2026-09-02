#!/bin/bash
# Run wrangler pages dev + Playwright audit in one shot
set -e

cd /home/shijian/projects/shijianus-blog

echo "=== Starting wrangler pages dev on port 8788 ==="
npx wrangler pages dev dist --compatibility-date=2026-04-27 --port=8788 &
WRANGLER_PID=$!
echo "Wrangler PID: $WRANGLER_PID"

# Wait for wrangler to be ready
echo "Waiting for port 8788..."
for i in $(seq 1 30); do
  if ss -tlnp 2>/dev/null | grep -q 8788; then
    echo "Port 8788 is up after ${i}s"
    break
  fi
  sleep 1
done

# Quick API test
echo "=== Quick API test ==="
RESP=$(curl -sf -X POST http://localhost:8788/api/create-checkout-session \
  -H "Content-Type: application/json" \
  -d '{"amount":5,"currency":"usd","country":"US","returnUrl":"https://example.com/?stripe_return=1&session_id={CHECKOUT_SESSION_ID}"}' 2>&1)
echo "API response: ${RESP:0:100}"
if echo "$RESP" | grep -q '"ok":true'; then
  echo "✅ API working"
else
  echo "⚠️ API issue: $RESP"
fi

echo "=== Running Playwright audit ==="
node scripts/audit-v9.cjs

echo "=== Audit done ==="
kill $WRANGLER_PID 2>/dev/null || true
