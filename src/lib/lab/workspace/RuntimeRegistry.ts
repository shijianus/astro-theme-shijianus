/**
 * Astro Blog「试验田 Lab」运行时注册表 (RuntimeRegistry)
 */
import type { LabRuntimeAdapter, LabRuntimeKind, LabAdapterCapabilities, LabProject } from '../types.ts';
import { BrowserDomRuntime } from '../adapters/BrowserDomRuntime.ts';
import { QuickJsRuntime } from '../adapters/QuickJsRuntime.ts';
import { CuratedTraceRuntime } from '../adapters/CuratedTraceRuntime.ts';

export class RuntimeRegistry {
  private adapters = new Map<LabRuntimeKind, LabRuntimeAdapter>();

  constructor() {
    this.register('browser-dom', new BrowserDomRuntime());
    this.register('quickjs', new QuickJsRuntime());
    this.register('curated-trace', new CuratedTraceRuntime());
  }

  register(kind: LabRuntimeKind, adapter: LabRuntimeAdapter): void {
    this.adapters.set(kind, adapter);
  }

  get(kind: LabRuntimeKind): LabRuntimeAdapter {
    const adapter = this.adapters.get(kind);
    if (!adapter) {
      const fallback = this.adapters.get('browser-dom');
      if (!fallback) {
        throw new Error(`[RuntimeRegistry] No adapter found for kind "${kind}" and no fallback.`);
      }
      return fallback;
    }
    return adapter;
  }

  getCapabilities(kind: LabRuntimeKind): LabAdapterCapabilities {
    return this.get(kind).capabilities;
  }

  listKinds(): LabRuntimeKind[] {
    return Array.from(this.adapters.keys());
  }

  validateProjectForRuntime(project: LabProject, kind: LabRuntimeKind): { ok: boolean; reason?: string } {
    const caps = this.getCapabilities(kind);
    if (!caps.html) {
      const hasHtml = project.files.some((f) => f.name.endsWith('.html') && f.content.trim().length > 0);
      if (hasHtml && kind === 'quickjs') {
        return {
          ok: false,
          reason: `QuickJS 隔离环境仅支持纯 JavaScript 计算，不支持 HTML 页面渲染。请切换到「Browser DOM」运行时。`,
        };
      }
    }
    return { ok: true };
  }

  async disposeAll(): Promise<void> {
    for (const adapter of this.adapters.values()) {
      try {
        await adapter.dispose();
      } catch (err) {
        console.error(`[RuntimeRegistry] Error disposing runtime "${adapter.kind}":`, err);
      }
    }
    this.adapters.clear();
  }
}
