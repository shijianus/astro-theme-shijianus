import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, Bell, Bookmark, Link2 } from 'lucide-react';
import type { CommentIdentity } from '../../../lib/comment-client';
import { parseGestureHash } from '../../../lib/gesture-text';
import { createScopedBoost, deleteGestureNode, editGestureNode, extractOpTitle, fetchGestureDetail,
  getOrCreateGestureSessionToken, reactToGesture, replyToGesture, toggleGestureSubscription,
  type GestureDetailResponse, type GestureNode, type GestureQuote } from '../../../lib/gesture-client';
import { GestureHeaderZone } from './GestureHeaderZone';
import { GestureFloorCard } from './GestureFloorCard';
import { GestureRelatedAndTopicMap } from './GestureRelatedAndTopicMap';
import { GestureTimelineScroller } from './GestureTimelineScroller';
import { GestureInlineReplyComposer } from './GestureInlineReplyComposer';

interface Props {
  gestureId: string;
  channels: readonly { id: string; label: string }[];
  identity: CommentIdentity | null;
  bookmarkedPostIds: string[];
  onToggleBookmark: (id: string) => void;
  onBackToList: () => void;
  onToast: (message: string) => void;
  onZoomImage: (src: string) => void;
}
const PAGE_SIZE = 40;
const empty: GestureNode[] = [];

