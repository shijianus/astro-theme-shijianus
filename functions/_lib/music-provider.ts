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
    lyricId: '863046037',
    localPath: '/media/audio/WayBackHome.flac',
    lrc: `[00:00.00] 作词 : 李智慧/JQ
[00:00.09] 作曲 : SHAUN
[00:00.18] 编曲 : SHAUN
[00:00.28]<0.28,0.68>멈춘 <0.96,0.62>시간 <1.58,0.72>속
[00:02.36]<2.36,0.60>잠든 <2.96,0.52>너를 <3.48,0.92>찾아가
[00:05.17]<5.17,0.60>아무리 <5.77,0.85>막아도
[00:06.93]<6.93,0.70>결국 <7.63,0.60>너의 <8.23,0.95>곁인 걸
[00:09.60]<9.60,0.50>길고 <10.10,0.50>긴 <10.60,0.80>여행을 <11.40,0.88>끝내
[00:12.34]<12.34,0.60>이젠 <12.94,1.25>돌아가
[00:14.80]<14.80,0.80>너라는 <15.60,0.85>집으로
[00:16.50]<16.50,0.60>지금 <17.10,0.75>다시
[00:17.97]<17.97,0.60>way <18.57,0.60>back <19.17,1.80>home
[00:39.33]아무리 힘껏 닫아도
[00:41.75]다시 열린 서랍 같아
[00:44.36]하늘로 높이 날린 넌
[00:46.12]자꾸 내게 되돌아와
[00:49.02]힘들게 삼킨 이별도
[00:51.40]다 그대로인 걸
[00:53.48]oh oh oh
[00:57.46]수없이 떠난 길 위에서
[00:59.94]난 너를 발견하고
[01:02.39]비우려 했던 맘은 또
[01:04.62]이렇게 너로 차올라
[01:07.06]발걸음의 끝에
[01:09.14]늘 니가 부딪혀
[01:11.58]그만
[01:14.16]그만
[01:17.05]멈춘 시간 속
[01:18.82]잠든 너를 찾아가
[01:21.24]아무리 막아도
[01:23.64]결국 너의 곁인 걸
[01:25.70]길고 긴 여행을 끝내
[01:29.15]이젠 돌아가
[01:31.09]너라는 집으로
[01:33.29]지금 다시
[01:34.86]way back home
[01:55.40]조용히 잠든 방을 열어
[01:57.73]기억을 꺼내 들어
[02:00.07]부서진 시간 위에서
[02:02.18]선명히 너는 떠올라
[02:04.33]길 잃은 맘 속에
[02:07.20]널 가둔 채 살아
[02:09.24]그만
[02:11.67]그만
[02:14.72]멈춘 시간 속
[02:16.41]잠든 너를 찾아가
[02:19.08]아무리 막아도
[02:21.12]결국 너의 곁인 걸
[02:23.67]길고 긴 여행을 끝내
[02:26.44]이젠 돌아가
[02:28.37]너라는 집으로
[02:31.16]지금 다시
[02:32.36]way back home
[02:34.72]세상을 뒤집어
[02:36.86]찾으려 해
[02:39.05]오직 너로 완결된
[02:41.19]이야기를
[02:44.09]모든 걸 잃어도
[02:49.04]난 너 하나면 돼
[03:03.58]빛이 다 꺼진 여기
[03:05.26]나를 안아줘
[03:12.14]눈을 감으면
[03:14.27]소리 없이 밀려와
[03:16.50]이 마음 그 위로
[03:18.99]넌 또 한 겹 쌓여가
[03:21.51]내겐 그 누구도 아닌
[03:24.49]니가 필요해
[03:26.61]돌아와 내 곁에
[03:28.74]그날까지
[03:30.15]I’m not done`,
  },
  {
    id: 'local-kanojo',
    name: '彼女は旅に出る',
    artist: '三月のパンタシア',
    album: 'ガールズブルー・ハッピーエンド',
    source: 'local',
    picId: 'kanojo_wa_tabi_ni_deru',
    coverUrl: '/media/audio/covers/kanojo_wa_tabi_ni_deru.jpg',
    lyricId: '509106775',
    localPath: '/media/audio/彼女は旅に出る.mp3',
    lrc: `[00:00.00] 作词 : 鎖那
[00:01.00] 作曲 : 鎖那
[00:02.00] 编曲 : Misumi
[00:15.11]白昼夢 繋いでいて
[00:18.83]優しいの 冷たいの
[00:22.57]最終章 詰め込んでね
[00:26.37]どこへいこう どこへいこう
[00:30.02]あ、あ、あたしの黒猫はしゃべらないままだな
[00:37.55]ママホウキの乗り方も教えてくれなかった
[00:45.11]飛び出していった きみは帰らない
[00:47.50]重ねた手と手 掛け違えたボタンも
[00:52.53]汚いくらいに 思い出になるよ
[00:55.87]飽きちゃったラムネ頬張ってみたけど
[00:59.20]バイバイ
[01:32.04]満天の宇宙(ソラ) 昇っていくきみの
[01:35.46]願いは叶ったの？
[01:38.78]掴み損ねた泡になるみたいに
[01:42.87]まだ飛べないままでいるんだ
[01:46.44]Take me with you！
[01:53.96]Take me with you！
[02:01.85]白昼夢 繋いでいて
[02:05.89]優しいの 冷たいの
[02:09.38]最終章 詰め込んでね
[02:13.38]どこへいこう どこへいこう
[02:16.77]あ、あ、あたしの黒猫は喋らないままだな
[02:24.38]パパ明日は晴れるかな？待つのはもうやめたの
[02:33.67]追いかけていった もうね戻れない
[02:36.22]離れた手と手 すり切れた心にも
[02:41.26]神様もきっと知らない涙 星屑のシャワー
[02:46.22]さよならした バイバイ！`,
  },
  {
    id: 'local-irony',
    name: 'アイロニ (Irony)',
    artist: 'すこっぷ / 初音ミク',
    album: 'Irony Collection',
    source: 'local',
    picId: 'irony_scop',
    coverUrl: '/media/audio/covers/irony_scop.jpg',
    lyricId: '31421442',
    localPath: '/media/audio/アイロニ.mp3',
    lrc: `[00:00.00] 作词 : すこっぷ
[00:00.37] 作曲 : すこっぷ
[00:00.75]少し歩き疲れたんだ
[00:03.34]少し歩き疲れたんだ
[00:06.05]月並みな表現だけど
[00:08.23]人生とかいう長い道を
[00:11.44]少し休みたいんだ
[00:13.94]少し休みたいんだけど
[00:16.81]時間は刻一刻残酷と
[00:19.67]私を 引っぱっていくんだ
[00:38.18]うまくいきそうなんだけど
[00:40.76]うまくいかないことばかりで
[00:43.39]迂闊にも泣いてしまいそうになる
[00:46.09]情けない本当にな
[00:48.93]惨めな気持ちなんか
[00:51.19]嫌というほど味わってきたし
[00:54.13]とっくに悔しさなんてものは
[00:56.84]捨ててきたはずなのに
[00:59.72]絶望抱くほど
[01:01.01]悪いわけじゃないけど
[01:02.39]欲しいものは
[01:03.19]いつも少し手には届かない
[01:04.91]そんな半端だとねなんか
[01:07.51]期待してしまうから
[01:11.46]それならもういっそのこと
[01:15.00]ドン底まで突き落としてよ
[01:20.84]答えなんて言われたって
[01:23.47]人によってすり替わってって
[01:26.04]だから絶対なんて絶対
[01:28.50]信じらんないよねぇ
[01:31.50]苦しみって誰にもあるって
[01:33.71]そんなのわかってるから何だって
[01:36.76]なら笑って済ませばいいの？
[01:39.16]もうわかんないよバカ！
[01:52.83]散々言われてきたくせに
[01:55.53]なんだまんざらでもないんだ
[01:58.14]簡単に考えたら楽なことも
[02:01.06]難関に考えてたんだ
[02:03.48]段々と色々めんどくなってもう
[02:06.38]淡々と終わらせちゃおうか
[02:08.88]「病んだ？」とかもう嫌になったから
[02:11.56]やんわりと終わればもういいじゃんか
[02:14.42]夢だとか希望とか
[02:15.69]生きてる意味とか
[02:17.06]別にそんなものはさして
[02:18.21]必要ないから
[02:19.55]具体的でわかりやすい
[02:22.24]機会をください
[02:26.24]泣き場所探すうちに
[02:29.88]もう泣き疲れちゃったよ
[02:35.31]きれいごとって嫌いだって
[02:38.11]期待しちゃっても形になんなくて
[02:40.74]「星が僕ら見守って」って
[02:43.22]夜しかいないじゃん　ねぇ
[02:46.08]君のその優しいとこ
[02:48.77]不覚にも求めちゃうから
[02:51.41]この心やらかいとこ
[02:53.90]もう触んないで　ヤダ！
[03:17.94]もうほっといて
[03:20.69]もう置いてって
[03:23.15]汚れきったこの道は
[03:25.91]もう変わんないよ嗚呼
[03:30.19]疲れちゃって弱気になって
[03:32.78]逃げ出したって無駄なんだって
[03:35.35]だから内面耳塞いで
[03:37.80]もう最低だって泣いて
[03:40.61]人生って何なのって
[03:43.40]わかんなくても生きてるだけで
[03:46.24]幸せって思えばいいの？
[03:48.50]もうわかんないよバカ！
[03:57.11]終わり`,
  },
];

