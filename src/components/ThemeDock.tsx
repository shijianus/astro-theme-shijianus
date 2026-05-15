import React, { useEffect, useRef, useState } from 'react';
import {
  applyThemeWithBackground,
  readStorage,
  syncAside,
  type ThemeMode,
} from '../lib/client-theme';
import { 
  toggleLocaleVariant, 
  readStoredLocaleVariant,
  type LocaleVariant 
} from '../lib/client-locale';

type BackgroundMode = {
  id: string;
  label: string;
};

type ThemeDockProps = {
  defaultBackground: string;
  darkBackground: string;
  backgroundModes: readonly BackgroundMode[];
  pageType?: string;
};

function calculateProgress() {
  if (typeof document === 'undefined') return 0;
  const documentElement = document.documentElement;
  const scrollable = documentElement.scrollHeight - window.innerHeight;
  if (scrollable <= 0) return 0;
  return Math.min(100, Math.max(0, (window.scrollY / scrollable) * 100));
}

export function ThemeDock(_props: ThemeDockProps) {
  const [progress, setProgress] = useState(0);
  const [configOpen, setConfigOpen] = useState(false);
  const [theme, setTheme] = useState<ThemeMode>('light');
  const [asideCollapsed, setAsideCollapsed] = useState(false);
  const [background, setBackground] = useState(_props.defaultBackground);
  const [panelHidden, setPanelHidden] = useState(true);
  const [readMode, setReadMode] = useState(false);
  const [locale, setLocale] = useState<LocaleVariant>('zh-CN');
  const progressRef = useRef(0);

  const isPost = _props.pageType === 'post';
  const isDoc = _props.pageType === 'doc' || _props.pageType === 'standards';

  const emitActivity = (message: string) => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('shijianus:activity', { detail: { message } }));
    }
  };

  useEffect(() => {
    const root = document.documentElement;
    const nextTheme = (readStorage('shijianus-theme') as ThemeMode | null) ?? (root.dataset.theme as ThemeMode | undefined) ?? 'light';
    const nextAside = readStorage('shijianus-aside') ?? root.dataset.aside ?? 'expanded';
    const nextBackground = readStorage('shijianus-background') ?? root.dataset.background ?? _props.defaultBackground;
    const nextLocale = readStoredLocaleVariant();
    const isReadMode = document.body.classList.contains('read-mode');

    root.dataset.theme = nextTheme;
    root.dataset.aside = nextAside;

    setTheme(nextTheme);
    setAsideCollapsed(nextAside === 'collapsed');
    setBackground(nextBackground);
    setLocale(nextLocale);
    setReadMode(isReadMode);

    const onThemeChange = (event: Event) => {
      const detail = (event as CustomEvent<ThemeMode>).detail;
      setTheme(detail ?? 'light');
    };

    const onBackgroundChange = (event: Event) => {
      const detail = (event as CustomEvent<string>).detail;
      setBackground(detail || _props.defaultBackground);
    };

    const onLocaleChange = (event: Event) => {
      const detail = (event as CustomEvent<LocaleVariant>).detail;
      setLocale(detail || 'zh-CN');
    };

    const onToggleTheme = () => {
      toggleTheme();
    };

    window.addEventListener('shijianus:themechange', onThemeChange as EventListener);
    window.addEventListener('shijianus:backgroundchange', onBackgroundChange as EventListener);
    window.addEventListener('shijianus:localechange', onLocaleChange as EventListener);
    window.addEventListener('shijianus:toggle-theme', onToggleTheme);

    return () => {
      window.removeEventListener('shijianus:themechange', onThemeChange as EventListener);
      window.removeEventListener('shijianus:backgroundchange', onBackgroundChange as EventListener);
      window.removeEventListener('shijianus:localechange', onLocaleChange as EventListener);
      window.removeEventListener('shijianus:toggle-theme', onToggleTheme);
    };
  }, [_props.defaultBackground, theme]);

  useEffect(() => {
    let frame = 0;

    const syncDockState = () => {
      frame = 0;
      const nextProgress = Math.round(calculateProgress());

      if (nextProgress !== progressRef.current) {
        progressRef.current = nextProgress;
        setProgress(nextProgress);
      }
    };

    const onScroll = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(syncDockState);
    };

    syncDockState();
    window.addEventListener('scroll', onScroll, { passive: true });

    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      window.removeEventListener('scroll', onScroll);
    };
  }, []);

  const jumpToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    emitActivity('已回到页面顶部');
  };

  const toggleTheme = () => {
    const nextTheme: ThemeMode = theme === 'dark' ? 'light' : 'dark';
    applyThemeWithBackground(nextTheme, {
      defaultBackground: _props.defaultBackground,
      darkBackground: _props.darkBackground,
    });
    emitActivity(nextTheme === 'dark' ? '已切换为深色模式' : '已切换为浅色模式');
  };

  const toggleAside = () => {
    const nextAside = asideCollapsed ? 'expanded' : 'collapsed';
    syncAside(nextAside);
    setAsideCollapsed(nextAside === 'collapsed');
    emitActivity(nextAside === 'collapsed' ? '已收起侧栏' : '已展开侧栏');
  };

  const toggleBackground = () => {
    if (!_props.backgroundModes.length) return;
    const currentIndex = _props.backgroundModes.findIndex(mode => mode.id === background);
    const nextIndex = (currentIndex + 1) % _props.backgroundModes.length;
    const nextBackground = _props.backgroundModes[nextIndex].id;
    
    document.documentElement.dataset.background = nextBackground;
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('shijianus-background', nextBackground);
    }
    setBackground(nextBackground);
    emitActivity(`已切换背景：${_props.backgroundModes[nextIndex].label}`);
  };

  const handleToggleReadMode = () => {
    const next = !readMode;
    document.body.classList.toggle('read-mode', next);
    setReadMode(next);
    emitActivity(next ? '已开启阅读模式' : '已退出阅读模式');
  };

  const handleToggleLocale = () => {
    const next = toggleLocaleVariant(locale);
    setLocale(next);
    emitActivity(`已切换语言：${next === 'zh-CN' ? '简体中文' : next === 'zh-Hant' ? '繁體中文' : 'English'}`);
  };

  return (
    <>
      {readMode && (
        <button 
          className="exit-readmode" 
          onClick={handleToggleReadMode}
          title="退出阅读模式"
          aria-label="退出阅读模式"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      )}
      <div 
        id="rightside" 
        className={`${configOpen ? 'config-open' : ''} ${panelHidden ? '' : 'panel-out'}`} 
        onMouseEnter={() => {
          if (panelHidden) setPanelHidden(false);
        }}
      >
        <div id="rightside-config-hide" className={configOpen ? 'show' : ''}>
          {isPost && !isDoc && (
            <>
              <button
                type="button"
                id="readmode"
                title="阅读模式"
                aria-label="阅读模式"
                className={readMode ? 'is-active' : ''}
                onClick={handleToggleReadMode}
              >
                <svg className="rightside-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
                  <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
                </svg>
              </button>

              <button
                type="button"
                id="mobile-toc-button"
                className="close"
                title="目录"
                aria-label="目录"
                onClick={() => {
                  window.dispatchEvent(new CustomEvent('shijianus:toggle-mobile-toc'));
                }}
              >
                <svg className="rightside-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="8" y1="6" x2="21" y2="6"></line>
                  <line x1="8" y1="12" x2="21" y2="12"></line>
                  <line x1="8" y1="18" x2="21" y2="18"></line>
                  <line x1="3" y1="6" x2="3.01" y2="6"></line>
                  <line x1="3" y1="12" x2="3.01" y2="12"></line>
                  <line x1="3" y1="18" x2="3.01" y2="18"></line>
                </svg>
              </button>

              <a id="to_comment" href="#post-comment" title="直达评论" aria-label="直达评论">
                <svg className="rightside-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                </svg>
              </a>

              <button
                type="button"
                id="translate"
                title="切换语言"
                aria-label="切换语言"
                onClick={handleToggleLocale}
              >
                <svg className="rightside-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m5 8 6 6"></path>
                  <path d="m4 14 6-6 2-3"></path>
                  <path d="M2 5h12"></path>
                  <path d="M7 2h1"></path>
                  <path d="m22 22-5-10-5 10"></path>
                  <path d="M14 18h6"></path>
                </svg>
              </button>
            </>
          )}

          <button
            type="button"
            id="hide-aside-btn"
            title={asideCollapsed ? '展开侧栏' : '收起侧栏'}
            aria-label={asideCollapsed ? '展开侧栏' : '收起侧栏'}
            className={asideCollapsed ? 'is-active' : ''}
            onClick={toggleAside}
          >
            <div style={{ position: 'relative', width: '16px', height: '16px' }}>
              <svg 
                className="rightside-icon" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
                style={{ position: 'absolute', top: 0, left: 0, transition: 'transform 0.2s, opacity 0.2s', opacity: asideCollapsed ? 0 : 1, transform: asideCollapsed ? 'scale(0.5)' : 'scale(1)' }}
              >
                <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
                <path d="M15 3v18" />
                <path d="m8 9 3 3-3 3" />
              </svg>
              <svg 
                className="rightside-icon" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
                style={{ position: 'absolute', top: 0, left: 0, transition: 'transform 0.2s, opacity 0.2s', opacity: asideCollapsed ? 1 : 0, transform: asideCollapsed ? 'scale(1)' : 'scale(0.5)' }}
              >
                <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
                <path d="M15 3v18" />
                <path d="m10 15-3-3 3-3" />
              </svg>
            </div>
          </button>
        </div>

        <div id="rightside-config-show">
          <button
            type="button"
            id="rightside-config"
            title="设置"
            aria-label="设置"
            aria-expanded={configOpen}
            className={configOpen ? 'is-active' : ''}
            onClick={() => setConfigOpen((value) => !value)}
          >
            <div style={{ position: 'relative', width: '16px', height: '16px' }}>
              <svg 
                className="rightside-icon" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
                style={{ position: 'absolute', top: 0, left: 0, transition: 'transform 0.3s, opacity 0.3s', opacity: configOpen ? 0 : 1, transform: configOpen ? 'scale(0.5) rotate(-90deg)' : 'scale(1) rotate(0)' }}
              >
                <circle cx="12" cy="12" r="3"></circle>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
              </svg>
              <svg 
                className="rightside-icon" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
                style={{ position: 'absolute', top: 0, left: 0, transition: 'transform 0.3s, opacity 0.3s', opacity: configOpen ? 1 : 0, transform: configOpen ? 'scale(1) rotate(0)' : 'scale(0.5) rotate(90deg)' }}
              >
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </div>
          </button>

          <button
            type="button"
            id="darkmode"
            title={theme === 'dark' ? '切换到浅色模式' : '切换到深色模式'}
            aria-label={theme === 'dark' ? '切换到浅色模式' : '切换到深色模式'}
            className={theme === 'dark' ? 'is-active' : ''}
            onClick={toggleTheme}
          >
            <div style={{ position: 'relative', width: '16px', height: '16px' }}>
              <svg 
                className="rightside-icon" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
                style={{ position: 'absolute', top: 0, left: 0, transition: 'transform 0.3s, opacity 0.3s', opacity: theme === 'dark' ? 0 : 1, transform: theme === 'dark' ? 'scale(0.5) rotate(-45deg)' : 'scale(1) rotate(0)' }}
              >
                <circle cx="12" cy="12" r="5"></circle>
                <line x1="12" y1="1" x2="12" y2="3"></line>
                <line x1="12" y1="21" x2="12" y2="23"></line>
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                <line x1="1" y1="12" x2="3" y2="12"></line>
                <line x1="21" y1="12" x2="23" y2="12"></line>
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
              </svg>
              <svg 
                className="rightside-icon" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
                style={{ position: 'absolute', top: 0, left: 0, transition: 'transform 0.3s, opacity 0.3s', opacity: theme === 'dark' ? 1 : 0, transform: theme === 'dark' ? 'scale(1) rotate(0)' : 'scale(0) rotate(45deg)' }}
              >
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
              </svg>
            </div>
          </button>

          <button
            type="button"
            id="background-mode"
            title="切换背景"
            aria-label="切换背景"
            onClick={toggleBackground}
          >
            <div style={{ position: 'relative', width: '16px', height: '16px' }}>
              <svg 
                className="rightside-icon" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
                style={{ position: 'absolute', top: 0, left: 0, transition: 'transform 0.3s', transform: `rotate(${(progress || 0) * 3.6}deg)` }}
              >
                <circle cx="13.5" cy="6.5" r=".5" fill="currentColor"></circle>
                <circle cx="17.5" cy="10.5" r=".5" fill="currentColor"></circle>
                <circle cx="8.5" cy="7.5" r=".5" fill="currentColor"></circle>
                <circle cx="6.5" cy="12.5" r=".5" fill="currentColor"></circle>
                <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"></path>
              </svg>
            </div>
          </button>

          <button
            type="button"
            id="hide-rightside-btn"
            title="隐藏选单"
            aria-label="隐藏选单"
            onClick={(e) => { 
              e.stopPropagation(); 
              setPanelHidden(true); 
              setConfigOpen(false); 
            }}
          >
            <svg className="rightside-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
          </button>

          <button
            type="button"
            id="go-up"
            title="回到顶部"
            aria-label="回到顶部"
            onClick={jumpToTop}
            className={progress > 0 ? 'show' : ''}
            style={{ 
              opacity: progress > 0 ? 1 : 0, 
              visibility: progress > 0 ? 'visible' : 'hidden',
              height: progress > 0 ? '35px' : '0',
              marginTop: progress > 0 ? '0' : '-4px',
              padding: progress > 0 ? '' : '0',
              border: progress > 0 ? '' : 'none',
              overflow: 'hidden',
              transition: 'all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)'
            }}
          >
            <span id="percent" style={{ position: 'absolute', right: '2px', bottom: '1px', fontSize: '9px', fontWeight: 800 }}>{progress}</span>
            <svg className="rightside-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="19" x2="12" y2="5"></line>
              <polyline points="5 12 12 5 19 12"></polyline>
            </svg>
          </button>
        </div>
      </div>
    </>
  );
}
