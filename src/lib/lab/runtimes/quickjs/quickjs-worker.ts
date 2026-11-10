/**
 * Astro Blog「试验田 Lab」QuickJS Dedicated Worker 隔离运行脚本
 *
 * 运行于独立 Web Worker / Worker Thread 中，加载 QuickJS WebAssembly VM，
 * 提供纯粹受控的 JavaScript 计算沙盒，零 DOM、零网络、严格资源配额与中断拦截。
 */
import { loadQuickJS } from './quickjs-loader.ts';
import type {
  QuickJsHostToWorkerMessage,
  QuickJsWorkerToHostMessage,
} from './quickjs-protocol.ts';

let isTerminated = false;
let activeSessionId: string | null = null;
let maxMemoryBytes = 16 * 1024 * 1024; // 16 MB
let maxStackSizeBytes = 512 * 1024; // 512 KB

function postToHost(msg: QuickJsWorkerToHostMessage): void {
  if (typeof self !== 'undefined' && typeof self.postMessage === 'function') {
    self.postMessage(msg);
  } else if (typeof globalThis !== 'undefined' && typeof (globalThis as any).postMessage === 'function') {
    (globalThis as any).postMessage(msg);
  } else if (typeof process !== 'undefined') {
    try {
      // Node.js worker_threads support
      const { parentPort } = (globalThis as any).__worker_threads__ || {};
      if (parentPort) {
        parentPort.postMessage(msg);
      }
    } catch {}
  }
}

export async function handleHostMessage(msg: QuickJsHostToWorkerMessage): Promise<void> {
  if (msg.type === 'INIT') {
    if (msg.config?.maxMemoryBytes) maxMemoryBytes = msg.config.maxMemoryBytes;
    if (msg.config?.maxStackSizeBytes) maxStackSizeBytes = msg.config.maxStackSizeBytes;
    postToHost({ type: 'READY' });
    return;
  }

  if (msg.type === 'TERMINATE') {
    isTerminated = true;
    if (activeSessionId === msg.sessionId) {
      postToHost({
        type: 'ABORTED',
        sessionId: msg.sessionId,
        reason: 'Terminated by host request',
      });
    }
    return;
  }

  if (msg.type === 'EXECUTE') {
    activeSessionId = msg.sessionId;
    isTerminated = false;
    const startedAt = Date.now();
    const timeoutMs = msg.timeoutMs || 5000;

    let QuickJS;
    try {
      QuickJS = await loadQuickJS();
    } catch (err: any) {
      postToHost({
        type: 'ERROR',
        sessionId: msg.sessionId,
        error: {
          message: `Failed to load QuickJS WebAssembly: ${err?.message || String(err)}`,
          line: null,
          column: null,
        },
      });
      return;
    }

    const vm = QuickJS.newContext();

    // 1. 配额控制：内存预算与调用栈深度限制
    vm.runtime.setMemoryLimit(maxMemoryBytes);
    vm.runtime.setMaxStackSize(maxStackSizeBytes);

    // 2. 指令中断处理器 (Interrupt Handler)
    vm.runtime.setInterruptHandler(() => {
      if (isTerminated) return true;
      if (Date.now() - startedAt > timeoutMs) return true;
      return false;
    });

    // 3. 构造隔离环境专用 console 对象
    const createConsoleMethod = (level: 'log' | 'info' | 'warn' | 'error') => {
      return vm.newFunction(level, (...args) => {
        const dumped = args.map((a) => {
          try {
            const val = vm.dump(a);
            return typeof val === 'object' ? JSON.stringify(val) : String(val);
          } catch {
            return '[Unserializable]';
          }
        });
        postToHost({
          type: 'CONSOLE',
          sessionId: msg.sessionId,
          level,
          args: dumped,
        });
      });
    };

    const logFn = createConsoleMethod('log');
    const infoFn = createConsoleMethod('info');
    const warnFn = createConsoleMethod('warn');
    const errorFn = createConsoleMethod('error');

    const consoleObj = vm.newObject();
    vm.setProp(consoleObj, 'log', logFn);
    vm.setProp(consoleObj, 'info', infoFn);
    vm.setProp(consoleObj, 'warn', warnFn);
    vm.setProp(consoleObj, 'error', errorFn);
    vm.setProp(vm.global, 'console', consoleObj);

    // 4. 执行受控计算
    let evalRes: any;
    try {
      evalRes = vm.evalCode(msg.code);
    } catch (wasmErr: any) {
      postToHost({
        type: 'ERROR',
        sessionId: msg.sessionId,
        error: {
          message: wasmErr?.message || String(wasmErr || 'WASM Execution Error'),
          line: null,
          column: null,
          stack: wasmErr?.stack,
        },
      });
      try {
        logFn.dispose();
        infoFn.dispose();
        warnFn.dispose();
        errorFn.dispose();
        consoleObj.dispose();
        vm.dispose();
      } catch {}
      activeSessionId = null;
      return;
    }

    if (evalRes.error) {
      let errDump: any = {};
      try {
        errDump = vm.dump(evalRes.error);
      } catch {}
      evalRes.error.dispose();

      const errMsg = errDump?.message || errDump?.name || String(errDump || 'Runtime error');
      const isTimeout = isTerminated || Date.now() - startedAt >= timeoutMs || errMsg.includes('interrupted');

      if (isTimeout) {
        postToHost({
          type: 'ABORTED',
          sessionId: msg.sessionId,
          reason: `Execution timed out after ${timeoutMs}ms or interrupted by host`,
        });
      } else {
        postToHost({
          type: 'ERROR',
          sessionId: msg.sessionId,
          error: {
            message: errMsg,
            line: typeof errDump?.lineNumber === 'number' ? errDump.lineNumber : null,
            column: typeof errDump?.columnNumber === 'number' ? errDump.columnNumber : null,
            stack: typeof errDump?.stack === 'string' ? errDump.stack : undefined,
          },
        });
      }
    } else {
      evalRes.value.dispose();
      postToHost({
        type: 'COMPLETE',
        sessionId: msg.sessionId,
        durationMs: Date.now() - startedAt,
      });
    }

    // 5. 回收上下文资源
    try {
      logFn.dispose();
      infoFn.dispose();
      warnFn.dispose();
      errorFn.dispose();
      consoleObj.dispose();
      vm.dispose();
    } catch {}

    activeSessionId = null;
  }
}

// 仅在真正的 Dedicated Web Worker 作用域内自动挂载消息监听，防止主线程 import 时误绑定 window.onmessage
const isDedicatedWorkerScope =
  typeof self !== 'undefined' &&
  typeof (self as any).WorkerGlobalScope !== 'undefined' &&
  self instanceof (self as any).WorkerGlobalScope;

if (isDedicatedWorkerScope && typeof self.addEventListener === 'function') {
  self.addEventListener('message', (e: MessageEvent) => {
    void handleHostMessage(e.data);
  });
}
