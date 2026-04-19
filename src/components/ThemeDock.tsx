import React, { useEffect, useMemo, useState } from 'react';
import { ArrowUp, Languages, MoonStar, PanelRightClose, PanelRightOpen, Settings, Sparkles, SunMedium } from 'lucide-react';
import {
  applyThemeWithBackground,
  markBackgroundAsManual,
  readStorage,
  resolveBackgroundSource,
  resolveInitialBackground,
  syncAside,
  type AsideState,
  type ThemeMode,
  writeStorage,
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

export function ThemeDock({ defaultBackground, darkBackground, backgroundModes }: ThemeDockProps) {
  const [theme, setTheme] = useState<ThemeMode>('light');
  const [aside, setAside] = useState<AsideState>('expanded');
  const [background, setBackground] = useState(defaultBackground);
  const [localeVariant, setLocaleVariant] = useState<'zh-CN' | 'zh-Hant'>('zh-CN');
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);
  const [configOpen, setConfigOpen] = useState(false);
  const [footerOffset, setFooterOffset] = useState(0);

  const currentBackground = useMemo(() => {
    return backgroundModes.find((mode) => mode.id === background) ?? backgroundModes[0];
  }, [background, backgroundModes]);

  const cycleBackground = () => {
    const currentIndex = Math.max(0, backgroundModes.findIndex((mode) => mode.id === background));
    const nextBackground = backgroundModes[(currentIndex + 1) % backgroundModes.length]?.id ?? defaultBackground;
    markBackgroundAsManual(nextBackground);
    setBackground(nextBackground);
  };

  useEffect(() => {
    const root = document.documentElement;
    const savedTheme =
      (readStorage('shijianus-theme') as ThemeMode | null) ??
      (root.dataset.theme as ThemeMode | undefined) ??
      'light';
    const savedAside =
      (readStorage('shijianus-aside') as AsideState | null) ??
      (root.dataset.aside as AsideState | undefined) ??
      'expanded';
    const storedBackground = readStorage('shijianus-background') ?? root.dataset.background ?? null;
    const savedBackgroundSource = resolveBackgroundSource(
      storedBackground,
      readStorage('shijianus-background-source') ?? root.dataset.backgroundSource ?? null,
      { defaultBackground, darkBackground },
    );
    const savedBackground =
      resolveInitialBackground(
        savedTheme,
        storedBackground,
        { defaultBackground, darkBackground },
        savedBackgroundSource,
      );
    const savedLocaleVariant =
      (readStorage('shijianus-locale-variant') as 'zh-CN' | 'zh-Hant' | null) ?? 'zh-CN';

    root.dataset.theme = savedTheme;
    root.dataset.aside = savedAside;
    root.dataset.background = savedBackground;
    root.dataset.backgroundSource = savedBackgroundSource;
    root.dataset.localeVariant = savedLocaleVariant;
    root.lang = savedLocaleVariant;

    setTheme(savedTheme);
    setAside(savedAside);
    setBackground(savedBackground);
    setLocaleVariant(savedLocaleVariant);

    const onThemeChange = (event: Event) => {
      const customEvent = event as CustomEvent<ThemeMode>;
      setTheme(customEvent.detail ?? 'light');
    };
    const onBackgroundChange = (event: Event) => {
      const customEvent = event as CustomEvent<string>;
      setBackground(customEvent.detail ?? defaultBackground);
    };

    const onScroll = () => {
      setProgress(calculateProgress());
      setVisible(window.scrollY > 120);
      const footer = document.getElementById('footer');
      if (!footer) {
        setFooterOffset(0);
        return;
      }

      const footerRect = footer.getBoundingClientRect();
      if (footerRect.top >= window.innerHeight) {
        setFooterOffset(0);
        return;
      }

      const overlap = Math.max(0, window.innerHeight - footerRect.top + 16);
      const maxOffset = Math.max(0, Math.min(footerRect.height - 96, 320));
      setFooterOffset(Math.min(overlap, maxOffset));
    };

    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('shijianus:themechange', onThemeChange as EventListener);
    window.addEventListener('shijianus:backgroundchange', onBackgroundChange as EventListener);

    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('shijianus:themechange', onThemeChange as EventListener);
      window.removeEventListener('shijianus:backgroundchange', onBackgroundChange as EventListener);
    };
  }, [darkBackground, defaultBackground]);

  return (
    <div
      id="rightside"
      className={`${visible ? 'is-visible' : ''} ${footerOffset > 0 ? 'is-near-footer' : ''}`}
      style={{ bottom: `${20 + footerOffset}px` }}
    >
      <div id="rightside-config-hide" className={configOpen ? 'show' : ''}>
        <button
          type="button"
          id="translateLink"
          title={localeVariant === 'zh-CN' ? '切换为繁体语境' : '切换为简体语境'}
          onClick={() => {
            const nextVariant = localeVariant === 'zh-CN' ? 'zh-Hant' : 'zh-CN';
            document.documentElement.dataset.localeVariant = nextVariant;
            document.documentElement.lang = nextVariant;
            writeStorage('shijianus-locale-variant', nextVariant);
            setLocaleVariant(nextVariant);
          }}
        >
          <Languages className="rightside-icon" aria-hidden="true" />
        </button>

        <button type="button" id="background-mode" title={`切换背景：${currentBackground?.label ?? background}`} onClick={cycleBackground}>
          <Sparkles className="rightside-icon" aria-hidden="true" />
        </button>

                <button
                  type="button"
                  id="darkmode"
                  title="Switch Display Mode"
                  onClick={() => {
                    const nextTheme = theme === 'dark' ? 'light' : 'dark';
                    const nextBackground = applyThemeWithBackground(nextTheme, {
                      defaultBackground,
                      darkBackground,
                    });
                    setTheme(nextTheme);
                    setBackground(nextBackground);
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