function signature() {
  return `${Math.random().toString(36).slice(2)}${Math.random().toString(36).slice(2)}`;
}

function providerBase(env: AppEnv) {
  return env.MUSIC_PROVIDER_API_BASE || 'https://music-api.gdstudio.xyz/api.php';
}

export function normalizeTrack(source: string, payload: Record<string, unknown>): MusicTrack {
  const id = String(payload.id || payload.url_id || '');
  const pic = String(
    payload.pic_id ||
    payload.pic ||
    payload.picUrl ||
    (payload.al as any)?.picUrl ||
    (payload.album as any)?.picUrl ||
    (payload.album as any)?.cover ||
    ''
  );
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
    album: typeof payload.album === 'string'
      ? payload.album
      : typeof payload.album === 'object' && payload.album !== null
        ? String((payload.album as { name?: string; title?: string }).name || (payload.album as { name?: string; title?: string }).title || '')
        : (typeof (payload.al as any)?.name === 'string' ? (payload.al as any).name : ''),
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

export type LyricSyncType = 'word' | 'line';

export interface LyricWord {
  text: string;
  start: number;     // 毫秒
  startSec: number;  // 秒
  end: number;       // 毫秒
  endSec: number;    // 秒
  duration: number;  // 毫秒
}

export interface LyricLine {
  time: number;       // 毫秒
  timeSec: number;    // 秒
  duration?: number;  // 毫秒
  text: string;
  words?: LyricWord[];
}

export interface HighPrecisionLyricPayload {
  ok: boolean;
  id: string;
  source: string;
  syncType: LyricSyncType;
  offset: number;     // 毫秒
  lines: LyricLine[];
  lineCount: number;
  rawLyric: string;
  isPureMusic?: boolean;
}

export function isMetadataLine(text: string): boolean {
  if (!text) return true;
  const trimmed = text.trim();
  if (/^(作词|作曲|编曲|词|曲|制作|制作人|监制|录音|混音|母带|吉他|贝斯|鼓|和声|弦乐|企划|统筹|OP|SP|演唱|原唱|歌手|专辑|发行|出品|Written|Composed|Arranged|Produced|Lyrics|Music|Vocal|Singer)\s*[:：]/i.test(trimmed)) {
    return true;
  }
  if (/^[^-–—]+[-–—][^-–—]+$/.test(trimmed) && trimmed.length < 50) {
    return true;
  }
  return false;
}

export function parseHighPrecisionLyrics(raw: string): {
  syncType: LyricSyncType;
  offset: number;
  lines: LyricLine[];
} {
  if (!raw || !raw.trim()) {
    return { syncType: 'line', offset: 0, lines: [] };
  }

  // 1. 提取全局偏移量 [offset: +/- ms]
  let offsetMs = 0;
  const offsetMatch = raw.match(/\[offset:\s*([+-]?\d+)\]/i);
  if (offsetMatch) {
    offsetMs = parseInt(offsetMatch[1], 10) || 0;
  }

  // 2. 检测是否为 XML 包装的 QRC 格式
  let cleanInput = raw;
  const qrcXmlMatch = raw.match(/<Lyric_1[^>]*LyricContent="([^"]+)"/i);
  if (qrcXmlMatch) {
    cleanInput = qrcXmlMatch[1];
  }

  const rawLines = cleanInput.split('\n');
  const parsedLines: LyricLine[] = [];
  let hasWordTimestamps = false;

  for (const rawLine of rawLines) {
    const line = rawLine.trim();
    if (!line) continue;

    // 过滤元数据标签 [ti:], [ar:], [al:], [by:], [offset:] 等
    if (/^\[(ti|ar|al|by|offset|kana|re|ve|hash|sign|qq|total):/i.test(line)) {
      continue;
    }

    // 2.0 网易云 / smart-lyric JSON 行格式
    if (line.startsWith('{') && line.endsWith('}')) {
      try {
        const json = JSON.parse(line);
        if (Array.isArray(json.c)) {
          let lineText = '';
          const words: LyricWord[] = [];
          let hasWordInfo = false;
          const lineBaseTime = typeof json.t === 'number' ? json.t : 0;

          for (const item of json.c) {
            const tx = item.tx || '';
            lineText += tx;
            if (typeof item.t === 'number' && typeof item.d === 'number') {
              hasWordInfo = true;
              const wStart = item.t + offsetMs;
              const wEnd = wStart + item.d;
              words.push({
                text: tx,
                start: Math.max(0, wStart),
                startSec: parseFloat((Math.max(0, wStart) / 1000).toFixed(3)),
                end: Math.max(0, wEnd),
                endSec: parseFloat((Math.max(0, wEnd) / 1000).toFixed(3)),
                duration: Math.max(0, item.d),
              });
            }
          }

          const cleanText = lineText.trim();
          if (!cleanText) continue;
          if (/^(作词|作曲|编曲|词|曲|制作|制作人|监制|录音|混音|母带|吉他|贝斯|鼓|和声|弦乐|企划|统筹|OP|SP|Written by|Composed by|Arranged by|Produced by|Lyrics by|Music by)\s*[:：]/i.test(cleanText)) {
            continue;
          }

          if (hasWordInfo && words.length > 0) hasWordTimestamps = true;
          const lineTime = words.length > 0 ? words[0].start : (lineBaseTime + offsetMs);
          const lineDur = words.length > 0 ? (words[words.length - 1].end - lineTime) : undefined;

          parsedLines.push({
            time: Math.max(0, lineTime),
            timeSec: parseFloat((Math.max(0, lineTime) / 1000).toFixed(3)),
            duration: lineDur,
            text: cleanText,
            words: words.length > 0 ? words : undefined,
          });
          continue;
        }
      } catch {}
    }

    // 2.1 匹配网易云 YRC 格式：[lineStart,lineDur](wordStart,wordDur,0)word...
    const yrcLineMatch = line.match(/^\[(\d+),(\d+)\](.*)$/);

    if (yrcLineMatch) {
      const lineStartMs = parseInt(yrcLineMatch[1], 10) + offsetMs;
      const lineDurMs = parseInt(yrcLineMatch[2], 10);
      const content = yrcLineMatch[3];

      const words: LyricWord[] = [];
      const wordRegex = /\((\d+),(\d+)(?:,\d+)?\)([^(]+)/g;
      let wMatch;
      let lineText = '';

      while ((wMatch = wordRegex.exec(content)) !== null) {
        let wStart = parseInt(wMatch[1], 10);
        const wDur = parseInt(wMatch[2], 10);
        const wText = wMatch[3];

        if (wStart < lineStartMs && wStart < 60000) {
          wStart = lineStartMs + wStart;
        } else {
          wStart = wStart + offsetMs;
        }

        const wEnd = wStart + wDur;
        words.push({
          text: wText,
          start: Math.max(0, wStart),
          startSec: parseFloat((Math.max(0, wStart) / 1000).toFixed(3)),
          end: Math.max(0, wEnd),
          endSec: parseFloat((Math.max(0, wEnd) / 1000).toFixed(3)),
          duration: Math.max(0, wDur),
        });
        lineText += wText;
      }

      if (words.length > 0) {
        hasWordTimestamps = true;
        parsedLines.push({
          time: Math.max(0, lineStartMs),
          timeSec: parseFloat((Math.max(0, lineStartMs) / 1000).toFixed(3)),
          duration: lineDurMs,
          text: lineText.trim() || content.replace(/\([^)]+\)/g, '').trim(),
          words,
        });
        continue;
      }
    }

    // 2.2 匹配标准行级时间戳 [mm:ss.xx] 或 [mm:ss.xxx]
    const standardTimeRegex = /\[(\d{1,2}):(\d{2})(?:[.:](\d{1,3}))?\]/g;
    const timeMatchesMs: number[] = [];
    let match;

    while ((match = standardTimeRegex.exec(line)) !== null) {
      const minutes = parseInt(match[1], 10);
      const seconds = parseInt(match[2], 10);
      const ms = match[3] ? parseInt(match[3].padEnd(3, '0').slice(0, 3), 10) : 0;
      timeMatchesMs.push(minutes * 60000 + seconds * 1000 + ms + offsetMs);
    }

    const cleanLineBody = line.replace(standardTimeRegex, '').trim();
    if (!cleanLineBody && timeMatchesMs.length > 0) continue;

    // 检查行内是否有逐字标签：
    // 形式一：<0.28,0.68>word 或 <280,680>word
    const angleWordRegex = /<([\d.]+)(?:,\s*([\d.]+))?>([^<]+)/g;
    // 形式二：(1234,567)word
    const parenWordRegex = /\((\d+),(\d+)(?:,\d+)?\)([^(]+)/g;

    let lineWords: LyricWord[] = [];
    let angleMatch;
    while ((angleMatch = angleWordRegex.exec(cleanLineBody)) !== null) {
      const rawStart = parseFloat(angleMatch[1]);
      const rawDur = angleMatch[2] ? parseFloat(angleMatch[2]) : 0.3;
      const wText = angleMatch[3];

      const isSeconds = String(angleMatch[1]).includes('.') || rawStart < 100;
      const startMs = Math.round((isSeconds ? rawStart * 1000 : rawStart) + offsetMs);
      const durMs = Math.round(isSeconds ? rawDur * 1000 : rawDur);

      lineWords.push({
        text: wText,
        start: Math.max(0, startMs),
        startSec: parseFloat((Math.max(0, startMs) / 1000).toFixed(3)),
        end: Math.max(0, startMs + durMs),
        endSec: parseFloat((Math.max(0, startMs + durMs) / 1000).toFixed(3)),
        duration: Math.max(0, durMs),
      });
    }

    if (lineWords.length === 0) {
      let pMatch;
      while ((pMatch = parenWordRegex.exec(cleanLineBody)) !== null) {
        const wStart = parseInt(pMatch[1], 10) + offsetMs;
        const wDur = parseInt(pMatch[2], 10);
        const wText = pMatch[3];
        lineWords.push({
          text: wText,
          start: Math.max(0, wStart),
          startSec: parseFloat((Math.max(0, wStart) / 1000).toFixed(3)),
          end: Math.max(0, wStart + wDur),
          endSec: parseFloat((Math.max(0, wStart + wDur) / 1000).toFixed(3)),
          duration: Math.max(0, wDur),
        });
      }
    }

    const plainText = cleanLineBody
      .replace(/<[^>]+>/g, '')
      .replace(/\([^)]+\)/g, '')
      .trim();

    if (!plainText) continue;
    if (/^(作词|作曲|编曲|词|曲|制作|制作人|监制|录音|混音|母带|吉他|贝斯|鼓|和声|弦乐|企划|统筹|OP|SP|Written by|Composed by|Arranged by|Produced by|Lyrics by|Music by)\s*[:：]/i.test(plainText)) {
      continue;
    }

    if (lineWords.length > 0) {
      hasWordTimestamps = true;
    }

    if (timeMatchesMs.length > 0) {
      for (const t of timeMatchesMs) {
        parsedLines.push({
          time: Math.max(0, t),
          timeSec: parseFloat((Math.max(0, t) / 1000).toFixed(3)),
          text: plainText,
          words: lineWords.length > 0 ? lineWords : undefined,
        });
      }
    } else if (lineWords.length > 0) {
      const lineStart = lineWords[0].start;
      parsedLines.push({
        time: lineStart,
        timeSec: lineWords[0].startSec,
        duration: lineWords[lineWords.length - 1].end - lineStart,
        text: plainText,
        words: lineWords,
      });
    }
  }

  parsedLines.sort((a, b) => a.time - b.time);

  // 为没有设定 duration 的行计算合理行时长，若包含间奏保留间奏空间
  for (let i = 0; i < parsedLines.length; i++) {
    const cur = parsedLines[i];
    if (!cur.duration) {
      const next = parsedLines[i + 1];
      if (next) {
        const gap = next.time - cur.time;
        if (gap > 4500) {
          const naturalMs = Math.round(Math.min(gap - 2000, Math.max(2000, cur.text.length * 360)));
          cur.duration = naturalMs;
        } else {
          cur.duration = Math.max(300, gap);
        }
      } else {
        cur.duration = 4500;
      }
    }
    cur.durationSec = parseFloat((cur.duration / 1000).toFixed(3));
  }

  // 严格按规范：当且仅当音源有真实逐字标签时输出 word 模式；普通 LRC 降级为 line 模式，绝不伪造 words
  return {
    syncType: hasWordTimestamps ? 'word' : 'line',
    offset: offsetMs,
    lines: parsedLines,
  };
}

export function isValidLyric(raw: string): boolean {
  if (!raw || typeof raw !== 'string') return false;
  const trimmed = raw.trim();
  if (!trimmed) return false;
  if (/^\[00:00(?:\.00+)?\]\s*(暂无歌词|纯音乐，请欣赏|没有填词|纯音乐)/i.test(trimmed)) return false;
  const lines = trimmed.split('\n').filter((l) => l.trim() && !/^\[(ti|ar|al|by|offset|kana|re|ve|hash|sign|qq|total):/i.test(l.trim()));
  const validVocalLines = lines.filter((l) => {
    const textOnly = l.replace(/\[[^\]]+\]/g, '').replace(/<[^>]+>/g, '').replace(/\([^)]+\)/g, '').trim();
    if (!textOnly) return false;
    return !isMetadataLine(textOnly);
  });
  return validVocalLines.length > 0;
}

