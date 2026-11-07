/**
 * Astro Blog「试验田 Lab」QuickJS 运行时统一适配导出
 *
 * 已全面升级为真正的 QuickJsWorkerRuntime (Dedicated Web Worker + WebAssembly QuickJS VM)，
 * 彻底废除任何 new Function 或 eval 伪实现。
 */
export { QuickJsWorkerRuntime as QuickJsRuntime } from '../runtimes/quickjs/QuickJsWorkerRuntime.ts';
export type { QuickJsWorkerConfig as QuickJsRuntimeConfig } from '../runtimes/quickjs/QuickJsWorkerRuntime.ts';
export * from '../runtimes/quickjs/quickjs-protocol.ts';
