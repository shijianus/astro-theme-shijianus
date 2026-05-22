import React, { useEffect, useMemo, useRef, useState } from 'react';
import { 
  ExternalLink, House, Bell, Music, FlaskConical, LayoutGrid, 
  Archive, Tags, Info, Book, Rss, Link as LinkIcon, Video, 
  User, ChartBar, Compass, MessageCircle, ChevronDown,
  Search, SunMedium, MoonStar, Dices, ArrowUp, Menu,
  type LucideIcon 
} from 'lucide-react';
import { siteConfig, type SiteNavItem } from '../config/site';
import { readAllLocalThreads, readCommentIdentity } from '../lib/comment-client';
import { readStorage, resolveBackgroundSource, resolveInitialBackground } from '../lib/client-theme';

type NavItem = Pick<SiteNavItem, 'label' | 'href' | 'description' | 'external' | 'icon' | 'children'>;

type SiteHeaderProps = {
  brandName: string;
  domainLabel: string;
  currentPath: string;
  primary: NavItem[];
  utility: NavItem[];
  quickActions: NavItem[];
  showCenterConsoleTrigger: boolean;
  showNotificationTrigger: boolean;
  isAccountEnabled: boolean;
  hasDatabase: boolean;
};

function isActive(currentPath: string, href: string) {
  if (href === '/') return currentPath === '/';
  return currentPath.startsWith(href);
}

function openCenterConsole() {
  window.dispatchEvent(new CustomEvent('shijianus:open-console'));
}

function closeCenterConsole() {
  window.dispatchEvent(new CustomEvent('shijianus:close-console'));
}

function openNotificationPanel() {
  window.dispatchEvent(new CustomEvent('shijianus:open-notifications'));
}

function closeNotificationPanel() {
  window.dispatchEvent(new CustomEvent('shijianus:close-notifications'));
}

function openAccountPanel() {
  window.dispatchEvent(new CustomEvent('shijianus:open-account'));
}

const lucideIconMap: Record<string, LucideIcon> = {
  home: House,
  archive: Archive,
  category: LayoutGrid,
  tags: Tags,
  about: Info,
  book: Book,
  rss: Rss,
  link: LinkIcon,
  flask: FlaskConical,
  music: Music,
  video: Video,
  user: User,
  'chart-bar': ChartBar,
  compass: Compass,
  'circle-info': Info,
  message: MessageCircle,
};

const anzhiyuIconMap: Record<string, string> = {
  home: 'anzhiyu-icon-house-chimney',
  archive: 'anzhiyu-icon-box-archive',
  category: 'anzhiyu-icon-shapes',
  tags: 'anzhiyu-icon-tags',
  about: 'anzhiyu-icon-circle-info',
  book: 'anzhiyu-icon-book',
  rss: 'anzhiyu-icon-rss',
  link: 'anzhiyu-icon-link',
  flask: 'anzhiyu-icon-flask',
  music: 'anzhiyu-icon-music',
  video: 'anzhiyu-icon-video',
  user: 'anzhiyu-icon-anzhiyu',
  'chart-bar': 'anzhiyu-icon-chart-bar',
  compass: 'anzhiyu-icon-compass',
  'circle-info': 'anzhiyu-icon-circle-info',
  message: 'anzhiyu-icon-comments',
};

const forceLucideIcons = [
  'home', 'archive', 'category', 'tags', 'about', 'book', 
  'rss', 'link', 'flask', 'music', 'video', 'user', 
  'chart-bar', 'compass', 'circle-info', 'message'
];

