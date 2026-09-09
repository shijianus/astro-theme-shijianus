export type SupportedLocale = 'zh-CN' | 'zh-Hant' | 'en' | 'fr' | 'es' | 'de';
export type LocaleVariant = SupportedLocale;

export const SUPPORTED_LOCALES: readonly SupportedLocale[] = [
  'zh-CN',
  'zh-Hant',
  'en',
  'fr',
  'es',
  'de',
] as const;

export const USER_PERSONA_STORAGE_KEY = 'shijianus-user-persona';
export const LOCALE_VARIANT_KEY = 'shijianus-locale-variant';
export const MANUAL_LOCALE_KEY = 'shijianus-manual-locale-selected';

export interface UserPersonaProfile {
  primaryLocale: SupportedLocale;
  secondaryLocale: SupportedLocale;
  candidatePair: [SupportedLocale, SupportedLocale];
  confidence: number;
  scores: Record<SupportedLocale, number>;
  traits: {
    inputMethodLocale: string;
    detectedLanguages: string[];
    timezone: string;
    ipCountry: string;
    isLikelyProxy: boolean;
    reasoning: string;
  };
  updatedAt: number;
}

export interface InferenceEnvOptions {
  ipCountry?: string;
  timezone?: string;
  languages?: string[];
  inputMethodLocale?: string;
}

// Common overseas proxy/VPN exit countries frequented by Chinese mainland users
const COMMON_PROXY_COUNTRIES = new Set(['MY', 'SG', 'JP', 'KR', 'US', 'HK', 'TW', 'GB', 'DE']);

/**
 * Normalise any locale string into a recognized SupportedLocale
 */
export function normaliseLocale(code?: string | null): SupportedLocale {
  if (!code) return 'zh-CN';
  const clean = code.trim().toLowerCase();

  if (clean.includes('hant') || clean.includes('tw') || clean.includes('hk') || clean.includes('mo')) {
    return 'zh-Hant';
  }
  if (clean.startsWith('zh')) {
    return 'zh-CN';
  }
  if (clean.startsWith('fr')) {
    return 'fr';
  }
  if (clean.startsWith('es')) {
    return 'es';
  }
  if (clean.startsWith('de')) {
    return 'de';
  }
  if (clean.startsWith('en')) {
    return 'en';
  }

  return 'zh-CN';
}

/**
 * Extract browser languages and probable IME (Input Method Editor) locale
 */
export function detectClientEnvironment(): Required<InferenceEnvOptions> {
  let languages: string[] = [];
  let inputMethodLocale = '';
  let timezone = '';

  if (typeof navigator !== 'undefined') {
    if (Array.isArray(navigator.languages) && navigator.languages.length > 0) {
      languages = [...navigator.languages];
    } else if (navigator.language) {
      languages = [navigator.language];
    }
  }

  // The primary browser language or first entry represents the active system/IME input language
  inputMethodLocale = languages[0] || 'zh-CN';

  if (typeof Intl !== 'undefined' && typeof Intl.DateTimeFormat === 'function') {
    try {
      timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
    } catch {}
  }

  return {
    languages,
    inputMethodLocale,
    timezone,
    ipCountry: 'GLOBAL',
  };
}

/**
 * Intelligent User Persona & Locale Inference Algorithm
 * 
 * Weights:
 * - 45% (0.45): User default/current IME & input environment (navigator.languages / inputMethodLocale)
 * - 40% (0.40): User resolved timezone
 * - 15% (0.15): IP geolocation & proxy deviation criticism
 */
