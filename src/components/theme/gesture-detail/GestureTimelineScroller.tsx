import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type RefObject } from 'react';
import { Bell, BookOpen, Library, Reply } from 'lucide-react';
import { gestureTimestamp } from '../../../lib/gesture-text';
import {
  formatCompactRelative,
  formatMonthDay,
  type GestureNode,
} from '../../../lib/gesture-detail-client';

interface Props {
  content: RefObject<HTMLElement | null>;
  floors: GestureNode[];
  page: number;
  latest: string;
  origin: number | null;
  fading: boolean;
  hotOnly: boolean;
  subscribed: boolean;
  onToggleHot: () => void;
  onQuickReply: () => void;
  onToggleSubscribe: () => void;
  onJump: (floor: number, offset?: number, instant?: boolean) => void;
  onReturn: () => void;
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

/**
 * Borderless, dot-free vertical timeline scroller with a zero-jitter drag state machine:
 * - Clean 2px vertical track line + single 3x28px #38bdf8 draggable indicator
 * - PointerCapture + isDraggingRef locks out window scroll feedback during drag
 * - Uses requestAnimationFrame + window.scrollTo({ behavior: 'instant' }) (never smooth during drag)
 * - Cross-jump return anchor (`├─ 返回`) rendered only after cross-floor navigation
 */
export function GestureTimelineScroller({
  content,
  floors,
  page,
  latest,
  origin,
  fading,
  hotOnly,
  subscribed,
  onToggleHot,
  onQuickReply,
  onToggleSubscribe,
  onJump,
  onReturn,
}: Props) {
  const [currentFloor, setCurrentFloor] = useState(1);
  const [dragRatio, setDragRatio] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [floorInput, setFloorInput] = useState('');
  const [now, setNow] = useState(() => Date.now());

  const railRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);
  const dragRailRectRef = useRef<{ top: number; height: number } | null>(null);
  const dragRafRef = useRef(0);
  const pendingRatioRef = useRef<number | null>(null);

