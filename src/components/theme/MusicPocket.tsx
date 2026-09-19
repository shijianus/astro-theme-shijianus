import React, { startTransition, useEffect, useRef, useState } from 'react';
import { convertText, type LocaleVariant } from '../../lib/client-locale';
import {
  Disc,
  ListMusic,
  MessageSquare,
  Music,
  Pause,
  Play,
  Plus,
  Repeat,
  Repeat1,
  Search,
  Shuffle,
  SkipBack,
  SkipForward,
  Sparkles,
  Trash2,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';

export type MusicTrack = {
  id: string;
  name: string;
  artist: string;
  album: string;
  source: string;
  picId?: string;
  coverUrl?: string;
  lyricId?: string;
  urlId?: string;
};

export type LyricLine = {
  time: number;
  text: string;
};

type Props = {
  apiBase: string;
};

const STORAGE_KEY = 'shijianus-radio-state';
const SOURCES = [
  { value: 'netease', label: '网易云' },
  { value: 'kuwo', label: '酷我' },
  { value: 'qq', label: 'QQ音乐' },
];

const QUICK_TAGS = ['流行热歌', '周杰伦', '陈奕迅', '治愈纯音', '经典老歌', 'ACG动漫', '轻音乐', '摇滚'];

function getDeviceId(): string {
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

function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '00:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

function parseLrc(raw: string): LyricLine[] {
  if (!raw) return [];
  const lines = raw.split('\n');
  const result: LyricLine[] = [];
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

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url, {
    headers: {
      Accept: 'application/json',
      'X-Shijianus-Device-Id': getDeviceId(),
    },
  });
  const payload = await response.json();
  if (!response.ok) {
    throw new Error((payload as any)?.error || `request failed: ${response.status}`);
  }
  return payload as T;
}

export function MusicPocket({ apiBase }: Props) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const lyricContainerRef = useRef<HTMLDivElement>(null);

  const [localeVariant, setLocaleVariant] = useState<LocaleVariant>('zh-CN');

  useEffect(() => {
    const readCurrentLocale = (): LocaleVariant => {
      if (typeof window === 'undefined') return 'zh-CN';
      const stored = window.localStorage.getItem('shijianus-locale-variant');
      if (stored === 'en' || stored === 'zh-Hant' || stored === 'fr' || stored === 'es' || stored === 'de') {
        return stored;
      }
      const docVariant = document.documentElement.getAttribute('data-locale-variant');
      if (docVariant === 'en' || docVariant === 'zh-Hant' || docVariant === 'fr' || docVariant === 'es' || docVariant === 'de') {
        return docVariant;
      }
      return 'zh-CN';
    };

    setLocaleVariant(readCurrentLocale());

    const handleLocaleChange = (e: Event) => {
      const detail = (e as CustomEvent<string>).detail;
      if (detail === 'en' || detail === 'zh-Hant' || detail === 'fr' || detail === 'es' || detail === 'de' || detail === 'zh-CN') {
        setLocaleVariant(detail as LocaleVariant);
      } else {
        setLocaleVariant(readCurrentLocale());
      }
    };

    window.addEventListener('shijianus:localechange', handleLocaleChange);
    return () => window.removeEventListener('shijianus:localechange', handleLocaleChange);
  }, []);

  const t = (text: string) => convertText(text, localeVariant);

  // Playback & UI States
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'player' | 'search' | 'queue'>('player');
  const [query, setQuery] = useState('');
  const [source, setSource] = useState('netease');
  const [results, setResults] = useState<MusicTrack[]>([]);
  const [queue, setQueue] = useState<MusicTrack[]>([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');

  // Audio timeline & volume
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.85);
  const [isMuted, setIsMuted] = useState(false);
  const [playMode, setPlayMode] = useState<'loop' | 'single' | 'shuffle'>('loop');

  // Lyrics
  const [rawLyric, setRawLyric] = useState('');
  const [parsedLyrics, setParsedLyrics] = useState<LyricLine[]>([]);
  const [activeLyricIndex, setActiveLyricIndex] = useState(-1);
  const [floatingLyricVisible, setFloatingLyricVisible] = useState(true);

  const currentTrack = currentIndex >= 0 && currentIndex < queue.length ? queue[currentIndex] : null;

  // Show toast notification helper
  const showToast = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(''), 2600);
  };

  // Restore saved state on mount
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as {
        queue?: MusicTrack[];
        currentIndex?: number;
        currentTime?: number;
        source?: string;
        volume?: number;
        playMode?: 'loop' | 'single' | 'shuffle';
        floatingLyricVisible?: boolean;
      };
      if (Array.isArray(parsed.queue) && parsed.queue.length > 0) setQueue(parsed.queue);
      if (typeof parsed.currentIndex === 'number') setCurrentIndex(parsed.currentIndex);
      if (typeof parsed.source === 'string') setSource(parsed.source);
      if (typeof parsed.volume === 'number') setVolume(parsed.volume);
      if (parsed.playMode) setPlayMode(parsed.playMode);
      if (typeof parsed.floatingLyricVisible === 'boolean') setFloatingLyricVisible(parsed.floatingLyricVisible);
      if (audioRef.current && typeof parsed.currentTime === 'number') {
        audioRef.current.currentTime = parsed.currentTime;
      }
    } catch {}
  }, []);

  // Persist state on change
  useEffect(() => {
    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          queue,
          currentIndex,
          currentTime: audioRef.current?.currentTime ?? 0,
          source,
          volume,
          playMode,
          floatingLyricVisible,
        }),
      );
    } catch {}
  }, [queue, currentIndex, source, volume, playMode, floatingLyricVisible]);

  // Sync volume to audio element
  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  // Resolve audio stream when track changes
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentTrack) return;

    audio.src = `${apiBase}/music/stream?id=${encodeURIComponent(currentTrack.id)}&source=${encodeURIComponent(currentTrack.source)}&quality=320`;
    if (!isPlaying) return;
    void audio.play().catch(() => setIsPlaying(false));
  }, [apiBase, currentTrack]);

  // Fetch & synchronize lyrics when track changes
  useEffect(() => {
    if (!currentTrack?.id) {
      setRawLyric('');
      setParsedLyrics([]);
      setActiveLyricIndex(-1);
      return;
    }

    let active = true;
    setRawLyric('正在同步歌词...');
    setParsedLyrics([]);
    setActiveLyricIndex(-1);

    const lyricId = currentTrack.lyricId || currentTrack.id;
    void fetchJson<{ lyric?: string; parsed?: LyricLine[] }>(
      `${apiBase}/music/lyric?id=${encodeURIComponent(lyricId)}&source=${encodeURIComponent(currentTrack.source)}`,
    )
      .then((payload) => {
        if (!active) return;
        const text = payload.lyric?.trim() || '';
        const lines = Array.isArray(payload.parsed) && payload.parsed.length > 0
          ? payload.parsed
          : parseLrc(text);

        startTransition(() => {
          setRawLyric(text || '当前曲目暂时没有可用歌词。');
          setParsedLyrics(lines);
        });
      })
      .catch(() => {
        if (!active) return;
        setRawLyric('当前曲目暂时没有可用歌词。');
        setParsedLyrics([]);
      });

    return () => {
      active = false;
    };
  }, [apiBase, currentTrack]);

  // Audio Event Listeners (timeupdate, ended, etc.)
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onTimeUpdate = () => {
      const now = audio.currentTime;
      setCurrentTime(now);

      // Match current lyric line
      if (parsedLyrics.length > 0) {
        let matched = -1;
        for (let i = 0; i < parsedLyrics.length; i++) {
          if (parsedLyrics[i].time <= now) {
            matched = i;
          } else {
            break;
          }
        }
        setActiveLyricIndex(matched);

        // Auto scroll lyrics container if open
        if (lyricContainerRef.current && matched >= 0) {
          const activeEl = lyricContainerRef.current.children[matched] as HTMLElement | undefined;
          if (activeEl) {
            const containerHeight = lyricContainerRef.current.clientHeight;
            const targetScroll = activeEl.offsetTop - containerHeight / 2 + activeEl.clientHeight / 2;
            lyricContainerRef.current.scrollTo({
              top: Math.max(0, targetScroll),
              behavior: 'smooth',
            });
          }
        }
      }
    };

    const onLoadedMetadata = () => {
      setDuration(audio.duration || 0);
    };

    const onEnded = () => {
      if (playMode === 'single') {
        audio.currentTime = 0;
        void audio.play();
        return;
      }
      if (playMode === 'shuffle') {
        const next = Math.floor(Math.random() * queue.length);
        setCurrentIndex(next);
        return;
      }
      // default: loop
      setCurrentIndex((prev) => {
        const next = prev + 1;
        if (next >= queue.length) {
          return 0; // loop back to first
        }
        return next;
      });
    };

    const onPause = () => setIsPlaying(false);
    const onPlay = () => setIsPlaying(true);

    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('loadedmetadata', onLoadedMetadata);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('pause', onPause);
    audio.addEventListener('play', onPlay);

    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('pause', onPause);
      audio.removeEventListener('play', onPlay);
    };
  }, [parsedLyrics, playMode, queue.length]);

  // Seek audio timeline
  const handleSeek = (event: React.ChangeEvent<HTMLInputElement>) => {
    const nextTime = parseFloat(event.target.value);
    setCurrentTime(nextTime);
    if (audioRef.current) {
      audioRef.current.currentTime = nextTime;
    }
  };

  // Play a specific track
  const playTrack = (index: number, nextQueue?: MusicTrack[]) => {
    const targetQueue = nextQueue ?? queue;
    if (!targetQueue[index]) return;
    if (nextQueue) setQueue(nextQueue);
    setCurrentIndex(index);
    setIsPlaying(true);
    if (audioRef.current) {
      void audioRef.current.play().catch(() => {});
    }
  };

  // Add a song to queue (点歌 / 加待播)
  const enqueueTrack = (track: MusicTrack, playNow = false) => {
    const existingIndex = queue.findIndex((item) => item.id === track.id && item.source === track.source);
    let nextQueue = [...queue];

    if (existingIndex >= 0) {
      if (playNow) {
        playTrack(existingIndex);
      } else {
        showToast(`已在播放队列: ${track.name}`);
      }
      return;
    }

    if (playNow) {
      nextQueue = [track, ...nextQueue];
      setQueue(nextQueue);
      playTrack(0, nextQueue);
      showToast(`正在播放: ${track.name}`);
    } else {
      nextQueue.push(track);
      setQueue(nextQueue);
      showToast(`已点歌并加入待播: ${track.name}`);
    }
  };

  // Remove track from queue
  const removeTrack = (index: number, event: React.MouseEvent) => {
    event.stopPropagation();
    const nextQueue = queue.filter((_, i) => i !== index);
    setQueue(nextQueue);
    if (index === currentIndex) {
      if (nextQueue.length === 0) {
        setCurrentIndex(-1);
        setIsPlaying(false);
        if (audioRef.current) audioRef.current.src = '';
      } else {
        setCurrentIndex(Math.min(index, nextQueue.length - 1));
      }
    } else if (index < currentIndex) {
      setCurrentIndex((prev) => prev - 1);
    }
    showToast('已从待播列表中移除');
  };

  // Clear queue
  const clearQueue = () => {
    setQueue([]);
    setCurrentIndex(-1);
    setIsPlaying(false);
    if (audioRef.current) audioRef.current.src = '';
    showToast('待播队列已清空');
  };

  // Random tracks
  const fetchRandom = async () => {
    setLoading(true);
    setError('');
    try {
      const payload = await fetchJson<{ tracks: MusicTrack[] }>(`${apiBase}/music/random?count=8`);
      const nextTracks = payload.tracks || [];
      startTransition(() => {
        setResults(nextTracks);
        if (nextTracks.length > 0) {
          playTrack(0, nextTracks);
          showToast('已随机载入 8 首精选好歌');
        }
      });
    } catch (err: any) {
      setError(err?.message || '随机曲库获取失败');
    } finally {
      setLoading(false);
    }
  };

  // Search tracks
  const searchMusic = async (customQuery?: string) => {
    const text = (customQuery ?? query).trim();
    if (!text) return;
    if (customQuery) setQuery(text);
    setLoading(true);
    setError('');
    try {
      const payload = await fetchJson<{ tracks: MusicTrack[] }>(
        `${apiBase}/music/search?q=${encodeURIComponent(text)}&source=${encodeURIComponent(source)}&count=15&page=1`,
      );
      startTransition(() => {
        setResults(payload.tracks || []);
        setActiveTab('search');
        if (!payload.tracks || payload.tracks.length === 0) {
          setError('未搜索到相关歌曲，尝试切换音源或更换关键词');
        }
      });
    } catch (err: any) {
      setError(err?.message || '搜索失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  // Toggle playback
  const togglePlayback = async () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (!currentTrack) {
      if (queue.length > 0) {
        playTrack(0);
      } else if (results.length > 0) {
        playTrack(0, results);
      } else {
        void fetchRandom();
      }
      return;
    }

    if (audio.paused) {
      await audio.play().catch(() => setIsPlaying(false));
    } else {
      audio.pause();
    }
  };

  // Skip track
  const skipTrack = (direction: 1 | -1) => {
    if (queue.length <= 1) return;
    if (playMode === 'shuffle') {
      const next = Math.floor(Math.random() * queue.length);
      playTrack(next);
      return;
    }
    const nextIndex = (currentIndex + direction + queue.length) % queue.length;
    playTrack(nextIndex);
  };

  // Toggle play mode
  const cyclePlayMode = () => {
    const modes: ('loop' | 'single' | 'shuffle')[] = ['loop', 'single', 'shuffle'];
    const next = modes[(modes.indexOf(playMode) + 1) % modes.length];
    setPlayMode(next);
    const labels = { loop: '列表循环', single: '单曲循环', shuffle: '随机播放' };
    showToast(`播放模式: ${labels[next]}`);
  };

  const currentLyricText = activeLyricIndex >= 0 && parsedLyrics[activeLyricIndex]
    ? parsedLyrics[activeLyricIndex].text
    : currentTrack
      ? `${currentTrack.name} - ${currentTrack.artist}`
      : 'EpoCanvas 纯净背景音乐';

  return (
    <div className={`shijianus-music-pocket ${open ? 'is-open' : ''} ${isPlaying ? 'is-playing' : ''}`}>
      <audio ref={audioRef} preload="none" />

      {/* Floating Dynamic Lyric Pill (When minimized or playing) */}
      {!open && floatingLyricVisible && (
        <div
          className="shijianus-music-pocket__floating-lyric"
          onClick={() => setOpen(true)}
          role="button"
          tabIndex={0}
          title={t('点击展开音乐播放器')}
        >
          <div className="shijianus-music-pocket__equalizer" aria-hidden="true">
            <span className="eq-bar eq-bar--1" />
            <span className="eq-bar eq-bar--2" />
            <span className="eq-bar eq-bar--3" />
          </div>
          <div className="shijianus-music-pocket__floating-text">
            <span>{currentLyricText}</span>
          </div>
          <button
            type="button"
            className="shijianus-music-pocket__floating-close"
            onClick={(e) => {
              e.stopPropagation();
              setFloatingLyricVisible(false);
            }}
            aria-label={t('收起悬浮歌词')}
          >
            <X size={12} aria-hidden="true" />
          </button>
        </div>
      )}

      {/* Modern Photorealistic Vinyl Disc Toggle Button */}
      <button
        type="button"
        className="shijianus-music-pocket__toggle"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-label={open ? t('收起音乐播放器') : t('展开音乐点歌台')}
      >
        {/* Subtle dynamic sound wave ring */}
        <span className="shijianus-music-pocket__wave-pulse" aria-hidden="true" />

        {/* Vinyl Disc Body */}
        <span className="shijianus-music-pocket__toggle-disc" aria-hidden="true">
          {/* Micro Vinyl Grooves */}
          <span className="shijianus-music-pocket__toggle-groove-outer" />
          <span className="shijianus-music-pocket__toggle-groove-inner" />

          {/* Dynamic Light Sheen */}
          <span className="shijianus-music-pocket__toggle-shine" />

          {/* Center Record Label / Artwork */}
          <span className="shijianus-music-pocket__toggle-label">
            {currentTrack?.coverUrl ? (
              <img src={currentTrack.coverUrl} alt="" className="shijianus-music-pocket__toggle-art" />
            ) : (
              <span className="shijianus-music-pocket__toggle-core" />
            )}
          </span>
        </span>

        {/* Realistic Tonearm (留声机唱针臂) */}
        <span className="shijianus-music-pocket__tonearm" aria-hidden="true">
          <span className="shijianus-music-pocket__tonearm-pivot" />
          <span className="shijianus-music-pocket__tonearm-stick" />
          <span className="shijianus-music-pocket__tonearm-head" />
        </span>

        {/* Hover Mini Badge */}
        <span className="shijianus-music-pocket__toggle-copy">
          <strong>{currentTrack ? currentTrack.name : 'Solara Radio'}</strong>
          <small>{currentTrack ? `${currentTrack.artist} · ${currentTrack.album || t('单曲')}` : t('点歌 / 随机曲库')}</small>
        </span>
      </button>

      {/* Toast Notification */}
      {toast && (
        <div className="shijianus-music-pocket__toast" role="status">
          {toast}
        </div>
      )}

      {/* Expanded Modern Glassmorphic Player Panel */}
      {open && (
        <div className="shijianus-music-pocket__panel">
          {/* Panel Navigation Header */}
          <div className="shijianus-music-pocket__panel-head">
            <div className="shijianus-music-pocket__tabs">
              <button
                type="button"
                className={`shijianus-music-pocket__tab ${activeTab === 'player' ? 'is-active' : ''}`}
                onClick={() => setActiveTab('player')}
              >
                <Disc size={15} aria-hidden="true" />
                <span>{t('正在播放')}</span>
              </button>
              <button
                type="button"
                className={`shijianus-music-pocket__tab ${activeTab === 'search' ? 'is-active' : ''}`}
                onClick={() => setActiveTab('search')}
              >
                <Search size={15} aria-hidden="true" />
                <span>{t('点歌台')}</span>
              </button>
              <button
                type="button"
                className={`shijianus-music-pocket__tab ${activeTab === 'queue' ? 'is-active' : ''}`}
                onClick={() => setActiveTab('queue')}
              >
                <ListMusic size={15} aria-hidden="true" />
                <span>{t('待播')} ({queue.length})</span>
              </button>
            </div>

            <button
              type="button"
              className="shijianus-music-pocket__close-btn"
              onClick={() => setOpen(false)}
              aria-label={t('关闭播放器面板')}
            >
              <X size={18} aria-hidden="true" />
            </button>
          </div>

          {/* TAB 1: NOW PLAYING */}
          {activeTab === 'player' && (
            <div className="shijianus-music-pocket__tab-content shijianus-music-pocket__tab-content--player">
              {/* Turntable / Track Visual Area */}
              <div className="shijianus-music-pocket__now-banner">
                <div className="shijianus-music-pocket__turntable">
                  <div className={`shijianus-music-pocket__big-disc ${isPlaying ? 'is-rotating' : ''}`}>
                    <div className="shijianus-music-pocket__big-disc-grooves" />
                    <div className="shijianus-music-pocket__big-disc-center">
                      {currentTrack?.coverUrl ? (
                        <img src={currentTrack.coverUrl} alt={currentTrack.name} />
                      ) : (
                        <Music size={28} className="shijianus-music-pocket__disc-icon" />
                      )}
                    </div>
                  </div>
                </div>

                <div className="shijianus-music-pocket__meta">
                  <div className="shijianus-music-pocket__title-row">
                    <strong className="shijianus-music-pocket__song-title">
                      {currentTrack ? currentTrack.name : t('暂无正在播放的歌曲')}
                    </strong>
                    {currentTrack?.source && (
                      <span className="shijianus-music-pocket__source-tag">
                        {currentTrack.source === 'netease' ? '网易云' : currentTrack.source === 'kuwo' ? '酷我' : currentTrack.source}
                      </span>
                    )}
                  </div>
                  <p className="shijianus-music-pocket__song-artist">
                    {currentTrack ? `${currentTrack.artist}${currentTrack.album ? ` — 《${currentTrack.album}》` : ''}` : t('点击下方“随机曲库”或在点歌台点播')}
                  </p>
                </div>
              </div>

              {/* Synchronized Scrolling Lyrics View */}
              <div className="shijianus-music-pocket__lyrics-viewport" ref={lyricContainerRef}>
                {parsedLyrics.length > 0 ? (
                  parsedLyrics.map((item, idx) => {
                    const isActive = idx === activeLyricIndex;
                    return (
                      <div
                        key={`${item.time}-${idx}`}
                        className={`shijianus-music-pocket__lyric-line ${isActive ? 'is-active' : ''}`}
                        onClick={() => {
                          if (audioRef.current) {
                            audioRef.current.currentTime = item.time;
                            setCurrentTime(item.time);
                          }
                        }}
                        title={`跳转至 ${formatTime(item.time)}`}
                      >
                        {item.text}
                      </div>
                    );
                  })
                ) : (
                  <div className="shijianus-music-pocket__lyrics-empty">
                    <p>{rawLyric ? t(rawLyric) : t('暂无滚动歌词')}</p>
                  </div>
                )}
              </div>

              {/* Scrubber Timeline */}
              <div className="shijianus-music-pocket__scrubber">
                <span className="shijianus-music-pocket__time">{formatTime(currentTime)}</span>
                <input
                  type="range"
                  min={0}
                  max={duration || 100}
                  step={0.5}
                  value={currentTime}
                  onChange={handleSeek}
                  className="shijianus-music-pocket__seek-slider"
                  aria-label={t('音频进度条')}
                />
                <span className="shijianus-music-pocket__time">{formatTime(duration)}</span>
              </div>

              {/* Player Controls Bar */}
              <div className="shijianus-music-pocket__controls">
                <button
                  type="button"
                  className="shijianus-music-pocket__icon-btn"
                  onClick={cyclePlayMode}
                  title={`${t('当前')}: ${playMode === 'single' ? t('单曲循环') : playMode === 'shuffle' ? t('随机播放') : t('列表循环')}`}
                >
                  {playMode === 'single' ? <Repeat1 size={17} /> : playMode === 'shuffle' ? <Shuffle size={17} /> : <Repeat size={17} />}
                </button>

                <button
                  type="button"
                  className="shijianus-music-pocket__icon-btn"
                  onClick={() => skipTrack(-1)}
                  disabled={queue.length <= 1}
                  aria-label={t('上一首')}
                >
                  <SkipBack size={19} />
                </button>

                <button
                  type="button"
                  className="shijianus-music-pocket__play-btn"
                  onClick={() => void togglePlayback()}
                  aria-label={isPlaying ? t('暂停') : t('播放')}
                >
                  {isPlaying ? <Pause size={22} /> : <Play size={22} className="play-icon-offset" />}
                </button>

                <button
                  type="button"
                  className="shijianus-music-pocket__icon-btn"
                  onClick={() => skipTrack(1)}
                  disabled={queue.length <= 1}
                  aria-label={t('下一首')}
                >
                  <SkipForward size={19} />
                </button>

                {/* Volume slider toggle */}
                <div className="shijianus-music-pocket__volume-wrapper">
                  <button
                    type="button"
                    className="shijianus-music-pocket__icon-btn"
                    onClick={() => setIsMuted((v) => !v)}
                    title={isMuted ? t('恢复声音') : t('静音')}
                  >
                    {isMuted || volume === 0 ? <VolumeX size={17} /> : <Volume2 size={17} />}
                  </button>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.02}
                    value={isMuted ? 0 : volume}
                    onChange={(e) => {
                      setVolume(parseFloat(e.target.value));
                      setIsMuted(false);
                    }}
                    className="shijianus-music-pocket__volume-slider"
                    aria-label={t('音量调节')}
                  />
                </div>

                {/* Floating lyrics toggle */}
                <button
                  type="button"
                  className={`shijianus-music-pocket__icon-btn ${floatingLyricVisible ? 'is-highlight' : ''}`}
                  onClick={() => {
                    setFloatingLyricVisible((v) => !v);
                    showToast(floatingLyricVisible ? '已关闭桌面悬浮歌词' : '已开启桌面悬浮歌词');
                  }}
                  title={floatingLyricVisible ? t('关闭悬浮歌词') : t('开启悬浮歌词')}
                >
                  <MessageSquare size={16} />
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: SONG REQUEST & SEARCH (点歌台) */}
          {activeTab === 'search' && (
            <div className="shijianus-music-pocket__tab-content shijianus-music-pocket__tab-content--search">
              {/* Search Bar */}
              <div className="shijianus-music-pocket__search-bar">
                <select
                  value={source}
                  onChange={(e) => setSource(e.target.value)}
                  className="shijianus-music-pocket__source-select"
                  aria-label={t('音源曲库')}
                >
                  {SOURCES.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>

                <div className="shijianus-music-pocket__input-box">
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') void searchMusic();
                    }}
                    placeholder={t('点播歌曲、歌手或专辑...')}
                    className="shijianus-music-pocket__input"
                  />
                  {query && (
                    <button
                      type="button"
                      className="shijianus-music-pocket__input-clear"
                      onClick={() => setQuery('')}
                      aria-label={t('清空输入')}
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>

                <button
                  type="button"
                  className="shijianus-music-pocket__search-submit"
                  onClick={() => void searchMusic()}
                  aria-label={t('搜索')}
                  disabled={loading}
                >
                  <Search size={16} />
                </button>
              </div>

              {/* Quick Tags / Recommended Moods */}
              <div className="shijianus-music-pocket__quick-tags">
                <span className="shijianus-music-pocket__tags-label">{t('热门推荐：')}</span>
                {QUICK_TAGS.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    className="shijianus-music-pocket__tag-pill"
                    onClick={() => void searchMusic(tag)}
                  >
                    {tag}
                  </button>
                ))}
                <button
                  type="button"
                  className="shijianus-music-pocket__tag-pill shijianus-music-pocket__tag-pill--random"
                  onClick={() => void fetchRandom()}
                >
                  <Sparkles size={12} />
                  <span>{t('随机推荐')}</span>
                </button>
              </div>

              {/* Search Status & Errors */}
              {loading && <div className="shijianus-music-pocket__status">🔍 {t('正在检索全网高质音源...')}</div>}
              {error && <div className="shijianus-music-pocket__error">{error}</div>}

              {/* Results List */}
              <div className="shijianus-music-pocket__results-list">
                {results.map((track, idx) => {
                  const isCurrent = currentTrack?.id === track.id;
                  return (
                    <div
                      key={`${track.source}-${track.id}-${idx}`}
                      className={`shijianus-music-pocket__track-card ${isCurrent ? 'is-current' : ''}`}
                    >
                      <div className="shijianus-music-pocket__track-num">
                        {isCurrent && isPlaying ? (
                          <div className="shijianus-music-pocket__mini-eq">
                            <span />
                            <span />
                            <span />
                          </div>
                        ) : (
                          <span>{String(idx + 1).padStart(2, '0')}</span>
                        )}
                      </div>

                      <div className="shijianus-music-pocket__track-info">
                        <strong className="shijianus-music-pocket__track-name">{track.name}</strong>
                        <small className="shijianus-music-pocket__track-artist">
                          {track.artist} {track.album ? `· ${track.album}` : ''}
                        </small>
                      </div>

                      <div className="shijianus-music-pocket__track-actions">
                        <button
                          type="button"
                          className="shijianus-music-pocket__action-btn shijianus-music-pocket__action-btn--play"
                          onClick={() => enqueueTrack(track, true)}
                          title={t('立即点播')}
                        >
                          <Play size={14} />
                          <span>{t('播放')}</span>
                        </button>
                        <button
                          type="button"
                          className="shijianus-music-pocket__action-btn shijianus-music-pocket__action-btn--queue"
                          onClick={() => enqueueTrack(track, false)}
                          title={t('加入待播列表')}
                        >
                          <Plus size={14} />
                          <span>{t('加待播')}</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: PLAYBACK QUEUE (待播队列) */}
          {activeTab === 'queue' && (
            <div className="shijianus-music-pocket__tab-content shijianus-music-pocket__tab-content--queue">
              <div className="shijianus-music-pocket__queue-header">
                <span>{t('待播序列清单')} ({queue.length})</span>
                {queue.length > 0 && (
                  <button
                    type="button"
                    className="shijianus-music-pocket__clear-queue-btn"
                    onClick={clearQueue}
                  >
                    <Trash2 size={13} />
                    <span>{t('清空队列')}</span>
                  </button>
                )}
              </div>

              <div className="shijianus-music-pocket__queue-list">
                {queue.length > 0 ? (
                  queue.map((track, idx) => {
                    const isActive = idx === currentIndex;
                    return (
                      <div
                        key={`${track.source}-${track.id}-${idx}`}
                        className={`shijianus-music-pocket__queue-item ${isActive ? 'is-active' : ''}`}
                        onClick={() => playTrack(idx)}
                      >
                        <div className="shijianus-music-pocket__queue-item-left">
                          {isActive && isPlaying ? (
                            <div className="shijianus-music-pocket__mini-eq">
                              <span />
                              <span />
                              <span />
                            </div>
                          ) : (
                            <span className="shijianus-music-pocket__queue-idx">{idx + 1}</span>
                          )}
                          <div className="shijianus-music-pocket__queue-meta">
                            <strong>{track.name}</strong>
                            <small>{track.artist}</small>
                          </div>
                        </div>

                        <button
                          type="button"
                          className="shijianus-music-pocket__remove-btn"
                          onClick={(e) => removeTrack(idx, e)}
                          title={t('移出播放队列')}
                        >
                          <X size={14} />
                        </button>
                      </div>
                    );
                  })
                ) : (
                  <div className="shijianus-music-pocket__queue-empty">
                    <Music size={36} />
                    <p>{t('当前播放队列为空')}</p>
                    <button
                      type="button"
                      className="shijianus-music-pocket__btn-primary"
                      onClick={() => void fetchRandom()}
                    >
                      <Sparkles size={14} />
                      <span>{t('一键导入随机推荐曲目')}</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
export default MusicPocket;
