/**
 * Astro Blog「试验田 Lab」主工作台与安全交互界面 (LabPlayground)
 *
 * 经 Phase 2.8 架构重构：
 * 1. 拆分为轻量适配器与独立 React 组件（LabToolbar, LabEditorPanel, LabPreviewPanel, LabConsolePanel, LabSecurityPanel, LabImportExportDialog, LabPlaygroundShell）；
 * 2. 状态逻辑与策略由 SessionManager, PortableBundleCodec, ExecutionPolicy 驱动；
 * 3. 严格维持向后兼容性与 100% 现有测试覆盖。
 */
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import type { LabFile, LabExperiment } from '../../lib/lab-schema';
import { LAB_SECURITY_LIMITS, validateLabFiles, validateLabPortableBundle } from '../../lib/lab-schema';
import {
  type SandboxIsolationMode,
  type SandboxConsoleEntry,
  type SandboxRuntimeError,
  type LabCodeSourceKind,
  LAB_SANDBOX_PROTOCOL_VERSION,
  buildIsolatedSandboxSrcDoc,
  compileExperimentFiles,
  resolveSafeExternalSandboxOrigin,
} from '../../lib/lab-sandbox-protocol';
import { OFFICIAL_LAB_EXPERIMENTS, getExperimentBySlug } from '../../data/lab-experiments';
import { SessionManager } from '../../lib/lab/SessionManager';
import { PortableBundleCodec } from '../../lib/lab/PortableBundleCodec';
import { ExecutionPolicy } from '../../lib/lab/ExecutionPolicy';
import { SandboxMessageParser } from '../../lib/lab/SandboxMessageParser';
import { LabPlaygroundShell } from './LabPlaygroundShell';

export interface LabPlaygroundProps {
  initialSlug?: string;
  mode?: 'full-workshop' | 'detail-embedded';
  livecodesAppUrl?: string;
  externalSandboxOrigin?: string;
}

const DRAFT_STORAGE_KEY = 'shijianus-lab-draft-v1';
const BRIDGE_HANDSHAKE_TIMEOUT_MS = 4500;

function readCurrentUiLocale(): 'zh-CN' | 'zh-Hant' {
  if (typeof document === 'undefined') return 'zh-CN';
  const attr =
    document.documentElement.getAttribute('data-ui-locale') ||
    document.documentElement.getAttribute('lang') ||
    '';
  if (attr === 'zh-Hant' || attr === 'zh-TW' || attr === 'zh-HK') {
    return 'zh-Hant';
  }
  try {
    const saved = window.localStorage.getItem('shijianus-locale');
    if (saved === 'zh-Hant') return 'zh-Hant';
  } catch {
    // ignore storage errors
  }
  return 'zh-CN';
}

function readCurrentThemeMode(): 'light' | 'dark' {
  if (typeof document === 'undefined') return 'light';
  return document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
}

