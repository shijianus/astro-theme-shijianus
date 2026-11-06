import type { MusicTrack } from './types';

type PlaylistPayload = {
  ok: boolean;
  tracks?: MusicTrack[];
};

type SearchPayload = {
  ok: boolean;
  tracks?: MusicTrack[];
};

export type LyricPayload = {
  ok?: boolean;
  lyric?: string;
  lrc?: string;
  rawLyric?: string;
  elrc?: string;
  parsed?: unknown;
  isPureMusic?: boolean;
};

type JsonValue = Record<string, unknown>;

export class MusicApiError extends Error {
  status: number;
  resetAt?: number;

  constructor(message: string, status: number, resetAt?: number) {
    super(message);
    this.name = 'MusicApiError';
    this.status = status;
    this.resetAt = resetAt;
  }
}

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: {
      Accept: 'application/json',
      ...(init?.headers ?? {}),
    },
  });

  const payload = (await response.json()) as JsonValue;
  if (!response.ok) {
    const resetAt = typeof payload.resetAt === 'number' ? payload.resetAt : undefined;
    throw new MusicApiError(
      typeof payload.error === 'string' ? payload.error : `request failed: ${response.status}`,
      response.status,
      resetAt,
    );
  }
  return payload as T;
}

/**
 * API surface for the redesigned player. Phase 1 only establishes the typed
 * contract; the audio and discover views are wired in later phases.
 */
export function createMusicApi(apiBase: string) {
  const base = apiBase.replace(/\/+$/, '');

  return {
    async playlist(): Promise<MusicTrack[]> {
      const payload = await fetchJson<PlaylistPayload>(`${base}/music/playlist`);
      return Array.isArray(payload.tracks) ? payload.tracks : [];
    },

    async loadMore(query: string, page: number, count = 12, signal?: AbortSignal): Promise<MusicTrack[]> {
      const seed = query.trim() || '热歌';
      const params = new URLSearchParams({
        q: seed,
        source: 'all',
        count: String(count),
        page: String(Math.max(1, page)),
      });
      const payload = await fetchJson<SearchPayload>(`${base}/music/search?${params.toString()}`, { signal });
      return Array.isArray(payload.tracks) ? payload.tracks : [];
    },

    async lyric(track: MusicTrack, duration?: number, signal?: AbortSignal): Promise<LyricPayload> {
      const params = new URLSearchParams({
        id: track.lyricId || track.id,
        source: track.source || 'netease',
        title: track.name,
        artist: track.artist,
        format: 'json',
      });
      if (duration && Number.isFinite(duration)) params.set('duration', String(duration));
      return fetchJson<LyricPayload>(`${base}/music/lyric?${params.toString()}`, { signal });
    },

    streamUrl(track: MusicTrack): string {
      if (track.urlId && /^(https?:)?\/\//.test(track.urlId)) return track.urlId;
      if (track.urlId && track.urlId.startsWith('/')) return track.urlId;
      return `${base}/music/stream?id=${encodeURIComponent(track.id)}&source=${encodeURIComponent(track.source || 'netease')}&quality=320`;
    },
  };
}

export type MusicApi = ReturnType<typeof createMusicApi>;
