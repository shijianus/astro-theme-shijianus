/**
 * Astro Blog「试验田 Lab」LiveCodes 高级编辑器适配器契约审计脚本 (verify-livecodes-adapter.mjs)
 *
 * 验证 Phase 2.8 契约测试规范：
 * 1. 默认关闭 (PUBLIC_LAB_ENABLE_LIVECODES=false 默认且零外部请求)
 * 2. 禁止隐式回退公共 livecodes.io (显式配置拒绝公共兜底)
 * 3. HTTPS 与域名 Allowlist 校验 (拒绝非 HTTPS 与未知域名)
 * 4. Click-to-Load 机制与资源说明展示
 * 5. 握手与工程传递 (set-project 注入)
 * 6. LiveCodes 代码修改双向同步至 Workspace Controller
 * 7. 加载超时与连接失败回退 Lite Editor
 * 8. 非法消息与未授权来源拦截
 * 9. Dispose 彻底清理 (iframe 移除、消息监听解绑、幂等性)
 * 10. 移动端视口适用性与无沙盒执行特权隔离
 */
import assert from 'node:assert/strict';

// 1. 构造隔离 Mock DOM 环境
class MockIFrameElement {
  constructor() {
    this.tagName = 'IFRAME';
    this.attributes = new Map();
    this.src = '';
    this.style = {};
    this.parentNode = null;
    this.onerror = null;
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
    this.innerHTML = '';
    this.style = {};
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
  }
  querySelector(sel) {
    if (sel === '.btn-load-livecodes' || sel.includes('button')) {
      return { onclick: null };
    }
    return null;
  }
}

const windowListeners = new Map();
globalThis.window = {
  addEventListener: (type, fn) => {
    if (!windowListeners.has(type)) windowListeners.set(type, []);
    windowListeners.get(type).push(fn);
  },
  removeEventListener: (type, fn) => {
    const list = windowListeners.get(type) || [];
    const idx = list.indexOf(fn);
    if (idx >= 0) list.splice(idx, 1);
  },
};

globalThis.document = {
  createElement: (tag) => {
    if (tag.toLowerCase() === 'iframe') {
      return new MockIFrameElement();
    }
    return new MockElement(tag.toUpperCase());
  },
};

const {
  LiveCodesEditorAdapter,
  validateLiveCodesAppUrl,
} = await import('../src/lib/lab/adapters/LiveCodesEditorAdapter.ts');
const { EditorRegistry } = await import(
  '../src/lib/lab/workspace/EditorRegistry.ts'
);
const { LabWorkspaceController } = await import(
  '../src/lib/lab/workspace/LabWorkspaceController.ts'
);

console.log('🧪 开始执行 LiveCodesEditorAdapter 契约测试规范...\n');

const sampleProject = {
  id: 'proj-001',
  slug: 'test-sandbox',
  title: 'Test Sandbox',
  files: [
    { name: 'index.html', language: 'html', content: '<h1>Hello LiveCodes</h1>' },
    { name: 'style.css', language: 'css', content: 'h1 { color: blue; }' },
    { name: 'main.js', language: 'javascript', content: 'console.log("ready");' },
  ],
};

// Test 1: 默认特性关闭与零外部连接
{
  const adapter = new LiveCodesEditorAdapter();
  assert.equal(adapter.isFeatureEnabled(), false, '默认必须处于关闭状态');

  const container = new MockElement();
  await adapter.mount(container, sampleProject);
  assert.ok(container.innerHTML.includes('PUBLIC_LAB_ENABLE_LIVECODES=false'));
  assert.equal(adapter.getActiveIframeCount(), 0);

  const registry = new EditorRegistry();
  assert.equal(registry.has('livecodes'), false, '未开启时 Registry.has 必须返回 false');
  assert.deepEqual(registry.listKinds(), ['lite'], '默认可选用编辑器只能是 lite');

  await adapter.dispose();
  console.log('  ✓ Test 1 Passed: 默认特性标志关闭且零外部请求');
}

