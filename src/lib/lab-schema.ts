/**
 * Astro Blog「试验田 Lab」数据模型、安全配额、运行时 Schema 校验与受限 TypeScript 子集擦除器
 *
 * 设计原则：
 * 1. 所有实验代码（无论是官方预设还是未来社区投稿）一律视为纯数据（Data），绝不在构建期或主站上下文中执行。
 * 2. 严格限制单文件体积、总源码体积、文件数量、Console 输出条数与消息频率。
 * 3. TypeScript 转换采用零外部依赖的词法扫描器（Lexical Scanner）实现受限类型擦除子集：
 *    - 完整保护字符串、模板字面量、正则表达式与注释字面量不被误改；
 *    - 绝不篡改普通 JS 对象字面量 `{ key: value }` 与三元表达式 `cond ? a : b`；
 *    - 对不支持的需要运行时代码生成的 TS 语法（`enum`、`namespace`、构造函数参数属性、装饰器、JSX/TSX、外部模块 `import`）明确报错拦截，拒绝静默生成错误语义代码。
 */

export type LabCategory =
  | 'physics'
  | 'audio'
  | 'algorithm'
  | 'visual'
  | 'utility'
  | 'ui';

export type LabRuntimeType =
  | 'browser-sandbox'
  | 'execution-tracer'
  | 'livecodes-embed';

export type LabLanguage =
  | 'html-css-js'
  | 'typescript'
  | 'javascript';

export type LabFileLanguage =
  | 'html'
  | 'css'
  | 'javascript'
  | 'typescript'
  | 'json';

export type LabModerationStatus = 'approved' | 'pending' | 'rejected';
export type LabVisibility = 'public' | 'unlisted' | 'draft';
export type LabSourceLicense = 'MIT' | 'Apache-2.0' | 'CC-BY-4.0';

export interface LabFile {
  name: string;
  language: LabFileLanguage;
  content: string;
  readonly?: boolean;
}

export interface LabParamControl {
  id: string;
  label: string;
  type: 'range' | 'number' | 'select' | 'boolean';
  defaultValue: number | string | boolean;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  options?: Array<{ label: string; value: string }>;
}

export interface LabPreviewConfig {
  /**
   * 预览渲染模式：
   * - sandbox-iframe: 在严格隔离的沙盒 iframe 中执行
   * - hybrid: 主页提供轻量原生交互卡片，详情页与工坊在隔离沙盒 iframe 中运行完整可编辑源码
   */
  mode: 'sandbox-iframe' | 'hybrid';
  /**
   * 是否在加载后自动运行：
   * - 官方受信任实验在独立沙盒中可设为 true
   * - 社区投稿或导入的未知代码强制为 false（必须用户手动点击运行）
   */
  autoRun: boolean;
  height?: number;
  timeoutMs: number;
  maxConsoleEntries: number;
  /**
   * 显式声明的外部资源 URL 列表（默认空数组，严禁加载未授权三方脚本）
   */
  externalResources: string[];
}

export type PresetAlgorithmId =
  | 'bubble-sort'
  | 'binary-search'
  | 'quick-sort-recursion';

export interface LabVisualizationConfig {
  enabled: boolean;
  presetAlgorithmId: PresetAlgorithmId;
  defaultInput: string;
  defaultTarget?: number;
  description: string;
}

export interface LabPrinciples {
  summary: string;
  keyPoints: string[];
  complexity?: {
    time: string;
    space: string;
  };
  architectureNote?: string;
}

export interface LabAuthor {
  name: string;
  role: 'owner' | 'contributor' | 'community';
  url?: string;
  avatar?: string;
}

