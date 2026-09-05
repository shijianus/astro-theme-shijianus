import assert from 'assert';
import {
  isAuthoritativeEpomailServer,
  verifyEpomailAdminPrivilege,
  createSessionForUser,
  AUTHORITATIVE_EPOMAIL_DOMAIN,
  CANONICAL_ADMIN_EMAIL,
} from '../functions/_lib/auth-service.ts';

console.log('🔒 Testing Epomail Admin Spoofing Defense & Multi-Server Security Invariants...\n');

const mockEnv = {
  ADMIN_EMAIL: 'admin@epomail.bond',
  EPOMAIL_AUTHORITATIVE_HOST: 'mail.epocanvas.com',
};

// --------------------------------------------------------------------------
// TEST SUITE 1: Authoritative Domain Whitelist Invariants
// --------------------------------------------------------------------------
console.log('--- TEST SUITE 1: Authoritative Domain Whitelist Invariants ---');

// Valid authoritative domain
assert.strictEqual(
  isAuthoritativeEpomailServer('https://mail.epocanvas.com', mockEnv),
  true,
  'Official mail.epocanvas.com must be recognized as authoritative'
);

assert.strictEqual(
  isAuthoritativeEpomailServer('https://mail.epocanvas.com:443/oauth', mockEnv),
  true,
  'Official mail.epocanvas.com with port/path must be recognized as authoritative'
);

// Attack attempts with lookalike or subdomain domains
const spoofDomains = [
  'https://mail.epocanvas.com.attacker.com',
  'https://attacker-mail.epocanvas.com.evil.org',
  'https://mail.attacker.com',
  'https://epomail.bond',
  'https://epocanvas-mail.pages.dev',
  'https://self-hosted-epomail.io',
  'http://mail.epocanvas.com.evil.com',
  'not-a-url',
];

for (const spoofUrl of spoofDomains) {
  assert.strictEqual(
    isAuthoritativeEpomailServer(spoofUrl, mockEnv),
    false,
    `Domain ${spoofUrl} MUST NOT be authoritative!`
  );
  console.log(`  ✓ Blocked non-authoritative domain: ${spoofUrl}`);
}

// --------------------------------------------------------------------------
// TEST SUITE 2: Third-Party Epomail Instances Trying to Claim Admin
// --------------------------------------------------------------------------
console.log('\n--- TEST SUITE 2: Third-Party Epomail Spoofing Prevention ---');

// Attacker hosts their own Epomail, generates admin claims, and points blog to it
const attackerCases = [
  {
    name: 'Attacker Epomail with is_admin=true and fake claims',
    opts: {
      baseUrl: 'https://mail.hacker-server.com',
      userEmail: 'admin@hacker-server.com',
      idClaims: { iss: 'https://mail.hacker-server.com', is_admin: true, role: 'admin' },
      userInfo: { is_admin: true, role: 'admin' },
      env: mockEnv,
    },
  },
  {
    name: 'Attacker Epomail claiming canonical admin email (admin@epomail.bond)',
    opts: {
      baseUrl: 'https://mail.attacker-server.com',
      userEmail: 'admin@epomail.bond',
      idClaims: { iss: 'https://mail.attacker-server.com', is_admin: true, role: 'admin' },
      userInfo: { is_admin: true, role: 'admin' },
      env: mockEnv,
    },
  },
  {
    name: 'Attacker forging iss to mail.epocanvas.com but baseUrl is evil',
    opts: {
      baseUrl: 'https://evil.com',
      userEmail: 'admin@epomail.bond',
      idClaims: { iss: 'https://mail.epocanvas.com', is_admin: true, role: 'admin' },
      userInfo: { is_admin: true, role: 'admin' },
      env: mockEnv,
    },
  },
  {
    name: 'Attacker baseUrl points to mail.epocanvas.com.attacker.com',
    opts: {
      baseUrl: 'https://mail.epocanvas.com.attacker.com',
      userEmail: 'admin@epomail.bond',
      idClaims: { iss: 'https://mail.epocanvas.com.attacker.com', is_admin: true },
      userInfo: { is_admin: true },
      env: mockEnv,
    },
  },
];

