import assert from 'node:assert';
import { onRequest as recordBlessingOnRequest } from '../functions/api/record-blessing.ts';

console.log('=== Running SEC-06 Verification Tests: Blessing & Sponsorship Wall Integrity ===\n');

// Mock D1 Database
class MockD1Database {
  constructor() {
    this.sponsorships = new Map();
  }

  prepare(sql) {
    const db = this;
    let boundParams = [];
    return {
      bind(...params) {
        boundParams = params;
        return this;
      },
      async run() {
        if (sql.includes('CREATE TABLE')) {
          return { success: true };
        }
        if (sql.includes('INSERT OR REPLACE INTO sponsorships')) {
          const [id, amount, currency, name, message, country, ip, status] = boundParams;
          db.sponsorships.set(id, { id, amount, currency, name, message, country, ip, status });
          return { success: true, meta: { changes: 1 } };
        }
        if (sql.includes('UPDATE sponsorships')) {
          const [name, message, country, ip, id] = boundParams;
          const existing = db.sponsorships.get(id);
          if (existing) {
            existing.name = name;
            existing.message = message;
            existing.country = country;
            existing.ip = ip;
            existing.status = 'completed';
            return { success: true, meta: { changes: 1 } };
          }
          return { success: true, meta: { changes: 0 } };
        }
        return { success: true };
      },
      async first() {
        if (sql.includes('SELECT id, amount, currency, status FROM sponsorships WHERE id = ?')) {
          const [id] = boundParams;
          return db.sponsorships.get(id) || null;
        }
        return null;
      },
      async all() {
        return { results: Array.from(db.sponsorships.values()) };
      },
    };
  }
}

const mockDb = new MockD1Database();
const mockEnv = {
  DB: mockDb,
  ALLOW_ORIGINS: 'https://blog.epocanvas.com',
  IS_DEV: '', // Production mode
};
process.env.NODE_ENV = 'production';

// Pre-populate mock DB with a legitimate server-created checkout session
mockDb.sponsorships.set('cs_test_legit_001', {
  id: 'cs_test_legit_001',
  amount: 15.00,
  currency: 'USD',
  status: 'created',
  name: 'Anonymous',
  message: '',
});

// Test 1: Missing ID
console.log('1. Testing missing ID rejection...');
{
  const req = new Request('https://blog.epocanvas.com/api/record-blessing', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Attacker' }),
  });
  const res = await recordBlessingOnRequest({ request: req, env: mockEnv });
  assert.strictEqual(res.status, 400, 'Expected status 400');
  const data = await res.json();
  assert.strictEqual(data.ok, false);
  assert.ok(data.error.includes('缺少赞助会话标识'));
  console.log('  [PASS] 1: Request with missing ID successfully rejected.');
}

// Test 2: Unverified / Fake Session Fabrication Attempt (Attacker claims $1,000,000)
console.log('\n2. Testing unverified session fabrication attempt...');
{
  const req = new Request('https://blog.epocanvas.com/api/record-blessing', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      id: 'cs_fake_malicious_9999',
      amount: 1000000,
      currency: 'USD',
      name: 'Hacker King',
      message: 'Gambling site promo: evil-site.com',
    }),
  });
  const res = await recordBlessingOnRequest({ request: req, env: mockEnv });
  assert.strictEqual(res.status, 403, 'Unverified session must return 403 Forbidden');
  const data = await res.json();
  assert.strictEqual(data.ok, false);
  assert.ok(data.error.includes('未找到有效的支付赞助会话'));

  // Ensure fake record was NOT added to database
  assert.strictEqual(mockDb.sponsorships.has('cs_fake_malicious_9999'), false, 'Fake session must NOT be in DB');
  console.log('  [PASS] 2: Unverified fabricated session strictly rejected with 403; database was untouched.');
}

// Test 3: Legitimate Session Blessing Submission (Attempted Amount Tampering Blocked)
console.log('\n3. Testing legitimate session update & amount tampering prevention...');
{
  const req = new Request('https://blog.epocanvas.com/api/record-blessing', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      id: 'cs_test_legit_001',
      amount: 9999999, // Tampered client-side amount!
      currency: 'USD',
      name: 'Generous Reader',
      message: 'Great blog post! Keep it up.',
    }),
  });
  const res = await recordBlessingOnRequest({ request: req, env: mockEnv });
  assert.strictEqual(res.status, 200, 'Legitimate session blessing must succeed with 200');
  const data = await res.json();
  assert.strictEqual(data.ok, true);

  // Check DB state
  const updated = mockDb.sponsorships.get('cs_test_legit_001');
  assert.strictEqual(updated.status, 'completed', 'Status must be updated to completed');
  assert.strictEqual(updated.name, 'Generous Reader', 'Name must be updated');
  assert.strictEqual(updated.message, 'Great blog post! Keep it up.', 'Message must be updated');
  // CRITICAL CHECK: Amount must still be 15, NOT the tampered 9999999!
  assert.strictEqual(updated.amount, 15.00, 'Tampered amount must be rejected, preserving server-verified amount');
  console.log('  [PASS] 3: Legitimate session updated to completed; tampered amount was disregarded.');
}

console.log('\n=== All SEC-06 Blessing & Sponsorship Wall Integrity Tests Passed Successfully! ===\n');
