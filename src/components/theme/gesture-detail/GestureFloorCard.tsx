import React, { useLayoutEffect, useRef, useState } from 'react';
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
import {
  formatMonthDay,
  resolveAuthorBadges,
  type GestureBoost,
  type GestureNode,
} from '../../../lib/gesture-client';
import { renderCommentMarkdown } from '../../../lib/comment-markdown';
import { GestureAvatar } from './GestureAvatar';
import { EmojiReactionCluster } from './EmojiReactionCluster';
import { GestureBoostSection } from './GestureBoostSection';
import { QuoteEmbedCard } from './QuoteEmbedCard';
import { NestedParentSubGesture } from './NestedParentSubGesture';
import { DirectRepliesTimeline } from './DirectRepliesTimeline';

interface GestureFloorCardProps {
  node: GestureNode;
  isOp: boolean;
  floorIndex: number;
  bodyMarkdown: string;
  boosts: GestureBoost[];
  directReplies: GestureNode[];
  replyParentNode: GestureNode | null;
  quotedNode: GestureNode | null;
  isHighlighted: boolean;
  isBookmarked: boolean;
  canManage: boolean;
  currentUserReaction?: string | null;
  onReact: (nodeId: string, emoji: string) => void;
  onAddBoost: (gestureId: string, content: string) => Promise<boolean>;
  onReplyFloor: (node: GestureNode) => void;
  onQuoteFloor: (node: GestureNode) => void;
  onJumpToFloor: (targetFloorIndex: number, originFloorIndex: number) => void;
  onToggleBookmark: (nodeId: string) => void;
  onReport: (nodeId: string) => void;
  onEditSave: (nodeId: string, newMessage: string, newTitle?: string) => Promise<boolean>;
  onDelete: (nodeId: string) => Promise<void>;
  onCopyLink: (floorIndex: number, isOp: boolean) => void;
  onZoomImage: (src: string) => void;
}

