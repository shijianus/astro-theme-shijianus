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
import {
  DEFAULT_PROGRESS_RATIO,
  FALLBACK_LYRICS,
  FALLBACK_TRACKS,
  LOOP_MODES,
  PANEL_WIDTH,
  PLAYER_STORAGE_KEYS,
  SPEED_STEPS,
  TAB_ORDER,
} from './config';
import { useFloatingPosition } from './hooks/useFloatingPosition';
import { usePlayerLocale } from './i18n';
import { clamp, getProgressRatio } from './lib/audio';
import { findActiveLyricIndex } from './lib/lyrics';
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

export function MusicPlayer({ apiBase, needle = false, startOpen }: MusicPlayerProps) {
  const { t } = usePlayerLocale();
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
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(() => {
    const track = FALLBACK_TRACKS[readInitialTrackIndex()];
    return Math.round((track?.duration ?? 0) * DEFAULT_PROGRESS_RATIO);
  });
  const [volume, setVolume] = useState(() => readStoredNumber(PLAYER_STORAGE_KEYS.volume, 0.85));
  const [isMuted, setIsMuted] = useState(false);
  const [loopMode, setLoopMode] = useState<PlayMode>(readPlayMode);
  const [speed, setSpeed] = useState(readPlaybackSpeed);
  const [favorites, setFavorites] = useState<string[]>(readFavorites);
  const [sleepTimer, setSleepTimer] = useState<SleepTimerOption>(null);
  const [showLyrics, setShowLyrics] = useState(true);
  const [discoverQuery, setDiscoverQuery] = useState('');
  const [discoverResults, setDiscoverResults] = useState<MusicTrack[]>(FALLBACK_TRACKS);
  const [discoverLoading] = useState(false);
  const [discoverError] = useState<string | null>(null);
  const [viewport, setViewport] = useState(() => ({
    width: typeof window === 'undefined' ? 1280 : window.innerWidth,
    height: typeof window === 'undefined' ? 900 : window.innerHeight,
  }));

  const bubbleRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const focusPanelOnOpenRef = useRef(false);

  const currentTrack = currentIndex >= 0 && currentIndex < queue.length ? queue[currentIndex] : null;
  const duration = currentTrack?.duration ?? 0;
  const progressRatio = getProgressRatio(currentTime, duration);
  const activeLyricIndex = findActiveLyricIndex(FALLBACK_LYRICS, currentTime);
  const favorite = Boolean(currentTrack && favorites.includes(currentTrack.id));

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
        if (!event.repeat) setIsPlaying((value) => !value);
        return;
      }
      if (event.code === 'ArrowLeft') {
        event.preventDefault();
        setCurrentTime((value) => clamp(value - 5, 0, duration));
        return;
      }
      if (event.code === 'ArrowRight') {
        event.preventDefault();
        setCurrentTime((value) => clamp(value + 5, 0, duration));
        return;
      }
      if (event.code === 'KeyM') {
        event.preventDefault();
        if (!event.repeat) setIsMuted((value) => !value);
      }
    };

    window.addEventListener('keydown', handleShortcut);
    return () => window.removeEventListener('keydown', handleShortcut);
  }, [duration, expanded]);

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

  const seekTo = useCallback(
    (time: number) => {
      setCurrentTime(clamp(time, 0, duration || 0));
    },
    [duration],
  );

  const selectTrack = useCallback((index: number) => {
    setCurrentIndex(index);
    setCurrentTime(0);
    setIsPlaying(true);
  }, []);

  const skipTrack = useCallback(
    (direction: 1 | -1) => {
      if (queue.length === 0) return;
      setCurrentIndex((currentIndex + direction + queue.length) % queue.length);
      setCurrentTime(0);
      setIsPlaying(true);
    },
    [currentIndex, queue.length],
  );

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
        selectTrack(existingIndex);
        return;
      }
      const nextQueue = [...queue, track];
      setQueue(nextQueue);
      setCurrentIndex(nextQueue.length - 1);
      setCurrentTime(0);
      setIsPlaying(true);
    },
    [queue, selectTrack],
  );

  const removeTrack = useCallback(
    (index: number) => {
      const nextQueue = queue.filter((_, itemIndex) => itemIndex !== index);
      setQueue(nextQueue);

      if (nextQueue.length === 0) {
        setCurrentIndex(-1);
        setCurrentTime(0);
        setIsPlaying(false);
        return;
      }

      if (index < currentIndex) {
        setCurrentIndex(currentIndex - 1);
      } else if (index === currentIndex) {
        setCurrentIndex(Math.min(index, nextQueue.length - 1));
        setCurrentTime(0);
      }
    },
    [currentIndex, queue],
  );

  const handleDiscoverSearch = useCallback(
    (keyword: string) => {
      const normalized = keyword.trim().toLowerCase();
      setDiscoverQuery(keyword);
      if (!normalized) {
        setDiscoverResults(FALLBACK_TRACKS);
        return;
      }

      const seen = new Set<string>();
      const pool = [...queue, ...FALLBACK_TRACKS].filter((track) => {
        if (seen.has(track.id)) return false;
        seen.add(track.id);
        return true;
      });

      setDiscoverResults(
        pool.filter((track) =>
          [track.name, track.artist, track.album || '']
            .join(' ')
            .toLowerCase()
            .includes(normalized),
        ),
      );
    },
    [queue],
  );

  const handleDiscoverLoadMore = useCallback(() => {
    // Phase 3 replaces this static fallback with the paginated search API.
  }, []);

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
              favorite={favorite}
              onToggleFavorite={toggleFavorite}
              currentTime={currentTime}
              duration={duration}
              onSeek={seekTo}
              lyrics={FALLBACK_LYRICS}
              activeLyricIndex={activeLyricIndex}
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
              onTogglePlay={() => setIsPlaying((value) => !value)}
              onPrev={() => skipTrack(-1)}
              onNext={() => skipTrack(1)}
              speed={speed}
              onCycleSpeed={cycleSpeed}
              sleepTimer={sleepTimer}
              onSleepTimerChange={setSleepTimer}
              needle={needle}
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
              lines={FALLBACK_LYRICS}
              activeIndex={activeLyricIndex}
              onSeek={seekTo}
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
              query={discoverQuery}
              onQueryChange={setDiscoverQuery}
              results={discoverResults}
              loading={discoverLoading}
              error={discoverError}
              hasMore={false}
              onSearch={handleDiscoverSearch}
              onLoadMore={handleDiscoverLoadMore}
              onPlay={playFromDiscover}
              onAdd={addToQueue}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
