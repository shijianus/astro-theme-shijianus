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
  evaluateSandboxDegradationPolicy,
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
  const trRef = useRef(tr);
  trRef.current = tr;

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
  const [hasMounted, setHasMounted] = useState<boolean>(false);

  useEffect(() => {
    setHasMounted(true);
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

  const degradationPolicy = useMemo(
    () => evaluateSandboxDegradationPolicy(codeSourceKind, Boolean(activeExternalOrigin)),
    [codeSourceKind, activeExternalOrigin]
  );

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
  const [activeBottomTab, setActiveBottomTab] = useState<'console' | 'errors' | 'security'>(
    'console'
  );
  const [toastMessage, setToastMessage] = useState<string>('');
  const [isFullscreenPreview, setIsFullscreenPreview] = useState<boolean>(false);
  const [showTracePanel, setShowTracePanel] = useState<boolean>(
    mode === 'full-workshop' ? Boolean(defaultExp.visualizationConfig?.enabled) : false
  );

  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
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

  // 全屏预览支持 Escape 键退出
  useEffect(() => {
    if (!isFullscreenPreview || typeof window === 'undefined') return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        setIsFullscreenPreview(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isFullscreenPreview]);

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

  const handleBridgeIframeLoad = useCallback(() => {
    if (isolationModeRef.current !== 'cross-origin') return;
    const sendPing = () => {
      if (bridgeReadyAckRef.current || isolationModeRef.current !== 'cross-origin') {
        if (bridgePingIntervalRef.current) {
          window.clearInterval(bridgePingIntervalRef.current);
          bridgePingIntervalRef.current = null;
        }
        return;
      }
      const extOrigin = activeExternalOriginRef.current;
      const win = iframeRef.current?.contentWindow;
      if (!extOrigin || !win) return;
      try {
        win.postMessage(
          {
            protocol: LAB_SANDBOX_PROTOCOL_VERSION,
            sessionId: sessionIdRef.current,
            type: 'PING',
            payload: {},
          },
          extOrigin
        );
      } catch {
        // Handshake timeout will handle fallback
      }
    };
    sendPing();
    if (bridgePingIntervalRef.current) {
      window.clearInterval(bridgePingIntervalRef.current);
    }
    bridgePingIntervalRef.current = window.setInterval(sendPing, 300);
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

  const handleExportJson = () => {
    const jsonStr = PortableBundleCodec.exportToJson({
      slug: currentExp.slug,
      title: currentExp.title,
      description: currentExp.description,
      category: currentExp.category,
      language: currentExp.language,
      files,
      sourceKind: codeSourceKind,
    });
    const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentExp.slug}-lab.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    showToast(tr(`已导出实验包 ${currentExp.slug}-lab.json`, `已匯出實驗包 ${currentExp.slug}-lab.json`));
  };

  const handleImportJsonFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputEl = e.currentTarget;
    const file = inputEl.files?.[0];
    if (!file) return;
    if (file.size > LAB_SECURITY_LIMITS.MAX_TOTAL_SOURCE_BYTES * 2) {
      showToast(tr('导入失败：JSON 文件体积超过安全限制 (256KB)', '匯入失敗：JSON 檔案大小超過安全限制 (256KB)'));
      inputEl.value = '';
      return;
    }

    const readPromise =
      typeof file.text === 'function'
        ? file.text()
        : new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(String(reader.result || ''));
            reader.onerror = () => reject(reader.error || new Error('Read failed'));
            reader.readAsText(file);
          });

    void readPromise
      .then((rawText) => {
        try {
          const validated = PortableBundleCodec.importFromJson(rawText);
          if (!validated.ok || !validated.data) {
            showToast(tr(`导入校验拒绝: ${validated.errors.join('；')}`, `匯入校驗拒絕: ${validated.errors.join('；')}`));
            return;
          }
          const importedKind: LabCodeSourceKind = validated.data.sourceKind || 'imported';
          clearTimers();
          const rotatedId = sessionManagerRef.current.rotateSessionId();
          sessionIdRef.current = rotatedId;
          pendingBridgeSrcDocRef.current = '';
          codeSourceKindRef.current = importedKind;
          setSessionId(rotatedId);
          setFiles(validated.data.files);
          setActiveFileIdx(0);
          setCodeSourceKind(importedKind);
          setFailClosedReason('');
          setSandboxSrcDoc('');
          setExecStatus('idle');
          showToast(tr('实验导入成功！出于安全隔离策略，请审阅代码后手动点击「运行代码」', '實驗匯入成功！出於安全隔離策略，請審閱程式碼後手動點擊「執行程式碼」'));
        } catch {
          showToast(tr('导入失败：无效的 JSON 文件格式', '匯入失敗：無效的 JSON 檔案格式'));
        }
      })
      .catch(() => {
        showToast(tr('导入失败：读取文件异常', '匯入失敗：讀取檔案異常'));
      })
      .finally(() => {
        inputEl.value = '';
      });
  };

  const handleShareLink = async () => {
    const validation = validateLabFiles(files);
    if (!validation.ok) {
      showToast(`无法分享：${validation.errors[0]}`);
      return;
    }
    const bundle = {
      version: 'lab-bundle-v1',
      slug: currentExp.slug,
      title: currentExp.title,
      description: currentExp.description,
      category: currentExp.category,
      language: currentExp.language,
      files,
      exportedAt: new Date().toISOString(),
      sourceKind: 'bundle',
    };
    const sharePayload = PortableBundleCodec.encode(bundle);
    const shareUrl = typeof window !== 'undefined'
      ? `${window.location.origin}${window.location.pathname}#bundle=${sharePayload}`
      : '';
    try {
      await navigator.clipboard.writeText(shareUrl);
      showToast(tr('已复制安全分享链接到剪贴板', '已複製安全分享連結到剪貼簿'));
    } catch {
      if (typeof window !== 'undefined') {
        window.location.hash = `bundle=${sharePayload}`;
      }
      showToast(tr('已在地址栏更新安全分享链接', '已在網址列更新安全分享連結'));
    }
  };

  // 初次挂载、hashchange 与浏览器前进/后退 (popstate) 监听
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const applyHashBundle = (): boolean => {
      const hash = window.location.hash;
      if (hash.startsWith('#bundle=')) {
        const rawEncoded = hash.slice('#bundle='.length);
        const decoded = PortableBundleCodec.decode<Record<string, unknown>>(rawEncoded);
        const validated = validateLabPortableBundle(decoded);
        clearTimers();
        const rotatedId = sessionManagerRef.current.rotateSessionId();
        sessionIdRef.current = rotatedId;
        pendingBridgeSrcDocRef.current = '';
        codeSourceKindRef.current = 'bundle';
        setSessionId(rotatedId);
        setCodeSourceKind('bundle');
        setSandboxSrcDoc('');
        setSandboxKey((k) => k + 1);

        if (validated.ok && validated.data) {
          const bundle = validated.data;
          setFiles(bundle.files);
          setActiveFileIdx(0);
          setFailClosedReason('');
          setRuntimeErrors([]);
          setExecStatus('idle');
          showToast(
            trRef.current(
              '已加载外部分享代码（禁止自动运行，仅允许在独立跨站沙盒就绪时手动运行）',
              '已載入外部分享程式碼（禁止自動執行，僅允許在獨立跨站沙盒就緒時手動執行）'
            )
          );
          return true;
        }

        // 损坏、超限或非法的 #bundle= 载荷必须强制失败关闭 (Fail-Closed)，严禁回退自动运行默认官方实验
        const reasonDetail =
          decoded === null
            ? 'Base64URL 解码失败或载荷体积超过安全上限'
            : validated.errors.join(' ') || 'Schema 校验未通过';
        const failMsg = `[Bundle Fail-Closed] 外部分享链接 (#bundle=) 校验未通过（${reasonDetail}）。安全策略已阻断加载并禁止回退自动运行其他实验。`;
        setFailClosedReason(failMsg);
        setRuntimeErrors([{ message: failMsg, timestamp: Date.now() }]);
        setExecStatus('error');
        setActiveBottomTab('errors');
        showToast(
          trRef.current(
            '安全阻断：外部分享链接载荷无效或超限，已强制失败关闭',
            '安全阻斷：外部分享連結酬載無效或超限，已強制失敗關閉'
          )
        );
        return true;
      }
      return false;
    };

    const syncFromUrlQuery = () => {
      if (applyHashBundle()) return;
      const params = new URLSearchParams(window.location.search);
      const querySlug = params.get('slug');
      const targetExp = (querySlug && getExperimentBySlug(querySlug)) || defaultExp;
      const expSourceKind = ExecutionPolicy.resolveSourceKind(targetExp.author);

      setSelectedSlug(targetExp.slug);
      setCurrentExp(targetExp);
      const cloned = targetExp.files.map((f) => ({ ...f }));
      setFiles(cloned);
      setActiveFileIdx(0);
      codeSourceKindRef.current = expSourceKind;
      setCodeSourceKind(expSourceKind);
      setFailClosedReason('');
      setShowTracePanel(
        mode === 'full-workshop' ? Boolean(targetExp.visualizationConfig?.enabled) : false
      );
      if (expSourceKind === 'official' && targetExp.previewConfig.autoRun) {
        executeInSandbox(cloned, undefined, 'official');
      } else {
        pendingBridgeSrcDocRef.current = '';
        setSandboxSrcDoc('');
        setExecStatus('idle');
      }
    };

    syncFromUrlQuery();
    window.addEventListener('hashchange', applyHashBundle);
    window.addEventListener('popstate', syncFromUrlQuery);
    return () => {
      window.removeEventListener('hashchange', applyHashBundle);
      window.removeEventListener('popstate', syncFromUrlQuery);
    };
  }, [clearTimers, defaultExp, executeInSandbox, mode]);

  const effectiveIsolationMode =
    degradationPolicy.effectiveMode === 'blocked-fail-closed'
      ? 'fail-closed'
      : isolationMode;

  return (
    <LabPlaygroundShell
      mode={mode}
      execStatus={execStatus}
      effectiveIsolationMode={effectiveIsolationMode}
      codeSourceKind={codeSourceKind}
      failClosedReason={failClosedReason}
      toastMessage={toastMessage}
      hasMounted={hasMounted}
      isolationMode={isolationMode}
      bridgeFallbackForced={bridgeFallbackForced}
      externalResolutionEnabled={Boolean(externalResolution.enabled)}
      showTracePanel={showTracePanel}
      isHant={isHant}
      onRetryCrossOriginSandbox={() => executeInSandbox(files)}
      toolbarProps={{
        mode,
        currentExp,
        selectedSlug,
        codeSourceKind,
        isolationMode,
        degradationPolicy,
        activeExternalOrigin,
        execStatus,
        isHant,
        fileInputRef,
        onSelectExperiment: handleSelectExperiment,
        onRun: () => executeInSandbox(files),
        onStop: terminateSandbox,
        onReset: handleResetCode,
        onCopyCode: handleCopyCode,
        onSaveDraft: handleSaveDraft,
        onLoadDraft: handleLoadDraft,
        onExportJson: handleExportJson,
        onImportJsonFile: handleImportJsonFile,
        onShareLink: handleShareLink,
      }}
      editorProps={{
        files,
        activeFileIdx,
        livecodesAppUrl,
        isHant,
        onSelectFile: setActiveFileIdx,
        onCodeChange: handleCodeChange,
        onRunCode: () => executeInSandbox(files),
      }}
      previewProps={{
        currentExp,
        files,
        sessionId,
        sandboxSrcDoc,
        sandboxKey,
        isolationMode,
        activeExternalOrigin,
        codeSourceKind,
        execStatus,
        lastDurationMs,
        failClosedReason,
        isFullscreenPreview,
        showTracePanel,
        activeBottomTab,
        consoleEntries,
        runtimeErrors,
        iframeRef,
        isHant,
        onToggleFullscreen: () => setIsFullscreenPreview((v) => !v),
        onToggleTracePanel: () => setShowTracePanel((v) => !v),
        onBridgeIframeLoad: handleBridgeIframeLoad,
        onRunCode: () => executeInSandbox(files),
        onSetActiveBottomTab: setActiveBottomTab,
        onClearConsole: () => {
          setConsoleEntries([]);
          setRuntimeErrors([]);
        },
      }}
    />
  );
}