export function GestureDetailPage({ gestureId, channels, identity, bookmarkedPostIds, onToggleBookmark, onBackToList, onToast, onZoomImage }: Props) {
  const [thread, setThread] = useState<GestureDetailResponse | null>(null);
  const [err, setErr] = useState('');
  const [hot, setHot] = useState(false);
  const [page, setPage] = useState(0);
  const [jump, setJump] = useState<{ floor: number; offset?: number } | null>(null);
  const [origin, setOrigin] = useState<{ floor: number; offset: number } | null>(null);
  const [fading, setFading] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const [contact, setContact] = useState<GestureNode | null>(null);
  const [quote, setQuote] = useState<GestureQuote | null>(null);
  const textarea = useRef<HTMLTextAreaElement>(null);
  const content = useRef<HTMLElement>(null);
  const loadVersion = useRef(0);
  const op = thread?.gesture;
  const replies = thread?.subGestures || empty;
  const floors = useMemo(() => op ? [op, ...replies] : [], [op, replies]);
  const { byId, children } = useMemo(() => {
    const byId = new Map(floors.map(n => [n.id, n]));
    const children = new Map<string, GestureNode[]>();
    for (const n of replies) {
      const parent = n.replyToId || n.parentId;
      if (!parent || !byId.has(parent)) continue;
      if (!children.has(parent)) children.set(parent, []);
      children.get(parent)!.push(n);
    }
    return { byId, children };
  }, [floors, replies]);
  const filtered = useMemo(() => hot ? replies.filter(n => n.likesCount >= 3 || children.has(n.id)) : replies, [hot, replies, children]);
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const activePage = Math.min(page, pages - 1);
  const slice = filtered.slice(activePage * PAGE_SIZE, (activePage + 1) * PAGE_SIZE);

  const refresh = useCallback(async (countView = false) => {
    const version = ++loadVersion.current;
    try {
      const data = await fetchGestureDetail(gestureId, countView);
      if (version === loadVersion.current) {
        if (data.ok && data.gesture) { setThread(data); setErr(''); }
        else setErr(data.error || '无法读取讨论');
      }
      return data;
    } catch { if (version === loadVersion.current) setErr('讨论加载失败，请重试'); }
  }, [gestureId]);
  const viewed = useRef(false);
  useEffect(() => {
    void refresh(!viewed.current);
    viewed.current = true;
    return () => { loadVersion.current++; };
  }, [refresh, identity?.token]);

  const go = useCallback((floor: number, offset?: number) => {
    let index = filtered.findIndex(n => n.floorIndex === floor);
    if (floor > 1 && index < 0) { setHot(false); index = floor - 2; }
    setPage(floor === 1 ? 0 : Math.max(0, Math.floor(index / PAGE_SIZE)));
    setJump({ floor, offset });
  }, [filtered]);
  useLayoutEffect(() => {
    if (!jump) return;
    const el = document.getElementById('floor-' + jump.floor);
    if (!el) return;
    if (jump.offset === undefined) el.scrollIntoView({ block: 'start', behavior: 'instant' });
    else window.scrollBy({ top: el.getBoundingClientRect().top - jump.offset, behavior: 'instant' });
    setHighlight(jump.floor);
    setJump(null);
  }, [jump, activePage, floors]);
  const followHash = useRef(() => {});
  followHash.current = () => {
      if (!op) return;
      const route = parseGestureHash(location.hash);
      if (route?.id !== gestureId) return;
      const id = route.postId || thread?.legacyFloorIds?.[route.floor - 1];
      const target = id ? byId.get(id)?.floorIndex : route.floor;
      if (!target || target > floors.length) { onToast('该楼层已归档或删除'); return; }
      if (target > 1 || route.floor > 1) go(target);
      else if (window.scrollY > 120) go(1);
  };
  useEffect(() => {
    if (!op) return;
    const handle = () => followHash.current();
    handle();
    window.addEventListener('hashchange', handle);
    return () => window.removeEventListener('hashchange', handle);
  }, [gestureId, Boolean(op)]);
  useEffect(() => {
    if (!highlight) return;
    const t = setTimeout(() => setHighlight(0), 1200); return () => clearTimeout(t);
  }, [highlight]);
  useEffect(() => {
    if (!fading) return;
    const t = setTimeout(() => { setOrigin(null); setFading(false); }, 220); return () => clearTimeout(t);
  }, [fading]);
  function crossJump(target: number, source: number) {
    const el = document.getElementById('floor-' + source);
    if (el && source !== target) { setOrigin({ floor: source, offset: el.getBoundingClientRect().top }); setFading(false); }
    go(target);
  }
  async function mutate(request: Promise<{ ok: boolean; error?: string }>, message?: string) {
    try {
      const result = await request;
      if (!result.ok) { onToast(result.error || '操作失败'); return false; }
      await refresh();
      if (message) onToast(message);
      return true;
    } catch { onToast('网络异常，请重试'); return false; }
  }
  async function copy(floor = 1) {
    const url = location.origin + '/guestbook/#gesture-' + gestureId + (floor > 1 ? '-floor-' + floor + '~' + floors[floor-1].id : '');
    try { await navigator.clipboard.writeText(url); onToast('链接已复制'); return true; }
    catch { onToast('无法访问剪贴板'); return false; }
  }
  function focusComposer() {
    document.getElementById('detail-reply-composer')?.scrollIntoView({ block: 'center' });
    textarea.current?.focus({ preventScroll: true });
  }
  function renderFloor(n: GestureNode, body: string) {
    const floor = n.floorIndex!;
    const user = identity?.id || getOrCreateGestureSessionToken();
    return <GestureFloorCard key={n.id} node={n} floorIndex={floor} isOp={floor === 1} bodyMarkdown={body}
      boosts={thread?.boostsByGestureId?.[n.id] || []} directReplies={children.get(n.id) || []}
      replyParentNode={byId.get(n.replyToId || n.parentId || '') || null} quotedNode={byId.get(n.quoteId || '') || null}
      isHighlighted={highlight === floor} isBookmarked={bookmarkedPostIds.includes(gestureId)}
      canManage={n.canManage ?? (identity?.role === 'admin' || Boolean(identity?.id && identity.id === n.authorId))}
      currentUserReaction={n.reactions?.users[user]}
      onReact={async (id, emoji) => { await mutate(reactToGesture({ id, emoji, identity })); }}
      onAddBoost={(id, value) => mutate(createScopedBoost({ gestureId: id, content: value, identity }), 'Boost 已发表')}
      onReplyFloor={target => { setContact(target); focusComposer(); }}
      onQuoteFloor={target => { setQuote({ id: target.id, authorName: target.authorName, excerpt: target.message.slice(0,100) }); focusComposer(); }}
      onJumpToFloor={crossJump} onCopyLink={copy} onToggleBookmark={() => onToggleBookmark(gestureId)} onZoomImage={onZoomImage}
      onEditSave={(id, message, title) => mutate(editGestureNode({ id, message, title, identity }), '修改已保存')}
      onDelete={async id => {
        if (!window.confirm('确认删除此内容？')) return;
        try { const r = await deleteGestureNode({ id, identity }); if (r.ok) { onToast('已删除'); if (id === gestureId) onBackToList(); else await refresh(); } else onToast(r.error || '删除失败'); }
        catch { onToast('删除失败'); }
      }} />;
  }
  const back = <button type="button" className="gd-back-btn" onClick={onBackToList}><ArrowLeft size={15} />留言广场</button>;
  if (!op || !thread) return <div className="gd-detail-grid"><main className="gd-monolithic-shell"><div className="gd-topbar">{back}</div>
    <p className="gd-empty-box" role="status">{err || '正在加载讨论…'} {err && <button onClick={() => refresh(false)}>重试</button>}</p></main></div>;
  const title = extractOpTitle(op);
  return <div className="gd-detail-root"><div className="gd-detail-grid">
    <main className="gd-monolithic-shell" ref={content} data-detail-loaded="true">
      <div className="gd-topbar">{back}<div className="gd-topbar__actions">
        <button className="gd-topbar-btn" title="订阅通知" aria-label="订阅通知" aria-pressed={thread.subscribed} onClick={() => mutate(toggleGestureSubscription({ gestureId, identity }))}><Bell size={16} /></button>
        <button className="gd-topbar-btn" aria-label="书签" aria-pressed={bookmarkedPostIds.includes(gestureId)} onClick={() => onToggleBookmark(gestureId)}><Bookmark size={16} /></button>
        <button className="gd-topbar-btn" aria-label="分享链接" onClick={() => copy()}><Link2 size={16} /></button>
      </div></div>
      {err && <p role="status">{err} <button onClick={() => refresh(false)}>重试</button></p>}
      <GestureHeaderZone title={title.title} isPinned={op.status === 'pinned'} channelLabel={channels.find(c => c.id === op.tag)?.label || ''} staticTags={op.tags} />
      {renderFloor(op, title.bodyWithoutLeadingHeading)}
      {thread.topicMap && <GestureRelatedAndTopicMap relatedLinks={thread.relatedLinks || []} topicMap={thread.topicMap} gesture={op} subGestures={replies} />}
      {replies.length > 0 && <div className="gd-stream-tools"><h2>{replies.length} 条回复</h2><button aria-pressed={hot} onClick={() => { setHot(!hot); setPage(0); }}>{hot ? '查看全部回复' : '只看热门回复'}</button></div>}
      {hot && !filtered.length && <p className="gd-empty-box">暂无热门回复</p>}
      {slice.map(n => renderFloor(n, n.message))}
      {pages > 1 && <nav className="gd-pages" aria-label="回复分页">
        <button disabled={activePage === 0} onClick={() => go(filtered[(activePage-1)*PAGE_SIZE].floorIndex!)}>上一页</button>
        <span>{activePage + 1} / {pages}</span>
        <button disabled={activePage === pages-1} onClick={() => go(filtered[(activePage+1)*PAGE_SIZE].floorIndex!)}>下一页</button>
      </nav>}
      <GestureInlineReplyComposer replyTarget={contact} quoteTarget={quote} textareaRef={textarea} onToast={onToast}
        onClearReplyTarget={() => setContact(null)} onClearQuoteTarget={() => setQuote(null)}
        onSubmit={async payload => {
          try {
            const res = await replyToGesture({ ...payload, rootId: gestureId, tag: op.tag, identity });
            if (!res.ok || !res.subGesture) { onToast(res.error || '回复失败'); return false; }
            const data = await refresh();
            const created = data?.subGestures?.find(n => n.id === res.subGesture?.id);
            setContact(null); setQuote(null); setHot(false);
            if (created?.floorIndex) { setPage(Math.floor((created.floorIndex - 2) / PAGE_SIZE)); setJump({ floor: created.floorIndex }); }
            onToast('回复已发表'); return true;
          } catch { onToast('回复失败，请重试'); return false; }
        }} />
    </main>
    <GestureTimelineScroller content={content} floors={floors} page={hot ? -(activePage+1) : activePage} latest={thread.topicMap?.latestReplyAt || op.createdAt}
      origin={origin?.floor ?? null} fading={fading} onJump={go} onReturn={() => { if (origin) { go(origin.floor, origin.offset); setFading(true); } }} />
  </div></div>;
}
