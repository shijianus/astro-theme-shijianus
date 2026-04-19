import React, { type CSSProperties, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Clipboard,
  Copy,
  ExternalLink,
  MoonStar,
  PanelRightClose,
  PanelRightOpen,
  Sparkles,
  RefreshCw,
  Search,
  SunMedium,
  Tags,
  X,
} from 'lucide-react';
import {
  applyThemeWithBackground,
  readStorage,
  resolveInitialBackground,
  syncAside,
  syncBackground,
  type AsideState,
  type ThemeMode,
} from '../lib/client-theme';

type NavItem = {
  label: string;
  href: string;
  external?: boolean;
};

export type OverlayPostItem = {
  title: string;
  href: string;
  description: string;
  category: string;
  cover: string;
  date: string;
};

export type OverlayTagItem = {
  label: string;
  href: string;
  count: number;
};

export type OverlayArchiveItem = {
  label: string;
  count: number;
};

type BackgroundMode = {
  id: string;
  label: string;
};

type ThemeOverlaysProps = {
  brandName: string;
  authorName: string;
  authorMotto: string;
  posts: OverlayPostItem[];
  tags: OverlayTagItem[];
  archives: OverlayArchiveItem[];
  navItems: NavItem[];
  quickActions: NavItem[];
  stats: {
    posts: number;
    categories: number;
    tags: number;
    readingMinutes: number;
  };
  features: {
    searchPanel: boolean;
    centerConsole: boolean;
    rightClickMenu: boolean;
    particles: boolean;
  };
  particleCount: number;
  defaultBackground: string;
  darkBackground: string;
  backgroundModes: readonly BackgroundMode[];
};

function isEditableTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  return Boolean(target.closest('input, textarea, select, [contenteditable="true"]'));
}

function clampPosition(value: number, size: number, viewportSize: number) {
  return Math.max(12, Math.min(value, viewportSize - size - 12));
}

