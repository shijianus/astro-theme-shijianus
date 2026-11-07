/**
 * Astro Blog「试验田 Lab」代码编辑器面板组件 (LabEditorPanel)
 *
 * 实施 Phase 2.8 交互升级：
 * 1. 文件新增、重命名、删除；
 * 2. 文件与工程 dirty 状态标识；
 * 3. 行列光标定位 (Ln X, Col Y) 与草稿暂存标识；
 * 4. 内置轻量查找搜索栏；
 * 5. Tab 2空格缩进与快速运行快捷键；
 * 6. 字节体积配额保护与无障碍支持。
 */
import React, { useState, useRef, useCallback } from 'react';
import type { LabFile } from '../../lib/lab-schema';
import { LAB_SECURITY_LIMITS } from '../../lib/lab-schema';

export interface LabEditorPanelProps {
  files: LabFile[];
  activeFileIdx: number;
  livecodesAppUrl?: string;
  isHant: boolean;
  dirty?: boolean;
  onSelectFile: (index: number) => void;
  onCodeChange: (content: string) => void;
  onRunCode: () => void;
  onAddFile?: (name: string, language: string) => void;
  onDeleteFile?: (index: number) => void;
  onRenameFile?: (index: number, newName: string) => void;
}

export const LabEditorPanel: React.FC<LabEditorPanelProps> = ({
  files,
  activeFileIdx,
  livecodesAppUrl,
  isHant,
  dirty = false,
  onSelectFile,
  onCodeChange,
  onRunCode,
  onAddFile,
  onDeleteFile,
  onRenameFile,
}) => {
  const tr = (zhCn: string, zhHant: string) => (isHant ? zhHant : zhCn);
  const activeFile = files[activeFileIdx] || files[0];
  const totalBytes = files.reduce((acc, f) => acc + (f.content ? f.content.length : 0), 0);

  const [cursorPos, setCursorPos] = useState({ line: 1, col: 1 });
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddingFile, setIsAddingFile] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState('');

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // 计算光标行列
  const updateCursorPos = useCallback(() => {
    if (!textareaRef.current) return;
    const pos = textareaRef.current.selectionStart || 0;
    const textBefore = textareaRef.current.value.substring(0, pos);
    const lines = textBefore.split('\n');
    setCursorPos({
      line: lines.length,
      col: lines[lines.length - 1].length + 1,
    });
  }, []);

  const handleConfirmAddFile = () => {
    const trimmed = newFileName.trim();
    if (!trimmed) {
      setIsAddingFile(false);
      return;
    }
    let lang = 'javascript';
    if (trimmed.endsWith('.html')) lang = 'html';
    else if (trimmed.endsWith('.css')) lang = 'css';
    else if (trimmed.endsWith('.ts')) lang = 'typescript';
    else if (trimmed.endsWith('.json')) lang = 'json';

    onAddFile?.(trimmed, lang);
    setNewFileName('');
    setIsAddingFile(false);
  };

  const handleConfirmRename = () => {
    const trimmed = renameValue.trim();
    if (trimmed && trimmed !== activeFile?.name) {
      onRenameFile?.(activeFileIdx, trimmed);
    }
    setIsRenaming(false);
  };

  return (
    <div className="lab-pg-editor-card theme-card" role="region" aria-label={tr('代码编辑区域', '程式碼編輯區域')}>
      <div className="editor-tabs-bar">
        <div className="file-tabs" role="tablist" aria-label={tr('源码文件列表', '原始碼檔案列表')}>
          {files.map((file, idx) => {
            const isActive = idx === activeFileIdx;
            return (
              <div
                key={file.name}
                className={`file-tab-wrapper ${isActive ? 'is-active' : ''}`}
                style={{ display: 'inline-flex', alignItems: 'center' }}
              >
                <button
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
                    {isActive && dirty ? ' *' : ''}
                  </span>
                </button>

                {/* 当前活动文件的重命名/删除按钮 */}
                {isActive && files.length > 1 && onDeleteFile && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (window.confirm(tr(`确认删除文件 "${file.name}" 吗？`, `確認刪除檔案 "${file.name}" 嗎？`))) {
                        onDeleteFile(idx);
                      }
                    }}
                    title={tr('删除此文件', '刪除此檔案')}
                    aria-label={tr(`删除文件 ${file.name}`, `刪除檔案 ${file.name}`)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#94a3b8',
                      cursor: 'pointer',
                      padding: '2px 4px',
                      fontSize: '11px',
                    }}
                  >
                    ✕
                  </button>
                )}
              </div>
            );
          })}

          {/* 新增文件按钮 */}
          {onAddFile && !isAddingFile && (
            <button
              type="button"
              onClick={() => {
                setIsAddingFile(true);
                setNewFileName('');
              }}
              className="file-tab-btn is-add"
              title={tr('新增源文件', '新增原始檔')}
              aria-label={tr('新增源文件', '新增原始檔')}
              style={{ padding: '4px 8px', fontSize: '13px', color: '#38bdf8' }}
            >
              +
            </button>
          )}

          {/* 新增文件内联输入框 */}
          {isAddingFile && (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <input
                type="text"
                value={newFileName}
                placeholder="filename.js"
                autoFocus
                onChange={(e) => setNewFileName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleConfirmAddFile();
                  else if (e.key === 'Escape') setIsAddingFile(false);
                }}
                style={{
                  background: '#090d16',
                  border: '1px solid #38bdf8',
                  color: '#fff',
                  fontSize: '11px',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  width: '110px',
                }}
              />
              <button
                type="button"
                onClick={handleConfirmAddFile}
                style={{ background: '#2563eb', border: 'none', color: '#fff', fontSize: '10px', padding: '2px 6px', borderRadius: '3px' }}
              >
                ✓
              </button>
              <button
                type="button"
                onClick={() => setIsAddingFile(false)}
                style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '10px' }}
              >
                ✕
              </button>
            </div>
          )}
        </div>

        <div className="editor-meta-right ignore-opencc" data-no-translate="true" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* 查找按钮 */}
          <button
            type="button"
            onClick={() => setShowSearch(!showSearch)}
            title={tr('查找文本 (Ctrl/Cmd + F)', '尋找文字 (Ctrl/Cmd + F)')}
            style={{
              background: showSearch ? 'rgba(56, 189, 248, 0.2)' : 'none',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              fontSize: '12px',
              padding: '2px 6px',
              borderRadius: '4px',
            }}
          >
            🔍
          </button>

          <span>
            {(totalBytes / 1024).toFixed(1)} KB /{' '}
            {LAB_SECURITY_LIMITS.MAX_TOTAL_SOURCE_BYTES / 1024} KB
          </span>
        </div>
      </div>

      {/* 搜索栏 */}
      {showSearch && (
        <div
          style={{
            padding: '6px 12px',
            background: 'rgba(15, 23, 42, 0.9)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '12px',
          }}
        >
          <span>🔍</span>
          <input
            type="text"
            value={searchQuery}
            placeholder={tr('在当前文件中搜索...', '在目前檔案中搜尋...')}
            autoFocus
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') setShowSearch(false);
            }}
            style={{
              background: '#090d16',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              color: '#fff',
              fontSize: '12px',
              padding: '3px 8px',
              borderRadius: '4px',
              flex: 1,
              maxWidth: '240px',
            }}
          />
          {searchQuery && (
            <span style={{ color: '#94a3b8', fontSize: '11px' }}>
              {tr('匹配数', '相符數')}:{' '}
              {((activeFile?.content || '').match(new RegExp(searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi')) || []).length}
            </span>
          )}
          <button
            type="button"
            onClick={() => setShowSearch(false)}
            style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '12px' }}
          >
            ✕
          </button>
        </div>
      )}

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
          ref={textareaRef}
          value={activeFile?.content || ''}
          onChange={(e) => onCodeChange(e.target.value)}
          onSelect={updateCursorPos}
          onKeyUp={updateCursorPos}
          onClick={updateCursorPos}
          onKeyDown={(e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
              e.preventDefault();
              onRunCode();
            } else if ((e.metaKey || e.ctrlKey) && e.key === 'f') {
              e.preventDefault();
              setShowSearch((prev) => !prev);
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
                updateCursorPos();
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

      <div className="editor-footer-bar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontFamily: 'monospace', color: '#38bdf8' }}>
            Ln {cursorPos.line}, Col {cursorPos.col}
          </span>
          <span style={{ color: '#64748b' }}>|</span>
          <span style={{ color: '#94a3b8' }}>UTF-8</span>
          <span style={{ color: '#64748b' }}>|</span>
          <span style={{ color: dirty ? '#f59e0b' : '#10b981', fontSize: '11px' }}>
            {dirty ? tr('● 已就地修改', '● 已就地修改') : tr('✓ 草稿已保存', '✓ 草稿已儲存')}
          </span>
        </div>

        <div>
          <span>
            {tr(
              'Ctrl/Cmd + Enter 运行 · Ctrl/Cmd + F 查找 · Tab 缩进',
              'Ctrl/Cmd + Enter 執行 · Ctrl/Cmd + F 尋找 · Tab 縮排'
            )}
          </span>
        </div>
      </div>
    </div>
  );
};