export function inferUserPersona(env?: InferenceEnvOptions): UserPersonaProfile {
  const detected = detectClientEnvironment();
  const languages = env?.languages && env.languages.length > 0 ? env.languages : detected.languages;
  const inputMethodLocale = (env?.inputMethodLocale || languages[0] || detected.inputMethodLocale || 'zh-CN').toLowerCase();
  const timezone = env?.timezone || detected.timezone || '';
  const ipCountry = (env?.ipCountry || 'GLOBAL').trim().toUpperCase();

  const scores: Record<SupportedLocale, number> = {
    'zh-CN': 0,
    'zh-Hant': 0,
    en: 0,
    fr: 0,
    es: 0,
    de: 0,
  };

  const isPinyinOrHans =
    inputMethodLocale.includes('hans') ||
    inputMethodLocale.includes('cn') ||
    inputMethodLocale.includes('sg') ||
    inputMethodLocale === 'zh' ||
    inputMethodLocale.includes('pinyin');

  const isZhuYinOrHant =
    inputMethodLocale.includes('hant') ||
    inputMethodLocale.includes('tw') ||
    inputMethodLocale.includes('hk') ||
    inputMethodLocale.includes('mo');

  // 1. Evaluate Input Method / Language Environment (Weight: 45%)
  const WEIGHT_IME = 0.45;
  if (isPinyinOrHans) {
    scores['zh-CN'] += WEIGHT_IME * 1.0;
    scores['zh-Hant'] += WEIGHT_IME * 0.55; // High cross-comprehension
    scores.en += WEIGHT_IME * 0.15;
  } else if (isZhuYinOrHant) {
    scores['zh-Hant'] += WEIGHT_IME * 1.0;
    scores['zh-CN'] += WEIGHT_IME * 0.55;
    scores.en += WEIGHT_IME * 0.2;
  } else if (inputMethodLocale.startsWith('fr')) {
    scores.fr += WEIGHT_IME * 1.0;
    scores.en += WEIGHT_IME * 0.4;
  } else if (inputMethodLocale.startsWith('es')) {
    scores.es += WEIGHT_IME * 1.0;
    scores.en += WEIGHT_IME * 0.4;
  } else if (inputMethodLocale.startsWith('de')) {
    scores.de += WEIGHT_IME * 1.0;
    scores.en += WEIGHT_IME * 0.4;
  } else if (inputMethodLocale.startsWith('en')) {
    scores.en += WEIGHT_IME * 1.0;
    scores['zh-CN'] += WEIGHT_IME * 0.15;
  } else {
    // Fallback: check secondary languages
    const hasHans = languages.some((l) => l.toLowerCase().includes('hans') || l.toLowerCase().includes('cn'));
    const hasHant = languages.some((l) => l.toLowerCase().includes('hant') || l.toLowerCase().includes('tw') || l.toLowerCase().includes('hk'));
    if (hasHans) scores['zh-CN'] += WEIGHT_IME * 0.8;
    if (hasHant) scores['zh-Hant'] += WEIGHT_IME * 0.7;
    scores.en += WEIGHT_IME * 0.5;
  }

  // 2. Evaluate User Timezone (Weight: 40%)
  const WEIGHT_TZ = 0.4;
  const tzLower = timezone.toLowerCase();

  // Proxy / Evasion detection logic:
  // e.g. User with Pinyin IME + Taipei timezone + Overseas IP (MY, SG, US, etc.)
  // -> Typical case of Mainland user evading inspection or using proxy with Taipei time
  const isTaipeiTimezone = tzLower.includes('taipei');
  const isMainlandTimezone =
    tzLower.includes('shanghai') ||
    tzLower.includes('chongqing') ||
    tzLower.includes('urumqi') ||
    tzLower.includes('beijing') ||
    tzLower.includes('harbin');

  if (isTaipeiTimezone) {
    if (isPinyinOrHans) {
      // Mainland user evading or using Taipei time, primary remains Simplified Chinese
      scores['zh-CN'] += WEIGHT_TZ * 0.85;
      scores['zh-Hant'] += WEIGHT_TZ * 0.75;
    } else {
      scores['zh-Hant'] += WEIGHT_TZ * 1.0;
      scores['zh-CN'] += WEIGHT_TZ * 0.5;
    }
  } else if (isMainlandTimezone) {
    scores['zh-CN'] += WEIGHT_TZ * 1.0;
    scores['zh-Hant'] += WEIGHT_TZ * 0.6;
  } else if (tzLower.includes('hong_kong') || tzLower.includes('macau') || tzLower.includes('macao')) {
    scores['zh-Hant'] += WEIGHT_TZ * 1.0;
    scores['zh-CN'] += WEIGHT_TZ * 0.6;
  } else if (tzLower.includes('paris') || tzLower.includes('brussels') || tzLower.includes('quebec') || tzLower.includes('montreal')) {
    scores.fr += WEIGHT_TZ * 1.0;
    scores.en += WEIGHT_TZ * 0.4;
  } else if (
    tzLower.includes('madrid') ||
    tzLower.includes('mexico') ||
    tzLower.includes('buenos_aires') ||
    tzLower.includes('bogota') ||
    tzLower.includes('santiago') ||
    tzLower.includes('lima')
  ) {
    scores.es += WEIGHT_TZ * 1.0;
    scores.en += WEIGHT_TZ * 0.4;
  } else if (tzLower.includes('berlin') || tzLower.includes('vienna') || tzLower.includes('zurich')) {
    scores.de += WEIGHT_TZ * 1.0;
    scores.en += WEIGHT_TZ * 0.4;
  } else if (
    tzLower.includes('london') ||
    tzLower.includes('new_york') ||
    tzLower.includes('chicago') ||
    tzLower.includes('los_angeles') ||
    tzLower.includes('toronto') ||
    tzLower.includes('sydney') ||
    tzLower.includes('auckland')
  ) {
    scores.en += WEIGHT_TZ * 1.0;
    // Blog origin is Chinese, award slight baseline
    scores['zh-CN'] += WEIGHT_TZ * 0.15;
  } else {
    // Unmatched timezone fallback
    scores.en += WEIGHT_TZ * 0.5;
    scores['zh-CN'] += WEIGHT_TZ * 0.3;
  }

  // 3. Evaluate IP Geolocation & Proxy Deviation (Weight: 15%)
  const WEIGHT_GEO = 0.15;
  let isLikelyProxy = false;
  let reasoning = '';

  if (isPinyinOrHans && COMMON_PROXY_COUNTRIES.has(ipCountry) && (isTaipeiTimezone || isMainlandTimezone || ipCountry !== 'CN')) {
    isLikelyProxy = true;
    reasoning = `Pinyin IME (45%) + ${timezone || 'Taipei'} time (40%) + ${ipCountry} proxy (15%): Identified as Chinese mainland reader using proxy; defaulted to zh-CN.`;
    // Suppress foreign geo skew, prioritize Chinese
    scores['zh-CN'] += WEIGHT_GEO * 1.0;
    scores['zh-Hant'] += WEIGHT_GEO * 0.6;
  } else if (ipCountry === 'CN') {
    scores['zh-CN'] += WEIGHT_GEO * 1.0;
    scores['zh-Hant'] += WEIGHT_GEO * 0.5;
    reasoning = `Direct Mainland IP (CN) + ${inputMethodLocale} IME.`;
  } else if (ipCountry === 'TW' || ipCountry === 'HK' || ipCountry === 'MO') {
    scores['zh-Hant'] += WEIGHT_GEO * 1.0;
    scores['zh-CN'] += WEIGHT_GEO * 0.6;
    reasoning = `Traditional Chinese region IP (${ipCountry}) + ${timezone} timezone.`;
  } else if (ipCountry === 'FR') {
    scores.fr += WEIGHT_GEO * 1.0;
    scores.en += WEIGHT_GEO * 0.4;
    reasoning = `France IP (FR) + ${timezone} timezone.`;
  } else if (['ES', 'MX', 'AR', 'CO', 'CL', 'PE'].includes(ipCountry)) {
    scores.es += WEIGHT_GEO * 1.0;
    scores.en += WEIGHT_GEO * 0.4;
    reasoning = `Hispanic region IP (${ipCountry}) + ${timezone} timezone.`;
  } else if (['DE', 'AT', 'CH'].includes(ipCountry)) {
    scores.de += WEIGHT_GEO * 1.0;
    scores.en += WEIGHT_GEO * 0.4;
    reasoning = `German-speaking region IP (${ipCountry}) + ${timezone} timezone.`;
  } else if (['US', 'GB', 'CA', 'AU', 'NZ', 'IE'].includes(ipCountry)) {
    scores.en += WEIGHT_GEO * 1.0;
    reasoning = `English-speaking region IP (${ipCountry}).`;
  } else {
    // Default international
    scores.en += WEIGHT_GEO * 0.7;
    scores['zh-CN'] += WEIGHT_GEO * 0.3;
    reasoning = `Standard global evaluation: IP=${ipCountry}, IME=${inputMethodLocale}, TZ=${timezone}.`;
  }

  // Sort scores descending
  const sorted = (Object.entries(scores) as [SupportedLocale, number][]).sort((a, b) => b[1] - a[1]);
  const primaryLocale = sorted[0][0];
  let secondaryLocale = sorted[1][0];

  // Precise Dual-Language Pairing Rule:
  // When a user belongs to a specific demographic, lock the minimal cycle into 2 optimal candidate languages
  let candidatePair: [SupportedLocale, SupportedLocale];

  if (primaryLocale === 'zh-CN') {
    // Simplified Chinese users naturally benefit from zh-CN <-> zh-Hant cycle
    candidatePair = ['zh-CN', 'zh-Hant'];
    secondaryLocale = 'zh-Hant';
  } else if (primaryLocale === 'zh-Hant') {
    // Traditional Chinese users benefit from zh-Hant <-> zh-CN (or zh-Hant <-> en)
    candidatePair = ['zh-Hant', 'zh-CN'];
    secondaryLocale = 'zh-CN';
  } else if (primaryLocale === 'fr') {
    candidatePair = ['fr', 'en'];
    secondaryLocale = 'en';
  } else if (primaryLocale === 'es') {
    candidatePair = ['es', 'en'];
    secondaryLocale = 'en';
  } else if (primaryLocale === 'de') {
    candidatePair = ['de', 'en'];
    secondaryLocale = 'en';
  } else {
    // primary is 'en'
    if (scores['zh-CN'] > 0.2 || scores['zh-Hant'] > 0.2) {
      candidatePair = ['en', 'zh-CN'];
      secondaryLocale = 'zh-CN';
    } else if (scores.fr > scores.de && scores.fr > scores.es) {
      candidatePair = ['en', 'fr'];
      secondaryLocale = 'fr';
    } else if (scores.de > scores.es) {
      candidatePair = ['en', 'de'];
      secondaryLocale = 'de';
    } else {
      candidatePair = ['en', 'zh-CN'];
      secondaryLocale = 'zh-CN';
    }
  }

  const confidence = Math.min(0.99, Math.max(0.6, Number(sorted[0][1].toFixed(2))));

  return {
    primaryLocale,
    secondaryLocale,
    candidatePair,
    confidence,
    scores,
    traits: {
      inputMethodLocale,
      detectedLanguages: languages,
      timezone,
      ipCountry,
      isLikelyProxy,
      reasoning,
    },
    updatedAt: Date.now(),
  };
}

