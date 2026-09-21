/**
 * Global Multilingual (i18n) Configuration Registry
 * 
 * Centralizes all article-level and UI-level localization metadata:
 * - Language code normalization (BCP 47 compatible)
 * - Native & English locale naming with dynamic Intl.DisplayNames fallback
 * - Table of Contents (TOC) localized titles and counter units
 * - Directionality (LTR / RTL)
 * - Hero translations labels
 */

export interface LocaleMeta {
  code: string;
  native: string;
  english: string;
  tocTitle: string;
  tocUnit: string;
  translationsLabel: string;
  dir?: 'ltr' | 'rtl';
}

export const SUPPORTED_LOCALES: Record<string, LocaleMeta> = {
  'zh-CN': {
    code: 'zh-CN',
    native: '简体中文',
    english: 'Chinese (Simplified)',
    tocTitle: '文章目录',
    tocUnit: '节',
    translationsLabel: '语言版本:',
    dir: 'ltr',
  },
  'zh-Hant': {
    code: 'zh-Hant',
    native: '繁體中文',
    english: 'Chinese (Traditional)',
    tocTitle: '文章目錄',
    tocUnit: '節',
    translationsLabel: '語言版本:',
    dir: 'ltr',
  },
  en: {
    code: 'en',
    native: 'English',
    english: 'English',
    tocTitle: 'Contents',
    tocUnit: 'sections',
    translationsLabel: 'Translations:',
    dir: 'ltr',
  },
  es: {
    code: 'es',
    native: 'Español',
    english: 'Spanish',
    tocTitle: 'Contenido',
    tocUnit: 'secciones',
    translationsLabel: 'Idiomas:',
    dir: 'ltr',
  },
  de: {
    code: 'de',
    native: 'Deutsch',
    english: 'German',
    tocTitle: 'Inhalt',
    tocUnit: 'Abschnitte',
    translationsLabel: 'Sprachen:',
    dir: 'ltr',
  },
  fr: {
    code: 'fr',
    native: 'Français',
    english: 'French',
    tocTitle: 'Sommaire',
    tocUnit: 'sections',
    translationsLabel: 'Langues :',
    dir: 'ltr',
  },
  ja: {
    code: 'ja',
    native: '日本語',
    english: 'Japanese',
    tocTitle: '目次',
    tocUnit: '節',
    translationsLabel: '言語:',
    dir: 'ltr',
  },
  ko: {
    code: 'ko',
    native: '한국어',
    english: 'Korean',
    tocTitle: '목차',
    tocUnit: '절',
    translationsLabel: '언어:',
    dir: 'ltr',
  },
  ru: {
    code: 'ru',
    native: 'Русский',
    english: 'Russian',
    tocTitle: 'Содержание',
    tocUnit: 'разделов',
    translationsLabel: 'Языки:',
    dir: 'ltr',
  },
  it: {
    code: 'it',
    native: 'Italiano',
    english: 'Italian',
    tocTitle: 'Indice',
    tocUnit: 'sezioni',
    translationsLabel: 'Lingue:',
    dir: 'ltr',
  },
  pt: {
    code: 'pt',
    native: 'Português',
    english: 'Portuguese',
    tocTitle: 'Conteúdo',
    tocUnit: 'seções',
    translationsLabel: 'Idiomas:',
    dir: 'ltr',
  },
  vi: {
    code: 'vi',
    native: 'Tiếng Việt',
    english: 'Vietnamese',
    tocTitle: 'Mục lục',
    tocUnit: 'mục',
    translationsLabel: 'Ngôn ngữ:',
    dir: 'ltr',
  },
  ar: {
    code: 'ar',
    native: 'العربية',
    english: 'Arabic',
    tocTitle: 'الفهرس',
    tocUnit: 'أقسام',
    translationsLabel: 'اللغات:',
    dir: 'rtl',
  },
  nl: {
    code: 'nl',
    native: 'Nederlands',
    english: 'Dutch',
    tocTitle: 'Inhoud',
    tocUnit: 'secties',
    translationsLabel: 'Talen:',
    dir: 'ltr',
  },
  pl: {
    code: 'pl',
    native: 'Polski',
    english: 'Polish',
    tocTitle: 'Spis treści',
    tocUnit: 'sekcji',
    translationsLabel: 'Języki:',
    dir: 'ltr',
  },
  tr: {
    code: 'tr',
    native: 'Türkçe',
    english: 'Turkish',
    tocTitle: 'İçindekiler',
    tocUnit: 'bölüm',
    translationsLabel: 'Diller:',
    dir: 'ltr',
  },
  sv: {
    code: 'sv',
    native: 'Svenska',
    english: 'Swedish',
    tocTitle: 'Innehåll',
    tocUnit: 'avsnitt',
    translationsLabel: 'Språk:',
    dir: 'ltr',
  },
  no: {
    code: 'no',
    native: 'Norsk',
    english: 'Norwegian',
    tocTitle: 'Innhold',
    tocUnit: 'avsnitt',
    translationsLabel: 'Språk:',
    dir: 'ltr',
  },
  da: {
    code: 'da',
    native: 'Dansk',
    english: 'Danish',
    tocTitle: 'Indhold',
    tocUnit: 'afsnit',
    translationsLabel: 'Sprog:',
    dir: 'ltr',
  },
  fi: {
    code: 'fi',
    native: 'Suomi',
    english: 'Finnish',
    tocTitle: 'Sisällys',
    tocUnit: 'osiota',
    translationsLabel: 'Kielet:',
    dir: 'ltr',
  },
  th: {
    code: 'th',
    native: 'ไทย',
    english: 'Thai',
    tocTitle: 'สารบัญ',
    tocUnit: 'ส่วน',
    translationsLabel: 'ภาษา:',
    dir: 'ltr',
  },
  id: {
    code: 'id',
    native: 'Bahasa Indonesia',
    english: 'Indonesian',
    tocTitle: 'Daftar Isi',
    tocUnit: 'bagian',
    translationsLabel: 'Bahasa:',
    dir: 'ltr',
  },
  uk: {
    code: 'uk',
    native: 'Українська',
    english: 'Ukrainian',
    tocTitle: 'Зміст',
    tocUnit: 'розділів',
    translationsLabel: 'Мови:',
    dir: 'ltr',
  },
  cs: {
    code: 'cs',
    native: 'Čeština',
    english: 'Czech',
    tocTitle: 'Obsah',
    tocUnit: 'sekcí',
    translationsLabel: 'Jazyky:',
    dir: 'ltr',
  },
  el: {
    code: 'el',
    native: 'Ελληνικά',
    english: 'Greek',
    tocTitle: 'Περιεχόμενα',
    tocUnit: 'ενότητες',
    translationsLabel: 'Γλώσσες:',
    dir: 'ltr',
  },
  he: {
    code: 'he',
    native: 'עברית',
    english: 'Hebrew',
    tocTitle: 'תוכן העניינים',
    tocUnit: 'קטעים',
    translationsLabel: 'שפות:',
    dir: 'rtl',
  },
  ro: {
    code: 'ro',
    native: 'Română',
    english: 'Romanian',
    tocTitle: 'Cuprins',
    tocUnit: 'secțiuni',
    translationsLabel: 'Limbi:',
    dir: 'ltr',
  },
  hu: {
    code: 'hu',
    native: 'Magyar',
    english: 'Hungarian',
    tocTitle: 'Tartalomjegyzék',
    tocUnit: 'szakasz',
    translationsLabel: 'Nyelvek:',
    dir: 'ltr',
  },
};

