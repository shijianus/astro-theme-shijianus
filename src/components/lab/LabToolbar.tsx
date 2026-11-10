/**
 * Astro Blog「试验田 Lab」主工具栏组件
 */
import React from 'react';
import type { LabExperiment } from '../../lib/lab-schema';
import type { LabCodeSourceKind, SandboxIsolationMode, SandboxDegradationDecision } from '../../lib/lab-sandbox-protocol';
import { OFFICIAL_LAB_EXPERIMENTS } from '../../data/lab-experiments';
import { LAB_SECURITY_LIMITS } from '../../lib/lab-schema';

export interface LabToolbarProps {
  mode: 'full-workshop' | 'detail-embedded';
  currentExp: LabExperiment;
  selectedSlug: string;
  codeSourceKind: LabCodeSourceKind;
  isolationMode: SandboxIsolationMode;
  degradationPolicy: SandboxDegradationDecision;
  activeExternalOrigin: string | null;
  execStatus: 'idle' | 'running' | 'completed' | 'error' | 'terminated' | 'connecting' | 'ready' | 'aborted';
  isHant: boolean;
  dirty?: boolean;
  layoutMode?: 'split-equal' | 'preview-focus' | 'code-focus';
  onSelectLayoutMode?: (mode: 'split-equal' | 'preview-focus' | 'code-focus') => void;
  runtimeKind?: string;
  supportedRuntimes?: string[];
  editorKind?: string;
  supportedEditors?: string[];
  totalBytes?: number;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onSelectExperiment: (slug: string) => void;
  onSelectRuntime?: (kind: string) => void;
  onSelectEditor?: (kind: string) => void;
  onRun: () => void;
  onStop: () => void;
  onReset: () => void;
  onCopyCode: () => void;
  onSaveDraft: () => void;
  onLoadDraft: () => void;
  onExportJson: () => void;
  onImportJsonFile: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onShareLink: () => void;
}

