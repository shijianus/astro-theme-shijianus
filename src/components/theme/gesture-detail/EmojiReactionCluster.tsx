import { useEffect, useRef, useState } from 'react';
import { Heart } from 'lucide-react';
import type { ReactionDetailItem } from '../../../lib/gesture-detail-client';
import { GesturePopover } from './GesturePopover';

const QUICK_EMOJIS = ['👍', '❤️', '🚀', '💡', '🔥', '🎉', '✨', '😂'] as const;

interface Props {
  summary?: Record<string, number>;
  details?: ReactionDetailItem[];
  totalLikes: number;
  userReaction?: string | null;
  mode?: 'summary' | 'trigger';
  onReact: (emoji: string) => void | Promise<void>;
}

export function EmojiReactionCluster({
  summary = {},
  details,
  totalLikes,
  userReaction,
  mode = 'summary',
  onReact,
}: Props) {
  const trigger = useRef<HTMLButtonElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const [panel, setPanel] = useState<'details' | 'picker' | null>(null);
  const [pending, setPending] = useState(false);

  const entries = Object.entries(summary)
    .filter(([, count]) => count > 0)
    .sort((a, b) => b[1] - a[1]);
  const rows = details?.length
    ? details
    : entries.map(([emoji, count]) => ({ emoji, count, users: [] }));

  const cancelClose = () => clearTimeout(timer.current);
  const leave = () => {
    cancelClose();
    timer.current = setTimeout(() => setPanel((p) => (p === 'details' ? null : p)), 180);
  };

  useEffect(() => () => clearTimeout(timer.current), []);

  async function react(emoji: string) {
    if (pending) return;
    const fromKeyboard = Boolean(
      document.activeElement instanceof HTMLElement &&
        document.activeElement.matches(':focus-visible'),
    );
    setPending(true);
    try {
      await onReact(emoji);
    } finally {
      setPanel(null);
      setPending(false);
      if (fromKeyboard) {
        trigger.current?.focus({ preventScroll: true });
      }
    }
  }

  // Left summary cluster renders zero footprint when there are no reactions yet.
  if (mode === 'summary' && entries.length === 0 && totalLikes === 0) {
    return null;
  }

  const isTrigger = mode === 'trigger';

  return (
    <div className="gd-reaction-cluster-wrap">
      <button
        ref={trigger}
        type="button"
        className={isTrigger ? 'gd-icon-btn gd-heart-trigger-btn' : 'gd-agg-emoji-pill'}
        aria-label={isTrigger ? '表态点赞' : `选择表情表态，当前 ${totalLikes} 次`}
        title={isTrigger ? '表态点赞' : undefined}
        aria-expanded={Boolean(panel)}
        aria-haspopup="dialog"
        data-reacted={Boolean(userReaction)}
        onPointerEnter={(e) => {
          cancelClose();
          if (!isTrigger && e.pointerType === 'mouse' && rows.length > 0) {
            setPanel((p) => p ?? 'details');
          }
        }}
        onPointerLeave={leave}
        onClick={() => {
          cancelClose();
          setPanel((p) => (p === 'picker' ? null : 'picker'));
        }}
      >
        {isTrigger ? (
          <Heart size={16} className="gd-agg-heart-icon" />
        ) : (
          <>
            {entries.length > 0 && (
              <span className="gd-agg-emoji-icons">
                {entries.slice(0, 4).map(([emoji]) => (
                  <span key={emoji}>{emoji}</span>
                ))}
              </span>
            )}
            {totalLikes > 0 && <span className="gd-agg-emoji-count">{totalLikes}</span>}
          </>
        )}
      </button>

      {panel && (
        <GesturePopover
          anchor={trigger}
          label={panel === 'picker' ? '选择表情' : '表态明细'}
          onClose={() => setPanel(null)}
          onEnter={cancelClose}
          onLeave={leave}
        >
          {panel === 'picker' && (
            <div className="gd-quick-emoji-bar">
              {QUICK_EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  aria-pressed={emoji === userReaction}
                  disabled={pending}
                  onClick={() => react(emoji)}
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}
          {rows.length > 0 && (
            <ul className="gd-breakdown-list">
              {rows.map((row) => (
                <li key={row.emoji}>
                  <span>
                    {row.emoji} {row.count}
                  </span>
                  <span>{row.users.map((u) => u.name).join('、')}</span>
                </li>
              ))}
            </ul>
          )}
        </GesturePopover>
      )}
    </div>
  );
}
