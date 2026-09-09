export type GeoLocale = 'zh-CN' | 'zh-Hant' | 'en' | 'fr' | 'es' | 'de' | string;

export interface GeoItemInfo {
  code: string;
  flag: string;
  name: string;
  englishName: string;
  formatted: string;
}

// Predefined explicit mapping ensuring exact international standard compliance
export const EXPLICIT_GEO_DICTIONARY: Record<
  string,
  {
    flag: string;
    zh: string;
    'zh-Hant': string;
    en: string;
    fr?: string;
    es?: string;
    de?: string;
  }
> = {
  TW: {
    flag: '🇹🇼',
    zh: '台湾',
    'zh-Hant': '台灣',
    en: 'Taiwan',
    fr: 'Taïwan',
    es: 'Taiwán',
    de: 'Taiwan',
  },
  HK: {
    flag: '🇭🇰',
    zh: '香港',
    'zh-Hant': '香港',
    en: 'Hong Kong',
    fr: 'Hong Kong',
    es: 'Hong Kong',
    de: 'Hongkong',
  },
  MO: {
    flag: '🇲🇴',
    zh: '澳门',
    'zh-Hant': '澳門',
    en: 'Macau',
    fr: 'Macao',
    es: 'Macao',
    de: 'Macau',
  },
  US: {
    flag: '🇺🇸',
    zh: '美国',
    'zh-Hant': '美國',
    en: 'United States',
    fr: 'États-Unis',
    es: 'Estados Unidos',
    de: 'Vereinigte Staaten',
  },
  JP: {
    flag: '🇯🇵',
    zh: '日本',
    'zh-Hant': '日本',
    en: 'Japan',
    fr: 'Japon',
    es: 'Japón',
    de: 'Japan',
  },
  SG: {
    flag: '🇸🇬',
    zh: '新加坡',
    'zh-Hant': '新加坡',
    en: 'Singapore',
    fr: 'Singapour',
    es: 'Singapur',
    de: 'Singapur',
  },
  KR: {
    flag: '🇰🇷',
    zh: '韩国',
    'zh-Hant': '韓國',
    en: 'South Korea',
    fr: 'Corée du Sud',
    es: 'Corea del Sur',
    de: 'Südkorea',
  },
  GB: {
    flag: '🇬🇧',
    zh: '英国',
    'zh-Hant': '英國',
    en: 'United Kingdom',
    fr: 'Royaume-Uni',
    es: 'Reino Unido',
    de: 'Vereinigtes Königreich',
  },
  DE: {
    flag: '🇩🇪',
    zh: '德国',
    'zh-Hant': '德國',
    en: 'Germany',
    fr: 'Allemagne',
    es: 'Alemania',
    de: 'Deutschland',
  },
  FR: {
    flag: '🇫🇷',
    zh: '法国',
    'zh-Hant': '法國',
    en: 'France',
    fr: 'France',
    es: 'Francia',
    de: 'Frankreich',
  },
  ES: {
    flag: '🇪🇸',
    zh: '西班牙',
    'zh-Hant': '西班牙',
    en: 'Spain',
    fr: 'Espagne',
    es: 'España',
    de: 'Spanien',
  },
  CA: {
    flag: '🇨🇦',
    zh: '加拿大',
    'zh-Hant': '加拿大',
    en: 'Canada',
    fr: 'Canada',
    es: 'Canadá',
    de: 'Kanada',
  },
  AU: {
    flag: '🇦🇺',
    zh: '澳大利亚',
    'zh-Hant': '澳大利亞',
    en: 'Australia',
    fr: 'Australie',
    es: 'Australia',
    de: 'Australien',
  },
  CN: {
    flag: '🇨🇳',
    zh: '中国',
    'zh-Hant': '中國',
    en: 'China',
    fr: 'Chine',
    es: 'China',
    de: 'China',
  },
  MY: {
    flag: '🇲🇾',
    zh: '马来西亚',
    'zh-Hant': '馬來西亞',
    en: 'Malaysia',
    fr: 'Malaisie',
    es: 'Malasia',
    de: 'Malaysia',
  },
  TH: {
    flag: '🇹🇭',
    zh: '泰国',
    'zh-Hant': '泰國',
    en: 'Thailand',
    fr: 'Thaïlande',
    es: 'Tailandia',
    de: 'Thailand',
  },
  VN: {
    flag: '🇻🇳',
    zh: '越南',
    'zh-Hant': '越南',
    en: 'Vietnam',
    fr: 'Vietnam',
    es: 'Vietnam',
    de: 'Vietnam',
  },
  PH: {
    flag: '🇵🇭',
    zh: '菲律宾',
    'zh-Hant': '菲律賓',
    en: 'Philippines',
    fr: 'Philippines',
    es: 'Filipinas',
    de: 'Philippinen',
  },
  ID: {
    flag: '🇮🇩',
    zh: '印度尼西亚',
    'zh-Hant': '印尼',
    en: 'Indonesia',
    fr: 'Indonésie',
    es: 'Indonesia',
    de: 'Indonesien',
  },
  IN: {
    flag: '🇮🇳',
    zh: '印度',
    'zh-Hant': '印度',
    en: 'India',
    fr: 'Inde',
    es: 'India',
    de: 'Indien',
  },
  RU: {
    flag: '🇷🇺',
    zh: '俄罗斯',
    'zh-Hant': '俄羅斯',
    en: 'Russia',
    fr: 'Russie',
    es: 'Rusia',
    de: 'Russland',
  },
  NL: {
    flag: '🇳🇱',
    zh: '荷兰',
    'zh-Hant': '荷蘭',
    en: 'Netherlands',
    fr: 'Pays-Bas',
    es: 'Países Bajos',
    de: 'Niederlande',
  },
  CH: {
    flag: '🇨🇭',
    zh: '瑞士',
    'zh-Hant': '瑞士',
    en: 'Switzerland',
    fr: 'Suisse',
    es: 'Suiza',
    de: 'Schweiz',
  },
  SE: {
    flag: '🇸🇪',
    zh: '瑞典',
    'zh-Hant': '瑞典',
    en: 'Sweden',
    fr: 'Suède',
    es: 'Suecia',
    de: 'Schweden',
  },
  GLOBAL: {
    flag: '🌐',
    zh: '全球',
    'zh-Hant': '全球',
    en: 'Global',
    fr: 'Mondial',
    es: 'Global',
    de: 'Global',
  },
};

