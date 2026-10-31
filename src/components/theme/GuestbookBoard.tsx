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

// Board topic channels configuration
export const CHANNELS = [
  { id: 'all', label: '全部板块', icon: '🌟', desc: '全站所有主题留言与讨论' },
  { id: 'chat', label: '畅所欲言', icon: '💬', desc: '自由闲聊、日常问候与生活点滴' },
  { id: 'tech', label: '技术探讨', icon: '🛠️', desc: '前端工程、边缘计算、AI与架构心得' },
  { id: 'ideas', label: '灵感交流', icon: '💡', desc: '设计思考、新颖想法与作品探讨' },
  { id: 'life', label: '生活碎碎念', icon: '☕', desc: '阅读留痕、咖啡时光与随感随笔' },
  { id: 'feedback', label: '站点建议', icon: '📮', desc: '功能建议、体验反馈与缺陷报告' },
] as const;

export type ChannelId = (typeof CHANNELS)[number]['id'];

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

// Quick stamps for Boost mode
const QUICK_STAMPS = [
  { icon: '🎉', text: '🎉 祝博主博客长青，内容常新！' },
  { icon: '☕', text: '☕ 路过点赞，敬作者一杯热咖啡！' },
  { icon: '🚀', text: '🚀 界面设计与交互太丝滑了，灵感爆发！' },
  { icon: '🌟', text: '🌟 2026 探访留念，数字花园漫游打卡！' },
  { icon: '💡', text: '💡 想就本站的系统架构和岛屿组件交流探讨一番~' },
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
  message: `### 🌟 欢迎来到全站留言与读者交流广场！

这里是为所有读者与探索者打造的开放交流空间。你可以在这里探讨工程架构、交流设计灵感，或是分享日常随笔。

#### 💡 如何参与交流？
- **📝 Gesture 深度讨论**：字数在 8 字以上，支持完整 Markdown 图文排版、代码块、引用与多级跟帖回复；
- **🚀 Boost 瞬时微语**：字数限制在 30 字以内，轻触即发，适合即时想法、问候打卡与灵感碰撞（默认不开放跟帖）；
- **🏷️ 六大主题板块**：涵盖畅所欲言、技术探讨、灵感交流、生活碎碎念与站点建议，方便按需归类。

欢迎在下方点击 **「💬 跟帖回复」** 留下你的第一条声音！✨`,
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

export function GuestbookBoard() {
  // Core comment state
  const [comments, setComments] = useState<BlogComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState<'new' | 'hot'>('new');
  const [selectedChannel, setSelectedChannel] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<'all' | 'gesture' | 'boost'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Active composer state
  const [composerMode, setComposerMode] = useState<'gesture' | 'boost'>('gesture');
  const [composerChannel, setComposerChannel] = useState<string>('chat');
  const [message, setMessage] = useState('');
  const [previewTab, setPreviewTab] = useState<'write' | 'preview'>('write');
  const [attachedImages, setAttachedImages] = useState<string[]>([]);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [composerError, setComposerError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Author profile & Identity state
  const [identity, setIdentity] = useState<CommentIdentity | null>(null);
  const [authorName, setAuthorName] = useState('');
  const [authorAvatar, setAuthorAvatar] = useState('');
  const [authorWebsite, setAuthorWebsite] = useState('');
  const [authorEmail, setAuthorEmail] = useState('');
  const [showIdentityEdit, setShowIdentityEdit] = useState(false);

  // Reply trees state (Gesture only)
  const [expandedReplies, setExpandedReplies] = useState<Record<string, boolean>>({
    pinned_welcome_official: true,
  });
  const [activeReplyTargetId, setActiveReplyTargetId] = useState<string | null>(null);
  const [replyMessage, setReplyMessage] = useState('');
  const [replySubmitting, setReplySubmitting] = useState(false);
  const [replyShowEmoji, setReplyShowEmoji] = useState(false);

  // Editing state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editMessage, setEditMessage] = useState('');

  // Lightbox zoom modal state
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const replyTextareaRef = useRef<HTMLTextAreaElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);

  // Load identity from storage on mount
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
  }, []);

  // Close emoji picker when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) {
        setShowEmojiPicker(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Load comments
  const loadComments = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchComments('guestbook', sort);
      setComments(data);
    } catch (err) {
      console.error('Failed to load guestbook comments:', err);
    } finally {
      setLoading(false);
    }
  }, [sort]);

  useEffect(() => {
    loadComments();
  }, [loadComments]);

  // Toast auto-dismiss
  useEffect(() => {
    if (!toastMessage) return;
    const t = setTimeout(() => setToastMessage(null), 3500);
    return () => clearTimeout(t);
  }, [toastMessage]);

  const showToast = (msg: string) => setToastMessage(msg);

  // Combine DB comments with pinned anchor
  const allCommentsWithPinned = useMemo(() => {
    const hasPinned = comments.some((c) => c.id === OFFICIAL_PINNED_POST.id);
    if (!hasPinned) {
      return [OFFICIAL_PINNED_POST, ...comments];
    }
    return comments;
  }, [comments]);

  // Compute stats
  const stats = useMemo(() => {
    const total = allCommentsWithPinned.length;
    const gestures = allCommentsWithPinned.filter((c) => c.postType === 'gesture' || c.postType === 'comment').length;
    const boosts = allCommentsWithPinned.filter((c) => c.postType === 'boost').length;
    const contributors = new Set(allCommentsWithPinned.map((c) => c.authorName || c.authorId)).size;
    return { total, gestures, boosts, contributors };
  }, [allCommentsWithPinned]);

  // Organize comments into threads (top-level vs replies)
  const { topLevelComments, repliesByParent } = useMemo(() => {
    const top: BlogComment[] = [];
    const rep: Record<string, BlogComment[]> = {};

    for (const c of allCommentsWithPinned) {
      if (c.parentId) {
        if (!rep[c.parentId]) rep[c.parentId] = [];
        rep[c.parentId].push(c);
      } else {
        top.push(c);
      }
    }

    return { topLevelComments: top, repliesByParent: rep };
  }, [allCommentsWithPinned]);

  // Filtered comments
  const filteredComments = useMemo(() => {
    return topLevelComments.filter((c) => {
      // Pinned posts always stay if in "all" or matching channel
      const isPinned = c.status === 'pinned';

      // Channel filter
      if (selectedChannel !== 'all') {
        const itemTag = c.tag || 'chat';
        if (itemTag !== selectedChannel && !isPinned) return false;
      }

      // Type filter
      if (selectedType === 'boost' && c.postType !== 'boost') return false;
      if (selectedType === 'gesture' && c.postType === 'boost') return false;

      // Keyword search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const textMatch = (c.message || '').toLowerCase().includes(q);
        const authorMatch = (c.authorName || '').toLowerCase().includes(q);
        const tagMatch = (c.tag || '').toLowerCase().includes(q);
        if (!textMatch && !authorMatch && !tagMatch) return false;
      }

      return true;
    });
  }, [topLevelComments, selectedChannel, selectedType, searchQuery]);

  // Markdown tool handler
  const insertMarkdown = (prefix: string, suffix: string = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const current = textarea.value;
    const selected = current.substring(start, end);
    const replacement = prefix + (selected || '文本') + suffix;

    setMessage(current.substring(0, start) + replacement + current.substring(end));
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, start + prefix.length + (selected ? selected.length : 2));
    }, 10);
  };

  // Insert emoji at cursor
  const insertEmoji = (emoji: string, isReply = false) => {
    if (isReply) {
      const textarea = replyTextareaRef.current;
      if (textarea) {
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const current = textarea.value;
        setReplyMessage(current.substring(0, start) + emoji + current.substring(end));
        setTimeout(() => {
          textarea.focus();
          textarea.setSelectionRange(start + emoji.length, start + emoji.length);
        }, 10);
      } else {
        setReplyMessage((prev) => prev + emoji);
      }
      setReplyShowEmoji(false);
      return;
    }

    const textarea = textareaRef.current;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const current = textarea.value;
      setMessage(current.substring(0, start) + emoji + current.substring(end));
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + emoji.length, start + emoji.length);
      }, 10);
    } else {
      setMessage((prev) => prev + emoji);
    }
    setShowEmojiPicker(false);
  };

  // Image Upload handler
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingImage(true);
    setComposerError(null);
    try {
      const res = await uploadCommentImage(file);
      if (res.ok && res.url) {
        setAttachedImages((prev) => [...prev, res.url!]);
        setMessage((prev) => {
          const append = `\n\n![图片](${res.url})\n\n`;
          return prev ? prev + append : `![图片](${res.url})`;
        });
        showToast('图片上传成功！已插入内容中');
      } else {
        setComposerError(res.error || '图片上传失败，请重试');
      }
    } catch (err: any) {
      setComposerError(err.message || '图片上传遇到问题');
    } finally {
      setIsUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Remove attached image
  const removeAttachedImage = (urlToRemove: string) => {
    setAttachedImages((prev) => prev.filter((u) => u !== urlToRemove));
    setMessage((prev) => prev.replace(new RegExp(`!?\\[.*?\\]\\(${urlToRemove.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\)`, 'g'), '').trim());
  };

  // Handle post submit
  const handlePostSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setComposerError(null);

    const trimmed = message.trim();
    if (!trimmed) {
      setComposerError('请输入留言内容');
      return;
    }

    // Boost: <= 30 characters
    if (composerMode === 'boost' && trimmed.length > 30) {
      setComposerError(`🚀 Boost 瞬时微语不能超过 30 个字 (当前 ${trimmed.length} 字)`);
      return;
    }

    // Gesture: >= 8 characters
    if (composerMode === 'gesture' && trimmed.length < 8) {
      setComposerError(`📝 Gesture 话题讨论至少需要 8 个字 (当前 ${trimmed.length} 字)`);
      return;
    }

    setSubmitting(true);
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
        postType: composerMode,
        tag: composerChannel,
        author: activeIdentity,
        sessionToken: identity?.token,
      });

      if (res.ok && res.comment) {
        setMessage('');
        setAttachedImages([]);
        setPreviewTab('write');
        showToast(composerMode === 'boost' ? '🚀 Boost 瞬时微语发射成功！' : '📝 Gesture 话题讨论发布成功！');
        await loadComments();
      } else {
        setComposerError(res.error || '发表留言失败，请稍后再试');
      }
    } catch (err: any) {
      setComposerError(err.message || '网络异常，发表失败');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle reply submit (Gesture only)
  const handleReplySubmit = async (parentId: string) => {
    const trimmed = replyMessage.trim();
    if (!trimmed) return;

    if (trimmed.length < 2) {
      showToast('回复内容至少需 2 个字');
      return;
    }

    setReplySubmitting(true);
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
        parentId,
        author: activeIdentity,
        sessionToken: identity?.token,
      });

      if (res.ok && res.comment) {
        setReplyMessage('');
        setActiveReplyTargetId(null);
        setExpandedReplies((prev) => ({ ...prev, [parentId]: true }));
        showToast('跟帖回复已成功送达！');
        await loadComments();
      } else {
        showToast(res.error || '回复失败，请稍后再试');
      }
    } catch (err: any) {
      showToast(err.message || '回复失败');
    } finally {
      setReplySubmitting(false);
    }
  };

  // Handle Reaction Toggle
  const handleReaction = async (commentId: string, emoji: string) => {
    try {
      const res = await likeComment(commentId, emoji, identity?.id || identity?.token);
      if (res.ok || commentId === OFFICIAL_PINNED_POST.id) {
        setComments((prev) => {
          const list = prev.length ? prev : [OFFICIAL_PINNED_POST];
          return list.map((c) => {
            if (c.id !== commentId) return c;
            const currentSummary = { ...(c.reactions?.summary || {}) };
            const currentUsers = { ...(c.reactions?.users || {}) };
            const uid = identity?.id || identity?.token || 'visitor';
            const prevEmoji = currentUsers[uid];

            if (prevEmoji === emoji) {
              delete currentUsers[uid];
              currentSummary[emoji] = Math.max((currentSummary[emoji] || 1) - 1, 0);
              if (currentSummary[emoji] === 0) delete currentSummary[emoji];
            } else {
              if (prevEmoji) {
                currentSummary[prevEmoji] = Math.max((currentSummary[prevEmoji] || 1) - 1, 0);
                if (currentSummary[prevEmoji] === 0) delete currentSummary[prevEmoji];
              }
              currentUsers[uid] = emoji;
              currentSummary[emoji] = (currentSummary[emoji] || 0) + 1;
            }

            return {
              ...c,
              reactions: { summary: currentSummary, users: currentUsers },
            };
          });
        });
      }
    } catch (err) {
      console.error('Reaction toggle error:', err);
    }
  };

  // Handle Delete
  const handleDelete = async (commentId: string) => {
    if (!window.confirm('确定要删除这条留言吗？此操作无法撤销。')) return;
    try {
      const res = await deleteComment(commentId, identity?.token);
      if (res.ok) {
        showToast('留言已删除');
        setComments((prev) => prev.filter((c) => c.id !== commentId && c.parentId !== commentId));
      } else {
        showToast(res.error || '删除失败');
      }
    } catch (err: any) {
      showToast(err.message || '删除失败');
    }
  };

  // Handle Edit Submit
  const handleEditSubmit = async (commentId: string) => {
    const trimmed = editMessage.trim();
    if (!trimmed) return;

    try {
      const res = await editComment(commentId, trimmed, identity?.token);
      if (res.ok) {
        showToast('修改已保存');
        setEditingId(null);
        setComments((prev) =>
          prev.map((c) => (c.id === commentId ? { ...c, message: trimmed, updatedAt: new Date().toISOString() } : c))
        );
      } else {
        showToast(res.error || '修改失败');
      }
    } catch (err: any) {
      showToast(err.message || '修改失败');
    }
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

  // Share link handler
  const handleShare = (commentId: string) => {
    const url = `${window.location.origin}/guestbook/#comment-${commentId}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url).then(() => {
        showToast('🔗 留言直达链接已复制到剪贴板！');
      });
    }
  };

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

      {/* 1. Community Hero Header */}
      <header className="gb-hero">
        <div className="gb-hero__main">
          <div className="gb-hero__badge">
            <span className="gb-pulse-dot"></span>
            <span>COMMUNITY PLAZA · 全站留言交流广场</span>
          </div>
          <h1 className="gb-hero__title">尺素寸心 · 思想碰撞的数字花园</h1>
          <p className="gb-hero__subtitle">
            无论是一场深入的技术推演、一份真挚的建言献策，还是一声微语问候，都在这里沉淀为社区的共同记忆。
          </p>
        </div>

        {/* Real-time stats Bento Cards */}
        <div className="gb-hero__stats">
          <div className="gb-stat-card is-total">
            <div className="gb-stat-card__icon-wrap">💬</div>
            <div className="gb-stat-card__content">
              <span className="gb-stat-card__num">{stats.total}</span>
              <span className="gb-stat-card__label">累计交流</span>
            </div>
          </div>
          <div className="gb-stat-card is-gesture">
            <div className="gb-stat-card__icon-wrap">📝</div>
            <div className="gb-stat-card__content">
              <span className="gb-stat-card__num">{stats.gestures}</span>
              <span className="gb-stat-card__label">Gesture 话题</span>
            </div>
          </div>
          <div className="gb-stat-card is-boost">
            <div className="gb-stat-card__icon-wrap">🚀</div>
            <div className="gb-stat-card__content">
              <span className="gb-stat-card__num">{stats.boosts}</span>
              <span className="gb-stat-card__label">Boost 微语</span>
            </div>
          </div>
          <div className="gb-stat-card is-contributors">
            <div className="gb-stat-card__icon-wrap">👥</div>
            <div className="gb-stat-card__content">
              <span className="gb-stat-card__num">{stats.contributors}</span>
              <span className="gb-stat-card__label">参与交流者</span>
            </div>
          </div>
        </div>
      </header>

      {/* 2. Interactive Publisher Workshop (发布工坊) */}
      <section className="gb-composer-card">
        {/* Mode Selector Cards (Gesture vs Boost) */}
        <div className="gb-composer-modes">
          <button
            type="button"
            className={`gb-mode-btn is-gesture ${composerMode === 'gesture' ? 'is-active' : ''}`}
            onClick={() => {
              setComposerMode('gesture');
              setComposerError(null);
            }}
          >
            <div className="gb-mode-btn__badge">深度讨论</div>
            <div className="gb-mode-btn__header">
              <MessageSquare className="w-5 h-5 text-indigo-500" />
              <span className="gb-mode-btn__title">📝 Gesture 话题</span>
            </div>
            <span className="gb-mode-btn__hint">8字以上 · Markdown图文 · 开放跟帖</span>
          </button>

          <button
            type="button"
            className={`gb-mode-btn is-boost ${composerMode === 'boost' ? 'is-active' : ''}`}
            onClick={() => {
              setComposerMode('boost');
              setComposerError(null);
            }}
          >
            <div className="gb-mode-btn__badge is-boost">瞬时微语</div>
            <div className="gb-mode-btn__header">
              <Rocket className="w-5 h-5 text-purple-500" />
              <span className="gb-mode-btn__title">🚀 Boost 微语</span>
            </div>
            <span className="gb-mode-btn__hint">30字以内 · 极简呈现 · 仅支持表态</span>
          </button>
        </div>

        {/* Quick Stamps for Boost mode */}
        {composerMode === 'boost' && (
          <div className="gb-boost-stamps">
            <span className="gb-stamps-label">⚡ 灵感快捷句：</span>
            <div className="gb-stamps-row">
              {QUICK_STAMPS.map((s, idx) => (
                <button
                  key={idx}
                  type="button"
                  className="gb-stamp-pill"
                  onClick={() => setMessage(s.text)}
                >
                  <span>{s.icon}</span>
                  <span className="gb-stamp-pill__text">{s.text.replace(/^[^\s]+\s*/, '')}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Composer Form */}
        <form onSubmit={handlePostSubmit} className="gb-composer-form">
          {/* Top Bar: Channel selector pills & Preview toggle */}
          <div className="gb-composer-topbar">
            <div className="gb-channel-selector-row">
              <span className="gb-field-label">
                <Tag className="w-3.5 h-3.5 inline mr-1" />
                发往板块:
              </span>
              <div className="gb-channel-select-pills">
                {CHANNELS.filter((ch) => ch.id !== 'all').map((ch) => (
                  <button
                    key={ch.id}
                    type="button"
                    className={`gb-composer-channel-pill ${composerChannel === ch.id ? 'is-active' : ''}`}
                    onClick={() => setComposerChannel(ch.id)}
                  >
                    <span>{ch.icon}</span>
                    <span>{ch.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {composerMode === 'gesture' && (
              <div className="gb-tab-switch">
                <button
                  type="button"
                  className={`gb-tab-btn ${previewTab === 'write' ? 'is-active' : ''}`}
                  onClick={() => setPreviewTab('write')}
                >
                  <Pencil className="w-3.5 h-3.5 mr-1" /> 编辑
                </button>
                <button
                  type="button"
                  className={`gb-tab-btn ${previewTab === 'preview' ? 'is-active' : ''}`}
                  onClick={() => setPreviewTab('preview')}
                >
                  <Sparkles className="w-3.5 h-3.5 mr-1" /> 实时预览
                </button>
              </div>
            )}
          </div>

          {/* Markdown Formatting Toolbar (for Gesture mode) */}
          {composerMode === 'gesture' && previewTab === 'write' && (
            <div className="gb-md-toolbar">
              <button type="button" title="粗体 (Ctrl+B)" onClick={() => insertMarkdown('**', '**')}>
                <Bold className="w-4 h-4" />
              </button>
              <button type="button" title="斜体 (Ctrl+I)" onClick={() => insertMarkdown('*', '*')}>
                <Italic className="w-4 h-4" />
              </button>
              <button type="button" title="代码块" onClick={() => insertMarkdown('\n```\n', '\n```\n')}>
                <Code className="w-4 h-4" />
              </button>
              <button type="button" title="引用" onClick={() => insertMarkdown('\n> ', '\n')}>
                <Quote className="w-4 h-4" />
              </button>
              <button type="button" title="无序列表" onClick={() => insertMarkdown('\n- ', '\n')}>
                <List className="w-4 h-4" />
              </button>
              <button type="button" title="超链接" onClick={() => insertMarkdown('[链接说明](', ')')}>
                <LinkIcon className="w-4 h-4" />
              </button>
              <div className="gb-toolbar-divider"></div>
              <button
                type="button"
                className="gb-toolbar-tool-btn is-img-btn"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingImage}
                title="上传图片"
              >
                <ImageIcon className="w-4 h-4 text-emerald-500" />
                <span>{isUploadingImage ? '上传中...' : '插入图片'}</span>
              </button>
              <button
                type="button"
                className="gb-toolbar-tool-btn is-emoji-btn"
                onClick={() => setShowEmojiPicker((prev) => !prev)}
                title="插入 Emoji 表情"
              >
                <Smile className="w-4 h-4 text-amber-500" />
                <span>表情</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/webp,image/gif"
                onChange={handleImageUpload}
                style={{ display: 'none' }}
              />
            </div>
          )}

          {/* Emoji Palette Popover */}
          {showEmojiPicker && (
            <div ref={emojiPickerRef} className="gb-emoji-popover">
              <div className="gb-emoji-popover__header">
                <span>选择 Emoji 表情</span>
                <button type="button" onClick={() => setShowEmojiPicker(false)}>
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="gb-emoji-popover__body">
                {EMOJI_GROUPS.map((grp, gi) => (
                  <div key={gi} className="gb-emoji-group">
                    <span className="gb-emoji-group__name">{grp.name}</span>
                    <div className="gb-emoji-grid">
                      {grp.emojis.map((em, ei) => (
                        <button
                          key={ei}
                          type="button"
                          className="gb-emoji-btn"
                          onClick={() => insertEmoji(em)}
                        >
                          {em}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Input Area / Preview Area */}
          <div className="gb-composer-input-wrap">
            {previewTab === 'write' || composerMode === 'boost' ? (
              <textarea
                ref={textareaRef}
                value={message}
                onChange={(e) => {
                  setMessage(e.target.value);
                  if (composerError) setComposerError(null);
                }}
                rows={composerMode === 'boost' ? 2 : 5}
                placeholder={
                  composerMode === 'boost'
                    ? '轻触即发，留下你的微语或简短问候 (30字以内，不支持跟帖回复)...'
                    : '展开深入讨论，分享你的见解或提出疑问 (支持 Markdown、图文排版，至少 8 个字)...'
                }
                className={`gb-textarea ${composerMode === 'boost' ? 'is-boost' : ''}`}
                maxLength={composerMode === 'boost' ? 30 : 2500}
              />
            ) : (
              <div
                className="gb-markdown-preview"
                dangerouslySetInnerHTML={{
                  __html: renderCommentMarkdown(message) || '<p class="text-slate-400 italic">预览区域为空，请在编辑框输入内容...</p>',
                }}
              />
            )}
          </div>

          {/* Attached Images Tray */}
          {attachedImages.length > 0 && (
            <div className="gb-attached-tray">
              <span className="gb-attached-tray__title">已添加附件图片：</span>
              <div className="gb-attached-grid">
                {attachedImages.map((imgUrl, idx) => (
                  <div key={idx} className="gb-attached-thumb">
                    <img
                      src={imgUrl}
                      alt="Attachment"
                      onClick={() => setZoomedImage(imgUrl)}
                    />
                    <button
                      type="button"
                      className="gb-attached-remove"
                      onClick={() => removeAttachedImage(imgUrl)}
                      title="移除图片"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Feedback error alert */}
          {composerError && (
            <div className="gb-composer-alert">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{composerError}</span>
            </div>
          )}

          {/* Bottom Control Bar */}
          <div className="gb-composer-bottombar">
            {/* Identity info & Quick edit */}
            <div className="gb-identity-info">
              <div className="gb-identity-avatar-wrap">
                {authorAvatar ? (
                  <img src={authorAvatar} alt={authorName} className="gb-identity-avatar" />
                ) : (
                  <div className="gb-identity-avatar-placeholder">
                    {getCommentInitials(authorName)}
                  </div>
                )}
              </div>
              <div className="gb-identity-meta">
                <span className="gb-identity-name">{authorName || '访客'}</span>
                <button
                  type="button"
                  className="gb-identity-edit-btn"
                  onClick={() => setShowIdentityEdit((prev) => !prev)}
                >
                  {showIdentityEdit ? '收起名片' : '设置称呼与名片'}
                </button>
              </div>
            </div>

            {/* Character counter & Submit Button */}
            <div className="gb-submit-controls">
              <div className="gb-char-counter">
                {composerMode === 'boost' ? (
                  <span className={message.length > 30 ? 'text-red-500 font-bold' : ''}>
                    {message.length} / 30 字
                  </span>
                ) : (
                  <span className={message.trim().length > 0 && message.trim().length < 8 ? 'text-amber-500 font-medium' : ''}>
                    {message.length} 字 (至少 8 字)
                  </span>
                )}
              </div>

              <button
                type="submit"
                disabled={
                  submitting ||
                  !message.trim() ||
                  (composerMode === 'boost' && message.trim().length > 30) ||
                  (composerMode === 'gesture' && message.trim().length < 8)
                }
                className={`gb-submit-btn ${composerMode === 'boost' ? 'is-boost-submit' : ''}`}
              >
                {submitting ? (
                  <span>提交中...</span>
                ) : composerMode === 'boost' ? (
                  <>
                    <Rocket className="w-4 h-4 mr-1.5" />
                    <span>发射 Boost</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-1.5" />
                    <span>发布 Gesture 讨论</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Expandable Identity Edit Drawer */}
          {showIdentityEdit && (
            <div className="gb-identity-drawer">
              <div className="gb-id-field">
                <label>昵称 / 称呼:</label>
                <input
                  type="text"
                  value={authorName}
                  onChange={(e) => setAuthorName(e.target.value)}
                  placeholder="留下你的大名或昵称"
                  maxLength={30}
                />
              </div>
              <div className="gb-id-field">
                <label>个人主页 (选填):</label>
                <input
                  type="url"
                  value={authorWebsite}
                  onChange={(e) => setAuthorWebsite(e.target.value)}
                  placeholder="https://example.com"
                />
              </div>
              <div className="gb-id-field">
                <label>邮箱 (选填，仅用于回复提醒):</label>
                <input
                  type="email"
                  value={authorEmail}
                  onChange={(e) => setAuthorEmail(e.target.value)}
                  placeholder="your-name@domain.com"
                />
              </div>
              <div className="gb-id-field">
                <label>头像链接 (选填):</label>
                <input
                  type="url"
                  value={authorAvatar}
                  onChange={(e) => setAuthorAvatar(e.target.value)}
                  placeholder="https://..."
                />
              </div>
            </div>
          )}
        </form>
      </section>

      {/* 3. Community Channels & Navigation Filters */}
      <nav className="gb-channel-nav" aria-label="留言板板块导航">
        <div className="gb-channel-tabs">
          {CHANNELS.map((ch) => {
            const count = allCommentsWithPinned.filter((c) => (c.tag || 'chat') === ch.id).length;
            return (
              <button
                key={ch.id}
                type="button"
                className={`gb-channel-pill ${selectedChannel === ch.id ? 'is-active' : ''}`}
                onClick={() => setSelectedChannel(ch.id)}
              >
                <span className="gb-channel-pill__icon">{ch.icon}</span>
                <span className="gb-channel-pill__label">{ch.label}</span>
                {ch.id !== 'all' && count > 0 && (
                  <span className="gb-channel-pill__count">{count}</span>
                )}
              </button>
            );
          })}
        </div>

        {/* Filters & Sorting row */}
        <div className="gb-filter-row">
          {/* Post Type filter pills */}
          <div className="gb-type-pills">
            <button
              type="button"
              className={`gb-type-btn ${selectedType === 'all' ? 'is-active' : ''}`}
              onClick={() => setSelectedType('all')}
            >
              全部类型
            </button>
            <button
              type="button"
              className={`gb-type-btn ${selectedType === 'gesture' ? 'is-active' : ''}`}
              onClick={() => setSelectedType('gesture')}
            >
              📝 Gesture 话题
            </button>
            <button
              type="button"
              className={`gb-type-btn ${selectedType === 'boost' ? 'is-active' : ''}`}
              onClick={() => setSelectedType('boost')}
            >
              🚀 Boost 微语
            </button>
          </div>

          <div className="gb-filter-right">
            {/* Search Input */}
            <div className="gb-search-box">
              <Search className="w-3.5 h-3.5 gb-search-icon" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜索讨论内容或用户..."
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

            {/* Sort Toggle (Latest / Hot) */}
            <div className="gb-sort-toggle">
              <button
                type="button"
                className={`gb-sort-btn ${sort === 'new' ? 'is-active' : ''}`}
                onClick={() => setSort('new')}
              >
                <Clock className="w-3.5 h-3.5 mr-1" /> 最新
              </button>
              <button
                type="button"
                className={`gb-sort-btn ${sort === 'hot' ? 'is-active' : ''}`}
                onClick={() => setSort('hot')}
              >
                <Flame className="w-3.5 h-3.5 mr-1 text-orange-500" /> 最热
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* 4. Discussions Stream */}
      <main className="gb-stream">
        {loading ? (
          <div className="gb-loading-state">
            <div className="gb-spinner"></div>
            <span>正在连接边缘节点并加载全站讨论...</span>
          </div>
        ) : filteredComments.length === 0 ? (
          <div className="gb-empty-card">
            <div className="gb-empty-card__icon">🌱</div>
            <h3 className="gb-empty-card__title">
              {searchQuery ? '未找到匹配的讨论内容' : '该板块尚无留言或讨论'}
            </h3>
            <p className="gb-empty-card__desc">
              {searchQuery
                ? '可以尝试更换关键词搜索，或重置筛选条件'
                : '成为第一个留下思想足迹的人吧！写下你的见解，启动交流之火。'}
            </p>
            <button
              type="button"
              className="gb-empty-cta-btn"
              onClick={() => {
                textareaRef.current?.focus();
                textareaRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }}
            >
              <Pencil className="w-4 h-4 mr-1.5" /> 发起第一条讨论
            </button>
          </div>
        ) : (
          <div className="gb-cards-list">
            {filteredComments.map((item) => {
              const isBoost = item.postType === 'boost';
              const isPinned = item.status === 'pinned';
              const replies = repliesByParent[item.id] || [];
              const isRepliesExpanded = Boolean(expandedReplies[item.id]);
              const channelInfo = CHANNELS.find((ch) => ch.id === item.tag) || CHANNELS[1];
              const userLevel = computeUserLevel(item.authorId || item.authorName);
              const isOwner = Boolean(
                identity?.id && (identity.id === item.authorId || identity.token === item.authorId)
              );

              return (
                <article
                  key={item.id}
                  id={`comment-${item.id}`}
                  className={`gb-card ${isBoost ? 'is-boost-card' : 'is-gesture-card'} ${isPinned ? 'is-pinned-card' : ''}`}
                >
                  {/* Card Header */}
                  <div className="gb-card__header">
                    <div className="gb-card__author-info">
                      {/* Avatar */}
                      <div className="gb-card__avatar-box">
                        {item.authorAvatar ? (
                          <img
                            src={item.authorAvatar}
                            alt={item.authorName}
                            className="gb-card__avatar"
                          />
                        ) : (
                          <div className="gb-card__avatar-fallback">
                            {getCommentInitials(item.authorName)}
                          </div>
                        )}
                      </div>

                      {/* Author Details */}
                      <div className="gb-card__author-meta">
                        <div className="gb-card__author-row">
                          <span className="gb-card__author-name">
                            {item.authorWebsite ? (
                              <a
                                href={item.authorWebsite}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="gb-card__author-link"
                              >
                                {item.authorName}
                              </a>
                            ) : (
                              item.authorName
                            )}
                          </span>

                          {/* Pinned Badge */}
                          {isPinned && (
                            <span className="gb-badge is-pinned" title="全站置顶官方指南">
                              <Pin className="w-3 h-3 inline mr-0.5" /> 官方置顶
                            </span>
                          )}

                          {/* Role Badge */}
                          {item.authorRole === 'admin' && (
                            <span className="gb-badge is-admin">👑 站长</span>
                          )}
                          {item.authorRole === 'reader' && (
                            <span className="gb-badge is-reader">读者</span>
                          )}
                          {item.authorRole === 'visitor' && (
                            <span className="gb-badge is-visitor">访客</span>
                          )}

                          {/* Level Badge */}
                          <span
                            className="gb-badge is-level"
                            style={{
                              borderColor: userLevel.badgeColor,
                              color: userLevel.badgeColor,
                            }}
                          >
                            {userLevel.levelTag}
                          </span>

                          {/* Location flag */}
                          {item.ipCountryFlag && (
                            <span className="gb-badge is-geo" title={item.ipLocation || '属地'}>
                              {item.ipCountryFlag} {item.ipLocation || item.ipCountryName}
                            </span>
                          )}
                        </div>

                        {/* Channel tag & timestamp */}
                        <div className="gb-card__sub-row">
                          <span className="gb-channel-tag">
                            {channelInfo.icon} {channelInfo.label}
                          </span>
                          <span className="gb-dot-divider">•</span>
                          <time className="gb-card__time" dateTime={item.createdAt}>
                            {formatTime(item.createdAt)}
                          </time>
                        </div>
                      </div>
                    </div>

                    {/* Right side mode badge */}
                    <div className="gb-card__type-badge">
                      {isBoost ? (
                        <span className="gb-boost-pill">
                          <Rocket className="w-3 h-3 mr-1" /> Boost 瞬时流
                        </span>
                      ) : (
                        <span className="gb-gesture-pill">
                          <MessageSquare className="w-3 h-3 mr-1" /> Gesture 讨论
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="gb-card__body">
                    {editingId === item.id ? (
                      <div className="gb-card__edit-form">
                        <textarea
                          value={editMessage}
                          onChange={(e) => setEditMessage(e.target.value)}
                          rows={3}
                          className="gb-textarea"
                        />
                        <div className="gb-card__edit-actions">
                          <button
                            type="button"
                            className="gb-btn-sm is-secondary"
                            onClick={() => setEditingId(null)}
                          >
                            取消
                          </button>
                          <button
                            type="button"
                            className="gb-btn-sm is-primary"
                            onClick={() => handleEditSubmit(item.id)}
                          >
                            保存修改
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div
                        className="gb-card__content"
                        dangerouslySetInnerHTML={{
                          __html: renderCommentMarkdown(item.message),
                        }}
                      />
                    )}
                  </div>

                  {/* Card Footer Actions */}
                  <div className="gb-card__footer">
                    {/* Reactions Bar */}
                    <div className="gb-reactions-bar">
                      {['👍', '❤️', '🚀', '🎉', '💡', '🔥'].map((emoji) => {
                        const count = item.reactions?.summary?.[emoji] || 0;
                        const myUserId = identity?.id || identity?.token || 'visitor';
                        const isReacted = item.reactions?.users?.[myUserId] === emoji;

                        return (
                          <button
                            key={emoji}
                            type="button"
                            className={`gb-reaction-btn ${isReacted ? 'is-reacted' : ''}`}
                            onClick={() => handleReaction(item.id, emoji)}
                            title={`以 ${emoji} 进行表态`}
                          >
                            <span className="gb-reaction-emoji">{emoji}</span>
                            {count > 0 && <span className="gb-reaction-count">{count}</span>}
                          </button>
                        );
                      })}
                    </div>

                    {/* Action buttons on the right */}
                    <div className="gb-card__actions">
                      {/* CRITICAL RULE: Boost default CANNOT be replied to. Gesture CAN be replied to! */}
                      {!isBoost ? (
                        <button
                          type="button"
                          className={`gb-action-btn ${isRepliesExpanded ? 'is-active' : ''}`}
                          onClick={() => {
                            setExpandedReplies((prev) => ({
                              ...prev,
                              [item.id]: !prev[item.id],
                            }));
                            if (!activeReplyTargetId) {
                              setActiveReplyTargetId(item.id);
                            }
                          }}
                        >
                          <MessageSquare className="w-3.5 h-3.5 mr-1 text-indigo-500" />
                          <span>
                            {replies.length > 0
                              ? `${replies.length} 条跟帖回复`
                              : '💬 跟帖回复'}
                          </span>
                          {replies.length > 0 &&
                            (isRepliesExpanded ? (
                              <ChevronUp className="w-3.5 h-3.5 ml-1" />
                            ) : (
                              <ChevronDown className="w-3.5 h-3.5 ml-1" />
                            ))}
                        </button>
                      ) : (
                        <span className="gb-boost-no-reply-hint" title="Boost 属于瞬时微语，不开放跟帖回复">
                          ⚡ 瞬时微语 · 仅支持表态
                        </span>
                      )}

                      {/* Share link */}
                      <button
                        type="button"
                        className="gb-action-btn"
                        onClick={() => handleShare(item.id)}
                        title="复制直达链接"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                      </button>

                      {/* Edit / Delete for author */}
                      {isOwner && !isPinned && (
                        <>
                          <button
                            type="button"
                            className="gb-action-btn"
                            onClick={() => {
                              setEditingId(item.id);
                              setEditMessage(item.message);
                            }}
                            title="编辑留言"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            className="gb-action-btn is-danger"
                            onClick={() => handleDelete(item.id)}
                            title="删除留言"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Nested Replies Stream (Gesture Discussion only) */}
                  {!isBoost && (isRepliesExpanded || activeReplyTargetId === item.id) && (
                    <div className="gb-replies-drawer">
                      {/* Replies List */}
                      {replies.length > 0 && (
                        <div className="gb-replies-list">
                          {replies.map((reply) => {
                            const replyLevel = computeUserLevel(reply.authorId || reply.authorName);
                            const isReplyOwner = Boolean(
                              identity?.id &&
                                (identity.id === reply.authorId || identity.token === reply.authorId)
                            );

                            return (
                              <div key={reply.id} className="gb-reply-item">
                                <div className="gb-reply-item__header">
                                  <div className="gb-card__avatar-box is-sm">
                                    {reply.authorAvatar ? (
                                      <img
                                        src={reply.authorAvatar}
                                        alt={reply.authorName}
                                        className="gb-card__avatar"
                                      />
                                    ) : (
                                      <div className="gb-card__avatar-fallback is-sm">
                                        {getCommentInitials(reply.authorName)}
                                      </div>
                                    )}
                                  </div>

                                  <div className="gb-reply-item__meta">
                                    <span className="gb-card__author-name is-sm">
                                      {reply.authorName}
                                    </span>
                                    {reply.authorRole === 'admin' && (
                                      <span className="gb-badge is-admin is-sm">👑 站长</span>
                                    )}
                                    <span
                                      className="gb-badge is-level is-sm"
                                      style={{
                                        borderColor: replyLevel.badgeColor,
                                        color: replyLevel.badgeColor,
                                      }}
                                    >
                                      {replyLevel.levelTag}
                                    </span>
                                    <span className="gb-card__time is-sm">
                                      {formatTime(reply.createdAt)}
                                    </span>
                                  </div>

                                  {isReplyOwner && (
                                    <button
                                      type="button"
                                      className="gb-reply-delete-btn"
                                      onClick={() => handleDelete(reply.id)}
                                      title="删除此回复"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  )}
                                </div>

                                <div
                                  className="gb-reply-item__body"
                                  dangerouslySetInnerHTML={{
                                    __html: renderCommentMarkdown(reply.message),
                                  }}
                                />

                                <div className="gb-reply-item__footer">
                                  <button
                                    type="button"
                                    className="gb-reaction-btn is-sm"
                                    onClick={() => handleReaction(reply.id, '👍')}
                                  >
                                    👍 {reply.reactions?.summary?.['👍'] || ''}
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* In-place Reply Composer Box */}
                      <div className="gb-reply-composer">
                        <div className="gb-reply-composer__input-wrap">
                          <textarea
                            ref={replyTextareaRef}
                            value={replyMessage}
                            onChange={(e) => setReplyMessage(e.target.value)}
                            placeholder={`回复 @${item.authorName} 的讨论 (参与互动，分享见解)...`}
                            rows={2}
                            className="gb-textarea is-reply"
                          />
                        </div>

                        <div className="gb-reply-composer__controls">
                          <div className="gb-reply-composer__left">
                            <button
                              type="button"
                              className="gb-btn-icon"
                              onClick={() => setReplyShowEmoji((prev) => !prev)}
                              title="插入表情"
                            >
                              <Smile className="w-4 h-4 text-amber-500" />
                            </button>
                          </div>

                          <div className="gb-reply-composer__right">
                            <button
                              type="button"
                              className="gb-btn-sm is-secondary"
                              onClick={() => {
                                setReplyMessage('');
                                setActiveReplyTargetId(null);
                              }}
                            >
                              收起
                            </button>
                            <button
                              type="button"
                              disabled={replySubmitting || !replyMessage.trim()}
                              className="gb-btn-sm is-primary"
                              onClick={() => handleReplySubmit(item.id)}
                            >
                              {replySubmitting ? '发送中...' : '提交回复'}
                            </button>
                          </div>
                        </div>

                        {/* Reply Emoji Palette */}
                        {replyShowEmoji && (
                          <div className="gb-reply-emoji-tray">
                            {['😀', '😄', '😂', '😊', '😍', '🤔', '👍', '👏', '🙌', '🔥', '✨', '🚀', '💡', '🎉'].map(
                              (em) => (
                                <button
                                  key={em}
                                  type="button"
                                  className="gb-emoji-btn is-sm"
                                  onClick={() => insertEmoji(em, true)}
                                >
                                  {em}
                                </button>
                              )
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}

export default GuestbookBoard;
