import type { GestureRelatedLink } from '../../../lib/gesture-detail-client';

const cache = new Map<string, string>();
/** Read a public document title without sending an account cookie or a referrer. */
export async function readCitationTitle(link: GestureRelatedLink, signal: AbortSignal) {
  if (link.type === 'gesture') return link.title;
  const url = new URL(link.url, location.origin);
  if (cache.has(url.href)) return cache.get(url.href)!;
  if (url.origin === location.origin) {
    if (/^\/(?:api|auth)(\/|$)/.test(url.pathname)) return '';
  } else if (url.protocol !== 'https:' || !/^[\w.-]+\.[a-z]{2,}$/i.test(url.hostname) || /\.(?:local|internal|localhost)$/i.test(url.hostname)) return '';
  const timeout = AbortSignal.any([signal, AbortSignal.timeout(3500)]);
  try {
    const response = await fetch(url.href, { signal: timeout, credentials: 'omit', referrerPolicy: 'no-referrer', mode: 'cors' });
    if (!response.ok || !response.headers.get('content-type')?.includes('text/html')) return '';
    const reader = response.body?.getReader();
    if (!reader) return '';
    let head = '';
    const decoder = new TextDecoder();
    try {
      while (head.length < 65536) {
        const { done, value } = await reader.read();
        if (done) break;
        head += decoder.decode(value, { stream: true });
        if (/<\/title>|<\/head>/i.test(head)) break;
      }
    } finally { void reader.cancel().catch(() => {}); }
    const title = /<title\b[^>]*>([\s\S]*?)<\/title>/i.exec(head)?.[1];
    if (!title) return '';
    const name = new DOMParser().parseFromString('<title>' + title + '</title>', 'text/html').title.trim();
    if (/^(just a moment|attention required|access denied|404\b)/i.test(name)) return '';
    cache.set(url.href, name);
    return name;
  } catch { return ''; }
}
