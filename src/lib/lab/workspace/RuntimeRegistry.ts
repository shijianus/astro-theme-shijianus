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

  listKindsForProject(project: LabProject): LabRuntimeKind[] {
    const kinds: LabRuntimeKind[] = ['browser-dom', 'quickjs'];
    const hasTrace = Boolean(
      project.traceDefinition ||
      project.visualizationConfig?.enabled ||
      project.slug === 'algorithm-execution-tracer'
    );
    if (hasTrace) {
      kinds.push('curated-trace');
    }
    return kinds;
  }

  validateProjectForRuntime(project: LabProject, kind: LabRuntimeKind): { ok: boolean; reason?: string } {
    if (kind === 'curated-trace') {
      const hasTrace = Boolean(
        project.traceDefinition ||
        project.visualizationConfig?.enabled ||
        project.slug === 'algorithm-execution-tracer'
      );
      if (!hasTrace) {
        return {
          ok: false,
          reason: '当前实验未包含执行追踪 (Trace) 声明或算法数据，无法使用 Curated Trace 运行时。',
        };
      }
    }
    if (kind === 'quickjs') {
      const hasScript = project.files.some(
        (f) => (f.name.endsWith('.js') || f.name.endsWith('.ts')) && f.content.trim().length > 0
      );
      if (!hasScript) {
        return {
          ok: false,
          reason: `QuickJS 隔离环境仅支持 JavaScript / TypeScript 计算，当前项目不包含脚本文件。请切换到「Browser DOM」运行时。`,
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
