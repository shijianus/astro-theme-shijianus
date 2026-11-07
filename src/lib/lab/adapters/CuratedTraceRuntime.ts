/**
 * Astro Blog「试验田 Lab」确定性精选执行追踪运行时 (CuratedTraceRuntime)
 *
 * 专为算法可视化、物理模拟步骤与状态机轨迹回放设计的确定性受限运行时：
 * 1. 严格使用声明式 Trace 定义 (LabTraceDefinition / LabTraceStep)；
 * 2. 完备的步进控制 (play / pause / stepForward / stepBack / seek / restart)；
 * 3. 严格配额控制 (最大 600 步，单步状态最大 64KB)；
 * 4. 零任意动态代码执行 (Zero eval / Zero new Function)；
 * 5. 与 Visualizer 表现层彻底解耦。
 */
import type {
  LabRuntimeAdapter,
  LabProject,
  RunOptions,
  RunSession,
  LabRuntimeKind,
  LabAdapterCapabilities,
} from '../types.ts';
import { generateExecutionTrace, type TraceStep } from '../../lab-tracer.ts';
import type { PresetAlgorithmId } from '../../lab-schema.ts';

export const MAX_TRACE_STEPS = 600;
export const MAX_PATCH_BYTES = 64 * 1024;

export interface LabTraceStep {
  id: string;
  stepIndex: number;
  line: number;
  label: string;
  durationMs: number;
  explanation?: string;
  patch: Record<string, unknown>;
  state: Record<string, unknown>;
  timestamp: number;
}

export interface LabTraceDefinition {
  version: 1;
  schemaVersion: 'lab-trace-v1';
  title: string;
  algorithmId?: PresetAlgorithmId;
  initialState: Record<string, unknown>;
  totalSteps: number;
  steps: LabTraceStep[];
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
  private currentOptions: RunOptions | null = null;
  private playbackTimer: ReturnType<typeof setInterval> | null = null;
  private isPlaying = false;
  private currentStepIndex = 0;
  private steps: LabTraceStep[] = [];
  private definition: LabTraceDefinition | null = null;
  private playbackSpeedMs = 250;
  private startedAt = 0;

  async run(project: LabProject, options: RunOptions): Promise<RunSession> {
    await this.dispose();

    this.startedAt = Date.now();
    this.activeSessionId = options.sessionId;
    this.currentOptions = options;
    this.currentStepIndex = 0;
    this.isPlaying = false;

    // 1. 生成或解析确定性 Trace 状态序列 (纯确定性状态机，严禁使用 eval)
    const algoId: PresetAlgorithmId =
      project.visualizationConfig?.presetAlgorithmId || 'bubble-sort';
    const traceResult = generateExecutionTrace({
      algorithmId: algoId,
      rawInput: project.visualizationConfig?.defaultInput || '38, 14, 29, 7, 42, 19, 11',
      targetValue: project.visualizationConfig?.defaultTarget ?? 42,
    });

    const rawSteps = traceResult.steps.slice(0, MAX_TRACE_STEPS);
    let prevState: Record<string, unknown> = {};

    this.steps = rawSteps.map((st: TraceStep, idx: number) => {
      const stateObj: Record<string, unknown> = {
        line: st.line,
        eventType: st.eventType,
        variables: { ...st.variables },
        arrayState: st.arrayState ? { ...st.arrayState } : null,
        callStackDepth: st.callStack.length,
      };

      // 验证单步体积配额 (MAX_PATCH_BYTES)
      const sizeEstimate = JSON.stringify(stateObj).length;
      if (sizeEstimate > MAX_PATCH_BYTES) {
        stateObj.variables = { _truncated: true };
      }

      // 计算相对于上一步的状态差异 (patch)
      const patchObj: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(stateObj)) {
        if (JSON.stringify(prevState[k]) !== JSON.stringify(v)) {
          patchObj[k] = v;
        }
      }
      prevState = stateObj;

      return {
        id: `trace-step-${idx}-${st.line}`,
        stepIndex: st.stepIndex,
        line: st.line,
        label: `[Step ${st.stepIndex + 1}/${rawSteps.length}] ${st.description}`,
        durationMs: 250,
        explanation: st.description,
        patch: patchObj,
        state: stateObj,
        timestamp: Date.now(),
      };
    });

