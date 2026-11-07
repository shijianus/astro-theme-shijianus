/**
 * Astro Blog「试验田 Lab」编辑器注册表 (EditorRegistry)
 */
import type { LabEditorAdapter, LabEditorKind } from '../types.ts';
import { LiteEditorAdapter } from '../adapters/LiteEditorAdapter.ts';
import { LiveCodesEditorAdapter } from '../adapters/LiveCodesEditorAdapter.ts';

export class EditorRegistry {
  private adapters = new Map<LabEditorKind, LabEditorAdapter>();

  constructor(options?: { enableLiveCodes?: boolean; liveCodesAppUrl?: string }) {
    this.register('lite', new LiteEditorAdapter());
    this.register(
      'livecodes',
      new LiveCodesEditorAdapter({
        enableFeatureFlag: options?.enableLiveCodes,
        appUrl: options?.liveCodesAppUrl,
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
    return this.adapters.has(kind);
  }

  listKinds(): LabEditorKind[] {
    return Array.from(this.adapters.keys());
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
