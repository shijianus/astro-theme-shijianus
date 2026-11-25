import { useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, ChevronDown, ChevronUp } from 'lucide-react';
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

/**
 * Bidirectional reply context:
 * - variant="parent" (1-to-1 unique parent): sticky avatar + [⌄] collapse + explicit 1px vertical rail line │ + [↑ 跳至贴文]
 * - variant="children" (1-to-N chronological direct replies): non-sticky static avatars connected by continuous 1px vertical line │ down to bottom [^] + [↓ 跳至贴文]
 */
export function GestureReplyContext({
  nodes,
  origin,
  variant = 'children',
  childrenMap,
  depth = 0,
  onJump,
  onCollapse,
}: Props) {
  const [limit, setLimit] = useState(8);
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({});

  const chronological = useMemo(
    () =>
      [...nodes].sort(
        (a, b) =>
          Date.parse(gestureTimestamp(a.createdAt)) - Date.parse(gestureTimestamp(b.createdAt)) ||
          a.id.localeCompare(b.id),
      ),
    [nodes],
  );

  const isParent = variant === 'parent';
  const JumpIcon = isParent ? ArrowUp : ArrowDown;

  return (
    <div
      className={`gd-reply-context is-${variant} ${depth > 0 ? 'is-nested' : ''}`}
      aria-label={isParent ? '被回复的原贴' : '直接回复列表'}
    >
      {chronological.slice(0, isParent ? 1 : limit).map((node) => {
        const nested = childrenMap && depth < 3 ? childrenMap.get(node.id) || [] : [];
        const isNestedOpen = Boolean(expandedIds[node.id]);

        return (
          <section key={node.id} className="gd-context-entry">
            <div className="gd-context-rail">
              <div className="gd-context-avatar-stack">
                <GestureAvatar
                  name={node.authorName}
                  avatar={node.authorAvatar}
                  size={isParent ? 32 : 26}
                  isOwner={node.authorRole === 'admin'}
                />
                {isParent && (
                  <button
                    type="button"
                    className="gd-context-parent-collapse"
                    onClick={onCollapse}
                    aria-label="收起被回复楼层"
                    title="收起被回复楼层"
                  >
                    <ChevronDown size={14} />
                  </button>
                )}
              </div>
            </div>

            <div className="gd-context-content">
              <div className="gd-context-heading">
                <strong>{node.authorName}</strong>
                <time dateTime={node.createdAt}>{formatMonthDay(node.createdAt)}</time>
                <button
                  type="button"
                  onClick={() => onJump(node.floorIndex!, origin)}
                  aria-label={`跳至第 ${node.floorIndex} 楼贴文`}
                >
                  <JumpIcon size={13} />
                  <span>跳至贴文</span>
                </button>
              </div>

              <div
                className="gd-markdown-body"
                dangerouslySetInnerHTML={{ __html: renderGestureMarkdown(node.message) }}
              />

              {nested.length > 0 && (
                <button
                  type="button"
                  className="gd-nested-replies-toggle"
                  aria-expanded={isNestedOpen}
                  onClick={() => setExpandedIds((prev) => ({ ...prev, [node.id]: !prev[node.id] }))}
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
                  onCollapse={() => setExpandedIds((prev) => ({ ...prev, [node.id]: false }))}
                />
              )}
            </div>
          </section>
        );
      })}

      {!isParent && (
        <>
          {nodes.length > limit && (
            <button
              type="button"
              className="gd-context-more-btn"
              onClick={() => setLimit((prev) => prev + 8)}
            >
              查看更多直接回复
            </button>
          )}
          <button
            type="button"
            className="gd-context-collapse"
            onClick={onCollapse}
            aria-label="收起直接回复"
            title="收起直接回复"
          >
            <ChevronUp size={15} />
          </button>
        </>
      )}
    </div>
  );
}