export function GestureFloorCard({
  node,
  isOp,
  floorIndex,
  bodyMarkdown,
  boosts,
  directReplies,
  replyParentNode,
  quotedNode,
  isHighlighted,
  isBookmarked,
  canManage,
  currentUserReaction,
  onReact,
  onAddBoost,
  onReplyFloor,
  onQuoteFloor,
  onJumpToFloor,
  onToggleBookmark,
  onReport,
  onEditSave,
  onDelete,
  onCopyLink,
  onZoomImage,
}: GestureFloorCardProps) {
  const [boostComposerOpen, setBoostComposerOpen] = useState(false);
  const [parentExpanded, setParentExpanded] = useState(false);
  const [directRepliesExpanded, setDirectRepliesExpanded] = useState(false);
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const [copiedJustNow, setCopiedJustNow] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editDraft, setEditDraft] = useState(node.message);
  const [editTitleDraft, setEditTitleDraft] = useState(node.title || '');
  const [editSaving, setEditSaving] = useState(false);

  const nestedParentRef = useRef<HTMLDivElement | null>(null);
  const replyBodyAnchorRef = useRef<HTMLDivElement | null>(null);
  const pendingBeforeTopRef = useRef<number | null>(null);

  const badges = resolveAuthorBadges(node);
  const editCount = Number(node.editCount || 0);

  // Show [↪ (small avatar) RepliedAuthor] ONLY on SubGesture when replying to a non-adjacent floor
  const showReplyTargetBadge = Boolean(
    !isOp &&
      replyParentNode &&
      replyParentNode.floorIndex !== undefined &&
      replyParentNode.floorIndex !== floorIndex - 1
  );

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

  const toggleNestedParent = () => {
    if (parentExpanded) {
      const anchor = replyBodyAnchorRef.current;
      if (anchor) {
        pendingBeforeTopRef.current = anchor.getBoundingClientRect().top;
      }
      setParentExpanded(false);
    } else {
      setParentExpanded(true);
    }
  };

  const handleCopyFloorLink = () => {
    onCopyLink(floorIndex, isOp);
    setCopiedJustNow(true);
    setTimeout(() => setCopiedJustNow(false), 1800);
  };

  const handleBodyClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    if (target.tagName === 'IMG') {
      const src = (target as HTMLImageElement).src;
      if (src) onZoomImage(src);
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
      {/* ZONE 2: Two-column Sticky Avatar + Content Body (Ends strictly BEFORE Boost & Action Bar) */}
      <div className="gd-floor-split">
        {/* Left Fixed Rail (~52px): Transparent background, NO vertical line in normal state */}
        <div className="gd-avatar-rail">
          <div className="gd-sticky-avatar-wrap">
            <GestureAvatar
              name={node.authorName}
              avatar={node.authorAvatar}
              size={isOp ? 40 : 36}
              isOwner={badges.isOwner}
            />
          </div>
        </div>

        {/* Right Adaptive Content Column */}
        <div className="gd-content-col">
          {/* Author Bar (First Line) - NO IP location, NO #1 楼主 badge */}
          <div className="gd-author-bar">
            <div className="gd-author-badges">
              <span className="gd-author-name">{node.authorName || '访客'}</span>
              {badges.roleLabel && <span className="gd-role-badge">{badges.roleLabel}</span>}
              <span className="gd-level-badge">{badges.levelLabel}</span>
            </div>

            <div className="gd-author-meta-right">
              {showReplyTargetBadge && replyParentNode && (
                <button
                  type="button"
                  className={`gd-reply-target-pill ${parentExpanded ? 'is-expanded' : ''}`}
                  onClick={toggleNestedParent}
                  title={parentExpanded ? '收起被回复楼层' : `原地展开 ${replyParentNode.authorName} 的楼层`}
                  aria-expanded={parentExpanded}
                >
                  <CornerDownRight className="w-3 h-3" />
                  <GestureAvatar
                    name={replyParentNode.authorName}
                    avatar={replyParentNode.authorAvatar}
                    size={18}
                    isOwner={replyParentNode.authorRole === 'admin'}
                  />
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

              <time className="gd-first-date" dateTime={node.createdAt}>
                {formatMonthDay(node.createdAt)}
              </time>
            </div>
          </div>

          {/* Scene B: In-place Nested Parent SubGesture (1-to-1, Dual Sticky Avatars + 1px Vertical Line │) */}
          {showReplyTargetBadge && replyParentNode && parentExpanded && (
            <NestedParentSubGesture
              parentNode={replyParentNode}
              currentFloorIndex={floorIndex}
              containerRef={nestedParentRef}
              onCollapseWithCompensation={toggleNestedParent}
              onJumpToFloor={onJumpToFloor}
            />
          )}

          {/* Orthogonal Quote Block (Content-level excerpt, independent of Reply relation) */}
          {node.quote && (
            <QuoteEmbedCard
              quote={node.quote}
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
              dangerouslySetInnerHTML={{
                __html: renderCommentMarkdown(bodyMarkdown),
              }}
            />
          )}
        </div>
      </div>

      {/* ZONE 3: Scoped Boost Section (Terminates Sticky Avatar Track Above) */}
      <GestureBoostSection
        gestureId={node.id}
        isOp={isOp}
        boosts={boosts}
        composerOpen={boostComposerOpen}
        onComposerOpenChange={setBoostComposerOpen}
        onAddBoost={onAddBoost}
      />

      {/* ZONE 4: Pure-Icon Action Bar + Top-4 Aggregated Emoji Pill + Direct Replies Trigger */}
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

        {isOp ? (
          /* OP Full Action Bar: [♡] [🔗] [••• (animated slide-out)] [↩] */
          <div className="gd-zone4-right is-op">
            <EmojiReactionCluster
              summary={{}}
              totalLikes={0}
              userReaction={currentUserReaction}
              onReact={(emoji) => onReact(node.id, emoji)}
              showHeartTrigger={true}
              hideSummaryPill={true}
            />

            <button
              type="button"
              className="gd-icon-btn"
              onClick={() => onQuoteFloor(node)}
              title="引用主贴片段"
              aria-label="引用主贴片段"
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

            {/* Animated [•••] Slide-Out Drawer */}
            <div className={`gd-more-drawer ${moreMenuOpen ? 'is-open' : ''}`}>
              <div className="gd-more-drawer__items" aria-hidden={!moreMenuOpen}>
                <button
                  type="button"
                  className="gd-icon-btn"
                  onClick={() => {
                    onReport(node.id);
                    setMoreMenuOpen(false);
                  }}
                  title="举报 / 反馈"
                  aria-label="举报"
                >
                  <Flag className="w-3.5 h-3.5" />
                </button>
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
              </div>

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
              title="回复主贴"
              aria-label="回复主贴"
            >
              <Reply className="w-4 h-4" />
            </button>
          </div>
        ) : (
          /* SubGesture Simplified Action Bar: [⚡] [🔗] [↩] (NO [•••] menu) */
          <div className="gd-zone4-right is-sub">
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
              title="引用该楼层片段"
              aria-label="引用该楼层片段"
            >
              <QuoteIcon className="w-4 h-4" />
            </button>

            <button
              type="button"
              className={`gd-icon-btn ${copiedJustNow ? 'is-success' : ''}`}
              onClick={handleCopyFloorLink}
              title="复制楼层直达链接"
              aria-label="复制楼层直达链接"
            >
              {copiedJustNow ? <Check className="w-4 h-4" /> : <Link2 className="w-4 h-4" />}
            </button>

            <button
              type="button"
              className="gd-icon-btn is-reply-primary"
              onClick={() => onReplyFloor(node)}
              title="回复该楼层"
              aria-label="回复该楼层"
            >
              <Reply className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Scene A: 1-to-N Direct Replies Timeline Expansion */}
      {directReplies.length > 0 && directRepliesExpanded && (
        <DirectRepliesTimeline
          replies={directReplies}
          currentFloorIndex={floorIndex}
          onCollapse={() => setDirectRepliesExpanded(false)}
          onJumpToFloor={onJumpToFloor}
        />
      )}
    </article>
  );
}
