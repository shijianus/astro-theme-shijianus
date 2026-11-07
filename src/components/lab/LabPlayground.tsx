import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  type LabExperiment,
  type LabFile,
  LAB_SECURITY_LIMITS,
  getUtf8ByteLength,
  validateLabFiles,
  validateLabPortableBundle,
} from '../../lib/lab-schema';
import {
  type LabCodeSourceKind,
  type SandboxConsoleEntry,
  type SandboxIsolationMode,
  type SandboxRuntimeError,
  LAB_SANDBOX_PROTOCOL_VERSION,
  createSandboxSessionId,
  verifySandboxMessage,
  compileExperimentFiles,
  buildIsolatedSandboxSrcDoc,
  resolveSafeExternalSandboxOrigin,
  resolveExperimentSourceKind,
  evaluateSandboxDegradationPolicy,
} from '../../lib/lab-sandbox-protocol';
import { OFFICIAL_LAB_EXPERIMENTS, getExperimentBySlug } from '../../data/lab-experiments';
import { ExecutionVisualizer } from './ExecutionVisualizer';

interface LabPlaygroundProps {
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

function encodeSharePayload(bundle: unknown): string {
  try {
    const json = JSON.stringify(bundle);
    const bytes = new TextEncoder().encode(json);
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  } catch {
    return '';
  }
}

function decodeSharePayload(encoded: string): unknown | null {
  try {
    const base64 = encoded.replace(/-/g, '+').replace(/_/g, '/');
    const pad = base64.length % 4 === 0 ? '' : '='.repeat(4 - (base64.length % 4));
    const binary = atob(base64 + pad);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    const json = new TextDecoder().decode(bytes);
    return JSON.parse(json);
  } catch {
    return null;
  }
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

  // 校验独立跨站沙盒 Origin，并实施分级降级策略：
  // - official 官方实验：允许在明确提示后回退至本地 opaque srcdoc
  // - imported / community / bundle 代码：独立跨站沙盒不可用时必须失败关闭 (Fail-Closed)，严禁自动运行或回退至本地 srcdoc
  const [codeSourceKind, setCodeSourceKind] = useState<LabCodeSourceKind>(() =>
    resolveExperimentSourceKind(defaultExp.author)
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

  // 安全状态与沙盒会话控制
  const [sessionId, setSessionId] = useState<string>(() => createSandboxSessionId());
  const [sandboxKey, setSandboxKey] = useState<number>(1);
  const [sandboxSrcDoc, setSandboxSrcDoc] = useState<string>('');
  const [execStatus, setExecStatus] = useState<
    'idle' | 'running' | 'completed' | 'error' | 'terminated'
  >('idle');
  const [lastDurationMs, setLastDurationMs] = useState<number | null>(null);

  // Console 与错误面板状态
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
  const [themeMode, setThemeMode] = useState<'light' | 'dark'>(() => readCurrentThemeMode());

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

  // 同步 UI 简繁语言 (`shijianus:localechange`)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const syncLocale = () => setUiLocale(readCurrentUiLocale());
    syncLocale();
    window.addEventListener('shijianus:localechange', syncLocale as EventListener);
    return () => {
      window.removeEventListener('shijianus:localechange', syncLocale as EventListener);
    };
  }, []);

