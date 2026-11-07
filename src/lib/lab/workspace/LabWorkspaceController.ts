/**
 * Astro Blog「试验田 Lab」Workspace 控制中心 (LabWorkspaceController)
 *
 * 作为试验田唯一状态所有者 (Single Source of Truth)，协调编辑器适配器、运行时适配器、
 * 会话生命周期状态机、持久化与事件总线。
 */
import type {
  LabProject,
  LabEditorKind,
  LabRuntimeKind,
  LabSessionLifecycle,
  RunOptions,
  RunSession,
} from '../types.ts';
import type {
  SandboxConsoleEntry,
  SandboxRuntimeError,
  SandboxIsolationMode,
  LabCodeSourceKind,
} from '../../lab-sandbox-protocol.ts';
import type { LabFile } from '../../lab-schema.ts';
import type { WorkspaceSnapshot } from './WorkspaceSnapshot.ts';
import { WorkspaceEventBus } from './WorkspaceEvents.ts';
import { EditorRegistry } from './EditorRegistry.ts';
import { RuntimeRegistry } from './RuntimeRegistry.ts';
import { WorkspacePersistence } from './WorkspacePersistence.ts';
import { SessionManager } from '../SessionManager.ts';

export interface LabWorkspaceControllerConfig {
  project: LabProject;
  editorKind?: LabEditorKind;
  runtimeKind?: LabRuntimeKind;
  sourceKind?: LabCodeSourceKind;
  isolationMode?: SandboxIsolationMode;
  externalOrigin?: string | null;
  enableLiveCodes?: boolean;
  liveCodesAppUrl?: string;
  theme?: 'light' | 'dark';
}

export class LabWorkspaceController {
  private project: LabProject;
  private activeFileIndex = 0;
  private editorKind: LabEditorKind;
  private runtimeKind: LabRuntimeKind;
  private sourceKind: LabCodeSourceKind;
  private dirty = false;
  private sessionLifecycle: LabSessionLifecycle = 'idle';
  private consoleEntries: SandboxConsoleEntry[] = [];
  private runtimeErrors: SandboxRuntimeError[] = [];
  private lastDurationMs: number | null = null;
  private failClosedReason = '';
  private isolationMode: SandboxIsolationMode;
  private externalOrigin: string | null;
  private theme: 'light' | 'dark' = 'light';

  private editorRegistry: EditorRegistry;
  private runtimeRegistry: RuntimeRegistry;
  private sessionManager: SessionManager;
  private eventBus = new WorkspaceEventBus();

  private editorContainer: HTMLElement | null = null;
  private previewContainer: HTMLElement | null = null;
  private previewIframe: HTMLIFrameElement | null = null;
  private isDisposed = false;

  constructor(config: LabWorkspaceControllerConfig) {
    this.project = {
      ...config.project,
      files: config.project.files.map((f) => ({ ...f })),
    };
    this.editorKind = config.editorKind ?? 'lite';
    this.runtimeKind = config.runtimeKind ?? (config.project.runtime as LabRuntimeKind) ?? 'browser-dom';
    this.sourceKind = config.sourceKind ?? 'official';
    this.isolationMode = config.isolationMode ?? 'cross-origin';
    this.externalOrigin = config.externalOrigin ?? null;
    this.theme = config.theme ?? 'light';

    this.editorRegistry = new EditorRegistry({
      enableLiveCodes: config.enableLiveCodes,
      liveCodesAppUrl: config.liveCodesAppUrl,
    });
    this.runtimeRegistry = new RuntimeRegistry();
    this.sessionManager = new SessionManager();
  }

  // ===== 快照订阅与获取 =====

  subscribe(listener: (snapshot: WorkspaceSnapshot) => void): () => void {
    return this.eventBus.on('snapshot', listener);
  }

  getSnapshot(): WorkspaceSnapshot {
    return {
      project: this.project,
      activeFileIndex: this.activeFileIndex,
      editorKind: this.editorKind,
      runtimeKind: this.runtimeKind,
      sourceKind: this.sourceKind,
      dirty: this.dirty,
      sessionLifecycle: this.sessionLifecycle,
      sessionId: this.sessionManager.getSessionId(),
      consoleEntries: [...this.consoleEntries],
      runtimeErrors: [...this.runtimeErrors],
      lastDurationMs: this.lastDurationMs,
      failClosedReason: this.failClosedReason,
      isolationMode: this.isolationMode,
      externalOrigin: this.externalOrigin,
      runtimeCapabilities: this.runtimeRegistry.getCapabilities(this.runtimeKind),
      supportedEditors: this.editorRegistry.listKinds(),
      supportedRuntimes: this.runtimeRegistry.listKinds(),
      liveCodesEnabled: this.editorRegistry.has('livecodes'),
    };
  }

  private notifySnapshot(): void {
    if (this.isDisposed) return;
    this.eventBus.emit('snapshot', this.getSnapshot());
  }

  // ===== 工程与代码状态变更 =====

