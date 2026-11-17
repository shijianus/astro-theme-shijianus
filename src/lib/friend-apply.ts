/**
 * Shared validation, URL safety sanitization, Markdown-link compatibility parsing,
 * and truthful submission feedback mapping for Friend Link & Markdown Embedded Forms.
 *
 * Used by both frontend components (/status/, /friends/, ContentFeatureEnhancer)
 * and Cloudflare Pages Functions (/api/friends/apply, /api/forms/submit).
 */

export const FRIEND_CATEGORIES = [
  '核心友邻 · 技术先锋',
  '灵感花园 · 宝藏博客',
  '漫游行者 · 生活思索',
  '品牌矩阵 · 原生生态',
] as const;

export const FRIEND_APPLY_LIMITS = {
  nameMax: 80,
  urlMax: 500,
  avatarMax: 500,
  descMax: 300,
  contactMax: 120,
  categoryMax: 60,
  formFieldValueMax: 2000,
  maxFormFields: 30,
} as const;

export const DEFAULT_FRIEND_AVATAR_PATH = '/media/brands/default-brand.svg';
export const DEFAULT_FRIEND_AVATAR_URL = 'https://blog.epocanvas.com/media/brands/default-brand.svg';

export interface SafeMarkdownLinkResult {
  name: string;
  url: string;
  mode: 'markdown' | 'url' | 'invalid' | 'empty';
}

export interface FriendApplicationInput {
  name?: string;
  url?: string;
  siteInput?: string;
  avatar?: string;
  desc?: string;
  category?: string;
  contact?: string;
  formId?: string;
  title?: string;
  source?: string;
}

export interface NormalizedFriendApplication {
  formId: string;
  title: string;
  name: string;
  url: string;
  avatar: string;
  desc: string;
  category: string;
  contact: string;
  source: string;
}

export interface FriendValidationResult {
  ok: boolean;
  data?: NormalizedFriendApplication;
  fieldErrors: Record<string, string>;
  error?: string;
}

export interface GeneralFormValidationResult {
  ok: boolean;
  data?: {
    formId: string;
    title: string;
    source: string;
    fields: Record<string, string>;
    url?: string;
    name?: string;
    avatar?: string;
    desc?: string;
    contact?: string;
    category?: string;
  };
  fieldErrors: Record<string, string>;
  error?: string;
}

export interface ApplyApiResponseShape {
  ok?: boolean;
  accepted?: boolean;
  degraded?: boolean;
  persisted?: boolean;
  notified?: boolean;
  storageStatus?: 'saved' | 'unavailable' | 'failed';
  notifyStatus?: 'sent' | 'unconfigured' | 'failed';
  reviewStatus?: 'pending_review' | 'approved' | 'not_recorded';
  status?: string;
  submissionId?: string;
  message?: string;
  error?: string;
  fieldErrors?: Record<string, string>;
}

export interface SubmissionFeedbackView {
  kind: 'full_success' | 'degraded_saved' | 'degraded_notified' | 'error';
  badge: string;
  title: string;
  detail: string;
  steps: Array<{ label: string; state: 'done' | 'warn' | 'fail' | 'pending' }>;
}

const CONTROL_CHAR_REGEX = /[\u0000-\u001f\u007f]/;
const DANGEROUS_SCHEME_REGEX = /^(?:javascript|data|vbscript|file|blob|about):/i;
const URL_FIELD_NAME_REGEX = /^(?:url|link|website|homepage|site|feed|rss|avatar|icon|cover|repo)$/i;

/**
 * Validates and normalizes a URL for safe clickable <a href> and <img src> rendering.
 * Only permits http: and https: absolute URLs (or safe single-leading-slash relative paths
 * when allowRelative is explicitly enabled). Rejects javascript:, data:, vbscript:, //, userinfo, etc.
 */
