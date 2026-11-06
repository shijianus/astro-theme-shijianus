import { useEffect, useRef, useState } from 'react';
import { FileText, Gauge, Heart, MoreHorizontal, Music } from 'lucide-react';
import { SLEEP_OPTIONS } from '../config';
import { usePlayerLocale } from '../i18n';
import { formatTime } from '../lib/audio';
import { getLyricWindow } from '../lib/lyrics';
import { getSourceLabel } from '../lib/source';
import type { LyricLine, LyricsStatus, MusicTrack, PlayMode, SleepTimerOption } from '../types';
import { Marquee } from './Marquee';
import { Transport } from './Transport';
import { WaveformProgress } from './WaveformProgress';

type PlayerViewProps = {
  track: MusicTrack | null;
  isPlaying: boolean;
  isBuffering: boolean;
  favorite: boolean;
  onToggleFavorite: () => void;
  currentTime: number;
  duration: number;
  onSeek: (time: number) => void;
  lyrics: LyricLine[];
  lyricsStatus: LyricsStatus;
  activeLyricIndex: number;
  showLyrics: boolean;
  onToggleLyrics: () => void;
  loopMode: PlayMode;
  onCycleLoop: () => void;
  volume: number;
  isMuted: boolean;
  onVolumeChange: (value: number) => void;
  onToggleMute: () => void;
  onTogglePlay: () => void;
  onPrev: () => void;
  onNext: () => void;
  canSkip: boolean;
  speed: number;
  onCycleSpeed: () => void;
  sleepTimer: SleepTimerOption;
  sleepRemaining: number | null;
  onSleepTimerChange: (value: SleepTimerOption) => void;
  needle: boolean;
  analyserRef?: { current: AnalyserNode | null };
  spectrumActive?: boolean;
};

