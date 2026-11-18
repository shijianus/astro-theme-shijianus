import { fromMarkdown } from 'mdast-util-from-markdown';
import type { RootContent, PhrasingContent } from 'mdast';
import { parseGestureHash } from '../../src/lib/gesture-text.ts';
import type { RawCommentRow } from './gesture-shared.ts';

interface Citation { url: string; label: string; internal: boolean; id?: string; floor?: number }
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
      if (/^(utm_.*|fbclid|gclid|msclkid)$/i.test(key)) url.searchParams.delete(key);
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
      if (!old.label) old.label = label;
      return;
    }
    found.set(key, { url: href, label, internal, id: target?.id, floor: target?.floor });
  }
  type Node = RootContent | PhrasingContent;
  const labelOf = (node: Node): string => 'children' in node ? node.children.map(labelOf).join('') : 'value' in node ? node.value : '';
  for (const row of rows) {
    if (!/https?:\/\/|]\(|\/guestbook\/|]:/i.test(row.message)) continue;
    const tree = fromMarkdown(row.message);
    const definitions = new Map<string, string>();
    function define(node: Node) {
      if (node.type === 'definition') definitions.set(node.identifier, node.url);
      else if ('children' in node) node.children.forEach(define);
    }
    function visit(node: Node) {
      if (node.type === 'link') add(node.url, labelOf(node) === node.url ? '' : labelOf(node));
      else if (node.type === 'linkReference') add(definitions.get(node.identifier) || '', labelOf(node));
      else if (node.type === 'text') {
        for (const match of node.value.matchAll(/https?:\/\/[^\s<>「」【】。，；！？]+|\/guestbook\/#gesture-[\w-]+/gi)) {
          let value = match[0].replace(/[.,;:!?]+$/, '');
          while (value.endsWith(')') && value.split(')').length > value.split('(').length) value = value.slice(0, -1);
          add(value);
        }
      } else if ('children' in node) node.children.forEach(visit);
    }
    tree.children.forEach(define);
    tree.children.forEach(visit);
  }
  return [...found.values()];
}

type Target = Pick<RawCommentRow, 'id' | 'title' | 'message'> & { reply_count: number };
export function resolveGestureLinks(citations: Citation[], targets: Target[]) {
  const byId = new Map(targets.map(target => [target.id, target]));
  return citations.flatMap(citation => {
    const { url, id, floor = 1 } = citation;
    if (id) {
      const target = byId.get(id);
      if (!target || floor > target.reply_count + 1) return [];
      const name = target.title || target.message.replace(/^#{1,6}\s+/, '').split('\n')[0].slice(0, 80);
      return [{ id, url, title: name + (floor > 1 ? ' · 第 ' + floor + ' 楼' : ''), replyCount: target.reply_count, type: 'gesture', kind: 'gesture' }];
    }
    return [{ url, title: citation.label || url, type: 'external', kind: citation.internal ? 'site' : 'external' }];
  }).sort((a, b) => Number(b.type === 'gesture') - Number(a.type === 'gesture'));
}
