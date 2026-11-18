import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, Bookmark, Link2, Check, Flame, X } from 'lucide-react';
import { createComment, type BlogComment, type CommentIdentity } from '../../../lib/comment-client';
import {
  createScopedBoost,
  deleteGestureNode,
  editGestureNode,
  extractOpTitle,
  fetchGestureDetail,
  getOrCreateGestureSessionToken,
  reactToGesture,
  replyToGesture,
  reportGestureNode,
  toggleGestureSubscription,
  type GestureBoost,
  type GestureNode,
  type GestureQuote,
  type GestureRelatedLink,
  type GestureTopicMap,
  type JumpOriginAnchor,
} from '../../../lib/gesture-client';
import { GestureHeaderZone } from './GestureHeaderZone';
import { GestureFloorCard } from './GestureFloorCard';
import { GestureRelatedAndTopicMap } from './GestureRelatedAndTopicMap';
import { GestureTimelineScroller } from './GestureTimelineScroller';
import { GestureInlineReplyComposer } from './GestureInlineReplyComposer';

interface ChannelMeta {
  id: string;
  label: string;
  icon: string;
}

interface GestureDetailPageProps {
  gestureId: string;
  fallbackGesture: BlogComment | null;
  fallbackReplies: BlogComment[];
  channels: readonly ChannelMeta[];
  identity: CommentIdentity | null;
  bookmarkedPostIds: string[];
  onToggleBookmark: (id: string, e?: React.MouseEvent) => void;
  onBackToList: () => void;
  onToast: (msg: string) => void;
  onZoomImage: (src: string) => void;
  onSyncNewComment?: (comment: BlogComment) => void;
}

function toGestureNode(c: BlogComment, floorIndex: number): GestureNode {
  return {
    id: c.id,
    postSlug: c.postSlug,
    parentId: c.parentId,
    replyToId: (c as any).replyToId || null,
    quoteId: c.quoteId,
    quote: (c.quote as any) || null,
    postType: c.postType,
    tag: c.tag,
    title: (c as any).title || null,
    tags: (c as any).tags || [],
    editCount: (c as any).editCount || 0,
    viewsCount: (c as any).viewsCount || 0,
    floorIndex,
    authorId: c.authorId,
    authorName: c.authorName,
    authorAvatar: c.authorAvatar,
    authorWebsite: c.authorWebsite,
    authorRole: c.authorRole,
    message: c.message,
    likesCount: c.likesCount || 0,
    reactions: c.reactions,
    status: c.status,
    createdAt: c.createdAt,
    updatedAt: c.updatedAt,
  };
}

