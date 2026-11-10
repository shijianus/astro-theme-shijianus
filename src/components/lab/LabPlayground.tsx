/**
 * Astro Blog「试验田 Lab」主工作台与安全交互界面 (LabPlayground)
 *
 * 经 Phase 2.8 架构解耦：
 * 1. 状态机与核心生命周期由 LabWorkspaceController / WorkspaceSnapshot 唯一定义；
 * 2. 运行时执行由 BrowserDomRuntime、QuickJsRuntime、CuratedTraceRuntime 驱动；
 * 3. React 组件作为纯声明式订阅者，不再直接调用沙盒插桩、协议编解码或事件监听器。
 */
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import type { LabFile, LabExperiment } from '../../lib/lab-schema';
import {
  type SandboxIsolationMode,
  type SandboxConsoleEntry,
  type SandboxRuntimeError,
  type LabCodeSourceKind,
  resolveSafeExternalSandboxOrigin,
  evaluateSandboxDegradationPolicy,
} from '../../lib/lab-sandbox-protocol';
import { OFFICIAL_LAB_EXPERIMENTS, getExperimentBySlug } from '../../data/lab-experiments';
import { ExecutionPolicy } from '../../lib/lab/ExecutionPolicy';
import { LabPlaygroundShell } from './LabPlaygroundShell';
import { LabImportModal, type PendingImportBundle } from './LabImportModal';
import {
  LabWorkspaceController,
  type WorkspaceSnapshot,
  WorkspacePersistence,
} from '../../lib/lab/workspace';

export interface LabPlaygroundProps {
  initialSlug?: string;
  mode?: 'full-workshop' | 'detail-embedded';
  livecodesAppUrl?: string;
  externalSandboxOrigin?: string;
}

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