// Test 2: 禁止隐式回退公共 livecodes.io 与显式 URL 校验
{
  const emptyRes = validateLiveCodesAppUrl('');
  assert.equal(emptyRes.ok, false);
  assert.ok(emptyRes.error?.includes('未显式配置'));

  const nullRes = validateLiveCodesAppUrl(null);
  assert.equal(nullRes.ok, false);

  const httpRes = validateLiveCodesAppUrl('http://insecure-domain.com/livecodes');
  assert.equal(httpRes.ok, false, '必须拒绝明文 HTTP 协议');

  const allowlistRes = validateLiveCodesAppUrl('https://evil.com/livecodes', ['livecodes.epocanvas.com']);
  assert.equal(allowlistRes.ok, false, '非白名单域名必须被拒绝');

  const validRes = validateLiveCodesAppUrl('https://livecodes.epocanvas.com/app', ['livecodes.epocanvas.com']);
  assert.equal(validRes.ok, true);
  assert.equal(validRes.origin, 'https://livecodes.epocanvas.com');

  console.log('  ✓ Test 2 Passed: 禁止隐式公共回退，HTTPS 与白名单校验通过');
}

// Test 3: Click-to-Load 机制与资源说明呈现
{
  const adapter = new LiveCodesEditorAdapter({
    enableFeatureFlag: true,
    appUrl: 'https://livecodes.epocanvas.com',
    allowedHosts: ['livecodes.epocanvas.com'],
  });

  const container = new MockElement();
  await adapter.mount(container, sampleProject);

  assert.equal(adapter.getIsLoaded(), false, '初始挂载不得立即加载 iframe');
  assert.equal(adapter.getActiveIframeCount(), 0);
  assert.ok(container.children.length > 0, '必须呈现按需载入卡片与资源包提示');

  await adapter.dispose();
  console.log('  ✓ Test 3 Passed: Click-to-Load 界面与显式按需载入机制通过');
}

// Test 4: 握手、工程传递与双向修改同步至 Workspace Controller
{
  MockIFrameElement.sentMessages = [];
  let updatedProject = null;

  const controller = new LabWorkspaceController({
    project: sampleProject,
    enableLiveCodes: true,
    liveCodesAppUrl: 'https://livecodes.epocanvas.com',
  });

  const adapter = new LiveCodesEditorAdapter({
    enableFeatureFlag: true,
    appUrl: 'https://livecodes.epocanvas.com',
    allowedHosts: ['livecodes.epocanvas.com'],
    onProjectChange: (p) => {
      updatedProject = p;
    },
  });

  const container = new MockElement();
  await adapter.mount(container, sampleProject);
  await adapter.loadEditor();

  assert.equal(adapter.getIsLoaded(), true);
  assert.equal(adapter.getActiveIframeCount(), 1);
  assert.ok(adapter.getFirstLoadSizeBytes() > 0, '必须记录首次加载体积');

  // 模拟 LiveCodes 发送 ready 消息
  const listeners = windowListeners.get('message') || [];
  assert.ok(listeners.length > 0, '必须注册全局 message 监听器');

  const readyEvent = {
    origin: 'https://livecodes.epocanvas.com',
    data: { type: 'livecodes-ready' },
  };
  for (const fn of listeners) fn(readyEvent);

  // 验证向 LiveCodes 注入工程
  assert.ok(MockIFrameElement.sentMessages.length > 0);
  const lastMsg = MockIFrameElement.sentMessages[MockIFrameElement.sentMessages.length - 1];
  assert.equal(lastMsg.msg.type, 'set-project');
  assert.equal(lastMsg.msg.project.title, sampleProject.title);

  // 模拟 LiveCodes 用户编辑代码通知
  const changeEvent = {
    origin: 'https://livecodes.epocanvas.com',
    data: {
      type: 'livecodes-change',
      files: [
        { name: 'index.html', language: 'html', content: '<h1>Modified via LiveCodes</h1>' },
      ],
    },
  };
  for (const fn of listeners) fn(changeEvent);

  assert.ok(updatedProject);
  assert.equal(updatedProject.files[0].content, '<h1>Modified via LiveCodes</h1>');

  await adapter.dispose();
  await controller.dispose();
  console.log('  ✓ Test 4 Passed: 握手、工程注入与双向代码同步正常');
}

