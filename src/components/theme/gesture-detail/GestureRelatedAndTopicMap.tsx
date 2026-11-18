import React, { useState } from 'react';
import { BookOpen, ChevronDown, ChevronUp, Link2, Sparkles } from 'lucide-react';
import {
  formatMetricCount,
  type GestureNode,
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

/**
 * ZONE 5 (Auto Related Links Summary) + ZONE 6 (Topic Map Data Watershed)
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

  const summaryHighlights = subGestures
    .slice()
    .sort((a, b) => (b.likesCount || 0) - (a.likesCount || 0))
    .slice(0, 3);

  return (
    <div className="gd-zone5-6-wrap">
      {/* ZONE 5: Related Links (auto-hidden when empty) */}
      {relatedLinks.length > 0 && (
        <section className="gd-zone5-links" aria-label="关联链接汇总">
          {visibleLinks.map((link, idx) => (
            <a
              key={`${link.url}-${idx}`}
              href={link.url}
              target={link.type === 'external' && /^https?:\/\//.test(link.url) ? '_blank' : undefined}
              rel={link.type === 'external' ? 'noopener noreferrer' : undefined}
              className="gd-related-link-row"
            >
              <span className="gd-related-link-main">
                <Link2 className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
                <span className="gd-related-link-title">{link.title}</span>
              </span>
              {link.replyCount > 0 && (
                <span className="gd-related-link-count">{link.replyCount}</span>
              )}
            </a>
          ))}

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

      {/* ZONE 6: Topic Map Data Watershed */}
      <section className="gd-zone6-topic-map" aria-label="讨论统计与 Topic Map">
        <div className="gd-topic-map-metrics">
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

        <div className="gd-topic-map-right">
          <div className="gd-tm-avatars" aria-label="高频参与者">
            {topicMap.participants.slice(0, 5).map((p) => (
              <div
                key={p.authorId || p.authorName}
                className="gd-tm-avatar-item"
                title={`${p.authorName} (${p.count} 条发言)`}
              >
                <GestureAvatar
                  name={p.authorName}
                  avatar={p.authorAvatar}
                  size={24}
                  isOwner={p.authorRole === 'admin'}
                />
              </div>
            ))}
          </div>

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
              className={`gd-tm-toggle-btn ${aiSummaryOpen ? 'is-active' : ''}`}
              onClick={onToggleAiSummary}
              title="AI 讨论脉络摘要"
              aria-pressed={aiSummaryOpen}
            >
              <Sparkles className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </section>

      {aiSummaryOpen && (
        <div className="gd-ai-digest-panel">
          <div className="gd-ai-digest-head">
            <Sparkles className="w-3.5 h-3.5 text-sky-400" />
            <span>讨论脉络摘要 ({subGestures.length} 条回复 · {topicMap.usersCount} 位参与者)</span>
          </div>
          <p className="gd-ai-digest-lead">
            主贴由 <strong>{gesture.authorName}</strong> 发起，围绕互动广场、时间轴定位与深空毛玻璃讨论体验展开交流。
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
