export type RuntimeClientHints = {
  timezone?: string;
  timezoneOffsetMinutes?: number;
  language?: string;
  languages?: string[];
  platform?: string;
  userAgent?: string;
  deviceId?: string;
  webrtcSupported?: boolean;
  locale?: string;
};

export function parseCsv(value: string | undefined) {
  return (value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

export function normalizeCountry(value: string) {
  const normalized = value.trim().toUpperCase();
  return normalized.length === 2 ? normalized : '';
}

export function readClientIp(request: Request) {
  const forwarded = request.headers.get('cf-connecting-ip')
    || request.headers.get('x-real-ip')
    || request.headers.get('x-forwarded-for')
    || '';

  return forwarded.split(',')[0]?.trim() || '';
}

export function readCountryHeader(request: Request) {
  return normalizeCountry(request.headers.get('cf-ipcountry') || '');
}

export function readDeviceId(request: Request) {
  return request.headers.get('x-shijianus-device-id')?.trim() || '';
}

export function countryToRewardRegion(country: string) {
  if (country === 'CN') return 'cn';
  if (country === 'HK') return 'hk';
  if (country === 'GB' || country === 'UK') return 'uk';
  return 'unsupported';
}

export function countryLabel(country: string) {
  if (country === 'CN') return '中国大陆';
  if (country === 'HK') return '中国香港';
  if (country === 'GB' || country === 'UK') return '英国';
  return country || '未知地区';
}

export function normalizeLanguageTag(value: string) {
  return value.trim().toLowerCase();
}

export function normalizeTimeZone(value: string) {
  return value.trim();
}

export function getPrimaryLanguage(hints: RuntimeClientHints) {
  const [firstLanguage] = hints.languages || [];
  return normalizeLanguageTag(firstLanguage || hints.language || '');
}

export function isMainlandSignal(hints: RuntimeClientHints) {
  const timezone = normalizeTimeZone(hints.timezone || '');
  const language = normalizeLanguageTag(hints.language || '');
  const locale = normalizeLanguageTag(hints.locale || '');
  const languages = (hints.languages || []).map(normalizeLanguageTag);
  return timezone === 'Asia/Shanghai'
    || language === 'zh-cn'
    || locale === 'zh-cn'
    || languages.includes('zh-cn')
    || languages.includes('zh-hans')
    || languages.includes('zh-sg');
}

export function isHongKongSignal(hints: RuntimeClientHints) {
  const timezone = normalizeTimeZone(hints.timezone || '');
  const language = normalizeLanguageTag(hints.language || '');
  const locale = normalizeLanguageTag(hints.locale || '');
  const languages = (hints.languages || []).map(normalizeLanguageTag);
  return timezone === 'Asia/Hong_Kong'
    || language === 'zh-hk'
    || language === 'en-hk'
    || locale === 'zh-hk'
    || languages.includes('zh-hk');
}

export function isUnitedKingdomSignal(hints: RuntimeClientHints) {
  const timezone = normalizeTimeZone(hints.timezone || '');
  const language = normalizeLanguageTag(hints.language || '');
  const locale = normalizeLanguageTag(hints.locale || '');
  const languages = (hints.languages || []).map(normalizeLanguageTag);
  return timezone === 'Europe/London'
    || language === 'en-gb'
    || locale === 'en-gb'
    || languages.includes('en-gb');
}
