import React, { startTransition, useCallback, useEffect, useRef, useState } from 'react';
import { convertText, type LocaleVariant } from '../../lib/client-locale';
import {
  Disc,
  Flame,
  ListMusic,
  Minus,
  Music,
  Pause,
  Play,
  Plus,
  Radio,
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
const POS_STORAGE_KEY = 'shijianus-music-pocket-pos';
const VISIBLE_STORAGE_KEY = 'shijianus-music-pocket-visible';

const SOURCES = [
  { value: 'netease', label: '网易云' },
  { value: 'kuwo', label: '酷我' },
  { value: 'qq', label: 'QQ音乐' },
];

const QUICK_TAGS = ['流行热歌', '周杰伦', '陈奕迅', '赛博纯音', '治愈老歌', 'ACG动漫', 'Lo-Fi轻音', '摇滚巅峰'];

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
  const pocketContainerRef = useRef<HTMLDivElement>(null);

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

  // 1. 显隐控制 (默认隐藏，严格遵从用户需求)
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(VISIBLE_STORAGE_KEY);
      if (saved === 'true') {
        setVisible(true);
      }
    } catch {}

    const handleTogglePocket = (e: Event) => {
      const detail = (e as CustomEvent<{ visible?: boolean }>).detail;
      if (detail && typeof detail.visible === 'boolean') {
        setVisible(detail.visible);
      } else {
        setVisible((prev) => !prev);
      }
    };

    window.addEventListener('shijianus:toggle-music-pocket', handleTogglePocket);
    return () => window.removeEventListener('shijianus:toggle-music-pocket', handleTogglePocket);
  }, []);

  const hideMusicPocket = () => {
    setVisible(false);
    setOpen(false);
    try {
      window.localStorage.setItem(VISIBLE_STORAGE_KEY, 'false');
    } catch {}
    window.dispatchEvent(new CustomEvent('shijianus:music-pocket-visibility-change', { detail: { visible: false } }));
  };

  // 2. 拖拽坐标管理与防止微小位移误触
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef({
    startX: 0,
    startY: 0,
    initPosX: 0,
    initPosY: 0,
    hasMoved: false,
  });
  const justDraggedRef = useRef(false);

  // 初始化拖拽坐标
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const rawPos = window.localStorage.getItem(POS_STORAGE_KEY);
      if (rawPos) {
        const parsed = JSON.parse(rawPos) as { x: number; y: number };
        if (typeof parsed.x === 'number' && typeof parsed.y === 'number') {
          // 校验边界
          const maxX = Math.max(12, window.innerWidth - 72);
          const maxY = Math.max(12, window.innerHeight - 72);
          setPosition({
            x: Math.min(Math.max(12, parsed.x), maxX),
            y: Math.min(Math.max(12, parsed.y), maxY),
          });
          return;
        }
      }
    } catch {}

    // 默认左下角
    setPosition({
      x: 24,
      y: Math.max(24, window.innerHeight - 96),
    });
  }, []);

  // 窗口调整时自适应 clamp
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleResize = () => {
      setPosition((prev) => {
        if (!prev) return prev;
        const maxX = Math.max(12, window.innerWidth - 72);
        const maxY = Math.max(12, window.innerHeight - 72);
        return {
          x: Math.min(Math.max(12, prev.x), maxX),
          y: Math.min(Math.max(12, prev.y), maxY),
        };
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handlePointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    // 仅允许主按键触发拖动
    if (e.button !== 0) return;
    const curX = position ? position.x : 24;
    const curY = position ? position.y : window.innerHeight - 96;

    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initPosX: curX,
      initPosY: curY,
      hasMoved: false,
    };

    // 捕获指针事件
    try {
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    } catch {}
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (dragRef.current.startX === 0 && dragRef.current.startY === 0) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    const distance = Math.hypot(dx, dy);

    if (distance > 5) {
      if (!dragRef.current.hasMoved) {
        dragRef.current.hasMoved = true;
        setIsDragging(true);
      }
      const maxX = Math.max(12, window.innerWidth - 72);
      const maxY = Math.max(12, window.innerHeight - 72);
      const nextX = Math.min(Math.max(12, dragRef.current.initPosX + dx), maxX);
      const nextY = Math.min(Math.max(12, dragRef.current.initPosY + dy), maxY);
      setPosition({ x: nextX, y: nextY });
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (dragRef.current.hasMoved) {
      justDraggedRef.current = true;
      window.setTimeout(() => {
        justDraggedRef.current = false;
      }, 160);

      // 持久化当前位置
      if (position) {
        try {
          window.localStorage.setItem(POS_STORAGE_KEY, JSON.stringify(position));
        } catch {}
      }
    }

    dragRef.current = { startX: 0, startY: 0, initPosX: 0, initPosY: 0, hasMoved: false };
    setIsDragging(false);

    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {}
  };

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

  // 加载初始精选歌单 (通过安全 API 接入)
  const loadInitialPlaylist = useCallback(async () => {
    try {
      const payload = await fetchJson<{ ok: boolean; tracks: MusicTrack[] }>(`${apiBase}/music/playlist`);
      if (payload.ok && Array.isArray(payload.tracks) && payload.tracks.length > 0) {
        setQueue(payload.tracks);
        setCurrentIndex(0);
      }
    } catch {}
  }, [apiBase]);

  // Restore saved state on mount
  useEffect(() => {
    let hasLoadedQueue = false;
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as {
          queue?: MusicTrack[];
          currentIndex?: number;
          currentTime?: number;
          source?: string;
          volume?: number;
          playMode?: 'loop' | 'single' | 'shuffle';
          floatingLyricVisible?: boolean;
        };
        if (Array.isArray(parsed.queue) && parsed.queue.length > 0) {
          setQueue(parsed.queue);
          hasLoadedQueue = true;
        }
        if (typeof parsed.currentIndex === 'number') setCurrentIndex(parsed.currentIndex);
        if (typeof parsed.source === 'string') setSource(parsed.source);
        if (typeof parsed.volume === 'number') setVolume(parsed.volume);
        if (parsed.playMode) setPlayMode(parsed.playMode);
        if (typeof parsed.floatingLyricVisible === 'boolean') setFloatingLyricVisible(parsed.floatingLyricVisible);
        if (audioRef.current && typeof parsed.currentTime === 'number') {
          audioRef.current.currentTime = parsed.currentTime;
        }
      }
    } catch {}

    // 若本地没有队列缓存，通过 API 自动加载初始推荐歌单
    if (!hasLoadedQueue) {
      void loadInitialPlaylist();
    }
  }, [loadInitialPlaylist]);

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

  // Resolve audio stream when track changes (全链路走 /api/music/stream 安全反向代理)
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentTrack) return;

    audio.src = `${apiBase}/music/stream?id=${encodeURIComponent(currentTrack.id)}&source=${encodeURIComponent(currentTrack.source)}&quality=320`;
    if (!isPlaying) return;
    void audio.play().catch(() => setIsPlaying(false));
  }, [apiBase, currentTrack]);

  // Fetch & synchronize lyrics when track changes (全链路走 /api/music/lyric 安全获取)
  useEffect(() => {
    if (!currentTrack?.id) {
      setRawLyric('');
      setParsedLyrics([]);
      setActiveLyricIndex(-1);
      return;
    }

    let active = true;
    setRawLyric('正在同步时空声波歌词...');
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
          setRawLyric(text || '当前曲目纯音无歌词，请享受沉浸旋律。');
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

        // Auto scroll lyrics container
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
          return 0;
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

  // Search through backend API
  const handleSearch = async (overrideKeyword?: string) => {
    const keyword = (overrideKeyword || query).trim();
    if (!keyword) return;

    setLoading(true);
    setError('');

    try {
      const payload = await fetchJson<{ ok: boolean; tracks: MusicTrack[] }>(
        `${apiBase}/music/search?q=${encodeURIComponent(keyword)}&source=${encodeURIComponent(source)}&count=10`,
      );
      if (payload.ok && Array.isArray(payload.tracks)) {
        setResults(payload.tracks);
        if (payload.tracks.length === 0) {
          setError(t('未找到匹配的高质曲目，请尝试其他关键词。'));
        }
      }
    } catch (err: any) {
      setError(err?.message || t('曲目检索请求异常，请稍候重试。'));
    } finally {
      setLoading(false);
    }
  };

  // Random Discovery through backend API
  const handleRandom = async () => {
    setLoading(true);
    setError('');
    try {
      const payload = await fetchJson<{ ok: boolean; tracks: MusicTrack[]; keyword: string }>(
        `${apiBase}/music/random?count=8`,
      );
      if (payload.ok && Array.isArray(payload.tracks)) {
        setResults(payload.tracks);
        showToast(`已探索精选灵感风格: ${payload.keyword || '随机'}`);
      }
    } catch (err: any) {
      setError(err?.message || t('随机灵感获取失败，请稍后重试。'));
    } finally {
      setLoading(false);
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

  // Add to queue or play now
  const addTrack = (track: MusicTrack, playNow = false) => {
    let nextQueue = [...queue];
    const existingIndex = nextQueue.findIndex((item) => item.id === track.id);

    if (existingIndex >= 0) {
      if (playNow) {
        playTrack(existingIndex);
        showToast(`正在播放: ${track.name}`);
      } else {
        showToast('该歌曲已在待播列表中');
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
      showToast(`已加入待播: ${track.name}`);
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
        const nextIdx = index >= nextQueue.length ? 0 : index;
        playTrack(nextIdx, nextQueue);
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

  // Seek timeline
  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const targetTime = parseFloat(e.target.value);
    setCurrentTime(targetTime);
    if (audioRef.current) {
      audioRef.current.currentTime = targetTime;
    }
  };

  // Lyric line click to seek
  const handleLyricClick = (time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
      if (!isPlaying) {
        void audioRef.current.play().catch(() => {});
        setIsPlaying(true);
      }
    }
  };

  // Play / Pause toggle
  const togglePlay = async () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (!currentTrack) {
      if (queue.length > 0) {
        playTrack(0);
      } else {
        await loadInitialPlaylist();
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

  const handleToggleOpen = () => {
    if (justDraggedRef.current) return;
    setOpen((prev) => !prev);
  };

  const currentLyricText = activeLyricIndex >= 0 && parsedLyrics[activeLyricIndex]
    ? parsedLyrics[activeLyricIndex].text
    : currentTrack
      ? `${currentTrack.name} - ${currentTrack.artist}`
      : t('EpoCanvas 空间声波随身听');

  // 判断弹出面板的自适应朝向 (避免出屏)
  const isRightHalf = position ? position.x > (typeof window !== 'undefined' ? window.innerWidth / 2 : 600) : false;
  const isTopHalf = position ? position.y < (typeof window !== 'undefined' ? window.innerHeight / 2 : 400) : false;

  const containerStyle: React.CSSProperties = {
    position: 'fixed',
    left: position ? `${position.x}px` : '24px',
    top: position ? `${position.y}px` : 'auto',
    bottom: position ? 'auto' : '24px',
    right: 'auto',
    transform: 'none',
    display: visible ? 'block' : 'none',
  };

  return (
    <div
      ref={pocketContainerRef}
      className={`shijianus-music-pocket ${!visible ? 'is-hidden' : ''} ${open ? 'is-open' : ''} ${isPlaying ? 'is-playing' : ''} ${isDragging ? 'is-dragging' : ''}`}
      style={containerStyle}
    >
      <audio ref={audioRef} preload="none" />

      {/* 悬浮流动歌词胶囊 (当折叠且开启歌词浮现时展示) */}
      {!open && floatingLyricVisible && (
        <div
          className={`shijianus-music-pocket__floating-lyric ${isRightHalf ? 'align-left' : 'align-right'}`}
          onClick={() => setOpen(true)}
          role="button"
          tabIndex={0}
          title={t('点击展开音乐随身听')}
        >
          <div className="shijianus-music-pocket__equalizer" aria-hidden="true">
            <span className="eq-bar eq-bar--1" />
            <span className="eq-bar eq-bar--2" />
            <span className="eq-bar eq-bar--3" />
            <span className="eq-bar eq-bar--4" />
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
            aria-label={t('收起桌面歌词')}
          >
            <X size={12} aria-hidden="true" />
          </button>
        </div>
      )}

      {/* 可拖动黑胶唱机浮动 Button */}
      <button
        type="button"
        className="shijianus-music-pocket__toggle"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onClick={handleToggleOpen}
        aria-expanded={open}
        aria-label={open ? t('收起音乐播放器') : t('展开随身音乐点歌台')}
        title={t('按住可自由拖拽，点击展开音乐随身听')}
      >
        {/* 声波涟漪光晕环 */}
        <span className="shijianus-music-pocket__wave-pulse" aria-hidden="true" />

        {/* 物理光泽黑胶盘身 */}
        <span className="shijianus-music-pocket__toggle-disc" aria-hidden="true">
          <span className="shijianus-music-pocket__toggle-groove-outer" />
          <span className="shijianus-music-pocket__toggle-groove-inner" />
          <span className="shijianus-music-pocket__toggle-shine" />

          {/* 黑胶内盘中心标 */}
          <span className="shijianus-music-pocket__toggle-label">
            {currentTrack?.coverUrl ? (
              <img src={currentTrack.coverUrl} alt="" className="shijianus-music-pocket__toggle-art" />
            ) : (
              <span className="shijianus-music-pocket__toggle-core" />
            )}
          </span>
        </span>

        {/* 动态唱针臂 (Tonearm) */}
        <span className="shijianus-music-pocket__tonearm" aria-hidden="true">
          <span className="shijianus-music-pocket__tonearm-pivot" />
          <span className="shijianus-music-pocket__tonearm-stick" />
          <span className="shijianus-music-pocket__tonearm-head" />
        </span>

        {/* Hover 微提示徽标 */}
        {!isDragging && (
          <span className={`shijianus-music-pocket__toggle-copy ${isRightHalf ? 'align-left' : 'align-right'}`}>
            <strong>{currentTrack ? currentTrack.name : 'EpoCanvas Radio'}</strong>
            <small>{currentTrack ? `${currentTrack.artist} · ${currentTrack.album || t('单曲')}` : t('点歌 / 随身曲库 (可拖拽)')}</small>
          </span>
        )}
      </button>

      {/* 轻量级 Toast 提示 */}
      {toast && (
        <div className="shijianus-music-pocket__toast" role="status">
          {toast}
        </div>
      )}

      {/* 展开的特色 Cyber-Vintage 播放器面板 */}
      {open && (
        <div
          className={`shijianus-music-pocket__panel ${isRightHalf ? 'pos-to-left' : 'pos-to-right'} ${isTopHalf ? 'pos-to-bottom' : 'pos-to-top'}`}
        >
          {/* 1. 复古硬件 HUD 顶栏 */}
          <div className="shijianus-music-pocket__hud-head">
            <div className="shijianus-music-pocket__hud-indicator">
              <span className={`hud-dot ${isPlaying ? 'is-active' : ''}`} />
              <span className="hud-label">HI-FI STEREO</span>
              <span className="hud-badge">320K</span>
            </div>

            <div className="shijianus-music-pocket__panel-actions">
              <button
                type="button"
                className="shijianus-music-pocket__hud-btn"
                onClick={() => setOpen(false)}
                title={t('最小化面板')}
                aria-label={t('最小化面板')}
              >
                <Minus size={14} aria-hidden="true" />
              </button>
              <button
                type="button"
                className="shijianus-music-pocket__hud-btn shijianus-music-pocket__hud-btn--close"
                onClick={hideMusicPocket}
                title={t('完全隐藏音乐口袋 (可在右侧控制台重新开启)')}
                aria-label={t('完全隐藏音乐口袋')}
              >
                <X size={14} aria-hidden="true" />
              </button>
            </div>
          </div>

          {/* 2. 交互选项卡 Tabs */}
          <div className="shijianus-music-pocket__tabs-bar">
            <button
              type="button"
              className={`shijianus-music-pocket__tab ${activeTab === 'player' ? 'is-active' : ''}`}
              onClick={() => setActiveTab('player')}
            >
              <Disc size={14} aria-hidden="true" />
              <span>{t('唱机')}</span>
            </button>
            <button
              type="button"
              className={`shijianus-music-pocket__tab ${activeTab === 'search' ? 'is-active' : ''}`}
              onClick={() => setActiveTab('search')}
            >
              <Search size={14} aria-hidden="true" />
              <span>{t('探索')}</span>
            </button>
            <button
              type="button"
              className={`shijianus-music-pocket__tab ${activeTab === 'queue' ? 'is-active' : ''}`}
              onClick={() => setActiveTab('queue')}
            >
              <ListMusic size={14} aria-hidden="true" />
              <span>{t('待播')} ({queue.length})</span>
            </button>
          </div>

          {/* 3. TAB 1: 唱机与声波歌词视图 */}
          {activeTab === 'player' && (
            <div className="shijianus-music-pocket__tab-content shijianus-music-pocket__tab-content--player">
              <div className="shijianus-music-pocket__deck-showcase">
                {/* 物理黑胶转盘 */}
                <div className="shijianus-music-pocket__turntable">
                  <div className={`shijianus-music-pocket__big-disc ${isPlaying ? 'is-rotating' : ''}`}>
                    <div className="shijianus-music-pocket__big-disc-grooves" />
                    <div className="shijianus-music-pocket__big-disc-sheen" />
                    <div className="shijianus-music-pocket__big-disc-center">
                      {currentTrack?.coverUrl ? (
                        <img src={currentTrack.coverUrl} alt={currentTrack.name} />
                      ) : (
                        <Music size={26} className="shijianus-music-pocket__disc-icon" />
                      )}
                    </div>
                  </div>
                </div>

                {/* 歌曲信息与来源 */}
                <div className="shijianus-music-pocket__meta">
                  <div className="shijianus-music-pocket__title-row">
                    <strong className="shijianus-music-pocket__song-title" title={currentTrack?.name || '未知曲目'}>
                      {currentTrack ? currentTrack.name : t('暂无播放曲目')}
                    </strong>
                    {currentTrack && (
                      <span className="shijianus-music-pocket__source-tag">
                        {currentTrack.source === 'local' ? '精选本地' : currentTrack.source.toUpperCase()}
                      </span>
                    )}
                  </div>
                  <p className="shijianus-music-pocket__song-artist">
                    {currentTrack ? `${currentTrack.artist} · ${currentTrack.album || t('单曲')}` : t('请在探索页点歌或加载精选曲库')}
                  </p>
                </div>
              </div>

              {/* 16-Band 霓虹赛博声波频谱律动柱 */}
              <div className={`shijianus-music-pocket__visualizer ${isPlaying ? 'is-active' : ''}`} aria-hidden="true">
                {Array.from({ length: 16 }).map((_, idx) => (
                  <span key={idx} className={`spectrum-bar bar-${idx + 1}`} />
                ))}
              </div>

              {/* 电影级时间轴同步歌词 (支持点击跳转 Seek) */}
              <div className="shijianus-music-pocket__lyrics-viewport" ref={lyricContainerRef}>
                {parsedLyrics.length > 0 ? (
                  parsedLyrics.map((line, idx) => {
                    const isActive = idx === activeLyricIndex;
                    return (
                      <div
                        key={`${line.time}-${idx}`}
                        className={`shijianus-music-pocket__lyric-line ${isActive ? 'is-active' : ''}`}
                        onClick={() => handleLyricClick(line.time)}
                        title={t('点击跳转至该句播放')}
                      >
                        <span className="lyric-time">{formatTime(line.time)}</span>
                        <span className="lyric-text">{line.text}</span>
                      </div>
                    );
                  })
                ) : (
                  <div className="shijianus-music-pocket__lyrics-empty">
                    <Radio size={20} className="empty-icon" />
                    <p>{rawLyric || t('当前曲目暂无歌词。静心享受旋律吧。')}</p>
                  </div>
                )}
              </div>

              {/* 时间刻度与进度拖拽条 */}
              <div className="shijianus-music-pocket__scrubber">
                <span className="shijianus-music-pocket__time">{formatTime(currentTime)}</span>
                <input
                  type="range"
                  min="0"
                  max={duration || 100}
                  step="0.1"
                  value={currentTime}
                  onChange={handleSeek}
                  className="shijianus-music-pocket__seek-slider"
                  aria-label={t('播放进度')}
                />
                <span className="shijianus-music-pocket__time">{formatTime(duration)}</span>
              </div>

              {/* 核心声控播放台 */}
              <div className="shijianus-music-pocket__controls">
                <button
                  type="button"
                  className="shijianus-music-pocket__icon-btn"
                  onClick={cyclePlayMode}
                  title={playMode === 'loop' ? '列表循环' : playMode === 'single' ? '单曲循环' : '随机播放'}
                  aria-label={t('切换播放模式')}
                >
                  {playMode === 'loop' && <Repeat size={16} />}
                  {playMode === 'single' && <Repeat1 size={16} />}
                  {playMode === 'shuffle' && <Shuffle size={16} />}
                </button>

                <button
                  type="button"
                  className="shijianus-music-pocket__icon-btn"
                  onClick={() => skipTrack(-1)}
                  disabled={queue.length <= 1}
                  title={t('上一首')}
                  aria-label={t('上一首')}
                >
                  <SkipBack size={18} />
                </button>

                <button
                  type="button"
                  className="shijianus-music-pocket__play-btn"
                  onClick={togglePlay}
                  title={isPlaying ? t('暂停') : t('播放')}
                  aria-label={isPlaying ? t('暂停') : t('播放')}
                >
                  {isPlaying ? <Pause size={22} /> : <Play size={22} className="play-offset" />}
                </button>

                <button
                  type="button"
                  className="shijianus-music-pocket__icon-btn"
                  onClick={() => skipTrack(1)}
                  disabled={queue.length <= 1}
                  title={t('下一首')}
                  aria-label={t('下一首')}
                >
                  <SkipForward size={18} />
                </button>

                {/* 音量控制 */}
                <div className="shijianus-music-pocket__volume-wrapper">
                  <button
                    type="button"
                    className="shijianus-music-pocket__icon-btn"
                    onClick={() => setIsMuted((v) => !v)}
                    title={isMuted ? t('取消静音') : t('静音')}
                    aria-label={t('音量开关')}
                  >
                    {isMuted || volume === 0 ? <VolumeX size={16} /> : <Volume2 size={16} />}
                  </button>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={isMuted ? 0 : volume}
                    onChange={(e) => {
                      setVolume(parseFloat(e.target.value));
                      if (isMuted) setIsMuted(false);
                    }}
                    className="shijianus-music-pocket__volume-slider"
                    aria-label={t('音量调节')}
                  />
                </div>
              </div>
            </div>
          )}

          {/* 4. TAB 2: 探索与点歌台 */}
          {activeTab === 'search' && (
            <div className="shijianus-music-pocket__tab-content shijianus-music-pocket__tab-content--search">
              {/* 搜索控制条 */}
              <div className="shijianus-music-pocket__search-bar">
                <select
                  value={source}
                  onChange={(e) => setSource(e.target.value)}
                  className="shijianus-music-pocket__source-select"
                  aria-label={t('音源平台')}
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
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    placeholder={t('搜索歌曲、歌手或专辑...')}
                    className="shijianus-music-pocket__input"
                  />
                  {query && (
                    <button
                      type="button"
                      onClick={() => setQuery('')}
                      className="shijianus-music-pocket__input-clear"
                      aria-label={t('清空输入')}
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => handleSearch()}
                  disabled={loading || !query.trim()}
                  className="shijianus-music-pocket__search-submit"
                >
                  <Search size={14} />
                  <span>{t('检索')}</span>
                </button>
              </div>

              {/* 热门精选胶囊与随机探索 */}
              <div className="shijianus-music-pocket__quick-tags">
                <span className="shijianus-music-pocket__tags-label">
                  <Flame size={12} className="tag-icon" />
                  {t('探索灵感：')}
                </span>
                {QUICK_TAGS.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => {
                      setQuery(tag);
                      handleSearch(tag);
                    }}
                    className="shijianus-music-pocket__tag-pill"
                  >
                    {tag}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={handleRandom}
                  className="shijianus-music-pocket__tag-pill shijianus-music-pocket__tag-pill--random"
                  title={t('通过 API 随机探索高质音源')}
                >
                  <Sparkles size={11} />
                  <span>{t('随机探索')}</span>
                </button>
              </div>

              {/* 状态与错误 */}
              {loading && <div className="shijianus-music-pocket__status">🔍 {t('正在通过安全 API 检索全网高质音源...')}</div>}
              {error && <div className="shijianus-music-pocket__error">{error}</div>}

              {/* 检索结果列表 */}
              <div className="shijianus-music-pocket__results-list">
                {results.map((track, idx) => {
                  const isCurrent = currentTrack?.id === track.id;
                  return (
                    <div
                      key={`${track.id}-${idx}`}
                      className={`shijianus-music-pocket__track-card ${isCurrent ? 'is-current' : ''}`}
                    >
                      <div className="shijianus-music-pocket__track-cover-box">
                        {track.coverUrl ? (
                          <img src={track.coverUrl} alt="" className="track-cover-img" />
                        ) : (
                          <Music size={16} className="track-cover-fallback" />
                        )}
                        {isCurrent && isPlaying && (
                          <div className="track-playing-badge">
                            <span />
                            <span />
                            <span />
                          </div>
                        )}
                      </div>

                      <div className="shijianus-music-pocket__track-info">
                        <strong className="shijianus-music-pocket__track-name">{track.name}</strong>
                        <small className="shijianus-music-pocket__track-artist">
                          {track.artist} · {track.album || t('未知专辑')}
                        </small>
                      </div>

                      <div className="shijianus-music-pocket__track-actions">
                        <button
                          type="button"
                          onClick={() => addTrack(track, true)}
                          className="shijianus-music-pocket__action-btn shijianus-music-pocket__action-btn--play"
                          title={t('立即播放')}
                        >
                          <Play size={13} />
                          <span>{t('播放')}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => addTrack(track, false)}
                          className="shijianus-music-pocket__action-btn shijianus-music-pocket__action-btn--queue"
                          title={t('加入待播队列')}
                        >
                          <Plus size={13} />
                          <span>{t('待播')}</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 5. TAB 3: 待播队列 */}
          {activeTab === 'queue' && (
            <div className="shijianus-music-pocket__tab-content shijianus-music-pocket__tab-content--queue">
              <div className="shijianus-music-pocket__queue-header">
                <span>{t('播放序列清单')} ({queue.length} 首)</span>
                {queue.length > 0 && (
                  <button
                    type="button"
                    onClick={clearQueue}
                    className="shijianus-music-pocket__clear-queue-btn"
                    title={t('清空全部待播曲目')}
                  >
                    <Trash2 size={12} />
                    <span>{t('清空')}</span>
                  </button>
                )}
              </div>

              <div className="shijianus-music-pocket__queue-list">
                {queue.length > 0 ? (
                  queue.map((track, idx) => {
                    const isActive = idx === currentIndex;
                    return (
                      <div
                        key={`${track.id}-${idx}`}
                        className={`shijianus-music-pocket__queue-item ${isActive ? 'is-active' : ''}`}
                        onClick={() => playTrack(idx)}
                      >
                        <div className="shijianus-music-pocket__queue-item-left">
                          {isActive && isPlaying ? (
                            <div className="shijianus-music-pocket__mini-eq" aria-hidden="true">
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
                          onClick={(e) => removeTrack(idx, e)}
                          className="shijianus-music-pocket__remove-btn"
                          title={t('从待播队列中移除')}
                          aria-label={t('移除')}
                        >
                          <X size={14} />
                        </button>
                      </div>
                    );
                  })
                ) : (
                  <div className="shijianus-music-pocket__queue-empty">
                    <ListMusic size={32} className="empty-icon" />
                    <p>{t('待播队列空空如也。')}</p>
                    <button
                      type="button"
                      onClick={loadInitialPlaylist}
                      className="shijianus-music-pocket__btn-primary"
                    >
                      <Sparkles size={14} />
                      <span>{t('加载精选曲库')}</span>
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
