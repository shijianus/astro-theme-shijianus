import React, { useEffect, useMemo, useState } from 'react';
import { Rocket } from 'lucide-react';
import type { CommentProvider } from '../../config/site';
import {
  fetchComments,
  createComment,
  editComment,
  deleteComment,
  likeComment,
  readCommentIdentity,
  getCommentInitials,
  type BlogComment,
  type CommentIdentity,
  type CommentQuote,
  type PostType,
} from '../../lib/comment-client';

type CommentsIntegrationConfig = Readonly<{
  provider: CommentProvider;
  fallback: CommentProvider;
  cloudflare: Readonly<{
    apiBase: string;
  }>;
  giscus: Readonly<{
    repo: string;
    repoId: string;
    category: string;
    categoryId: string;
    mapping: string;
    theme: string;
  }>;
  waline: Readonly<{
    serverURL: string;
    lang: string;
    pageSize: number;
  }>;
  twikoo: Readonly<{
    envId: string;
    region: string;
    lang: string;
  }>;
}>;

type PostCommentsProps = {
  slug: string;
  title: string;
  heading?: string;
  policyLabel?: string;
  submitLabel?: string;
  previewLabel?: string;
  emptyTitle?: string;
  emptySummary?: string;
  integration: CommentsIntegrationConfig;
};

const COMMENT_LIMIT = 500;
const BOOST_LIMIT = 16;
const LONG_TEXT_THRESHOLD = 240;

const QUICK_EMOJIS = ['👍', '❤️', '🔥', '🚀', '💡', '🎉', '👏', '🤯', '☕', '✨'];

