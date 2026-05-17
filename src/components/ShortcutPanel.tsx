import React, { useEffect, useState } from 'react';

type ShortcutItem = {
  key: string;
  label: string;
  action?: () => void;
  event?: string;
};

const shortcuts: ShortcutItem[] = [
  { key: 'K', label: '唤起搜索面板', event: 'shijianus:open-search' },
  { key: 'A', label: '打开控制台', event: 'shijianus:open-console' },
  { key: 'D', label: '深浅模式切换', event: 'shijianus:toggle-theme' },
  { key: 'M', label: '播放器切换', event: 'shijianus:music-toggle' },
  { key: 'R', label: '随机前往文章', action: () => {
    const randomBtn = document.querySelector('#random-banner') as HTMLAnchorElement;
    if (randomBtn) randomBtn.click();
  }},
  { key: 'H', label: '返回首页', action: () => window.location.href = '/' },
];

export function ShortcutPanel() {
  const [visible, setVisible] = useState(false);
  const [shiftPressed, setShiftPressed] = useState(false);

  useEffect(() => {
    let timer: number | null = null;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Shift') {
        setShiftPressed(true);
        if (!timer) {
          timer = window.setTimeout(() => {
            setVisible(true);
          }, 300);
        }
      }

      if (e.shiftKey) {
        const key = e.key.toUpperCase();
        const shortcut = shortcuts.find(s => s.key === key);
        if (shortcut) {
          e.preventDefault();
          if (shortcut.action) {
            shortcut.action();
          } else if (shortcut.event) {
            window.dispatchEvent(new CustomEvent(shortcut.event));
          }
          setVisible(false);
        }
      }

      if (e.key === 'Escape') {
        setVisible(false);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Shift') {
        setShiftPressed(false);
        if (timer) {
          window.clearTimeout(timer);
          timer = null;
        }
        setVisible(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      if (timer) window.clearTimeout(timer);
    };
  }, []);

  if (!visible) return null;

  return (
    <div id="keyboard-tips" className="shortcut-panel show" aria-hidden="true">
      <div className="keyboardTitle">快捷键提示</div>
      <div className="keybordList">
        {shortcuts.map((item) => (
          <div className="keybordItem" key={item.key}>
            <div className="keyGroup">
              <kbd className="key">Shift + {item.key}</kbd>
            </div>
            <div className="keyContent">
              <span className="content">{item.label}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
