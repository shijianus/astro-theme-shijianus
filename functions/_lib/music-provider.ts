import type { AppEnv } from './types';

export type MusicTrack = {
  id: string;
  name: string;
  artist: string;
  album: string;
  source: string;
  picId: string;
  coverUrl?: string;
  lyricId: string;
  urlId?: string;
};

const RANDOM_GENRES = ['流行', '摇滚', '古典音乐', '民谣', '电子', '爵士', '说唱', '乡村', '蓝调', 'R&B', '轻音乐'];
const RANDOM_SOURCES = ['netease', 'kuwo'];

const CURATED_LOCAL_TRACKS: (MusicTrack & { lrc: string; localPath: string })[] = [
  {
    id: 'local-way-back-home',
    name: 'Way Back Home',
    artist: 'SHAUN (숀)',
    album: 'Take',
    source: 'local',
    picId: 'way_back_home',
    coverUrl: '/media/audio/covers/way_back_home.jpg',
    lyricId: 'local-way-back-home',
    localPath: '/media/audio/WayBackHome.flac',
    lrc: `[00:00.00]SHAUN - Way Back Home
[00:08.50]멈춘 시간 속 잠든 너를 찾아가
[00:13.20]아무리 막아도 결국 너의 곁인 걸
[00:18.00]길고 긴 여행을 끝내 이젠 돌아가
[00:22.60]너라는 집으로 지금 다시 Way back home
[00:28.00]아무리 힘껏 닫아도 다시 열린 서랍 같아
[00:32.80]하늘로 높이 날린 넌 자꾸 내게 되돌아와
[00:37.50]힘들었던 시간만큼 간절했던 기억들
[00:42.20]헤매이다 마주친 너와 나의 사랑
[00:47.00]눈을 감으면 소리 없이 밀려와
[00:51.60]이 마음이 널 부르고 있어
[00:56.50]세상이 멈춰도 끝없이 달릴 텐데
[01:01.20]오직 한 사람 너의 곁으로
[01:06.00]멈춘 시간 속 잠든 너를 찾아가
[01:10.80]아무리 막아도 결국 너의 곁인 걸
[01:15.50]길고 긴 여행을 끝내 이젠 돌아가
[01:20.20]너라는 집으로 지금 다시 Way back home
[01:30.00]조용히 잠든 밤을 깨워 너의 곁으로
[01:35.00]수많은 별들 중에서도 너만을 향해
[01:40.00]아득한 길 끝에서 다시 만날 그날까지
[01:45.00]너라는 집으로 지금 다시 Way back home`,
  },
  {
    id: 'local-kanojo',
    name: '彼女は旅に出る',
    artist: '三月のパンタシア',
    album: 'ガールズブルー・ハッピーエンド',
    source: 'local',
    picId: 'kanojo_wa_tabi_ni_deru',
    coverUrl: '/media/audio/covers/kanojo_wa_tabi_ni_deru.jpg',
    lyricId: 'local-kanojo',
    localPath: '/media/audio/彼女は旅に出る.mp3',
    lrc: `[00:00.00]三月のパンタシア - 彼女は旅に出る
[00:12.50]ねえ　いつかの約束をまだ覚えてる？
[00:18.20]夕焼けの空に滲んだ夢の続き
[00:24.00]迷いながら歩いた街並み
[00:29.80]風がそっと背中を押してくれた
[00:36.50]彼女は旅に出る　新しい朝を探して
[00:43.00]遠く離れても　心はずっと繋がっているから
[00:50.00]さよならは言わないよ
[00:54.20]いつかまた笑い合える日まで
[01:01.00]光射す道の先へ　駆け出してゆく`,
  },
  {
    id: 'local-irony',
    name: 'アイロニ (Irony)',
    artist: 'すこっぷ / 初音ミク',
    album: 'Irony Collection',
    source: 'local',
    picId: 'irony_scop',
    coverUrl: '/media/audio/covers/irony_scop.jpg',
    lyricId: 'local-irony',
    localPath: '/media/audio/アイロニ.m4a',
    lrc: `[00:00.00]すこっぷ - アイロニ (Irony)
[00:14.00]少し歩き疲れたんだ
[00:18.00]少し息も白くなってきた
[00:22.00]時の流れは早くて
[00:25.50]置いていかれそうになるよ
[00:30.00]だけどもう少しだけ　前を向いて歩いてみる
[00:38.00]弱音ばかり吐いていたって
[00:42.00]明日はやってくるから
[00:46.00]下手くそな笑顔でも
[00:50.00]誰かの温もりに触れたくて
[00:55.00]少しずつ進んでいくんだ
[01:01.00]僕だけの小さな歩幅で`,
  },
];

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

  const targetSource = String(payload.source || source || 'netease');
  const coverUrl = pic.startsWith('http')
    ? pic
    : `/api/music/cover?id=${encodeURIComponent(id)}&picId=${encodeURIComponent(pic)}&source=${encodeURIComponent(targetSource)}`;

  return {
    id,
    name: String(payload.name || payload.title || '未知曲目'),
    artist: artist || '未知艺术家',
    album: String(payload.album || ''),
    source: targetSource,
    picId: pic,
    coverUrl,
    lyricId: String(payload.lyric_id || payload.id || id),
  };
}