export function sanitizeSafeHttpUrl(
  raw: unknown,
  options: { allowRelative?: boolean; maxLength?: number } = {}
): string {
  const { allowRelative = false, maxLength = FRIEND_APPLY_LIMITS.urlMax } = options;
  if (typeof raw !== 'string') return '';
  const trimmed = raw.trim();
  if (!trimmed || trimmed.length > maxLength) return '';
  if (CONTROL_CHAR_REGEX.test(trimmed)) return '';
  if (/\s/.test(trimmed)) return '';

  // Reject protocol-relative URLs like //evil.com and dangerous schemes
  if (trimmed.startsWith('//')) return '';
  if (DANGEROUS_SCHEME_REGEX.test(trimmed)) return '';

  if (allowRelative && trimmed.startsWith('/')) {
    if (trimmed.startsWith('/\\')) return '';
    return trimmed;
  }

  try {
    const parsed = new URL(trimmed);
    const protocol = parsed.protocol.toLowerCase();
    if (protocol !== 'http:' && protocol !== 'https:') {
      return '';
    }
    if (!parsed.hostname || parsed.username || parsed.password) {
      return '';
    }
    return parsed.toString();
  } catch {
    return '';
  }
}

/**
 * Parses either a Markdown link (`[Name](https://...)` or `(https://...)[Name]`)
 * or a plain `https://...` URL, strictly validating the resulting URL protocol.
 */
export function parseSafeMarkdownLink(raw: unknown): SafeMarkdownLinkResult {
  const trimmed = typeof raw === 'string' ? raw.trim() : '';
  if (!trimmed) {
    return { name: '', url: '', mode: 'empty' };
  }

  // [Name](url)
  const stdMatch = trimmed.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
  if (stdMatch) {
    const candidateName = stdMatch[1].trim();
    const safeUrl = sanitizeSafeHttpUrl(stdMatch[2].trim());
    if (!safeUrl) {
      return { name: candidateName, url: '', mode: 'invalid' };
    }
    return { name: candidateName, url: safeUrl, mode: 'markdown' };
  }

  // (url)[Name]
  const revMatch = trimmed.match(/^\(([^)]+)\)\[([^\]]+)\]$/);
  if (revMatch) {
    const candidateName = revMatch[2].trim();
    const safeUrl = sanitizeSafeHttpUrl(revMatch[1].trim());
    if (!safeUrl) {
      return { name: candidateName, url: '', mode: 'invalid' };
    }
    return { name: candidateName, url: safeUrl, mode: 'markdown' };
  }

  // Inline embedded [Name](url)
  const inlineMatch = trimmed.match(/\[([^\]]+)\]\(([^)]+)\)/);
  if (inlineMatch) {
    const candidateName = inlineMatch[1].trim();
    const safeUrl = sanitizeSafeHttpUrl(inlineMatch[2].trim());
    if (!safeUrl) {
      return { name: candidateName, url: '', mode: 'invalid' };
    }
    return { name: candidateName, url: safeUrl, mode: 'markdown' };
  }

  // Plain URL
  if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(trimmed) || trimmed.includes('.')) {
    const withProtocol = /^https?:\/\//i.test(trimmed)
      ? trimmed
      : (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(trimmed) ? trimmed : '');
    const safeUrl = sanitizeSafeHttpUrl(withProtocol);
    if (!safeUrl) {
      return { name: '', url: '', mode: 'invalid' };
    }
    const derivedName = safeUrl.replace(/^https?:\/\//i, '').replace(/\/.*$/, '');
    return { name: derivedName, url: safeUrl, mode: 'url' };
  }

  return { name: trimmed, url: '', mode: 'invalid' };
}

/**
 * Validates and normalizes friend link application payloads across both
 * /status/ and /friends/ as well as server API handlers.
 */
