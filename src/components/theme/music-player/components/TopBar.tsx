import type { KeyboardEvent as ReactKeyboardEvent } from 'react';
import { X } from 'lucide-react';
import type { PlayerTab, TFunction } from '../types';

export type PlayerTabItem = {
  id: PlayerTab;
  label: string;
};

type TopBarProps = {
  activeTab: PlayerTab;
  tabs: PlayerTabItem[];
  onSelect: (tab: PlayerTab) => void;
  onCollapse: () => void;
  onKeyDown: (event: ReactKeyboardEvent<HTMLButtonElement>, tab: PlayerTab) => void;
  tabRefs: { current: Array<HTMLButtonElement | null> };
  t: TFunction;
};

export function TopBar({ activeTab, tabs, onSelect, onCollapse, onKeyDown, tabRefs, t }: TopBarProps) {
  return (
    <div className="mp-topbar">
      <div className="mp-tabs" role="tablist" aria-label={t('播放器面板')}>
        {tabs.map((tab, index) => {
          const selected = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              ref={(node) => {
                tabRefs.current[index] = node;
              }}
              type="button"
              role="tab"
              id={`mp-tab-${tab.id}`}
              aria-controls={`mp-tabpanel-${tab.id}`}
              aria-selected={selected}
              tabIndex={selected ? 0 : -1}
              className={`mp-tab ${selected ? 'is-active' : ''}`}
              onClick={() => onSelect(tab.id)}
              onKeyDown={(event) => onKeyDown(event, tab.id)}
              data-testid={`mp-tab-${tab.id}`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      <button
        type="button"
        className="mp-icon-btn mp-collapse"
        onClick={onCollapse}
        title={t('收起播放器面板')}
        aria-label={t('收起播放器面板')}
        data-testid="mp-collapse"
      >
        <X size={16} strokeWidth={1.5} aria-hidden="true" />
      </button>
    </div>
  );
}
