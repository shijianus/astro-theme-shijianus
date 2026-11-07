/**
 * Astro Blog「试验田 Lab」代码编辑器面板组件
 */
import React from 'react';
import type { LabFile } from '../../lib/lab-schema';

export interface LabEditorPanelProps {
  files: LabFile[];
  activeFileIdx: number;
  onSelectFile: (index: number) => void;
  onCodeChange: (content: string) => void;
  onCopyCode: () => void;
  isHant: boolean;
}

export const LabEditorPanel: React.FC<LabEditorPanelProps> = ({
  files,
  activeFileIdx,
  onSelectFile,
  onCodeChange,
  onCopyCode,
  isHant,
}) => {
  const tr = (zhCn: string, zhHant: string) => (isHant ? zhHant : zhCn);
  const activeFile = files[activeFileIdx] || files[0];
  const lineCount = activeFile?.content ? activeFile.content.split('\n').length : 0;
  const charCount = activeFile?.content ? activeFile.content.length : 0;

  return (
    <div className="lab-editor-panel flex flex-col h-full bg-slate-900 text-slate-100 overflow-hidden">
      {/* 选项卡栏 */}
      <div className="flex items-center justify-between px-2 pt-2 bg-slate-950 border-b border-slate-800">
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
          {files.map((file, idx) => (
            <button
              key={file.name}
              type="button"
              onClick={() => onSelectFile(idx)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono rounded-t-lg transition border-t border-x ${
                idx === activeFileIdx
                  ? 'bg-slate-900 text-blue-400 border-slate-700 font-semibold'
                  : 'bg-transparent text-slate-400 border-transparent hover:text-slate-200 hover:bg-slate-900/50'
              }`}
            >
              <span>{file.name}</span>
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={onCopyCode}
          className="text-2xs text-slate-400 hover:text-slate-200 px-2 py-1 rounded hover:bg-slate-800 transition"
        >
          {tr('复制代码', '複製程式碼')}
        </button>
      </div>

      {/* 编辑区 */}
      <div className="relative flex-1 min-h-0 flex overflow-hidden">
        <textarea
          value={activeFile?.content || ''}
          onChange={(e) => onCodeChange(e.target.value)}
          spellCheck={false}
          className="flex-1 w-full h-full p-4 font-mono text-xs leading-relaxed bg-transparent text-slate-100 resize-none outline-none border-0 overflow-auto selection:bg-blue-600/40"
          placeholder={tr('在此编写实验源码...', '在此編寫實驗原始碼...')}
        />
      </div>

      {/* 底部信息栏 */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-slate-950 text-2xs text-slate-400 font-mono border-t border-slate-800">
        <div className="flex items-center gap-3">
          <span>{activeFile?.language?.toUpperCase()}</span>
          <span>{lineCount} {tr('行', '行')}</span>
          <span>{charCount} {tr('字符', '字元')}</span>
        </div>
        <div className="text-slate-500">
          {tr('纯客户端隔离编译', '純前端隔離編譯')}
        </div>
      </div>
    </div>
  );
};