  async setProject(project: LabProject, sourceKind?: LabCodeSourceKind): Promise<void> {
    this.project = {
      ...project,
      files: project.files.map((f) => ({ ...f })),
    };
    if (sourceKind) {
      this.sourceKind = sourceKind;
    }
    this.activeFileIndex = 0;
    this.dirty = false;
    this.clearConsole();
    this.clearErrors();

    // 同步给活动编辑器
    const editor = this.editorRegistry.get(this.editorKind);
    await editor.setProject(this.project);

    this.notifySnapshot();
  }

  updateFiles(files: LabFile[]): void {
    this.project.files = files.map((f) => ({ ...f }));
    this.dirty = true;
    WorkspacePersistence.saveDraft(this.project.slug, this.project);
    this.notifySnapshot();
  }

  updateActiveFileContent(content: string): void {
    if (this.project.files[this.activeFileIndex]) {
      this.project.files[this.activeFileIndex].content = content;
      this.dirty = true;
      WorkspacePersistence.saveDraft(this.project.slug, this.project);
      this.notifySnapshot();
    }
  }

  setActiveFileIndex(index: number): void {
    if (index >= 0 && index < this.project.files.length) {
      this.activeFileIndex = index;
      this.notifySnapshot();
    }
  }

  setTheme(theme: 'light' | 'dark'): void {
    this.theme = theme;
  }

  setExternalOrigin(origin: string | null): void {
    this.externalOrigin = origin;
    this.notifySnapshot();
  }

  // ===== 容器与挂载 =====

  setPreviewContainer(container: HTMLElement | null): void {
    this.previewContainer = container;
  }

  setPreviewIframe(iframe: HTMLIFrameElement | null): void {
    this.previewIframe = iframe;
  }

  async mountEditor(container: HTMLElement): Promise<void> {
    this.editorContainer = container;
    const editor = this.editorRegistry.get(this.editorKind);
    await editor.mount(container, this.project);
  }

  async setEditorKind(kind: LabEditorKind): Promise<void> {
    if (this.editorKind === kind) return;
    const prevEditor = this.editorRegistry.get(this.editorKind);
    const updatedProject = await prevEditor.getProject().catch(() => this.project);
    this.project = updatedProject;

    this.editorKind = kind;
    const nextEditor = this.editorRegistry.get(kind);
    if (this.editorContainer) {
      await nextEditor.mount(this.editorContainer, this.project);
    }
    this.notifySnapshot();
  }

  async setRuntimeKind(kind: LabRuntimeKind): Promise<void> {
    if (this.runtimeKind === kind) return;
    const validation = this.runtimeRegistry.validateProjectForRuntime(this.project, kind);
    if (!validation.ok) {
      this.eventBus.emit('toast', validation.reason || '当前工程不符合该运行时的约束');
      return;
    }

    // 若当前正在运行，先优雅停止
    if (this.sessionLifecycle === 'running' || this.sessionLifecycle === 'connecting') {
      await this.stop();
    }

    this.runtimeKind = kind;
    this.notifySnapshot();
  }

  // ===== 执行控制流 (Run / Stop / Reset) =====

  async run(options?: Partial<RunOptions>): Promise<RunSession> {
    // 1. 同步当前编辑器内容
    try {
      const editor = this.editorRegistry.get(this.editorKind);
      const latestProject = await editor.getProject();
      this.project = latestProject;
    } catch {}

    // 2. 校验运行时是否支持当前工程
    const validation = this.runtimeRegistry.validateProjectForRuntime(this.project, this.runtimeKind);
    if (!validation.ok) {
      const err: SandboxRuntimeError = {
        message: validation.reason || '运行时兼容性检查未通过',
        line: null,
        column: null,
        timestamp: Date.now(),
      };
      this.runtimeErrors = [err];
      this.sessionLifecycle = 'error';
      this.notifySnapshot();
      return {
        sessionId: this.sessionManager.getSessionId(),
        status: 'error',
        startedAt: Date.now(),
        error: err,
      };
    }

    // 3. 轮换 Session Id 并重置状态
    const { sessionId, cspNonce } = this.sessionManager.rotate();
    this.consoleEntries = [];
    this.runtimeErrors = [];
    this.lastDurationMs = null;
    this.failClosedReason = '';
    this.sessionLifecycle = 'connecting';
    this.notifySnapshot();

    // 4. 获取活跃 Runtime Adapter
    const runtime = this.runtimeRegistry.get(this.runtimeKind);

    const mergedOptions: RunOptions = {
      sessionId,
      cspNonce,
      isolationMode: this.isolationMode,
      externalOrigin: this.externalOrigin,
      timeoutMs: options?.timeoutMs,
      theme: options?.theme ?? this.theme,
      sourceKind: this.sourceKind,
      container: options?.container ?? this.previewContainer,
      iframe: options?.iframe ?? this.previewIframe,
      onConsole: (entry) => {
        this.consoleEntries.push(entry);
        this.eventBus.emit('console', entry);
        this.notifySnapshot();
      },
      onError: (err) => {
        this.runtimeErrors.push(err);
        this.sessionLifecycle = 'error';
        this.eventBus.emit('error', err);
        this.notifySnapshot();
      },
      onComplete: (durationMs) => {
        this.lastDurationMs = durationMs;
        this.sessionLifecycle = 'completed';
        this.notifySnapshot();
      },
      onAbort: (reason) => {
        this.sessionLifecycle = 'aborted';
        this.runtimeErrors.push({
          message: reason,
          line: null,
          column: null,
          timestamp: Date.now(),
        });
        this.notifySnapshot();
      },
      onStatusChange: (status) => {
        this.sessionLifecycle = status;
        this.eventBus.emit('status', status);
        this.notifySnapshot();
      },
      ...options,
    };

    const session = await runtime.run(this.project, mergedOptions);
    return session;
  }

