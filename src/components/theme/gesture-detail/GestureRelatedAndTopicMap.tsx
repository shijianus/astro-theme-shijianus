import { readCitationTitle } from './related-titles';
import { useEffect, useMemo, useState } from 'react';
import { BookOpen, ExternalLink, Link2, MessagesSquare, Sparkles } from 'lucide-react';
import type { GestureNode, GestureRelatedLink, GestureTopicMap } from '../../../lib/gesture-client';
import { GestureAvatar } from './GestureAvatar';

interface Props {
  relatedLinks: GestureRelatedLink[];
  topicMap: GestureTopicMap;
  gesture: GestureNode;
  subGestures: GestureNode[];
}
function RelatedLink({ link }: { link: GestureRelatedLink }) {
  const kind = link.kind || (link.type === 'gesture' ? 'gesture' : link.url.startsWith('/') ? 'site' : 'external');
  const Icon = kind === 'gesture' ? MessagesSquare : kind === 'site' ? BookOpen : ExternalLink;
  const label = kind === 'gesture' ? '关联讨论' : kind === 'site' ? '站内引用' : '外部引用';
  return <a className="gd-related-link-row" href={link.url} target={kind === 'external' ? '_blank' : undefined} rel={kind === 'external' ? 'noopener noreferrer' : undefined}>
    <span title={label}><Icon size={14} aria-label={label} /></span><span>{link.title}</span>
    {kind === 'gesture' && typeof link.replyCount === 'number' && <small>{link.replyCount} 条回复</small>}
  </a>;
}

export function GestureRelatedAndTopicMap({ relatedLinks, topicMap, gesture, subGestures }: Props) {
  const [all, setAll] = useState(false);
  const [titles, setTitles] = useState<Record<string, string>>({});
  const visible = useMemo(() => all ? relatedLinks : relatedLinks.slice(0, 5), [all, relatedLinks]);
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
  const highlights = useMemo(() => summary ? [...subGestures].sort((a,b) => b.likesCount - a.likesCount).slice(0,3) : [], [summary, subGestures]);
  return <div className="gd-topic-info">
    {relatedLinks.length > 0 && <section className="gd-zone5-links" aria-label="关联链接">
      <h2><Link2 size={14} />关联链接</h2>
      {visible.map(link => <RelatedLink key={link.url} link={titles[link.url] ? { ...link, title: titles[link.url] } : link} />)}
      {relatedLinks.length > 5 && <button type="button" aria-expanded={all} onClick={() => setAll(!all)}>{all ? '收起' : '查看全部 ' + relatedLinks.length + ' 个链接'}</button>}
    </section>}
    <section className="gd-zone6-topic-map" aria-label="讨论概览">
      <span><strong>{topicMap.viewsCount.toLocaleString()}</strong> 观看</span>
      {hot && <><span>{topicMap.likesCount} 次表态</span><span>{relatedLinks.length} 个链接</span><span>{topicMap.usersCount} 位参与者</span><span>约 {topicMap.estimatedReadMinutes} 分钟阅读</span></>}
      <span className="gd-tm-avatars">{topicMap.participants.slice(0,5).map(p => <GestureAvatar key={p.authorId || p.authorName} name={p.authorName} avatar={p.authorAvatar} size={26} isOwner={p.authorRole === 'admin'} />)}</span>
      <button type="button" className="gd-summary-toggle" aria-expanded={summary} onClick={() => setSummary(!summary)}><Sparkles size={14} />总结</button>
    </section>
    {summary && <section className="gd-digest" aria-label="讨论摘录"><h2>讨论摘录 · {subGestures.length} 条回复</h2>
      {[gesture, ...highlights].map(n => <p key={n.id}><strong>{n.authorName}</strong>　{n.message.slice(0,100)}{n.message.length > 100 ? '…' : ''}</p>)}
    </section>}
  </div>;
}
