import { Minus } from 'lucide-react';
import { usePlayerLocale } from '../i18n';
import { getSourceLabel } from '../lib/source';
import type { MusicTrack } from '../types';

type QueueViewProps = {
  queue: MusicTrack[];
  currentIndex: number;
  isPlaying: boolean;
  onSelect: (index: number) => void;
  onRemove: (index: number) => void;
  onGoDiscover: () => void;
};

export function QueueView({
  queue,
  currentIndex,
  isPlaying,
  onSelect,
  onRemove,
  onGoDiscover,
}: QueueViewProps) {
  const { t } = usePlayerLocale();

  return (
    <div className="mp-queue-view" data-testid="mp-queue-view">
      <div className="mp-view-head">
        <span className="mp-view-head__title">
          {t('当前播放队列')} <span className="mp-count">({queue.length})</span>
        </span>
      </div>

      {queue.length === 0 ? (
        <div className="mp-empty">
          <p>{t('当前播放队列为空')}</p>
          <button type="button" className="mp-text-btn" onClick={onGoDiscover}>
            {t('前往发现新歌')}
          </button>
        </div>
      ) : (
        <div className="mp-track-list" data-testid="mp-queue-list">
          {queue.map((track, index) => {
            const current = index === currentIndex;
            return (
              <div
                key={`${track.id}-${index}`}
                className={`mp-track-row ${current ? 'is-current' : ''}`}
                data-testid="mp-queue-item"
              >
                <button
                  type="button"
                  className="mp-track-row__main"
                  onClick={() => onSelect(index)}
                  aria-current={current ? 'true' : undefined}
                >
                  <span className="mp-track-row__index">
                    {current && isPlaying ? (
                      <span className="mp-eq" aria-hidden="true">
                        <span />
                        <span />
                        <span />
                      </span>
                    ) : (
                      index + 1
                    )}
                  </span>
                  <span className="mp-track-row__info">
                    <strong title={track.name}>{track.name}</strong>
                    <span className="mp-track-row__meta">
                      <span className="mp-track-row__artist">{track.artist}</span>
                      <span className="mp-source mp-source--row">{getSourceLabel(track.source, t)}</span>
                    </span>
                  </span>
                </button>

                <button
                  type="button"
                  className="mp-row-action"
                  onClick={() => onRemove(index)}
                  title={t('移出播放队列')}
                  aria-label={t('移出播放队列')}
                >
                  <Minus size={16} strokeWidth={1.5} aria-hidden="true" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