  async stop(): Promise<void> {
    const runtime = this.runtimeRegistry.get(this.runtimeKind);
    await runtime.stop(this.sessionManager.getSessionId());
    this.sessionLifecycle = 'terminated';
    this.notifySnapshot();
  }

  async reset(): Promise<void> {
    await this.stop();
    this.consoleEntries = [];
    this.runtimeErrors = [];
    this.lastDurationMs = null;
    this.sessionLifecycle = 'idle';

    const editor = this.editorRegistry.get(this.editorKind);
    await editor.reset();

    WorkspacePersistence.clearDraft(this.project.slug);
    this.dirty = false;
    this.notifySnapshot();
  }

  clearConsole(): void {
    this.consoleEntries = [];
    this.notifySnapshot();
  }

  clearErrors(): void {
    this.runtimeErrors = [];
    this.notifySnapshot();
  }

  // ===== 导入导出与便携包 =====

  exportBundle(): string {
    return WorkspacePersistence.exportBundle(this.project, this.sourceKind);
  }

  exportJson(): string {
    return WorkspacePersistence.exportJson(this.project, this.sourceKind);
  }

  importBundle(encoded: string): { ok: boolean; errors?: string[] } {
    const res = WorkspacePersistence.decodeBundle(encoded);
    if (!res.ok || !res.data) {
      return { ok: false, errors: res.errors || ['解码失败'] };
    }
    const bundle = res.data;
    if (!bundle.files || !Array.isArray(bundle.files)) {
      return { ok: false, errors: ['便携包缺少文件列表'] };
    }

    this.project = {
      id: bundle.id || `imported-${Date.now()}`,
      slug: bundle.slug || 'imported-experiment',
      title: bundle.title || 'Imported Experiment',
      files: bundle.files,
      runtime: bundle.runtime,
      language: bundle.language,
    };
    this.sourceKind = bundle.sourceKind === 'community' ? 'community' : 'bundle';
    this.activeFileIndex = 0;
    this.dirty = false;
    this.clearConsole();
    this.clearErrors();

    const editor = this.editorRegistry.get(this.editorKind);
    editor.setProject(this.project);

    this.notifySnapshot();
    return { ok: true };
  }

  importJson(jsonStr: string): { ok: boolean; errors?: string[] } {
    const validated = WorkspacePersistence.decodeBundle ? (WorkspacePersistence as any).importFromJson?.(jsonStr) : null;
    const res = validated || (typeof jsonStr === 'string' ? (() => {
      try {
        const parsed = JSON.parse(jsonStr);
        return { ok: true, data: parsed };
      } catch {
        return { ok: false, errors: ['无效的 JSON 文件格式'] };
      }
    })() : { ok: false, errors: ['无效输入'] });

    if (!res.ok || !res.data) {
      return { ok: false, errors: res.errors || ['导入校验失败'] };
    }
    const bundle = res.data;
    if (!bundle.files || !Array.isArray(bundle.files)) {
      return { ok: false, errors: ['便携包缺少文件列表'] };
    }

    this.project = {
      id: bundle.id || `imported-${Date.now()}`,
      slug: bundle.slug || 'imported-experiment',
      title: bundle.title || 'Imported Experiment',
      files: bundle.files,
      runtime: bundle.runtime,
      language: bundle.language,
    };
    this.sourceKind = bundle.sourceKind === 'community' ? 'community' : 'imported';
    this.activeFileIndex = 0;
    this.dirty = false;
    this.clearConsole();
    this.clearErrors();

    const editor = this.editorRegistry.get(this.editorKind);
    editor.setProject(this.project);

    this.notifySnapshot();
    return { ok: true };
  }

  // ===== 资源清理与销毁 =====

  async dispose(): Promise<void> {
    this.isDisposed = true;
    await this.stop();
    await this.editorRegistry.disposeAll();
    await this.runtimeRegistry.disposeAll();
    this.sessionManager.dispose();
    this.eventBus.clear();
    this.editorContainer = null;
    this.previewContainer = null;
    this.previewIframe = null;
  }
}
