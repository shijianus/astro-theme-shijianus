/**
 * Astro Blog「试验田 Lab」QuickJS Dedicated Worker 通信协议
 */

export interface QuickJsHostToWorkerInit {
  type: 'INIT';
  config?: {
    maxMemoryBytes?: number;
    maxStackSizeBytes?: number;
  };
}

export interface QuickJsHostToWorkerExecute {
  type: 'EXECUTE';
  sessionId: string;
  code: string;
  timeoutMs?: number;
}

export interface QuickJsHostToWorkerTerminate {
  type: 'TERMINATE';
  sessionId: string;
}

export type QuickJsHostToWorkerMessage =
  | QuickJsHostToWorkerInit
  | QuickJsHostToWorkerExecute
  | QuickJsHostToWorkerTerminate;

export interface QuickJsWorkerToHostReady {
  type: 'READY';
}

export interface QuickJsWorkerToHostConsole {
  type: 'CONSOLE';
  sessionId: string;
  level: 'log' | 'info' | 'warn' | 'error';
  args: string[];
}

export interface QuickJsWorkerToHostError {
  type: 'ERROR';
  sessionId: string;
  error: {
    message: string;
    line: number | null;
    column: number | null;
    stack?: string;
  };
}

export interface QuickJsWorkerToHostComplete {
  type: 'COMPLETE';
  sessionId: string;
  durationMs: number;
}

export interface QuickJsWorkerToHostAborted {
  type: 'ABORTED';
  sessionId: string;
  reason: string;
}

export type QuickJsWorkerToHostMessage =
  | QuickJsWorkerToHostReady
  | QuickJsWorkerToHostConsole
  | QuickJsWorkerToHostError
  | QuickJsWorkerToHostComplete
  | QuickJsWorkerToHostAborted;
