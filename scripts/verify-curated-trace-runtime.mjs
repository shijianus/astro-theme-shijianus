/**
 * Astro Blog「试验田 Lab」CuratedTraceRuntime 确定性追踪运行时契约审计脚本 (verify-curated-trace-runtime.mjs)
 */
import assert from 'node:assert/strict';

const { CuratedTraceRuntime, MAX_TRACE_STEPS, MAX_PATCH_BYTES } = await import(
  '../src/lib/lab/adapters/CuratedTraceRuntime.ts'
);
const { RuntimeRegistry } = await import(
  '../src/lib/lab/workspace/RuntimeRegistry.ts'
);

console.log('🧪 开始执行 CuratedTraceRuntime 契约测试规范...\n');

const sampleProject = {
  id: 'trace-test-exp',
  slug: 'algorithm-execution-tracer',
  title: 'Algorithm Execution Tracer',
  files: [{ name: 'tracer.ts', language: 'typescript', content: '// Deterministic trace' }],
  visualizationConfig: {
    enabled: true,
    presetAlgorithmId: 'bubble-sort',
    defaultInput: '38, 14, 29, 7, 42, 19, 11',
    description: 'Bubble sort execution trace',
  },
};

const nonTraceProject = {
  id: 'hello-world',
  slug: 'hello-world',
  title: 'Hello World HTML',
  files: [{ name: 'index.html', language: 'html', content: '<h1>Hello</h1>' }],
};

// Test 1: 初始化与 Schema v1 / version: 1 结构校验
{
  const runtime = new CuratedTraceRuntime();
  const logs = [];

  const session = await runtime.run(sampleProject, {
    sessionId: 'session-trace-001',
    onConsole: (e) => logs.push(e.args.join(' ')),
  });

  assert.equal(session.status, 'running');
  const def = runtime.getDefinition();
  assert.ok(def, '必须生成确定性 Trace 定义');
  assert.equal(def.version, 1, 'Trace version 必须为 1');
  assert.equal(def.schemaVersion, 'lab-trace-v1', 'Schema 版本必须为 lab-trace-v1');
  assert.ok(def.initialState, '必须存在 initialState');
  assert.ok(def.totalSteps > 0, '总步数必须大于 0');
  assert.ok(def.totalSteps <= MAX_TRACE_STEPS, `步数不得超过上限 ${MAX_TRACE_STEPS}`);

  // 验证 step 结构
  const firstStep = def.steps[0];
  assert.ok(firstStep.id, '单步必须有唯一 ID');
  assert.equal(firstStep.durationMs, 250);
  assert.ok(firstStep.patch !== undefined, '单步必须存在 patch 差异');
  assert.ok(firstStep.state !== undefined, '单步必须存在完整 state');

  await runtime.dispose();
  console.log('  ✓ Test 1 Passed: 初始化与 Schema v1 / version: 1 规范校验通过');
}

// Test 2: 确定性保障 (相同输入生成完全相同 Trace)
{
  const rt1 = new CuratedTraceRuntime();
  const rt2 = new CuratedTraceRuntime();

  await rt1.run(sampleProject, { sessionId: 'trace-det-1' });
  await rt2.run(sampleProject, { sessionId: 'trace-det-2' });

  const def1 = rt1.getDefinition();
  const def2 = rt2.getDefinition();

  assert.equal(def1.totalSteps, def2.totalSteps, '步骤总数必须完全一致');
  for (let i = 0; i < def1.totalSteps; i++) {
    assert.equal(def1.steps[i].line, def2.steps[i].line, `第 ${i} 步代码行必须一致`);
    assert.deepEqual(def1.steps[i].state.arrayState, def2.steps[i].state.arrayState, `第 ${i} 步数组状态必须完全一致`);
  }

  await rt1.dispose();
  await rt2.dispose();
  console.log('  ✓ Test 2 Passed: 确定性保障 (相同输入产生 100% 相同 Trace)');
}

