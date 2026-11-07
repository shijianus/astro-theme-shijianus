/**
 * Astro Blog「试验田 Lab」Browser DOM 运行时适配器契约审计脚本 (verify-browser-dom-runtime.mjs)
 *
 * 验证 Phase 2.8 契约测试规范：
 * 1. run 挂载与启动
 * 2. stop 终止与资源清理
 * 3. execution timeout 看门狗超时熔断
 * 4. stale session 过期会话消息丢弃
 * 5. stale sequence 过期序列号拦截
 * 6. duplicate sequence 重复序列号拦截
 * 7. out-of-order sequence 乱序低序拦截
 * 8. iframe removal 容器 DOM 回收
 * 9. listener removal 事件监听器解绑
 * 10. watchdog cleanup 看门狗定时器防泄漏
 * 11. repeated run 重复执行旧实例安全销毁
 * 12. dispose idempotency 销毁幂等性
 */
import assert from 'node:assert/strict';

// 1. 构造隔离 Mock DOM 环境
class MockIFrameElement {
  constructor() {
    this.tagName = 'IFRAME';
    this.attributes = new Map();
    this.src = '';
    this.srcdoc = '';
    this.style = {};
    this.parentNode = null;
    this.contentWindow = {
      postMessage: (msg, targetOrigin) => {
        MockIFrameElement.sentMessages.push({ msg, targetOrigin });
      },
    };
  }
  setAttribute(k, v) {
    this.attributes.set(k, v);
  }
  getAttribute(k) {
    return this.attributes.get(k);
  }
}
MockIFrameElement.sentMessages = [];

class MockElement {
  constructor(tag = 'DIV') {
    this.tagName = tag;
    this.children = [];
    this.parentNode = null;
  }
  appendChild(child) {
    child.parentNode = this;
    this.children.push(child);
    return child;
  }
  removeChild(child) {
    const idx = this.children.indexOf(child);
    if (idx >= 0) {
      this.children.splice(idx, 1);
      child.parentNode = null;
    }
    return child;
  }
}

const windowListeners = new Map();
const mockWindow = {
  location: { origin: 'https://blog.epocanvas.com' },
  addEventListener: (event, handler) => {
    if (!windowListeners.has(event)) windowListeners.set(event, new Set());
    windowListeners.get(event).add(handler);
  },
  removeEventListener: (event, handler) => {
    const set = windowListeners.get(event);
    if (set) set.delete(handler);
  },
  dispatchMessage: (event) => {
    const set = windowListeners.get('message');
    if (set) {
      for (const fn of Array.from(set)) {
        fn(event);
      }
    }
  },
};

const mockDocument = {
  createElement: (tag) => {
    if (tag.toLowerCase() === 'iframe') return new MockIFrameElement();
    return new MockElement(tag);
  },
  querySelector: () => null,
  body: new MockElement('BODY'),
};

globalThis.window = mockWindow;
globalThis.document = mockDocument;

// 2. 动态加载 BrowserDomRuntime
const { BrowserDomRuntime } = await import('../src/lib/lab/adapters/BrowserDomRuntime.ts');

const sampleProject = {
  id: 'test-exp',
  slug: 'test-exp',
  title: 'Test Experiment',
  files: [
    { name: 'index.html', language: 'html', content: '<h1>Hello Lab</h1>' },
    { name: 'script.js', language: 'javascript', content: 'console.log("running");' },
  ],
};

console.log('🧪 开始执行 BrowserDomRuntime 契约测试规范...\n');

// Test 1: run
{
  const runtime = new BrowserDomRuntime();
  const container = new MockElement('CONTAINER');
  let status = 'idle';

  const session = await runtime.run(sampleProject, {
    sessionId: 'session-run-001',
    container,
    onStatusChange: (s) => { status = s; },
  });

  assert.equal(session.status, 'running', 'session.status 必须为 running');
  assert.equal(container.children.length, 1, 'container 必须包含挂载的 iframe');
  assert.equal(container.children[0].tagName, 'IFRAME', '挂载子元素必须为 IFRAME');
  assert.ok(container.children[0].srcdoc.includes('Hello Lab'), 'srcdoc 必须包含工程代码');
  assert.equal(status, 'running', 'onStatusChange 必须流转到 running');

  await runtime.dispose();
  console.log('  ✓ Test 1 Passed: run 挂载与启动正常');
}

