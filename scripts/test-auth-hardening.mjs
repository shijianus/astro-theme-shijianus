import { authenticateLocalReader, CANONICAL_ADMIN_EMAIL } from '../functions/_lib/auth-service.ts';

const mockEnv = {
  ADMIN_EMAIL: 'admin@epomail.bond',
};

console.log('Testing SEC-03: Local auth hardening...');

// Test 1: Trying to register/login as admin via local reader endpoint
try {
  await authenticateLocalReader({
    name: 'Attacker',
    email: 'admin@epomail.bond',
  }, mockEnv);
  console.error('[FAIL] Expected authenticateLocalReader to reject admin email, but it succeeded!');
  process.exit(1);
} catch (err) {
  if (err.message.includes('该邮箱属于站点管理员')) {
    console.log('[PASS] Rejected local login with admin email:', err.message);
  } else {
    console.error('[FAIL] Threw unexpected error:', err);
    process.exit(1);
  }
}

// Test 2: Trying with canonical admin email
try {
  await authenticateLocalReader({
    name: 'Attacker2',
    email: CANONICAL_ADMIN_EMAIL,
  }, mockEnv);
  console.error('[FAIL] Expected authenticateLocalReader to reject CANONICAL_ADMIN_EMAIL!');
  process.exit(1);
} catch (err) {
  if (err.message.includes('该邮箱属于站点管理员')) {
    console.log('[PASS] Rejected local login with canonical admin email:', err.message);
  } else {
    console.error('[FAIL] Threw unexpected error:', err);
    process.exit(1);
  }
}

// Test 3: Normal reader creates session properly
try {
  const session = await authenticateLocalReader({
    name: 'Valid Reader',
    email: 'reader@example.com',
  }, mockEnv);
  if (session && session.token && session.user.role === 'reader') {
    console.log('[PASS] Valid reader created session properly with role: reader');
  } else {
    console.error('[FAIL] Failed to create normal reader session');
    process.exit(1);
  }
} catch (err) {
  console.error('[FAIL] Unexpected error for valid reader:', err);
  process.exit(1);
}

console.log('\nAll auth hardening tests passed!');
