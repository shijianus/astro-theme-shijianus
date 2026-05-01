import { createHash, timingSafeEqual } from 'node:crypto';
import { open, type Reader } from 'maxmind';

type PostAccess = {
  password?: string;
  passwordHash?: string;
  allowedCountries?: string[];
  blockedCountries?: string[];
  allowedIps?: string[];
  blockedIps?: string[];
  message?: string;
} | undefined;

type AccessHeaders = Headers;

export type PostAccessEvaluation = {
  passwordHash: string;
  cookieName: string;
  cookieValue: string;
  clientIp: string;
  countryCode: string;
  requiresPassword: boolean;
  hasPasswordGrant: boolean;
  locationAllowed: boolean;
  passwordAllowed: boolean;
  unlocked: boolean;
  denialReason: string;
};

const COUNTRY_HEADER_KEYS = [
  'cf-ipcountry',
  'x-vercel-ip-country',
  'cloudfront-viewer-country',
  'fastly-country-code',
  'x-geo-country',
  'x-country-code',
  'x-appengine-country',
];
const IP_HEADER_KEYS = [
  'forwarded',
  'cf-connecting-ip',
  'x-nf-client-connection-ip',
  'x-real-ip',
  'x-forwarded-for',
  'x-vercel-forwarded-for',
  'x-client-ip',
  'true-client-ip',
  'fly-client-ip',
];
const DEFAULT_IPINFO_INVALID_COOLDOWN_SECONDS = 60 * 60 * 24 * 30;
const DEFAULT_IPINFO_RATE_LIMIT_COOLDOWN_SECONDS = 60 * 60 * 24;
const DEFAULT_IPINFO_TRANSIENT_COOLDOWN_SECONDS = 60 * 15;
const providerCooldownState = new Map<string, number>();
let geoLiteReaderPromise: Promise<Reader<Record<string, unknown>> | null> | null = null;

function sha256Hex(value: string) {
  return createHash('sha256').update(value).digest('hex');
}

export function createAccessPasswordHash(password: string) {
  return sha256Hex(password.trim());
}

function normalizeRuleList(value: string[] | undefined) {
  return (value ?? [])
    .map((item) => item.trim().toUpperCase())
    .filter(Boolean);
}

