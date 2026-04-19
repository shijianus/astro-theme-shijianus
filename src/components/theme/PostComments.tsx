import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { CommentProvider } from '../../config/site';

type CommentsIntegrationConfig = Readonly<{
  provider: CommentProvider;
  fallback: CommentProvider;
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

type ProviderStatus = 'idle' | 'loading' | 'ready' | 'error';
type RemoteProvider = Exclude<CommentProvider, 'local'>;

type WalineGlobal = {
  init: (options: Record<string, unknown>) => { destroy?: () => void } | void;
};

type TwikooGlobal = {
  init: (options: Record<string, unknown>) => { destroy?: () => void } | void;
};

declare global {
  interface Window {
    Waline?: WalineGlobal;
    twikoo?: TwikooGlobal;
  }
}

const LIMIT = 500;
const scriptCache = new Map<string, Promise<void>>();
const styleCache = new Map<string, Promise<void>>();

function normaliseWebsite(value: string) {
  if (!value) return '';
  if (/^https?:\/\//i.test(value)) return value;
  return `https://${value}`;
}

function loadScript(src: string) {
  const cached = scriptCache.get(src);
  if (cached) return cached;

  const promise = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${src}"]`);
    if (existing?.dataset.loaded === 'true') {
      resolve();
      return;
    }

    const script = existing ?? document.createElement('script');
    script.src = src;
    script.async = true;
    script.defer = true;

    script.addEventListener('load', () => {
      script.dataset.loaded = 'true';
      resolve();
    }, { once: true });

    script.addEventListener('error', () => {
      scriptCache.delete(src);
      reject(new Error(`Failed to load script: ${src}`));
    }, { once: true });

    if (!existing) document.head.appendChild(script);
  });

  scriptCache.set(src, promise);
  return promise;
}

function loadStyle(href: string) {
  const cached = styleCache.get(href);
  if (cached) return cached;

  const promise = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLLinkElement>(`link[href="${href}"]`);
    if (existing?.dataset.loaded === 'true') {
      resolve();
      return;
    }

    const link = existing ?? document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;

    link.addEventListener('load', () => {
      link.dataset.loaded = 'true';
      resolve();
    }, { once: true });

    link.addEventListener('error', () => {
      styleCache.delete(href);
      reject(new Error(`Failed to load style: ${href}`));
    }, { once: true });

    if (!existing) document.head.appendChild(link);
  });

  styleCache.set(href, promise);
  return promise;
}

function resolveRemoteProvider(integration: CommentsIntegrationConfig): RemoteProvider | null {
  if (integration.provider === 'giscus') {
    const { repo, repoId, category, categoryId } = integration.giscus;
    if (repo && repoId && category && categoryId) return 'giscus';
  }

  if (integration.provider === 'waline' && integration.waline.serverURL) return 'waline';
  if (integration.provider === 'twikoo' && integration.twikoo.envId) return 'twikoo';
  return null;
}

