import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  Rocket,
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
  Share2,
  Trash2,
  Pencil,
  X,
  ChevronDown,
  ChevronUp,
  Tag,
  AlertCircle,
  Pin,
  CheckCircle2,
  Bookmark,
  BookmarkCheck,
  Eye,
  Layers,
  Star,
  ArrowLeft,
  ChevronRight,
  TrendingUp,
  User,
  SlidersHorizontal,
} from 'lucide-react';
import {
  fetchComments,
  createComment,
  editComment,
  deleteComment,
  likeComment,
  readCommentIdentity,
  getCommentInitials,
  uploadCommentImage,
  type BlogComment,
  type CommentIdentity,
} from '../../lib/comment-client';
import { renderCommentMarkdown } from '../../lib/comment-markdown';
import { computeUserLevel } from '../../lib/user-level';

// Board topic channels configuration (维度)
export const CHANNELS = [
  { id: 'all', label: '全部维度', icon: '🌟', desc: '全站所有主题与维度' },
  { id: 'chat', label: '畅所欲言', icon: '💬', desc: '自由闲聊、日常问候与生活点滴' },
  { id: 'tech', label: '技术探讨', icon: '🛠️', desc: '前端工程、边缘计算、AI与架构心得' },
  { id: 'ideas', label: '灵感交流', icon: '💡', desc: '设计思考、新颖想法与作品探讨' },
  { id: 'life', label: '生活碎碎念', icon: '☕', desc: '阅读留痕、咖啡时光与随感随笔' },
  { id: 'feedback', label: '站点建议', icon: '📮', desc: '功能建议、体验反馈与缺陷报告' },
] as const;

export type ChannelId = (typeof CHANNELS)[number]['id'];

// Horizontal Category tabs
export const CATEGORIES = [
  { id: 'latest', label: '最新', icon: Clock },
  { id: 'recent', label: '近期', icon: TrendingUp },
  { id: 'dimension', label: '维度', icon: Layers, isDropdown: true },
  { id: 'hot', label: '热门', icon: Flame },
  { id: 'featured', label: '精选', icon: Star },
  { id: 'my', label: '我的贴文', icon: User },
  { id: 'read', label: '已读', icon: Eye },
  { id: 'bookmarked', label: '书签', icon: Bookmark },
] as const;

export type CategoryId = (typeof CATEGORIES)[number]['id'];

// Curated Emojis Palette
const EMOJI_GROUPS = [
  {
    name: '常用表情',
    emojis: ['😀', '😃', '😄', '😆', '😅', '😂', '🤣', '😊', '🥹', '😍', '🥰', '😋', '🤔', '🤫', '🤗', '🫡', '🥳', '😎'],
  },
  {
    name: '交互手势',
    emojis: ['👍', '👎', '👏', '🙌', '🫶', '🤝', '✌️', '🤞', '🤟', '🤘', '👌', '🤌', '👈', '👉', '👆', '👇', '✍️', '🙏'],
  },
  {
    name: '氛围灵感',
    emojis: ['🔥', '✨', '🌟', '💡', '🚀', '☕', '🎉', '💯', '💖', '❤️', '🧡', '💛', '💚', '💙', '💜', '💎', '🌈', '⚡'],
  },
  {
    name: '符号徽章',
    emojis: ['💻', '🛠️', '📦', '🎨', '📝', '📌', '🔍', '🛡️', '🌐', '💬', '💭', '☕', '🌱', '🕊️', '🎯', '🪐', '🪄', '⭐'],
  },
];

// Quick stamps for boost mode
const QUICK_BOOST_STAMPS = [
  { icon: '🎉', text: '🎉 祝博主博客长青，内容常新！' },
  { icon: '☕', text: '☕ 路过点赞，敬作者一杯热咖啡！' },
  { icon: '🚀', text: '🚀 界面设计与交互太丝滑了，灵感爆发！' },
  { icon: '🌟', text: '🌟 2026 探访留念，数字花园漫游打卡！' },
  { icon: '💡', text: '💡 想就本站系统架构交流探讨一番~' },
  { icon: '🌱', text: '🌱 友邻探访，愿我们的独立博客一同生长！' },
];

// Official Pinned Welcome Thread (Anchor)
const OFFICIAL_PINNED_POST: BlogComment = {
  id: 'pinned_welcome_official',
  postSlug: 'guestbook',
  parentId: null,
  postType: 'gesture',
  tag: 'tech',
  authorId: 'admin',
  authorName: 'shijianus',
  authorAvatar: '/media/shijianus/avatar.jpg',
  authorRole: 'admin',
  authorWebsite: 'https://blog.epocanvas.com',
  message: `### 🌟 欢迎来到全站交流广场！

这里是为所有读者与探索者打造的开放交流空间。你可以在这里探讨工程架构、交流设计灵感，或是分享日常随笔。

#### 💡 如何参与交流？
- **📝 gesture**：字数在 8 字以上，支持完整 Markdown 图文排版、代码块、引用与多级跟帖回复；
- **🚀 boost**：字数限制在 30 字以内，主要在顶层弹幕墙流动展示，轻触即发，支持直接跟帖回复在 gesture 楼下；
- **🏷️ 六大主题维度**：涵盖畅所欲言、技术探讨、灵感交流、生活碎碎念与站点建议，方便按需归类。

欢迎在下方点击 **「💬 回复」** 或 **「🚀 boost」** 留下你的第一条声音！✨`,
  likesCount: 6,
  reactions: {
    summary: { '👍': 4, '🚀': 2, '✨': 3, '❤️': 2 },
    users: {},
  },
  status: 'pinned',
  createdAt: '2026-10-31T00:00:00.000Z',
  showLocation: true,
  ipCountryFlag: '🇨🇳',
  ipCountryName: '中国',
  ipLocation: '浙江 · 杭州',
};

// Storage Keys
const READ_GESTURES_KEY = 'shijianus_read_gestures';
const BOOKMARK_GESTURES_KEY = 'shijianus_bookmarked_gestures';