export function validateFriendApplicationInput(
  input: FriendApplicationInput,
  options: { requireAvatar?: boolean; requireDesc?: boolean; allowRelativeAvatar?: boolean } = {}
): FriendValidationResult {
  const {
    requireAvatar = true,
    requireDesc = true,
    allowRelativeAvatar = false,
  } = options;

  const fieldErrors: Record<string, string> = {};

  let name = String(input.name || '').replace(CONTROL_CHAR_REGEX, ' ').trim();
  let urlRaw = String(input.url || '').trim();
  const siteInputRaw = String(input.siteInput || '').trim();

  // Compatibility: allow [Name](https://...) pasted into siteInput, name, or url
  if (siteInputRaw && (!name || !urlRaw)) {
    const parsed = parseSafeMarkdownLink(siteInputRaw);
    if (parsed.mode === 'invalid') {
      fieldErrors.url = '请输入合法的 http:// 或 https:// 网址，或 [站点名称](https://example.com) 格式。';
    } else if (parsed.url) {
      if (!name) name = parsed.name;
      if (!urlRaw) urlRaw = parsed.url;
    }
  } else if (urlRaw && /^\[.+\]\(.+\)$/.test(urlRaw)) {
    const parsed = parseSafeMarkdownLink(urlRaw);
    if (parsed.url) {
      urlRaw = parsed.url;
      if (!name) name = parsed.name;
    } else {
      fieldErrors.url = '站点链接仅支持合法的 http:// 或 https:// 地址。';
    }
  } else if (!urlRaw && name && /^\[.+\]\(.+\)$/.test(name)) {
    const parsed = parseSafeMarkdownLink(name);
    if (parsed.url) {
      name = parsed.name;
      urlRaw = parsed.url;
    } else {
      fieldErrors.url = '站点链接仅支持合法的 http:// 或 https:// 地址。';
    }
  }

  if (!name) {
    fieldErrors.name = '请填写站点名称。';
  } else if (name.length > FRIEND_APPLY_LIMITS.nameMax) {
    fieldErrors.name = `站点名称不能超过 ${FRIEND_APPLY_LIMITS.nameMax} 个字符。`;
  }

  const safeUrl = sanitizeSafeHttpUrl(urlRaw, {
    allowRelative: false,
    maxLength: FRIEND_APPLY_LIMITS.urlMax,
  });

  if (!urlRaw) {
    fieldErrors.url = fieldErrors.url || '请填写站点主页地址（需包含 https:// 或 http://）。';
  } else if (!safeUrl) {
    fieldErrors.url = fieldErrors.url || '站点主页地址无效，仅支持安全的 https:// 或 http:// 链接。';
  }

  const avatarRaw = String(input.avatar || '').trim();
  let safeAvatar = '';
  if (!avatarRaw) {
    if (requireAvatar) {
      fieldErrors.avatar = '请填写站点头像或图标 URL（需为 https:// 或 http:// 地址）。';
    } else {
      safeAvatar = DEFAULT_FRIEND_AVATAR_URL;
    }
  } else {
    safeAvatar = sanitizeSafeHttpUrl(avatarRaw, {
      allowRelative: allowRelativeAvatar,
      maxLength: FRIEND_APPLY_LIMITS.avatarMax,
    });
    if (!safeAvatar) {
      fieldErrors.avatar = '头像地址无效，仅支持安全的 https:// 或 http:// 图片链接。';
    }
  }

  const desc = String(input.desc || '').replace(CONTROL_CHAR_REGEX, ' ').trim();
  if (!desc) {
    if (requireDesc) {
      fieldErrors.desc = '请填写一句话站点简介。';
    }
  } else if (desc.length > FRIEND_APPLY_LIMITS.descMax) {
    fieldErrors.desc = `站点简介不能超过 ${FRIEND_APPLY_LIMITS.descMax} 个字符。`;
  }

  const contact = String(input.contact || '').replace(CONTROL_CHAR_REGEX, ' ').trim();
  if (contact.length > FRIEND_APPLY_LIMITS.contactMax) {
    fieldErrors.contact = `联系方式不能超过 ${FRIEND_APPLY_LIMITS.contactMax} 个字符。`;
  }

  const categoryRaw = String(input.category || '').replace(CONTROL_CHAR_REGEX, ' ').trim();
  const category = categoryRaw
    ? categoryRaw.slice(0, FRIEND_APPLY_LIMITS.categoryMax)
    : FRIEND_CATEGORIES[0];

  const errorKeys = Object.keys(fieldErrors);
  if (errorKeys.length > 0) {
    return {
      ok: false,
      fieldErrors,
      error: fieldErrors[errorKeys[0]],
    };
  }

  return {
    ok: true,
    fieldErrors: {},
    data: {
      formId: String(input.formId || 'friend-link-apply').trim().slice(0, 64) || 'friend-link-apply',
      title: String(input.title || '友邻互链申请').trim().slice(0, 120) || '友邻互链申请',
      name,
      url: safeUrl,
      avatar: safeAvatar || DEFAULT_FRIEND_AVATAR_URL,
      desc: desc || '（暂无简介）',
      category,
      contact,
      source: String(input.source || 'web_form').trim().slice(0, 64) || 'web_form',
    },
  };
}

