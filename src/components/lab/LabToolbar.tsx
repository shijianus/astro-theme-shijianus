/**
 * Astro Blog「试验田 Lab」主工具栏组件
 */
import React from 'react';
import type { LabExperiment } from '../../lib/lab-schema';
import type { LabCodeSourceKind, SandboxIsolationMode, SandboxDegradationDecision } from '../../lib/lab-sandbox-protocol';
import { OFFICIAL_LAB_EXPERIMENTS } from '../../data/lab-experiments';

export interface LabToolbarProps {
  mode: 'full-workshop' | 'detail-embedded';
  currentExp: LabExperiment;
  selectedSlug: string;
  codeSourceKind: LabCodeSourceKind;
  isolationMode: SandboxIsolationMode;
  degradationPolicy: SandboxDegradationDecision;
  activeExternalOrigin: string | null;
  execStatus: 'idle' | 'running' | 'completed' | 'error' | 'terminated';
  isHant: boolean;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onSelectExperiment: (slug: string) => void;
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
  fileInputRef,
  onSelectExperiment,
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

  return (
    <div className="lab-pg-toolbar theme-card">
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
      </div>

      <div className="lab-pg-toolbar__actions">
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
