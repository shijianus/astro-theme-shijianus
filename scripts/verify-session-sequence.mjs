/**
 * Astro Blog「试验田 Lab」SessionManager 会话状态机与 Sequence 防重放审计脚本 (verify-session-sequence.mjs)
 */
import assert from 'node:assert/strict';

const { SessionManager } = await import('../src/lib/lab/SessionManager.ts');
const { BrowserDomRuntime } = await import('../src/lib/lab/adapters/BrowserDomRuntime.ts');
const { LabWorkspaceController } = await import('../src/lib/lab/workspace/LabWorkspaceController.ts');

console.log('🧪 开始执行 SessionManager 状态机与 Sequence 契约审计...\n');

// Test 1: 合法生命周期状态机流转
{
  const sm = new SessionManager();
  assert.equal(sm.getState(), 'idle', '初始状态必须为 idle');

  // idle -> connecting
  const t1 = sm.transition({ type: 'START_CONNECT' });
  assert.equal(t1.ok, true);
  assert.equal(sm.getState(), 'connecting');

  // connecting -> ready
  const t2 = sm.transition({ type: 'BRIDGE_READY' });
  assert.equal(t2.ok, true);
  assert.equal(sm.getState(), 'ready');

  // ready -> running
  const t3 = sm.transition({ type: 'EXECUTE' });
  assert.equal(t3.ok, true);
  assert.equal(sm.getState(), 'running');

  // running -> completed
  const t4 = sm.transition({ type: 'EXECUTION_COMPLETE' });
  assert.equal(t4.ok, true);
  assert.equal(sm.getState(), 'completed');

  // completed -> idle
  const t5 = sm.transition({ type: 'RESET' });
  assert.equal(t5.ok, true);
  assert.equal(sm.getState(), 'idle');

  console.log('  ✓ Test 1 Passed: 正常状态机主链路流转验证通过');
}

// Test 2: 非法状态转换拦截并记录 (Fail-Closed)
{
  const sm = new SessionManager();
  assert.equal(sm.getState(), 'idle');

  // idle 状态下试图直接完成 (非法)
  const bad1 = sm.transition({ type: 'EXECUTION_COMPLETE' });
  assert.equal(bad1.ok, false, 'idle 状态下禁止直接触发 EXECUTION_COMPLETE');
  assert.equal(sm.getState(), 'idle', '状态必须保持不变');
  assert.ok(bad1.reason?.includes('Illegal state transition rejected'));

  // 进入 ready
  sm.transition({ type: 'START_CONNECT' });
  sm.transition({ type: 'BRIDGE_READY' });
  assert.equal(sm.getState(), 'ready');

  // ready 状态下试图触发 EXECUTION_COMPLETE (尚未 running)
  const bad2 = sm.transition({ type: 'EXECUTION_COMPLETE' });
  assert.equal(bad2.ok, false);
  assert.equal(sm.getState(), 'ready');

  console.log('  ✓ Test 2 Passed: 非法状态跃迁拦截与记录机制通过');
}

// Test 3: Sequence 单调递增与防乱序/防重放验证
{
  const sm = new SessionManager();

  // 正常顺序
  const s1 = sm.validateInboundSequence(1);
  assert.equal(s1.ok, true);
  assert.equal(sm.getLastInboundSequence(), 1);

  const s2 = sm.validateInboundSequence(2);
  assert.equal(s2.ok, true);
  assert.equal(sm.getLastInboundSequence(), 2);

  // 重复序列号拦截
  const sDup = sm.validateInboundSequence(2);
  assert.equal(sDup.ok, false, '重复序列号必须被拒绝');
  assert.ok(sDup.reason?.includes('stale or duplicate sequence'));

  // 低序倒序消息拦截
  const sStale = sm.validateInboundSequence(1);
  assert.equal(sStale.ok, false, '倒序旧消息必须被拒绝');

  // 跳序递增允许
  const sJump = sm.validateInboundSequence(5);
  assert.equal(sJump.ok, true);
  assert.equal(sm.getLastInboundSequence(), 5);

  console.log('  ✓ Test 3 Passed: Sequence 严格单调递增与重放/乱序拦截正常');
}

// Test 4: 会话轮换与旧 SessionId 立即失效
{
  const sm = new SessionManager();
  const oldSessionId = sm.getSessionId();
  assert.ok(sm.isSessionValid(oldSessionId));

  // 接收有效消息
  const msg1 = sm.validateInboundMessage({ sessionId: oldSessionId, seq: 1 });
  assert.equal(msg1.ok, true);

  // 触发轮换
  const { sessionId: newSessionId } = sm.rotate();
  assert.notEqual(newSessionId, oldSessionId);
  assert.ok(sm.isSessionValid(newSessionId));
  assert.equal(sm.isSessionValid(oldSessionId), false, '旧 SessionId 必须失效');

  // 旧 Session 消息必须被严格拒绝
  const staleMsg = sm.validateInboundMessage({ sessionId: oldSessionId, seq: 2 });
  assert.equal(staleMsg.ok, false);
  assert.ok(staleMsg.reason?.includes('expired session'));

  // 新 Session 序列号从 1 开始正常接收
  const newMsg = sm.validateInboundMessage({ sessionId: newSessionId, seq: 1 });
  assert.equal(newMsg.ok, true);

  console.log('  ✓ Test 4 Passed: Session 轮换与过期 Session 隔离机制通过');
}

// Test 5: EXECUTION_ABORT 状态与 UI 原因记录
{
  const sm = new SessionManager();
  sm.transition({ type: 'START_CONNECT' });
  sm.transition({ type: 'BRIDGE_READY' });
  sm.transition({ type: 'EXECUTE' });
  assert.equal(sm.getState(), 'running');

  const abortRes = sm.transition({ type: 'EXECUTION_ABORT' }, { reason: 'User cancelled execution' });
  assert.equal(abortRes.ok, true);
  assert.equal(sm.getState(), 'aborted');
  assert.equal(sm.getAbortReason(), 'User cancelled execution');

  console.log('  ✓ Test 5 Passed: EXECUTION_ABORT 状态与审计原因记录正常');
}

console.log('\n🎉 所有 5 项 SessionManager 状态机与 Sequence 契约测试全部 100% 通过！\n');