export const LabPlayground: React.FC<LabPlaygroundProps> = ({
  initialSlug,
  mode = 'full-workshop',
  livecodesAppUrl,
  externalSandboxOrigin,
}) => {
  const [hasMounted, setHasMounted] = useState<boolean>(false);
  const [uiLocale, setUiLocale] = useState<'zh-CN' | 'zh-Hant'>(readCurrentUiLocale());
  const isHant = uiLocale === 'zh-Hant';
  const tr = useCallback((zhCn: string, zhHant: string) => (isHant ? zhHant : zhCn), [isHant]);
  const trRef = useRef(tr);
  trRef.current = tr;

  const defaultExp = useMemo(
    () => (initialSlug && getExperimentBySlug(initialSlug)) || OFFICIAL_LAB_EXPERIMENTS[0],
    [initialSlug]
  );

  const [selectedSlug, setSelectedSlug] = useState<string>(defaultExp.slug);
  const [currentExp, setCurrentExp] = useState<LabExperiment>(defaultExp);
  const [hostOriginState, setHostOriginState] = useState<string | null>(null);
  const [layoutMode, setLayoutMode] = useState<'split-equal' | 'preview-focus' | 'code-focus'>('split-equal');

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

  const [codeSourceKind, setCodeSourceKind] = useState<LabCodeSourceKind>(() =>
    ExecutionPolicy.resolveSourceKind(defaultExp.author)
  );

  // 试验田主工作区控制器实例
  const controllerRef = useRef<LabWorkspaceController | null>(null);
  if (!controllerRef.current) {
    const initialSourceKind = ExecutionPolicy.resolveSourceKind(defaultExp.author);
    const initialExternalOrigin =
      externalResolution.enabled && externalResolution.origin
        ? externalResolution.origin
        : null;
    controllerRef.current = new LabWorkspaceController({
      project: {
        id: defaultExp.id,
        slug: defaultExp.slug,
        title: defaultExp.title,
        files: defaultExp.files.map((f) => ({ ...f })),
        runtime: defaultExp.runtime,
        language: defaultExp.language,
        defaultParams: defaultExp.defaultParams,
      },
      sourceKind: initialSourceKind,
      isolationMode: initialExternalOrigin ? 'cross-origin' : 'opaque-srcdoc',
      externalOrigin: initialExternalOrigin,
      enableLiveCodes: false,
      liveCodesAppUrl: livecodesAppUrl,
      theme: readCurrentThemeMode(),
    });
  }

  // 单一数据源：订阅 Workspace 快照
  const [snapshot, setSnapshot] = useState<WorkspaceSnapshot>(() =>
    controllerRef.current!.getSnapshot()
  );

  const isUntrustedCode = codeSourceKind !== 'official';
  const activeExternalOrigin =
    externalResolution.enabled &&
    externalResolution.origin &&
    (isUntrustedCode || !snapshot.bridgeFallbackForced)
      ? externalResolution.origin
      : null;

  const degradationPolicy = useMemo(
    () => evaluateSandboxDegradationPolicy(codeSourceKind, Boolean(activeExternalOrigin)),
    [codeSourceKind, activeExternalOrigin]
  );

  const isolationMode: SandboxIsolationMode = activeExternalOrigin
    ? 'cross-origin'
    : 'opaque-srcdoc';

  const [activeBottomTab, setActiveBottomTab] = useState<'console' | 'errors' | 'security'>(
    'console'
  );
  const [toastMessage, setToastMessage] = useState<string>('');
  const [isFullscreenPreview, setIsFullscreenPreview] = useState<boolean>(false);
  const [showTracePanel, setShowTracePanel] = useState<boolean>(
    mode === 'full-workshop' ? Boolean(defaultExp.visualizationConfig?.enabled) : false
  );
  const [mobileActiveTab, setMobileActiveTab] = useState<'editor' | 'preview' | 'console'>('editor');
  const [pendingImportBundle, setPendingImportBundle] = useState<PendingImportBundle | null>(null);
  const [sandboxKey, setSandboxKey] = useState<number>(1);

  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const toastTimerRef = useRef<number | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    if (toastTimerRef.current) {
      window.clearTimeout(toastTimerRef.current);
    }
    toastTimerRef.current = window.setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? '' : prev));
    }, 3200);
  }, []);

  // 订阅控制器快照变更
  useEffect(() => {
    const ctrl = controllerRef.current;
    if (!ctrl) return;
    const unsubscribe = ctrl.subscribe((nextSnapshot) => {
      setSnapshot(nextSnapshot);
      setCodeSourceKind(nextSnapshot.sourceKind);
      if (nextSnapshot.runtimeErrors && nextSnapshot.runtimeErrors.length > 0) {
        setActiveBottomTab('errors');
      }
    });
    const unbindError = ctrl.on('error', () => {
      setActiveBottomTab('errors');
    });
    const unbindToast = ctrl.on('toast', (msg) => {
      showToast(msg);
    });
    return () => {
      unsubscribe();
      unbindError();
      unbindToast();
    };
  }, [showToast]);

  // 同步外部 Origin 变更到控制器
  useEffect(() => {
    controllerRef.current?.setExternalOrigin(activeExternalOrigin);
  }, [activeExternalOrigin]);

  // 组件卸载时释放控制器资源
  useEffect(() => {
    return () => {
      controllerRef.current?.dispose();
    };
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

  // 执行代码
  const executeInSandbox = useCallback(
    (filesOverride?: LabFile[]) => {
      const ctrl = controllerRef.current;
      if (!ctrl) return;
      if (filesOverride) {
        ctrl.updateFiles(filesOverride);
      }
      ctrl.setTheme(readCurrentThemeMode());
      const iframe =
        iframeRef.current ||
        (typeof document !== 'undefined'
          ? (document.querySelector('[data-testid="lab-sandbox-iframe"]') as HTMLIFrameElement | null)
          : null);
      void ctrl.run({
        iframe,
        theme: readCurrentThemeMode(),
      });
    },
    []
  );

  // 终止沙盒运行
  const terminateSandbox = useCallback(() => {
    controllerRef.current?.stop();
    showToast(tr('已终止沙盒运行并回收实例资源', '已終止沙盒執行並回收實例資源'));
  }, [showToast, tr]);

  // 切换实验
  const handleSelectExperiment = useCallback(
    async (slug: string) => {
      const found = getExperimentBySlug(slug);
      if (!found) return;
      const ctrl = controllerRef.current;
      if (!ctrl) return;

      const expSourceKind = ExecutionPolicy.resolveSourceKind(found.author);
      setSelectedSlug(found.slug);
      setCurrentExp(found);
      setCodeSourceKind(expSourceKind);
      setShowTracePanel(
        mode === 'full-workshop' ? Boolean(found.visualizationConfig?.enabled) : false
      );
      setSandboxKey((k) => k + 1);

      await ctrl.setProject(
        {
          id: found.id,
          slug: found.slug,
          title: found.title,
          files: found.files.map((f) => ({ ...f })),
          runtime: found.runtime,
          language: found.language,
          defaultParams: found.defaultParams,
        },
        expSourceKind
      );

      if (mode === 'full-workshop' && typeof window !== 'undefined') {
        const nextUrl = `${window.location.pathname}?slug=${encodeURIComponent(found.slug)}`;
        window.history.pushState({ slug: found.slug }, '', nextUrl);
      }

      if (expSourceKind === 'official' && found.previewConfig.autoRun) {
        setTimeout(() => {
          const iframe =
            iframeRef.current ||
            (typeof document !== 'undefined'
              ? (document.querySelector('[data-testid="lab-sandbox-iframe"]') as HTMLIFrameElement | null)
              : null);
          ctrl.run({
            iframe,
            theme: readCurrentThemeMode(),
          });
        }, 50);
      }
    },
    [mode]
  );

  // 代码变更
  const handleCodeChange = useCallback((newContent: string) => {
    controllerRef.current?.updateActiveFileContent(newContent);
  }, []);

  // 重置代码
  const handleResetCode = useCallback(async () => {
    const ctrl = controllerRef.current;
    if (!ctrl) return;
    const expSourceKind = ExecutionPolicy.resolveSourceKind(currentExp.author);
    setCodeSourceKind(expSourceKind);

    await ctrl.setProject(
      {
        id: currentExp.id,
        slug: currentExp.slug,
        title: currentExp.title,
        files: currentExp.files.map((f) => ({ ...f })),
        runtime: currentExp.runtime,
        language: currentExp.language,
        defaultParams: currentExp.defaultParams,
      },
      expSourceKind
    );

    if (expSourceKind === 'official') {
      ctrl.run({
        iframe: iframeRef.current,
        theme: readCurrentThemeMode(),
      });
    }
    showToast(tr('已恢复初始实验源码并重新构建沙盒', '已恢復初始實驗原始碼並重新建構沙盒'));
  }, [currentExp, showToast, tr]);

  // 复制代码
  const handleCopyCode = useCallback(async () => {
    const activeFile = snapshot.project.files[snapshot.activeFileIndex];
    if (!activeFile) return;
    try {
      await navigator.clipboard.writeText(activeFile.content);
      showToast(tr(`已复制 ${activeFile.name} 源码到剪贴板`, `已複製 ${activeFile.name} 原始碼到剪貼簿`));
    } catch {
      showToast(tr('复制失败，请手动全选复制', '複製失敗，請手動全選複製'));
    }
  }, [snapshot.activeFileIndex, snapshot.project.files, showToast, tr]);

  // 保存本地草稿
  const handleSaveDraft = useCallback(() => {
    const ok = WorkspacePersistence.saveDraft(currentExp.slug, snapshot.project);
    if (ok) {
      showToast(tr('草稿已安全保存至浏览器本地存储', '草稿已安全儲存至瀏覽器本機儲存'));
    } else {
      showToast(tr('保存草稿失败', '儲存草稿失敗'));
    }
  }, [currentExp.slug, snapshot.project, showToast, tr]);

  // 读取本地草稿
  const handleLoadDraft = useCallback(async () => {
    const draft = WorkspacePersistence.loadDraft(currentExp.slug);
    if (!draft) {
      showToast(tr('当前尚无保存的本地草稿', '目前尚無儲存的本機草稿'));
      return;
    }
    const isExactOfficial = ExecutionPolicy.isUnmodifiedOfficialPreset(currentExp.slug, draft.files);
    const restoredKind: LabCodeSourceKind = isExactOfficial ? 'official' : 'imported';
    await controllerRef.current?.setProject(draft, restoredKind);
    showToast(tr('已恢复本地草稿', '已恢復本機草稿'));
  }, [currentExp.slug, showToast, tr]);

  // 导出 JSON 文件
  const handleExportJson = useCallback(() => {
    const jsonStr = controllerRef.current?.exportJson();
    if (!jsonStr) return;
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
  }, [currentExp.slug, showToast, tr]);

  // 导入 JSON 文件：先解析并展示安全审阅对话框，绝不自动运行
  const handleImportJsonFile = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputEl = e.currentTarget;
      const file = inputEl.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = () => {
        const rawText = String(reader.result || '');
        try {
          const parsed = JSON.parse(rawText);
          const totalB = Array.isArray(parsed.files)
            ? parsed.files.reduce((acc: number, f: any) => acc + (f.content?.length || 0), 0)
            : rawText.length;
          setPendingImportBundle({
            manifest: {
              title: parsed.title,
              slug: parsed.slug,
              description: parsed.description,
              category: parsed.category,
              language: parsed.language,
              version: parsed.version,
            },
            files: Array.isArray(parsed.files) ? parsed.files : [],
            totalBytes: totalB,
            rawJson: rawText,
          });
        } catch {
          showToast(tr('导入失败：不是有效的 JSON 文件', '匯入失敗：不是有效的 JSON 檔案'));
        }
        inputEl.value = '';
      };
      reader.onerror = () => {
        showToast(tr('导入失败：读取文件异常', '匯入失敗：讀取檔案異常'));
        inputEl.value = '';
      };
      reader.readAsText(file);
    },
    [showToast, tr]
  );

  const handleConfirmImport = useCallback(() => {
    if (!pendingImportBundle) return;
    const res = controllerRef.current?.importJson(pendingImportBundle.rawJson);
    if (!res?.ok) {
      showToast(
        tr(
          `导入校验拒绝: ${(res?.errors || []).join('；')}`,
          `匯入校驗拒絕: ${(res?.errors || []).join('；')}`
        )
      );
    } else {
      setCodeSourceKind(controllerRef.current?.getSnapshot().sourceKind || 'imported');
      showToast(
        tr(
          '外部实验代码已安全载入！出于隔离策略，沙盒处于空闲状态，请审阅后手动点击「运行代码」。',
          '外部實驗程式碼已安全載入！出於隔離策略，沙盒處於空閒狀態，請審閱後手動點擊「執行程式碼」。'
        )
      );
    }
    setPendingImportBundle(null);
  }, [pendingImportBundle, showToast, tr]);

  // 分享链接：实施 URL 2048 字符安全上限保护
  const handleShareLink = useCallback(async () => {
    const bundle = controllerRef.current?.exportBundle();
    if (!bundle) {
      showToast('无法生成分享链接');
      return;
    }
    const shareUrl = `${window.location.origin}${window.location.pathname}#bundle=${bundle}`;
    if (shareUrl.length > 2048) {
      handleExportJson();
      showToast(
        tr(
          '工程内容超出 URL 安全长度限制 (2048 字符)，已自动为您转换为「导出 JSON」离线文件进行分享。',
          '工程內容超出 URL 安全長度限制 (2048 字元)，已自動為您轉換為「匯出 JSON」離線檔案進行分享。'
        )
      );
      return;
    }
    try {
      await navigator.clipboard.writeText(shareUrl);
      showToast(
        tr(
          '分享链接已复制到剪贴板！包含完整的轻量实验包',
          '分享連結已複製到剪貼簿！包含完整的輕量實驗包'
        )
      );
    } catch {
      showToast(tr('无法写入剪贴板，请手动复制 URL', '無法寫入剪貼簿，請手動複製 URL'));
    }
  }, [handleExportJson, showToast, tr]);

  // URL Hash 与 Query 同步
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const applyHashBundle = () => {
      const hash = window.location.hash;
      if (hash.startsWith('#bundle=')) {
        const rawEncoded = hash.slice('#bundle='.length);
        const res = controllerRef.current?.importBundle(rawEncoded);
        if (res?.ok) {
          showToast(
            trRef.current(
              '已加载外部分享代码（禁止自动运行，仅允许在独立跨站沙盒就绪时手动运行）',
              '已載入外部分享程式碼（禁止自動執行，僅允許在獨立跨站沙盒就緒時手動執行）'
            )
          );
          return true;
        } else {
          setActiveBottomTab('errors');
          showToast(
            trRef.current(
              '安全阻断：外部分享链接载荷无效或超限，已强制失败关闭',
              '安全阻斷：外部分享連結酬載無效或超限，已強制失敗關閉'
            )
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
      const expSourceKind = ExecutionPolicy.resolveSourceKind(targetExp.author);

      setSelectedSlug(targetExp.slug);
      setCurrentExp(targetExp);
      setCodeSourceKind(expSourceKind);
      setShowTracePanel(
        mode === 'full-workshop' ? Boolean(targetExp.visualizationConfig?.enabled) : false
      );

      controllerRef.current?.setProject(
        {
          id: targetExp.id,
          slug: targetExp.slug,
          title: targetExp.title,
          files: targetExp.files.map((f) => ({ ...f })),
          runtime: targetExp.runtime,
          language: targetExp.language,
          defaultParams: targetExp.defaultParams,
        },
        expSourceKind
      );

      if (expSourceKind === 'official' && targetExp.previewConfig.autoRun) {
        setTimeout(() => {
          const iframe =
            iframeRef.current ||
            (typeof document !== 'undefined'
              ? (document.querySelector('[data-testid="lab-sandbox-iframe"]') as HTMLIFrameElement | null)
              : null);
          controllerRef.current?.run({
            iframe,
            theme: readCurrentThemeMode(),
          });
        }, 50);
      }
    };

    syncFromUrlQuery();
    window.addEventListener('hashchange', applyHashBundle);
    window.addEventListener('popstate', syncFromUrlQuery);
    return () => {
      window.removeEventListener('hashchange', applyHashBundle);
      window.removeEventListener('popstate', syncFromUrlQuery);
    };
  }, [defaultExp, mode]);

  const effectiveIsolationMode =
    degradationPolicy.effectiveMode === 'blocked-fail-closed'
      ? 'fail-closed'
      : isolationMode;

  const execStatus =
    snapshot.sessionLifecycle === 'connecting'
      ? 'running'
      : snapshot.sessionLifecycle === 'ready'
      ? 'running'
      : (snapshot.sessionLifecycle as any);

  return (
    <>
      <LabPlaygroundShell
        mode={mode}
        execStatus={execStatus}
        effectiveIsolationMode={effectiveIsolationMode}
        codeSourceKind={codeSourceKind}
        failClosedReason={snapshot.failClosedReason}
        toastMessage={toastMessage}
        hasMounted={hasMounted}
        isolationMode={isolationMode}
        bridgeFallbackForced={snapshot.bridgeFallbackForced}
        externalResolutionEnabled={Boolean(externalResolution.enabled)}
        showTracePanel={showTracePanel}
        isHant={isHant}
        layoutMode={layoutMode}
        mobileActiveTab={mobileActiveTab}
        onSelectMobileTab={setMobileActiveTab}
        onRetryCrossOriginSandbox={() => executeInSandbox()}
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
          dirty: snapshot.dirty,
          layoutMode,
          onSelectLayoutMode: setLayoutMode,
          runtimeKind: snapshot.runtimeKind,
          supportedRuntimes: snapshot.supportedRuntimes,
          editorKind: snapshot.editorKind,
          supportedEditors: snapshot.supportedEditors,
          totalBytes: snapshot.project.files.reduce((a, f) => a + (f.content?.length || 0), 0),
          fileInputRef,
          onSelectExperiment: handleSelectExperiment,
          onSelectRuntime: (rk) => {
            const iframe =
              iframeRef.current ||
              (typeof document !== 'undefined'
                ? (document.querySelector('[data-testid="lab-sandbox-iframe"]') as HTMLIFrameElement | null)
                : null);
            controllerRef.current?.setPreviewIframe(iframe);
            void controllerRef.current?.setRuntimeKind(rk as any);
          },
          onSelectEditor: (ek) => controllerRef.current?.setEditorKind(ek as any),
          onRun: () => executeInSandbox(),
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
          files: snapshot.project.files,
          activeFileIdx: snapshot.activeFileIndex,
          livecodesAppUrl,
          isHant,
          dirty: snapshot.dirty,
          onSelectFile: (idx) => controllerRef.current?.setActiveFileIndex(idx),
          onCodeChange: handleCodeChange,
          onRunCode: () => executeInSandbox(),
          onAddFile: (name, lang) => controllerRef.current?.addFile(name, lang),
          onDeleteFile: (idx) => controllerRef.current?.deleteFile(idx),
          onRenameFile: (idx, newName) => controllerRef.current?.renameFile(idx, newName),
        }}
        previewProps={{
          currentExp,
          files: snapshot.project.files,
          sessionId: snapshot.sessionId,
          sandboxSrcDoc: snapshot.sandboxSrcDoc,
          sandboxKey,
          runtimeKind: snapshot.runtimeKind,
          isolationMode,
          activeExternalOrigin,
          codeSourceKind,
          execStatus,
          lastDurationMs: snapshot.lastDurationMs,
          failClosedReason: snapshot.failClosedReason,
          isFullscreenPreview,
          showTracePanel,
          activeBottomTab,
          consoleEntries: snapshot.consoleEntries,
          runtimeErrors: snapshot.runtimeErrors,
          iframeRef,
          isHant,
          onToggleFullscreen: () => setIsFullscreenPreview((v) => !v),
          onToggleTracePanel: () => setShowTracePanel((v) => !v),
          onBridgeIframeLoad: () => {},
          onRunCode: () => executeInSandbox(),
          onReload: () => executeInSandbox(),
          onReconnect: () => executeInSandbox(),
          onSetActiveBottomTab: setActiveBottomTab,
          onClearConsole: () => {
            controllerRef.current?.clearConsole();
            controllerRef.current?.clearErrors();
          },
        }}
      />
      {pendingImportBundle && (
        <LabImportModal
          bundle={pendingImportBundle}
          isHant={isHant}
          onConfirm={handleConfirmImport}
          onCancel={() => setPendingImportBundle(null)}
        />
      )}
    </>
  );
};