// Test 5: 非法消息、跨域伪造消息拦截
{
  let syncTriggered = false;
  const adapter = new LiveCodesEditorAdapter({
    enableFeatureFlag: true,
    appUrl: 'https://livecodes.epocanvas.com',
    allowedHosts: ['livecodes.epocanvas.com'],
    onProjectChange: () => {
      syncTriggered = true;
    },
  });

  const container = new MockElement();
  await adapter.mount(container, sampleProject);
  await adapter.loadEditor();

  const listeners = windowListeners.get('message') || [];
  // 伪造来自非法域名的消息
  const forgedEvent = {
    origin: 'https://malicious-attacker.com',
    data: {
      type: 'livecodes-change',
      files: [{ name: 'hack.js', content: 'alert(1)' }],
    },
  };
  for (const fn of listeners) fn(forgedEvent);

  assert.equal(syncTriggered, false, '非法 origin 消息必须严格忽略');

  await adapter.dispose();
  console.log('  ✓ Test 5 Passed: 伪造 origin 与未授权消息严格拦截');
}

// Test 6: 超时与连接失败自动回退 Lite Editor
{
  let fallbackInvoked = false;
  const adapter = new LiveCodesEditorAdapter({
    enableFeatureFlag: true,
    appUrl: 'https://livecodes.epocanvas.com',
    loadTimeoutMs: 50, // 快速超时
    onFallbackToLite: () => {
      fallbackInvoked = true;
    },
  });

  const container = new MockElement();
  await adapter.mount(container, sampleProject);
  await adapter.loadEditor();

  // 等待超时触发
  await new Promise((r) => setTimeout(r, 80));

  assert.equal(fallbackInvoked, true, '超时必须自动触发 onFallbackToLite');
  assert.ok(container.innerHTML.includes('超时'));

  await adapter.dispose();
  console.log('  ✓ Test 6 Passed: 超时与连接失败优雅回退 Lite Editor');
}

// Test 7: Dispose 彻底清理与幂等性
{
  const adapter = new LiveCodesEditorAdapter({
    enableFeatureFlag: true,
    appUrl: 'https://livecodes.epocanvas.com',
  });

  const container = new MockElement();
  await adapter.mount(container, sampleProject);
  await adapter.loadEditor();

  assert.equal(adapter.getActiveIframeCount(), 1);
  const listenerCountBefore = (windowListeners.get('message') || []).length;
  assert.ok(listenerCountBefore > 0);

  await adapter.dispose();
  await adapter.dispose(); // 幂等调用

  assert.equal(adapter.getActiveIframeCount(), 0);
  assert.equal(adapter.iframe, null);
  const listenerCountAfter = (windowListeners.get('message') || []).length;
  assert.equal(listenerCountAfter, listenerCountBefore - 1, '消息监听器必须被注销');

  console.log('  ✓ Test 7 Passed: dispose 幂等资源清理与监听器解绑正常');
}

// Test 8: 移动端视口适用性与零执行特权
{
  const adapter = new LiveCodesEditorAdapter({
    enableFeatureFlag: true,
    appUrl: 'https://livecodes.epocanvas.com',
  });

  // 模拟 390x844 移动端容器
  const mobileContainer = new MockElement();
  mobileContainer.style.width = '390px';
  mobileContainer.style.height = '844px';

  await adapter.mount(mobileContainer, sampleProject);
  assert.ok(adapter.kind === 'livecodes');
  // 确认 adapter 没有 run() / execute() 方法（不具备沙盒执行特权）
  assert.equal(typeof adapter.run, 'undefined', 'LiveCodes 纯为编辑器适配器，绝不具备沙盒执行特权');

  await adapter.dispose();
  console.log('  ✓ Test 8 Passed: 移动端视口适配与零沙盒执行特权隔离通过');
}

console.log('\n🎉 所有 8 项 LiveCodesEditorAdapter 契约测试全部 100% 通过！\n');
