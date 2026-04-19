import React, { useEffect, useMemo, useState } from 'react';
import { ArrowUp, Dice5, ExternalLink, House, Menu, MoonStar, Search, SunMedium, X } from 'lucide-react';
import { siteConfig } from '../config/site';
import { applyThemeWithBackground, readStorage, resolveBackgroundSource, resolveInitialBackground } from '../lib/client-theme';

type NavItem = {
  label: string;
  href: string;
  external?: boolean;
};

type SiteHeaderProps = {
  brandName: string;
  domainLabel: string;
  currentPath: string;
  primary: NavItem[];
  utility: NavItem[];
  quickActions: NavItem[];
};

function isActive(currentPath: string, href: string) {
  if (href === '/') return currentPath === '/';
  return currentPath.startsWith(href);
}

function openSearchPanel() {
  window.dispatchEvent(new CustomEvent('shijianus:open-search'));
}

function openCenterConsole() {
  window.dispatchEvent(new CustomEvent('shijianus:open-console'));
}

export function SiteHeader({
  brandName,
  domainLabel,
  currentPath,
  primary,
  utility,
  quickActions,
}: SiteHeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [scrolled, setScrolled] = useState(false);

  const activeLabel = useMemo(() => {
    return primary.find((item) => isActive(currentPath, item.href))?.label ?? domainLabel;
  }, [currentPath, domainLabel, primary]);

  const randomAction = quickActions[0] ?? primary[0];
  const goRandom = (event: React.MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    const candidates = quickActions.length > 0 ? quickActions : primary;
    const next = candidates[Math.floor(Math.random() * candidates.length)] ?? randomAction;
    if (!next) return;
    if (next.external) {
      window.open(next.href, '_blank', 'noopener,noreferrer');
      return;
    }
    window.location.href = next.href;
  };

  useEffect(() => {
    const root = document.documentElement;
    const savedTheme =
      (readStorage('shijianus-theme') as 'light' | 'dark' | null) ??
      (root.dataset.theme as 'light' | 'dark' | undefined) ??
      'light';
    const storedBackground = readStorage('shijianus-background') ?? root.dataset.background ?? null;
    const savedBackgroundSource = resolveBackgroundSource(
      storedBackground,
      readStorage('shijianus-background-source') ?? root.dataset.backgroundSource ?? null,
      {
        defaultBackground: siteConfig.theme.background.defaultMode,
        darkBackground: siteConfig.theme.background.darkMode,
      },
    );
    const savedBackground = resolveInitialBackground(
      savedTheme,
      storedBackground,
      {
        defaultBackground: siteConfig.theme.background.defaultMode,
        darkBackground: siteConfig.theme.background.darkMode,
      },
      savedBackgroundSource,
    );

    root.dataset.theme = savedTheme;
    root.dataset.background = savedBackground;
    root.dataset.backgroundSource = savedBackgroundSource;
    setTheme(savedTheme);

    const onThemeChange = (event: Event) => {
      const customEvent = event as CustomEvent<'light' | 'dark'>;
      setTheme(customEvent.detail ?? 'light');
    };

    const onScroll = () => {
      setScrolled(window.scrollY > 24);
    };

    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('shijianus:themechange', onThemeChange as EventListener);

    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('shijianus:themechange', onThemeChange as EventListener);
    };
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [currentPath]);

  return (
    <header id="page-header" className={`site-header not-top-img ${scrolled ? 'nav-fixed nav-visible' : ''}`}>
      <nav id="nav" aria-label="Main navigation">
        <div id="nav-group">
          <span id="blog_name">
            <a id="site-name" href="/" accessKey="h" aria-label={brandName}>
              <span className="title">{brandName}</span>
              <House className="site-name__icon" aria-hidden="true" />
            </a>
          </span>

          <div className="mask-name-container">
            <div id="name-container">
              <a id="page-name" href="#blog-container">
                {activeLabel}
              </a>
            </div>
          </div>

          <div id="menus">
            <div className="menus_items">
              {primary.map((item) => (
                <div key={item.href} className="menus_item">
                  <a
                    href={item.href}
                    className={`site-page ${isActive(currentPath, item.href) ? 'is-active' : ''}`}
                  >
                    {item.label}
                  </a>
                </div>
              ))}
            </div>
          </div>

          <div id="nav-right">
            <div className="nav-button" id="center-console-button">
              <button type="button" className="site-page center-console-trigger" onClick={openCenterConsole} title="Console">
                <span className="console-trigger-bars" aria-hidden="true">
                  <span className="left" />
                  <span className="center" />
                  <span className="right" />
                </span>
              </button>
            </div>

            <div className="nav-button" id="randomPost_button">
              <a className="site-page" href={randomAction.href} onClick={goRandom} title={randomAction.label}>
                <Dice5 className="nav-icon" aria-hidden="true" />
              </a>
            </div>

            <div className="nav-button" id="search-button">
              <button type="button" className="site-page" onClick={openSearchPanel} title="Search">
                <Search className="nav-icon" aria-hidden="true" />
              </button>
            </div>

            <div className="nav-button" id="display-mode-button">
              <button
                type="button"
                className="site-page"
                onClick={() => {
                  const nextTheme = theme === 'dark' ? 'light' : 'dark';
                  applyThemeWithBackground(nextTheme, {
                    defaultBackground: siteConfig.theme.background.defaultMode,
                    darkBackground: siteConfig.theme.background.darkMode,
                  });
                  setTheme(nextTheme);
                }}
                title="Display Mode"
              >
                {theme === 'dark' ? (
                  <SunMedium className="nav-icon" aria-hidden="true" />
                ) : (
                  <MoonStar className="nav-icon" aria-hidden="true" />
                )}
              </button>
            </div>

            <div className="nav-button" id="nav-totop">
              <button
                type="button"
                className="totopbtn site-page"
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                title="Back To Top"
              >
                <ArrowUp className="nav-icon" aria-hidden="true" />
              </button>
            </div>

            <div id="toggle-menu" className={menuOpen ? 'is-open' : ''}>
              <button
                type="button"
                className="site-page"
                onClick={() => setMenuOpen((value) => !value)}
                aria-label="Toggle navigation"
                aria-expanded={menuOpen}
              >
                {menuOpen ? <X className="nav-icon" aria-hidden="true" /> : <Menu className="nav-icon" aria-hidden="true" />}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {menuOpen && (
        <div className="site-mobile-panel">
          <nav className="site-mobile-panel__group" aria-label="Mobile navigation">
            {primary.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className={`site-mobile-link ${isActive(currentPath, item.href) ? 'is-active' : ''}`}
              >
                {item.label}
              </a>
            ))}
          </nav>

          <div className="site-mobile-panel__group">
            {quickActions.map((item) => (
              <a key={item.href} href={item.href} className="site-mobile-link">
                {item.label}
              </a>
            ))}
          </div>

          <div className="site-mobile-panel__group">
            {utility.map((item) => (
              <a
                key={item.href}
                href={item.href}
                target={item.external ? '_blank' : undefined}
                rel={item.external ? 'noreferrer' : undefined}
                className="site-mobile-link"
              >
                <span>{item.label}</span>
                {item.external && <ExternalLink className="h-3.5 w-3.5" />}
              </a>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}
