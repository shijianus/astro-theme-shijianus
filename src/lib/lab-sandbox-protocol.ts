/**
 * Astro Blog「试验田 Lab」沙盒安全通信协议、跨站域名校验与隔离执行文档生成器
 *
 * 威胁模型与纵深防御 (Defense-in-Depth)：
 * 1. 双层 Origin 隔离模型：
 *    - 模式 A (默认本地零配置强隔离 `opaque-srcdoc`)：
 *      使用 `<iframe sandbox="allow-scripts" referrerpolicy="no-referrer">`（严禁赋予 `allow-same-origin`），
 *      强制浏览器为沙盒分配唯一的 Opaque Origin (`"null"`)，从内核层面阻断对 `blog.epocanvas.com` 的 Cookie、
 *      `localStorage`、`IndexedDB`、Cache Storage 及父窗口 DOM 的一切同步访问。
 *    - 模式 B (独立跨站沙盒桥接隔离 `cross-origin`)：
 *      当配置合法的独立站点 `PUBLIC_LAB_SANDBOX_ORIGIN`（如独立的 `https://<project>.pages.dev`，严禁使用
 *      `*.epocanvas.com` 子域以免触发主站 CORS 信任或共享站点级 Cookie）时，外层桥接帧运行于独立跨站 Origin，
 *      内层执行帧 `#inner-runner` 依然保持 `sandbox="allow-scripts"`（无 `allow-same-origin`）双层隔离。
 *      若独立沙盒不可达或握手超时，自动平滑降级至模式 A (`opaque-srcdoc`)。
 * 2. Nonce 锁死型内联 CSP 与纯 DOM 注入：
 *    - 每次会话生成随机一次性 `nonce`，沙盒内联 CSP 设为：
 *      `default-src 'none'; script-src 'nonce-<random>' 'unsafe-eval'; style-src 'unsafe-inline'; img-src data: blob:; media-src data: blob:; font-src data:; connect-src 'none'; frame-src 'none'; child-src 'none'; worker-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'`
 *    - 移除 `script-src` 中的 `'unsafe-inline'` 与 `blob:`：彻底阻断 HTML 内联事件处理器（如 `<img onerror=...>`）与 `Blob Worker` 多核死循环炸弹。
 *    - 用户 HTML 与 CSS 一律经过 `\u003c` / `\u003e` Unicode 转义后在引导脚本内部通过 DOM API 注入，引导脚本首行即执行
 *      `document.currentScript.remove()` 自销毁，杜绝 `</script>` / `</style>` / 未闭合 `<textarea>` 逃逸及 `SESSION_ID` 泄露。
 * 3. postMessage 严格双向校验与防洪断路器：
 *    - 先校验 `event.source`、模式专属 `event.origin`、`protocol`、`sessionId` 与 `type`，再执行有界字段提取，杜绝未认证超大对象 `JSON.stringify` DoS。
 *    - 注意：`sessionId` 仅作为防跨会话串扰与防盲目伪造的会话标识（Session Nonce），不具备密码学消息认证码属性；因此主站绝不向沙盒暴露任何敏感管理能力，仅接收纯文本日志与运行状态。
 */

import {
  type LabAuthor,
  type LabFile,
  LAB_SECURITY_LIMITS,
  getUtf8ByteLength,
  instrumentJavaScriptLoops,
  transpileTypeScriptDetailed,
} from './lab-schema';

export const LAB_SANDBOX_PROTOCOL_VERSION = 'LAB_SANDBOX_PROTOCOL_V1' as const;

export type SandboxConsoleLevel = 'log' | 'info' | 'warn' | 'error';

export type SandboxIsolationMode = 'cross-origin' | 'opaque-srcdoc';

/**
 * 代码信任来源分类：
 * - `official`: 站长官方精选预设实验（允许在明确提示后回退至本地 opaque srcdoc）
 * - `imported`: 外部导入的 JSON 实验包（独立跨站沙盒不可用时必须失败关闭，严禁自动执行）
 * - `community`: 社区投稿/非官方作者代码（独立跨站沙盒不可用时必须失败关闭，严禁自动执行）
 * - `bundle`: URL `#bundle=` 分享链接载入的代码（独立跨站沙盒不可用时必须失败关闭，严禁自动执行）
 */
export type LabCodeSourceKind = 'official' | 'imported' | 'community' | 'bundle';

export interface SandboxDegradationDecision {
  sourceKind: LabCodeSourceKind;
  isUntrusted: boolean;
  allowAutoRun: boolean;
  allowOpaqueSrcdocFallback: boolean;
  failClosedWhenCrossSiteUnavailable: boolean;
  effectiveMode: SandboxIsolationMode | 'blocked-fail-closed';
}

export function resolveExperimentSourceKind(author?: Pick<LabAuthor, 'role'> | null): LabCodeSourceKind {
  if (author?.role === 'owner') {
    return 'official';
  }
  return 'community';
}

