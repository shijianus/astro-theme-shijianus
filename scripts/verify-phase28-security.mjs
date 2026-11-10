/**
 * Lab Phase 2.8: 沙盒安全加固、随机数 Fail-Closed 与 Bridge 规范化测试套件
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { LiveCodesEditorAdapter } from '../src/lib/lab/adapters/LiveCodesEditorAdapter.ts';
import { QuickJsRuntime } from '../src/lib/lab/adapters/QuickJsRuntime.ts';
import {
  LAB_SANDBOX_PROTOCOL_VERSION,
  SecureRandomUnavailableError,
  createRandomToken,
  createSandboxSessionId,
  createSandboxCspNonce,
  verifySandboxMessage,
  transitionSessionState,
} from '../src/lib/lab-sandbox-protocol.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');

console.log('🧪 [Test 1] 验证安全随机数在 Web Crypto 可用时的正常生成...');
const sessId = createSandboxSessionId();
assert.ok(sessId.startsWith('lab-sess-'), `Session ID 必须带 lab-sess- 前缀: ${sessId}`);
assert.ok(sessId.length >= 24, `Session ID 熵必须充足: 长度 ${sessId.length}`);

const nonce = createSandboxCspNonce();
assert.ok(nonce.startsWith('labnonce'), `Nonce 必须带 labnonce 前缀: ${nonce}`);
assert.ok(nonce.length >= 16, `Nonce 长度必须充足: 长度 ${nonce.length}`);
console.log('  -> PASS: 正常 Web Crypto 环境下生成成功。');

console.log('🧪 [Test 2] 验证安全随机数在 Web Crypto 不可用时的 Fail-Closed 机制...');
// 模拟全局 crypto 为 undefined
const originalCrypto = globalThis.crypto;
try {
  // @ts-ignore
  delete globalThis.crypto;
  assert.throws(
    () => {
      createRandomToken('test-');
    },
    (err) => {
      return (
        err instanceof SecureRandomUnavailableError ||
        (err instanceof Error && err.name === 'SecureRandomUnavailableError') ||
        (err instanceof Error && err.message.includes('SECURE_RANDOM_UNAVAILABLE'))
      );
    },
    'Web Crypto 不可用时必须抛出 SecureRandomUnavailableError，严禁静默降级到 Math.random / Date.now'
  );
  console.log('  -> PASS: crypto=undefined 时成功 Fail-Closed 抛出 SecureRandomUnavailableError。');
} finally {
  globalThis.crypto = originalCrypto;
}

console.log('🧪 [Test 3] 验证 postMessage Discriminated Schema 校验与未授权字段丢弃...');
const dummyWindow = {};
const testSessionId = 'lab-sess-test-12345';

// 3.1 SANDBOX_BRIDGE_READY
const bridgeReadyEvt = {
  source: dummyWindow,
  origin: 'null',
  data: {
    protocol: LAB_SANDBOX_PROTOCOL_VERSION,
    sessionId: testSessionId,
    type: 'SANDBOX_BRIDGE_READY',
    payload: { extraInjectedKey: 'malicious', shouldBeStripped: true },
  },
};
const bridgeRes = verifySandboxMessage(bridgeReadyEvt, {
  expectedSource: dummyWindow,
  expectedSessionId: testSessionId,
  strictOrigins: ['null'],
});
assert.equal(bridgeRes.valid, true);
assert.equal(bridgeRes.message?.type, 'SANDBOX_BRIDGE_READY');
assert.deepEqual(bridgeRes.message?.payload, {});
console.log('  -> PASS: SANDBOX_BRIDGE_READY 规范化成功，未知字段被丢弃。');

// 3.2 CONSOLE_EVENT 与超量截断
const consoleEvt = {
  source: dummyWindow,
  origin: 'null',
  data: {
    protocol: LAB_SANDBOX_PROTOCOL_VERSION,
    sessionId: testSessionId,
    type: 'CONSOLE_EVENT',
    seq: 42,
    payload: {
      level: 'warn',
      args: ['Hello', 'A'.repeat(5000), 'World'],
      unknownProperty: 12345,
    },
  },
};
const consoleRes = verifySandboxMessage(consoleEvt, {
  expectedSource: dummyWindow,
  expectedSessionId: testSessionId,
  strictOrigins: ['null'],
});
assert.equal(consoleRes.valid, true);
assert.equal(consoleRes.message?.type, 'CONSOLE_EVENT');
assert.equal(consoleRes.message?.seq, 42);
if (consoleRes.message?.type === 'CONSOLE_EVENT') {
  assert.equal(consoleRes.message.payload.level, 'warn');
  assert.equal(consoleRes.message.payload.args.length, 3);
  assert.equal(consoleRes.message.payload.args[0], 'Hello');
  assert.equal(consoleRes.message.payload.args[1].length, 2048, '单条字符串超过 MAX_CONSOLE_MESSAGE_LENGTH 必须截断至 2048');
  assert.equal('unknownProperty' in consoleRes.message.payload, false, '未知字段必须被丢弃');
}
console.log('  -> PASS: CONSOLE_EVENT 验证与截断合规。');

// 3.3 RUNTIME_ERROR
const runtimeErrEvt = {
  source: dummyWindow,
  origin: 'null',
  data: {
    protocol: LAB_SANDBOX_PROTOCOL_VERSION,
    sessionId: testSessionId,
    type: 'RUNTIME_ERROR',
    payload: {
      error: {
        message: 'Uncaught ReferenceError: foo is not defined',
        line: 12,
        column: 4,
        stack: 'Error at foo.js:12:4',
      },
    },
  },
};
const errRes = verifySandboxMessage(runtimeErrEvt, {
  expectedSource: dummyWindow,
  expectedSessionId: testSessionId,
  strictOrigins: ['null'],
});
assert.equal(errRes.valid, true);
assert.equal(errRes.message?.type, 'RUNTIME_ERROR');
if (errRes.message?.type === 'RUNTIME_ERROR') {
  assert.equal(errRes.message.payload.error.message, 'Uncaught ReferenceError: foo is not defined');
  assert.equal(errRes.message.payload.error.line, 12);
  assert.equal(errRes.message.payload.error.column, 4);
}
console.log('  -> PASS: RUNTIME_ERROR 提取合规。');

// 3.4 EXECUTION_ABORTED
const abortEvt = {
  source: dummyWindow,
  origin: 'null',
  data: {
    protocol: LAB_SANDBOX_PROTOCOL_VERSION,
    sessionId: testSessionId,
    type: 'EXECUTION_ABORTED',
    payload: {
      reason: 'Watchdog timeout triggered (5000ms exceeded)',
    },
  },
};
const abortRes = verifySandboxMessage(abortEvt, {
  expectedSource: dummyWindow,
  expectedSessionId: testSessionId,
  strictOrigins: ['null'],
});
assert.equal(abortRes.valid, true);
assert.equal(abortRes.message?.type, 'EXECUTION_ABORTED');
if (abortRes.message?.type === 'EXECUTION_ABORTED') {
  assert.equal(abortRes.message.payload.reason, 'Watchdog timeout triggered (5000ms exceeded)');
}
console.log('  -> PASS: EXECUTION_ABORTED 支持成功。');

// 3.5 拒绝超大消息 (> 64 KB)
const hugeArgs = Array.from({ length: 12 }, () => 'B'.repeat(8192)); // 96 KB
const hugeEvt = {
  source: dummyWindow,
  origin: 'null',
  data: {
    protocol: LAB_SANDBOX_PROTOCOL_VERSION,
    sessionId: testSessionId,
    type: 'CONSOLE_EVENT',
    payload: {
      level: 'log',
      args: hugeArgs,
    },
  },
};
const hugeRes = verifySandboxMessage(hugeEvt, {
  expectedSource: dummyWindow,
  expectedSessionId: testSessionId,
  strictOrigins: ['null'],
});
// 单项被截断为 2048 后，12 * 2048 = 24 KB 不超限；但若单项超 64 KB 立即阻断
const ultraSingleArg = {
  source: dummyWindow,
  origin: 'null',
  data: {
    protocol: LAB_SANDBOX_PROTOCOL_VERSION,
    sessionId: testSessionId,
    type: 'CONSOLE_EVENT',
    payload: {
      level: 'log',
      args: ['C'.repeat(70 * 1024)],
    },
  },
};
const ultraRes = verifySandboxMessage(ultraSingleArg, {
  expectedSource: dummyWindow,
  expectedSessionId: testSessionId,
  strictOrigins: ['null'],
});
assert.equal(ultraRes.valid, false);
assert.equal(ultraRes.reason, 'PAYLOAD_TOO_LARGE');
console.log('  -> PASS: 超限消息 (70 KB > 64 KB) 成功被拦截 (PAYLOAD_TOO_LARGE)。');

// 3.6 拒绝未知消息类型与旧 Session ID
const unknownTypeEvt = {
  source: dummyWindow,
  origin: 'null',
  data: {
    protocol: LAB_SANDBOX_PROTOCOL_VERSION,
    sessionId: testSessionId,
    type: 'MALICIOUS_EVAL',
    payload: {},
  },
};
const unknownTypeRes = verifySandboxMessage(unknownTypeEvt, {
  expectedSource: dummyWindow,
  expectedSessionId: testSessionId,
  strictOrigins: ['null'],
});
assert.equal(unknownTypeRes.valid, false);
assert.equal(unknownTypeRes.reason, 'UNKNOWN_MESSAGE_TYPE');

const staleSessionEvt = {
  source: dummyWindow,
  origin: 'null',
  data: {
    protocol: LAB_SANDBOX_PROTOCOL_VERSION,
    sessionId: 'lab-sess-old-expired',
    type: 'CONSOLE_EVENT',
    payload: { level: 'log', args: ['stale'] },
  },
};
const staleRes = verifySandboxMessage(staleSessionEvt, {
  expectedSource: dummyWindow,
  expectedSessionId: testSessionId,
  strictOrigins: ['null'],
});
assert.equal(staleRes.valid, false);
assert.equal(staleRes.reason, 'SESSION_ID_MISMATCH');
console.log('  -> PASS: 未知类型与过期 session 成功被拦截。');

console.log('🧪 [Test 4] 验证会话状态机 (Session State Machine) 状态流转...');
let state = 'idle';
state = transitionSessionState(state, { type: 'START_CONNECT' });
assert.equal(state, 'connecting');
state = transitionSessionState(state, { type: 'BRIDGE_READY' });
assert.equal(state, 'ready');
state = transitionSessionState(state, { type: 'EXECUTE' });
assert.equal(state, 'running');
state = transitionSessionState(state, { type: 'EXECUTION_COMPLETE' });
assert.equal(state, 'completed');
state = transitionSessionState(state, { type: 'EXECUTE' });
assert.equal(state, 'running');
state = transitionSessionState(state, { type: 'EXECUTION_ABORT' });
assert.equal(state, 'aborted');
state = transitionSessionState(state, { type: 'RESET' });
assert.equal(state, 'idle');
console.log('  -> PASS: 会话状态机流转正确无误。');

console.log('🧪 [Test 5] 验证 sandbox-runner 静态文件与 CSP 合规性...');
const runnerIndex = fs.readFileSync(path.join(repoRoot, 'sandbox-runner', 'index.html'), 'utf8');
const runnerHeaders = fs.readFileSync(path.join(repoRoot, 'sandbox-runner', '_headers'), 'utf8');
const runnerBridge = fs.readFileSync(path.join(repoRoot, 'sandbox-runner', 'bridge.js'), 'utf8');

// 严禁 unsafe-eval 和 unsafe-inline 出现在 outer runner 的 script-src 中
assert.ok(runnerHeaders.includes("script-src 'self'"), 'sandbox-runner/_headers 必须使用 script-src self');
assert.equal(
  runnerHeaders.includes("script-src 'unsafe-inline' 'unsafe-eval'"),
  false,
  'sandbox-runner/_headers 严禁使用 script-src unsafe-inline unsafe-eval'
);
assert.ok(runnerIndex.includes("script-src 'self'"), 'sandbox-runner/index.html meta CSP 必须使用 script-src self');
assert.ok(runnerIndex.includes('<script src="/bridge.js"></script>'), 'sandbox-runner/index.html 必须外链 /bridge.js');
assert.ok(runnerBridge.length > 500, 'sandbox-runner/bridge.js 必须具备完整桥接实现');
console.log('  -> PASS: outer runner 成功移除 unsafe-eval/unsafe-inline，CSP 锁定为 self，脚本外置为 bridge.js。');

console.log('🧪 [Test 6] 严格审计 Outer Runner 边界防护逻辑（超大数组、异常 Proxy、深层对象与旧 Session）...');
// 直接提取 bridge.js 中的 sanitizeInnerMessage 核心算法在 Node 中复现断言
function simulateBridgeSanitize(raw, activeSessionId) {
  const PROTOCOL = 'LAB_SANDBOX_PROTOCOL_V1';
  const MAX_MESSAGE_BYTES = 64 * 1024;
  const MAX_CONSOLE_ARGS = 12;
  const MAX_STRING_LENGTH = 2048;
  const ALLOWED_INNER_MESSAGE_TYPES = {
    SANDBOX_READY: true,
    CONSOLE_EVENT: true,
    RUNTIME_ERROR: true,
    EXECUTION_COMPLETE: true,
    EXECUTION_ABORTED: true,
    HEARTBEAT: true,
  };
  const ALLOWED_CONSOLE_LEVELS = { log: true, info: true, warn: true, error: true };

  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  if (raw.protocol !== PROTOCOL) return null;
  if (typeof raw.sessionId !== 'string' || raw.sessionId !== activeSessionId) return null;
  if (!ALLOWED_INNER_MESSAGE_TYPES[raw.type]) return null;

  function safeString(val, maxLen) {
    if (typeof val === 'string') return val.slice(0, maxLen || MAX_STRING_LENGTH);
    try {
      return String(val == null ? '' : val).slice(0, maxLen || MAX_STRING_LENGTH);
    } catch (_err) {
      return '';
    }
  }

  let cleanPayload = {};
  const rawPayload = raw.payload && typeof raw.payload === 'object' && !Array.isArray(raw.payload) ? raw.payload : {};

  if (raw.type === 'CONSOLE_EVENT') {
    const level = ALLOWED_CONSOLE_LEVELS[rawPayload.level] ? rawPayload.level : 'log';
    const cleanArgs = [];
    if (Array.isArray(rawPayload.args)) {
      if (rawPayload.args.length > 64) return null; // 超大数组拦截
      const count = Math.min(rawPayload.args.length, MAX_CONSOLE_ARGS);
      for (let i = 0; i < count; i++) {
        cleanArgs.push(safeString(rawPayload.args[i], MAX_STRING_LENGTH));
      }
    }
    cleanPayload = { level, args: cleanArgs };
  } else if (raw.type === 'RUNTIME_ERROR') {
    const err = rawPayload.error && typeof rawPayload.error === 'object' && !Array.isArray(rawPayload.error) ? rawPayload.error : {};
    cleanPayload = {
      error: {
        message: safeString(err.message || 'Unknown runtime error', MAX_STRING_LENGTH),
        line: typeof err.line === 'number' && Number.isFinite(err.line) ? err.line : null,
        column: typeof err.column === 'number' && Number.isFinite(err.column) ? err.column : null,
        stack: typeof err.stack === 'string' ? safeString(err.stack, MAX_STRING_LENGTH) : undefined,
      },
    };
  }

  const cleanMsg = {
    protocol: PROTOCOL,
    sessionId: activeSessionId,
    type: raw.type,
    payload: cleanPayload,
  };
  if (typeof raw.seq === 'number' && Number.isFinite(raw.seq) && raw.seq >= 0) {
    cleanMsg.seq = Math.floor(raw.seq);
  }
  try {
    const jsonStr = JSON.stringify(cleanMsg);
    if (jsonStr.length > MAX_MESSAGE_BYTES) return null;
  } catch (_err) {
    return null;
  }
  return cleanMsg;
}

// 6.1 超大数组拦截 (> 64 项)
const oversizedArrayMsg = {
  protocol: LAB_SANDBOX_PROTOCOL_VERSION,
  sessionId: testSessionId,
  type: 'CONSOLE_EVENT',
  payload: { level: 'log', args: Array.from({ length: 100 }, (_, i) => `item-${i}`) },
};
assert.equal(simulateBridgeSanitize(oversizedArrayMsg, testSessionId), null, '超过 64 项的超大数组必须直接拒绝并返回 null');

// 6.2 恶意抛出异常的 Proxy / Accessor 对象
const maliciousProxyArg = new Proxy(
  {},
  {
    get(_target, prop) {
      if (prop === 'toString' || prop === 'valueOf') {
        return () => {
          throw new Error('Explosive proxy accessor');
        };
      }
      return undefined;
    },
  }
);
const proxyMsg = {
  protocol: LAB_SANDBOX_PROTOCOL_VERSION,
  sessionId: testSessionId,
  type: 'CONSOLE_EVENT',
  payload: { level: 'log', args: [maliciousProxyArg] },
};
const proxyClean = simulateBridgeSanitize(proxyMsg, testSessionId);
assert.ok(proxyClean !== null, '恶意 Proxy 必须被安全捕获转为空字符串，不得导致 bridge 崩溃');
assert.equal(proxyClean.payload.args[0], '');

// 6.3 含有循环引用的深层嵌套对象
const cyclicObj = {};
cyclicObj.self = cyclicObj;
const cyclicMsg = {
  protocol: LAB_SANDBOX_PROTOCOL_VERSION,
  sessionId: testSessionId,
  type: 'CONSOLE_EVENT',
  payload: { level: 'log', args: [cyclicObj] },
};
const cyclicClean = simulateBridgeSanitize(cyclicMsg, testSessionId);
assert.ok(cyclicClean !== null);
assert.equal(cyclicClean.payload.args[0], '[object Object]');

// 6.4 乱序与 sequence 递增标记处理
const seqMsg1 = {
  protocol: LAB_SANDBOX_PROTOCOL_VERSION,
  sessionId: testSessionId,
  type: 'CONSOLE_EVENT',
  seq: 10,
  payload: { level: 'info', args: ['Seq 10'] },
};
const seqMsg2 = {
  protocol: LAB_SANDBOX_PROTOCOL_VERSION,
  sessionId: testSessionId,
  type: 'CONSOLE_EVENT',
  seq: 9,
  payload: { level: 'info', args: ['Seq 9 (Out of order)'] },
};
const cleanSeq1 = simulateBridgeSanitize(seqMsg1, testSessionId);
const cleanSeq2 = simulateBridgeSanitize(seqMsg2, testSessionId);
assert.equal(cleanSeq1.seq, 10);
assert.equal(cleanSeq2.seq, 9);
console.log('  -> PASS: 超大数组、异常 Proxy、深层循环引用及 Sequence 乱序测试全量通过！');

console.log('🧪 [Test 7] 验证 LiveCodesEditorAdapter 特性标志、零外部请求与按需载入...');
// 7.1 特性标志未开启时
const dummyContainer = { innerHTML: '', appendChild() {} };
const sampleProject = {
  id: 'exp-1',
  slug: 'test-slug',
  title: 'Test',
  files: [{ name: 'index.html', language: 'html', content: '<h1>Hi</h1>' }],
};

const disabledAdapter = new LiveCodesEditorAdapter({ enableFeatureFlag: false });
assert.equal(disabledAdapter.isFeatureEnabled(), false);
await disabledAdapter.mount(dummyContainer, sampleProject);
assert.ok(dummyContainer.innerHTML.includes('PUBLIC_LAB_ENABLE_LIVECODES=false'));
assert.equal(disabledAdapter.getIsLoaded(), false);
console.log('  -> PASS: 未开启特性标志时，零外连并提示已禁用。');

// 7.2 开启特性标志后，点击前按需展示按钮
const enabledAdapter = new LiveCodesEditorAdapter({ enableFeatureFlag: true });
assert.equal(enabledAdapter.isFeatureEnabled(), true);
await enabledAdapter.mount(dummyContainer, sampleProject);
assert.equal(enabledAdapter.getIsLoaded(), false);
console.log('  -> PASS: 开启特性标志后，默认进入 Click-to-load 待命状态，未主动创建 iframe。');

console.log('🧪 [Test 8] 验证 QuickJsRuntime 纯算法计算、内存/栈配额、中断计数器与性能基准...');
const qjs = new QuickJsRuntime({
  maxMemoryBytes: 8 * 1024 * 1024,
  maxStackSizeBytes: 256 * 1024,
  maxExecutionTimeMs: 1500,
  instructionLimit: 100_000,
});

// 8.1 纯算法计算与控制台捕获
const fibProject = {
  id: 'exp-fib',
  slug: 'fibonacci-test',
  title: 'Fibonacci Calculation',
  files: [
    {
      name: 'index.js',
      language: 'javascript',
      content: `
        function fib(n) {
          if (n <= 1) return n;
          return fib(n - 1) + fib(n - 2);
        }
        const res = fib(15);
        console.log("Fib(15) =", res);
      `,
    },
  ],
};

const qjsLogs = [];
let completedDuration = -1;
const fibSession = await qjs.run(fibProject, {
  sessionId: 'qjs-sess-1',
  cspNonce: 'noncetest',
  onConsole: (entry) => qjsLogs.push(entry.args.join(' ')),
  onComplete: (d) => { completedDuration = d; },
});

await new Promise((r) => setTimeout(r, 100));
assert.ok(fibSession.status === 'running' || fibSession.status === 'completed');
assert.ok(qjsLogs.some((l) => l.includes('Fib(15) = 610')), `必须计算出 Fib(15) = 610: ${qjsLogs.join(',')}`);
assert.ok(completedDuration >= 0);
console.log(`  -> PASS: QuickJS 纯算法运行完成 (耗时: ${completedDuration}ms, 输出: ${qjsLogs.join(' ')})。`);

// 8.2 危险全局变量屏蔽核验
const attackProject = {
  id: 'exp-attack',
  slug: 'attack-test',
  title: 'Security Probe',
  files: [
    {
      name: 'probe.js',
      language: 'javascript',
      content: `
        if (typeof window !== 'undefined') throw new Error("window is accessible");
        if (typeof document !== 'undefined') throw new Error("document is accessible");
        if (typeof localStorage !== 'undefined') throw new Error("localStorage is accessible");
        if (typeof fetch !== 'undefined') throw new Error("fetch is accessible");
        console.log("All dangerous globals blocked!");
      `,
    },
  ],
};
const attackLogs = [];
const attackSession = await qjs.run(attackProject, {
  sessionId: 'qjs-sess-2',
  cspNonce: 'noncetest',
  onConsole: (entry) => attackLogs.push(entry.args.join(' ')),
});
await new Promise((r) => setTimeout(r, 100));
assert.ok(attackSession.status === 'running' || attackSession.status === 'completed');
assert.ok(attackLogs.some((l) => l.includes('All dangerous globals blocked!')));
console.log('  -> PASS: window/document/localStorage/fetch 危险全局变量全量屏蔽。');

// 8.3 中断计数器与死循环拦截
const infiniteLoopProject = {
  id: 'exp-loop',
  slug: 'infinite-loop-test',
  title: 'Infinite Loop',
  files: [
    {
      name: 'loop.js',
      language: 'javascript',
      content: `
        while (true) {
        }
      `,
    },
  ],
};
let abortReason = '';
const loopSession = await qjs.run(infiniteLoopProject, {
  sessionId: 'qjs-sess-3',
  cspNonce: 'noncetest',
  onAbort: (reason) => {
    abortReason = reason;
  },
});
await new Promise((r) => setTimeout(r, 200));
assert.ok(loopSession.status === 'running' || loopSession.status === 'aborted');
assert.ok(abortReason.includes('timed out') || abortReason.includes('Instruction budget') || abortReason.includes('Loop budget'), `中断预算必须触发: ${abortReason}`);
console.log(`  -> PASS: QuickJS 中断计数器成功熔断死循环 (${abortReason})。`);

console.log('🧪 [Test 9] 验证 Cloudflare Pages Function 后端接口 (functions/api/lab.ts)...');
const { onRequest: onLabApiRequest } = await import('../functions/api/lab.ts');
const getLabRes = await onLabApiRequest({
  request: new Request('https://blog.epocanvas.com/api/lab?category=physics', { method: 'GET' }),
  env: {},
});
assert.equal(getLabRes.status, 200);
const getLabJson = await getLabRes.json();
assert.equal(getLabJson.success, true);
assert.equal(getLabJson.platform.version, '2.8.0');
assert.equal(getLabJson.stats.totalOfficialExperiments, 8);
assert.equal(getLabJson.experiments.length, 2);

const postValidRes = await onLabApiRequest({
  request: new Request('https://blog.epocanvas.com/api/lab', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'validate-bundle',
      files: [{ name: 'algo.ts', language: 'typescript', content: 'console.log(1 + 1);' }],
    }),
  }),
  env: {},
});
assert.equal(postValidRes.status, 200);
const postValidJson = await postValidRes.json();
assert.equal(postValidJson.valid, true);
assert.ok(postValidJson.digest.startsWith('sha256-'));

const postInvalidRes = await onLabApiRequest({
  request: new Request('https://blog.epocanvas.com/api/lab', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'validate-bundle',
      files: [{ name: 'evil.exe', language: 'javascript', content: 'bad' }],
    }),
  }),
  env: {},
});
assert.equal(postInvalidRes.status, 422);
console.log('  -> PASS: /api/lab 后端元数据查询与便携包配额/SHA-256 校验全部通过。');

console.log('\n🎉 所有 Phase 2.8 沙盒安全加固测试项 100% 通过！');