export function ThemeOverlays({
  brandName,
  authorName,
  authorMotto,
  posts,
  tags,
  archives,
  navItems,
  quickActions,
  stats,
  features,
  particleCount,
  defaultBackground,
  darkBackground,
  backgroundModes,
}: ThemeOverlaysProps) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [consoleOpen, setConsoleOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [theme, setTheme] = useState<ThemeMode>('light');
  const [aside, setAside] = useState<AsideState>('expanded');
  const [background, setBackground] = useState(defaultBackground);
  const [rightMenu, setRightMenu] = useState<{ open: boolean; x: number; y: number; selectedText: string }>({
    open: false,
    x: 0,
    y: 0,
    selectedText: '',
  });
  const searchInputRef = useRef<HTMLInputElement>(null);

  const particles = useMemo(() => {
    return Array.from({ length: particleCount }, (_, index) => ({
      left: `${(index * 37) % 100}%`,
      top: `${(index * 53) % 100}%`,
      delay: `${(index % 12) * 0.28}s`,
      duration: `${6 + (index % 7)}s`,
      size: `${2 + (index % 3)}px`,
    }));
  }, [particleCount]);

  const filteredPosts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return posts.slice(0, 6);

    return posts
      .filter((post) => {
        const target = `${post.title} ${post.description} ${post.category}`.toLowerCase();
        return target.includes(normalizedQuery);
      })
      .slice(0, 8);
  }, [posts, query]);

  const cycleBackground = () => {
    const currentIndex = Math.max(0, backgroundModes.findIndex((mode) => mode.id === background));
    const nextBackground = backgroundModes[(currentIndex + 1) % backgroundModes.length]?.id ?? defaultBackground;
    syncBackground(nextBackground);
    setBackground(nextBackground);
  };

  useEffect(() => {
    const savedTheme =
      (readStorage('shijianus-theme') as ThemeMode | null) ??
      (document.documentElement.dataset.theme as ThemeMode | undefined) ??
      'light';
    const savedAside =
      (readStorage('shijianus-aside') as AsideState | null) ??
      (document.documentElement.dataset.aside as AsideState | undefined) ??
      'expanded';
    const savedBackground =
      resolveInitialBackground(
        savedTheme,
        readStorage('shijianus-background') ?? document.documentElement.dataset.background ?? null,
        { defaultBackground, darkBackground },
      );

    document.documentElement.dataset.theme = savedTheme;
    document.documentElement.dataset.aside = savedAside;
    document.documentElement.dataset.background = savedBackground;
    setTheme(savedTheme);
    setAside(savedAside);
    setBackground(savedBackground);

    const openSearch = () => setSearchOpen(true);
    const openConsole = () => setConsoleOpen(true);
    const onThemeChange = (event: Event) => {
      const customEvent = event as CustomEvent<ThemeMode>;
      setTheme(customEvent.detail ?? 'light');
    };
    const onBackgroundChange = (event: Event) => {
      const customEvent = event as CustomEvent<string>;
      setBackground(customEvent.detail ?? defaultBackground);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k' && features.searchPanel) {
        event.preventDefault();
        setSearchOpen(true);
        return;
      }

      if (event.key === 'Escape') {
        setSearchOpen(false);
        setConsoleOpen(false);
        setRightMenu((menu) => ({ ...menu, open: false }));
      }
    };
    const onContextMenu = (event: MouseEvent) => {
      if (!features.rightClickMenu || isEditableTarget(event.target)) return;
      event.preventDefault();
      const selectedText = window.getSelection()?.toString().trim() ?? '';

      setRightMenu({
        open: true,
        x: clampPosition(event.clientX, 180, window.innerWidth),
        y: clampPosition(event.clientY, 290, window.innerHeight),
        selectedText,
      });
    };
    const closeRightMenu = () => setRightMenu((menu) => ({ ...menu, open: false }));

    window.addEventListener('shijianus:open-search', openSearch);
    window.addEventListener('shijianus:open-console', openConsole);
    window.addEventListener('shijianus:themechange', onThemeChange as EventListener);
    window.addEventListener('shijianus:backgroundchange', onBackgroundChange as EventListener);
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('contextmenu', onContextMenu);
    window.addEventListener('click', closeRightMenu);

    return () => {
      window.removeEventListener('shijianus:open-search', openSearch);
      window.removeEventListener('shijianus:open-console', openConsole);
      window.removeEventListener('shijianus:themechange', onThemeChange as EventListener);
      window.removeEventListener('shijianus:backgroundchange', onBackgroundChange as EventListener);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('contextmenu', onContextMenu);
      window.removeEventListener('click', closeRightMenu);
    };
  }, [darkBackground, defaultBackground, features.rightClickMenu, features.searchPanel]);

  useEffect(() => {
    document.body.classList.toggle('theme-overlay-open', searchOpen || consoleOpen);

    if (searchOpen) {
      window.setTimeout(() => searchInputRef.current?.focus(), 30);
    } else {
      setQuery('');
    }
  }, [searchOpen, consoleOpen]);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    const nextBackground = applyThemeWithBackground(nextTheme, {
      defaultBackground,
      darkBackground,
    });
    setTheme(nextTheme);
    setBackground(nextBackground);
  };

  const toggleAside = () => {
    const nextAside = aside === 'expanded' ? 'collapsed' : 'expanded';
    syncAside(nextAside);
    setAside(nextAside);
  };

  const copyText = async (value: string) => {
    if (!value) return false;

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(value);
        return true;
      }
    } catch {}

    try {
      const textarea = document.createElement('textarea');
      textarea.value = value;
      textarea.setAttribute('readonly', '');
      textarea.style.position = 'fixed';
      textarea.style.left = '-9999px';
      textarea.style.top = '0';
      document.body.appendChild(textarea);
      textarea.select();
      const copied = document.execCommand('copy');
      textarea.remove();
      return copied;
    } catch {
      return false;
    }
  };

  return (
    <>
      {features.particles && (
        <div className="theme-particles" aria-hidden="true">
          {particles.map((particle, index) => (
            <span
              key={index}
              className="theme-particle"
              style={
                {
                  '--particle-left': particle.left,
                  '--particle-top': particle.top,
                  '--particle-delay': particle.delay,
                  '--particle-duration': particle.duration,
                  '--particle-size': particle.size,
                } as CSSProperties
              }
            />
          ))}
        </div>
      )}

      {features.searchPanel && (
        <section id="local-search" className={`theme-search ${searchOpen ? 'show' : ''}`} aria-hidden={!searchOpen}>
          <button type="button" className="search-mask" onClick={() => setSearchOpen(false)} aria-label="Close search" />
          <div className="search-dialog" role="dialog" aria-modal="true" aria-label="Search posts">
            <div className="search-dialog__head">
              <div>
                <p className="eyebrow">Search</p>
                <h2>{brandName} 内容索引</h2>
              </div>
              <button type="button" className="theme-icon-button theme-button--ghost" onClick={() => setSearchOpen(false)} aria-label="Close search">
                <X className="overlay-icon" aria-hidden="true" />
              </button>
            </div>

            <label className="search-input-wrap">
              <Search className="overlay-icon" aria-hidden="true" />
              <input
                ref={searchInputRef}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="搜索标题、摘要或分类"
              />
              <span>Ctrl K</span>
            </label>

            <div className="search-result-list">
              {filteredPosts.length > 0 ? (
                filteredPosts.map((post) => (
                  <a className="search-result-item" href={post.href} key={post.href}>
                    <img src={post.cover} alt="" loading="lazy" />
                    <span className="search-result-item__content">
                      <span className="search-result-item__meta">
                        {post.category} / {post.date}
                      </span>
                      <strong>{post.title}</strong>
                      <span>{post.description}</span>
                    </span>
                  </a>
                ))
              ) : (
                <p className="search-empty">没有找到匹配内容</p>
              )}
            </div>
          </div>
        </section>
      )}

      {features.centerConsole && (
        <section id="console" className={consoleOpen ? 'show' : ''} aria-hidden={!consoleOpen}>
          <button type="button" className="console-mask" onClick={() => setConsoleOpen(false)} aria-label="Close console" />
          <div className="console-card-group" role="dialog" aria-modal="true" aria-label="Theme console">
            <div className="console-card-group-left">
              <section className="console-card console-profile">
                <p className="author-content-item-tips">{brandName} console</p>
                <h2 className="author-content-item-title">{authorName}</h2>
                <p>{authorMotto}</p>
                <div className="console-stat-grid">
                  <span>
                    <strong>{stats.posts}</strong>
                    <small>文章</small>
                  </span>
                  <span>
                    <strong>{stats.categories}</strong>
                    <small>分类</small>
                  </span>
                  <span>
                    <strong>{stats.tags}</strong>
                    <small>标签</small>
                  </span>
                  <span>
                    <strong>{stats.readingMinutes}m</strong>
                    <small>阅读</small>
                  </span>
                </div>
              </section>
            </div>

            <div className="console-card-group-right">
              <section className="console-card tags">
                <p className="author-content-item-tips">Interests</p>
                <h2 className="author-content-item-title">标签与入口</h2>
                <div className="card-tag-cloud">
                  {tags.slice(0, 18).map((tag) => (
                    <a href={tag.href} key={tag.href}>
                      {tag.label}
                      <sup>{tag.count}</sup>
                    </a>
                  ))}
                </div>
              </section>

              <section className="console-card history">
                <ul className="card-archive-list">
                  {archives.slice(0, 8).map((archive) => (
                    <li className="card-archive-list-item" key={archive.label}>
                      <a className="card-archive-list-link" href="/archives/">
                        <span className="card-archive-list-date">{archive.label}</span>
                        <span className="card-archive-list-count-group">
                          <span className="card-archive-list-count">{archive.count}</span>
                          <span>篇</span>
                        </span>
                      </a>
                    </li>
                  ))}
                </ul>
              </section>
            </div>
          </div>

          <div className="button-group" aria-label="Console controls">
            <button type="button" className={`console-btn-item ${theme === 'dark' ? 'on' : ''}`} onClick={toggleTheme} title="切换深浅色">
              {theme === 'dark' ? <SunMedium aria-hidden="true" /> : <MoonStar aria-hidden="true" />}
            </button>
            <button type="button" className="console-btn-item" onClick={toggleAside} title="切换侧栏">
              {aside === 'expanded' ? <PanelRightClose aria-hidden="true" /> : <PanelRightOpen aria-hidden="true" />}
            </button>
            <button type="button" className="console-btn-item" onClick={() => setSearchOpen(true)} title="打开搜索">
              <Search aria-hidden="true" />
            </button>
            <button type="button" className="console-btn-item" onClick={cycleBackground} title="切换背景">
              <Sparkles aria-hidden="true" />
            </button>
            <button type="button" className="console-btn-item" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} title="回到顶部">
              <ArrowUp aria-hidden="true" />
            </button>
          </div>
        </section>
      )}

      {features.rightClickMenu && (
        <>
          <div id="rightmenu-mask" className={rightMenu.open ? 'show' : ''} aria-hidden="true" />
          <nav
            id="rightMenu"
            className={rightMenu.open ? 'show' : ''}
            style={{ left: rightMenu.x, top: rightMenu.y }}
            aria-label="Context menu"
          >
            <div className="rightMenu-group rightMenu-small">
              <button type="button" className="rightMenu-item" onClick={() => window.history.back()} title="后退">
                <ArrowLeft aria-hidden="true" />
              </button>
              <button type="button" className="rightMenu-item" onClick={() => window.history.forward()} title="前进">
                <ArrowRight aria-hidden="true" />
              </button>
              <button type="button" className="rightMenu-item" onClick={() => window.location.reload()} title="刷新">
                <RefreshCw aria-hidden="true" />
              </button>
              <button type="button" className="rightMenu-item" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} title="顶部">
                <ArrowUp aria-hidden="true" />
              </button>
            </div>

            <div className="rightMenu-group rightMenu-line">
              <button type="button" className="rightMenu-item" onClick={() => copyText(rightMenu.selectedText || document.title)}>
                <Copy aria-hidden="true" />
                <span>复制选中文本</span>
              </button>
              <button type="button" className="rightMenu-item" onClick={() => copyText(window.location.href)}>
                <Clipboard aria-hidden="true" />
                <span>复制地址</span>
              </button>
              <button type="button" className="rightMenu-item" onClick={() => setSearchOpen(true)}>
                <Search aria-hidden="true" />
                <span>站内搜索</span>
              </button>
              <button type="button" className="rightMenu-item" onClick={toggleTheme}>
                {theme === 'dark' ? <SunMedium aria-hidden="true" /> : <MoonStar aria-hidden="true" />}
                <span>{theme === 'dark' ? '浅色模式' : '深色模式'}</span>
              </button>
            </div>

            <div className="rightMenu-group rightMenu-line">
              {quickActions.slice(0, 2).map((item) => (
                <a className="rightMenu-item" href={item.href} key={item.href}>
                  <ExternalLink aria-hidden="true" />
                  <span>{item.label}</span>
                </a>
              ))}
              <a className="rightMenu-item" href="/categories/">
                <Tags aria-hidden="true" />
                <span>博客分类</span>
              </a>
              {navItems.slice(2, 5).map((item) => (
                <a className="rightMenu-item" href={item.href} key={item.href}>
                  <ExternalLink aria-hidden="true" />
                  <span>{item.label}</span>
                </a>
              ))}
            </div>
          </nav>
        </>
      )}
    </>
  );
}