export function evaluateSandboxDegradationPolicy(
  sourceKind: LabCodeSourceKind,
  crossSiteSandboxAvailable: boolean
): SandboxDegradationDecision {
  const isOfficial = sourceKind === 'official';
  if (isOfficial) {
    return {
      sourceKind,
      isUntrusted: false,
      allowAutoRun: true,
      allowOpaqueSrcdocFallback: true,
      failClosedWhenCrossSiteUnavailable: false,
      effectiveMode: crossSiteSandboxAvailable ? 'cross-origin' : 'opaque-srcdoc',
    };
  }

  return {
    sourceKind,
    isUntrusted: true,
    allowAutoRun: false,
    allowOpaqueSrcdocFallback: false,
    failClosedWhenCrossSiteUnavailable: true,
    effectiveMode: crossSiteSandboxAvailable ? 'cross-origin' : 'blocked-fail-closed',
  };
}

export interface SandboxConsoleEntry {
  id: string;
  level: SandboxConsoleLevel;
  args: string[];
  timestamp: number;
}

export interface SandboxRuntimeError {
  message: string;
  line?: number | null;
  column?: number | null;
  stack?: string;
  timestamp: number;
}

export type SandboxToHostMessageType =
  | 'SANDBOX_BRIDGE_READY'
  | 'SANDBOX_READY'
  | 'CONSOLE_EVENT'
  | 'RUNTIME_ERROR'
  | 'EXECUTION_COMPLETE'
  | 'HEARTBEAT';

export interface SandboxToHostMessage {
  protocol: typeof LAB_SANDBOX_PROTOCOL_VERSION;
  sessionId: string;
  type: SandboxToHostMessageType;
  payload?: {
    level?: SandboxConsoleLevel;
    args?: string[];
    error?: {
      message: string;
      line?: number | null;
      column?: number | null;
      stack?: string;
    };
    durationMs?: number;
    truncated?: boolean;
  };
}

export interface HostToSandboxMessage {
  protocol: typeof LAB_SANDBOX_PROTOCOL_VERSION;
  sessionId: string;
  type: 'PING' | 'EXECUTE_CODE' | 'TERMINATE_SESSION' | 'SET_THEME';
  payload?: {
    srcDoc?: string;
    theme?: 'light' | 'dark';
    html?: string;
    css?: string;
    js?: string;
    maxConsoleEntries?: number;
    maxMessageLength?: number;
  };
}

export interface ExternalSandboxOriginResolution {
  enabled: boolean;
  origin: string | null;
  rejectedReason?: string;
}

const VALID_MESSAGE_TYPES = new Set<SandboxToHostMessageType>([
  'SANDBOX_BRIDGE_READY',
  'SANDBOX_READY',
  'CONSOLE_EVENT',
  'RUNTIME_ERROR',
  'EXECUTION_COMPLETE',
  'HEARTBEAT',
]);

const VALID_CONSOLE_LEVELS = new Set<SandboxConsoleLevel>([
  'log',
  'info',
  'warn',
  'error',
]);

/**
 * 校验并规范化外部独立沙盒 Origin (`PUBLIC_LAB_SANDBOX_ORIGIN`)
 *
 * 强制安全约束：
 * 1. 严禁包含通配符 `*`、账号密码、路径参数或查询串；
 * 2. 严禁与主站同源，严禁使用 `epocanvas.com` / `*.epocanvas.com` / `*.shijianus-blog.pages.dev` / `shijianus.github.io`
 *    （防止共享主域 Cookie 或命中主站 Functions 的 `Access-Control-Allow-Origin` 子域信任规则）；
 * 3. 生产环境必须使用 `https:`；仅当宿主自身处于本地 `http://localhost` / `http://127.0.0.1` 开发测试环境时允许跨端口 `http:` 回环地址。
 */
