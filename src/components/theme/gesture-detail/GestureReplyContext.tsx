import { ArrowUpRight, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';
import { renderGestureMarkdown } from '../../../lib/gesture-markdown';
import { formatMonthDay, type GestureNode } from '../../../lib/gesture-client';
import { GestureAvatar } from './GestureAvatar';

interface Props {
  nodes: GestureNode[];
  origin: number;
  childrenMap?: Map<string, GestureNode[]>;
  depth?: number;
  onJump: (target: number, origin: number) => void;
}
export function GestureReplyContext({ nodes, origin, childrenMap, depth = 0, onJump }: Props) {
  const [limit, setLimit] = useState(8);
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({});
  return <div className={`gd-reply-context ${depth > 0 ? 'is-nested' : ''}`}>
    {nodes.slice(0, limit).map(n => {
      const nested = childrenMap && depth < 3 ? (childrenMap.get(n.id) || []) : [];
      const isNestedOpen = Boolean(expandedIds[n.id]);
      return <section key={n.id}>
        <div className="gd-context-heading">
          <GestureAvatar name={n.authorName} avatar={n.authorAvatar} size={20} isOwner={n.authorRole === 'admin'} />
          <strong>{n.authorName}</strong>
          <time dateTime={n.createdAt}>{formatMonthDay(n.createdAt)}</time>
          <button type="button" onClick={() => onJump(n.floorIndex!, origin)}>第 {n.floorIndex} 楼 <ArrowUpRight size={13} /></button>
        </div>
        <div className="gd-markdown-body" dangerouslySetInnerHTML={{ __html: renderGestureMarkdown(n.message) }} />
        {nested.length > 0 && (
          <button
            type="button"
            className="gd-nested-replies-toggle"
            aria-expanded={isNestedOpen}
            onClick={() => setExpandedIds(prev => ({ ...prev, [n.id]: !prev[n.id] }))}
          >
            <span>{nested.length} 条回复</span>
            {isNestedOpen ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </button>
        )}
        {nested.length > 0 && isNestedOpen && (
          <GestureReplyContext
            nodes={nested}
            origin={origin}
            childrenMap={childrenMap}
            depth={depth + 1}
            onJump={onJump}
          />
        )}
      </section>;
    })}
    {nodes.length > limit && <button type="button" className="gd-context-more-btn" onClick={() => setLimit(limit + 8)}>查看更多直接回复</button>}
  </div>;
}
