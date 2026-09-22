import assert from 'node:assert';
import { onRequest as coverOnRequest, isAllowedCoverUrl } from '../functions/api/music/cover.ts';
import { onRequest as uploadOnRequest } from '../functions/api/upload-image.ts';

console.log('=== Running SEC-08 & SEC-12 Verification Tests ===\n');

// ----------------------------------------------------
// 1. Test SEC-08: Music Cover Open Redirect Prevention
// ----------------------------------------------------
console.log('1. Testing SEC-08: Music Cover Open Redirect Prevention...');

// Helper whitelist function unit tests
assert.strictEqual(isAllowedCoverUrl('https://evil-phishing-site.com/login'), false, 'Malicious domain must be rejected');
assert.strictEqual(isAllowedCoverUrl('https://evil.music.126.net.attacker.com/fake'), false, 'Subdomain spoofing must be rejected');
assert.strictEqual(isAllowedCoverUrl('javascript:alert(1)'), false, 'Non-http(s) must be rejected');
assert.strictEqual(isAllowedCoverUrl('https://p1.music.126.net/6yU123==/109951165.jpg'), true, 'Valid NetEase CDN must be allowed');
assert.strictEqual(isAllowedCoverUrl('https://y.gtimg.cn/music/photo_new/T002R300x300M000.jpg'), true, 'Valid QQ Music CDN must be allowed');
assert.strictEqual(isAllowedCoverUrl('https://img.epocanvas.com/file/avatar.png'), true, 'Blog image host must be allowed');
console.log('  [PASS] 1a: isAllowedCoverUrl whitelist correctly filters domains.');

// Integration tests with coverOnRequest
const mockEnv = {
  ALLOW_ORIGINS: 'https://blog.epocanvas.com',
};

{
  // Test malicious open redirect attempt
  const maliciousReq = new Request('https://blog.epocanvas.com/api/music/cover?picId=https://evil-phishing.com/steal-creds');
  const res = await coverOnRequest({ request: maliciousReq, env: mockEnv });
  assert.strictEqual(res.status, 400, 'Malicious external redirect must return 400');
  const body = await res.json();
  assert.strictEqual(body.ok, false);
  assert.ok(body.error.includes('非法的封面图片链接'), 'Expected error message for untrusted domain');
  console.log('  [PASS] 1b: Arbitrary external URL redirect attempt blocked with 400 Bad Request.');
}

{
  // Test legitimate NetEase cover URL redirect
  const legitUrl = 'https://p2.music.126.net/sample-cover.jpg';
  const legitReq = new Request(`https://blog.epocanvas.com/api/music/cover?picId=${encodeURIComponent(legitUrl)}`);
  const res = await coverOnRequest({ request: legitReq, env: mockEnv });
  assert.strictEqual(res.status, 302, 'Legitimate music cover must return 302 redirect');
  assert.strictEqual(res.headers.get('location'), legitUrl, 'Location header must point to target image');
  console.log('  [PASS] 1c: Trusted music CDN cover URL successfully redirected with 302.');
}

// ----------------------------------------------------
// 2. Test SEC-12: Image Upload MIME Whitelist & Secret Isolation
// ----------------------------------------------------
console.log('\n2. Testing SEC-12: Image Upload MIME Whitelist & Secret Isolation...');

{
  // Test 2a: Disallowed / forged MIME type (e.g. image/x-malicious-script)
  const formData = new FormData();
  const fakeFile = new Blob(['<script>alert(1)</script>'], { type: 'image/x-malicious-script' });
  formData.append('file', fakeFile, 'exploit.svg');

  const req = new Request('https://blog.epocanvas.com/api/upload-image', {
    method: 'POST',
    body: formData,
  });

  const res = await uploadOnRequest({ request: req, env: { ...mockEnv, IS_DEV: 'true' } });
  const body = await res.json();
  assert.strictEqual(res.status, 400, 'Disallowed MIME type must return 400');
  assert.strictEqual(body.ok, false);
  assert.ok(body.error.includes('不支持的文件格式'), 'Expected format rejection error message');
  console.log('  [PASS] 2a: Non-whitelisted image MIME type strictly rejected with 400.');
}

{
  // Test 2b: Production environment without IMAGE_HOST_TOKEN returns 503 and NO secret leakage
  const formData = new FormData();
  const legitFile = new Blob(['fake image content'], { type: 'image/png' });
  formData.append('file', legitFile, 'test.png');

  const prodEnvWithoutToken = {
    ...mockEnv,
    IS_DEV: '', // Production mode
  };
  // Force process.env.NODE_ENV = 'production'
  const prevEnv = process.env.NODE_ENV;
  process.env.NODE_ENV = 'production';

  const req = new Request('https://blog.epocanvas.com/api/upload-image', {
    method: 'POST',
    body: formData,
  });

  const res = await uploadOnRequest({ request: req, env: prodEnvWithoutToken });
  const body = await res.json();
  process.env.NODE_ENV = prevEnv;

  assert.strictEqual(res.status, 503, 'Missing token in production must return 503');
  assert.strictEqual(body.ok, false);
  assert.ok(body.error.includes('未配置授权凭证'), 'Expected missing credentials error');
  console.log('  [PASS] 2b: Missing credentials safely returns 503 without leaking fallback secrets.');
}

{
  // Test 2c: Dev mode fallback returns dev simulated response
  const formData = new FormData();
  const legitFile = new Blob(['fake image content'], { type: 'image/png' });
  formData.append('file', legitFile, 'dev_test.png');

  const devEnv = {
    ...mockEnv,
    IS_DEV: 'true',
  };

  const req = new Request('https://blog.epocanvas.com/api/upload-image', {
    method: 'POST',
    body: formData,
  });

  const res = await uploadOnRequest({ request: req, env: devEnv });
  const body = await res.json();
  assert.strictEqual(res.status, 200, 'Dev mode fallback should succeed with 200');
  assert.strictEqual(body.ok, true);
  assert.ok(body.url.includes('dev-mock-image.png'), 'Expected dev mock image URL');
  console.log('  [PASS] 2c: Dev environment fallback gracefully handles missing token.');
}

console.log('\n=== All SEC-08 & SEC-12 Verification Tests Passed Successfully! ===\n');
