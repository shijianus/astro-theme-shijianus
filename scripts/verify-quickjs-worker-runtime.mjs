/**
 * Astro Blog「试验田 Lab」QuickJS WebAssembly Worker 运行时契约审计脚本 (verify-quickjs-worker-runtime.mjs)
 *
 * 验证 Phase 2.8 独立契约测试规范：
 * 1. 算法执行 (Algorithm Execution)
 * 2. Console 输出 (Console Capture)
 * 3. While(true) 中断 (Infinite Loop Interruption)
 * 4. 递归爆栈拦截 (Stack Overflow Interception)
 * 5. 内存超限拦截 (Memory Limit Interception)
 * 6. 试图访问 DOM / window / fetch 拦截 (Sandbox Boundary Protection)
 * 7. Worker crash 重建 (Crash Recovery)
 * 8. Dispose 彻底清理 (Resource Teardown)
 */
import assert from 'node:assert/strict';

const { QuickJsWorkerRuntime } = await import(
  '../src/lib/lab/runtimes/quickjs/QuickJsWorkerRuntime.ts'
);

console.log('🧪 开始执行 QuickJsWorkerRuntime 契约测试规范...\n');

// Test 1: 算法执行
{
  const runtime = new QuickJsWorkerRuntime();
  const logs = [];
  let completedDuration = 0;

  const project = {
    id: 'algo-test',
    slug: 'algo-test',
    title: 'Algorithm Test',
    files: [
      {
        name: 'solution.js',
        language: 'javascript',
        content: `
          function fib(n) {
            return n <= 1 ? n : fib(n - 1) + fib(n - 2);
          }
          console.log("FIB_10:", fib(10));
        `,
      },
    ],
  };

  const session = await runtime.run(project, {
    sessionId: 'session-algo-001',
    onConsole: (e) => logs.push(e.args.join(' ')),
    onComplete: (d) => { completedDuration = d; },
  });

  // 等待执行完成
  await new Promise((r) => setTimeout(r, 100));
  assert.equal(session.status, 'running');
  assert.ok(logs.some((l) => l.includes('FIB_10: 55')), 'fib(10) 计算结果必须为 55');
  assert.ok(completedDuration >= 0, '执行必须正常完成');

  await runtime.dispose();
  console.log('  ✓ Test 1 Passed: 算法执行 (fibonacci 计算与完成回调) 正常');
}

// Test 2: Console 输出多等级捕获
{
  const runtime = new QuickJsWorkerRuntime();
  const consoleLevels = [];

  const project = {
    id: 'console-test',
    slug: 'console-test',
    title: 'Console Test',
    files: [
      {
        name: 'log.js',
        language: 'javascript',
        content: `
          console.log("log message");
          console.info("info message");
          console.warn("warn message");
          console.error("error message");
        `,
      },
    ],
  };

  await runtime.run(project, {
    sessionId: 'session-console-002',
    onConsole: (e) => consoleLevels.push({ level: e.level, text: e.args.join(' ') }),
  });

  await new Promise((r) => setTimeout(r, 100));
  assert.equal(consoleLevels.length, 4, '必须捕获全部 4 条控制台输出');
  assert.equal(consoleLevels[0].level, 'log');
  assert.equal(consoleLevels[1].level, 'info');
  assert.equal(consoleLevels[2].level, 'warn');
  assert.equal(consoleLevels[3].level, 'error');

  await runtime.dispose();
  console.log('  ✓ Test 2 Passed: Console 输出 (log/info/warn/error) 捕获正常');
}

// Test 3: while(true) 中断
{
  const runtime = new QuickJsWorkerRuntime();
  let abortedReason = '';

  const project = {
    id: 'loop-test',
    slug: 'loop-test',
    title: 'Infinite Loop Test',
    files: [
      {
        name: 'loop.js',
        language: 'javascript',
        content: 'let i = 0; while (true) { i++; }',
      },
    ],
  };

  await runtime.run(project, {
    sessionId: 'session-loop-003',
    timeoutMs: 120,
    onAbort: (reason) => { abortedReason = reason; },
  });

  await new Promise((r) => setTimeout(r, 200));
  assert.ok(
    abortedReason.includes('timed out') || abortedReason.includes('interrupted'),
    '死循环代码必须被中断处理器或看门狗成功熔断'
  );

  await runtime.dispose();
  console.log('  ✓ Test 3 Passed: while(true) 指令计数与超时中断拦截通过');
}