/**
 * Validates and sanitizes general embedded Markdown form submissions (/api/forms/submit).
 */
export function sanitizeGeneralFormPayload(payload: Record<string, unknown>): GeneralFormValidationResult {
  const fieldErrors: Record<string, string> = {};
  const formId = String(payload.formId || 'custom-form').replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 64) || 'custom-form';
  const title = String(payload.title || '自定义表单提交').replace(CONTROL_CHAR_REGEX, ' ').trim().slice(0, 120) || '自定义表单提交';
  const source = String(payload.source || 'markdown_embedded_form').replace(CONTROL_CHAR_REGEX, '').trim().slice(0, 64) || 'markdown_embedded_form';

  const rawFields = payload.fields && typeof payload.fields === 'object' && !Array.isArray(payload.fields)
    ? (payload.fields as Record<string, unknown>)
    : {};

  const mergedEntries: Array<[string, unknown]> = [];
  for (const [k, v] of Object.entries(rawFields)) {
    mergedEntries.push([k, v]);
  }
  for (const k of ['name', 'url', 'avatar', 'desc', 'category', 'contact']) {
    if (payload[k] !== undefined && !(k in rawFields)) {
      mergedEntries.push([k, payload[k]]);
    }
  }

  if (mergedEntries.length === 0) {
    return {
      ok: false,
      fieldErrors: { form: '表单内容不能为空。' },
      error: '表单内容不能为空。',
    };
  }

  if (mergedEntries.length > FRIEND_APPLY_LIMITS.maxFormFields) {
    return {
      ok: false,
      fieldErrors: { form: '提交字段数量超出限制。' },
      error: '提交字段数量超出限制。',
    };
  }

  const sanitizedFields: Record<string, string> = {};
  for (const [rawKey, rawVal] of mergedEntries) {
    const key = String(rawKey).replace(CONTROL_CHAR_REGEX, '').trim().slice(0, 64);
    if (!key) continue;
    const val = String(rawVal ?? '').replace(CONTROL_CHAR_REGEX, ' ').trim();
    if (val.length > FRIEND_APPLY_LIMITS.formFieldValueMax) {
      fieldErrors[key] = `字段 ${key} 长度不能超过 ${FRIEND_APPLY_LIMITS.formFieldValueMax} 个字符。`;
      continue;
    }
    if (val && (URL_FIELD_NAME_REGEX.test(key) || DANGEROUS_SCHEME_REGEX.test(val))) {
      const safe = sanitizeSafeHttpUrl(val, { allowRelative: false, maxLength: FRIEND_APPLY_LIMITS.urlMax });
      if (!safe) {
        fieldErrors[key] = `字段 ${key} 仅支持安全的 https:// 或 http:// 链接。`;
        continue;
      }
      sanitizedFields[key] = safe;
    } else {
      sanitizedFields[key] = val;
    }
  }

  const errorKeys = Object.keys(fieldErrors);
  if (errorKeys.length > 0) {
    return {
      ok: false,
      fieldErrors,
      error: fieldErrors[errorKeys[0]],
    };
  }

  return {
    ok: true,
    fieldErrors: {},
    data: {
      formId,
      title,
      source,
      fields: sanitizedFields,
      name: sanitizedFields.name,
      url: sanitizedFields.url,
      avatar: sanitizedFields.avatar,
      desc: sanitizedFields.desc,
      contact: sanitizedFields.contact,
      category: sanitizedFields.category,
    },
  };
}