export function LabPlayground({
  initialSlug = 'star-trails-simulator',
  mode = 'full-workshop',
  livecodesAppUrl = '',
  externalSandboxOrigin = '',
}: LabPlaygroundProps) {
  const defaultExp = useMemo(
    () => getExperimentBySlug(initialSlug) || OFFICIAL_LAB_EXPERIMENTS[0],
    [initialSlug]
  );

  const [uiLocale, setUiLocale] = useState<'zh-CN' | 'zh-Hant'>('zh-CN');
  const isHant = uiLocale === 'zh-Hant';
  const tr = useCallback((zhCn: string, zhHant: string) => (isHant ? zhHant : zhCn), [isHant]);

  const [selectedSlug, setSelectedSlug] = useState<string>(defaultExp.slug);
  const [currentExp, setCurrentExp] = useState<LabExperiment>(defaultExp);
  const [files, setFiles] = useState<LabFile[]>(() =>
    defaultExp.files.map((f) => ({ ...f }))
  );
  const [activeFileIdx, setActiveFileIdx] = useState<number>(0);

  const [codeSourceKind, setCodeSourceKind] = useState<LabCodeSourceKind>(() =>
    ExecutionPolicy.resolveSourceKind(defaultExp.author)
  );
  const [bridgeFallbackForced, setBridgeFallbackForced] = useState<boolean>(false);
  const [failClosedReason, setFailClosedReason] = useState<string>('');
  const [hostOriginState, setHostOriginState] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setHostOriginState(window.location.origin);
    }
  }, []);

  const externalResolution = useMemo(
    () => resolveSafeExternalSandboxOrigin(externalSandboxOrigin, hostOriginState),
    [externalSandboxOrigin, hostOriginState]
  );

  const isUntrustedCode = codeSourceKind !== 'official';
  const activeExternalOrigin =
    externalResolution.enabled &&
    externalResolution.origin &&
    (isUntrustedCode || !bridgeFallbackForced)
      ? externalResolution.origin
      : null;

  const isolationMode: SandboxIsolationMode = activeExternalOrigin
    ? 'cross-origin'
    : 'opaque-srcdoc';

  const sessionManagerRef = useRef<SessionManager>(new SessionManager());
  const [sessionId, setSessionId] = useState<string>(() => sessionManagerRef.current.getSessionId());
  const [sandboxKey, setSandboxKey] = useState<number>(1);
  const [sandboxSrcDoc, setSandboxSrcDoc] = useState<string>('');
  const [execStatus, setExecStatus] = useState<
    'idle' | 'running' | 'completed' | 'error' | 'terminated'
  >('idle');
  const [lastDurationMs, setLastDurationMs] = useState<number | null>(null);

  const [consoleEntries, setConsoleEntries] = useState<SandboxConsoleEntry[]>([]);
  const [runtimeErrors, setRuntimeErrors] = useState<SandboxRuntimeError[]>([]);
  const [activeBottomTab, setActiveBottomTab] = useState<'console' | 'errors' | 'security' | 'trace'>(
    'console'
  );
  const [toastMessage, setToastMessage] = useState<string>('');
  const [dialogState, setDialogState] = useState<{ isOpen: boolean; mode: 'share' | 'import-export' }>({
    isOpen: false,
    mode: 'share',
  });

  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const watchdogTimerRef = useRef<number | null>(null);
  const bridgeHandshakeTimerRef = useRef<number | null>(null);
  const bridgePingIntervalRef = useRef<number | null>(null);
  const toastTimerRef = useRef<number | null>(null);

  const sessionIdRef = useRef<string>(sessionId);
  sessionIdRef.current = sessionId;

  const isolationModeRef = useRef<SandboxIsolationMode>(isolationMode);
  isolationModeRef.current = isolationMode;

  const activeExternalOriginRef = useRef<string | null>(activeExternalOrigin);
  activeExternalOriginRef.current = activeExternalOrigin;

  const codeSourceKindRef = useRef<LabCodeSourceKind>(codeSourceKind);
  codeSourceKindRef.current = codeSourceKind;

  const bridgeFallbackForcedRef = useRef<boolean>(bridgeFallbackForced);
  bridgeFallbackForcedRef.current = bridgeFallbackForced;

  const pendingBridgeSrcDocRef = useRef<string>('');
  const bridgeCodeDispatchedWinRef = useRef<Window | null>(null);
  const bridgeReadyAckRef = useRef<boolean>(false);
  const inboundMsgCountRef = useRef<number>(0);

  const clearTimers = useCallback(() => {
    if (watchdogTimerRef.current) {
      window.clearTimeout(watchdogTimerRef.current);
      watchdogTimerRef.current = null;
    }
    if (bridgeHandshakeTimerRef.current) {
      window.clearTimeout(bridgeHandshakeTimerRef.current);
      bridgeHandshakeTimerRef.current = null;
    }
    if (bridgePingIntervalRef.current) {
      window.clearInterval(bridgePingIntervalRef.current);
      bridgePingIntervalRef.current = null;
    }
  }, []);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    if (toastTimerRef.current) {
      window.clearTimeout(toastTimerRef.current);
    }
    toastTimerRef.current = window.setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? '' : prev));
    }, 3200);
  }, []);

  // 同步 UI 简繁语言
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const syncLocale = () => setUiLocale(readCurrentUiLocale());
    syncLocale();
    window.addEventListener('shijianus:localechange', syncLocale as EventListener);
    return () => {
      window.removeEventListener('shijianus:localechange', syncLocale as EventListener);
    };
  }, []);

  // 跨站桥接指令分发
  const dispatchBridgeExecute = useCallback(() => {
    const extOrigin = activeExternalOriginRef.current;
    const win = iframeRef.current?.contentWindow;
    const srcDoc = pendingBridgeSrcDocRef.current;
    if (!extOrigin || !win || !srcDoc || bridgeCodeDispatchedWinRef.current === win) return;

    bridgeCodeDispatchedWinRef.current = win;
    try {
      win.postMessage(
        {
          protocol: LAB_SANDBOX_PROTOCOL_VERSION,
          sessionId: sessionIdRef.current,
          type: 'EXECUTE_CODE',
          payload: { srcDoc },
        },
        extOrigin
      );
    } catch {
      bridgeCodeDispatchedWinRef.current = null;
    }
  }, []);

  // 执行代码
  const executeInSandbox = useCallback(
    (
      targetFiles: LabFile[],
      themeOverride?: 'light' | 'dark',
      sourceKindOverride?: LabCodeSourceKind
    ) => {
      const activeSourceKind = sourceKindOverride ?? codeSourceKindRef.current;
      const runtimeHostOrigin = typeof window !== 'undefined' ? window.location.origin : null;
      const liveResolution = resolveSafeExternalSandboxOrigin(
        externalSandboxOrigin,
        runtimeHostOrigin
      );

      const validation = validateLabFiles(targetFiles);
      if (!validation.ok || !validation.data) {
        setExecStatus('error');
        setRuntimeErrors([
          {
            message: `源码校验未通过: ${validation.errors.join(' ')}`,
            timestamp: Date.now(),
          },
        ]);
        setActiveBottomTab('errors');
        return;
      }

      const precheck = compileExperimentFiles(validation.data);
      clearTimers();

      const rotated = sessionManagerRef.current.rotate();
      sessionIdRef.current = rotated.sessionId;
      inboundMsgCountRef.current = 0;
      bridgeCodeDispatchedWinRef.current = null;
      bridgeReadyAckRef.current = false;

      setSessionId(rotated.sessionId);
      setConsoleEntries([]);
      setLastDurationMs(null);

      // 非官方代码：独立跨站沙盒不可用时失败关闭
      if (activeSourceKind !== 'official') {
        if (!liveResolution.enabled || !liveResolution.origin) {
          const reason = liveResolution.rejectedReason
            ? `独立跨站沙盒配置被拒绝 (${liveResolution.rejectedReason})`
            : '当前环境未配置独立跨站沙盒域名 (PUBLIC_LAB_SANDBOX_ORIGIN)';
          const failMsg = `[Sandbox Fail-Closed] 安全阻断：当前代码来源为 "${activeSourceKind}"，${reason}。系统严禁非官方代码回退至本地 opaque srcdoc 沙盒，已强制失败关闭。`;
          pendingBridgeSrcDocRef.current = '';
          setSandboxSrcDoc('');
          setSandboxKey((k) => k + 1);
          setFailClosedReason(failMsg);
          setRuntimeErrors([{ message: failMsg, timestamp: Date.now() }]);
          setExecStatus('error');
          setActiveBottomTab('errors');
          showToast('安全阻断：独立跨站沙盒未就绪，外部代码已失败关闭');
          return;
        }
        setFailClosedReason('');
      } else {
        setFailClosedReason('');
      }

      const resolvedTheme = themeOverride ?? readCurrentThemeMode();
      const doc = buildIsolatedSandboxSrcDoc({
        sessionId: rotated.sessionId,
        files: validation.data,
        theme: resolvedTheme,
        maxConsoleEntries: LAB_SECURITY_LIMITS.MAX_CONSOLE_ENTRIES,
      });

      if (!precheck.ok) {
        pendingBridgeSrcDocRef.current = '';
        setSandboxSrcDoc('');
        setSandboxKey((k) => k + 1);
        setRuntimeErrors(
          precheck.errors.slice(0, LAB_SECURITY_LIMITS.MAX_RUNTIME_ERRORS).map((msg) => ({
            message: msg,
            timestamp: Date.now(),
          }))
        );
        setExecStatus('error');
        setActiveBottomTab('errors');
        return;
      }

      pendingBridgeSrcDocRef.current = doc;
      setSandboxSrcDoc(doc);
      setSandboxKey((k) => k + 1);
      setRuntimeErrors([]);
      setExecStatus('running');

      const startExecutionWatchdog = (expectedSession: string) => {
        if (watchdogTimerRef.current) {
          window.clearTimeout(watchdogTimerRef.current);
        }
        watchdogTimerRef.current = window.setTimeout(() => {
          if (sessionIdRef.current !== expectedSession) return;
          setExecStatus((curr) => {
            if (curr !== 'running') return curr;
            const nextRotated = sessionManagerRef.current.rotate();
            sessionIdRef.current = nextRotated.sessionId;
            pendingBridgeSrcDocRef.current = '';
            setSessionId(nextRotated.sessionId);
            setSandboxSrcDoc('');
            setSandboxKey((k) => k + 1);
            setRuntimeErrors((errs) => [
              ...errs.slice(0, LAB_SECURITY_LIMITS.MAX_RUNTIME_ERRORS - 1),
              {
                message: `[Watchdog Timeout] 沙盒执行超过 ${LAB_SECURITY_LIMITS.DEFAULT_EXECUTION_TIMEOUT_MS}ms 未完成，已自动销毁隔离沙盒。`,
                timestamp: Date.now(),
              },
            ]);
            setActiveBottomTab('errors');
            return 'error';
          });
        }, LAB_SECURITY_LIMITS.DEFAULT_EXECUTION_TIMEOUT_MS);
      };

      const extOrigin =
        liveResolution.enabled &&
        liveResolution.origin &&
        (activeSourceKind !== 'official' || !bridgeFallbackForcedRef.current)
          ? liveResolution.origin
          : null;

      if (extOrigin) {
        bridgeHandshakeTimerRef.current = window.setTimeout(() => {
          if (!bridgeReadyAckRef.current && sessionIdRef.current === rotated.sessionId) {
            if (activeSourceKind !== 'official') {
              clearTimers();
              const nextRotated = sessionManagerRef.current.rotate();
              sessionIdRef.current = nextRotated.sessionId;
              pendingBridgeSrcDocRef.current = '';
              setSessionId(nextRotated.sessionId);
              setSandboxSrcDoc('');
              setSandboxKey((k) => k + 1);
              const failMsg = `[Sandbox Fail-Closed] 独立跨站沙盒 (${extOrigin}) 握手超时。代码已安全阻断。`;
              setFailClosedReason(failMsg);
              setRuntimeErrors([{ message: failMsg, timestamp: Date.now() }]);
              setExecStatus('error');
              setActiveBottomTab('errors');
              showToast('独立跨站沙盒连接超时，外部代码已按安全策略失败关闭');
              return;
            }

            bridgeFallbackForcedRef.current = true;
            setBridgeFallbackForced(true);
            setConsoleEntries((prev) => [
              ...prev,
              {
                id: `fallback-${Date.now()}`,
                level: 'warn',
                args: [`[Sandbox Fallback] 跨站沙盒握手超时，官方实验已回退至本地 opaque srcdoc 模式。`],
                timestamp: Date.now(),
              },
            ]);
            showToast('提示：跨站沙盒暂不可达，官方实验已回退至本地 Opaque srcdoc 隔离模式');
            setSandboxKey((k) => k + 1);
            startExecutionWatchdog(rotated.sessionId);
          }
        }, BRIDGE_HANDSHAKE_TIMEOUT_MS);
      }

      startExecutionWatchdog(rotated.sessionId);
    },
    [clearTimers, externalSandboxOrigin, showToast]
  );

  // 终止沙盒
  const terminateSandbox = useCallback(() => {
    clearTimers();
    const rotated = sessionManagerRef.current.rotate();
    sessionIdRef.current = rotated.sessionId;
    pendingBridgeSrcDocRef.current = '';
    setSessionId(rotated.sessionId);
    setSandboxSrcDoc('');
    setSandboxKey((k) => k + 1);
    setExecStatus('terminated');
    showToast(tr('已终止沙盒运行并回收实例资源', '已終止沙盒執行並回收實例資源'));
  }, [clearTimers, showToast, tr]);

  // postMessage 监听与防洪断路器
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleMessage = (event: MessageEvent) => {
      const expectedWin = iframeRef.current?.contentWindow || null;
      const isCrossOriginMode =
        isolationModeRef.current === 'cross-origin' && Boolean(activeExternalOriginRef.current);
      const strictOrigins = isCrossOriginMode
        ? [activeExternalOriginRef.current as string]
        : ['null'];

      const verification = SandboxMessageParser.parse(event, {
        expectedSource: expectedWin,
        expectedSessionId: sessionIdRef.current,
        strictOrigins,
        allowBridgeInitSession: isCrossOriginMode,
      });

      if (!verification.valid || !verification.message) return;

      const msg = verification.message;

      if (msg.type === 'SANDBOX_BRIDGE_READY') {
        bridgeReadyAckRef.current = true;
        if (bridgeHandshakeTimerRef.current) {
          window.clearTimeout(bridgeHandshakeTimerRef.current);
          bridgeHandshakeTimerRef.current = null;
        }
        dispatchBridgeExecute();
        return;
      }

      inboundMsgCountRef.current += 1;
      if (inboundMsgCountRef.current > LAB_SECURITY_LIMITS.MAX_HOST_INBOUND_MESSAGES) {
        clearTimers();
        const rotated = sessionManagerRef.current.rotate();
        sessionIdRef.current = rotated.sessionId;
        pendingBridgeSrcDocRef.current = '';
        setSessionId(rotated.sessionId);
        setSandboxSrcDoc('');
        setSandboxKey((k) => k + 1);
        setExecStatus('terminated');
        setRuntimeErrors((prev) => [
          ...prev.slice(0, LAB_SECURITY_LIMITS.MAX_RUNTIME_ERRORS - 1),
          {
            message: `[Flood Circuit Breaker] 检测到沙盒高频消息洪泛，已自动销毁沙盒实例。`,
            timestamp: Date.now(),
          },
        ]);
        setActiveBottomTab('errors');
        return;
      }

      if (msg.type === 'SANDBOX_READY') {
        bridgeReadyAckRef.current = true;
        if (bridgeHandshakeTimerRef.current) {
          window.clearTimeout(bridgeHandshakeTimerRef.current);
          bridgeHandshakeTimerRef.current = null;
        }
        return;
      }

      if (msg.type === 'CONSOLE_EVENT' && msg.payload) {
        const entry: SandboxConsoleEntry = {
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          level: msg.payload.level || 'log',
          args: msg.payload.args || [],
          timestamp: Date.now(),
        };
        setConsoleEntries((prev) => {
          if (prev.length >= LAB_SECURITY_LIMITS.MAX_CONSOLE_ENTRIES) return prev;
          return [...prev, entry];
        });
      } else if (msg.type === 'RUNTIME_ERROR' && msg.payload?.error) {
        if (watchdogTimerRef.current) {
          window.clearTimeout(watchdogTimerRef.current);
          watchdogTimerRef.current = null;
        }
        const errItem: SandboxRuntimeError = {
          message: msg.payload.error.message,
          line: msg.payload.error.line,
          column: msg.payload.error.column,
          stack: msg.payload.error.stack,
          timestamp: Date.now(),
        };
        setRuntimeErrors((prev) => {
          if (prev.length >= LAB_SECURITY_LIMITS.MAX_RUNTIME_ERRORS) return prev;
          return [...prev, errItem];
        });
        setExecStatus('error');
        setActiveBottomTab('errors');
      } else if (msg.type === 'EXECUTION_COMPLETE') {
        if (watchdogTimerRef.current) {
          window.clearTimeout(watchdogTimerRef.current);
          watchdogTimerRef.current = null;
        }
        setLastDurationMs(msg.payload?.durationMs ?? 0);
        setExecStatus((prev) => (prev === 'error' ? 'error' : 'completed'));
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [clearTimers, dispatchBridgeExecute]);

  // 页面离开时终止
  useEffect(() => {
    return () => {
      clearTimers();
      sessionManagerRef.current.dispose();
    };
  }, [clearTimers]);

  // 切换实验
  const handleSelectExperiment = (slug: string) => {
    const found = getExperimentBySlug(slug);
    if (!found) return;
    const expSourceKind = ExecutionPolicy.resolveSourceKind(found.author);
    setSelectedSlug(found.slug);
    setCurrentExp(found);
    const cloned = found.files.map((f) => ({ ...f }));
    setFiles(cloned);
    setActiveFileIdx(0);
    codeSourceKindRef.current = expSourceKind;
    setCodeSourceKind(expSourceKind);
    setFailClosedReason('');

    if (mode === 'full-workshop' && typeof window !== 'undefined') {
      const nextUrl = `${window.location.pathname}?slug=${encodeURIComponent(found.slug)}`;
      window.history.pushState({ slug: found.slug }, '', nextUrl);
    }

    if (expSourceKind === 'official' && found.previewConfig.autoRun) {
      executeInSandbox(cloned, undefined, 'official');
    } else {
      clearTimers();
      pendingBridgeSrcDocRef.current = '';
      setSandboxSrcDoc('');
      setExecStatus('idle');
    }
  };

  const handleCodeChange = (newContent: string) => {
    setFiles((prev) =>
      prev.map((file, idx) => (idx === activeFileIdx ? { ...file, content: newContent } : file))
    );
  };

  const handleResetCode = () => {
    const expSourceKind = ExecutionPolicy.resolveSourceKind(currentExp.author);
    const fresh = currentExp.files.map((f) => ({ ...f }));
    setFiles(fresh);
    setActiveFileIdx(0);
    codeSourceKindRef.current = expSourceKind;
    setCodeSourceKind(expSourceKind);
    setFailClosedReason('');
    if (expSourceKind === 'official') {
      executeInSandbox(fresh, undefined, 'official');
    } else {
      clearTimers();
      pendingBridgeSrcDocRef.current = '';
      setSandboxSrcDoc('');
      setExecStatus('idle');
    }
    showToast(tr('已恢复初始实验源码并重新构建沙盒', '已恢復初始實驗原始碼並重新建構沙盒'));
  };

  const handleCopyCode = async () => {
    const activeFile = files[activeFileIdx];
    if (!activeFile) return;
    try {
      await navigator.clipboard.writeText(activeFile.content);
      showToast(tr(`已复制 ${activeFile.name} 源码到剪贴板`, `已複製 ${activeFile.name} 原始碼到剪貼簿`));
    } catch {
      showToast(tr('复制失败，请手动全选复制', '複製失敗，請手動全選複製'));
    }
  };

  const handleSaveDraft = () => {
    try {
      const bundle = {
        version: 'lab-bundle-v1',
        slug: currentExp.slug,
        title: currentExp.title,
        description: currentExp.description,
        files,
        exportedAt: new Date().toISOString(),
        draftOriginKind: codeSourceKind,
      };
      window.localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(bundle));
      showToast(tr('草稿已安全保存至浏览器本地存储', '草稿已安全儲存至瀏覽器本機儲存'));
    } catch {
      showToast(tr('保存草稿失败', '儲存草稿失敗'));
    }
  };

  const handleLoadDraft = () => {
    try {
      const raw = window.localStorage.getItem(DRAFT_STORAGE_KEY);
      if (!raw) {
        showToast(tr('当前尚无保存的本地草稿', '目前尚無儲存的本機草稿'));
        return;
      }
      const parsed = JSON.parse(raw);
      const validated = validateLabPortableBundle(parsed);
      if (!validated.ok || !validated.data) {
        showToast('草稿校验失败');
        return;
      }
      const isExactOfficial =
        parsed.draftOriginKind === 'official' &&
        ExecutionPolicy.isUnmodifiedOfficialPreset(parsed.slug, validated.data.files);
      const restoredKind: LabCodeSourceKind = isExactOfficial ? 'official' : 'imported';
      clearTimers();
      pendingBridgeSrcDocRef.current = '';
      codeSourceKindRef.current = restoredKind;
      setCodeSourceKind(restoredKind);
      setFailClosedReason('');
      setSandboxSrcDoc('');
      setExecStatus('idle');
      setFiles(validated.data.files);
      setActiveFileIdx(0);
      showToast(tr('已恢复本地草稿', '已恢復本機草稿'));
    } catch {
      showToast(tr('读取本地草稿失败', '讀取本機草稿失敗'));
    }
  };

  // URL Hash (#bundle=) 与 initialSlug 初始化检测
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const hash = window.location.hash;
    if (hash.startsWith('#bundle=')) {
      const payloadStr = hash.slice('#bundle='.length);
      const decoded = PortableBundleCodec.decode<Record<string, unknown>>(payloadStr);
      if (decoded) {
        const validated = validateLabPortableBundle(decoded);
        if (validated.ok && validated.data) {
          clearTimers();
          pendingBridgeSrcDocRef.current = '';
          codeSourceKindRef.current = 'bundle';
          setCodeSourceKind('bundle');
          setFailClosedReason('');
          setSandboxSrcDoc('');
          setExecStatus('idle');
          setFiles(validated.data.files);
          setActiveFileIdx(0);
          showToast(tr('已加载 URL 分享实验包（受 Fail-Closed 保护）', '已載入 URL 分享實驗包（受 Fail-Closed 保護）'));
          return;
        }
      }
    }

    if (codeSourceKind === 'official' && defaultExp.previewConfig.autoRun) {
      executeInSandbox(files, undefined, 'official');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <LabPlaygroundShell
      mode={mode}
      toastMessage={toastMessage}
      showTracePanel={Boolean(currentExp.visualizationConfig?.enabled)}
      toolbarProps={{
        currentExp,
        selectedSlug,
        codeSourceKind,
        execStatus,
        isHant,
        onSelectExperiment: handleSelectExperiment,
        onRun: () => executeInSandbox(files),
        onStop: terminateSandbox,
        onReset: handleResetCode,
        onOpenShareModal: () => setDialogState({ isOpen: true, mode: 'share' }),
        onOpenImportExportModal: () => setDialogState({ isOpen: true, mode: 'import-export' }),
        onSaveDraft: handleSaveDraft,
        onLoadDraft: handleLoadDraft,
      }}
      editorProps={{
        files,
        activeFileIdx,
        onSelectFile: setActiveFileIdx,
        onCodeChange: handleCodeChange,
        onCopyCode: handleCopyCode,
        isHant,
      }}
      previewProps={{
        iframeRef,
        sandboxSrcDoc,
        sandboxKey,
        isolationMode,
        isCrossOriginMode: Boolean(activeExternalOrigin),
        activeExternalOrigin,
        bridgeReadyAck: bridgeReadyAckRef.current,
        failClosedReason,
        execStatus,
        onRetryCrossOrigin: () => executeInSandbox(files),
        onRestart: () => executeInSandbox(files),
        isHant,
      }}
      consoleProps={{
        activeBottomTab,
        setActiveBottomTab,
        consoleEntries,
        runtimeErrors,
        onClearConsole: () => setConsoleEntries([]),
        showTraceTab: Boolean(currentExp.visualizationConfig?.enabled),
        isHant,
      }}
      securityProps={{
        isolationMode,
        codeSourceKind,
        activeExternalOrigin,
        sessionId,
        isHant,
      }}
      dialogProps={{
        isOpen: dialogState.isOpen,
        onClose: () => setDialogState({ isOpen: false, mode: 'share' }),
        mode: dialogState.mode,
        currentExp,
        files,
        onImportFiles: (newFiles) => {
          setFiles(newFiles);
          setActiveFileIdx(0);
          codeSourceKindRef.current = 'imported';
          setCodeSourceKind('imported');
          setFailClosedReason('');
          clearTimers();
          setSandboxSrcDoc('');
          setExecStatus('idle');
        },
        showToast,
        isHant,
      }}
    />
  );
}
