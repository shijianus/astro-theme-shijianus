/**
 * Astro Blog「试验田 Lab」Portable Bundle v2 编解码与安全契约审计脚本 (verify-portable-bundle-v2.mjs)
 */
import assert from 'node:assert/strict';

const { PortableBundleCodec, MAX_URL_SHARE_LENGTH } = await import(
  '../src/lib/lab/PortableBundleCodec.ts'
);
const {
  validateLabPortableBundle,
  computeBundleContentDigest,
  LAB_SECURITY_LIMITS,
} = await import('../src/lib/lab-schema.ts');

console.log('🧪 开始执行 Portable Bundle v2 规范与传输加固契约审计...\n');

const validFiles = [
  { name: 'index.html', language: 'html', content: '<h1>Hello 试验田</h1>' },
  { name: 'style.css', language: 'css', content: 'h1 { color: #2563eb; }' },
  { name: 'app.js', language: 'javascript', content: 'console.log("UTF-8 字符集: 测试 🚀");' },
];

// Test 1: lab-bundle-v2 规范结构与内容摘要
{
  const jsonStr = PortableBundleCodec.exportToJson({
    slug: 'v2-test-exp',
    title: 'V2 Test Experiment',
    description: 'Demonstrating lab-bundle-v2 specification',
    category: 'algorithm',
    language: 'html-css-js',
    files: validFiles,
  });

  const parsed = JSON.parse(jsonStr);
  assert.equal(parsed.version, 'lab-bundle-v2', '版本必须声明为 lab-bundle-v2');
  assert.equal(parsed.schemaVersion, 'lab-bundle-v2');
  assert.ok(parsed.contentDigest, '必须包含内容校验摘要');
  assert.ok(parsed.contentDigest.startsWith('fnv1a-'), '摘要格式应为确定性前缀');
  assert.equal(parsed.slug, 'v2-test-exp');

  // 验证摘要与文件内容强一致
  const expectedDigest = computeBundleContentDigest(validFiles);
  assert.equal(parsed.contentDigest, expectedDigest, '内容摘要必须匹配');

  console.log('  ✓ Test 1 Passed: lab-bundle-v2 规范导出与内容摘要生成正常');
}

// Test 2: UTF-8 Roundtrip 无损编解码 (中英文、换行、特殊字符与 Emoji)
{
  const testPayload = {
    title: '测试 🌟 特殊符号 & <script>alert(1)</script>',
    files: [
      { name: 'test.txt', language: 'javascript', content: 'const a = "繁體中文 / 简体中文 / 🚀 / \\n \\t";' },
    ],
  };

  const encoded = PortableBundleCodec.encode(testPayload);
  assert.ok(encoded, '必须成功生成 Base64URL');
  assert.ok(!encoded.includes('+') && !encoded.includes('/'), 'Base64 必须为 URL-Safe 变体');

  const decoded = PortableBundleCodec.decode(encoded);
  assert.deepEqual(decoded, testPayload, 'UTF-8 roundtrip 解码后数据必须 100% 相同');

  console.log('  ✓ Test 2 Passed: UTF-8 roundtrip (含 emoji/特殊符号) 无损编解码正常');
}

// Test 3: 显式 v1 到 v2 迁移保障
{
  const v1Bundle = {
    version: 'lab-bundle-v1',
    slug: 'legacy-project',
    title: 'Legacy V1 Project',
    description: 'Created under v1 schema',
    files: validFiles,
    unknownFieldToDiscard: 'should-be-cleaned',
  };

  const valRes = validateLabPortableBundle(v1Bundle);
  assert.equal(valRes.ok, true, '合法 v1 实验包必须能通过校验');
  assert.equal(valRes.data.version, 'lab-bundle-v2', '校验后必须迁移至 v2');
  assert.equal(valRes.data.schemaVersion, 'lab-bundle-v2');
  assert.ok(valRes.data.contentDigest, '迁移后必须补充内容摘要');
  assert.equal(valRes.data.unknownFieldToDiscard, undefined, '未知属性必须被规范化剔除');

  console.log('  ✓ Test 3 Passed: lab-bundle-v1 向 v2 显式向前兼容迁移正常');
}

// Test 4: 未知或未来版本 Fail-Closed 拦截
{
  const futureBundle = {
    version: 'lab-bundle-v99',
    slug: 'future-project',
    title: 'Future Project',
    files: validFiles,
  };

  const valRes = validateLabPortableBundle(futureBundle);
  assert.equal(valRes.ok, false, '未来未知版本必须被严格拒绝 (Fail-Closed)');
  assert.ok(valRes.errors[0]?.includes('Fail-Closed'));

  console.log('  ✓ Test 4 Passed: 未知未来版本实验包 Fail-Closed 拦截通过');
}

// Test 5: 传输截断或损坏内容摘要检测 (Tamper/Corruption Detection)
{
  const digest = computeBundleContentDigest(validFiles);
  const corruptedBundle = {
    version: 'lab-bundle-v2',
    slug: 'corrupted-exp',
    title: 'Corrupted Experiment',
    contentDigest: digest,
    // 文件内容被人为截断或篡改
    files: [{ name: 'index.html', language: 'html', content: '<h1>Modified truncated</h1>' }],
  };

  const valRes = validateLabPortableBundle(corruptedBundle);
  assert.equal(valRes.ok, false, '内容与摘要不匹配时必须拒绝导入');
  assert.ok(valRes.errors.some((e) => e.includes('摘要不匹配')));

  console.log('  ✓ Test 5 Passed: 传输截断与数据损坏通过摘要校验精准拦截');
}

// Test 6: 超长工程限制与 URL 分享回退保护 (2048 字符)
{
  // 构造大体积文件工程
  const bigContent = 'x'.repeat(1600);
  const bigProject = {
    title: 'Oversized Project',
    files: [{ name: 'big.js', language: 'javascript', content: bigContent }],
  };

  const urlRes = PortableBundleCodec.encodeForUrl(bigProject);
  assert.equal(urlRes.ok, false, '超过 2048 字符的工程必须拒绝生成 URL');
  assert.equal(urlRes.oversized, true);
  assert.ok(urlRes.reason?.includes('超出浏览器 URL 安全上限'));

  console.log('  ✓ Test 6 Passed: 超长工程禁止生成溢出 URL 并引导离线导出');
}

// Test 7: 编码前体积上限防拒绝服务 (DoS Protection)
{
  const massiveContent = 'a'.repeat(LAB_SECURITY_LIMITS.MAX_TOTAL_SOURCE_BYTES + 100);
  const massiveProject = {
    files: [{ name: 'massive.js', language: 'javascript', content: massiveContent }],
  };

  const encoded = PortableBundleCodec.encode(massiveProject);
  assert.equal(encoded, '', '超过单包体积上限的数据在编码前直接被拦截拒绝');

  console.log('  ✓ Test 7 Passed: 编码前严格实施字节上限保护');
}

console.log('\n🎉 所有 7 项 Portable Bundle v2 契约测试全部 100% 通过！\n');
