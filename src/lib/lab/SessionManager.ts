/**
 * Astro Blog「试验田 Lab」会话管理器 (SessionManager)
 *
 * 维护沙盒运行会话生命周期、防串扰随机 Token、防重放自增 Sequence 与状态机流转。
 * 担任会话状态的唯一真相来源 (Single Source of Truth)：
 * 1. 严格受控状态机流转 (idle → connecting → ready → running → completed|aborted|error → idle|terminated)；
 * 2. 拒绝并记录非法状态转换；
 * 3. 独立维护 Host 出站序列号与 Sandbox 入站序列号；
 * 4. 严格拒绝重复序列号、低序乱序号与旧 Session 消息；
 * 5. Session 轮换时旧 SessionId 立即失效并加入防串扰黑名单。
 */
import {
  type SessionState,
  type SessionTransitionEvent,
  createSandboxSessionId,
  createSandboxCspNonce,
  transitionSessionState,
} from '../lab-sandbox-protocol.ts';

const LEGAL_TRANSITIONS: Record<SessionState, SessionTransitionEvent['type'][]> = {
  idle: ['START_CONNECT', 'EXECUTE', 'TERMINATE', 'RESET'],
  connecting: ['BRIDGE_READY', 'INNER_READY', 'ERROR', 'EXECUTION_ABORT', 'TERMINATE', 'RESET'],
  ready: ['EXECUTE', 'ERROR', 'EXECUTION_ABORT', 'TERMINATE', 'RESET'],
  running: ['EXECUTION_COMPLETE', 'EXECUTION_ABORT', 'ERROR', 'TERMINATE', 'RESET'],
  completed: ['RESET', 'START_CONNECT', 'EXECUTE', 'TERMINATE'],
  aborted: ['RESET', 'START_CONNECT', 'EXECUTE', 'TERMINATE'],
  error: ['RESET', 'START_CONNECT', 'EXECUTE', 'TERMINATE'],
  terminated: ['RESET'],
};

export class SessionManager {
  private sessionId: string;
  private cspNonce: string;
  private state: SessionState;
  private hostSequence: number;
  private lastInboundSequence: number;
  private previousSessionIds = new Set<string>();
  private abortReason: string | null = null;

  constructor() {
    this.sessionId = createSandboxSessionId();
    this.cspNonce = createSandboxCspNonce();
    this.state = 'idle';
    this.hostSequence = 0;
    this.lastInboundSequence = -1;
  }

  getSessionId(): string {
    return this.sessionId;
  }

  getCspNonce(): string {
    return this.cspNonce;
  }

  getState(): SessionState {
    return this.state;
  }

  getAbortReason(): string | null {
    return this.abortReason;
  }

  getNextSequence(): number {
    return ++this.hostSequence;
  }

  getHostSequence(): number {
    return this.hostSequence;
  }

  getLastInboundSequence(): number {
    return this.lastInboundSequence;
  }

  /**
   * 校验入站序列号：必须严格大于上一次接收的序列号 (防重放与乱序)
   */
  validateInboundSequence(seq: number): { ok: boolean; reason?: string } {
    if (typeof seq !== 'number' || !Number.isFinite(seq)) {
      return { ok: false, reason: `Invalid sequence format: ${seq}` };
    }
    if (seq <= this.lastInboundSequence) {
      return {
        ok: false,
        reason: `Rejected stale or duplicate sequence: received ${seq} <= current highwater ${this.lastInboundSequence}`,
      };
    }
    this.lastInboundSequence = seq;
    return { ok: true };
  }

  /**
   * 校验会话标识：验证是否为当前有效 Session，严禁处理过期轮换后的旧 Session 消息
   */
  isSessionValid(sessionId: string): boolean {
    if (!sessionId || typeof sessionId !== 'string') return false;
    if (this.previousSessionIds.has(sessionId)) return false;
    return sessionId === this.sessionId;
  }

  /**
   * 综合验证入站消息合法性
   */
  validateInboundMessage(msg: { sessionId?: string; seq?: number }): { ok: boolean; reason?: string } {
    if (!msg.sessionId || !this.isSessionValid(msg.sessionId)) {
      return {
        ok: false,
        reason: `Rejected message from invalid or expired session: "${msg.sessionId}"`,
      };
    }
    if (typeof msg.seq === 'number') {
      const seqRes = this.validateInboundSequence(msg.seq);
      if (!seqRes.ok) return seqRes;
    }
    return { ok: true };
  }

  /**
   * 状态机流转：严格检查合法转换规则
   */
  transition(event: SessionTransitionEvent, payload?: { reason?: string }): {
    ok: boolean;
    state: SessionState;
    previousState: SessionState;
    reason?: string;
  } {
    const prev = this.state;
    const allowedEvents = LEGAL_TRANSITIONS[prev] || [];

    if (!allowedEvents.includes(event.type)) {
      const reason = `[SessionManager] Illegal state transition rejected: cannot transition from "${prev}" with event "${event.type}"`;
      console.warn(reason);
      return {
        ok: false,
        state: this.state,
        previousState: prev,
        reason,
      };
    }

    if (event.type === 'EXECUTION_ABORT') {
      this.abortReason = payload?.reason || 'Execution aborted by user or security policy';
    } else if (event.type === 'START_CONNECT' || event.type === 'EXECUTE') {
      this.abortReason = null;
    }

    this.state = transitionSessionState(this.state, event);
    return {
      ok: true,
      state: this.state,
      previousState: prev,
    };
  }

  /**
   * 轮换会话：旧 SessionId 立即失效，重置序列号与状态
   */
  rotate(): { sessionId: string; cspNonce: string } {
    this.previousSessionIds.add(this.sessionId);
    this.sessionId = createSandboxSessionId();
    this.cspNonce = createSandboxCspNonce();
    this.state = 'idle';
    this.hostSequence = 0;
    this.lastInboundSequence = -1;
    this.abortReason = null;
    return {
      sessionId: this.sessionId,
      cspNonce: this.cspNonce,
    };
  }

  rotateSessionId(): string {
    return this.rotate().sessionId;
  }

  reset(): void {
    this.state = 'idle';
    this.hostSequence = 0;
    this.lastInboundSequence = -1;
    this.abortReason = null;
  }

  dispose(): void {
    this.previousSessionIds.add(this.sessionId);
    this.state = 'terminated';
  }
}
