import { sha256Hex } from './hash';
import { parseCsv } from './client';
import type { AppEnv, ProviderTokenState } from './types';

function hasDb(env: AppEnv) {
  return Boolean(env.DB?.prepare);
}

export async function listTokenStates(env: AppEnv, provider: string) {
  if (!hasDb(env)) return new Map<string, ProviderTokenState>();

  try {
    const result = await env.DB!.prepare(
      `SELECT provider, token_hash AS tokenHash, token_suffix AS tokenSuffix, cooldown_until AS cooldownUntil,
              fail_count AS failCount, last_status AS lastStatus, last_error AS lastError,
              last_used_at AS lastUsedAt, last_success_at AS lastSuccessAt
         FROM provider_token_states
        WHERE provider = ?`
    ).bind(provider).all<ProviderTokenState>();

    const rows = result.results || [];
    return new Map(rows.map((item) => [item.tokenHash, item]));
  } catch {
    return new Map<string, ProviderTokenState>();
  }
}

export async function getRotatedTokens(env: AppEnv, provider: string, rawTokens: string | undefined) {
  const tokens = parseCsv(rawTokens);
  if (tokens.length === 0) return [];

  const stateMap = await listTokenStates(env, provider);
  const now = Math.floor(Date.now() / 1000);
  const enriched = await Promise.all(tokens.map(async (token) => {
    const tokenHash = await sha256Hex(`${provider}:${token}`);
    const state = stateMap.get(tokenHash);
    return {
      token,
      tokenHash,
      tokenSuffix: token.slice(-4),
      cooldownUntil: state?.cooldownUntil ?? 0,
      lastUsedAt: state?.lastUsedAt ?? 0,
      disabled: (state?.cooldownUntil ?? 0) > now,
    };
  }));

  return enriched.sort((left, right) => {
    if (left.disabled !== right.disabled) return left.disabled ? 1 : -1;
    if (left.cooldownUntil !== right.cooldownUntil) return left.cooldownUntil - right.cooldownUntil;
    return left.lastUsedAt - right.lastUsedAt;
  });
}

export async function markTokenSuccess(env: AppEnv, provider: string, tokenHash: string, tokenSuffix: string) {
  if (!hasDb(env)) return;

  const now = Math.floor(Date.now() / 1000);
  await env.DB!.prepare(
    `INSERT INTO provider_token_states (
        provider, token_hash, token_suffix, cooldown_until, fail_count,
        last_status, last_error, last_used_at, last_success_at
      ) VALUES (?, ?, ?, 0, 0, NULL, '', ?, ?)
      ON CONFLICT(provider, token_hash) DO UPDATE SET
        token_suffix = excluded.token_suffix,
        cooldown_until = 0,
        fail_count = 0,
        last_status = NULL,
        last_error = '',
        last_used_at = excluded.last_used_at,
        last_success_at = excluded.last_success_at`
  ).bind(provider, tokenHash, tokenSuffix, now, now).run();
}

export async function markTokenFailure(
  env: AppEnv,
  provider: string,
  tokenHash: string,
  tokenSuffix: string,
  status: number,
  errorMessage: string,
  cooldownSeconds: number,
) {
  if (!hasDb(env)) return;

  const now = Math.floor(Date.now() / 1000);
  const cooldownUntil = now + cooldownSeconds;
  await env.DB!.prepare(
    `INSERT INTO provider_token_states (
        provider, token_hash, token_suffix, cooldown_until, fail_count,
        last_status, last_error, last_used_at, last_success_at
      ) VALUES (?, ?, ?, ?, 1, ?, ?, ?, 0)
      ON CONFLICT(provider, token_hash) DO UPDATE SET
        token_suffix = excluded.token_suffix,
        cooldown_until = excluded.cooldown_until,
        fail_count = provider_token_states.fail_count + 1,
        last_status = excluded.last_status,
        last_error = excluded.last_error,
        last_used_at = excluded.last_used_at`
  ).bind(provider, tokenHash, tokenSuffix, cooldownUntil, status, errorMessage.slice(0, 220), now).run();
}
