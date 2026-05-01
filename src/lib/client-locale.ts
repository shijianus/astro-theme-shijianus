export type LocaleVariant = 'zh-CN' | 'zh-Hant' | 'en';

export const LOCALE_VARIANT_KEY = 'shijianus-locale-variant';

const zhPattern = /[\u3400-\u9fff]/;
const originalTextNodeMap = new WeakMap<Text, string>();
const originalAttributeMap = new WeakMap<Element, Map<string, string>>();
let zhToTraditional: ((value: string) => string) | null = null;
let zhToSimplified: ((value: string) => string) | null = null;
let chineseConverterPromise: Promise<void> | null = null;
const englishDictionary = new Map<string, string>([
  ['首页', 'Home'],
  ['归档', 'Archives'],
  ['分类', 'Categories'],
  ['标签', 'Tags'],
  ['关于', 'About'],
  ['更多', 'More'],
  ['公告', 'Notice'],
  ['实验室', 'Lab'],
  ['友链与社群', 'Friends'],
  ['站点状态', 'Status'],
  ['主题路线', 'Roadmap'],
  ['友链与社群', 'Community'],
  ['友链与社群入口', 'Community entry'],
  ['交换建议', 'Exchange guide'],
  ['适合互链的站点', 'Sites for link exchange'],
  ['联系路径', 'Contact'],
  ['优先通过 TG 联系', 'Prefer Telegram'],
  ['当前状态', 'Current status'],
  ['现在已经是正式入口', 'Now a formal entry'],
  ['偏好', 'Preferences'],
  ['上一页', 'Prev'],
  ['下一页', 'Next'],
  ['上页', 'Prev'],
  ['下页', 'Next'],
  ['文章分页', 'Pagination'],
  ['切换背景：晨光背景', 'Background: Daybreak'],
  ['切换背景：网格背景', 'Background: Grid'],
  ['切换背景：星空背景', 'Background: Starfield'],
  ['切换背景：星云背景', 'Background: Nebula'],
  ['切换背景：极光背景', 'Background: Aurora'],
  ['切换背景：纯净背景', 'Background: Clean'],
  ['切换明暗模式', 'Toggle theme'],
  ['回到顶部', 'Back to top'],
  ['控制台', 'Console'],
  ['账号中心', 'Account'],
  ['账号面板', 'Account panel'],
  ['归档时间线', 'Archive timeline'],
  ['站内搜索', 'Search'],
  ['关闭搜索面板', 'Close search'],
  ['关闭控制台', 'Close console'],
  ['关闭控制台提示', 'Close console notice'],
  ['关闭账号面板', 'Close account panel'],
  ['文章目录', 'Table of contents'],
  ['当前定位', 'Current section'],
  ['最新发布', 'Latest posts'],
  ['最近文章', 'Recent posts'],
  ['站点信息', 'Site info'],
  ['分类总数', 'Categories'],
  ['标签总数', 'Tags'],
  ['文章总数', 'Posts'],
  ['阅读总量', 'Reading'],
  ['阅读总量', 'Reading'],
  ['阅读总量', 'Reading'],
  ['阅读总量', 'Reading'],
  ['阅读总量', 'Reading'],
  ['阅读时长', 'Reading'],
  ['最近更新', 'Latest update'],
  ['当前阶段', 'Current phase'],
  ['目录定位', 'TOC jump'],
  ['评论入口', 'Comments'],
  ['分享卡片', 'Share'],
  ['打开二维码', 'Open QR'],
  ['查看二维码', 'View QR'],
  ['评论', 'Comments'],
  ['公开评论', 'Public comments'],
  ['还没有公开评论', 'No public comments yet'],
  ['登录 / 注册', 'Sign in / Register'],
  ['更新资料', 'Edit profile'],
  ['昵称', 'Name'],
  ['邮箱', 'Email'],
  ['个人站点', 'Website'],
  ['头像链接', 'Avatar URL'],
  ['退出', 'Sign out'],
  ['创建账号', 'Create profile'],
  ['保存更新', 'Save'],
  ['语言', 'Language'],
  ['界面语言', 'Interface language'],
  ['简体', 'Simplified'],
  ['繁體', 'Traditional'],
  ['简体中文', 'Simplified Chinese'],
  ['繁體中文', 'Traditional Chinese'],
  ['提醒', 'Notifications'],
  ['@ 与回复', '@ mentions'],
  ['提示', 'Notice'],
  ['打赏作者', 'Support the author'],
  ['Telegram 频道', 'Telegram channel'],
  ['海外读者交流入口', 'Community for overseas readers'],
  ['中国大陆', 'Mainland China'],
  ['中国香港', 'Hong Kong'],
  ['英国', 'United Kingdom'],
  ['分享这篇文章', 'Share this post'],
  ['扫码分享', 'QR share'],
  ['复制链接', 'Copy link'],
  ['隐私说明', 'Privacy'],
  ['版权说明', 'Copyright'],
  ['使用条款', 'Terms'],
  ['友链', 'Friends'],
  ['服务', 'Services'],
  ['主题', 'Theme'],
  ['导航', 'Navigation'],
  ['协议', 'Policies'],
  ['最新文章', 'Latest posts'],
  ['博客分类', 'Categories'],
  ['本次重构', 'This rebuild'],
  ['最新文章', 'Latest posts'],
  ['继续阅读', 'Read more'],
  ['验证后阅读', 'Unlock to read'],
  ['界面语言', 'Interface language'],
  ['分类详情', 'Category detail'],
  ['标签详情', 'Tag detail'],
  ['分类索引', 'Category index'],
  ['标签索引', 'Tag index'],
  ['该分类下的文章', 'Posts in this category'],
  ['该标签下的文章', 'Posts with this tag'],
  ['关闭面板', 'Close panel'],
]);
const translatableAttributes = ['title', 'placeholder', 'aria-label', 'aria-description', 'alt'] as const;
const skipTags = new Set(['CODE', 'PRE', 'SCRIPT', 'STYLE', 'TEXTAREA', 'INPUT', 'SELECT', 'OPTION', 'KBD', 'SAMP']);
const skipSelector = '.ignore-opencc,[data-no-translate="true"]';

