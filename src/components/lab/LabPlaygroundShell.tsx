/**
 * Astro Blog「试验田 Lab」主工作区外壳组件 (LabPlaygroundShell)
 *
 * 承载 #lab-playground-workspace 根容器、安全状态属性绑定、横幅与双栏布局。
 */
import React from 'react';
import type { LabToolbarProps } from './LabToolbar';
import type { LabEditorPanelProps } from './LabEditorPanel';
import type { LabPreviewPanelProps } from './LabPreviewPanel';
import { LabToolbar } from './LabToolbar';
import { LabEditorPanel } from './LabEditorPanel';
import { LabPreviewPanel } from './LabPreviewPanel';
import { ExecutionVisualizer } from './ExecutionVisualizer';

export interface LabPlaygroundShellProps {
  mode: 'full-workshop' | 'detail-embedded';
  execStatus: 'idle' | 'running' | 'completed' | 'error' | 'terminated' | 'connecting' | 'ready' | 'aborted';
  effectiveIsolationMode: string;
  codeSourceKind: string;
  failClosedReason: string;
  toastMessage?: string;
  hasMounted: boolean;
  isolationMode: string;
  bridgeFallbackForced: boolean;
  externalResolutionEnabled: boolean;
  showTracePanel: boolean;
  isHant: boolean;
  layoutMode?: 'split-equal' | 'preview-focus' | 'code-focus';
  mobileActiveTab?: 'editor' | 'preview' | 'console';
  onSelectMobileTab?: (tab: 'editor' | 'preview' | 'console') => void;
  toolbarProps: LabToolbarProps;
  editorProps: LabEditorPanelProps;
  previewProps: LabPreviewPanelProps;
  onRetryCrossOriginSandbox: () => void;
}