function readHeader(headers: AccessHeaders, keys: string[]) {
  for (const key of keys) {
    const value = headers.get(key);
    if (!value) continue;
    if (key === 'forwarded') {
      const match = value.match(/for=(?:"?)(\[?[a-f0-9:.]+\]?|\d+\.\d+\.\d+\.\d+)/i);
      if (match?.[1]) return match[1].replace(/^\[|\]$/g, '').trim();
    }
    if (key === 'x-forwarded-for') {
      return value.split(',')[0]?.trim() ?? '';
    }
    return value.trim();
  }
  return '';
}

async function lookupCountryCode(clientIp: string) {
  if (!clientIp || isLocalOrPrivateIp(clientIp)) return '';

  const ipInfoTokens = (process.env.IPINFO_TOKENS || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
  const now = Date.now();

  const invalidCooldownSeconds = Number.parseInt(
    process.env.IPINFO_COOLDOWN_INVALID_SECONDS || '',
    10,
  ) || DEFAULT_IPINFO_INVALID_COOLDOWN_SECONDS;
  const rateLimitCooldownSeconds = Number.parseInt(
    process.env.IPINFO_COOLDOWN_RATE_LIMIT_SECONDS || '',
    10,
  ) || DEFAULT_IPINFO_RATE_LIMIT_COOLDOWN_SECONDS;
  const transientCooldownSeconds = Number.parseInt(
    process.env.IPINFO_COOLDOWN_TRANSIENT_SECONDS || '',
    10,
  ) || DEFAULT_IPINFO_TRANSIENT_COOLDOWN_SECONDS;

  const availableTokens = ipInfoTokens
    .map((token) => ({
      token,
      key: `ipinfo:${token.slice(-4)}`,
      cooldownUntil: providerCooldownState.get(`ipinfo:${token.slice(-4)}`) ?? 0,
    }))
    .sort((left, right) => left.cooldownUntil - right.cooldownUntil)
    .filter((entry) => entry.cooldownUntil <= now);

  for (const entry of availableTokens) {
    const ipInfoEndpoints = [
      `https://api.ipinfo.io/lite/${encodeURIComponent(clientIp)}?token=${encodeURIComponent(entry.token)}`,
      `https://ipinfo.io/${encodeURIComponent(clientIp)}/json?token=${encodeURIComponent(entry.token)}`,
    ];

    for (const endpoint of ipInfoEndpoints) {
      try {
        const response = await fetch(endpoint, {
          headers: { Accept: 'application/json' },
          signal: AbortSignal.timeout(2500),
        });
        if (!response.ok) {
          const cooldownSeconds =
            response.status === 401 || response.status === 403
              ? invalidCooldownSeconds
              : response.status === 429
                ? rateLimitCooldownSeconds
                : transientCooldownSeconds;
          providerCooldownState.set(entry.key, now + cooldownSeconds * 1000);
          continue;
        }

        const payload = await response.json();
        const countryCode =
          typeof payload?.country_code === 'string'
            ? payload.country_code.trim().toUpperCase()
            : typeof payload?.country === 'string' && payload.country.length === 2
              ? payload.country.trim().toUpperCase()
              : '';
        if (countryCode) {
          providerCooldownState.delete(entry.key);
          return countryCode;
        }
      } catch {
        providerCooldownState.set(entry.key, now + transientCooldownSeconds * 1000);
      }
    }
  }

  const endpoints = [
    `https://ipapi.co/${encodeURIComponent(clientIp)}/json/`,
    `https://ipwho.is/${encodeURIComponent(clientIp)}`,
  ];

  for (const endpoint of endpoints) {
    try {
      const response = await fetch(endpoint, {
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(2500),
      });
      if (!response.ok) continue;
      const payload = await response.json();
      const countryCode =
        typeof payload?.country_code === 'string'
          ? payload.country_code.trim().toUpperCase()
          : typeof payload?.countryCode === 'string'
            ? payload.countryCode.trim().toUpperCase()
          : typeof payload?.country === 'string' && payload.country.length === 2
            ? payload.country.trim().toUpperCase()
            : '';
      if (countryCode) return countryCode;
    } catch {}
  }

  const geoLitePath = process.env.MAXMIND_GEOLITE2_COUNTRY_PATH?.trim();
  if (geoLitePath) {
    try {
      if (!geoLiteReaderPromise) {
        geoLiteReaderPromise = open<Record<string, unknown>>(geoLitePath).catch(() => null);
      }

      const reader = await geoLiteReaderPromise;
      const payload = reader?.get(clientIp) as { country?: { iso_code?: string } } | null;
      const countryCode = payload?.country?.iso_code?.trim().toUpperCase() || '';
      if (countryCode) return countryCode;
    } catch {}
  }

  return '';
}

function normalizeIp(value: string) {
  return value.trim().toLowerCase();
}

function isLocalOrPrivateIp(value: string) {
  const ip = normalizeIp(value);
  if (!ip || ip === '127.0.0.1' || ip === '::1') return true;
  if (ip.startsWith('10.') || ip.startsWith('192.168.') || ip.startsWith('169.254.')) return true;
  if (/^172\.(1[6-9]|2\d|3[01])\./.test(ip)) return true;
  if (ip.startsWith('fc') || ip.startsWith('fd') || ip.startsWith('fe80:')) return true;
  return false;
}

function parseIpv4(value: string) {
  const segments = value.split('.').map((segment) => Number.parseInt(segment, 10));
  if (segments.length !== 4 || segments.some((segment) => Number.isNaN(segment) || segment < 0 || segment > 255)) {
    return null;
  }
  return segments;
}

function ipv4ToInt(value: string) {
  const segments = parseIpv4(value);
  if (!segments) return null;
  return (((segments[0] ?? 0) << 24) | ((segments[1] ?? 0) << 16) | ((segments[2] ?? 0) << 8) | (segments[3] ?? 0)) >>> 0;
}

function matchesIpRule(candidateValue: string, ruleValue: string) {
  const candidate = normalizeIp(candidateValue);
  const rule = normalizeIp(ruleValue);
  if (!candidate || !rule) return false;
  if (candidate === rule) return true;

  if (rule.includes('*')) {
    const pattern = new RegExp(`^${rule.replaceAll('.', '\\.').replaceAll('*', '.*')}$`, 'i');
    return pattern.test(candidate);
  }

  if (rule.includes('/')) {
    const [networkValue, prefixValue] = rule.split('/');
    const network = ipv4ToInt(networkValue ?? '');
    const address = ipv4ToInt(candidate);
    const prefix = Number.parseInt(prefixValue ?? '', 10);

    if (network === null || address === null || Number.isNaN(prefix) || prefix < 0 || prefix > 32) {
      return false;
    }

    if (prefix === 0) return true;
    const mask = prefix === 32 ? 0xffffffff : (0xffffffff << (32 - prefix)) >>> 0;
    return (network & mask) === (address & mask);
  }

  return false;
}

export function getAccessPasswordHash(access: PostAccess) {
  if (!access) return '';
  if (access.passwordHash?.trim()) return access.passwordHash.trim().toLowerCase();
  if (access.password?.trim()) return createAccessPasswordHash(access.password);
  return '';
}

export function verifyAccessPassword(access: PostAccess, password: string) {
  const passwordHash = getAccessPasswordHash(access);
  if (!passwordHash || !password.trim()) return false;
  const submittedHash = createAccessPasswordHash(password);

  try {
    return timingSafeEqual(Buffer.from(submittedHash, 'hex'), Buffer.from(passwordHash, 'hex'));
  } catch {
    return submittedHash === passwordHash;
  }
}

export async function evaluatePostAccess({
  slug,
  access,
  headers,
  cookieValue,
}: {
  slug: string;
  access: PostAccess;
  headers: AccessHeaders;
  cookieValue?: string;
}): Promise<PostAccessEvaluation> {
  const allowedCountries = normalizeRuleList(access?.allowedCountries);
  const blockedCountries = normalizeRuleList(access?.blockedCountries);
  const allowedIps = normalizeRuleList(access?.allowedIps);
  const blockedIps = normalizeRuleList(access?.blockedIps);
  const passwordHash = getAccessPasswordHash(access);
  const cookieName = `shijianus-post-access:${slug}`;
  const expectedCookieValue = passwordHash ? sha256Hex(`${slug}:${passwordHash}`) : '';
  const clientIp = readHeader(headers, IP_HEADER_KEYS);
  let countryCode = readHeader(headers, COUNTRY_HEADER_KEYS).toUpperCase();

  if (!countryCode && (allowedCountries.length > 0 || blockedCountries.length > 0)) {
    countryCode = await lookupCountryCode(clientIp);
  }

  const hasPasswordGrant = Boolean(expectedCookieValue && cookieValue === expectedCookieValue);
  const requiresPassword = Boolean(passwordHash);
  const passwordAllowed = !requiresPassword || hasPasswordGrant;
  const customMessage = access?.message?.trim() || '';

  let locationAllowed = true;
  let denialReason = '';

  if (allowedCountries.length > 0) {
    if (!countryCode) {
      locationAllowed = false;
      denialReason = '暂时无法确认访问地区，请稍后重试。';
    } else if (!allowedCountries.includes(countryCode)) {
      locationAllowed = false;
      denialReason = '当前地区不在允许访问范围内。';
    }
  }

  if (locationAllowed && blockedCountries.length > 0 && countryCode && blockedCountries.includes(countryCode)) {
    locationAllowed = false;
    denialReason = '当前地区不可访问这篇文章。';
  }

  if (locationAllowed && allowedIps.length > 0) {
    if (!clientIp) {
      locationAllowed = false;
      denialReason = '暂时无法确认当前网络地址，请稍后重试。';
    } else if (!allowedIps.some((rule) => matchesIpRule(clientIp, rule))) {
      locationAllowed = false;
      denialReason = '当前网络地址不在允许访问范围内。';
    }
  }

  if (locationAllowed && blockedIps.length > 0 && clientIp && blockedIps.some((rule) => matchesIpRule(clientIp, rule))) {
    locationAllowed = false;
    denialReason = '当前网络地址不可访问这篇文章。';
  }

  if (!denialReason && requiresPassword && !hasPasswordGrant) {
    denialReason = '这篇文章需要通过密码验证后才能继续阅读。';
  }

  if (customMessage && denialReason) {
    denialReason = customMessage;
  }

  return {
    passwordHash,
    cookieName,
    cookieValue: expectedCookieValue,
    clientIp,
    countryCode,
    requiresPassword,
    hasPasswordGrant,
    locationAllowed,
    passwordAllowed,
    unlocked: locationAllowed && passwordAllowed,
    denialReason,
  };
}