export const LabToolbar: React.FC<LabToolbarProps> = ({
  mode,
  currentExp,
  selectedSlug,
  codeSourceKind,
  isolationMode,
  degradationPolicy,
  activeExternalOrigin,
  execStatus,
  isHant,
  dirty = false,
  layoutMode = 'split-equal',
  onSelectLayoutMode,
  runtimeKind = 'browser-dom',
  supportedRuntimes = ['browser-dom', 'quickjs'],
  editorKind = 'lite',
  supportedEditors = ['lite'],
  totalBytes = 0,
  fileInputRef,
  onSelectExperiment,
  onSelectRuntime,
  onSelectEditor,
  onRun,
  onStop,
  onReset,
  onCopyCode,
  onSaveDraft,
  onLoadDraft,
  onExportJson,
  onImportJsonFile,
  onShareLink,
}) => {
  const tr = (zhCn: string, zhHant: string) => (isHant ? zhHant : zhCn);

  // 来源信任徽章文案与样式映射
  const trustBadgeConfig = {
    official: { label: tr('官方受信任', '官方受信任'), cls: 'is-official', icon: '🛡️' },
    imported: { label: tr('外部导入', '外部匯入'), cls: 'is-untrusted', icon: '⚠️' },
    community: { label: tr('社区代码', '社群程式碼'), cls: 'is-community', icon: '👥' },
    bundle: { label: tr('分享代码', '分享程式碼'), cls: 'is-untrusted', icon: '🔗' },
  }[codeSourceKind] || { label: codeSourceKind, cls: '', icon: '❓' };

  return (
    <div className="lab-pg-toolbar theme-card" role="toolbar" aria-label={tr('试验田工作台工具栏', '實驗田工作台工具列')}>
      <div className="lab-pg-toolbar__left">
        {mode === 'full-workshop' ? (
          <label className="lab-pg-selector-label">
            <span className="selector-tag">{tr('预设实验', '預設實驗')}</span>
            <select
              value={selectedSlug}
              onChange={(e) => onSelectExperiment(e.target.value)}
              className="lab-pg-select"
              aria-label={tr('选择预设实验', '選擇預設實驗')}
              data-testid="playground-preset-select"
            >
              {OFFICIAL_LAB_EXPERIMENTS.map((exp) => (
                <option key={exp.slug} value={exp.slug}>
                  {exp.icon} {exp.title}
                </option>
              ))}
            </select>
          </label>
        ) : (
          <div className="lab-pg-exp-badge">
            <span className="exp-icon">{currentExp.icon}</span>
            <div>
              <strong>{currentExp.title}</strong>
              <small>
                v{currentExp.version} · {tr('独立沙盒实时工坊', '獨立沙盒即時工坊')}
              </small>
            </div>
          </div>
        )}

        {/* 来源信任徽章 */}
        <span
          className={`lab-trust-badge ${trustBadgeConfig.cls}`}
          data-testid="source-trust-badge"
          title={tr(`代码来源：${codeSourceKind}`, `程式碼來源：${codeSourceKind}`)}
        >
          {trustBadgeConfig.icon} {trustBadgeConfig.label}
        </span>

        {/* 运行时选择器 */}
        {onSelectRuntime && supportedRuntimes.length > 1 && (
          <label className="lab-pg-selector-label" style={{ margin: 0 }}>
            <span className="selector-tag" style={{ fontSize: '11px' }}>Runtime</span>
            <select
              value={runtimeKind}
              onChange={(e) => onSelectRuntime(e.target.value)}
              className="lab-pg-select"
              style={{ fontSize: '11px', padding: '3px 8px' }}
              aria-label={tr('选择执行运行时', '選擇執行執行階段')}
              data-testid="runtime-selector"
            >
              {supportedRuntimes.map((rk) => (
                <option key={rk} value={rk}>
                  {rk === 'browser-dom'
                    ? '🌐 Browser DOM'
                    : rk === 'quickjs'
                      ? '⚡ QuickJS WASM'
                      : '🧭 Curated Trace'}
                </option>
              ))}
            </select>
          </label>
        )}

        {/* 编辑器选择器 (若启用了 LiveCodes) */}
        {onSelectEditor && supportedEditors.length > 1 && (
          <label className="lab-pg-selector-label" style={{ margin: 0 }}>
            <span className="selector-tag" style={{ fontSize: '11px' }}>Editor</span>
            <select
              value={editorKind}
              onChange={(e) => onSelectEditor(e.target.value)}
              className="lab-pg-select"
              style={{ fontSize: '11px', padding: '3px 8px' }}
              aria-label={tr('选择代码编辑器', '選擇程式碼編輯器')}
              data-testid="editor-selector"
            >
              <option value="lite">Lite Editor</option>
              <option value="livecodes">LiveCodes (PoC)</option>
            </select>
          </label>
        )}

        {/* 沙盒隔离模式徽章 */}
        <div
          className="lab-security-pill"
          data-testid="lab-security-pill"
          title={
            isolationMode === 'cross-origin'
              ? `已连接独立跨站沙盒桥接器 (${activeExternalOrigin})，内层执行帧仍保持无 allow-same-origin 的 Opaque Origin 双重隔离`
              : degradationPolicy.effectiveMode === 'blocked-fail-closed'
                ? '独立跨站沙盒当前不可用，外部导入/社区/分享代码已按安全门禁强制失败关闭 (Fail-Closed)'
                : "当前官方预设运行在无 allow-same-origin 的 Opaque Origin (null) 回退沙盒中，且 CSP connect-src 'none' 阻断外发网络"
          }
        >
          <span className="sec-dot" />
          <span>
            {isolationMode === 'cross-origin'
              ? tr('Cross-Site + Opaque 双层沙盒', 'Cross-Site + Opaque 雙層沙盒')
              : degradationPolicy.effectiveMode === 'blocked-fail-closed'
                ? tr('Fail-Closed · 跨站沙盒未就绪', 'Fail-Closed · 跨站沙盒未就緒')
                : tr('Opaque Fallback · 官方本地隔离', 'Opaque Fallback · 官方本機隔離')}
          </span>
        </div>

        {/* 状态与配额概况 */}
        <span
          className={`lab-status-badge is-${execStatus}`}
          data-testid="execution-status-badge"
          style={{
            fontSize: '11px',
            padding: '2px 8px',
            borderRadius: '4px',
            background: 'rgba(255,255,255,0.06)',
            color: '#94a3b8',
          }}
        >
          {dirty ? '✏️ *' : '✓'}{' '}
          {execStatus === 'running'
            ? tr('运行中', '執行中')
            : execStatus === 'connecting'
              ? tr('连接中', '連線中')
              : execStatus === 'ready'
                ? tr('就绪', '就緒')
                : execStatus === 'completed'
                  ? tr('完成', '完成')
                  : execStatus === 'aborted'
                    ? tr('已中止', '已中止')
                    : execStatus === 'error'
                      ? tr('出错', '出錯')
                      : tr('空闲', '空閒')}
        </span>

        {/* 体积配额 */}
        <span
          className="ignore-opencc"
          data-no-translate="true"
          style={{ fontSize: '11px', color: '#64748b', fontFamily: 'monospace' }}
          title={tr('源码与总配额', '原始碼與總配額')}
        >
          {(totalBytes / 1024).toFixed(1)}KB / {LAB_SECURITY_LIMITS.MAX_TOTAL_SOURCE_BYTES / 1024}KB
        </span>
      </div>

      <div className="lab-pg-toolbar__actions">
        {/* 工作区布局切换器 */}
        {onSelectLayoutMode && (
          <div className="lab-layout-switcher" role="group" aria-label={tr('工作区布局', '工作區版面配置')}>
            <button
              type="button"
              className={`lab-layout-btn ${layoutMode === 'split-equal' ? 'is-active' : ''}`}
              onClick={() => onSelectLayoutMode('split-equal')}
              title={tr('50/50 均衡对等分屏', '50/50 均衡對等分屏')}
              data-testid="layout-btn-equal"
            >
              <span>◫</span>
              <span>{tr('均衡', '均衡')}</span>
            </button>
            <button
              type="button"
              className={`lab-layout-btn ${layoutMode === 'preview-focus' ? 'is-active' : ''}`}
              onClick={() => onSelectLayoutMode('preview-focus')}
              title={tr('侧重预览 (36% 代码 : 64% 大视口预览)', '側重預覽 (36% 程式碼 : 64% 大視口預覽)')}
              data-testid="layout-btn-preview"
            >
              <span>◨</span>
              <span>{tr('大预览', '大預覽')}</span>
            </button>
            <button
              type="button"
              className={`lab-layout-btn ${layoutMode === 'code-focus' ? 'is-active' : ''}`}
              onClick={() => onSelectLayoutMode('code-focus')}
              title={tr('侧重编码 (64% 沉浸代码 : 36% 紧凑预览)', '側重編碼 (64% 沉浸程式碼 : 36% 緊湊預覽)')}
              data-testid="layout-btn-code"
            >
              <span>◧</span>
              <span>{tr('大代码', '大程式碼')}</span>
            </button>
          </div>
        )}

        {/* 一级主要动作 */}
        <button
          type="button"
          onClick={onRun}
          className="lab-pg-btn is-run"
          data-testid="btn-run-code"
          title={tr('在隔离沙盒中运行代码 (Ctrl/Cmd + Enter)', '在隔離沙盒中執行程式碼 (Ctrl/Cmd + Enter)')}
        >
          ▶ {tr('运行代码', '執行程式碼')}
        </button>
        <button
          type="button"
          onClick={onStop}
          className="lab-pg-btn is-danger"
          data-testid="btn-terminate-sandbox"
          title={tr('立即销毁沙盒 iframe 并释放执行上下文', '立即銷毀沙盒 iframe 並釋放執行環境')}
        >
          ⏹ {tr('停止', '停止')}
        </button>
        <button
          type="button"
          onClick={onReset}
          className="lab-pg-btn"
          data-testid="btn-reset-code"
        >
          ↺ {tr('恢复初始', '恢復初始')}
        </button>

        {/* 二级动作组 */}
        <button
          type="button"
          onClick={onCopyCode}
          className="lab-pg-btn"
          data-testid="btn-copy-code"
        >
          📋 {tr('复制源码', '複製原始碼')}
        </button>
        <button
          type="button"
          onClick={onSaveDraft}
          className="lab-pg-btn"
          data-testid="btn-save-draft"
        >
          💾 {tr('存草稿', '存草稿')}
        </button>
        <button
          type="button"
          onClick={onLoadDraft}
          className="lab-pg-btn"
          data-testid="btn-load-draft"
        >
          📂 {tr('读草稿', '讀草稿')}
        </button>
        <button
          type="button"
          onClick={onExportJson}
          className="lab-pg-btn"
          data-testid="btn-export-json"
        >
          📤 {tr('导出', '匯出')}
        </button>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="lab-pg-btn"
          data-testid="btn-import-json"
        >
          📥 {tr('导入', '匯入')}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json,application/json"
          onChange={onImportJsonFile}
          tabIndex={-1}
          aria-hidden="true"
          style={{
            position: 'absolute',
            width: '1px',
            height: '1px',
            padding: 0,
            margin: '-1px',
            overflow: 'hidden',
            clip: 'rect(0, 0, 0, 0)',
            border: 0,
            opacity: 0,
            pointerEvents: 'none',
          }}
          data-testid="input-import-file"
        />
        <button
          type="button"
          onClick={onShareLink}
          className="lab-pg-btn"
          data-testid="btn-share-link"
        >
          🔗 {tr('分享', '分享')}
        </button>
        <a
          href={`/lab/preview/${currentExp.slug}/`}
          className="lab-pg-btn"
          data-testid="link-standalone-preview"
        >
          ↗ {tr('独立预览页', '獨立預覽頁')}
        </a>
      </div>
    </div>
  );
};
