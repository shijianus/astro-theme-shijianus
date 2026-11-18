import React from 'react';
import { ArrowDown, ChevronUp } from 'lucide-react';
import {
  formatMonthDay,
  resolveAuthorBadges,
  type GestureNode,
} from '../../../lib/gesture-client';
import { renderCommentMarkdown } from '../../../lib/comment-markdown';
import { GestureAvatar } from './GestureAvatar';

interface DirectRepliesTimelineProps {
  replies: GestureNode[];
  currentFloorIndex: number;
  onCollapse: () => void;
  onJumpToFloor: (targetFloorIndex: number, originFloorIndex: number) => void;
}

/**
 * Scene A (Reply-Target Perspective 1-to-N):
 * Non-sticky 32px avatars connected by a continuous 1px vertical timeline line (│)
 * running straight through every reply avatar center down to the bottom [ ^ ] collapse button.
 */
export function DirectRepliesTimeline({
  replies,
  currentFloorIndex,
  onCollapse,
  onJumpToFloor,
}: DirectRepliesTimelineProps) {
  if (!replies.length) return null;

  return (
    <div className="gd-direct-replies-timeline" aria-label="直接回复时间线">
      {replies.map((reply) => {
        const badges = resolveAuthorBadges(reply);
        const targetFloor = reply.floorIndex || 2;

        return (
          <div key={`timeline-${reply.id}`} className="gd-timeline-reply-row">
            {/* Left Timeline Rail: Non-sticky 32px avatar + continuous vertical 1px line */}
            <div className="gd-timeline-reply-rail">
              <span className="gd-timeline-line-top" aria-hidden="true" />
              <GestureAvatar
                name={reply.authorName}
                avatar={reply.authorAvatar}
                size={32}
                isOwner={badges.isOwner}
                className="gd-timeline-avatar"
              />
              <span className="gd-timeline-line-bottom" aria-hidden="true" />
            </div>

            {/* Right Reply Card */}
            <div className="gd-timeline-reply-card">
              <div className="gd-timeline-reply-head">
                <div className="gd-author-badges">
                  <span className="gd-author-name">{reply.authorName}</span>
                  {badges.roleLabel && <span className="gd-role-badge">{badges.roleLabel}</span>}
                  <span className="gd-level-badge">{badges.levelLabel}</span>
                </div>
                <span className="gd-timeline-reply-date">{formatMonthDay(reply.createdAt)}</span>
              </div>

              <div
                className="gd-markdown-body gd-timeline-reply-body"
                dangerouslySetInnerHTML={{ __html: renderCommentMarkdown(reply.message) }}
              />

              <div className="gd-timeline-reply-foot">
                <button
                  type="button"
                  className="gd-jump-post-btn"
                  onClick={() => onJumpToFloor(targetFloor, currentFloorIndex)}
                >
                  <ArrowDown className="w-3 h-3" />
                  <span>跳至贴文</span>
                </button>
              </div>
            </div>
          </div>
        );
      })}

      {/* Bottom [ ^ ] Collapse Toggle aligned with vertical timeline line */}
      <div className="gd-timeline-collapse-row">
        <div className="gd-timeline-reply-rail is-end">
          <span className="gd-timeline-line-top" aria-hidden="true" />
          <button
            type="button"
            className="gd-timeline-bottom-collapse-btn"
            onClick={onCollapse}
            title="收起直接回复"
            aria-label="收起直接回复"
          >
            <ChevronUp className="w-3.5 h-3.5" />
          </button>
        </div>
        <button
          type="button"
          className="gd-timeline-collapse-label"
          onClick={onCollapse}
        >
          收起 {replies.length} 条直接回复
        </button>
      </div>
    </div>
  );
}
