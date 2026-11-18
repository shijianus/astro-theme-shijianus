import React, { useState } from 'react';
import { ArrowUp, ChevronDown, ChevronUp } from 'lucide-react';
import type { GestureNode, GestureQuote } from '../../../lib/gesture-client';
import { renderCommentMarkdown } from '../../../lib/comment-markdown';
import { GestureAvatar } from './GestureAvatar';

interface QuoteEmbedCardProps {
  quote: GestureQuote;
  quotedNode?: GestureNode | null;
  currentFloorIndex: number;
  onJumpToFloor: (targetFloorIndex: number, originFloorIndex: number) => void;
}

/**
 * Orthogonal Content-Level Quote Block inside the body column.
 * - Left header: (20px avatar) Quoted Author:
 * - Right header: [⌄]/[^] expand full original post content & images, [↑] jump to quoted floor (with 1.5s highlight)
 */
export function QuoteEmbedCard({
  quote,
  quotedNode,
  currentFloorIndex,
  onJumpToFloor,
}: QuoteEmbedCardProps) {
  const [expanded, setExpanded] = useState(false);

  const authorName = quotedNode?.authorName || quote.authorName;
  const authorAvatar = quotedNode?.authorAvatar || quote.authorAvatar;
  const targetFloor = quotedNode?.floorIndex;
  const fullContent = quotedNode?.message || quote.fullMessage || quote.excerpt;

  return (
    <div className={`gd-quote-card ${expanded ? 'is-expanded' : ''}`}>
      <div className="gd-quote-card__head">
        <div className="gd-quote-card__author">
          <GestureAvatar name={authorName} avatar={authorAvatar} size={20} isOwner={quotedNode?.authorRole === 'admin'} />
          <span className="gd-quote-card__name">{authorName}:</span>
        </div>

        <div className="gd-quote-card__actions">
          <button
            type="button"
            className="gd-quote-action-btn"
            onClick={() => setExpanded((prev) => !prev)}
            title={expanded ? '收起引用全文' : '展开被引用原贴全文'}
            aria-label={expanded ? '收起引用全文' : '展开被引用原贴全文'}
          >
            {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          {targetFloor && <button
            type="button"
            className="gd-quote-action-btn"
            onClick={() => onJumpToFloor(targetFloor, currentFloorIndex)}
            title="跳至被引用楼层"
            aria-label="跳至被引用楼层"
          >
            <ArrowUp className="w-3.5 h-3.5" />
          </button>}
        </div>
      </div>

      <div className="gd-quote-card__body">
        {expanded ? (
          <div
            className="gd-markdown-body gd-quote-full-md"
            dangerouslySetInnerHTML={{ __html: renderCommentMarkdown(fullContent) }}
          />
        ) : (
          <p className="gd-quote-excerpt">{quote.excerpt || quotedNode?.message.slice(0,100)}</p>
        )}
      </div>
    </div>
  );
}
