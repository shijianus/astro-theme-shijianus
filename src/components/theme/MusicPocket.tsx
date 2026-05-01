import React, { startTransition, useEffect, useRef, useState } from 'react';
import { Pause, Play, Search, Shuffle, SkipBack, SkipForward, X } from 'lucide-react';

type MusicTrack = {
  id: string;
  name: string;
  artist: string;
  album: string;
  source: string;
  picId?: string;
  lyricId?: string;
};

type Props = {
  apiBase: string;
};

const STORAGE_KEY = 'shijianus-radio-state';
const SOURCES = [
  { value: 'netease', label: '网易云' },
  { value: 'kuwo', label: '酷我' },
];

function getDeviceId() {
  try {
    const key = 'shijianus-device-id';
    const saved = window.localStorage.getItem(key);
    if (saved) return saved;
    const created = typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `device-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    window.localStorage.setItem(key, created);
    return created;
  } catch {
    return `device-${Date.now()}`;
  }
}

async function fetchJson<T>(url: string) {
  const response = await fetch(url, {
    headers: {
      Accept: 'application/json',
      'X-Shijianus-Device-Id': getDeviceId(),
    },
  });
  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload?.error || `request failed: ${response.status}`);
  }
  return payload as T;
}

export function MusicPocket({ apiBase }: Props) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [source, setSource] = useState('netease');
  const [results, setResults] = useState<MusicTrack[]>([]);
  const [queue, setQueue] = useState<MusicTrack[]>([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [lyric, setLyric] = useState('');
  const [error, setError] = useState('');

  const currentTrack = currentIndex >= 0 ? queue[currentIndex] ?? null : null;

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as {
        queue?: MusicTrack[];
        currentIndex?: number;
        currentTime?: number;
        source?: string;
      };
      if (Array.isArray(parsed.queue)) setQueue(parsed.queue);
      if (typeof parsed.currentIndex === 'number') setCurrentIndex(parsed.currentIndex);
      if (typeof parsed.source === 'string') setSource(parsed.source);
      if (audioRef.current && typeof parsed.currentTime === 'number') {
        audioRef.current.currentTime = parsed.currentTime;
      }
    } catch {}
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          queue,
          currentIndex,
          currentTime: audioRef.current?.currentTime ?? 0,
          source,
        }),
      );
    } catch {}
  }, [queue, currentIndex, source]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentTrack) return;
    audio.src = `${apiBase}/music/stream?id=${encodeURIComponent(currentTrack.id)}&source=${encodeURIComponent(currentTrack.source)}&quality=320`;
    if (!isPlaying) return;
    void audio.play().catch(() => setIsPlaying(false));
  }, [apiBase, currentTrack, isPlaying]);

  useEffect(() => {
    if (!currentTrack?.lyricId && !currentTrack?.id) {
      setLyric('');
      return;
    }

    let active = true;
    setLyric('正在同步歌词...');

    void fetchJson<{ lyric?: string }>(
      `${apiBase}/music/lyric?id=${encodeURIComponent(currentTrack.lyricId || currentTrack.id)}&source=${encodeURIComponent(currentTrack.source)}`,
    )
      .then((payload) => {
        if (!active) return;
        const nextLyric = payload.lyric?.trim() || '当前曲目暂时没有可用歌词。';
        startTransition(() => setLyric(nextLyric));
      })
      .catch(() => {
        if (!active) return;
        setLyric('当前曲目暂时没有可用歌词。');
      });

    return () => {
      active = false;
    };
  }, [apiBase, currentTrack]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onEnded = () => {
      setCurrentIndex((value) => {
        const nextIndex = value + 1;
        if (nextIndex >= queue.length) {
          setIsPlaying(false);
          return value;
        }
        return nextIndex;
      });
    };

    const onPause = () => setIsPlaying(false);
    const onPlay = () => setIsPlaying(true);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('pause', onPause);
    audio.addEventListener('play', onPlay);

    return () => {
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('pause', onPause);
      audio.removeEventListener('play', onPlay);
    };
  }, [queue.length]);

  const playAt = (index: number, nextQueue?: MusicTrack[]) => {
    const targetQueue = nextQueue ?? queue;
    if (!targetQueue[index]) return;
    if (nextQueue) setQueue(nextQueue);
    setCurrentIndex(index);
    setIsPlaying(true);
  };

  const fetchRandom = async () => {
    setLoading(true);
    setError('');
    try {
      const payload = await fetchJson<{ tracks: MusicTrack[] }>(`${apiBase}/music/random?count=6`);
      const nextQueue = payload.tracks || [];
      startTransition(() => setResults(nextQueue));
      if (nextQueue.length > 0) playAt(0, nextQueue);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : '随机播放失败');
    } finally {
      setLoading(false);
    }
  };

  const searchMusic = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setError('');
    try {
      const payload = await fetchJson<{ tracks: MusicTrack[] }>(
        `${apiBase}/music/search?q=${encodeURIComponent(query.trim())}&source=${encodeURIComponent(source)}&count=8&page=1`,
      );
      startTransition(() => setResults(payload.tracks || []));
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : '搜索失败');
    } finally {
      setLoading(false);
    }
  };

  const togglePlayback = async () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (!currentTrack && results[0]) {
      playAt(0, results);
      return;
    }
    if (audio.paused) {
      await audio.play().catch(() => setIsPlaying(false));
    } else {
      audio.pause();
    }
  };

  return (
    <div className={`shijianus-music-pocket ${open ? 'is-open' : ''} ${isPlaying ? 'is-playing' : ''}`}>
      <audio ref={audioRef} preload="none" />
      <button
        type="button"
        className="shijianus-music-pocket__toggle"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-label={open ? '关闭背景音乐面板' : '打开背景音乐面板'}
      >
        <span className="shijianus-music-pocket__toggle-disc" aria-hidden="true">
          <span className="shijianus-music-pocket__toggle-groove" />
          <span className="shijianus-music-pocket__toggle-core" />
          <span className="shijianus-music-pocket__toggle-shine" />
        </span>
        <span className="shijianus-music-pocket__toggle-copy">
          <strong>{currentTrack ? currentTrack.name : 'shijianus radio'}</strong>
          <small>{currentTrack ? `${currentTrack.artist} · ${currentTrack.album}` : '随机播放 / 点歌'}</small>
        </span>
      </button>

      {open && (
        <div className="shijianus-music-pocket__panel">
          <div className="shijianus-music-pocket__panel-head">
            <div>
              <strong>shijianus radio</strong>
              <small>点歌 / 随机 / 后台播放</small>
            </div>
            <button type="button" onClick={() => setOpen(false)} aria-label="关闭音乐面板">
              <X aria-hidden="true" />
            </button>
          </div>

          <div className="shijianus-music-pocket__search">
            <select value={source} onChange={(event) => setSource(event.target.value)} aria-label="切换曲库">
              {SOURCES.map((item) => (
                <option key={item.value} value={item.value}>{item.label}</option>
              ))}
            </select>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') void searchMusic();
              }}
              placeholder="输入歌名或歌手"
            />
            <button type="button" onClick={() => void searchMusic()} aria-label="搜索歌曲">
              <Search aria-hidden="true" />
            </button>
            <button type="button" onClick={() => void fetchRandom()} aria-label="随机播放">
              <Shuffle aria-hidden="true" />
            </button>
          </div>

          <div className="shijianus-music-pocket__player">
            <div className="shijianus-music-pocket__now">
              <strong>{currentTrack?.name || '等待播放'}</strong>
              <small>{currentTrack ? `${currentTrack.artist} · ${currentTrack.source}` : '点击随机播放或输入歌名'}</small>
            </div>
            <div className="shijianus-music-pocket__controls">
              <button
                type="button"
                onClick={() => setCurrentIndex((value) => Math.max(0, value - 1))}
                disabled={currentIndex <= 0}
                aria-label="上一首"
              >
                <SkipBack aria-hidden="true" />
              </button>
              <button type="button" onClick={() => void togglePlayback()} aria-label={isPlaying ? '暂停' : '播放'}>
                {isPlaying ? <Pause aria-hidden="true" /> : <Play aria-hidden="true" />}
              </button>
              <button
                type="button"
                onClick={() => setCurrentIndex((value) => Math.min(queue.length - 1, value + 1))}
                disabled={currentIndex < 0 || currentIndex >= queue.length - 1}
                aria-label="下一首"
              >
                <SkipForward aria-hidden="true" />
              </button>
            </div>
          </div>

          <div className="shijianus-music-pocket__lyric">
            <span>歌词速览</span>
            <p>{lyric || '播放后会自动同步歌词摘要。'}</p>
          </div>

          {error && <p className="shijianus-music-pocket__error">{error}</p>}
          {loading && <p className="shijianus-music-pocket__status">正在请求免费曲库...</p>}

          <div className="shijianus-music-pocket__list">
            {(results.length > 0 ? results : queue).map((track, index) => {
              const isActive = currentTrack?.id === track.id;
              return (
                <button
                  key={`${track.source}-${track.id}-${index}`}
                  type="button"
                  className={`shijianus-music-pocket__item ${isActive ? 'is-active' : ''}`}
                  onClick={() => playAt(index, results.length > 0 ? results : queue)}
                >
                  <span>{String(index + 1).padStart(2, '0')}</span>
                  <div>
                    <strong>{track.name}</strong>
                    <small>{track.artist}</small>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
