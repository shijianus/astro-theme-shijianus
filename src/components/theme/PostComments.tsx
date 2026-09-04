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

export function PostComments({
  slug,
  title,
  heading = '评论',
  policyLabel = '隐私政策',
  notice = '你无需删除空行，直接评论以获取最佳展示效果',
  submitLabel = '发送',
  previewLabel = '预览',
  emptyTitle = '还没有公开评论',
  emptySummary = '留下你的第一条想法吧～',
  tips = ['理性交流', '就事论事', '欢迎补充资料'],
  integration,
}: PostCommentsProps) {
  // Comment Thread State (strictly real data from Cloudflare D1 / API)
  const [comments, setComments] = useState<BlogComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [replyTarget, setReplyTarget] = useState<BlogComment | null>(null);
  const [quoteTarget, setQuoteTarget] = useState<BlogComment | null>(null);
  const [noticeText, setNoticeText] = useState('');

  // Account identity synchronized with ThemeOverlays account center
  const [account, setAccount] = useState<CommentIdentity | null>(null);

  // In-memory visitor session tokens map: { commentId -> sessionToken }
  // Only valid during this browser page instance; refreshes/clears upon page reload / env switch
  const [visitorSessionTokens, setVisitorSessionTokens] = useState<Map<string, string>>(() => new Map());

  // Inline editing state
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingMessage, setEditingMessage] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

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

  // Fetch real comments on mount and when slug changes
  const loadComments = async () => {
    setLoading(true);
    try {
      const data = await fetchComments(slug);
      setComments(data);
    } catch (err) {
      console.warn('[PostComments] Load error:', err);
      setComments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadComments();
  }, [slug]);

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

  // Handle Comment Submission
  const handleSubmit = async () => {
    const trimmed = message.trim();
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
        parentId: replyTarget?.id || null,
        quoteId: quoteTarget?.id || null,
        author: account,
      });

      if (res.ok && res.comment) {
        // Record the visitor sessionToken in-memory for this page visit
        if (res.sessionToken && res.comment.id) {
          setVisitorSessionTokens((prev) => {
            const next = new Map(prev);
            next.set(res.comment!.id, res.sessionToken!);
            return next;
          });
        }

        setMessage('');
        setReplyTarget(null);
        setQuoteTarget(null);
        setNoticeText('评论已发布');
        setTimeout(() => setNoticeText(''), 3000);

        // Refresh list
        await loadComments();
      } else {
        setNoticeText(res.error || '提交失败，请重试');
      }
    } catch (err: any) {
      setNoticeText('提交异常，请稍后重试');
    } finally {
      setSubmitting(false);
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

  // Comment Tree hierarchy builder (root comments with nested replies)
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
          {/* Submission Form without tk-meta-input */}
          <div className="tk-submit">
            <div className="tk-row">
              {/* tk-avatar: horizontally aligned with textarea, synced with account drawer */}
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

              {/* Main Input Column */}
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
                    value={message}
                    onChange={(e) => setMessage(e.target.value.slice(0, LIMIT))}
                    placeholder={`围绕《${title}》留下你的想法... (支持 Markdown)`}
                    rows={4}
                  />
                  <span className="el-input__count">
                    {message.length}/{LIMIT}
                  </span>
                </div>

                <div className="tk-row actions">
                  <div className="tk-row-actions-start">
                    {(replyTarget || quoteTarget) && (
                      <div className="tk-reply-banner">
                        <span>
                          {replyTarget
                            ? `回复 @${replyTarget.authorName}`
                            : `引用 @${quoteTarget?.authorName}`}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setReplyTarget(null);
                            setQuoteTarget(null);
                          }}
                          aria-label="取消回复"
                        >
                          ✕
                        </button>
                      </div>
                    )}
                    <span className="tk-submit-hint">💡 支持 Markdown 语法与换行</span>
                  </div>
                  <div className="tk-row-actions-end">
                    {noticeText && <span className="tk-notice-text">{noticeText}</span>}
                    <button
                      type="button"
                      className="tk-send"
                      disabled={submitting || !message.trim()}
                      onClick={handleSubmit}
                    >
                      {submitting ? '发送中...' : submitLabel}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Real Public Comments Stream - strictly NO fake mock comments */}
          <div className="tk-comments-container">
            <div className="tk-comments-title">
              <div className="tk-comments-count">
                <span>公开评论</span>
                <strong>({comments.length})</strong>
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
                          <div className="tk-content">
                            {item.message.split(/\n+/).map((line, idx) => (
                              <p key={idx}>{line}</p>
                            ))}
                          </div>
                        )}

                        {/* Action Toolbar */}
                        <div className="tk-actions-group">
                          <button
                            type="button"
                            className="tk-action-btn"
                            onClick={() => handleLike(item.id)}
                            title="赞同这条想法"
                          >
                            👍 {item.likesCount > 0 ? item.likesCount : '点赞'}
                          </button>
                          <button
                            type="button"
                            className="tk-action-btn"
                            onClick={() => {
                              setReplyTarget(item);
                              setQuoteTarget(null);
                              document.querySelector('#post-comment')?.scrollIntoView({ behavior: 'smooth' });
                            }}
                          >
                            回复
                          </button>
                          <button
                            type="button"
                            className="tk-action-btn"
                            onClick={() => {
                              setQuoteTarget(item);
                              setReplyTarget(null);
                              document.querySelector('#post-comment')?.scrollIntoView({ behavior: 'smooth' });
                            }}
                          >
                            引用
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
                                编辑
                              </button>
                              <button
                                type="button"
                                className="tk-action-btn tk-action-delete"
                                onClick={() => handleDelete(item.id)}
                              >
                                删除
                              </button>
                            </>
                          )}
                        </div>

                        {/* Replies */}
                        {replies.length > 0 && (
                          <div className="tk-replies">
                            {replies.map((reply) => {
                              const isReplyEditing = editingCommentId === reply.id;
                              const isReplyManageable = canManage(reply);

                              return (
                                <div className="tk-comment" key={reply.id} id={`comment-${reply.id}`}>
                                  <div className="tk-avatar theme-account-drawer__summary-avatar">
                                    {reply.authorAvatar ? (
                                      <img src={reply.authorAvatar} alt={reply.authorName} loading="lazy" />
                                    ) : reply.authorRole === 'admin' ? (
                                      <span className="tk-avatar-initials">博</span>
                                    ) : reply.authorName && reply.authorName !== '访客' ? (
                                      <span className="tk-avatar-initials">{getCommentInitials(reply.authorName)}</span>
                                    ) : (
                                      <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
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
                                    </div>

                                    {isReplyEditing ? (
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
                                      <div className="tk-content">
                                        {reply.message.split(/\n+/).map((line, idx) => (
                                          <p key={idx}>{line}</p>
                                        ))}
                                      </div>
                                    )}

                                    <div className="tk-actions-group">
                                      <button
                                        type="button"
                                        className="tk-action-btn"
                                        onClick={() => handleLike(reply.id)}
                                      >
                                        👍 {reply.likesCount > 0 ? reply.likesCount : '点赞'}
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
                                            编辑
                                          </button>
                                          <button
                                            type="button"
                                            className="tk-action-btn tk-action-delete"
                                            onClick={() => handleDelete(reply.id)}
                                          >
                                            删除
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
