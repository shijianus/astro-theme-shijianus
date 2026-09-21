import React, { useEffect, useState } from 'react';
import { readStoredLocaleVariant, normaliseLocaleVariant, getI18nText, type LocaleVariant } from '../lib/client-locale';

type ShortcutDef = {
  key: string;
  token: string;
  defaultLabel: string;
  action?: () => void;
  event?: string;
};

const SHORTCUT_DEFS: ShortcutDef[] = [
  { key: 'K', token: 'shortcut.search', defaultLabel: '唤起搜索面板', event: 'shijianus:open-search' },
  { key: 'A', token: 'shortcut.console', defaultLabel: '打开控制台', event: 'shijianus:open-console' },
  { key: 'D', token: 'shortcut.theme', defaultLabel: '深浅模式切换', event: 'shijianus:toggle-theme' },
  { key: 'M', token: 'shortcut.music', defaultLabel: '播放器切换', event: 'shijianus:music-toggle' },
  { key: 'R', token: 'shortcut.random', defaultLabel: '随机前往文章', action: () => {
    const randomBtn = document.querySelector('#random-banner') as HTMLAnchorElement;
    if (randomBtn) randomBtn.click();
  }},
  { key: 'H', token: 'shortcut.home', defaultLabel: '返回首页', action: () => window.location.href = '/' },
];

export function ShortcutPanel() {
  const [visible, setVisible] = useState(false);
  const [shiftPressed, setShiftPressed] = useState(false);
  const [locale, setLocale] = useState<LocaleVariant>('zh-CN');

  useEffect(() => {
    const stored = readStoredLocaleVariant();
    if (stored && stored !== 'zh-CN') {
      setLocale(stored);
    }
    const onLocaleChange = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      const raw = typeof detail === 'string' ? detail : (detail?.locale || detail?.variant);
      setLocale(normaliseLocaleVariant(raw || readStoredLocaleVariant()));
    };
    window.addEventListener('shijianus:localechange', onLocaleChange);
    return () => window.removeEventListener('shijianus:localechange', onLocaleChange);
  }, []);

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
        const shortcut = SHORTCUT_DEFS.find(s => s.key === key);
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
      <div className="keyboardTitle">{getI18nText('shortcut.title', locale, '快捷键提示')}</div>
      <div className="keybordList">
        {SHORTCUT_DEFS.map((item) => (
          <div className="keybordItem" key={item.key}>
            <div className="keyGroup">
              <kbd className="key">Shift + {item.key}</kbd>
            </div>
            <div className="keyContent">
              <span className="content">{getI18nText(item.token, locale, item.defaultLabel)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
