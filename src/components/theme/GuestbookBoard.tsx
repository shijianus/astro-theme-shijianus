import { boostLength, validBoost } from '../../lib/gesture-text';
import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  Rocket,
  Heart,
  MessageSquare,
  Sparkles,
  Flame,
  Clock,
  Search,
  Bold,
  Italic,
  Code,
  Quote,
  List,
  Link as LinkIcon,
  Smile,
  Image as ImageIcon,
  Send,
  Pencil,
  X,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Pin,
  CheckCircle2,
  Bookmark,
  Eye,
  Minus,
  Maximize2,
  Minimize2,
  GripVertical,
} from 'lucide-react';
import {
  createComment,
  readCommentIdentity,
  uploadCommentImage,
  type BlogComment,
  type CommentIdentity,
} from '../../lib/comment-client';
import { renderGestureMarkdown } from '../../lib/gesture-markdown';
import { extractOpTitle, getOrCreateGestureSessionToken, formatMonthDay } from '../../lib/gesture-client';
import { GestureAvatar } from './gesture-detail/GestureAvatar';
import { GesturePopover } from './gesture-detail/GesturePopover';
import { GestureDetailPage } from './gesture-detail/GestureDetailPage';

// Board topic channels / dimensions configuration
export const CHANNELS = [
  { id: 'all', label: '全部维度', icon: '🌟', desc: '全站所有主题留言与讨论' },
  { id: 'chat', label: '畅所欲言', icon: '💬', desc: '自由闲聊、日常问候与生活点滴' },
  { id: 'tech', label: '技术探讨', icon: '🛠️', desc: '前端工程、边缘计算、AI与架构心得' },
  { id: 'ideas', label: '灵感交流', icon: '💡', desc: '设计思考、新颖想法与作品探讨' },
  { id: 'life', label: '生活碎碎念', icon: '☕', desc: '阅读留痕、咖啡时光与随感随笔' },
  { id: 'feedback', label: '站点建议', icon: '📮', desc: '功能建议、体验反馈与缺陷报告' },
] as const;

export type ChannelId = (typeof CHANNELS)[number]['id'];

// Horizontal category tabs lined up in sequence after "维度" (Dimension)
export const HORIZONTAL_TABS = [
  { id: 'latest', label: '最新', icon: Clock },
  { id: 'recent', label: '近期', icon: Sparkles },
  { id: 'hot', label: '热门', icon: Flame },
  { id: 'featured', label: '精选', icon: Pin },
  { id: 'my', label: '我的贴文', icon: MessageSquare },
  { id: 'read', label: '已读', icon: Eye },
  { id: 'bookmarked', label: '书签', icon: Bookmark },
] as const;

export const NAV_CATEGORIES = HORIZONTAL_TABS;
export type NavCategoryId = (typeof HORIZONTAL_TABS)[number]['id'] | 'dimensions';

// Curated Emojis Palette
const EMOJI_GROUPS = [
  {
    name: '常用表情',
    emojis: ['😀', '😃', '😄', '😆', '😅', '😂', '🤣', '😊', '🥹', '😍', '🥰', '😋', '🤔', '🤫', '🤗', '🫡', '🥳', '😎'],
  },
  {
    name: '思想与手势',
    emojis: ['👍', '🙌', '👏', '🤝', '✌️', '🫰', '🤙', '💪', '🙏', '💡', '🔥', '🚀', '✨', '🎯', '💯', '⚡', '🎉', '🌟'],
  },
  {
    name: '生活与符号',
    emojis: ['☕', '🍵', '🌱', '🌿', '📖', '💻', '🎨', '🎵', '🕹️', '🛡️', '💬', '💭', '❤️', '🧡', '💛', '💚', '💙', '💜'],
  },
];