  const total = Math.max(1, floors.length);

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => () => cancelAnimationFrame(dragRafRef.current), []);

  // Guarantee latest activity timestamp is never earlier than the OP start date (prevents date reversal).
  const latestActivity = useMemo(() => {
    const candidates = [
      latest,
      ...floors.flatMap((floor) => [floor.createdAt, floor.updatedAt || floor.createdAt]),
    ]
      .filter(Boolean)
      .map(gestureTimestamp)
      .filter((iso) => Number.isFinite(Date.parse(iso)));

    const startTs = floors[0]?.createdAt ? Date.parse(gestureTimestamp(floors[0].createdAt)) : 0;
    let bestIso = floors[0]?.createdAt ? gestureTimestamp(floors[0].createdAt) : '';
    let bestTs = Number.isFinite(startTs) ? startTs : 0;

    for (const iso of candidates) {
      const ts = Date.parse(iso);
      if (ts >= bestTs) {
        bestTs = ts;
        bestIso = iso;
      }
    }
    return bestIso;
  }, [latest, floors]);

  const relativeLatest = formatCompactRelative(latestActivity, now);

  // Scroll spy: strictly skips updates while user is dragging the thumb.
  useLayoutEffect(() => {
    const main = content.current;
    if (!main) return;
    const elements = Array.from(main.querySelectorAll<HTMLElement>('[data-floor-index]'));
    let frame = 0;

    function syncFromScroll() {
      frame = 0;
      if (isDraggingRef.current) return;

      const isMobile = window.matchMedia('(max-width: 760px)').matches;
      const aside = railRef.current?.closest<HTMLElement>('.gd-timeline-aside');
      if (aside) {
        aside.dataset.stuck = String(
          isMobile && window.scrollY > 12 && aside.getBoundingClientRect().top <= 62,
        );
      }

      if (elements.length === 0) return;

      const anchor = isMobile ? 150 : 140;
      const headerBottom = isMobile ? 105 : 72;

      let lo = 0;
      let hi = elements.length;
      while (lo < hi) {
        const mid = (lo + hi) >>> 1;
        if (elements[mid].getBoundingClientRect().top <= anchor) lo = mid + 1;
        else hi = mid;
      }

      let idx = Math.max(0, lo - 1);
      while (idx + 1 < elements.length) {
        const curRect = elements[idx].getBoundingClientRect();
        const nextRect = elements[idx + 1].getBoundingClientRect();
        if (curRect.bottom <= headerBottom && nextRect.top < window.innerHeight * 0.85) {
          idx += 1;
        } else {
          break;
        }
      }

      const atDocBottom =
        window.scrollY > 80 &&
        window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 8;
      if (atDocBottom) {
        const lastRect = elements[elements.length - 1].getBoundingClientRect();
        if (lastRect.bottom <= window.innerHeight + 8 && lastRect.top < window.innerHeight * 0.75) {
          idx = elements.length - 1;
        }
      }

      const detected = Number(elements[idx]?.dataset.floorIndex || 1);
      setCurrentFloor(detected);
    }

    const onScrollOrResize = () => {
      if (isDraggingRef.current) return;
      if (!frame) frame = requestAnimationFrame(syncFromScroll);
    };

    const resizeObserver = new ResizeObserver(onScrollOrResize);
    resizeObserver.observe(main);
    window.addEventListener('scroll', onScrollOrResize, { passive: true });
    window.addEventListener('resize', onScrollOrResize);
    syncFromScroll();

    return () => {
      resizeObserver.disconnect();
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', onScrollOrResize);
      window.removeEventListener('resize', onScrollOrResize);
    };
  }, [page, floors, content]);

  const computeRatio = useCallback((clientY: number): number => {
    const locked = dragRailRectRef.current;
    if (locked && locked.height > 0) {
      return clamp01((clientY - locked.top) / locked.height);
    }
    const rail = railRef.current;
    if (!rail) return 0;
    const rect = rail.getBoundingClientRect();
    if (rect.height <= 0) return 0;
    return clamp01((clientY - rect.top) / rect.height);
  }, []);

  const applyInstantScrollForRatio = useCallback(
    (ratio: number) => {
      const main = content.current;
      if (!main) return false;
      const mounted = Array.from(main.querySelectorAll<HTMLElement>('[data-floor-index]'));
      if (mounted.length === 0) return false;

      const isMobile = window.matchMedia('(max-width: 760px)').matches;
      const stickyOffset = isMobile ? 118 : 96;
      const maxDocScroll = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);

      // When all floors are mounted on the current page, interpolate smoothly across floor anchors.
      if (mounted.length === total && !hotOnly) {
        const anchors: number[] = [];
        for (let i = 0; i < mounted.length; i += 1) {
          const rawTop = window.scrollY + mounted[i].getBoundingClientRect().top - stickyOffset;
          const clamped = Math.max(0, Math.min(maxDocScroll, rawTop));
          anchors.push(i > 0 ? Math.max(anchors[i - 1], clamped) : clamped);
        }
        const pos = ratio * Math.max(0, anchors.length - 1);
        const lo = Math.floor(pos);
        const hi = Math.min(anchors.length - 1, Math.ceil(pos));
        const frac = pos - lo;
        const targetScrollY = anchors[lo] + (anchors[hi] - anchors[lo]) * frac;
        window.scrollTo({ top: targetScrollY, behavior: 'instant' });
        return true;
      }

      // Paginated or filtered mode: instant scroll if target floor is currently mounted.
      const targetFloor = total > 1 ? Math.round(ratio * (total - 1)) + 1 : 1;
      const el = document.getElementById(`floor-${targetFloor}`);
      if (el) {
        const rawTop = window.scrollY + el.getBoundingClientRect().top - stickyOffset;
        const targetScrollY = Math.max(0, Math.min(maxDocScroll, rawTop));
        window.scrollTo({ top: targetScrollY, behavior: 'instant' });
        return true;
      }
      return false;
    },
    [content, total, hotOnly],
  );

  const scheduleDragScroll = useCallback(
    (ratio: number) => {
      pendingRatioRef.current = ratio;
      if (dragRafRef.current) return;
      dragRafRef.current = requestAnimationFrame(() => {
        dragRafRef.current = 0;
        if (pendingRatioRef.current !== null) {
          applyInstantScrollForRatio(pendingRatioRef.current);
        }
      });
    },
    [applyInstantScrollForRatio],
  );

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    const rect = railRef.current?.getBoundingClientRect();
    dragRailRectRef.current = rect && rect.height > 0 ? { top: rect.top, height: rect.height } : null;
    isDraggingRef.current = true;
    setIsDragging(true);
    e.currentTarget.setPointerCapture(e.pointerId);
    const ratio = computeRatio(e.clientY);
    setDragRatio(ratio);
    scheduleDragScroll(ratio);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current) return;
    const ratio = computeRatio(e.clientY);
    setDragRatio(ratio);
    scheduleDragScroll(ratio);
  };

  const finishDrag = (e: React.PointerEvent<HTMLDivElement>, commit: boolean) => {
    if (!isDraggingRef.current) return;
    cancelAnimationFrame(dragRafRef.current);
    dragRafRef.current = 0;

    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }

    const finalRatio = commit ? computeRatio(e.clientY) : (pendingRatioRef.current ?? 0);
    const targetFloor = total > 1 ? Math.round(finalRatio * (total - 1)) + 1 : 1;
    pendingRatioRef.current = null;
    dragRailRectRef.current = null;
    isDraggingRef.current = false;
    setIsDragging(false);

    if (commit) {
      const scrolledInPlace = applyInstantScrollForRatio(finalRatio);
      setCurrentFloor(targetFloor);
      setDragRatio(null);
      if (!scrolledInPlace) {
        onJump(targetFloor, undefined, true);
      }
    } else {
      setDragRatio(null);
    }
  };

  const activeFloor =
    dragRatio !== null
      ? total > 1
        ? Math.round(dragRatio * (total - 1)) + 1
        : 1
      : Math.min(Math.max(1, currentFloor), total);

  const percent =
    dragRatio !== null
      ? dragRatio * 100
      : total > 1
        ? (100 * (activeFloor - 1)) / (total - 1)
        : 0;

  const originPercent =
    origin !== null && total > 1 ? (100 * (Math.min(origin, total) - 1)) / (total - 1) : 0;

  const activeDate = floors[activeFloor - 1]?.createdAt;
  const formatFull = (iso?: string) =>
    iso ? new Date(gestureTimestamp(iso)).toLocaleString('zh-CN') : '';

  return (
    <aside className="gd-timeline-aside" aria-label="楼层时间轴">
      <button
        type="button"
        className="gd-tl-top-btn"
        aria-label="回到主贴顶部"
        title="回到主贴顶部"
        onClick={() => onJump(1)}
      >
        <BookOpen size={14} />
      </button>

      <time
        className="gd-tl-start"
        dateTime={floors[0]?.createdAt}
        title={`话题开始 · ${formatFull(floors[0]?.createdAt)}`}
      >
        {formatMonthDay(floors[0]?.createdAt)}
      </time>

      <div
        className="gd-tl-track-wrap"
        data-dragging={isDragging ? 'true' : 'false'}
        data-return-near={origin !== null && Math.abs(originPercent - percent) < 16 ? 'true' : 'false'}
        style={
          {
            '--progress': `${percent}%`,
            '--origin-progress': `${originPercent}%`,
            '--readout-shift': percent < 50 ? '28px' : '-28px',
          } as React.CSSProperties
        }
      >
        <div
          className="gd-tl-rail"
          ref={railRef}
          tabIndex={0}
          role="slider"
          aria-label="跳转楼层"
          aria-valuemin={1}
          aria-valuemax={total}
          aria-valuenow={activeFloor}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={(e) => finishDrag(e, true)}
          onPointerCancel={(e) => finishDrag(e, false)}
          onKeyDown={(e) => {
            const targets: Record<string, number> = {
              Home: 1,
              End: total,
              ArrowDown: activeFloor + 1,
              ArrowRight: activeFloor + 1,
              ArrowUp: activeFloor - 1,
              ArrowLeft: activeFloor - 1,
              PageDown: activeFloor + 40,
              PageUp: activeFloor - 40,
            };
            if (e.key in targets) {
              e.preventDefault();
              onJump(Math.min(total, Math.max(1, targets[e.key])));
            }
          }}
        >
          <span className="gd-tl-thumb" />
        </div>

        {origin !== null && (
          <button
            type="button"
            className={`gd-return ${fading ? 'is-fading' : ''}`}
            onClick={onReturn}
            title={`返回第 ${origin} 楼原阅读位置`}
            aria-label={`返回第 ${origin} 楼原阅读位置`}
          >
            <span>返回</span>
          </button>
        )}

        <div className="gd-tl-readout">
          <details>
            <summary aria-label="输入楼层跳转">
              {activeFloor} / {total}
            </summary>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const target = Number(floorInput);
                if (target >= 1 && target <= total) {
                  e.currentTarget.closest('details')!.open = false;
                  setFloorInput('');
                  onJump(target);
                }
              }}
            >
              <input
                type="number"
                aria-label="目标楼层"
                min={1}
                max={total}
                required
                value={floorInput}
                onChange={(e) => setFloorInput(e.target.value)}
              />
              <button type="submit">跳转</button>
            </form>
          </details>
          <time dateTime={activeDate}>{formatMonthDay(activeDate)}</time>
        </div>
      </div>

      <time
        className="gd-tl-latest"
        dateTime={latestActivity}
        title={`最后活动时间 · ${formatFull(latestActivity)}`}
      >
        {relativeLatest}
      </time>

      <div className="gd-tl-actions">
        <button
          type="button"
          className={`gd-tl-glass-btn gd-tl-hot-btn ${hotOnly ? 'is-active' : ''}`}
          aria-pressed={hotOnly}
          aria-label={hotOnly ? '查看全部回复' : '只看热门回复'}
          title={hotOnly ? '查看全部回复' : '只看热门回复'}
          onClick={onToggleHot}
        >
          <Library size={13} />
          <span>熱門</span>
        </button>

        <button
          type="button"
          className="gd-tl-glass-btn gd-tl-icon-btn"
          aria-label="回复主贴"
          title="回复主贴"
          onClick={onQuickReply}
        >
          <Reply size={14} />
        </button>

        <button
          type="button"
          className={`gd-tl-glass-btn gd-tl-icon-btn ${subscribed ? 'is-active' : ''}`}
          aria-pressed={subscribed}
          aria-label={subscribed ? '已订阅讨论' : '订阅讨论'}
          title={subscribed ? '已订阅讨论' : '订阅讨论'}
          onClick={onToggleSubscribe}
        >
          <Bell size={14} />
        </button>
      </div>
    </aside>
  );
}
