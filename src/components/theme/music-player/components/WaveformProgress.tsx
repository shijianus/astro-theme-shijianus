import { useMemo, type CSSProperties } from 'react';
import { formatTime, getProgressRatio } from '../lib/audio';

type WaveformProgressProps = {
  currentTime: number;
  duration: number;
  onSeek: (time: number) => void;
  label: string;
};

const BAR_COUNT = 44;

export function WaveformProgress({ currentTime, duration, onSeek, label }: WaveformProgressProps) {
  const ratio = getProgressRatio(currentTime, duration);
  const safeDuration = duration > 0 ? duration : 1;

  const bars = useMemo(
    () =>
      Array.from({ length: BAR_COUNT }, (_, index) => {
        const wave = Math.abs(Math.sin((index + 1) * 0.73)) * 0.58 + Math.abs(Math.cos((index + 2) * 0.41)) * 0.42;
        return Math.round(22 + wave * 78);
      }),
    [],
  );

  return (
    <div className="mp-waveform">
      <span className="mp-waveform__time">{formatTime(currentTime)}</span>

      <div className="mp-waveform__bars" data-testid="mp-waveform">
        {bars.map((height, index) => (
          <span
            key={index}
            className={`mp-waveform__bar ${index + 1 <= ratio * BAR_COUNT ? 'is-played' : ''}`}
            style={{ '--mp-bar-height': `${height}%` } as CSSProperties}
            aria-hidden="true"
          />
        ))}

        <span className="mp-waveform__playhead" style={{ left: `${ratio * 100}%` }} aria-hidden="true" />

        <input
          type="range"
          min={0}
          max={safeDuration}
          step={0.1}
          value={Math.min(currentTime, safeDuration)}
          onChange={(event) => onSeek(Number.parseFloat(event.target.value) || 0)}
          className="mp-waveform__range"
          aria-label={label}
          aria-valuetext={`${formatTime(currentTime)} / ${formatTime(duration)}`}
        />
      </div>

      <span className="mp-waveform__time">{formatTime(duration)}</span>
    </div>
  );
}