export function GuestbookBoard() {
  // Navigation & View state
  const [activeView, setActiveView] = useState<'list' | 'detail'>('list');
  const [activeGestureId, setActiveGestureId] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<NavCategoryId>('latest');
  const [selectedDimension, setSelectedDimension] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showDimensionDropdown, setShowDimensionDropdown] = useState(false);
  const dimensionDropdownRef = useRef<HTMLDivElement>(null);

  // Local storage lists for read & bookmarked posts
  const [readPostIds, setReadPostIds] = useState<string[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      return JSON.parse(localStorage.getItem('shijianus_guestbook_reads') || '[]');
    } catch {
      return [];
    }
  });

  const [bookmarkedPostIds, setBookmarkedPostIds] = useState<string[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      return JSON.parse(localStorage.getItem('shijianus_guestbook_bookmarks') || '[]');
    } catch {
      return [];
    }
  });

  // DB comments
  const [dbComments, setDbComments] = useState<BlogComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);
  const [identity, setIdentity] = useState<CommentIdentity | null>(null);

  // Top Boost Stream State
  const [listLimit, setListLimit] = useState(20);
  const [listError, setListError] = useState('');
  const [retry, setRetry] = useState(0);
  const emojiButton = useRef<HTMLButtonElement>(null);

  // Floating Non-blocking Composer Dock State
  const [showComposer, setShowComposer] = useState(false);
  const [isComposerMinimized, setIsComposerMinimized] = useState(false);
  const [isComposerMaximized, setIsComposerMaximized] = useState(false);
  const [composerPos, setComposerPos] = useState<{ x: number; y: number } | null>(null);
  const [showComposerChannelDropdown, setShowComposerChannelDropdown] = useState(false);

  const composerRef = useRef<HTMLDivElement>(null);
  const composerChannelDropdownRef = useRef<HTMLDivElement>(null);
  const isDraggingComposerRef = useRef(false);
  const dragStartOffsetRef = useRef({ x: 0, y: 0 });

  // Unified Draft inputs for Composer (Intelligently detects Boost vs Gesture)
  const [composerTitle, setComposerTitle] = useState('');
  const [composerText, setComposerText] = useState('');
  const [composerDimension, setComposerDimension] = useState<string>('all');
  const [composerTagsList, setComposerTagsList] = useState<string[]>([]);
  const [composerTagInput, setComposerTagInput] = useState('');
  const [composerImages, setComposerImages] = useState<string[]>([]);
  const [composerUploading, setComposerUploading] = useState(false);
  const [composerPreviewTab, setComposerPreviewTab] = useState<'write' | 'preview'>('write');
  const [composerShowEmoji, setComposerShowEmoji] = useState(false);
  const [composerSubmitting, setComposerSubmitting] = useState(false);
  const [composerError, setComposerError] = useState<string | null>(null);

  // Multi-tag helper methods (max 5 tags, max 20 chars per tag)
  const handleAddTag = (raw: string) => {
    const cleaned = raw.trim().replace(/^#+/, '').trim().slice(0, 20);
    if (!cleaned) return;
    if (composerTagsList.length >= 5) return;
    if (composerTagsList.includes(cleaned)) {
      setComposerTagInput('');
      return;
    }
    setComposerTagsList((prev) => [...prev, cleaned]);
    setComposerTagInput('');
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setComposerTagsList((prev) => prev.filter((t) => t !== tagToRemove));
  };

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',' || e.key === '，' || e.key === ' ') {
      e.preventDefault();
      handleAddTag(composerTagInput);
    } else if (e.key === 'Backspace' && !composerTagInput && composerTagsList.length > 0) {
      setComposerTagsList((prev) => prev.slice(0, -1));
    }
  };

  // Dedicated Drag Handler for Composer (Only drag button moves the window)
  const handleComposerDragStart = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();

    const composerEl = composerRef.current;
    if (!composerEl) return;

    const rect = composerEl.getBoundingClientRect();
    dragStartOffsetRef.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
    isDraggingComposerRef.current = true;

    const handlePointerMove = (moveEvt: PointerEvent) => {
      if (!isDraggingComposerRef.current) return;
      const width = rect.width;
      const height = rect.height;

      let newX = moveEvt.clientX - dragStartOffsetRef.current.x;
      let newY = moveEvt.clientY - dragStartOffsetRef.current.y;

      // Keep within screen viewport
      const minX = 10;
      const maxX = Math.max(10, window.innerWidth - width - 10);
      const minY = 10;
      const maxY = Math.max(10, window.innerHeight - height - 10);

      newX = Math.max(minX, Math.min(maxX, newX));
      newY = Math.max(minY, Math.min(maxY, newY));

      setComposerPos({ x: newX, y: newY });
    };

    const handlePointerUp = () => {
      isDraggingComposerRef.current = false;
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  };

  // Clamp composer position on window resize
  useEffect(() => {
    const handleResize = () => {
      setComposerPos((prev) => {
        if (!prev) return null;
        const maxX = Math.max(10, window.innerWidth - 690);
        const maxY = Math.max(10, window.innerHeight - 500);
        return {
          x: Math.min(prev.x, maxX),
          y: Math.min(prev.y, maxY),
        };
      });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const gestureTextareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const showToast = (msg: string) => setToastMessage(msg);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        dimensionDropdownRef.current &&
        !dimensionDropdownRef.current.contains(target)
      ) {
        setShowDimensionDropdown(false);
      }
      if (
        composerChannelDropdownRef.current &&
        !composerChannelDropdownRef.current.contains(target)
      ) {
        setShowComposerChannelDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Load identity & fetch comments
  useEffect(() => {
    setIdentity(readCommentIdentity());

    if (activeView !== 'list') return;
    const controller = new AbortController();
    async function loadData() {
      setLoading(true); setListError('');
      const topics = new Map<string, BlogComment>();
      try {
        for (let offset = 0; ; offset += 200) {
          const res = await fetch('/api/comments?slug=guestbook&view=topics&limit=200&offset=' + offset, { signal: controller.signal });
          const data = await res.json();
          if (!res.ok || !data.ok || !Array.isArray(data.comments)) throw new Error();
          for (const n of data.comments as BlogComment[]) topics.set(n.id,n);
          if (data.comments.length < 200) break;
        }
        if (!controller.signal.aborted) setDbComments([...topics.values()]);
      } catch { if (!controller.signal.aborted) setListError('留言加载失败'); }
      finally { if (!controller.signal.aborted) setLoading(false); }
    }
    void loadData();
    return () => controller.abort();
  }, [activeView, retry]);
  useEffect(() => { setListLimit(20); }, [categoryFilter, searchQuery, selectedDimension]);

  // Sync with URL hash for direct links (e.g., #gesture-<id> or #gesture-<id>-floor-<n>)
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      if (hash.startsWith('#gesture-')) {
        const raw = hash.replace('#gesture-', '');
        const targetId = raw.replace(/-floor-\d+$/, '');
        setActiveGestureId(targetId);
        setActiveView('detail');
        markAsRead(targetId);
      } else if (!hash) {
        setActiveView('list');
        setActiveGestureId(null);
      }
    };

    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Update read posts
  const markAsRead = useCallback((id: string) => {
    setReadPostIds((prev) => {
      if (prev.includes(id)) return prev;
      const next = [id, ...prev];
      try {
        localStorage.setItem('shijianus_guestbook_reads', JSON.stringify(next));
      } catch {}
      return next;
    });
  }, []);

  // Toggle bookmark
  const toggleBookmark = useCallback((id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setBookmarkedPostIds((prev) => {
      const isBookmarked = prev.includes(id);
      const next = isBookmarked ? prev.filter((item) => item !== id) : [id, ...prev];
      try {
        localStorage.setItem('shijianus_guestbook_bookmarks', JSON.stringify(next));
      } catch {}
      showToast(isBookmarked ? '🔖 已移出书签' : '⭐ 已加入书签');
      return next;
    });
  }, []);

  // Toast timer
  useEffect(() => {
    if (!toastMessage) return;
    const t = setTimeout(() => setToastMessage(null), 3200);
    return () => clearTimeout(t);
  }, [toastMessage]);

  const allBoostComments = dbComments.filter(n => n.postType === 'boost' && !n.parentId);
  const [determinedType, setComposerType] = useState<'gesture' | 'boost'>('gesture');
  const [boostDraft, setBoostDraft] = useState('');
  const trimmedComposerText = (determinedType === 'boost' ? boostDraft : composerText).trim();
  const currentComposerDimObj =
    CHANNELS.find((c) => c.id === composerDimension) ||
    (composerDimension === 'all'
      ? { id: 'all', label: '综合分区', icon: '🌟', desc: '随心分享，轻量短句或全站综合交流' }
      : CHANNELS[0]);

  const wordCount = boostLength(trimmedComposerText);
  const composerWordResult = determinedType === 'boost'
    ? wordCount + '/16 · ' + (wordCount > 16 ? '超出 ' : '余 ') + Math.abs(16 - wordCount)
    : wordCount + ' 字';

  const topLevelGestures = useMemo(() => dbComments.filter(n => !n.parentId && n.postType !== 'boost'), [dbComments]);

  // Filtered Gestures according to the 8 horizontal categories
  const filteredGestures = useMemo(() => {
    let list = [...topLevelGestures];

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (c) =>
          c.message.toLowerCase().includes(q) || c.title?.toLowerCase().includes(q) ||
          (c.authorName && c.authorName.toLowerCase().includes(q)) ||
          (c.tag && c.tag.toLowerCase().includes(q))
      );
    }

    // Dimension / Tag filter (when active or selected)
    if (selectedDimension !== 'all') {
      list = list.filter((c) => (c.tag || 'tech') === selectedDimension);
    }

    // Apply the 8 categories
    switch (categoryFilter) {
      case 'latest':
        // Pinned on top, then newest
        list.sort((a, b) => {
          if (a.status === 'pinned' && b.status !== 'pinned') return -1;
          if (b.status === 'pinned' && a.status !== 'pinned') return 1;
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });
        break;

      case 'recent':
        // Active recently (within 7 days)
        const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
        list = list.filter(
          (c) => new Date(c.createdAt).getTime() >= sevenDaysAgo || c.status === 'pinned'
        );
        list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;

      case 'dimensions':
        // Kept filtered by dimension, default order
        list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;

      case 'hot':
        // Hot: sort by replies count * 3 + likes
        list.sort((a, b) => {
          const scoreA = (a.replyCount || 0) * 3 + (a.likesCount || 0);
          const scoreB = (b.replyCount || 0) * 3 + (b.likesCount || 0);
          return scoreB - scoreA;
        });
        break;

      case 'featured':
        // Featured: pinned or high likes
        list = list.filter((c) => c.status === 'pinned' || (c.likesCount || 0) >= 3);
        list.sort((a, b) => (b.likesCount || 0) - (a.likesCount || 0));
        break;

      case 'my':
        // My posts
        if (!identity?.id) {
          list = [];
        } else {
          list = list.filter(
            (c) => c.authorId === identity.id
          );
        }
        break;

      case 'read':
        // Read posts
        list = list.filter((c) => readPostIds.includes(c.id));
        break;

      case 'bookmarked':
        // Bookmarked posts
        list = list.filter((c) => bookmarkedPostIds.includes(c.id));
        break;
    }

    return list;
  }, [
    topLevelGestures,
    categoryFilter,
    selectedDimension,
    searchQuery,
    identity,
    readPostIds,
    bookmarkedPostIds,
  ]);

  const displayedGestures = filteredGestures.slice(0, listLimit);

  // Enter Gesture Detail View
  const openGestureDetail = (item: BlogComment) => {
    setActiveGestureId(item.id);
    setActiveView('detail');
    markAsRead(item.id);
    window.location.hash = `#gesture-${item.id}`;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Exit Gesture Detail View
  const closeGestureDetail = () => {
    setActiveView('list');
    setActiveGestureId(null);
    window.location.hash = '';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Open Floating Dock Composer
  const openFloatingComposer = useCallback(() => {
    setShowComposer(true);
    setIsComposerMinimized(false);
    setComposerError(null);
  }, []);

  // ----------------------------------------------------
  // SUBMISSION HANDLERS
  // ----------------------------------------------------

  // 1. Submit from Floating Composer (Intelligently handles Boost or Gesture)
  const handleComposerSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const text = trimmedComposerText;
    if (!text) {
      setComposerError('请输入内容');
      return;
    }

    try {
      setComposerSubmitting(true);
      setComposerError(null);

      if (determinedType === 'boost') {
        if (!validBoost(boostDraft)) {
          setComposerError('Boost 限单行、最多 16 字');
          setComposerSubmitting(false);
          return;
        }

        const res = await createComment({
          slug: 'guestbook',
          sessionToken: getOrCreateGestureSessionToken(),
          message: text,
          postType: 'boost',
          tag: composerDimension !== 'all' ? composerDimension : 'chat',
          author: identity || undefined,
        });

        if (res.ok && res.comment) {
          setDbComments((prev) => [res.comment!, ...prev]);
          setBoostDraft('');
          setShowComposer(false);
          showToast('✨ 发布成功！');
        } else {
          setComposerError(res.error || '发布失败，请稍后重试');
        }
      } else {
        // Gesture Mode
        if (text.length < 8) {
          setComposerError('至少需要 8 字');
          setComposerSubmitting(false);
          return;
        }

        let finalMessage = text;
        const allTags = [...composerTagsList];
        const pending = composerTagInput.trim().replace(/^#+/, '').trim().slice(0, 20);
        if (pending && !allTags.includes(pending) && allTags.length < 5) {
          allTags.push(pending);
        }
        if (composerImages.length > 0) {
          const imgMd = composerImages.map((src) => `\n![image](${src})`).join('');
          finalMessage += imgMd;
        }

        const res = await createComment({
          slug: 'guestbook',
          sessionToken: getOrCreateGestureSessionToken(),
          message: finalMessage,
          postType: 'gesture',
          title: composerTitle.trim(),
          tags: allTags,
          tag: composerDimension !== 'all' ? composerDimension : 'tech',
          author: identity || undefined,
        });

        if (res.ok && res.comment) {
          setDbComments((prev) => [res.comment!, ...prev]);
          setShowComposer(false);
          setComposerTitle('');
          setComposerText('');
          setComposerTagsList([]);
          setComposerTagInput('');
          setComposerImages([]);
          showToast('✨ 发布成功！');
          openGestureDetail(res.comment);
        } else {
          setComposerError(res.error || '发布失败，请检查网络');
        }
      }
    } catch (err: any) {
      setComposerError(err.message || '网络连接异常');
    } finally {
      setComposerSubmitting(false);
    }
  };

  // Markdown tool handler
  const insertMarkdownHelper = (
    ref: React.RefObject<HTMLTextAreaElement | null>,
    setter: React.Dispatch<React.SetStateAction<string>>,
    prefix: string,
    suffix: string = ''
  ) => {
    const textarea = ref.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const val = textarea.value;
    const selected = val.substring(start, end);
    const replacement = `${prefix}${selected}${suffix}`;
    setter(val.substring(0, start) + replacement + val.substring(end));
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, end + prefix.length);
    }, 50);
  };

  // Image Upload helper
  const handleImageFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
    setUploading: (b: boolean) => void,
    setImages: React.Dispatch<React.SetStateAction<string[]>>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      const res = await uploadCommentImage(file);
      if (res.ok && res.url) {
        setImages((prev) => [...prev, res.url!]);
        showToast('🖼️ 图片上传成功！');
      } else {
        showToast(res.error || '图片上传失败');
      }
    } catch (err: any) {
      showToast(err.message || '上传异常');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const currentDimensionObj = CHANNELS.find((c) => c.id === selectedDimension) || CHANNELS[0];

  return (
    <div className={`guestbook-board-container ${activeView === "list" ? "is-board-list" : ""}`}>
      {/* Toast Notification */}
      {toastMessage && (
        <div className="gb-toast" role="status">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Lightbox Zoom */}
      {zoomedImage && (
        <div className="gb-lightbox" onClick={() => setZoomedImage(null)}>
          <button className="gb-lightbox__close" onClick={() => setZoomedImage(null)}>
            <X className="w-5 h-5" />
          </button>
          <img src={zoomedImage} alt="Zoomed view" className="gb-lightbox__img" />
        </div>
      )}

      {/* ========================================================
          1. 楼上：BOOST 实时观点流 & 横排分类导航 (仅在列表广场态渲染，详情沉浸态彻底移除)
          ======================================================== */}
      {activeView === 'list' && (
        <>
      <header className="gb-board-header"><h1>读者留言与交流广场</h1><button type="button" className="gb-new-gesture-btn" onClick={openFloatingComposer}><Pencil size={15} />发布留言</button></header>
      {allBoostComments.length > 0 && <section className="gb-board-boosts" aria-label="广场 Boost">
        <Rocket size={15} /><div className="gd-boost-op-pills" tabIndex={0}>{allBoostComments.map(n => <span key={n.id} className="gd-boost-op-pill"><span>{n.authorName}</span> · {n.message}</span>)}</div>
      </section>}
      <nav className="gb-nav-bar" aria-label="Gesture 讨论分类与维度">
        <div className="gb-nav-bar__categories">
          {/* 1. 维度下拉选择器 (Dimension Dropdown) - 位于首位 */}
          <div className="gb-dropdown-wrapper gb-dim-dropdown-wrapper" ref={dimensionDropdownRef}>
            <button
              type="button"
              className={`gb-dim-dropdown-btn ${selectedDimension !== 'all' ? 'is-filtered' : ''}`}
              onClick={() => setShowDimensionDropdown((prev) => !prev)}
              aria-haspopup="listbox"
              aria-expanded={showDimensionDropdown}
            >
              <span className="gb-dim-prefix">维度:</span>
              <span className="mr-1 text-sm flex-shrink-0">{currentDimensionObj?.icon || '🌟'}</span>
              <span className="gb-dim-value">{selectedDimension === 'all' ? '全部维度' : currentDimensionObj?.label}</span>
              <ChevronDown className={`w-3.5 h-3.5 ml-1 text-slate-400 transition-transform ${showDimensionDropdown ? 'rotate-180' : ''}`} />
            </button>

            {showDimensionDropdown && (
              <div className="gb-scrollable-dropdown is-four-items-max" role="listbox">
                {CHANNELS.map((ch) => {
                  const isSelected = selectedDimension === ch.id;

                  return (
                    <button
                      key={ch.id}
                      type="button"
                      className={`gb-scrollable-dropdown__item ${isSelected ? 'is-selected' : ''}`}
                      onClick={() => {
                        setSelectedDimension(ch.id);
                        setShowDimensionDropdown(false);
                      }}
                      role="option"
                      aria-selected={isSelected}
                    >
                      <span className="mr-2 text-base flex-shrink-0">{ch.icon}</span>
                      <span className="gb-dropdown-item__label">{ch.label}</span>
                      {isSelected && <span className="gb-dropdown-item__check">✓</span>}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* 2. 横向排开的各分类标签项 (最新, 近期, 热门, 精选, 我的贴文, 已读, 书签) */}
          {HORIZONTAL_TABS.map((cat) => {
            const isActive = categoryFilter === cat.id;
            const count =
              cat.id === 'bookmarked'
                ? bookmarkedPostIds.length
                : cat.id === 'read'
                ? readPostIds.length
                : 0;

            return (
              <button
                key={cat.id}
                type="button"
                data-cat-id={cat.id} aria-pressed={isActive}
                className={`gb-cat-tab-btn ${isActive ? 'is-active' : ''}`}
                onClick={() => setCategoryFilter(cat.id)}
              >

                <span>{cat.label}</span>
                {count > 0 && <span className="gb-cat-badge">{count}</span>}
              </button>
            );
          })}
        </div>

        {/* Right Tools: Search & New Gesture Button */}
        <div className="gb-nav-bar__tools">
          <div className="gb-nav-search">
            <Search className="w-3.5 h-3.5 gb-search-icon" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="搜索留言" placeholder="搜索留言…"
              className="gb-search-input"
            />
            {searchQuery && (
              <button
                type="button"
                className="gb-search-clear"
                onClick={() => setSearchQuery('')}
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>


        </div>
      </nav>

        </>
      )}

      {/* ========================================================
          3. 楼下：GESTURE 广场列表 / 详情双视图 (GESTURE STREAM)
          ======================================================== */}
      {activeView === 'list' ? (
        /* LIST VIEW (GESTURE 列表广场) */
        <main className="gb-gesture-list-view">
          {loading ? (
            <div className="gb-loading-state">
              <div className="gb-spinner"></div>
              <span>正在连接边缘节点并加载 Gesture 讨论广场...</span>
            </div>
          ) : listError ? <p className="gb-empty-state" role="status">{listError} <button onClick={() => setRetry(n => n+1)}>重试</button></p> : filteredGestures.length === 0 ? (
            <div className="gb-empty-state">
              <div className="gb-empty-icon">🌱</div>
              <h3 className="gb-empty-title">
                {searchQuery ? '未找到匹配的留言' : '暂无留言'}
              </h3>
              <p className="gb-empty-desc">
                {searchQuery
                  ? '可以尝试更换关键词或清除筛选条件'
                  : '留下你的足迹吧！写下你的见解，开启交流。'}
              </p>
              <button
                type="button"
                className="gb-new-gesture-btn"
                onClick={openFloatingComposer}
              >
                <Pencil className="w-4 h-4 mr-1.5" /> 发起第一条留言
              </button>
            </div>
          ) : (
            <div className="gb-gesture-table">
              {displayedGestures.map((item) => {
                const isPinned = item.status === 'pinned';
                const isBookmarked = bookmarkedPostIds.includes(item.id);
                const isRead = readPostIds.includes(item.id);
                const channel = CHANNELS.find(c => c.id === item.tag);
                const { title, bodyWithoutLeadingHeading } = extractOpTitle(item);
                const excerpt = bodyWithoutLeadingHeading.replace(/!\[[^\]]*\]\([^)]*\)/g,'').replace(/\[([^\]]+)\]\([^)]+\)/g,'$1').replace(/[#*`_>]/g,'').trim();
                return <article key={item.id} className={`gb-gesture-row ${isRead ? 'is-read-row' : ''}`}>
                  <GestureAvatar name={item.authorName} avatar={item.authorAvatar} size={34} />
                  <div className="gb-gesture-row__main">
                    <h2 className="gb-gesture-row__title"><a href={'#gesture-' + item.id}>{isPinned && <Pin size={13} aria-label="置顶" />}{title}</a></h2>
                    {excerpt && !excerpt.startsWith(title) && <p className="gb-gesture-row__excerpt">{excerpt}</p>}
                    <div className="gb-gesture-row__footer"><strong>{item.authorName}</strong><time dateTime={item.createdAt}>{formatMonthDay(item.createdAt)}</time>{channel && <span>{channel.label}</span>}</div>
                  </div>
                  <div className="gb-gesture-row__right"><span title="回复数"><MessageSquare size={14} />{item.replyCount ?? 0}</span><span title="表态数"><Heart size={14} />{item.likesCount}</span>
                    <button className="gb-bookmark-toggle" aria-label="书签" aria-pressed={isBookmarked} onClick={e => toggleBookmark(item.id,e)}><Bookmark size={15} /></button></div>
                </article>;
              })}

              {/* 20-Item Display Cap Notice */}
              {filteredGestures.length > listLimit && (
                <div className="gb-list-cap-notice">
                  <button onClick={() => setListLimit(n => n + 20)}>查看更多留言（共 {filteredGestures.length} 篇）</button>
                </div>
              )}
            </div>
          )}
        </main>
      ) : (
        /* ========================================================
           DETAIL VIEW (GESTURE 详情与楼层时间轴滑块 - 独立沉浸架构)
           ======================================================== */
        activeGestureId && (
          <GestureDetailPage
            gestureId={activeGestureId}
            key={activeGestureId}
            channels={CHANNELS}
            identity={identity}
            bookmarkedPostIds={bookmarkedPostIds}
            onToggleBookmark={toggleBookmark}
            onBackToList={closeGestureDetail}
            onToast={showToast}
            onZoomImage={(src) => setZoomedImage(src)}
          />
        )
      )}

      {/* ========================================================
          4. 悬浮非阻塞草拟面板 (FLOATING NON-BLOCKING COMPOSER DOCK)
          智能识别机制：
          - 低于 8 字：默认智能识别为 Boost
          - 低于 30 字且无标题、无自定义 Tag、无特定分类：默认智能识别为 Boost
          - 其余情况（包含标题、选择专属分类、输入 Tag、或达到 30 字以上）：自动转为 Gesture
          ======================================================== */}
      {showComposer && (
        isComposerMinimized ? (
          <div
            className="gb-composer-minimized-pill"
            onClick={() => setIsComposerMinimized(false)}
            role="button"
            tabIndex={0}
            title="展开草拟面板"
          >
            <span className="gb-pulse-dot"></span>
            <span className="gb-minimized-badge">草稿</span>
            <span className="gb-minimized-preview">
              {composerTitle.trim() || composerText.trim()
                ? (composerTitle.trim() || composerText.trim()).slice(0, 20)
                : '草稿...'}
            </span>
            <div className="gb-minimized-actions">
              <button
                type="button"
                className="gb-minimized-btn"
                title="展开"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsComposerMinimized(false);
                }}
              >
                <ChevronUp className="w-4 h-4" />
              </button>
              <button
                type="button"
                className="gb-minimized-btn is-close"
                title="关闭"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowComposer(false);
                }}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ) : (
          <div
            ref={composerRef}
            className={`gb-floating-composer ${isComposerMaximized ? 'is-maximized' : ''} ${composerPos ? 'is-dragged' : ''}`}
            style={
              !isComposerMaximized && composerPos
                ? {
                    left: `${composerPos.x}px`,
                    top: `${composerPos.y}px`,
                    right: 'auto',
                    bottom: 'auto',
                    transform: 'none',
                  }
                : undefined
            }
          >
            {/* Composer Header: Drag Handle, Title & Window Tools */}
            <div className="gb-composer-header">
              <div className="gb-composer-header-left">
                <button
                  type="button"
                  className="gb-drag-handle-btn"
                  title="按住拖拽窗口位置"
                  aria-label="按住拖拽窗口位置"
                  onPointerDown={handleComposerDragStart}
                >
                  <GripVertical className="w-4 h-4" />
                </button>
                <span className="gb-composer-title-main">发表留言</span>
              </div>

              <div className="gb-composer-window-tools">
                <button
                  type="button"
                  className="gb-window-tool-btn"
                  title="最小化"
                  onClick={() => setIsComposerMinimized(true)}
                >
                  <Minus className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  className="gb-window-tool-btn"
                  title={isComposerMaximized ? '恢复' : '最大化'}
                  onClick={() => setIsComposerMaximized((prev) => !prev)}
                >
                  {isComposerMaximized ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-3.5 h-3.5" />}
                </button>
                <button
                  type="button"
                  className="gb-window-tool-btn is-close"
                  title="关闭"
                  onClick={() => setShowComposer(false)}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Composer Content Body */}
            <div className="gb-composer-body">
              <div className="gb-publish-modes" aria-label="发表类型">
                <button aria-pressed={determinedType === 'gesture'} onClick={() => setComposerType('gesture')}>Gesture 讨论</button>
                <button aria-pressed={determinedType === 'boost'} onClick={() => setComposerType('boost')}>Boost 短评</button>
              </div>
              {determinedType === 'boost' ? <input className="gb-modal-title-input" aria-label="广场 Boost" value={boostDraft} onChange={e => setBoostDraft(e.target.value)} /> : <>
              {/* Title Input */}
              <div className="gb-modal-row">
                <input
                  type="text"
                  value={composerTitle}
                  onChange={(e) => setComposerTitle(e.target.value)}
                  placeholder="标题（可选）"
                  maxLength={100}
                  className="gb-modal-title-input"
                />
              </div>

              {/* Partition Selection & Multi-Tag Row */}
              <div className="gb-composer-meta-row">
                {/* Partition (Compact: 1 partition at most, does not take excessive room) */}
                <div className="gb-composer-channel-picker-wrap" ref={composerChannelDropdownRef}>
                  <label className="gb-composer-field-label">分区：</label>
                  <div className="gb-composer-channel-dropdown-box">
                    <button
                      type="button"
                      className="gb-composer-channel-trigger"
                      onClick={() => setShowComposerChannelDropdown((prev) => !prev)}
                      aria-haspopup="listbox"
                      aria-expanded={showComposerChannelDropdown}
                      title={`当前选择分区: ${currentComposerDimObj.label}`}
                    >
                      <span className="gb-composer-ch-icon">{currentComposerDimObj.icon}</span>
                      <span className="gb-composer-ch-name">{currentComposerDimObj.label}</span>
                      <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${showComposerChannelDropdown ? 'rotate-180' : ''}`} />
                    </button>

                    {showComposerChannelDropdown && (
                      <div className="gb-composer-channel-dropdown-menu" role="listbox">
                        {CHANNELS.map((ch) => {
                          const isSelected =
                            composerDimension === ch.id ||
                            (composerDimension === 'all' && ch.id === 'all');
                          return (
                            <button
                              key={ch.id}
                              type="button"
                              className={`gb-composer-channel-option ${isSelected ? 'is-selected' : ''}`}
                              onClick={() => {
                                setComposerDimension(ch.id);
                                setShowComposerChannelDropdown(false);
                              }}
                              role="option"
                              aria-selected={isSelected}
                            >
                              <span className="gb-ch-opt-icon">{ch.icon}</span>
                              <div className="gb-ch-opt-text">
                                <span className="gb-ch-opt-name">{ch.label}</span>
                                <span className="gb-ch-opt-desc">{ch.desc}</span>
                              </div>
                              {isSelected && <span className="gb-ch-opt-check">✓</span>}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {/* Multi-Tag Input (Flexible space, up to 5 tags, max 20 chars per tag) */}
                <div className="gb-composer-tag-picker-wrap">
                  <label className="gb-composer-field-label">标签：</label>
                  <div className="gb-composer-tags-container">
                    {composerTagsList.map((tag) => (
                      <span key={tag} className="gb-composer-tag-chip">
                        <span className="gb-tag-hash">#</span>
                        <span className="gb-tag-name">{tag}</span>
                        <button
                          type="button"
                          className="gb-tag-chip-remove"
                          title={`移除标签 #${tag}`}
                          aria-label={`移除标签 #${tag}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveTag(tag);
                          }}
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}

                    {composerTagsList.length < 5 ? (
                      <div className="gb-tag-inline-input-box">
                        <input
                          type="text"
                          value={composerTagInput}
                          onChange={(e) => setComposerTagInput(e.target.value.replace(/[\s,，]+/g, ''))}
                          onKeyDown={handleTagKeyDown}
                          onBlur={() => {
                            if (composerTagInput.trim()) {
                              handleAddTag(composerTagInput);
                            }
                          }}
                          placeholder={
                            composerTagsList.length === 0
                              ? '#添加标签...'
                              : '#添加...'
                          }
                          maxLength={20}
                          className="gb-composer-tag-input"
                        />
                      </div>
                    ) : (
                      <span className="gb-tag-max-hint" title="已达 5 个标签上限">
                        已满(5/5)
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Toolbar */}
              <div className="gb-md-toolbar">
                <button
                  type="button"
                  title="粗体"
                  onClick={() =>
                    insertMarkdownHelper(gestureTextareaRef, setComposerText, '**', '**')
                  }
                >
                  <Bold className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  title="斜体"
                  onClick={() =>
                    insertMarkdownHelper(gestureTextareaRef, setComposerText, '*', '*')
                  }
                >
                  <Italic className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  title="代码块"
                  onClick={() =>
                    insertMarkdownHelper(gestureTextareaRef, setComposerText, '\n```\n', '\n```\n')
                  }
                >
                  <Code className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  title="引用"
                  onClick={() =>
                    insertMarkdownHelper(gestureTextareaRef, setComposerText, '\n> ', '\n')
                  }
                >
                  <Quote className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  title="列表"
                  onClick={() =>
                    insertMarkdownHelper(gestureTextareaRef, setComposerText, '\n- ', '\n')
                  }
                >
                  <List className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  title="超链接"
                  onClick={() =>
                    insertMarkdownHelper(gestureTextareaRef, setComposerText, '[说明](', ')')
                  }
                >
                  <LinkIcon className="w-4 h-4" />
                </button>

                <div className="gb-toolbar-divider"></div>

                <button
                  type="button"
                  title="插入表情"
                  ref={emojiButton} onClick={() => setComposerShowEmoji((prev) => !prev)}
                >
                  <Smile className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  title="上传图片"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <ImageIcon className="w-4 h-4" />
                </button>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={(e) =>
                    handleImageFileChange(e, setComposerUploading, setComposerImages)
                  }
                />

                <div className="gb-tab-switch ml-auto">
                  <button
                    type="button"
                    className={`gb-tab-btn ${composerPreviewTab === 'write' ? 'is-active' : ''}`}
                    onClick={() => setComposerPreviewTab('write')}
                  >
                    编辑
                  </button>
                  <button
                    type="button"
                    className={`gb-tab-btn ${composerPreviewTab === 'preview' ? 'is-active' : ''}`}
                    onClick={() => setComposerPreviewTab('preview')}
                  >
                    实时预览
                  </button>
                </div>
              </div>

              {/* Emoji Popover */}
              {composerShowEmoji && (
                <GesturePopover anchor={emojiButton} label="贴文表情" onClose={() => setComposerShowEmoji(false)}><div>
                  {EMOJI_GROUPS.map((group, idx) => (
                    <div key={idx} className="gb-emoji-group">
                      <span className="gb-emoji-group__title">{group.name}</span>
                      <div className="gb-emoji-grid">
                        {group.emojis.map((em) => (
                          <button
                            key={em}
                            type="button"
                            className="gb-emoji-btn"
                            onClick={() => {
                              insertMarkdownHelper(gestureTextareaRef, setComposerText, em);
                              setComposerShowEmoji(false);
                            }}
                          >
                            {em}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div></GesturePopover>
              )}

              {/* Textarea or Preview */}
              {composerPreviewTab === 'write' ? (
                <textarea
                  ref={gestureTextareaRef}
                  rows={isComposerMaximized ? 12 : 5}
                  value={composerText}
                  onChange={(e) => setComposerText(e.target.value)}
                  placeholder="说点什么..."
                  className="gb-textarea is-modal-textarea"
                />
              ) : (
                <div className="gb-preview-box is-modal-preview">
                  {composerText.trim() ? (
                    <div
                      className="gb-markdown-body"
                      dangerouslySetInnerHTML={{
                        __html: renderGestureMarkdown(composerText),
                      }}
                    />
                  ) : (
                    <span className="text-slate-400 text-xs">暂无预览内容</span>
                  )}
                </div>
              )}

              {/* Attached Images */}
              {composerImages.length > 0 && (
                <div className="gb-attached-images">
                  {composerImages.map((src, idx) => (
                    <div key={idx} className="gb-thumb-wrap">
                      <img src={src} alt="Attached" className="gb-thumb" />
                      <button
                        type="button"
                        className="gb-thumb-del"
                        onClick={() =>
                          setComposerImages((prev) => prev.filter((_, i) => i !== idx))
                        }
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              </>}
              {/* Error Alert */}
              {composerError && (
                <div className="gb-error-alert">
                  <AlertCircle className="w-4 h-4 mr-1 text-rose-500" />
                  <span>{composerError}</span>
                </div>
              )}

              {/* Footer */}
              <div className="gb-modal-foot">
                <span
                  className="gb-word-count"
                >
                  {composerWordResult}
                </span>
                <div className="gb-modal-actions">
                  <button
                    type="button"
                    className="gb-cancel-btn"
                    onClick={() => setShowComposer(false)}
                  >
                    取消
                  </button>

                  <button
                    type="button"
                    disabled={composerSubmitting || !trimmedComposerText || (determinedType === 'boost' && !validBoost(boostDraft))}
                    onClick={handleComposerSubmit}
                    className="gb-submit-btn"
                  >
                    <Send className="w-3.5 h-3.5 mr-1" />
                    <span>{composerSubmitting ? '发布中...' : '发布'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )
      )}
    </div>
  );
}

export default GuestbookBoard;
