import { useCallback, useEffect, useState } from 'react';
import { convertText, type LocaleVariant } from '../../../lib/client-locale';

const LOCALE_VALUES: LocaleVariant[] = ['zh-CN', 'zh-Hant', 'en', 'fr', 'es', 'de'];

function isLocaleVariant(value: string | null | undefined): value is LocaleVariant {
  return Boolean(value && LOCALE_VALUES.includes(value as LocaleVariant));
}

function readCurrentLocale(): LocaleVariant {
  if (typeof window === 'undefined') return 'zh-CN';

  const datasetValue = document.documentElement.dataset.localeVariant;
  if (isLocaleVariant(datasetValue)) return datasetValue;

  const htmlLang = document.documentElement.lang;
  if (htmlLang) {
    if (htmlLang.startsWith('en')) return 'en';
    if (htmlLang.startsWith('zh-Hant') || htmlLang.startsWith('zh-TW') || htmlLang.startsWith('zh-HK')) {
      return 'zh-Hant';
    }
    if (htmlLang.startsWith('fr')) return 'fr';
    if (htmlLang.startsWith('es')) return 'es';
    if (htmlLang.startsWith('de')) return 'de';
  }

  try {
    const stored = window.localStorage.getItem('shijianus-locale-variant');
    if (isLocaleVariant(stored)) return stored;
  } catch {
    // Locale storage is optional; fall through to the site default.
  }

  return 'zh-CN';
}

export function usePlayerLocale() {
  const [locale, setLocale] = useState<LocaleVariant>('zh-CN');

  useEffect(() => {
    setLocale(readCurrentLocale());

    const handleLocaleChange = (event: Event) => {
      const detail = (event as CustomEvent<string>).detail;
      setLocale(isLocaleVariant(detail) ? detail : readCurrentLocale());
    };

    window.addEventListener('shijianus:localechange', handleLocaleChange as EventListener);
    return () => window.removeEventListener('shijianus:localechange', handleLocaleChange as EventListener);
  }, []);

  const t = useCallback((text: string) => convertText(text, locale), [locale]);

  return { locale, t };
}