export function resolveSafeExternalSandboxOrigin(
  rawOrigin?: string | null,
  hostOrigin?: string | null
): ExternalSandboxOriginResolution {
  if (!rawOrigin || typeof rawOrigin !== 'string') {
    return { enabled: false, origin: null };
  }
  const trimmed = rawOrigin.trim();
  if (!trimmed) {
    return { enabled: false, origin: null };
  }
  if (trimmed.includes('*') || /\s/.test(trimmed)) {
    return {
      enabled: false,
      origin: null,
      rejectedReason: 'INVALID_WILDCARD_OR_WHITESPACE',
    };
  }

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return { enabled: false, origin: null, rejectedReason: 'INVALID_URL' };
  }

  if (parsed.username || parsed.password) {
    return { enabled: false, origin: null, rejectedReason: 'CREDENTIALS_NOT_ALLOWED' };
  }
  if ((parsed.pathname && parsed.pathname !== '/') || parsed.search || parsed.hash) {
    return { enabled: false, origin: null, rejectedReason: 'ORIGIN_MUST_NOT_HAVE_PATH_OR_QUERY' };
  }

  const hostname = parsed.hostname.toLowerCase();
  const isLoopback = hostname === 'localhost' || hostname === '127.0.0.1';

  if (parsed.protocol === 'https:') {
    // 合法 HTTPS 协议
  } else if (parsed.protocol === 'http:' && isLoopback) {
    if (hostOrigin) {
      try {
        const hostParsed = new URL(hostOrigin);
        const hostLoopback =
          hostParsed.protocol === 'http:' &&
          (hostParsed.hostname === 'localhost' || hostParsed.hostname === '127.0.0.1');
        if (!hostLoopback) {
          return {
            enabled: false,
            origin: null,
            rejectedReason: 'HTTP_LOOPBACK_BLOCKED_ON_HTTPS_HOST',
          };
        }
      } catch {
        return { enabled: false, origin: null, rejectedReason: 'INVALID_HOST_ORIGIN' };
      }
    }
  } else {
    return { enabled: false, origin: null, rejectedReason: 'INSECURE_PROTOCOL' };
  }

  if (hostOrigin && parsed.origin === hostOrigin) {
    return { enabled: false, origin: null, rejectedReason: 'SAME_ORIGIN_FORBIDDEN' };
  }

  if (
    hostname === 'epocanvas.com' ||
    hostname.endsWith('.epocanvas.com') ||
    hostname === 'epocanvas.tech' ||
    hostname.endsWith('.epocanvas.tech') ||
    hostname === 'pvzos.com' ||
    hostname.endsWith('.pvzos.com') ||
    hostname === 'shijianus.com' ||
    hostname.endsWith('.shijianus.com') ||
    hostname === 'shijianus-blog.pages.dev' ||
    hostname.endsWith('.shijianus-blog.pages.dev') ||
    hostname === 'shijianus-github-io.pages.dev' ||
    hostname.endsWith('.shijianus-github-io.pages.dev') ||
    hostname === 'shijianus.github.io' ||
    hostname === 'shijian.qzz.io' ||
    hostname.endsWith('.shijian.qzz.io') ||
    hostname === '831511.xyz' ||
    hostname.endsWith('.831511.xyz')
  ) {
    return {
      enabled: false,
      origin: null,
      rejectedReason: 'SHARED_SITE_OR_TRUSTED_CORS_DOMAIN_FORBIDDEN',
    };
  }

  return { enabled: true, origin: parsed.origin };
}

function createRandomToken(prefix: string): string {
  if (typeof crypto !== 'undefined') {
    if (typeof crypto.randomUUID === 'function') {
      return `${prefix}${crypto.randomUUID().replace(/-/g, '')}`;
    }
    if (typeof crypto.getRandomValues === 'function') {
      const bytes = new Uint8Array(16);
      crypto.getRandomValues(bytes);
      const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
      return `${prefix}${hex}`;
    }
  }
  const rand = Math.random().toString(36).slice(2, 12);
  const ts = Date.now().toString(36);
  return `${prefix}${ts}${rand}`;
}

/**
 * 生成运行会话标识 (Session ID)
 */
export function createSandboxSessionId(): string {
  return createRandomToken('lab-sess-');
}

/**
 * 生成单次沙盒文档专用 CSP Nonce
 */
export function createSandboxCspNonce(): string {
  return createRandomToken('labnonce');
}

/**
 * 将任意值编码为安全的内联脚本 JSON 字面量，转义 `<`、`>`、`&`、U+2028、U+2029，
 * 彻底阻断 `</script>`、`<!--`、`</style>` 标签闭合注入。
 */
export function encodeSafeInlineJson(value: unknown): string {
  return JSON.stringify(value)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');
}

/**
 * 严格校验来自沙盒 iframe 的 postMessage 事件
 */