// Title extraction helper for gesture topic rows
function extractGestureTitle(markdownText: string): { title: string; preview: string } {
  if (!markdownText) return { title: '未命名 gesture', preview: '' };
  const lines = markdownText.split('\n').map((l) => l.trim()).filter(Boolean);
  if (lines.length === 0) return { title: '未命名 gesture', preview: '' };

  let title = '';
  let preview = '';

  for (let i = 0; i < lines.length; i++) {
    const cleanLine = lines[i].replace(/^[#>\s*_-]+/, '').replace(/\[(.*?)\]\(.*?\)/g, '$1').trim();
    if (!cleanLine) continue;
    if (!title) {
      title = cleanLine;
    } else if (!preview) {
      preview = cleanLine;
      break;
    }
  }

  if (title.length > 55) {
    title = title.slice(0, 52) + '...';
  }
  if (preview.length > 85) {
    preview = preview.slice(0, 82) + '...';
  }

  return { title: title || 'gesture 讨论', preview };
}

export function GuestbookBoard() {
  // Core data state
  const [comments, setComments] = useState<BlogComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Navigation & Category state
  const [activeCategory, setActiveCategory] = useState<string>('latest');
  const [selectedDimension, setSelectedDimension] = useState<string>('all');
  const [showDimensionPicker, setShowDimensionPicker] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Active gesture detail view (LinuxDo style)
  const [activeGestureId, setActiveGestureId] = useState<string | null>(null);
  const [activeFloor, setActiveFloor] = useState<number>(1);

  // Read & Bookmark tracking
  const [readIds, setReadIds] = useState<string[]>([]);
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>([]);

  // Top boost panel state
  const [quickBoostText, setQuickBoostText] = useState('');
  const [quickBoostSubmitting, setQuickBoostSubmitting] = useState(false);
  const [boostsPaused, setBoostsPaused] = useState(false);
  const [showBoostEmoji, setShowBoostEmoji] = useState(false);

  // Top-level gesture creation modal
  const [showGestureModal, setShowGestureModal] = useState(false);
  const [newGestureChannel, setNewGestureChannel] = useState<string>('chat');
  const [newGestureMessage, setNewGestureMessage] = useState('');
  const [newGesturePreview, setNewGesturePreview] = useState<'write' | 'preview'>('write');
  const [newGestureImages, setNewGestureImages] = useState<string[]>([]);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [showNewGestureEmoji, setShowNewGestureEmoji] = useState(false);
  const [gestureSubmitting, setGestureSubmitting] = useState(false);
  const [gestureComposerError, setGestureComposerError] = useState<string | null>(null);

  // Detail view reply composer
  const [detailReplyMode, setDetailReplyMode] = useState<'gesture' | 'boost'>('gesture');
  const [detailReplyMessage, setDetailReplyMessage] = useState('');
  const [detailReplySubmitting, setDetailReplySubmitting] = useState(false);
  const [detailReplyShowEmoji, setDetailReplyShowEmoji] = useState(false);
  const [detailReplyError, setDetailReplyError] = useState<string | null>(null);

  // User identity
  const [identity, setIdentity] = useState<CommentIdentity | null>(null);
  const [authorName, setAuthorName] = useState('');
  const [authorAvatar, setAuthorAvatar] = useState('');
  const [authorWebsite, setAuthorWebsite] = useState('');
  const [authorEmail, setAuthorEmail] = useState('');
  const [showIdentityEdit, setShowIdentityEdit] = useState(false);

  // Lightbox zoom
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);

  // Refs
  const newGestureTextareaRef = useRef<HTMLTextAreaElement>(null);
  const newGestureFileInputRef = useRef<HTMLInputElement>(null);
  const detailReplyTextareaRef = useRef<HTMLTextAreaElement>(null);
  const scrubberTrackRef = useRef<HTMLDivElement>(null);
  const floorElementsRef = useRef<Map<number, HTMLElement>>(new Map());

  // Show Toast
  const showToast = (msg: string) => setToastMessage(msg);

  // Auto-dismiss Toast
  useEffect(() => {
    if (!toastMessage) return;
    const t = setTimeout(() => setToastMessage(null), 3500);
    return () => clearTimeout(t);
  }, [toastMessage]);

  // Load identity and persistent read/bookmark lists
  useEffect(() => {
    const id = readCommentIdentity();
    setIdentity(id);
    if (id) {
      setAuthorName(id.name || '');
      setAuthorAvatar(id.avatar || '');
      setAuthorWebsite(id.website || '');
      setAuthorEmail(id.email || '');
    } else {
      setAuthorName('访客');
    }

    try {
      const readRaw = localStorage.getItem(READ_GESTURES_KEY);
      if (readRaw) setReadIds(JSON.parse(readRaw));
      const bmRaw = localStorage.getItem(BOOKMARK_GESTURES_KEY);
      if (bmRaw) setBookmarkedIds(JSON.parse(bmRaw));
    } catch {}
  }, []);

  // Sync active gesture with URL hash on mount / hash change
  useEffect(() => {
    const syncFromHash = () => {
      const hash = window.location.hash;
      if (hash.startsWith('#gesture-')) {
        const id = hash.replace('#gesture-', '').trim();
        if (id) {
          setActiveGestureId(id);
          markAsRead(id);
        }
      } else if (!hash || hash === '#') {
        setActiveGestureId(null);
      }
    };

    syncFromHash();
    window.addEventListener('hashchange', syncFromHash);
    return () => window.removeEventListener('hashchange', syncFromHash);
  }, []);

  // Load comments
  const loadComments = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchComments('guestbook', 'new');
      setComments(data);
    } catch (err) {
      console.error('Failed to load comments:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadComments();
  }, [loadComments]);

  // Combine DB comments with pinned anchor
  const allCommentsWithPinned = useMemo(() => {
    const hasPinned = comments.some((c) => c.id === OFFICIAL_PINNED_POST.id);
    if (!hasPinned) {
      return [OFFICIAL_PINNED_POST, ...comments];
    }
    return comments;
  }, [comments]);

  // Separate comments into:
  // 1. Top-level boosts (for the top boost panel)
  // 2. Top-level gestures (for the LinuxDo topic list)
  // 3. Replies map (keyed by parentId, can contain gesture or boost replies)
  const { topLevelBoosts, topLevelGestures, repliesByParent } = useMemo(() => {
    const boosts: BlogComment[] = [];
    const gestures: BlogComment[] = [];
    const rep: Record<string, BlogComment[]> = {};

    for (const c of allCommentsWithPinned) {
      if (c.parentId) {
        if (!rep[c.parentId]) rep[c.parentId] = [];
        rep[c.parentId].push(c);
      } else if (c.postType === 'boost') {
        boosts.push(c);
      } else {
        // gesture or legacy comment
        gestures.push(c);
      }
    }

    return { topLevelBoosts: boosts, topLevelGestures: gestures, repliesByParent: rep };
  }, [allCommentsWithPinned]);

  // Read tracker
  const markAsRead = (id: string) => {
    setReadIds((prev) => {
      if (prev.includes(id)) return prev;
      const next = [...prev, id];
      try {
        localStorage.setItem(READ_GESTURES_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  // Bookmark toggle
  const toggleBookmark = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setBookmarkedIds((prev) => {
      const exists = prev.includes(id);
      const next = exists ? prev.filter((x) => x !== id) : [...prev, id];
      try {
        localStorage.setItem(BOOKMARK_GESTURES_KEY, JSON.stringify(next));
      } catch {}
      showToast(exists ? '已从书签移除' : '⭐ 已加入书签！');
      return next;
    });
  };

  // Open / Close Gesture Detail View
  const openGesture = (id: string) => {
    setActiveGestureId(id);
    markAsRead(id);
    window.location.hash = `gesture-${id}`;
    window.scrollTo({ top: 120, behavior: 'smooth' });
  };

  const closeGesture = () => {
    setActiveGestureId(null);
    window.location.hash = '';
    window.scrollTo({ top: 120, behavior: 'smooth' });
  };

  // Active gesture item for detail view
  const currentGesture = useMemo(() => {
    if (!activeGestureId) return null;
    return allCommentsWithPinned.find((c) => c.id === activeGestureId) || null;
  }, [activeGestureId, allCommentsWithPinned]);

  // Floors for active gesture: Floor #1 is OP, Floors #2..N are chronological replies
  const currentFloors = useMemo(() => {
    if (!currentGesture) return [];
    const directReplies = repliesByParent[currentGesture.id] || [];
    // Sort replies chronologically
    const sortedReplies = [...directReplies].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
    return [currentGesture, ...sortedReplies];
  }, [currentGesture, repliesByParent]);

  // Filter gestures list by category and search
  const filteredGestures = useMemo(() => {
    let list = [...topLevelGestures];

    // Category filtering
    switch (activeCategory) {
      case 'latest':
        list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
      case 'recent': {
        const sevenDaysAgo = Date.now() - 7 * 86400 * 1000;
        list = list.filter((c) => {
          const t = new Date(c.updatedAt || c.createdAt).getTime();
          return t >= sevenDaysAgo || c.status === 'pinned';
        });
        list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
      }
      case 'dimension':
        if (selectedDimension !== 'all') {
          list = list.filter((c) => (c.tag || 'chat') === selectedDimension || c.status === 'pinned');
        }
        break;
      case 'hot':
        list.sort((a, b) => {
          const aScore = (a.likesCount || 0) + (repliesByParent[a.id]?.length || 0) * 2;
          const bScore = (b.likesCount || 0) + (repliesByParent[b.id]?.length || 0) * 2;
          return bScore - aScore;
        });
        break;
      case 'featured':
        list = list.filter((c) => c.status === 'pinned' || c.authorRole === 'admin' || (c.likesCount || 0) >= 3);
        break;
      case 'my':
        list = list.filter((c) => {
          if (!identity?.id) return false;
          return c.authorId === identity.id || c.authorId === identity.token;
        });
        break;
      case 'read':
        list = list.filter((c) => readIds.includes(c.id));
        break;
      case 'bookmarked':
        list = list.filter((c) => bookmarkedIds.includes(c.id));
        break;
      default:
        break;
    }

    // Keyword search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((c) => {
        const textMatch = (c.message || '').toLowerCase().includes(q);
        const authorMatch = (c.authorName || '').toLowerCase().includes(q);
        const tagMatch = (c.tag || '').toLowerCase().includes(q);
        return textMatch || authorMatch || tagMatch;
      });
    }

    return list;
  }, [topLevelGestures, activeCategory, selectedDimension, searchQuery, readIds, bookmarkedIds, identity, repliesByParent]);

  // Observer for LinuxDo Floor Scrubber
  useEffect(() => {
    if (!activeGestureId || currentFloors.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const floorNum = Number(entry.target.getAttribute('data-floor'));
            if (floorNum) {
              setActiveFloor(floorNum);
            }
          }
        }
      },
      { threshold: 0.35, rootMargin: '-10% 0px -40% 0px' }
    );

    floorElementsRef.current.forEach((el) => {
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [activeGestureId, currentFloors]);

  // Scroll to specific floor
  const scrollToFloor = (floorNum: number) => {
    const el = floorElementsRef.current.get(floorNum);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setActiveFloor(floorNum);
    }
  };

  // Submit Quick Boost in top panel
  const handleQuickBoostSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = quickBoostText.trim();
    if (!trimmed) {
      showToast('请输入 boost 内容');
      return;
    }
    if (trimmed.length > 30) {
      showToast(`boost 不能超过 30 个字 (当前 ${trimmed.length} 字)`);
      return;
    }

    setQuickBoostSubmitting(true);
    try {
      const activeIdentity: CommentIdentity = identity || {
        id: `vis_${Date.now()}`,
        name: authorName.trim() || '访客',
        email: authorEmail.trim(),
        website: authorWebsite.trim(),
        avatar: authorAvatar.trim(),
        role: 'visitor',
      };

      const res = await createComment({
        slug: 'guestbook',
        message: trimmed,
        postType: 'boost',
        tag: 'chat',
        author: activeIdentity,
        sessionToken: identity?.token,
      });

      if (res.ok && res.comment) {
        setQuickBoostText('');
        showToast('🚀 boost 发射成功！');
        await loadComments();
      } else {
        showToast(res.error || '发射失败，请重试');
      }
    } catch (err: any) {
      showToast(err.message || '网络异常，发射失败');
    } finally {
      setQuickBoostSubmitting(false);
    }
  };

  // Submit Detail Reply (under gesture - supports both gesture reply and boost reply!)
  const handleDetailReplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeGestureId) return;

    const trimmed = detailReplyMessage.trim();
    if (!trimmed) {
      setDetailReplyError('请输入回复内容');
      return;
    }

    if (detailReplyMode === 'boost' && trimmed.length > 30) {
      setDetailReplyError(`boost 回复不能超过 30 个字 (当前 ${trimmed.length} 字)`);
      return;
    }
    if (detailReplyMode === 'gesture' && trimmed.length < 4) {
      setDetailReplyError(`gesture 回复至少需要 4 个字 (当前 ${trimmed.length} 字)`);
      return;
    }

    setDetailReplySubmitting(true);
    setDetailReplyError(null);
    try {
      const activeIdentity: CommentIdentity = identity || {
        id: `vis_${Date.now()}`,
        name: authorName.trim() || '访客',
        email: authorEmail.trim(),
        website: authorWebsite.trim(),
        avatar: authorAvatar.trim(),
        role: 'visitor',
      };

      const res = await createComment({
        slug: 'guestbook',
        parentId: activeGestureId,
        message: trimmed,
        postType: detailReplyMode,
        tag: currentGesture?.tag || 'chat',
        author: activeIdentity,
        sessionToken: identity?.token,
      });

      if (res.ok && res.comment) {
        setDetailReplyMessage('');
        showToast(detailReplyMode === 'boost' ? '🚀 boost 回复贴楼成功！' : '💬 gesture 回复发布成功！');
        await loadComments();
        // Scroll to the newly added bottom floor
        setTimeout(() => {
          scrollToFloor(currentFloors.length + 1);
        }, 500);
      } else {
        setDetailReplyError(res.error || '回复提交失败');
      }
    } catch (err: any) {
      setDetailReplyError(err.message || '网络异常，提交失败');
    } finally {
      setDetailReplySubmitting(false);
    }
  };

  // Submit New Top-Level Gesture
  const handleCreateGestureSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newGestureMessage.trim();
    if (!trimmed) {
      setGestureComposerError('请输入 gesture 内容');
      return;
    }
    if (trimmed.length < 8) {
      setGestureComposerError(`gesture 至少需要 8 个字 (当前 ${trimmed.length} 字)`);
      return;
    }

    setGestureSubmitting(true);
    setGestureComposerError(null);
    try {
      const activeIdentity: CommentIdentity = identity || {
        id: `vis_${Date.now()}`,
        name: authorName.trim() || '访客',
        email: authorEmail.trim(),
        website: authorWebsite.trim(),
        avatar: authorAvatar.trim(),
        role: 'visitor',
      };

      const res = await createComment({
        slug: 'guestbook',
        message: trimmed,
        postType: 'gesture',
        tag: newGestureChannel,
        author: activeIdentity,
        sessionToken: identity?.token,
      });

      if (res.ok && res.comment) {
        setNewGestureMessage('');
        setNewGestureImages([]);
        setShowGestureModal(false);
        showToast('📝 gesture 发布成功！');
        await loadComments();
        openGesture(res.comment.id);
      } else {
        setGestureComposerError(res.error || '发布失败，请重试');
      }
    } catch (err: any) {
      setGestureComposerError(err.message || '网络异常，发布失败');
    } finally {
      setGestureSubmitting(false);
    }
  };

  // Like / React
  const handleReaction = async (commentId: string, emoji: string) => {
    try {
      const activeIdentity = identity || {
        id: `vis_${Date.now()}`,
        name: authorName.trim() || '访客',
        role: 'visitor' as const,
      };
      const res = await likeComment(commentId, activeIdentity, emoji);
      if (res.ok && res.comment) {
        setComments((prev) => prev.map((c) => (c.id === commentId ? { ...c, ...res.comment } : c)));
      }
    } catch (err) {
      console.error('Reaction failed:', err);
    }
  };

  // Image Upload handler for new gesture modal
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingImage(true);
    setGestureComposerError(null);
    try {
      const res = await uploadCommentImage(file);
      if (res.ok && res.url) {
        setNewGestureImages((prev) => [...prev, res.url!]);
        setNewGestureMessage((prev) => {
          const append = `\n\n![图片](${res.url})\n\n`;
          return prev ? prev + append : `![图片](${res.url})`;
        });
        showToast('图片上传成功！已插入内容');
      } else {
        setGestureComposerError(res.error || '图片上传失败');
      }
    } catch (err: any) {
      setGestureComposerError(err.message || '图片上传遇到问题');
    } finally {
      setIsUploadingImage(false);
      if (newGestureFileInputRef.current) newGestureFileInputRef.current.value = '';
    }
  };

  // Insert markdown tag in gesture composer
  const insertMarkdown = (prefix: string, suffix = '') => {
    const textarea = newGestureTextareaRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = textarea.value.substring(start, end);
    const replacement = `${prefix}${selected || '文字'}${suffix}`;
    const nextVal = textarea.value.substring(0, start) + replacement + textarea.value.substring(end);
    setNewGestureMessage(nextVal);
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, start + prefix.length + (selected ? selected.length : 2));
    }, 10);
  };

  // Format relative time
  const formatTime = (isoString: string) => {
    try {
      const d = new Date(isoString);
      const now = new Date();
      const diffSec = Math.floor((now.getTime() - d.getTime()) / 1000);
      if (diffSec < 60) return '刚刚';
      if (diffSec < 3600) return `${Math.floor(diffSec / 60)} 分钟前`;
      if (diffSec < 86400) return `${Math.floor(diffSec / 3600)} 小时前`;
      if (diffSec < 2592000) return `${Math.floor(diffSec / 86400)} 天前`;
      return d.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
    } catch {
      return '日前';
    }
  };

  // Share link
  const handleShare = (gestureId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const url = `${window.location.origin}/guestbook/#gesture-${gestureId}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url).then(() => {
        showToast('🔗 直达链接已复制到剪贴板！');
      });
    }
  };

  // Fallback boosts if empty
  const displayBoosts = topLevelBoosts.length > 0 ? topLevelBoosts : [
    {
      id: 'mock_boost_1',
      postSlug: 'guestbook',
      postType: 'boost' as const,
      authorId: 'system',
      authorName: '社区微光',
      authorRole: 'visitor' as const,
      message: '🌟 欢迎来到博客交流广场，发射第一条 boost 吧！',
      likesCount: 5,
      createdAt: new Date().toISOString(),
      showLocation: false,
    },
    {
      id: 'mock_boost_2',
      postSlug: 'guestbook',
      postType: 'boost' as const,
      authorId: 'admin',
      authorName: 'shijianus',
      authorRole: 'admin' as const,
      message: '☕ 全新 LinuxDo 格式上线，畅快交流！',
      likesCount: 8,
      createdAt: new Date().toISOString(),
      showLocation: false,
    },
    {
      id: 'mock_boost_3',
      postSlug: 'guestbook',
      postType: 'boost' as const,
      authorId: 'visitor',
      authorName: '探索者',
      authorRole: 'visitor' as const,
      message: '🚀 弹幕式 boost 浮动，体验格外轻盈~',
      likesCount: 3,
      createdAt: new Date().toISOString(),
      showLocation: false,
    },
  ];

  return (
    <div className="guestbook-board-container">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="gb-toast" role="status">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Image Lightbox Modal */}
      {zoomedImage && (
        <div className="gb-lightbox" onClick={() => setZoomedImage(null)}>
          <button className="gb-lightbox__close" onClick={() => setZoomedImage(null)}>
            <X className="w-6 h-6" />
          </button>
          <img src={zoomedImage} alt="Zoomed view" className="gb-lightbox__img" />
        </div>
      )}

      {/* ========================================================
          1. TOP PANEL: boost 弹幕墙 (Boost Wall / Marquee Stream)
          (Completely replaces class="gb-hero"!)
          ======================================================== */}
      <section className="gb-boost-panel" aria-label="boost 弹幕墙">
        {/* Boost Header */}
        <div className="gb-boost-panel__header">
          <div className="gb-boost-panel__title-box">
            <span className="gb-boost-live-badge">
              <span className="gb-pulse-dot is-boost"></span>
              <Rocket className="w-3.5 h-3.5 mr-1 text-purple-400 inline" />
              <span>boost</span>
            </span>
            <span className="gb-boost-panel__tagline">顶层弹幕微语流 · 轻触即发表态</span>
          </div>

          <div className="gb-boost-panel__actions">
            <button
              type="button"
              className={`gb-boost-action-toggle ${boostsPaused ? 'is-active' : ''}`}
              onClick={() => setBoostsPaused((p) => !p)}
              title={boostsPaused ? '恢复滚动' : '暂停流动'}
            >
              {boostsPaused ? '▶ 恢复流动' : '⏸ 暂停流动'}
            </button>
            <span className="gb-boost-counter">{topLevelBoosts.length} 条 boost</span>
          </div>
        </div>

        {/* Floating Boosts Barrage Rails (弹幕流动轨道) */}
        <div
          className={`gb-boost-barrage-wrapper ${boostsPaused ? 'is-paused' : ''}`}
          onMouseEnter={() => setBoostsPaused(true)}
          onMouseLeave={() => setBoostsPaused(false)}
        >
          {/* Row 1 */}
          <div className="gb-boost-rail is-row-1">
            <div className="gb-boost-track">
              {displayBoosts.concat(displayBoosts).map((b, i) => (
                <div key={`r1-${b.id}-${i}`} className="gb-boost-chip">
                  <div className="gb-boost-chip__avatar">
                    {b.authorAvatar ? (
                      <img src={b.authorAvatar} alt={b.authorName} />
                    ) : (
                      <span>{getCommentInitials(b.authorName)}</span>
                    )}
                  </div>
                  <div className="gb-boost-chip__content">
                    <div className="gb-boost-chip__meta">
                      <span className="gb-boost-chip__author">{b.authorName}</span>
                      <span className="gb-boost-chip__time">{formatTime(b.createdAt)}</span>
                    </div>
                    <p className="gb-boost-chip__text">{b.message}</p>
                  </div>
                  <button
                    type="button"
                    className="gb-boost-chip__react-btn"
                    onClick={() => handleReaction(b.id, '❤️')}
                    title="点赞"
                  >
                    <span>❤️</span>
                    <span>{b.likesCount || 0}</span>
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Row 2 (Staggered Flow) */}
          <div className="gb-boost-rail is-row-2">
            <div className="gb-boost-track is-reverse">
              {displayBoosts
                .slice()
                .reverse()
                .concat(displayBoosts)
                .map((b, i) => (
                  <div key={`r2-${b.id}-${i}`} className="gb-boost-chip">
                    <div className="gb-boost-chip__avatar">
                      {b.authorAvatar ? (
                        <img src={b.authorAvatar} alt={b.authorName} />
                      ) : (
                        <span>{getCommentInitials(b.authorName)}</span>
                      )}
                    </div>
                    <div className="gb-boost-chip__content">
                      <div className="gb-boost-chip__meta">
                        <span className="gb-boost-chip__author">{b.authorName}</span>
                        <span className="gb-boost-chip__time">{formatTime(b.createdAt)}</span>
                      </div>
                      <p className="gb-boost-chip__text">{b.message}</p>
                    </div>
                    <button
                      type="button"
                      className="gb-boost-chip__react-btn"
                      onClick={() => handleReaction(b.id, '🚀')}
                      title="助推"
                    >
                      <span>🚀</span>
                      <span>{b.likesCount || 0}</span>
                    </button>
                  </div>
                ))}
            </div>
          </div>
        </div>

        {/* Quick Boost Inline Launcher (快速发射栏) */}
        <form onSubmit={handleQuickBoostSubmit} className="gb-quick-boost-bar">
          <div className="gb-quick-boost-input-wrap">
            <Rocket className="w-4 h-4 text-purple-400 gb-quick-boost-icon" />
            <input
              type="text"
              value={quickBoostText}
              onChange={(e) => setQuickBoostText(e.target.value)}
              placeholder="发射一条 boost 弹幕 (30字以内)..."
              maxLength={30}
              className="gb-quick-boost-input"
            />
            <span className="gb-quick-boost-char-count">{quickBoostText.length}/30</span>

            {/* Quick Stamps Popover Button */}
            <div className="gb-quick-stamps-group">
              {QUICK_BOOST_STAMPS.slice(0, 3).map((st, idx) => (
                <button
                  key={idx}
                  type="button"
                  className="gb-quick-stamp-tag"
                  onClick={() => setQuickBoostText(st.text)}
                  title={st.text}
                >
                  <span>{st.icon}</span>
                  <span className="gb-stamp-cut">{st.text.replace(/^[^\s]+\s*/, '').slice(0, 7)}...</span>
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={quickBoostSubmitting || !quickBoostText.trim() || quickBoostText.trim().length > 30}
            className="gb-quick-boost-submit-btn"
          >
            {quickBoostSubmitting ? (
              <span>发射中...</span>
            ) : (
              <>
                <Rocket className="w-4 h-4 mr-1 inline" />
                <span>发射 boost</span>
              </>
            )}
          </button>
        </form>
      </section>

      {/* ========================================================
          2. HORIZONTAL CATEGORY NAVIGATION BAR
          ("最新" "近期" "维度" "热门" "精选" "我的贴文" "已读" "书签")
          ======================================================== */}
      <nav className="gb-category-bar" aria-label="分类导航横排">
        <div className="gb-category-pills-row">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const isActive = activeCategory === cat.id;

            if (cat.id === 'dimension') {
              const activeChannelLabel =
                selectedDimension === 'all'
                  ? '维度'
                  : CHANNELS.find((ch) => ch.id === selectedDimension)?.label || '维度';

              return (
                <div key={cat.id} className="gb-dimension-dropdown-wrapper">
                  <button
                    type="button"
                    className={`gb-category-pill is-dimension ${isActive ? 'is-active' : ''}`}
                    onClick={() => {
                      setActiveCategory('dimension');
                      setShowDimensionPicker((p) => !p);
                    }}
                  >
                    <Icon className="w-4 h-4 mr-1.5" />
                    <span>{activeChannelLabel}</span>
                    <ChevronDown className="w-3.5 h-3.5 ml-1 text-slate-400" />
                  </button>

                  {/* Dropdown for Dimensions */}
                  {showDimensionPicker && (
                    <div className="gb-dimension-popover">
                      {CHANNELS.map((ch) => (
                        <button
                          key={ch.id}
                          type="button"
                          className={`gb-dimension-item ${selectedDimension === ch.id ? 'is-selected' : ''}`}
                          onClick={() => {
                            setSelectedDimension(ch.id);
                            setShowDimensionPicker(false);
                            setActiveCategory('dimension');
                          }}
                        >
                          <span className="mr-2">{ch.icon}</span>
                          <span className="flex-1 text-left font-medium">{ch.label}</span>
                          {selectedDimension === ch.id && <CheckCircle2 className="w-3.5 h-3.5 text-indigo-500 ml-2" />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            }

            return (
              <button
                key={cat.id}
                type="button"
                className={`gb-category-pill ${isActive ? 'is-active' : ''}`}
                onClick={() => {
                  setActiveCategory(cat.id);
                  setShowDimensionPicker(false);
                }}
              >
                <Icon className="w-4 h-4 mr-1.5" />
                <span>{cat.label}</span>
                {cat.id === 'bookmarked' && bookmarkedIds.length > 0 && (
                  <span className="gb-cat-count-badge">{bookmarkedIds.length}</span>
                )}
                {cat.id === 'read' && readIds.length > 0 && (
                  <span className="gb-cat-count-badge is-muted">{readIds.length}</span>
                )}
              </button>
            );
          })}
        </div>

        {/* Right side controls: Search input & + 发起 gesture */}
        <div className="gb-category-right-actions">
          {/* Search Box */}
          <div className="gb-category-search-box">
            <Search className="w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索 gesture 内容..."
              className="gb-category-search-input"
            />
            {searchQuery && (
              <button type="button" onClick={() => setSearchQuery('')} className="gb-search-clear">
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* New Gesture Trigger Button */}
          <button
            type="button"
            className="gb-new-gesture-btn"
            onClick={() => setShowGestureModal(true)}
          >
            <Pencil className="w-3.5 h-3.5 mr-1.5" />
            <span>+ 发起 gesture</span>
          </button>
        </div>
      </nav>

      {/* ========================================================
          3. MAIN GESTURE VIEW
          - IF activeGestureId: LINUXDO TOPIC DETAIL & FLOOR SCRUBBER
          - ELSE: LINUXDO TOPIC LIST TABLE
          ======================================================== */}
      {activeGestureId && currentGesture ? (
        /* ==================== VIEW B: GESTURE DETAIL (LinuxDo 楼层展示) ==================== */
        <section className="gb-gesture-detail-view" aria-label="gesture 楼层详情">
          {/* Detail Header & Return Bar */}
          <div className="gb-detail-top-nav">
            <button type="button" className="gb-back-btn" onClick={closeGesture}>
              <ArrowLeft className="w-4 h-4 mr-1.5" />
              <span>返回 gesture 列表</span>
            </button>

            <div className="gb-detail-topic-header">
              <span className="gb-channel-tag is-badge">
                {CHANNELS.find((ch) => ch.id === currentGesture.tag)?.icon || '💬'}{' '}
                {CHANNELS.find((ch) => ch.id === currentGesture.tag)?.label || '畅所欲言'}
              </span>
              <h1 className="gb-detail-topic-title">
                {extractGestureTitle(currentGesture.message).title}
              </h1>
            </div>

            <div className="gb-detail-top-actions">
              <button
                type="button"
                className={`gb-detail-icon-btn ${bookmarkedIds.includes(currentGesture.id) ? 'is-active' : ''}`}
                onClick={(e) => toggleBookmark(currentGesture.id, e)}
                title="收藏书签"
              >
                <Bookmark className="w-4 h-4" />
              </button>
              <button
                type="button"
                className="gb-detail-icon-btn"
                onClick={(e) => handleShare(currentGesture.id, e)}
                title="分享链接"
              >
                <Share2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* LinuxDo Two-Column Reading Layout */}
          <div className="gb-detail-layout">
            {/* Left Main Column: Floors Stream (各楼层内容) */}
            <div className="gb-floors-stream">
              {currentFloors.map((item, index) => {
                const floorNumber = index + 1;
                const isOp = floorNumber === 1;
                const isBoost = item.postType === 'boost';
                const userLevel = computeUserLevel(item.authorId || item.authorName);

                return (
                  <article
                    key={item.id}
                    id={`floor-${floorNumber}`}
                    data-floor={floorNumber}
                    ref={(el) => {
                      if (el) floorElementsRef.current.set(floorNumber, el);
                    }}
                    className={`gb-floor-card ${isOp ? 'is-op-floor' : ''} ${isBoost ? 'is-boost-floor' : ''}`}
                  >
                    {/* Floor Header */}
                    <div className="gb-floor-card__header">
                      {/* Author Info */}
                      <div className="gb-floor-author-info">
                        <div className="gb-floor-avatar-box">
                          {item.authorAvatar ? (
                            <img src={item.authorAvatar} alt={item.authorName} className="gb-floor-avatar" />
                          ) : (
                            <div className="gb-floor-avatar-fallback">{getCommentInitials(item.authorName)}</div>
                          )}
                        </div>

                        <div className="gb-floor-meta">
                          <div className="gb-floor-author-name-row">
                            <span className="gb-floor-author-name">{item.authorName}</span>

                            {isOp && <span className="gb-badge is-op">👑 楼主</span>}
                            {item.authorRole === 'admin' && <span className="gb-badge is-admin">👑 站长</span>}

                            <span
                              className="gb-badge is-level"
                              style={{ borderColor: userLevel.badgeColor, color: userLevel.badgeColor }}
                            >
                              {userLevel.levelTag}
                            </span>

                            {item.ipCountryFlag && (
                              <span className="gb-badge is-geo" title={item.ipLocation || '属地'}>
                                {item.ipCountryFlag} {item.ipLocation || item.ipCountryName}
                              </span>
                            )}
                          </div>

                          <div className="gb-floor-sub-meta">
                            <time dateTime={item.createdAt}>{formatTime(item.createdAt)}</time>
                            {isBoost && (
                              <span className="gb-boost-reply-chip">
                                <Rocket className="w-3 h-3 mr-1 inline" />
                                <span>boost</span>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Floor Number Badge */}
                      <div className="gb-floor-number-badge">
                        <span>#{floorNumber}</span>
                      </div>
                    </div>

                    {/* Floor Body Content */}
                    <div className="gb-floor-card__body">
                      <div
                        className="gb-markdown-render"
                        dangerouslySetInnerHTML={{ __html: renderCommentMarkdown(item.message) }}
                      />
                    </div>

                    {/* Floor Footer Reactions & Actions */}
                    <div className="gb-floor-card__footer">
                      <div className="gb-reactions-bar">
                        {['👍', '🚀', '❤️', '✨', '🔥'].map((emoji) => {
                          const count = item.reactions?.summary?.[emoji] || (emoji === '👍' ? item.likesCount : 0);
                          return (
                            <button
                              key={emoji}
                              type="button"
                              className="gb-reaction-pill"
                              onClick={() => handleReaction(item.id, emoji)}
                            >
                              <span>{emoji}</span>
                              {count > 0 && <span className="gb-reaction-count">{count}</span>}
                            </button>
                          );
                        })}
                      </div>

                      <div className="gb-floor-actions">
                        <button
                          type="button"
                          className="gb-floor-action-btn"
                          onClick={() => {
                            detailReplyTextareaRef.current?.focus();
                            detailReplyTextareaRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                          }}
                        >
                          <MessageSquare className="w-3.5 h-3.5 mr-1" />
                          <span>回复</span>
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}

              {/* Floor Reply Composer: supports replying with boost or replying with gesture! */}
              <div className="gb-floor-reply-composer-card">
                <div className="gb-reply-composer-mode-tabs">
                  <button
                    type="button"
                    className={`gb-reply-tab-btn ${detailReplyMode === 'gesture' ? 'is-active' : ''}`}
                    onClick={() => setDetailReplyMode('gesture')}
                  >
                    <MessageSquare className="w-3.5 h-3.5 mr-1.5" />
                    <span>回复 gesture</span>
                  </button>
                  <button
                    type="button"
                    className={`gb-reply-tab-btn is-boost-tab ${detailReplyMode === 'boost' ? 'is-active' : ''}`}
                    onClick={() => setDetailReplyMode('boost')}
                  >
                    <Rocket className="w-3.5 h-3.5 mr-1.5 text-purple-400" />
                    <span>回复 boost (轻量微语贴楼)</span>
                  </button>
                </div>

                <form onSubmit={handleDetailReplySubmit} className="gb-reply-form">
                  <textarea
                    ref={detailReplyTextareaRef}
                    value={detailReplyMessage}
                    onChange={(e) => setDetailReplyMessage(e.target.value)}
                    placeholder={
                      detailReplyMode === 'boost'
                        ? '给此 gesture 贴一条 boost (30字以内)...'
                        : '发表关于此 gesture 的跟帖探讨 (支持 Markdown)...'
                    }
                    rows={detailReplyMode === 'boost' ? 2 : 4}
                    maxLength={detailReplyMode === 'boost' ? 30 : 3000}
                    className="gb-detail-reply-textarea"
                  />

                  {detailReplyError && (
                    <div className="gb-composer-alert">
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />
                      <span>{detailReplyError}</span>
                    </div>
                  )}

                  <div className="gb-reply-form-footer">
                    <span className="gb-reply-char-info">
                      {detailReplyMode === 'boost' ? `${detailReplyMessage.length} / 30 字` : `${detailReplyMessage.length} 字`}
                    </span>

                    <button
                      type="submit"
                      disabled={detailReplySubmitting || !detailReplyMessage.trim()}
                      className={`gb-reply-submit-btn ${detailReplyMode === 'boost' ? 'is-boost-submit' : ''}`}
                    >
                      {detailReplySubmitting ? (
                        <span>提交中...</span>
                      ) : detailReplyMode === 'boost' ? (
                        <>
                          <Rocket className="w-3.5 h-3.5 mr-1.5 inline" />
                          <span>回复 boost</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-3.5 h-3.5 mr-1.5 inline" />
                          <span>发送回复</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>

            {/* Right Column: LINUXDO VERTICAL TIMELINE SCRUBBER (长条百分比滑动当前楼层) */}
            <aside className="gb-floor-scrubber-sidebar" aria-label="楼层时间线滑动器">
              <div className="gb-scrubber-widget">
                {/* Jump to top (#1) */}
                <button
                  type="button"
                  className="gb-scrubber-jump-btn"
                  onClick={() => scrollToFloor(1)}
                  title="跳转至顶楼 (#1)"
                >
                  <ChevronUp className="w-4 h-4" />
                  <span>顶楼</span>
                </button>

                {/* Vertical Progress Rail & Draggable Percentage Knob */}
                <div
                  ref={scrubberTrackRef}
                  className="gb-scrubber-rail"
                  onClick={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const clickY = e.clientY - rect.top;
                    const pct = Math.max(0, Math.min(1, clickY / rect.height));
                    const targetFloor = Math.max(1, Math.min(currentFloors.length, Math.ceil(pct * currentFloors.length)));
                    scrollToFloor(targetFloor);
                  }}
                >
                  <div className="gb-scrubber-track-bg"></div>
                  <div
                    className="gb-scrubber-track-fill"
                    style={{
                      height: `${Math.min(100, Math.max(8, (activeFloor / Math.max(1, currentFloors.length)) * 100))}%`,
                    }}
                  ></div>

                  {/* Scrubber Percentage Handle Card */}
                  <div
                    className="gb-scrubber-handle"
                    style={{
                      top: `${Math.min(94, Math.max(4, (activeFloor / Math.max(1, currentFloors.length)) * 100))}%`,
                    }}
                  >
                    <div className="gb-scrubber-pill">
                      <span className="gb-scrubber-floor-text">
                        {activeFloor} / {currentFloors.length}
                      </span>
                      <span className="gb-scrubber-pct-text">
                        {Math.round((activeFloor / Math.max(1, currentFloors.length)) * 100)}%
                      </span>
                    </div>
                  </div>
                </div>

                {/* Jump to bottom (#N) */}
                <button
                  type="button"
                  className="gb-scrubber-jump-btn"
                  onClick={() => scrollToFloor(currentFloors.length)}
                  title={`跳转至底楼 (#${currentFloors.length})`}
                >
                  <ChevronDown className="w-4 h-4" />
                  <span>底楼</span>
                </button>

                {/* Active Floor Date Indicator */}
                <div className="gb-scrubber-date-tag">
                  {currentFloors[activeFloor - 1]
                    ? formatTime(currentFloors[activeFloor - 1].createdAt)
                    : '最新'}
                </div>
              </div>
            </aside>
          </div>
        </section>
      ) : (
        /* ==================== VIEW A: GESTURE TOPIC LIST (LinuxDo 列表展示) ==================== */
        <section className="gb-gesture-list-view" aria-label="gesture 列表">
          {loading ? (
            <div className="gb-loading-state">
              <div className="gb-spinner"></div>
              <span>正在加载 gesture 讨论列表...</span>
            </div>
          ) : filteredGestures.length === 0 ? (
            <div className="gb-empty-card">
              <div className="gb-empty-card__icon">🌱</div>
              <h3 className="gb-empty-card__title">
                {searchQuery ? '未找到匹配的 gesture' : '该分类下暂无 gesture'}
              </h3>
              <p className="gb-empty-card__desc">
                {searchQuery ? '可以尝试更换关键词搜索' : '立即发起第一个 gesture，开启精彩探讨！'}
              </p>
              <button
                type="button"
                className="gb-empty-cta-btn"
                onClick={() => setShowGestureModal(true)}
              >
                <Pencil className="w-4 h-4 mr-1.5" /> 发起 gesture
              </button>
            </div>
          ) : (
            <div className="gb-gesture-table">
              {/* Table Header Row */}
              <div className="gb-gesture-table__head">
                <div className="gb-col-topic">主题 / 内容</div>
                <div className="gb-col-dimension">维度</div>
                <div className="gb-col-users">参与者</div>
                <div className="gb-col-metrics">回复 / boost</div>
                <div className="gb-col-time">活跃时间</div>
              </div>

              {/* Topic Rows */}
              <div className="gb-gesture-table__body">
                {filteredGestures.map((item) => {
                  const { title, preview } = extractGestureTitle(item.message);
                  const isRead = readIds.includes(item.id);
                  const isBookmarked = bookmarkedIds.includes(item.id);
                  const isPinned = item.status === 'pinned';
                  const replies = repliesByParent[item.id] || [];
                  const boostReplies = replies.filter((r) => r.postType === 'boost');
                  const gestureReplies = replies.filter((r) => r.postType !== 'boost');
                  const channel = CHANNELS.find((ch) => ch.id === item.tag) || CHANNELS[1];

                  // Unique participants avatars (OP + repliers)
                  const participants = [item, ...replies]
                    .reduce((acc, curr) => {
                      if (!acc.some((x) => x.authorName === curr.authorName)) acc.push(curr);
                      return acc;
                    }, [] as BlogComment[])
                    .slice(0, 5);

                  return (
                    <div
                      key={item.id}
                      className={`gb-gesture-row ${isPinned ? 'is-pinned-row' : ''} ${!isRead ? 'is-unread-row' : ''}`}
                      onClick={() => openGesture(item.id)}
                    >
                      {/* Topic Main Column */}
                      <div className="gb-col-topic">
                        <div className="gb-gesture-row-leading">
                          {/* Unread indicator dot */}
                          <span
                            className={`gb-row-read-dot ${!isRead ? 'is-unread' : 'is-read'}`}
                            title={!isRead ? '未读' : '已读'}
                          ></span>

                          {/* Bookmark button */}
                          <button
                            type="button"
                            className={`gb-row-bookmark-btn ${isBookmarked ? 'is-bookmarked' : ''}`}
                            onClick={(e) => toggleBookmark(item.id, e)}
                            title={isBookmarked ? '已收藏' : '添加书签'}
                          >
                            {isBookmarked ? (
                              <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                            ) : (
                              <Star className="w-3.5 h-3.5 text-slate-400" />
                            )}
                          </button>
                        </div>

                        <div className="gb-gesture-row-content">
                          <div className="gb-gesture-row-title-line">
                            {isPinned && (
                              <span className="gb-badge is-pinned" title="官方置顶">
                                <Pin className="w-3 h-3 mr-0.5 inline" /> 官方置顶
                              </span>
                            )}
                            <h3 className="gb-gesture-row-title">{title}</h3>
                          </div>
                          {preview && <p className="gb-gesture-row-preview">{preview}</p>}
                        </div>
                      </div>

                      {/* Dimension Column */}
                      <div className="gb-col-dimension">
                        <span className="gb-channel-tag-pill">
                          <span className="mr-1">{channel.icon}</span>
                          <span>{channel.label}</span>
                        </span>
                      </div>

                      {/* Participants Stack Column */}
                      <div className="gb-col-users">
                        <div className="gb-avatar-stack">
                          {participants.map((p, idx) => (
                            <div key={idx} className="gb-avatar-stack__item" title={p.authorName}>
                              {p.authorAvatar ? (
                                <img src={p.authorAvatar} alt={p.authorName} />
                              ) : (
                                <span className="gb-avatar-fallback">{getCommentInitials(p.authorName)}</span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Metrics (Replies & Boost) Column */}
                      <div className="gb-col-metrics">
                        <div className="gb-metrics-pill-wrap">
                          <span className="gb-metric-pill" title={`${gestureReplies.length} 条跟帖回复`}>
                            <MessageSquare className="w-3 h-3 mr-1 text-indigo-400" />
                            <span>{gestureReplies.length}</span>
                          </span>
                          {boostReplies.length > 0 && (
                            <span className="gb-metric-pill is-boost-metric" title={`${boostReplies.length} 条 boost`}>
                              <Rocket className="w-3 h-3 mr-1 text-purple-400" />
                              <span>{boostReplies.length}</span>
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Activity Time Column */}
                      <div className="gb-col-time">
                        <time dateTime={item.createdAt}>{formatTime(item.createdAt)}</time>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </section>
      )}

      {/* ========================================================
          4. MODAL: + 发起 gesture (Modal Popup Composer)
          ======================================================== */}
      {showGestureModal && (
        <div className="gb-modal-backdrop" onClick={() => setShowGestureModal(false)}>
          <div className="gb-modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="gb-modal-header">
              <div className="gb-modal-title">
                <MessageSquare className="w-5 h-5 mr-2 text-indigo-500 inline" />
                <span>发起全新 gesture</span>
              </div>
              <button
                type="button"
                className="gb-modal-close-btn"
                onClick={() => setShowGestureModal(false)}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateGestureSubmit} className="gb-modal-form">
              {/* Select Dimension */}
              <div className="gb-modal-dimension-selector">
                <span className="gb-field-label">所属维度:</span>
                <div className="gb-dimension-chips">
                  {CHANNELS.filter((ch) => ch.id !== 'all').map((ch) => (
                    <button
                      key={ch.id}
                      type="button"
                      className={`gb-dimension-chip ${newGestureChannel === ch.id ? 'is-active' : ''}`}
                      onClick={() => setNewGestureChannel(ch.id)}
                    >
                      <span>{ch.icon}</span>
                      <span>{ch.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Write / Preview Tab Switch */}
              <div className="gb-modal-tab-switch">
                <button
                  type="button"
                  className={`gb-tab-btn ${newGesturePreview === 'write' ? 'is-active' : ''}`}
                  onClick={() => setNewGesturePreview('write')}
                >
                  <Pencil className="w-3.5 h-3.5 mr-1" /> 编辑 Markdown
                </button>
                <button
                  type="button"
                  className={`gb-tab-btn ${newGesturePreview === 'preview' ? 'is-active' : ''}`}
                  onClick={() => setNewGesturePreview('preview')}
                >
                  <Sparkles className="w-3.5 h-3.5 mr-1" /> 实时预览
                </button>
              </div>

              {/* Markdown Toolbar */}
              {newGesturePreview === 'write' && (
                <div className="gb-md-toolbar">
                  <button type="button" title="粗体" onClick={() => insertMarkdown('**', '**')}>
                    <Bold className="w-3.5 h-3.5" />
                  </button>
                  <button type="button" title="斜体" onClick={() => insertMarkdown('*', '*')}>
                    <Italic className="w-3.5 h-3.5" />
                  </button>
                  <button type="button" title="代码块" onClick={() => insertMarkdown('```ts\n', '\n```')}>
                    <Code className="w-3.5 h-3.5" />
                  </button>
                  <button type="button" title="引用" onClick={() => insertMarkdown('> ')}>
                    <Quote className="w-3.5 h-3.5" />
                  </button>
                  <button type="button" title="列表" onClick={() => insertMarkdown('- ')}>
                    <List className="w-3.5 h-3.5" />
                  </button>
                  <button type="button" title="插入链接" onClick={() => insertMarkdown('[链接说明](', ')')}>
                    <LinkIcon className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    title="上传图片"
                    disabled={isUploadingImage}
                    onClick={() => newGestureFileInputRef.current?.click()}
                  >
                    <ImageIcon className="w-3.5 h-3.5" />
                  </button>
                  <input
                    ref={newGestureFileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageUpload}
                  />
                </div>
              )}

              {/* Textarea or Preview */}
              <div className="gb-composer-editor-wrap">
                {newGesturePreview === 'write' ? (
                  <textarea
                    ref={newGestureTextareaRef}
                    value={newGestureMessage}
                    onChange={(e) => setNewGestureMessage(e.target.value)}
                    placeholder="分享你的见解、思考或探讨主题（支持完整 Markdown 图文，至少 8 字）..."
                    rows={8}
                    className="gb-textarea"
                  />
                ) : (
                  <div
                    className="gb-markdown-preview"
                    dangerouslySetInnerHTML={{
                      __html: renderCommentMarkdown(newGestureMessage) || '<p class="text-slate-400 italic">预览区域为空...</p>',
                    }}
                  />
                )}
              </div>

              {/* Attached Images */}
              {newGestureImages.length > 0 && (
                <div className="gb-attached-tray">
                  <div className="gb-attached-grid">
                    {newGestureImages.map((u, i) => (
                      <div key={i} className="gb-attached-thumb">
                        <img src={u} alt="attached" onClick={() => setZoomedImage(u)} />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Feedback Error */}
              {gestureComposerError && (
                <div className="gb-composer-alert">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{gestureComposerError}</span>
                </div>
              )}

              {/* Footer */}
              <div className="gb-modal-footer">
                <div className="gb-char-counter">
                  <span>{newGestureMessage.length} 字 (至少 8 字)</span>
                </div>

                <div className="gb-modal-actions">
                  <button
                    type="button"
                    className="gb-btn-secondary"
                    onClick={() => setShowGestureModal(false)}
                  >
                    取消
                  </button>
                  <button
                    type="submit"
                    disabled={gestureSubmitting || newGestureMessage.trim().length < 8}
                    className="gb-submit-btn"
                  >
                    {gestureSubmitting ? (
                      <span>发布中...</span>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-1.5" />
                        <span>发布 gesture</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default GuestbookBoard;
