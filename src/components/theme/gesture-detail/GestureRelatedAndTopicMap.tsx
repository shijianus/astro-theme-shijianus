import React, { useMemo, useState } from 'react';
import { BookOpen, ChevronDown, ChevronUp, Link2, Sparkles } from 'lucide-react';
import {
  formatMetricCount,
  type GestureNode,
  type GestureParticipant,
  type GestureRelatedLink,
  type GestureTopicMap,
} from '../../../lib/gesture-client';
import { GestureAvatar } from './GestureAvatar';

interface GestureRelatedAndTopicMapProps {
  relatedLinks: GestureRelatedLink[];
  topicMap: GestureTopicMap;
  hotFilterActive: boolean;
  onToggleHotFilter: () => void;
  aiSummaryOpen: boolean;
  onToggleAiSummary: () => void;
  gesture: GestureNode;
  subGestures: GestureNode[];
}

function resolveLinkBadgeText(link: GestureRelatedLink): string | null {
  if (link.replyCount > 0) return String(link.replyCount);
  return null;
}

/**
 * ZONE 5 (Borderless Real Related Links) + ZONE 6 (Adaptive Dual-Mode Topic Map)
 */
export function GestureRelatedAndTopicMap({
  relatedLinks,
  topicMap,
  hotFilterActive,
  onToggleHotFilter,
  aiSummaryOpen,
  onToggleAiSummary,
  gesture,
  subGestures,
}: GestureRelatedAndTopicMapProps) {
  const [showAllLinks, setShowAllLinks] = useState(false);

  const visibleLinks = showAllLinks ? relatedLinks : relatedLinks.slice(0, 5);
  const hiddenCount = Math.max(0, relatedLinks.length - 5);

  // Adaptive dual-mode threshold: Hot Topic when replies >= 15 AND views >= 500
  const isHotTopic = subGestures.length >= 15 && topicMap.viewsCount >= 500;

  const summaryHighlights = subGestures
    .slice()
    .sort((a, b) => (b.likesCount || 0) - (a.likesCount || 0))
    .slice(0, 3);

  // Guarantee max 5 avatars, and the 1st avatar is ALWAYS the OP (楼主)
  const orderedAvatars: GestureParticipant[] = useMemo(() => {
    const opKey = gesture.authorId || gesture.authorName;
    const opEntry: GestureParticipant = {
      authorId: gesture.authorId,
      authorName: gesture.authorName,
      authorAvatar: gesture.authorAvatar,
      authorRole: gesture.authorRole,
      count: 1,
    };

    const others: GestureParticipant[] = [];
    const seen = new Set<string>([opKey]);

    for (const p of topicMap.participants || []) {
      const pKey = p.authorId || p.authorName;
      if (pKey === opKey) {
        opEntry.count = p.count;
        continue;
      }
      if (!seen.has(pKey)) {
        seen.add(pKey);
        others.push(p);
      }
    }

    return [opEntry, ...others].slice(0, 5);
  }, [gesture, topicMap.participants]);

  return (
    <div className="gd-zone5-6-wrap">
      {/* ZONE 5: Borderless Related Links aligned on 56px content axis (0 height when empty) */}
      {relatedLinks.length > 0 && (
        <section className="gd-zone5-links" aria-label="关联链接汇总">
          {visibleLinks.map((link, idx) => {
            const badgeText = resolveLinkBadgeText(link);
            return (
              <a
                key={`${link.url}-${idx}`}
                href={link.url}
                target={link.type === 'external' && /^https?:\/\//.test(link.url) ? '_blank' : undefined}
                rel={link.type === 'external' ? 'noopener noreferrer' : undefined}
                className="gd-related-link-row"
              >
                <span className="gd-related-link-main">
                  <Link2 className="w-3.5 h-3.5 gd-related-link-icon flex-shrink-0" />
                  <span className="gd-related-link-title">{link.title}</span>
                </span>
                {badgeText && (
                  <span className="gd-related-link-count">{badgeText}</span>
                )}
              </a>
            );
          })}

          {hiddenCount > 0 && (
            <button
              type="button"
              className="gd-related-more-btn"
              onClick={() => setShowAllLinks((prev) => !prev)}
            >
              <span>{showAllLinks ? '收起关联链接' : `${hiddenCount} 更多`}</span>
              {showAllLinks ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          )}
        </section>
      )}

      {/* ZONE 6: Topic Map (Borderless background, strictly bounded by top & bottom 1px hairlines) */}
      <section
        className={`gd-zone6-topic-map ${isHotTopic ? 'is-hot-mode' : 'is-light-mode'}`}
        aria-label="讨论统计与 Topic Map"
      >
        {isHotTopic ? (
          <>
            <div className="gd-topic-map-left">
              <div className="gd-topic-map-metrics is-stacked">
                <div className="gd-tm-stat">
                  <strong>{formatMetricCount(topicMap.viewsCount)}</strong>
                  <span>觀看</span>
                </div>
                <div className="gd-tm-stat">
                  <strong>{formatMetricCount(topicMap.likesCount)}</strong>
                  <span>個讚</span>
                </div>
                <div className="gd-tm-stat">
                  <strong>{topicMap.linksCount}</strong>
                  <span>連結</span>
                </div>
                <div className="gd-tm-stat">
                  <strong>{topicMap.usersCount}</strong>
                  <span>使用者</span>
                </div>
              </div>

              <div className="gd-tm-avatars" aria-label="讨论参与者头像">
                {orderedAvatars.map((p, idx) => (
                  <div
                    key={p.authorId || p.authorName}
                    className={`gd-tm-avatar-item ${idx === 0 ? 'is-op-avatar' : ''}`}
                    title={`${p.authorName}${idx === 0 ? ' (楼主)' : ''} · ${p.count} 条发言`}
                  >
                    <GestureAvatar
                      name={p.authorName}
                      avatar={p.authorAvatar}
                      size={26}
                      isOwner={p.authorRole === 'admin'}
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="gd-topic-map-right">
              <span className="gd-tm-read-time">{topicMap.estimatedReadMinutes} 分钟阅读</span>
              <div className="gd-tm-toggles">
                <button
                  type="button"
                  className={`gd-tm-toggle-btn ${hotFilterActive ? 'is-active' : ''}`}
                  onClick={onToggleHotFilter}
                  title={hotFilterActive ? '显示全部回复' : '仅看热门/高赞回复'}
                  aria-pressed={hotFilterActive}
                >
                  <BookOpen className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  className={`gd-tm-toggle-btn gd-tm-summary-btn ${aiSummaryOpen ? 'is-active' : ''}`}
                  onClick={onToggleAiSummary}
                  title="AI 讨论脉络摘要"
                  aria-pressed={aiSummaryOpen}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>總結</span>
                </button>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="gd-topic-map-left">
              <span className="gd-tm-light-views">
                <strong>{formatMetricCount(topicMap.viewsCount)}</strong> 觀看
              </span>

              <div className="gd-tm-avatars" aria-label="讨论参与者头像">
                {orderedAvatars.map((p, idx) => (
                  <div
                    key={p.authorId || p.authorName}
                    className={`gd-tm-avatar-item ${idx === 0 ? 'is-op-avatar' : ''}`}
                    title={`${p.authorName}${idx === 0 ? ' (楼主)' : ''} · ${p.count} 条发言`}
                  >
                    <GestureAvatar
                      name={p.authorName}
                      avatar={p.authorAvatar}
                      size={26}
                      isOwner={p.authorRole === 'admin'}
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="gd-topic-map-right">
              <button
                type="button"
                className={`gd-tm-toggle-btn gd-tm-summary-btn ${aiSummaryOpen ? 'is-active' : ''}`}
                onClick={onToggleAiSummary}
                title="AI 讨论脉络摘要"
                aria-pressed={aiSummaryOpen}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>總結</span>
              </button>
            </div>
          </>
        )}
      </section>

      {aiSummaryOpen && (
        <div className="gd-ai-digest-panel">
          <div className="gd-ai-digest-head">
            <Sparkles className="w-3.5 h-3.5 text-sky-400" />
            <span>讨论脉络摘要 ({subGestures.length} 条回复 · {topicMap.usersCount} 位参与者)</span>
          </div>
          <p className="gd-ai-digest-lead">
            主贴由 <strong>{gesture.authorName}</strong> 发起，围绕互动广场、时间轴定位与讨论体验展开交流。
          </p>
          {summaryHighlights.length > 0 && (
            <ul className="gd-ai-digest-points">
              {summaryHighlights.map((item) => (
                <li key={item.id}>
                  <strong>{item.authorName}</strong>：{item.message.replace(/[#*`>\n]+/g, ' ').trim().slice(0, 80)}
                  {item.message.length > 80 ? '…' : ''}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
