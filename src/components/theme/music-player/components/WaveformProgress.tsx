import { useEffect, useMemo, useRef } from 'react';
import { formatTime, getProgressRatio } from '../lib/audio';

type WaveformProgressProps = {
  currentTime: number;
  duration: number;
  onSeek: (time: number) => void;
  label: string;
  analyserRef?: { current: AnalyserNode | null };
  spectrumActive?: boolean;
};

const BAR_COUNT = 44;

export function WaveformProgress({
  currentTime,
  duration,
  onSeek,
  label,
  analyserRef,
  spectrumActive = false,
}: WaveformProgressProps) {
  const ratio = getProgressRatio(currentTime, duration);
  const safeDuration = duration > 0 ? duration : 1;
  const barRefs = useRef<Array<HTMLSpanElement | null>>([]);

  const staticHeights = useMemo(
    () =>
      Array.from({ length: BAR_COUNT }, (_, index) => {
        const wave = Math.abs(Math.sin((index + 1) * 0.73)) * 0.58 + Math.abs(Math.cos((index + 2) * 0.41)) * 0.42;
        return Math.round(22 + wave * 78);
      }),
    [],
  );

  useEffect(() => {
    const bars = barRefs.current;
    const applyStatic = () => {
      bars.forEach((bar, index) => {
        bar?.style.setProperty('--mp-bar-height', `${staticHeights[index] ?? 40}%`);
      });
    };

    applyStatic();

    const analyser = analyserRef?.current;
    if (!spectrumActive || !analyser || typeof window === 'undefined') return;

    const data = new Uint8Array(analyser.frequencyBinCount);
    let frame = 0;
    let lastFrame = 0;

    const render = (now: number) => {
      frame = window.requestAnimationFrame(render);
      if (now - lastFrame < 33) return;
      lastFrame = now;

      try {
        analyser.getByteFrequencyData(data);
        const usableBins = Math.max(1, Math.floor(data.length * 0.72));

        bars.forEach((bar, index) => {
          if (!bar) return;
          const start = Math.floor((index / BAR_COUNT) * usableBins);
          const end = Math.max(start + 1, Math.floor(((index + 1) / BAR_COUNT) * usableBins));
          let sum = 0;
          for (let bin = start; bin < end; bin += 1) sum += data[bin] ?? 0;
          const level = sum / (end - start) / 255;
          const height = Math.round(16 + level * 84);
          bar.style.setProperty('--mp-bar-height', `${height}%`);
        });
      } catch {
        // A broken or cross-origin analyser falls back to the static waveform.
        applyStatic();
        window.cancelAnimationFrame(frame);
      }
    };

    frame = window.requestAnimationFrame(render);

    return () => {
      window.cancelAnimationFrame(frame);
      applyStatic();
    };
  }, [analyserRef, spectrumActive, staticHeights]);

  return (
    <div className="mp-waveform">
      <span className="mp-waveform__time">{formatTime(currentTime)}</span>

      <div
        className="mp-waveform__bars"
        data-testid="mp-waveform"
        data-spectrum-active={spectrumActive ? 'true' : 'false'}
      >
        {staticHeights.map((_, index) => (
          <span
            key={index}
            ref={(node) => {
              barRefs.current[index] = node;
            }}
            className={`mp-waveform__bar ${index + 1 <= ratio * BAR_COUNT ? 'is-played' : ''}`}
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
