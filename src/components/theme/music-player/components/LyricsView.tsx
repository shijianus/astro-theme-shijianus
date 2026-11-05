import { useEffect, useRef } from 'react';
import { usePlayerLocale } from '../i18n';
import { formatTime } from '../lib/audio';
import type { LyricLine, MusicTrack } from '../types';
import { Marquee } from './Marquee';

type LyricsViewProps = {
  track: MusicTrack | null;
  lines: LyricLine[];
  activeIndex: number;
  onSeek: (time: number) => void;
};

export function LyricsView({ track, lines, activeIndex, onSeek }: LyricsViewProps) {
  const { t } = usePlayerLocale();
  const activeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const node = activeRef.current;
    if (!node) return;
    const reduceMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    node.scrollIntoView({ block: 'center', behavior: reduceMotion ? 'auto' : 'smooth' });
  }, [activeIndex]);

  return (
    <div className="mp-lyrics-view" data-testid="mp-lyrics-view">
      <div className="mp-view-head">
        <Marquee text={track?.name || t('暂无播放曲目')} className="mp-view-head__title" />
        <span className="mp-view-head__sub">{track?.artist || t('静心享受纯粹旋律')}</span>
      </div>

      {lines.length === 0 ? (
        <div className="mp-empty">
          <p>{t('暂无可用歌词')}</p>
          <small>{t('当前曲目暂时没有可用歌词。')}</small>
        </div>
      ) : (
        <div className="mp-lyrics-scroll" data-testid="mp-lyrics-scroll">
          {lines.map((line, index) => {
            const active = index === activeIndex;
            return (
              <button
                key={`${line.time}-${index}`}
                ref={active ? activeRef : null}
                type="button"
                className={`mp-lyric-line ${active ? 'is-active' : ''}`}
                onClick={() => onSeek(line.time)}
                title={`${formatTime(line.time)} - ${t('点击试听')}`}
                aria-current={active ? 'true' : undefined}
              >
                <span className="mp-lyric-line__time">{formatTime(line.time)}</span>
                <span className="mp-lyric-line__text">{line.text}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