/**
 * Normalizes raw language strings into standard canonical locale codes
 */
export function normalizeLang(raw?: string): string {
  if (!raw) return 'zh-CN';
  const trimmed = String(raw).trim().toLowerCase().replace(/_/g, '-');
  if (trimmed === 'zh-cn' || trimmed === 'zh' || trimmed === 'zh-hans') return 'zh-CN';
  if (trimmed === 'zh-hant' || trimmed === 'zh-tw' || trimmed === 'zh-hk' || trimmed === 'zh-mo') return 'zh-Hant';
  if (trimmed.startsWith('en')) return 'en';
  if (trimmed.startsWith('es')) return 'es';
  if (trimmed.startsWith('de')) return 'de';
  if (trimmed.startsWith('fr')) return 'fr';
  if (trimmed.startsWith('ja')) return 'ja';
  if (trimmed.startsWith('ko')) return 'ko';
  if (trimmed.startsWith('ru')) return 'ru';
  if (trimmed.startsWith('it')) return 'it';
  if (trimmed.startsWith('pt')) return 'pt';
  if (trimmed.startsWith('vi')) return 'vi';
  if (trimmed.startsWith('ar')) return 'ar';
  if (trimmed.startsWith('nl')) return 'nl';
  if (trimmed.startsWith('pl')) return 'pl';
  if (trimmed.startsWith('tr')) return 'tr';
  if (trimmed.startsWith('sv')) return 'sv';
  if (trimmed.startsWith('no')) return 'no';
  if (trimmed.startsWith('da')) return 'da';
  if (trimmed.startsWith('fi')) return 'fi';
  if (trimmed.startsWith('th')) return 'th';
  if (trimmed.startsWith('id')) return 'id';
  if (trimmed.startsWith('uk')) return 'uk';
  if (trimmed.startsWith('cs')) return 'cs';
  if (trimmed.startsWith('el')) return 'el';
  if (trimmed.startsWith('he')) return 'he';
  if (trimmed.startsWith('ro')) return 'ro';
  if (trimmed.startsWith('hu')) return 'hu';
  return trimmed;
}

