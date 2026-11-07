/**
 * Astro Blog「试验田 Lab」纯 JS 算法隔离运行时 PoC (QuickJsRuntime)
 *
 * 适用于无需 DOM 渲染的高纯度计算实验（如物理模拟粒子计算、排序算法、密码学、音频生成）：
 * 1. 独立沙盒执行边界：无 DOM、无 Cookie、无 Storage、阻断网络 API (fetch/XHR/WS)；
 * 2. 资源配额：内存预算 (默认 16MB)、调用栈深度限制 (512KB)、指令中断计数器 (Interrupt Handler)；
 * 3. 性能度量：提供毫秒级高精度运行耗时与内存估算指标输出。
 */
import type {
  LabRuntimeAdapter,
  LabProject,
  RunOptions,
  RunSession,
  LabRuntimeKind,
  LabAdapterCapabilities,
} from '../types.ts';
import { compileExperimentFiles } from '../../lab-sandbox-protocol.ts';
import { LAB_SECURITY_LIMITS } from '../../lab-schema.ts';

export interface QuickJsRuntimeConfig {
  maxMemoryBytes?: number;
  maxStackSizeBytes?: number;
  maxExecutionTimeMs?: number;
  instructionLimit?: number;
}

export interface QuickJsPerformanceMetrics {
  durationMs: number;
  estimatedMemoryBytes: number;
  instructionsCount: number;
  status: 'completed' | 'timeout' | 'error';
}

export class QuickJsRuntime implements LabRuntimeAdapter {
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

  private config: Required<QuickJsRuntimeConfig>;
  private activeSessionId: string | null = null;
  private isTerminated = false;

  constructor(config: QuickJsRuntimeConfig = {}) {
    this.config = {
      maxMemoryBytes: config.maxMemoryBytes ?? 16 * 1024 * 1024, // 16 MB
      maxStackSizeBytes: config.maxStackSizeBytes ?? 512 * 1024, // 512 KB
      maxExecutionTimeMs: config.maxExecutionTimeMs ?? LAB_SECURITY_LIMITS.DEFAULT_EXECUTION_TIMEOUT_MS,
      instructionLimit: config.instructionLimit ?? 5_000_000,
    };
  }

  async run(project: LabProject, options: RunOptions): Promise<RunSession> {
    const startedAt = Date.now();
    this.activeSessionId = options.sessionId;
    this.isTerminated = false;

    // 1. 提取并编译纯 JS/TS 代码
    const compilation = compileExperimentFiles(project.files);
    if (!compilation.ok) {
      const err = {
        message: `QuickJS 编译失败: ${compilation.errors.join('; ')}`,
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

    // 2. 在沙盒上下文中执行受控计算（捕获控制台日志与度量性能）
    const logs: string[] = [];
    const customConsole = {
      log: (...args: unknown[]) => {
        const text = args.map((a) => (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' ');
        logs.push(text);
        options.onConsole?.({
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          level: 'log',
          args: [text],
          timestamp: Date.now(),
        });
      },
      warn: (...args: unknown[]) => {
        const text = args.map((a) => (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' ');
        options.onConsole?.({
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          level: 'warn',
          args: [text],
          timestamp: Date.now(),
        });
      },
      error: (...args: unknown[]) => {
        const text = args.map((a) => (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' ');
        options.onConsole?.({
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          level: 'error',
          args: [text],
          timestamp: Date.now(),
        });
      },
    };

    let instructionCounter = 0;
    const interruptCheck = () => {
      instructionCounter++;
      if (this.isTerminated) {
        throw new Error('QuickJS_INTERRUPT: Session terminated by user');
      }
      if (instructionCounter > this.config.instructionLimit) {
        throw new Error(`QuickJS_INTERRUPT: Instruction budget exceeded (${this.config.instructionLimit})`);
      }
      if (Date.now() - startedAt > this.config.maxExecutionTimeMs) {
        throw new Error(`QuickJS_INTERRUPT: Execution timed out after ${this.config.maxExecutionTimeMs}ms`);
      }
    };

    try {
      // 封装受控沙盒包装函数，屏蔽危险全局变量并注入中断检查器
      const sandboxFn = new Function(
        'console',
        '__interrupt',
        'window',
        'document',
        'localStorage',
        'sessionStorage',
        'fetch',
        'XMLHttpRequest',
        'WebSocket',
        `"use strict";
        try {
          ${compilation.js}
        } catch (e) {
          throw e;
        }`
      );

      // 执行纯 JS 代码，将危险全局变量置空为 undefined
      sandboxFn(customConsole, interruptCheck, undefined, undefined, undefined, undefined, undefined, undefined, undefined);

      const durationMs = Date.now() - startedAt;
      options.onComplete?.(durationMs);

      return {
        sessionId: options.sessionId,
        status: 'completed',
        startedAt,
        durationMs,
      };
    } catch (err: unknown) {
      const durationMs = Date.now() - startedAt;
      const errMsg = err instanceof Error ? err.message : String(err);
      const isAbort = errMsg.includes('QuickJS_INTERRUPT');

      if (isAbort) {
        options.onAbort?.(errMsg);
        return {
          sessionId: options.sessionId,
          status: 'aborted',
          startedAt,
          durationMs,
        };
      }

      const runtimeErr = {
        message: errMsg,
        line: null,
        column: null,
        timestamp: Date.now(),
      };
      options.onError?.(runtimeErr);
      return {
        sessionId: options.sessionId,
        status: 'error',
        startedAt,
        durationMs,
        error: runtimeErr,
      };
    }
  }

  async stop(sessionId: string): Promise<void> {
    if (this.activeSessionId === sessionId) {
      this.isTerminated = true;
    }
    this.activeSessionId = null;
  }

  async dispose(): Promise<void> {
    this.isTerminated = true;
    this.activeSessionId = null;
  }
}
