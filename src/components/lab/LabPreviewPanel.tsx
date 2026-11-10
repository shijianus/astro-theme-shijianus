/**
 * Astro Blog「试验田 Lab」沙盒实时运行预览面板组件 (LabPreviewPanel)
 *
 * 实施 Phase 2.8 交互与视口功能：
 * 1. 响应式设备宽度切换 (100% 自动 / 390px 移动 / 768px 平板)；
 * 2. 视口缩放控制 (100% / 75% / 50%)；
 * 3. 重新加载 (Reload) 与重连 (Reconnect)；
 * 4. 握手与连接生命周期状态明确标识；
 * 5. 心跳 (Heartbeat) 活跃状态实时监视；
 * 6. 运行耗时统计与全屏预览支持。
 */
import React, { useState } from 'react';
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
  runtimeKind?: 'browser-dom' | 'quickjs' | 'curated-trace';
  isolationMode: SandboxIsolationMode;
  activeExternalOrigin: string | null;
  codeSourceKind: LabCodeSourceKind;
  execStatus: 'idle' | 'running' | 'completed' | 'error' | 'terminated' | 'connecting' | 'ready' | 'aborted';
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
  onReload?: () => void;
  onReconnect?: () => void;
  onSetActiveBottomTab: (tab: 'console' | 'errors' | 'security') => void;
  onClearConsole: () => void;
}