export function verifySandboxMessage(
  event: MessageEvent,
  options: {
    expectedSource: Window | null;
    expectedSessionId: string;
    /**
     * 严格允许的 Origin 列表（如跨站桥接模式下仅允许 `[safeExternalOrigin]`，本地 `srcdoc` 模式下仅允许 `['null']`）
     */
    strictOrigins?: string[];
    /**
     * 兼容旧参数：若未传 `strictOrigins`，则合并 `'null'` 与 `allowedOrigins`
     */
    allowedOrigins?: string[];
    allowBridgeInitSession?: boolean;
  }
): { valid: boolean; message?: SandboxToHostMessage; reason?: string } {
  // 1. 强绑定窗口引用：绝不接受来自其他窗口/标签页/子框架的伪造消息
  if (!options.expectedSource || event.source !== options.expectedSource) {
    return { valid: false, reason: 'SOURCE_MISMATCH' };
  }

  // 2. 按隔离模式严格校验 Origin
  const allowed = options.strictOrigins
    ? new Set<string>(options.strictOrigins)
    : new Set<string>(['null', ...(options.allowedOrigins || [])]);

  if (!allowed.has(event.origin)) {
    return { valid: false, reason: `UNTRUSTED_ORIGIN:${event.origin}` };
  }

  // 3. 轻量级前置协议与会话校验（在序列化/深拷贝前拦截垃圾或超大恶意对象，杜绝 JSON.stringify DoS）
  const raw = event.data;
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return { valid: false, reason: 'INVALID_DATA_TYPE' };
  }

  const candidate = raw as Record<string, unknown>;
  if (candidate.protocol !== LAB_SANDBOX_PROTOCOL_VERSION) {
    return { valid: false, reason: 'PROTOCOL_VERSION_MISMATCH' };
  }

  const msgType = candidate.type;
  if (typeof msgType !== 'string' || !VALID_MESSAGE_TYPES.has(msgType as SandboxToHostMessageType)) {
    return { valid: false, reason: 'UNKNOWN_MESSAGE_TYPE' };
  }

  const rawSessionId = candidate.sessionId;
  if (typeof rawSessionId !== 'string' || rawSessionId.length === 0 || rawSessionId.length > 128) {
    return { valid: false, reason: 'SESSION_ID_MISMATCH' };
  }

  const isBridgeInit =
    options.allowBridgeInitSession === true &&
    msgType === 'SANDBOX_BRIDGE_READY' &&
    rawSessionId === '__bridge_init__';

  if (!isBridgeInit && (!options.expectedSessionId || rawSessionId !== options.expectedSessionId)) {
    return { valid: false, reason: 'SESSION_ID_MISMATCH' };
  }

  // 4. 有界字段提取与净化（绝不遍历未知深层属性）
  const rawPayload =
    candidate.payload && typeof candidate.payload === 'object' && !Array.isArray(candidate.payload)
      ? (candidate.payload as Record<string, unknown>)
      : {};

  if (Array.isArray(rawPayload.args) && rawPayload.args.length > 64) {
    return { valid: false, reason: 'PAYLOAD_TOO_LARGE' };
  }

  const level: SandboxConsoleLevel = VALID_CONSOLE_LEVELS.has(
    rawPayload.level as SandboxConsoleLevel
  )
    ? (rawPayload.level as SandboxConsoleLevel)
    : 'log';

  let totalBytesEstimate = rawSessionId.length + msgType.length + 64;
  const args: string[] = [];
  if (Array.isArray(rawPayload.args)) {
    const limit = Math.min(rawPayload.args.length, 12);
    for (let i = 0; i < limit; i++) {
      const item = rawPayload.args[i];
      let str: string;
      if (typeof item === 'string') {
        if (getUtf8ByteLength(item) > LAB_SECURITY_LIMITS.MAX_POSTMESSAGE_BYTES) {
          return { valid: false, reason: 'PAYLOAD_TOO_LARGE' };
        }
        str = item.slice(0, LAB_SECURITY_LIMITS.MAX_CONSOLE_MESSAGE_LENGTH);
      } else {
        try {
          str = String(item ?? '').slice(0, LAB_SECURITY_LIMITS.MAX_CONSOLE_MESSAGE_LENGTH);
        } catch {
          return { valid: false, reason: 'NON_SERIALIZABLE_PAYLOAD' };
        }
      }
      totalBytesEstimate += getUtf8ByteLength(str);
      if (totalBytesEstimate > LAB_SECURITY_LIMITS.MAX_POSTMESSAGE_BYTES) {
        return { valid: false, reason: 'PAYLOAD_TOO_LARGE' };
      }
      args.push(str);
    }
  }

  let errorObj: SandboxToHostMessage['payload'] extends { error?: infer E } ? E : undefined;
  if (rawPayload.error && typeof rawPayload.error === 'object' && !Array.isArray(rawPayload.error)) {
    const errRec = rawPayload.error as Record<string, unknown>;
    const rawErrMsg = typeof errRec.message === 'string' ? errRec.message : String(errRec.message ?? 'Unknown runtime error');
    const rawStack = typeof errRec.stack === 'string' ? errRec.stack : undefined;
    if (
      getUtf8ByteLength(rawErrMsg) + (rawStack ? getUtf8ByteLength(rawStack) : 0) >
      LAB_SECURITY_LIMITS.MAX_POSTMESSAGE_BYTES
    ) {
      return { valid: false, reason: 'PAYLOAD_TOO_LARGE' };
    }
    errorObj = {
      message: rawErrMsg.slice(0, LAB_SECURITY_LIMITS.MAX_CONSOLE_MESSAGE_LENGTH),
      line: typeof errRec.line === 'number' && Number.isFinite(errRec.line) ? errRec.line : null,
      column: typeof errRec.column === 'number' && Number.isFinite(errRec.column) ? errRec.column : null,
      stack: rawStack ? rawStack.slice(0, LAB_SECURITY_LIMITS.MAX_CONSOLE_MESSAGE_LENGTH) : undefined,
    };
  }

  return {
    valid: true,
    message: {
      protocol: LAB_SANDBOX_PROTOCOL_VERSION,
      sessionId: rawSessionId,
      type: msgType as SandboxToHostMessageType,
      payload: {
        level,
        args,
        error: errorObj,
        durationMs:
          typeof rawPayload.durationMs === 'number' && Number.isFinite(rawPayload.durationMs)
            ? Math.max(0, Math.round(rawPayload.durationMs))
            : 0,
        truncated: Boolean(rawPayload.truncated),
      },
    },
  };
}