type TranslateMutationOptions = {
  refreshBase?: boolean;
  attributes?: readonly string[];
};

declare global {
  interface Window {
    __SHIJIANUS_LOCALE_RUNTIME__?: {
      initialized: boolean;
      translating: boolean;
      observer: MutationObserver | null;
      currentVariant: LocaleVariant;
      scheduled: number | null;
      preparing: boolean;
    };
  }
}

function getRuntimeState() {
  if (typeof window === 'undefined') {
    return {
      initialized: false,
      translating: false,
      observer: null,
      currentVariant: 'zh-CN' as LocaleVariant,
      scheduled: null as number | null,
      preparing: false,
    };
  }

  window.__SHIJIANUS_LOCALE_RUNTIME__ ??= {
    initialized: false,
    translating: false,
    observer: null,
    currentVariant: 'zh-CN',
    scheduled: null,
    preparing: false,
  };

  return window.__SHIJIANUS_LOCALE_RUNTIME__;
}

export function normaliseLocaleVariant(value: string | null | undefined): LocaleVariant {
  if (value === 'en') return 'en';
  return value === 'zh-Hant' ? 'zh-Hant' : 'zh-CN';
}

export function readStoredLocaleVariant() {
  if (typeof window === 'undefined') return 'zh-CN' satisfies LocaleVariant;

  try {
    return normaliseLocaleVariant(window.localStorage.getItem(LOCALE_VARIANT_KEY) ?? document.documentElement.dataset.localeVariant);
  } catch {
    return normaliseLocaleVariant(document.documentElement.dataset.localeVariant);
  }
}

function shouldObserveLocaleMutations(variant: LocaleVariant) {
  return variant !== 'zh-CN';
}

async function ensureChineseConverters() {
  if (zhToTraditional && zhToSimplified) return;
  if (!chineseConverterPromise) {
    chineseConverterPromise = import('opencc-js').then(({ Converter }) => {
      zhToTraditional = Converter({ from: 'cn', to: 'tw' });
      zhToSimplified = Converter({ from: 'tw', to: 'cn' });
    });
  }
  await chineseConverterPromise;
}

