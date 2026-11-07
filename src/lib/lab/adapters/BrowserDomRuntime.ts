/**
 * Astro Blog「试验田 Lab」双层沙盒浏览器 DOM 运行时适配器 (BrowserDomRuntime)
 *
 * 封装 compileExperimentFiles、generateSandboxDocument 与 postMessage 管道，
 * 支持本地 opaque-srcdoc 强隔离与跨站 cross-origin 桥接双模态运行。
 */
import type { LabRuntimeAdapter, LabProject, RunOptions, RunSession } from '../types';
import {
  compileExperimentFiles,
  generateSandboxDocument,
  verifySandboxMessage,
} from '../../lab-sandbox-protocol';
import { LAB_SECURITY_LIMITS } from '../../lab-schema';

export class BrowserDomRuntime implements LabRuntimeAdapter {
  private activeIframe: HTMLIFrameElement | null = null;
  private messageListener: ((evt: MessageEvent) => void) | null = null;
  private watchdogTimer: ReturnType<typeof setTimeout> | null = null;
  private activeSessionId: string | null = null;

  async run(project: LabProject, options: RunOptions): Promise<RunSession> {
    const startedAt = Date.now();
    this.activeSessionId = options.sessionId;

    // 1. 编译并插桩 HTML / CSS / JS / TS 文件
    const compilation = compileExperimentFiles(project.files);
    if (!compilation.ok) {
      const err = {
        message: compilation.errors.join('; '),
        line: null,
        column: null,
        timestamp: Date.now(),
      };
      options.onError?.(err);
      return {
        sessionId: options.sessionId,
        status: 'error',
        startedAt,
        error: err,
      };
    }

    // 2. 生成带 Nonce 锁死 CSP 的沙盒 HTML
    const srcDoc = generateSandboxDocument({
      sessionId: options.sessionId,
      nonce: options.cspNonce,
      html: compilation.html,
      css: compilation.css,
      js: compilation.js,
      params: project.defaultParams,
      theme: options.theme || 'light',
    });

    // 3. 设置看门狗定时器 (Watchdog Timer)
    const timeout = options.timeoutMs || LAB_SECURITY_LIMITS.DEFAULT_EXECUTION_TIMEOUT_MS;
    this.watchdogTimer = setTimeout(() => {
      options.onAbort?.(`Execution timed out after ${timeout}ms`);
      this.stop(options.sessionId);
    }, timeout);

    return {
      sessionId: options.sessionId,
      status: 'running',
      startedAt,
    };
  }

  async stop(sessionId: string): Promise<void> {
    if (this.watchdogTimer) {
      clearTimeout(this.watchdogTimer);
      this.watchdogTimer = null;
    }
    if (this.activeIframe && this.activeSessionId === sessionId) {
      if (this.activeIframe.contentWindow) {
        try {
          this.activeIframe.contentWindow.postMessage(
            {
              protocol: 'LAB_SANDBOX_PROTOCOL_V1',
              sessionId,
              type: 'TERMINATE_SESSION',
              payload: {},
            },
            '*'
          );
        } catch (_err) {}
      }
      this.activeIframe.srcdoc = '';
    }
    this.activeSessionId = null;
  }

  async dispose(): Promise<void> {
    if (this.watchdogTimer) {
      clearTimeout(this.watchdogTimer);
      this.watchdogTimer = null;
    }
    if (this.messageListener) {
      window.removeEventListener('message', this.messageListener);
      this.messageListener = null;
    }
    if (this.activeIframe) {
      this.activeIframe.srcdoc = '';
      this.activeIframe = null;
    }
    this.activeSessionId = null;
  }
}