// Test 2: stop
{
  const runtime = new BrowserDomRuntime();
  const container = new MockElement('CONTAINER');
  MockIFrameElement.sentMessages = [];

  await runtime.run(sampleProject, {
    sessionId: 'session-stop-002',
    container,
  });

  await runtime.stop('session-stop-002');
  const termMsg = MockIFrameElement.sentMessages.find(
    (m) => m.msg && m.msg.type === 'TERMINATE_SESSION'
  );
  assert.ok(termMsg, 'stop 必须向 iframe 发送 TERMINATE_SESSION 控制消息');

  await runtime.dispose();
  console.log('  ✓ Test 2 Passed: stop 终止与控制消息发送正常');
}

// Test 3: execution timeout
{
  const runtime = new BrowserDomRuntime();
  const container = new MockElement('CONTAINER');
  let abortedReason = '';

  await runtime.run(sampleProject, {
    sessionId: 'session-timeout-003',
    container,
    timeoutMs: 80,
    onAbort: (r) => { abortedReason = r; },
  });

  await new Promise((r) => setTimeout(r, 120));
  assert.ok(abortedReason.includes('timed out'), '看门狗超时必须触发 onAbort 并注明原因');

  await runtime.dispose();
  console.log('  ✓ Test 3 Passed: execution timeout 看门狗超时熔断通过');
}

// Test 4: stale session
{
  const runtime = new BrowserDomRuntime();
  const container = new MockElement('CONTAINER');
  const logs = [];

  await runtime.run(sampleProject, {
    sessionId: 'valid-session-004',
    container,
    onConsole: (e) => logs.push(e),
  });

  const iframe = container.children[0];
  // 伪造来自其他会话的消息
  mockWindow.dispatchMessage({
    source: iframe.contentWindow,
    origin: 'null',
    data: {
      protocol: 'LAB_SANDBOX_PROTOCOL_V1',
      sessionId: 'stale-session-999',
      seq: 1,
      type: 'CONSOLE_EVENT',
      payload: { level: 'log', args: ['stale message'] },
    },
  });

  assert.equal(logs.length, 0, '过期或不匹配的 session 消息必须被严格拦截丢弃');

  await runtime.dispose();
  console.log('  ✓ Test 4 Passed: stale session 过期会话消息防御通过');
}

// Test 5, 6, 7: sequence verification (stale, duplicate, out-of-order)
{
  const runtime = new BrowserDomRuntime();
  const container = new MockElement('CONTAINER');
  const logs = [];

  await runtime.run(sampleProject, {
    sessionId: 'seq-session-005',
    container,
    onConsole: (e) => logs.push(e.args[0]),
  });

  const iframe = container.children[0];

  // 1. 发送合法序号 seq: 1
  mockWindow.dispatchMessage({
    source: iframe.contentWindow,
    origin: 'null',
    data: {
      protocol: 'LAB_SANDBOX_PROTOCOL_V1',
      sessionId: 'seq-session-005',
      seq: 1,
      type: 'CONSOLE_EVENT',
      payload: { level: 'log', args: ['msg-1'] },
    },
  });
  assert.equal(logs.length, 1);
  assert.equal(logs[0], 'msg-1');

  // 2. 发送 duplicate 序号 seq: 1 -> 必须被丢弃
  mockWindow.dispatchMessage({
    source: iframe.contentWindow,
    origin: 'null',
    data: {
      protocol: 'LAB_SANDBOX_PROTOCOL_V1',
      sessionId: 'seq-session-005',
      seq: 1,
      type: 'CONSOLE_EVENT',
      payload: { level: 'log', args: ['msg-duplicate-1'] },
    },
  });
  assert.equal(logs.length, 1, 'duplicate seq 必须被丢弃');

  // 3. 发送更高序号 seq: 5 -> 成功
  mockWindow.dispatchMessage({
    source: iframe.contentWindow,
    origin: 'null',
    data: {
      protocol: 'LAB_SANDBOX_PROTOCOL_V1',
      sessionId: 'seq-session-005',
      seq: 5,
      type: 'CONSOLE_EVENT',
      payload: { level: 'log', args: ['msg-5'] },
    },
  });
  assert.equal(logs.length, 2);
  assert.equal(logs[1], 'msg-5');

  // 4. 发送 out-of-order 乱序旧序号 seq: 3 (< 5) -> 必须被丢弃
  mockWindow.dispatchMessage({
    source: iframe.contentWindow,
    origin: 'null',
    data: {
      protocol: 'LAB_SANDBOX_PROTOCOL_V1',
      sessionId: 'seq-session-005',
      seq: 3,
      type: 'CONSOLE_EVENT',
      payload: { level: 'log', args: ['msg-stale-3'] },
    },
  });
  assert.equal(logs.length, 2, 'stale / out-of-order 序列号必须被丢弃');

  await runtime.dispose();
  console.log('  ✓ Test 5, 6, 7 Passed: 双向 sequence (duplicate / stale / out-of-order) 防御通过');
}