export const LabPlaygroundShell: React.FC<LabPlaygroundShellProps> = ({
  mode,
  execStatus,
  effectiveIsolationMode,
  codeSourceKind,
  failClosedReason,
  toastMessage,
  hasMounted,
  isolationMode,
  bridgeFallbackForced,
  externalResolutionEnabled,
  showTracePanel,
  isHant,
  layoutMode = 'split-equal',
  mobileActiveTab = 'editor',
  onSelectMobileTab,
  toolbarProps,
  editorProps,
  previewProps,
  onRetryCrossOriginSandbox,
}) => {
  const tr = (zhCn: string, zhHant: string) => (isHant ? zhHant : zhCn);

  return (
    <div
      id="lab-playground-workspace"
      className="lab-playground-root"
      data-mode={mode}
      data-layout={layoutMode}
      data-exec-status={execStatus}
      data-isolation-mode={effectiveIsolationMode}
      data-source-kind={codeSourceKind}
      data-fail-closed={failClosedReason ? 'true' : 'false'}
      data-mobile-active-tab={mobileActiveTab}
    >
      {/* 顶部反馈 Toast */}
      {toastMessage && (
        <div
          className="lab-toast"
          role="status"
          aria-live="polite"
          data-testid="lab-toast"
        >
          <span>🛡️ {toastMessage}</span>
        </div>
      )}

      {/* 移动端 390x844 核心标签切换 */}
      <div className="lab-mobile-tabs" role="tablist" aria-label={tr('移动端工作区面板', '行動端工作區面板')}>
        <button
          type="button"
          role="tab"
          aria-selected={mobileActiveTab === 'editor'}
          onClick={() => onSelectMobileTab?.('editor')}
          className={`lab-mobile-tab-btn ${mobileActiveTab === 'editor' ? 'is-active' : ''}`}
          data-testid="mobile-tab-editor"
        >
          📝 {tr('代码编辑', '程式碼編輯')}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mobileActiveTab === 'preview'}
          onClick={() => onSelectMobileTab?.('preview')}
          className={`lab-mobile-tab-btn ${mobileActiveTab === 'preview' ? 'is-active' : ''}`}
          data-testid="mobile-tab-preview"
        >
          👁️ {tr('沙盒预览', '沙盒預覽')}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mobileActiveTab === 'console'}
          onClick={() => onSelectMobileTab?.('console')}
          className={`lab-mobile-tab-btn ${mobileActiveTab === 'console' ? 'is-active' : ''}`}
          data-testid="mobile-tab-console"
        >
          💻 {tr('控制台', '控制台')}
        </button>
      </div>

      {/* 1. 顶部工具栏 */}
      <LabToolbar {...toolbarProps} />

      {/* 失败关闭 (Fail-Closed) 强阻断安全横幅 */}
      {failClosedReason && (
        <div
          className="lab-fail-closed-banner"
          role="alert"
          data-testid="sandbox-fail-closed-banner"
        >
          <div className="lab-banner-content">
            <span>
              🛑{' '}
              <strong>
                {tr(
                  '独立跨站沙盒不可用 · 已强制失败关闭 (Fail-Closed)',
                  '獨立跨站沙盒不可用 · 已強制失敗關閉 (Fail-Closed)'
                )}
              </strong>
              ：{failClosedReason}
            </span>
            {externalResolutionEnabled && (
              <button
                type="button"
                onClick={onRetryCrossOriginSandbox}
                className="lab-pg-btn"
                data-testid="btn-retry-cross-origin"
              >
                🔄 {tr('重试跨站沙盒', '重試跨站沙盒')}
              </button>
            )}
          </div>
        </div>
      )}

      {/* 官方实验本地 Opaque srcdoc 降级明确提示横幅 */}
      {hasMounted && codeSourceKind === 'official' && isolationMode === 'opaque-srcdoc' && (
        <div
          className="lab-fallback-banner"
          role="status"
          aria-live="polite"
          data-testid="official-fallback-banner"
        >
          <div className="lab-banner-content">
            <span>
              ℹ️{' '}
              <strong>
                {tr(
                  '官方实验已回退至本地 Opaque srcdoc 隔离模式',
                  '官方實驗已回退至本機 Opaque srcdoc 隔離模式'
                )}
              </strong>
              ：
              {bridgeFallbackForced
                ? tr(
                    '独立跨站沙盒当前握手超时或不可达。因当前运行的是受审阅的官方预设实验，系统已在明确提示后安全回退至本地无 allow-same-origin 的 Opaque srcdoc 强隔离沙盒（外部/社区/分享代码在此状态下将被严格拦截）。',
                    '獨立跨站沙盒目前握手逾時或不可達。因目前執行的是受審閱的官方預設實驗，系統已在明確提示後安全回退至本機無 allow-same-origin 的 Opaque srcdoc 強隔離沙盒（外部/社群/分享程式碼在此狀態下將被嚴格攔截）。'
                  )
                : tr(
                    '当前环境未启用外部独立跨站沙盒域名，受审阅的官方预设实验运行于本地无 allow-same-origin 的 Opaque srcdoc 强隔离回退模式（外部/社区/分享代码在此环境下禁止运行并失败关闭）。',
                    '目前環境未啟用外部獨立跨站沙盒網域，受審閱的官方預設實驗執行於本機無 allow-same-origin 的 Opaque srcdoc 強隔離回退模式（外部/社群/分享程式碼在此環境下禁止執行並失敗關閉）。'
                  )}
            </span>
            {externalResolutionEnabled && (
              <button
                type="button"
                onClick={onRetryCrossOriginSandbox}
                className="lab-pg-btn"
                data-testid="btn-retry-cross-origin"
              >
                🔄 {tr('重试连接跨站沙盒', '重試連線跨站沙盒')}
              </button>
            )}
          </div>
        </div>
      )}

      {/* 非官方（外部导入 / 社区投稿 / #bundle= 分享）代码警告横幅 */}
      {codeSourceKind !== 'official' && !failClosedReason && (
        <div
          className="lab-untrusted-banner"
          role="status"
          aria-live="polite"
          data-testid="untrusted-code-banner"
        >
          <div className="lab-banner-content">
            <span>
              ⚠️{' '}
              <strong>
                {tr('当前载入的是外部非可信代码', '目前載入的是外部非可信程式碼')}
              </strong>
              （{codeSourceKind}）：
              {tr(
                '已关闭自动运行；代码仅在具备独立跨站沙盒域名时方可点击执行；禁止直接将未审阅代码用于生产。',
                '已關閉自動執行；程式碼僅在具備獨立跨站沙盒網域時方可點擊執行；禁止直接將未審閱程式碼用於生產。'
              )}
            </span>
          </div>
        </div>
      )}

      {/* 2. 双栏核心工作区：左侧代码编辑器 + 右侧沙盒预览 */}
      <div className="lab-pg-workspace">
        <LabEditorPanel {...editorProps} />
        <LabPreviewPanel {...previewProps} />
      </div>

      {/* 3. 可选展开的程序运行逻辑逐步追踪可视化面板 */}
      {showTracePanel && (
        <div className="lab-pg-trace-section">
          <ExecutionVisualizer
            initialAlgorithmId={
              toolbarProps.currentExp.visualizationConfig?.presetAlgorithmId || 'bubble-sort'
            }
          />
        </div>
      )}

      {/* 4. 移动端底部常驻操作坞 */}
      <div className="lab-mobile-action-dock" role="toolbar" aria-label={tr('移动端快速操作', '行動端快速操作')}>
        <button
          type="button"
          onClick={toolbarProps.onRun}
          className="lab-mobile-dock-btn is-run"
          data-testid="mobile-dock-run"
        >
          ▶ {tr('运行代码', '執行程式碼')}
        </button>
        <button
          type="button"
          onClick={toolbarProps.onStop}
          className="lab-mobile-dock-btn is-stop"
          data-testid="mobile-dock-stop"
        >
          ⏹ {tr('停止', '停止')}
        </button>
        <button
          type="button"
          onClick={toolbarProps.onReset}
          className="lab-mobile-dock-btn is-reset"
          data-testid="mobile-dock-reset"
        >
          ↺ {tr('恢复', '恢復')}
        </button>
      </div>
    </div>
  );
};
