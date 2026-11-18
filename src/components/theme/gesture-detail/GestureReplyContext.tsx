import { ArrowUpRight } from 'lucide-react';
import { useState } from 'react';
import { renderCommentMarkdown } from '../../../lib/comment-markdown';
import { formatMonthDay, type GestureNode } from '../../../lib/gesture-client';
import { GestureAvatar } from './GestureAvatar';

interface Props { nodes: GestureNode[]; origin: number; onJump: (target: number, origin: number) => void }
export function GestureReplyContext({ nodes, origin, onJump }: Props) {
  const [limit, setLimit] = useState(8);
  return <div className="gd-reply-context">
    {nodes.slice(0,limit).map(n => <section key={n.id}>
      <div className="gd-context-heading"><GestureAvatar name={n.authorName} avatar={n.authorAvatar} size={20} /><strong>{n.authorName}</strong><time dateTime={n.createdAt}>{formatMonthDay(n.createdAt)}</time>
        <button type="button" onClick={() => onJump(n.floorIndex!, origin)}>第 {n.floorIndex} 楼 <ArrowUpRight size={13} /></button></div>
      <div className="gd-markdown-body" dangerouslySetInnerHTML={{ __html: renderCommentMarkdown(n.message) }} />
    </section>)}
    {nodes.length > limit && <button onClick={() => setLimit(limit + 8)}>查看更多直接回复</button>}
  </div>;
}