async function fetchProviderJson(env: AppEnv, params: Record<string, string>) {
  const url = new URL(providerBase(env));
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });

  const headers: Record<string, string> = {
    Accept: 'application/json',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    Referer: 'https://music.gdstudio.xyz/',
  };

  // 安全接入：若在 .env / Cloudflare Pages 后台配置了 MUSIC_API_KEY，安全注入内部请求头，绝不暴露给客户端
  if (env.MUSIC_API_KEY) {
    headers['Authorization'] = `Bearer ${env.MUSIC_API_KEY}`;
    headers['X-API-Key'] = env.MUSIC_API_KEY;
  }

  const response = await fetch(url.toString(), { headers });

  if (!response.ok) {
    throw new Error(`music provider failed: ${response.status}`);
  }

  return response.json() as Promise<unknown>;
}

export async function searchMusic(env: AppEnv, keyword: string, source: string, count: number, page: number) {
  try {
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
  } catch (err) {
    // 优雅降级：若外部 API 暂时不可达，优先匹配本地精选歌曲
    const lower = keyword.toLowerCase();
    const matches = CURATED_LOCAL_TRACKS.filter(
      (track) => track.name.toLowerCase().includes(lower) || track.artist.toLowerCase().includes(lower)
    );
    return matches.map((t) => ({
      id: t.id,
      name: t.name,
      artist: t.artist,
      album: t.album,
      source: t.source,
      picId: t.picId,
      coverUrl: t.coverUrl,
      lyricId: t.lyricId,
      urlId: t.localPath,
    }));
  }
}

export async function searchMusicAggregated(env: AppEnv, keyword: string, countPerSource: number, page: number): Promise<MusicTrack[]> {
  const sources = ['netease', 'qq', 'kuwo'];
  const results = await Promise.allSettled(
    sources.map((s) => searchMusic(env, keyword, s, countPerSource, page))
  );

  const lists: MusicTrack[][] = results.map((r) => (r.status === 'fulfilled' ? r.value : []));

  // 本地精选优先匹配
  const lower = keyword.toLowerCase();
  const localMatches: MusicTrack[] = CURATED_LOCAL_TRACKS.filter(
    (track) => track.name.toLowerCase().includes(lower) || track.artist.toLowerCase().includes(lower)
  ).map((t) => ({
    id: t.id,
    name: t.name,
    artist: t.artist,
    album: t.album,
    source: t.source,
    picId: t.picId,
    coverUrl: t.coverUrl,
    lyricId: t.lyricId,
    urlId: t.localPath,
  }));

  const aggregated: MusicTrack[] = [...localMatches];
  const seenKeys = new Set(localMatches.map((t) => `${t.name.trim()}-${t.artist.trim()}`.toLowerCase()));
  const maxLen = Math.max(...lists.map((l) => l.length), 0);

  // 交替轮转组合各平台歌曲，实现三平台均衡展示
  for (let i = 0; i < maxLen; i++) {
    for (const list of lists) {
      if (list[i]) {
        const item = list[i];
        const key = `${item.name.trim()}-${item.artist.trim()}`.toLowerCase();
        if (!seenKeys.has(key)) {
          seenKeys.add(key);
          aggregated.push(item);
        }
      }
    }
  }

  return aggregated;
}