/**
 * Read stored user persona from localStorage
 */
export function readStoredUserPersona(): UserPersonaProfile | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(USER_PERSONA_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && parsed.primaryLocale && parsed.candidatePair) {
      return parsed as UserPersonaProfile;
    }
  } catch {}
  return null;
}

/**
 * Persist user persona into localStorage
 */
export function writeStoredUserPersona(persona: UserPersonaProfile): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(USER_PERSONA_STORAGE_KEY, JSON.stringify(persona));
  } catch {}
}

/**
 * Ensure user persona is initialized and resolved
 */
export function ensureUserPersona(ipCountry?: string): UserPersonaProfile {
  let existing = readStoredUserPersona();
  if (existing && !ipCountry) {
    return existing;
  }

  const inferred = inferUserPersona(ipCountry ? { ipCountry } : undefined);
  if (!existing) {
    writeStoredUserPersona(inferred);
    return inferred;
  }

  // Update geo trait if changed
  if (ipCountry && existing.traits.ipCountry !== ipCountry) {
    existing = inferUserPersona({
      ipCountry,
      timezone: existing.traits.timezone,
      languages: existing.traits.detectedLanguages,
      inputMethodLocale: existing.traits.inputMethodLocale,
    });
    writeStoredUserPersona(existing);
  }

  return existing;
}

/**
 * When the user explicitly picks a language in Account Preferences,
 * update the minimal 2-language candidate pair so that the rightside #translate button
 * continues to switch smoothly between the user's explicit preference and its primary complement.
 */
export function updateCandidatePairWithManualChoice(manualLocale: SupportedLocale): [SupportedLocale, SupportedLocale] {
  const currentPersona = ensureUserPersona();
  let complement: SupportedLocale;

  if (manualLocale === 'zh-CN') {
    complement = 'zh-Hant';
  } else if (manualLocale === 'zh-Hant') {
    complement = 'zh-CN';
  } else if (manualLocale === 'en') {
    complement = currentPersona.primaryLocale === 'zh-CN' || currentPersona.primaryLocale === 'zh-Hant' ? 'zh-CN' : 'fr';
  } else {
    // fr, es, de
    complement = 'en';
  }

  const updatedPair: [SupportedLocale, SupportedLocale] = [manualLocale, complement];
  currentPersona.candidatePair = updatedPair;
  currentPersona.primaryLocale = manualLocale;
  currentPersona.secondaryLocale = complement;
  writeStoredUserPersona(currentPersona);

  return updatedPair;
}
