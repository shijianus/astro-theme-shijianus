import MarkdownIt from 'markdown-it';
import { parseGestureHash } from '../../src/lib/gesture-text.ts';
import type { RawCommentRow } from './gesture-shared.ts';

interface Citation { key: string; url: string; label: string; internal: boolean; id?: string; floor?: number; postId?: string }
const markdown = new MarkdownIt({ linkify: true });
markdown.linkify.set({ fuzzyLink: false, fuzzyEmail: false });
const canonicalOrigin = 'https://blog.epocanvas.com';

function normalizeEscapes(value: string) {
  return value.replace(/%[\da-f]{2}/gi, escape => {
    const char = String.fromCharCode(parseInt(escape.slice(1), 16));
    return /[A-Za-z0-9._~-]/.test(char) ? char : escape.toUpperCase();
  });
}

export function collectGestureLinks(rows: RawCommentRow[], origin: string) {
  const found = new Map<string, Citation>();
  function add(raw: string, label = '') {
    if (!/^(?:https?:\/\/|\/(?!\/)|#gesture-)/i.test(raw)) return;
    let url: URL;
    try { url = new URL(raw, origin + '/guestbook/'); } catch { return; }
    if (url.username || url.password || !/^https?:$/.test(url.protocol)) return;
    const path = normalizeEscapes(url.pathname);
    if (/\.(?:png|jpe?g|gif|svg|avif|webp)$/i.test(path)) return;
    for (const key of [...url.searchParams.keys()]) {
      if (/^(utm_.*|fbclid|gclid|msclkid|spm|igshid|mc_cid|mc_eid|si)$/i.test(key)) url.searchParams.delete(key);
    }
    const internal = [new URL(origin).host, new URL(canonicalOrigin).host].includes(url.host);
    url.pathname = path;
    url.hash = normalizeEscapes(url.hash);
    const target = internal && /^\/guestbook\/?$/.test(path) ? parseGestureHash(url.hash) : null;
    if (internal && /^\/guestbook\/?$/.test(path) && url.hash.startsWith('#gesture-') && !target) return;
    const href = internal ? path + url.search + url.hash : url.href;
    const keyUrl = new URL(href, canonicalOrigin);
    keyUrl.searchParams.sort();
    const key = keyUrl.host + keyUrl.pathname.replace(/\/$/, '') + keyUrl.search + keyUrl.hash;
    const old = found.get(key);
    if (old) {
      if (old.url.startsWith('http://') && href.startsWith('https://')) old.url = href;
      if (!old.label && label) old.label = label;
      return;
    }
    found.set(key, { key, url: href, label, internal, id: target?.id, floor: target?.floor, postId: target?.postId });
  }
  for (const row of rows) {
    if (!/https?:\/\/|]\(|\/guestbook\/|]:/i.test(row.message)) continue;
    for (const block of markdown.parse(row.message, {})) {
      let href = '';
      let label = '';
      for (const token of block.children || []) {
        if (token.type === 'link_open') {
          href = token.attrGet('href') || '';
          label = '';
        } else if (token.type === 'link_close') {
          add(href, label === href ? '' : label);
          href = '';
        } else if (href) label += token.content;
        else if (token.type === 'text') {
          for (const match of token.content.matchAll(/\/guestbook\/#gesture-[\w~-]+/g)) add(match[0]);
        }
      }
    }
  }
  return [...found.values()];
}

type Target = Pick<RawCommentRow, 'id' | 'title' | 'message'> & { reply_count: number };
const KIND_RANK: Record<string, number> = { gesture: 0, site: 1, external: 2 };
export function resolveGestureLinks(
  citations: Citation[],
  targets: Target[],
  floorIds: Map<string, string[]>,
  legacyIds: Map<string, string[]>,
  currentRootId?: string
) {
  const byId = new Map(targets.map(target => [target.id, target]));
  const seen = new Set<string>();
  return citations.flatMap(citation => {
    const { url, id, floor = 1 } = citation;
    if (id) {
      const target = byId.get(id);
      if (!target) return [];
      const ids = floorIds.get(id);
      const postId = citation.postId || legacyIds.get(id)?.[floor-1] || ids?.[floor-1];
      const position = ids && postId ? ids.indexOf(postId) + 1 : floor;
      if (!position || position > target.reply_count + 1 || (citation.postId && !ids?.includes(citation.postId))) return [];
      if (currentRootId && id === currentRootId && position === 1) return [];
      const key = id + '/' + position;
      if (seen.has(key)) return [];
      seen.add(key);
      const name = target.title || target.message.replace(/^#{1,6}\s+/, '').split('\n')[0].slice(0, 80);
      return [{ id, clickKey: citation.key, url: position > 1 && postId ? '/guestbook/#gesture-' + id + '-floor-' + position + '~' + postId : url, title: name + (position > 1 ? ' · 第 ' + position + ' 楼' : ''), replyCount: target.reply_count, type: 'gesture' as const, kind: 'gesture' as const }];
    }
    const kind = citation.internal ? 'site' as const : 'external' as const;
    return [{ url, clickKey: citation.key, title: citation.label || url, type: 'external' as const, kind }];
  }).sort((a, b) => (KIND_RANK[a.kind] ?? 2) - (KIND_RANK[b.kind] ?? 2));
}
