import React, { useEffect, useMemo, useState } from 'react';
import type { CommentProvider } from '../../config/site';
import {
  createDemoLocalThread,
  createCommentId,
  createPresetCommentIdentity,
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
  heading: string;
  policyLabel: string;
  notice: string;
  submitLabel: string;
  previewLabel: string;
  emptyTitle: string;
  emptySummary: string;
  tips: string[];
  integration: CommentsIntegrationConfig;
};

type CommentForm = {
  message: string;
};

const LIMIT = 500;

function formatCommentTime(value: string) {
  try {
    return new Date(value).toLocaleString('zh-CN');
  } catch {
    return value;
  }
}

function renderParagraphs(comment: StoredComment) {
  return comment.message.split(/\n+/).map((item) => item.trim()).filter(Boolean);
}

function emitThreadChange() {
  window.dispatchEvent(new CustomEvent('shijianus:comment-thread-change'));
}

export function PostComments({
  slug,
  title,
  heading,
  policyLabel,
  notice,
  submitLabel,
  previewLabel,
  emptyTitle,
  emptySummary,
  tips,
  integration,
}: PostCommentsProps) {
  const storageKey = `shijianus-comments:${slug}`;
  const cloudflareApiBase =
    integration.provider === 'cloudflare' && integration.cloudflare.apiBase
      ? integration.cloudflare.apiBase.replace(/\/$/, '')
      : '';
  const canSync = cloudflareApiBase.length > 0;
  const localTestingEnabled = integration.provider === 'local' || integration.fallback === 'local';

  const [identity, setIdentity] = useState<CommentIdentity | null>(null);
  const [comments, setComments] = useState<StoredComment[]>([]);
  const [storageReady, setStorageReady] = useState(false);
  const [preview, setPreview] = useState(false);
  const [form, setForm] = useState<CommentForm>({ message: '' });
  const [replyTargetId, setReplyTargetId] = useState('');
  const [quoteTargetId, setQuoteTargetId] = useState('');
  const [noticeText, setNoticeText] = useState('');

  const isAdmin = identity?.role === 'admin';
  const replyTarget = comments.find((comment) => comment.id === replyTargetId) ?? null;
  const quoteTarget = comments.find((comment) => comment.id === quoteTargetId) ?? null;
  const remaining = LIMIT - form.message.length;
  const canSubmit = Boolean(identity && form.message.trim().length > 0);

  useEffect(() => {
    const syncIdentity = () => {
      setIdentity(readCommentIdentity());
    };

    syncIdentity();
    setComments(readLocalThread(slug));
    setStorageReady(true);

    const onAccountChange = (event: Event) => {
      const detail = (event as CustomEvent<CommentIdentity | null>).detail ?? readCommentIdentity();
      setIdentity(detail);
    };

    window.addEventListener('shijianus:comment-account-change', onAccountChange as EventListener);
    window.addEventListener('storage', syncIdentity);

    return () => {
      window.removeEventListener('shijianus:comment-account-change', onAccountChange as EventListener);
      window.removeEventListener('storage', syncIdentity);
    };
  }, [slug]);

  useEffect(() => {
    if (!storageReady) return;
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(comments));
      emitThreadChange();
    } catch {}
  }, [comments, storageKey, storageReady]);

  useEffect(() => {
    if (!canSync) return;
    let cancelled = false;

    const boot = async () => {
      try {
        const response = await fetch(`${cloudflareApiBase}/${encodeURIComponent(slug)}`);
        if (!response.ok) throw new Error(`comments GET failed: ${response.status}`);
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

  const previewParagraphs = useMemo(
    () => form.message.split(/\n+/).map((item) => item.trim()).filter(Boolean),
    [form.message],
  );

  const requestAccount = () => {
    setNoticeText('需要先创建一个账号后才能评论。');
    window.dispatchEvent(new CustomEvent('shijianus:comment-account-required'));
  };

  const usePresetAccount = (role: 'admin' | 'reader') => {
    const preset = createPresetCommentIdentity(role);
    writeCommentIdentity(preset);
    setNoticeText(
      role === 'admin'
        ? '已切换到管理员测试账号。建议先验证置顶、限制、编辑、删除、追评和引用流程。'
        : '已切换到读者测试账号。现在可以复查普通访客的评论、点赞和追评体验。',
    );
  };

  const loadDemoComments = () => {
    const demoComments = createDemoLocalThread(slug);

    setComments((current) => {
      const demoIds = new Set(demoComments.map((comment) => comment.id));
      const preservedComments = current.filter((comment) => !demoIds.has(comment.id));
      return [...demoComments, ...preservedComments];
    });
    setReplyTargetId('');
    setQuoteTargetId('');
    setPreview(false);
    setNoticeText('已填充演示评论。推荐先使用管理员测试账号走完整套管理动作。');
  };

  const clearLocalComments = () => {
    if (comments.length === 0) {
      setNoticeText('当前文章还没有本地评论可清空。');
      return;
    }

    if (!window.confirm('确认清空当前文章的本地评论线程吗？')) return;

    setComments([]);
    setReplyTargetId('');
    setQuoteTargetId('');
    setPreview(false);
    setNoticeText('当前文章的本地评论线程已清空。');
  };

  const syncComment = async (entry: StoredComment) => {
    if (!canSync) return;
    try {
      await fetch(`${cloudflareApiBase}/${encodeURIComponent(slug)}`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          slug,
          title,
          ...entry,
        }),
      });
    } catch {}
  };

  const submit = async () => {
    if (!identity) {
      requestAccount();
      return;
    }

    if (!canSubmit) return;

    const entry: StoredComment = {
      id: createCommentId('comment'),
      authorId: identity.id,
      name: identity.name,
      email: identity.email,
      website: identity.website,
      avatar: identity.avatar,
      message: form.message.trim(),
      createdAt: new Date().toISOString(),
      parentId: replyTargetId || undefined,
      quoteId: quoteTargetId || undefined,
      likes: [],
      status: 'published',
    };

    setComments((current) => [entry, ...current]);
    setForm({ message: '' });
    setPreview(false);
    setReplyTargetId('');
    setQuoteTargetId('');
    setNoticeText(replyTarget ? `已回复 @${replyTarget.name}。` : '评论已发布。');
    await syncComment(entry);
  };

  const updateComment = (id: string, updater: (comment: StoredComment) => StoredComment) => {
    setComments((current) => current.map((comment) => (comment.id === id ? updater(comment) : comment)));
  };

  const toggleLike = (comment: StoredComment) => {
    if (!identity) {
      requestAccount();
      return;
    }

    updateComment(comment.id, (current) => {
      const liked = current.likes.includes(identity.id);
      return {
        ...current,
        likes: liked ? current.likes.filter((item) => item !== identity.id) : [...current.likes, identity.id],
      };
    });
  };

  const startReply = (comment: StoredComment) => {
    if (!identity) {
      requestAccount();
      return;
    }

    setReplyTargetId(comment.id);
    setQuoteTargetId('');
    setForm((current) => ({
      message: current.message.trim().length ? current.message : `@${comment.name} `,
    }));
  };

  const startQuote = (comment: StoredComment) => {
    if (!identity) {
      requestAccount();
      return;
    }

    setQuoteTargetId(comment.id);
    setReplyTargetId(comment.id);
    setForm((current) => ({
      message: current.message.trim().length ? current.message : `@${comment.name} `,
    }));
  };

  const editComment = (comment: StoredComment) => {
    if (!identity || (comment.authorId !== identity.id && !isAdmin)) return;
    const nextMessage = window.prompt('修改评论内容', comment.message);
    if (!nextMessage?.trim()) return;
    updateComment(comment.id, (current) => ({
      ...current,
      message: nextMessage.trim().slice(0, LIMIT),
      updatedAt: new Date().toISOString(),
    }));
  };

  const deleteComment = (comment: StoredComment) => {
    if (!identity || (comment.authorId !== identity.id && !isAdmin)) return;
    const confirmed = window.confirm('确认删除这条评论及其追评？');
    if (!confirmed) return;

    const collectIds = (targetId: string, bucket = new Set<string>()) => {
      bucket.add(targetId);
      for (const child of childComments.get(targetId) ?? []) collectIds(child.id, bucket);
      return bucket;
    };

    const removing = collectIds(comment.id);
    setComments((current) => current.filter((item) => !removing.has(item.id)));
  };

  const setAdminStatus = (comment: StoredComment, status: CommentStatus) => {
    if (!isAdmin) return;
    updateComment(comment.id, (current) => ({
      ...current,
      status: current.status === status ? 'published' : status,
      updatedAt: new Date().toISOString(),
    }));
  };

  const renderComment = (comment: StoredComment, depth = 0) => {
    const canManage = Boolean(identity && (identity.id === comment.authorId || isAdmin));
    const liked = Boolean(identity && comment.likes.includes(identity.id));
    const isLimited = comment.status === 'limited' && !canManage;
    const quote = comment.quoteId ? commentsById.get(comment.quoteId) : null;
    const children = childComments.get(comment.id) ?? [];

    return (
      <article className={`comment-thread__item depth-${Math.min(depth, 2)} ${comment.status === 'pinned' ? 'is-pinned' : ''}`} key={comment.id}>
        <div className="comment-thread__avatar">
          {comment.avatar ? <img src={comment.avatar} alt={comment.name} loading="lazy" /> : <span>{getCommentInitials(comment.name)}</span>}
        </div>
        <div className="comment-thread__content">
          <div className="comment-thread__head">
            <div className="comment-thread__author">
              <strong>{comment.name}</strong>
              {comment.website && (
                <a className="comment-thread__site" href={comment.website} target="_blank" rel="noreferrer">
                  {comment.website.replace(/^https?:\/\//, '')}
                </a>
              )}
              {comment.status === 'pinned' && <span className="comment-thread__badge">已置顶</span>}
              {comment.status === 'limited' && <span className="comment-thread__badge is-muted">受限</span>}
            </div>
            <div className="comment-thread__meta">
              <time>{formatCommentTime(comment.createdAt)}</time>
              {comment.updatedAt && <span>已编辑</span>}
            </div>
          </div>

          {quote && !isLimited && (
            <blockquote className="comment-thread__quote">
              <span>引用 @{quote.name}</span>
              <p>{quote.message.slice(0, 96)}</p>
            </blockquote>
          )}

          <div className="comment-thread__body">
            {isLimited ? (
              <p>这条评论当前只对作者本人和管理员可见。</p>
            ) : (
              renderParagraphs(comment).map((item) => <p key={`${comment.id}-${item}`}>{item}</p>)
            )}
          </div>

          <div className="comment-thread__actions">
            <button type="button" className={liked ? 'is-active' : ''} onClick={() => toggleLike(comment)}>
              喜欢 {comment.likes.length}
            </button>
            <button type="button" onClick={() => startReply(comment)}>
              追评
            </button>
            <button type="button" onClick={() => startQuote(comment)}>
              引用
            </button>
            {canManage && (
              <button type="button" onClick={() => editComment(comment)}>
                编辑
              </button>
            )}
            {canManage && (
              <button type="button" onClick={() => deleteComment(comment)}>
                删除
              </button>
            )}
            {isAdmin && (
              <button type="button" className={comment.status === 'pinned' ? 'is-active' : ''} onClick={() => setAdminStatus(comment, 'pinned')}>
                置顶
              </button>
            )}
            {isAdmin && (
              <button type="button" className={comment.status === 'limited' ? 'is-danger' : ''} onClick={() => setAdminStatus(comment, 'limited')}>
                限制
              </button>
            )}
          </div>

          {children.length > 0 && (
            <div className="comment-thread__children">
              {children
                .sort((left, right) => new Date(left.createdAt).valueOf() - new Date(right.createdAt).valueOf())
                .map((child) => renderComment(child, depth + 1))}
            </div>
          )}
        </div>
      </article>
    );
  };

  return (
    <section id="post-comment" data-comment-provider="managed" data-comment-view={identity ? 'member' : 'guest'}>
      <div className="comment-toolbar">
        <div className="comment-toolbar__copy">
          <span className="comment-toolbar__eyebrow">shijianus comments</span>
          <strong>{heading}</strong>
          <small>{comments.length} 条公开评论</small>
        </div>
        <div className="comment-toolbar__status-note">
          <p>
            {identity
              ? `${identity.name} 已登录，账号资料与提醒统一在 shijianus console 中维护。`
              : '当前未登录，评论输入保持灰色锁定；点击输入区后会提示你先创建账号。'}
          </p>
          {localTestingEnabled && (
            <div className="comment-toolbar__testing">
              <div className="comment-toolbar__testing-copy">
                <span className="comment-toolbar__testing-label">本地测试快捷入口</span>
                <small>推荐先使用管理员测试账号，再切换读者账号复查普通访客视角。</small>
              </div>
              <div className="comment-toolbar__testing-actions">
                <button type="button" onClick={() => usePresetAccount('admin')}>
                  使用管理员测试账号
                </button>
                <button type="button" onClick={() => usePresetAccount('reader')}>
                  使用读者测试账号
                </button>
                <button type="button" onClick={loadDemoComments}>
                  填充演示评论
                </button>
                <button type="button" onClick={clearLocalComments}>
                  清空本地评论
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="comment-wrap">
        <div className="comment-form-card comment-form-card--compact">
          {(replyTarget || quoteTarget) && (
            <div className="comment-reply-context">
              {replyTarget && <span>追评 @{replyTarget.name}</span>}
              {quoteTarget && <span>引用 @{quoteTarget.name}</span>}
              <button
                type="button"
                onClick={() => {
                  setReplyTargetId('');
                  setQuoteTargetId('');
                }}
              >
                取消
              </button>
            </div>
          )}

          <div className="comment-form-card__editor">
            <div className="comment-form-card__editor-head">
              <span className="comment-form-card__label">留言内容</span>
              <span className="comment-form-card__hint">{identity ? '支持 Ctrl / Command + Enter 快速发送' : '点击后前往控制台创建账号'}</span>
            </div>
            <textarea
              value={form.message}
              readOnly={!identity}
              aria-disabled={!identity}
              className={!identity ? 'is-locked' : ''}
              onClick={() => {
                if (!identity) requestAccount();
              }}
              onFocus={() => {
                if (!identity) requestAccount();
              }}
              onChange={(event) => setForm({ message: event.target.value.slice(0, LIMIT) })}
              onKeyDown={(event) => {
                if (!identity && (event.key === 'Enter' || event.key === ' ')) {
                  event.preventDefault();
                  requestAccount();
                  return;
                }

                if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
                  event.preventDefault();
                  void submit();
                }
              }}
              placeholder={identity ? `围绕《${title}》留下你的想法...` : '需要一个账号后才能评论'}
            />
          </div>

          <div className="comment-form-card__footer">
            <span className="comment-form-card__counter">{remaining}/{LIMIT}</span>
            <div className="comment-form-card__actions">
              <button
                type="button"
                className={preview ? 'is-active' : ''}
                onClick={() => {
                  if (!identity) {
                    requestAccount();
                    return;
                  }
                  setPreview((value) => !value);
                }}
              >
                {previewLabel}
              </button>
              <button
                type="button"
                className={`is-primary ${!identity ? 'is-disabled' : ''}`}
                onClick={() => void submit()}
                aria-disabled={!identity || !canSubmit}
              >
                {submitLabel}
              </button>
            </div>
          </div>

          {noticeText && <div className="comment-inline-notice">{noticeText}</div>}

          {preview && (
            <div className="comment-preview">
              <div className="comment-preview__head">
                <span className="comment-preview__eyebrow">preview</span>
                <strong>{identity?.name || 'Preview'}</strong>
              </div>
              <div className="comment-preview__body">
                {previewParagraphs.length > 0 ? (
                  previewParagraphs.map((item) => <p key={item}>{item}</p>)
                ) : (
                  <p>输入内容后会在这里预览。</p>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="comment-thread comment-thread--scrollable">
          {rootComments.length > 0 ? (
            rootComments.map((comment) => renderComment(comment))
          ) : (
            <div className="comment-thread__empty">
              <span className="comment-thread__eyebrow">public comments</span>
              <strong>{emptyTitle}</strong>
              <p>{emptySummary}</p>
              <span className="comment-thread__empty-note">账号准备好后就能发布第一条评论。</span>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
