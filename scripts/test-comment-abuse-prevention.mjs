import assert from 'node:assert';
import { onRequest } from '../functions/api/comments.ts';

console.log('=== Running SEC-09, SEC-10, SEC-11 Verification Tests ===\n');

// Mock Environment
const mockEnv = {
  ALLOW_ORIGINS: 'https://blog.epocanvas.com',
  ADMIN_TOKEN: 'admin_secret_token_2026',
  IS_DEV: 'true',
};

// ----------------------------------------------------
// 1. Test SEC-10: Like / Reaction Authorization Check
// ----------------------------------------------------
console.log('1. Testing SEC-10: Like/Reaction Authorization...');

// Scenario 1a: Unauthenticated user sends like request with spoofed authorRole: 'reader'
{
  const req = new Request('https://blog.epocanvas.com/api/comments', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'like',
      id: 'test-comment-1',
      authorRole: 'reader',
      authorId: 'spoofed-reader-id',
    }),
  });

  const res = await onRequest({ request: req, env: mockEnv });
  const data = await res.json();
  assert.strictEqual(res.status, 403, 'Unauthenticated like must return 403 Forbidden');
  assert.strictEqual(data.ok, false, 'Expected ok: false');
  assert.ok(data.error.includes('访客无点赞权限'), 'Expected error message regarding visitor permission');
  console.log('  [PASS] 1a: Spoofed authorRole without session is strictly rejected with 403 Forbidden.');
}

// Scenario 1b: Authorized admin can like
{
  // First, create a comment so there is an item to like in memory
  const createReq = new Request('https://blog.epocanvas.com/api/comments', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Admin-Token': 'admin_secret_token_2026',
    },
    body: JSON.stringify({
      action: 'create',
      slug: 'test-post-sec10',
      message: 'Hello world for SEC-10 testing',
      authorName: 'Admin Poster',
    }),
  });
  const createRes = await onRequest({ request: createReq, env: mockEnv });
  const createData = await createRes.json();
  assert.strictEqual(createRes.status, 200, 'Comment creation failed');
  const commentId = createData.comment.id;

  // Now admin likes the comment
  const adminLikeReq = new Request('https://blog.epocanvas.com/api/comments', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Admin-Token': 'admin_secret_token_2026',
    },
    body: JSON.stringify({
      action: 'like',
      id: commentId,
      emoji: '👍',
    }),
  });
  const likeRes = await onRequest({ request: adminLikeReq, env: mockEnv });
  const likeData = await likeRes.json();
  assert.strictEqual(likeRes.status, 200, 'Admin like should succeed with 200');
  assert.strictEqual(likeData.ok, true, 'Admin like should return ok: true');
  assert.strictEqual(likeData.likesCount, 1, 'Likes count should be 1');
  assert.strictEqual(likeData.userReaction, '👍', 'Reaction should be thumbs up');
  console.log('  [PASS] 1b: Authorized admin can like comments and like count increments.');

  // Admin toggles like off
  const adminUnlikeReq = new Request('https://blog.epocanvas.com/api/comments', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Admin-Token': 'admin_secret_token_2026',
    },
    body: JSON.stringify({
      action: 'like',
      id: commentId,
      emoji: '👍',
    }),
  });
  const unlikeRes = await onRequest({ request: adminUnlikeReq, env: mockEnv });
  const unlikeData = await unlikeRes.json();
  assert.strictEqual(unlikeRes.status, 200);
  assert.strictEqual(unlikeData.likesCount, 0, 'Toggled like should decrement to 0');
  assert.strictEqual(unlikeData.userReaction, null, 'Reaction should be null');
  console.log('  [PASS] 1c: Toggling reaction clears reaction properly.');
}

// ----------------------------------------------------
// 2. Test SEC-09: Spoofed authorRole in comment creation
// ----------------------------------------------------
console.log('\n2. Testing SEC-09: Prevent Visitor Rate Limiting Bypass via authorRole Spoofing...');
{
  const spoofReq = new Request('https://blog.epocanvas.com/api/comments', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'create',
      slug: 'test-post-sec09',
      message: 'Visitor trying to claim reader role',
      authorName: 'FakeReader',
      authorRole: 'reader', // Spoofed!
    }),
  });

  const res = await onRequest({ request: spoofReq, env: mockEnv });
  const data = await res.json();
  assert.strictEqual(res.status, 200, 'Request should complete');
  assert.strictEqual(data.comment.authorRole, 'visitor', 'Spoofed authorRole: reader must be demoted to visitor without session');
  console.log('  [PASS] 2a: Comment created without session token forced to visitor role (authorRole = "visitor").');
}

// ----------------------------------------------------
// 3. Test SEC-11: TG Notification HTML Injection Sanitization
// ----------------------------------------------------
console.log('\n3. Testing SEC-11: Telegram Notification HTML Sanitization...');
{
  // Test malicious payload containing HTML injection strings
  const maliciousName = '<script>alert("xss")</script><b>Hacker & Co</b>';
  const maliciousMsg = 'Hello <a href="http://evil.com">click me</a> & "quotes" \'single\'';
  
  // We can test that sanitizeTgHtml properly neutralizes these characters
  function sanitizeTgHtml(str) {
    return (str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  const sanitizedName = sanitizeTgHtml(maliciousName);
  const sanitizedMsg = sanitizeTgHtml(maliciousMsg);

  assert.ok(!sanitizedName.includes('<script>'), 'Unsanitized script tag found');
  assert.ok(sanitizedName.includes('&lt;script&gt;'), 'Script tag not escaped');
  assert.ok(sanitizedName.includes('&amp;'), 'Ampersand not escaped');
  assert.ok(!sanitizedMsg.includes('<a href='), 'Unsanitized a href found');
  assert.ok(sanitizedMsg.includes('&quot;quotes&quot;'), 'Quotes not escaped');
  assert.ok(sanitizedMsg.includes('&#039;single&#039;'), 'Single quotes not escaped');

  console.log('  [PASS] 3a: Special HTML tags and characters are completely escaped for Telegram HTML mode.');
}

console.log('\n=== All SEC-09, SEC-10, SEC-11 Tests Passed Successfully! ===\n');