function getProviderName(provider: RemoteProvider | null) {
  if (provider === 'giscus') return 'Giscus';
  if (provider === 'waline') return 'Waline';
  if (provider === 'twikoo') return 'Twikoo';
  return 'Local';
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
  const remoteProvider = resolveRemoteProvider(integration);
  const [providerStatus, setProviderStatus] = useState<ProviderStatus>('idle');
  const [viewMode, setViewMode] = useState<'provider' | 'local'>(remoteProvider ? 'provider' : 'local');
  const [comments, setComments] = useState<StoredComment[]>([]);
  const [storageReady, setStorageReady] = useState(false);
  const [preview, setPreview] = useState(false);
  const [form, setForm] = useState<CommentForm>({
    name: '',
    email: '',
    website: '',
    message: '',
  });
  const providerMountRef = useRef<HTMLDivElement>(null);
  const providerCleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (!raw) {
        setStorageReady(true);
        return;
      }
      const parsed = JSON.parse(raw) as StoredComment[];
      if (Array.isArray(parsed)) setComments(parsed);
    } catch {
      try {
        window.localStorage.removeItem(storageKey);
      } catch {}
    } finally {
      setStorageReady(true);
    }
  }, [storageKey]);

  useEffect(() => {
    if (!storageReady) return;
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(comments));
    } catch {}
  }, [comments, storageKey, storageReady]);

  useEffect(() => {
    if (!remoteProvider || viewMode !== 'provider' || !providerMountRef.current) return;

    let cancelled = false;
    const mountNode = providerMountRef.current;

    const boot = async () => {
      providerCleanupRef.current?.();
      providerCleanupRef.current = null;
      mountNode.innerHTML = '';
      setProviderStatus('loading');

      try {
        if (remoteProvider === 'giscus') {
          await new Promise<void>((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://giscus.app/client.js';
            script.async = true;
            script.crossOrigin = 'anonymous';
            script.setAttribute('data-repo', integration.giscus.repo);
            script.setAttribute('data-repo-id', integration.giscus.repoId);
            script.setAttribute('data-category', integration.giscus.category);
            script.setAttribute('data-category-id', integration.giscus.categoryId);
            script.setAttribute('data-mapping', integration.giscus.mapping || 'pathname');
            script.setAttribute('data-strict', '0');
            script.setAttribute('data-reactions-enabled', '1');
            script.setAttribute('data-emit-metadata', '0');
            script.setAttribute('data-input-position', 'top');
            script.setAttribute('data-theme', integration.giscus.theme || 'light');
            script.setAttribute('data-lang', 'zh-CN');
            script.addEventListener('load', () => resolve(), { once: true });
            script.addEventListener('error', () => reject(new Error('Giscus failed to load')), { once: true });
            mountNode.appendChild(script);
          });
        }

        if (remoteProvider === 'waline') {
          await Promise.all([
            loadStyle('https://unpkg.com/@waline/client@v3/dist/waline.css'),
            loadScript('https://unpkg.com/@waline/client@v3/dist/waline.js'),
          ]);

          const waline = window.Waline;
          if (!waline?.init) throw new Error('Waline init unavailable');
          const instance = waline.init({
            el: mountNode,
            serverURL: integration.waline.serverURL,
            lang: integration.waline.lang || 'zh-CN',
            path: window.location.pathname,
            pageSize: integration.waline.pageSize || 10,
          });
          providerCleanupRef.current = () => instance?.destroy?.();
        }

        if (remoteProvider === 'twikoo') {
          await loadScript('https://cdn.staticfile.org/twikoo/1.6.44/twikoo.all.min.js');
          const twikoo = window.twikoo;
          if (!twikoo?.init) throw new Error('Twikoo init unavailable');
          const instance = twikoo.init({
            envId: integration.twikoo.envId,
            region: integration.twikoo.region || undefined,
            el: mountNode,
            path: window.location.pathname,
            lang: integration.twikoo.lang || 'zh-CN',
          });
          providerCleanupRef.current = () => instance?.destroy?.();
        }

        if (!cancelled) {
          window.setTimeout(() => {
            if (!cancelled) setProviderStatus('ready');
          }, 180);
        }
      } catch {
        if (cancelled) return;
        setProviderStatus('error');
        setViewMode('local');
      }
    };

    boot();

    return () => {
      cancelled = true;
      providerCleanupRef.current?.();
      providerCleanupRef.current = null;
    };
  }, [integration, remoteProvider, viewMode]);

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
    <section id="post-comment" data-comment-provider={remoteProvider ?? 'local'} data-comment-view={viewMode}>
      <div className="comment-head">
        <span className="comment-headline">{heading}</span>
        <div className="comment-head__meta">
          <span className="comment-randomInfo">
            {policyLabel} ✅ {notice}
          </span>

          {remoteProvider && (
            <div className="comment-mode-tabs" role="tablist" aria-label="Comment mode">
              <button
                type="button"
                className={viewMode === 'provider' ? 'is-active' : ''}
                onClick={() => setViewMode('provider')}
              >
                {getProviderName(remoteProvider)}
              </button>
              <button
                type="button"
                className={viewMode === 'local' ? 'is-active' : ''}
                onClick={() => setViewMode('local')}
              >
                本地预览
              </button>
            </div>
          )}
        </div>
      </div>

      {viewMode === 'provider' && remoteProvider ? (
        <div className="comment-provider-shell">
          <div className="comment-provider-shell__intro">
            <span className="comment-surface__eyebrow">comment adapter</span>
            <h3>{getProviderName(remoteProvider)}</h3>
            <p>当前页面已经预留真实评论系统挂载位。只要补全 provider 参数，就可以直接切到真实评论流。</p>
            <div className="comment-surface__tips">
              <span>{providerStatus === 'loading' ? '加载中' : providerStatus === 'ready' ? '已挂载' : '准备中'}</span>
              <span>{getProviderName(remoteProvider)}</span>
              <span>本地 fallback 已保留</span>
            </div>
          </div>

          <div className="comment-provider-shell__card">
            <div className={`comment-provider-shell__status is-${providerStatus}`}>
              {providerStatus === 'loading' && `正在加载 ${getProviderName(remoteProvider)}...`}
              {providerStatus === 'ready' && `${getProviderName(remoteProvider)} 已加载`}
              {providerStatus === 'error' && `${getProviderName(remoteProvider)} 加载失败，已自动回退到本地预览`}
              {providerStatus === 'idle' && `等待挂载 ${getProviderName(remoteProvider)}`}
            </div>
            <div ref={providerMountRef} className="comment-provider-shell__mount" />
          </div>
        </div>
      ) : (
        <div className="comment-wrap">
          <div className="comment-surface">
            <div className="comment-surface__intro">
              <span className="comment-surface__eyebrow">local comment fallback</span>
              <h3>{title}</h3>
              <p>在当前浏览器里保留评论草稿和留言，用来还原评论区的布局、交互和状态反馈。</p>
              <div className="comment-surface__tips">
                {tips.map((item) => (
                  <span key={item}>{item}</span>
                ))}
                {remoteProvider && <span>{getProviderName(remoteProvider)} adapter ready</span>}
              </div>
            </div>

            <div className="comment-form-card">
              <div className="comment-form-card__row">
                <input value={form.name} onChange={onFieldChange('name')} placeholder="Nickname" />
                <input value={form.email} onChange={onFieldChange('email')} placeholder="Email" />
                <input value={form.website} onChange={onFieldChange('website')} placeholder="Website" />
              </div>

              <div className="comment-form-card__editor">
                <textarea
                  value={form.message}
                  onChange={onFieldChange('message')}
                  onKeyDown={(event) => {
                    if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
                      event.preventDefault();
                      submit();
                    }
                  }}
                  placeholder="留下你的想法..."
                />
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
      )}
    </section>
  );
}
