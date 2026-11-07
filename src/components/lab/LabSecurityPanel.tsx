/**
 * Astro Blog「试验田 Lab」安全审计面板组件
 */
import React from 'react';
import type { SandboxIsolationMode, LabCodeSourceKind } from '../../lib/lab-sandbox-protocol';

export interface LabSecurityPanelProps {
  isolationMode: SandboxIsolationMode;
  codeSourceKind: LabCodeSourceKind;
  activeExternalOrigin: string | null;
  sessionId: string;
  isHant: boolean;
}

export const LabSecurityPanel: React.FC<LabSecurityPanelProps> = ({
  isolationMode,
  codeSourceKind,
  activeExternalOrigin,
  sessionId,
  isHant,
}) => {
  const tr = (zhCn: string, zhHant: string) => (isHant ? zhHant : zhCn);

  return (
    <div className="lab-security-panel p-4 bg-slate-950 text-slate-300 font-mono text-xs space-y-4 overflow-y-auto h-full">
      <div className="border-b border-slate-800 pb-2">
        <h4 className="font-semibold text-emerald-400">
          {tr('🛡️ 纵深防御 (Defense-in-Depth) 沙盒安全审计', '🛡️ 縱深防禦 (Defense-in-Depth) 沙盒安全稽核')}
        </h4>
        <p className="text-2xs text-slate-400 mt-1">
          {tr(
            '所有用户实验代码一律在受限沙盒内隔离执行，主站零 Cookie、零 Storage、零 DOM 同步访问。',
            '所有使用者實驗原始碼一律在受限沙盒內隔離執行，主站零 Cookie、零 Storage、零 DOM 同步存取。'
          )}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-2xs">
        <div className="p-2.5 rounded bg-slate-900 border border-slate-800 space-y-1">
          <div className="text-slate-400">{tr('代码信任等级', '程式碼信任等級')}:</div>
          <div className="font-semibold text-slate-200">
            {codeSourceKind === 'official' ? 'Official Preset (官方预设)' : 'Untrusted / Imported (外部非可信)'}
          </div>
        </div>

        <div className="p-2.5 rounded bg-slate-900 border border-slate-800 space-y-1">
          <div className="text-slate-400">{tr('当前隔离模式', '目前隔離模式')}:</div>
          <div className="font-semibold text-slate-200">
            {isolationMode === 'cross-origin' ? 'Cross-Origin (独立跨站桥接)' : 'Opaque Srcdoc (Opaque "null")'}
          </div>
        </div>

        <div className="p-2.5 rounded bg-slate-900 border border-slate-800 space-y-1">
          <div className="text-slate-400">{tr('沙盒目标 Origin', '沙盒目標 Origin')}:</div>
          <div className="font-semibold text-slate-200 break-all">
            {activeExternalOrigin || 'null (Unique Opaque Origin)'}
          </div>
        </div>

        <div className="p-2.5 rounded bg-slate-900 border border-slate-800 space-y-1">
          <div className="text-slate-400">{tr('当前会话 Nonce', '目前工作階段 Nonce')}:</div>
          <div className="font-semibold text-slate-200 truncate">{sessionId}</div>
        </div>
      </div>

      <div className="space-y-2">
        <h5 className="font-semibold text-slate-200 text-xs">{tr('🔒 CSP 策略基线', '🔒 CSP 策略基準')}</h5>
        <div className="p-2 rounded bg-slate-900 border border-slate-800 text-2xs text-slate-400 space-y-1 font-mono">
          <div><span className="text-emerald-400">default-src:</span> 'none'</div>
          <div><span className="text-emerald-400">connect-src:</span> 'none' (彻底阻断外发网络请求)</div>
          <div><span className="text-emerald-400">worker-src:</span> 'none' (阻断后台 Worker 多核死循环)</div>
          <div><span className="text-emerald-400">frame-ancestors:</span> https://blog.epocanvas.com</div>
          <div><span className="text-emerald-400">outer-runner:</span> script-src 'self' (0 unsafe-eval · 0 unsafe-inline)</div>
        </div>
      </div>
    </div>
  );
};
