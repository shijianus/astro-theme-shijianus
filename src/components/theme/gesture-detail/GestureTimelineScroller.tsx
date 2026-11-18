import React, { useCallback, useRef, useState } from 'react';
import { Bell, BellRing, BookOpen, CornerUpLeft, Reply, Undo2 } from 'lucide-react';
import {
  formatCompactRelative,
  formatMonthDay,
  type JumpOriginAnchor,
} from '../../../lib/gesture-client';

interface GestureTimelineScrollerProps {
  totalFloors: number;
  currentFloor: number;
  currentFloorDate?: string;
  startDate?: string;
  latestDate?: string;
  scrollPercent: number;
  jumpOrigin: JumpOriginAnchor | null;
  hotFilterActive: boolean;
  subscribed: boolean;
  onJumpToFloor: (floorIndex: number) => void;
  onReturnToOrigin: () => void;
  onToggleHotFilter: () => void;
  onReplyOp: () => void;
  onToggleSubscribe: () => void;
}

/**
 * Right-side Sticky Proportional Timeline Scroller & Cross-Floor Jump Origin Anchor (├─ [ 返回 ]).
 * Desktop: sticky right rail aligned beside monolithic glass discussion container.
 * Mobile (<= 1024px): compact bottom-right pill avoiding bottom-left MusicPocket.
 */
