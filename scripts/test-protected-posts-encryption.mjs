import assert from 'node:assert';
import crypto from 'node:crypto';

console.log('=== Running SEC-07 Verification Tests: Static Protected Post AES-256-GCM Encryption ===\n');

// 1. Simulate Astro HTML output containing protected template
const originalSecretHtml = `
<div class="article-translation-variant" data-lang="zh-CN">
  <h1>机密实验室报告</h1>
  <p>这是绝对机密的正文内容，包含敏感凭证：TOP_SECRET_FLAG_XYZ_987654</p>
</div>
`;
const postPassword = 'CorrectSecretPassword123!';
const postPasswordHash = crypto.createHash('sha256').update(postPassword).digest('hex');
const postId = 'access-control-lab';

const mockStaticHtml = `
<!DOCTYPE html>
<html>
<head><title>文章访问控制实验室</title></head>
<body>
  <div id="article-container">
    <section class="content-access-panel--server">
      <form id="content-access-unlock-form">
        <input name="post-password" type="password" />
        <button type="submit">解锁</button>
      </form>
    </section>
    <template id="shijianus-protected-variants-template" data-expected-hash="${postPasswordHash}" data-post-id="${postId}">
      ${originalSecretHtml}
    </template>
  </div>
</body>
</html>
`;

console.log('1. Testing build-time AES-256-GCM encryption transform...');
function transformHtml(html) {
  const templateRegex = /<template\s+id="shijianus-protected-variants-template"\s+data-expected-hash="([a-f0-9]{64})"\s+data-post-id="([^"]+)">([\s\S]*?)<\/template>/gi;

  let match;
  let modified = false;
  while ((match = templateRegex.exec(html)) !== null) {
    const fullMatch = match[0];
    const hash = match[1];
    const pId = match[2];
    const rawContent = match[3];

    // Cryptographically encrypt rawContent using AES-256-GCM
    const salt = crypto.randomBytes(16);
    const iv = crypto.randomBytes(12);
    const derivedKey = crypto.createHash('sha256').update(Buffer.concat([salt, Buffer.from(hash, 'utf8')])).digest();
    const cipher = crypto.createCipheriv('aes-256-gcm', derivedKey, iv);
    const encrypted = Buffer.concat([cipher.update(rawContent, 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();

    const encryptedPayloadTag = `<div id="shijianus-protected-encrypted-payload" data-post-id="${pId}" data-salt="${salt.toString('hex')}" data-iv="${iv.toString('hex')}" data-tag="${tag.toString('hex')}" data-ciphertext="${encrypted.toString('base64')}"></div>`;

    html = html.replace(fullMatch, encryptedPayloadTag);
    modified = true;
  }
  return html;
}

const secureHtml = transformHtml(mockStaticHtml);

// Assertions on the transformed HTML
assert.strictEqual(secureHtml.includes('TOP_SECRET_FLAG_XYZ_987654'), false, 'CRITICAL: Secret text must NOT exist anywhere in HTML');
assert.strictEqual(secureHtml.includes('机密实验室报告'), false, 'CRITICAL: Plaintext article title must NOT exist in HTML');
assert.strictEqual(secureHtml.includes(postPasswordHash), false, 'CRITICAL: Password hash must NOT be exposed in HTML');
assert.strictEqual(secureHtml.includes('shijianus-protected-variants-template'), false, 'Raw template must be gone');
assert.ok(secureHtml.includes('shijianus-protected-encrypted-payload'), 'Encrypted payload tag must be present');
console.log('  [PASS] 1: All plaintext and password hashes are completely eliminated from static HTML output.');

// 2. Test Browser WebCrypto Decryption Simulation
console.log('\n2. Testing client-side WebCrypto AES-256-GCM decryption simulation...');

// Extract payload attributes from HTML
const saltMatch = secureHtml.match(/data-salt="([a-f0-9]+)"/);
const ivMatch = secureHtml.match(/data-iv="([a-f0-9]+)"/);
const tagMatch = secureHtml.match(/data-tag="([a-f0-9]+)"/);
const cipherMatch = secureHtml.match(/data-ciphertext="([^"]+)"/);

assert.ok(saltMatch && ivMatch && tagMatch && cipherMatch, 'All encryption metadata must be present');

const saltHex = saltMatch[1];
const ivHex = ivMatch[1];
const tagHex = tagMatch[1];
const ciphertextBase64 = cipherMatch[1];

async function attemptClientDecrypt(enteredPassword) {
  const enc = new TextEncoder();
  const hashBuf = await crypto.subtle.digest('SHA-256', enc.encode(enteredPassword));
  const hex = Array.from(new Uint8Array(hashBuf)).map((b) => b.toString(16).padStart(2, '0')).join('').toLowerCase();

  const saltBytes = new Uint8Array((saltHex.match(/.{1,2}/g) || []).map(b => parseInt(b, 16)));
  const hashBytes = enc.encode(hex);
  const combined = new Uint8Array(saltBytes.length + hashBytes.length);
  combined.set(saltBytes, 0);
  combined.set(hashBytes, saltBytes.length);

  const clientKeyHash = await crypto.subtle.digest('SHA-256', combined);
  const cryptoKey = await crypto.subtle.importKey('raw', clientKeyHash, { name: 'AES-GCM' }, false, ['decrypt']);

  const ivBytes = new Uint8Array((ivHex.match(/.{1,2}/g) || []).map(b => parseInt(b, 16)));
  const tagBytes = new Uint8Array((tagHex.match(/.{1,2}/g) || []).map(b => parseInt(b, 16)));
  const cipherBytes = Uint8Array.from(Buffer.from(ciphertextBase64, 'base64'));

  const ciphertextWithTag = new Uint8Array(cipherBytes.length + tagBytes.length);
  ciphertextWithTag.set(cipherBytes, 0);
  ciphertextWithTag.set(tagBytes, cipherBytes.length);

  const decryptedBuf = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: ivBytes },
    cryptoKey,
    ciphertextWithTag
  );
  return new TextDecoder().decode(decryptedBuf);
}

// Case 2a: Correct password succeeds
{
  const decrypted = await attemptClientDecrypt('CorrectSecretPassword123!');
  assert.ok(decrypted.includes('TOP_SECRET_FLAG_XYZ_987654'), 'Decrypted content must contain secret flag');
  assert.ok(decrypted.includes('机密实验室报告'), 'Decrypted content must contain title');
  console.log('  [PASS] 2a: Entering correct password cleanly decrypts original HTML in memory.');
}

// Case 2b: Wrong password throws crypto error
{
  let failed = false;
  try {
    await attemptClientDecrypt('WrongPassword!');
  } catch (err) {
    failed = true;
    assert.strictEqual(err.name, 'OperationError', 'AES-GCM tag verification must reject wrong password');
  }
  assert.strictEqual(failed, true, 'Wrong password must fail decryption');
  console.log('  [PASS] 2b: Entering wrong password fails AES-GCM tag verification (OperationError).');
}

console.log('\n=== All SEC-07 Static Protected Post Encryption Tests Passed Successfully! ===\n');
