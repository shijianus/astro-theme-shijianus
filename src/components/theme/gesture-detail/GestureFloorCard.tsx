import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import {
  Bookmark,
  Check,
  ChevronDown,
  ChevronUp,
  CornerDownRight,
  Flag,
  Link2,
  MoreHorizontal,
  Pencil,
  Quote as QuoteIcon,
  Reply,
  Trash2,
  Zap,
} from 'lucide-react';
import { gestureTimestamp } from '../../../lib/gesture-text';
import {
  formatMonthDay,
  resolveAuthorBadges,
  type GestureBoost,
  type GestureNode,
} from '../../../lib/gesture-detail-client';
import { renderGestureMarkdown } from '../../../lib/gesture-markdown';
import { GestureAvatar } from './GestureAvatar';
import { EmojiReactionCluster } from './EmojiReactionCluster';
import { GestureBoostSection } from './GestureBoostSection';
import { QuoteEmbedCard } from './QuoteEmbedCard';
import { GestureReplyContext } from './GestureReplyContext';

interface GestureFloorCardProps {
  node: GestureNode;
  isOp: boolean;
  floorIndex: number;
  bodyMarkdown: string;
  boosts: GestureBoost[];
  directReplies: GestureNode[];
  childrenMap?: Map<string, GestureNode[]>;
  replyParentNode: GestureNode | null;
  quotedNode: GestureNode | null;
  isHighlighted: boolean;
  isBookmarked: boolean;
  canManage: boolean;
  currentUserReaction?: string | null;
  initialExpansion?: { parent: boolean; children: boolean };
  onRememberExpansion: (state: { parent: boolean; children: boolean }) => void;
  onReact: (nodeId: string, emoji: string) => void;
  onAddBoost: (gestureId: string, content: string) => Promise<boolean>;
  onReplyFloor: (node: GestureNode) => void;
  onQuoteFloor: (node: GestureNode) => void;
  onJumpToFloor: (targetFloorIndex: number, originFloorIndex: number) => void;
  onToggleBookmark: (nodeId: string) => void;
  onEditSave: (nodeId: string, newMessage: string, newTitle?: string) => Promise<boolean>;
  onDelete: (nodeId: string) => Promise<void>;
  onCopyLink: (floorIndex: number, isOp: boolean) => Promise<boolean>;
  onZoomImage: (image: HTMLImageElement) => void;
}