/**
 * Maps an API response (or HTTP failure) into truthful, non-misleading status feedback.
 * Explicitly distinguishes request receipt, database persistence, Telegram notification,
 * and pending manual review.
 */
export function interpretApplyApiResponse(
  httpOk: boolean,
  httpStatus: number,
  data: ApplyApiResponseShape | null | undefined
): SubmissionFeedbackView {
  if (!httpOk || !data || data.ok !== true) {
    const errMsg =
      data?.error ||
      (httpStatus === 429
        ? '提交过于频繁，请稍后再试。'
        : httpStatus >= 500
          ? '服务端暂时不可用，申请未能保存或送达通知，请稍后重试或通过邮件联系站长。'
          : '提交未通过校验或请求失败，请检查填写内容后重试。');
    return {
      kind: 'error',
      badge: '提交未完成',
      title: '申请未能完成受理',
      detail: errMsg,
      steps: [
        { label: data?.accepted ? '校验已通过' : '请求校验', state: data?.accepted ? 'done' : 'fail' },
        { label: '数据库持久化 (D1)', state: data?.persisted ? 'done' : 'fail' },
        { label: '站长通知 (TG)', state: data?.notified ? 'done' : 'fail' },
        { label: '进入人工审核', state: 'fail' },
      ],
    };
  }

  const persisted = Boolean(data.persisted);
  const notified = Boolean(data.notified);

  if (persisted && notified) {
    return {
      kind: 'full_success',
      badge: '已受理 · 待人工审核',
      title: '申请已保存并通知站长',
      detail:
        data.message ||
        '您的申请数据已写入服务端数据库（D1）并已发送通知。这表示申请已进入人工审核队列，并不代表站点已被收录进正式友邻目录。',
      steps: [
        { label: '格式校验通过', state: 'done' },
        { label: '数据已保存 (D1)', state: 'done' },
        { label: '通知已发送 (TG)', state: 'done' },
        { label: '等待人工审核', state: 'pending' },
      ],
    };
  }

  if (persisted && !notified) {
    return {
      kind: 'degraded_saved',
      badge: '已保存 · 通知未送达',
      title: '申请已写入数据库，但即时通知未送达',
      detail:
        data.message ||
        '您的申请已保存到服务端数据库（D1），但 Telegram 即时通知未能送达或当前环境未配置通知凭证。站长仍可在数据库记录中看到该申请，如久未回复可通过邮件联系确认。',
      steps: [
        { label: '格式校验通过', state: 'done' },
        { label: '数据已保存 (D1)', state: 'done' },
        { label: '通知未送达 (TG)', state: 'warn' },
        { label: '等待人工审核', state: 'pending' },
      ],
    };
  }

  return {
    kind: 'degraded_notified',
    badge: '已通知 · 数据库未写入',
    title: '通知已发送给站长，但数据库未完成持久化',
    detail:
      data.message ||
      '本次申请已通过即时通知发往站长，但当前环境未能写入服务端数据库（D1）。建议保留填写内容备份，并在审核后确认结果。',
    steps: [
      { label: '格式校验通过', state: 'done' },
      { label: '数据库未持久化', state: 'warn' },
      { label: '通知已发送 (TG)', state: 'done' },
      { label: '等待人工审核', state: 'pending' },
    ],
  };
}