for (const testCase of attackerCases) {
  const result = verifyEpomailAdminPrivilege(testCase.opts);
  assert.strictEqual(result, false, `Failed security assertion for ${testCase.name}! Must NOT be admin!`);
  console.log(`  ✓ Denied admin privilege for: ${testCase.name}`);
}

// --------------------------------------------------------------------------
// TEST SUITE 3: Authoritative mail.epocanvas.com Legitimate & Future-Proofed Admin
// --------------------------------------------------------------------------
console.log('\n--- TEST SUITE 3: Authoritative mail.epocanvas.com Verification ---');

// Case 1: Legitimate admin with admin@epomail.bond
const legitCurrentAdmin = verifyEpomailAdminPrivilege({
  baseUrl: 'https://mail.epocanvas.com',
  userEmail: 'admin@epomail.bond',
  idClaims: { iss: 'https://mail.epocanvas.com', is_admin: true, role: 'admin' },
  userInfo: { email: 'admin@epomail.bond', is_admin: true, role: 'admin' },
  env: mockEnv,
});
assert.strictEqual(legitCurrentAdmin, true, 'Legitimate admin must be granted admin role');
console.log('  ✓ Legitimate current admin (admin@epomail.bond) authenticated as admin');

// Case 2: Domain migration scenario — epomail.bond expires in the future, admin uses new domain on mail.epocanvas.com
const futureMigratedAdmin = verifyEpomailAdminPrivilege({
  baseUrl: 'https://mail.epocanvas.com',
  userEmail: 'shijian@epocanvas.com', // Different domain!
  idClaims: { iss: 'https://mail.epocanvas.com', is_admin: true, role: 'admin' },
  userInfo: { email: 'shijian@epocanvas.com', is_admin: true, role: 'admin' },
  env: mockEnv,
});
assert.strictEqual(futureMigratedAdmin, true, 'Future migrated admin with server attestation must be granted admin role');
console.log('  ✓ Future migrated domain (shijian@epocanvas.com) successfully authenticated as admin via mail.epocanvas.com attestation');

// Case 3: Regular user on official mail.epocanvas.com
const regularUser = verifyEpomailAdminPrivilege({
  baseUrl: 'https://mail.epocanvas.com',
  userEmail: 'normal_reader@epomail.bond',
  idClaims: { iss: 'https://mail.epocanvas.com', is_admin: false, role: 'reader' },
  userInfo: { email: 'normal_reader@epomail.bond', is_admin: false, role: 'reader' },
  env: mockEnv,
});
assert.strictEqual(regularUser, false, 'Regular user must NOT be granted admin role');
console.log('  ✓ Regular user on official mail.epocanvas.com correctly denied admin role');

// --------------------------------------------------------------------------
// TEST SUITE 4: createSessionForUser Role Guard (Defense in Depth)
// --------------------------------------------------------------------------
console.log('\n--- TEST SUITE 4: Session Creation Role Guards ---');

// Attempt 1: Local provider claiming admin
const localAdminAttempt = await createSessionForUser(
  {
    id: 'test_local',
    name: 'Hacker',
    email: 'hacker@example.com',
    avatar: '',
    website: '',
    role: 'admin',
    provider: 'local',
  },
  mockEnv
);
assert.strictEqual(localAdminAttempt.user.role, 'reader', 'Local provider must NEVER be granted admin!');
console.log('  ✓ Local provider injection downgraded to reader');

// Attempt 2: Epomail provider with admin
const epomailAdminSession = await createSessionForUser(
  {
    id: 'epo_admin',
    name: 'Admin',
    email: 'admin@epomail.bond',
    avatar: '',
    website: '',
    role: 'admin',
    provider: 'epomail',
  },
  mockEnv
);
assert.strictEqual(epomailAdminSession.user.role, 'admin', 'Epomail admin must have admin role');
console.log('  ✓ Verified Epomail provider with admin role preserved');

console.log('\n🎉 ALL SECURITY & ANTI-SPOOFING INVARIANTS VERIFIED SUCCESSFULLY!');
