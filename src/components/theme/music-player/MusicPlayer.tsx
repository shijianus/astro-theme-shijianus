import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
} from 'react';
import { Music } from 'lucide-react';
import { createMusicApi } from './api';
import {
  DISCOVER_SEEDS,
  FALLBACK_TRACKS,
  LOOP_MODES,
  PANEL_WIDTH,
  PLAYER_STORAGE_KEYS,
  SPEED_STEPS,
  TAB_ORDER,
} from './config';
import { useAudioController } from './hooks/useAudioController';
import { useDiscover } from './hooks/useDiscover';
import { useFloatingPosition } from './hooks/useFloatingPosition';
import { useLyrics } from './hooks/useLyrics';
import { usePlayerLocale } from './i18n';
import { getProgressRatio } from './lib/audio';
import {
  readStoredBoolean,
  readStoredJson,
  readStoredNumber,
  readStoredString,
  writeStoredBoolean,
  writeStoredJson,
  writeStoredNumber,
  writeStoredString,
} from './lib/storage';
import type { MusicTrack, PlayMode, PlayerTab, SleepTimerOption } from './types';
import { DiscoverView } from './components/DiscoverView';
import { LyricsView } from './components/LyricsView';
import { PlayerView } from './components/PlayerView';
import { QueueView } from './components/QueueView';
import { TopBar } from './components/TopBar';
import './styles/tokens.css';
import './styles/player.css';

type MusicPlayerProps = {
  apiBase: string;
  needle?: boolean;
  startOpen?: boolean;
  skipPlaylist?: boolean;
  skipLyrics?: boolean;
};

type PlayerNotice = {
  key: string;
  kind: 'info' | 'error';
};

function readPlayMode(): PlayMode {
  const stored = readStoredString(PLAYER_STORAGE_KEYS.loop);
  return stored === 'list' || stored === 'single' || stored === 'off' ? stored : 'list';
}

function readFavorites(): string[] {
  const stored = readStoredJson<unknown>(PLAYER_STORAGE_KEYS.favorites, []);
  return Array.isArray(stored) ? stored.filter((value): value is string => typeof value === 'string') : [];
}

function readPlaybackSpeed(): number {
  const stored = readStoredNumber(PLAYER_STORAGE_KEYS.speed, 1);
  return SPEED_STEPS.some((step) => step === stored) ? stored : 1;
}

function readInitialTrackIndex(): number {
  const storedId = readStoredString(PLAYER_STORAGE_KEYS.track);
  if (!storedId) return 0;
  const index = FALLBACK_TRACKS.findIndex((track) => track.id === storedId);
  return index >= 0 ? index : 0;
}

function readInitialExpanded(startOpen?: boolean): boolean {
  return typeof startOpen === 'boolean' ? startOpen : readStoredBoolean(PLAYER_STORAGE_KEYS.expanded, false);
}