export function GestureFloorCard({
  node,
  isOp,
  floorIndex,
  bodyMarkdown,
  boosts,
  directReplies,
  childrenMap,
  replyParentNode,
  quotedNode,
  isHighlighted,
  isBookmarked,
  canManage,
  currentUserReaction,
  initialExpansion,
  onRememberExpansion,
  onReact,
  onAddBoost,
  onReplyFloor,
  onQuoteFloor,
  onJumpToFloor,
  onToggleBookmark,
  onEditSave,
  onDelete,
  onCopyLink,
  onZoomImage,
}: GestureFloorCardProps) {
  const [boostComposerOpen, setBoostComposerOpen] = useState(false);
  const [parentExpanded, setParentExpanded] = useState(initialExpansion?.parent || false);
  const [directRepliesExpanded, setDirectRepliesExpanded] = useState(initialExpansion?.children || false);
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const [copiedJustNow, setCopiedJustNow] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editDraft, setEditDraft] = useState(node.message);
  const [editTitleDraft, setEditTitleDraft] = useState(node.title || '');
  const [editSaving, setEditSaving] = useState(false);


  const replyBodyAnchorRef = useRef<HTMLDivElement | null>(null);
  const pendingBeforeTopRef = useRef<number | null>(null);
  const directToggleRef = useRef<HTMLButtonElement | null>(null);
  const pendingDirectTopRef = useRef<number | null>(null);
  const moreMenuRef = useRef<HTMLDivElement | null>(null);

  const renderedBody = useMemo(() => ({ __html: renderGestureMarkdown(bodyMarkdown, true) }), [bodyMarkdown]);
  const badges = resolveAuthorBadges(node);
  const editCount = Number(node.editCount || 0);

  const showReplyTargetBadge = !isOp && replyParentNode !== null;

  useEffect(() => {
    onRememberExpansion({ parent: parentExpanded, children: directRepliesExpanded });
  }, [parentExpanded, directRepliesExpanded, onRememberExpansion]);

  useEffect(() => {
    if (!moreMenuOpen) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!moreMenuRef.current?.contains(event.target as Node)) {
        setMoreMenuOpen(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMoreMenuOpen(false);
      }
    };
    document.addEventListener('pointerdown', onPointerDown, true);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown, true);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [moreMenuOpen]);

  // Scroll height compensation right after Scene B parent collapses (zero layout flicker, instant)
  useLayoutEffect(() => {
    if (!parentExpanded && pendingBeforeTopRef.current !== null) {
      const beforeTop = pendingBeforeTopRef.current;
      pendingBeforeTopRef.current = null;
      const anchor = replyBodyAnchorRef.current;
      if (anchor && typeof window !== 'undefined') {
        const afterTop = anchor.getBoundingClientRect().top;
        const delta = afterTop - beforeTop;
        if (Math.abs(delta) > 0.5) {
          window.scrollBy({ top: delta, behavior: 'instant' as ScrollBehavior });
        }
      }
    }
  }, [parentExpanded]);

  useLayoutEffect(() => {
    if (!directRepliesExpanded && pendingDirectTopRef.current !== null) {
      const before = pendingDirectTopRef.current;
      pendingDirectTopRef.current = null;
      const toggle = directToggleRef.current;
      if (toggle) {
        window.scrollBy({ top: toggle.getBoundingClientRect().top - before, behavior: 'instant' });
        toggle.focus({ preventScroll: true });
      }
    }
  }, [directRepliesExpanded]);

  const toggleNestedParent = () => {
    if (parentExpanded) {
      const anchor = replyBodyAnchorRef.current;
      if (anchor) {
        const top = anchor.getBoundingClientRect().top;
        pendingBeforeTopRef.current = top >= 112 && top < window.innerHeight - 80 ? top : 120;
      }
      setParentExpanded(false);
    } else {
      setParentExpanded(true);
    }
  };

  useEffect(() => {
    if (!copiedJustNow) return;
    const timer = setTimeout(() => setCopiedJustNow(false), 1800);
    return () => clearTimeout(timer);
  }, [copiedJustNow]);
  const handleCopyFloorLink = async () => setCopiedJustNow(await onCopyLink(floorIndex, isOp));

  const handleBodyClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    if (target instanceof HTMLImageElement) {
      target.focus({ preventScroll: true });
      onZoomImage(target);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editDraft.trim() || editSaving) return;
    setEditSaving(true);
    const ok = await onEditSave(node.id, editDraft.trim(), isOp ? editTitleDraft.trim() : undefined);
    setEditSaving(false);
    if (ok) {
      setIsEditing(false);
      setMoreMenuOpen(false);
    }
  };

  return (
    <article
      id={`floor-${floorIndex}`}
      data-gesture-id={node.id}
      data-floor-index={floorIndex}
      className={`gd-floor-article gb-floor-target ${isOp ? 'is-op-floor' : 'is-sub-floor'} ${isHighlighted ? 'is-jump-highlighted' : ''}`}
    >
      <div className="gd-avatar-rail">
        <GestureAvatar name={node.authorName} avatar={node.authorAvatar} size={isOp ? 42 : 36} isOwner={badges.isOwner} />
      </div>
      <div className="gd-content-col">

          <div className="gd-author-bar">
            <div className="gd-author-badges">
              <span className="gd-author-name">{node.authorName || '访客'}</span>
              {badges.roleLabel && <span className="gd-role-badge">{badges.roleLabel}</span>}
              {badges.levelLabel && <span className="gd-level-badge">{badges.levelLabel}</span>}
            </div>

            <div className="gd-author-meta-right">
              {showReplyTargetBadge && replyParentNode && (
                <button type="button" className={`gd-reply-target-pill ${parentExpanded ? 'is-expanded' : ''}`}
                  onClick={toggleNestedParent} title={parentExpanded ? '收起被回复楼层' : `原地展开 ${replyParentNode.authorName} 的楼层`} aria-expanded={parentExpanded}>
                  <CornerDownRight size={12} />
                  <GestureAvatar name={replyParentNode.authorName} avatar={replyParentNode.authorAvatar} size={18} isOwner={replyParentNode.authorRole === 'admin'} />
                  <span>{replyParentNode.authorName}</span>
                </button>
              )}
              {editCount > 0 && (
                <span className="gd-edit-count-badge" title={`已编辑 ${editCount} 次`}>
                  <span>{editCount}</span>
                  <Pencil className="w-3 h-3" />
                  <span className="gd-meta-dot">·</span>
                </span>
              )}

              <time className="gd-first-date" dateTime={node.createdAt} title={new Date(gestureTimestamp(node.createdAt)).toLocaleString('zh-CN')}>
                {formatMonthDay(node.createdAt)}
              </time>
            </div>
          </div>

          {parentExpanded && replyParentNode && <GestureReplyContext variant="parent" nodes={[replyParentNode]} origin={floorIndex} onJump={onJumpToFloor} onCollapse={toggleNestedParent} />}

          {/* Orthogonal Quote Block (Content-level excerpt, independent of Reply relation) */}
          {(node.quote || quotedNode) && (
            <QuoteEmbedCard
              quote={node.quote || { id: quotedNode!.id, authorName: quotedNode!.authorName, excerpt: quotedNode!.message.slice(0,100) }}
              quotedNode={quotedNode}
              currentFloorIndex={floorIndex}
              onJumpToFloor={onJumpToFloor}
            />
          )}

          {/* Body Stream (or Inline Edit Mode) */}
          {isEditing ? (
            <form className="gd-inline-edit-form" onSubmit={handleEditSubmit}>
              {isOp && (
                <input
                  type="text"
                  value={editTitleDraft}
                  onChange={(e) => setEditTitleDraft(e.target.value)}
                  placeholder="贴文主标题"
                  className="gd-inline-edit-title"
                />
              )}
              <textarea
                rows={4}
                value={editDraft}
                onChange={(e) => setEditDraft(e.target.value)}
                className="gd-inline-edit-textarea"
              />
              <div className="gd-inline-edit-actions">
                <button
                  type="button"
                  className="gd-inline-cancel-btn"
                  onClick={() => {
                    setIsEditing(false);
                    setEditDraft(node.message);
                  }}
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={!editDraft.trim() || editSaving}
                  className="gd-inline-save-btn"
                >
                  {editSaving ? '保存中...' : '保存修改'}
                </button>
              </div>
            </form>
          ) : (
            <div
              ref={replyBodyAnchorRef}
              className="gd-markdown-body gd-floor-markdown"
              onClick={handleBodyClick}
              onKeyDown={e => {
                if (e.target instanceof HTMLImageElement && (e.key === 'Enter' || e.key === ' ')) {
                  e.preventDefault();
                  onZoomImage(e.target);
                }
              }}
              dangerouslySetInnerHTML={renderedBody}
            />
          )}

      </div>
      <div className="gd-zone4-action-bar">
        <div className="gd-zone4-left">
          <EmojiReactionCluster
            summary={node.reactions?.summary}
            details={node.reactions?.details}
            totalLikes={node.likesCount || 0}
            userReaction={currentUserReaction}
            onReact={(emoji) => onReact(node.id, emoji)}
          />

          {directReplies.length > 0 && (
            <button
              type="button"
              ref={directToggleRef}
              className={`gd-direct-replies-btn ${directRepliesExpanded ? 'is-expanded' : ''}`}
              onClick={() => setDirectRepliesExpanded((prev) => !prev)}
              aria-expanded={directRepliesExpanded}
            >
              <span>{directReplies.length} 条直接回复</span>
              {directRepliesExpanded ? (
                <ChevronUp className="w-3.5 h-3.5" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5" />
              )}
            </button>
          )}
        </div>

          <div className="gd-zone4-right">
            <button
              type="button"
              className={`gd-icon-btn ${boostComposerOpen ? 'is-active' : ''}`}
              onClick={() => setBoostComposerOpen((prev) => !prev)}
              title="发送 Boost 短评"
              aria-label="发送 Boost 短评"
            >
              <Zap className="w-4 h-4" />
            </button>

            <button
              type="button"
              className="gd-icon-btn"
              onClick={() => onQuoteFloor(node)}
              title="引用楼层"
              aria-label="引用楼层"
            >
              <QuoteIcon className="w-4 h-4" />
            </button>

            <button
              type="button"
              className={`gd-icon-btn ${copiedJustNow ? 'is-success' : ''}`}
              onClick={handleCopyFloorLink}
              title="复制贴文锚点链接"
              aria-label="复制贴文锚点链接"
            >
              {copiedJustNow ? <Check className="w-4 h-4" /> : <Link2 className="w-4 h-4" />}
            </button>

            <div ref={moreMenuRef} className={`gd-more-drawer ${moreMenuOpen ? 'is-open' : ''}`}>
              {moreMenuOpen && <div className="gd-more-drawer__items">
                <a className="gd-icon-btn" href="/community/reporting-and-appeals/"
                  target="_blank" rel="noopener noreferrer" title="举报与申诉" aria-label="举报与申诉">
                  <Flag className="w-3.5 h-3.5" />
                </a>
                <button
                  type="button"
                  className={`gd-icon-btn ${isBookmarked ? 'is-bookmarked' : ''}`}
                  onClick={() => {
                    onToggleBookmark(node.id);
                    setMoreMenuOpen(false);
                  }}
                  title={isBookmarked ? '移出书签' : '加入书签'}
                  aria-label="书签"
                >
                  <Bookmark className="w-3.5 h-3.5" />
                </button>
                {canManage && (
                  <>
                    <button
                      type="button"
                      className="gd-icon-btn"
                      onClick={() => {
                        setEditDraft(node.message);
                        setEditTitleDraft(node.title || '');
                        setIsEditing((prev) => !prev);
                        setMoreMenuOpen(false);
                      }}
                      title="编辑贴文"
                      aria-label="编辑贴文"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      className="gd-icon-btn is-danger"
                      onClick={() => {
                        setMoreMenuOpen(false);
                        onDelete(node.id);
                      }}
                      title="删除贴文"
                      aria-label="删除贴文"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </>
                )}
              </div>}

              <button
                type="button"
                className={`gd-icon-btn ${moreMenuOpen ? 'is-active' : ''}`}
                onClick={() => setMoreMenuOpen((prev) => !prev)}
                title="更多操作"
                aria-expanded={moreMenuOpen}
                aria-label="更多操作"
              >
                <MoreHorizontal className="w-4 h-4" />
              </button>
            </div>

            <button
              type="button"
              className="gd-icon-btn is-reply-primary"
              onClick={() => onReplyFloor(node)}
              title={isOp ? "回复主贴" : "回复该楼层"}
              aria-label={isOp ? "回复主贴" : "回复该楼层"}
            >
              <Reply className="w-4 h-4" />
              <span>回复</span>
            </button>
          </div>
      </div>

      <GestureBoostSection
        gestureId={node.id}
        boosts={boosts}
        composerOpen={boostComposerOpen}
        onComposerOpenChange={setBoostComposerOpen}
        onAddBoost={onAddBoost}
      />

      {directReplies.length > 0 && directRepliesExpanded && (
        <GestureReplyContext nodes={directReplies} origin={floorIndex} childrenMap={childrenMap} onJump={onJumpToFloor} onCollapse={() => {
          pendingDirectTopRef.current = Math.max(120, directToggleRef.current?.getBoundingClientRect().top || 120);
          setDirectRepliesExpanded(false);
        }} />
      )}
    </article>
  );
}
