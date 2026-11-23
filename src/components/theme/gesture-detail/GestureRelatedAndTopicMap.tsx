import { readCitationTitle } from './related-titles';
import { useEffect, useMemo, useState } from 'react';
import { BookOpen, Link2, Sparkles } from 'lucide-react';
import { recordGestureLinkClick, type GestureNode, type GestureRelatedLink, type GestureTopicMap } from '../../../lib/gesture-detail-client';
import { GestureAvatar } from './GestureAvatar';

interface Props {
  relatedLinks: GestureRelatedLink[];
  topicMap: GestureTopicMap;
  gesture: GestureNode;
  subGestures: GestureNode[];
}
function RelatedLink({ link, rootId }: { link: GestureRelatedLink; rootId: string }) {
  const [count, setCount] = useState(link.clickCount);
  useEffect(() => setCount(link.clickCount), [link.clickCount]);
  const kind = link.kind || (link.type === 'gesture' ? 'gesture' : link.url.startsWith('/') ? 'site' : 'external');
  const label = kind === 'gesture' ? '关联讨论' : kind === 'site' ? '站内引用' : '外部引用';
  const recordClick = async () => {
    if (!link.clickKey) return;
    const result = await recordGestureLinkClick(rootId, link.clickKey);
    if (result !== undefined) setCount(result);
  };
  return <a className="gd-related-link-row" href={link.url} target={kind === 'external' ? '_blank' : undefined} rel={kind === 'external' ? 'noopener noreferrer' : undefined}
    onClick={() => void recordClick()} onAuxClick={event => { if (event.button === 1) void recordClick(); }}>
    <span title={label}><Link2 size={14} aria-label={label} /></span><span>{link.title}</span>
    {typeof count === 'number' && <small className="gd-link-clicks" title={`${count} 次点击（同一会话去重）`} aria-label={`${count} 次点击`}>{count}</small>}
  </a>;
}

function stripDigestMarkdown(text: string): string {
  return (text || '')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/[*`_>]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function GestureRelatedAndTopicMap({ relatedLinks, topicMap, gesture, subGestures }: Props) {
  const [all, setAll] = useState(false);
  const [titles, setTitles] = useState<Record<string, string>>({});
  const links = useMemo(() => {
    const unique = [...new Map(relatedLinks.map(link => [link.url, link])).values()];
    return unique.sort((a, b) => Number(b.type === 'gesture') - Number(a.type === 'gesture'));
  }, [relatedLinks]);
  const visible = useMemo(() => all ? links : links.slice(0, 5), [all, links]);
  useEffect(() => {
    const controller = new AbortController();
    const documents = visible.filter(link => link.type !== 'gesture');
    let index = 0;
    async function resolveTitles() {
      while (index < documents.length && !controller.signal.aborted) {
        const link = documents[index++];
        const title = await readCitationTitle(link, controller.signal);
        if (title && !controller.signal.aborted) {
          setTitles(previous => previous[link.url] === title ? previous : { ...previous, [link.url]: title });
        }
      }
    }
    void Promise.all(Array.from({ length: Math.min(4, documents.length) }, resolveTitles));
    return () => controller.abort();
  }, [visible]);
  const [summary, setSummary] = useState(false);
  const hot = subGestures.length >= 15 && topicMap.viewsCount >= 500;
  const participants = useMemo(() => [...topicMap.participants].sort((a, b) => b.count - a.count).slice(0, 5), [topicMap.participants]);
  const highlights = useMemo(() => summary ? [...subGestures].sort((a,b) => b.likesCount - a.likesCount).slice(0,3) : [], [summary, subGestures]);
  return <div className="gd-topic-info">
    {links.length > 0 && <section className="gd-zone5-links" aria-label="关联链接">
      {visible.map(link => <RelatedLink key={link.url} rootId={gesture.id} link={titles[link.url] ? { ...link, title: titles[link.url] } : link} />)}
      {links.length > 5 && <button type="button" className="gd-links-more-btn" aria-expanded={all} onClick={() => setAll(!all)}>{all ? '收起' : '查看全部 ' + links.length + ' 个链接'}</button>}
    </section>}
    <section className={`gd-zone6-topic-map ${hot ? 'is-hot' : 'is-light'}`} aria-label="讨论概览">
      {hot && <dl className="gd-tm-metrics">
        {[[topicMap.viewsCount, '觀看'], [topicMap.likesCount, '個讚'], [links.length, '連結'], [topicMap.usersCount, '使用者']].map(([count, label]) => (
          <div key={label}><dt>{label}</dt><dd>{count.toLocaleString()}</dd></div>
        ))}
      </dl>}
      <div className="gd-tm-community">
      {!hot && <span className="gd-tm-views">{topicMap.viewsCount.toLocaleString()} 觀看</span>}
      <span className="gd-tm-avatars">{participants.map(p => (
        <span key={p.authorId || p.authorName} title={`${p.authorName} (${p.count} 次参与)`}>
          <GestureAvatar name={p.authorName} avatar={p.authorAvatar} size={26} isOwner={p.authorRole === 'admin'} />
        </span>
      ))}</span>
      {hot && <span className="gd-tm-read-time">约 {topicMap.estimatedReadMinutes} 分钟阅读</span>}
      <span className="gd-tm-actions">
        {hot && <button type="button" aria-label="从主贴开始阅读" title="从主贴开始阅读" onClick={() => document.getElementById('floor-1')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}><BookOpen size={16} /></button>}
        <button type="button" className="gd-summary-toggle" aria-label="讨论总结" aria-expanded={summary} onClick={() => setSummary(!summary)}><Sparkles size={14} />{!hot && '總結'}</button>
      </span>
      </div>
    </section>
    {summary && <section className="gd-digest" aria-label="讨论摘录"><h2>讨论摘录 · {subGestures.length} 条回复</h2>
      {[gesture, ...highlights].map(n => {
        const plain = stripDigestMarkdown(n.message);
        return <p key={n.id}><strong>{n.authorName}</strong>　{plain.slice(0,110)}{plain.length > 110 ? '…' : ''}</p>;
      })}
    </section>}
  </div>;
}
