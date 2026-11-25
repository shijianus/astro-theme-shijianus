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
  rootId: string;
  previousFloorId?: string | null;
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
  onJumpToFloor: (targetFloorIndex: number, originFloorIndex: number) => void;
  onToggleBookmark: (nodeId: string) => void;
  onEditSave: (nodeId: string, newMessage: string, newTitle?: string) => Promise<boolean>;
  onDelete: (nodeId: string) => Promise<void>;
  onCopyLink: (floorIndex: number, isOp: boolean) => Promise<boolean>;
  onZoomImage: (image: HTMLImageElement) => void;
}

export function GestureFloorCard({
  node,
  rootId,
  previousFloorId = null,
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
  const restoreDirectFocusRef = useRef(false);
  const moreMenuRef = useRef<HTMLDivElement | null>(null);

  const renderedBody = useMemo(
    () => ({ __html: renderGestureMarkdown(bodyMarkdown, true) }),
    [bodyMarkdown],
  );
  const badges = resolveAuthorBadges(node);
  const editCount = Number(node.editCount || 0);
  // Strictly follow LinuxDo restraint: hide [↪] for direct OP replies or replies directly below their target floor.
  const isDirectReplyToOp =
    !replyParentNode || replyParentNode.id === rootId || replyParentNode.floorIndex === 1;
  const isImmediatelyBelowParent =
    Boolean(replyParentNode) &&
    (replyParentNode!.floorIndex === floorIndex - 1 ||
      (Boolean(previousFloorId) && replyParentNode!.id === previousFloorId));
  const showReplyTargetBadge =
    !isOp && Boolean(replyParentNode) && !isDirectReplyToOp && !isImmediatelyBelowParent;

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

  // Instant scroll compensation when nested 1-to-1 parent floor collapses
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
      const shouldFocus = restoreDirectFocusRef.current;
      restoreDirectFocusRef.current = false;
      const toggle = directToggleRef.current;
      if (toggle) {
        window.scrollBy({ top: toggle.getBoundingClientRect().top - before, behavior: 'instant' });
        if (shouldFocus) {
          toggle.focus({ preventScroll: true });
        }
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
      className={`gd-floor-article ${isOp ? 'is-op-floor' : 'is-sub-floor'} ${isHighlighted ? 'is-jump-highlighted' : ''}`}
    >
      {/* Dual-axis body region: avatar sticks only until right above action bar */}
      <div className="gd-floor-main">
        <div className="gd-avatar-rail">
          <GestureAvatar
            name={node.authorName}
            avatar={node.authorAvatar}
            size={isOp ? 42 : 36}
            isOwner={badges.isOwner}
          />
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
                <button
                  type="button"
                  className={`gd-reply-target-pill ${parentExpanded ? 'is-expanded' : ''}`}
                  onClick={toggleNestedParent}
                  title={parentExpanded ? '收起被回复楼层' : `原地展开 ${replyParentNode.authorName} 的楼层`}
                  aria-expanded={parentExpanded}
                >
                  <CornerDownRight size={12} />
                  <GestureAvatar
                    name={replyParentNode.authorName}
                    avatar={replyParentNode.authorAvatar}
                    size={16}
                    isOwner={replyParentNode.authorRole === 'admin'}
                  />
                  <span>{replyParentNode.authorName}</span>
                </button>
              )}

              {editCount > 0 && (
                <span className="gd-edit-count-badge" title={`已编辑 ${editCount} 次`}>
                  <span>{editCount}</span>
                  <Pencil size={12} />
                  <span className="gd-meta-dot" aria-hidden="true">·</span>
                </span>
              )}

              <time
                className="gd-first-date"
                dateTime={node.createdAt}
                title={new Date(gestureTimestamp(node.createdAt)).toLocaleString('zh-CN')}
              >
                {formatMonthDay(node.createdAt)}
              </time>
            </div>
          </div>

          {parentExpanded && replyParentNode && (
            <GestureReplyContext
              variant="parent"
              nodes={[replyParentNode]}
              origin={floorIndex}
              onJump={onJumpToFloor}
              onCollapse={toggleNestedParent}
            />
          )}

          {(node.quote || quotedNode) && (
            <QuoteEmbedCard
              quote={
                node.quote || {
                  id: quotedNode!.id,
                  authorName: quotedNode!.authorName,
                  excerpt: quotedNode!.message.slice(0, 100),
                }
              }
              quotedNode={quotedNode}
              currentFloorIndex={floorIndex}
              onJumpToFloor={onJumpToFloor}
            />
          )}

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
              onKeyDown={(e) => {
                if (e.target instanceof HTMLImageElement && (e.key === 'Enter' || e.key === ' ')) {
                  e.preventDefault();
                  onZoomImage(e.target);
                }
              }}
              dangerouslySetInnerHTML={renderedBody}
            />
          )}
        </div>
      </div>

      {/* Action bar locked on right content axis (margin-left: 56px) */}
      <div className="gd-zone4-action-bar">
        <div className="gd-zone4-left">
          <EmojiReactionCluster
            mode="summary"
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
              <span>{directReplies.length} 条回复</span>
              {directRepliesExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
          )}
        </div>

        <div className="gd-zone4-right">
          <EmojiReactionCluster
            mode="trigger"
            summary={node.reactions?.summary}
            details={node.reactions?.details}
            totalLikes={node.likesCount || 0}
            userReaction={currentUserReaction}
            onReact={(emoji) => onReact(node.id, emoji)}
          />

          <button
            type="button"
            className={`gd-icon-btn ${boostComposerOpen ? 'is-active' : ''}`}
            onClick={() => setBoostComposerOpen((prev) => !prev)}
            title="发送 Boost 短评"
            aria-label="发送 Boost 短评"
          >
            <Zap size={16} />
          </button>

          <button
            type="button"
            className={`gd-icon-btn ${copiedJustNow ? 'is-success' : ''}`}
            onClick={handleCopyFloorLink}
            title="复制贴文锚点链接"
            aria-label="复制贴文锚点链接"
          >
            {copiedJustNow ? <Check size={16} /> : <Link2 size={16} />}
          </button>

          {(isOp || canManage) && (
            <div ref={moreMenuRef} className={`gd-more-drawer ${moreMenuOpen ? 'is-open' : ''}`}>
              <div
                className={`gd-more-drawer__tray ${moreMenuOpen ? 'is-open' : ''}`}
                aria-hidden={!moreMenuOpen}
              >
                <div className="gd-more-drawer__items">
                  {isOp && (
                    <>
                      <a
                        className="gd-icon-btn"
                        href="/community/reporting-and-appeals/"
                        target="_blank"
                        rel="noopener noreferrer"
                        tabIndex={moreMenuOpen ? 0 : -1}
                        title="举报与申诉"
                        aria-label="举报与申诉"
                      >
                        <Flag size={15} />
                      </a>
                      <button
                        type="button"
                        className={`gd-icon-btn ${isBookmarked ? 'is-bookmarked' : ''}`}
                        tabIndex={moreMenuOpen ? 0 : -1}
                        onClick={() => {
                          onToggleBookmark(node.id);
                          setMoreMenuOpen(false);
                        }}
                        title={isBookmarked ? '移出书签' : '加入书签'}
                        aria-label="书签"
                      >
                        <Bookmark size={15} />
                      </button>
                    </>
                  )}
                  {canManage && (
                    <>
                      <button
                        type="button"
                        className="gd-icon-btn"
                        tabIndex={moreMenuOpen ? 0 : -1}
                        onClick={() => {
                          setEditDraft(node.message);
                          setEditTitleDraft(node.title || '');
                          setIsEditing((prev) => !prev);
                          setMoreMenuOpen(false);
                        }}
                        title="编辑贴文"
                        aria-label="编辑贴文"
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        type="button"
                        className="gd-icon-btn is-danger"
                        tabIndex={moreMenuOpen ? 0 : -1}
                        onClick={() => {
                          setMoreMenuOpen(false);
                          onDelete(node.id);
                        }}
                        title="删除贴文"
                        aria-label="删除贴文"
                      >
                        <Trash2 size={15} />
                      </button>
                    </>
                  )}
                </div>
              </div>

              <button
                type="button"
                className={`gd-icon-btn ${moreMenuOpen ? 'is-active' : ''}`}
                onClick={() => setMoreMenuOpen((prev) => !prev)}
                title="更多操作"
                aria-expanded={moreMenuOpen}
                aria-label="更多操作"
              >
                <MoreHorizontal size={16} />
              </button>
            </div>
          )}

          <button
            type="button"
            className="gd-icon-btn is-reply-primary"
            onClick={() => onReplyFloor(node)}
            title={isOp ? '回复主贴' : '回复该楼层'}
            aria-label={isOp ? '回复主贴' : '回复该楼层'}
          >
            <Reply size={16} />
            <span>回复</span>
          </button>
        </div>
      </div>

      {/* Horizontal row-wrap Boost pill flow strictly on margin-left: 56px */}
      <GestureBoostSection
        gestureId={node.id}
        isOp={isOp}
        boosts={boosts}
        composerOpen={boostComposerOpen}
        onComposerOpenChange={setBoostComposerOpen}
        onAddBoost={onAddBoost}
      />

      {/* Chronological direct replies list (1-to-N) strictly on margin-left: 56px */}
      {directReplies.length > 0 && directRepliesExpanded && (
        <GestureReplyContext
          variant="children"
          nodes={directReplies}
          origin={floorIndex}
          childrenMap={childrenMap}
          onJump={onJumpToFloor}
          onCollapse={() => {
            restoreDirectFocusRef.current = Boolean(
              document.activeElement instanceof HTMLElement &&
                document.activeElement.matches(':focus-visible'),
            );
            pendingDirectTopRef.current = Math.max(
              120,
              directToggleRef.current?.getBoundingClientRect().top || 120,
            );
            setDirectRepliesExpanded(false);
          }}
        />
      )}
    </article>
  );
}