export function MusicPlayer({ apiBase, needle = false, startOpen, skipPlaylist = false, skipLyrics = false }: MusicPlayerProps) {
  const { t } = usePlayerLocale();
  const api = useMemo(() => createMusicApi(apiBase), [apiBase]);
  const {
    position,
    dragging,
    suppressClickRef,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handlePointerCancel,
  } = useFloatingPosition();

  const [expanded, setExpanded] = useState(() => readInitialExpanded(startOpen));
  const [activeTab, setActiveTab] = useState<PlayerTab>('player');
  const [queue, setQueue] = useState<MusicTrack[]>(FALLBACK_TRACKS);
  const [currentIndex, setCurrentIndex] = useState(readInitialTrackIndex);
  const [volume, setVolume] = useState(() => readStoredNumber(PLAYER_STORAGE_KEYS.volume, 0.85));
  const [isMuted, setIsMuted] = useState(false);
  const [loopMode, setLoopMode] = useState<PlayMode>(readPlayMode);
  const [speed, setSpeed] = useState(readPlaybackSpeed);
  const [favorites, setFavorites] = useState<string[]>(readFavorites);
  const [sleepTimer, setSleepTimer] = useState<SleepTimerOption>(null);
  const [sleepRemaining, setSleepRemaining] = useState<number | null>(null);
  const [showLyrics, setShowLyrics] = useState(true);
  const [notice, setNotice] = useState<PlayerNotice | null>(null);
  const [viewport, setViewport] = useState(() => ({
    width: typeof window === 'undefined' ? 1280 : window.innerWidth,
    height: typeof window === 'undefined' ? 900 : window.innerHeight,
  }));

  const bubbleRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const focusPanelOnOpenRef = useRef(false);
  const noticeTimerRef = useRef<number | null>(null);
  const restoredPlaybackRef = useRef(false);
  const tRef = useRef(t);
  tRef.current = t;

  const currentTrack = currentIndex >= 0 && currentIndex < queue.length ? queue[currentIndex] : null;
  const currentTrackRef = useRef<MusicTrack | null>(currentTrack);
  currentTrackRef.current = currentTrack;

  const showNotice = useCallback((key: string, kind: 'info' | 'error' = 'info', duration = 3200) => {
    setNotice({ key, kind });

    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('shijianus:activity', {
          detail: { message: tRef.current(key), duration: Math.min(duration, 4000) },
        }),
      );

      if (noticeTimerRef.current !== null) window.clearTimeout(noticeTimerRef.current);
      noticeTimerRef.current =
        duration > 0
          ? window.setTimeout(() => {
              setNotice(null);
              noticeTimerRef.current = null;
            }, duration)
          : null;
    }
  }, []);

  const onSleepTimerConsumed = useCallback(() => {
    setSleepTimer(null);
  }, []);

  const {
    audioRef,
    analyserRef,
    isPlaying,
    currentTime,
    duration,
    isBuffering,
    spectrumAvailable,
    togglePlay,
    seekTo,
    selectTrack,
    skipTrack,
    armAutoplay,
    pausePlayback,
    stopAndClear,
  } = useAudioController({
    api,
    queue,
    currentIndex,
    currentTrack,
    loopMode,
    sleepTimer,
    setCurrentIndex,
    onSleepTimerConsumed,
    showNotice,
  });

  const lyrics = useLyrics({
    api,
    track: currentTrack,
    currentTime,
    skip: skipLyrics,
  });
  const discover = useDiscover({
    api,
    enabled: expanded && activeTab === 'discover',
  });

  const progressRatio = getProgressRatio(currentTime, duration);
  const favorite = Boolean(currentTrack && favorites.includes(currentTrack.id));
  const spectrumActive = expanded && isPlaying && !isMuted && volume > 0 && spectrumAvailable;

  const tabs = useMemo(
    () => [
      { id: 'player' as const, label: t('播放') },
      { id: 'lyrics' as const, label: t('歌词') },
      { id: 'queue' as const, label: `${t('待播')} (${queue.length})` },
      { id: 'discover' as const, label: t('发现') },
    ],
    [queue.length, t],
  );

  useEffect(() => {
    writeStoredBoolean(PLAYER_STORAGE_KEYS.expanded, expanded);
  }, [expanded]);

  useEffect(() => {
    writeStoredNumber(PLAYER_STORAGE_KEYS.volume, volume);
  }, [volume]);

  useEffect(() => {
    writeStoredString(PLAYER_STORAGE_KEYS.loop, loopMode);
  }, [loopMode]);

  useEffect(() => {
    writeStoredNumber(PLAYER_STORAGE_KEYS.speed, speed);
  }, [speed]);

  useEffect(() => {
    writeStoredJson(PLAYER_STORAGE_KEYS.favorites, favorites);
  }, [favorites]);

  useEffect(() => {
    if (currentTrack) writeStoredString(PLAYER_STORAGE_KEYS.track, currentTrack.id);
  }, [currentTrack]);

  useEffect(() => {
    return () => {
      if (noticeTimerRef.current !== null) window.clearTimeout(noticeTimerRef.current);
    };
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = Math.min(1, Math.max(0, volume));
    audio.muted = isMuted;
  }, [audioRef, isMuted, volume]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.playbackRate = speed;
    if ('preservesPitch' in audio) audio.preservesPitch = true;
  }, [audioRef, currentTrack?.id, speed]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const writePlaybackPosition = () => {
      const track = currentTrackRef.current;
      if (!track) return;
      writeStoredJson(PLAYER_STORAGE_KEYS.playback, {
        trackId: track.id,
        time: Number.isFinite(audio.currentTime) ? audio.currentTime : 0,
      });
    };

    const interval = window.setInterval(writePlaybackPosition, 4000);
    const handlePageHide = () => writePlaybackPosition();
    audio.addEventListener('pause', writePlaybackPosition);
    audio.addEventListener('seeked', writePlaybackPosition);
    window.addEventListener('pagehide', handlePageHide);

    return () => {
      window.clearInterval(interval);
      audio.removeEventListener('pause', writePlaybackPosition);
      audio.removeEventListener('seeked', writePlaybackPosition);
      window.removeEventListener('pagehide', handlePageHide);
    };
  }, [audioRef, currentTrack?.id]);

  useEffect(() => {
    if (restoredPlaybackRef.current) return;
    const stored = readStoredJson<{ trackId?: string; time?: number } | null>(PLAYER_STORAGE_KEYS.playback, null);
    if (!stored || !currentTrack || stored.trackId !== currentTrack.id || typeof stored.time !== 'number') return;

    const audio = audioRef.current;
    if (!audio) return;
    restoredPlaybackRef.current = true;

    const apply = () => seekTo(stored.time as number);
    if (audio.readyState >= 1) {
      apply();
      return;
    }

    const onLoadedMetadata = () => {
      apply();
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
    };
    audio.addEventListener('loadedmetadata', onLoadedMetadata);
    return () => audio.removeEventListener('loadedmetadata', onLoadedMetadata);
  }, [audioRef, currentTrack?.id, seekTo]);

  useEffect(() => {
    if (skipPlaylist) return;
    let cancelled = false;

    const loadPlaylist = async () => {
      try {
        const tracks = await api.playlist();
        if (cancelled) return;
        if (tracks.length === 0) {
          showNotice('播放列表为空，已使用本地曲目', 'info', 5000);
          return;
        }

        const activeTrack = currentTrackRef.current;
        const activeId = activeTrack?.id || readStoredString(PLAYER_STORAGE_KEYS.track);
        let nextQueue = tracks;

        if (activeId && !nextQueue.some((track) => track.id === activeId) && activeTrack) {
          nextQueue = [...nextQueue, activeTrack];
        }

        setQueue(nextQueue);
        const targetIndex = activeId ? nextQueue.findIndex((track) => track.id === activeId) : -1;
        setCurrentIndex(targetIndex >= 0 ? targetIndex : 0);
      } catch {
        if (!cancelled) showNotice('播放列表加载失败，已使用本地曲目', 'error', 5000);
      }
    };

    void loadPlaylist();
    return () => {
      cancelled = true;
    };
  }, [api, showNotice, skipPlaylist]);

  useEffect(() => {
    if (sleepTimer === null || sleepTimer === 'end') {
      setSleepRemaining(null);
      return;
    }

    const deadline = Date.now() + sleepTimer * 60 * 1000;
    const tick = () => {
      const remaining = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
      setSleepRemaining(remaining);
      if (remaining <= 0) {
        pausePlayback();
        setSleepTimer(null);
        setSleepRemaining(null);
        showNotice('定时休眠已到达，播放已暂停', 'info', 5000);
      }
    };

    tick();
    const interval = window.setInterval(tick, 1000);
    return () => window.clearInterval(interval);
  }, [pausePlayback, showNotice, sleepTimer]);

  useEffect(() => {
    document.body.classList.toggle('mp-panel-open', expanded);
    return () => document.body.classList.remove('mp-panel-open');
  }, [expanded]);

  useEffect(() => {
    window.dispatchEvent(
      new CustomEvent('shijianus:music-player-panel-change', { detail: { expanded } }),
    );
  }, [expanded]);

  useEffect(() => {
    const handleToggleFromDock = () => {
      if (expanded) {
        setExpanded(false);
        window.requestAnimationFrame(() => bubbleRef.current?.focus());
        return;
      }
      focusPanelOnOpenRef.current = true;
      setExpanded(true);
    };
    window.addEventListener('shijianus:music-player-toggle-panel', handleToggleFromDock);
    return () => window.removeEventListener('shijianus:music-player-toggle-panel', handleToggleFromDock);
  }, [expanded]);

  useEffect(() => {
    if (panelRef.current) panelRef.current.inert = !expanded;
    if (expanded && focusPanelOnOpenRef.current) {
      focusPanelOnOpenRef.current = false;
      window.requestAnimationFrame(() => panelRef.current?.focus());
    }
  }, [expanded]);

  useEffect(() => {
    const handleResize = () => {
      setViewport({ width: window.innerWidth, height: window.innerHeight });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (!expanded) return;

    const handleShortcut = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest('input, textarea, select, button, a, [contenteditable="true"]')) return;

      if (event.code === 'Space') {
        event.preventDefault();
        if (!event.repeat) togglePlay();
        return;
      }
      if (event.code === 'ArrowLeft' || event.code === 'ArrowRight') {
        event.preventDefault();
        const audio = audioRef.current;
        if (!audio) return;
        seekTo(audio.currentTime + (event.code === 'ArrowLeft' ? -5 : 5));
        return;
      }
      if (event.code === 'KeyM') {
        event.preventDefault();
        if (!event.repeat) setIsMuted((value) => !value);
      }
    };

    window.addEventListener('keydown', handleShortcut);
    return () => window.removeEventListener('keydown', handleShortcut);
  }, [audioRef, expanded, seekTo, togglePlay]);

  const collapsePanel = useCallback(() => {
    setExpanded(false);
    window.requestAnimationFrame(() => bubbleRef.current?.focus());
  }, []);

  const handleRootKeyDown = useCallback(
    (event: ReactKeyboardEvent<HTMLDivElement>) => {
      if (event.key === 'Escape' && expanded) {
        event.stopPropagation();
        collapsePanel();
      }
    },
    [collapsePanel, expanded],
  );

  const handleTabKeyDown = useCallback(
    (event: ReactKeyboardEvent<HTMLButtonElement>, tab: PlayerTab) => {
      const currentTabIndex = TAB_ORDER.indexOf(tab);
      let nextIndex = currentTabIndex;

      if (event.key === 'ArrowRight') nextIndex = (currentTabIndex + 1) % TAB_ORDER.length;
      else if (event.key === 'ArrowLeft') nextIndex = (currentTabIndex - 1 + TAB_ORDER.length) % TAB_ORDER.length;
      else if (event.key === 'Home') nextIndex = 0;
      else if (event.key === 'End') nextIndex = TAB_ORDER.length - 1;
      else return;

      event.preventDefault();
      const nextTab = TAB_ORDER[nextIndex];
      setActiveTab(nextTab);
      tabRefs.current[nextIndex]?.focus();
    },
    [],
  );

  const togglePanel = useCallback(() => {
    if (suppressClickRef.current) return;
    if (expanded) {
      setExpanded(false);
      window.requestAnimationFrame(() => bubbleRef.current?.focus());
      return;
    }
    focusPanelOnOpenRef.current = true;
    setExpanded(true);
  }, [expanded, suppressClickRef]);

  const cycleLoop = useCallback(() => {
    setLoopMode((mode) => {
      const index = LOOP_MODES.indexOf(mode);
      return LOOP_MODES[(index + 1) % LOOP_MODES.length];
    });
  }, []);

  const cycleSpeed = useCallback(() => {
    setSpeed((value) => {
      const index = SPEED_STEPS.findIndex((step) => step === value);
      return SPEED_STEPS[(index + 1) % SPEED_STEPS.length];
    });
  }, []);

  const toggleFavorite = useCallback(() => {
    if (!currentTrack) return;
    setFavorites((value) =>
      value.includes(currentTrack.id)
        ? value.filter((id) => id !== currentTrack.id)
        : [...value, currentTrack.id],
    );
  }, [currentTrack]);

  const addToQueue = useCallback((track: MusicTrack) => {
    setQueue((value) => (value.some((item) => item.id === track.id) ? value : [...value, track]));
  }, []);

  const playFromDiscover = useCallback(
    (track: MusicTrack) => {
      const existingIndex = queue.findIndex((item) => item.id === track.id);
      if (existingIndex >= 0) {
        armAutoplay();
        selectTrack(existingIndex);
        return;
      }

      const nextQueue = [...queue, track];
      setQueue(nextQueue);
      setCurrentIndex(nextQueue.length - 1);
      armAutoplay();
    },
    [armAutoplay, queue, selectTrack],
  );

  const removeTrack = useCallback(
    (index: number) => {
      const nextQueue = queue.filter((_, itemIndex) => itemIndex !== index);

      if (nextQueue.length === 0) {
        stopAndClear();
        setQueue([]);
        setCurrentIndex(-1);
        return;
      }

      if (index < currentIndex) {
        setQueue(nextQueue);
        setCurrentIndex(currentIndex - 1);
        return;
      }

      if (index === currentIndex) {
        if (isPlaying) armAutoplay();
        setQueue(nextQueue);
        setCurrentIndex(Math.min(index, nextQueue.length - 1));
        return;
      }

      setQueue(nextQueue);
    },
    [armAutoplay, currentIndex, isPlaying, queue, stopAndClear],
  );

  const handleSleepTimerChange = useCallback(
    (value: SleepTimerOption) => {
      setSleepTimer(value);
      if (value === null) {
        setSleepRemaining(null);
        showNotice('定时休眠已关闭', 'info', 2500);
      } else if (value === 'end') {
        setSleepRemaining(null);
      } else {
        setSleepRemaining(value * 60);
      }
    },
    [showNotice],
  );

  const bubbleX = position?.x ?? 24;
  const bubbleY = position?.y ?? Math.max(24, viewport.height - 72);
  const horizontal = bubbleX + PANEL_WIDTH + 16 > viewport.width ? 'left' : 'right';
  const vertical = bubbleY < 360 ? 'below' : 'above';
  const positionStyle: CSSProperties | undefined = position
    ? { left: position.x, top: position.y, right: 'auto', bottom: 'auto' }
    : undefined;

  return (
    <div
      className={`mp-root ${expanded ? 'is-expanded' : ''} ${dragging ? 'is-dragging' : ''} ${isPlaying ? 'is-playing' : ''}`}
      style={positionStyle}
      onKeyDown={handleRootKeyDown}
      data-api-base={apiBase}
      data-needle={needle ? 'true' : 'false'}
      data-testid="mp-root"
    >
      <audio
        ref={audioRef}
        className="mp-audio"
        data-testid="mp-audio"
        crossOrigin="anonymous"
        preload="metadata"
        playsInline
        aria-hidden="true"
      />

      <div className="mp-sr-only" aria-live="polite" aria-atomic="true">
        {isPlaying ? t('正在播放') : t('已暂停')}:{' '}
        {currentTrack ? `${currentTrack.name} — ${currentTrack.artist}` : t('暂无播放曲目')}
      </div>

      <button
        ref={bubbleRef}
        type="button"
        className="mp-bubble"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
        onClick={togglePanel}
        aria-expanded={expanded}
        aria-controls="mp-panel"
        aria-label={expanded ? t('收起播放器面板') : t('展开播放器面板')}
        title={t('按住可自由拖拽，点击展开音乐随身听')}
        data-testid="mp-bubble"
      >
        <svg className="mp-bubble__ring" viewBox="0 0 48 48" aria-hidden="true">
          <circle className="mp-bubble__ring-track" cx="24" cy="24" r="22" pathLength="100" />
          <circle
            className="mp-bubble__ring-progress"
            cx="24"
            cy="24"
            r="22"
            pathLength="100"
            strokeDasharray="100"
            strokeDashoffset={100 - progressRatio * 100}
          />
        </svg>
        <span className="mp-bubble__disc">
          {currentTrack?.coverUrl ? (
            <img
              src={currentTrack.coverUrl}
              alt=""
              aria-hidden="true"
              loading="lazy"
              decoding="async"
              draggable={false}
            />
          ) : (
            <Music size={18} strokeWidth={1.5} aria-hidden="true" />
          )}
        </span>
      </button>

      <div
        ref={panelRef}
        id="mp-panel"
        className="mp-panel"
        data-open={expanded ? 'true' : 'false'}
        data-horizontal={horizontal}
        data-vertical={vertical}
        role="region"
        aria-label={t('播放器面板')}
        aria-hidden={!expanded}
        aria-busy={isBuffering}
        tabIndex={-1}
        data-testid="mp-panel"
      >
        <TopBar
          activeTab={activeTab}
          tabs={tabs}
          onSelect={setActiveTab}
          onCollapse={collapsePanel}
          onKeyDown={handleTabKeyDown}
          tabRefs={tabRefs}
          t={t}
        />

        {notice && (
          <div
            className={`mp-notice mp-notice--${notice.kind}`}
            role="status"
            aria-live="polite"
            data-testid="mp-notice"
          >
            {t(notice.key)}
          </div>
        )}

        <div className="mp-panel__body">
          <div
            className="mp-tabpanel"
            id="mp-tabpanel-player"
            role="tabpanel"
            aria-labelledby="mp-tab-player"
            hidden={activeTab !== 'player'}
          >
            <PlayerView
              track={currentTrack}
              isPlaying={isPlaying}
              isBuffering={isBuffering}
              favorite={favorite}
              onToggleFavorite={toggleFavorite}
              currentTime={currentTime}
              duration={duration}
              onSeek={seekTo}
              lyrics={lyrics.lines}
              lyricsStatus={lyrics.status}
              activeLyricIndex={lyrics.activeIndex}
              showLyrics={showLyrics}
              onToggleLyrics={() => setShowLyrics((value) => !value)}
              loopMode={loopMode}
              onCycleLoop={cycleLoop}
              volume={volume}
              isMuted={isMuted}
              onVolumeChange={(value) => {
                setVolume(value);
                if (isMuted && value > 0) setIsMuted(false);
              }}
              onToggleMute={() => setIsMuted((value) => !value)}
              onTogglePlay={togglePlay}
              onPrev={() => skipTrack(-1)}
              onNext={() => skipTrack(1)}
              canSkip={queue.length > 1}
              speed={speed}
              onCycleSpeed={cycleSpeed}
              sleepTimer={sleepTimer}
              sleepRemaining={sleepRemaining}
              onSleepTimerChange={handleSleepTimerChange}
              needle={needle}
              analyserRef={analyserRef}
              spectrumActive={spectrumActive}
            />
          </div>

          <div
            className="mp-tabpanel"
            id="mp-tabpanel-lyrics"
            role="tabpanel"
            aria-labelledby="mp-tab-lyrics"
            hidden={activeTab !== 'lyrics'}
          >
            <LyricsView
              track={currentTrack}
              lines={lyrics.lines}
              activeIndex={lyrics.activeIndex}
              status={lyrics.status}
              onSeek={seekTo}
              onRetry={lyrics.retry}
            />
          </div>

          <div
            className="mp-tabpanel"
            id="mp-tabpanel-queue"
            role="tabpanel"
            aria-labelledby="mp-tab-queue"
            hidden={activeTab !== 'queue'}
          >
            <QueueView
              queue={queue}
              currentIndex={currentIndex}
              isPlaying={isPlaying}
              onSelect={selectTrack}
              onRemove={removeTrack}
              onGoDiscover={() => setActiveTab('discover')}
            />
          </div>

          <div
            className="mp-tabpanel"
            id="mp-tabpanel-discover"
            role="tabpanel"
            aria-labelledby="mp-tab-discover"
            hidden={activeTab !== 'discover'}
          >
            <DiscoverView
              query={discover.query}
              onQueryChange={discover.setQuery}
              results={discover.results}
              loading={discover.loading}
              error={discover.error}
              hasMore={discover.hasMore}
              cooldownRemaining={discover.cooldownRemaining}
              seeds={DISCOVER_SEEDS}
              activeSeed={discover.seed}
              onSearch={discover.search}
              onSelectSeed={discover.selectSeed}
              onRetry={discover.retry}
              onLoadMore={discover.loadMore}
              onPlay={playFromDiscover}
              onAdd={addToQueue}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
