/**
 * Astro Blog「试验田 Lab」双层沙盒浏览器 DOM 运行时适配器 (BrowserDomRuntime)
 *
 * 封装 compileExperimentFiles、buildIsolatedSandboxSrcDoc 与 postMessage 管道，
 * 支持本地 opaque-srcdoc 强隔离与跨站 cross-origin 桥接双模态运行。
 * 具备严格的来源验证、双向 Sequence 递增、看门狗超时管理、洪水攻击拦截与配额控制。
 */
import type {
  LabRuntimeAdapter,
  LabProject,
  RunOptions,
  RunSession,
  LabRuntimeKind,
  LabAdapterCapabilities,
} from '../types.ts';
import {
  compileExperimentFiles,
  buildIsolatedSandboxSrcDoc,
  verifySandboxMessage,
  resolveSafeExternalSandboxOrigin,
  LAB_SANDBOX_PROTOCOL_VERSION,
  type SandboxToHostMessage,
} from '../../lab-sandbox-protocol.ts';
import { LAB_SECURITY_LIMITS } from '../../lab-schema.ts';

export class BrowserDomRuntime implements LabRuntimeAdapter {
  readonly kind: LabRuntimeKind = 'browser-dom';
  readonly capabilities: LabAdapterCapabilities = {
    dom: true,
    network: false,
    worker: false,
    typescript: true,
    html: true,
    css: true,
    trace: false,
    interruptible: true,
  };

  private activeIframe: HTMLIFrameElement | null = null;
  private container: HTMLElement | null = null;
  private messageListener: ((evt: MessageEvent) => void) | null = null;
  private watchdogTimer: ReturnType<typeof setTimeout> | null = null;
  private handshakeTimer: ReturnType<typeof setTimeout> | null = null;
  private pingInterval: ReturnType<typeof setInterval> | null = null;
  private heartbeatWatchdogTimer: ReturnType<typeof setTimeout> | null = null;
  private activeSessionId: string | null = null;
  private hostSeq = 0;
  private lastInboundSeq = -1;
  private inboundMsgCount = 0;
  private consoleCount = 0;
  private isDisposed = false;

