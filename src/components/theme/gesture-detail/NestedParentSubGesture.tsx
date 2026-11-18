import React from 'react';
import { ArrowUp, ChevronDown } from 'lucide-react';
import {
  formatMonthDay,
  resolveAuthorBadges,
  type GestureNode,
} from '../../../lib/gesture-client';
import { renderCommentMarkdown } from '../../../lib/comment-markdown';
import { GestureAvatar } from './GestureAvatar';

interface NestedParentSubGestureProps {
  parentNode: GestureNode;
  currentFloorIndex: number;
  containerRef: React.RefObject<HTMLDivElement | null>;
  onCollapseWithCompensation: () => void;
  onJumpToFloor: (targetFloorIndex: number, originFloorIndex: number) => void;
}

/**
 * Scene B (Reply-er Perspective 1-to-1):
 * Nested parent SubGesture expanded directly above the replyer's body inside the right column.
 * Features:
 * - Inner sticky 36px avatar + [⌄] collapse button connected by an explicit 1px vertical line (│)
 * - Outer replyer sticky avatar stays sticky simultaneously (Dual Sticky Avatars)
 * - Top-right [↑ 跳至贴文] button to jump to parent's original floor (pins ├─ [ 返回 ])
 */
export function NestedParentSubGesture({
  parentNode,
  currentFloorIndex,
  containerRef,
  onCollapseWithCompensation,
  onJumpToFloor,
}: NestedParentSubGestureProps) {
  const badges = resolveAuthorBadges(parentNode);
  const targetFloor = parentNode.floorIndex || 1;

  return (
    <div ref={containerRef} className="gd-nested-parent-box" aria-label="展开的被回复父楼层">
      {/* Inner Left Rail: Inner Sticky Avatar + Explicit 1px Vertical Line │ + [⌄] Collapse Button */}
      <div className="gd-nested-parent-rail">
        <div className="gd-nested-parent-sticky-cluster">
          <GestureAvatar
            name={parentNode.authorName}
            avatar={parentNode.authorAvatar}
            size={36}
            isOwner={badges.isOwner}
          />
          <span className="gd-nested-rail-stem" aria-hidden="true" />
          <button
            type="button"
            className="gd-nested-collapse-btn"
            onClick={onCollapseWithCompensation}
            title="收起被回复楼层"
            aria-label="收起被回复楼层"
          >
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
        </div>
        <span className="gd-nested-rail-line" aria-hidden="true" />
      </div>

      {/* Inner Right Content Column */}
      <div className="gd-nested-parent-content">
        <div className="gd-nested-parent-head">
          <div className="gd-author-badges">
            <span className="gd-author-name">{parentNode.authorName}</span>
            {badges.roleLabel && <span className="gd-role-badge">{badges.roleLabel}</span>}
            <span className="gd-level-badge">{badges.levelLabel}</span>
            <span className="gd-nested-date">{formatMonthDay(parentNode.createdAt)}</span>
          </div>

          <button
            type="button"
            className="gd-jump-post-btn"
            onClick={() => onJumpToFloor(targetFloor, currentFloorIndex)}
          >
            <ArrowUp className="w-3 h-3" />
            <span>跳至贴文</span>
          </button>
        </div>

        <div
          className="gd-markdown-body gd-nested-parent-body"
          dangerouslySetInnerHTML={{ __html: renderCommentMarkdown(parentNode.message) }}
        />
      </div>
    </div>
  );
}
