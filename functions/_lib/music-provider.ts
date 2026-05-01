import type { AppEnv } from './types';

export type MusicTrack = {
  id: string;
  name: string;
  artist: string;
  album: string;
  source: string;
  picId: string;
  lyricId: string;
};

const RANDOM_GENRES = ['流行', '摇滚', '古典音乐', '民谣', '电子', '爵士', '说唱', '乡村', '蓝调', 'R&B', '轻音乐'];
const RANDOM_SOURCES = ['netease', 'kuwo'];

function signature() {
  return `${Math.random().toString(36).slice(2)}${Math.random().toString(36).slice(2)}`;
}

function providerBase(env: AppEnv) {
  return env.MUSIC_PROVIDER_API_BASE || 'https://music-api.gdstudio.xyz/api.php';
}

function normalizeTrack(source: string, payload: Record<string, unknown>): MusicTrack {
  const artist = Array.isArray(payload.artist)
    ? payload.artist.join(' / ')
    : typeof payload.artist === 'string'
      ? payload.artist
      : Array.isArray(payload.ar)
        ? payload.ar.map((item) => (item && typeof item === 'object' ? String((item as { name?: string }).name || '') : '')).filter(Boolean).join(' / ')
        : '';

  return {
    id: String(payload.id || ''),
    name: String(payload.name || '未知曲目'),
    artist: artist || '未知艺术家',
    album: String(payload.album || ''),
    source: String(payload.source || source || 'netease'),
    picId: String(payload.pic_id || payload.pic || payload.cover || ''),
    lyricId: String(payload.lyric_id || payload.id || ''),
  };
}

async function fetchProviderJson(env: AppEnv, params: Record<string, string>) {
  const url = new URL(providerBase(env));
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });

  const response = await fetch(url.toString(), {
    headers: {
      Accept: 'application/json',
      'User-Agent': 'shijianus-radio',
    },
  });

  if (!response.ok) {
    throw new Error(`music provider failed: ${response.status}`);
  }

  return response.json() as Promise<unknown>;
}

export async function searchMusic(env: AppEnv, keyword: string, source: string, count: number, page: number) {
  const payload = await fetchProviderJson(env, {
    types: 'search',
    source,
    name: keyword,
    count: String(count),
    pages: String(page),
    s: signature(),
  });

  if (!Array.isArray(payload)) return [];
  return payload
    .filter((item): item is Record<string, unknown> => Boolean(item && typeof item === 'object'))
    .map((item) => normalizeTrack(source, item))
    .filter((item) => item.id);
}

export async function randomMusic(env: AppEnv, count: number) {
  let lastKeyword = '流行';
  let lastSource = env.MUSIC_DEFAULT_SOURCE || 'netease';
  let tracks: MusicTrack[] = [];

  for (let index = 0; index < 4; index += 1) {
    lastKeyword = RANDOM_GENRES[Math.floor(Math.random() * RANDOM_GENRES.length)] || '流行';
    lastSource = RANDOM_SOURCES[Math.floor(Math.random() * RANDOM_SOURCES.length)] || env.MUSIC_DEFAULT_SOURCE || 'netease';
    tracks = await searchMusic(env, lastKeyword, lastSource, count, 1);
    if (tracks.length > 0) break;
  }

  return {
    keyword: lastKeyword,
    source: lastSource,
    tracks,
  };
}

export async function resolveMusicStream(env: AppEnv, id: string, source: string, quality: string) {
  const payload = await fetchProviderJson(env, {
    types: 'url',
    id,
    source,
    br: quality,
    s: signature(),
  });

  if (!payload || typeof payload !== 'object') return '';
  return typeof (payload as { url?: unknown }).url === 'string' ? (payload as { url: string }).url : '';
}

export async function fetchMusicLyrics(env: AppEnv, id: string, source: string) {
  const payload = await fetchProviderJson(env, {
    types: 'lyric',
    id,
    source,
    s: signature(),
  });

  if (!payload || typeof payload !== 'object') return '';
  return typeof (payload as { lyric?: unknown }).lyric === 'string' ? (payload as { lyric: string }).lyric : '';
}
