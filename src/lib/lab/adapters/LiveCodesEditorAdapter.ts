/**
 * Astro Blog「试验田 Lab」LiveCodes 高级编辑器适配器 PoC (LiveCodesEditorAdapter)
 *
 * 实施严格安全边界：
 * 1. 严格受独立 Feature Flag (`PUBLIC_LAB_ENABLE_LIVECODES`) 控制，未开启时零网络外连；
 * 2. 即使开启也必须通过「点击后按需载入」(Click-to-Load) 模式加载，绝不自启动；
 * 3. 运行于独立隔离 iframe，绝不影响默认 LiteEditorAdapter。
 */
import type { LabEditorAdapter, LabProject } from '../types';

export interface LiveCodesOptions {
  appUrl?: string;
  enableFeatureFlag?: boolean;
}

export class LiveCodesEditorAdapter implements LabEditorAdapter {
  private container: HTMLElement | null = null;
  private currentProject: LabProject | null = null;
  private isLoaded = false;
  private iframeEl: HTMLIFrameElement | null = null;
  private options: LiveCodesOptions;

  constructor(options: LiveCodesOptions = {}) {
    let flag = options.enableFeatureFlag;
    if (flag === undefined) {
      if (typeof process !== 'undefined' && process.env) {
        flag = process.env.PUBLIC_LAB_ENABLE_LIVECODES === 'true';
      } else {
        flag = false;
      }
    }
    this.options = {
      appUrl: options.appUrl || 'https://livecodes.io',
      enableFeatureFlag: Boolean(flag),
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

  async mount(container: HTMLElement, project: LabProject): Promise<void> {
    this.container = container;
    this.currentProject = {
      ...project,
      files: project.files.map((f) => ({ ...f })),
    };

    if (!this.isFeatureEnabled()) {
      this.renderDisabledState();
      return;
    }

    this.renderClickToLoadState();
  }

  async loadEditor(): Promise<void> {
    if (!this.isFeatureEnabled() || !this.container || !this.currentProject) {
      return;
    }
    this.isLoaded = true;
    this.container.innerHTML = '';

    const iframe = document.createElement('iframe');
    iframe.src = `${this.options.appUrl}?embed=true`;
    iframe.className = 'w-full h-full border-0 rounded-lg';
    iframe.title = 'LiveCodes Playground Editor';
    iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-forms allow-modals');
    iframe.setAttribute('referrerpolicy', 'no-referrer');
    this.iframeEl = iframe;
    this.container.appendChild(iframe);
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

  async reset(): Promise<void> {
    if (this.currentProject) {
      this.isLoaded = false;
      if (this.isFeatureEnabled()) {
        this.renderClickToLoadState();
      } else {
        this.renderDisabledState();
      }
    }
  }

  async dispose(): Promise<void> {
    if (this.container) {
      this.container.innerHTML = '';
      this.container = null;
    }
    this.iframeEl = null;
    this.currentProject = null;
    this.isLoaded = false;
  }

  private renderDisabledState(): void {
    if (!this.container) return;
    this.container.innerHTML = `
      <div class="livecodes-disabled-state p-6 text-center text-xs text-slate-500 font-mono bg-slate-900 rounded-lg h-full flex flex-col items-center justify-center">
        <p class="font-semibold text-slate-400">LiveCodes 适配器特性标志未开启 (PUBLIC_LAB_ENABLE_LIVECODES=false)</p>
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
    desc.textContent = 'LiveCodes 第三方高级编辑器 (PoC)';
    desc.className = 'font-semibold text-blue-400';
    box.appendChild(desc);

    const tip = document.createElement('p');
    tip.textContent = '点击下方按钮按需向外部 LiveCodes 发起加载（隔离 iframe 中运行）：';
    tip.className = 'text-2xs text-slate-400';
    box.appendChild(tip);

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = '按需加载 LiveCodes 编辑器';
    btn.className =
      'px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg shadow transition';
    btn.onclick = () => this.loadEditor();
    box.appendChild(btn);

    this.container.appendChild(box);
  }
}