    const initialStep = this.steps[0];
    this.definition = {
      version: 1,
      schemaVersion: 'lab-trace-v1',
      title: project.title,
      algorithmId: algoId,
      initialState: initialStep ? initialStep.state : {},
      totalSteps: this.steps.length,
      steps: this.steps,
    };

    options.onConsole?.({
      id: `${this.startedAt}-init`,
      level: 'info',
      args: [
        `[CuratedTraceRuntime] Initialized deterministic trace v1 for "${project.title}" (${this.steps.length} steps, algorithm: ${algoId})`,
      ],
      timestamp: this.startedAt,
    });

    options.onStatusChange?.('running');

    // 2. 自动启动播放
    this.play(this.playbackSpeedMs);

    return {
      sessionId: options.sessionId,
      status: 'running',
      startedAt: this.startedAt,
    };
  }

  // ===== 步进与播放控制 (Playback Controls) =====

  play(speedMs = 250): void {
    this.pause();
    this.playbackSpeedMs = speedMs;
    this.isPlaying = true;

    this.playbackTimer = setInterval(() => {
      if (this.currentStepIndex >= this.steps.length - 1) {
        this.pause();
        const duration = Date.now() - this.startedAt;
        this.currentOptions?.onComplete?.(duration);
        this.currentOptions?.onStatusChange?.('completed');
        return;
      }
      this.stepForward();
    }, this.playbackSpeedMs);
  }

  pause(): void {
    if (this.playbackTimer) {
      clearInterval(this.playbackTimer);
      this.playbackTimer = null;
    }
    this.isPlaying = false;
  }

  stepForward(): LabTraceStep | null {
    if (this.currentStepIndex < this.steps.length - 1) {
      this.currentStepIndex++;
      this.emitCurrentStep();
      return this.steps[this.currentStepIndex];
    }
    return null;
  }

  stepBack(): LabTraceStep | null {
    if (this.currentStepIndex > 0) {
      this.currentStepIndex--;
      this.emitCurrentStep();
      return this.steps[this.currentStepIndex];
    }
    return null;
  }

  seek(stepIndex: number): LabTraceStep | null {
    const target = Math.max(0, Math.min(stepIndex, this.steps.length - 1));
    this.currentStepIndex = target;
    this.emitCurrentStep();
    return this.steps[this.currentStepIndex] || null;
  }

  restart(): void {
    this.pause();
    this.currentStepIndex = 0;
    this.emitCurrentStep();
    this.play(this.playbackSpeedMs);
  }

  getCurrentStepIndex(): number {
    return this.currentStepIndex;
  }

  getTotalSteps(): number {
    return this.steps.length;
  }

  getIsPlaying(): boolean {
    return this.isPlaying;
  }

  getDefinition(): LabTraceDefinition | null {
    return this.definition;
  }

  exportTrace(): string {
    if (!this.definition) return '{}';
    return JSON.stringify(this.definition, null, 2);
  }

  private emitCurrentStep(): void {
    const step = this.steps[this.currentStepIndex];
    if (!step || !this.currentOptions) return;

    this.currentOptions.onConsole?.({
      id: `${Date.now()}-step-${step.stepIndex}`,
      level: 'log',
      args: [step.label],
      timestamp: Date.now(),
    });
  }

  async stop(sessionId: string): Promise<void> {
    if (this.activeSessionId === sessionId) {
      this.pause();
      this.currentOptions?.onStatusChange?.('aborted');
      this.activeSessionId = null;
    }
  }

  async dispose(): Promise<void> {
    this.pause();
    this.activeSessionId = null;
    this.currentOptions = null;
    this.steps = [];
    this.definition = null;
    this.currentStepIndex = 0;
  }
}
