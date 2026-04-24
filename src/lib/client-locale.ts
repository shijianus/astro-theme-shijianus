import { Converter } from 'opencc-js';

export type LocaleVariant = 'zh-CN' | 'zh-Hant';

export const LOCALE_VARIANT_KEY = 'shijianus-locale-variant';

const zhToTraditional = Converter({ from: 'cn', to: 'tw' });
const zhToSimplified = Converter({ from: 'tw', to: 'cn' });
const zhPattern = /[\u3400-\u9fff]/;
const translatableAttributes = ['title', 'placeholder', 'aria-label', 'aria-description', 'alt'] as const;
const skipTags = new Set(['CODE', 'PRE', 'SCRIPT', 'STYLE', 'TEXTAREA', 'INPUT', 'SELECT', 'OPTION', 'KBD', 'SAMP']);
const skipSelector = '.ignore-opencc,[data-no-translate="true"]';

declare global {
  interface Window {
    __SHIJIANUS_LOCALE_RUNTIME__?: {
      initialized: boolean;
      translating: boolean;
      observer: MutationObserver | null;
      currentVariant: LocaleVariant;
      scheduled: number | null;
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
    };
  }

  window.__SHIJIANUS_LOCALE_RUNTIME__ ??= {
    initialized: false,
    translating: false,
    observer: null,
    currentVariant: 'zh-CN',
    scheduled: null,
  };

  return window.__SHIJIANUS_LOCALE_RUNTIME__;
}

export function normaliseLocaleVariant(value: string | null | undefined): LocaleVariant {
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

function convertText(value: string, variant: LocaleVariant) {
  if (!value || !zhPattern.test(value)) return value;
  return variant === 'zh-Hant' ? zhToTraditional(value) : zhToSimplified(value);
}

function shouldSkipElement(element: Element) {
  return skipTags.has(element.tagName) || Boolean(element.closest(skipSelector));
}

function translateAttributes(element: Element, variant: LocaleVariant) {
  if (shouldSkipElement(element)) return;

  for (const attribute of translatableAttributes) {
    const current = element.getAttribute(attribute);
    if (!current || !zhPattern.test(current)) continue;
    const next = convertText(current, variant);
    if (next !== current) element.setAttribute(attribute, next);
  }
}

function translateTextNode(node: Text, variant: LocaleVariant) {
  if (!node.nodeValue || !zhPattern.test(node.nodeValue)) return;
  const parent = node.parentElement;
  if (parent && shouldSkipElement(parent)) return;
  const next = convertText(node.nodeValue, variant);
  if (next !== node.nodeValue) node.nodeValue = next;
}

function translateTree(root: Element | DocumentFragment, variant: LocaleVariant) {
  const state = getRuntimeState();
  state.translating = true;

  try {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT);
    let current: Node | null = root;

    if (current instanceof Element) translateAttributes(current, variant);

    while ((current = walker.nextNode())) {
      if (current instanceof Element) {
        translateAttributes(current, variant);
        continue;
      }

      if (current instanceof Text) translateTextNode(current, variant);
    }
  } finally {
    state.translating = false;
  }
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

  if (persist) {
    try {
      window.localStorage.setItem(LOCALE_VARIANT_KEY, nextVariant);
    } catch {}
  }

  window.dispatchEvent(new CustomEvent<LocaleVariant>('shijianus:localechange', { detail: nextVariant }));

  if (shouldTranslate && document.body) {
    translateTree(document.body, nextVariant);
  }

  return nextVariant;
}

export function toggleLocaleVariant(current?: LocaleVariant) {
  const activeVariant = current ?? readStoredLocaleVariant();
  const nextVariant = activeVariant === 'zh-CN' ? 'zh-Hant' : 'zh-CN';
  return applyLocaleVariant(nextVariant);
}

export function initLocaleRuntime() {
  if (typeof window === 'undefined') return;

  const state = getRuntimeState();
  if (state.initialized) return;

  state.initialized = true;
  state.currentVariant = readStoredLocaleVariant();

  const scheduleTranslate = () => {
    if (state.scheduled || !document.body) return;

    state.scheduled = window.requestAnimationFrame(() => {
      state.scheduled = null;
      if (!document.body || state.translating) return;
      translateTree(document.body, state.currentVariant);
    });
  };

  const syncLocaleVariant = (event?: Event) => {
    if (event instanceof CustomEvent) {
      state.currentVariant = normaliseLocaleVariant(event.detail);
    } else {
      state.currentVariant = readStoredLocaleVariant();
    }
    scheduleTranslate();
  };

  state.observer = new MutationObserver(() => {
    if (state.translating) return;
    scheduleTranslate();
  });

  if (document.body) {
    state.observer.observe(document.body, {
      subtree: true,
      childList: true,
      characterData: true,
      attributes: true,
      attributeFilter: [...translatableAttributes],
    });
  }

  window.addEventListener('shijianus:localechange', syncLocaleVariant as EventListener);
  window.addEventListener('storage', (event) => {
    if (event.key === LOCALE_VARIANT_KEY) syncLocaleVariant();
  });

  scheduleTranslate();
}