export function GestureTimelineScroller({
  totalFloors,
  currentFloor,
  currentFloorDate,
  startDate,
  latestDate,
  scrollPercent,
  jumpOrigin,
  hotFilterActive,
  subscribed,
  onJumpToFloor,
  onReturnToOrigin,
  onToggleHotFilter,
  onReplyOp,
  onToggleSubscribe,
}: GestureTimelineScrollerProps) {
  const [quickJumpOpen, setQuickJumpOpen] = useState(false);
  const [jumpInput, setJumpInput] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [previewFloor, setPreviewFloor] = useState<number | null>(null);
  const railRef = useRef<HTMLDivElement>(null);

  const safeTotal = Math.max(1, totalFloors);
  const displayFloor = previewFloor ?? currentFloor;
  const thumbPercent =
    safeTotal <= 1 ? 0 : Math.min(100, Math.max(0, ((displayFloor - 1) / (safeTotal - 1)) * 100));

  const computeFloorFromClientY = useCallback(
    (clientY: number) => {
      const rail = railRef.current;
      if (!rail) return 1;
      const rect = rail.getBoundingClientRect();
      const ratio = Math.min(1, Math.max(0, (clientY - rect.top) / Math.max(1, rect.height)));
      return Math.min(safeTotal, Math.max(1, Math.round(ratio * (safeTotal - 1)) + 1));
    },
    [safeTotal]
  );

  const handleRailPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    e.preventDefault();
    setIsDragging(true);
    const floor = computeFloorFromClientY(e.clientY);
    setPreviewFloor(floor);
    onJumpToFloor(floor);

    const handleMove = (mv: PointerEvent) => {
      const f = computeFloorFromClientY(mv.clientY);
      setPreviewFloor(f);
      onJumpToFloor(f);
    };

    const handleUp = () => {
      setIsDragging(false);
      setPreviewFloor(null);
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
    };

    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleUp);
  };

  const handleQuickJumpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = Number.parseInt(jumpInput.trim(), 10);
    if (Number.isFinite(parsed) && parsed >= 1 && parsed <= safeTotal) {
      onJumpToFloor(parsed);
      setQuickJumpOpen(false);
      setJumpInput('');
    }
  };

  return (
    <aside className="gd-timeline-aside" aria-label="贴文楼层时间轴滑块">
      <div className={`gd-timeline-card gb-floor-scroller-card ${isDragging ? 'is-dragging' : ''}`}>
        {/* 1. Top [📖] Quick Jump Popover Toggle */}
        <div className="gd-tl-top-wrap">
          <button
            type="button"
            className={`gd-tl-overview-btn ${quickJumpOpen ? 'is-active' : ''}`}
            onClick={() => setQuickJumpOpen((prev) => !prev)}
            title="阅读总览 / 快捷楼层跳转"
            aria-expanded={quickJumpOpen}
          >
            <BookOpen className="w-4 h-4" />
          </button>

          {quickJumpOpen && (
            <div className="gd-tl-quick-popover">
              <div className="gd-tl-quick-title">快捷楼层跳转 (1 ~ {safeTotal})</div>
              <form className="gd-tl-quick-form" onSubmit={handleQuickJumpSubmit}>
                <input
                  type="number"
                  min={1}
                  max={safeTotal}
                  value={jumpInput}
                  onChange={(e) => setJumpInput(e.target.value)}
                  placeholder={`输入 1-${safeTotal}`}
                  className="gd-tl-quick-input"
                />
                <button type="submit" className="gd-tl-quick-go">
                  跳转
                </button>
              </form>
              <div className="gd-tl-quick-presets">
                <button
                  type="button"
                  onClick={() => {
                    onJumpToFloor(1);
                    setQuickJumpOpen(false);
                  }}
                >
                  回到 1 楼
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onJumpToFloor(safeTotal);
                    setQuickJumpOpen(false);
                  }}
                >
                  跳至最新 ({safeTotal})
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 2. Start Date Capsule */}
        <button
          type="button"
          className="gd-tl-date-capsule"
          onClick={() => onJumpToFloor(1)}
          title="回到主贴文"
        >
          {formatMonthDay(startDate)}
        </button>

        {/* 4. Proportional Timeline Rail (100% maps 1 ~ N) */}
        <div className="gd-tl-rail-section">
          <div
            ref={railRef}
            className="gd-tl-rail"
            onPointerDown={handleRailPointerDown}
            role="slider"
            aria-valuemin={1}
            aria-valuemax={safeTotal}
            aria-valuenow={displayFloor}
            aria-label="楼层阅读进度滑块"
          >
            {/* Floor Notches along rail */}
            {Array.from({ length: safeTotal }).map((_, idx) => {
              const floorNum = idx + 1;
              const pct = safeTotal <= 1 ? 0 : (idx / (safeTotal - 1)) * 100;
              return (
                <button
                  key={floorNum}
                  type="button"
                  className={`gb-scroller-notch gd-tl-notch ${currentFloor >= floorNum ? 'is-reached' : ''} ${currentFloor === floorNum ? 'is-current' : ''}`}
                  style={{ top: `${pct}%` }}
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={(e) => {
                    e.stopPropagation();
                    onJumpToFloor(floorNum);
                  }}
                  title={`跳至第 ${floorNum} 楼`}
                />
              );
            })}

            {/* 3. Cyan-Blue Highlighted Active Thumb + Floor/Date Indicator */}
            <div
              className="gd-tl-active-thumb"
              style={{ top: `${thumbPercent}%` }}
            >
              <span className="gd-tl-thumb-bar" />
              <div className="gd-tl-thumb-readout">
                <strong className="gb-scroller-floor-label">
                  {displayFloor} / {safeTotal}
                </strong>
                <span>{formatMonthDay(currentFloorDate || startDate)}</span>
              </div>
            </div>

            {/* 5. Cross-Floor Jump Origin Anchor: ├─ [ 返回 ] */}
            {jumpOrigin && (
              <div
                className="gd-tl-return-anchor"
                style={{ top: `${Math.min(96, Math.max(4, jumpOrigin.percent))}%` }}
                onPointerDown={(e) => e.stopPropagation()}
              >
                <span className="gd-tl-return-tick" aria-hidden="true" />
                <button
                  type="button"
                  className="gd-tl-return-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    onReturnToOrigin();
                  }}
                  title={`返回跳转前位置 (${jumpOrigin.floorIndex} 楼)`}
                >
                  <Undo2 className="w-3 h-3" />
                  <span>返回</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* 6. Latest Active Relative Time */}
        <button
          type="button"
          className="gd-tl-latest-time"
          onClick={() => onJumpToFloor(safeTotal)}
          title="跳至最新回复"
        >
          {formatCompactRelative(latestDate)}
        </button>

        {/* 7. Bottom Control Dock: [📚 熱門回覆] [↩] [🔔] */}
        <div className="gd-tl-bottom-dock">
          <button
            type="button"
            className={`gd-tl-dock-btn is-hot-filter ${hotFilterActive ? 'is-active' : ''}`}
            onClick={onToggleHotFilter}
            title={hotFilterActive ? '退出热门筛选' : '只看热门回复'}
            aria-pressed={hotFilterActive}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>熱門回覆</span>
          </button>

          <button
            type="button"
            className="gd-tl-dock-btn"
            onClick={onReplyOp}
            title="回复主贴"
            aria-label="回复主贴"
          >
            <Reply className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            className={`gd-tl-dock-btn ${subscribed ? 'is-subscribed' : ''}`}
            onClick={onToggleSubscribe}
            title={subscribed ? '已订阅贴文更新通知' : '订阅贴文更新通知'}
            aria-pressed={subscribed}
            aria-label="订阅通知"
          >
            {subscribed ? <BellRing className="w-3.5 h-3.5" /> : <Bell className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Mobile Floating Return Anchor if jumped on <=1024px */}
        {jumpOrigin && (
          <button
            type="button"
            className="gd-mobile-return-pill"
            onClick={onReturnToOrigin}
          >
            <CornerUpLeft className="w-3.5 h-3.5" />
            <span>返回 {jumpOrigin.floorIndex}F</span>
          </button>
        )}
      </div>

      {/* Screen-reader / debug percentage indicator */}
      <span className="sr-only">{scrollPercent}%</span>
    </aside>
  );
}
