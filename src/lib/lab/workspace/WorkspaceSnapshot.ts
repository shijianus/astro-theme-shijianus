/**
 * Astro Blog「试验田 Lab」Workspace 快照定义
 *
 * 为 React 组件提供单一数据源订阅视图，解耦状态机与表现层。
 */
import type {
  LabProject,
  LabEditorKind,
  LabRuntimeKind,
  LabSessionLifecycle,
  LabAdapterCapabilities,
} from '../types.ts';
import type {
  SandboxConsoleEntry,
  SandboxRuntimeError,
  SandboxIsolationMode,
  LabCodeSourceKind,
} from '../../lab-sandbox-protocol.ts';

export interface WorkspaceSnapshot {
  project: LabProject;
  activeFileIndex: number;
  editorKind: LabEditorKind;
  runtimeKind: LabRuntimeKind;
  sourceKind: LabCodeSourceKind;
  dirty: boolean;
  sessionLifecycle: LabSessionLifecycle;
  sessionId: string;
  consoleEntries: SandboxConsoleEntry[];
  runtimeErrors: SandboxRuntimeError[];
  lastDurationMs: number | null;
  failClosedReason: string;
  isolationMode: SandboxIsolationMode;
  externalOrigin: string | null;
  runtimeCapabilities: LabAdapterCapabilities;
  supportedEditors: LabEditorKind[];
  supportedRuntimes: LabRuntimeKind[];
  liveCodesEnabled: boolean;
  sandboxSrcDoc: string;
  bridgeFallbackForced: boolean;
}

export function createInitialSnapshot(params: {
  project: LabProject;
  editorKind?: LabEditorKind;
  runtimeKind?: LabRuntimeKind;
  sourceKind?: LabCodeSourceKind;
  sessionId: string;
  isolationMode?: SandboxIsolationMode;
  externalOrigin?: string | null;
  capabilities: LabAdapterCapabilities;
  supportedEditors?: LabEditorKind[];
  supportedRuntimes?: LabRuntimeKind[];
  liveCodesEnabled?: boolean;
}): WorkspaceSnapshot {
  return {
    project: params.project,
    activeFileIndex: 0,
    editorKind: params.editorKind ?? 'lite',
    runtimeKind: params.runtimeKind ?? 'browser-dom',
    sourceKind: params.sourceKind ?? 'official',
    dirty: false,
    sessionLifecycle: 'idle',
    sessionId: params.sessionId,
    consoleEntries: [],
    runtimeErrors: [],
    lastDurationMs: null,
    failClosedReason: '',
    isolationMode: params.isolationMode ?? 'cross-origin',
    externalOrigin: params.externalOrigin ?? null,
    runtimeCapabilities: params.capabilities,
    supportedEditors: params.supportedEditors ?? ['lite', 'livecodes'],
    supportedRuntimes: params.supportedRuntimes ?? ['browser-dom', 'quickjs', 'curated-trace'],
    liveCodesEnabled: params.liveCodesEnabled ?? false,
    sandboxSrcDoc: '',
    bridgeFallbackForced: false,
  };
}
