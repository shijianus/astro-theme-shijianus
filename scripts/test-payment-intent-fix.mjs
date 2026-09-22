const ZERO_DECIMAL_CURRENCIES = new Set(['bif','clp','gnf','jpy','kmf','krw','mga','pyg','rwf','ugx','vnd','xaf','xof','xpf']);

function computeStripeAmount(rawAmount, currency = 'usd') {
  const cur = currency.toLowerCase();
  const isZeroDecimal = ZERO_DECIMAL_CURRENCIES.has(cur);
  let amountInCents;
  if (isZeroDecimal) {
    amountInCents = Math.max(50, Math.min(10000000, Math.round(rawAmount)));
  } else {
    amountInCents = Math.round(rawAmount * 100);
    if (amountInCents < 50) amountInCents = 50;
    if (amountInCents > 10000000) amountInCents = 10000000;
  }
  return { amountInCents, isZeroDecimal, humanDisplay: isZeroDecimal ? amountInCents : amountInCents / 100 };
}

const testMatrix = [
  { tier: 5, cur: 'usd', expectedCents: 500, expectedHuman: 5.0 },
  { tier: 15, cur: 'usd', expectedCents: 1500, expectedHuman: 15.0 },
  { tier: 30, cur: 'usd', expectedCents: 3000, expectedHuman: 30.0 },
  { tier: 49, cur: 'usd', expectedCents: 4900, expectedHuman: 49.0 },
  { tier: 50, cur: 'usd', expectedCents: 5000, expectedHuman: 50.0 }, // FIXED! Previously 50 cents ($0.50)
  { tier: 60, cur: 'usd', expectedCents: 6000, expectedHuman: 60.0 }, // FIXED! Previously 60 cents ($0.60)
  { tier: 100, cur: 'usd', expectedCents: 10000, expectedHuman: 100.0 }, // FIXED! Previously 100 cents ($1.00)
  { tier: 500, cur: 'usd', expectedCents: 50000, expectedHuman: 500.0 }, // FIXED! Previously 500 cents ($5.00)
  { tier: 500, cur: 'jpy', expectedCents: 500, expectedHuman: 500 }, // Zero decimal currency
  { tier: 1000, cur: 'krw', expectedCents: 1000, expectedHuman: 1000 }, // Zero decimal currency
];

let failed = 0;
for (const tc of testMatrix) {
  const res = computeStripeAmount(tc.tier, tc.cur);
  const ok = res.amountInCents === tc.expectedCents && res.humanDisplay === tc.expectedHuman;
  if (ok) {
    console.log(`[PASS] Tier ${tc.tier} ${tc.cur.toUpperCase()} => ${res.amountInCents} units (${res.humanDisplay})`);
  } else {
    failed++;
    console.error(`[FAIL] Tier ${tc.tier} ${tc.cur.toUpperCase()}: expected ${tc.expectedCents}, got ${res.amountInCents}`);
  }
}

if (failed > 0) {
  process.exit(1);
} else {
  console.log('\nAll payment calculation tests passed with 100% accuracy!');
}