// Test 8: iframe removal
{
  const runtime = new BrowserDomRuntime();
  const container = new MockElement('CONTAINER');

  await runtime.run(sampleProject, {
    sessionId: 'removal-008',
    container,
  });
  assert.equal(container.children.length, 1);

  await runtime.dispose();
  assert.equal(container.children.length, 0, 'dispose 必须彻底从父容器移除挂载的 iframe');
  console.log('  ✓ Test 8 Passed: iframe removal 容器 DOM 彻底回收');
}

// Test 9: listener removal
{
  const runtime = new BrowserDomRuntime();
  const container = new MockElement('CONTAINER');

  await runtime.run(sampleProject, {
    sessionId: 'listener-009',
    container,
  });
  const listenerCountBefore = (windowListeners.get('message') || new Set()).size;
  assert.ok(listenerCountBefore >= 1, '运行期间必须注册 message 监听器');

  await runtime.dispose();
  const listenerCountAfter = (windowListeners.get('message') || new Set()).size;
  assert.equal(listenerCountAfter, 0, 'dispose 必须移除注册的 window message 监听器');
  console.log('  ✓ Test 9 Passed: listener removal 事件监听器完整解绑');
}

// Test 10: watchdog cleanup
{
  const runtime = new BrowserDomRuntime();
  const container = new MockElement('CONTAINER');
  let abortCalled = false;

  await runtime.run(sampleProject, {
    sessionId: 'watchdog-010',
    container,
    timeoutMs: 100,
    onAbort: () => { abortCalled = true; },
  });

  const iframe = container.children[0];
  // 模拟沙盒提前正常完成执行
  mockWindow.dispatchMessage({
    source: iframe.contentWindow,
    origin: 'null',
    data: {
      protocol: 'LAB_SANDBOX_PROTOCOL_V1',
      sessionId: 'watchdog-010',
      seq: 1,
      type: 'EXECUTION_COMPLETE',
      payload: { durationMs: 20 },
    },
  });

  // 等待超过 timeout 耗时
  await new Promise((r) => setTimeout(r, 130));
  assert.equal(abortCalled, false, '沙盒完成后必须自动清除 watchdog，不得触发虚假超时');

  await runtime.dispose();
  console.log('  ✓ Test 10 Passed: watchdog cleanup 执行完成后定时器完整清理');
}

// Test 11: repeated run
{
  const runtime = new BrowserDomRuntime();
  const container = new MockElement('CONTAINER');

  await runtime.run(sampleProject, {
    sessionId: 'run-first-011',
    container,
  });
  assert.equal(container.children.length, 1);
  const firstIframe = container.children[0];

  // 重复调用 run
  await runtime.run(sampleProject, {
    sessionId: 'run-second-011',
    container,
  });
  assert.equal(container.children.length, 1, '重复 run 时容器内必须只保留当前活跃的一个 iframe');
  assert.notEqual(container.children[0], firstIframe, '重复 run 必须销毁旧 iframe 实例并创建新实例');

  await runtime.dispose();
  console.log('  ✓ Test 11 Passed: repeated run 重复执行旧实例安全销毁通过');
}

// Test 12: dispose idempotency
{
  const runtime = new BrowserDomRuntime();
  const container = new MockElement('CONTAINER');

  await runtime.run(sampleProject, {
    sessionId: 'idempotent-012',
    container,
  });

  // 连续多次调用 dispose 绝不抛错
  await runtime.dispose();
  await runtime.dispose();
  await runtime.dispose();

  assert.equal(container.children.length, 0);
  console.log('  ✓ Test 12 Passed: dispose idempotency 销毁幂等性通过');
}

console.log('\n🎉 所有 12 项 BrowserDomRuntime 契约测试全部 100% 通过！\n');