function renderNavIcon(iconName: string | undefined, className: string) {
  const name = iconName ?? 'home';
  const LucideIcon = lucideIconMap[name] || House;
  const anzhiyuClass = anzhiyuIconMap[name];
  
  const useLucide = !anzhiyuClass || forceLucideIcons.includes(name);

  return (
    <span className={`site-page__icon-wrap ${className}`} aria-hidden="true" style={{ flexShrink: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
      {useLucide ? (
        <LucideIcon size={16} strokeWidth={2.25} />
      ) : (
        <i className={`anzhiyufont ${anzhiyuClass}`} style={{ fontSize: 'inherit' }} />
      )}
    </span>
  );
}

export function SiteHeader({
  brandName,
  domainLabel,
  currentPath,
  primary,
  utility,
  quickActions,
  showCenterConsoleTrigger,
  showNotificationTrigger,
  isAccountEnabled,
  hasDatabase,
}: SiteHeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [openSubmenuHref, setOpenSubmenuHref] = useState<string | null>(null);
  const [notificationCount, setNotificationCount] = useState(0);
  const [consoleOpen, setConsoleOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [isReadMode, setIsReadMode] = useState(false);
  const [isTraditional, setIsTraditional] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [progress, setProgress] = useState(0);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const submenuCloseTimerRef = useRef<number | null>(null);

  useEffect(() => {
    try {
      const savedVariant = window.localStorage.getItem('shijianus-locale-variant');
      setIsTraditional(savedVariant === 'zh-Hant');

      const savedReadMode = document.body.classList.contains('read-mode');
      setIsReadMode(savedReadMode);
    } catch (e) {
      console.error('Failed to load initial states:', e);
    }
  }, []);

  const toggleLanguage = (e: React.MouseEvent) => {
    e.preventDefault();
    const next = !isTraditional;
    setIsTraditional(next);
    const variant = next ? 'zh-Hant' : 'zh-CN';
    window.localStorage.setItem('shijianus-locale-variant', variant);
    document.documentElement.dataset.localeVariant = variant;
    document.documentElement.lang = variant;
    window.location.reload();
  };

  const toggleReadMode = (e: React.MouseEvent) => {
    e.preventDefault();
    const next = !isReadMode;
    setIsReadMode(next);
    if (next) {
      document.body.classList.add('read-mode');
    } else {
      document.body.classList.remove('read-mode');
    }
  };

  const activeLabel = useMemo(() => {
    return (
      primary.find((item) => isActive(currentPath, item.href) || item.children?.some((child) => isActive(currentPath, child.href)))?.label ??
      domainLabel
    );
  }, [currentPath, domainLabel, primary]);

  useEffect(() => {
    const root = document.documentElement;
    const initialTheme = (root.dataset.theme as 'light' | 'dark') || 'light';
    setTheme(initialTheme);

    const onThemeChange = (event: Event) => {
      const nextTheme = (event as CustomEvent<'light' | 'dark'>).detail;
      setTheme(nextTheme);
    };

    window.addEventListener('shijianus:themechange', onThemeChange as EventListener);

    const savedTheme =
      readStorage('shijianus-theme') ??
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

    const syncHeaderMetrics = () => {
      const header = document.getElementById('page-header');
      const headerHeight = Math.round(header?.getBoundingClientRect().height ?? 60);
      document.documentElement.style.setProperty('--site-header-height', `${headerHeight}px`);
    };

    let frame = 0;
    let lastScrolled = window.scrollY > 24;

    const updateScrolledState = () => {
      frame = 0;
      const nextScrolled = window.scrollY > 24;
      
      const documentElement = document.documentElement;
      const scrollable = documentElement.scrollHeight - window.innerHeight;
      const nextProgress = scrollable <= 0 ? 0 : Math.min(100, Math.max(0, Math.round((window.scrollY / scrollable) * 100)));
      
      setProgress(nextProgress);

      if (nextScrolled !== lastScrolled) {
        lastScrolled = nextScrolled;
        setScrolled(nextScrolled);
      }
      window.requestAnimationFrame(syncHeaderMetrics);
    };

    const onScroll = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(updateScrolledState);
    };

    setScrolled(lastScrolled);
    syncHeaderMetrics();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', syncHeaderMetrics);

    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', syncHeaderMetrics);
    };
  }, []);

  useEffect(() => {
    setMenuOpen(false);
    setOpenSubmenuHref(null);
  }, [currentPath]);

  useEffect(() => {
    return () => {
      if (submenuCloseTimerRef.current !== null) {
        window.clearTimeout(submenuCloseTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!showNotificationTrigger) {
      setNotificationCount(0);
      setNotificationOpen(false);
      return;
    }

    const syncNotifications = () => {
      const account = readCommentIdentity();
      if (!account) {
        setNotificationCount(0);
        return;
      }

      const count = readAllLocalThreads().filter((comment) => {
        if (comment.authorId === account.id) return false;
        return comment.message.includes(`@${account.name}`);
      }).length;

      setNotificationCount(Math.max(0, Math.min(count, 99)));
    };

    const onStorage = (event: StorageEvent) => {
      if (!event.key) return;
      if (event.key === 'shijianus-comment-account' || event.key === 'shijianus-comment-identity' || event.key.startsWith('shijianus-comments:')) {
        syncNotifications();
      }
    };

    syncNotifications();
    window.addEventListener('storage', onStorage);
    window.addEventListener('shijianus:comment-account-change', syncNotifications as EventListener);
    window.addEventListener('shijianus:comment-thread-change', syncNotifications);

    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('shijianus:comment-account-change', syncNotifications as EventListener);
      window.removeEventListener('shijianus:comment-thread-change', syncNotifications);
    };
  }, [showNotificationTrigger]);

  useEffect(() => {
    const onConsoleVisibility = (event: Event) => {
      const customEvent = event as CustomEvent<boolean>;
      setConsoleOpen(Boolean(customEvent.detail));
    };

    const onNotificationVisibility = (event: Event) => {
      const customEvent = event as CustomEvent<boolean>;
      setNotificationOpen(Boolean(customEvent.detail));
    };

    const onAccountVisibility = (event: Event) => {
      const customEvent = event as CustomEvent<boolean>;
      setAccountOpen(Boolean(customEvent.detail));
    };

    window.addEventListener('shijianus:console-visibility', onConsoleVisibility as EventListener);
    window.addEventListener('shijianus:notification-visibility', onNotificationVisibility as EventListener);
    window.addEventListener('shijianus:account-visibility', onAccountVisibility as EventListener);

    return () => {
      window.removeEventListener('shijianus:console-visibility', onConsoleVisibility as EventListener);
      window.removeEventListener('shijianus:notification-visibility', onNotificationVisibility as EventListener);
      window.removeEventListener('shijianus:account-visibility', onAccountVisibility as EventListener);
    };
  }, []);

  const clearSubmenuCloseTimer = () => {
    if (submenuCloseTimerRef.current !== null) {
      window.clearTimeout(submenuCloseTimerRef.current);
      submenuCloseTimerRef.current = null;
    }
  };

  const openSubmenu = (href: string) => {
    clearSubmenuCloseTimer();
    setOpenSubmenuHref(href);
  };

  const queueSubmenuClose = (href?: string, delay = 140) => {
    clearSubmenuCloseTimer();
    submenuCloseTimerRef.current = window.setTimeout(() => {
      setOpenSubmenuHref((current) => {
        if (!href || current === href) return null;
        return current;
      });
      submenuCloseTimerRef.current = null;
    }, delay);
  };

  return (
    <header id="page-header" className={`site-header not-top-img nav-fixed nav-visible`}>
      <nav id="nav" aria-label="主导航">
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
                const hasChildren = Boolean(item.children && item.children.length > 1);
                const submenuOpen = hasChildren && openSubmenuHref === item.href;

                return (
                  <div
                    key={item.href}
                    className={`menus_item ${hasChildren ? 'has-children' : ''} ${submenuOpen ? 'is-open' : ''}`}
                    onPointerEnter={() => {
                      if (hasChildren) openSubmenu(item.href);
                    }}
                    onPointerLeave={() => {
                      if (hasChildren) queueSubmenuClose(item.href);
                    }}
                    onFocus={() => {
                      if (hasChildren) openSubmenu(item.href);
                    }}
                    onBlur={(event) => {
                      if (!hasChildren) return;
                      const relatedTarget = event.relatedTarget;
                      if (relatedTarget instanceof Node && event.currentTarget.contains(relatedTarget)) return;
                      queueSubmenuClose(item.href, 0);
                    }}
                  >
                    <div className="site-page-shell">
                      <a
                        href={item.href}
                        className={`site-page ${itemActive ? 'is-active' : ''}`}
                        data-subtitle={item.description}
                        aria-haspopup={hasChildren ? 'menu' : undefined}
                        aria-expanded={hasChildren ? submenuOpen : undefined}
                      >
                        {renderNavIcon(item.icon, 'site-page__icon')}
                        <div className="site-page__bilingual-stack" style={{ 
                          display: 'flex', 
                          flexDirection: 'column', 
                          alignItems: 'center', 
                          justifyContent: 'center', 
                          textAlign: 'center', 
                          minWidth: '32px', 
                          gap: '0px'
                        }}>
                          <span className="site-page__label" style={{ 
                            letterSpacing: '4px', 
                            marginRight: '-4px', 
                            fontSize: '14px', 
                            fontWeight: 700, 
                            lineHeight: 1.1,
                            display: 'block'
                          }}>
                            {item.label}
                          </span>
                          {item.description && (
                            <span className="site-page__subtitle" style={{ 
                              letterSpacing: '2.5px', 
                              marginRight: '-2.5px', 
                              fontSize: '9px', 
                              fontWeight: 600, 
                              opacity: 0.8, 
                              lineHeight: 1, 
                              marginTop: '2px',
                              display: 'block'
                            }}>
                              {item.description}
                            </span>
                          )}
                        </div>
                      </a>

                      {hasChildren && (
                        <div className="site-page-submenu" role="menu" aria-label={`${item.label} 子页面`} aria-hidden={!submenuOpen}>
                          {item.children.slice(0, 3).map((child) => {
                            return (
                              <a
                                key={child.href}
                                href={child.href}
                                className={`site-page-submenu__item ${isActive(currentPath, child.href) ? 'is-active' : ''}`}
                                role="menuitem"
                                title={child.description ?? child.label}
                              >
                                {renderNavIcon(child.icon, 'site-page-submenu__icon')}
                                <span className="site-page-submenu__label">{child.label}</span>
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
            {isAccountEnabled && (
              <div className="nav-button" id="nav-account">
                <a 
                  className={`site-page ${accountOpen ? 'is-active' : ''}`} 
                  href="#" 
                  title="个人中心"
                  onClick={(e) => {
                    e.preventDefault();
                    openAccountPanel();
                  }}
                >
                  <User size={18} strokeWidth={2.5} aria-hidden="true" />
                </a>
              </div>
            )}

            {showNotificationTrigger && (
              <div className="nav-button" id="nav-notification">
                <a 
                  className={`site-page ${notificationOpen ? 'is-active' : ''}`} 
                  href="#" 
                  data-tooltip="通知中心"
                  onClick={(e) => {
                    e.preventDefault();
                    if (notificationOpen) {
                      closeNotificationPanel();
                    } else {
                      openNotificationPanel();
                    }
                  }}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <Bell size={18} strokeWidth={2.5} aria-hidden="true" />
                  {notificationCount > 0 && <span className="nav-button__badge">{notificationCount}</span>}
                </a>
              </div>
            )}

            <div className="nav-button" id="search-button">
              <a 
                className="site-page social-icon search" 
                href="#" 
                data-tooltip="搜索" 
                onClick={(e) => {
                  e.preventDefault();
                  window.dispatchEvent(new CustomEvent('shijianus:open-search'));
                }}
              >
                <Search size={18} strokeWidth={2.5} aria-hidden="true" />
              </a>
            </div>

            <div className="nav-button" id="nav-theme-toggle">
              <a className="site-page" href="#" data-tooltip="切换主题" onClick={(e) => {
                e.preventDefault();
                window.dispatchEvent(new CustomEvent('shijianus:toggle-theme'));
              }}>
                {theme === 'dark' ? (
                  <SunMedium size={18} strokeWidth={2.5} aria-hidden="true" />
                ) : (
                  <MoonStar size={18} strokeWidth={2.5} aria-hidden="true" />
                )}
              </a>
            </div>

            <div className="nav-button" id="randomPost_button">
              <a className="site-page" href="#" data-tooltip="随机文章" onClick={(e) => {
                e.preventDefault();
                const randomAction = quickActions[Math.floor(Math.random() * quickActions.length)];
                if (randomAction) window.location.href = randomAction.href;
              }}>
                <Dices size={18} strokeWidth={2.5} aria-hidden="true" />
              </a>
            </div>



            {/* === 安知鱼纯正血统：3线矩阵中控台按钮 === */}
            {showCenterConsoleTrigger && (
              <div 
                className="nav-console-btn-anzhiyu relative group flex items-center justify-center w-[35px] h-[35px] ml-2 first:ml-0 cursor-pointer" 
                id="center-console-button"
                data-anzhiyu-tooltip="中控台"
                onClick={(e) => {
                  e.preventDefault();
                  consoleOpen ? closeCenterConsole() : openCenterConsole();
                }}
              >
                <button className={`w-full h-full flex items-center justify-center bg-transparent border-none outline-none ${consoleOpen ? 'is-active' : ''}`} aria-label="中控台">
                  {/* 核心：拒绝SVG，使用纯CSS控制的3条线 */}
                  <div className="anzhiyu-matrix-icon flex flex-col justify-between w-[16px] h-[12px] relative overflow-hidden">
                    <span className="matrix-line line-1 w-full h-[2px] bg-[var(--font-color)] rounded-full transition-all duration-300 origin-center"></span>
                    <span className="matrix-line line-2 w-full h-[2px] bg-[var(--font-color)] rounded-full transition-all duration-300 origin-center"></span>
                    <span className="matrix-line line-3 w-full h-[2px] bg-[var(--font-color)] rounded-full transition-all duration-300 origin-center"></span>
                  </div>
                </button>
              </div>
            )}

            <div id="toggle-menu" className={menuOpen ? 'is-open' : ''}>
              <a
                className="site-page"
                href="#"
                data-tooltip="切换菜单"
                onClick={(e) => {
                  e.preventDefault();
                  setMenuOpen(!menuOpen);
                }}
              >
                <Menu size={18} strokeWidth={2.5} aria-hidden="true" />
              </a>
            </div>

            <div className={`nav-button back-to-top-btn ${progress === 0 ? 'at-top' : ''}`} id="nav-totop">
              <a
                className="totopbtn"
                href="#"
                data-tooltip="回到顶部"
                onClick={(e) => {
                  e.preventDefault();
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              >
                <span className="percent-text" id="percent">{progress}</span>
                <ArrowUp className="arrow-icon" size={18} strokeWidth={2.5} aria-hidden="true" />
              </a>
            </div>
          </div>
        </div>
      </nav>

      {menuOpen && (
        <div className="site-mobile-panel">
          <nav className="site-mobile-panel__group" aria-label="移动端导航">
            {primary.map((item) => (
              <div key={item.href} className="site-mobile-link-group">
                <a
                  href={item.href}
                  className={`site-mobile-link ${isActive(currentPath, item.href) ? 'is-active' : ''}`}
                >
                  {renderNavIcon(item.icon, 'site-mobile-link__icon')}
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
