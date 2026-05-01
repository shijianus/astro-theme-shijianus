import { readCountryHeader } from './client';
import { numberFromEnv } from './http';
import { getRotatedTokens, markTokenFailure, markTokenSuccess } from './provider-tokens';
import type { AppEnv } from './types';

export type IpInfoPayload = {
  countryCode: string;
  countryName: string;
  asn: string;
  asName: string;
  asDomain: string;
  source: 'ipinfo' | 'cf-header' | 'none';
};

function isPrivateIp(value: string) {
  const ip = value.trim().toLowerCase();
  if (!ip || ip === '127.0.0.1' || ip === '::1') return true;
  if (ip.startsWith('10.') || ip.startsWith('192.168.') || ip.startsWith('169.254.')) return true;
  if (/^172\.(1[6-9]|2\d|3[01])\./.test(ip)) return true;
  if (ip.startsWith('fc') || ip.startsWith('fd') || ip.startsWith('fe80:')) return true;
  return false;
}

function parseIpInfoPayload(payload: Record<string, unknown>) {
  return {
    countryCode:
      typeof payload.country_code === 'string'
        ? payload.country_code.trim().toUpperCase()
        : typeof payload.country === 'string' && payload.country.length === 2
          ? payload.country.trim().toUpperCase()
          : '',
    countryName:
      typeof payload.country === 'string' && payload.country.length > 2
        ? payload.country.trim()
        : typeof payload.country_name === 'string'
          ? payload.country_name.trim()
          : '',
    asn:
      typeof payload.asn === 'string'
        ? payload.asn.trim()
        : typeof payload.as === 'string'
          ? payload.as.trim()
          : '',
    asName:
      typeof payload.as_name === 'string'
        ? payload.as_name.trim()
        : typeof payload.org === 'string'
          ? payload.org.trim()
          : '',
    asDomain: typeof payload.as_domain === 'string' ? payload.as_domain.trim() : '',
  };
}

export async function lookupIpInfo(env: AppEnv, request: Request, ip: string): Promise<IpInfoPayload> {
  const fallbackCountry = readCountryHeader(request);
  if (!ip || isPrivateIp(ip)) {
    return {
      countryCode: fallbackCountry,
      countryName: '',
      asn: '',
      asName: '',
      asDomain: '',
      source: fallbackCountry ? 'cf-header' : 'none',
    };
  }

  const invalidCooldown = numberFromEnv(env.IPINFO_COOLDOWN_INVALID_SECONDS, 60 * 60 * 24 * 30);
  const rateLimitCooldown = numberFromEnv(env.IPINFO_COOLDOWN_RATE_LIMIT_SECONDS, 60 * 60 * 24);
  const transientCooldown = numberFromEnv(env.IPINFO_COOLDOWN_TRANSIENT_SECONDS, 60 * 15);
  const rotatedTokens = await getRotatedTokens(env, 'ipinfo', env.IPINFO_TOKENS);

  for (const candidate of rotatedTokens) {
    const endpoints = [
      `https://api.ipinfo.io/lite/${encodeURIComponent(ip)}?token=${encodeURIComponent(candidate.token)}`,
      `https://ipinfo.io/${encodeURIComponent(ip)}/json?token=${encodeURIComponent(candidate.token)}`,
    ];

    for (const endpoint of endpoints) {
      try {
        const response = await fetch(endpoint, {
          headers: {
            Accept: 'application/json',
            'User-Agent': request.headers.get('user-agent') || 'shijianus/geo-risk',
          },
          signal: AbortSignal.timeout(2500),
        });

        if (response.ok) {
          const payload = parseIpInfoPayload((await response.json()) as Record<string, unknown>);
          if (payload.countryCode) {
            await markTokenSuccess(env, 'ipinfo', candidate.tokenHash, candidate.tokenSuffix);
            return {
              ...payload,
              source: 'ipinfo',
            };
          }
        }

        const cooldownSeconds =
          response.status === 401 || response.status === 403
            ? invalidCooldown
            : response.status === 429
              ? rateLimitCooldown
              : transientCooldown;
        const terminalTokenFailure = response.status === 401 || response.status === 403 || response.status === 429;

        await markTokenFailure(
          env,
          'ipinfo',
          candidate.tokenHash,
          candidate.tokenSuffix,
          response.status,
          `ipinfo status ${response.status}`,
          cooldownSeconds,
        );

        if (terminalTokenFailure) {
          break;
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'ipinfo request failed';
        await markTokenFailure(
          env,
          'ipinfo',
          candidate.tokenHash,
          candidate.tokenSuffix,
          599,
          message,
          transientCooldown,
        );
      }
    }
  }

  return {
    countryCode: fallbackCountry,
    countryName: '',
    asn: '',
    asName: '',
    asDomain: '',
    source: fallbackCountry ? 'cf-header' : 'none',
  };
}
