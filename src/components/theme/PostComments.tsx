import React, { useEffect, useMemo, useState } from 'react';

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
};

type StoredComment = {
  id: string;
  name: string;
  email: string;
  website: string;
  message: string;
  createdAt: string;
};

type CommentForm = {
  name: string;
  email: string;
  website: string;
  message: string;
};

const LIMIT = 500;

function normaliseWebsite(value: string) {
  if (!value) return '';
  if (/^https?:\/\//i.test(value)) return value;
  return `https://${value}`;
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
}: PostCommentsProps) {
  const storageKey = `shijianus-comments:${slug}`;
  const [comments, setComments] = useState<StoredComment[]>([]);
  const [preview, setPreview] = useState(false);
  const [form, setForm] = useState<CommentForm>({
    name: '',
    email: '',
    website: '',
    message: '',
  });

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (!raw) return;
      const parsed = JSON.parse(raw) as StoredComment[];
      if (Array.isArray(parsed)) setComments(parsed);
    } catch {
      window.localStorage.removeItem(storageKey);
    }
  }, [storageKey]);

  useEffect(() => {
    window.localStorage.setItem(storageKey, JSON.stringify(comments));
  }, [comments, storageKey]);

  const remaining = LIMIT - form.message.length;
  const canSubmit = form.name.trim().length > 0 && form.message.trim().length > 0;

  const previewParagraphs = useMemo(
    () => form.message.split(/\n+/).map((item) => item.trim()).filter(Boolean),
    [form.message],
  );

  const onFieldChange =
    (field: keyof CommentForm) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const nextValue = field === 'message' ? event.target.value.slice(0, LIMIT) : event.target.value;
      setForm((current) => ({ ...current, [field]: nextValue }));
    };

  const submit = () => {
    if (!canSubmit) return;

    const entry: StoredComment = {
      id: `${Date.now()}`,
      name: form.name.trim(),
      email: form.email.trim(),
      website: normaliseWebsite(form.website.trim()),
      message: form.message.trim(),
      createdAt: new Date().toISOString(),
    };

    setComments((current) => [entry, ...current]);
    setForm({ name: '', email: '', website: '', message: '' });
    setPreview(false);
  };

  return (
    <section id="post-comment">
      <div className="comment-head">
        <span className="comment-headline">{heading}</span>
        <span className="comment-randomInfo">
          {policyLabel} ✅ {notice}
        </span>
      </div>

      <div className="comment-wrap">
        <div className="comment-surface">
          <div className="comment-surface__intro">
            <span className="comment-surface__eyebrow">shijianus comments</span>
            <h3>{title}</h3>
            <p>在当前浏览器里保留评论草稿和留言，用来还原评论区的布局、交互和状态反馈。</p>
            <div className="comment-surface__tips">
              {tips.map((item) => (
                <span key={item}>{item}</span>
              ))}
            </div>
          </div>

          <div className="comment-form-card">
            <div className="comment-form-card__row">
              <input value={form.name} onChange={onFieldChange('name')} placeholder="Nickname" />
              <input value={form.email} onChange={onFieldChange('email')} placeholder="Email" />
              <input value={form.website} onChange={onFieldChange('website')} placeholder="Website" />
            </div>

            <div className="comment-form-card__editor">
              <textarea value={form.message} onChange={onFieldChange('message')} placeholder="留下你的想法..." />
            </div>

            <div className="comment-form-card__footer">
              <span>{remaining}/{LIMIT}</span>
              <div className="comment-form-card__actions">
                <button type="button" className={preview ? 'is-active' : ''} onClick={() => setPreview((value) => !value)}>
                  {previewLabel}
                </button>
                <button type="button" className="is-primary" onClick={submit} disabled={!canSubmit}>
                  {submitLabel}
                </button>
              </div>
            </div>

            {preview && (
              <div className="comment-preview">
                <strong>{form.name || 'Preview'}</strong>
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
        </div>

        <div className="comment-thread">
          {comments.length > 0 ? (
            comments.map((comment) => (
              <article className="comment-thread__item" key={comment.id}>
                <div className="comment-thread__avatar">{comment.name.slice(0, 1).toUpperCase()}</div>
                <div className="comment-thread__content">
                  <div className="comment-thread__meta">
                    <strong>{comment.name}</strong>
                    <time>{new Date(comment.createdAt).toLocaleString('zh-CN')}</time>
                    {comment.website && (
                      <a href={comment.website} target="_blank" rel="noreferrer">
                        {comment.website.replace(/^https?:\/\//, '')}
                      </a>
                    )}
                  </div>
                  <div className="comment-thread__body">
                    {comment.message.split(/\n+/).map((item) => (
                      <p key={`${comment.id}-${item}`}>{item}</p>
                    ))}
                  </div>
                </div>
              </article>
            ))
          ) : (
            <div className="comment-thread__empty">
              <strong>{emptyTitle}</strong>
              <p>{emptySummary}</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