export const LabPreviewPanel: React.FC<LabPreviewPanelProps> = ({
  currentExp,
  files,
  sessionId,
  sandboxSrcDoc,
  sandboxKey,
  runtimeKind = 'browser-dom',
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
  onReload,
  onReconnect,
  onSetActiveBottomTab,
  onClearConsole,
}) => {
  const tr = (zhCn: string, zhHant: string) => (isHant ? zhHant : zhCn);

  // 视口设备宽度与缩放控制
  const [deviceWidth, setDeviceWidth] = useState<'100%' | '390px' | '768px'>('100%');
  const [zoomLevel, setZoomLevel] = useState<number>(1);

  return (
    <div
      className={`lab-pg-preview-card theme-card ${
        isFullscreenPreview ? 'is-fullscreen' : ''
      }`}
      role="region"
      aria-label={tr('沙盒运行预览区域', '沙盒執行預覽區域')}
    >
      <div className="preview-header-bar">
        <div className="preview-status-group" style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <span className={`status-indicator is-${execStatus}`} />
          <strong className="preview-title" style={{ fontSize: '13px' }}>
            {tr('沙盒隔离预览', '沙盒隔離預覽')}
          </strong>

          {/* 心跳指示器 */}
          {execStatus === 'running' && (
            <span
              className="heartbeat-pulse"
              title={tr('沙盒通信心跳活跃', '沙盒通訊心跳活躍')}
              style={{
                display: 'inline-block',
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                backgroundColor: '#10b981',
                boxShadow: '0 0 6px #10b981',
              }}
            />
          )}

          {/* 状态徽标 */}
          <span
            className={`status-pill is-${execStatus}`}
            style={{
              fontSize: '11px',
              padding: '1px 6px',
              borderRadius: '3px',
              background: 'rgba(255,255,255,0.08)',
              color: '#94a3b8',
            }}
          >
            {execStatus === 'running'
              ? tr('运行中', '執行中')
              : execStatus === 'connecting'
                ? tr('连接中', '連線中')
                : execStatus === 'ready'
                  ? tr('就绪', '就緒')
                  : execStatus === 'completed'
                    ? tr('执行完成', '執行完成')
                    : execStatus === 'aborted'
                      ? tr('已中止', '已中止')
                      : execStatus === 'error'
                        ? tr('错误', '錯誤')
                        : execStatus === 'terminated'
                          ? tr('已销毁', '已銷毀')
                          : tr('空闲', '空閒')}
          </span>

          {lastDurationMs !== null && (
            <small className="exec-time ignore-opencc" data-no-translate="true" style={{ color: '#38bdf8', fontSize: '11px', fontFamily: 'monospace' }}>
              ⏱ {lastDurationMs}ms
            </small>
          )}
        </div>

        <div className="preview-header-actions" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {/* 设备模拟切换 */}
          <div className="device-switcher" style={{ display: 'inline-flex', background: 'rgba(255,255,255,0.06)', borderRadius: '4px', padding: '2px' }}>
            <button
              type="button"
              onClick={() => setDeviceWidth('100%')}
              className={`preview-mini-btn ${deviceWidth === '100%' ? 'is-active' : ''}`}
              title={tr('自适应桌面视口 (100%)', '自適應桌面視口 (100%)')}
              style={{ fontSize: '11px', padding: '2px 6px', border: 'none', background: deviceWidth === '100%' ? '#2563eb' : 'none', color: '#fff', borderRadius: '3px' }}
            >
              🖥️
            </button>
            <button
              type="button"
              onClick={() => setDeviceWidth('768px')}
              className={`preview-mini-btn ${deviceWidth === '768px' ? 'is-active' : ''}`}
              title={tr('平板视口 (768px)', '平板視口 (768px)')}
              style={{ fontSize: '11px', padding: '2px 6px', border: 'none', background: deviceWidth === '768px' ? '#2563eb' : 'none', color: '#fff', borderRadius: '3px' }}
            >
              📱 768
            </button>
            <button
              type="button"
              onClick={() => setDeviceWidth('390px')}
              className={`preview-mini-btn ${deviceWidth === '390px' ? 'is-active' : ''}`}
              title={tr('移动视口 (390×844)', '行動視口 (390×844)')}
              style={{ fontSize: '11px', padding: '2px 6px', border: 'none', background: deviceWidth === '390px' ? '#2563eb' : 'none', color: '#fff', borderRadius: '3px' }}
            >
              📱 390
            </button>
          </div>

          {/* 缩放控制 */}
          <select
            value={zoomLevel}
            onChange={(e) => setZoomLevel(Number(e.target.value))}
            style={{ fontSize: '11px', background: '#090d16', border: '1px solid rgba(255,255,255,0.15)', color: '#94a3b8', borderRadius: '4px', padding: '2px 4px' }}
            aria-label={tr('视口缩放', '視口縮放')}
          >
            <option value={1}>100%</option>
            <option value={0.75}>75%</option>
            <option value={0.5}>50%</option>
          </select>

          {/* 重载与重连按钮 */}
          {onReload && (
            <button
              type="button"
              onClick={onReload}
              className="preview-mini-btn"
              title={tr('重新加载预览', '重新載入預覽')}
              data-testid="btn-reload-preview"
            >
              🔄
            </button>
          )}

          {onReconnect && isolationMode === 'cross-origin' && (
            <button
              type="button"
              onClick={onReconnect}
              className="preview-mini-btn"
              title={tr('重连跨站沙盒', '重連跨站沙盒')}
              data-testid="btn-reconnect-preview"
            >
              ⚡
            </button>
          )}

          <button
            type="button"
            onClick={onToggleTracePanel}
            className={`preview-mini-btn ${showTracePanel ? 'is-active' : ''}`}
            data-testid="btn-toggle-visualizer"
          >
            🧭{' '}
            {showTracePanel
              ? tr('收起追踪', '收起追蹤')
              : tr('执行追踪', '執行追蹤')}
          </button>
          <button
            type="button"
            onClick={onToggleFullscreen}
            className="preview-mini-btn"
            data-testid="btn-toggle-fullscreen"
          >
            {isFullscreenPreview
              ? tr('🗗 退出全屏 (Esc)', '🗗 退出全螢幕 (Esc)')
              : tr('⛶ 全屏', '⛶ 全螢幕')}
          </button>
        </div>
      </div>

      {/* 真正执行不可信代码的隔离沙盒 iframe */}
      <div
        className="sandbox-viewport-container"
        style={{
          display: 'flex',
          justifyContent: 'center',
          overflow: 'auto',
          backgroundColor: '#020617',
        }}
      >
        <div
          style={{
            width: deviceWidth,
            maxWidth: '100%',
            height: '100%',
            transform: zoomLevel === 1 ? 'none' : `scale(${zoomLevel})`,
            transformOrigin: 'top center',
            transition: 'width 0.2s ease, transform 0.2s ease',
            border: deviceWidth !== '100%' ? '1px dashed rgba(56, 189, 248, 0.4)' : 'none',
          }}
        >
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
          ) : !failClosedReason &&
            execStatus !== 'terminated' &&
            execStatus !== 'idle' &&
            (runtimeKind === 'quickjs' || runtimeKind === 'curated-trace') ? (
            <div
              className="sandbox-headless-monitor"
              data-testid="lab-headless-runtime-monitor"
              style={{
                padding: '18px',
                minHeight: '280px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                color: '#e2e8f0',
                background: 'linear-gradient(180deg, rgba(15, 23, 42, 0.96), rgba(2, 6, 23, 0.98))',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '8px',
                  paddingBottom: '10px',
                  borderBottom: '1px solid rgba(148, 163, 184, 0.16)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '18px' }}>
                    {runtimeKind === 'quickjs' ? '⚡' : '🧭'}
                  </span>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#f8fafc' }}>
                      {runtimeKind === 'quickjs'
                        ? tr('QuickJS WebAssembly 隔离计算沙盒 (Dedicated Worker)', 'QuickJS WebAssembly 隔離計算沙盒 (Dedicated Worker)')
                        : tr('Curated Trace 确定性追踪引擎 (lab-trace-v1)', 'Curated Trace 確定性追蹤引擎 (lab-trace-v1)')}
                    </div>
                    <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                      {runtimeKind === 'quickjs'
                        ? tr('纯算法计算模式 · 内存上限 16MB · 调用栈上限 512KB · 零 DOM / 零网络暴露', '純演算法計算模式 · 記憶體上限 16MB · 呼叫堆疊上限 512KB · 零 DOM / 零網路暴露')
                        : tr('零 eval 静态状态机 · 最大步数 600 · O(1) 时间轴任意步进回放', '零 eval 靜態狀態機 · 最大步數 600 · O(1) 時間軸任意步進回放')}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onRunCode}
                  className="lab-pg-btn is-run"
                  style={{ padding: '5px 12px', fontSize: '12px', borderRadius: '6px' }}
                >
                  ▶ {tr('重新运行计算', '重新執行計算')}
                </button>
              </div>

              <div
                style={{
                  flex: 1,
                  background: '#090d16',
                  border: '1px solid rgba(56, 189, 248, 0.2)',
                  borderRadius: '6px',
                  padding: '12px',
                  fontFamily: 'monospace',
                  fontSize: '12px',
                  overflowY: 'auto',
                  maxHeight: '210px',
                }}
              >
                {runtimeErrors.length > 0 ? (
                  runtimeErrors.map((err, idx) => (
                    <div key={idx} style={{ color: '#f87171', marginBottom: '6px' }}>
                      ✖ {err.message}
                    </div>
                  ))
                ) : consoleEntries.length > 0 ? (
                  consoleEntries.map((entry) => (
                    <div key={entry.id} style={{ color: '#38bdf8', marginBottom: '6px', lineHeight: 1.5 }}>
                      <span style={{ color: '#64748b', marginRight: '8px' }}>[{entry.level.toUpperCase()}]</span>
                      {entry.args.join(' ')}
                    </div>
                  ))
                ) : (
                  <div style={{ color: '#64748b' }}>
                    {execStatus === 'running'
                      ? tr('⏳ 正在隔离运行时中执行计算...', '⏳ 正在隔離執行時中執行計算...')
                      : tr('✓ 计算已完成，详见下方 Console 输出。', '✓ 計算已完成，詳見下方 Console 輸出。')}
                  </div>
                )}
              </div>
            </div>
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
