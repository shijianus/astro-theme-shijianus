import React, { type CSSProperties, useEffect, useMemo, useRef, useState } from 'react';
import {
  Bell,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  AlertCircle,
  Clipboard,
  Copy,
  ExternalLink,
  Languages,
  LogOut,
  MoonStar,
  PanelRightClose,
  PanelRightOpen,
  Save,
  Sparkles,
  RefreshCw,
  Search,
  SunMedium,
  Tags,
  X,
} from 'lucide-react';
import {
  createCommentId,
  getCommentInitials,
  normaliseAvatar,
  normaliseWebsite,
  readAllLocalThreads,
  readCommentIdentity,
  writeCommentIdentity,
  type CommentIdentity,
} from '../lib/comment-client';
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
import { readStoredLocaleVariant, toggleLocaleVariant, type LocaleVariant } from '../lib/client-locale';

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
  consolePanel: {
    enabled: boolean;
    defaultOpen: boolean;
    disabledNotice: string;
  };
  accountPanel: {
    enabled: boolean;
    providerLabel: string;
    title: string;
    summary: string;
    disabledNotice: string;
    loginHint: string;
  };
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
  consolePanel,
  accountPanel,
}: ThemeOverlaysProps) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [consoleOpen, setConsoleOpen] = useState(features.centerConsole && consolePanel.enabled && consolePanel.defaultOpen);
  const [consoleNoticeOpen, setConsoleNoticeOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [theme, setTheme] = useState<ThemeMode>('light');
  const [aside, setAside] = useState<AsideState>('expanded');
  const [background, setBackground] = useState(defaultBackground);
  const [localeVariant, setLocaleVariant] = useState<LocaleVariant>('zh-CN');
  const [account, setAccount] = useState<CommentIdentity | null>(null);
  const [accountForm, setAccountForm] = useState({
    name: '',
    email: '',
    website: '',
    avatar: '',
  });
  const [accountNotice, setAccountNotice] = useState('');
  const [commentThreadVersion, setCommentThreadVersion] = useState(0);
  const [accountNeedsAttention, setAccountNeedsAttention] = useState(false);
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

  const accountNotifications = useMemo(() => {
    if (!accountPanel.enabled || !account) return [];

    return readAllLocalThreads()
      .filter((comment) => {
        if (comment.authorId === account.id) return false;
        return comment.message.includes(`@${account.name}`);
      })
      .sort((left, right) => new Date(right.createdAt).valueOf() - new Date(left.createdAt).valueOf())
      .slice(0, 6);
  }, [account, accountPanel.enabled, commentThreadVersion]);

  const cycleBackground = () => {
    const currentIndex = Math.max(0, backgroundModes.findIndex((mode) => mode.id === background));
    const nextBackground = backgroundModes[(currentIndex + 1) % backgroundModes.length]?.id ?? defaultBackground;
    markBackgroundAsManual(nextBackground);
    setBackground(nextBackground);
  };

  useEffect(() => {
    const syncAccount = () => {
      if (!accountPanel.enabled) {
        setAccount(null);
        setAccountForm({
          name: '',
          email: '',
          website: '',
          avatar: '',
        });
        setAccountNeedsAttention(false);
        return;
      }

      const next = readCommentIdentity();
      setAccount(next);
      setAccountForm({
        name: next?.name ?? '',
        email: next?.email ?? '',
        website: next?.website ?? '',
        avatar: next?.avatar ?? '',
      });
    };

    const onAccountChange = (event: Event) => {
      if (!accountPanel.enabled) {
        setAccount(null);
        setAccountForm({
          name: '',
          email: '',
          website: '',
          avatar: '',
        });
        setAccountNeedsAttention(false);
        return;
      }

      const next = (event as CustomEvent<CommentIdentity | null>).detail ?? readCommentIdentity();
      setAccount(next);
      setAccountForm({
        name: next?.name ?? '',
        email: next?.email ?? '',
        website: next?.website ?? '',
        avatar: next?.avatar ?? '',
      });
      setAccountNeedsAttention(false);
    };

    const onAccountRequired = () => {
      setConsoleNoticeOpen(false);
      setNotificationOpen(false);
      setSearchOpen(false);
      setConsoleOpen(true);
      setAccountNotice(accountPanel.enabled ? accountPanel.loginHint : accountPanel.disabledNotice);
      setAccountNeedsAttention(accountPanel.enabled);
    };

    const onThreadChange = () => {
      setCommentThreadVersion((value) => value + 1);
    };

    const onStorage = (event: StorageEvent) => {
      if (!event.key) return;
      if (event.key === 'shijianus-comment-account' || event.key === 'shijianus-comment-identity') {
        syncAccount();
      }
      if (event.key.startsWith('shijianus-comments:')) {
        setCommentThreadVersion((value) => value + 1);
      }
    };

    syncAccount();
    window.addEventListener('shijianus:comment-account-change', onAccountChange as EventListener);
    window.addEventListener('shijianus:comment-account-required', onAccountRequired);
    window.addEventListener('shijianus:comment-thread-change', onThreadChange);
    window.addEventListener('storage', onStorage);

    return () => {
      window.removeEventListener('shijianus:comment-account-change', onAccountChange as EventListener);
      window.removeEventListener('shijianus:comment-account-required', onAccountRequired);
      window.removeEventListener('shijianus:comment-thread-change', onThreadChange);
      window.removeEventListener('storage', onStorage);
    };
  }, [accountPanel.disabledNotice, accountPanel.enabled, accountPanel.loginHint]);

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

    root.dataset.theme = savedTheme;
    root.dataset.aside = savedAside;
    root.dataset.background = savedBackground;
    root.dataset.backgroundSource = savedBackgroundSource;
    setTheme(savedTheme);
    setAside(savedAside);
    setBackground(savedBackground);
    setLocaleVariant(readStoredLocaleVariant());

    const openSearch = () => {
      setNotificationOpen(false);
      setConsoleNoticeOpen(false);
      setConsoleOpen(false);
      setSearchOpen(true);
    };
    const openConsole = () => {
      if (!features.centerConsole) return;
      setNotificationOpen(false);
      setSearchOpen(false);
      if (!consolePanel.enabled) {
        setConsoleOpen(false);
        setConsoleNoticeOpen(true);
        return;
      }
      setConsoleNoticeOpen(false);
      setConsoleOpen(true);
    };
    const closeConsole = () => {
      setConsoleOpen(false);
      setConsoleNoticeOpen(false);
    };
    const openNotifications = () => {
      if (!accountPanel.enabled) return;
      setConsoleNoticeOpen(false);
      setSearchOpen(false);
      setConsoleOpen(false);
      setNotificationOpen(true);
    };
    const closeNotifications = () => {
      setNotificationOpen(false);
    };
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
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k' && features.searchPanel) {
        event.preventDefault();
        setSearchOpen(true);
        return;
      }

      if (event.key === 'Escape') {
        setSearchOpen(false);
        setConsoleOpen(false);
        setConsoleNoticeOpen(false);
        setNotificationOpen(false);
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
    window.addEventListener('shijianus:close-console', closeConsole);
    window.addEventListener('shijianus:open-notifications', openNotifications);
    window.addEventListener('shijianus:close-notifications', closeNotifications);
    window.addEventListener('shijianus:themechange', onThemeChange as EventListener);
    window.addEventListener('shijianus:backgroundchange', onBackgroundChange as EventListener);
    window.addEventListener('shijianus:localechange', onLocaleChange as EventListener);
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('contextmenu', onContextMenu);
    window.addEventListener('click', closeRightMenu);

    return () => {
      window.removeEventListener('shijianus:open-search', openSearch);
      window.removeEventListener('shijianus:open-console', openConsole);
      window.removeEventListener('shijianus:close-console', closeConsole);
      window.removeEventListener('shijianus:open-notifications', openNotifications);
      window.removeEventListener('shijianus:close-notifications', closeNotifications);
      window.removeEventListener('shijianus:themechange', onThemeChange as EventListener);
      window.removeEventListener('shijianus:backgroundchange', onBackgroundChange as EventListener);
      window.removeEventListener('shijianus:localechange', onLocaleChange as EventListener);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('contextmenu', onContextMenu);
      window.removeEventListener('click', closeRightMenu);
    };
  }, [accountPanel.enabled, consolePanel.enabled, darkBackground, defaultBackground, features.centerConsole, features.rightClickMenu, features.searchPanel]);

  useEffect(() => {
    document.body.classList.toggle('theme-overlay-open', searchOpen || consoleOpen || consoleNoticeOpen || notificationOpen);

    window.dispatchEvent(new CustomEvent('shijianus:console-visibility', { detail: consoleOpen }));
    window.dispatchEvent(new CustomEvent('shijianus:notification-visibility', { detail: notificationOpen }));

    if (searchOpen) {
      window.setTimeout(() => searchInputRef.current?.focus(), 30);
    } else {
      setQuery('');
    }
  }, [consoleNoticeOpen, notificationOpen, searchOpen, consoleOpen]);

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

  const saveAccount = () => {
    if (!accountPanel.enabled) {
      setAccountNotice(accountPanel.disabledNotice);
      return;
    }

    const name = accountForm.name.trim();
    if (!name) {
      setAccountNotice('请先填写昵称。');
      setAccountNeedsAttention(true);
      return;
    }

    const nextAccount: CommentIdentity = {
      id: account?.id ?? createCommentId('user'),
      name,
      email: accountForm.email.trim(),
      website: normaliseWebsite(accountForm.website.trim()),
      avatar: normaliseAvatar(accountForm.avatar),
      role: account?.role ?? 'reader',
    };

    writeCommentIdentity(nextAccount);
    setAccount(nextAccount);
    setAccountNotice('shijianus account 已更新。');
    setAccountNeedsAttention(false);
  };

  const clearAccount = () => {
    writeCommentIdentity(null);
    setAccount(null);
    setAccountForm({
      name: '',
      email: '',
      website: '',
      avatar: '',
    });
    setAccountNotice('当前账号已退出，评论将恢复只读。');
    setAccountNeedsAttention(false);
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
            <div className="console-card-group-left console-card-group-left--stack">
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

              <section
                className={`console-card console-account ${accountNeedsAttention ? 'is-attention' : ''} ${accountPanel.enabled ? '' : 'is-disabled'}`}
              >
                <div className="console-card__head">
                  <div>
                    <p className="author-content-item-tips">{accountPanel.title}</p>
                    <h2 className="author-content-item-title">{account ? account.name : '评论账号'}</h2>
                  </div>
                  <span className="console-card__head-badge">
                    <Bell aria-hidden="true" />
                    <strong>{accountNotifications.length}</strong>
                  </span>
                </div>

                <p>{accountPanel.enabled ? accountPanel.summary : accountPanel.disabledNotice}</p>

                <div className="console-account__identity">
                  <div className="console-account__avatar">
                    {accountForm.avatar ? (
                      <img src={accountForm.avatar} alt={accountForm.name || account?.name || brandName} loading="lazy" />
                    ) : (
                      <span>{getCommentInitials(accountForm.name || account?.name || brandName)}</span>
                    )}
                  </div>
                  <div className="console-account__status-grid">
                    <span>
                      <small>状态</small>
                      <strong>{account ? '已登录' : '访客'}</strong>
                    </span>
                    <span>
                      <small>权限</small>
                      <strong>{account?.role === 'admin' ? '管理员' : '普通读者'}</strong>
                    </span>
                    <span>
                      <small>接入</small>
                      <strong>{accountPanel.enabled ? accountPanel.providerLabel : '未连接'}</strong>
                    </span>
                  </div>
                </div>

                {accountPanel.enabled ? (
                  <div className="console-account__form">
                    <label className="console-account__field">
                      <span>昵称</span>
                      <input
                        value={accountForm.name}
                        onChange={(event) => setAccountForm((current) => ({ ...current, name: event.target.value }))}
                        placeholder="shijianus reader"
                      />
                    </label>
                    <label className="console-account__field">
                      <span>邮箱</span>
                      <input
                        value={accountForm.email}
                        onChange={(event) => setAccountForm((current) => ({ ...current, email: event.target.value }))}
                        placeholder="name@example.com"
                      />
                    </label>
                    <label className="console-account__field">
                      <span>站点</span>
                      <input
                        value={accountForm.website}
                        onChange={(event) => setAccountForm((current) => ({ ...current, website: event.target.value }))}
                        placeholder="https://example.com"
                      />
                    </label>
                    <label className="console-account__field">
                      <span>头像链接</span>
                      <input
                        value={accountForm.avatar}
                        onChange={(event) => setAccountForm((current) => ({ ...current, avatar: event.target.value }))}
                        placeholder="https://..."
                      />
                    </label>
                  </div>
                ) : (
                  <div className="console-account__empty">
                    <AlertCircle aria-hidden="true" />
                    <span>{accountPanel.providerLabel}</span>
                    <strong>评论数据库未接入</strong>
                    <p>{accountPanel.disabledNotice}</p>
                  </div>
                )}

                {accountNotice && <div className="console-account__notice">{accountNotice}</div>}

                <div className="console-account__actions">
                  {account && accountPanel.enabled && (
                    <button type="button" className="theme-icon-button theme-button--ghost" onClick={clearAccount}>
                      <LogOut aria-hidden="true" />
                      <span>退出</span>
                    </button>
                  )}
                  <button
                    type="button"
                    className="theme-icon-button"
                    onClick={saveAccount}
                    disabled={!accountPanel.enabled}
                    title={accountPanel.enabled ? '保存评论账号' : accountPanel.disabledNotice}
                  >
                    <Save aria-hidden="true" />
                    <span>{account ? '更新账号' : '创建账号'}</span>
                  </button>
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

      {accountPanel.enabled && (
        <section className={`theme-notification-overlay ${notificationOpen ? 'show' : ''}`} aria-hidden={!notificationOpen}>
          <button
            type="button"
            className="theme-notification-overlay__mask"
            onClick={() => setNotificationOpen(false)}
            aria-label="Close notifications"
          />
          <div className="theme-notification-drawer" role="dialog" aria-modal="true" aria-label="Notifications">
            <div className="theme-notification-drawer__head">
              <div>
                <p className="eyebrow">Notifications</p>
                <h2>提醒中心</h2>
              </div>
              <button
                type="button"
                className="theme-icon-button theme-button--ghost"
                onClick={() => setNotificationOpen(false)}
                aria-label="Close notifications"
              >
                <X className="overlay-icon" aria-hidden="true" />
              </button>
            </div>

            <div className="theme-notification-drawer__summary">
              <div className="theme-notification-drawer__summary-avatar">
                {account?.avatar ? (
                  <img src={account.avatar} alt={account.name || brandName} loading="lazy" />
                ) : (
                  <span>{getCommentInitials(account?.name || brandName)}</span>
                )}
              </div>
              <div className="theme-notification-drawer__summary-copy">
                <strong>{account ? `${account.name} 的提醒` : '登录后这里会显示提醒'}</strong>
                <p>{account ? `当前共 ${accountNotifications.length} 条 @ 提醒。` : accountPanel.loginHint}</p>
              </div>
            </div>

            {account && accountNotifications.length > 0 ? (
              <div className="console-notification-list theme-notification-drawer__list">
                {accountNotifications.map((comment) => {
                  const href = comment.slug ? `/posts/${comment.slug}/#post-comment` : '#post-comment';
                  return (
                    <a className="console-notification-item theme-notification-drawer__item" href={href} key={comment.id}>
                      <div className="console-notification-item__avatar">
                        {comment.avatar ? (
                          <img src={comment.avatar} alt={comment.name} loading="lazy" />
                        ) : (
                          <span>{getCommentInitials(comment.name)}</span>
                        )}
                      </div>
                      <div className="console-notification-item__body">
                        <strong>{comment.name}</strong>
                        <span>{comment.slug ? `/posts/${comment.slug}/` : '本地提醒'}</span>
                        <p>{comment.message.slice(0, 120)}</p>
                      </div>
                    </a>
                  );
                })}
              </div>
            ) : (
              <div className="console-notification-empty theme-notification-drawer__empty">
                <Bell aria-hidden="true" />
                <strong>{account ? '还没有新的提醒' : '保存账号后这里会显示提醒'}</strong>
                <p>{account ? '当有人 @ 你时，这里会像收件箱一样集中展示。' : accountPanel.loginHint}</p>
              </div>
            )}
          </div>
        </section>
      )}

      {features.centerConsole && !consolePanel.enabled && (
        <section className={`theme-search console-notice ${consoleNoticeOpen ? 'show' : ''}`} aria-hidden={!consoleNoticeOpen}>
          <button
            type="button"
            className="search-mask"
            onClick={() => setConsoleNoticeOpen(false)}
            aria-label="Close console notice"
          />
          <div className="search-dialog console-notice-dialog" role="alertdialog" aria-modal="true" aria-label="Console notice">
            <div className="search-dialog__head">
              <div>
                <p className="eyebrow">Console access</p>
                <h2>控制台暂不可用</h2>
              </div>
              <button
                type="button"
                className="theme-icon-button theme-button--ghost"
                onClick={() => setConsoleNoticeOpen(false)}
                aria-label="Close console notice"
              >
                <X className="overlay-icon" aria-hidden="true" />
              </button>
            </div>

            <div className="console-notice-dialog__body">
              <p>{consolePanel.disabledNotice}</p>
            </div>
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
              <button
                type="button"
                id="menu-translate"
                className="rightMenu-item"
                onClick={() => setLocaleVariant(toggleLocaleVariant(localeVariant))}
              >
                <Languages aria-hidden="true" />
                <span>{localeVariant === 'zh-CN' ? '切换为繁体中文' : '切换为简体中文'}</span>
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
