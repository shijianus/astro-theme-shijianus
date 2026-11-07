/**
 * Astro Blog「试验田 Lab」控制台与错误日志面板组件
 */
import React from 'react';
import type { SandboxConsoleEntry, SandboxRuntimeError } from '../../lib/lab-sandbox-protocol';

export interface LabConsolePanelProps {
  activeBottomTab: 'console' | 'errors' | 'security' | 'trace';
  setActiveBottomTab: (tab: 'console' | 'errors' | 'security' | 'trace') => void;
  consoleEntries: SandboxConsoleEntry[];
  runtimeErrors: SandboxRuntimeError[];
  onClearConsole: () => void;
  showTraceTab?: boolean;
  isHant: boolean;
}

export const LabConsolePanel: React.FC<LabConsolePanelProps> = ({
  activeBottomTab,
  setActiveBottomTab,
  consoleEntries,
  runtimeErrors,
  onClearConsole,
  showTraceTab,
  isHant,
}) => {
  const tr = (zhCn: string, zhHant: string) => (isHant ? zhHant : zhCn);

  return (
    <div className="lab-console-panel flex flex-col h-full bg-slate-950 text-slate-200 font-mono text-xs overflow-hidden">
      {/* 选项卡栏 */}
      <div className="flex items-center justify-between px-3 bg-slate-900 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveBottomTab('console')}
            className={`px-3 py-1.5 text-xs font-medium border-b-2 transition ${
              activeBottomTab === 'console'
                ? 'border-blue-500 text-blue-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            {tr('控制台', '主控台')} ({consoleEntries.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveBottomTab('errors')}
            className={`px-3 py-1.5 text-xs font-medium border-b-2 transition ${
              activeBottomTab === 'errors'
                ? 'border-rose-500 text-rose-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            {tr('运行时错误', '執行時錯誤')} ({runtimeErrors.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveBottomTab('security')}
            className={`px-3 py-1.5 text-xs font-medium border-b-2 transition ${
              activeBottomTab === 'security'
                ? 'border-emerald-500 text-emerald-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            {tr('安全审计', '安全稽核')}
          </button>

          {showTraceTab && (
            <button
              type="button"
              onClick={() => setActiveBottomTab('trace')}
              className={`px-3 py-1.5 text-xs font-medium border-b-2 transition ${
                activeBottomTab === 'trace'
                  ? 'border-purple-500 text-purple-400 font-semibold'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              {tr('执行追踪', '執行追蹤')}
            </button>
          )}
        </div>

        {activeBottomTab === 'console' && (
          <button
            type="button"
            onClick={onClearConsole}
            className="text-2xs text-slate-400 hover:text-slate-200 px-2 py-0.5 rounded hover:bg-slate-800 transition"
          >
            {tr('清空', '清空')}
          </button>
        )}
      </div>

      {/* 内容区域 */}
      <div className="flex-1 min-h-0 p-3 overflow-y-auto space-y-1.5">
        {activeBottomTab === 'console' && (
          <>
            {consoleEntries.length === 0 ? (
              <div className="text-slate-500 italic py-4 text-center">
                {tr('控制台暂无输出', '主控台暫無輸出')}
              </div>
            ) : (
              consoleEntries.map((entry) => (
                <div
                  key={entry.id}
                  className={`flex items-start gap-2 py-0.5 leading-relaxed ${
                    entry.level === 'error'
                      ? 'text-rose-400'
                      : entry.level === 'warn'
                      ? 'text-amber-400'
                      : entry.level === 'info'
                      ? 'text-cyan-400'
                      : 'text-slate-300'
                  }`}
                >
                  <span className="text-2xs text-slate-500 select-none">
                    [{entry.level.toUpperCase()}]
                  </span>
                  <div className="flex-1 whitespace-pre-wrap break-all">
                    {entry.args.join(' ')}
                  </div>
                </div>
              ))
            )}
          </>
        )}

        {activeBottomTab === 'errors' && (
          <>
            {runtimeErrors.length === 0 ? (
              <div className="text-emerald-500 italic py-4 text-center">
                {tr('运行正常，未检测到错误', '執行正常，未偵測到錯誤')}
              </div>
            ) : (
              runtimeErrors.map((err, idx) => (
                <div
                  key={idx}
                  className="p-2.5 rounded bg-rose-950/40 border border-rose-900/60 text-rose-300 space-y-1"
                >
                  <div className="font-semibold">{err.message}</div>
                  {(err.line !== null || err.column !== null) && (
                    <div className="text-2xs text-rose-400">
                      位置: Line {err.line ?? '?'}, Column {err.column ?? '?'}
                    </div>
                  )}
                  {err.stack && (
                    <pre className="text-2xs text-rose-400/80 whitespace-pre-wrap break-all mt-1">
                      {err.stack}
                    </pre>
                  )}
                </div>
              ))
            )}
          </>
        )}
      </div>
    </div>
  );
};