/**
 * Retrieves comprehensive metadata for a given language code
 */
export function getLocaleMeta(langCode: string): LocaleMeta {
  const norm = normalizeLang(langCode);
  if (SUPPORTED_LOCALES[norm]) return SUPPORTED_LOCALES[norm];
  if (SUPPORTED_LOCALES[langCode]) return SUPPORTED_LOCALES[langCode];

  // Dynamic Intl fallback for any uncommon/future locale
  try {
    const nativeName = new Intl.DisplayNames([norm], { type: 'language' }).of(norm);
    const englishName = new Intl.DisplayNames(['en'], { type: 'language' }).of(norm);
    if (nativeName) {
      const capNative = nativeName.charAt(0).toUpperCase() + nativeName.slice(1);
      const capEnglish = (englishName || capNative).charAt(0).toUpperCase() + (englishName || capNative).slice(1);
      return {
        code: norm,
        native: capNative,
        english: capEnglish,
        tocTitle: 'Contents',
        tocUnit: 'sections',
        translationsLabel: 'Translations:',
        dir: 'ltr',
      };
    }
  } catch (_) {}

  return {
    code: norm,
    native: langCode,
    english: langCode,
    tocTitle: 'Contents',
    tocUnit: 'sections',
    translationsLabel: 'Translations:',
    dir: 'ltr',
  };
}

/**
 * Retrieves TOC title and count unit for a language
 */
export function getTocMeta(langCode: string): { title: string; unit: string } {
  const meta = getLocaleMeta(langCode);
  return { title: meta.tocTitle, unit: meta.tocUnit };
}

/**
 * Pre-compiled JSON dictionary for client scripts
 */
export function getSerializedTocDictionary(): Record<string, { title: string; unit: string }> {
  return Object.fromEntries(
    Object.entries(SUPPORTED_LOCALES).map(([code, meta]) => [
      code,
      { title: meta.tocTitle, unit: meta.tocUnit },
    ])
  );
}
