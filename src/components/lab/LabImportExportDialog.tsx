/**
 * Astro Blog「试验田 Lab」导入、导出与分享对话框组件
 */
import React, { useState } from 'react';
import type { LabFile, LabExperiment } from '../../lib/lab-schema';
import { PortableBundleCodec } from '../../lib/lab/PortableBundleCodec';

export interface LabImportExportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'share' | 'import-export';
  currentExp: LabExperiment;
  files: LabFile[];
  onImportFiles: (files: LabFile[]) => void;
  showToast: (msg: string) => void;
  isHant: boolean;
}

export const LabImportExportDialog: React.FC<LabImportExportDialogProps> = ({
  isOpen,
  onClose,
  mode,
  currentExp,
  files,
  onImportFiles,
  showToast,
  isHant,
}) => {
  if (!isOpen) return null;

  const tr = (zhCn: string, zhHant: string) => (isHant ? zhHant : zhCn);
  const [importJsonText, setImportJsonText] = useState('');

  // 生成分享 URL
  const sharePayload = PortableBundleCodec.encode({
    version: 'lab-bundle-v1',
    slug: currentExp.slug,
    title: currentExp.title,
    description: currentExp.description,
    files,
    exportedAt: new Date().toISOString(),
  });
  const shareUrl = typeof window !== 'undefined'
    ? `${window.location.origin}${window.location.pathname}#bundle=${sharePayload}`
    : '';

  const handleCopyShareUrl = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      showToast(tr('已复制安全分享链接到剪贴板', '已複製安全分享連結到剪貼簿'));
    } catch {
      showToast(tr('复制失败，请手动全选复制', '複製失敗，請手動全選複製'));
    }
  };

  const handleDownloadJson = () => {
    const jsonStr = PortableBundleCodec.exportToJson({
      id: currentExp.id,
      slug: currentExp.slug,
      title: currentExp.title,
      files,
    });
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lab-experiment-${currentExp.slug}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast(tr('已生成并下载实验 JSON 包', '已產生並下載實驗 JSON 包'));
  };

  const handleApplyImport = () => {
    const validated = PortableBundleCodec.importFromJson(importJsonText);
    if (!validated.ok || !validated.data || !validated.data.files || validated.data.files.length === 0) {
      showToast(tr('JSON 格式非法或未找到有效 files 数组', 'JSON 格式非法或未找到有效 files 陣列'));
      return;
    }
    onImportFiles(validated.data.files);
    showToast(tr('已成功导入外部代码，已设为非可信等级受保护运行', '已成功匯入外部程式碼，已設為非可信等級受保護執行'));
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="w-full max-w-lg bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col max-h-[90vh]">
        {/* 对话框头部 */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200 dark:border-slate-700">
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
            {mode === 'share'
              ? tr('分享实验工程', '分享實驗工程')
              : tr('导入与导出实验', '匯入與匯出實驗')}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded"
          >
            ✕
          </button>
        </div>

        {/* 对话框主体 */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs">
          {mode === 'share' ? (
            <div className="space-y-3">
              <p className="text-slate-600 dark:text-slate-300">
                {tr(
                  '通过 URL Hash 便携包分享当前修改。他人打开时代码将以「外部导入」等级受沙盒保护运行：',
                  '透過 URL Hash 便攜包分享目前修改。他人開啟時程式碼將以「外部匯入」等級受沙盒保護執行：'
                )}
              </p>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={shareUrl}
                  className="flex-1 px-3 py-2 text-xs font-mono bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 rounded border border-slate-300 dark:border-slate-700 select-all outline-none"
                />
                <button
                  type="button"
                  onClick={handleCopyShareUrl}
                  className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded transition"
                >
                  {tr('复制', '複製')}
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <h4 className="font-semibold text-slate-700 dark:text-slate-200">
                  {tr('导出为 JSON 文件', '匯出為 JSON 檔案')}
                </h4>
                <button
                  type="button"
                  onClick={handleDownloadJson}
                  className="px-3 py-1.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 rounded font-medium border border-slate-300 dark:border-slate-600 transition"
                >
                  {tr('下载 .json 文件', '下載 .json 檔案')}
                </button>
              </div>

              <div className="h-px bg-slate-200 dark:bg-slate-700" />

              <div className="space-y-2">
                <h4 className="font-semibold text-slate-700 dark:text-slate-200">
                  {tr('从 JSON 文本导入', '從 JSON 文字匯入')}
                </h4>
                <textarea
                  value={importJsonText}
                  onChange={(e) => setImportJsonText(e.target.value)}
                  placeholder={tr('在此粘贴实验 JSON 内容...', '在此貼上實驗 JSON 內容...')}
                  className="w-full h-32 p-3 font-mono text-2xs bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-slate-200 rounded border border-slate-300 dark:border-slate-700 resize-none outline-none"
                />
                <button
                  type="button"
                  onClick={handleApplyImport}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium transition"
                >
                  {tr('解析并载入代码', '解析並載入程式碼')}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