/**
 * 清理 HTML 中的危险元标签，并提取内联 `<script>` 统一纳入受控插桩管线
 */
function sanitizeAndExtractHtmlScripts(rawHtml: string): {
  cleanHtml: string;
  inlineScripts: string[];
  errors: string[];
} {
  const inlineScripts: string[] = [];
  const errors: string[] = [];

  // 移除可能干扰沙盒策略的 <meta http-equiv> 与 <base> 标签
  let cleanHtml = rawHtml
    .replace(/<base\b[^>]*>/gi, '')
    .replace(/<meta\b[^>]*http-equiv\b[^>]*>/gi, '');

  cleanHtml = cleanHtml.replace(
    /<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi,
    (_full, attrs: string, body: string) => {
      if (/\bsrc\s*=/i.test(attrs)) {
        errors.push('沙盒安全策略禁止在 HTML 中通过 `<script src="...">` 加载外部脚本。');
        return '';
      }
      if (body && body.trim()) {
        inlineScripts.push(body);
      }
      return '';
    }
  );

  return { cleanHtml, inlineScripts, errors };
}

/**
 * 从实验的多文件数组中提取、校验并编译 HTML、CSS 与 JS/TS（包含死循环熔断插桩）
 */
export function compileExperimentFiles(files: LabFile[]): {
  ok: boolean;
  html: string;
  css: string;
  js: string;
  instrumentedJs: string;
  errors: string[];
} {
  let html = '';
  let css = '';
  let js = '';
  const errors: string[] = [];
  const htmlInlineScripts: string[] = [];

  for (const file of files) {
    if (file.language === 'html' || file.name.endsWith('.html')) {
      const extracted = sanitizeAndExtractHtmlScripts(file.content);
      if (extracted.errors.length > 0) errors.push(...extracted.errors);
      if (extracted.inlineScripts.length > 0) htmlInlineScripts.push(...extracted.inlineScripts);
      html += (html ? '\n' : '') + extracted.cleanHtml;
    } else if (file.language === 'css' || file.name.endsWith('.css')) {
      css += (css ? '\n' : '') + file.content;
    } else if (file.language === 'typescript' || file.name.endsWith('.ts')) {
      const transpiled = transpileTypeScriptDetailed(file.content);
      if (!transpiled.ok) {
        for (const err of transpiled.errors) {
          errors.push(`[${file.name}] ${err}`);
        }
      }
      js += (js ? '\n' : '') + transpiled.code;
    } else if (file.language === 'javascript' || file.name.endsWith('.js')) {
      const jsCheck = transpileTypeScriptDetailed(file.content);
      // 对 .js 文件仅拦截未闭合字符串或外部静态 import，保留原样合法 JS
      for (const err of jsCheck.errors) {
        if (err.includes('import') || err.includes('Unterminated') || err.includes('JSX')) {
          errors.push(`[${file.name}] ${err}`);
        }
      }
      js += (js ? '\n' : '') + file.content;
    }
  }

  if (htmlInlineScripts.length > 0) {
    js = htmlInlineScripts.join('\n') + (js ? '\n' + js : '');
  }

  const instrumentedJs = errors.length === 0 ? instrumentJavaScriptLoops(js, '__labLoopGuard') : '';

  return {
    ok: errors.length === 0,
    html,
    css,
    js,
    instrumentedJs,
    errors,
  };
}

/**
 * 构建用于 `<iframe sandbox="allow-scripts">` 的自包含安全隔离 HTML 文档
 */
