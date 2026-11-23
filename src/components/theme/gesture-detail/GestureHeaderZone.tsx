import { Hash, Pin } from 'lucide-react';

interface GestureHeaderZoneProps {
  title: string;
  isPinned: boolean;
  channelLabel: string;
  staticTags?: string[];
}

export function GestureHeaderZone({ title, isPinned, channelLabel, staticTags = [] }: GestureHeaderZoneProps) {
  const tags = [...new Set(staticTags)].filter(tag => tag !== '官方置顶' && tag !== channelLabel);
  const hasMeta = isPinned || Boolean(channelLabel) || tags.length > 0;
  return (
    <header className="gd-zone1-header">
      <h1 className="gd-zone1-title">{title}</h1>
      {hasMeta && (
        <div className="gd-zone1-tags">
          {isPinned && <span><Pin size={12} />置顶</span>}
          {channelLabel && <span><Hash size={12} />{channelLabel}</span>}
          {tags.map(tag => <span key={tag}>#{tag}</span>)}
        </div>
      )}
    </header>
  );
}
