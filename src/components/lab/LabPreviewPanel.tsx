/**
 * Astro Blog「试验田 Lab」沙盒实时运行预览面板组件
 */
import React from 'react';
import type { LabExperiment, LabFile } from '../../lib/lab-schema';
import type {
  SandboxIsolationMode,
  SandboxConsoleEntry,
  SandboxRuntimeError,
  LabCodeSourceKind,
} from '../../lib/lab-sandbox-protocol';
import { LabConsolePanel } from './LabConsolePanel';

export interface LabPreviewPanelProps {
  currentExp: LabExperiment;
  files: LabFile[];
  sessionId: string;
  sandboxSrcDoc: string;
  sandboxKey: number;
  isolationMode: SandboxIsolationMode;
  activeExternalOrigin: string | null;
  codeSourceKind: LabCodeSourceKind;
  execStatus: 'idle' | 'running' | 'completed' | 'error' | 'terminated';
  lastDurationMs: number | null;
  failClosedReason: string;
  isFullscreenPreview: boolean;
  showTracePanel: boolean;
  activeBottomTab: 'console' | 'errors' | 'security';
  consoleEntries: SandboxConsoleEntry[];
  runtimeErrors: SandboxRuntimeError[];
  iframeRef: React.RefObject<HTMLIFrameElement | null>;
  isHant: boolean;
  onToggleFullscreen: () => void;
  onToggleTracePanel: () => void;
  onBridgeIframeLoad: () => void;
  onRunCode: () => void;
  onSetActiveBottomTab: (tab: 'console' | 'errors' | 'security') => void;
  onClearConsole: () => void;
}

export const LabPreviewPanel: React.FC<LabPreviewPanelProps> = ({
  currentExp,
  files,
  sessionId,
  sandboxSrcDoc,
  sandboxKey,
  isolationMode,
  activeExternalOrigin,
  codeSourceKind,
  execStatus,
  lastDurationMs,
  failClosedReason,
  isFullscreenPreview,
  showTracePanel,
  activeBottomTab,
  consoleEntries,
  runtimeErrors,
  iframeRef,
  isHant,
  onToggleFullscreen,
  onToggleTracePanel,
  onBridgeIframeLoad,
  onRunCode,
  onSetActiveBottomTab,
  onClearConsole,
}) => {
  const tr = (zhCn: string, zhHant: string) => (isHant ? zhHant : zhCn);

  return (
    <div
      className={`lab-pg-preview-card theme-card ${
        isFullscreenPreview ? 'is-fullscreen' : ''
      }`}
    >
      <div className="preview-header-bar">
        <div className="preview-status-group">
          <span className={`status-indicator is-${execStatus}`} />
          <strong className="preview-title">
            {tr(
              '沙盒隔离预览 (Isolated Sandbox Viewport)',
              '沙盒隔離預覽 (Isolated Sandbox Viewport)'
            )}
          </strong>
          {lastDurationMs !== null && (
            <small className="exec-time ignore-opencc" data-no-translate="true">
              {lastDurationMs}ms
            </small>
          )}
        </div>

        <div className="preview-header-actions">
          <button
            type="button"
            onClick={onToggleTracePanel}
            className={`preview-mini-btn ${showTracePanel ? 'is-active' : ''}`}
            data-testid="btn-toggle-visualizer"
          >
            🧭{' '}
            {showTracePanel
              ? tr('收起过程追踪', '收起過程追蹤')
              : tr('开启执行追踪', '開啟執行追蹤')}
          </button>
          <button
            type="button"
            onClick={onToggleFullscreen}
            className="preview-mini-btn"
            data-testid="btn-toggle-fullscreen"
          >
            {isFullscreenPreview
              ? tr('🗗 退出全屏 (Esc)', '🗗 退出全螢幕 (Esc)')
              : tr('⛶ 全屏预览', '⛶ 全螢幕預覽')}
          </button>
        </div>
      </div>

      {/* 真正执行不可信代码的隔离沙盒 iframe */}
      <div className="sandbox-viewport-container">
        {sandboxSrcDoc ? (
          isolationMode === 'cross-origin' && activeExternalOrigin ? (
            <iframe
              key={sandboxKey}
              ref={iframeRef}
              title={`Lab Cross-Site Isolated Sandbox - ${currentExp.title}`}
              sandbox="allow-scripts allow-same-origin"
              referrerPolicy="no-referrer"
              src={`${activeExternalOrigin}/`}
              onLoad={onBridgeIframeLoad}
              className="sandbox-iframe"
              data-testid="lab-sandbox-iframe"
              data-isolation-mode="cross-origin"
              data-session-id={sessionId}
            />
          ) : codeSourceKind === 'official' ? (
            <iframe
              key={sandboxKey}
              ref={iframeRef}
              title={`Lab Isolated Sandbox - ${currentExp.title}`}
              sandbox="allow-scripts"
              referrerPolicy="no-referrer"
              srcDoc={sandboxSrcDoc}
              className="sandbox-iframe"
              data-testid="lab-sandbox-iframe"
              data-isolation-mode="opaque-srcdoc"
              data-session-id={sessionId}
            />
          ) : (
            <div
              className="sandbox-empty-placeholder is-fail-closed"
              data-testid="sandbox-stopped-placeholder"
            >
              <p>
                {tr(
                  '🛑 独立跨站沙盒未就绪，安全策略已阻止非官方代码在本地 srcdoc 中运行。',
                  '🛑 獨立跨站沙盒未就緒，安全策略已阻止非官方程式碼在本機 srcdoc 中執行。'
                )}
              </p>
            </div>
          )
        ) : (
          <div
            className={`sandbox-empty-placeholder ${failClosedReason ? 'is-fail-closed' : ''}`}
            data-testid="sandbox-stopped-placeholder"
          >
            <p>
              {failClosedReason
                ? tr(
                    '🛑 已触发安全失败关闭 (Fail-Closed)：外部导入、社区或分享链接代码仅允许在独立跨站沙盒可用时运行。',
                    '🛑 已觸發安全失敗關閉 (Fail-Closed)：外部匯入、社群或分享連結程式碼僅允許在獨立跨站沙盒可用時執行。'
                  )
                : execStatus === 'terminated'
                  ? tr('⏹ 沙盒执行上下文已终止并销毁。', '⏹ 沙盒執行環境已終止並銷毀。')
                  : tr(
                      '🔒 沙盒尚未启动，请点击上方「▶ 运行代码」在隔离环境中执行。',
                      '🔒 沙盒尚未啟動，請點擊上方「▶ 執行程式碼」在隔離環境中執行。'
                    )}
            </p>
            <button
              type="button"
              onClick={onRunCode}
              className="lab-pg-btn is-run"
            >
              ▶ {tr('立即在隔离沙盒中运行', '立即在隔離沙盒中執行')}
            </button>
          </div>
        )}
      </div>

      {/* 下方 Console / 运行错误 / 安全边界审计抽屉 */}
      <LabConsolePanel
        activeBottomTab={activeBottomTab}
        setActiveBottomTab={onSetActiveBottomTab}
        consoleEntries={consoleEntries}
        runtimeErrors={runtimeErrors}
        onClearConsole={onClearConsole}
        isolationMode={isolationMode}
        activeExternalOrigin={activeExternalOrigin}
        sessionId={sessionId}
        isHant={isHant}
      />
    </div>
  );
};
