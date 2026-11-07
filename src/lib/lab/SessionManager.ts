/**
 * Astro Blog「试验田 Lab」会话管理器 (SessionManager)
 *
 * 维护沙盒运行会话生命周期、防串扰随机 Token、防重放自增 Sequence 与状态机流转。
 */
import {
  type SessionState,
  type SessionTransitionEvent,
  createSandboxSessionId,
  createSandboxCspNonce,
  transitionSessionState,
} from '../lab-sandbox-protocol';

export class SessionManager {
  private sessionId: string;
  private cspNonce: string;
  private state: SessionState;
  private sequence: number;

  constructor() {
    this.sessionId = createSandboxSessionId();
    this.cspNonce = createSandboxCspNonce();
    this.state = 'idle';
    this.sequence = 0;
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

  getNextSequence(): number {
    return ++this.sequence;
  }

  transition(event: SessionTransitionEvent): SessionState {
    this.state = transitionSessionState(this.state, event);
    return this.state;
  }

  rotate(): { sessionId: string; cspNonce: string } {
    this.sessionId = createSandboxSessionId();
    this.cspNonce = createSandboxCspNonce();
    this.state = 'idle';
    this.sequence = 0;
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
    this.sequence = 0;
  }

  dispose(): void {
    this.state = 'terminated';
  }
}
