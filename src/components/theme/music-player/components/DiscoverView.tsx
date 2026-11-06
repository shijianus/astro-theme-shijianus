import { Play, Plus, Search } from 'lucide-react';
import { usePlayerLocale } from '../i18n';
import { getSourceLabel } from '../lib/source';
import type { MusicTrack } from '../types';

type DiscoverViewProps = {
  query: string;
  onQueryChange: (value: string) => void;
  results: MusicTrack[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  cooldownRemaining: number;
  seeds: readonly string[];
  activeSeed: string;
  onSearch: (query: string) => void;
  onSelectSeed: (seed: string) => void;
  onRetry: () => void;
  onLoadMore: () => void;
  onPlay: (track: MusicTrack) => void;
  onAdd: (track: MusicTrack) => void;
};

export function DiscoverView({
  query,
  onQueryChange,
  results,
  loading,
  error,
  hasMore,
  cooldownRemaining,
  seeds,
  activeSeed,
  onSearch,
  onSelectSeed,
  onRetry,
  onLoadMore,
  onPlay,
  onAdd,
}: DiscoverViewProps) {
  const { t } = usePlayerLocale();
  const coolingDown = cooldownRemaining > 0;
  const loadMoreLabel = coolingDown
    ? `${t('冷却中')} · ${cooldownRemaining}s`
    : hasMore
      ? t('加载更多')
      : t('没有更多了');

  return (
    <div className="mp-discover-view" data-testid="mp-discover-view">
      <form
        className="mp-search"
        onSubmit={(event) => {
          event.preventDefault();
          onSearch(query);
        }}
        role="search"
      >
        <Search size={16} strokeWidth={1.5} aria-hidden="true" />
        <input
          type="search"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder={t('检索音乐、歌手...')}
          aria-label={t('检索音乐、歌手...')}
          data-testid="mp-search-input"
        />
        <button type="submit" disabled={loading || coolingDown} data-testid="mp-search-submit">
          {loading ? <span className="mp-spinner" aria-hidden="true" /> : t('检索')}
        </button>
      </form>

      <div className="mp-discover-seeds" aria-label={t('发现与搜索音乐')}>
        {seeds.map((seed) => (
          <button
            key={seed}
            type="button"
            className={`mp-seed ${seed === activeSeed && !query.trim() ? 'is-active' : ''}`}
            onClick={() => onSelectSeed(seed)}
            disabled={coolingDown}
            data-testid={`mp-discover-seed-${seed}`}
          >
            {t(seed)}
          </button>
        ))}
      </div>

      {error && (
        <div className="mp-discover-status" role="status" aria-live="polite" data-testid="mp-discover-error">
          <span>{t(error)}</span>
          {coolingDown && (
            <span className="mp-discover-status__meta">
              {t('请稍后重试')} · {cooldownRemaining}s
            </span>
          )}
          <button type="button" className="mp-text-btn" onClick={onRetry} disabled={loading || coolingDown}>
            {t('重试')}
          </button>
        </div>
      )}

      <div className="mp-discover-results">
        {loading && results.length === 0 ? (
          <div className="mp-empty">
            <span className="mp-spinner" aria-hidden="true" />
            <p>{t('正在检索...')}</p>
          </div>
        ) : results.length === 0 && !error ? (
          <div className="mp-empty">
            <p>{t('没有找到相关曲目')}</p>
          </div>
        ) : results.length > 0 ? (
          <div className="mp-track-list" data-testid="mp-discover-list">
            {results.map((track, index) => (
              <div key={`${track.id}-${index}`} className="mp-track-row" data-testid="mp-discover-item" data-track-id={track.id}>
                <button type="button" className="mp-track-row__main" onClick={() => onPlay(track)}>
                  <span className="mp-track-row__index">{index + 1}</span>
                  <span className="mp-track-row__info">
                    <strong title={track.name}>{track.name}</strong>
                    <span className="mp-track-row__meta">
                      <span className="mp-track-row__artist">{track.artist}</span>
                      <span className="mp-source mp-source--row">{getSourceLabel(track.source, t)}</span>
                    </span>
                  </span>
                </button>

                <span className="mp-row-actions">
                  <button
                    type="button"
                    className="mp-row-action"
                    onClick={() => onAdd(track)}
                    title={t('加入待播列表')}
                    aria-label={t('加入待播列表')}
                  >
                    <Plus size={16} strokeWidth={1.5} aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    className="mp-row-action"
                    onClick={() => onPlay(track)}
                    title={t('立即点播')}
                    aria-label={t('立即点播')}
                  >
                    <Play size={15} strokeWidth={1.5} aria-hidden="true" />
                  </button>
                </span>
              </div>
            ))}
          </div>
        ) : null}
      </div>

      {(results.length > 0 || coolingDown) && (
        <div className="mp-discover-foot">
          <button
            type="button"
            className="mp-load-more"
            onClick={onLoadMore}
            disabled={loading || coolingDown || !hasMore}
            data-testid="mp-load-more"
          >
            {loading ? t('正在检索...') : loadMoreLabel}
          </button>
        </div>
      )}
    </div>
  );
}