export function buildIsolatedSandboxSrcDoc(options: {
  sessionId: string;
  files: LabFile[];
  theme?: 'light' | 'dark';
  maxConsoleEntries?: number;
  cspNonce?: string;
}): string {
  const compiled = compileExperimentFiles(options.files);
  const maxEntries = options.maxConsoleEntries ?? LAB_SECURITY_LIMITS.MAX_CONSOLE_ENTRIES;
  const maxMsgLen = LAB_SECURITY_LIMITS.MAX_CONSOLE_MESSAGE_LENGTH;
  const maxRuntimeErrors = LAB_SECURITY_LIMITS.MAX_RUNTIME_ERRORS;
  const maxTimers = LAB_SECURITY_LIMITS.MAX_ACTIVE_TIMERS;
  const loopBudgetMs = LAB_SECURITY_LIMITS.SYNC_LOOP_BUDGET_MS;
  const isDark = options.theme === 'dark';
  const nonce = (options.cspNonce || createSandboxCspNonce()).replace(/[^a-zA-Z0-9_-]/g, '');

  const safeProtocolJson = encodeSafeInlineJson(LAB_SANDBOX_PROTOCOL_VERSION);
  const safeSessionIdJson = encodeSafeInlineJson(options.sessionId);
  const safeUserHtmlJson = encodeSafeInlineJson(compiled.html);
  const safeUserCssJson = encodeSafeInlineJson(compiled.css);
  const safeUserJsJson = encodeSafeInlineJson(compiled.instrumentedJs);
  const safeCompileErrorsJson = encodeSafeInlineJson(compiled.errors);

  const cspContent = [
    "default-src 'none'",
    `script-src 'nonce-${nonce}' 'unsafe-eval'`,
    "style-src 'unsafe-inline'",
    "img-src data: blob:",
    "media-src data: blob:",
    "font-src data:",
    "connect-src 'none'",
    "frame-src 'none'",
    "child-src 'none'",
    "worker-src 'none'",
    "object-src 'none'",
    "base-uri 'none'",
    "form-action 'none'",
  ].join('; ');

  return `<!DOCTYPE html>
<html lang="zh-CN" data-theme="${isDark ? 'dark' : 'light'}">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="Content-Security-Policy" content="${cspContent}" />
  <style id="lab-base-styles">
    :root {
      color-scheme: light;
      --lab-bg: #f8fafc;
      --lab-fg: #1e293b;
      --lab-muted: #64748b;
      --lab-accent: #425aef;
      --lab-border: #e2e8f0;
      --lab-card: #ffffff;
    }
    html[data-theme="dark"] {
      color-scheme: dark;
      --lab-bg: #0f1420;
      --lab-fg: #f1f5f9;
      --lab-muted: #94a3b8;
      --lab-accent: #425aef;
      --lab-border: rgba(255,255,255,0.1);
      --lab-card: #181c27;
    }
    * { box-sizing: border-box; }
    html, body {
      margin: 0;
      padding: 12px;
      background: var(--lab-bg);
      color: var(--lab-fg);
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "PingFang SC", sans-serif;
      font-size: 14px;
      line-height: 1.5;
    }
    .lab-compile-error-box {
      padding: 12px 14px;
      border-radius: 8px;
      border: 1px solid rgba(239, 68, 68, 0.45);
      background: rgba(239, 68, 68, 0.1);
      color: #ef4444;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 12px;
      white-space: pre-wrap;
      word-break: break-word;
    }
  </style>
  <style id="lab-user-styles"></style>
</head>
<body>
<script nonce="${nonce}">
(function() {
  if (document.currentScript && document.currentScript.parentNode) {
    document.currentScript.parentNode.removeChild(document.currentScript);
  }

  var PROTOCOL = ${safeProtocolJson};
  var SESSION_ID = ${safeSessionIdJson};
  var MAX_ENTRIES = ${Number(maxEntries)};
  var MAX_MSG_LEN = ${Number(maxMsgLen)};
  var MAX_ERRORS = ${Number(maxRuntimeErrors)};
  var MAX_TIMERS = ${Number(maxTimers)};
  var LOOP_BUDGET_MS = ${Number(loopBudgetMs)};

  var origPostMessage = window.parent && window.parent !== window
    ? window.parent.postMessage.bind(window.parent)
    : null;
  var origSetTimeout = window.setTimeout.bind(window);
  var origClearTimeout = window.clearTimeout.bind(window);
  var origSetInterval = window.setInterval.bind(window);
  var origClearInterval = window.clearInterval.bind(window);
  var origPerfNow = (typeof performance !== 'undefined' && performance && typeof performance.now === 'function')
    ? performance.now.bind(performance)
    : Date.now.bind(Date);
  var OrigError = Error;

  var logCount = 0;
  var errorCount = 0;
  var truncatedNotified = false;
  var timerLimitWarned = false;
  var activeTimers = new Set();

  function formatValue(val, depth) {
    if (depth > 2) return '[Object]';
    if (val === undefined) return 'undefined';
    if (val === null) return 'null';
    if (typeof val === 'function') return '[Function: ' + (val.name || 'anonymous') + ']';
    if (val instanceof Error) return val.name + ': ' + val.message;
    if (typeof val === 'object') {
      try {
        return JSON.stringify(val);
      } catch (_e) {
        return Object.prototype.toString.call(val);
      }
    }
    return String(val);
  }

  function sendToHost(type, payload) {
    try {
      if (origPostMessage) {
        origPostMessage({
          protocol: PROTOCOL,
          sessionId: SESSION_ID,
          type: type,
          payload: payload || {}
        }, '*');
      }
    } catch (_err) {}
  }

  function reportError(message, line, column, stack) {
    if (errorCount >= MAX_ERRORS) return;
    errorCount++;
    sendToHost('RUNTIME_ERROR', {
      error: {
        message: String(message || 'Runtime Error').slice(0, MAX_MSG_LEN),
        line: typeof line === 'number' ? line : null,
        column: typeof column === 'number' ? column : null,
        stack: stack ? String(stack).slice(0, MAX_MSG_LEN) : undefined
      }
    });
  }

  function pushConsole(level, rawArgs) {
    if (logCount >= MAX_ENTRIES) {
      if (!truncatedNotified) {
        truncatedNotified = true;
        sendToHost('CONSOLE_EVENT', {
          level: 'warn',
          args: ['[Sandbox Protection] Console 输出已达到单次运行上限 (' + MAX_ENTRIES + ' 条)，后续日志已自动截断。'],
          truncated: true
        });
      }
      return;
    }
    logCount++;
    var formatted = [];
    for (var i = 0; i < rawArgs.length && i < 10; i++) {
      var str = formatValue(rawArgs[i], 0);
      if (str.length > MAX_MSG_LEN) {
        str = str.slice(0, MAX_MSG_LEN) + '...[truncated]';
      }
      formatted.push(str);
    }
    sendToHost('CONSOLE_EVENT', {
      level: level,
      args: formatted
    });
  }

  var origConsole = window.console || {};
  window.console = {
    log: function() { pushConsole('log', arguments); if (origConsole.log) origConsole.log.apply(origConsole, arguments); },
    info: function() { pushConsole('info', arguments); if (origConsole.info) origConsole.info.apply(origConsole, arguments); },
    warn: function() { pushConsole('warn', arguments); if (origConsole.warn) origConsole.warn.apply(origConsole, arguments); },
    error: function() { pushConsole('error', arguments); if (origConsole.error) origConsole.error.apply(origConsole, arguments); },
    clear: function() { pushConsole('info', ['[console.clear]']); }
  };

  window.alert = function(msg) {
    pushConsole('warn', ['[alert intercepted]:', msg]);
  };
  window.confirm = function(msg) {
    pushConsole('warn', ['[confirm intercepted]:', msg]);
    return false;
  };
  window.prompt = function(msg) {
    pushConsole('warn', ['[prompt intercepted]:', msg]);
    return null;
  };
  window.open = function() {
    pushConsole('warn', ['[window.open blocked by sandbox policy]']);
    return null;
  };

  // 显式封禁后台线程构造器（配合 CSP worker-src 'none' 实现同步级 + 内核级双重拦截，防止绕过主线程循环守卫）
  var blockedWorkerCtor = function() {
    throw new DOMException('Worker creation is disabled by Lab Sandbox policy', 'SecurityError');
  };
  try {
    Object.defineProperty(window, 'Worker', {
      value: blockedWorkerCtor,
      writable: false,
      configurable: false,
    });
    Object.defineProperty(window, 'SharedWorker', {
      value: blockedWorkerCtor,
      writable: false,
      configurable: false,
    });
  } catch (_workerDefErr) {
    window.Worker = blockedWorkerCtor;
  }

  // 计时器配额守卫：阻断字符串 eval 形式调用与定时器洪泛炸弹
  window.setTimeout = function(handler, timeout) {
    if (typeof handler !== 'function') {
      pushConsole('warn', ['[Sandbox Policy] 已拦截非函数形式的 setTimeout 调用']);
      return 0;
    }
    if (activeTimers.size >= MAX_TIMERS) {
      if (!timerLimitWarned) {
        timerLimitWarned = true;
        reportError('[Sandbox Protection] 并发计时器数量超过安全上限 (' + MAX_TIMERS + ')，已阻断后续定时器创建。', null, null);
      }
      return 0;
    }
    var extraArgs = Array.prototype.slice.call(arguments, 2);
    var id = origSetTimeout(function() {
      activeTimers.delete(id);
      try {
        handler.apply(window, extraArgs);
      } catch (err) {
        reportError(err && err.message ? err.message : err, null, null, err && err.stack);
      }
    }, Math.max(0, Number(timeout) || 0));
    activeTimers.add(id);
    return id;
  };

  window.clearTimeout = function(id) {
    activeTimers.delete(id);
    return origClearTimeout(id);
  };

  window.setInterval = function(handler, timeout) {
    if (typeof handler !== 'function') {
      pushConsole('warn', ['[Sandbox Policy] 已拦截非函数形式的 setInterval 调用']);
      return 0;
    }
    if (activeTimers.size >= MAX_TIMERS) {
      if (!timerLimitWarned) {
        timerLimitWarned = true;
        reportError('[Sandbox Protection] 并发计时器数量超过安全上限 (' + MAX_TIMERS + ')，已阻断后续定时器创建。', null, null);
      }
      return 0;
    }
    var extraArgs = Array.prototype.slice.call(arguments, 2);
    var safeDelay = Math.max(4, Number(timeout) || 4);
    var id = origSetInterval(function() {
      try {
        handler.apply(window, extraArgs);
      } catch (err) {
        origClearInterval(id);
        activeTimers.delete(id);
        reportError(err && err.message ? err.message : err, null, null, err && err.stack);
      }
    }, safeDelay);
    activeTimers.add(id);
    return id;
  };

  window.clearInterval = function(id) {
    activeTimers.delete(id);
    return origClearInterval(id);
  };

  // 支持宿主动态同步深浅色主题，无需销毁重置运行中的画布状态
  window.addEventListener('message', function(evt) {
    if (!evt || evt.source !== window.parent || !evt.data || typeof evt.data !== 'object') return;
    if (evt.data.protocol === PROTOCOL && evt.data.type === 'SET_THEME' && evt.data.payload) {
      var nextTheme = evt.data.payload.theme === 'dark' ? 'dark' : 'light';
      document.documentElement.setAttribute('data-theme', nextTheme);
    }
  });

  window.addEventListener('error', function(evt) {
    var msg = evt && evt.message ? String(evt.message) : 'Runtime Error';
    reportError(
      msg,
      evt && typeof evt.lineno === 'number' ? evt.lineno : null,
      evt && typeof evt.colno === 'number' ? evt.colno : null,
      evt && evt.error && evt.error.stack ? evt.error.stack : undefined
    );
  });

  window.addEventListener('unhandledrejection', function(evt) {
    var reason = evt && evt.reason ? formatValue(evt.reason, 0) : 'Unhandled Promise Rejection';
    reportError('Unhandled Promise Rejection: ' + reason, null, null);
  });

  // 同步死循环时间预算守卫（防 try/catch 绕过，按宏任务帧自动清零，不影响 60FPS 长期动画）
  var loopTicks = 0;
  var turnDeadline = 0;
  var turnAborted = false;
  var resetScheduled = false;

  function resetTurnBudget() {
    resetScheduled = false;
    turnDeadline = 0;
    loopTicks = 0;
    turnAborted = false;
  }

  function __labLoopGuard() {
    if (turnAborted) {
      throw new OrigError('[Sandbox Timeout] 检测到同步死循环超时 (>' + LOOP_BUDGET_MS + 'ms)，已强制终止当前执行栈。');
    }
    if ((++loopTicks & 4095) !== 0) return;
    var now = origPerfNow();
    if (turnDeadline === 0) {
      turnDeadline = now + LOOP_BUDGET_MS;
      if (!resetScheduled) {
        resetScheduled = true;
        origSetTimeout(resetTurnBudget, 0);
      }
      return;
    }
    if (now > turnDeadline) {
      turnAborted = true;
      throw new OrigError('[Sandbox Timeout] 检测到同步死循环或单帧阻塞超时 (>' + LOOP_BUDGET_MS + 'ms)，已自动熔断保护页面响应。');
    }
  }

  // 安全注入用户 CSS 与 HTML
  var userCssEl = document.getElementById('lab-user-styles');
  if (userCssEl) {
    userCssEl.textContent = ${safeUserCssJson};
  }

  var compileErrors = ${safeCompileErrorsJson};
  sendToHost('SANDBOX_READY', {});

  if (Array.isArray(compileErrors) && compileErrors.length > 0) {
    var errBanner = document.createElement('div');
    errBanner.className = 'lab-compile-error-box';
    errBanner.textContent = compileErrors.join('\\n');
    document.body.innerHTML = '';
    document.body.appendChild(errBanner);
    for (var ce = 0; ce < compileErrors.length; ce++) {
      reportError(compileErrors[ce], null, null);
    }
    return;
  }

  document.body.innerHTML = ${safeUserHtmlJson};

  var startTime = performance.now();
  try {
    var userCode = ${safeUserJsJson};
    var runner = new Function('__labLoopGuard', userCode);
    runner(__labLoopGuard);
    var elapsed = Math.round(performance.now() - startTime);
    sendToHost('EXECUTION_COMPLETE', { durationMs: elapsed });
  } catch (err) {
    var errMsg = err && err.message ? String(err.message) : String(err);
    var errStack = err && err.stack ? String(err.stack) : '';
    reportError(errMsg, null, null, errStack);
  }
})();
</script>
</body>
</html>`;
}
