/**
 * Astro Blog「试验田 Lab」Workspace 事件总线
 */
import type { WorkspaceSnapshot } from './WorkspaceSnapshot.ts';
import type { SandboxConsoleEntry, SandboxRuntimeError } from '../../lab-sandbox-protocol.ts';
import type { LabSessionLifecycle } from '../types.ts';

export interface WorkspaceEventMap {
  'snapshot': WorkspaceSnapshot;
  'console': SandboxConsoleEntry;
  'error': SandboxRuntimeError;
  'status': LabSessionLifecycle;
  'toast': string;
}

export type WorkspaceEventListener<K extends keyof WorkspaceEventMap> = (
  payload: WorkspaceEventMap[K]
) => void;

export class WorkspaceEventBus {
  private listeners = new Map<keyof WorkspaceEventMap, Set<Function>>();

  on<K extends keyof WorkspaceEventMap>(
    event: K,
    listener: WorkspaceEventListener<K>
  ): () => void {
    let set = this.listeners.get(event);
    if (!set) {
      set = new Set();
      this.listeners.set(event, set);
    }
    set.add(listener);
    return () => this.off(event, listener);
  }

  off<K extends keyof WorkspaceEventMap>(
    event: K,
    listener: WorkspaceEventListener<K>
  ): void {
    const set = this.listeners.get(event);
    if (set) {
      set.delete(listener);
      if (set.size === 0) {
        this.listeners.delete(event);
      }
    }
  }

  emit<K extends keyof WorkspaceEventMap>(event: K, payload: WorkspaceEventMap[K]): void {
    const set = this.listeners.get(event);
    if (set) {
      for (const listener of Array.from(set)) {
        try {
          (listener as WorkspaceEventListener<K>)(payload);
        } catch (err) {
          console.error(`[WorkspaceEventBus] Listener error on event "${String(event)}":`, err);
        }
      }
    }
  }

  clear(): void {
    this.listeners.clear();
  }
}
