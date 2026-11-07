/**
 * Astro Blog「试验田 Lab」QuickJS Dedicated Worker 运行时适配器 (QuickJsWorkerRuntime)
 *
 * 采用真实的 WebAssembly VM + Dedicated Web Worker 架构：
 * 1. 严格受限于纯 JavaScript 计算，不暴露 DOM、window、fetch 或本地存储；
 * 2. 内存预算限制 (默认 16MB) 与调用栈深度限制 (默认 512KB)；
 * 3. 基于指令计数器的中断处理器 (Interrupt Handler)，可在死循环时安全中断；
 * 4. 具备 Worker Crash 监听与故障自动重建 (Crash Recovery) 机制。
 */
import type {
  LabRuntimeAdapter,
  LabProject,
  RunOptions,
  RunSession,
  LabRuntimeKind,
  LabAdapterCapabilities,
} from '../../types.ts';
import { compileExperimentFiles } from '../../../lab-sandbox-protocol.ts';
import { LAB_SECURITY_LIMITS } from '../../../lab-schema.ts';
import type {
  QuickJsHostToWorkerMessage,
  QuickJsWorkerToHostMessage,
} from './quickjs-protocol.ts';
import { handleHostMessage } from './quickjs-worker.ts';

export interface QuickJsWorkerConfig {
  maxMemoryBytes?: number;
  maxStackSizeBytes?: number;
  workerUrl?: string;
}

export class QuickJsWorkerRuntime implements LabRuntimeAdapter {
  readonly kind: LabRuntimeKind = 'quickjs';
  readonly capabilities: LabAdapterCapabilities = {
    dom: false,
    network: false,
    worker: true,
    typescript: true,
    html: false,
    css: false,
    trace: false,
    interruptible: true,
  };

  private config: Required<QuickJsWorkerConfig>;
  private worker: Worker | null = null;
  private activeSessionId: string | null = null;
  private watchdogTimer: ReturnType<typeof setTimeout> | null = null;
  private currentRunOptions: RunOptions | null = null;
  private isDisposed = false;

  constructor(config: QuickJsWorkerConfig = {}) {
    this.config = {
      maxMemoryBytes: config.maxMemoryBytes ?? 16 * 1024 * 1024,
      maxStackSizeBytes: config.maxStackSizeBytes ?? 512 * 1024,
      workerUrl: config.workerUrl ?? '',
    };
  }

  private initWorker(): void {
    if (this.worker || this.isDisposed) return;

    if (typeof window !== 'undefined' && typeof Worker !== 'undefined') {
      try {
        if (this.config.workerUrl) {
          this.worker = new Worker(this.config.workerUrl, { type: 'module' });
        } else {
          // 在未指定外部 workerUrl 时，构建内联 Blob Worker 载入 quickjs-worker
          const workerSource = `
            import { handleHostMessage } from '${new URL('./quickjs-worker.ts', import.meta.url).href}';
            self.addEventListener('message', (e) => handleHostMessage(e.data));
          `;
          const blob = new Blob([workerSource], { type: 'application/javascript' });
          const blobUrl = URL.createObjectURL(blob);
          this.worker = new Worker(blobUrl, { type: 'module' });
        }

        this.worker.onmessage = (e: MessageEvent<QuickJsWorkerToHostMessage>) => {
          this.handleWorkerMessage(e.data);
        };

        this.worker.onerror = (err) => {
          this.handleWorkerCrash(err);
        };

        this.postToWorker({
          type: 'INIT',
          config: {
            maxMemoryBytes: this.config.maxMemoryBytes,
            maxStackSizeBytes: this.config.maxStackSizeBytes,
          },
        });
      } catch (e) {
        console.warn('[QuickJsWorkerRuntime] Worker init fallback:', e);
      }
    }
  }

  private handleWorkerCrash(err: ErrorEvent | any): void {
    console.error('[QuickJsWorkerRuntime] Worker crashed:', err);
    if (this.currentRunOptions) {
      this.currentRunOptions.onError?.({
        message: `QuickJS Worker crashed: ${err?.message || 'Abnormal termination'}. Auto-rebuilding worker instance.`,
        line: null,
        column: null,
        timestamp: Date.now(),
      });
      this.currentRunOptions.onStatusChange?.('error');
    }
    this.destroyWorker();
    this.initWorker();
  }

  private destroyWorker(): void {
    if (this.worker) {
      try {
        this.worker.terminate();
      } catch {}
      this.worker = null;
    }
  }

