import React, { useMemo, useState } from 'react';
import { Heart } from 'lucide-react';
import type { ReactionDetailItem } from '../../../lib/gesture-client';
import { GestureAvatar } from './GestureAvatar';

export const QUICK_REACTION_EMOJIS = ['👍', '❤️', '🚀', '💡', '🔥', '🎉', '✨', '😂'];

interface EmojiReactionClusterProps {
  summary?: Record<string, number>;
  details?: ReactionDetailItem[];
  totalLikes: number;
  userReaction?: string | null;
  onReact: (emoji: string) => void;
  showHeartTrigger?: boolean;
  hideSummaryPill?: boolean;
}

/**
 * ZONE 4 Left: Top-4 Aggregated Emoji Pill + Hover Full Breakdown Popover
 * Plus optional [♡] quick emoji picker trigger for OP Gesture.
 */
export function EmojiReactionCluster({
  summary = {},
  details = [],
  totalLikes,
  userReaction,
  onReact,
  showHeartTrigger = false,
  hideSummaryPill = false,
}: EmojiReactionClusterProps) {
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [showQuickPicker, setShowQuickPicker] = useState(false);

  const sortedEntries = useMemo(() => {
    return Object.entries(summary)
      .filter(([, count]) => Number(count) > 0)
      .sort((a, b) => Number(b[1]) - Number(a[1]));
  }, [summary]);

  // Top 4 emojis sorted descending
  const topFour = sortedEntries.slice(0, 4);
  const computedTotal = sortedEntries.reduce((acc, [, cnt]) => acc + Number(cnt), 0) || totalLikes;

  const breakdownList: ReactionDetailItem[] = useMemo(() => {
    if (details && details.length > 0) return details;
    return sortedEntries.map(([emoji, count]) => ({
      emoji,
      count: Number(count),
      users: [],
    }));
  }, [details, sortedEntries]);

  return (
    <div className="gd-reaction-cluster-wrap">
      {!hideSummaryPill && (computedTotal > 0 ? (
        <div
          className="gd-reaction-pill-host"
          onMouseEnter={() => setShowBreakdown(true)}
          onMouseLeave={() => setShowBreakdown(false)}
        >
          <button
            type="button"
            className={`gd-agg-emoji-pill ${userReaction ? 'has-user-reaction' : ''}`}
            onClick={() => onReact(userReaction || topFour[0]?.[0] || '👍')}
            aria-label={`共 ${computedTotal} 次表态，点击表态或悬浮查看明细`}
          >
            <span className="gd-agg-emoji-icons">
              {topFour.map(([emoji]) => (
                <span key={emoji} className="gd-agg-emoji-char">
                  {emoji}
                </span>
              ))}
            </span>
            <span className="gd-agg-emoji-total">{computedTotal}</span>
          </button>

          {showBreakdown && breakdownList.length > 0 && (
            <div className="gd-reaction-breakdown-popover" role="tooltip">
              <div className="gd-breakdown-header">表态明细 ({computedTotal})</div>
              <div className="gd-breakdown-list">
                {breakdownList.map((item) => (
                  <button
                    key={item.emoji}
                    type="button"
                    className={`gd-breakdown-row ${userReaction === item.emoji ? 'is-mine' : ''}`}
                    onClick={() => onReact(item.emoji)}
                  >
                    <span className="gd-breakdown-emoji">{item.emoji}</span>
                    <span className="gd-breakdown-count">{item.count}</span>
                    {item.users.length > 0 && (
                      <span className="gd-breakdown-users">
                        {item.users.slice(0, 4).map((u, idx) => (
                          <span key={`${u.name}-${idx}`} className="gd-breakdown-user-chip">
                            <GestureAvatar name={u.name} avatar={u.avatar} size={18} />
                            <span>{u.name}</span>
                          </span>
                        ))}
                        {item.users.length > 4 && (
                          <span className="gd-breakdown-more">+{item.users.length - 4}</span>
                        )}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <button
          type="button"
          className="gd-agg-emoji-pill is-empty"
          onClick={() => onReact('👍')}
          title="点赞表态"
        >
          <span>👍</span>
          <span className="gd-agg-emoji-total">0</span>
        </button>
      ))}

      {showHeartTrigger && (
        <div
          className="gd-heart-picker-host"
          onMouseLeave={() => setShowQuickPicker(false)}
        >
          <button
            type="button"
            className={`gd-icon-btn gd-heart-btn ${userReaction ? 'is-reacted' : ''}`}
            onClick={() => setShowQuickPicker((prev) => !prev)}
            title="选择表情表态"
            aria-label="选择表情表态"
          >
            <Heart className="w-4 h-4" />
          </button>

          {showQuickPicker && (
            <div className="gd-quick-emoji-bar" role="menu">
              {QUICK_REACTION_EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  className={`gd-quick-emoji-btn ${userReaction === emoji ? 'is-active' : ''}`}
                  onClick={() => {
                    onReact(emoji);
                    setShowQuickPicker(false);
                  }}
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
