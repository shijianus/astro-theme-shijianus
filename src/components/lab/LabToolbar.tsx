/**
 * Astro Blog「试验田 Lab」主工具栏组件
 */
import React from 'react';
import type { LabExperiment } from '../../lib/lab-schema';
import type { LabCodeSourceKind } from '../../lib/lab-sandbox-protocol';
import { OFFICIAL_LAB_EXPERIMENTS } from '../../data/lab-experiments';

export interface LabToolbarProps {
  currentExp: LabExperiment;
  selectedSlug: string;
  codeSourceKind: LabCodeSourceKind;
  execStatus: 'idle' | 'running' | 'completed' | 'error' | 'terminated';
  isHant: boolean;
  onSelectExperiment: (slug: string) => void;
  onRun: () => void;
  onStop: () => void;
  onReset: () => void;
  onOpenShareModal: () => void;
  onOpenImportExportModal: () => void;
  onSaveDraft: () => void;
  onLoadDraft: () => void;
}

export const LabToolbar: React.FC<LabToolbarProps> = ({
  currentExp,
  selectedSlug,
  codeSourceKind,
  execStatus,
  isHant,
  onSelectExperiment,
  onRun,
  onStop,
  onReset,
  onOpenShareModal,
  onOpenImportExportModal,
  onSaveDraft,
  onLoadDraft,
}) => {
  const tr = (zhCn: string, zhHant: string) => (isHant ? zhHant : zhCn);

  return (
    <div className="lab-toolbar flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 bg-slate-100/80 dark:bg-slate-800/80 backdrop-blur border-b border-slate-200 dark:border-slate-700">
      {/* 左侧：实验选择器与基本信息 */}
      <div className="flex items-center gap-3">
        <select
          value={selectedSlug}
          onChange={(e) => onSelectExperiment(e.target.value)}
          className="px-2.5 py-1.5 text-xs font-medium rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {OFFICIAL_LAB_EXPERIMENTS.map((exp) => (
            <option key={exp.slug} value={exp.slug}>
              {exp.icon} {exp.title} ({exp.category})
            </option>
          ))}
        </select>

        <span
          className={`inline-flex items-center px-2 py-0.5 text-2xs font-semibold rounded ${
            codeSourceKind === 'official'
              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
              : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
          }`}
        >
          {codeSourceKind === 'official'
            ? tr('官方精选预设', '官方精選預設')
            : tr('外部导入/修改', '外部匯入/修改')}
        </span>
      </div>

      {/* 右侧：动作控制区 */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={execStatus === 'running' ? onStop : onRun}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg shadow-sm transition ${
            execStatus === 'running'
              ? 'bg-rose-600 hover:bg-rose-700 text-white'
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
        >
          {execStatus === 'running' ? (
            <>
              <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
              {tr('停止运行', '停止執行')}
            </>
          ) : (
            <>
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 5v14l11-7z" />
              </svg>
              {tr('运行代码', '執行程式碼')}
            </>
          )}
        </button>

        <button
          type="button"
          onClick={onReset}
          title={tr('重置为初始预设', '重置為初始預設')}
          className="px-2.5 py-1.5 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg border border-slate-300 dark:border-slate-600 transition"
        >
          {tr('重置', '重置')}
        </button>

        <div className="h-4 w-px bg-slate-300 dark:bg-slate-600 mx-0.5" />

        <button
          type="button"
          onClick={onOpenShareModal}
          className="px-2.5 py-1.5 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg border border-slate-300 dark:border-slate-600 transition"
        >
          {tr('分享', '分享')}
        </button>

        <button
          type="button"
          onClick={onOpenImportExportModal}
          className="px-2.5 py-1.5 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg border border-slate-300 dark:border-slate-600 transition"
        >
          {tr('导入/导出', '匯入/匯出')}
        </button>

        <button
          type="button"
          onClick={onSaveDraft}
          title={tr('保存到本地草稿箱', '儲存至本機草稿箱')}
          className="px-2.5 py-1.5 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg border border-slate-300 dark:border-slate-600 transition"
        >
          {tr('存草稿', '存草稿')}
        </button>

        <button
          type="button"
          onClick={onLoadDraft}
          title={tr('从本地草稿箱恢复', '從本機草稿箱恢復')}
          className="px-2.5 py-1.5 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg border border-slate-300 dark:border-slate-600 transition"
        >
          {tr('读草稿', '讀草稿')}
        </button>
      </div>
    </div>
  );
};
