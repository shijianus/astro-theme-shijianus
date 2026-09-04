import React, { useEffect, useMemo, useState } from 'react';
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
  notice?: string;
  submitLabel?: string;
  previewLabel?: string;
  emptyTitle?: string;
  emptySummary?: string;
  tips?: string[];
  integration: CommentsIntegrationConfig;
};

const LIMIT = 500;
const LONG_TEXT_THRESHOLD = 240;

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
    return uTime - cTime > 3000; // > 3 seconds difference
  } catch {
    return false;
  }
}

export function PostComments({
  slug,
  title,
  heading = '评论',
  policyLabel = '隐私政策',
  notice = '你无需删除空行，直接评论以获取最佳展示效果',
  submitLabel = '发送',
  previewLabel = '预览',
  emptyTitle = '还没有公开评论',
  emptySummary = '留下第一条反馈后，评论会直接出现在下方的公开评论流中。',
  tips = ['理性交流', '就事论事', '欢迎补充资料'],
  integration,
}: PostCommentsProps) {
  // Comments data state
  const [comments, setComments] = useState<BlogComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [sortOrder, setSortOrder] = useState<'hot' | 'new'>('new');
  const [noticeText, setNoticeText] = useState('');

  // Main input state
  const [mainMessage, setMainMessage] = useState('');
  const [mainInputFocused, setMainInputFocused] = useState(false);

  // In-place reply state (YouTube style: reply box opens right under the target comment)
  const [replyingToCommentId, setReplyingToCommentId] = useState<string | null>(null);
  const [replyingTargetAuthor, setReplyingTargetAuthor] = useState<string>('');
  const [replyMessage, setReplyMessage] = useState('');
  const [replySubmitting, setReplySubmitting] = useState(false);

  // In-place inline edit state
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingMessage, setEditingMessage] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

  // Expanded replies state (YouTube style: set of root comment IDs whose replies are expanded)
  const [expandedReplies, setExpandedReplies] = useState<Set<string>>(() => new Set());

  // Expanded long text state (set of comment IDs with text expanded)
  const [expandedTexts, setExpandedTexts] = useState<Set<string>>(() => new Set());

  // Account identity synchronized with ThemeOverlays account center
  const [account, setAccount] = useState<CommentIdentity | null>(null);

  // In-memory visitor session tokens map: { commentId -> sessionToken }
  // Only valid during this browser page instance; refreshes/clears upon page reload / env switch
  const [visitorSessionTokens, setVisitorSessionTokens] = useState<Map<string, string>>(() => new Map());

  // Synchronize account info from localStorage & listen for account changes
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

  // Fetch real comments from D1 / API
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

  // Check if current user can edit/delete this comment
  const canManage = (comment: BlogComment) => {
    if (account?.role === 'admin') return true;
    return visitorSessionTokens.has(comment.id);
  };

  // Open the global account drawer
  const openAccountDrawer = () => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('shijianus:open-notifications'));
    }
  };

  // Toggle sort order
  const handleSortToggle = (newSort: 'hot' | 'new') => {
    if (newSort === sortOrder) return;
    setSortOrder(newSort);
  };

  // Toggle replies accordion for a root comment (YouTube style)
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

  // Toggle long text expand/collapse
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

  // Handle Main Comment Submission
  const handleMainSubmit = async () => {
    const trimmed = mainMessage.trim();
    if (!trimmed) {
      setNoticeText('请填写评论内容');
      return;
    }
    if (trimmed.length > LIMIT) {
      setNoticeText(`评论内容不能超过 ${LIMIT} 字`);
      return;
    }

    setSubmitting(true);
    setNoticeText('');

    try {
      const res = await createComment({
        slug,
        message: trimmed,
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
        setMainInputFocused(false);
        setNoticeText('评论已发布');
        setTimeout(() => setNoticeText(''), 3000);

        await loadComments();
      } else {
        setNoticeText(res.error || '提交失败，请重试');
      }
    } catch {
      setNoticeText('提交异常，请稍后重试');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle In-place Reply Submission (YouTube style)
  const handleReplySubmit = async (rootCommentId: string, replyToName: string) => {
    const trimmed = replyMessage.trim();
    if (!trimmed) return;
    if (trimmed.length > LIMIT) {
      setNoticeText(`回复内容不能超过 ${LIMIT} 字`);
      return;
    }

    setReplySubmitting(true);
    try {
      const res = await createComment({
        slug,
        message: trimmed,
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
        // Automatically expand the replies section so user sees their reply
        setExpandedReplies((prev) => new Set(prev).add(rootCommentId));
        setNoticeText('回复已发布');
        setTimeout(() => setNoticeText(''), 3000);

        await loadComments();
      } else {
        setNoticeText(res.error || '回复失败');
      }
    } catch {
      setNoticeText('回复异常，请重试');
    } finally {
      setReplySubmitting(false);
    }
  };

  // Handle Inline Edit Save
  const handleSaveEdit = async (commentId: string) => {
    const trimmed = editingMessage.trim();
    if (!trimmed) {
      setNoticeText('修改内容不能为空');
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
        setNoticeText('评论修改成功');
        setTimeout(() => setNoticeText(''), 3000);
        await loadComments();
      } else {
        setNoticeText(res.error || '修改失败');
      }
    } catch {
      setNoticeText('修改请求异常');
    } finally {
      setSavingEdit(false);
    }
  };

  // Handle Comment Delete
  const handleDelete = async (commentId: string) => {
    if (typeof window !== 'undefined' && !window.confirm('确定要删除这条评论吗？')) {
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
        setNoticeText('评论已删除');
        setTimeout(() => setNoticeText(''), 3000);
        await loadComments();
      } else {
        setNoticeText(res.error || '删除失败');
      }
    } catch {
      setNoticeText('删除请求异常');
    }
  };

  // Handle Like
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

  // Build root comments and nested replies tree
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
      {/* Header bar */}
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
        <div className="comment-tips">
          <span>✅ {notice}</span>
        </div>
      </div>

      <div className="comment-wrap">
        <div className="twikoo tk-comments">
          {/* Main Comment Submission Box (YouTube + Anzhiyu style) */}
          <div className={`tk-submit ${mainInputFocused || mainMessage.trim() ? 'is-expanded' : ''}`}>
            <div className="tk-row">
              {/* Avatar synced with account drawer */}
              <div
                className="tk-avatar theme-account-drawer__summary-avatar"
                onClick={openAccountDrawer}
                title={account ? `已登录: ${account.name} (点击修改资料)` : '当前为访客模式 (点击前往账号中心)'}
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

              {/* Input column */}
              <div className="tk-col">
                <div className="tk-user-identity">
                  <span className="tk-user-badge">
                    {account ? `🌟 ${account.name}` : '👤 访客 (未登录)'}
                  </span>
                  <button
                    type="button"
                    className="tk-user-switch-btn"
                    onClick={openAccountDrawer}
                  >
                    {account ? '修改资料 / 切换账号' : '登录 / 注册'}
                  </button>
                </div>

                <div className="tk-input el-textarea">
                  <textarea
                    className="el-textarea__inner"
                    value={mainMessage}
                    onFocus={() => setMainInputFocused(true)}
                    onChange={(e) => setMainMessage(e.target.value.slice(0, LIMIT))}
                    placeholder={`围绕《${title}》发表公开评论... (支持 Markdown)`}
                    rows={mainInputFocused || mainMessage.trim() ? 4 : 2}
                  />
                  <span className="el-input__count">
                    {mainMessage.length}/{LIMIT}
                  </span>
                </div>

                {/* Actions row - visible when focused or typing */}
                {(mainInputFocused || mainMessage.trim().length > 0) && (
                  <div className="tk-row actions">
                    <div className="tk-row-actions-start">
                      <span className="tk-submit-hint">💡 支持 Markdown 与换行</span>
                    </div>
                    <div className="tk-row-actions-end">
                      {noticeText && <span className="tk-notice-text">{noticeText}</span>}
                      <button
                        type="button"
                        className="tk-btn-cancel"
                        onClick={() => {
                          setMainMessage('');
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
          </div>

          {/* Public Comments Stream (YouTube-style sorting and tiered replies) */}
          <div className="tk-comments-container">
            {/* Top Toolbar: Count & Sort Toggle */}
            <div className="tk-comments-title">
              <div className="tk-comments-count">
                <span>公开评论</span>
                <strong>({comments.length})</strong>
              </div>

              {/* YouTube-style Sort Menu */}
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

                  return (
                    <div className="tk-comment" key={item.id} id={`comment-${item.id}`}>
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
                          <time className="tk-time">{formatCommentTime(item.createdAt)}</time>
                          {edited && <span className="tk-edited-mark">(已编辑)</span>}
                        </div>

                        {/* Content or Inline Edit */}
                        {isEditing ? (
                          <div className="tk-inline-edit">
                            <textarea
                              className="el-textarea__inner"
                              value={editingMessage}
                              onChange={(e) => setEditingMessage(e.target.value.slice(0, LIMIT))}
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
                          <div className={`tk-content ${!isTextExpanded && isLongText ? 'is-clamped' : ''}`}>
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

                        {/* Action Toolbar (YouTube style) */}
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
                            className="tk-action-btn tk-action-reply"
                            onClick={() => {
                              if (isReplying) {
                                setReplyingToCommentId(null);
                                setReplyingTargetAuthor('');
                              } else {
                                setReplyingToCommentId(item.id);
                                setReplyingTargetAuthor(item.authorName);
                                setReplyMessage('');
                              }
                            }}
                          >
                            💬 回复
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

                        {/* In-place Nested Reply Form (YouTube style) */}
                        {isReplying && (
                          <div className="tk-nested-reply-box">
                            <div className="tk-row">
                              <div className="tk-avatar tk-avatar-small theme-account-drawer__summary-avatar">
                                {account?.avatar ? (
                                  <img src={account.avatar} alt={account.name} />
                                ) : (
                                  <span>{getCommentInitials(account?.name || '访')}</span>
                                )}
                              </div>
                              <div className="tk-col">
                                <div className="tk-input el-textarea">
                                  <textarea
                                    className="el-textarea__inner"
                                    value={replyMessage}
                                    onChange={(e) => setReplyMessage(e.target.value.slice(0, LIMIT))}
                                    placeholder={`回复 @${replyingTargetAuthor}...`}
                                    rows={2}
                                    autoFocus
                                  />
                                </div>
                                <div className="tk-nested-reply-actions">
                                  <button
                                    type="button"
                                    className="tk-btn-cancel"
                                    onClick={() => {
                                      setReplyingToCommentId(null);
                                      setReplyingTargetAuthor('');
                                      setReplyMessage('');
                                    }}
                                  >
                                    取消
                                  </button>
                                  <button
                                    type="button"
                                    className="tk-send tk-send-small"
                                    disabled={replySubmitting || !replyMessage.trim()}
                                    onClick={() => handleReplySubmit(item.id, replyingTargetAuthor)}
                                  >
                                    {replySubmitting ? '发送中...' : '回复'}
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* YouTube-style Expandable Replies Button (`▾ 查看 X 条回复` / `▴ 收起回复`) */}
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

                            {/* Nested Replies Stream */}
                            {areRepliesExpanded && (
                              <div className="tk-replies">
                                {replies.map((reply) => {
                                  const isReplyEditing = editingCommentId === reply.id;
                                  const isReplyManageable = canManage(reply);
                                  const isReplyEdited = isEdited(reply.createdAt, reply.updatedAt);
                                  const isReplyTextExpanded = expandedTexts.has(reply.id);
                                  const isReplyLong = reply.message.length > LONG_TEXT_THRESHOLD;

                                  return (
                                    <div className="tk-comment tk-comment-reply" key={reply.id} id={`comment-${reply.id}`}>
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
                                          <time className="tk-time">{formatCommentTime(reply.createdAt)}</time>
                                          {isReplyEdited && <span className="tk-edited-mark">(已编辑)</span>}
                                        </div>

                                        {isReplyEditing ? (
                                          <div className="tk-inline-edit">
                                            <textarea
                                              className="el-textarea__inner"
                                              value={editingMessage}
                                              onChange={(e) => setEditingMessage(e.target.value.slice(0, LIMIT))}
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
                                          <div className={`tk-content ${!isReplyTextExpanded && isReplyLong ? 'is-clamped' : ''}`}>
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
                                              setReplyMessage(`@${reply.authorName} `);
                                            }}
                                          >
                                            💬 回复
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