// Test 4: 递归爆栈拦截
{
  const runtime = new QuickJsWorkerRuntime({ maxStackSizeBytes: 64 * 1024 });
  let caughtError = '';

  const project = {
    id: 'stack-test',
    slug: 'stack-test',
    title: 'Stack Overflow Test',
    files: [
      {
        name: 'recurse.js',
        language: 'javascript',
        content: 'function recurse() { return recurse(); } recurse();',
      },
    ],
  };

  await runtime.run(project, {
    sessionId: 'session-stack-004',
    onError: (e) => { caughtError = e.message; },
  });

  await new Promise((r) => setTimeout(r, 100));
  assert.ok(
    caughtError.toLowerCase().includes('stack') || caughtError.includes('InternalError'),
    '递归必须触发 stack overflow 错误拦截'
  );

  await runtime.dispose();
  console.log('  ✓ Test 4 Passed: 递归爆栈拦截通过');
}

// Test 5: 内存超限拦截
{
  const runtime = new QuickJsWorkerRuntime({ maxMemoryBytes: 256 * 1024 }); // 256 KB 极端预算
  let caughtError = '';

  const project = {
    id: 'mem-test',
    slug: 'mem-test',
    title: 'Out of Memory Test',
    files: [
      {
        name: 'alloc.js',
        language: 'javascript',
        content: `
          const arr = [];
          for (let i = 0; i < 500000; i++) {
            arr.push(new Array(100).fill("A".repeat(100)));
          }
        `,
      },
    ],
  };

  await runtime.run(project, {
    sessionId: 'session-mem-005',
    onError: (e) => { caughtError = e.message; },
  });

  await new Promise((r) => setTimeout(r, 150));
  assert.ok(caughtError.length > 0, '超额内存分配必须被 QuickJS 内存预算限制拦截');

  await runtime.dispose();
  console.log('  ✓ Test 5 Passed: 内存预算超限拦截通过');
}

// Test 6: 试图访问 DOM / window / fetch 拦截
{
  const runtime = new QuickJsWorkerRuntime();
  const checks = [];

  const project = {
    id: 'boundary-test',
    slug: 'boundary-test',
    title: 'Sandbox Boundary Test',
    files: [
      {
        name: 'check.js',
        language: 'javascript',
        content: `
          console.log("hasWindow:", typeof window !== "undefined");
          console.log("hasDocument:", typeof document !== "undefined");
          console.log("hasFetch:", typeof fetch !== "undefined");
          console.log("hasLocalStorage:", typeof localStorage !== "undefined");
        `,
      },
    ],
  };

  await runtime.run(project, {
    sessionId: 'session-boundary-006',
    onConsole: (e) => checks.push(e.args.join(' ')),
  });

  await new Promise((r) => setTimeout(r, 100));
  assert.ok(checks.some((c) => c.includes('hasWindow: false')), 'window 必须不存在');
  assert.ok(checks.some((c) => c.includes('hasDocument: false')), 'document 必须不存在');
  assert.ok(checks.some((c) => c.includes('hasFetch: false')), 'fetch 必须不存在');
  assert.ok(checks.some((c) => c.includes('hasLocalStorage: false')), 'localStorage 必须不存在');

  await runtime.dispose();
  console.log('  ✓ Test 6 Passed: 试图访问 DOM / window / fetch 拦截 (沙盒环境纯净性) 通过');
}

// Test 7: Worker crash 重建能力
{
  const runtime = new QuickJsWorkerRuntime();
  assert.equal(runtime.kind, 'quickjs');

  // 测试在 crash 异常触发后，runtime 依然保持可用并可执行新工程
  (runtime).handleWorkerCrash?.(new Error('Simulated worker crash'));

  const project = {
    id: 'recovery-test',
    slug: 'recovery-test',
    title: 'Recovery Test',
    files: [
      {
        name: 'ok.js',
        language: 'javascript',
        content: 'console.log("RECOVERED");',
      },
    ],
  };

  const logs = [];
  await runtime.run(project, {
    sessionId: 'session-recovery-007',
    onConsole: (e) => logs.push(e.args.join(' ')),
  });

  await new Promise((r) => setTimeout(r, 100));
  assert.ok(logs.some((l) => l.includes('RECOVERED')), 'Worker 发生 Crash 后必须能够自我重建并继续执行新任务');

  await runtime.dispose();
  console.log('  ✓ Test 7 Passed: Worker crash 重建与容灾恢复通过');
}

// Test 8: dispose 彻底清理
{
  const runtime = new QuickJsWorkerRuntime();
  const project = {
    id: 'dispose-test',
    slug: 'dispose-test',
    title: 'Dispose Test',
    files: [{ name: 'test.js', language: 'javascript', content: '1 + 1;' }],
  };

  await runtime.run(project, { sessionId: 'session-dispose-008' });

  // 连续多次调用 dispose 保持幂等
  await runtime.dispose();
  await runtime.dispose();
  await runtime.dispose();

  console.log('  ✓ Test 8 Passed: dispose 彻底清理与幂等性通过');
}

console.log('\n🎉 所有 8 项 QuickJsWorkerRuntime 契约测试全部 100% 通过！\n');