function convertText(value: string, variant: LocaleVariant) {
  if (!value) return value;
  if (variant === 'en') {
    const trimmed = value.trim();
    if (!trimmed) return value;
    const translated = englishDictionary.get(trimmed);
    if (!translated) return value;
    return value.replace(trimmed, translated);
  }
  if (!zhPattern.test(value)) return value;
  if (variant === 'zh-Hant') return zhToTraditional ? zhToTraditional(value) : value;
  return zhToSimplified ? zhToSimplified(value) : value;
}

function rememberOriginalTextValue(node: Text, currentValue: string, refreshBase = false) {
  if (refreshBase || !originalTextNodeMap.has(node)) {
    originalTextNodeMap.set(node, currentValue);
    return currentValue;
  }

  return originalTextNodeMap.get(node) ?? currentValue;
}

function setOriginalAttributeValue(element: Element, attribute: string, currentValue: string) {
  let store = originalAttributeMap.get(element);
  if (!store) {
    store = new Map();
    originalAttributeMap.set(element, store);
  }

  store.set(attribute, currentValue);
  return currentValue;
}

function getOriginalAttributeValue(element: Element, attribute: string, currentValue: string) {
  let store = originalAttributeMap.get(element);
  if (!store) {
    store = new Map();
    originalAttributeMap.set(element, store);
  }

  const existing = store.get(attribute);
  if (existing) return existing;
  store.set(attribute, currentValue);
  return currentValue;
}

function shouldSkipElement(element: Element) {
  return skipTags.has(element.tagName) || Boolean(element.closest(skipSelector));
}

function translateAttributes(element: Element, variant: LocaleVariant, options: TranslateMutationOptions = {}) {
  if (shouldSkipElement(element)) return;

  const attributes = options.attributes ?? translatableAttributes;

  for (const attribute of attributes) {
    const current = element.getAttribute(attribute);
    if (!current) continue;
    const base = options.refreshBase
      ? setOriginalAttributeValue(element, attribute, current)
      : getOriginalAttributeValue(element, attribute, current);
    if (!zhPattern.test(base) && !englishDictionary.has(base.trim())) continue;
    const next = convertText(base, variant);
    if (next !== current) element.setAttribute(attribute, next);
  }
}

function translateTextNode(node: Text, variant: LocaleVariant, options: TranslateMutationOptions = {}) {
  if (!node.nodeValue) return;
  const parent = node.parentElement;
  if (parent && shouldSkipElement(parent)) return;
  const base = rememberOriginalTextValue(node, node.nodeValue, options.refreshBase);
  if (!zhPattern.test(base) && !englishDictionary.has(base.trim())) return;
  const next = convertText(base, variant);
  if (next !== node.nodeValue) node.nodeValue = next;
}

function translateTree(root: Element | DocumentFragment, variant: LocaleVariant, options: TranslateMutationOptions = {}) {
  const state = getRuntimeState();
  state.translating = true;

  try {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT);
    let current: Node | null = root;

    if (current instanceof Element) translateAttributes(current, variant, options);

    while ((current = walker.nextNode())) {
      if (current instanceof Element) {
        translateAttributes(current, variant, options);
        continue;
      }

      if (current instanceof Text) translateTextNode(current, variant, options);
    }
  } finally {
    state.translating = false;
  }
}

function disconnectLocaleObserver() {
  const state = getRuntimeState();
  state.observer?.disconnect();
  state.observer = null;
}

function handleLocaleMutations(mutations: MutationRecord[]) {
  const state = getRuntimeState();
  if (state.translating || state.currentVariant === 'zh-CN') return;

  for (const mutation of mutations) {
    if (mutation.type === 'characterData' && mutation.target instanceof Text) {
      translateTextNode(mutation.target, state.currentVariant, { refreshBase: true });
      continue;
    }

    if (mutation.type === 'attributes' && mutation.target instanceof Element && mutation.attributeName) {
      translateAttributes(mutation.target, state.currentVariant, {
        refreshBase: true,
        attributes: [mutation.attributeName],
      });
      continue;
    }

    if (mutation.type !== 'childList') continue;

    mutation.addedNodes.forEach((node) => {
      if (node instanceof Element) {
        translateTree(node, state.currentVariant, { refreshBase: true });
        return;
      }

      if (node instanceof Text) {
        translateTextNode(node, state.currentVariant, { refreshBase: true });
      }
    });
  }
}

