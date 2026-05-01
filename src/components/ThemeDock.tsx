import React, { useEffect, useRef, useState } from 'react';
import { ArrowUp, MoonStar, Palette, PanelRightClose, PanelRightOpen, Settings2, SunMedium } from 'lucide-react';
import {
  applyThemeWithBackground,
  markBackgroundAsManual,
  readStorage,
  syncAside,
  type ThemeMode,
} from '../lib/client-theme';

type BackgroundMode = {
  id: string;
  label: string;
};

type ThemeDockProps = {
  defaultBackground: string;
  darkBackground: string;
  backgroundModes: readonly BackgroundMode[];
};

function calculateProgress() {
  const documentElement = document.documentElement;
  const scrollable = documentElement.scrollHeight - window.innerHeight;
  if (scrollable <= 0) return 0;
  return Math.min(100, Math.max(0, (window.scrollY / scrollable) * 100));
}

export function ThemeDock(_props: ThemeDockProps) {
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);
  const [configOpen, setConfigOpen] = useState(false);
  const [theme, setTheme] = useState<ThemeMode>('light');
  const [asideCollapsed, setAsideCollapsed] = useState(false);
  const [background, setBackground] = useState(_props.defaultBackground);
  const progressRef = useRef(0);
  const visibleRef = useRef(false);

  const emitActivity = (message: string) => {
    window.dispatchEvent(new CustomEvent('shijianus:activity', { detail: { message } }));
  };

  useEffect(() => {
    const root = document.documentElement;
    const nextTheme = (readStorage('shijianus-theme') as ThemeMode | null) ?? (root.dataset.theme as ThemeMode | undefined) ?? 'light';
    const nextAside = readStorage('shijianus-aside') ?? root.dataset.aside ?? 'expanded';
    const nextBackground = readStorage('shijianus-background') ?? root.dataset.background ?? _props.defaultBackground;

    root.dataset.theme = nextTheme;
    root.dataset.aside = nextAside;

    setTheme(nextTheme);
    setAsideCollapsed(nextAside === 'collapsed');
    setBackground(nextBackground);

    const onThemeChange = (event: Event) => {
      const detail = (event as CustomEvent<ThemeMode>).detail;
      setTheme(detail ?? 'light');
    };

    const onBackgroundChange = (event: Event) => {
      const detail = (event as CustomEvent<string>).detail;
      setBackground(detail || _props.defaultBackground);
    };

    window.addEventListener('shijianus:themechange', onThemeChange as EventListener);
    window.addEventListener('shijianus:backgroundchange', onBackgroundChange as EventListener);

    return () => {
      window.removeEventListener('shijianus:themechange', onThemeChange as EventListener);
      window.removeEventListener('shijianus:backgroundchange', onBackgroundChange as EventListener);
    };
  }, [_props.defaultBackground]);

  useEffect(() => {
    let frame = 0;

    const syncDockState = () => {
      frame = 0;
      const nextProgress = Math.round(calculateProgress());
      const nextVisible = window.scrollY > 120;

      if (nextProgress !== progressRef.current) {
        progressRef.current = nextProgress;
        setProgress(nextProgress);
      }

      if (nextVisible !== visibleRef.current) {
        visibleRef.current = nextVisible;
        setVisible(nextVisible);
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

  const cycleBackground = () => {
    const currentIndex = Math.max(0, _props.backgroundModes.findIndex((mode) => mode.id === background));
    const nextBackground = _props.backgroundModes[(currentIndex + 1) % _props.backgroundModes.length]?.id ?? _props.defaultBackground;
    markBackgroundAsManual(nextBackground);
    setBackground(nextBackground);
    emitActivity(`已切换背景：${_props.backgroundModes[(currentIndex + 1) % _props.backgroundModes.length]?.label ?? nextBackground}`);
  };

  return (
    <div
      id="rightside"
      className={visible ? 'is-visible' : ''}
    >
      <div id="rightside-config-hide" className={configOpen ? 'show' : ''}>
        <button
          type="button"
          id="darkmode"
          title={theme === 'dark' ? '切换到浅色模式' : '切换到深色模式'}
          aria-label={theme === 'dark' ? '切换到浅色模式' : '切换到深色模式'}
          className={theme === 'dark' ? 'is-active' : ''}
          onClick={toggleTheme}
        >
          {theme === 'dark' ? <SunMedium className="rightside-icon" aria-hidden="true" /> : <MoonStar className="rightside-icon" aria-hidden="true" />}
        </button>

        <button type="button" id="background-mode" title="切换背景" aria-label="切换背景" onClick={cycleBackground}>
          <Palette className="rightside-icon" aria-hidden="true" />
        </button>

        <button
          type="button"
          id="hide-aside-btn"
          title={asideCollapsed ? '展开侧栏' : '收起侧栏'}
          aria-label={asideCollapsed ? '展开侧栏' : '收起侧栏'}
          className={asideCollapsed ? 'is-active' : ''}
          onClick={toggleAside}
        >
          {asideCollapsed ? <PanelRightOpen className="rightside-icon" aria-hidden="true" /> : <PanelRightClose className="rightside-icon" aria-hidden="true" />}
        </button>
      </div>

      <div id="rightside-config-show">
        <button
          type="button"
          id="rightside-config"
          title="边栏设置"
          aria-label="边栏设置"
          aria-expanded={configOpen}
          className={configOpen ? 'is-active' : ''}
          onClick={() => setConfigOpen((value) => !value)}
        >
          <Settings2 className="rightside-icon" aria-hidden="true" />
        </button>

        <button type="button" id="go-up" title="回到顶部" aria-label="回到顶部" onClick={jumpToTop}>
          <ArrowUp className="rightside-icon" aria-hidden="true" />
          <span id="percent">{Math.round(progress)}</span>
        </button>
      </div>
    </div>
  );
}
