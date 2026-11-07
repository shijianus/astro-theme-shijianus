/**
 * Astro Blog「试验田 Lab」轻量原生文本编辑器适配器 (LiteEditorAdapter)
 *
 * 适用于受控环境下的快速源码预览与编辑，零第三方重量级依赖。
 */
import type { LabEditorAdapter, LabProject, LabEditorKind } from '../types.ts';
import type { LabFile } from '../../lab-schema.ts';

export class LiteEditorAdapter implements LabEditorAdapter {
  readonly kind: LabEditorKind = 'lite';
  private container: HTMLElement | null = null;
  private currentProject: LabProject | null = null;
  private activeFileIndex = 0;
  private textareaEl: HTMLTextAreaElement | null = null;
  private tabsContainerEl: HTMLElement | null = null;

  async mount(container: HTMLElement, project: LabProject): Promise<void> {
    this.container = container;
    this.currentProject = {
      ...project,
      files: project.files.map((f) => ({ ...f })),
    };
    this.activeFileIndex = 0;
    this.render();
  }

  async setProject(project: LabProject): Promise<void> {
    this.currentProject = {
      ...project,
      files: project.files.map((f) => ({ ...f })),
    };
    this.activeFileIndex = 0;
    this.render();
  }

  async getProject(): Promise<LabProject> {
    this.syncCurrentFileContent();
    if (!this.currentProject) {
      throw new Error('LiteEditorAdapter is not mounted');
    }
    return {
      ...this.currentProject,
      files: this.currentProject.files.map((f) => ({ ...f })),
    };
  }

  async reset(): Promise<void> {
    if (this.currentProject) {
      this.activeFileIndex = 0;
      this.render();
    }
  }

  get tabsContainer(): HTMLElement | null {
    return this.tabsContainerEl;
  }

  async dispose(): Promise<void> {
    if (this.container) {
      this.container.innerHTML = '';
      this.container = null;
    }
    this.textareaEl = null;
    this.tabsContainerEl = null;
    this.currentProject = null;
  }

  private syncCurrentFileContent(): void {
    if (this.textareaEl && this.currentProject?.files[this.activeFileIndex]) {
      this.currentProject.files[this.activeFileIndex].content = this.textareaEl.value;
    }
  }

  private switchFile(index: number): void {
    this.syncCurrentFileContent();
    this.activeFileIndex = index;
    this.render();
  }

  private render(): void {
    if (!this.container || !this.currentProject) return;

    this.container.innerHTML = '';
    const wrapper = document.createElement('div');
    wrapper.className = 'lite-editor-wrapper flex flex-col h-full w-full';

    // 标签栏
    const tabs = document.createElement('div');
    tabs.className = 'lite-editor-tabs flex items-center gap-1.5 p-2 bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 overflow-x-auto';
    this.currentProject.files.forEach((file: LabFile, idx: number) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `px-3 py-1.5 text-xs font-mono rounded ${
        idx === this.activeFileIndex
          ? 'bg-blue-600 text-white'
          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
      }`;
      btn.textContent = file.name;
      btn.onclick = () => this.switchFile(idx);
      tabs.appendChild(btn);
    });
    this.tabsContainerEl = tabs;
    wrapper.appendChild(tabs);

    // 编辑区域
    const activeFile = this.currentProject.files[this.activeFileIndex];
    const textarea = document.createElement('textarea');
    textarea.className = 'lite-editor-textarea flex-1 p-4 font-mono text-xs leading-relaxed bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 border-0 outline-none resize-none overflow-auto';
    textarea.value = activeFile ? activeFile.content : '';
    textarea.spellcheck = false;
    this.textareaEl = textarea;
    wrapper.appendChild(textarea);

    this.container.appendChild(wrapper);
  }
}