/**
 * Generate flag emoji from 2-letter ISO code
 */
export function getFlagEmoji(countryCode: string): string {
  const code = (countryCode || '').trim().toUpperCase();
  if (EXPLICIT_GEO_DICTIONARY[code]?.flag) {
    return EXPLICIT_GEO_DICTIONARY[code].flag;
  }
  if (/^[A-Z]{2}$/.test(code) && code !== 'XX' && code !== 'ZZ') {
    const codePoints = [...code].map((c) => 127397 + c.charCodeAt(0));
    return String.fromCodePoint(...codePoints);
  }
  return '🌐';
}

/**
 * Resolves standard geo information for badges and locations across 6 languages
 */
export function resolveGeoInfo(countryCode?: string | null, locale: GeoLocale = 'zh-CN'): GeoItemInfo {
  let input = (countryCode || 'GLOBAL').trim();
  let code = input.toUpperCase();
  let explicit = EXPLICIT_GEO_DICTIONARY[code];

  if (!explicit) {
    // Try matching by name or prefix in dictionary
    for (const [dictCode, entry] of Object.entries(EXPLICIT_GEO_DICTIONARY)) {
      if (
        dictCode === code ||
        entry.zh === input ||
        entry['zh-Hant'] === input ||
        entry.en.toUpperCase() === code ||
        input.startsWith(entry.zh) ||
        input.startsWith(entry['zh-Hant']) ||
        input.toUpperCase().startsWith(entry.en.toUpperCase())
      ) {
        code = dictCode;
        explicit = entry;
        break;
      }
    }
  }

  const flag = explicit?.flag || getFlagEmoji(code);

  let name = '';
  let englishName = explicit?.en || code;

  const targetLocale = (locale || 'zh-CN').toLowerCase();

  if (explicit) {
    if (targetLocale.includes('hant') || targetLocale === 'zh-tw' || targetLocale === 'zh-hk') {
      name = explicit['zh-Hant'];
    } else if (targetLocale.startsWith('fr')) {
      name = explicit.fr || (typeof Intl !== 'undefined' ? new Intl.DisplayNames(['fr'], { type: 'region' }).of(code) : explicit.en) || explicit.en;
    } else if (targetLocale.startsWith('es')) {
      name = explicit.es || (typeof Intl !== 'undefined' ? new Intl.DisplayNames(['es'], { type: 'region' }).of(code) : explicit.en) || explicit.en;
    } else if (targetLocale.startsWith('de')) {
      name = explicit.de || (typeof Intl !== 'undefined' ? new Intl.DisplayNames(['de'], { type: 'region' }).of(code) : explicit.en) || explicit.en;
    } else if (targetLocale.startsWith('en')) {
      name = explicit.en;
    } else {
      name = explicit.zh;
    }
  } else {
    // Dynamic Intl fallback
    try {
      if (typeof Intl !== 'undefined' && typeof Intl.DisplayNames === 'function' && /^[A-Z]{2}$/.test(code)) {
        const langCode = targetLocale.startsWith('zh-hant') ? 'zh-Hant' : targetLocale.slice(0, 2);
        const intlTarget = new Intl.DisplayNames([langCode || 'zh-CN'], { type: 'region' });
        name = intlTarget.of(code) || code;
        const intlEn = new Intl.DisplayNames(['en'], { type: 'region' });
        englishName = intlEn.of(code) || code;
      } else {
        name = code;
      }
    } catch {
      name = code;
    }
  }

  const formatted = code === 'GLOBAL' ? name : `${code} ${name}`;

  return {
    code,
    flag,
    name,
    englishName,
    formatted,
  };
}