export function PlayerView({
  track,
  isPlaying,
  isBuffering,
  favorite,
  onToggleFavorite,
  currentTime,
  duration,
  onSeek,
  lyrics,
  lyricsStatus,
  activeLyricIndex,
  showLyrics,
  onToggleLyrics,
  loopMode,
  onCycleLoop,
  volume,
  isMuted,
  onVolumeChange,
  onToggleMute,
  onTogglePlay,
  onPrev,
  onNext,
  canSkip,
  speed,
  onCycleSpeed,
  sleepTimer,
  sleepRemaining,
  onSleepTimerChange,
  needle,
  analyserRef,
  spectrumActive = false,
}: PlayerViewProps) {
  const { t } = usePlayerLocale();
  const [moreOpen, setMoreOpen] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);
  const lyricWindow = getLyricWindow(lyrics, activeLyricIndex);
  const lyricRibbonText =
    lyricsStatus === 'loading'
      ? t('正在同步歌词...')
      : lyricsStatus === 'error'
        ? t('歌词加载失败')
        : lyricsStatus === 'instrumental'
          ? t('纯音乐，请欣赏')
          : lyricsStatus === 'empty' || lyricsStatus === 'idle'
            ? t('暂无歌词')
            : lyricWindow.current?.text || t('暂无歌词');
  const lyricReady = lyricsStatus === 'ready' && Boolean(lyricWindow.current);
  const sleepTimerLabel =
    sleepRemaining !== null ? `${t('定时关闭')} · ${formatTime(sleepRemaining)}` : t('定时关闭');

  useEffect(() => {
    if (!moreOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (!moreRef.current?.contains(event.target as Node)) {
        setMoreOpen(false);
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [moreOpen]);

  return (
    <div className="mp-player" data-testid="mp-player-view" aria-busy={isBuffering}>
      {isBuffering && (
        <span className="mp-sr-only" role="status">
          {t('正在加载音频...')}
        </span>
      )}
      <div className="mp-track">
        {needle && track && (
          <span className="mp-needle" aria-hidden="true">
            <span className="mp-needle__arm" />
            <span className="mp-needle__head" />
          </span>
        )}

        <div className={`mp-cover ${isPlaying ? 'is-playing' : ''} ${isBuffering ? 'is-buffering' : ''}`}>
          {track?.coverUrl ? (
            <img
              src={track.coverUrl}
              alt=""
              aria-hidden="true"
              loading="lazy"
              decoding="async"
              draggable={false}
            />
          ) : (
            <Music size={30} strokeWidth={1.5} aria-hidden="true" />
          )}
          {isBuffering && <span className="mp-cover__spinner" aria-hidden="true" />}
        </div>

        <div className="mp-track__meta">
          <Marquee text={track?.name || t('暂无播放曲目')} className="mp-track__title" />
          <span className="mp-track__artist" title={track?.album || track?.artist || ''}>
            {track?.artist || t('静心享受纯粹旋律')}
          </span>
        </div>

        <div className="mp-track__side">
          {track && (
            <span className="mp-source" aria-label={t('歌曲来源')} title={t('歌曲来源')}>
              {getSourceLabel(track.source, t)}
            </span>
          )}
          <button
            type="button"
            className="mp-fav"
            onClick={onToggleFavorite}
            title={favorite ? t('已取消收藏') : t('喜欢本曲')}
            aria-label={t('收藏')}
            aria-pressed={favorite}
            disabled={!track}
            data-testid="mp-favorite"
          >
            <Heart
              size={18}
              strokeWidth={1.5}
              fill={favorite ? 'currentColor' : 'none'}
              aria-hidden="true"
            />
          </button>
        </div>
      </div>

      <WaveformProgress
        currentTime={currentTime}
        duration={duration}
        onSeek={onSeek}
        label={t('播放进度')}
        analyserRef={analyserRef}
        spectrumActive={spectrumActive}
      />

      {showLyrics && (
        <div
          className={`mp-ribbon ${lyricReady ? '' : 'is-status'}`}
          data-testid="mp-lyric-ribbon"
          data-lyrics-status={lyricsStatus}
        >
          {lyricReady && (
            <span className="mp-ribbon__side" title={lyricWindow.previous?.text || ''}>
              {lyricWindow.previous?.text || ''}
            </span>
          )}
          <span className="mp-ribbon__current" key={`${lyricsStatus}-${activeLyricIndex}-${lyricRibbonText}`}>
            <Marquee text={lyricRibbonText} />
          </span>
          {lyricReady && (
            <span className="mp-ribbon__side" title={lyricWindow.next?.text || ''}>
              {lyricWindow.next?.text || ''}
            </span>
          )}
        </div>
      )}

      <Transport
        isPlaying={isPlaying}
        loopMode={loopMode}
        volume={volume}
        isMuted={isMuted}
        canPlay={Boolean(track)}
        canSkip={canSkip}
        onTogglePlay={onTogglePlay}
        onPrev={onPrev}
        onNext={onNext}
        onCycleLoop={onCycleLoop}
        onVolumeChange={onVolumeChange}
        onToggleMute={onToggleMute}
        t={t}
      />

      <div className="mp-footer">
        <button
          type="button"
          className={`mp-footer__btn ${showLyrics ? 'is-active' : ''}`}
          onClick={onToggleLyrics}
          title={t('歌词')}
          aria-label={t('歌词')}
          aria-pressed={showLyrics}
          data-testid="mp-toggle-lyrics"
        >
          <FileText size={18} strokeWidth={1.5} aria-hidden="true" />
        </button>

        <button
          type="button"
          className={`mp-footer__btn ${speed !== 1 ? 'is-active' : ''}`}
          onClick={onCycleSpeed}
          title={`${t('播放倍速')}: ${speed}x`}
          aria-label={`${t('播放倍速')}: ${speed}x`}
          data-testid="mp-speed"
        >
          <Gauge size={18} strokeWidth={1.5} aria-hidden="true" />
        </button>

        <div
          className="mp-more"
          ref={moreRef}
          onKeyDown={(event) => {
            if (event.key === 'Escape' && moreOpen) {
              event.stopPropagation();
              setMoreOpen(false);
            }
          }}
        >
          <button
            type="button"
            className={`mp-footer__btn ${sleepTimer ? 'is-active' : ''}`}
            onClick={() => setMoreOpen((value) => !value)}
            title={t('更多')}
            aria-label={t('更多操作')}
            aria-haspopup="menu"
            aria-expanded={moreOpen}
            data-testid="mp-more"
          >
            <MoreHorizontal size={18} strokeWidth={1.5} aria-hidden="true" />
          </button>

          {moreOpen && (
            <div className="mp-menu" role="menu" aria-label={sleepTimerLabel} data-testid="mp-more-menu">
              <span className="mp-menu__label">{sleepTimerLabel}</span>
              {SLEEP_OPTIONS.map((option) => {
                const checked = sleepTimer === option.value;
                return (
                  <button
                    key={String(option.value)}
                    type="button"
                    role="menuitemradio"
                    aria-checked={checked}
                    className={`mp-menu__item ${checked ? 'is-active' : ''}`}
                    onClick={() => {
                      onSleepTimerChange(option.value);
                      setMoreOpen(false);
                    }}
                  >
                    {t(option.labelKey)}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
