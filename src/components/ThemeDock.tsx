import React, { useEffect, useState } from 'react';
import { ArrowUp, Languages, MoonStar, PanelRightClose, PanelRightOpen, Settings, SunMedium } from 'lucide-react';

type ThemeMode = 'light' | 'dark';
type AsideState = 'expanded' | 'collapsed';

function syncTheme(nextTheme: ThemeMode) {
  document.documentElement.dataset.theme = nextTheme;
  window.localStorage.setItem('shijianus-theme', nextTheme);
  window.dispatchEvent(new CustomEvent('shijianus:themechange', { detail: nextTheme }));
}

function syncAside(nextAside: AsideState) {
  document.documentElement.dataset.aside = nextAside;
  window.localStorage.setItem('shijianus-aside', nextAside);
}

function calculateProgress() {
  const documentElement = document.documentElement;
  const scrollable = documentElement.scrollHeight - window.innerHeight;
  if (scrollable <= 0) return 0;
  return Math.min(100, Math.max(0, (window.scrollY / scrollable) * 100));
}

export function ThemeDock() {
  const [theme, setTheme] = useState<ThemeMode>('light');
  const [aside, setAside] = useState<AsideState>('expanded');
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);
  const [configOpen, setConfigOpen] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    const savedTheme =
      (window.localStorage.getItem('shijianus-theme') as ThemeMode | null) ??
      (root.dataset.theme as ThemeMode | undefined) ??
      'light';
    const savedAside =
      (window.localStorage.getItem('shijianus-aside') as AsideState | null) ??
      (root.dataset.aside as AsideState | undefined) ??
      'expanded';

    root.dataset.theme = savedTheme;
    root.dataset.aside = savedAside;

    setTheme(savedTheme);
    setAside(savedAside);

    const onThemeChange = (event: Event) => {
      const customEvent = event as CustomEvent<ThemeMode>;
      setTheme(customEvent.detail ?? 'light');
    };

    const onScroll = () => {
      setProgress(calculateProgress());
      setVisible(window.scrollY > 120);
    };

    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('shijianus:themechange', onThemeChange as EventListener);

    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('shijianus:themechange', onThemeChange as EventListener);
    };
  }, []);

  return (
    <div id="rightside" className={visible ? 'is-visible' : ''}>
      <div id="rightside-config-hide" className={configOpen ? 'show' : ''}>
        <button type="button" id="translateLink" title="Switch Language Variant">
          <Languages className="rightside-icon" aria-hidden="true" />
        </button>

        <button
          type="button"
          id="darkmode"
          title="Switch Display Mode"
          onClick={() => {
            const nextTheme = theme === 'dark' ? 'light' : 'dark';
            syncTheme(nextTheme);
            setTheme(nextTheme);
          }}
        >
          {theme === 'dark' ? (
            <SunMedium className="rightside-icon" aria-hidden="true" />
          ) : (
            <MoonStar className="rightside-icon" aria-hidden="true" />
          )}
        </button>

        <button
          type="button"
          id="hide-aside-btn"
          title="Toggle Sidebar"
          onClick={() => {
            const nextAside = aside === 'expanded' ? 'collapsed' : 'expanded';
            syncAside(nextAside);
            setAside(nextAside);
          }}
        >
          {aside === 'expanded' ? (
            <PanelRightClose className="rightside-icon" aria-hidden="true" />
          ) : (
            <PanelRightOpen className="rightside-icon" aria-hidden="true" />
          )}
        </button>
      </div>

      <div id="rightside-config-show">
        <button
          type="button"
          id="rightside-config"
          title="Setting"
          onClick={() => setConfigOpen((value) => !value)}
          className={configOpen ? 'is-active' : ''}
        >
          <Settings className="rightside-icon" aria-hidden="true" />
        </button>

        <button
          type="button"
          id="go-up"
          title="Back To Top"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        >
          <ArrowUp className="rightside-icon" aria-hidden="true" />
          <span id="percent">{Math.round(progress)}</span>
        </button>
      </div>
    </div>
  );
}
