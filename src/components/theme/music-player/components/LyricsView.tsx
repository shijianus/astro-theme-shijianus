import { memo, useCallback, useEffect, useRef } from 'react';
import type { KeyboardEvent as ReactKeyboardEvent, PointerEvent as ReactPointerEvent } from 'react';
import { usePlayerLocale } from '../i18n';
import { formatTime } from '../lib/audio';
import type { LyricLine, LyricsStatus, MusicTrack } from '../types';
import { Marquee } from './Marquee';

type LyricsViewProps = {
  track: MusicTrack | null;
  lines: LyricLine[];
  activeIndex: number;
  status: LyricsStatus;
  onSeek: (time: number) => void;
  onRetry: () => void;
};

const USER_SCROLL_RESUME_MS = 3500;

export const LyricsView = memo(function LyricsView({ track, lines, activeIndex, status, onSeek, onRetry }: LyricsViewProps) {
  const { t } = usePlayerLocale();
  const scrollRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<HTMLButtonElement>(null);
  const userScrollingRef = useRef(false);
  const autoScrollUntilRef = useRef(0);
  const resumeTimerRef = useRef<number | null>(null);

  const scrollToActive = useCallback(() => {
    const container = scrollRef.current;
    const node = activeRef.current;
    if (!container || !node) return;

    const reduceMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const nodeRect = node.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();
    const target =
      container.scrollTop +
      (nodeRect.top - containerRect.top) -
      container.clientHeight / 2 +
      nodeRect.height / 2;

    autoScrollUntilRef.current = Date.now() + 900;
    container.scrollTo({
      top: Math.max(0, target),
      behavior: reduceMotion ? 'auto' : 'smooth',
    });
  }, []);

  const markUserScroll = useCallback(() => {
    userScrollingRef.current = true;
    if (resumeTimerRef.current !== null) window.clearTimeout(resumeTimerRef.current);
    resumeTimerRef.current = window.setTimeout(() => {
      userScrollingRef.current = false;
      resumeTimerRef.current = null;
      scrollToActive();
    }, USER_SCROLL_RESUME_MS);
  }, [scrollToActive]);

  const handleScroll = useCallback(() => {
    if (Date.now() < autoScrollUntilRef.current) return;
    markUserScroll();
  }, [markUserScroll]);

  useEffect(() => {
    if (status !== 'ready' || activeIndex < 0 || userScrollingRef.current) return;
    const frame = window.requestAnimationFrame(scrollToActive);
    return () => window.cancelAnimationFrame(frame);
  }, [activeIndex, scrollToActive, status]);

  useEffect(() => {
    return () => {
      if (resumeTimerRef.current !== null) window.clearTimeout(resumeTimerRef.current);
    };
  }, []);

  const handleKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', 'Home', 'End'].includes(event.key)) {
      markUserScroll();
    }
  };

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if ((event.target as HTMLElement).closest('.mp-lyric-line')) return;
    markUserScroll();
  };

  return (
    <div className="mp-lyrics-view" data-testid="mp-lyrics-view">
      <div className="mp-view-head">
        <Marquee text={track?.name || t('暂无播放曲目')} className="mp-view-head__title" />
        <span className="mp-view-head__sub">{track?.artist || t('静心享受纯粹旋律')}</span>
      </div>

      {status === 'loading' ? (
        <div className="mp-empty" data-testid="mp-lyrics-status">
          <span className="mp-spinner" aria-hidden="true" />
          <p>{t('正在同步歌词...')}</p>
        </div>
      ) : status === 'error' ? (
        <div className="mp-empty" data-testid="mp-lyrics-status">
          <p>{t('歌词加载失败')}</p>
          <button type="button" className="mp-text-btn" onClick={onRetry}>
            {t('重试')}
          </button>
        </div>
      ) : status === 'instrumental' ? (
        <div className="mp-empty" data-testid="mp-lyrics-status">
          <p>{t('纯音乐，请欣赏')}</p>
          <small>{t('当前曲目为器乐演奏或无填词纯音')}</small>
        </div>
      ) : status !== 'ready' || lines.length === 0 ? (
        <div className="mp-empty" data-testid="mp-lyrics-status">
          <p>{t('暂无歌词')}</p>
          <small>{t('当前曲目暂时没有可用歌词。')}</small>
        </div>
      ) : (
        <div
          ref={scrollRef}
          className="mp-lyrics-scroll"
          data-testid="mp-lyrics-scroll"
          onWheel={markUserScroll}
          onTouchMove={markUserScroll}
          onScroll={handleScroll}
          onPointerDown={handlePointerDown}
          onKeyDown={handleKeyDown}
          tabIndex={0}
        >
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
                data-testid="mp-lyric-line"
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
});