export async function getCuratedPlaylist(env: AppEnv): Promise<MusicTrack[]> {
  // 基础精选本地优质音轨
  const baseTracks: MusicTrack[] = CURATED_LOCAL_TRACKS.map((t) => ({
    id: t.id,
    name: t.name,
    artist: t.artist,
    album: t.album,
    source: t.source,
    picId: t.picId,
    coverUrl: t.coverUrl,
    lyricId: t.lyricId,
    urlId: t.localPath,
  }));

  // 如果配置了自定义歌单 MUSIC_PLAYLIST_ID，尝试安全拉取
  if (env.MUSIC_PLAYLIST_ID) {
    try {
      const source = env.MUSIC_DEFAULT_SOURCE || 'netease';
      const payload = await fetchProviderJson(env, {
        types: 'playlist',
        id: env.MUSIC_PLAYLIST_ID,
        source,
        s: signature(),
      });
      if (Array.isArray(payload) && payload.length > 0) {
        const netTracks = payload
          .filter((item): item is Record<string, unknown> => Boolean(item && typeof item === 'object'))
          .map((item) => normalizeTrack(source, item))
          .filter((item) => item.id);
        if (netTracks.length > 0) {
          return [...baseTracks, ...netTracks];
        }
      }
    } catch {
      // 忽略歌单抓取失败，回退到 baseTracks
    }
  }

  return baseTracks;
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

  if (tracks.length === 0) {
    tracks = await getCuratedPlaylist(env);
  }

  return {
    keyword: lastKeyword,
    source: lastSource,
    tracks,
  };
}

export async function resolveMusicStream(env: AppEnv, id: string, source: string, quality: string) {
  // 本地音频直接命中
  const localMatch = CURATED_LOCAL_TRACKS.find((t) => t.id === id);
  if (localMatch) {
    return localMatch.localPath;
  }

  try {
    const payload = await fetchProviderJson(env, {
      types: 'url',
      id,
      source,
      br: quality,
      s: signature(),
    });

    if (!payload || typeof payload !== 'object') return '';
    return typeof (payload as { url?: unknown }).url === 'string' ? (payload as { url: string }).url : '';
  } catch {
    return '';
  }
}

export function parseLrcLyrics(rawLrc: string): { time: number; text: string }[] {
  if (!rawLrc) return [];
  const lines = rawLrc.split('\n');
  const result: { time: number; text: string }[] = [];
  const timeRegex = /\[(\d{2}):(\d{2})(?:\.(\d{2,3}))?\]/g;

  for (const line of lines) {
    const text = line.replace(timeRegex, '').trim();
    if (!text) continue;

    timeRegex.lastIndex = 0;
    let match;
    while ((match = timeRegex.exec(line)) !== null) {
      const minutes = parseInt(match[1], 10);
      const seconds = parseInt(match[2], 10);
      const milliseconds = match[3] ? parseInt(match[3].padEnd(3, '0').slice(0, 3), 10) : 0;
      const time = minutes * 60 + seconds + milliseconds / 1000;
      result.push({ time, text });
    }
  }

  result.sort((a, b) => a.time - b.time);
  return result;
}

export async function fetchMusicLyrics(env: AppEnv, id: string, source: string) {
  // 本地歌曲直接返回高保真歌词
  const localMatch = CURATED_LOCAL_TRACKS.find((t) => t.id === id);
  if (localMatch) {
    return localMatch.lrc;
  }

  try {
    const payload = await fetchProviderJson(env, {
      types: 'lyric',
      id,
      source,
      s: signature(),
    });

    if (!payload || typeof payload !== 'object') return '';
    return typeof (payload as { lyric?: unknown }).lyric === 'string' ? (payload as { lyric: string }).lyric : '';
  } catch {
    return '';
  }
}

export async function resolveMusicPic(env: AppEnv, id: string, picId: string, source: string): Promise<string> {
  // 1. 本地精选音轨直接命中
  const localMatch = CURATED_LOCAL_TRACKS.find((t) => t.id === id || t.picId === picId);
  if (localMatch && localMatch.coverUrl) {
    return localMatch.coverUrl;
  }

  // 2. 如果 picId 自身是 http 链接直接返回
  if (picId.startsWith('http://') || picId.startsWith('https://')) {
    return picId;
  }

  // 3. 请求上游 API 解析 pic 地址
  const targetId = picId || id;
  if (!targetId) return '';

  try {
    const payload = await fetchProviderJson(env, {
      types: 'pic',
      id: targetId,
      source,
      s: signature(),
    });

    if (!payload || typeof payload !== 'object') return '';
    const url = typeof (payload as { url?: unknown }).url === 'string' ? (payload as { url: string }).url : '';
    return url;
  } catch {
    return '';
  }
}