export function GestureDetailPage({
  gestureId,
  fallbackGesture,
  fallbackReplies,
  channels,
  identity,
  bookmarkedPostIds,
  onToggleBookmark,
  onBackToList,
  onToast,
  onZoomImage,
  onSyncNewComment,
}: GestureDetailPageProps) {
  const [loading, setLoading] = useState(true);
  const [gesture, setGesture] = useState<GestureNode | null>(
    fallbackGesture ? toGestureNode(fallbackGesture, 1) : null
  );
  const [subGestures, setSubGestures] = useState<GestureNode[]>(
    fallbackReplies.map((r, i) => toGestureNode(r, i + 2))
  );
  const [boostsByGestureId, setBoostsByGestureId] = useState<Record<string, GestureBoost[]>>({});
  const [relatedLinks, setRelatedLinks] = useState<GestureRelatedLink[]>([]);
  const [topicMap, setTopicMap] = useState<GestureTopicMap>({
    viewsCount: 1,
    likesCount: fallbackGesture?.likesCount || 0,
    linksCount: 0,
    usersCount: 1,
    participants: [],
    estimatedReadMinutes: 1,
    latestReplyAt: fallbackGesture?.createdAt || new Date().toISOString(),
  });
  const [subscribed, setSubscribed] = useState(false);

  // Interactive controls state
  const [hotFilterActive, setHotFilterActive] = useState(false);
  const [aiSummaryOpen, setAiSummaryOpen] = useState(false);
  const [topbarCopied, setTopbarCopied] = useState(false);
  const [currentFloor, setCurrentFloor] = useState(1);
  const [scrollPercent, setScrollPercent] = useState(0);
  const [jumpOrigin, setJumpOrigin] = useState<JumpOriginAnchor | null>(null);
  const [highlightedFloorIndex, setHighlightedFloorIndex] = useState<number | null>(null);

  // Reply / Quote composer state
  const [replyTarget, setReplyTarget] = useState<GestureNode | null>(null);
  const [quoteTarget, setQuoteTarget] = useState<GestureQuote | null>(null);
  const replyTextareaRef = useRef<HTMLTextAreaElement>(null);
  const highlightTimerRef = useRef<number | null>(null);

  // Load full thread from /api/gestures (with clean fallback if offline/mock)
  useEffect(() => {
    let cancelled = false;
    async function loadThread() {
      setLoading(true);
      try {
        const res = await fetchGestureDetail(gestureId);
        if (!cancelled && res.ok && res.gesture) {
          setGesture(res.gesture);
          setSubGestures(res.subGestures || []);
          setBoostsByGestureId(res.boostsByGestureId || {});
          setRelatedLinks(res.relatedLinks || []);
          if (res.topicMap) setTopicMap(res.topicMap);
          setSubscribed(Boolean(res.subscribed));
          setLoading(false);
          return;
        }
      } catch {}

      if (!cancelled && fallbackGesture) {
        const opNode = toGestureNode(fallbackGesture, 1);
        const subNodes = fallbackReplies.map((r, idx) => toGestureNode(r, idx + 2));
        setGesture(opNode);
        setSubGestures(subNodes);
        setTopicMap((prev) => ({
          ...prev,
          likesCount:
            (opNode.likesCount || 0) + subNodes.reduce((acc, s) => acc + (s.likesCount || 0), 0),
          usersCount: new Set([opNode.authorName, ...subNodes.map((s) => s.authorName)]).size,
          latestReplyAt: subNodes[subNodes.length - 1]?.createdAt || opNode.createdAt,
        }));
      }
      if (!cancelled) setLoading(false);
    }

    loadThread();
    return () => {
      cancelled = true;
    };
  }, [gestureId]);

  const totalFloors = 1 + subGestures.length;

  // Lookup maps for O(1) resolution of Scene A (directReplies) and Scene B (parentNode) and Quote
  const { nodeById, nodeByFloor, directRepliesByParentId } = useMemo(() => {
    const byId = new Map<string, GestureNode>();
    const byFloor = new Map<number, GestureNode>();
    const directMap = new Map<string, GestureNode[]>();

    if (gesture) {
      byId.set(gesture.id, { ...gesture, floorIndex: 1 });
      byFloor.set(1, { ...gesture, floorIndex: 1 });
    }
    subGestures.forEach((sub, idx) => {
      const floorNum = sub.floorIndex || idx + 2;
      const normalized = { ...sub, floorIndex: floorNum };
      byId.set(sub.id, normalized);
      byFloor.set(floorNum, normalized);

      const targetParent = sub.replyToId || sub.parentId || gesture?.id || '';
      if (targetParent) {
        const list = directMap.get(targetParent) || [];
        list.push(normalized);
        directMap.set(targetParent, list);
      }
    });

    return { nodeById: byId, nodeByFloor: byFloor, directRepliesByParentId: directMap };
  }, [gesture, subGestures]);

  const displayedSubGestures = useMemo(() => {
    if (!hotFilterActive) return subGestures;
    const filtered = subGestures.filter(
      (s) => (s.likesCount || 0) >= 3 || (directRepliesByParentId.get(s.id)?.length || 0) > 0
    );
    return filtered.length > 0 ? filtered : subGestures.slice().sort((a, b) => (b.likesCount || 0) - (a.likesCount || 0));
  }, [subGestures, hotFilterActive, directRepliesByParentId]);

  // Viewport Scroll Tracker for Timeline Scroller
  useEffect(() => {
    const handleScroll = () => {
      const floorEls = document.querySelectorAll<HTMLElement>('.gb-floor-target');
      if (!floorEls.length) return;

      const anchorY = window.innerHeight * 0.35;
      let activeFloor = 1;

      floorEls.forEach((el) => {
        const rect = el.getBoundingClientRect();
        const fIdx = Number(el.dataset.floorIndex || '1');
        if (rect.top <= anchorY) {
          activeFloor = fIdx;
        }
      });

      setCurrentFloor(activeFloor);
      const pct =
        totalFloors <= 1
          ? 0
          : Math.min(100, Math.max(0, Math.round(((activeFloor - 1) / (totalFloors - 1)) * 100)));
      setScrollPercent(pct);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    const timer = window.setTimeout(handleScroll, 120);
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.clearTimeout(timer);
    };
  }, [totalFloors, displayedSubGestures]);

  const scrollToFloor = useCallback((floorNum: number, highlight = false) => {
    const el = document.getElementById(`floor-${floorNum}`);
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });

    if (highlight) {
      if (highlightTimerRef.current) window.clearTimeout(highlightTimerRef.current);
      setHighlightedFloorIndex(floorNum);
      highlightTimerRef.current = window.setTimeout(() => {
        setHighlightedFloorIndex(null);
      }, 1500);
    }
  }, []);

  // Cross-floor Jump with Origin Memory (pins ├─ [ 返回 ] on right timeline rail)
  const handleJumpWithMemory = useCallback(
    (targetFloorIndex: number, originFloorIndex: number) => {
      if (targetFloorIndex !== originFloorIndex) {
        const originPct =
          totalFloors <= 1
            ? 0
            : Math.min(100, Math.max(0, ((originFloorIndex - 1) / (totalFloors - 1)) * 100));
        setJumpOrigin({
          floorIndex: originFloorIndex,
          percent: originPct,
          targetFloorIndex,
        });
      }
      scrollToFloor(targetFloorIndex, true);
    },
    [totalFloors, scrollToFloor]
  );

  const handleReturnToOrigin = useCallback(() => {
    if (!jumpOrigin) return;
    const target = jumpOrigin.floorIndex;
    setJumpOrigin(null);
    scrollToFloor(target, true);
  }, [jumpOrigin, scrollToFloor]);

  const handleJumpFromRail = useCallback(
    (floorNum: number) => {
      scrollToFloor(floorNum, false);
    },
    [scrollToFloor]
  );

  // Actions
  const handleReact = async (nodeId: string, emoji: string) => {
    try {
      const res = await reactToGesture({ id: nodeId, emoji, identity });
      if (res.ok && res.reactions) {
        if (gesture && gesture.id === nodeId) {
          setGesture((prev) =>
            prev
              ? { ...prev, likesCount: res.likesCount ?? prev.likesCount, reactions: res.reactions }
              : prev
          );
        } else {
          setSubGestures((prev) =>
            prev.map((s) =>
              s.id === nodeId
                ? { ...s, likesCount: res.likesCount ?? s.likesCount, reactions: res.reactions }
                : s
            )
          );
        }
      }
    } catch {
      onToast('⚠️ 表态请求失败，请稍后重试');
    }
  };

  const handleAddBoost = async (targetId: string, content: string): Promise<boolean> => {
    try {
      const res = await createScopedBoost({ gestureId: targetId, content, identity });
      if (res.ok && res.boost) {
        setBoostsByGestureId((prev) => ({
          ...prev,
          [targetId]: [...(prev[targetId] || []), res.boost!],
        }));
        onToast('⚡ Boost 已发布！');
        return true;
      }
      onToast(res.error || 'Boost 发布失败');
      return false;
    } catch {
      onToast('⚠️ 网络异常，Boost 发布失败');
      return false;
    }
  };

  const handleReplySubmit = async (payload: {
    message: string;
    replyToId: string | null;
    quoteId: string | null;
    quote: GestureQuote | null;
  }): Promise<boolean> => {
    if (!gesture) return false;
    try {
      const res = await replyToGesture({
        rootId: gesture.id,
        replyToId: payload.replyToId || gesture.id,
        message: payload.message,
        tag: gesture.tag,
        quoteId: payload.quoteId,
        quote: payload.quote,
        identity,
      });

      if (res.ok && res.subGesture) {
        const created = res.subGesture;
        setSubGestures((prev) => [...prev, created]);
        setTopicMap((prev) => ({
          ...prev,
          latestReplyAt: created.createdAt,
        }));
        setReplyTarget(null);
        setQuoteTarget(null);
        onToast('💬 回复已发布到讨论流！');
        setTimeout(() => scrollToFloor(created.floorIndex || subGestures.length + 2, true), 200);
        return true;
      }

      // Fallback for static test servers mocking only /api/comments
      const legacy = await createComment({
        slug: 'guestbook',
        parentId: gesture.id,
        message: payload.message,
        postType: 'gesture',
        tag: gesture.tag,
        author: identity || undefined,
      });
      if (legacy.ok && legacy.comment) {
        const nextFloor = subGestures.length + 2;
        const created = toGestureNode(legacy.comment, nextFloor);
        setSubGestures((prev) => [...prev, created]);
        onSyncNewComment?.(legacy.comment);
        setReplyTarget(null);
        setQuoteTarget(null);
        onToast('💬 回复已发表！');
        return true;
      }

      onToast(res.error || legacy.error || '回复失败');
      return false;
    } catch {
      onToast('⚠️ 网络异常，回复失败');
      return false;
    }
  };

  const handleEditSave = async (nodeId: string, newMessage: string, newTitle?: string): Promise<boolean> => {
    try {
      const res = await editGestureNode({ id: nodeId, message: newMessage, title: newTitle, identity });
      if (res.ok) {
        if (gesture && gesture.id === nodeId) {
          setGesture((prev) =>
            prev
              ? {
                  ...prev,
                  message: newMessage,
                  title: newTitle !== undefined ? newTitle : prev.title,
                  editCount: res.editCount ?? (prev.editCount || 0) + 1,
                }
              : prev
          );
        } else {
          setSubGestures((prev) =>
            prev.map((s) =>
              s.id === nodeId
                ? { ...s, message: newMessage, editCount: res.editCount ?? (s.editCount || 0) + 1 }
                : s
            )
          );
        }
        onToast('✏️ 修改已保存');
        return true;
      }
      onToast(res.error || '编辑失败');
      return false;
    } catch {
      onToast('⚠️ 网络异常');
      return false;
    }
  };

  const handleDeleteNode = async (nodeId: string) => {
    if (!window.confirm('确认删除此内容吗？')) return;
    try {
      const res = await deleteGestureNode({ id: nodeId, identity });
      if (res.ok) {
        onToast('🗑️ 已删除');
        if (gesture && gesture.id === nodeId) {
          onBackToList();
        } else {
          setSubGestures((prev) => prev.filter((s) => s.id !== nodeId));
        }
      } else {
        onToast(res.error || '删除失败');
      }
    } catch {
      onToast('⚠️ 删除失败');
    }
  };

  const handleToggleSubscribe = async () => {
    if (!gesture) return;
    try {
      const res = await toggleGestureSubscription({ gestureId: gesture.id, identity });
      if (res.ok) {
        setSubscribed(Boolean(res.subscribed));
        onToast(res.subscribed ? '🔔 已订阅该贴文新回复通知' : '🔕 已取消订阅通知');
      }
    } catch {
      setSubscribed((prev) => !prev);
    }
  };

  const handleCopyShareLink = (floorNum?: number, isOp?: boolean) => {
    const base = `${window.location.origin}/guestbook/#gesture-${gestureId}`;
    const url = floorNum && !isOp ? `${base}-floor-${floorNum}` : base;
    navigator.clipboard?.writeText(url);
    onToast(floorNum && !isOp ? `🔗 第 ${floorNum} 楼链接已复制` : '🔗 贴文直达链接已复制');
  };

  const focusReplyComposer = (target: GestureNode | null) => {
    setReplyTarget(target && gesture && target.id !== gesture.id ? target : null);
    const el = document.getElementById('detail-reply-composer');
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setTimeout(() => replyTextareaRef.current?.focus(), 200);
  };

  const handleQuoteFloor = (target: GestureNode) => {
    const clean = target.message.replace(/[#*`>\n]+/g, ' ').trim();
    const excerpt = clean.slice(0, 88) + (clean.length > 88 ? '…' : '');
    setQuoteTarget({
      id: target.id,
      floorIndex: target.floorIndex || 1,
      authorName: target.authorName,
      authorAvatar: target.authorAvatar,
      excerpt,
      fullMessage: target.message,
    });
    const el = document.getElementById('detail-reply-composer');
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setTimeout(() => replyTextareaRef.current?.focus(), 200);
  };

  if (loading && !gesture) {
    return (
      <div className="gb-gesture-detail-view gd-detail-root">
        <div className="gd-topbar">
          <button type="button" className="gb-back-btn gd-back-btn" onClick={onBackToList}>
            <ArrowLeft className="w-4 h-4" />
            <span>返回 Gesture 列表</span>
          </button>
        </div>
        <div className="gd-monolithic-shell gd-loading-box">
          <div className="gb-spinner" />
          <span>正在加载 Gesture 完整讨论脉络...</span>
        </div>
      </div>
    );
  }

  if (!gesture) {
    return (
      <div className="gb-gesture-detail-view gd-detail-root">
        <div className="gd-topbar">
          <button type="button" className="gb-back-btn gd-back-btn" onClick={onBackToList}>
            <ArrowLeft className="w-4 h-4" />
            <span>返回 Gesture 列表</span>
          </button>
        </div>
        <div className="gd-monolithic-shell gd-empty-box">
          <p>未找到该 Gesture 讨论，可能已被作者删除。</p>
        </div>
      </div>
    );
  }

  const { title: opTitle, bodyWithoutLeadingHeading } = extractOpTitle(gesture);
  const channel = channels.find((c) => c.id === gesture.tag) || { id: 'chat', label: '随心闲聊', icon: '💬' };
  const isBookmarked = bookmarkedPostIds.includes(gesture.id);
  const currentFloorDate = nodeByFloor.get(currentFloor)?.createdAt || gesture.createdAt;
  const sessionToken = getOrCreateGestureSessionToken();

  const checkCanManage = (node: GestureNode) => {
    if (identity?.role === 'admin') return true;
    if (identity?.id && identity.id === node.authorId) return true;
    return Boolean(sessionToken && node.authorId === sessionToken);
  };

  const getCurrentUserReaction = (node: GestureNode) => {
    const uid = identity?.id || sessionToken;
    if (!uid || !node.reactions?.users) return null;
    return node.reactions.users[uid] || null;
  };

  return (
    <div className="gb-gesture-detail-view gd-detail-root">
      {/* Minimal Detail Topbar (NO home plaza filter/search/boost banner!) */}
      <div className="gd-topbar">
        <button type="button" className="gb-back-btn gd-back-btn" onClick={onBackToList}>
          <ArrowLeft className="w-4 h-4" />
          <span>返回 Gesture 列表</span>
        </button>

        <div className="gd-topbar__actions">
          <button
            type="button"
            className={`gd-topbar-btn ${isBookmarked ? 'is-bookmarked' : ''}`}
            onClick={(e) => onToggleBookmark(gesture.id, e)}
            title={isBookmarked ? '移出书签' : '加入书签'}
            aria-label="书签"
          >
            <Bookmark className="w-4 h-4" />
          </button>

          <button
            type="button"
            className={`gd-topbar-btn ${topbarCopied ? 'is-copied' : ''}`}
            onClick={() => {
              handleCopyShareLink();
              setTopbarCopied(true);
              setTimeout(() => setTopbarCopied(false), 1800);
            }}
            title="分享贴文链接"
            aria-label="分享链接"
          >
            {topbarCopied ? <Check className="w-4 h-4" /> : <Link2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Main 2-Column Layout: Left Monolithic Dark Frosted Glass + Right Sticky Timeline Rail */}
      <div className="gd-detail-grid">
        <main className="gd-monolithic-shell">
          {/* ZONE 1: OP Exclusive Header */}
          <GestureHeaderZone
            title={opTitle}
            isPinned={gesture.status === 'pinned'}
            channelLabel={channel.label}
            channelIcon={channel.icon}
            staticTags={gesture.tags}
          />

          {/* ZONE 2 + ZONE 3 + ZONE 4 for OP Gesture */}
          <GestureFloorCard
            node={gesture}
            isOp={true}
            floorIndex={1}
            bodyMarkdown={bodyWithoutLeadingHeading}
            boosts={boostsByGestureId[gesture.id] || []}
            directReplies={directRepliesByParentId.get(gesture.id) || []}
            replyParentNode={null}
            quotedNode={null}
            isHighlighted={highlightedFloorIndex === 1}
            isBookmarked={isBookmarked}
            canManage={checkCanManage(gesture)}
            currentUserReaction={getCurrentUserReaction(gesture)}
            onReact={handleReact}
            onAddBoost={handleAddBoost}
            onReplyFloor={(n) => focusReplyComposer(n)}
            onQuoteFloor={handleQuoteFloor}
            onJumpToFloor={handleJumpWithMemory}
            onToggleBookmark={(id) => onToggleBookmark(id)}
            onReport={async (id) => {
              const r = await reportGestureNode({ id, identity });
              onToast(r.message || '已记录反馈');
            }}
            onEditSave={handleEditSave}
            onDelete={handleDeleteNode}
            onCopyLink={handleCopyShareLink}
            onZoomImage={onZoomImage}
          />

          {/* ZONE 5 & ZONE 6: Related Links + Topic Map Watershed */}
          <GestureRelatedAndTopicMap
            relatedLinks={relatedLinks}
            topicMap={topicMap}
            hotFilterActive={hotFilterActive}
            onToggleHotFilter={() => setHotFilterActive((prev) => !prev)}
            aiSummaryOpen={aiSummaryOpen}
            onToggleAiSummary={() => setAiSummaryOpen((prev) => !prev)}
            gesture={gesture}
            subGestures={subGestures}
          />

          {/* Hot Filter Active Banner */}
          {hotFilterActive && (
            <div className="gd-hot-filter-banner">
              <span className="gd-hot-filter-label">
                <Flame className="w-3.5 h-3.5 text-amber-400" />
                <span>当前仅看热门高赞回复 ({displayedSubGestures.length} 条)</span>
              </span>
              <button type="button" onClick={() => setHotFilterActive(false)}>
                <X className="w-3.5 h-3.5" />
                <span>查看全部回复</span>
              </button>
            </div>
          )}

          {/* SubGesture Replies Stream (separated strictly by 1px horizontal dividers) */}
          <div className="gd-subgestures-stream">
            {displayedSubGestures.map((sub, idx) => {
              const floorNum = sub.floorIndex || idx + 2;
              const parentIdToLookup = sub.replyToId || null;
              const replyParent = parentIdToLookup ? nodeById.get(parentIdToLookup) || null : null;
              const quotedNode = sub.quoteId ? nodeById.get(sub.quoteId) || null : null;

              return (
                <div key={sub.id} className="gd-subgesture-divider-wrap">
                  <GestureFloorCard
                    node={sub}
                    isOp={false}
                    floorIndex={floorNum}
                    bodyMarkdown={sub.message}
                    boosts={boostsByGestureId[sub.id] || []}
                    directReplies={directRepliesByParentId.get(sub.id) || []}
                    replyParentNode={replyParent}
                    quotedNode={quotedNode}
                    isHighlighted={highlightedFloorIndex === floorNum}
                    isBookmarked={isBookmarked}
                    canManage={checkCanManage(sub)}
                    currentUserReaction={getCurrentUserReaction(sub)}
                    onReact={handleReact}
                    onAddBoost={handleAddBoost}
                    onReplyFloor={(n) => focusReplyComposer(n)}
                    onQuoteFloor={handleQuoteFloor}
                    onJumpToFloor={handleJumpWithMemory}
                    onToggleBookmark={(id) => onToggleBookmark(id)}
                    onReport={async (id) => {
                      const r = await reportGestureNode({ id, identity });
                      onToast(r.message || '已记录反馈');
                    }}
                    onEditSave={handleEditSave}
                    onDelete={handleDeleteNode}
                    onCopyLink={handleCopyShareLink}
                    onZoomImage={onZoomImage}
                  />
                </div>
              );
            })}
          </div>

          {/* Inline Reply Composer inside Monolithic Shell */}
          <GestureInlineReplyComposer
            replyTarget={replyTarget}
            quoteTarget={quoteTarget}
            onClearReplyTarget={() => setReplyTarget(null)}
            onClearQuoteTarget={() => setQuoteTarget(null)}
            onSubmit={handleReplySubmit}
            onToast={onToast}
            textareaRef={replyTextareaRef}
          />
        </main>

        {/* Right Sticky Timeline Scroller */}
        <GestureTimelineScroller
          totalFloors={totalFloors}
          currentFloor={currentFloor}
          currentFloorDate={currentFloorDate}
          startDate={gesture.createdAt}
          latestDate={topicMap.latestReplyAt || gesture.createdAt}
          scrollPercent={scrollPercent}
          jumpOrigin={jumpOrigin}
          hotFilterActive={hotFilterActive}
          subscribed={subscribed}
          onJumpToFloor={handleJumpFromRail}
          onReturnToOrigin={handleReturnToOrigin}
          onToggleHotFilter={() => setHotFilterActive((prev) => !prev)}
          onReplyOp={() => focusReplyComposer(null)}
          onToggleSubscribe={handleToggleSubscribe}
        />
      </div>
    </div>
  );
}
