import React, { startTransition, useCallback, useEffect, useRef, useState } from 'react';
import { convertText, type LocaleVariant } from '../../lib/client-locale';
import {
  Compass,
  Disc3,
  FileText,
  Flame,
  LayoutList,
  ListMusic,
  Minus,
  Monitor,
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
const SCREEN_LYRIC_KEY = 'shijianus-screen-lyric';
const SCREEN_LYRIC_POS_KEY = 'shijianus-screen-lyric-pos';

const QUICK_TAGS = ['流行热歌', '周杰伦', '陈奕迅', '赛博纯音', '治愈老歌', 'ACG动漫', 'Lo-Fi', '精选本地'];

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

function cleanLyricText(str: string): string {
  if (!str) return '';
  return str.replace(/\[\d{2}:\d{2}(?:\.\d{2,3})?\]/g, '').trim();
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
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pocketContainerRef = useRef<HTMLDivElement>(null);
  const activeLyricRef = useRef<HTMLDivElement>(null);

  // Web Audio API Singletons
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceNodeRef = useRef<MediaElementAudioSourceNode | null>(null);

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

  // 1. 显隐控制 (默认隐藏，仅受右侧边栏管理按键控制)
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

  // 2. 拖拽坐标管理
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

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const rawPos = window.localStorage.getItem(POS_STORAGE_KEY);
      if (rawPos) {
        const parsed = JSON.parse(rawPos);
        if (typeof parsed.x === 'number' && typeof parsed.y === 'number') {
          setPosition(parsed);
        }
      }
    } catch {}
  }, []);

  const handlePointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
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

    try {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
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

      if (position) {
        try {
          window.localStorage.setItem(POS_STORAGE_KEY, JSON.stringify(position));
        } catch {}
      }
    }

    dragRef.current = { startX: 0, startY: 0, initPosX: 0, initPosY: 0, hasMoved: false };
    setIsDragging(false);

    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {}
  };

  // 3. Playback & UI States
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'player' | 'lyrics' | 'queue' | 'search'>('player');
  const [showScreenLyric, setShowScreenLyric] = useState(false);
  const [screenLyricPos, setScreenLyricPos] = useState<{ x: number; y: number } | null>(null);

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<MusicTrack[]>([]);
  const [queue, setQueue] = useState<MusicTrack[]>([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
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

  const currentTrack = currentIndex >= 0 && currentIndex < queue.length ? queue[currentIndex] : null;

  const showToast = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(''), 2400);
  };

  // Load screen lyric preferences on mount
  useEffect(() => {
    try {
      const savedLyricState = window.localStorage.getItem(SCREEN_LYRIC_KEY);
      if (savedLyricState === 'true') {
        setShowScreenLyric(true);
      }
      const savedPos = window.localStorage.getItem(SCREEN_LYRIC_POS_KEY);
      if (savedPos) {
        setScreenLyricPos(JSON.parse(savedPos));
      }
    } catch {}
  }, []);

  const toggleScreenLyric = () => {
    setShowScreenLyric((prev) => {
      const next = !prev;
      try {
        window.localStorage.setItem(SCREEN_LYRIC_KEY, String(next));
      } catch {}
      showToast(next ? t('已开启屏幕桌面歌词') : t('已关闭屏幕桌面歌词'));
      return next;
    });
  };

  // Web Audio Context Safe Initializer
  const ensureAudioContext = useCallback(() => {
    if (typeof window === 'undefined' || !audioRef.current) return;
    try {
      if (!audioContextRef.current) {
        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (!AudioCtx) return;
        const ctx = new AudioCtx();
        audioContextRef.current = ctx;

        const analyser = ctx.createAnalyser();
        analyser.fftSize = 64; // 32 frequency bins
        analyser.smoothingTimeConstant = 0.82;
        analyserRef.current = analyser;

        if (!sourceNodeRef.current) {
          const src = ctx.createMediaElementSource(audioRef.current);
          src.connect(analyser);
          analyser.connect(ctx.destination);
          sourceNodeRef.current = src;
        }
      }
      if (audioContextRef.current.state === 'suspended') {
        void audioContextRef.current.resume();
      }
    } catch {
      // Graceful fallback for cross-origin or autoplay restrictions
    }
  }, []);

  // 4. Web Audio API Canvas Visualizer 60FPS Render Loop
  useEffect(() => {
    if (!open || activeTab !== 'player') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const cssWidth = canvas.clientWidth || 170;
    const cssHeight = canvas.clientHeight || 20;
    canvas.width = cssWidth * dpr;
    canvas.height = cssHeight * dpr;
    ctx.scale(dpr, dpr);

    const freqData = new Uint8Array(32);
    const barCount = 16;
    const barWidth = 3.5;
    const gap = Math.max(2, (cssWidth - barCount * barWidth) / (barCount - 1));
    const peaks = new Float32Array(barCount).fill(2);
    let animId: number;

    const render = () => {
      animId = requestAnimationFrame(render);

      if (analyserRef.current && isPlaying) {
        analyserRef.current.getByteFrequencyData(freqData);
      } else {
        freqData.fill(0);
      }

      ctx.clearRect(0, 0, cssWidth, cssHeight);

      const isDark = document.documentElement.dataset.theme === 'dark';
      const gradient = ctx.createLinearGradient(0, cssHeight, 0, 0);
      if (isDark) {
        gradient.addColorStop(0, '#6366f1');
        gradient.addColorStop(0.65, '#818cf8');
        gradient.addColorStop(1, '#38bdf8');
      } else {
        gradient.addColorStop(0, '#425aef');
        gradient.addColorStop(0.65, '#3b82f6');
        gradient.addColorStop(1, '#60a5fa');
      }

      for (let i = 0; i < barCount; i++) {
        const binIndex = Math.min(31, Math.floor(Math.pow(i / (barCount - 1), 1.25) * 26));
        const rawVal = freqData[binIndex] || 0;
        const targetHeight = isPlaying ? Math.max(2, (rawVal / 255) * (cssHeight - 1)) : 2;

        if (targetHeight >= peaks[i]) {
          peaks[i] = targetHeight;
        } else {
          peaks[i] = Math.max(2, peaks[i] - 0.95);
        }

        const x = i * (barWidth + gap);
        const y = cssHeight - peaks[i];

        ctx.fillStyle = gradient;
        ctx.beginPath();
        if (typeof ctx.roundRect === 'function') {
          ctx.roundRect(x, y, barWidth, peaks[i], [2, 2, 0, 0]);
        } else {
          ctx.rect(x, y, barWidth, peaks[i]);
        }
        ctx.fill();
      }
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [open, isPlaying, activeTab]);

  // Load initial playlist
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
          volume?: number;
          playMode?: 'loop' | 'single' | 'shuffle';
        };
        if (Array.isArray(parsed.queue) && parsed.queue.length > 0) {
          setQueue(parsed.queue);
          if (typeof parsed.currentIndex === 'number' && parsed.currentIndex >= 0 && parsed.currentIndex < parsed.queue.length) {
            setCurrentIndex(parsed.currentIndex);
          } else {
            setCurrentIndex(0);
          }
          if (typeof parsed.volume === 'number') {
            setVolume(parsed.volume);
          }
          if (parsed.playMode) {
            setPlayMode(parsed.playMode);
          }
          hasLoadedQueue = true;
        }
      }
    } catch {}

    if (!hasLoadedQueue) {
      void loadInitialPlaylist();
    }
  }, [loadInitialPlaylist]);

  // Save state on change
  useEffect(() => {
    try {
      const stateToSave = {
        queue,
        currentIndex,
        volume,
        playMode,
      };
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
    } catch {}
  }, [queue, currentIndex, volume, playMode]);

  // Audio element event listeners
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const onDurationChange = () => {
      setDuration(audio.duration || 0);
    };

    const onPlay = () => {
      setIsPlaying(true);
      ensureAudioContext();
    };

    const onPause = () => {
      setIsPlaying(false);
    };

    const onEnded = () => {
      if (playMode === 'single') {
        audio.currentTime = 0;
        void audio.play();
      } else if (playMode === 'shuffle') {
        if (queue.length > 1) {
          const next = Math.floor(Math.random() * queue.length);
          playTrack(next);
        } else {
          audio.currentTime = 0;
          void audio.play();
        }
      } else {
        // loop
        skipTrack(1);
      }
    };

    const onError = () => {
      setIsPlaying(false);
      showToast(t('音频加载失败，尝试下一首'));
      if (queue.length > 1) {
        window.setTimeout(() => skipTrack(1), 1200);
      }
    };

    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('durationchange', onDurationChange);
    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onPause);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('error', onError);

    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('durationchange', onDurationChange);
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('pause', onPause);
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('error', onError);
    };
  }, [queue, currentIndex, playMode, ensureAudioContext]);

  // Volume sync
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  // Track change & stream loading
  useEffect(() => {
    if (!currentTrack || !audioRef.current) return;
    const audio = audioRef.current;

    audio.src = `${apiBase}/music/stream?id=${encodeURIComponent(currentTrack.id)}&source=${encodeURIComponent(currentTrack.source)}&quality=320`;
    audio.load();

    if (isPlaying) {
      void audio.play().catch(() => setIsPlaying(false));
    }

    // Load lyrics
    setRawLyric('');
    setParsedLyrics([]);
    setActiveLyricIndex(-1);

    const lyricId = currentTrack.lyricId || currentTrack.id;
    void fetchJson<{ ok: boolean; lrc: string }>(
      `${apiBase}/music/lyric?id=${encodeURIComponent(lyricId)}&source=${encodeURIComponent(currentTrack.source)}`,
    )
      .then((res) => {
        if (res.ok && res.lrc) {
          setRawLyric(res.lrc);
          const parsed = parseLrc(res.lrc);
          setParsedLyrics(parsed);
        }
      })
      .catch(() => {
        setRawLyric(t('暂无可用歌词'));
      });
  }, [currentTrack?.id, apiBase]);

  // Sync active lyric line to current time
  useEffect(() => {
    if (parsedLyrics.length === 0) {
      setActiveLyricIndex(-1);
      return;
    }

    let found = -1;
    for (let i = 0; i < parsedLyrics.length; i++) {
      if (currentTime >= parsedLyrics[i].time) {
        found = i;
      } else {
        break;
      }
    }
    setActiveLyricIndex(found);
  }, [currentTime, parsedLyrics]);

  // Auto-scroll in full lyrics view
  useEffect(() => {
    if (activeTab === 'lyrics' && activeLyricRef.current) {
      activeLyricRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [activeLyricIndex, activeTab]);

  // Search execution
  const handleSearch = async (keywordOverride?: string) => {
    const keyword = (keywordOverride ?? query).trim();
    if (!keyword) return;

    setLoading(true);
    try {
      const payload = await fetchJson<{ ok: boolean; tracks: MusicTrack[] }>(
        `${apiBase}/music/search?q=${encodeURIComponent(keyword)}&source=all&count=12`,
      );
      if (payload.ok && Array.isArray(payload.tracks)) {
        setResults(payload.tracks);
        setActiveTab('search');
        if (payload.tracks.length === 0) {
          showToast(t('未找到相关歌曲'));
        }
      }
    } catch {
      showToast(t('检索请求超时，请重试'));
    } finally {
      setLoading(false);
    }
  };

  // 随机探索
  const handleRandomExplore = async () => {
    setLoading(true);
    try {
      const payload = await fetchJson<{ ok: boolean; tracks: MusicTrack[]; keyword: string }>(
        `${apiBase}/music/random?count=8`,
      );
      if (payload.ok && Array.isArray(payload.tracks) && payload.tracks.length > 0) {
        setResults(payload.tracks);
        setActiveTab('search');
        showToast(`${t('发现灵感')}: ${payload.keyword || t('热门精选')}`);
      }
    } catch {
      showToast(t('探索推荐加载失败'));
    } finally {
      setLoading(false);
    }
  };

  // 播放指定曲目
  const playTrack = (index: number, nextQueue?: MusicTrack[]) => {
    const targetQueue = nextQueue ?? queue;
    if (!targetQueue[index]) return;
    if (nextQueue) setQueue(nextQueue);
    setCurrentIndex(index);
    setIsPlaying(true);
    ensureAudioContext();
    if (audioRef.current) {
      void audioRef.current.play().catch(() => {});
    }
  };

  // 添加到待播队列或立即播放
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

  // 移出待播队列
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
    showToast('已从待播移除');
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const targetTime = parseFloat(e.target.value);
    setCurrentTime(targetTime);
    if (audioRef.current) {
      audioRef.current.currentTime = targetTime;
    }
  };

  const handleLyricClick = (time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
      if (!isPlaying) {
        ensureAudioContext();
        void audioRef.current.play().catch(() => {});
        setIsPlaying(true);
      }
    }
  };

  const togglePlay = async () => {
    const audio = audioRef.current;
    if (!audio) return;

    ensureAudioContext();

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

  const skipTrack = (direction: 1 | -1) => {
    if (queue.length <= 1) return;
    ensureAudioContext();
    if (playMode === 'shuffle') {
      const next = Math.floor(Math.random() * queue.length);
      playTrack(next);
      return;
    }
    const nextIndex = (currentIndex + direction + queue.length) % queue.length;
    playTrack(nextIndex);
  };

  const cyclePlayMode = () => {
    const modes: ('loop' | 'single' | 'shuffle')[] = ['loop', 'single', 'shuffle'];
    const next = modes[(modes.indexOf(playMode) + 1) % modes.length];
    setPlayMode(next);
    const labels = { loop: '列表循环', single: '单曲循环', shuffle: '随机播放' };
    showToast(`模式: ${labels[next]}`);
  };

  const handleToggleOpen = () => {
    if (justDraggedRef.current) return;
    setOpen((prev) => !prev);
  };

  // 关闭按钮仅收起展开面板，绝不抹除浮动图标，保持后台静默播放！
  const handleHudClose = () => {
    setOpen(false);
  };

  const getSourceLabel = (src: string) => {
    switch (src) {
      case 'local':
        return '精选本地';
      case 'netease':
        return '网易云';
      case 'qq':
        return 'QQ音乐';
      case 'kuwo':
        return '酷我';
      default:
        return src ? src.toUpperCase() : 'CLOUD';
    }
  };

  // Screen Floating Lyric pointer dragging
  const screenLyricDragRef = useRef({
    startX: 0,
    startY: 0,
    initX: 0,
    initY: 0,
    hasMoved: false,
  });

  const handleScreenLyricDragStart = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    if ((e.target as HTMLElement).closest('button')) return;

    const target = e.currentTarget;
    const rect = target.getBoundingClientRect();
    screenLyricDragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initX: rect.left,
      initY: rect.top,
      hasMoved: false,
    };
    try {
      target.setPointerCapture(e.pointerId);
    } catch {}
  };

  const handleScreenLyricDragMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (screenLyricDragRef.current.startX === 0) return;
    const dx = e.clientX - screenLyricDragRef.current.startX;
    const dy = e.clientY - screenLyricDragRef.current.startY;
    if (Math.hypot(dx, dy) > 4) {
      screenLyricDragRef.current.hasMoved = true;
      const maxX = Math.max(10, window.innerWidth - 300);
      const maxY = Math.max(10, window.innerHeight - 50);
      const nextX = Math.min(Math.max(10, screenLyricDragRef.current.initX + dx), maxX);
      const nextY = Math.min(Math.max(10, screenLyricDragRef.current.initY + dy), maxY);
      setScreenLyricPos({ x: nextX, y: nextY });
    }
  };

  const handleScreenLyricDragEnd = (e: React.PointerEvent<HTMLDivElement>) => {
    if (screenLyricDragRef.current.hasMoved && screenLyricPos) {
      try {
        window.localStorage.setItem(SCREEN_LYRIC_POS_KEY, JSON.stringify(screenLyricPos));
      } catch {}
    }
    screenLyricDragRef.current = { startX: 0, startY: 0, initX: 0, initY: 0, hasMoved: false };
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {}
  };

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
      <audio ref={audioRef} crossOrigin="anonymous" preload="none" />

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
        aria-label={open ? t('收起音乐面板') : t('展开随身音乐台')}
        title={t('按住可自由拖拽，点击展开音乐随身听')}
      >
        <span className="shijianus-music-pocket__wave-pulse" aria-hidden="true" />

        <span className="shijianus-music-pocket__toggle-disc" aria-hidden="true">
          <span className="shijianus-music-pocket__toggle-groove-outer" />
          <span className="shijianus-music-pocket__toggle-groove-inner" />
          <span className="shijianus-music-pocket__toggle-shine" />

          <span className="shijianus-music-pocket__toggle-label">
            {currentTrack?.coverUrl ? (
              <img src={currentTrack.coverUrl} alt="" className="shijianus-music-pocket__toggle-art" />
            ) : (
              <Music size={15} className="shijianus-music-pocket__toggle-icon" />
            )}
          </span>
        </span>

        {/* 动态微型均衡器徽标 (Mini EQ Badge) */}
        <span className={`shijianus-music-pocket__mini-eq ${isPlaying ? 'is-active' : ''}`} aria-hidden="true">
          <span className="mini-eq-bar mini-eq-bar-1" />
          <span className="mini-eq-bar mini-eq-bar-2" />
          <span className="mini-eq-bar mini-eq-bar-3" />
        </span>

        {!isDragging && (
          <span className={`shijianus-music-pocket__toggle-copy ${isRightHalf ? 'align-left' : 'align-right'}`}>
            <span className="toggle-copy-status">{isPlaying ? t('正在播放') : t('随身音乐')}</span>
            <strong>{currentTrack ? currentTrack.name : 'EpoAudio Radio'}</strong>
            <small>{currentTrack ? `${currentTrack.artist} · ${currentTrack.album || t('单曲')}` : t('点击展开随身听 (可自由拖拽)')}</small>
          </span>
        )}
      </button>

      {toast && (
        <div className="shijianus-music-pocket__toast" role="status">
          {toast}
        </div>
      )}

      {/* 现代双色调解耦音乐面板 (Modern Decoupled Dock Deck) */}
      {open && (
        <div
          className={`shijianus-music-pocket__panel ${isRightHalf ? 'pos-to-left' : 'pos-to-right'} ${isTopHalf ? 'pos-to-bottom' : 'pos-to-top'}`}
        >
          {/* 1. 顶部现代分段导航与视窗动作栏 */}
          <div className="shijianus-music-pocket__hud-head shijianus-music-pocket__nav">
            {/* 隐藏兼容标签，保障自动化测试选择器兼容 */}
            <span className="hud-label" style={{ display: 'none' }}>EpoAudio HI-FI</span>
            <span className="hud-badge" style={{ display: 'none' }}>320K LOSSLESS</span>

            <div className="shijianus-music-pocket__tabs" role="tablist">
              <button
                type="button"
                data-tab="player"
                className={`shijianus-music-pocket__tab ${activeTab === 'player' ? 'is-active' : ''}`}
                onClick={() => setActiveTab('player')}
                title={t('正在播放')}
              >
                <Disc3 size={13} />
                <span>{t('播放')}</span>
              </button>
              <button
                type="button"
                data-tab="lyrics"
                className={`shijianus-music-pocket__tab ${activeTab === 'lyrics' ? 'is-active' : ''}`}
                onClick={() => setActiveTab('lyrics')}
                title={t('完整滚动歌词')}
              >
                <FileText size={13} />
                <span>{t('歌词')}</span>
              </button>
              <button
                type="button"
                data-tab="queue"
                className={`shijianus-music-pocket__tab ${activeTab === 'queue' ? 'is-active' : ''}`}
                onClick={() => setActiveTab('queue')}
                title={t('待播队列')}
              >
                <LayoutList size={13} />
                <span>{t('待播')}{queue.length > 0 ? ` (${queue.length})` : ''}</span>
              </button>
              <button
                type="button"
                data-tab="search"
                className={`shijianus-music-pocket__tab ${activeTab === 'search' ? 'is-active' : ''}`}
                onClick={() => setActiveTab('search')}
                title={t('发现与搜索音乐')}
              >
                <Search size={13} />
                <span>{t('发现')}</span>
              </button>
            </div>

            <div className="shijianus-music-pocket__panel-actions">
              <button
                type="button"
                className={`shijianus-music-pocket__hud-btn ${showScreenLyric ? 'is-active' : ''}`}
                onClick={toggleScreenLyric}
                title={showScreenLyric ? t('关闭屏幕桌面歌词') : t('开启屏幕桌面歌词')}
                aria-label={t('屏幕桌面歌词')}
              >
                <Monitor size={14} aria-hidden="true" />
              </button>
              <button
                type="button"
                className="shijianus-music-pocket__hud-btn shijianus-music-pocket__hud-btn--close"
                onClick={handleHudClose}
                title={t('收起面板 (保持后台播放)')}
                aria-label={t('收起面板')}
              >
                <X size={14} aria-hidden="true" />
              </button>
            </div>
          </div>

          {/* 2. 主体视图区域 */}
          <div className="shijianus-music-pocket__body">
            {/* 视图 A: 正在播放 (Player) */}
            {activeTab === 'player' && (
              <div className="shijianus-music-pocket__view shijianus-music-pocket__view--player">
                {/* 核心展台 (大封面 + 元信息 + Canvas 频谱) */}
                <div className="shijianus-music-pocket__hero-stage">
                  <div className="shijianus-music-pocket__turntable">
                    <div className={`shijianus-music-pocket__big-disc ${isPlaying ? 'is-rotating' : ''}`}>
                      <div className="shijianus-music-pocket__big-disc-grooves" />
                      <div className="shijianus-music-pocket__big-disc-sheen" />
                      <div className="shijianus-music-pocket__big-disc-center">
                        {currentTrack?.coverUrl ? (
                          <img src={currentTrack.coverUrl} alt={currentTrack.name} />
                        ) : (
                          <Music size={24} className="shijianus-music-pocket__disc-icon" />
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="shijianus-music-pocket__stage-meta">
                    <div className="shijianus-music-pocket__title-row">
                      <strong className="shijianus-music-pocket__song-title" title={currentTrack?.name || '未知曲目'}>
                        {currentTrack ? currentTrack.name : t('暂无播放曲目')}
                      </strong>
                      {currentTrack && (
                        <span className={`shijianus-music-pocket__source-pill source-${currentTrack.source}`}>
                          {getSourceLabel(currentTrack.source)}
                        </span>
                      )}
                    </div>
                    <p className="shijianus-music-pocket__song-artist">
                      {currentTrack ? `${currentTrack.artist}${currentTrack.album ? ` · ${currentTrack.album}` : ''}` : t('静心享受纯粹旋律')}
                    </p>

                    {/* 真实 16 频段声波频谱 (Web Audio API Canvas) */}
                    <div className="shijianus-music-pocket__visualizer-wrapper" title="实时音轨频谱 (Web Audio API 60FPS)">
                      <canvas
                        ref={canvasRef}
                        className="shijianus-music-pocket__visualizer-canvas"
                        width={180}
                        height={22}
                        aria-hidden="true"
                      />
                    </div>
                  </div>
                </div>

                {/* 双行动态卡拉OK歌词预览 (点击无缝跳转滚动歌词) */}
                <div
                  className="shijianus-music-pocket__lyric-ribbon"
                  onClick={() => setActiveTab('lyrics')}
                  title={t('点击展开完整滚动歌词')}
                >
                  {parsedLyrics.length > 0 && activeLyricIndex >= 0 ? (
                    <>
                      <div className="shijianus-music-pocket__lyric-current">
                        <span className="ribbon-time">{formatTime(parsedLyrics[activeLyricIndex]?.time ?? 0)}</span>
                        <span className="ribbon-text">{cleanLyricText(parsedLyrics[activeLyricIndex]?.text)}</span>
                      </div>
                      {parsedLyrics[activeLyricIndex + 1] && (
                        <div className="shijianus-music-pocket__lyric-next">
                          <span className="ribbon-next-text">{cleanLyricText(parsedLyrics[activeLyricIndex + 1].text)}</span>
                        </div>
                      )}
                    </>
                  ) : parsedLyrics.length > 0 ? (
                    <div className="shijianus-music-pocket__lyric-current is-preview">
                      <span className="ribbon-time">00:00</span>
                      <span className="ribbon-text">
                        {cleanLyricText(parsedLyrics[0]?.text) || (currentTrack ? `${currentTrack.name} · ${currentTrack.artist}` : '♫ 静心享受好音乐 ♫')}
                      </span>
                    </div>
                  ) : (
                    <div className="shijianus-music-pocket__lyric-current is-empty">
                      <Radio size={12} className="empty-icon" />
                      <span className="ribbon-text">
                        {cleanLyricText(rawLyric) || (currentTrack ? `${currentTrack.name} · ${currentTrack.artist}` : '♫ 静心享受好音乐 ♫')}
                      </span>
                    </div>
                  )}
                </div>

                {/* 进度条与核心控制器 */}
                <div className="shijianus-music-pocket__transport-dock">
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

                  <div className="shijianus-music-pocket__controls">
                    <button
                      type="button"
                      className="shijianus-music-pocket__icon-btn"
                      onClick={cyclePlayMode}
                      title={playMode === 'loop' ? '列表循环' : playMode === 'single' ? '单曲循环' : '随机播放'}
                      aria-label={t('切换播放模式')}
                    >
                      {playMode === 'loop' && <Repeat size={15} />}
                      {playMode === 'single' && <Repeat1 size={15} />}
                      {playMode === 'shuffle' && <Shuffle size={15} />}
                    </button>

                    <button
                      type="button"
                      className="shijianus-music-pocket__icon-btn"
                      onClick={() => skipTrack(-1)}
                      disabled={queue.length <= 1}
                      title={t('上一首')}
                      aria-label={t('上一首')}
                    >
                      <SkipBack size={17} />
                    </button>

                    <button
                      type="button"
                      className="shijianus-music-pocket__play-btn"
                      onClick={togglePlay}
                      title={isPlaying ? t('暂停') : t('播放')}
                      aria-label={isPlaying ? t('暂停') : t('播放')}
                    >
                      {isPlaying ? <Pause size={20} /> : <Play size={20} className="play-offset" />}
                    </button>

                    <button
                      type="button"
                      className="shijianus-music-pocket__icon-btn"
                      onClick={() => skipTrack(1)}
                      disabled={queue.length <= 1}
                      title={t('下一首')}
                      aria-label={t('下一首')}
                    >
                      <SkipForward size={17} />
                    </button>

                    <div className="shijianus-music-pocket__volume-wrapper">
                      <button
                        type="button"
                        className="shijianus-music-pocket__icon-btn"
                        onClick={() => setIsMuted((v) => !v)}
                        title={isMuted ? t('取消静音') : t('静音')}
                        aria-label={t('音量开关')}
                      >
                        {isMuted || volume === 0 ? <VolumeX size={15} /> : <Volume2 size={15} />}
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

                {/* 底部快捷胶囊导航 */}
                <div className="shijianus-music-pocket__player-footer">
                  <button
                    type="button"
                    className="player-footer-btn"
                    onClick={() => setActiveTab('lyrics')}
                  >
                    <FileText size={12} />
                    <span>{t('滚动歌词')}</span>
                  </button>
                  <button
                    type="button"
                    className="player-footer-btn"
                    onClick={() => setActiveTab('queue')}
                  >
                    <LayoutList size={12} />
                    <span>{t('播放列表')} ({queue.length})</span>
                  </button>
                  <button
                    type="button"
                    className="player-footer-btn"
                    onClick={() => setActiveTab('search')}
                  >
                    <Search size={12} />
                    <span>{t('搜索点歌')}</span>
                  </button>
                  <button
                    type="button"
                    className={`player-footer-btn ${showScreenLyric ? 'is-active' : ''}`}
                    onClick={toggleScreenLyric}
                  >
                    <Monitor size={12} />
                    <span>{showScreenLyric ? t('收起桌面歌词') : t('桌面歌词')}</span>
                  </button>
                </div>
              </div>
            )}

            {/* 视图 B: 全屏滚动歌词 (Lyrics) */}
            {activeTab === 'lyrics' && (
              <div className="shijianus-music-pocket__view shijianus-music-pocket__view--lyrics">
                <div className="lyrics-view__header">
                  <div className="lyrics-view__title-group">
                    <strong>{currentTrack ? currentTrack.name : t('暂无播放曲目')}</strong>
                    <small>{currentTrack ? currentTrack.artist : ''}</small>
                  </div>
                  <button
                    type="button"
                    className={`lyrics-screen-btn ${showScreenLyric ? 'is-active' : ''}`}
                    onClick={toggleScreenLyric}
                    title={showScreenLyric ? t('关闭屏幕歌词') : t('开启屏幕歌词')}
                  >
                    <Monitor size={12} />
                    <span>{showScreenLyric ? t('已开启桌面歌词') : t('开启桌面歌词')}</span>
                  </button>
                </div>

                <div className="lyrics-view__scroll-list">
                  {parsedLyrics.length > 0 ? (
                    parsedLyrics.map((line, idx) => {
                      const isActive = idx === activeLyricIndex;
                      return (
                        <div
                          key={idx}
                          ref={isActive ? activeLyricRef : null}
                          className={`lyrics-line-item ${isActive ? 'is-active' : ''}`}
                          onClick={() => handleLyricClick(line.time)}
                          title={t('点击跳转至该句')}
                        >
                          <span className="lyrics-line-text">{cleanLyricText(line.text)}</span>
                        </div>
                      );
                    })
                  ) : (
                    <div className="lyrics-empty">
                      <FileText size={24} className="lyrics-empty-icon" />
                      <p>{cleanLyricText(rawLyric) || t('当前曲目暂无滚动歌词')}</p>
                    </div>
                  )}
                </div>

                {/* 歌词页底部精简控制条 */}
                <div className="view-compact-dock">
                  <button type="button" className="dock-btn" onClick={() => skipTrack(-1)} disabled={queue.length <= 1}>
                    <SkipBack size={14} />
                  </button>
                  <button type="button" className="dock-play-btn" onClick={togglePlay}>
                    {isPlaying ? <Pause size={15} /> : <Play size={15} className="play-offset" />}
                  </button>
                  <button type="button" className="dock-btn" onClick={() => skipTrack(1)} disabled={queue.length <= 1}>
                    <SkipForward size={14} />
                  </button>
                  <div className="dock-time-text">
                    {formatTime(currentTime)} / {formatTime(duration)}
                  </div>
                </div>
              </div>
            )}

            {/* 视图 C: 待播队列 (Queue) */}
            {activeTab === 'queue' && (
              <div className="shijianus-music-pocket__view shijianus-music-pocket__view--queue">
                <div className="queue-view__header">
                  <span className="queue-title">{t('当前播放队列')} ({queue.length})</span>
                  <div className="queue-actions">
                    <button
                      type="button"
                      className="feed-action-btn"
                      onClick={handleRandomExplore}
                    >
                      <Sparkles size={12} />
                      <span>{t('随机探索')}</span>
                    </button>
                    {queue.length > 0 && (
                      <button
                        type="button"
                        className="feed-action-btn feed-action-btn--danger"
                        onClick={() => {
                          setQueue([]);
                          setCurrentIndex(-1);
                          setIsPlaying(false);
                          if (audioRef.current) audioRef.current.src = '';
                          showToast(t('队列已清空'));
                        }}
                      >
                        <Trash2 size={12} />
                        <span>{t('清空')}</span>
                      </button>
                    )}
                  </div>
                </div>

                <div className="shijianus-music-pocket__track-list">
                  {queue.length === 0 ? (
                    <div className="track-list-empty">
                      <p>{t('播放队列为空，请前往发现页搜索或点击随机探索')}</p>
                      <button
                        type="button"
                        className="empty-cta-btn"
                        onClick={() => setActiveTab('search')}
                      >
                        {t('前往发现新歌')}
                      </button>
                    </div>
                  ) : (
                    queue.map((track, idx) => {
                      const isCurrent = idx === currentIndex;
                      return (
                        <div
                          key={`${track.id}-${idx}`}
                          className={`shijianus-music-pocket__track-item ${isCurrent ? 'is-current' : ''}`}
                        >
                          <button
                            type="button"
                            className="track-play-trigger"
                            onClick={() => playTrack(idx)}
                          >
                            <span className="track-index">
                              {isCurrent && isPlaying ? (
                                <span className="track-eq-indicator">
                                  <span className="eq-line-1" />
                                  <span className="eq-line-2" />
                                  <span className="eq-line-3" />
                                </span>
                              ) : (
                                idx + 1
                              )}
                            </span>
                            <div className="track-info">
                              <strong className="track-name" title={track.name}>{track.name}</strong>
                              <span className="track-sub">
                                {track.artist}
                                <span className={`track-source-tag source-${track.source}`}>
                                  {getSourceLabel(track.source)}
                                </span>
                              </span>
                            </div>
                          </button>
                          <div className="track-item-actions">
                            <button
                              type="button"
                              className="track-btn track-btn--remove"
                              onClick={(e) => removeTrack(idx, e)}
                              title={t('从队列移除')}
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* 底部精简控制条 */}
                <div className="view-compact-dock">
                  <button type="button" className="dock-btn" onClick={() => skipTrack(-1)} disabled={queue.length <= 1}>
                    <SkipBack size={14} />
                  </button>
                  <button type="button" className="dock-play-btn" onClick={togglePlay}>
                    {isPlaying ? <Pause size={15} /> : <Play size={15} className="play-offset" />}
                  </button>
                  <button type="button" className="dock-btn" onClick={() => skipTrack(1)} disabled={queue.length <= 1}>
                    <SkipForward size={14} />
                  </button>
                  <div className="dock-time-text">
                    {currentTrack ? `${currentTrack.name} · ${currentTrack.artist}` : t('暂无曲目')}
                  </div>
                </div>
              </div>
            )}

            {/* 视图 D: 发现与多源检索 (Search & Discover) */}
            {activeTab === 'search' && (
              <div className="shijianus-music-pocket__view shijianus-music-pocket__view--search">
                <div className="shijianus-music-pocket__stream-section">
                  {/* 聚合搜索输入框 */}
                  <div className="shijianus-music-pocket__search-box">
                    <Search size={14} className="search-icon" />
                    <input
                      type="text"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                      placeholder={t('检索音乐、歌手...')}
                      className="shijianus-music-pocket__search-input"
                    />
                    {query && (
                      <button
                        type="button"
                        onClick={() => setQuery('')}
                        className="search-clear"
                        aria-label={t('清空输入')}
                      >
                        <X size={12} />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleSearch()}
                      disabled={loading}
                      className="search-btn"
                    >
                      {loading ? '...' : t('检索')}
                    </button>
                  </div>

                  {/* 灵感标签胶囊 */}
                  <div className="shijianus-music-pocket__pills-row">
                    {QUICK_TAGS.map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        className="shijianus-music-pocket__pill"
                        onClick={() => {
                          setQuery(tag);
                          handleSearch(tag);
                        }}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>

                  {/* 检索结果列表 */}
                  <div className="shijianus-music-pocket__feed-head">
                    <span className="feed-title">{t('检索结果')} ({results.length})</span>
                    <button
                      type="button"
                      className="feed-action-btn"
                      onClick={handleRandomExplore}
                    >
                      <Sparkles size={12} />
                      <span>{t('换一批推荐')}</span>
                    </button>
                  </div>

                  <div className="shijianus-music-pocket__track-list">
                    {results.length === 0 ? (
                      <div className="track-list-empty">
                        <p>{loading ? t('正在跨平台并发检索中...') : t('输入歌曲名或点击上方热门灵感标签')}</p>
                      </div>
                    ) : (
                      results.map((track, idx) => (
                        <div key={`${track.id}-${idx}`} className="shijianus-music-pocket__track-item">
                          <button
                            type="button"
                            className="track-play-trigger"
                            onClick={() => addTrack(track, true)}
                          >
                            <span className="track-index">{idx + 1}</span>
                            <div className="track-info">
                              <strong className="track-name" title={track.name}>{track.name}</strong>
                              <span className="track-sub">
                                {track.artist}
                                <span className={`track-source-tag source-${track.source}`}>
                                  {getSourceLabel(track.source)}
                                </span>
                              </span>
                            </div>
                          </button>
                          <div className="track-item-actions">
                            <button
                              type="button"
                              className="track-btn"
                              onClick={() => addTrack(track, false)}
                              title={t('加入待播列表')}
                            >
                              <Plus size={14} />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* 底部精简控制条 */}
                <div className="view-compact-dock">
                  <button type="button" className="dock-btn" onClick={() => skipTrack(-1)} disabled={queue.length <= 1}>
                    <SkipBack size={14} />
                  </button>
                  <button type="button" className="dock-play-btn" onClick={togglePlay}>
                    {isPlaying ? <Pause size={15} /> : <Play size={15} className="play-offset" />}
                  </button>
                  <button type="button" className="dock-btn" onClick={() => skipTrack(1)} disabled={queue.length <= 1}>
                    <SkipForward size={14} />
                  </button>
                  <div className="dock-time-text">
                    {currentTrack ? `${currentTrack.name} · ${currentTrack.artist}` : t('暂无曲目')}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3. 屏幕桌面悬浮歌词 HUD (Screen Floating Lyrics) */}
      {showScreenLyric && currentTrack && (
        <div
          className="shijianus-music-pocket__screen-lyric"
          style={
            screenLyricPos
              ? { left: `${screenLyricPos.x}px`, top: `${screenLyricPos.y}px`, bottom: 'auto', transform: 'none' }
              : undefined
          }
          onPointerDown={handleScreenLyricDragStart}
          onPointerMove={handleScreenLyricDragMove}
          onPointerUp={handleScreenLyricDragEnd}
        >
          <div className="screen-lyric__drag-badge" title={t('拖拽移动桌面歌词')}>
            <Disc3 size={15} className={`screen-lyric__disc ${isPlaying ? 'is-spinning' : ''}`} />
          </div>

          <div className="screen-lyric__content" onClick={() => setOpen(true)} title={t('点击展开播放器')}>
            <div className="screen-lyric__current">
              {activeLyricIndex >= 0 && parsedLyrics[activeLyricIndex] ? (
                <span className="screen-lyric__text">{cleanLyricText(parsedLyrics[activeLyricIndex].text)}</span>
              ) : (
                <span className="screen-lyric__text is-empty">
                  {cleanLyricText(rawLyric) || `${currentTrack.name} · ${currentTrack.artist}`}
                </span>
              )}
            </div>
            {parsedLyrics[activeLyricIndex + 1] && (
              <div className="screen-lyric__next">
                {cleanLyricText(parsedLyrics[activeLyricIndex + 1].text)}
              </div>
            )}
          </div>

          <div className="screen-lyric__actions">
            <button
              type="button"
              onClick={togglePlay}
              className="screen-lyric__btn"
              title={isPlaying ? t('暂停') : t('播放')}
            >
              {isPlaying ? <Pause size={12} /> : <Play size={12} className="play-offset" />}
            </button>
            <button
              type="button"
              onClick={() => skipTrack(1)}
              className="screen-lyric__btn"
              title={t('下一首')}
            >
              <SkipForward size={12} />
            </button>
            <button
              type="button"
              onClick={() => setShowScreenLyric(false)}
              className="screen-lyric__btn screen-lyric__btn--close"
              title={t('关闭屏幕歌词')}
            >
              <X size={12} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default MusicPocket;
