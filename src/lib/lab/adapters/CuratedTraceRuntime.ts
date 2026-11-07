/**
 * Astro Blog「试验田 Lab」精选执行追踪运行时适配器 (CuratedTraceRuntime)
 *
 * 适用于物理模拟、音频流、算法步骤与状态机轨迹的可视化受控回放。
 */
import type {
  LabRuntimeAdapter,
  LabProject,
  RunOptions,
  RunSession,
  LabRuntimeKind,
  LabAdapterCapabilities,
} from '../types.ts';

export interface TraceStep {
  step: number;
  label: string;
  state: Record<string, unknown>;
  timestamp: number;
}

export class CuratedTraceRuntime implements LabRuntimeAdapter {
  readonly kind: LabRuntimeKind = 'curated-trace';
  readonly capabilities: LabAdapterCapabilities = {
    dom: false,
    network: false,
    worker: false,
    typescript: false,
    html: false,
    css: false,
    trace: true,
    interruptible: true,
  };

  private activeSessionId: string | null = null;
  private traceTimer: ReturnType<typeof setInterval> | null = null;
  private currentStep = 0;

  async run(project: LabProject, options: RunOptions): Promise<RunSession> {
    const startedAt = Date.now();
    this.activeSessionId = options.sessionId;
    this.currentStep = 0;

    options.onConsole?.({
      id: `${startedAt}-init`,
      level: 'info',
      args: [`[CuratedTraceRuntime] Initializing trace session for "${project.title}"`],
      timestamp: startedAt,
    });

    const maxSteps = 10;
    this.traceTimer = setInterval(() => {
      this.currentStep++;
      options.onConsole?.({
        id: `${Date.now()}-step-${this.currentStep}`,
        level: 'log',
        args: [`[Step ${this.currentStep}/${maxSteps}] Executing simulated step for ${project.slug}`],
        timestamp: Date.now(),
      });

      if (this.currentStep >= maxSteps) {
        if (this.traceTimer) {
          clearInterval(this.traceTimer);
          this.traceTimer = null;
        }
        options.onComplete?.(Date.now() - startedAt);
      }
    }, 200);

    return {
      sessionId: options.sessionId,
      status: 'running',
      startedAt,
    };
  }

  async stop(sessionId: string): Promise<void> {
    if (this.traceTimer && this.activeSessionId === sessionId) {
      clearInterval(this.traceTimer);
      this.traceTimer = null;
    }
    this.activeSessionId = null;
  }

  async dispose(): Promise<void> {
    if (this.traceTimer) {
      clearInterval(this.traceTimer);
      this.traceTimer = null;
    }
    this.activeSessionId = null;
  }
}
