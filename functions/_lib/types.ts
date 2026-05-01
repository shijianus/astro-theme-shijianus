export type D1StatementResult<T = Record<string, unknown>> = {
  results?: T[];
  success?: boolean;
  meta?: Record<string, unknown>;
};

export type D1PreparedStatement = {
  bind: (...values: unknown[]) => {
    all: <T = Record<string, unknown>>() => Promise<D1StatementResult<T>>;
    first: <T = Record<string, unknown>>() => Promise<T | null>;
    run: () => Promise<D1StatementResult>;
  };
};

export type D1DatabaseLike = {
  prepare: (query: string) => D1PreparedStatement;
};

export type AiBindingLike = {
  run: (model: string, input: Record<string, unknown>) => Promise<Record<string, unknown>>;
};

export type AppEnv = {
  DB?: D1DatabaseLike;
  AI?: AiBindingLike;
  ALLOW_ORIGINS?: string;
  RATE_LIMIT_SALT?: string;
  IPINFO_TOKENS?: string;
  IPINFO_COOLDOWN_INVALID_SECONDS?: string;
  IPINFO_COOLDOWN_RATE_LIMIT_SECONDS?: string;
  IPINFO_COOLDOWN_TRANSIENT_SECONDS?: string;
  GEMINI_API_KEYS?: string;
  GEMINI_MODEL?: string;
  GEMINI_COOLDOWN_INVALID_SECONDS?: string;
  GEMINI_COOLDOWN_RATE_LIMIT_SECONDS?: string;
  GEMINI_COOLDOWN_TRANSIENT_SECONDS?: string;
  MODELSCOPE_API_KEYS?: string;
  WORKERS_AI_MODEL?: string;
  MODELSCOPE_API_KEY?: string;
  MODELSCOPE_MODEL?: string;
  MODELSCOPE_BASE_URL?: string;
  MODELSCOPE_COOLDOWN_INVALID_SECONDS?: string;
  MODELSCOPE_COOLDOWN_RATE_LIMIT_SECONDS?: string;
  MODELSCOPE_COOLDOWN_TRANSIENT_SECONDS?: string;
  MUSIC_PROVIDER_API_BASE?: string;
  MUSIC_DEFAULT_SOURCE?: string;
  MUSIC_SEARCH_PER_MINUTE?: string;
  MUSIC_STREAM_PER_MINUTE?: string;
  MUSIC_LYRIC_PER_MINUTE?: string;
  REWARD_GEO_PER_MINUTE?: string;
  AI_SUMMARY_PER_MINUTE?: string;
  AI_SUMMARY_PER_HOUR?: string;
  AI_SUMMARY_PER_DEVICE_MINUTE?: string;
  AI_SUMMARY_PER_DEVICE_HOUR?: string;
  AI_SUMMARY_PER_IP_MINUTE?: string;
  AI_SUMMARY_PER_IP_HOUR?: string;
  AI_SUMMARY_CACHE_TTL_SECONDS?: string;
  SUPPORT_USDT_ADDRESS?: string;
  SUPPORT_USDT_NETWORK?: string;
};

export type ProviderTokenState = {
  provider: string;
  tokenHash: string;
  tokenSuffix: string;
  cooldownUntil: number;
  failCount: number;
  lastStatus: number | null;
  lastError: string;
  lastUsedAt: number;
  lastSuccessAt: number;
};
