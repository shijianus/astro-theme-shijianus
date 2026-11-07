/**
 * Astro Blog「试验田 Lab」沙盒实时运行预览面板组件
 */
import React from 'react';
import type { SandboxIsolationMode } from '../../lib/lab-sandbox-protocol';

export interface LabPreviewPanelProps {
  iframeRef: React.RefObject<HTMLIFrameElement | null>;
  sandboxSrcDoc: string;
  sandboxKey: number;
  isolationMode: SandboxIsolationMode;
  isCrossOriginMode: boolean;
  activeExternalOrigin: string | null;
  bridgeReadyAck: boolean;
  failClosedReason: string;
  execStatus: 'idle' | 'running' | 'completed' | 'error' | 'terminated';
  onRetryCrossOrigin: () => void;
  onRestart: () => void;
  isHant: boolean;
}

export const LabPreviewPanel: React.FC<LabPreviewPanelProps> = ({
  iframeRef,
  sandboxSrcDoc,
  sandboxKey,
  isolationMode,
  isCrossOriginMode,
  activeExternalOrigin,
  bridgeReadyAck,
  failClosedReason,
  execStatus,
  onRetryCrossOrigin,
  onRestart,
  isHant,
}) => {
  const tr = (zhCn: string, zhHant: string) => (isHant ? zhHant : zhCn);

  return (
    <div className="lab-preview-panel relative flex flex-col h-full bg-slate-100 dark:bg-slate-900 overflow-hidden">
      {/* 顶部状态条 */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-slate-200/80 dark:bg-slate-800/80 text-2xs font-mono border-b border-slate-300 dark:border-slate-700">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-700 dark:text-slate-300">
            {tr('沙盒运行环境', '沙盒執行環境')}:
          </span>
          <span
            className={`px-1.5 py-0.5 rounded ${
              isCrossOriginMode
                ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 border border-purple-300 dark:border-purple-800'
                : 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border border-blue-300 dark:border-blue-800'
            }`}
          >
            {isCrossOriginMode ? 'Cross-Origin Sandbox (Pages)' : 'Local Opaque Srcdoc (Opaque "null")'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onRestart}
            title={tr('重新启动当前沙盒实例', '重新啟動目前沙盒實例')}
            className="p-1 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition rounded"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
            </svg>
          </button>
        </div>
      </div>

      {/* 失败关闭 (Fail-Closed) 阻断提示横幅 */}
      {failClosedReason && (
        <div className="fail-closed-banner p-3 bg-rose-50 dark:bg-rose-950/60 border-b border-rose-200 dark:border-rose-900 text-xs text-rose-800 dark:text-rose-200 flex items-start justify-between gap-3">
          <div>
            <p className="font-semibold">
              {tr('安全阻断：未授权代码失败关闭 (Fail-Closed)', '安全阻斷：未授權程式碼失敗關閉 (Fail-Closed)')}
            </p>
            <p className="mt-1 text-2xs text-rose-700 dark:text-rose-300">{failClosedReason}</p>
          </div>
          <button
            type="button"
            onClick={onRetryCrossOrigin}
            className="px-2.5 py-1 text-2xs font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded transition shrink-0"
          >
            {tr('重试跨站连接', '重試跨站連線')}
          </button>
        </div>
      )}

      {/* Iframe 挂载区 */}
      <div className="relative flex-1 w-full h-full min-h-0 bg-transparent overflow-hidden">
        {isCrossOriginMode && activeExternalOrigin ? (
          <iframe
            key={`cross-${sandboxKey}`}
            ref={iframeRef}
            src={activeExternalOrigin}
            sandbox="allow-scripts"
            referrerPolicy="no-referrer"
            title="Lab Cross-Origin Isolated Sandbox"
            className="w-full h-full border-0 bg-transparent"
          />
        ) : (
          <iframe
            key={`opaque-${sandboxKey}`}
            ref={iframeRef}
            srcDoc={sandboxSrcDoc}
            sandbox="allow-scripts"
            referrerPolicy="no-referrer"
            title="Lab Local Opaque Srcdoc Sandbox"
            className="w-full h-full border-0 bg-transparent"
          />
        )}

        {/* 运行中微型加载态指示 */}
        {execStatus === 'running' && !bridgeReadyAck && isCrossOriginMode && (
          <div className="absolute inset-0 bg-slate-900/30 backdrop-blur-xs flex items-center justify-center text-xs font-mono text-white">
            <span className="inline-block w-4 h-4 mr-2 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            {tr('正在与独立跨站沙盒建立安全信道...', '正在與獨立跨站沙盒建立安全通道...')}
          </div>
        )}
      </div>
    </div>
  );
};
