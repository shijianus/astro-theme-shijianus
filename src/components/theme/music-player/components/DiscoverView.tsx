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
  onSearch: (query: string) => void;
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
  onSearch,
  onLoadMore,
  onPlay,
  onAdd,
}: DiscoverViewProps) {
  const { t } = usePlayerLocale();

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
        <button type="submit" disabled={loading} data-testid="mp-search-submit">
          {loading ? <span className="mp-spinner" aria-hidden="true" /> : t('检索')}
        </button>
      </form>

      <div className="mp-discover-results">
        {error ? (
          <div className="mp-empty">
            <p>{error}</p>
            <button type="button" className="mp-text-btn" onClick={() => onSearch(query)}>
              {t('重试')}
            </button>
          </div>
        ) : results.length === 0 ? (
          <div className="mp-empty">
            <p>{loading ? t('正在检索...') : t('没有找到相关曲目')}</p>
          </div>
        ) : (
          <div className="mp-track-list" data-testid="mp-discover-list">
            {results.map((track, index) => (
              <div key={`${track.id}-${index}`} className="mp-track-row" data-testid="mp-discover-item">
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
        )}
      </div>

      {!error && results.length > 0 && (
        <div className="mp-discover-foot">
          <button
            type="button"
            className="mp-load-more"
            onClick={onLoadMore}
            disabled={!hasMore || loading}
            data-testid="mp-load-more"
          >
            {hasMore ? t('加载更多') : t('没有更多了')}
          </button>
        </div>
      )}
    </div>
  );
}
