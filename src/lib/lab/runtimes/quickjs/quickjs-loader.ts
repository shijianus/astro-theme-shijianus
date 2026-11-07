/**
 * Astro Blog「试验田 Lab」QuickJS WebAssembly 模块安全载入器
 */
import { getQuickJS, type QuickJSWASMModule } from 'quickjs-emscripten';

let quickJsPromise: Promise<QuickJSWASMModule> | null = null;

export async function loadQuickJS(): Promise<QuickJSWASMModule> {
  if (!quickJsPromise) {
    quickJsPromise = getQuickJS();
  }
  return quickJsPromise;
}
