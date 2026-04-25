import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Archive,
  ArrowUp,
  Dice5,
  Languages,
  ListTree,
  MessageCircle,
  MoonStar,
  PanelRightClose,
  PanelRightOpen,
  Search,
  Settings,
  Share2,
  Sparkles,
  SunMedium,
  X,
  type LucideIcon,
} from 'lucide-react';
import { siteConfig } from '../config/site';
import {
  applyThemeWithBackground,
  markBackgroundAsManual,
  readStorage,
  resolveBackgroundSource,
  resolveInitialBackground,
  syncAside,
  type AsideState,
  type ThemeMode,
} from '../lib/client-theme';
import {
  applyLocaleVariant,
  readStoredLocaleVariant,
  toggleLocaleVariant,
  type LocaleVariant,
} from '../lib/client-locale';
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
  const [localeVariant, setLocaleVariant] = useState<LocaleVariant>('zh-CN');
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);
  const [configOpen, setConfigOpen] = useState(false);
  const [devBarOpen, setDevBarOpen] = useState(false);
  const [footerOffset, setFooterOffset] = useState(0);
  const [pageType, setPageType] = useState('page');
  const [pageTitle, setPageTitle] = useState(siteConfig.site.name);
  const dockRef = useRef<HTMLDivElement>(null);

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
    setPageType(document.body.dataset.type ?? 'page');
    setPageTitle(document.title.replace(/\s+\|\s+.+$/, '').trim() || siteConfig.site.name);

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
    const savedLocaleVariant = readStoredLocaleVariant();

    root.dataset.theme = savedTheme;
    root.dataset.aside = savedAside;
    root.dataset.background = savedBackground;
    root.dataset.backgroundSource = savedBackgroundSource;
    applyLocaleVariant(savedLocaleVariant, { persist: false, translate: false });

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
    const onLocaleChange = (event: Event) => {
      const customEvent = event as CustomEvent<LocaleVariant>;
      setLocaleVariant(customEvent.detail ?? readStoredLocaleVariant());
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
    window.addEventListener('shijianus:localechange', onLocaleChange as EventListener);

    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('shijianus:themechange', onThemeChange as EventListener);
      window.removeEventListener('shijianus:backgroundchange', onBackgroundChange as EventListener);
      window.removeEventListener('shijianus:localechange', onLocaleChange as EventListener);
    };
  }, [darkBackground, defaultBackground]);

  useEffect(() => {
    const onPointerDown = (event: PointerEvent) => {
      if (!(event.target instanceof Node)) return;
      if (dockRef.current?.contains(event.target)) return;
      setConfigOpen(false);
      setDevBarOpen(false);
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      setConfigOpen(false);
      setDevBarOpen(false);
    };

    window.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, []);

  const openSearch = () => {
    window.dispatchEvent(new CustomEvent('shijianus:open-search'));
    setDevBarOpen(false);
  };

  const scrollToSelector = (selector: string, fallback?: () => void) => {
    const target = document.querySelector<HTMLElement>(selector);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setDevBarOpen(false);
      return;
    }

    fallback?.();
  };

  const jumpToComments = () => {
    scrollToSelector('#post-comment', () => {
      window.location.href = '/archives/';
    });
  };

  const jumpToToc = () => {
    scrollToSelector('#post-toc-aside, #card-toc', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  };

  const jumpToShare = () => {
    scrollToSelector('.post-copyright-block', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  };

  const jumpToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setDevBarOpen(false);
  };

  const goRandom = () => {
    const href = siteConfig.navigation.quickActions[0]?.href ?? '/archives/';
    window.location.href = href;
  };

  const currentPageLabel = pageType === 'post' ? 'article tools' : 'blog tools';

  const devBarActions = useMemo<
    Array<{
      id: string;
      label: string;
      detail: string;
      Icon: LucideIcon;
      href?: string;
      onClick?: () => void;
    }>
  >(() => {
    if (pageType === 'post') {
      return [
        { id: 'search', label: '搜索内容', detail: '快速找文章与标签', Icon: Search, onClick: openSearch },
        { id: 'toc', label: '目录定位', detail: '跳到当前文章目录', Icon: ListTree, onClick: jumpToToc },
        { id: 'comments', label: '评论入口', detail: '直达公开评论流', Icon: MessageCircle, onClick: jumpToComments },
        { id: 'share', label: '分享卡片', detail: '跳到版权与分享区', Icon: Share2, onClick: jumpToShare },
        { id: 'top', label: '回到顶部', detail: '回到文章开头', Icon: ArrowUp, onClick: jumpToTop },
      ];
    }

    return [
      { id: 'search', label: '搜索内容', detail: '全文索引与筛选', Icon: Search, onClick: openSearch },
      { id: 'archives', label: '文章归档', detail: '查看完整时间线', Icon: Archive, href: '/archives/' },
      { id: 'comments', label: '评论入口', detail: '文章页中自动跳转', Icon: MessageCircle, onClick: jumpToComments },
      { id: 'random', label: '随便逛逛', detail: '随机进入一篇文章', Icon: Dice5, onClick: goRandom },
      { id: 'top', label: '回到顶部', detail: '返回当前页面开头', Icon: ArrowUp, onClick: jumpToTop },
    ];
  }, [pageType]);

  return (
    <div
      id="rightside"
      className={`${visible ? 'is-visible' : ''} ${footerOffset > 0 ? 'is-near-footer' : ''}`}
      style={{ bottom: `${20 + footerOffset}px` }}
      ref={dockRef}
    >
      <div id="shijianus-devbar-panel" className={devBarOpen ? 'show' : ''}>
        <div className="shijianus-devbar-panel__head">
          <div>
            <span className="shijianus-devbar-panel__eyebrow">shijianus</span>
            <strong>blog bar</strong>
            <p>{pageType === 'post' ? '文章快捷入口与阅读操作' : '博客级快捷入口与页面操作'}</p>
          </div>
          <button type="button" className="shijianus-devbar-panel__close" onClick={() => setDevBarOpen(false)} aria-label="Close dev bar">
            <X className="rightside-icon" aria-hidden="true" />
          </button>
        </div>

        <div className="shijianus-devbar-panel__summary">
          <span>{currentPageLabel}</span>
          <strong>{pageTitle}</strong>
          <small>scroll {Math.round(progress)}%</small>
        </div>

        <div className="shijianus-devbar-panel__actions">
          {devBarActions.map(({ id, label, detail, Icon, href, onClick }) =>
            href ? (
              <a className="shijianus-devbar-panel__action" href={href} onClick={() => setDevBarOpen(false)} key={id}>
                <Icon className="rightside-icon" aria-hidden="true" />
                <span className="shijianus-devbar-panel__action-copy">
                  <strong>{label}</strong>
                  <small>{detail}</small>
                </span>
              </a>
            ) : (
              <button type="button" className="shijianus-devbar-panel__action" onClick={onClick} key={id}>
                <Icon className="rightside-icon" aria-hidden="true" />
                <span className="shijianus-devbar-panel__action-copy">
                  <strong>{label}</strong>
                  <small>{detail}</small>
                </span>
              </button>
            ),
          )}
        </div>
      </div>

      <div id="rightside-config-hide" className={configOpen ? 'show' : ''}>
        <button
          type="button"
          id="translateLink"
          title={localeVariant === 'zh-CN' ? '切换 shijianus 为繁体语境' : '切换 shijianus 为简体语境'}
          aria-label={localeVariant === 'zh-CN' ? '切换 shijianus 为繁体中文' : '切换 shijianus 为简体中文'}
          onClick={() => setLocaleVariant(toggleLocaleVariant(localeVariant))}
        >
          <Languages className="rightside-icon" aria-hidden="true" />
        </button>

        <button type="button" id="background-mode" title={`切换 shijianus 背景：${currentBackground?.label ?? background}`} onClick={cycleBackground}>
          <Sparkles className="rightside-icon" aria-hidden="true" />
        </button>

                <button
                  type="button"
                  id="darkmode"
                  title="Switch shijianus Display Mode"
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
          title="Toggle shijianus Sidebar"
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
          id="shijianus-devbar"
          title="shijianus dev bar"
          onClick={() => {
            setConfigOpen(false);
            setDevBarOpen((value) => !value);
          }}
          className={devBarOpen ? 'is-active' : ''}
        >
          <span className="shijianus-devbar__label">SJ</span>
          <span className="shijianus-devbar__progress">{Math.round(progress)}</span>
        </button>

        <button
          type="button"
          id="rightside-config"
          title="shijianus setting"
          onClick={() => {
            setDevBarOpen(false);
            setConfigOpen((value) => !value);
          }}
          className={configOpen ? 'is-active' : ''}
        >
          <Settings className="rightside-icon" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