export interface LabExperiment {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  description: string;
  icon: string;
  author: LabAuthor;
  tags: string[];
  category: LabCategory;
  runtime: LabRuntimeType;
  language: LabLanguage;
  files: LabFile[];
  defaultParams?: LabParamControl[];
  previewConfig: LabPreviewConfig;
  visualizationConfig?: LabVisualizationConfig;
  principles: LabPrinciples;
  sourceLicense: LabSourceLicense;
  version: string;
  visibility: LabVisibility;
  moderationStatus: LabModerationStatus;
  featured: boolean;
  forkedFrom?: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * 安全边界与资源限制常量
 */
export const LAB_SECURITY_LIMITS = {
  MAX_FILE_COUNT: 6,
  MAX_SINGLE_FILE_BYTES: 64 * 1024, // 64 KB
  MAX_TOTAL_SOURCE_BYTES: 128 * 1024, // 128 KB
  MAX_CONSOLE_ENTRIES: 200,
  MAX_CONSOLE_MESSAGE_LENGTH: 2048,
  MAX_RUNTIME_ERRORS: 25,
  MAX_HOST_INBOUND_MESSAGES: 350,
  MAX_ACTIVE_TIMERS: 256,
  SYNC_LOOP_BUDGET_MS: 2200,
  MAX_POSTMESSAGE_BYTES: 256 * 1024, // 256 KB
  DEFAULT_EXECUTION_TIMEOUT_MS: 5000,
  MAX_EXECUTION_TIMEOUT_MS: 15000,
  MAX_TRACE_STEPS: 600,
  MAX_TITLE_LENGTH: 80,
  MAX_DESCRIPTION_LENGTH: 500,
  MAX_TAGS_COUNT: 8,
  MAX_TAG_LENGTH: 24,
} as const;

export const LAB_CATEGORY_META: Record<
  LabCategory,
  { label: string; shortLabel: string; description: string }
> = {
  physics: {
    label: '物理与空间仿真',
    shortLabel: '物理仿真',
    description: 'Canvas 天体运行、流体粒子与 CSS 3D 空间动力学实验',
  },
  audio: {
    label: 'Web Audio 声学合成',
    shortLabel: '声学合成',
    description: '基于振荡器、滤波器与包络调制的零样本实时音频合成',
  },
  algorithm: {
    label: '算法与执行追踪',
    shortLabel: '算法追踪',
    description: '数据结构演化、排序搜索单步执行、调用栈与变量时间线可视化',
  },
  utility: {
    label: '工程与金融计算',
    shortLabel: '工程计算',
    description: '多币种结算汇率换算、数学函数推导与前端工程实用原型',
  },
  visual: {
    label: '生成艺术与着色器',
    shortLabel: '生成艺术',
    description: '程序化几何图形、粒子力场与视觉表现力实验',
  },
  ui: {
    label: '微交互与组件原型',
    shortLabel: '交互组件',
    description: '高帧率界面状态机、键盘无障碍与响应式交互组件实验',
  },
};

export interface LabValidationResult<T> {
  ok: boolean;
  data?: T;
  errors: string[];
}

const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const FILENAME_REGEX = /^[a-zA-Z0-9._-]{1,48}$/;
const VALID_CATEGORIES = new Set<LabCategory>([
  'physics',
  'audio',
  'algorithm',
  'visual',
  'utility',
  'ui',
]);
const VALID_RUNTIMES = new Set<LabRuntimeType>([
  'browser-sandbox',
  'execution-tracer',
  'livecodes-embed',
]);
const VALID_LANGUAGES = new Set<LabLanguage>([
  'html-css-js',
  'typescript',
  'javascript',
]);
const VALID_FILE_LANGUAGES = new Set<LabFileLanguage>([
  'html',
  'css',
  'javascript',
  'typescript',
  'json',
]);

export function getUtf8ByteLength(input: string): number {
  if (typeof TextEncoder !== 'undefined') {
    return new TextEncoder().encode(input).length;
  }
  return unescape(encodeURIComponent(input)).length;
}

/**
 * 校验实验文件列表的合法性与大小上限
 */
export function validateLabFiles(files: unknown): LabValidationResult<LabFile[]> {
  const errors: string[] = [];
  if (!Array.isArray(files) || files.length === 0) {
    return { ok: false, errors: ['实验必须至少包含 1 个源码文件。'] };
  }
  if (files.length > LAB_SECURITY_LIMITS.MAX_FILE_COUNT) {
    return {
      ok: false,
      errors: [`源码文件数量不能超过 ${LAB_SECURITY_LIMITS.MAX_FILE_COUNT} 个。`],
    };
  }

  let totalBytes = 0;
  const normalized: LabFile[] = [];
  const seenNames = new Set<string>();

  for (let i = 0; i < files.length; i++) {
    const raw = files[i] as Record<string, unknown> | null;
    if (!raw || typeof raw !== 'object') {
      errors.push(`第 ${i + 1} 个文件格式无效。`);
      continue;
    }

    const name = typeof raw.name === 'string' ? raw.name.trim() : '';
    const language = typeof raw.language === 'string' ? (raw.language.trim() as LabFileLanguage) : 'javascript';
    const content = typeof raw.content === 'string' ? raw.content : '';

    if (!FILENAME_REGEX.test(name) || name.includes('..')) {
      errors.push(`文件名 "${name || '(空)'}" 不合法，仅允许字母、数字、点、下划线和连字符。`);
    }
    if (seenNames.has(name.toLowerCase())) {
      errors.push(`存在重复的文件名 "${name}"。`);
    }
    seenNames.add(name.toLowerCase());

    if (!VALID_FILE_LANGUAGES.has(language)) {
      errors.push(`文件 "${name}" 的语言类型 "${language}" 不受支持。`);
    }

    const fileBytes = getUtf8ByteLength(content);
    if (fileBytes > LAB_SECURITY_LIMITS.MAX_SINGLE_FILE_BYTES) {
      errors.push(
        `文件 "${name}" 体积 (${fileBytes} bytes) 超过单文件上限 (${LAB_SECURITY_LIMITS.MAX_SINGLE_FILE_BYTES} bytes)。`
      );
    }
    totalBytes += fileBytes;

    normalized.push({
      name,
      language,
      content,
      readonly: Boolean(raw.readonly),
    });
  }

  if (totalBytes > LAB_SECURITY_LIMITS.MAX_TOTAL_SOURCE_BYTES) {
    errors.push(
      `总源码体积 (${totalBytes} bytes) 超过实验总上限 (${LAB_SECURITY_LIMITS.MAX_TOTAL_SOURCE_BYTES} bytes)。`
    );
  }

  return {
    ok: errors.length === 0,
    data: errors.length === 0 ? normalized : undefined,
    errors,
  };
}

/**
 * 校验导入/分享/社区投稿的实验数据包
 * 任何外部导入或投稿的实验，其 autoRun 强制重置为 false，externalResources 强制清空，确保零信任默认安全。
 */
export interface LabPortableBundle {
  version: 'lab-bundle-v1' | 'lab-bundle-v2';
  schemaVersion?: 'lab-bundle-v2';
  slug: string;
  title: string;
  description: string;
  category: LabCategory;
  language: LabLanguage;
  files: LabFile[];
  exportedAt: string;
  contentDigest?: string; // 内容校验摘要 (Content Integrity Digest)：仅用于检测意外截断与传输损坏，绝非身份认证或数字签名凭据
  forkedFrom?: string | null;
  sourceKind?: 'imported' | 'community' | 'bundle';
}

export function computeBundleContentDigest(files: LabFile[]): string {
  const serialized = files.map((f) => `${f.name}:${f.language}:${f.content}`).join('|');
  let hash = 0x811c9dc5;
  for (let i = 0; i < serialized.length; i++) {
    hash ^= serialized.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return `fnv1a-${(hash >>> 0).toString(16).padStart(8, '0')}`;
}

export function validateLabPortableBundle(input: unknown): LabValidationResult<LabPortableBundle> {
  const errors: string[] = [];
  if (!input || typeof input !== 'object') {
    return { ok: false, errors: ['导入的数据不是有效的 JSON 对象。'] };
  }

  const obj = input as Record<string, unknown>;
  const rawVersion = typeof obj.schemaVersion === 'string'
    ? obj.schemaVersion
    : typeof obj.version === 'string'
      ? obj.version
      : 'lab-bundle-v1';

  // 版本判定与显式迁移 (Fail-Closed)
  if (rawVersion !== 'lab-bundle-v1' && rawVersion !== 'lab-bundle-v2') {
    return {
      ok: false,
      errors: [`未知的实验包版本 "${rawVersion}"，安全策略已实施强制失败关闭 (Fail-Closed)。`],
    };
  }

  const title = typeof obj.title === 'string' ? obj.title.trim() : '';
  const description = typeof obj.description === 'string' ? obj.description.trim() : '';
  const slugRaw = typeof obj.slug === 'string' ? obj.slug.trim().toLowerCase() : 'custom-experiment';
  const slug = SLUG_REGEX.test(slugRaw) ? slugRaw : 'custom-experiment';
  const category = VALID_CATEGORIES.has(obj.category as LabCategory)
    ? (obj.category as LabCategory)
    : 'utility';
  const language = VALID_LANGUAGES.has(obj.language as LabLanguage)
    ? (obj.language as LabLanguage)
    : 'html-css-js';

  const rawAuthor =
    obj.author && typeof obj.author === 'object' ? (obj.author as Record<string, unknown>) : null;
  const isCommunityPayload =
    obj.sourceKind === 'community' ||
    obj.source === 'community' ||
    rawAuthor?.role === 'community';

  if (!title) {
    errors.push('实验标题不能为空。');
  } else if (title.length > LAB_SECURITY_LIMITS.MAX_TITLE_LENGTH) {
    errors.push(`实验标题不能超过 ${LAB_SECURITY_LIMITS.MAX_TITLE_LENGTH} 个字符。`);
  }

  if (description.length > LAB_SECURITY_LIMITS.MAX_DESCRIPTION_LENGTH) {
    errors.push(`实验简介不能超过 ${LAB_SECURITY_LIMITS.MAX_DESCRIPTION_LENGTH} 个字符。`);
  }

  const filesValidation = validateLabFiles(obj.files);
  if (!filesValidation.ok || !filesValidation.data) {
    errors.push(...filesValidation.errors);
  }

  if (errors.length > 0 || !filesValidation.data) {
    return { ok: false, errors };
  }

  // 若存在内容校验摘要，校验传输完整性 (防止意外截断或损坏)
  const files = filesValidation.data;
  const computedDigest = computeBundleContentDigest(files);
  if (typeof obj.contentDigest === 'string' && obj.contentDigest.trim()) {
    if (obj.contentDigest.trim() !== computedDigest) {
      errors.push('实验代码内容摘要不匹配，数据可能在传输过程中被意外截断或损坏。');
      return { ok: false, errors };
    }
  }

  return {
    ok: true,
    data: {
      version: 'lab-bundle-v2',
      schemaVersion: 'lab-bundle-v2',
      slug,
      title,
      description,
      category,
      language,
      files,
      contentDigest: computedDigest,
      exportedAt: typeof obj.exportedAt === 'string' ? obj.exportedAt : new Date().toISOString(),
      forkedFrom: typeof obj.forkedFrom === 'string' ? obj.forkedFrom : null,
      sourceKind: isCommunityPayload
        ? 'community'
        : obj.sourceKind === 'bundle'
          ? 'bundle'
          : 'imported',
    },
    errors: [],
  };
}

/* ============================================================================
 * 零依赖词法扫描器 (Lexical Scanner) 与受限 TypeScript 类型擦除子集
 * ============================================================================ */

type LexTokenKind =
  | 'ws'
  | 'comment'
  | 'string'
  | 'template'
  | 'regex'
  | 'ident'
  | 'number'
  | 'punct';

type TemplateSegment = { raw: string } | { expr: string };

interface LexToken {
  kind: LexTokenKind;
  value: string;
  hasNewline: boolean;
  templateSegments?: TemplateSegment[];
  unclosed?: boolean;
  closesControlParen?: boolean;
}

export interface TypeScriptTranspileResult {
  ok: boolean;
  code: string;
  errors: string[];
}

const REGEX_PRECEDING_KEYWORDS = new Set([
  'return',
  'throw',
  'case',
  'delete',
  'void',
  'typeof',
  'instanceof',
  'in',
  'of',
  'new',
  'yield',
  'await',
  'else',
  'do',
]);

const CONTROL_PAREN_KEYWORDS = new Set(['if', 'while', 'for', 'with', 'catch', 'switch']);

const MULTI_CHAR_PUNCTS = [
  '>>>=',
  '===',
  '!==',
  '<<=',
  '>>=',
  '**=',
  '&&=',
  '||=',
  '??=',
  '...',
  '=>',
  '?.',
  '==',
  '!=',
  '<=',
  '>=',
  '&&',
  '||',
  '??',
  '++',
  '--',
  '**',
  '+=',
  '-=',
  '*=',
  '/=',
  '%=',
  '&=',
  '|=',
  '^=',
  '<<',
];

function isIdentStart(ch: string): boolean {
  const code = ch.charCodeAt(0);
  return (
    (code >= 65 && code <= 90) ||
    (code >= 97 && code <= 122) ||
    code === 95 ||
    code === 36 ||
    code === 35 || // #privateField
    code > 127
  );
}

function isIdentPart(ch: string): boolean {
  const code = ch.charCodeAt(0);
  return (
    (code >= 65 && code <= 90) ||
    (code >= 97 && code <= 122) ||
    (code >= 48 && code <= 57) ||
    code === 95 ||
    code === 36 ||
    code > 127
  );
}

function isDigit(ch: string): boolean {
  const code = ch.charCodeAt(0);
  return code >= 48 && code <= 57;
}

function canStartRegexAfter(prevSig: LexToken | null): boolean {
  if (!prevSig) return true;
  if (prevSig.kind === 'ident') {
    return REGEX_PRECEDING_KEYWORDS.has(prevSig.value);
  }
  if (prevSig.kind !== 'punct') return false;
  const v = prevSig.value;
  if (v === ')') return Boolean(prevSig.closesControlParen);
  if (v === ']' || v === '++' || v === '--') return false;
  return true;
}

/**
 * 扫描模板字面量（保留静态片段原样，分离 `${...}` 内部表达式以支持递归转换）
 */
function scanTemplateLiteral(
  source: string,
  startIdx: number
): { endIdx: number; rawValue: string; segments: TemplateSegment[]; unclosed: boolean } {
  const len = source.length;
  let i = startIdx + 1; // skip opening `
  let rawStart = i;
  const segments: TemplateSegment[] = [];

  while (i < len) {
    const ch = source[i];
    if (ch === '\\') {
      i += 2;
      continue;
    }
    if (ch === '`') {
      segments.push({ raw: source.slice(rawStart, i) });
      i++;
      return {
        endIdx: i,
        rawValue: source.slice(startIdx, i),
        segments,
        unclosed: false,
      };
    }
    if (ch === '$' && source[i + 1] === '{') {
      segments.push({ raw: source.slice(rawStart, i) });
      i += 2; // skip ${
      const exprStart = i;
      let braceDepth = 1;
      while (i < len && braceDepth > 0) {
        const c = source[i];
        if (c === '\'' || c === '"') {
          const quote = c;
          i++;
          while (i < len && source[i] !== quote) {
            if (source[i] === '\\') i += 2;
            else i++;
          }
          if (i < len) i++;
        } else if (c === '`') {
          const nested = scanTemplateLiteral(source, i);
          i = nested.endIdx;
        } else if (c === '/' && source[i + 1] === '/') {
          i += 2;
          while (i < len && source[i] !== '\n') i++;
        } else if (c === '/' && source[i + 1] === '*') {
          i += 2;
          while (i < len && !(source[i] === '*' && source[i + 1] === '/')) i++;
          if (i < len) i += 2;
        } else if (c === '{') {
          braceDepth++;
          i++;
        } else if (c === '}') {
          braceDepth--;
          if (braceDepth === 0) break;
          i++;
        } else {
          i++;
        }
      }
      const exprContent = source.slice(exprStart, i);
      segments.push({ expr: exprContent });
      if (i < len && source[i] === '}') {
        i++; // skip closing }
      }
      rawStart = i;
      continue;
    }
    i++;
  }

  segments.push({ raw: source.slice(rawStart, i) });
  return {
    endIdx: len,
    rawValue: source.slice(startIdx, len),
    segments,
    unclosed: true,
  };
}

function tokenizeTsOrJs(source: string): LexToken[] {
  const tokens: LexToken[] = [];
  const len = source.length;
  let i = 0;
  let prevSig: LexToken | null = null;
  const parenControlStack: boolean[] = [];

  const pushSig = (tok: LexToken) => {
    tokens.push(tok);
    prevSig = tok;
  };

  while (i < len) {
    const ch = source[i];

    // 1. Whitespace
    if (ch === ' ' || ch === '\t' || ch === '\n' || ch === '\r' || ch === '\f' || ch === '\v') {
      const start = i;
      let hasNl = false;
      while (i < len) {
        const c = source[i];
        if (c === '\n' || c === '\r') hasNl = true;
        else if (c !== ' ' && c !== '\t' && c !== '\f' && c !== '\v') break;
        i++;
      }
      tokens.push({ kind: 'ws', value: source.slice(start, i), hasNewline: hasNl });
      continue;
    }

    // 2. Single-line comment
    if (ch === '/' && source[i + 1] === '/') {
      const start = i;
      i += 2;
      while (i < len && source[i] !== '\n' && source[i] !== '\r') i++;
      tokens.push({ kind: 'comment', value: source.slice(start, i), hasNewline: false });
      continue;
    }

    // 3. Multi-line comment
    if (ch === '/' && source[i + 1] === '*') {
      const start = i;
      let hasNl = false;
      i += 2;
      let closed = false;
      while (i < len) {
        if (source[i] === '\n' || source[i] === '\r') hasNl = true;
        if (source[i] === '*' && source[i + 1] === '/') {
          i += 2;
          closed = true;
          break;
        }
        i++;
      }
      tokens.push({
        kind: 'comment',
        value: source.slice(start, i),
        hasNewline: hasNl,
        unclosed: !closed,
      });
      continue;
    }

    // 4. String literal
    if (ch === '\'' || ch === '"') {
      const quote = ch;
      const start = i;
      let hasNl = false;
      let closed = false;
      i++;
      while (i < len) {
        const c = source[i];
        if (c === '\\') {
          if (source[i + 1] === '\n' || source[i + 1] === '\r') hasNl = true;
          i += 2;
          continue;
        }
        if (c === quote) {
          i++;
          closed = true;
          break;
        }
        if (c === '\n' || c === '\r') {
          hasNl = true;
          break;
        }
        i++;
      }
      pushSig({
        kind: 'string',
        value: source.slice(start, i),
        hasNewline: hasNl,
        unclosed: !closed,
      });
      continue;
    }

    // 5. Template literal
    if (ch === '`') {
      const tpl = scanTemplateLiteral(source, i);
      i = tpl.endIdx;
      pushSig({
        kind: 'template',
        value: tpl.rawValue,
        hasNewline: tpl.rawValue.includes('\n') || tpl.rawValue.includes('\r'),
        templateSegments: tpl.segments,
        unclosed: tpl.unclosed,
      });
      continue;
    }

    // 6. RegExp literal (disambiguated from division `/` and JSX `</tag>`)
    if (ch === '/' && source[i + 1] !== '/' && source[i + 1] !== '*') {
      const isJsxClose =
        prevSig?.kind === 'punct' &&
        prevSig.value === '<' &&
        (source[i + 1] === '>' || (i + 1 < len && isIdentStart(source[i + 1])));

      if (!isJsxClose && canStartRegexAfter(prevSig)) {
        let j = i + 1;
        let inClass = false;
        let foundEnd = false;
        while (j < len) {
          const rc = source[j];
          if (rc === '\n' || rc === '\r') break;
          if (rc === '\\') {
            if (j + 1 < len && source[j + 1] !== '\n' && source[j + 1] !== '\r') {
              j += 2;
              continue;
            }
            break;
          }
          if (rc === '[') {
            inClass = true;
          } else if (rc === ']') {
            inClass = false;
          } else if (rc === '/' && !inClass) {
            j++;
            while (j < len && /[a-zA-Z]/.test(source[j])) j++;
            foundEnd = true;
            break;
          }
          j++;
        }
        if (foundEnd && j > i + 2) {
          const val = source.slice(i, j);
          i = j;
          pushSig({ kind: 'regex', value: val, hasNewline: false });
          continue;
        }
      }
    }

    // 7. Number literal
    if (isDigit(ch) || (ch === '.' && i + 1 < len && isDigit(source[i + 1]))) {
      const start = i;
      if (ch === '0' && (source[i + 1] === 'x' || source[i + 1] === 'X')) {
        i += 2;
        while (i < len && /[0-9a-fA-F_]/.test(source[i])) i++;
      } else if (ch === '0' && (source[i + 1] === 'b' || source[i + 1] === 'B')) {
        i += 2;
        while (i < len && /[01_]/.test(source[i])) i++;
      } else if (ch === '0' && (source[i + 1] === 'o' || source[i + 1] === 'O')) {
        i += 2;
        while (i < len && /[0-7_]/.test(source[i])) i++;
      } else {
        while (i < len && /[0-9_]/.test(source[i])) i++;
        if (source[i] === '.') {
          i++;
          while (i < len && /[0-9_]/.test(source[i])) i++;
        }
        if (source[i] === 'e' || source[i] === 'E') {
          i++;
          if (source[i] === '+' || source[i] === '-') i++;
          while (i < len && /[0-9_]/.test(source[i])) i++;
        }
      }
      if (source[i] === 'n') i++;
      pushSig({ kind: 'number', value: source.slice(start, i), hasNewline: false });
      continue;
    }

    // 8. Identifier / Keyword
    if (isIdentStart(ch)) {
      const start = i;
      i++;
      while (i < len && isIdentPart(source[i])) i++;
      pushSig({ kind: 'ident', value: source.slice(start, i), hasNewline: false });
      continue;
    }

    // 9. Punctuation (Note: keep `>` single unless `>=` so nested generics `Array<Set<number>>` balance cleanly)
    let matchedPunct = '';
    for (const mp of MULTI_CHAR_PUNCTS) {
      if (source.startsWith(mp, i)) {
        matchedPunct = mp;
        break;
      }
    }
    if (!matchedPunct) {
      matchedPunct = ch;
    }
    i += matchedPunct.length;

    const tok: LexToken = { kind: 'punct', value: matchedPunct, hasNewline: false };
    if (matchedPunct === '(') {
      const isControl =
        prevSig?.kind === 'ident' && CONTROL_PAREN_KEYWORDS.has(prevSig.value);
      parenControlStack.push(isControl);
    } else if (matchedPunct === ')') {
      tok.closesControlParen = parenControlStack.pop() ?? false;
    }
    pushSig(tok);
  }

  return tokens;
}

function countNewlinesInRange(tokens: LexToken[], start: number, endExclusive: number): string {
  let nlCount = 0;
  for (let i = start; i < endExclusive && i < tokens.length; i++) {
    const val = tokens[i].value;
    for (let c = 0; c < val.length; c++) {
      if (val[c] === '\n') nlCount++;
    }
  }
  return nlCount > 0 ? '\n'.repeat(nlCount) : '';
}

function nextSigIndex(tokens: LexToken[], from: number): number {
  for (let i = from; i < tokens.length; i++) {
    if (tokens[i].kind !== 'ws' && tokens[i].kind !== 'comment') return i;
  }
  return -1;
}

function prevSigIndex(tokens: LexToken[], from: number): number {
  for (let i = Math.min(from, tokens.length - 1); i >= 0; i--) {
    if (tokens[i].kind !== 'ws' && tokens[i].kind !== 'comment') return i;
  }
  return -1;
}

function hasNewlineBetween(tokens: LexToken[], startExclusive: number, endExclusive: number): boolean {
  for (let i = startExclusive + 1; i < endExclusive && i < tokens.length; i++) {
    if (tokens[i].hasNewline) return true;
  }
  return false;
}

function findMatchingDelim(
  tokens: LexToken[],
  openIdx: number,
  openChar: string,
  closeChar: string
): number {
  let depth = 0;
  for (let i = openIdx; i < tokens.length; i++) {
    const t = tokens[i];
    if (t.kind !== 'punct') continue;
    if (t.value === openChar) depth++;
    else if (t.value === closeChar) {
      depth--;
      if (depth === 0) return i;
    }
  }
  return -1;
}

/**
 * 扫描平衡的泛型尖括号 `<...>`，并拒绝包含逻辑比较运算符或分号的非泛型表达式
 */
function findBalancedGenericClose(tokens: LexToken[], openIdx: number): number {
  if (tokens[openIdx]?.kind !== 'punct' || tokens[openIdx].value !== '<') return -1;
  let angle = 0;
  let paren = 0;
  let brace = 0;
  let bracket = 0;

  for (let i = openIdx; i < tokens.length; i++) {
    const t = tokens[i];
    if (t.kind === 'ws' || t.kind === 'comment') continue;
    if (t.kind === 'regex') return -1;
    if (t.kind === 'punct') {
      const v = t.value;
      if (
        brace === 0 &&
        paren === 0 &&
        (v === ';' || v === '&&' || v === '||' || v === '==' || v === '===' || v === '!=' || v === '!==' || v === '++' || v === '--')
      ) {
        return -1;
      }
      if (v === '(') paren++;
      else if (v === ')') {
        paren--;
        if (paren < 0) return -1;
      } else if (v === '{') brace++;
      else if (v === '}') {
        brace--;
        if (brace < 0) return -1;
      } else if (v === '[') bracket++;
      else if (v === ']') {
        bracket--;
        if (bracket < 0) return -1;
      } else if (v === '<' && paren === 0 && brace === 0 && bracket === 0) {
        angle++;
      } else if (v === '>' && paren === 0 && brace === 0 && bracket === 0) {
        angle--;
        if (angle === 0) return i;
      }
    }
  }
  return -1;
}

const DISALLOWED_TYPE_CONTINUATION_PUNCTS = new Set([
  ',',
  ';',
  ')',
  ']',
  '}',
  '=',
  '==',
  '===',
  '!=',
  '!==',
  '+',
  '-',
  '*',
  '/',
  '%',
  '**',
  '&&',
  '||',
  '??',
  '+=',
  '-=',
  '*=',
  '/=',
]);

const TYPE_PREFIX_KEYWORDS = new Set([
  'readonly',
  'keyof',
  'typeof',
  'unique',
  'infer',
  'asserts',
  'abstract',
  'new',
]);

/**
 * 从 `startIdx` 开始跳过一个完整的 TypeScript 类型表达式，返回类型表达式最后一个有效 token 的下标
 * @param mode
 * - `'annotation'`: 变量/参数 `: Type`（遇到深度 0 的 `=`、`,`、`;`、`)`、`{` 或 `in`/`of` 终止）
 * - `'return'`: 函数/箭头返回类型 `: ReturnType`（遇到深度 0 的 `{`、`=>` 或 `;` 终止）
 * - `'assertion'`: `as Type` / `satisfies Type`（按类型原子贪婪匹配联合/交叉/泛型/数组后缀，不在普通运算符处越界）
 * - `'alias'`: `type Foo = Type`（遇到深度 0 的 `;` 或非续行换行终止）
 */
function scanTypeExpressionEnd(
  tokens: LexToken[],
  startIdx: number,
  mode: 'annotation' | 'return' | 'assertion' | 'alias'
): number {
  let i = nextSigIndex(tokens, startIdx);
  if (i === -1) return startIdx - 1;

  if (mode === 'assertion') {
    return scanAssertionTypeEnd(tokens, i);
  }

  let paren = 0;
  let brace = 0;
  let bracket = 0;
  let angle = 0;
  let lastConsumed = i - 1;

  while (i < tokens.length) {
    const t = tokens[i];
    if (t.kind === 'ws' || t.kind === 'comment') {
      // 在 alias / annotation 模式下，若处于深度 0 且遇到换行，检查下一有效 token 是否继续类型
      if (
        t.hasNewline &&
        paren === 0 &&
        brace === 0 &&
        bracket === 0 &&
        angle === 0 &&
        lastConsumed >= startIdx
      ) {
        const nxt = nextSigIndex(tokens, i + 1);
        if (nxt === -1) break;
        const nv = tokens[nxt].value;
        const continues =
          nv === '|' ||
          nv === '&' ||
          nv === '?' ||
          nv === ':' ||
          nv === 'extends' ||
          (mode === 'return' && (nv === '=>' || nv === '{'));
        if (!continues && mode === 'alias') {
          break;
        }
        if (!continues && mode === 'annotation' && nv !== '=' && nv !== ',' && nv !== ')' && nv !== ';') {
          break;
        }
      }
      i++;
      continue;
    }

    const v = t.value;
    if (paren === 0 && brace === 0 && bracket === 0 && angle === 0) {
      if (mode === 'annotation') {
        if (
          v === '=' ||
          v === ',' ||
          v === ';' ||
          v === ')' ||
          (t.kind === 'ident' && (v === 'of' || v === 'in'))
        ) {
          break;
        }
      } else if (mode === 'return') {
        if (v === '=>' || v === ';') {
          break;
        }
        if (v === '{') {
          // `{ a: number } =>` vs 函数体 `{ ... }`：检查匹配的 `}` 之后是否紧跟 `=>` 或 `|` / `&` / `[]`
          const closeBrace = findMatchingDelim(tokens, i, '{', '}');
          if (closeBrace !== -1) {
            const afterBrace = nextSigIndex(tokens, closeBrace + 1);
            const afterVal = afterBrace !== -1 ? tokens[afterBrace].value : '';
            if (afterVal === '=>' || afterVal === '|' || afterVal === '&' || afterVal === '[') {
              lastConsumed = closeBrace;
              i = closeBrace + 1;
              continue;
            }
          }
          break;
        }
      } else if (mode === 'alias') {
        if (v === ';') {
          break;
        }
      }
    }

    if (t.kind === 'punct') {
      if (v === '(') paren++;
      else if (v === ')') {
        if (paren === 0) break;
        paren--;
      } else if (v === '{') brace++;
      else if (v === '}') {
        if (brace === 0) break;
        brace--;
      } else if (v === '[') bracket++;
      else if (v === ']') {
        if (bracket === 0) break;
        bracket--;
      } else if (v === '<' && paren === 0 && brace === 0 && bracket === 0) {
        const closeGen = findBalancedGenericClose(tokens, i);
        if (closeGen !== -1) {
          lastConsumed = closeGen;
          i = closeGen + 1;
          continue;
        }
      }
    }

    lastConsumed = i;
    i++;
  }

  return lastConsumed;
}

/**
 * 专门用于 `expr as Type` / `expr satisfies Type` 的精确类型原子扫描器
 */
function scanAssertionTypeEnd(tokens: LexToken[], firstIdx: number): number {
  let cur = firstIdx;
  let lastEnd = firstIdx - 1;

  while (cur !== -1 && cur < tokens.length) {
    // 前缀修饰符 `readonly` / `keyof` / `typeof`
    while (
      cur !== -1 &&
      tokens[cur].kind === 'ident' &&
      TYPE_PREFIX_KEYWORDS.has(tokens[cur].value)
    ) {
      lastEnd = cur;
      cur = nextSigIndex(tokens, cur + 1);
    }
    if (cur === -1) break;

    const tok = tokens[cur];
    if (tok.kind === 'punct' && (tok.value === '|' || tok.value === '&') && cur === firstIdx) {
      cur = nextSigIndex(tokens, cur + 1);
      if (cur === -1) break;
    }

    const atomTok = tokens[cur];
    if (atomTok.kind === 'ident' || atomTok.kind === 'string' || atomTok.kind === 'number') {
      lastEnd = cur;
      // 消费命名空间限定 `Ns.Sub.Type`（但绝不消费方法调用 `.foo()`）
      let nxt = nextSigIndex(tokens, lastEnd + 1);
      while (
        nxt !== -1 &&
        !hasNewlineBetween(tokens, lastEnd, nxt) &&
        tokens[nxt].kind === 'punct' &&
        tokens[nxt].value === '.'
      ) {
        const propIdx = nextSigIndex(tokens, nxt + 1);
        if (propIdx === -1 || tokens[propIdx].kind !== 'ident') break;
        const afterProp = nextSigIndex(tokens, propIdx + 1);
        if (afterProp !== -1 && tokens[afterProp].kind === 'punct' && tokens[afterProp].value === '(') {
          break;
        }
        lastEnd = propIdx;
        nxt = nextSigIndex(tokens, lastEnd + 1);
      }

      // 消费泛型参数 `Type<A, B>`
      nxt = nextSigIndex(tokens, lastEnd + 1);
      if (
        nxt !== -1 &&
        !hasNewlineBetween(tokens, lastEnd, nxt) &&
        tokens[nxt].kind === 'punct' &&
        tokens[nxt].value === '<'
      ) {
        const closeGen = findBalancedGenericClose(tokens, nxt);
        if (closeGen !== -1) {
          lastEnd = closeGen;
        }
      }
    } else if (atomTok.kind === 'punct' && atomTok.value === '{') {
      const closeBrace = findMatchingDelim(tokens, cur, '{', '}');
      if (closeBrace === -1) break;
      lastEnd = closeBrace;
    } else if (atomTok.kind === 'punct' && atomTok.value === '[') {
      const closeBracket = findMatchingDelim(tokens, cur, '[', ']');
      if (closeBracket === -1) break;
      lastEnd = closeBracket;
    } else if (atomTok.kind === 'punct' && atomTok.value === '(') {
      const closeParen = findMatchingDelim(tokens, cur, '(', ')');
      if (closeParen === -1) break;
      lastEnd = closeParen;
      const afterParen = nextSigIndex(tokens, closeParen + 1);
      if (afterParen !== -1 && tokens[afterParen].kind === 'punct' && tokens[afterParen].value === '=>') {
        const retStart = nextSigIndex(tokens, afterParen + 1);
        if (retStart !== -1) {
          const retEnd = scanAssertionTypeEnd(tokens, retStart);
          if (retEnd >= retStart) lastEnd = retEnd;
        }
      }
    } else {
      break;
    }

    // 消费后缀数组维度 `Type[]` / `Type[number]`
    let suffixIdx = nextSigIndex(tokens, lastEnd + 1);
    while (
      suffixIdx !== -1 &&
      !hasNewlineBetween(tokens, lastEnd, suffixIdx) &&
      tokens[suffixIdx].kind === 'punct' &&
      tokens[suffixIdx].value === '['
    ) {
      const closeBk = findMatchingDelim(tokens, suffixIdx, '[', ']');
      if (closeBk === -1) break;
      // 仅当 `[]` 为空或内部是类型名时视作类型后缀（区分下一句 `[a, b].forEach`）
      const insideSig = nextSigIndex(tokens, suffixIdx + 1);
      if (insideSig === closeBk || (insideSig !== -1 && closeBk - suffixIdx <= 4)) {
        lastEnd = closeBk;
        suffixIdx = nextSigIndex(tokens, lastEnd + 1);
      } else {
        break;
      }
    }

    // 检查同一行（或下一行显式 `|` / `&`）是否继续联合或交叉类型
    const unionIdx = nextSigIndex(tokens, lastEnd + 1);
    if (
      unionIdx !== -1 &&
      tokens[unionIdx].kind === 'punct' &&
      (tokens[unionIdx].value === '|' || tokens[unionIdx].value === '&')
    ) {
      const nextAtom = nextSigIndex(tokens, unionIdx + 1);
      if (nextAtom !== -1 && !DISALLOWED_TYPE_CONTINUATION_PUNCTS.has(tokens[nextAtom].value)) {
        cur = nextAtom;
        continue;
      }
    }
    break;
  }

  return lastEnd;
}

function isStatementStartBoundary(tokens: LexToken[], sigIdx: number): boolean {
  const prev = prevSigIndex(tokens, sigIdx - 1);
  if (prev === -1) return true;
  const pt = tokens[prev];
  if (pt.kind === 'punct') {
    if (pt.value === ';' || pt.value === '{' || pt.value === '}') return true;
    if (pt.value === ')' && pt.closesControlParen) return true;
  }
  if (pt.kind === 'ident' && (pt.value === 'export' || pt.value === 'declare')) return true;
  if (hasNewlineBetween(tokens, prev, sigIdx)) {
    // ASI 换行语句边界（排除 `.` 属性链）
    if (!(pt.kind === 'punct' && (pt.value === '.' || pt.value === '?.'))) {
      return true;
    }
  }
  return false;
}

/**
 * 判定从 `openParenIdx` 开始的 `(...)` 是否属于箭头函数参数列表：
 * - `(params) => ...`
 * - `(params): ReturnType => ...`（同时正确排除三元表达式 `cond ? (a) : (b) => b` 歧义）
 */
function matchArrowFunctionSignature(
  tokens: LexToken[],
  openParenIdx: number,
  openTernaryDepth: number
): { isArrow: boolean; closeParenIdx: number; arrowIdx: number } {
  const closeParenIdx = findMatchingDelim(tokens, openParenIdx, '(', ')');
  if (closeParenIdx === -1) {
    return { isArrow: false, closeParenIdx: -1, arrowIdx: -1 };
  }

  const afterClose = nextSigIndex(tokens, closeParenIdx + 1);
  if (afterClose === -1) {
    return { isArrow: false, closeParenIdx, arrowIdx: -1 };
  }

  if (tokens[afterClose].kind === 'punct' && tokens[afterClose].value === '=>') {
    return { isArrow: true, closeParenIdx, arrowIdx: afterClose };
  }

  if (tokens[afterClose].kind === 'punct' && tokens[afterClose].value === ':') {
    const retEnd = scanTypeExpressionEnd(tokens, afterClose + 1, 'return');
    if (retEnd >= afterClose + 1) {
      const maybeArrow = nextSigIndex(tokens, retEnd + 1);
      if (maybeArrow !== -1 && tokens[maybeArrow].kind === 'punct' && tokens[maybeArrow].value === '=>') {
        // 防范三元表达式歧义：`cond ? (a) : (b) => b + 1`
        if (openTernaryDepth > 0) {
          let hasOuterColonLater = false;
          let p = 0;
          let b = 0;
          let k = 0;
          for (let s = maybeArrow + 1; s < tokens.length; s++) {
            const st = tokens[s];
            if (st.kind !== 'punct') continue;
            const sv = st.value;
            if (p === 0 && b === 0 && k === 0) {
              if (sv === ';' || sv === ',' || sv === ')' || sv === ']' || sv === '}') break;
              if (sv === ':') {
                hasOuterColonLater = true;
                break;
              }
            }
            if (sv === '(') p++;
            else if (sv === ')') p--;
            else if (sv === '{') b++;
            else if (sv === '}') b--;
            else if (sv === '[') k++;
            else if (sv === ']') k--;
          }
          if (!hasOuterColonLater) {
            return { isArrow: false, closeParenIdx, arrowIdx: -1 };
          }
        }
        return { isArrow: true, closeParenIdx, arrowIdx: maybeArrow };
      }
    }
  }

  return { isArrow: false, closeParenIdx, arrowIdx: -1 };
}

const POSTFIX_NON_NULL_PRECEDING_KEYWORDS = new Set([
  'return',
  'throw',
  'case',
  'delete',
  'void',
  'typeof',
  'instanceof',
  'in',
  'of',
  'new',
  'yield',
  'await',
  'else',
  'do',
  'const',
  'let',
  'var',
  'function',
  'class',
]);

const BINARY_KEYWORD_CONTINUATIONS = new Set([
  'as',
  'satisfies',
  'in',
  'instanceof',
  'of',
]);

function isPostfixNonNullAssertion(tokens: LexToken[], bangIdx: number): boolean {
  const prev = prevSigIndex(tokens, bangIdx - 1);
  if (prev === -1) return false;
  if (hasNewlineBetween(tokens, prev, bangIdx)) return false;

  const pt = tokens[prev];
  let validTarget = false;
  if (pt.kind === 'ident') {
    validTarget = !POSTFIX_NON_NULL_PRECEDING_KEYWORDS.has(pt.value);
  } else if (pt.kind === 'template' || pt.kind === 'string' || pt.kind === 'number') {
    validTarget = true;
  } else if (pt.kind === 'punct') {
    if (pt.value === ']') validTarget = true;
    else if (pt.value === ')' && !pt.closesControlParen) validTarget = true;
  }
  if (!validTarget) return false;

  const nxt = nextSigIndex(tokens, bangIdx + 1);
  if (nxt === -1) return true;
  if (hasNewlineBetween(tokens, bangIdx, nxt)) return true;

  const nt = tokens[nxt];
  if (nt.kind === 'punct') {
    // `!!x` 属于前缀双取反；`!~x` 同理
    if (nt.value === '!' || nt.value === '~') return false;
    return true;
  }
  if (nt.kind === 'ident') {
    return BINARY_KEYWORD_CONTINUATIONS.has(nt.value);
  }
  return false;
}

function detectJsxSyntax(tokens: LexToken[], openAngleIdx: number): boolean {
  const first = nextSigIndex(tokens, openAngleIdx + 1);
  if (first === -1) return false;
  // `<>` JSX Fragment
  if (tokens[first].kind === 'punct' && tokens[first].value === '>') {
    return true;
  }
  // `</Tag>` or `</>` JSX Closing Tag
  if (tokens[first].kind === 'punct' && tokens[first].value === '/') {
    const second = nextSigIndex(tokens, first + 1);
    if (second !== -1) {
      if (tokens[second].kind === 'punct' && tokens[second].value === '>') return true;
      if (tokens[second].kind === 'ident') {
        const third = nextSigIndex(tokens, second + 1);
        if (third !== -1 && tokens[third].kind === 'punct' && tokens[third].value === '>') {
          return true;
        }
      }
    }
  }
  // `<Tag ... />` Self-closing JSX Tag
  if (tokens[first].kind === 'ident') {
    let brace = 0;
    let paren = 0;
    for (let k = first + 1; k < tokens.length && k < first + 120; k++) {
      const tk = tokens[k];
      if (tk.kind !== 'punct') continue;
      if (tk.value === '{') brace++;
      else if (tk.value === '}') {
        brace--;
        if (brace < 0) break;
      } else if (tk.value === '(') paren++;
      else if (tk.value === ')') {
        paren--;
        if (paren < 0) break;
      } else if (brace === 0 && paren === 0) {
        if (tk.value === ';') break;
        if (tk.value === '>') {
          const beforeClose = prevSigIndex(tokens, k - 1);
          if (beforeClose !== -1 && tokens[beforeClose].kind === 'punct' && tokens[beforeClose].value === '/') {
            return true;
          }
          break;
        }
      }
    }
  }
  return false;
}

/**
 * 转换参数列表 `(a: number, b?: string = 'x', { c }: Opts)` 为合法 JS 参数列表
 */
function transformParameterList(
  tokens: LexToken[],
  openParenIdx: number,
  closeParenIdx: number,
  isConstructor: boolean,
  errors: string[]
): string {
  const out: string[] = ['('];
  let i = openParenIdx + 1;

  while (i < closeParenIdx) {
    // 保留前置空白与注释
    while (i < closeParenIdx && (tokens[i].kind === 'ws' || tokens[i].kind === 'comment')) {
      out.push(tokens[i].value);
      i++;
    }
    if (i >= closeParenIdx) break;

    // 检查 TypeScript 伪参数 `this: SomeType`
    if (
      tokens[i].kind === 'ident' &&
      tokens[i].value === 'this' &&
      nextSigIndex(tokens, i + 1) !== -1 &&
      tokens[nextSigIndex(tokens, i + 1)].value === ':'
    ) {
      const colonIdx = nextSigIndex(tokens, i + 1);
      const typeEnd = scanTypeExpressionEnd(tokens, colonIdx + 1, 'annotation');
      let skipEnd = Math.min(closeParenIdx, Math.max(colonIdx, typeEnd) + 1);
      const maybeComma = nextSigIndex(tokens, skipEnd);
      if (maybeComma !== -1 && maybeComma < closeParenIdx && tokens[maybeComma].value === ',') {
        skipEnd = maybeComma + 1;
        while (skipEnd < closeParenIdx && tokens[skipEnd].kind === 'ws' && !tokens[skipEnd].hasNewline) {
          skipEnd++;
        }
      }
      out.push(countNewlinesInRange(tokens, i, skipEnd));
      i = skipEnd;
      continue;
    }

    // 检查构造函数参数属性 `constructor(public x: number)`
    if (
      tokens[i].kind === 'ident' &&
      (tokens[i].value === 'public' ||
        tokens[i].value === 'private' ||
        tokens[i].value === 'protected' ||
        tokens[i].value === 'readonly' ||
        tokens[i].value === 'override')
    ) {
      const afterMod = nextSigIndex(tokens, i + 1);
      if (
        afterMod !== -1 &&
        afterMod < closeParenIdx &&
        tokens[afterMod].value !== ':' &&
        tokens[afterMod].value !== '=' &&
        tokens[afterMod].value !== ','
      ) {
        if (isConstructor) {
          errors.push(
            `不支持 TypeScript 构造函数参数属性（如 \`constructor(${tokens[i].value} ...)\`），该语法需要生成运行时赋值代码。请显式声明类字段并在构造函数内使用 \`this.x = x\`。`
          );
        }
        // 非构造函数中冗余的修饰符直接擦除
        i = afterMod;
      }
    }

    if (tokens[i].kind === 'punct' && tokens[i].value === '@') {
      errors.push('不支持参数装饰器（`@decorator`）语法。');
    }

    // Rest `...`
    if (tokens[i].kind === 'punct' && tokens[i].value === '...') {
      out.push('...');
      i++;
      while (i < closeParenIdx && (tokens[i].kind === 'ws' || tokens[i].kind === 'comment')) {
        out.push(tokens[i].value);
        i++;
      }
    }

    if (i >= closeParenIdx) break;

    // 参数绑定名：标识符、`{...}` 或 `[...]`
    if (tokens[i].kind === 'ident') {
      out.push(tokens[i].value);
      i++;
    } else if (tokens[i].kind === 'punct' && (tokens[i].value === '{' || tokens[i].value === '[')) {
      const closePat = findMatchingDelim(
        tokens,
        i,
        tokens[i].value,
        tokens[i].value === '{' ? '}' : ']'
      );
      if (closePat !== -1 && closePat < closeParenIdx) {
        for (let k = i; k <= closePat; k++) out.push(tokens[k].value);
        i = closePat + 1;
      } else {
        out.push(tokens[i].value);
        i++;
      }
    }

    // 可选参数问号 `?`
    const maybeQ = nextSigIndex(tokens, i);
    if (maybeQ !== -1 && maybeQ < closeParenIdx && tokens[maybeQ].kind === 'punct' && tokens[maybeQ].value === '?') {
      out.push(countNewlinesInRange(tokens, i, maybeQ + 1));
      i = maybeQ + 1;
    }

    // 参数类型注解 `: Type`
    const maybeColon = nextSigIndex(tokens, i);
    if (
      maybeColon !== -1 &&
      maybeColon < closeParenIdx &&
      tokens[maybeColon].kind === 'punct' &&
      tokens[maybeColon].value === ':'
    ) {
      const typeEnd = scanTypeExpressionEnd(tokens, maybeColon + 1, 'annotation');
      const skipEnd = Math.min(closeParenIdx, Math.max(maybeColon, typeEnd) + 1);
      out.push(countNewlinesInRange(tokens, i, skipEnd));
      i = skipEnd;
    }

    // 默认值表达式 `= defaultExpr`（递归转换默认值内部的 TS 断言/泛型等）
    const maybeEq = nextSigIndex(tokens, i);
    if (
      maybeEq !== -1 &&
      maybeEq < closeParenIdx &&
      tokens[maybeEq].kind === 'punct' &&
      tokens[maybeEq].value === '='
    ) {
      let p = 0;
      let b = 0;
      let k = 0;
      let exprEnd = maybeEq + 1;
      while (exprEnd < closeParenIdx) {
        const tk = tokens[exprEnd];
        if (tk.kind === 'punct') {
          if (p === 0 && b === 0 && k === 0 && tk.value === '<') {
            const cg = findBalancedGenericClose(tokens, exprEnd);
            if (cg !== -1 && cg < closeParenIdx) {
              exprEnd = cg + 1;
              continue;
            }
          }
          if (p === 0 && b === 0 && k === 0 && tk.value === ',') break;
          if (tk.value === '(') p++;
          else if (tk.value === ')') p--;
          else if (tk.value === '{') b++;
          else if (tk.value === '}') b--;
          else if (tk.value === '[') k++;
          else if (tk.value === ']') k--;
        }
        exprEnd++;
      }
      const subSlice = tokens
        .slice(i, exprEnd)
        .map((t) => t.value)
        .join('');
      const subRes = transpileTypeScriptDetailed(subSlice);
      if (!subRes.ok) errors.push(...subRes.errors);
      out.push(subRes.code);
      i = exprEnd;
    }

    // 消费逗号 `,` 或推进下标防止死循环
    if (i < closeParenIdx) {
      out.push(tokens[i].value);
      i++;
    }
  }

  out.push(')');
  return out.join('');
}

function renderTokenValue(tok: LexToken, errors: string[]): string {
  if (tok.kind === 'template' && tok.templateSegments) {
    if (tok.unclosed) {
      return tok.value;
    }
    let built = '`';
    for (const seg of tok.templateSegments) {
      if ('raw' in seg) {
        built += seg.raw;
      } else {
        const inner = transpileTypeScriptDetailed(seg.expr);
        if (!inner.ok) errors.push(...inner.errors);
        built += '${' + inner.code + '}';
      }
    }
    built += '`';
    return built;
  }
  return tok.value;
}

/**
 * 转换 `class { ... }` 类体内部的字段可见性修饰符、字段类型注解、方法签名与构造函数参数校验
 */
function transformClassBody(
  tokens: LexToken[],
  openBraceIdx: number,
  closeBraceIdx: number,
  errors: string[]
): string {
  const out: string[] = ['{'];
  let i = openBraceIdx + 1;

  while (i < closeBraceIdx) {
    while (i < closeBraceIdx && (tokens[i].kind === 'ws' || tokens[i].kind === 'comment')) {
      out.push(tokens[i].value);
      i++;
    }
    if (i >= closeBraceIdx) break;

    if (tokens[i].kind === 'punct' && tokens[i].value === ';') {
      out.push(';');
      i++;
      continue;
    }

    if (tokens[i].kind === 'punct' && tokens[i].value === '@') {
      errors.push('不支持 TypeScript 类成员装饰器（`@decorator`）语法。');
      out.push(tokens[i].value);
      i++;
      continue;
    }

    // `static { ... }` 静态初始化块
    if (
      tokens[i].kind === 'ident' &&
      tokens[i].value === 'static' &&
      nextSigIndex(tokens, i + 1) !== -1 &&
      tokens[nextSigIndex(tokens, i + 1)].value === '{'
    ) {
      const sbOpen = nextSigIndex(tokens, i + 1);
      const sbClose = findMatchingDelim(tokens, sbOpen, '{', '}');
      if (sbClose !== -1 && sbClose < closeBraceIdx) {
        out.push('static ');
        const innerSrc = tokens
          .slice(sbOpen + 1, sbClose)
          .map((t) => t.value)
          .join('');
        const innerRes = transpileTypeScriptDetailed(innerSrc);
        if (!innerRes.ok) errors.push(...innerRes.errors);
        out.push('{' + innerRes.code + '}');
        i = sbClose + 1;
        continue;
      }
    }

    // 扫描成员修饰符 (`public`, `private`, `protected`, `readonly`, `override`, `abstract`, `declare`, `static`, `async`, `get`, `set`)
    let isAbstractOrDeclare = false;
    const keptModifiers: string[] = [];
    let modStart = i;

    while (i < closeBraceIdx && tokens[i].kind === 'ident') {
      const mv = tokens[i].value;
      const nextAfterMod = nextSigIndex(tokens, i + 1);
      if (nextAfterMod === -1 || nextAfterMod >= closeBraceIdx) break;
      const nv = tokens[nextAfterMod].value;
      // 如果后面紧跟 `(`、`:`、`?`、`!`、`=`、`;`、`<`，说明当前标识符本身就是成员名而非修饰符！
      if (
        tokens[nextAfterMod].kind === 'punct' &&
        (nv === '(' || nv === ':' || nv === '?' || nv === '!' || nv === '=' || nv === ';' || nv === '<')
      ) {
        break;
      }
      if (mv === 'public' || mv === 'private' || mv === 'protected' || mv === 'readonly' || mv === 'override') {
        i = nextAfterMod;
        continue;
      }
      if (mv === 'abstract' || mv === 'declare') {
        isAbstractOrDeclare = true;
        i = nextAfterMod;
        continue;
      }
      if (mv === 'static' || mv === 'async' || mv === 'get' || mv === 'set') {
        keptModifiers.push(mv);
        i = nextAfterMod;
        continue;
      }
      break;
    }

    if (isAbstractOrDeclare) {
      // 跳过纯声明性质的 abstract/declare 成员直至 `;` 或换行
      let endMember = i;
      let p = 0;
      let b = 0;
      while (endMember < closeBraceIdx) {
        const tk = tokens[endMember];
        if (tk.kind === 'punct') {
          if (p === 0 && b === 0 && tk.value === ';') {
            endMember++;
            break;
          }
          if (tk.value === '(') p++;
          else if (tk.value === ')') p--;
          else if (tk.value === '{') b++;
          else if (tk.value === '}') b--;
        }
        if (p === 0 && b === 0 && tk.hasNewline && endMember > i) break;
        endMember++;
      }
      out.push(countNewlinesInRange(tokens, modStart, endMember));
      i = endMember;
      continue;
    }

    if (keptModifiers.length > 0) {
      out.push(keptModifiers.join(' ') + ' ');
    }

    // 生成器 `*`
    if (i < closeBraceIdx && tokens[i].kind === 'punct' && tokens[i].value === '*') {
      out.push('*');
      i = nextSigIndex(tokens, i + 1);
      if (i === -1 || i >= closeBraceIdx) break;
    }

    // 成员名称：`ident`、`string`、`number` 或计算属性 `[expr]`
    let memberName = '';
    if (tokens[i].kind === 'ident' || tokens[i].kind === 'string' || tokens[i].kind === 'number') {
      memberName = tokens[i].value;
      out.push(memberName);
      i++;
    } else if (tokens[i].kind === 'punct' && tokens[i].value === '[') {
      const closeComp = findMatchingDelim(tokens, i, '[', ']');
      if (closeComp !== -1 && closeComp < closeBraceIdx) {
        const compSrc = tokens
          .slice(i + 1, closeComp)
          .map((t) => t.value)
          .join('');
        const compRes = transpileTypeScriptDetailed(compSrc);
        if (!compRes.ok) errors.push(...compRes.errors);
        out.push('[' + compRes.code + ']');
        i = closeComp + 1;
      } else {
        out.push(tokens[i].value);
        i++;
        continue;
      }
    } else {
      out.push(renderTokenValue(tokens[i], errors));
      i++;
      continue;
    }

    let nextMemberSig = nextSigIndex(tokens, i);
    // 可选泛型 `<T>`（类方法泛型）
    if (
      nextMemberSig !== -1 &&
      nextMemberSig < closeBraceIdx &&
      tokens[nextMemberSig].kind === 'punct' &&
      tokens[nextMemberSig].value === '<'
    ) {
      const closeGen = findBalancedGenericClose(tokens, nextMemberSig);
      if (closeGen !== -1 && closeGen < closeBraceIdx) {
        out.push(countNewlinesInRange(tokens, i, closeGen + 1));
        i = closeGen + 1;
        nextMemberSig = nextSigIndex(tokens, i);
      }
    }

    // 分支 1：类方法或 constructor `(...)`
    if (
      nextMemberSig !== -1 &&
      nextMemberSig < closeBraceIdx &&
      tokens[nextMemberSig].kind === 'punct' &&
      tokens[nextMemberSig].value === '('
    ) {
      const closeMethodParen = findMatchingDelim(tokens, nextMemberSig, '(', ')');
      if (closeMethodParen !== -1 && closeMethodParen < closeBraceIdx) {
        const paramsJs = transformParameterList(
          tokens,
          nextMemberSig,
          closeMethodParen,
          memberName === 'constructor',
          errors
        );
        let afterParen = closeMethodParen + 1;
        const maybeRetColon = nextSigIndex(tokens, afterParen);
        let methodBodySig = maybeRetColon;

        if (
          maybeRetColon !== -1 &&
          maybeRetColon < closeBraceIdx &&
          tokens[maybeRetColon].kind === 'punct' &&
          tokens[maybeRetColon].value === ':'
        ) {
          const retEnd = scanTypeExpressionEnd(tokens, maybeRetColon + 1, 'return');
          afterParen = Math.min(closeBraceIdx, Math.max(maybeRetColon, retEnd) + 1);
          methodBodySig = nextSigIndex(tokens, afterParen);
        }

        // TS 方法重载签名（以 `;` 结尾无方法体）：整行移除
        if (
          methodBodySig !== -1 &&
          methodBodySig < closeBraceIdx &&
          tokens[methodBodySig].kind === 'punct' &&
          tokens[methodBodySig].value === ';'
        ) {
          // 撤回刚推入的修饰符和成员名
          while (out.length > 1 && out[out.length - 1] !== '\n' && !out[out.length - 1].endsWith('}') && out[out.length - 1] !== ';' && out[out.length - 1] !== '{') {
            out.pop();
          }
          out.push(countNewlinesInRange(tokens, modStart, methodBodySig + 1));
          i = methodBodySig + 1;
          continue;
        }

        out.push(paramsJs);
        if (
          methodBodySig !== -1 &&
          methodBodySig < closeBraceIdx &&
          tokens[methodBodySig].kind === 'punct' &&
          tokens[methodBodySig].value === '{'
        ) {
          const closeBody = findMatchingDelim(tokens, methodBodySig, '{', '}');
          if (closeBody !== -1 && closeBody < closeBraceIdx) {
            out.push(' ');
            const bodySrc = tokens
              .slice(methodBodySig + 1, closeBody)
              .map((t) => t.value)
              .join('');
            const bodyRes = transpileTypeScriptDetailed(bodySrc);
            if (!bodyRes.ok) errors.push(...bodyRes.errors);
            out.push('{' + bodyRes.code + '}');
            i = closeBody + 1;
            continue;
          }
        }
        i = afterParen;
        continue;
      }
    }

    // 分支 2：类字段 `[? | !] [: Type] [= Initializer] [;]`
    if (
      nextMemberSig !== -1 &&
      nextMemberSig < closeBraceIdx &&
      tokens[nextMemberSig].kind === 'punct' &&
      (tokens[nextMemberSig].value === '?' || tokens[nextMemberSig].value === '!')
    ) {
      out.push(countNewlinesInRange(tokens, i, nextMemberSig + 1));
      i = nextMemberSig + 1;
      nextMemberSig = nextSigIndex(tokens, i);
    }

    if (
      nextMemberSig !== -1 &&
      nextMemberSig < closeBraceIdx &&
      tokens[nextMemberSig].kind === 'punct' &&
      tokens[nextMemberSig].value === ':'
    ) {
      const fieldTypeEnd = scanTypeExpressionEnd(tokens, nextMemberSig + 1, 'annotation');
      const skipTo = Math.min(closeBraceIdx, Math.max(nextMemberSig, fieldTypeEnd) + 1);
      out.push(countNewlinesInRange(tokens, i, skipTo));
      i = skipTo;
      nextMemberSig = nextSigIndex(tokens, i);
    }

    if (
      nextMemberSig !== -1 &&
      nextMemberSig < closeBraceIdx &&
      tokens[nextMemberSig].kind === 'punct' &&
      tokens[nextMemberSig].value === '='
    ) {
      let p = 0;
      let b = 0;
      let k = 0;
      let initEnd = nextMemberSig + 1;
      while (initEnd < closeBraceIdx) {
        const tk = tokens[initEnd];
        if (tk.kind === 'punct') {
          if (p === 0 && b === 0 && k === 0 && tk.value === ';') break;
          if (tk.value === '(') p++;
          else if (tk.value === ')') p--;
          else if (tk.value === '{') b++;
          else if (tk.value === '}') b--;
          else if (tk.value === '[') k++;
          else if (tk.value === ']') k--;
        }
        if (p === 0 && b === 0 && k === 0 && tk.hasNewline && initEnd > nextMemberSig + 1) {
          const prevInitSig = prevSigIndex(tokens, initEnd - 1);
          if (prevInitSig !== -1 && tokens[prevInitSig].value !== '=') break;
        }
        initEnd++;
      }
      const initSrc = tokens
        .slice(i, initEnd)
        .map((t) => t.value)
        .join('');
      const initRes = transpileTypeScriptDetailed(initSrc);
      if (!initRes.ok) errors.push(...initRes.errors);
      out.push(initRes.code);
      i = initEnd;
    }

    if (i < closeBraceIdx && tokens[i].kind === 'punct' && tokens[i].value === ';') {
      out.push(';');
      i++;
    } else {
      out.push(';');
    }
  }

  out.push('}');
  return out.join('');
}

/**
 * 带完整诊断信息的受限 TypeScript 类型擦除器
 *
 * 支持范围（纯类型擦除子集）：
 * - `interface` / `type` 别名声明（含泛型与嵌套结构）
 * - 变量、函数参数、可选参数 `?`、`this` 伪参数与函数/箭头返回类型注解
 * - 普通 JS 对象字面量 `{ k: v }` 与三元表达式 `a ? b : c` 100% 原样保留
 * - `as Type` / `as const` / `satisfies Type` 类型断言与后缀非空断言 `expr!`
 * - 函数与构造调用泛型参数 `fn<T>(x)` / `new Map<K, V>()`
 * - `class` 字段类型注解、`implements`、`public`/`private`/`protected`/`readonly`/`override`
 * - `import type` 纯类型导入擦除与本地声明 `export` 修饰符擦除
 *
 * 显式拒绝（报错提示，绝不静默产出错误语义代码）：
 * - `enum` / `const enum`
 * - `namespace` / `module`
 * - 构造函数参数属性 `constructor(public x: number)`
 * - 装饰器 `@decorator`
 * - JSX / TSX 标签语法
 * - 外部运行时模块 `import ... from '...'`
 */
export function transpileTypeScriptDetailed(tsCode: string): TypeScriptTranspileResult {
  if (typeof tsCode !== 'string') {
    return { ok: false, code: '', errors: ['TypeScript 源码输入必须是字符串。'] };
  }
  if (getUtf8ByteLength(tsCode) > LAB_SECURITY_LIMITS.MAX_TOTAL_SOURCE_BYTES * 2) {
    return { ok: false, code: '', errors: ['TypeScript 源码体积超过安全转换上限。'] };
  }

  const tokens = tokenizeTsOrJs(tsCode);
  const errors: string[] = [];
  const out: string[] = [];
  const ternaryDepthStack: number[] = [0];
  let i = 0;

  // 检查是否存在未闭合字符串或块注释
  for (const tok of tokens) {
    if (tok.unclosed) {
      if (tok.kind === 'string') {
        errors.push('检测到未闭合的字符串字面量（Unterminated string literal）。');
      } else if (tok.kind === 'template') {
        errors.push('检测到未闭合的模板字符串字面量（Unterminated template literal）。');
      } else if (tok.kind === 'comment') {
        errors.push('检测到未闭合的多行块注释（Unterminated `/* ... */` comment）。');
      }
      break;
    }
  }

  while (i < tokens.length) {
    const tok = tokens[i];

    if (tok.kind === 'ws' || tok.kind === 'comment') {
      out.push(tok.value);
      i++;
      continue;
    }

    const prev = prevSigIndex(tokens, i - 1);
    const isAfterDot =
      prev !== -1 && tokens[prev].kind === 'punct' && (tokens[prev].value === '.' || tokens[prev].value === '?.');
    const atStmtStart = !isAfterDot && isStatementStartBoundary(tokens, i);

    // 1. 拒绝装饰器 `@decorator`
    if (tok.kind === 'punct' && tok.value === '@') {
      errors.push('当前轻量沙盒不支持 TypeScript 装饰器（`@decorator`）语法。');
      out.push(tok.value);
      i++;
      continue;
    }

    // 2. 检测 JSX/TSX 并报错拒绝
    if (tok.kind === 'punct' && tok.value === '<') {
      if (detectJsxSyntax(tokens, i)) {
        errors.push(
          '检测到 JSX/TSX 标签语法：当前轻量沙盒仅支持 TypeScript 类型擦除子集，不支持编译 JSX/TSX。请改用原生 DOM API，或点击工具栏「LiveCodes 完整引擎」。'
        );
        out.push(tok.value);
        i++;
        continue;
      }

      // 泛型箭头函数 `<T>(x: T): T => ...`
      const closeGen = findBalancedGenericClose(tokens, i);
      if (closeGen !== -1) {
        const nextAfterGen = nextSigIndex(tokens, closeGen + 1);
        if (
          nextAfterGen !== -1 &&
          !hasNewlineBetween(tokens, closeGen, nextAfterGen) &&
          tokens[nextAfterGen].kind === 'punct' &&
          tokens[nextAfterGen].value === '('
        ) {
          const curTernary = ternaryDepthStack[ternaryDepthStack.length - 1] ?? 0;
          const arrowMatch = matchArrowFunctionSignature(tokens, nextAfterGen, curTernary);
          if (arrowMatch.isArrow) {
            const paramsJs = transformParameterList(
              tokens,
              nextAfterGen,
              arrowMatch.closeParenIdx,
              false,
              errors
            );
            out.push(countNewlinesInRange(tokens, i, nextAfterGen));
            out.push(paramsJs);
            out.push(countNewlinesInRange(tokens, arrowMatch.closeParenIdx + 1, arrowMatch.arrowIdx));
            out.push(' =>');
            i = arrowMatch.arrowIdx + 1;
            continue;
          }
        }
      }
    }

    // 3. 语句级 TypeScript 声明与模块语法
    if (tok.kind === 'ident' && !isAfterDot) {
      const kw = tok.value;

      // 3a. `import` 处理：允许擦除 `import type`，拒绝运行时外部模块 `import`
      if (kw === 'import' && atStmtStart) {
        const afterImport = nextSigIndex(tokens, i + 1);
        if (
          afterImport !== -1 &&
          !(tokens[afterImport].kind === 'punct' && (tokens[afterImport].value === '(' || tokens[afterImport].value === '.'))
        ) {
          let isPureTypeImport = false;
          if (tokens[afterImport].kind === 'ident' && tokens[afterImport].value === 'type') {
            const afterType = nextSigIndex(tokens, afterImport + 1);
            if (afterType !== -1 && tokens[afterType].value !== 'from') {
              isPureTypeImport = true;
            }
          } else if (tokens[afterImport].kind === 'punct' && tokens[afterImport].value === '{') {
            const closeSpec = findMatchingDelim(tokens, afterImport, '{', '}');
            if (closeSpec !== -1) {
              let allTypeSpecs = true;
              let hasAnySpec = false;
              let s = nextSigIndex(tokens, afterImport + 1);
              while (s !== -1 && s < closeSpec) {
                hasAnySpec = true;
                if (!(tokens[s].kind === 'ident' && tokens[s].value === 'type')) {
                  allTypeSpecs = false;
                  break;
                }
                while (s < closeSpec && tokens[s].value !== ',') s++;
                s = nextSigIndex(tokens, s + 1);
              }
              if (hasAnySpec && allTypeSpecs) isPureTypeImport = true;
            }
          }

          // 找到 import 语句结尾
          let stmtEnd = afterImport;
          while (stmtEnd < tokens.length) {
            if (tokens[stmtEnd].kind === 'punct' && tokens[stmtEnd].value === ';') {
              stmtEnd++;
              break;
            }
            if (tokens[stmtEnd].kind === 'string') {
              const maybeSemi = nextSigIndex(tokens, stmtEnd + 1);
              if (maybeSemi !== -1 && tokens[maybeSemi].value === ';') {
                stmtEnd = maybeSemi + 1;
              } else {
                stmtEnd++;
              }
              break;
            }
            stmtEnd++;
          }

          if (isPureTypeImport) {
            out.push(countNewlinesInRange(tokens, i, stmtEnd));
            i = stmtEnd;
            continue;
          }

          errors.push(
            '当前隔离单页沙盒不支持外部 ES Module `import` 语句（默认禁止外部模块网络请求）。纯类型请使用 `import type`，运行时逻辑请直接编写在实验脚本中。'
          );
          out.push(countNewlinesInRange(tokens, i, stmtEnd));
          i = stmtEnd;
          continue;
        }
      }

      // 3b. `export` 修饰符擦除（同时拦截外部重导出 `export ... from '...'`）
      if (kw === 'export' && atStmtStart) {
        const afterExport = nextSigIndex(tokens, i + 1);
        if (afterExport !== -1) {
          const ev = tokens[afterExport].value;
          if (tokens[afterExport].kind === 'ident' && ev === 'type') {
            const afterExpType = nextSigIndex(tokens, afterExport + 1);
            if (afterExpType !== -1 && tokens[afterExpType].value === '{') {
              const closeExpBrace = findMatchingDelim(tokens, afterExpType, '{', '}');
              if (closeExpBrace !== -1) {
                let endExp = closeExpBrace + 1;
                const maybeFrom = nextSigIndex(tokens, endExp);
                if (maybeFrom !== -1 && tokens[maybeFrom].value === 'from') {
                  const modStr = nextSigIndex(tokens, maybeFrom + 1);
                  if (modStr !== -1) endExp = modStr + 1;
                }
                const maybeSemi = nextSigIndex(tokens, endExp);
                if (maybeSemi !== -1 && tokens[maybeSemi].value === ';') endExp = maybeSemi + 1;
                out.push(countNewlinesInRange(tokens, i, endExp));
                i = endExp;
                continue;
              }
            }
          }
          if (tokens[afterExport].kind === 'punct' && (ev === '{' || ev === '*')) {
            let scanEnd = afterExport + 1;
            if (ev === '{') {
              const cb = findMatchingDelim(tokens, afterExport, '{', '}');
              if (cb !== -1) scanEnd = cb + 1;
            }
            const maybeFrom = nextSigIndex(tokens, scanEnd);
            if (maybeFrom !== -1 && tokens[maybeFrom].value === 'from') {
              errors.push('不支持外部模块重导出语句 `export ... from "..."`。');
              const modStr = nextSigIndex(tokens, maybeFrom + 1);
              if (modStr !== -1) scanEnd = modStr + 1;
            }
            const maybeSemi = nextSigIndex(tokens, scanEnd);
            if (maybeSemi !== -1 && tokens[maybeSemi].value === ';') scanEnd = maybeSemi + 1;
            out.push(countNewlinesInRange(tokens, i, scanEnd));
            i = scanEnd;
            continue;
          }
          if (tokens[afterExport].kind === 'ident' && ev === 'default') {
            const afterDefault = nextSigIndex(tokens, afterExport + 1);
            if (
              afterDefault !== -1 &&
              tokens[afterDefault].kind === 'ident' &&
              (tokens[afterDefault].value === 'function' ||
                tokens[afterDefault].value === 'class' ||
                tokens[afterDefault].value === 'async' ||
                tokens[afterDefault].value === 'interface')
            ) {
              out.push(countNewlinesInRange(tokens, i, afterDefault));
              i = afterDefault;
              continue;
            }
            out.push(countNewlinesInRange(tokens, i, afterExport + 1));
            i = afterExport + 1;
            continue;
          }
          // `export const / function / class / interface / type / enum ...` -> 擦除 `export` 继续处理后续声明
          out.push(countNewlinesInRange(tokens, i, afterExport));
          i = afterExport;
          continue;
        }
      }

      // 3c. `declare` 环境声明块整句擦除
      if (kw === 'declare' && atStmtStart) {
        const afterDecl = nextSigIndex(tokens, i + 1);
        if (afterDecl !== -1 && !hasNewlineBetween(tokens, i, afterDecl)) {
          let endDecl = afterDecl;
          let p = 0;
          let b = 0;
          while (endDecl < tokens.length) {
            const tk = tokens[endDecl];
            if (tk.kind === 'punct') {
              if (p === 0 && b === 0 && tk.value === ';') {
                endDecl++;
                break;
              }
              if (tk.value === '(') p++;
              else if (tk.value === ')') p--;
              else if (tk.value === '{') b++;
              else if (tk.value === '}') {
                b--;
                if (b === 0 && p === 0) {
                  endDecl++;
                  break;
                }
              }
            }
            endDecl++;
          }
          out.push(countNewlinesInRange(tokens, i, endDecl));
          i = endDecl;
          continue;
        }
      }

      // 3d. 拒绝 `enum` 与 `const enum`
      if (
        kw === 'enum' &&
        (atStmtStart || (prev !== -1 && tokens[prev].kind === 'ident' && tokens[prev].value === 'const'))
      ) {
        errors.push(
          '不支持 TypeScript `enum` / `const enum` 枚举语法（仅支持纯类型擦除子集）。请改用对象常量 `const X = { ... } as const`。'
        );
      }

      // 3e. 拒绝 `namespace` / `module Foo {`
      if ((kw === 'namespace' || kw === 'module') && atStmtStart) {
        const nsName = nextSigIndex(tokens, i + 1);
        if (
          nsName !== -1 &&
          !hasNewlineBetween(tokens, i, nsName) &&
          (tokens[nsName].kind === 'ident' || tokens[nsName].kind === 'string')
        ) {
          const afterNsName = nextSigIndex(tokens, nsName + 1);
          if (afterNsName !== -1 && (tokens[afterNsName].value === '{' || tokens[afterNsName].value === '.')) {
            errors.push(`不支持 TypeScript \`${kw}\` 命名空间语法。请改用标准函数或对象模块。`);
          }
        }
      }

      // 3f. 擦除 `interface Name<...> extends ... { ... }`
      if (kw === 'interface' && atStmtStart) {
        const ifaceName = nextSigIndex(tokens, i + 1);
        if (ifaceName !== -1 && !hasNewlineBetween(tokens, i, ifaceName) && tokens[ifaceName].kind === 'ident') {
          let cursor = ifaceName + 1;
          while (cursor < tokens.length) {
            const ct = tokens[cursor];
            if (ct.kind === 'punct' && ct.value === '<') {
              const cg = findBalancedGenericClose(tokens, cursor);
              if (cg !== -1) {
                cursor = cg + 1;
                continue;
              }
            }
            if (ct.kind === 'punct' && ct.value === '{') {
              const closeIface = findMatchingDelim(tokens, cursor, '{', '}');
              if (closeIface !== -1) {
                out.push(countNewlinesInRange(tokens, i, closeIface + 1));
                i = closeIface + 1;
                break;
              }
            }
            cursor++;
          }
          if (cursor < tokens.length) continue;
        }
      }

      // 3g. 擦除 `type Alias<...> = ...;`
      if (kw === 'type' && atStmtStart) {
        const aliasName = nextSigIndex(tokens, i + 1);
        if (aliasName !== -1 && !hasNewlineBetween(tokens, i, aliasName) && tokens[aliasName].kind === 'ident') {
          let eqIdx = nextSigIndex(tokens, aliasName + 1);
          if (eqIdx !== -1 && tokens[eqIdx].kind === 'punct' && tokens[eqIdx].value === '<') {
            const cg = findBalancedGenericClose(tokens, eqIdx);
            if (cg !== -1) eqIdx = nextSigIndex(tokens, cg + 1);
          }
          if (eqIdx !== -1 && tokens[eqIdx].kind === 'punct' && tokens[eqIdx].value === '=') {
            const aliasEnd = scanTypeExpressionEnd(tokens, eqIdx + 1, 'alias');
            let skipEnd = Math.max(eqIdx, aliasEnd) + 1;
            const maybeSemi = nextSigIndex(tokens, skipEnd);
            if (maybeSemi !== -1 && tokens[maybeSemi].kind === 'punct' && tokens[maybeSemi].value === ';') {
              skipEnd = maybeSemi + 1;
            }
            out.push(countNewlinesInRange(tokens, i, skipEnd));
            i = skipEnd;
            continue;
          }
        }
      }

      // 3h. `const` / `let` / `var` 变量绑定类型注解擦除（绝不误伤右侧对象字面量！）
      if (kw === 'const' || kw === 'let' || kw === 'var') {
        const afterKw = nextSigIndex(tokens, i + 1);
        if (afterKw !== -1 && !(tokens[afterKw].kind === 'ident' && tokens[afterKw].value === 'enum')) {
          out.push(kw);
          i++;
          // 循环处理逗号分隔的多个声明符 `const a: number = 1, b: string = 'x'`
          while (i < tokens.length) {
            while (i < tokens.length && (tokens[i].kind === 'ws' || tokens[i].kind === 'comment')) {
              out.push(tokens[i].value);
              i++;
            }
            if (i >= tokens.length) break;

            // 绑定名：`ident`、`{...}` 或 `[...]`
            if (tokens[i].kind === 'ident') {
              out.push(tokens[i].value);
              i++;
            } else if (tokens[i].kind === 'punct' && (tokens[i].value === '{' || tokens[i].value === '[')) {
              const closeBind = findMatchingDelim(
                tokens,
                i,
                tokens[i].value,
                tokens[i].value === '{' ? '}' : ']'
              );
              if (closeBind !== -1) {
                for (let k = i; k <= closeBind; k++) out.push(tokens[k].value);
                i = closeBind + 1;
              } else {
                break;
              }
            } else {
              break;
            }

            // 确定赋值断言 `let x!: number;`
            let nextDeclSig = nextSigIndex(tokens, i);
            if (
              nextDeclSig !== -1 &&
              !hasNewlineBetween(tokens, i - 1, nextDeclSig) &&
              tokens[nextDeclSig].kind === 'punct' &&
              tokens[nextDeclSig].value === '!'
            ) {
              out.push(countNewlinesInRange(tokens, i, nextDeclSig + 1));
              i = nextDeclSig + 1;
              nextDeclSig = nextSigIndex(tokens, i);
            }

            // 变量冒号类型注解 `: Type`
            if (nextDeclSig !== -1 && tokens[nextDeclSig].kind === 'punct' && tokens[nextDeclSig].value === ':') {
              const varTypeEnd = scanTypeExpressionEnd(tokens, nextDeclSig + 1, 'annotation');
              const skipTo = Math.max(nextDeclSig, varTypeEnd) + 1;
              out.push(countNewlinesInRange(tokens, i, skipTo));
              i = skipTo;
              nextDeclSig = nextSigIndex(tokens, i);
            }

            // 若有 `= initializer`，交给外层主循环处理初始化表达式，仅当在同一声明链遇到顶层 `,` 时继续
            if (nextDeclSig !== -1 && tokens[nextDeclSig].kind === 'punct' && tokens[nextDeclSig].value === '=') {
              let p = 0;
              let b = 0;
              let k = 0;
              let initEnd = nextDeclSig + 1;
              while (initEnd < tokens.length) {
                const tk = tokens[initEnd];
                if (tk.kind === 'punct') {
                  if (p === 0 && b === 0 && k === 0 && tk.value === '<') {
                    const cg = findBalancedGenericClose(tokens, initEnd);
                    if (cg !== -1) {
                      initEnd = cg + 1;
                      continue;
                    }
                  }
                  if (
                    p === 0 &&
                    b === 0 &&
                    k === 0 &&
                    (tk.value === ',' || tk.value === ';' || tk.value === ')')
                  ) {
                    break;
                  }
                  if (tk.value === '(') p++;
                  else if (tk.value === ')') p--;
                  else if (tk.value === '{') b++;
                  else if (tk.value === '}') b--;
                  else if (tk.value === '[') k++;
                  else if (tk.value === ']') k--;
                }
                // ASI 换行终止检查
                if (p === 0 && b === 0 && k === 0 && tk.hasNewline && initEnd > nextDeclSig + 1) {
                  const nextAfterNl = nextSigIndex(tokens, initEnd + 1);
                  if (
                    nextAfterNl !== -1 &&
                    tokens[nextAfterNl].kind === 'ident' &&
                    !BINARY_KEYWORD_CONTINUATIONS.has(tokens[nextAfterNl].value)
                  ) {
                    break;
                  }
                }
                initEnd++;
              }
              const initSlice = tokens
                .slice(i, initEnd)
                .map((t) => t.value)
                .join('');
              const initRes = transpileTypeScriptDetailed(initSlice);
              if (!initRes.ok) errors.push(...initRes.errors);
              out.push(initRes.code);
              i = initEnd;
              nextDeclSig = nextSigIndex(tokens, i);
            }

            if (nextDeclSig !== -1 && tokens[nextDeclSig].kind === 'punct' && tokens[nextDeclSig].value === ',') {
              while (i <= nextDeclSig) {
                out.push(tokens[i].value);
                i++;
              }
              continue;
            }
            break;
          }
          continue;
        }
      }

      // 3i. `catch (err: unknown)` 类型擦除
      if (kw === 'catch') {
        const catchParen = nextSigIndex(tokens, i + 1);
        if (catchParen !== -1 && tokens[catchParen].kind === 'punct' && tokens[catchParen].value === '(') {
          const closeCatch = findMatchingDelim(tokens, catchParen, '(', ')');
          if (closeCatch !== -1) {
            out.push('catch ');
            out.push(transformParameterList(tokens, catchParen, closeCatch, false, errors));
            i = closeCatch + 1;
            continue;
          }
        }
      }

      // 3j. `function` 声明或表达式
      if (kw === 'function') {
        let cursor = i + 1;
        let fnHeader = 'function';
        let sig = nextSigIndex(tokens, cursor);
        if (sig !== -1 && tokens[sig].kind === 'punct' && tokens[sig].value === '*') {
          fnHeader += '*';
          cursor = sig + 1;
          sig = nextSigIndex(tokens, cursor);
        }
        if (sig !== -1 && tokens[sig].kind === 'ident') {
          fnHeader += ' ' + tokens[sig].value;
          cursor = sig + 1;
          sig = nextSigIndex(tokens, cursor);
        }
        if (sig !== -1 && tokens[sig].kind === 'punct' && tokens[sig].value === '<') {
          const cg = findBalancedGenericClose(tokens, sig);
          if (cg !== -1) {
            fnHeader += countNewlinesInRange(tokens, cursor, cg + 1);
            cursor = cg + 1;
            sig = nextSigIndex(tokens, cursor);
          }
        }
        if (sig !== -1 && tokens[sig].kind === 'punct' && tokens[sig].value === '(') {
          const closeFnParen = findMatchingDelim(tokens, sig, '(', ')');
          if (closeFnParen !== -1) {
            const paramsJs = transformParameterList(tokens, sig, closeFnParen, false, errors);
            let afterFn = closeFnParen + 1;
            let bodySig = nextSigIndex(tokens, afterFn);
            if (bodySig !== -1 && tokens[bodySig].kind === 'punct' && tokens[bodySig].value === ':') {
              const retEnd = scanTypeExpressionEnd(tokens, bodySig + 1, 'return');
              afterFn = Math.max(bodySig, retEnd) + 1;
              bodySig = nextSigIndex(tokens, afterFn);
            }
            // 函数重载签名（以 `;` 结尾无 `{`）直接擦除
            if (bodySig !== -1 && tokens[bodySig].kind === 'punct' && tokens[bodySig].value === ';') {
              out.push(countNewlinesInRange(tokens, i, bodySig + 1));
              i = bodySig + 1;
              continue;
            }
            out.push(fnHeader + paramsJs);
            if (afterFn > closeFnParen + 1) {
              out.push(countNewlinesInRange(tokens, closeFnParen + 1, afterFn) || ' ');
            }
            i = afterFn;
            continue;
          }
        }
      }

      // 3k. `abstract class` / `class` 声明或表达式
      if (
        kw === 'class' ||
        (kw === 'abstract' &&
          nextSigIndex(tokens, i + 1) !== -1 &&
          tokens[nextSigIndex(tokens, i + 1)].value === 'class')
      ) {
        const classIdx = kw === 'abstract' ? nextSigIndex(tokens, i + 1) : i;
        let cursor = classIdx + 1;
        let clsHeader = 'class';
        let sig = nextSigIndex(tokens, cursor);

        if (sig !== -1 && tokens[sig].kind === 'ident' && tokens[sig].value !== 'extends' && tokens[sig].value !== 'implements') {
          clsHeader += ' ' + tokens[sig].value;
          cursor = sig + 1;
          sig = nextSigIndex(tokens, cursor);
        }
        if (sig !== -1 && tokens[sig].kind === 'punct' && tokens[sig].value === '<') {
          const cg = findBalancedGenericClose(tokens, sig);
          if (cg !== -1) {
            clsHeader += countNewlinesInRange(tokens, cursor, cg + 1);
            cursor = cg + 1;
            sig = nextSigIndex(tokens, cursor);
          }
        }
        if (sig !== -1 && tokens[sig].kind === 'ident' && tokens[sig].value === 'extends') {
          clsHeader += ' extends ';
          cursor = sig + 1;
          sig = nextSigIndex(tokens, cursor);
          while (
            sig !== -1 &&
            !(tokens[sig].kind === 'punct' && tokens[sig].value === '{') &&
            !(tokens[sig].kind === 'ident' && tokens[sig].value === 'implements')
          ) {
            if (tokens[sig].kind === 'punct' && tokens[sig].value === '<') {
              const cg = findBalancedGenericClose(tokens, sig);
              if (cg !== -1) {
                cursor = cg + 1;
                sig = nextSigIndex(tokens, cursor);
                continue;
              }
            }
            clsHeader += tokens[sig].value;
            cursor = sig + 1;
            sig = nextSigIndex(tokens, cursor);
          }
        }
        if (sig !== -1 && tokens[sig].kind === 'ident' && tokens[sig].value === 'implements') {
          const implStart = sig;
          while (sig !== -1 && !(tokens[sig].kind === 'punct' && tokens[sig].value === '{')) {
            if (tokens[sig].kind === 'punct' && tokens[sig].value === '<') {
              const cg = findBalancedGenericClose(tokens, sig);
              if (cg !== -1) {
                sig = nextSigIndex(tokens, cg + 1);
                continue;
              }
            }
            sig = nextSigIndex(tokens, sig + 1);
          }
          if (sig !== -1) {
            clsHeader += countNewlinesInRange(tokens, implStart, sig);
          }
        }
        if (sig !== -1 && tokens[sig].kind === 'punct' && tokens[sig].value === '{') {
          const closeClassBrace = findMatchingDelim(tokens, sig, '{', '}');
          if (closeClassBrace !== -1) {
            out.push(clsHeader + ' ');
            out.push(transformClassBody(tokens, sig, closeClassBrace, errors));
            i = closeClassBrace + 1;
            continue;
          }
        }
      }

      // 3l. 表达式级 `as Type` 与 `satisfies Type` 类型断言擦除
      if ((kw === 'as' || kw === 'satisfies') && prev !== -1 && !hasNewlineBetween(tokens, prev, i)) {
        const typeEnd = scanTypeExpressionEnd(tokens, i + 1, 'assertion');
        if (typeEnd >= i + 1) {
          // 移除紧挨在 `as` 之前的水平空格以保持整洁，但保留换行
          if (out.length > 0 && /^[ \t]+$/.test(out[out.length - 1])) {
            out.pop();
          }
          out.push(countNewlinesInRange(tokens, i, typeEnd + 1));
          i = typeEnd + 1;
          continue;
        }
      }
    }

    // 4. 函数/构造泛型调用 `fn<T>(...)` / `new Map<K, V>(...)`
    if (
      tok.kind === 'punct' &&
      tok.value === '<' &&
      prev !== -1 &&
      !hasNewlineBetween(tokens, prev, i) &&
      (tokens[prev].kind === 'ident' || (tokens[prev].kind === 'punct' && tokens[prev].value === ')'))
    ) {
      const prevKw = tokens[prev].kind === 'ident' ? tokens[prev].value : '';
      if (!REGEX_PRECEDING_KEYWORDS.has(prevKw) && !CONTROL_PAREN_KEYWORDS.has(prevKw)) {
        const closeGenCall = findBalancedGenericClose(tokens, i);
        if (closeGenCall !== -1) {
          const afterGenCall = nextSigIndex(tokens, closeGenCall + 1);
          if (
            afterGenCall !== -1 &&
            !hasNewlineBetween(tokens, closeGenCall, afterGenCall) &&
            ((tokens[afterGenCall].kind === 'punct' && tokens[afterGenCall].value === '(') ||
              tokens[afterGenCall].kind === 'template')
          ) {
            out.push(countNewlinesInRange(tokens, i, closeGenCall + 1));
            i = closeGenCall + 1;
            continue;
          }
        }
      }
    }

    // 5. 括号箭头函数 `(a: number, b?: string): number => ...`
    if (tok.kind === 'punct' && tok.value === '(') {
      const curTernary = ternaryDepthStack[ternaryDepthStack.length - 1] ?? 0;
      const arrowMatch = matchArrowFunctionSignature(tokens, i, curTernary);
      if (arrowMatch.isArrow) {
        const paramsJs = transformParameterList(tokens, i, arrowMatch.closeParenIdx, false, errors);
        out.push(paramsJs);
        out.push(countNewlinesInRange(tokens, arrowMatch.closeParenIdx + 1, arrowMatch.arrowIdx));
        out.push(' =>');
        i = arrowMatch.arrowIdx + 1;
        continue;
      }
      ternaryDepthStack.push(0);
      out.push('(');
      i++;
      continue;
    }

    if (tok.kind === 'punct' && tok.value === ')') {
      if (ternaryDepthStack.length > 1) ternaryDepthStack.pop();
      out.push(')');
      i++;
      continue;
    }

    // 维护当前括号层级的三元表达式 `? :` 深度
    if (tok.kind === 'punct' && tok.value === '?') {
      ternaryDepthStack[ternaryDepthStack.length - 1] =
        (ternaryDepthStack[ternaryDepthStack.length - 1] ?? 0) + 1;
      out.push('?');
      i++;
      continue;
    }

    if (tok.kind === 'punct' && tok.value === ':') {
      const topIdx = ternaryDepthStack.length - 1;
      if ((ternaryDepthStack[topIdx] ?? 0) > 0) {
        ternaryDepthStack[topIdx]--;
      }
      out.push(':');
      i++;
      continue;
    }

    // 6. 后缀非空断言 `expr!` 擦除（绝不误伤 `!expr`、`!!expr`、`!=`、`!==`）
    if (tok.kind === 'punct' && tok.value === '!' && isPostfixNonNullAssertion(tokens, i)) {
      i++;
      continue;
    }

    out.push(renderTokenValue(tok, errors));
    i++;
  }

  return {
    ok: errors.length === 0,
    code: out.join(''),
    errors,
  };
}

/**
 * 兼容旧签名：返回擦除后的 JavaScript 字符串
 * 注意：调用方若需严格拦截不支持的 TS 语法，应优先使用 `transpileTypeScriptDetailed()`。
 */
export function transpileTypeScriptLite(tsCode: string): string {
  return transpileTypeScriptDetailed(tsCode).code;
}

/**
 * 基于词法 Token 流的同步死循环超时熔断插桩器
 *
 * 作用：
 * - 对 `while (cond)`、`do ... while (cond)`、`for (init; cond; update)` 与 `for (... of/in ...)` 自动注入 `__labLoopGuard()`；
 * - 完全跳过字符串、模板静态文本、注释与正则表达式；
 * - 保持源码原始行号不变，防范 `while(true){}` 或 `for(;;){}` 卡死同渲染进程主线程。
 */
export function instrumentJavaScriptLoops(
  jsCode: string,
  guardIdent = '__labLoopGuard'
): string {
  const tokens = tokenizeTsOrJs(jsCode);
  const out: string[] = [];
  let i = 0;

  while (i < tokens.length) {
    const tok = tokens[i];
    if (tok.kind === 'template' && tok.templateSegments && !tok.unclosed) {
      let built = '`';
      for (const seg of tok.templateSegments) {
        if ('raw' in seg) built += seg.raw;
        else built += '${' + instrumentJavaScriptLoops(seg.expr, guardIdent) + '}';
      }
      built += '`';
      out.push(built);
      i++;
      continue;
    }

    const prev = prevSigIndex(tokens, i - 1);
    const isAfterDot =
      prev !== -1 && tokens[prev].kind === 'punct' && (tokens[prev].value === '.' || tokens[prev].value === '?.');

    // 1. `while (cond)`（同时涵盖独立 `while` 与 `do ... while (cond)` 尾部条件！）
    if (tok.kind === 'ident' && tok.value === 'while' && !isAfterDot) {
      const openParen = nextSigIndex(tokens, i + 1);
      if (openParen !== -1 && tokens[openParen].kind === 'punct' && tokens[openParen].value === '(') {
        const closeParen = findMatchingDelim(tokens, openParen, '(', ')');
        if (closeParen !== -1) {
          for (let k = i; k < openParen; k++) out.push(tokens[k].value);
          const innerCond = tokens
            .slice(openParen + 1, closeParen)
            .map((t) => t.value)
            .join('');
          const instrumentedCond = instrumentJavaScriptLoops(innerCond, guardIdent);
          out.push(`((${guardIdent}(), (${instrumentedCond.trim() || 'true'})))`);
          i = closeParen + 1;
          continue;
        }
      }
    }

    // 2. `for (...)` / `for await (...)`
    if (tok.kind === 'ident' && tok.value === 'for' && !isAfterDot) {
      let openParen = nextSigIndex(tokens, i + 1);
      if (openParen !== -1 && tokens[openParen].kind === 'ident' && tokens[openParen].value === 'await') {
        openParen = nextSigIndex(tokens, openParen + 1);
      }
      if (openParen !== -1 && tokens[openParen].kind === 'punct' && tokens[openParen].value === '(') {
        const closeParen = findMatchingDelim(tokens, openParen, '(', ')');
        if (closeParen !== -1) {
          // 查找括号顶层的分号 `;`
          const topSemis: number[] = [];
          let p = 0;
          let b = 0;
          let k = 0;
          for (let s = openParen + 1; s < closeParen; s++) {
            const st = tokens[s];
            if (st.kind !== 'punct') continue;
            if (p === 0 && b === 0 && k === 0 && st.value === ';') {
              topSemis.push(s);
            } else if (st.value === '(') p++;
            else if (st.value === ')') p--;
            else if (st.value === '{') b++;
            else if (st.value === '}') b--;
            else if (st.value === '[') k++;
            else if (st.value === ']') k--;
          }

          if (topSemis.length === 2) {
            const [semi1, semi2] = topSemis;
            for (let x = i; x <= openParen; x++) out.push(tokens[x].value);
            const initRaw = tokens
              .slice(openParen + 1, semi1)
              .map((t) => t.value)
              .join('');
            out.push(instrumentJavaScriptLoops(initRaw, guardIdent));
            out.push(';');

            const condRaw = tokens
              .slice(semi1 + 1, semi2)
              .map((t) => t.value)
              .join('');
            const hasSigInCond = nextSigIndex(tokens, semi1 + 1) !== -1 && nextSigIndex(tokens, semi1 + 1) < semi2;
            if (hasSigInCond) {
              const instrumentedCond = instrumentJavaScriptLoops(condRaw, guardIdent);
              out.push(` (${guardIdent}(), (${instrumentedCond}))`);
            } else {
              out.push(` ${guardIdent}(), true${condRaw}`);
            }

            out.push(';');
            const updateBodyRaw = tokens
              .slice(semi2 + 1, closeParen)
              .map((t) => t.value)
              .join('');
            out.push(instrumentJavaScriptLoops(updateBodyRaw, guardIdent));
            out.push(')');
            i = closeParen + 1;
            continue;
          } else {
            // `for (const x of arr)` / `for (const k in obj)`：同时对括号内表达式与循环体（含无花括号单语句体）插桩
            for (let x = i; x <= openParen; x++) out.push(tokens[x].value);
            const headerInnerRaw = tokens
              .slice(openParen + 1, closeParen)
              .map((t) => t.value)
              .join('');
            out.push(instrumentJavaScriptLoops(headerInnerRaw, guardIdent));
            out.push(')');

            const afterFor = nextSigIndex(tokens, closeParen + 1);
            if (afterFor !== -1 && tokens[afterFor].kind === 'punct') {
              if (tokens[afterFor].value === '{') {
                for (let x = closeParen + 1; x <= afterFor; x++) out.push(tokens[x].value);
                out.push(` ${guardIdent}();`);
                i = afterFor + 1;
                continue;
              }
              if (tokens[afterFor].value === ';') {
                for (let x = closeParen + 1; x < afterFor; x++) out.push(tokens[x].value);
                out.push(`{ ${guardIdent}(); }`);
                i = afterFor + 1;
                continue;
              }
            }
            if (afterFor !== -1) {
              // 无花括号单语句循环体（如 `for (const x of infIter) count++;`）：
              // 使用完备闭合的 `if (guard(), false) {} else ` 前缀，既保持原始行号与 break/continue 语义，又杜绝悬挂 else 歧义
              out.push(` if (${guardIdent}(), false) {} else `);
            }
            i = closeParen + 1;
            continue;
          }
        }
      }
    }

    out.push(tok.value);
    i++;
  }

  return out.join('');
}