  // 同步宿主深浅色模式，并实时通知已运行的隔离沙盒
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const detectTheme = () => {
      const next = readCurrentThemeMode();
      setThemeMode(next);
      const win = iframeRef.current?.contentWindow;
      if (win) {
        const isCrossOrigin =
          isolationModeRef.current === 'cross-origin' && Boolean(activeExternalOriginRef.current);
        if (isCrossOrigin && !bridgeReadyAckRef.current) {
          return;
        }
        const target = isCrossOrigin ? (activeExternalOriginRef.current as string) : '*';
        try {
          win.postMessage(
            {
              protocol: LAB_SANDBOX_PROTOCOL_VERSION,
              sessionId: sessionIdRef.current,
              type: 'SET_THEME',
              payload: { theme: next },
            },
            target
          );
        } catch {
          // ignore cross-frame post errors when frame is unmounted
        }
      }
    };
    detectTheme();
    const obs = new MutationObserver(detectTheme);
    obs.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    });
    return () => obs.disconnect();
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

  // 执行代码：重建隔离沙盒上下文并生成新的 Session ID
  const executeInSandbox = useCallback(
    (
      targetFiles: LabFile[],
      themeOverride?: 'light' | 'dark',
      sourceKindOverride?: LabCodeSourceKind
    ) => {
      const activeSourceKind = sourceKindOverride ?? codeSourceKindRef.current;
      const runtimeHostOrigin =
        typeof window !== 'undefined' ? window.location.origin : null;
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

      const nextSessionId = createSandboxSessionId();
      sessionIdRef.current = nextSessionId;
      inboundMsgCountRef.current = 0;
      bridgeCodeDispatchedWinRef.current = null;
      bridgeReadyAckRef.current = false;

      setSessionId(nextSessionId);
      setConsoleEntries([]);
      setLastDurationMs(null);

      // 非官方代码 (imported / community / bundle)：独立跨站沙盒不可用时必须失败关闭 (Fail-Closed)
      if (activeSourceKind !== 'official') {
        if (!liveResolution.enabled || !liveResolution.origin) {
          const reason = liveResolution.rejectedReason
            ? `独立跨站沙盒配置被拒绝 (${liveResolution.rejectedReason})`
            : '当前环境未配置独立跨站沙盒域名 (PUBLIC_LAB_SANDBOX_ORIGIN)';
          const failMsg = `[Sandbox Fail-Closed] 安全阻断：当前代码来源为 "${activeSourceKind}"（外部导入 / 社区 / 分享链接），${reason}。系统严禁非官方代码回退至本地 opaque srcdoc 沙盒，已强制失败关闭。`;
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
        sessionId: nextSessionId,
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
            const rotatedId = createSandboxSessionId();
            sessionIdRef.current = rotatedId;
            pendingBridgeSrcDocRef.current = '';
            setSessionId(rotatedId);
            setSandboxSrcDoc('');
            setSandboxKey((k) => k + 1);
            setRuntimeErrors((errs) => [
              ...errs.slice(0, LAB_SECURITY_LIMITS.MAX_RUNTIME_ERRORS - 1),
              {
                message: `[Watchdog Timeout] 沙盒初始化同步执行超过 ${LAB_SECURITY_LIMITS.DEFAULT_EXECUTION_TIMEOUT_MS}ms 未完成，已自动销毁并回收隔离沙盒实例。`,
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
          if (!bridgeReadyAckRef.current && sessionIdRef.current === nextSessionId) {
            if (activeSourceKind !== 'official') {
              // 外部 / 社区 / #bundle= 代码在跨站沙盒不可达或握手超时时必须立即失败关闭
              clearTimers();
              const rotatedId = createSandboxSessionId();
              sessionIdRef.current = rotatedId;
              pendingBridgeSrcDocRef.current = '';
              setSessionId(rotatedId);
              setSandboxSrcDoc('');
              setSandboxKey((k) => k + 1);
              const failMsg = `[Sandbox Fail-Closed] 独立跨站沙盒 (${extOrigin}) 不可达或握手超时 (${BRIDGE_HANDSHAKE_TIMEOUT_MS}ms)。由于当前代码来源为 "${activeSourceKind}"，安全策略禁止降级至本地 opaque srcdoc，已立即销毁沙盒并失败关闭。`;
              setFailClosedReason(failMsg);
              setRuntimeErrors([{ message: failMsg, timestamp: Date.now() }]);
              setExecStatus('error');
              setActiveBottomTab('errors');
              showToast('独立跨站沙盒连接失败，外部代码已按安全策略失败关闭');
              return;
            }

            // 官方实验：明确提示用户后回退至本地 opaque srcdoc 强隔离沙盒
            bridgeFallbackForcedRef.current = true;
            setBridgeFallbackForced(true);
            setConsoleEntries((prev) => [
              ...prev,
              {
                id: `fallback-${Date.now()}`,
                level: 'warn',
                args: [
                  `[Sandbox Fallback] 独立跨站沙盒 (${extOrigin}) 握手超时，官方实验已在明确提示后回退至本地 Opaque Origin (srcdoc) 强隔离沙盒执行。`,
                ],
                timestamp: Date.now(),
              },
            ]);
            showToast('提示：跨站沙盒暂不可达，官方实验已回退至本地 Opaque srcdoc 隔离模式');
            setSandboxKey((k) => k + 1);
            startExecutionWatchdog(nextSessionId);
          }
        }, BRIDGE_HANDSHAKE_TIMEOUT_MS);
      }

      startExecutionWatchdog(nextSessionId);
    },
    [clearTimers, externalSandboxOrigin, showToast]
  );

  // 终止并销毁当前沙盒上下文
  const terminateSandbox = useCallback(() => {
    clearTimers();
    const prevSessionId = sessionIdRef.current;
    if (
      isolationModeRef.current === 'cross-origin' &&
      bridgeReadyAckRef.current &&
      activeExternalOriginRef.current &&
      iframeRef.current?.contentWindow
    ) {
      try {
        iframeRef.current.contentWindow.postMessage(
          {
            protocol: LAB_SANDBOX_PROTOCOL_VERSION,
            sessionId: prevSessionId,
            type: 'TERMINATE_SESSION',
            payload: {},
          },
          activeExternalOriginRef.current
        );
      } catch {
        // ignore
      }
    }

    const nextSessionId = createSandboxSessionId();
    sessionIdRef.current = nextSessionId;
    pendingBridgeSrcDocRef.current = '';
    bridgeCodeDispatchedWinRef.current = null;
    bridgeReadyAckRef.current = false;
    inboundMsgCountRef.current = 0;

    setSessionId(nextSessionId);
    setSandboxSrcDoc('');
    setSandboxKey((k) => k + 1);
    setExecStatus('terminated');
    showToast(
      tr(
        '已强制终止沙盒运行上下文并释放 iframe 资源',
        '已強制終止沙盒執行環境並釋放 iframe 資源'
      )
    );
  }, [clearTimers, showToast, tr]);

  // 初次挂载、hashchange 与浏览器前进/后退 (popstate) 监听
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const applyHashBundle = (): boolean => {
      const hash = window.location.hash;
      if (hash.startsWith('#bundle=')) {
        const rawEncoded = hash.slice('#bundle='.length);
        const decoded = decodeSharePayload(rawEncoded);
        const validated = validateLabPortableBundle(decoded);
        if (validated.ok && validated.data) {
          const bundle = validated.data;
          clearTimers();
          const rotatedId = createSandboxSessionId();
          sessionIdRef.current = rotatedId;
          pendingBridgeSrcDocRef.current = '';
          codeSourceKindRef.current = 'bundle';
          setSessionId(rotatedId);
          setFiles(bundle.files);
          setActiveFileIdx(0);
          setCodeSourceKind('bundle');
          setFailClosedReason('');
          setSandboxSrcDoc('');
          setExecStatus('idle');
          showToast(
            '已加载外部分享代码（禁止自动运行，仅允许在独立跨站沙盒就绪时手动运行）'
          );
          return true;
        }
      }
      return false;
    };

    const syncFromUrlQuery = () => {
      if (applyHashBundle()) return;
      const params = new URLSearchParams(window.location.search);
      const querySlug = params.get('slug');
      const targetExp = (querySlug && getExperimentBySlug(querySlug)) || defaultExp;
      const expSourceKind = resolveExperimentSourceKind(targetExp.author);

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
  }, [clearTimers, defaultExp, executeInSandbox, mode, showToast]);

  // 监听并严格验证来自沙盒 iframe 的 postMessage（含高频消息洪泛熔断）
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleMessage = (event: MessageEvent) => {
      const expectedWin = iframeRef.current?.contentWindow ?? null;
      const isCrossOriginMode =
        isolationModeRef.current === 'cross-origin' && Boolean(activeExternalOriginRef.current);
      const strictOrigins = isCrossOriginMode
        ? [activeExternalOriginRef.current as string]
        : ['null'];

      const verification = verifySandboxMessage(event, {
        expectedSource: expectedWin,
        expectedSessionId: sessionIdRef.current,
        strictOrigins,
        allowBridgeInitSession: isCrossOriginMode,
      });

      if (!verification.valid || !verification.message) {
        return;
      }

      const msg = verification.message;

      if (msg.type === 'SANDBOX_BRIDGE_READY') {
        bridgeReadyAckRef.current = true;
        if (bridgeHandshakeTimerRef.current) {
          window.clearTimeout(bridgeHandshakeTimerRef.current);
          bridgeHandshakeTimerRef.current = null;
        }
        if (bridgePingIntervalRef.current) {
          window.clearInterval(bridgePingIntervalRef.current);
          bridgePingIntervalRef.current = null;
        }
        dispatchBridgeExecute();
        return;
      }

      // 高频 postMessage 洪泛断路器
      inboundMsgCountRef.current += 1;
      if (inboundMsgCountRef.current > LAB_SECURITY_LIMITS.MAX_HOST_INBOUND_MESSAGES) {
        clearTimers();
        const rotatedId = createSandboxSessionId();
        sessionIdRef.current = rotatedId;
        pendingBridgeSrcDocRef.current = '';
        setSessionId(rotatedId);
        setSandboxSrcDoc('');
        setSandboxKey((k) => k + 1);
        setExecStatus('terminated');
        setRuntimeErrors((prev) => [
          ...prev.slice(0, LAB_SECURITY_LIMITS.MAX_RUNTIME_ERRORS - 1),
          {
            message: `[Flood Circuit Breaker] 检测到沙盒高频消息洪泛 (>${LAB_SECURITY_LIMITS.MAX_HOST_INBOUND_MESSAGES} 条/会话)，已自动销毁沙盒实例以保护主站线程。`,
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
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [clearTimers, dispatchBridgeExecute]);

  // 组件卸载时清理所有定时器
  useEffect(() => {
    return () => {
      clearTimers();
      if (toastTimerRef.current) {
        window.clearTimeout(toastTimerRef.current);
      }
    };
  }, [clearTimers]);

  // 切换预设实验（同步更新地址栏 ?slug= 以支持刷新与前进/后退）
  const handleSelectExperiment = (slug: string) => {
    const found = getExperimentBySlug(slug);
    if (!found) return;
    const expSourceKind = resolveExperimentSourceKind(found.author);
    setSelectedSlug(found.slug);
    setCurrentExp(found);
    const cloned = found.files.map((f) => ({ ...f }));
    setFiles(cloned);
    setActiveFileIdx(0);
    codeSourceKindRef.current = expSourceKind;
    setCodeSourceKind(expSourceKind);
    setFailClosedReason('');
    setShowTracePanel(Boolean(found.visualizationConfig?.enabled));

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

  // 修改当前文件内容
  const handleCodeChange = (newContent: string) => {
    setFiles((prev) =>
      prev.map((file, idx) =>
        idx === activeFileIdx ? { ...file, content: newContent } : file
      )
    );
  };

  // 重置为当前实验初始代码
  const handleResetCode = () => {
    const expSourceKind = resolveExperimentSourceKind(currentExp.author);
    const fresh = currentExp.files.map((f) => ({ ...f }));
    setFiles(fresh);
    setActiveFileIdx(0);
    codeSourceKindRef.current = expSourceKind;
    setCodeSourceKind(expSourceKind);
    setFailClosedReason('');
    if (typeof window !== 'undefined' && window.location.hash.startsWith('#bundle=')) {
      window.history.replaceState(
        null,
        '',
        `${window.location.pathname}${window.location.search}`
      );
    }
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

  // 重试独立跨站沙盒连接
  const handleRetryCrossOriginSandbox = () => {
    bridgeFallbackForcedRef.current = false;
    setBridgeFallbackForced(false);
    setFailClosedReason('');
    executeInSandbox(files, undefined, codeSourceKindRef.current);
  };

  // 复制当前文件源码
  const handleCopyCode = async () => {
    const activeFile = files[activeFileIdx];
    if (!activeFile) return;
    try {
      await navigator.clipboard.writeText(activeFile.content);
      showToast(
        tr(
          `已复制 ${activeFile.name} 源码到剪贴板`,
          `已複製 ${activeFile.name} 原始碼到剪貼簿`
        )
      );
    } catch {
      showToast(tr('复制失败，请手动全选复制', '複製失敗，請手動全選複製'));
    }
  };

  // 保存本地草稿（保留来源等级，防止外部代码通过存取草稿洗白为 official）
  const handleSaveDraft = () => {
    try {
      const bundle = {
        version: 'lab-bundle-v1',
        slug: currentExp.slug,
        title: currentExp.title,
        description: currentExp.description,
        category: currentExp.category,
        language: currentExp.language,
        files,
        exportedAt: new Date().toISOString(),
        draftOriginKind: codeSourceKind,
        ...(codeSourceKind !== 'official' ? { sourceKind: codeSourceKind } : {}),
      };
      window.localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(bundle));
      showToast(tr('草稿已安全保存至浏览器本地存储', '草稿已安全儲存至瀏覽器本機儲存'));
    } catch {
      showToast(tr('保存草稿失败（存储空间受限）', '儲存草稿失敗（儲存空間受限）'));
    }
  };

  // 加载本地草稿（恢复原来源等级且绝不自动执行）
  const handleLoadDraft = () => {
    try {
      const raw = window.localStorage.getItem(DRAFT_STORAGE_KEY);
      if (!raw) {
        showToast(tr('当前尚无保存的本地草稿', '目前尚無儲存的本機草稿'));
        return;
      }
      const parsed = JSON.parse(raw) as Record<string, unknown>;
      const validated = validateLabPortableBundle(parsed);
      if (!validated.ok || !validated.data) {
        showToast(`草稿校验失败: ${validated.errors[0] || '格式错误'}`);
        return;
      }
      const restoredKind: LabCodeSourceKind =
        parsed.draftOriginKind === 'official'
          ? 'official'
          : (validated.data.sourceKind ?? 'imported');
      clearTimers();
      pendingBridgeSrcDocRef.current = '';
      codeSourceKindRef.current = restoredKind;
      setCodeSourceKind(restoredKind);
      setFailClosedReason('');
      setSandboxSrcDoc('');
      setExecStatus('idle');
      setFiles(validated.data.files);
      setActiveFileIdx(0);
      showToast(
        tr(
          '已恢复本地草稿，点击「运行代码」即可查看效果',
          '已恢復本機草稿，點擊「執行程式碼」即可查看效果'
        )
      );
    } catch {
      showToast(tr('读取本地草稿失败', '讀取本機草稿失敗'));
    }
  };

  // 导出实验 JSON
  const handleExportJson = () => {
    const bundle = {
      version: 'lab-bundle-v1',
      slug: currentExp.slug,
      title: currentExp.title,
      description: currentExp.description,
      category: currentExp.category,
      language: currentExp.language,
      files,
      exportedAt: new Date().toISOString(),
      ...(codeSourceKind === 'community' ? { sourceKind: 'community' } : {}),
    };
    const blob = new Blob([JSON.stringify(bundle, null, 2)], {
      type: 'application/json;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentExp.slug}-lab.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    showToast(`已导出实验包 ${currentExp.slug}-lab.json`);
  };

  // 导入实验 JSON（强制标记为 imported / community，禁用自动执行，跨站不可用时失败关闭）
  const handleImportJsonFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputEl = e.currentTarget;
    const file = inputEl.files?.[0];
    if (!file) return;
    if (file.size > LAB_SECURITY_LIMITS.MAX_TOTAL_SOURCE_BYTES * 2) {
      showToast('导入失败：JSON 文件体积超过安全限制 (256KB)');
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
          const parsed = JSON.parse(rawText || '{}');
          const validated = validateLabPortableBundle(parsed);
          if (!validated.ok || !validated.data) {
            showToast(`导入校验拒绝: ${validated.errors.join('；')}`);
            return;
          }
          const importedKind: LabCodeSourceKind = validated.data.sourceKind || 'imported';
          clearTimers();
          const rotatedId = createSandboxSessionId();
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
          showToast('实验导入成功！出于安全隔离策略，请审阅代码后手动点击「运行代码」');
        } catch {
          showToast('导入失败：无效的 JSON 文件格式');
        }
      })
      .catch(() => {
        showToast('导入失败：读取文件异常');
      })
      .finally(() => {
        inputEl.value = '';
      });
  };

  // 生成安全分享链接
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
    const encoded = encodeSharePayload(bundle);
    const shareUrl = `${window.location.origin}/lab/playground/?slug=${encodeURIComponent(
      currentExp.slug
    )}#bundle=${encoded}`;
    try {
      await navigator.clipboard.writeText(shareUrl);
      showToast('已生成安全分享链接并复制到剪贴板（接收方打开时默认手动运行）');
    } catch {
      window.location.hash = `bundle=${encoded}`;
      showToast('已在地址栏更新安全分享链接');
    }
  };

  const activeFile = files[activeFileIdx] || files[0];
  const totalBytes = useMemo(
    () => files.reduce((sum, f) => sum + getUtf8ByteLength(f.content), 0),
    [files]
  );

  return (
    <div
      id="lab-playground-workspace"
      className="lab-playground-root"
      data-mode={mode}
      data-exec-status={execStatus}
      data-isolation-mode={
        degradationPolicy.effectiveMode === 'blocked-fail-closed'
          ? 'fail-closed'
          : isolationMode
      }
      data-source-kind={codeSourceKind}
      data-fail-closed={failClosedReason ? 'true' : 'false'}
    >
      {/* 顶部反馈 Toast */}
      {toastMessage && (
        <div
          className="lab-toast"
          role="status"
          aria-live="polite"
          data-testid="lab-toast"
        >
          <span>🛡️ {toastMessage}</span>
        </div>
      )}

      {/* 1. 顶部工具栏：实验选择 + 运行/重置/停止/导入导出/分享 */}
      <div className="lab-pg-toolbar theme-card">
        <div className="lab-pg-toolbar__left">
          {mode === 'full-workshop' ? (
            <label className="lab-pg-selector-label">
              <span className="selector-tag">{tr('预设实验', '預設實驗')}</span>
              <select
                value={selectedSlug}
                onChange={(e) => handleSelectExperiment(e.target.value)}
                className="lab-pg-select"
                aria-label={tr('选择预设实验', '選擇預設實驗')}
                data-testid="playground-preset-select"
              >
                {OFFICIAL_LAB_EXPERIMENTS.map((exp) => (
                  <option key={exp.slug} value={exp.slug}>
                    {exp.icon} {exp.title}
                  </option>
                ))}
              </select>
            </label>
          ) : (
            <div className="lab-pg-exp-badge">
              <span className="exp-icon">{currentExp.icon}</span>
              <div>
                <strong>{currentExp.title}</strong>
                <small>
                  v{currentExp.version} · {tr('独立沙盒实时工坊', '獨立沙盒即時工坊')}
                </small>
              </div>
            </div>
          )}

          <div
            className="lab-security-pill"
            data-testid="lab-security-pill"
            title={
              isolationMode === 'cross-origin'
                ? `已连接独立跨站沙盒桥接器 (${activeExternalOrigin})，内层执行帧仍保持无 allow-same-origin 的 Opaque Origin 双重隔离`
                : degradationPolicy.effectiveMode === 'blocked-fail-closed'
                  ? '独立跨站沙盒当前不可用，外部导入/社区/分享代码已按安全门禁强制失败关闭 (Fail-Closed)'
                  : "当前官方预设运行在无 allow-same-origin 的 Opaque Origin (null) 回退沙盒中，且 CSP connect-src 'none' 阻断外发网络"
            }
          >
            <span className="sec-dot" />
            <span>
              {isolationMode === 'cross-origin'
                ? tr('Cross-Site + Opaque 双层沙盒', 'Cross-Site + Opaque 雙層沙盒')
                : degradationPolicy.effectiveMode === 'blocked-fail-closed'
                  ? tr('Fail-Closed · 跨站沙盒未就绪', 'Fail-Closed · 跨站沙盒未就緒')
                  : tr('Opaque Fallback · 官方本地隔离', 'Opaque Fallback · 官方本機隔離')}
            </span>
          </div>
        </div>

        <div className="lab-pg-toolbar__actions">
          <button
            type="button"
            onClick={() => executeInSandbox(files)}
            className="lab-pg-btn is-run"
            data-testid="btn-run-code"
            title={tr('在隔离沙盒中运行代码 (Ctrl/Cmd + Enter)', '在隔離沙盒中執行程式碼 (Ctrl/Cmd + Enter)')}
          >
            ▶ {tr('运行代码', '執行程式碼')}
          </button>
          <button
            type="button"
            onClick={terminateSandbox}
            className="lab-pg-btn is-danger"
            data-testid="btn-terminate-sandbox"
            title={tr('立即销毁沙盒 iframe 并释放执行上下文', '立即銷毀沙盒 iframe 並釋放執行環境')}
          >
            ⏹ {tr('停止', '停止')}
          </button>
          <button
            type="button"
            onClick={handleResetCode}
            className="lab-pg-btn"
            data-testid="btn-reset-code"
          >
            ↺ {tr('恢复初始', '恢復初始')}
          </button>
          <button
            type="button"
            onClick={handleCopyCode}
            className="lab-pg-btn"
            data-testid="btn-copy-code"
          >
            📋 {tr('复制源码', '複製原始碼')}
          </button>
          <button
            type="button"
            onClick={handleSaveDraft}
            className="lab-pg-btn"
            data-testid="btn-save-draft"
          >
            💾 {tr('存草稿', '存草稿')}
          </button>
          <button
            type="button"
            onClick={handleLoadDraft}
            className="lab-pg-btn"
            data-testid="btn-load-draft"
          >
            📂 {tr('读草稿', '讀草稿')}
          </button>
          <button
            type="button"
            onClick={handleExportJson}
            className="lab-pg-btn"
            data-testid="btn-export-json"
          >
            📤 {tr('导出', '匯出')}
          </button>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="lab-pg-btn"
            data-testid="btn-import-json"
          >
            📥 {tr('导入', '匯入')}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            onChange={handleImportJsonFile}
            tabIndex={-1}
            aria-hidden="true"
            style={{
              position: 'absolute',
              width: '1px',
              height: '1px',
              padding: 0,
              margin: '-1px',
              overflow: 'hidden',
              clip: 'rect(0, 0, 0, 0)',
              border: 0,
              opacity: 0,
              pointerEvents: 'none',
            }}
            data-testid="input-import-file"
          />
          <button
            type="button"
            onClick={handleShareLink}
            className="lab-pg-btn"
            data-testid="btn-share-link"
          >
            🔗 {tr('分享', '分享')}
          </button>
          <a
            href={`/lab/preview/${currentExp.slug}/`}
            className="lab-pg-btn"
            data-testid="link-standalone-preview"
          >
            ↗ {tr('独立预览页', '獨立預覽頁')}
          </a>
        </div>
      </div>

      {/* 失败关闭 (Fail-Closed) 强阻断安全横幅 */}
      {failClosedReason && (
        <div
          className="lab-fail-closed-banner"
          role="alert"
          data-testid="sandbox-fail-closed-banner"
        >
          <div className="lab-banner-content">
            <span>
              🛑 <strong>{tr('独立跨站沙盒不可用 · 已强制失败关闭 (Fail-Closed)', '獨立跨站沙盒不可用 · 已強制失敗關閉 (Fail-Closed)')}</strong>：
              {failClosedReason}
            </span>
            {externalResolution.enabled && (
              <button
                type="button"
                onClick={handleRetryCrossOriginSandbox}
                className="lab-pg-btn"
                data-testid="btn-retry-cross-origin"
              >
                🔄 {tr('重试跨站沙盒', '重試跨站沙盒')}
              </button>
            )}
          </div>
        </div>
      )}

      {/* 官方实验本地 Opaque srcdoc 降级明确提示横幅 */}
      {hasMounted && codeSourceKind === 'official' && isolationMode === 'opaque-srcdoc' && (
        <div
          className="lab-fallback-banner"
          role="status"
          aria-live="polite"
          data-testid="official-fallback-banner"
        >
          <div className="lab-banner-content">
            <span>
              ℹ️{' '}
              <strong>
                {tr(
                  '官方实验已回退至本地 Opaque srcdoc 隔离模式',
                  '官方實驗已回退至本機 Opaque srcdoc 隔離模式'
                )}
              </strong>
              ：
              {bridgeFallbackForced
                ? tr(
                    '独立跨站沙盒当前握手超时或不可达。因当前运行的是受审阅的官方预设实验，系统已在明确提示后安全回退至本地无 allow-same-origin 的 Opaque srcdoc 强隔离沙盒（外部/社区/分享代码在此状态下将被严格拦截）。',
                    '獨立跨站沙盒目前握手逾時或不可達。因目前執行的是受審閱的官方預設實驗，系統已在明確提示後安全回退至本機無 allow-same-origin 的 Opaque srcdoc 強隔離沙盒（外部/社群/分享程式碼在此狀態下將被嚴格攔截）。'
                  )
                : tr(
                    '当前环境未启用外部独立跨站沙盒域名，受审阅的官方预设实验运行于本地无 allow-same-origin 的 Opaque srcdoc 强隔离回退模式（外部/社区/分享代码在此环境下禁止运行并失败关闭）。',
                    '目前環境未啟用外部獨立跨站沙盒網域，受審閱的官方預設實驗執行於本機無 allow-same-origin 的 Opaque srcdoc 強隔離回退模式（外部/社群/分享程式碼在此環境下禁止執行並失敗關閉）。'
                  )}
            </span>
            {externalResolution.enabled && bridgeFallbackForced && (
              <button
                type="button"
                onClick={handleRetryCrossOriginSandbox}
                className="lab-pg-btn"
                data-testid="btn-retry-cross-origin"
              >
                🔄 {tr('重新连接跨站沙盒', '重新連線跨站沙盒')}
              </button>
            )}
          </div>
        </div>
      )}

      {/* 外部导入/社区/分享代码的零信任安全提醒横幅 */}
      {isUntrustedCode && (
        <div
          className="lab-untrusted-banner"
          role="alert"
          data-testid="untrusted-code-banner"
          data-source-kind={codeSourceKind}
        >
          <span>
            ⚠️ <strong>{tr('外部代码手动运行与跨站强隔离门禁已激活', '外部程式碼手動執行與跨站強隔離門禁已啟用')}</strong>：
            {tr(
              `当前源码来源为 "${codeSourceKind}"（外部导入 / 社区 / 分享链接），系统已严禁自动执行，且仅允许在独立跨站沙盒可用时手动运行；若独立跨站沙盒不可达，系统将立即失败关闭 (Fail-Closed)，绝不回退至本地 srcdoc。`,
              `目前原始碼來源為 "${codeSourceKind}"（外部匯入 / 社群 / 分享連結），系統已嚴禁自動執行，且僅允許在獨立跨站沙盒可用時手動執行；若獨立跨站沙盒不可達，系統將立即失敗關閉 (Fail-Closed)，絕不回退至本機 srcdoc。`
            )}
          </span>
        </div>
      )}

      {/* 2. 主双栏工作台：左侧多文件代码编辑器 + 右侧隔离沙盒预览与 Console */}
      <div className="lab-pg-split">
        {/* 左侧：代码编辑器面板 */}
        <div className="lab-pg-editor-card theme-card">
          <div className="editor-tabs-bar">
            <div className="file-tabs" role="tablist" aria-label={tr('源码文件列表', '原始碼檔案列表')}>
              {files.map((file, idx) => {
                const isActive = idx === activeFileIdx;
                return (
                  <button
                    key={file.name}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    data-file-tab={file.name}
                    onClick={() => setActiveFileIdx(idx)}
                    className={`file-tab-btn ${isActive ? 'is-active' : ''}`}
                  >
                    <span className="file-lang-dot" data-lang={file.language} />
                    <span className="ignore-opencc" data-no-translate="true">
                      {file.name}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="editor-meta-right ignore-opencc" data-no-translate="true">
              <span>
                {(totalBytes / 1024).toFixed(1)} KB /{' '}
                {LAB_SECURITY_LIMITS.MAX_TOTAL_SOURCE_BYTES / 1024} KB
              </span>
            </div>
          </div>

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
              value={activeFile?.content || ''}
              onChange={(e) => handleCodeChange(e.target.value)}
              onKeyDown={(e) => {
                if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                  e.preventDefault();
                  executeInSandbox(files);
                } else if (e.key === 'Tab') {
                  e.preventDefault();
                  const target = e.currentTarget;
                  const start = target.selectionStart;
                  const end = target.selectionEnd;
                  const val = target.value;
                  const nextVal = val.substring(0, start) + '  ' + val.substring(end);
                  handleCodeChange(nextVal);
                  window.requestAnimationFrame(() => {
                    target.selectionStart = target.selectionEnd = start + 2;
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

          <div className="editor-footer-bar">
            <span>
              {tr(
                '快捷键：Ctrl/Cmd + Enter 立即在沙盒中运行 · Tab 缩进 2 空格 · TypeScript 支持纯类型擦除子集',
                '快速鍵：Ctrl/Cmd + Enter 立即在沙盒中執行 · Tab 縮排 2 空格 · TypeScript 支援純型別擦除子集'
              )}
            </span>
            {livecodesAppUrl && (
              <span className="ignore-opencc" data-no-translate="true">
                Self-Hosted Engine: {livecodesAppUrl}
              </span>
            )}
          </div>
        </div>

        {/* 右侧：隔离沙盒预览 + Console / 错误 / 安全状态抽屉 */}
        <div
          className={`lab-pg-preview-card theme-card ${
            isFullscreenPreview ? 'is-fullscreen' : ''
          }`}
        >
          <div className="preview-header-bar">
            <div className="preview-status-group">
              <span className={`status-indicator is-${execStatus}`} />
              <strong className="preview-title">
                {tr(
                  '沙盒隔离预览 (Isolated Sandbox Viewport)',
                  '沙盒隔離預覽 (Isolated Sandbox Viewport)'
                )}
              </strong>
              {lastDurationMs !== null && (
                <small className="exec-time ignore-opencc" data-no-translate="true">
                  {lastDurationMs}ms
                </small>
              )}
            </div>

            <div className="preview-header-actions">
              <button
                type="button"
                onClick={() => setShowTracePanel((v) => !v)}
                className={`preview-mini-btn ${showTracePanel ? 'is-active' : ''}`}
                data-testid="btn-toggle-visualizer"
              >
                🧭{' '}
                {showTracePanel
                  ? tr('收起过程追踪', '收起過程追蹤')
                  : tr('开启执行追踪', '開啟執行追蹤')}
              </button>
              <button
                type="button"
                onClick={() => setIsFullscreenPreview((v) => !v)}
                className="preview-mini-btn"
                data-testid="btn-toggle-fullscreen"
              >
                {isFullscreenPreview
                  ? tr('🗗 退出全屏 (Esc)', '🗗 退出全螢幕 (Esc)')
                  : tr('⛶ 全屏预览', '⛶ 全螢幕預覽')}
              </button>
            </div>
          </div>

          {/* 真正执行不可信代码的隔离沙盒 iframe */}
          <div className="sandbox-viewport-container">
            {sandboxSrcDoc ? (
              isolationMode === 'cross-origin' && activeExternalOrigin ? (
                <iframe
                  key={sandboxKey}
                  ref={iframeRef}
                  title={`Lab Cross-Site Isolated Sandbox - ${currentExp.title}`}
                  sandbox="allow-scripts allow-same-origin"
                  referrerPolicy="no-referrer"
                  src={`${activeExternalOrigin}/`}
                  onLoad={handleBridgeIframeLoad}
                  className="sandbox-iframe"
                  data-testid="lab-sandbox-iframe"
                  data-isolation-mode="cross-origin"
                  data-session-id={sessionId}
                />
              ) : codeSourceKind === 'official' ? (
                <iframe
                  key={sandboxKey}
                  ref={iframeRef}
                  title={`Lab Isolated Sandbox - ${currentExp.title}`}
                  sandbox="allow-scripts"
                  referrerPolicy="no-referrer"
                  srcDoc={sandboxSrcDoc}
                  className="sandbox-iframe"
                  data-testid="lab-sandbox-iframe"
                  data-isolation-mode="opaque-srcdoc"
                  data-session-id={sessionId}
                />
              ) : (
                <div
                  className="sandbox-empty-placeholder is-fail-closed"
                  data-testid="sandbox-stopped-placeholder"
                >
                  <p>
                    {tr(
                      '🛑 独立跨站沙盒未就绪，安全策略已阻止非官方代码在本地 srcdoc 中运行。',
                      '🛑 獨立跨站沙盒未就緒，安全策略已阻止非官方程式碼在本機 srcdoc 中執行。'
                    )}
                  </p>
                </div>
              )
            ) : (
              <div
                className={`sandbox-empty-placeholder ${failClosedReason ? 'is-fail-closed' : ''}`}
                data-testid="sandbox-stopped-placeholder"
              >
                <p>
                  {failClosedReason
                    ? tr(
                        '🛑 已触发安全失败关闭 (Fail-Closed)：外部导入、社区或分享链接代码仅允许在独立跨站沙盒可用时运行。',
                        '🛑 已觸發安全失敗關閉 (Fail-Closed)：外部匯入、社群或分享連結程式碼僅允許在獨立跨站沙盒可用時執行。'
                      )
                    : execStatus === 'terminated'
                      ? tr(
                          '⏹ 沙盒执行上下文已终止并销毁。',
                          '⏹ 沙盒執行環境已終止並銷毀。'
                        )
                      : tr(
                          '🔒 沙盒尚未启动，请点击上方「▶ 运行代码」在隔离环境中执行。',
                          '🔒 沙盒尚未啟動，請點擊上方「▶ 執行程式碼」在隔離環境中執行。'
                        )}
                </p>
                <button
                  type="button"
                  onClick={() => executeInSandbox(files)}
                  className="lab-pg-btn is-run"
                >
                  ▶ {tr('立即在隔离沙盒中运行', '立即在隔離沙盒中執行')}
                </button>
              </div>
            )}
          </div>

          {/* 下方 Console / 运行错误 / 安全边界审计抽屉 */}
          <div className="lab-console-drawer">
            <div className="console-tabs-bar">
              <div className="console-tabs" role="tablist">
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeBottomTab === 'console'}
                  onClick={() => setActiveBottomTab('console')}
                  className={`console-tab ${
                    activeBottomTab === 'console' ? 'is-active' : ''
                  }`}
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
                  className={`console-tab ${
                    activeBottomTab === 'security' ? 'is-active' : ''
                  }`}
                  data-testid="tab-security"
                >
                  🛡️ {tr('隔离契约', '隔離契約')}
                </button>
              </div>

              <button
                type="button"
                onClick={() => {
                  setConsoleEntries([]);
                  setRuntimeErrors([]);
                }}
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
        </div>
      </div>

      {/* 3. 可选展开的程序运行逻辑逐步追踪可视化面板 */}
      {showTracePanel && (
        <div className="lab-pg-trace-section">
          <ExecutionVisualizer
            initialAlgorithmId={
              currentExp.visualizationConfig?.presetAlgorithmId || 'bubble-sort'
            }
          />
        </div>
      )}
    </div>
  );
}