  async run(project: LabProject, options: RunOptions): Promise<RunSession> {
    const startedAt = Date.now();
    this.activeSessionId = options.sessionId;
    this.currentRunOptions = options;
    this.isDisposed = false;

    // 1. 纯度检查：QuickJS 仅支持纯 JS 计算，不支持渲染 HTML
    const hasHtml = project.files.some(
      (f) => f.name.endsWith('.html') && f.content.trim().length > 0
    );
    if (hasHtml) {
      const err = {
        message: 'QuickJS 隔离环境仅支持纯 JavaScript 算法计算，不支持 HTML 页面渲染。请切换到「Browser DOM」运行时。',
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

    // 2. 编译并提取脚本文件
    const compilation = compileExperimentFiles(project.files);
    if (!compilation.ok) {
      const err = {
        message: `编译失败: ${compilation.errors.join('; ')}`,
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

    const jsCode = project.files
      .filter((f) => f.name.endsWith('.js') || f.name.endsWith('.ts'))
      .map((f) => f.content)
      .join('\n;\n');

    if (!jsCode.trim()) {
      const err = {
        message: '未检测到可执行的 JavaScript 代码。',
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

    options.onStatusChange?.('running');

    // 3. 看门狗定时器
    const timeout = options.timeoutMs || LAB_SECURITY_LIMITS.DEFAULT_EXECUTION_TIMEOUT_MS;
    this.watchdogTimer = setTimeout(() => {
      this.handleAbort(options, `QuickJS execution timed out after ${timeout}ms`);
    }, timeout);

    // 4. 执行调度
    this.initWorker();

    if (this.worker) {
      this.postToWorker({
        type: 'EXECUTE',
        sessionId: options.sessionId,
        code: jsCode,
        timeoutMs: timeout,
      });
    } else {
      // 在无原生 Web Worker 支持的环境（如 Node.js 审计环境），通过直接协议管道执行以保证测试完备性
      void this.runDirectSimulation(options.sessionId, jsCode, timeout);
    }

    return {
      sessionId: options.sessionId,
      status: 'running',
      startedAt,
    };
  }

  private async runDirectSimulation(sessionId: string, code: string, timeoutMs: number): Promise<void> {
    const mockPost = (msg: QuickJsWorkerToHostMessage) => {
      this.handleWorkerMessage(msg);
    };

    // 临时在全局绑定捕获
    const originalPost = (globalThis as any).postMessage;
    const selfObj = typeof self !== 'undefined' ? self : (globalThis as any);
    selfObj.postMessage = mockPost;

    try {
      await handleHostMessage({
        type: 'EXECUTE',
        sessionId,
        code,
        timeoutMs,
      });
    } finally {
      selfObj.postMessage = originalPost;
    }
  }

  private postToWorker(msg: QuickJsHostToWorkerMessage): void {
    if (this.worker) {
      try {
        this.worker.postMessage(msg);
      } catch (err) {
        console.error('[QuickJsWorkerRuntime] Failed to post to worker:', err);
      }
    }
  }

  private handleWorkerMessage(msg: QuickJsWorkerToHostMessage): void {
    if (this.isDisposed) return;
    const options = this.currentRunOptions;
    if (!options) return;

    if ('sessionId' in msg && msg.sessionId && msg.sessionId !== this.activeSessionId) {
      return; // 丢弃不属于当前活跃会话的消息
    }

    switch (msg.type) {
      case 'CONSOLE': {
        options.onConsole?.({
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          level: msg.level,
          args: msg.args,
          timestamp: Date.now(),
        });
        break;
      }
      case 'ERROR': {
        this.clearWatchdog();
        options.onError?.({
          message: msg.error.message,
          line: msg.error.line,
          column: msg.error.column,
          stack: msg.error.stack,
          timestamp: Date.now(),
        });
        options.onStatusChange?.('error');
        break;
      }
      case 'COMPLETE': {
        this.clearWatchdog();
        options.onComplete?.(msg.durationMs);
        options.onStatusChange?.('completed');
        break;
      }
      case 'ABORTED': {
        this.clearWatchdog();
        options.onAbort?.(msg.reason);
        options.onStatusChange?.('aborted');
        break;
      }
      case 'READY':
        break;
    }
  }

  private handleAbort(options: RunOptions, reason: string): void {
    this.clearWatchdog();
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

  async stop(sessionId: string): Promise<void> {
    this.clearWatchdog();
    if (this.activeSessionId === sessionId) {
      if (this.worker) {
        this.postToWorker({ type: 'TERMINATE', sessionId });
        // 若 Worker 未在短时间内响应，实施硬性销毁重建
        setTimeout(() => {
          if (this.activeSessionId === sessionId) {
            this.destroyWorker();
            this.initWorker();
          }
        }, 150);
      }
      this.activeSessionId = null;
    }
  }

  async dispose(): Promise<void> {
    this.isDisposed = true;
    this.clearWatchdog();
    this.destroyWorker();
    this.activeSessionId = null;
    this.currentRunOptions = null;
  }
}