  async run(project: LabProject, options: RunOptions): Promise<RunSession> {
    const startedAt = Date.now();

    // 1. 若已有活跃会话，先完整销毁旧实例 (保证重复 run 幂等安全)
    await this.cleanupActiveExecution();

    this.activeSessionId = options.sessionId;
    this.hostSeq = 0;
    this.lastInboundSeq = -1;
    this.inboundMsgCount = 0;
    this.consoleCount = 0;
    this.isDisposed = false;

    // 2. 编译并插桩 HTML / CSS / JS / TS 文件
    const compilation = compileExperimentFiles(project.files);
    if (!compilation.ok) {
      const err = {
        message: compilation.errors.join('; '),
        line: null,
        column: null,
        timestamp: Date.now(),
      };
      options.onError?.(err);
      options.onStatusChange?.('error');
      return {
        sessionId: options.sessionId,
        status: 'error',
        startedAt,
        error: err,
      };
    }

    // 3. 校验跨站沙盒与 Fail-Closed 门禁
    const sourceKind = options.sourceKind || 'official';
    const hostOrigin = typeof window !== 'undefined' ? window.location.origin : null;
    const liveResolution = resolveSafeExternalSandboxOrigin(options.externalOrigin, hostOrigin);

    if (sourceKind !== 'official') {
      if (!liveResolution.enabled || !liveResolution.origin) {
        const reason = liveResolution.rejectedReason
          ? `独立跨站沙盒配置被拒绝 (${liveResolution.rejectedReason})`
          : '未配置或无法连接独立跨站沙盒域名 (PUBLIC_LAB_SANDBOX_ORIGIN)';
        const failMsg = `[Sandbox Fail-Closed] 安全阻断：当前代码来源为 "${sourceKind}"，${reason}。系统严禁外部不受信代码回退至本地 opaque-srcdoc 沙盒运行，已实施强制失败关闭。`;
        const err = {
          message: failMsg,
          line: null,
          column: null,
          timestamp: Date.now(),
        };
        options.onError?.(err);
        options.onStatusChange?.('error');
        return {
          sessionId: options.sessionId,
          status: 'error',
          startedAt,
          error: err,
        };
      }
    }

    // 4. 构建沙盒 HTML 文档
    const srcDoc = buildIsolatedSandboxSrcDoc({
      sessionId: options.sessionId,
      files: project.files,
      theme: options.theme || 'light',
      maxConsoleEntries: LAB_SECURITY_LIMITS.MAX_CONSOLE_ENTRIES,
    });

    // 5. 挂载或复用 iframe
    let iframe: HTMLIFrameElement;
    if (options.iframe) {
      iframe = options.iframe;
      this.activeIframe = iframe;
    } else if (options.container) {
      iframe = document.createElement('iframe');
      iframe.className = 'w-full h-full border-0';
      iframe.title = 'Lab Sandbox Preview';
      iframe.setAttribute('sandbox', 'allow-scripts allow-forms allow-modals');
      iframe.setAttribute('referrerpolicy', 'no-referrer');
      options.container.appendChild(iframe);
      this.activeIframe = iframe;
      this.container = options.container;
    } else if (typeof document !== 'undefined') {
      iframe = document.createElement('iframe');
      iframe.setAttribute('sandbox', 'allow-scripts allow-forms allow-modals');
      iframe.style.display = 'none';
      document.body.appendChild(iframe);
      this.activeIframe = iframe;
      this.container = document.body;
    } else {
      throw new Error('[BrowserDomRuntime] Cannot run without DOM document/container');
    }

    // 6. 确定消息发送目标与允许接收来源 (Origin 验证)
    const isCrossOrigin = Boolean(liveResolution.enabled && liveResolution.origin);
    const targetOrigin = isCrossOrigin
      ? (liveResolution.origin as string)
      : '*'; // 注意：W3C HTML5 规范中，未设置 allow-same-origin 的 opaque-srcdoc origin 为 'null'，
             // 浏览器禁止对 'null' origin 指定字面量 targetOrigin，必须使用 '*'。跨站模式下严格使用 targetOrigin!
    const strictOrigins = isCrossOrigin ? [liveResolution.origin as string] : ['null'];

    options.onStatusChange?.('connecting');

    // 7. 注册沙盒通信事件监听器
    this.messageListener = (event: MessageEvent) => {
      if (this.isDisposed || !this.activeIframe) return;
      const expectedSource = this.activeIframe.contentWindow;
      if (!expectedSource) return;

      const verification = verifySandboxMessage(event, {
        expectedSource,
        expectedSessionId: this.activeSessionId || '',
        strictOrigins,
        allowBridgeInitSession: true,
      });

      if (!verification.valid || !verification.message) {
        return; // 严格丢弃不匹配或非法的消息
      }

      const msg: SandboxToHostMessage = verification.message;

      // 洪水限流拦截 (Message flood rate limit)
      this.inboundMsgCount++;
      if (this.inboundMsgCount > 500) {
        this.handleAbort(options, 'Inbound message rate limit exceeded (flood protection)');
        return;
      }

      // 双向 Sequence 严格单调递增验证 (防乱序与重放)
      if (typeof msg.seq === 'number') {
        if (msg.seq <= this.lastInboundSeq) {
          // 丢弃旧序或重复序列号消息
          return;
        }
        this.lastInboundSeq = msg.seq;
      }

      // 消息分发处理
      switch (msg.type) {
        case 'SANDBOX_BRIDGE_READY': {
          this.clearPingAndHandshakeTimers();
          options.onStatusChange?.('ready');
          this.postToSandbox(expectedSource, targetOrigin, {
            protocol: LAB_SANDBOX_PROTOCOL_VERSION,
            sessionId: this.activeSessionId || '',
            seq: ++this.hostSeq,
            type: 'EXECUTE_CODE',
            payload: { srcDoc },
          });
          options.onStatusChange?.('running');
          break;
        }
        case 'SANDBOX_READY': {
          options.onStatusChange?.('running');
          break;
        }
        case 'HEARTBEAT': {
          this.resetHeartbeatWatchdog(options);
          options.onHeartbeat?.();
          break;
        }
        case 'CONSOLE_EVENT': {
          if (this.consoleCount < LAB_SECURITY_LIMITS.MAX_CONSOLE_ENTRIES) {
            this.consoleCount++;
            const p = msg.payload as { level?: string; args?: string[]; timestamp?: number };
            options.onConsole?.({
              id: `${Date.now()}-${this.consoleCount}`,
              level: (p.level as any) || 'log',
              args: p.args || [],
              timestamp: p.timestamp || Date.now(),
            });
          }
          break;
        }
        case 'RUNTIME_ERROR': {
          const p = msg.payload as { error: { message: string; line: number | null; column: number | null; stack?: string } };
          options.onError?.({
            message: p.error.message,
            line: p.error.line,
            column: p.error.column,
            stack: p.error.stack,
            timestamp: Date.now(),
          });
          options.onStatusChange?.('error');
          break;
        }
        case 'EXECUTION_COMPLETE': {
          this.clearWatchdog();
          const p = msg.payload as { durationMs?: number };
          const duration = p.durationMs ?? (Date.now() - startedAt);
          options.onComplete?.(duration);
          options.onStatusChange?.('completed');
          break;
        }
        case 'EXECUTION_ABORTED': {
          this.clearWatchdog();
          const p = msg.payload as { reason?: string };
          options.onAbort?.(p.reason || 'Execution aborted');
          options.onStatusChange?.('aborted');
          break;
        }
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('message', this.messageListener);
    }

    // 8. 触发沙盒加载
    if (isCrossOrigin) {
      iframe.src = `${liveResolution.origin}/?session=${encodeURIComponent(options.sessionId)}`;

      // 启动桥接握手探测 Ping
      const sendPing = () => {
        if (!this.activeIframe?.contentWindow || !liveResolution.origin) return;
        this.postToSandbox(this.activeIframe.contentWindow, liveResolution.origin, {
          protocol: LAB_SANDBOX_PROTOCOL_VERSION,
          sessionId: options.sessionId,
          seq: ++this.hostSeq,
          type: 'PING',
          payload: {},
        });
      };
      sendPing();
      this.pingInterval = setInterval(sendPing, 250);

      // 握手超时定时器 (3000ms)
      this.handshakeTimer = setTimeout(() => {
        this.clearPingAndHandshakeTimers();
        if (sourceKind === 'official') {
          // 仅官方 preset 允许降级到本地 srcdoc
          iframe.srcdoc = srcDoc;
          options.onStatusChange?.('running');
        } else {
          this.handleAbort(options, 'Cross-origin sandbox handshake timed out');
        }
      }, 3000);
    } else {
      // 本地 Opaque-srcdoc 模式 (仅限 official preset)
      iframe.srcdoc = srcDoc;
      options.onStatusChange?.('running');
    }

    // 9. 执行看门狗定时器 (Watchdog Timer)
    const timeout = options.timeoutMs || LAB_SECURITY_LIMITS.DEFAULT_EXECUTION_TIMEOUT_MS;
    this.watchdogTimer = setTimeout(() => {
      this.handleAbort(options, `Execution timed out after ${timeout}ms`);
    }, timeout);

    return {
      sessionId: options.sessionId,
      status: 'running',
      startedAt,
    };
  }

  async stop(sessionId: string): Promise<void> {
    this.clearWatchdog();
    this.clearPingAndHandshakeTimers();

    if (this.activeIframe?.contentWindow && this.activeSessionId === sessionId) {
      try {
        this.activeIframe.contentWindow.postMessage(
          {
            protocol: LAB_SANDBOX_PROTOCOL_VERSION,
            sessionId,
            seq: ++this.hostSeq,
            type: 'TERMINATE_SESSION',
            payload: {},
          },
          '*'
        );
      } catch {}
      this.activeIframe.srcdoc = '';
    }
    this.activeSessionId = null;
  }

  async dispose(): Promise<void> {
    this.isDisposed = true;
    await this.cleanupActiveExecution();
  }

  private postToSandbox(win: Window, targetOrigin: string, msg: unknown): void {
    try {
      win.postMessage(msg, targetOrigin);
    } catch {}
  }

  private handleAbort(options: RunOptions, reason: string): void {
    this.clearWatchdog();
    this.clearPingAndHandshakeTimers();
    options.onAbort?.(reason);
    options.onStatusChange?.('aborted');
    if (this.activeSessionId) {
      this.stop(this.activeSessionId);
    }
  }

  private clearWatchdog(): void {
    if (this.watchdogTimer) {
      clearTimeout(this.watchdogTimer);
      this.watchdogTimer = null;
    }
  }

  private resetHeartbeatWatchdog(options: RunOptions): void {
    if (this.heartbeatWatchdogTimer) {
      clearTimeout(this.heartbeatWatchdogTimer);
    }
    // 心跳看门狗：如果 12 秒内未收到任何有效心跳，判定沙盒无响应并强行销毁
    this.heartbeatWatchdogTimer = setTimeout(() => {
      this.handleAbort(options, 'Heartbeat timeout: sandbox became unresponsive');
      if (this.activeIframe && this.activeIframe.parentNode) {
        try {
          this.activeIframe.parentNode.removeChild(this.activeIframe);
        } catch {}
        this.activeIframe = null;
      }
    }, 12000);
  }

  private clearHeartbeatWatchdog(): void {
    if (this.heartbeatWatchdogTimer) {
      clearTimeout(this.heartbeatWatchdogTimer);
      this.heartbeatWatchdogTimer = null;
    }
  }

  private clearPingAndHandshakeTimers(): void {
    if (this.handshakeTimer) {
      clearTimeout(this.handshakeTimer);
      this.handshakeTimer = null;
    }
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  private async cleanupActiveExecution(): Promise<void> {
    this.clearWatchdog();
    this.clearHeartbeatWatchdog();
    this.clearPingAndHandshakeTimers();

    if (this.messageListener && typeof window !== 'undefined') {
      window.removeEventListener('message', this.messageListener);
      this.messageListener = null;
    }

    if (this.activeIframe) {
      try {
        this.activeIframe.srcdoc = '';
        if (this.container && this.activeIframe.parentNode === this.container) {
          this.container.removeChild(this.activeIframe);
        } else if (this.activeIframe.parentNode) {
          this.activeIframe.parentNode.removeChild(this.activeIframe);
        }
      } catch {}
      this.activeIframe = null;
    }
    this.activeSessionId = null;
  }
}
