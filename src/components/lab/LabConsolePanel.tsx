/**
 * Astro Blog「试验田 Lab」控制台、错误列表与安全契约抽屉组件
 */
import React from 'react';
import type { SandboxConsoleEntry, SandboxRuntimeError, SandboxIsolationMode } from '../../lib/lab-sandbox-protocol';
import { LAB_SECURITY_LIMITS } from '../../lib/lab-schema';

export interface LabConsolePanelProps {
  activeBottomTab: 'console' | 'errors' | 'security';
  setActiveBottomTab: (tab: 'console' | 'errors' | 'security') => void;
  consoleEntries: SandboxConsoleEntry[];
  runtimeErrors: SandboxRuntimeError[];
  onClearConsole: () => void;
  isolationMode: SandboxIsolationMode;
  activeExternalOrigin: string | null;
  sessionId: string;
  isHant: boolean;
}

export const LabConsolePanel: React.FC<LabConsolePanelProps> = ({
  activeBottomTab,
  setActiveBottomTab,
  consoleEntries,
  runtimeErrors,
  onClearConsole,
  isolationMode,
  activeExternalOrigin,
  sessionId,
  isHant,
}) => {
  const tr = (zhCn: string, zhHant: string) => (isHant ? zhHant : zhCn);

  return (
    <div className="lab-console-drawer">
      <div className="console-tabs-bar">
        <div className="console-tabs" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={activeBottomTab === 'console'}
            onClick={() => setActiveBottomTab('console')}
            className={`console-tab ${activeBottomTab === 'console' ? 'is-active' : ''}`}
            data-testid="tab-console"
          >
            {tr('Console 输出', 'Console 輸出')} ({consoleEntries.length})
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeBottomTab === 'errors'}
            onClick={() => setActiveBottomTab('errors')}
            className={`console-tab ${
              activeBottomTab === 'errors' ? 'is-active' : ''
            } ${runtimeErrors.length > 0 ? 'has-error' : ''}`}
            data-testid="tab-errors"
          >
            {tr('错误提示', '錯誤提示')} ({runtimeErrors.length})
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeBottomTab === 'security'}
            onClick={() => setActiveBottomTab('security')}
            className={`console-tab ${activeBottomTab === 'security' ? 'is-active' : ''}`}
            data-testid="tab-security"
          >
            🛡️ {tr('隔离契约', '隔離契約')}
          </button>
        </div>

        <button
          type="button"
          onClick={onClearConsole}
          className="console-clear-btn"
          data-testid="btn-clear-console"
        >
          {tr('清空输出', '清空輸出')}
        </button>
      </div>

      <div className="console-output-body" data-testid="console-output-body">
        {activeBottomTab === 'console' && (
          <div
            className="console-list ignore-opencc"
            data-no-translate="true"
            data-testid="console-log-list"
          >
            {consoleEntries.length === 0 ? (
              <div className="console-empty">
                {tr(
                  '暂无 Console 输出（支持 console.log / info / warn / error）',
                  '暫無 Console 輸出（支援 console.log / info / warn / error）'
                )}
              </div>
            ) : (
              consoleEntries.map((item) => (
                <div
                  key={item.id}
                  className={`console-row is-${item.level}`}
                  data-console-level={item.level}
                >
                  <span className="console-badge">{item.level.toUpperCase()}</span>
                  <span className="console-text">{item.args.join(' ')}</span>
                </div>
              ))
            )}
          </div>
        )}

        {activeBottomTab === 'errors' && (
          <div
            className="console-list ignore-opencc"
            data-no-translate="true"
            data-testid="runtime-error-list"
          >
            {runtimeErrors.length === 0 ? (
              <div className="console-empty is-ok">
                ✓ {tr('当前运行无未捕获语法或运行时异常', '目前執行無未捕獲語法或執行期異常')}
              </div>
            ) : (
              runtimeErrors.map((err, idx) => (
                <div
                  key={idx}
                  className="console-row is-error"
                  data-testid="runtime-error-item"
                >
                  <span className="console-badge">ERROR</span>
                  <div className="error-detail">
                    <strong>
                      {err.message}
                      {err.line ? ` (Line ${err.line})` : ''}
                    </strong>
                    {err.stack && <pre className="error-stack">{err.stack}</pre>}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeBottomTab === 'security' && (
          <div className="security-audit-summary" data-testid="security-contract-panel">
            <ul>
              <li>
                <strong>隔离模式</strong>:{' '}
                {isolationMode === 'cross-origin' ? (
                  <>
                    已启用独立跨站桥接 (<code>{activeExternalOrigin}</code>) + 内层{' '}
                    <code>sandbox=&quot;allow-scripts&quot;</code> 双层隔离。
                  </>
                ) : (
                  <>
                    本地零配置 <code>sandbox=&quot;allow-scripts&quot;</code>（严格禁用{' '}
                    <code>allow-same-origin</code>、<code>allow-top-navigation</code>、
                    <code>allow-popups</code>、<code>allow-forms</code>）。
                  </>
                )}
              </li>
              <li>
                <strong>Origin 边界</strong>: 执行帧固定为 Opaque Origin (
                <code>window.origin === &quot;null&quot;</code>)，读取主站{' '}
                <code>document.cookie</code>、<code>localStorage</code> 或{' '}
                <code>window.parent.document</code> 由浏览器内核直接拦截并抛出{' '}
                <code>SecurityError</code>。
              </li>
              <li>
                <strong>Nonce CSP 与网络封锁</strong>:{' '}
                <code>
                  default-src &apos;none&apos;; script-src &apos;nonce-...&apos;
                  &apos;unsafe-eval&apos;; connect-src &apos;none&apos;; worker-src
                  &apos;none&apos;
                </code>
                ，阻断外发请求、内联事件注入与 Worker 线程滥用。
              </li>
              <li>
                <strong>资源与消息防洪</strong>: 绑定{' '}
                <code>event.source === iframe.contentWindow</code> + 会话标识{' '}
                <code>{sessionId.slice(0, 15)}...</code> + 同步循环超时熔断 (
                {LAB_SECURITY_LIMITS.SYNC_LOOP_BUDGET_MS}ms) + 最多{' '}
                {LAB_SECURITY_LIMITS.MAX_CONSOLE_ENTRIES} 条日志。
              </li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};
