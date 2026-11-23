import { ArrowDown, ArrowUp, ChevronDown, ChevronUp } from 'lucide-react';
import { useMemo, useState } from 'react';
import { renderGestureMarkdown } from '../../../lib/gesture-markdown';
import { gestureTimestamp } from '../../../lib/gesture-text';
import { formatMonthDay, type GestureNode } from '../../../lib/gesture-detail-client';
import { GestureAvatar } from './GestureAvatar';

interface Props {
  nodes: GestureNode[];
  origin: number;
  variant?: 'parent' | 'children';
  childrenMap?: Map<string, GestureNode[]>;
  depth?: number;
  onJump: (target: number, origin: number) => void;
  onCollapse: () => void;
}
export function GestureReplyContext({ nodes, origin, variant = 'children', childrenMap, depth = 0, onJump, onCollapse }: Props) {
  const [limit, setLimit] = useState(8);
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({});
  const chronological = useMemo(() => [...nodes].sort((a, b) => Date.parse(gestureTimestamp(a.createdAt)) - Date.parse(gestureTimestamp(b.createdAt)) || a.id.localeCompare(b.id)), [nodes]);
  const parent = variant === 'parent';
  const JumpIcon = parent ? ArrowUp : ArrowDown;
  return <div className={`gd-reply-context is-${variant} ${depth > 0 ? 'is-nested' : ''}`} aria-label={parent ? '被回复的原贴' : '直接回复列表'}>
    {chronological.slice(0, parent ? 1 : limit).map(n => {
      const nested = childrenMap && depth < 3 ? (childrenMap.get(n.id) || []) : [];
      const isNestedOpen = Boolean(expandedIds[n.id]);
      return <section key={n.id} className="gd-context-entry">
        <div className="gd-context-rail">
          <div className="gd-context-avatar-stack">
            <GestureAvatar name={n.authorName} avatar={n.authorAvatar} size={parent ? 32 : 26} isOwner={n.authorRole === 'admin'} />
            {parent && <button type="button" className="gd-context-parent-collapse" onClick={onCollapse} aria-label="收起被回复楼层" title="收起被回复楼层"><ChevronDown size={15} /></button>}
          </div>
        </div>
        <div className="gd-context-content">
          <div className="gd-context-heading">
            <strong>{n.authorName}</strong>
            <time dateTime={n.createdAt}>{formatMonthDay(n.createdAt)}</time>
            <button type="button" onClick={() => onJump(n.floorIndex!, origin)} aria-label={`跳至第 ${n.floorIndex} 楼贴文`}><JumpIcon size={13} />跳至贴文</button>
          </div>
          <div className="gd-markdown-body" dangerouslySetInnerHTML={{ __html: renderGestureMarkdown(n.message) }} />
          {nested.length > 0 && <button type="button" className="gd-nested-replies-toggle" aria-expanded={isNestedOpen}
            onClick={() => setExpandedIds(prev => ({ ...prev, [n.id]: !prev[n.id] }))}>
            <span>{nested.length} 条回复</span>{isNestedOpen ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </button>}
          {nested.length > 0 && isNestedOpen && <GestureReplyContext nodes={nested} origin={origin} childrenMap={childrenMap} depth={depth + 1} onJump={onJump}
            onCollapse={() => setExpandedIds(prev => ({ ...prev, [n.id]: false }))} />}
        </div>
      </section>;
    })}
    {!parent && <>
      {nodes.length > limit && <button type="button" className="gd-context-more-btn" onClick={() => setLimit(limit + 8)}>查看更多直接回复</button>}
      <button type="button" className="gd-context-collapse" onClick={onCollapse} aria-label="收起直接回复" title="收起直接回复"><ChevronUp size={16} /></button>
    </>}
  </div>;
}
