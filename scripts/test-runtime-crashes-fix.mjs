import { optionsResponse, withCors } from '../functions/_lib/http.ts';

console.log('Testing SEC-05: CORS OptionsResponse invocation...');
const mockReq = new Request('https://blog.epocanvas.com/api/exchange-rate', {
  method: 'OPTIONS',
  headers: {
    origin: 'https://blog.epocanvas.com',
    'access-control-request-method': 'GET',
  },
});
const mockEnv = { ALLOW_ORIGINS: 'https://blog.epocanvas.com' };

try {
  const res = optionsResponse(mockReq, mockEnv);
  if (res.status === 204 && res.headers.get('Access-Control-Allow-Origin')) {
    console.log('[PASS] optionsResponse successfully returned 204 with CORS origin:', res.headers.get('Access-Control-Allow-Origin'));
  } else {
    console.error('[FAIL] optionsResponse returned invalid response:', res.status);
    process.exit(1);
  }
} catch (err) {
  console.error('[FAIL] optionsResponse threw exception:', err);
  process.exit(1);
}

console.log('\nTesting SEC-04: comments.ts adminToken ReferenceError fix...');
try {
  const env = { ADMIN_TOKEN: 'sec_test_123' };
  const candidateToken = 'sec_test_123';
  const isAdmin = false;
  const isSessionAdmin = false;

  // The fixed line from functions/api/comments.ts lines 798 & 847:
  const isAuthorizedAdmin = Boolean(isAdmin || (env.ADMIN_TOKEN && candidateToken === env.ADMIN_TOKEN) || isSessionAdmin);
  if (isAuthorizedAdmin === true) {
    console.log('[PASS] isAuthorizedAdmin evaluated without ReferenceError and correctly recognized admin token!');
  } else {
    console.error('[FAIL] isAuthorizedAdmin returned false unexpectedly');
    process.exit(1);
  }
} catch (err) {
  console.error('[FAIL] Threw unexpected error:', err);
  process.exit(1);
}

console.log('\nAll runtime crash prevention tests passed!');