export function parseLrcLyrics(rawLrc: string): LyricLine[] {
  return parseHighPrecisionLyrics(rawLrc).lines;
}

export interface LyricFetchOptions {
  id?: string;
  source?: string;
  title?: string;
  artist?: string;
  q?: string;
  duration?: number;
}

export async function fetchHighPrecisionLyrics(
  env: AppEnv,
  target: string | LyricFetchOptions,
  legacySource?: string,
): Promise<HighPrecisionLyricPayload> {
  const options: LyricFetchOptions = typeof target === 'string' ? { id: target, source: legacySource || 'netease' } : target;
  const id = options.id || '';
  const source = options.source || 'netease';
  const title = options.title || '';
  const artist = options.artist || '';
  const q = options.q || '';
  const duration = options.duration;

  // 1. 本地歌曲查找本地精选音轨作为备用兜底模板 (fallback)
  const localMatch = CURATED_LOCAL_TRACKS.find(
    (t) => (id && (t.id === id || t.lyricId === id)) || (title && t.name.toLowerCase() === title.toLowerCase()),
  );

  // 2. 优先通过 CFSolara 官方全网高精歌词引擎微服务拉取 (/api/lyric)
  try {
    const params = new URLSearchParams();
    const effectiveId = id && id !== 'local' && !id.startsWith('local-') ? id : (localMatch?.lyricId || '');
    const effectiveSource = source === 'local' ? 'netease' : (source || 'netease');
    const effectiveTitle = title || localMatch?.name || '';
    const effectiveArtist = artist || localMatch?.artist || '';

    if (effectiveId) params.set('id', effectiveId);
    if (effectiveSource) params.set('source', effectiveSource);
    if (effectiveTitle) params.set('title', effectiveTitle);
    if (effectiveArtist) params.set('artist', effectiveArtist);
    if (q) params.set('q', q);
    if (duration) params.set('duration', String(duration));

    const cfsolaraUrl = `https://cfsolara-dho.pages.dev/api/lyric?${params.toString()}`;
    const resp = await fetch(cfsolaraUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        Referer: 'https://blog.epocanvas.com/',
      },
    });
    if (resp.ok) {
      const data = (await resp.json()) as any;
      if (data && data.ok && Array.isArray(data.lines) && data.lines.length > 0 && isValidLyric(data.rawLyric || data.lyric || '')) {
        return {
          ok: true,
          id: data.id || effectiveId || id,
          source: data.source || effectiveSource || source,
          syncType: data.syncType || 'line',
          offset: data.offset || 0,
          title: data.title || effectiveTitle || undefined,
          artist: data.artist || effectiveArtist || undefined,
          lines: data.lines,
          lineCount: data.lines.length,
          rawLyric: data.rawLyric || data.lyric || '',
          isPureMusic: Boolean(data.isPureMusic),
        };
      } else if (data && data.ok && typeof data.lyric === 'string' && isValidLyric(data.lyric)) {
        const { syncType, offset, lines } = parseHighPrecisionLyrics(data.lyric);
        return {
          ok: true,
          id: data.id || effectiveId || id,
          source: data.source || effectiveSource || source,
          syncType,
          offset,
          title: data.title || effectiveTitle || undefined,
          artist: data.artist || effectiveArtist || undefined,
          lines,
          lineCount: lines.length,
        };
      }
    }
  } catch (err) {
    console.warn('[CFSolara Lyric Fetch Warning]', err);
  }

  // 3. 次级兜底：网易云直连 YRC / LRC 尝试
  if (source === 'netease' && id) {
    try {
      const url = `https://music.163.com/api/song/lyric/v1?id=${encodeURIComponent(id)}&cp=false&tv=0&lv=0&rv=0&kv=0&yv=-1&ytv=0&yrv=0`;
      const resp = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          Referer: 'https://music.163.com/',
        },
      });
      if (resp.ok) {
        const json = (await resp.json()) as any;
        const rawLyric = json?.yrc?.lyric || json?.lrc?.lyric || '';
        if (rawLyric && isValidLyric(rawLyric)) {
          const { syncType, offset, lines } = parseHighPrecisionLyrics(rawLyric);
          return {
            ok: true,
            id,
            source,
            syncType,
            offset,
            lines,
            lineCount: lines.length,
            rawLyric,
          };
        }
      }
    } catch {}
  }

  // 4. 再次级兜底：LRCLIB 实时检索
  const searchQuery = (q || `${title} ${artist}`).trim();
  if (searchQuery) {
    try {
      let lrcUrl = '';
      if (title) {
        lrcUrl = `https://lrclib.net/api/get?track_name=${encodeURIComponent(title)}${artist ? `&artist_name=${encodeURIComponent(artist)}` : ''}`;
      } else {
        lrcUrl = `https://lrclib.net/api/search?q=${encodeURIComponent(searchQuery)}`;
      }
      const lrcResp = await fetch(lrcUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
      if (lrcResp.ok) {
        const lrcJson = (await lrcResp.json()) as any;
        const synced = Array.isArray(lrcJson) ? lrcJson.find((x: any) => x.syncedLyrics && isValidLyric(x.syncedLyrics))?.syncedLyrics : (isValidLyric(lrcJson?.syncedLyrics) ? lrcJson?.syncedLyrics : null);
        if (synced) {
          const { syncType, offset, lines } = parseHighPrecisionLyrics(synced);
          return {
            ok: true,
            id: id || searchQuery,
            source: 'lrclib',
            syncType,
            offset,
            lines,
            lineCount: lines.length,
            rawLyric: synced,
          };
        }
      }
    } catch {}
  }

  // 5. 再次级兜底：通用 Provider 回退
  let rawLyric = '';
  if (id) {
    try {
      const payload = await fetchProviderJson(env, {
        types: 'lyric',
        id,
        source,
        s: signature(),
      });

      if (payload && typeof payload === 'object') {
        rawLyric = typeof (payload as { lyric?: unknown }).lyric === 'string' ? (payload as { lyric: string }).lyric : '';
      }
    } catch {
      rawLyric = '';
    }
  }

  // 4. 若全网在线拉取失败，且命中本地精选音轨，则使用本地模板进行离线兜底
  if (!isValidLyric(rawLyric) && localMatch && localMatch.lrc) {
    rawLyric = localMatch.lrc;
  }

  const { syncType, offset, lines } = parseHighPrecisionLyrics(rawLyric);
  const isPure = lines.length === 0 || /纯音乐/i.test(rawLyric);
  return {
    ok: true,
    id: id || searchQuery,
    source,
    syncType,
    offset,
    lines,
    lineCount: lines.length,
    rawLyric,
    isPureMusic: isPure,
  };
}

export async function fetchMusicLyrics(env: AppEnv, id: string, source: string): Promise<string> {

  const result = await fetchHighPrecisionLyrics(env, id, source);
  return result.rawLyric;
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

