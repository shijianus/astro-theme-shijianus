import React from 'react';
import { Pin } from 'lucide-react';

interface GestureHeaderZoneProps {
  title: string;
  isPinned: boolean;
  channelLabel: string;
  channelIcon?: string;
  staticTags?: string[];
}

/**
 * ZONE 1: Gesture Header Zone (Exclusive to main OP Gesture, full width across monolithic shell).
 * Tags are strictly static read-only metadata badges.
 */
export function GestureHeaderZone({
  title,
  isPinned,
  channelLabel,
  channelIcon,
  staticTags = [],
}: GestureHeaderZoneProps) {
  return (
    <header className="gd-zone1-header">
      <h1 className="gd-zone1-title">{title}</h1>
      <div className="gd-zone1-tags" aria-label="贴文只读状态与分类标签">
        {isPinned && (
          <span className="gd-static-badge is-pinned">
            <Pin className="w-3 h-3" />
            <span>官方置顶</span>
          </span>
        )}
        {staticTags.length === 0 && (
          <span className="gd-static-badge is-channel">
            {channelIcon && <span>{channelIcon}</span>}
            <span>{channelLabel}</span>
          </span>
        )}
        {staticTags
          .filter((t) => t !== '官方置顶')
          .map((tag) => (
            <span key={tag} className="gd-static-badge">
              {tag}
            </span>
          ))}
      </div>
    </header>
  );
}