function formatCommentTime(value: string) {
  try {
    const d = new Date(value);
    const now = Date.now();
    const diff = (now - d.getTime()) / 1000;
    if (diff < 60) return '刚刚';
    if (diff < 3600) return `${Math.floor(diff / 60)} 分钟前`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} 小时前`;
    if (diff < 86400 * 30) return `${Math.floor(diff / 86400)} 天前`;
    return d.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  } catch {
    return value;
  }
}

function isEdited(created: string, updated?: string) {
  if (!updated) return false;
  try {
    const cTime = new Date(created).getTime();
    const uTime = new Date(updated).getTime();
    return uTime - cTime > 3000;
  } catch {
    return false;
  }
}

export function PostComments({
  slug,
  title,
  heading = '评论',
  policyLabel = '隐私政策',
  submitLabel = '发送',
  emptyTitle = '还没有公开评论',
  emptySummary = '留下第一条反馈后，评论会直接出现在下方的公开评论流中。',
}: PostCommentsProps) {
  // Comments data
  const [comments, setComments] = useState<BlogComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [sortOrder, setSortOrder] = useState<'hot' | 'new'>('new');
  const [noticeText, setNoticeText] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Linuxdo interaction mode: 'comment' | 'emoji' (Boost is reserved for replying to others)
  const [activeMode, setActiveMode] = useState<'comment' | 'emoji'>('comment');

  // Main input state
  const [mainMessage, setMainMessage] = useState('');
  const [mainInputFocused, setMainInputFocused] = useState(false);
  const [quoteState, setQuoteState] = useState<CommentQuote | null>(null);

  // In-place reply state (YouTube style)
  const [replyingToCommentId, setReplyingToCommentId] = useState<string | null>(null);
  const [replyingTargetAuthor, setReplyingTargetAuthor] = useState<string>('');
  const [replyMode, setReplyMode] = useState<'comment' | 'boost'>('comment');
  const [replyMessage, setReplyMessage] = useState('');
  const [replySubmitting, setReplySubmitting] = useState(false);

  // Inline edit state
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingMessage, setEditingMessage] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

  // Accordion state (set of expanded root comment IDs)
  const [expandedReplies, setExpandedReplies] = useState<Set<string>>(() => new Set());
  const [expandedTexts, setExpandedTexts] = useState<Set<string>>(() => new Set());

  // Account identity
  const [account, setAccount] = useState<CommentIdentity | null>(null);

  // In-memory visitor session tokens map: { commentId -> sessionToken }
  const [visitorSessionTokens, setVisitorSessionTokens] = useState<Map<string, string>>(() => new Map());

  // Toast notification helper
  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setNoticeText({ text, type });
    setTimeout(() => setNoticeText(null), 3500);
  };

  useEffect(() => {
    setAccount(readCommentIdentity());

    const handleAccountChange = (event: Event) => {
      const detail = (event as CustomEvent<CommentIdentity | null>).detail ?? readCommentIdentity();
      setAccount(detail);
    };

    window.addEventListener('shijianus:comment-account-change', handleAccountChange);
    return () => {
      window.removeEventListener('shijianus:comment-account-change', handleAccountChange);
    };
  }, []);

  // Fetch real comments
  const loadComments = async (sort = sortOrder) => {
    setLoading(true);
    try {
      const data = await fetchComments(slug, sort);
      setComments(data);
    } catch (err) {
      console.warn('[PostComments] Load error:', err);
      setComments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadComments(sortOrder);
  }, [slug, sortOrder]);

  const canManage = (comment: BlogComment) => {
    if (account?.role === 'admin') return true;
    return visitorSessionTokens.has(comment.id);
  };

  const openAccountDrawer = () => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('shijianus:open-notifications'));
    }
  };

  const handleSortToggle = (newSort: 'hot' | 'new') => {
    if (newSort === sortOrder) return;
    setSortOrder(newSort);
  };

  const toggleReplies = (rootId: string) => {
    setExpandedReplies((prev) => {
      const next = new Set(prev);
      if (next.has(rootId)) {
        next.delete(rootId);
      } else {
        next.add(rootId);
      }
      return next;
    });
  };

  const toggleLongText = (commentId: string) => {
    setExpandedTexts((prev) => {
      const next = new Set(prev);
      if (next.has(commentId)) {
        next.delete(commentId);
      } else {
        next.add(commentId);
      }
      return next;
    });
  };

  // Main Submission (Normal Comment)
  const handleMainSubmit = async () => {
    const trimmed = mainMessage.trim();
    if (!trimmed) {
      showToast('请填写评论内容', 'error');
      return;
    }

    if (trimmed.length > COMMENT_LIMIT) {
      showToast(`评论内容不能超过 ${COMMENT_LIMIT} 字`, 'error');
      return;
    }

    setSubmitting(true);

    try {
      const res = await createComment({
        slug,
        message: trimmed,
        postType: 'comment',
        quote: quoteState,
        author: account,
      });

      if (res.ok && res.comment) {
        if (res.sessionToken && res.comment.id) {
          setVisitorSessionTokens((prev) => {
            const next = new Map(prev);
            next.set(res.comment!.id, res.sessionToken!);
            return next;
          });
        }

        setMainMessage('');
        setQuoteState(null);
        setMainInputFocused(false);
        showToast('评论已成功发布！', 'success');

        await loadComments();
      } else {
        showToast(res.error || '提交失败，请重试', 'error');
      }
    } catch {
      showToast('提交异常，请稍后重试', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Quick Emoji Reaction Post (Linuxdo style)
  const handleQuickEmoji = async (emoji: string) => {
    setSubmitting(true);
    try {
      const res = await createComment({
        slug,
        message: emoji,
        postType: 'emoji',
        author: account,
      });

      if (res.ok && res.comment) {
        if (res.sessionToken && res.comment.id) {
          setVisitorSessionTokens((prev) => {
            const next = new Map(prev);
            next.set(res.comment!.id, res.sessionToken!);
            return next;
          });
        }
        showToast(`表情互动 ${emoji} 已发送！`, 'success');
        await loadComments();
      } else {
        showToast(res.error || '表情发送失败', 'error');
      }
    } catch {
      showToast('发送异常，请稍后重试', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // In-place Reply Submission (Supports normal comment & 🚀 Boost modes)
  const handleReplySubmit = async (rootCommentId: string) => {
    const trimmed = replyMessage.trim();
    if (!trimmed) return;
    const currentLimit = replyMode === 'boost' ? BOOST_LIMIT : COMMENT_LIMIT;
    if (trimmed.length > currentLimit) {
      showToast(
        replyMode === 'boost'
          ? `🚀 Boost 回复不能超过 ${BOOST_LIMIT} 个字`
          : `回复内容不能超过 ${COMMENT_LIMIT} 字`,
        'error'
      );
      return;
    }

    setReplySubmitting(true);
    try {
      const res = await createComment({
        slug,
        message: trimmed,
        postType: replyMode,
        parentId: rootCommentId,
        author: account,
      });

      if (res.ok && res.comment) {
        if (res.sessionToken && res.comment.id) {
          setVisitorSessionTokens((prev) => {
            const next = new Map(prev);
            next.set(res.comment!.id, res.sessionToken!);
            return next;
          });
        }

        setReplyMessage('');
        setReplyingToCommentId(null);
        setReplyingTargetAuthor('');
        setReplyMode('comment'); // Always reset to default normal reply
        setExpandedReplies((prev) => new Set(prev).add(rootCommentId));
        showToast(replyMode === 'boost' ? '🚀 Boost 回复已成功发表！' : '回复已成功发表！', 'success');

        await loadComments();
      } else {
        showToast(res.error || '回复失败', 'error');
      }
    } catch {
      showToast('回复异常，请重试', 'error');
    } finally {
      setReplySubmitting(false);
    }
  };

  // Inline Edit Save
  const handleSaveEdit = async (commentId: string) => {
    const trimmed = editingMessage.trim();
    if (!trimmed) {
      showToast('修改内容不能为空', 'error');
      return;
    }

    const token = visitorSessionTokens.get(commentId) || '';
    setSavingEdit(true);
    try {
      const res = await editComment({
        id: commentId,
        message: trimmed,
        sessionToken: token,
      });

      if (res.ok) {
        setEditingCommentId(null);
        setEditingMessage('');
        showToast('评论修改成功！', 'success');
        await loadComments();
      } else {
        showToast(res.error || '修改失败', 'error');
      }
    } catch {
      showToast('修改请求异常', 'error');
    } finally {
      setSavingEdit(false);
    }
  };

  // Delete Comment
  const handleDelete = async (commentId: string) => {
    if (typeof window !== 'undefined' && !window.confirm('确定要删除这条内容吗？')) {
      return;
    }

    const token = visitorSessionTokens.get(commentId) || '';
    try {
      const res = await deleteComment({
        id: commentId,
        sessionToken: token,
      });

      if (res.ok) {
        setVisitorSessionTokens((prev) => {
          const next = new Map(prev);
          next.delete(commentId);
          return next;
        });
        showToast('内容已删除', 'success');
        await loadComments();
      } else {
        showToast(res.error || '删除失败', 'error');
      }
    } catch {
      showToast('删除请求异常', 'error');
    }
  };

  // Like
  const handleLike = async (commentId: string) => {
    try {
      const res = await likeComment(commentId);
      if (res.ok) {
        setComments((prev) =>
          prev.map((c) =>
            c.id === commentId
              ? { ...c, likesCount: res.likesCount ?? c.likesCount + 1 }
              : c
          )
        );
      }
    } catch {
      // silent
    }
  };

  // Trigger Quote
  const handleQuoteClick = (item: BlogComment) => {
    setQuoteState({
      id: item.id,
      authorName: item.authorName,
      text: item.message.slice(0, 120),
    });
    setMainInputFocused(true);
    document.querySelector('#post-comment')?.scrollIntoView({ behavior: 'smooth' });
  };

  // Build comment tree
  const commentTree = useMemo(() => {
    const roots: BlogComment[] = [];
    const replyMap = new Map<string, BlogComment[]>();

    comments.forEach((c) => {
      if (c.parentId) {
        const list = replyMap.get(c.parentId) || [];
        list.push(c);
        replyMap.set(c.parentId, list);
      } else {
        roots.push(c);
      }
    });

    return { roots, replyMap };
  }, [comments]);

  return (
    <div id="post-comment">
      {/* Header bar without comment-tips */}
      <div className="comment-head">
        <h3 className="comment-headline">
          <i className="anzhiyufont anzhiyu-icon-comments" aria-hidden="true"></i>
          <span>{heading}</span>
        </h3>
        <div className="comment-randomInfo">
          <a
            onClick={openAccountDrawer}
            title="前往账号中心登录或设置个性化资料"
            style={{ cursor: 'pointer' }}
          >
            {account ? `👤 ${account.name}` : '⚙️ 账号中心'}
          </a>
          <a
            href="/about"
            target="_blank"
            rel="noreferrer"
            title="阅读站点使用协议与隐私政策"
          >
            {policyLabel}
          </a>
        </div>
      </div>

      <div className="comment-wrap">
        <div className="twikoo tk-comments">
          {/* Main Input Box with Linuxdo multi-mode interactions */}
          <div className={`tk-submit ${mainInputFocused || mainMessage.trim() ? 'is-expanded' : ''}`}>
            {/* Linuxdo Mode Switcher Bar */}
            <div className="tk-mode-bar">
              <div className="tk-mode-tabs">
                <button
                  type="button"
                  className={`tk-mode-btn ${activeMode === 'comment' ? 'is-active' : ''}`}
                  onClick={() => setActiveMode('comment')}
                >
                  💬 评论
                </button>
                <button
                  type="button"
                  className={`tk-mode-btn ${activeMode === 'emoji' ? 'is-active' : ''}`}
                  onClick={() => setActiveMode('emoji')}
                  title="多 Emoji 快捷表情互动"
                >
                  😀 表情互动
                </button>
              </div>

              {account && (
                <span className="tk-user-logged-pill" onClick={openAccountDrawer}>
                  🌟 {account.name}
                </span>
              )}
            </div>

            {/* Quick Emoji Reaction Tray (when emoji mode is active) */}
            {activeMode === 'emoji' && (
              <div className="tk-emoji-tray">
                <span className="tk-emoji-tray-label">点击表情快速互动：</span>
                <div className="tk-emoji-list">
                  {QUICK_EMOJIS.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      className="tk-quick-emoji-btn"
                      disabled={submitting}
                      onClick={() => handleQuickEmoji(emoji)}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Standard Input Area */}
            {activeMode !== 'emoji' && (
              <div className="tk-row">
                <div
                  className="tk-avatar theme-account-drawer__summary-avatar"
                  onClick={openAccountDrawer}
                  title={account ? `已登录: ${account.name}` : '访客身份 (点击设置账号)'}
                  style={{ cursor: 'pointer' }}
                >
                  {account?.avatar ? (
                    <img src={account.avatar} alt={account.name} loading="lazy" />
                  ) : account?.name ? (
                    <span className="tk-avatar-initials">{getCommentInitials(account.name)}</span>
                  ) : (
                    <div className="tk-avatar-visitor-icon" title="访客">
                      <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
                        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                      </svg>
                    </div>
                  )}
                </div>

                <div className="tk-col">
                  {/* Quoted Source Preview Box */}
                  {quoteState && (
                    <div className="tk-quote-preview-card">
                      <div className="tk-quote-preview-meta">
                        <span>🔗 引用 <strong>@{quoteState.authorName}</strong> 的评论：</span>
                        <button type="button" onClick={() => setQuoteState(null)}>✕</button>
                      </div>
                      <p className="tk-quote-preview-text">{quoteState.text}</p>
                    </div>
                  )}

                  <div className="tk-input el-textarea">
                    <textarea
                      className="el-textarea__inner"
                      value={mainMessage}
                      onFocus={() => setMainInputFocused(true)}
                      onChange={(e) => setMainMessage(e.target.value.slice(0, COMMENT_LIMIT))}
                      placeholder={`围绕《${title}》发表公开评论... (支持 Markdown)`}
                      rows={mainInputFocused || mainMessage.trim() ? 4 : 2}
                    />
                    <span className="el-input__count">
                      {mainMessage.length}/{COMMENT_LIMIT}
                    </span>
                  </div>

                  {/* Actions row without tk-row-actions-start */}
                  {(mainInputFocused || mainMessage.trim().length > 0) && (
                    <div className="tk-row actions tk-actions-end-only">
                      <div className="tk-row-actions-end">
                        <button
                          type="button"
                          className="tk-btn-cancel"
                          onClick={() => {
                            setMainMessage('');
                            setQuoteState(null);
                            setMainInputFocused(false);
                          }}
                        >
                          取消
                        </button>
                        <button
                          type="button"
                          className="tk-send"
                          disabled={submitting || !mainMessage.trim()}
                          onClick={handleMainSubmit}
                        >
                          {submitting ? '发送中...' : submitLabel}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Global Notice Toast */}
            {noticeText && (
              <div className={`tk-global-toast is-${noticeText.type}`}>
                {noticeText.type === 'success' ? '✅' : '⚠️'} {noticeText.text}
              </div>
            )}
          </div>

          {/* Public Comments Stream */}
          <div className="tk-comments-container">
            <div className="tk-comments-title">
              <div className="tk-comments-count">
                <span>公开评论</span>
                <strong>({comments.length})</strong>
              </div>

              <div className="tk-sort-group">
                <button
                  type="button"
                  className={`tk-sort-btn ${sortOrder === 'new' ? 'is-active' : ''}`}
                  onClick={() => handleSortToggle('new')}
                >
                  ⏱️ 最新
                </button>
                <span className="tk-sort-divider">|</span>
                <button
                  type="button"
                  className={`tk-sort-btn ${sortOrder === 'hot' ? 'is-active' : ''}`}
                  onClick={() => handleSortToggle('hot')}
                >
                  🔥 最热
                </button>
              </div>
            </div>

            {loading ? (
              <div className="tk-comments-no">
                <span>正在加载评论...</span>
              </div>
            ) : comments.length === 0 ? (
              <div className="tk-comments-no">
                <div className="tk-comments-empty-icon" style={{ fontSize: '28px', opacity: 0.65 }}>💬</div>
                <span>{emptyTitle}，{emptySummary}</span>
              </div>
            ) : (
              <div className="tk-comments-list">
                {commentTree.roots.map((item) => {
                  const replies = commentTree.replyMap.get(item.id) || [];
                  const isEditing = editingCommentId === item.id;
                  const isManageable = canManage(item);
                  const isReplying = replyingToCommentId === item.id;
                  const areRepliesExpanded = expandedReplies.has(item.id);
                  const isTextExpanded = expandedTexts.has(item.id);
                  const isLongText = item.message.length > LONG_TEXT_THRESHOLD;
                  const edited = isEdited(item.createdAt, item.updatedAt);
                  const isBoost = item.postType === 'boost';

                  return (
                    <div className={`tk-comment ${isBoost ? 'is-boost-card' : ''}`} key={item.id} id={`comment-${item.id}`}>
                      {/* Avatar */}
                      <div className="tk-avatar theme-account-drawer__summary-avatar">
                        {item.authorAvatar ? (
                          <img src={item.authorAvatar} alt={item.authorName} loading="lazy" />
                        ) : item.authorRole === 'admin' ? (
                          <span className="tk-avatar-initials">博</span>
                        ) : item.authorName && item.authorName !== '访客' ? (
                          <span className="tk-avatar-initials">{getCommentInitials(item.authorName)}</span>
                        ) : (
                          <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                          </svg>
                        )}
                      </div>

                      {/* Comment Main */}
                      <div className="tk-main">
                        <div className="tk-row tk-meta">
                          <strong className="tk-nick">{item.authorName}</strong>

                          {/* Role Badge */}
                          <span
                            className={`tk-badge ${
                              item.status === 'pinned'
                                ? 'is-pinned'
                                : item.authorRole === 'admin'
                                ? 'is-admin'
                                : 'is-visitor'
                            }`}
                          >
                            {item.status === 'pinned'
                              ? '置顶'
                              : item.authorRole === 'admin'
                              ? '博主'
                              : '访客'}
                          </span>

                          {/* Country / IP Location badge (Forced for visitors, optional for logged users) */}
                          {item.ipCountryFlag && (
                            <span className="tk-geo-badge" title={`来源地区: ${item.ipCountryName || item.ipLocation}`}>
                              {item.ipCountryFlag} {item.ipCountryName || item.ipLocation}
                            </span>
                          )}

                          {/* Admin only: raw IP display */}
                          {item.ip && <span className="tk-admin-ip-badge">[{item.ip}]</span>}

                          {/* Boost Indicator Badge */}
                          {isBoost && (
                            <span className="tk-boost-pill">
                              <Rocket size={11} className="tk-boost-icon" />
                              <span>Boost</span>
                            </span>
                          )}

                          <time className="tk-time">{formatCommentTime(item.createdAt)}</time>
                          {edited && <span className="tk-edited-mark">(已编辑)</span>}
                        </div>

                        {/* Quoted Source Card if present */}
                        {item.quote && (
                          <div className="tk-quote-display-card">
                            <div className="tk-quote-display-author">
                              <span>🔗 引用 <strong>@{item.quote.authorName}</strong>：</span>
                            </div>
                            <p className="tk-quote-display-text">{item.quote.text}</p>
                          </div>
                        )}

                        {/* Content or Inline Edit */}
                        {isEditing ? (
                          <div className="tk-inline-edit">
                            <textarea
                              className="el-textarea__inner"
                              value={editingMessage}
                              onChange={(e) => setEditingMessage(e.target.value.slice(0, COMMENT_LIMIT))}
                              rows={3}
                            />
                            <div className="tk-inline-edit-actions">
                              <button
                                type="button"
                                className="tk-btn-save"
                                disabled={savingEdit || !editingMessage.trim()}
                                onClick={() => handleSaveEdit(item.id)}
                              >
                                {savingEdit ? '保存中...' : '保存'}
                              </button>
                              <button
                                type="button"
                                className="tk-btn-cancel"
                                onClick={() => setEditingCommentId(null)}
                              >
                                取消
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className={`tk-content ${isBoost ? 'is-boost-text' : ''} ${!isTextExpanded && isLongText ? 'is-clamped' : ''}`}>
                            {item.message.split(/\n+/).map((line, idx) => (
                              <p key={idx}>{line}</p>
                            ))}
                            {isLongText && (
                              <button
                                type="button"
                                className="tk-expand-text-btn"
                                onClick={() => toggleLongText(item.id)}
                              >
                                {isTextExpanded ? '收起' : '...展开全文'}
                              </button>
                            )}
                          </div>
                        )}

                        {/* Action Toolbar */}
                        <div className="tk-actions-group">
                          <button
                            type="button"
                            className="tk-action-btn tk-action-like"
                            onClick={() => handleLike(item.id)}
                            title="赞同这条想法"
                          >
                            👍 {item.likesCount > 0 ? item.likesCount : '赞'}
                          </button>
                          <button
                            type="button"
                            className={`tk-action-btn tk-action-reply ${isReplying && replyMode === 'comment' ? 'is-active' : ''}`}
                            onClick={() => {
                              if (isReplying && replyMode === 'comment') {
                                setReplyingToCommentId(null);
                                setReplyingTargetAuthor('');
                              } else {
                                setReplyingToCommentId(item.id);
                                setReplyingTargetAuthor(item.authorName);
                                setReplyMode('comment');
                                setReplyMessage('');
                              }
                            }}
                          >
                            💬 回复
                          </button>
                          <button
                            type="button"
                            className={`tk-action-btn tk-action-boost ${isReplying && replyMode === 'boost' ? 'is-active' : ''}`}
                            onClick={() => {
                              if (isReplying && replyMode === 'boost') {
                                setReplyingToCommentId(null);
                                setReplyingTargetAuthor('');
                                setReplyMode('comment');
                              } else {
                                setReplyingToCommentId(item.id);
                                setReplyingTargetAuthor(item.authorName);
                                setReplyMode('boost');
                                setReplyMessage('');
                              }
                            }}
                            title="发送 16 字以内的火箭 Boost 快速回复"
                          >
                            <Rocket size={13} className="tk-action-icon" />
                            <span>Boost</span>
                          </button>
                          <button
                            type="button"
                            className="tk-action-btn tk-action-quote"
                            onClick={() => handleQuoteClick(item)}
                            title="引用此条内容发表评论"
                          >
                            🔗 引用
                          </button>
                          {isManageable && (
                            <>
                              <button
                                type="button"
                                className="tk-action-btn tk-action-edit"
                                onClick={() => {
                                  setEditingCommentId(item.id);
                                  setEditingMessage(item.message);
                                }}
                              >
                                ✏️ 编辑
                              </button>
                              <button
                                type="button"
                                className="tk-action-btn tk-action-delete"
                                onClick={() => handleDelete(item.id)}
                              >
                                🗑️ 删除
                              </button>
                            </>
                          )}
                        </div>

                        {/* In-place Nested Reply Form */}
                        {isReplying && (
                          <div className={`tk-nested-reply-box ${replyMode === 'boost' ? 'is-boost-mode' : ''}`}>
                            <div className="tk-row">
                              <div className="tk-avatar tk-avatar-small theme-account-drawer__summary-avatar">
                                {account?.avatar ? (
                                  <img src={account.avatar} alt={account.name} />
                                ) : (
                                  <span>{getCommentInitials(account?.name || '访')}</span>
                                )}
                              </div>
                              <div className="tk-col">
                                {/* Reply Mode Header & Toggle */}
                                <div className="tk-reply-header-bar">
                                  {replyMode === 'boost' ? (
                                    <div className="tk-reply-boost-badge">
                                      <Rocket size={12} className="tk-boost-icon" />
                                      <span>火箭 Boost 回复模式 (≤16字)</span>
                                      <button
                                        type="button"
                                        className="tk-reply-mode-toggle"
                                        onClick={() => setReplyMode('comment')}
                                        title="切换回普通 500 字回复"
                                      >
                                        切换为普通回复
                                      </button>
                                    </div>
                                  ) : (
                                    <div className="tk-reply-hint-bar">
                                      <span className="tk-reply-to-text">回复 <strong>@{replyingTargetAuthor}</strong></span>
                                      <button
                                        type="button"
                                        className="tk-reply-mode-toggle tk-reply-mode-toggle-boost"
                                        onClick={() => setReplyMode('boost')}
                                        title="切换为 16 字快速火箭 Boost 回复"
                                      >
                                        <Rocket size={12} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '3px' }} />
                                        切换为 Boost (≤16字)
                                      </button>
                                    </div>
                                  )}
                                </div>

                                <div className="tk-input el-textarea">
                                  <textarea
                                    className={`el-textarea__inner ${replyMode === 'boost' ? 'is-boost-input' : ''}`}
                                    value={replyMessage}
                                    onChange={(e) => {
                                      const limit = replyMode === 'boost' ? BOOST_LIMIT : COMMENT_LIMIT;
                                      setReplyMessage(e.target.value.slice(0, limit));
                                    }}
                                    placeholder={
                                      replyMode === 'boost'
                                        ? `🚀 发表 16 字以内的 Boost 快速回复 @${replyingTargetAuthor}...`
                                        : `回复 @${replyingTargetAuthor}...`
                                    }
                                    rows={replyMode === 'boost' ? 2 : 3}
                                    autoFocus
                                  />
                                  <span className="el-input__count">
                                    {replyMessage.length}/{replyMode === 'boost' ? BOOST_LIMIT : COMMENT_LIMIT}
                                  </span>
                                </div>
                                <div className="tk-nested-reply-actions">
                                  <button
                                    type="button"
                                    className="tk-btn-cancel"
                                    onClick={() => {
                                      setReplyingToCommentId(null);
                                      setReplyingTargetAuthor('');
                                      setReplyMessage('');
                                      setReplyMode('comment');
                                    }}
                                  >
                                    取消
                                  </button>
                                  <button
                                    type="button"
                                    className={`tk-send tk-send-small ${replyMode === 'boost' ? 'is-boost-btn' : ''}`}
                                    disabled={replySubmitting || !replyMessage.trim()}
                                    onClick={() => handleReplySubmit(item.id)}
                                  >
                                    {replySubmitting
                                      ? '发送中...'
                                      : replyMode === 'boost'
                                      ? (
                                        <>
                                          <Rocket size={12} style={{ marginRight: '4px' }} />
                                          Boost
                                        </>
                                      )
                                      : '回复'}
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* YouTube-style Expandable Replies Accordion */}
                        {replies.length > 0 && (
                          <div className="tk-replies-section">
                            <button
                              type="button"
                              className="tk-replies-toggle-btn"
                              onClick={() => toggleReplies(item.id)}
                            >
                              <span className="tk-toggle-icon">
                                {areRepliesExpanded ? '▴' : '▾'}
                              </span>
                              <span>
                                {areRepliesExpanded
                                  ? `收起 ${replies.length} 条回复`
                                  : `查看 ${replies.length} 条回复`}
                              </span>
                            </button>

                            {areRepliesExpanded && (
                              <div className="tk-replies">
                                {replies.map((reply) => {
                                  const isReplyEditing = editingCommentId === reply.id;
                                  const isReplyManageable = canManage(reply);
                                  const isReplyEdited = isEdited(reply.createdAt, reply.updatedAt);
                                  const isReplyTextExpanded = expandedTexts.has(reply.id);
                                  const isReplyLong = reply.message.length > LONG_TEXT_THRESHOLD;
                                  const isReplyBoost = reply.postType === 'boost';

                                  return (
                                    <div className={`tk-comment tk-comment-reply ${isReplyBoost ? 'is-boost-card' : ''}`} key={reply.id} id={`comment-${reply.id}`}>
                                      <div className="tk-avatar tk-avatar-small theme-account-drawer__summary-avatar">
                                        {reply.authorAvatar ? (
                                          <img src={reply.authorAvatar} alt={reply.authorName} loading="lazy" />
                                        ) : reply.authorRole === 'admin' ? (
                                          <span className="tk-avatar-initials">博</span>
                                        ) : reply.authorName && reply.authorName !== '访客' ? (
                                          <span className="tk-avatar-initials">{getCommentInitials(reply.authorName)}</span>
                                        ) : (
                                          <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                                            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                                          </svg>
                                        )}
                                      </div>

                                      <div className="tk-main">
                                        <div className="tk-row tk-meta">
                                          <strong className="tk-nick">{reply.authorName}</strong>
                                          <span
                                            className={`tk-badge ${
                                              reply.authorRole === 'admin' ? 'is-admin' : 'is-visitor'
                                            }`}
                                          >
                                            {reply.authorRole === 'admin' ? '博主' : '访客'}
                                          </span>

                                          {/* Geo Flag Badge */}
                                          {reply.ipCountryFlag && (
                                            <span className="tk-geo-badge" title={`来源地区: ${reply.ipCountryName || reply.ipLocation}`}>
                                              {reply.ipCountryFlag} {reply.ipCountryName || reply.ipLocation}
                                            </span>
                                          )}

                                          {reply.ip && <span className="tk-admin-ip-badge">[{reply.ip}]</span>}
                                          {isReplyBoost && (
                                            <span className="tk-boost-pill">
                                              <Rocket size={11} className="tk-boost-icon" />
                                              <span>Boost</span>
                                            </span>
                                          )}

                                          <time className="tk-time">{formatCommentTime(reply.createdAt)}</time>
                                          {isReplyEdited && <span className="tk-edited-mark">(已编辑)</span>}
                                        </div>

                                        {isReplyEditing ? (
                                          <div className="tk-inline-edit">
                                            <textarea
                                              className="el-textarea__inner"
                                              value={editingMessage}
                                              onChange={(e) => setEditingMessage(e.target.value.slice(0, COMMENT_LIMIT))}
                                              rows={2}
                                            />
                                            <div className="tk-inline-edit-actions">
                                              <button
                                                type="button"
                                                className="tk-btn-save"
                                                disabled={savingEdit || !editingMessage.trim()}
                                                onClick={() => handleSaveEdit(reply.id)}
                                              >
                                                {savingEdit ? '保存中...' : '保存'}
                                              </button>
                                              <button
                                                type="button"
                                                className="tk-btn-cancel"
                                                onClick={() => setEditingCommentId(null)}
                                              >
                                                取消
                                              </button>
                                            </div>
                                          </div>
                                        ) : (
                                          <div className={`tk-content ${isReplyBoost ? 'is-boost-text' : ''} ${!isReplyTextExpanded && isReplyLong ? 'is-clamped' : ''}`}>
                                            {reply.message.split(/\n+/).map((line, idx) => (
                                              <p key={idx}>{line}</p>
                                            ))}
                                            {isReplyLong && (
                                              <button
                                                type="button"
                                                className="tk-expand-text-btn"
                                                onClick={() => toggleLongText(reply.id)}
                                              >
                                                {isReplyTextExpanded ? '收起' : '...展开全文'}
                                              </button>
                                            )}
                                          </div>
                                        )}

                                        <div className="tk-actions-group">
                                          <button
                                            type="button"
                                            className="tk-action-btn tk-action-like"
                                            onClick={() => handleLike(reply.id)}
                                          >
                                            👍 {reply.likesCount > 0 ? reply.likesCount : '赞'}
                                          </button>
                                          <button
                                            type="button"
                                            className="tk-action-btn tk-action-reply"
                                            onClick={() => {
                                              setReplyingToCommentId(item.id);
                                              setReplyingTargetAuthor(reply.authorName);
                                              setReplyMode('comment');
                                              setReplyMessage(`@${reply.authorName} `);
                                            }}
                                          >
                                            💬 回复
                                          </button>
                                          <button
                                            type="button"
                                            className="tk-action-btn tk-action-boost"
                                            title="发送 16 字以内的火箭 Boost 快速回复"
                                            onClick={() => {
                                              setReplyingToCommentId(item.id);
                                              setReplyingTargetAuthor(reply.authorName);
                                              setReplyMode('boost');
                                              setReplyMessage(`@${reply.authorName} `);
                                            }}
                                          >
                                            <Rocket size={13} className="tk-action-icon" />
                                            <span>Boost</span>
                                          </button>
                                          <button
                                            type="button"
                                            className="tk-action-btn tk-action-quote"
                                            onClick={() => handleQuoteClick(reply)}
                                          >
                                            🔗 引用
                                          </button>
                                          {isReplyManageable && (
                                            <>
                                              <button
                                                type="button"
                                                className="tk-action-btn tk-action-edit"
                                                onClick={() => {
                                                  setEditingCommentId(reply.id);
                                                  setEditingMessage(reply.message);
                                                }}
                                              >
                                                ✏️ 编辑
                                              </button>
                                              <button
                                                type="button"
                                                className="tk-action-btn tk-action-delete"
                                                onClick={() => handleDelete(reply.id)}
                                              >
                                                🗑️ 删除
                                              </button>
                                            </>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
