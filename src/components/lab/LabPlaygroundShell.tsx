/**
 * Astro Blog「试验田 Lab」主工作区外壳组件 (LabPlaygroundShell)
 *
 * 组织工具栏、可调整分栏编辑器、沙盒运行预览、控制台与弹窗。
 */
import React from 'react';
import { LabToolbar, type LabToolbarProps } from './LabToolbar';
import { LabEditorPanel, type LabEditorPanelProps } from './LabEditorPanel';
import { LabPreviewPanel, type LabPreviewPanelProps } from './LabPreviewPanel';
import { LabConsolePanel, type LabConsolePanelProps } from './LabConsolePanel';
import { LabSecurityPanel, type LabSecurityPanelProps } from './LabSecurityPanel';
import { LabImportExportDialog, type LabImportExportDialogProps } from './LabImportExportDialog';
import { ExecutionVisualizer } from './ExecutionVisualizer';

export interface LabPlaygroundShellProps {
  toolbarProps: LabToolbarProps;
  editorProps: LabEditorPanelProps;
  previewProps: LabPreviewPanelProps;
  consoleProps: LabConsolePanelProps;
  securityProps: LabSecurityPanelProps;
  dialogProps: LabImportExportDialogProps;
  toastMessage?: string;
  mode?: 'full-workshop' | 'detail-embedded';
  showTracePanel?: boolean;
}

export const LabPlaygroundShell: React.FC<LabPlaygroundShellProps> = ({
  toolbarProps,
  editorProps,
  previewProps,
  consoleProps,
  securityProps,
  dialogProps,
  toastMessage,
  mode = 'full-workshop',
  showTracePanel = false,
}) => {
  return (
    <div className="lab-playground-shell flex flex-col h-full w-full min-h-[640px] bg-slate-50 dark:bg-slate-950 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-xl">
      {/* 顶部工具栏 */}
      <LabToolbar {...toolbarProps} />

      {/* 中部核心工作区：编辑器与预览面板双栏 */}
      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-slate-200 dark:divide-slate-800 overflow-hidden">
        {/* 左栏：代码编辑器 */}
        <div className="h-full min-h-[300px] overflow-hidden flex flex-col">
          <LabEditorPanel {...editorProps} />
        </div>

        {/* 右栏：沙盒实时预览 */}
        <div className="h-full min-h-[300px] overflow-hidden flex flex-col">
          <LabPreviewPanel {...previewProps} />
        </div>
      </div>

      {/* 底部折叠面板：控制台 / 运行时错误 / 安全审计 / 可视化追踪 */}
      <div className="h-48 border-t border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col">
        {consoleProps.activeBottomTab === 'security' ? (
          <LabSecurityPanel {...securityProps} />
        ) : consoleProps.activeBottomTab === 'trace' && showTracePanel ? (
          <div className="h-full p-2 bg-slate-950 overflow-auto">
            <ExecutionVisualizer config={toolbarProps.currentExp.visualizationConfig} />
          </div>
        ) : (
          <LabConsolePanel {...consoleProps} />
        )}
      </div>

      {/* 模态对话框 */}
      <LabImportExportDialog {...dialogProps} />

      {/* 全局浮动气泡通知 (Toast) */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-2 text-xs font-medium text-white bg-slate-900/90 dark:bg-slate-100/90 dark:text-slate-900 rounded-lg shadow-xl backdrop-blur-xs animate-fade-in pointer-events-none">
          {toastMessage}
        </div>
      )}
    </div>
  );
};
