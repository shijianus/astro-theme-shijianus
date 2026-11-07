/**
 * Astro Blog「试验田 Lab」架构适配器核心类型定义
 */
import type {
  LabFile,
  LabLanguage,
  LabRuntimeType,
  LabExperiment,
} from '../lab-schema';
import type {
  SandboxConsoleEntry,
  SandboxRuntimeError,
  SandboxIsolationMode,
} from '../lab-sandbox-protocol';

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
  cspNonce: string;
  isolationMode?: SandboxIsolationMode;
  externalOrigin?: string | null;
  timeoutMs?: number;
  theme?: 'light' | 'dark';
  onConsole?: (entry: SandboxConsoleEntry) => void;
  onError?: (error: SandboxRuntimeError) => void;
  onComplete?: (durationMs: number) => void;
  onAbort?: (reason: string) => void;
}

export interface RunSession {
  sessionId: string;
  status: 'running' | 'completed' | 'error' | 'aborted' | 'terminated';
  startedAt: number;
  durationMs?: number;
  error?: SandboxRuntimeError;
}

export interface LabEditorAdapter {
  mount(container: HTMLElement, project: LabProject): Promise<void>;
  getProject(): Promise<LabProject>;
  reset(): Promise<void>;
  dispose(): Promise<void>;
}

export interface LabRuntimeAdapter {
  run(project: LabProject, options: RunOptions): Promise<RunSession>;
  stop(sessionId: string): Promise<void>;
  dispose(): Promise<void>;
}
