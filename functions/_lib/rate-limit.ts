import { readClientIp, readDeviceId } from './client.ts';
import { sha256Hex } from './hash.ts';
import { numberFromEnv } from './http.ts';
import type { AppEnv } from './types';

type LimitOptions = {
  namespace: string;
  request: Request;
  env: AppEnv;
  limit: number;
  windowSeconds: number;
  extraKey?: string;
  scope?: 'hybrid' | 'ip' | 'device';
};

type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  resetAt: number;
  used: number;
};

const memoryBuckets = new Map<string, { count: number; resetAt: number }>();

function hasDb(env: AppEnv) {
  return Boolean(env.DB?.prepare);
}

async function buildActorHash({ request, env, namespace, extraKey = '', scope = 'hybrid' }: LimitOptions) {
  const ip = readClientIp(request) || 'unknown-ip';
  const userAgent = request.headers.get('user-agent') || 'unknown-ua';
  const deviceId = readDeviceId(request) || 'unknown-device';
  const salt = env.RATE_LIMIT_SALT || 'shijianus-rate-limit';

  if (scope === 'ip') {
    return sha256Hex([salt, namespace, 'ip', ip, extraKey].join('|'));
  }

  if (scope === 'device') {
    return sha256Hex([salt, namespace, 'device', deviceId, userAgent, extraKey].join('|'));
  }

  return sha256Hex([salt, namespace, 'hybrid', ip, deviceId, userAgent, extraKey].join('|'));
}

async function enforceRateLimitInternal(options: LimitOptions): Promise<RateLimitResult> {
  const actorHash = await buildActorHash(options);
  const now = Math.floor(Date.now() / 1000);
  const bucket = Math.floor(now / options.windowSeconds);
  const resetAt = (bucket + 1) * options.windowSeconds;

  if (!hasDb(options.env)) {
    const key = `${options.namespace}:${bucket}:${actorHash}`;
    const current = memoryBuckets.get(key);
    const nextCount = (current?.count ?? 0) + 1;
    memoryBuckets.set(key, { count: nextCount, resetAt });
    return {
      allowed: nextCount <= options.limit,
      remaining: Math.max(0, options.limit - nextCount),
      resetAt,
      used: nextCount,
    };
  }

  const keyRow = {
    namespace: options.namespace,
    bucket: String(bucket),
    actorHash,
  };

  let used = 1;
  try {
    const res = await options.env.DB!.prepare(
      `INSERT INTO rate_limits (namespace, bucket, actor_hash, count, updated_at)
        VALUES (?, ?, ?, 1, ?)
        ON CONFLICT(namespace, bucket, actor_hash) DO UPDATE SET
          count = rate_limits.count + 1,
          updated_at = excluded.updated_at
        RETURNING count`
    ).bind(keyRow.namespace, keyRow.bucket, keyRow.actorHash, now).first<{ count: number }>();

    if (res?.count !== undefined && res?.count !== null) {
      used = Number(res.count);
    } else {
      const row = await options.env.DB!.prepare(
        `SELECT count FROM rate_limits WHERE namespace = ? AND bucket = ? AND actor_hash = ?`
      ).bind(keyRow.namespace, keyRow.bucket, keyRow.actorHash).first<{ count: number }>();
      used = Number(row?.count ?? 1);
    }
  } catch {
    await options.env.DB!.prepare(
      `INSERT INTO rate_limits (namespace, bucket, actor_hash, count, updated_at)
        VALUES (?, ?, ?, 1, ?)
        ON CONFLICT(namespace, bucket, actor_hash) DO UPDATE SET
          count = rate_limits.count + 1,
          updated_at = excluded.updated_at`
    ).bind(keyRow.namespace, keyRow.bucket, keyRow.actorHash, now).run();

    const row = await options.env.DB!.prepare(
      `SELECT count FROM rate_limits WHERE namespace = ? AND bucket = ? AND actor_hash = ?`
    ).bind(keyRow.namespace, keyRow.bucket, keyRow.actorHash).first<{ count: number }>();
    used = Number(row?.count ?? 1);
  }

  return {
    allowed: used <= options.limit,
    remaining: Math.max(0, options.limit - used),
    resetAt,
    used,
  };
}

export async function enforceRateLimit(options: LimitOptions): Promise<RateLimitResult> {
  const scope = options.scope || 'hybrid';
  if (scope === 'hybrid') {
    // 1. Enforce strict IP-level rate limit first to defeat header rotation attacks
    const ipCheck = await enforceRateLimitInternal({
      ...options,
      scope: 'ip',
    });
    if (!ipCheck.allowed) {
      return ipCheck;
    }
    // 2. Also track and enforce device-level if device ID is present
    const deviceId = readDeviceId(options.request);
    if (deviceId) {
      return enforceRateLimitInternal({
        ...options,
        scope: 'device',
      });
    }
    return ipCheck;
  }

  return enforceRateLimitInternal(options);
}

export function envLimit(env: AppEnv, key: keyof AppEnv, fallback: number) {
  return numberFromEnv(env[key] as string | undefined, fallback);
}
