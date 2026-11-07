/**
 * Astro Blog「试验田 Lab」LiveCodes 高级编辑器适配器 (LiveCodesEditorAdapter)
 *
 * 实施严格安全与架构边界：
 * 1. 严格受独立 Feature Flag (`PUBLIC_LAB_ENABLE_LIVECODES`) 控制，默认关闭；
 * 2. `PUBLIC_LAB_LIVECODES_APP_URL` 必须显式配置，严禁隐式回退公共 livecodes.io；
 * 3. 严格执行 HTTPS 协议与域名 Allowlist 校验；
 * 4. 强制「点击后按需载入」(Click-to-Load) 模式，加载前向用户明确告知将下载外部编辑器资源；
 * 5. 双向工程状态同步：向 LiveCodes 发送 LabProject，并监听其变更同步回 Workspace Controller；
 * 6. 超时与加载失败完整回退 Lite Editor；
 * 7. 纯编辑器职责，绝不赋予沙盒执行权限（执行仍由 RuntimeRegistry 驱动）；
 * 8. 资源幂等销毁 (移除 iframe 与全局 message 监听器)。
 */
import type { LabEditorAdapter, LabProject, LabEditorKind } from '../types.ts';

export interface LiveCodesOptions {
  appUrl?: string;
  enableFeatureFlag?: boolean;
  allowedHosts?: string[];
  loadTimeoutMs?: number;
  onFallbackToLite?: () => void;
  onProjectChange?: (project: LabProject) => void;
}

