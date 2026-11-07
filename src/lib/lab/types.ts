/**
 * Astro Blog「试验田 Lab」架构适配器核心类型定义
 */
import type {
  LabFile,
  LabLanguage,
  LabRuntimeType,
  LabExperiment,
} from '../lab-schema.ts';
import type {
  SandboxConsoleEntry,
  SandboxRuntimeError,
  SandboxIsolationMode,
  LabCodeSourceKind,
} from '../lab-sandbox-protocol.ts';

export type LabEditorKind = 'lite' | 'livecodes';
export type LabRuntimeKind = 'browser-dom' | 'quickjs' | 'curated-trace';
export type LabSessionLifecycle =
  | 'idle'
  | 'connecting'
  | 'ready'
  | 'running'
  | 'completed'
  | 'aborted'
  | 'error'
  | 'terminated';

export interface LabAdapterCapabilities {
  dom: boolean;
  network: boolean;
  worker: boolean;
  typescript: boolean;
  html: boolean;
  css: boolean;
  trace: boolean;
  interruptible: boolean;
}

export interface LabProject {
  id: string;
  slug: string;
  title: string;
  files: LabFile[];
  runtime?: LabRuntimeType;
  language?: LabLanguage;
  authorRole?: 'owner' | 'contributor' | 'community';
  version?: string;
  defaultParams?: LabExperiment['defaultParams'];
}

export interface RunOptions {
  sessionId: string;
  cspNonce?: string;
  isolationMode?: SandboxIsolationMode;
  externalOrigin?: string | null;
  timeoutMs?: number;
  theme?: 'light' | 'dark';
  sourceKind?: LabCodeSourceKind;
  container?: HTMLElement | null;
  iframe?: HTMLIFrameElement | null;
  onConsole?: (entry: SandboxConsoleEntry) => void;
  onError?: (error: SandboxRuntimeError) => void;
  onComplete?: (durationMs: number) => void;
  onAbort?: (reason: string) => void;
  onStatusChange?: (status: LabSessionLifecycle) => void;
  onHeartbeat?: () => void;
}

export interface RunSession {
  sessionId: string;
  status: 'running' | 'completed' | 'error' | 'aborted' | 'terminated';
  startedAt: number;
  durationMs?: number;
  error?: SandboxRuntimeError;
}

export interface LabEditorAdapter {
  readonly kind: LabEditorKind;
  mount(container: HTMLElement, project: LabProject): Promise<void>;
  setProject(project: LabProject): Promise<void>;
  getProject(): Promise<LabProject>;
  reset(): Promise<void>;
  dispose(): Promise<void>;
}

export interface LabRuntimeAdapter {
  readonly kind: LabRuntimeKind;
  readonly capabilities: LabAdapterCapabilities;
  run(project: LabProject, options: RunOptions): Promise<RunSession>;
  stop(sessionId: string): Promise<void>;
  dispose(): Promise<void>;
}
