import { Pause, Play, Repeat, Repeat1, SkipBack, SkipForward, Volume2, VolumeX } from 'lucide-react';
import type { PlayMode, TFunction } from '../types';

type TransportProps = {
  isPlaying: boolean;
  loopMode: PlayMode;
  volume: number;
  isMuted: boolean;
  canPlay: boolean;
  canSkip: boolean;
  onTogglePlay: () => void;
  onPrev: () => void;
  onNext: () => void;
  onCycleLoop: () => void;
  onVolumeChange: (value: number) => void;
  onToggleMute: () => void;
  t: TFunction;
};

export function Transport({
  isPlaying,
  loopMode,
  volume,
  isMuted,
  canPlay,
  canSkip,
  onTogglePlay,
  onPrev,
  onNext,
  onCycleLoop,
  onVolumeChange,
  onToggleMute,
  t,
}: TransportProps) {
  const loopLabel =
    loopMode === 'list' ? t('列表循环') : loopMode === 'single' ? t('单曲循环') : t('关闭循环');

  return (
    <div className="mp-transport">
      <div className="mp-controls">
        <button
          type="button"
          className={`mp-control-btn mp-loop ${loopMode === 'off' ? 'is-off' : ''}`}
          onClick={onCycleLoop}
          title={`${t('切换播放模式')}: ${loopLabel}`}
          aria-label={`${t('切换播放模式')}: ${loopLabel}`}
          data-loop-mode={loopMode}
          data-testid="mp-loop"
        >
          {loopMode === 'single' ? (
            <Repeat1 size={17} strokeWidth={1.5} aria-hidden="true" />
          ) : (
            <Repeat size={17} strokeWidth={1.5} aria-hidden="true" />
          )}
        </button>

        <button
          type="button"
          className="mp-control-btn"
          onClick={onPrev}
          disabled={!canSkip}
          title={t('上一首')}
          aria-label={t('上一首')}
          data-testid="mp-prev"
        >
          <SkipBack size={18} strokeWidth={1.5} aria-hidden="true" />
        </button>

        <button
          type="button"
          className="mp-play-btn"
          onClick={onTogglePlay}
          disabled={!canPlay}
          title={isPlaying ? t('暂停') : t('播放')}
          aria-label={isPlaying ? t('暂停') : t('播放')}
          data-testid="mp-play"
        >
          {isPlaying ? (
            <Pause size={24} strokeWidth={1.5} aria-hidden="true" />
          ) : (
            <Play size={24} strokeWidth={1.5} className="mp-play-icon" aria-hidden="true" />
          )}
        </button>

        <button
          type="button"
          className="mp-control-btn"
          onClick={onNext}
          disabled={!canSkip}
          title={t('下一首')}
          aria-label={t('下一首')}
          data-testid="mp-next"
        >
          <SkipForward size={18} strokeWidth={1.5} aria-hidden="true" />
        </button>

        <div className="mp-volume">
          <button
            type="button"
            className="mp-control-btn"
            onClick={onToggleMute}
            title={isMuted ? t('取消静音') : t('静音')}
            aria-label={t('音量开关')}
          >
            {isMuted || volume === 0 ? (
              <VolumeX size={17} strokeWidth={1.5} aria-hidden="true" />
            ) : (
              <Volume2 size={17} strokeWidth={1.5} aria-hidden="true" />
            )}
          </button>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={isMuted ? 0 : volume}
            onChange={(event) => onVolumeChange(Number.parseFloat(event.target.value) || 0)}
            className="mp-volume__slider"
            aria-label={t('音量调节')}
            data-testid="mp-volume"
          />
        </div>
      </div>
    </div>
  );
}
