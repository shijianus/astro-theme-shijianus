import { useEffect, useMemo, useState } from 'react';
import { BookOpen, Link2, Sparkles } from 'lucide-react';
import {
  formatMetricCount,
  recordGestureLinkClick,
  type GestureNode,
  type GestureRelatedLink,
  type GestureTopicMap,
} from '../../../lib/gesture-detail-client';
import { GestureAvatar } from './GestureAvatar';
import { readCitationTitle } from './related-titles';

interface Props {
  relatedLinks: GestureRelatedLink[];
  topicMap: GestureTopicMap;
  gesture: GestureNode;
  subGestures: GestureNode[];
}

function RelatedLinkRow({ link, rootId }: { link: GestureRelatedLink; rootId: string }) {
  const [count, setCount] = useState(link.clickCount);
  useEffect(() => setCount(link.clickCount), [link.clickCount]);

  const kind = link.kind || (link.type === 'gesture' ? 'gesture' : link.url.startsWith('/') ? 'site' : 'external');
  const label = kind === 'gesture' ? '关联讨论' : kind === 'site' ? '站内引用' : '外部引用';

  const recordClick = async () => {
    if (!link.clickKey) return;
    const result = await recordGestureLinkClick(rootId, link.clickKey);
    if (result !== undefined) setCount(result);
  };

  return (
    <a
      className="gd-related-link-row"
      href={link.url}
      target={kind === 'external' ? '_blank' : undefined}
      rel={kind === 'external' ? 'noopener noreferrer' : undefined}
      onClick={() => void recordClick()}
      onAuxClick={(event) => {
        if (event.button === 1) void recordClick();
      }}
    >
      <span className="gd-related-link-icon" title={label}>
        <Link2 size={14} aria-label={label} />
      </span>
      <span className="gd-related-link-title">{link.title}</span>
      {typeof count === 'number' && (
        <small
          className="gd-link-clicks"
          title={`${count} 次点击（同一会话去重）`}
          aria-label={`${count} 次点击`}
        >
          {count}
        </small>
      )}
    </a>
  );
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
  const [showAllLinks, setShowAllLinks] = useState(false);
  const [titles, setTitles] = useState<Record<string, string>>({});
  const [summaryOpen, setSummaryOpen] = useState(false);

  // Strictly deduplicate real URLs; never synthesize mock links.
  const links = useMemo(() => {
    const dedup = new Map<string, GestureRelatedLink>();
    for (const link of relatedLinks) {
      const normalized = (link.url || '').trim();
      if (!normalized || dedup.has(normalized)) continue;
      dedup.set(normalized, { ...link, url: normalized });
    }
    return [...dedup.values()].sort(
      (a, b) => Number(b.type === 'gesture') - Number(a.type === 'gesture'),
    );
  }, [relatedLinks]);

  const visibleLinks = useMemo(
    () => (showAllLinks ? links : links.slice(0, 5)),
    [showAllLinks, links],
  );

  useEffect(() => {
    if (visibleLinks.length === 0) return;
    const controller = new AbortController();
    const docs = visibleLinks.filter((link) => link.type !== 'gesture');
    let index = 0;

    async function resolveTitles() {
      while (index < docs.length && !controller.signal.aborted) {
        const link = docs[index++];
        const title = await readCitationTitle(link, controller.signal);
        if (title && !controller.signal.aborted) {
          setTitles((prev) => (prev[link.url] === title ? prev : { ...prev, [link.url]: title }));
        }
      }
    }

    void Promise.all(Array.from({ length: Math.min(4, docs.length) }, resolveTitles));
    return () => controller.abort();
  }, [visibleLinks]);

  // Adaptive Topic Map: replies < 15 degrades to minimal single-row bar.
  const isHotTopic = subGestures.length >= 15 && topicMap.viewsCount >= 500;

  const participants = useMemo(
    () => [...topicMap.participants].sort((a, b) => b.count - a.count).slice(0, 5),
    [topicMap.participants],
  );

  const highlights = useMemo(
    () => (summaryOpen ? [...subGestures].sort((a, b) => b.likesCount - a.likesCount).slice(0, 3) : []),
    [summaryOpen, subGestures],
  );

  return (
    <div className="gd-topic-info">
      {links.length > 0 ? (
        <section className="gd-zone5-links" aria-label="关联链接">
          {visibleLinks.map((link) => (
            <RelatedLinkRow
              key={link.url}
              rootId={gesture.id}
              link={titles[link.url] ? { ...link, title: titles[link.url] } : link}
            />
          ))}
          {links.length > 5 && (
            <button
              type="button"
              className="gd-links-more-btn"
              aria-expanded={showAllLinks}
              onClick={() => setShowAllLinks((v) => !v)}
            >
              {showAllLinks ? '收起' : `查看全部 ${links.length} 个链接`}
            </button>
          )}
        </section>
      ) : null}

      <section
        className={`gd-zone6-topic-map ${isHotTopic ? 'is-hot' : 'is-light'}`}
        aria-label="讨论概览"
      >
        {isHotTopic && (
          <dl className="gd-tm-metrics">
            {[
              [formatMetricCount(topicMap.viewsCount), '觀看'],
              [formatMetricCount(topicMap.likesCount), '個讚'],
              [String(links.length), '連結'],
              [String(topicMap.usersCount), '使用者'],
            ].map(([value, label]) => (
              <div key={label}>
                <dt>{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
        )}

        <div className="gd-tm-community">
          {!isHotTopic && (
            <span className="gd-tm-views">{formatMetricCount(topicMap.viewsCount)} 觀看</span>
          )}
          <span className="gd-tm-avatars">
            {participants.map((p) => (
              <span key={p.authorId || p.authorName} title={`${p.authorName} (${p.count} 次参与)`}>
                <GestureAvatar
                  name={p.authorName}
                  avatar={p.authorAvatar}
                  size={26}
                  isOwner={p.authorRole === 'admin'}
                />
              </span>
            ))}
          </span>
          {isHotTopic && (
            <span className="gd-tm-read-time">约 {topicMap.estimatedReadMinutes} 分钟阅读</span>
          )}
          <span className="gd-tm-actions">
            {isHotTopic && (
              <button
                type="button"
                aria-label="从主贴开始阅读"
                title="从主贴开始阅读"
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              >
                <BookOpen size={15} />
              </button>
            )}
            <button
              type="button"
              className="gd-summary-toggle"
              aria-label="讨论总结"
              aria-expanded={summaryOpen}
              onClick={() => setSummaryOpen((v) => !v)}
            >
              <Sparkles size={13} />
              <span>總結</span>
            </button>
          </span>
        </div>
      </section>

      {summaryOpen && (
        <section className="gd-digest" aria-label="讨论摘录">
          <h2>讨论摘录 · {subGestures.length} 条回复</h2>
          {[gesture, ...highlights].map((node) => {
            const plain = stripDigestMarkdown(node.message);
            return (
              <p key={node.id}>
                <strong>{node.authorName}</strong>　{plain.slice(0, 110)}
                {plain.length > 110 ? '…' : ''}
              </p>
            );
          })}
        </section>
      )}
    </div>
  );
}
