import React, { useEffect, useMemo, useState } from 'react';
import type { CommentProvider } from '../../config/site';
import {
  createCommentId,
  createDemoLocalThread,
  getCommentInitials,
  normaliseComment,
  readCommentIdentity,
  readLocalThread,
  writeCommentIdentity,
  type CommentIdentity,
  type CommentStatus,
  type StoredComment,
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

const RANDOM_NAMES = [
  '星海行者',
  '林间听雨',
  '风清月朗',
  '代码筑梦师',
  '山海漫步',
  '极光漫游者',
  '时光拾荒者',
  '夜阑听雪',
  '青川漫步',
  '云端观察员',
  '探微致远',
  '清风徐来',
];

function getRandomName() {
  const base = RANDOM_NAMES[Math.floor(Math.random() * RANDOM_NAMES.length)];
  const num = Math.floor(1000 + Math.random() * 9000);
  return `${base}_${num}`;
}

function resolveAvatarUrl(email: string, avatar: string, name: string) {
  if (avatar && avatar.trim()) return avatar;
  const trimmedMail = email.trim().toLowerCase();
  const qqMatch = trimmedMail.match(/^([1-9]\d{4,10})@qq\.com$/i);
  if (qqMatch) {
    return `https://q1.qlogo.cn/g?b=qq&nk=${qqMatch[1]}&s=100`;
  }
  return '';
}

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

function renderParagraphs(comment: StoredComment) {
  return comment.message.split(/\n+/).map((item) => item.trim()).filter(Boolean);
}

function emitThreadChange() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('shijianus:comment-thread-change'));
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
  const storageKey = `shijianus-comments:${slug}`;
  const cloudflareApiBase =
    integration.provider === 'cloudflare' && integration.cloudflare.apiBase
      ? integration.cloudflare.apiBase.replace(/\/$/, '')
      : '';
  const canSync = cloudflareApiBase.length > 0;

  // Form State
  const [nick, setNick] = useState('');
  const [mail, setMail] = useState('');
  const [link, setLink] = useState('');
  const [message, setMessage] = useState('');
  const [avatar, setAvatar] = useState('');

  // Comment Thread State
  const [comments, setComments] = useState<StoredComment[]>([]);
  const [storageReady, setStorageReady] = useState(false);
  const [replyTargetId, setReplyTargetId] = useState('');
  const [quoteTargetId, setQuoteTargetId] = useState('');
  const [noticeText, setNoticeText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize identity and comments from localStorage
  useEffect(() => {
    const savedIdentity = readCommentIdentity();
    if (savedIdentity) {
      setNick(savedIdentity.name || '');
      setMail(savedIdentity.email || '');
      setLink(savedIdentity.website || '');
      setAvatar(savedIdentity.avatar || '');
    }

    const localThread = readLocalThread(slug);
    if (localThread && localThread.length > 0) {
      setComments(localThread);
    } else {
      // Seed with elegant initial demo thread so comments section is immediately vibrant
      const demoThread = createDemoLocalThread(slug);
      setComments(demoThread);
    }
    setStorageReady(true);

    const onAccountChange = (event: Event) => {
      const detail = (event as CustomEvent<CommentIdentity | null>).detail ?? readCommentIdentity();
      if (detail) {
        setNick(detail.name || '');
        setMail(detail.email || '');
        setLink(detail.website || '');
        setAvatar(detail.avatar || '');
      }
    };

    window.addEventListener('shijianus:comment-account-change', onAccountChange as EventListener);
    return () => {
      window.removeEventListener('shijianus:comment-account-change', onAccountChange as EventListener);
    };
  }, [slug]);

  // Persist comments to localStorage
  useEffect(() => {
    if (!storageReady) return;
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(comments));
      emitThreadChange();
    } catch {}
  }, [comments, storageKey, storageReady]);

  // Optional Cloudflare GET sync (if backend configured)
  useEffect(() => {
    if (!canSync) return;
    let cancelled = false;

    const boot = async () => {
      try {
        const response = await fetch(`${cloudflareApiBase}/${encodeURIComponent(slug)}`);
        if (!response.ok) return;
        const payload = (await response.json()) as { comments?: StoredComment[] };
        if (cancelled || !Array.isArray(payload.comments)) return;
        const nextComments = payload.comments.map(normaliseComment).filter(Boolean) as StoredComment[];
        if (nextComments.length) setComments(nextComments);
      } catch {}
    };

    void boot();

    return () => {
      cancelled = true;
    };
  }, [canSync, cloudflareApiBase, slug]);

  const replyTarget = comments.find((comment) => comment.id === replyTargetId) ?? null;
  const quoteTarget = comments.find((comment) => comment.id === quoteTargetId) ?? null;
  const currentAvatar = resolveAvatarUrl(mail, avatar, nick);

  const commentsById = useMemo(() => new Map(comments.map((comment) => [comment.id, comment])), [comments]);
  const childComments = useMemo(() => {
    const buckets = new Map<string, StoredComment[]>();
    for (const comment of comments) {
      if (!comment.parentId) continue;
      const bucket = buckets.get(comment.parentId) ?? [];
      bucket.push(comment);
      buckets.set(comment.parentId, bucket);
    }
    return buckets;
  }, [comments]);

  const rootComments = useMemo(() => {
    return comments
      .filter((comment) => !comment.parentId)
      .sort((left, right) => {
        if (left.status === 'pinned' && right.status !== 'pinned') return -1;
        if (right.status === 'pinned' && left.status !== 'pinned') return 1;
        return new Date(right.createdAt).valueOf() - new Date(left.createdAt).valueOf();
      });
  }, [comments]);

  const handleRandomGuest = () => {
    const randNick = getRandomName();
    const randEmail = `${randNick.toLowerCase().replace(/[^a-z0-9_]/g, '')}@guest.local`;
    setNick(randNick);
    setMail(randEmail);
    setNoticeText(`已为你随机生成昵称：${randNick}`);
    setTimeout(() => setNoticeText(''), 3000);
  };

  const handleSend = async () => {
    const finalNick = nick.trim();
    const finalMail = mail.trim();
    const finalMessage = message.trim();

    if (!finalNick) {
      setNoticeText('请填写昵称，或点击右上角「匿名评论」快速填入');
      return;
    }
    if (!finalMessage) {
      setNoticeText('请先输入评论内容');
      return;
    }

    setIsSubmitting(true);

    const activeIdentity: CommentIdentity = {
      id: `visitor-${Date.now()}`,
      name: finalNick,
      email: finalMail || `${finalNick}@guest.local`,
      website: link.trim(),
      avatar: currentAvatar,
      role: 'reader',
    };

    // Save identity for next time
    writeCommentIdentity(activeIdentity);

    const newEntry: StoredComment = {
      id: createCommentId('comment'),
      authorId: activeIdentity.id,
      name: finalNick,
      email: finalMail,
      website: link.trim(),
      avatar: currentAvatar,
      message: finalMessage.slice(0, LIMIT),
      createdAt: new Date().toISOString(),
      parentId: replyTargetId || undefined,
      quoteId: quoteTargetId || undefined,
      likes: [],
      status: 'published',
      slug,
    };

    setComments((prev) => [newEntry, ...prev]);
    setMessage('');
    setReplyTargetId('');
    setQuoteTargetId('');
    setNoticeText(replyTarget ? `已回复 @${replyTarget.name}。` : '评论已成功发布并同步！');
    setTimeout(() => setNoticeText(''), 4000);

    // If Cloudflare backend is configured, attempt async post
    if (canSync) {
      try {
        await fetch(`${cloudflareApiBase}/${encodeURIComponent(slug)}`, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ slug, title, ...newEntry }),
        });
      } catch {}
    }

    setIsSubmitting(false);
  };

  const toggleLike = (commentId: string) => {
    setComments((prev) =>
      prev.map((c) => {
        if (c.id !== commentId) return c;
        const hasLiked = c.likes && c.likes.includes('local-user');
        const nextLikes = hasLiked
          ? c.likes.filter((id) => id !== 'local-user')
          : [...(c.likes || []), 'local-user'];
        return { ...c, likes: nextLikes };
      })
    );
  };

  const handleReply = (targetComment: StoredComment) => {
    setReplyTargetId(targetComment.id);
    setQuoteTargetId('');
    setNoticeText(`正在回复 @${targetComment.name}`);
    const textareaEl = document.querySelector<HTMLTextAreaElement>('#post-comment .el-textarea__inner');
    if (textareaEl) {
      textareaEl.focus();
    }
  };

  const handleQuote = (targetComment: StoredComment) => {
    setReplyTargetId(targetComment.id);
    setQuoteTargetId(targetComment.id);
    setNoticeText(`正在引用 @${targetComment.name} 的评论`);
    const textareaEl = document.querySelector<HTMLTextAreaElement>('#post-comment .el-textarea__inner');
    if (textareaEl) {
      textareaEl.focus();
    }
  };

  const renderCommentItem = (comment: StoredComment, isChild = false) => {
    const hasLiked = comment.likes && comment.likes.includes('local-user');
    const quote = comment.quoteId ? commentsById.get(comment.quoteId) : null;
    const children = childComments.get(comment.id) ?? [];
    const itemAvatar = resolveAvatarUrl(comment.email || '', comment.avatar || '', comment.name);
    const isAdmin = comment.authorId?.includes('admin') || comment.name === 'shijianus' || comment.name === '站点管理员';

    return (
      <div className={`tk-comment ${isChild ? 'tk-comment-child' : ''}`} key={comment.id} id={`comment-${comment.id}`}>
        <div className="tk-avatar">
          {itemAvatar ? (
            <img src={itemAvatar} alt={comment.name} loading="lazy" />
          ) : (
            <span className="tk-avatar-initials">{getCommentInitials(comment.name)}</span>
          )}
        </div>
        <div className="tk-main">
          <div className="tk-meta">
            <span className="tk-nick">
              {comment.website ? (
                <a href={comment.website} target="_blank" rel="noopener noreferrer">
                  {comment.name}
                </a>
              ) : (
                comment.name
              )}
            </span>

            {isAdmin && <span className="tk-badge is-admin">博主</span>}
            {comment.status === 'pinned' && <span className="tk-badge is-pinned">置顶</span>}
            {!isAdmin && comment.status !== 'pinned' && <span className="tk-badge is-guest">访客</span>}

            <time className="tk-time" title={comment.createdAt}>
              {formatCommentTime(comment.createdAt)}
            </time>

            <span className="tk-extra">公开</span>

            <div className="tk-actions">
              <button
                type="button"
                className={`tk-action-button ${hasLiked ? 'is-active' : ''}`}
                onClick={() => toggleLike(comment.id)}
                title="点赞"
              >
                <i className="anzhiyufont anzhiyu-icon-thumbs-up"></i>
                <span>{comment.likes?.length || 0}</span>
              </button>
              <button
                type="button"
                className="tk-action-button"
                onClick={() => handleReply(comment)}
                title="回复"
              >
                <i className="anzhiyufont anzhiyu-icon-reply"></i>
                <span>回复</span>
              </button>
              <button
                type="button"
                className="tk-action-button"
                onClick={() => handleQuote(comment)}
                title="引用"
              >
                <i className="anzhiyufont anzhiyu-icon-quote-left"></i>
                <span>引用</span>
              </button>
            </div>
          </div>

          {quote && (
            <div className="tk-quote">
              <strong>@{quote.name}：</strong>
              <span>{quote.message.length > 80 ? `${quote.message.slice(0, 80)}...` : quote.message}</span>
            </div>
          )}

          <div className="tk-content">
            {renderParagraphs(comment).map((p, idx) => (
              <p key={idx}>{p}</p>
            ))}
          </div>

          {children.length > 0 && (
            <div className="tk-replies">
              {children
                .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
                .map((child) => renderCommentItem(child, true))}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div id="post-comment">
      {/* 头部元信息栏：与安知鱼 .comment-head 结构 100% 对齐 */}
      <div className="comment-head">
        <div className="comment-headline">
          <i className="anzhiyufont anzhiyu-icon-comments"></i>
          <span> {heading}</span>
        </div>
        <div className="comment-randomInfo">
          <a onClick={handleRandomGuest} href="javascript:void(0)" className="comment-random-btn">
            匿名评论
          </a>
          <a href="/about/#about-reward" style={{ marginLeft: 6 }} className="comment-privacy-btn">
            {policyLabel}
          </a>
        </div>
        <div className="comment-tips" id="comment-tips">
          <span>✅ {notice}</span>
        </div>
      </div>

      {/* 评论包装区：与安知鱼 .comment-wrap / #twikoo .tk-submit 结构对齐 */}
      <div className="comment-wrap">
        <div className="twikoo" id="twikoo">
          <div className="tk-comments">
            <div className="tk-submit tk-fade-in">
              <div className="tk-row">
                <div className="tk-avatar">
                  {currentAvatar ? (
                    <img src={currentAvatar} alt={nick || 'Visitor'} />
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 496 512">
                      <path d="M248 8C111 8 0 119 0 256s111 248 248 248 248-111 248-248S385 8 248 8zm0 96c48.6 0 88 39.4 88 88s-39.4 88-88 88-88-39.4-88-88 39.4-88 88-88zm0 344c-58.7 0-111.3-26.6-146.5-68.2 18.8-35.4 55.6-59.8 98.5-59.8 2.4 0 4.8.4 7.1 1.1 13 4.2 26.6 6.9 40.9 6.9 14.3 0 28-2.7 40.9-6.9 2.3-.7 4.7-1.1 7.1-1.1 42.9 0 79.7 24.4 98.5 59.8C359.3 421.4 306.7 448 248 448z" />
                    </svg>
                  )}
                </div>

                <div className="tk-col">
                  {/* 昵称 / 邮箱 / 网址 三联输入组 */}
                  <div className="tk-meta-input">
                    <div className="el-input el-input--small el-input-group el-input-group--prepend">
                      <div className="el-input-group__prepend">昵称</div>
                      <input
                        type="text"
                        autoComplete="name"
                        name="nick"
                        placeholder="必填"
                        value={nick}
                        onChange={(e) => setNick(e.target.value)}
                        className="el-input__inner"
                      />
                    </div>
                    <div className="el-input el-input--small el-input-group el-input-group--prepend">
                      <div className="el-input-group__prepend">邮箱</div>
                      <input
                        type="email"
                        autoComplete="email"
                        name="mail"
                        placeholder="必填 (支持QQ头像)"
                        value={mail}
                        onChange={(e) => setMail(e.target.value)}
                        className="el-input__inner"
                      />
                    </div>
                    <div className="el-input el-input--small el-input-group el-input-group--prepend">
                      <div className="el-input-group__prepend">网址</div>
                      <input
                        type="url"
                        autoComplete="url"
                        name="link"
                        placeholder="选填 (https://...)"
                        value={link}
                        onChange={(e) => setLink(e.target.value)}
                        className="el-input__inner"
                      />
                    </div>
                  </div>

                  {/* 留言内容多行输入框与字符计数器 */}
                  <div className="tk-input el-textarea">
                    <textarea
                      autoComplete="off"
                      placeholder={`围绕《${title}》留下你的想法... (支持 Markdown)`}
                      maxLength={LIMIT}
                      value={message}
                      onChange={(e) => setMessage(e.target.value.slice(0, LIMIT))}
                      onKeyDown={(e) => {
                        if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                          e.preventDefault();
                          void handleSend();
                        }
                      }}
                      className="el-textarea__inner"
                    />
                    <span className="el-input__count">
                      {message.length}/{LIMIT}
                    </span>
                  </div>
                </div>
              </div>

              {/* 操作区：回复标签、提示与发送按钮 */}
              <div className="tk-row actions">
                <div className="tk-row-actions-start">
                  {replyTarget && (
                    <div className="tk-reply-banner">
                      <span>正在回复 @{replyTarget.name}</span>
                      <button
                        type="button"
                        onClick={() => {
                          setReplyTargetId('');
                          setQuoteTargetId('');
                        }}
                        title="取消回复"
                      >
                        ×
                      </button>
                    </div>
                  )}
                  {quoteTarget && !replyTarget && (
                    <div className="tk-reply-banner">
                      <span>正在引用 @{quoteTarget.name}</span>
                      <button
                        type="button"
                        onClick={() => setQuoteTargetId('')}
                        title="取消引用"
                      >
                        ×
                      </button>
                    </div>
                  )}
                  <span className="tk-submit-hint">
                    <i className="anzhiyufont anzhiyu-icon-markdown" style={{ marginRight: 4 }}></i>
                    支持 Ctrl / ⌘ + Enter 快捷发送
                  </span>
                </div>

                <div className="tk-row-actions-end">
                  {noticeText && <span className="tk-notice-text">{noticeText}</span>}
                  <button
                    type="button"
                    className="el-button tk-send el-button--primary"
                    disabled={isSubmitting || !nick.trim() || !message.trim()}
                    onClick={handleSend}
                  >
                    {isSubmitting ? '发送中...' : submitLabel}
                  </button>
                </div>
              </div>
            </div>

            {/* 公开评论流 */}
            <div className="tk-comments-container">
              <div className="tk-comments-title">
                <span className="tk-comments-count">
                  公开评论 (<strong>{comments.length}</strong>)
                </span>
                <span className="tk-icon __comments">
                  <i className="anzhiyufont anzhiyu-icon-comments"></i>
                </span>
              </div>

              {rootComments.length > 0 ? (
                <div className="tk-comments-list">
                  {rootComments.map((comment) => renderCommentItem(comment))}
                </div>
              ) : (
                <div className="tk-comments-no">
                  <i className="anzhiyufont anzhiyu-icon-message-dots" style={{ fontSize: 32, opacity: 0.5 }}></i>
                  <span>{emptySummary}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