export function validateLiveCodesAppUrl(
  url?: string | null,
  allowedHosts?: string[]
): { ok: boolean; error?: string; validatedUrl?: string; origin?: string } {
  if (!url || typeof url !== 'string' || !url.trim()) {
    return {
      ok: false,
      error: 'PUBLIC_LAB_LIVECODES_APP_URL 未显式配置，禁止隐式连接公共服务。',
    };
  }

  const trimmed = url.trim();
  try {
    const parsed = new URL(trimmed);
    const isHttps = parsed.protocol === 'https:';
    const isLocalhost =
      parsed.protocol === 'http:' &&
      (parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1');

    if (!isHttps && !isLocalhost) {
      return {
        ok: false,
        error: `LiveCodes App URL 必须使用安全的 HTTPS 协议 (本地测试允许 localhost): "${trimmed}"`,
      };
    }

    if (allowedHosts && allowedHosts.length > 0) {
      const hostMatch = allowedHosts.includes(parsed.hostname);
      if (!hostMatch) {
        return {
          ok: false,
          error: `LiveCodes 目标域名 "${parsed.hostname}" 不在允许的白名单内: [${allowedHosts.join(', ')}]`,
        };
      }
    }

    return {
      ok: true,
      validatedUrl: parsed.href,
      origin: parsed.origin,
    };
  } catch {
    return {
      ok: false,
      error: `LiveCodes App URL 无法解析为有效 URL: "${trimmed}"`,
    };
  }
}

export class LiveCodesEditorAdapter implements LabEditorAdapter {
  readonly kind: LabEditorKind = 'livecodes';

  private container: HTMLElement | null = null;
  private currentProject: LabProject | null = null;
  private isLoaded = false;
  private iframeEl: HTMLIFrameElement | null = null;
  private options: LiveCodesOptions;
  private messageListener: ((ev: MessageEvent) => void) | null = null;
  private loadTimer: ReturnType<typeof setTimeout> | null = null;
  private firstLoadSizeBytes = 0;
  private activeIframeCount = 0;

  constructor(options: LiveCodesOptions = {}) {
    let flag = options.enableFeatureFlag;
    let url = options.appUrl;

    if (flag === undefined) {
      if (typeof import.meta !== 'undefined' && import.meta.env) {
        flag = import.meta.env.PUBLIC_LAB_ENABLE_LIVECODES === 'true';
      } else if (typeof process !== 'undefined' && process.env) {
        flag = process.env.PUBLIC_LAB_ENABLE_LIVECODES === 'true';
      } else {
        flag = false;
      }
    }

    if (!url) {
      if (typeof import.meta !== 'undefined' && import.meta.env) {
        url = import.meta.env.PUBLIC_LAB_LIVECODES_APP_URL || '';
      } else if (typeof process !== 'undefined' && process.env) {
        url = process.env.PUBLIC_LAB_LIVECODES_APP_URL || '';
      }
    }

    this.options = {
      appUrl: url,
      enableFeatureFlag: Boolean(flag),
      allowedHosts: options.allowedHosts,
      loadTimeoutMs: options.loadTimeoutMs ?? 10000,
      onFallbackToLite: options.onFallbackToLite,
      onProjectChange: options.onProjectChange,
    };
  }

  isFeatureEnabled(): boolean {
    return Boolean(this.options.enableFeatureFlag);
  }

  getIsLoaded(): boolean {
    return this.isLoaded;
  }

  get iframe(): HTMLIFrameElement | null {
    return this.iframeEl;
  }

  getFirstLoadSizeBytes(): number {
    return this.firstLoadSizeBytes;
  }

  getActiveIframeCount(): number {
    return this.activeIframeCount;
  }

  async mount(container: HTMLElement, project: LabProject): Promise<void> {
    this.container = container;
    this.currentProject = {
      ...project,
      files: project.files.map((f) => ({ ...f })),
    };

    if (!this.isFeatureEnabled()) {
      this.renderDisabledState('LiveCodes 适配器特性标志未开启 (PUBLIC_LAB_ENABLE_LIVECODES=false)');
      return;
    }

    const val = validateLiveCodesAppUrl(this.options.appUrl, this.options.allowedHosts);
    if (!val.ok) {
      this.renderDisabledState(val.error || 'LiveCodes 配置无效');
      return;
    }

    this.renderClickToLoadState();
  }

  async setProject(project: LabProject): Promise<void> {
    this.currentProject = {
      ...project,
      files: project.files.map((f) => ({ ...f })),
    };

    if (this.isLoaded && this.iframeEl?.contentWindow) {
      try {
        const val = validateLiveCodesAppUrl(this.options.appUrl, this.options.allowedHosts);
        const targetOrigin = val.origin || '*';
        this.iframeEl.contentWindow.postMessage(
          {
            type: 'set-project',
            project: this.currentProject,
          },
          targetOrigin
        );
      } catch (err) {
        console.warn('[LiveCodesEditorAdapter] Failed to sync project to LiveCodes iframe:', err);
      }
    }
  }

  async getProject(): Promise<LabProject> {
    if (!this.currentProject) {
      throw new Error('LiveCodesEditorAdapter is not mounted');
    }
    return {
      ...this.currentProject,
      files: this.currentProject.files.map((f) => ({ ...f })),
    };
  }

  async loadEditor(): Promise<void> {
    if (!this.isFeatureEnabled() || !this.container || !this.currentProject) {
      return;
    }

    const val = validateLiveCodesAppUrl(this.options.appUrl, this.options.allowedHosts);
    if (!val.ok || !val.validatedUrl) {
      this.renderDisabledState(val.error || 'LiveCodes URL 无效');
      return;
    }

    this.isLoaded = true;
    this.container.innerHTML = '';

    // 渲染载入中界面
    const loadingBox = document.createElement('div');
    loadingBox.className =
      'livecodes-loading-state p-6 text-center text-xs text-blue-400 font-mono bg-slate-900 rounded-lg h-full flex flex-col items-center justify-center space-y-2';
    loadingBox.innerHTML = `
      <div class="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full mb-2"></div>
      <p class="font-semibold">正在载入自托管 LiveCodes 编辑器...</p>
      <p class="text-2xs text-slate-500">如果连接超时，将自动回退到 Lite Editor。</p>
    `;
    this.container.appendChild(loadingBox);

    // 创建隔离 iframe
    const iframe = document.createElement('iframe');
    iframe.src = `${val.validatedUrl}?embed=true`;
    iframe.className = 'w-full h-full border-0 rounded-lg';
    iframe.title = 'LiveCodes Playground Editor';
    iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-forms allow-modals');
    iframe.setAttribute('referrerpolicy', 'no-referrer');
    iframe.style.display = 'none'; // 握手成功后再展示

    this.iframeEl = iframe;
    this.activeIframeCount = 1;
    this.firstLoadSizeBytes = 2.4 * 1024 * 1024; // 预估约 2.4MB 核心资源包
    this.container.appendChild(iframe);

    // 设置消息监听与握手
    const expectedOrigin = val.origin;
    this.messageListener = (ev: MessageEvent) => {
      // 严格验证消息来源
      if (expectedOrigin && ev.origin !== expectedOrigin && expectedOrigin !== '*') {
        return;
      }

      const data = ev.data;
      if (!data || typeof data !== 'object') return;

      // 握手成功
      if (data.type === 'ready' || data.type === 'livecodes-ready') {
        if (this.loadTimer) {
          clearTimeout(this.loadTimer);
          this.loadTimer = null;
        }
        loadingBox.style.display = 'none';
        iframe.style.display = 'block';

        // 初始注入工程
        if (this.currentProject && iframe.contentWindow) {
          iframe.contentWindow.postMessage(
            {
              type: 'set-project',
              project: this.currentProject,
            },
            expectedOrigin || '*'
          );
        }
      }

      // LiveCodes 代码修改同步
      if (data.type === 'change' || data.type === 'livecodes-change') {
        if (Array.isArray(data.files)) {
          this.currentProject = {
            ...this.currentProject!,
            files: data.files,
          };
          this.options.onProjectChange?.(this.currentProject);
        } else if (data.config && typeof data.config === 'object') {
          // LiveCodes SDK 格式转换
          const updatedFiles = [...(this.currentProject?.files || [])];
          if (data.config.markup?.content !== undefined) {
            const f = updatedFiles.find((x) => x.name.endsWith('.html'));
            if (f) f.content = data.config.markup.content;
          }
          if (data.config.style?.content !== undefined) {
            const f = updatedFiles.find((x) => x.name.endsWith('.css'));
            if (f) f.content = data.config.style.content;
          }
          if (data.config.script?.content !== undefined) {
            const f = updatedFiles.find((x) => x.name.endsWith('.js') || x.name.endsWith('.ts'));
            if (f) f.content = data.config.script.content;
          }
          this.currentProject = {
            ...this.currentProject!,
            files: updatedFiles,
          };
          this.options.onProjectChange?.(this.currentProject);
        }
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('message', this.messageListener);
    }

    // 设置加载超时兜底
    this.loadTimer = setTimeout(() => {
      this.handleLoadFailure('LiveCodes 容器加载超时 (10s)，自动安全回退至本地 Lite Editor。');
    }, this.options.loadTimeoutMs);

    iframe.onerror = () => {
      this.handleLoadFailure('LiveCodes iframe 连接被拒绝或加载失败。');
    };
  }

  handleLoadFailure(reason: string): void {
    if (this.loadTimer) {
      clearTimeout(this.loadTimer);
      this.loadTimer = null;
    }

    if (this.container) {
      this.container.innerHTML = `
        <div class="livecodes-fail-state p-6 text-center text-xs text-rose-400 font-mono bg-slate-900 rounded-lg h-full flex flex-col items-center justify-center space-y-3">
          <p class="font-semibold">${reason}</p>
          <button type="button" class="btn-fallback px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-2xs rounded border border-slate-700 transition">
            返回标准轻量编辑器 (Lite Editor)
          </button>
        </div>
      `;
      const btn = this.container.querySelector('.btn-fallback') as HTMLButtonElement;
      if (btn) {
        btn.onclick = () => {
          this.options.onFallbackToLite?.();
        };
      }
    }

    // 触发回退回调
    this.options.onFallbackToLite?.();
  }

  async reset(): Promise<void> {
    if (this.loadTimer) {
      clearTimeout(this.loadTimer);
      this.loadTimer = null;
    }
    this.isLoaded = false;
    if (this.isFeatureEnabled()) {
      this.renderClickToLoadState();
    } else {
      this.renderDisabledState('LiveCodes 适配器特性标志未开启');
    }
  }

  async dispose(): Promise<void> {
    if (this.loadTimer) {
      clearTimeout(this.loadTimer);
      this.loadTimer = null;
    }

    if (this.messageListener && typeof window !== 'undefined') {
      window.removeEventListener('message', this.messageListener);
      this.messageListener = null;
    }

    if (this.iframeEl) {
      if (this.iframeEl.parentNode) {
        this.iframeEl.parentNode.removeChild(this.iframeEl);
      }
      this.iframeEl = null;
    }

    this.activeIframeCount = 0;
    this.isLoaded = false;
    this.currentProject = null;

    if (this.container) {
      this.container.innerHTML = '';
      this.container = null;
    }
  }

  private renderDisabledState(message: string): void {
    if (!this.container) return;
    this.container.innerHTML = `
      <div class="livecodes-disabled-state p-6 text-center text-xs text-slate-500 font-mono bg-slate-900 rounded-lg h-full flex flex-col items-center justify-center">
        <p class="font-semibold text-slate-400">${message}</p>
        <p class="mt-2 text-2xs text-slate-500">为保障零外部请求与安全基线，默认仅激活 LiteEditor 本地编辑器。</p>
      </div>
    `;
  }

  private renderClickToLoadState(): void {
    if (!this.container) return;
    if (typeof document === 'undefined') {
      this.container.innerHTML = '<div class="livecodes-click-to-load">Click to load</div>';
      return;
    }
    this.container.innerHTML = '';
    const box = document.createElement('div');
    box.className =
      'livecodes-click-to-load p-6 text-center text-xs text-slate-300 font-mono bg-slate-900 rounded-lg h-full flex flex-col items-center justify-center space-y-3';

    const desc = document.createElement('p');
    desc.textContent = '自托管 LiveCodes 高级编辑器 (可选插件)';
    desc.className = 'font-semibold text-blue-400';
    box.appendChild(desc);

    const tip = document.createElement('p');
    tip.textContent =
      '注意：启用 LiveCodes 将在隔离 iframe 中按需加载自托管编辑器资源包（约 2MB+），点击下方按钮开始载入：';
    tip.className = 'text-2xs text-slate-400 max-w-sm leading-relaxed';
    box.appendChild(tip);

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = '按需载入 LiveCodes 编辑器';
    btn.className =
      'btn-load-livecodes px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg shadow transition';
    btn.onclick = () => this.loadEditor();
    box.appendChild(btn);

    this.container.appendChild(box);
  }
}