// Test 3: 步进控制 (stepForward, stepBack, seek)
{
  const runtime = new CuratedTraceRuntime();
  await runtime.run(sampleProject, { sessionId: 'session-trace-003' });
  runtime.pause(); // 暂停自动播放以精确测试单步

  assert.equal(runtime.getCurrentStepIndex(), 0, '初始索引必须为 0');

  // 单步前进
  const step1 = runtime.stepForward();
  assert.ok(step1);
  assert.equal(runtime.getCurrentStepIndex(), 1);

  // 单步后退
  const step0 = runtime.stepBack();
  assert.ok(step0);
  assert.equal(runtime.getCurrentStepIndex(), 0);

  // 精确 Seek 跳转
  const seekTarget = 5;
  runtime.seek(seekTarget);
  assert.equal(runtime.getCurrentStepIndex(), seekTarget);

  await runtime.dispose();
  console.log('  ✓ Test 3 Passed: 步进控制 (stepForward / stepBack / seek) 正常');
}

// Test 4: 播放、暂停与重启 (play, pause, restart)
{
  const runtime = new CuratedTraceRuntime();
  await runtime.run(sampleProject, { sessionId: 'session-trace-004' });

  assert.equal(runtime.getIsPlaying(), true, '启动后默认处于自动播放状态');

  runtime.pause();
  assert.equal(runtime.getIsPlaying(), false, 'pause 之后 isPlaying 必须为 false');

  runtime.seek(10);
  assert.equal(runtime.getCurrentStepIndex(), 10);

  runtime.restart();
  assert.equal(runtime.getCurrentStepIndex(), 0, 'restart 之后索引必须重置为 0');
  assert.equal(runtime.getIsPlaying(), true, 'restart 之后必须恢复播放');

  await runtime.dispose();
  console.log('  ✓ Test 4 Passed: 播放、暂停与重启控制正常');
}

// Test 5: 配额保护与零动态执行
{
  const runtime = new CuratedTraceRuntime();
  await runtime.run(sampleProject, { sessionId: 'session-trace-005' });
  const def = runtime.getDefinition();

  assert.ok(def.totalSteps <= MAX_TRACE_STEPS);
  for (const st of def.steps) {
    const jsonStr = JSON.stringify(st.state);
    assert.ok(jsonStr.length <= MAX_PATCH_BYTES, `单步体积不得超出 ${MAX_PATCH_BYTES} 字节`);
  }

  await runtime.dispose();
  console.log('  ✓ Test 5 Passed: 步数上限与单步体积配额保护通过');
}

// Test 6: 导出 Trace (exportTrace)
{
  const runtime = new CuratedTraceRuntime();
  await runtime.run(sampleProject, { sessionId: 'session-trace-006' });

  const exported = runtime.exportTrace();
  assert.ok(typeof exported === 'string');
  const parsed = JSON.parse(exported);
  assert.equal(parsed.version, 1);
  assert.equal(parsed.schemaVersion, 'lab-trace-v1');
  assert.ok(Array.isArray(parsed.steps));

  await runtime.dispose();
  console.log('  ✓ Test 6 Passed: 导出 Trace JSON 序列化结构完整');
}

// Test 7: stop 与 dispose 幂等清理
{
  const runtime = new CuratedTraceRuntime();
  await runtime.run(sampleProject, { sessionId: 'session-trace-007' });

  await runtime.stop('session-trace-007');
  assert.equal(runtime.getIsPlaying(), false);

  await runtime.dispose();
  await runtime.dispose();
  assert.equal(runtime.getTotalSteps(), 0);

  console.log('  ✓ Test 7 Passed: stop 与 dispose 幂等资源清理通过');
}

// Test 8: 无 Trace 定义的工程在 RuntimeRegistry 中不予提供
{
  const registry = new RuntimeRegistry();
  const traceKinds = registry.listKindsForProject(sampleProject);
  assert.ok(traceKinds.includes('curated-trace'), '算法工程必须包含 curated-trace');

  const nonTraceKinds = registry.listKindsForProject(nonTraceProject);
  assert.ok(!nonTraceKinds.includes('curated-trace'), '非 Trace 工程绝不得包含 curated-trace');

  const valRes = registry.validateProjectForRuntime(nonTraceProject, 'curated-trace');
  assert.equal(valRes.ok, false);
  assert.ok(valRes.reason?.includes('未包含执行追踪'));

  await registry.disposeAll();
  console.log('  ✓ Test 8 Passed: 非 Trace 工程严格隔离且不提供 Trace 运行时');
}

console.log('\n🎉 所有 8 项 CuratedTraceRuntime 契约测试全部 100% 通过！\n');
