/**
 * Astro Blog「试验田 Lab」编辑器注册表 (EditorRegistry)
 */
import type { LabEditorAdapter, LabEditorKind, LabProject } from '../types.ts';
import { LiteEditorAdapter } from '../adapters/LiteEditorAdapter.ts';
import { LiveCodesEditorAdapter } from '../adapters/LiveCodesEditorAdapter.ts';

export interface EditorRegistryOptions {
  enableLiveCodes?: boolean;
  liveCodesAppUrl?: string;
  allowedHosts?: string[];
  loadTimeoutMs?: number;
  onFallbackToLite?: () => void;
  onProjectChange?: (project: LabProject) => void;
}

export class EditorRegistry {
  private adapters = new Map<LabEditorKind, LabEditorAdapter>();

  constructor(options?: EditorRegistryOptions) {
    this.register('lite', new LiteEditorAdapter());
    this.register(
      'livecodes',
      new LiveCodesEditorAdapter({
        enableFeatureFlag: options?.enableLiveCodes,
        appUrl: options?.liveCodesAppUrl,
        allowedHosts: options?.allowedHosts,
        loadTimeoutMs: options?.loadTimeoutMs,
        onFallbackToLite: options?.onFallbackToLite,
        onProjectChange: options?.onProjectChange,
      })
    );
  }

  register(kind: LabEditorKind, adapter: LabEditorAdapter): void {
    this.adapters.set(kind, adapter);
  }

  get(kind: LabEditorKind): LabEditorAdapter {
    const adapter = this.adapters.get(kind);
    if (!adapter) {
      const fallback = this.adapters.get('lite');
      if (!fallback) {
        throw new Error(`[EditorRegistry] No adapter found for kind "${kind}" and no fallback available.`);
      }
      return fallback;
    }
    return adapter;
  }

  has(kind: LabEditorKind): boolean {
    if (kind === 'livecodes') {
      const adapter = this.adapters.get('livecodes') as LiveCodesEditorAdapter | undefined;
      return Boolean(adapter?.isFeatureEnabled());
    }
    return this.adapters.has(kind);
  }

  listKinds(): LabEditorKind[] {
    const kinds: LabEditorKind[] = ['lite'];
    if (this.has('livecodes')) {
      kinds.push('livecodes');
    }
    return kinds;
  }

  async disposeAll(): Promise<void> {
    for (const adapter of this.adapters.values()) {
      try {
        await adapter.dispose();
      } catch (err) {
        console.error(`[EditorRegistry] Error disposing adapter "${adapter.kind}":`, err);
      }
    }
    this.adapters.clear();
  }
}
