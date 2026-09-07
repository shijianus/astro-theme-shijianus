export type GeoLocale = 'zh-CN' | 'zh-Hant' | 'en' | string;

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
  }
> = {
  TW: {
    flag: '🇹🇼',
    zh: '台湾',
    'zh-Hant': '台灣',
    en: 'Taiwan',
  },
  HK: {
    flag: '🇭🇰',
    zh: '香港',
    'zh-Hant': '香港',
    en: 'Hong Kong',
  },
  MO: {
    flag: '🇲🇴',
    zh: '澳门',
    'zh-Hant': '澳門',
    en: 'Macau',
  },
  US: {
    flag: '🇺🇸',
    zh: '美国',
    'zh-Hant': '美國',
    en: 'United States',
  },
  JP: {
    flag: '🇯🇵',
    zh: '日本',
    'zh-Hant': '日本',
    en: 'Japan',
  },
  SG: {
    flag: '🇸🇬',
    zh: '新加坡',
    'zh-Hant': '新加坡',
    en: 'Singapore',
  },
  KR: {
    flag: '🇰🇷',
    zh: '韩国',
    'zh-Hant': '韓國',
    en: 'South Korea',
  },
  GB: {
    flag: '🇬🇧',
    zh: '英国',
    'zh-Hant': '英國',
    en: 'United Kingdom',
  },
  DE: {
    flag: '🇩🇪',
    zh: '德国',
    'zh-Hant': '德國',
    en: 'Germany',
  },
  FR: {
    flag: '🇫🇷',
    zh: '法国',
    'zh-Hant': '法國',
    en: 'France',
  },
  CA: {
    flag: '🇨🇦',
    zh: '加拿大',
    'zh-Hant': '加拿大',
    en: 'Canada',
  },
  AU: {
    flag: '🇦🇺',
    zh: '澳大利亚',
    'zh-Hant': '澳大利亞',
    en: 'Australia',
  },
  CN: {
    flag: '🇨🇳',
    zh: '中国大陆',
    'zh-Hant': '中國大陸',
    en: 'China',
  },
  MY: {
    flag: '🇲🇾',
    zh: '马来西亚',
    'zh-Hant': '馬來西亞',
    en: 'Malaysia',
  },
  TH: {
    flag: '🇹🇭',
    zh: '泰国',
    'zh-Hant': '泰國',
    en: 'Thailand',
  },
  VN: {
    flag: '🇻🇳',
    zh: '越南',
    'zh-Hant': '越南',
    en: 'Vietnam',
  },
  PH: {
    flag: '🇵🇭',
    zh: '菲律宾',
    'zh-Hant': '菲律賓',
    en: 'Philippines',
  },
  ID: {
    flag: '🇮🇩',
    zh: '印度尼西亚',
    'zh-Hant': '印尼',
    en: 'Indonesia',
  },
  IN: {
    flag: '🇮🇳',
    zh: '印度',
    'zh-Hant': '印度',
    en: 'India',
  },
  RU: {
    flag: '🇷🇺',
    zh: '俄罗斯',
    'zh-Hant': '俄羅斯',
    en: 'Russia',
  },
  NL: {
    flag: '🇳🇱',
    zh: '荷兰',
    'zh-Hant': '荷蘭',
    en: 'Netherlands',
  },
  CH: {
    flag: '🇨🇭',
    zh: '瑞士',
    'zh-Hant': '瑞士',
    en: 'Switzerland',
  },
  SE: {
    flag: '🇸🇪',
    zh: '瑞典',
    'zh-Hant': '瑞典',
    en: 'Sweden',
  },
  GLOBAL: {
    flag: '🌐',
    zh: '全球',
    'zh-Hant': '全球',
    en: 'Global',
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
 * Resolves standard geo information for badges and locations
 */
export function resolveGeoInfo(countryCode?: string | null, locale: GeoLocale = 'zh-CN'): GeoItemInfo {
  const code = (countryCode || 'GLOBAL').trim().toUpperCase();
  const explicit = EXPLICIT_GEO_DICTIONARY[code];
  const flag = explicit?.flag || getFlagEmoji(code);

  let name = '';
  let englishName = explicit?.en || code;

  if (explicit) {
    if (locale === 'zh-Hant') {
      name = explicit['zh-Hant'];
    } else if (locale === 'en' || locale.startsWith('en-')) {
      name = explicit.en;
    } else {
      name = explicit.zh;
    }
  } else {
    // Dynamic Intl fallback
    try {
      if (typeof Intl !== 'undefined' && typeof Intl.DisplayNames === 'function' && /^[A-Z]{2}$/.test(code)) {
        const intlTarget = new Intl.DisplayNames([locale || 'zh-CN'], { type: 'region' });
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
