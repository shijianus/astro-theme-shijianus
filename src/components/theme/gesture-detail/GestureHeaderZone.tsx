import React from 'react';

interface GestureHeaderZoneProps {
  title: string;
  isPinned: boolean;
  channelLabel: string;
  staticTags?: string[];
}

export function GestureHeaderZone({
  title,
  isPinned,
  channelLabel,
  staticTags = [],
}: GestureHeaderZoneProps) {
  const customTags = [...new Set(staticTags)].filter((tag) => Boolean(tag) && tag !== '官方置顶');
  const metaItems: string[] = [];
  if (isPinned) metaItems.push('官方置顶');
  if (customTags.length > 0) {
    metaItems.push(...customTags);
  } else if (channelLabel) {
    metaItems.push(channelLabel);
  }

  return (
    <header className="gd-zone1-header">
      <h1 className="gd-zone1-title">{title}</h1>
      {metaItems.length > 0 && (
        <div className="gd-zone1-tags" aria-label="话题标签">
          {metaItems.map((item, idx) => (
            <React.Fragment key={item}>
              {idx > 0 && (
                <span className="gd-zone1-tag-sep" aria-hidden="true">
                  ·
                </span>
              )}
              <span className="gd-zone1-tag">{item}</span>
            </React.Fragment>
          ))}
        </div>
      )}
    </header>
  );
}
