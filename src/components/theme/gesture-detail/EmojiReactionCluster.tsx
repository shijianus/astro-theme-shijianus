import { useEffect, useRef, useState } from 'react';
import { Heart } from 'lucide-react';
import type { ReactionDetailItem } from '../../../lib/gesture-detail-client';
import { GesturePopover } from './GesturePopover';

const emojis = ['👍', '❤️', '🚀', '💡', '🔥', '🎉', '✨', '😂'];
interface Props {
  summary?: Record<string, number>;
  details?: ReactionDetailItem[];
  totalLikes: number;
  userReaction?: string | null;
  onReact: (emoji: string) => void | Promise<void>;
}

export function EmojiReactionCluster({ summary = {}, details, totalLikes, userReaction, onReact }: Props) {
  const trigger = useRef<HTMLButtonElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const [panel, setPanel] = useState<'details' | 'picker' | null>(null);
  const [pending, setPending] = useState(false);
  const entries = Object.entries(summary).filter(([, count]) => count > 0).sort((a, b) => b[1] - a[1]);
  const rows = details?.length ? details : entries.map(([emoji, count]) => ({ emoji, count, users: [] }));
  const cancelClose = () => clearTimeout(timer.current);
  const leave = () => { cancelClose(); timer.current = setTimeout(() => setPanel(p => p === 'details' ? null : p), 180); };
  useEffect(() => () => clearTimeout(timer.current), []);
  async function react(emoji: string) {
    if (pending) return;
    setPending(true);
    try { await onReact(emoji); } finally { setPanel(null); setPending(false); trigger.current?.focus({ preventScroll: true }); }
  }
  return <div className="gd-reaction-cluster-wrap">
    <button ref={trigger} type="button" className="gd-agg-emoji-pill" aria-label={`选择表情表态，当前 ${totalLikes} 次`}
      aria-expanded={!!panel} aria-haspopup="dialog" data-reacted={Boolean(userReaction)}
      onPointerEnter={e => { cancelClose(); if (e.pointerType === 'mouse' && rows.length) setPanel(p => p ?? 'details'); }}
      onPointerLeave={leave} onClick={() => { cancelClose(); setPanel(p => p === 'picker' ? null : 'picker'); }}>
      {entries.length ? <span className="gd-agg-emoji-icons">{entries.slice(0, 4).map(([e]) => <span key={e}>{e}</span>)}</span> : <Heart size={16} />}
      {totalLikes > 0 && <span>{totalLikes}</span>}
    </button>
    {panel && <GesturePopover anchor={trigger} label={panel === 'picker' ? '选择表情' : '表态明细'} onClose={() => setPanel(null)} onEnter={cancelClose} onLeave={leave}>
      {panel === 'picker' && <div className="gd-quick-emoji-bar">{emojis.map(e =>
        <button key={e} type="button" aria-pressed={e === userReaction} disabled={pending} onClick={() => react(e)}>{e}</button>)}</div>}
      {rows.length > 0 && <ul className="gd-breakdown-list">{rows.map(r => <li key={r.emoji}>
        <span>{r.emoji} {r.count}</span><span>{r.users.map(u => u.name).join('、')}</span>
      </li>)}</ul>}
    </GesturePopover>}
  </div>;
}
