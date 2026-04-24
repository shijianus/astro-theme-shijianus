import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Archive,
  ArrowUp,
  ChevronDown,
  Dice5,
  ExternalLink,
  FolderKanban,
  House,
  Menu,
  MoonStar,
  Search,
  SunMedium,
  Tags,
  UserRound,
  X,
  type LucideIcon,
} from 'lucide-react';
import { siteConfig, type SiteNavItem } from '../config/site';
import { applyThemeWithBackground, readStorage, resolveBackgroundSource, resolveInitialBackground } from '../lib/client-theme';

type NavItem = Pick<SiteNavItem, 'label' | 'href' | 'description' | 'external' | 'icon' | 'children'>;

type SiteHeaderProps = {
  brandName: string;
  domainLabel: string;
  currentPath: string;
  primary: NavItem[];
  utility: NavItem[];
  quickActions: NavItem[];
  showCenterConsoleTrigger: boolean;
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

const navIconMap: Partial<Record<NonNullable<SiteNavItem['icon']>, LucideIcon>> = {
  home: House,
  archive: Archive,
  category: FolderKanban,
  tags: Tags,
  about: UserRound,
};

export function SiteHeader({
  brandName,
  domainLabel,
  currentPath,
  primary,
  utility,
  quickActions,
  showCenterConsoleTrigger,
}: SiteHeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [scrolled, setScrolled] = useState(false);
  const consolePressRef = useRef({
    armed: false,
    pointerId: -1,
    x: 0,
    y: 0,
  });

  const activeLabel = useMemo(() => {
    return (
      primary.find((item) => isActive(currentPath, item.href) || item.children?.some((child) => isActive(currentPath, child.href)))?.label ??
      domainLabel
    );
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

  useEffect(() => {
    const resetConsolePress = () => {
      consolePressRef.current = {
        armed: false,
        pointerId: -1,
        x: 0,
        y: 0,
      };
    };

    window.addEventListener('blur', resetConsolePress);
    document.addEventListener('visibilitychange', resetConsolePress);
    return () => {
      window.removeEventListener('blur', resetConsolePress);
      document.removeEventListener('visibilitychange', resetConsolePress);
    };
  }, []);

  const handleConsolePointerDown = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (event.button !== 0) return;
    event.preventDefault();
    consolePressRef.current = {
      armed: true,
      pointerId: event.pointerId,
      x: event.clientX,
      y: event.clientY,
    };
  };

  const handleConsolePointerMove = (event: React.PointerEvent<HTMLButtonElement>) => {
    const distance = Math.hypot(event.clientX - consolePressRef.current.x, event.clientY - consolePressRef.current.y);
    if (distance > 8) {
      consolePressRef.current.armed = false;
    }
  };

  const handleConsolePointerCancel = () => {
    consolePressRef.current.armed = false;
  };

  const handleConsolePointerUp = (event: React.PointerEvent<HTMLButtonElement>) => {
    event.preventDefault();
    const trigger = event.currentTarget;
    const { clientX, clientY } = event;
    const shouldOpen =
      consolePressRef.current.armed &&
      consolePressRef.current.pointerId === event.pointerId &&
      Math.hypot(clientX - consolePressRef.current.x, clientY - consolePressRef.current.y) <= 8;

    consolePressRef.current.armed = false;
    if (!shouldOpen) return;

    window.requestAnimationFrame(() => {
      if (document.visibilityState !== 'visible' || !document.hasFocus()) return;
      const releaseTarget = document.elementFromPoint(clientX, clientY);
      if (!(releaseTarget instanceof Node) || !trigger.contains(releaseTarget)) return;
      openCenterConsole();
    });
  };

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
              {primary.map((item) => {
                const itemActive = isActive(currentPath, item.href) || Boolean(item.children?.some((child) => isActive(currentPath, child.href)));
                const NavIcon = navIconMap[item.icon ?? 'home'] ?? House;

                return (
                  <div key={item.href} className={`menus_item ${item.children && item.children.length > 1 ? 'has-children' : ''}`}>
                    <div className="site-page-shell">
                      <a
                        href={item.href}
                        className={`site-page ${itemActive ? 'is-active' : ''}`}
                        data-subtitle={item.description}
                      >
                        <span className="site-page__icon-wrap" aria-hidden="true">
                          <NavIcon className="site-page__icon" />
                        </span>
                        <span className="site-page__label">{item.label}</span>
                        {item.children && item.children.length > 1 && <ChevronDown className="site-page__chevron" aria-hidden="true" />}
                        {item.description && <span className="site-page__subtitle">{item.description}</span>}
                        <span className="site-page__flyout" aria-hidden="true">
                          <span>{item.description ?? item.label}</span>
                          <small>{itemActive ? '当前页面' : '进入栏目'}</small>
                        </span>
                      </a>

                      {item.children && item.children.length > 1 && (
                        <div className="site-page-submenu" role="menu" aria-label={`${item.label} 子页面`}>
                          {item.children.slice(0, 3).map((child) => {
                            const ChildIcon = navIconMap[child.icon ?? 'home'] ?? House;
                            return (
                              <a
                                key={child.href}
                                href={child.href}
                                className={`site-page-submenu__item ${isActive(currentPath, child.href) ? 'is-active' : ''}`}
                                role="menuitem"
                              >
                                <ChildIcon className="site-page-submenu__icon" aria-hidden="true" />
                                <span className="site-page-submenu__copy">
                                  <strong>{child.label}</strong>
                                  <small>{child.description ?? item.description ?? item.label}</small>
                                </span>
                              </a>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div id="nav-right">
            {showCenterConsoleTrigger && (
              <div className="nav-button" id="center-console-button">
                <button
                  type="button"
                  className="site-page center-console-trigger"
                  title={`${brandName} console`}
                  aria-haspopup="dialog"
                  onPointerDown={handleConsolePointerDown}
                  onPointerMove={handleConsolePointerMove}
                  onPointerLeave={handleConsolePointerCancel}
                  onPointerCancel={handleConsolePointerCancel}
                  onPointerUp={handleConsolePointerUp}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      openCenterConsole();
                    }
                  }}
                  onClick={(event) => {
                    event.preventDefault();
                  }}
                >
                  <span className="console-trigger-bars" aria-hidden="true">
                    <span className="left" />
                    <span className="center" />
                    <span className="right" />
                  </span>
                </button>
              </div>
            )}

            <div className="nav-button" id="randomPost_button">
              <a className="site-page" href={randomAction.href} onClick={goRandom} title={randomAction.label}>
                <Dice5 className="nav-icon" aria-hidden="true" />
              </a>
            </div>

            <div className="nav-button" id="search-button">
              <button type="button" className="site-page" onClick={openSearchPanel} title={`${brandName} search`}>
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
                title={`${brandName} display mode`}
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
                title={`${brandName} back to top`}
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
              <div key={item.href} className="site-mobile-link-group">
                <a
                  href={item.href}
                  className={`site-mobile-link ${isActive(currentPath, item.href) ? 'is-active' : ''}`}
                >
                  {(() => {
                    const NavIcon = navIconMap[item.icon ?? 'home'] ?? House;
                    return <NavIcon className="site-mobile-link__icon" aria-hidden="true" />;
                  })()}
                  {item.label}
                </a>
                {item.children && item.children.length > 1 && (
                  <div className="site-mobile-sublinks">
                    {item.children.slice(0, 3).map((child) => (
                      <a
                        key={child.href}
                        href={child.href}
                        className={`site-mobile-sublink ${isActive(currentPath, child.href) ? 'is-active' : ''}`}
                      >
                        {child.label}
                      </a>
                    ))}
                  </div>
                )}
              </div>
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
