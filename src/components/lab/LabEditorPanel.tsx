/**
 * Astro Blog「试验田 Lab」代码编辑器面板组件
 */
import React from 'react';
import type { LabFile } from '../../lib/lab-schema';
import { LAB_SECURITY_LIMITS } from '../../lib/lab-schema';

export interface LabEditorPanelProps {
  files: LabFile[];
  activeFileIdx: number;
  livecodesAppUrl?: string;
  isHant: boolean;
  onSelectFile: (index: number) => void;
  onCodeChange: (content: string) => void;
  onRunCode: () => void;
}

export const LabEditorPanel: React.FC<LabEditorPanelProps> = ({
  files,
  activeFileIdx,
  livecodesAppUrl,
  isHant,
  onSelectFile,
  onCodeChange,
  onRunCode,
}) => {
  const tr = (zhCn: string, zhHant: string) => (isHant ? zhHant : zhCn);
  const activeFile = files[activeFileIdx] || files[0];
  const totalBytes = files.reduce((acc, f) => acc + (f.content ? f.content.length : 0), 0);

  return (
    <div className="lab-pg-editor-card theme-card">
      <div className="editor-tabs-bar">
        <div className="file-tabs" role="tablist" aria-label={tr('源码文件列表', '原始碼檔案列表')}>
          {files.map((file, idx) => {
            const isActive = idx === activeFileIdx;
            return (
              <button
                key={file.name}
                type="button"
                role="tab"
                aria-selected={isActive}
                data-file-tab={file.name}
                onClick={() => onSelectFile(idx)}
                className={`file-tab-btn ${isActive ? 'is-active' : ''}`}
              >
                <span className="file-lang-dot" data-lang={file.language} />
                <span className="ignore-opencc" data-no-translate="true">
                  {file.name}
                </span>
              </button>
            );
          })}
        </div>

        <div className="editor-meta-right ignore-opencc" data-no-translate="true">
          <span>
            {(totalBytes / 1024).toFixed(1)} KB /{' '}
            {LAB_SECURITY_LIMITS.MAX_TOTAL_SOURCE_BYTES / 1024} KB
          </span>
        </div>
      </div>

      <div className="editor-body-wrap">
        <div
          className="editor-line-numbers ignore-opencc"
          data-no-translate="true"
          aria-hidden="true"
        >
          {(activeFile?.content || '')
            .split('\n')
            .map((_, i) => (
              <div key={i}>{i + 1}</div>
            ))}
        </div>
        <textarea
          value={activeFile?.content || ''}
          onChange={(e) => onCodeChange(e.target.value)}
          onKeyDown={(e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
              e.preventDefault();
              onRunCode();
            } else if (e.key === 'Tab') {
              e.preventDefault();
              const target = e.currentTarget;
              const start = target.selectionStart;
              const end = target.selectionEnd;
              const val = target.value;
              const nextVal = val.substring(0, start) + '  ' + val.substring(end);
              onCodeChange(nextVal);
              window.requestAnimationFrame(() => {
                target.selectionStart = target.selectionEnd = start + 2;
              });
            }
          }}
          spellCheck={false}
          autoCapitalize="off"
          autoComplete="off"
          autoCorrect="off"
          aria-label={`编辑文件 ${activeFile?.name || 'code'}`}
          data-testid="lab-code-textarea"
          data-no-translate="true"
          className="editor-textarea ignore-opencc"
        />
      </div>

      <div className="editor-footer-bar">
        <span>
          {tr(
            '快捷键：Ctrl/Cmd + Enter 立即在沙盒中运行 · Tab 缩进 2 空格 · TypeScript 支持纯类型擦除子集',
            '快速鍵：Ctrl/Cmd + Enter 立即在沙盒中執行 · Tab 縮排 2 空格 · TypeScript 支援純型別擦除子集'
          )}
        </span>
        {livecodesAppUrl && (
          <span className="ignore-opencc" data-no-translate="true">
            Self-Hosted Engine: {livecodesAppUrl}
          </span>
        )}
      </div>
    </div>
  );
};