function syncLocaleObserver() {
  if (typeof window === 'undefined' || !document.body) return;

  const state = getRuntimeState();
  if (!shouldObserveLocaleMutations(state.currentVariant)) {
    disconnectLocaleObserver();
    return;
  }

  if (!state.observer) {
    state.observer = new MutationObserver(handleLocaleMutations);
  } else {
    state.observer.disconnect();
  }

  state.observer.observe(document.body, {
    subtree: true,
    childList: true,
    characterData: true,
    attributes: true,
    attributeFilter: [...translatableAttributes],
  });
}

function queueLocaleTranslation(variant: LocaleVariant, force = false) {
  if (typeof window === 'undefined' || !document.body) return;

  const state = getRuntimeState();
  if (!force && variant === 'zh-CN') return;
  if (state.scheduled || state.preparing) return;

  const queueFrame = () => {
    if (state.scheduled || !document.body) return;

    state.scheduled = window.requestAnimationFrame(() => {
      state.scheduled = null;
      if (!document.body || state.translating || getRuntimeState().currentVariant !== variant) return;
      translateTree(document.body, variant);
    });
  };

  if (variant === 'zh-Hant' && (!zhToTraditional || !zhToSimplified)) {
    state.preparing = true;
    void ensureChineseConverters()
      .then(() => {
        state.preparing = false;
        if (getRuntimeState().currentVariant !== variant) return;
        queueFrame();
      })
      .catch(() => {
        state.preparing = false;
      });
    return;
  }

  queueFrame();
}

export function applyLocaleVariant(
  variant: LocaleVariant,
  options: {
    persist?: boolean;
    translate?: boolean;
  } = {},
) {
  if (typeof document === 'undefined') return variant;

  const state = getRuntimeState();
  const nextVariant = normaliseLocaleVariant(variant);
  const persist = options.persist ?? true;
  const shouldTranslate = options.translate ?? true;

  state.currentVariant = nextVariant;
  document.documentElement.dataset.localeVariant = nextVariant;
  document.documentElement.lang = nextVariant;
  syncLocaleObserver();

  if (persist) {
    try {
      window.localStorage.setItem(LOCALE_VARIANT_KEY, nextVariant);
    } catch {}
  }

  window.dispatchEvent(new CustomEvent<LocaleVariant>('shijianus:localechange', { detail: nextVariant }));

  if (shouldTranslate && document.body) {
    queueLocaleTranslation(nextVariant, true);
  }

  return nextVariant;
}

export function toggleLocaleVariant(current?: LocaleVariant) {
  const activeVariant = current ?? readStoredLocaleVariant();
  const nextVariant = activeVariant === 'zh-CN' ? 'zh-Hant' : activeVariant === 'zh-Hant' ? 'en' : 'zh-CN';
  return applyLocaleVariant(nextVariant);
}

export function initLocaleRuntime() {
  if (typeof window === 'undefined') return;

  const state = getRuntimeState();
  if (state.initialized) return;

  state.initialized = true;
  state.currentVariant = readStoredLocaleVariant();

  const syncLocaleVariant = (event?: Event) => {
    if (event instanceof CustomEvent) {
      state.currentVariant = normaliseLocaleVariant(event.detail);
    } else {
      state.currentVariant = readStoredLocaleVariant();
    }
    syncLocaleObserver();
    queueLocaleTranslation(state.currentVariant, true);
  };

  syncLocaleObserver();

  window.addEventListener('shijianus:localechange', syncLocaleVariant as EventListener);
  window.addEventListener('storage', (event) => {
    if (event.key === LOCALE_VARIANT_KEY) syncLocaleVariant();
  });

  if (state.currentVariant !== 'zh-CN') {
    queueLocaleTranslation(state.currentVariant, true);
  }
}
