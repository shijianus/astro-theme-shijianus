import React, { type CSSProperties, useEffect, useMemo, useRef, useState } from 'react';
import {
  UserRound,
  Bell,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Clipboard,
  Copy,
  ExternalLink,
  LogOut,
  MoonStar,
  Save,
  Sparkles,
  RefreshCw,
  Search,
  SunMedium,
  Tags,
  MessageSquare,
  LayoutGrid,
  Info,
  History,
  X,
} from 'lucide-react';
import { siteConfig } from '../config/site';
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
  type ThemeMode,
} from '../lib/client-theme';
import { applyLocaleVariant, readStoredLocaleVariant, type LocaleVariant } from '../lib/client-locale';

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
  pageType: string;
  consolePanel: {
    enabled: boolean;
    defaultOpen: boolean;
    disabledNotice: string;
  };
  accountPanel: {
    enabled: boolean;
    remoteConnected: boolean;
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
  pageType: initialPageType,
  consolePanel,
  accountPanel,
}: ThemeOverlaysProps) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [consoleOpen, setConsoleOpen] = useState(features.centerConsole && consolePanel.enabled && consolePanel.defaultOpen);
  const [consoleNoticeOpen, setConsoleNoticeOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [theme, setTheme] = useState<ThemeMode>('light');
  const [background, setBackground] = useState(defaultBackground);
  const [localeVariant, setLocaleVariant] = useState<LocaleVariant>('zh-CN');
  const [account, setAccount] = useState<CommentIdentity | null>(null);
  const [pageType, setPageType] = useState(initialPageType || 'page');
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
  const [activityMessage, setActivityMessage] = useState('');
  const [activityVisible, setActivityVisible] = useState(false);
  const [latestComment, setLatestComment] = useState<{ name: string; content: string; date: string } | null>(null);
  const [selectedActivityDate, setSelectedActivityDate] = useState<string | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const activityTimerRef = useRef<number | null>(null);
  const lastActivityRef = useRef({
    message: '',
    at: 0,
  });

  useEffect(() => {
    // Fetch latest hot comment if available
    const threads = readAllLocalThreads();
    if (threads.length > 0) {
      const sorted = [...threads].sort((a, b) => (b.votes || 0) - (a.votes || 0));
      const top = sorted[0];
      setLatestComment({
        name: top.name,
        content: top.message,
        date: new Date(top.createdAt).toLocaleDateString('zh-CN'),
      });
    }
  }, [commentThreadVersion]);

  // Calculate activity grid data (GitHub style, starting from a fixed past date up to today)
  const activityData = useMemo(() => {
    // We'll show exactly 26 weeks (182 days) ending at the last Saturday or today's week
    const now = new Date();
    const pstOffset = 8 * 3600000;
    const today = new Date(now.getTime() - pstOffset);
    today.setHours(0, 0, 0, 0);
    
    const data = [];
    const weeksToShow = 26;
    const totalDays = weeksToShow * 7;
    
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - totalDays + (7 - today.getDay() - 1));

    for (let i = 0; i < totalDays; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + i);
      
      if (currentDate > today) {
        data.push(null);
        continue;
      }

      const postsOnDate = posts.filter(p => new Date(p.date).toDateString() === currentDate.toDateString());
      const interactionLevel = Math.floor(Math.random() * 2); 
      const level = postsOnDate.length > 0 ? Math.min(4, postsOnDate.length + 1) : interactionLevel > 0 ? 1 : 0;
      const sparkle = level > 2 ? 0.4 + (level * 0.1) : 0;

      data.push({
        date: currentDate.toLocaleDateString('zh-CN'),
        level,
        sparkle,
        posts: postsOnDate.map(p => ({ title: p.title, href: p.href })),
      });
    }
    return data;
  }, [posts]);

  const selectedActivity = useMemo(() => {
    if (!selectedActivityDate) return null;
    return activityData.find(d => d && d.date === selectedActivityDate);
  }, [selectedActivityDate, activityData]);

  const monthLabels = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const labels = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      labels.push(months[d.getMonth()]);
    }
    return labels;
  }, []);

  const siteStats = useMemo(() => {
    return [
      { label: '本站字数', value: `${(stats.readingMinutes * 312).toLocaleString()} 字` },
      { label: '建站天数', value: `${Math.floor((Date.now() - new Date('2024-01-01').valueOf()) / 86400000)} 天` },
      { label: '最后推送', value: posts[0]?.date || '今天' },
      { label: '当前版本', value: 'v2.5.0-shijianus' },
      { label: '活跃层级', value: 'Lv.4 Maintainer' },
      { label: '内容密度', value: 'High Activity' },
    ];
  }, [stats, posts]);

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

  const allNotifications = useMemo(() => {
    const messages = [];

    // Site-wide messages (e.g., new articles)
    const siteMessages = posts.slice(0, 3).map((post) => ({
      id: `article-${post.href}`,
      type: 'article',
      title: '最新文章',
      content: post.title,
      href: post.href,
      date: post.date,
      icon: <Tags className="h-4 w-4" />,
    }));
    messages.push(...siteMessages);

    // Personal account notifications
    if (account) {
      const personalMessages = readAllLocalThreads()
        .filter((comment) => {
          if (comment.authorId === account.id) return false;
          return comment.message.includes(`@${account.name}`);
        })
        .map((comment) => ({
          id: `comment-${comment.id}`,
          type: 'mention',
          title: '提到我的评论',
          content: comment.message,
          href: comment.slug ? `/posts/${comment.slug}/#post-comment` : '#post-comment',
          date: new Date(comment.createdAt).toLocaleDateString('zh-CN'),
          author: comment.name,
          avatar: comment.avatar,
          icon: <UserRound className="h-4 w-4" />,
          timestamp: new Date(comment.createdAt).valueOf(),
        }));
      messages.push(...personalMessages);
    }

    // Sort by date (descending)
    messages.sort((a, b) => {
      const timeA = 'timestamp' in a ? (a.timestamp as number) : new Date(a.date).valueOf();
      const timeB = 'timestamp' in b ? (b.timestamp as number) : new Date(b.date).valueOf();
      return timeB - timeA;
    });

    // Apply 30-day and 10-message limit
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    return messages
      .filter((msg) => {
        const msgTime = 'timestamp' in msg ? (msg.timestamp as number) : new Date(msg.date).valueOf();
        return msgTime > thirtyDaysAgo;
      })
      .slice(0, 10);
  }, [account, posts, commentThreadVersion]);

  const emitActivity = (message: string) => {
    if (!message.trim()) return;
    window.dispatchEvent(new CustomEvent('shijianus:activity', { detail: { message } }));
  };

  const cycleBackground = () => {
    const currentIndex = Math.max(0, backgroundModes.findIndex((mode) => mode.id === background));
    const nextBackground = backgroundModes[(currentIndex + 1) % backgroundModes.length]?.id ?? defaultBackground;
    markBackgroundAsManual(nextBackground);
    setBackground(nextBackground);
  };

  useEffect(() => {
    const syncAccount = () => {
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
      setSearchOpen(false);
      setConsoleOpen(false);
      setNotificationOpen(true);
      setAccountNotice(accountPanel.loginHint);
      setAccountNeedsAttention(true);
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
  }, [accountPanel.loginHint]);

  useEffect(() => {
    const root = document.documentElement;
    setPageType(document.body?.dataset.type ?? initialPageType ?? 'page');
    const savedTheme =
      (readStorage('shijianus-theme') as ThemeMode | null) ??
      (root.dataset.theme as ThemeMode | undefined) ??
      'light';
    const savedAside = readStorage('shijianus-aside') ?? root.dataset.aside ?? 'expanded';
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
  }, [consolePanel.enabled, darkBackground, defaultBackground, features.centerConsole, features.rightClickMenu, features.searchPanel, initialPageType]);

  useEffect(() => {
    document.body.classList.toggle('theme-overlay-open', searchOpen || consoleOpen || consoleNoticeOpen || notificationOpen);

    window.dispatchEvent(new CustomEvent('shijianus:console-visibility', { detail: consoleOpen }));
    window.dispatchEvent(new CustomEvent('shijianus:notification-visibility', { detail: notificationOpen }));
    window.dispatchEvent(new CustomEvent('shijianus:account-visibility', { detail: notificationOpen })); // Linking account and notification panel for now as they share the overlay

    if (searchOpen) {
      window.setTimeout(() => searchInputRef.current?.focus(), 30);
    } else {
      setQuery('');
    }
  }, [consoleNoticeOpen, notificationOpen, searchOpen, consoleOpen]);

  useEffect(() => {
    const showActivity = (message: string) => {
      if (!message.trim()) return;
      lastActivityRef.current = {
        message,
        at: Date.now(),
      };
      setActivityMessage(message);
      setActivityVisible(true);
      if (activityTimerRef.current !== null) {
        window.clearTimeout(activityTimerRef.current);
      }
      activityTimerRef.current = window.setTimeout(() => {
        setActivityVisible(false);
        activityTimerRef.current = null;
      }, 5000);
    };

    const onActivity = (event: Event) => {
      const detail = (event as CustomEvent<{ message?: string } | string>).detail;
      const message = typeof detail === 'string' ? detail : detail?.message ?? '';
      showActivity(message);
    };

    const onCopy = () => {
      const { at, message } = lastActivityRef.current;
      if (Date.now() - at < 350 && message.includes('复制')) return;
      showActivity('已复制当前内容');
    };

    window.addEventListener('shijianus:activity', onActivity as EventListener);
    document.addEventListener('copy', onCopy);

    return () => {
      window.removeEventListener('shijianus:activity', onActivity as EventListener);
      document.removeEventListener('copy', onCopy);
      if (activityTimerRef.current !== null) {
        window.clearTimeout(activityTimerRef.current);
      }
    };
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    const nextBackground = applyThemeWithBackground(nextTheme, {
      defaultBackground,
      darkBackground,
    });
    setTheme(nextTheme);
    setBackground(nextBackground);
    emitActivity(nextTheme === 'dark' ? '已切换为深色模式' : '已切换为浅色模式');
  };

  const saveAccount = () => {
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
    setAccountNotice(account ? '账号资料已更新。' : '账号已创建。');
    setAccountNeedsAttention(false);
    emitActivity(account ? '已更新账号资料' : '已创建评论账号');
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
    emitActivity('已退出当前账号');
  };

  const selectLocale = (nextLocale: LocaleVariant) => {
    const applied = applyLocaleVariant(nextLocale);
    setLocaleVariant(applied);
    emitActivity(
      applied === 'zh-Hant'
        ? '已切换为繁體中文'
        : applied === 'en'
          ? '已切换为英文界面'
          : '已切换为简体中文',
    );
  };

  const accountAccessLabel = account ? '已登录' : '访客';
  const accountBridgeLabel = accountPanel.remoteConnected ? accountPanel.providerLabel : '本地身份';
  const accountBridgeNote = accountPanel.remoteConnected ? `当前已接入 ${accountPanel.providerLabel}。` : accountPanel.disabledNotice;

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

  const scrollToSelector = (selector: string, message: string) => {
    const target = document.querySelector<HTMLElement>(selector);
    if (!target) {
      emitActivity('当前页面暂时没有这个入口');
      return;
    }

    const headerHeight = Number.parseFloat(
      document.documentElement.style.getPropertyValue('--site-header-height') ||
        window.getComputedStyle(document.documentElement).getPropertyValue('--site-header-height') ||
        '0',
    );
    const offset = Math.max(72, Math.round(headerHeight || 72) + 18);
    const top = Math.max(0, window.scrollY + target.getBoundingClientRect().top - offset);
    setConsoleOpen(false);
    setConsoleNoticeOpen(false);
    window.scrollTo({ top, behavior: 'smooth' });
    emitActivity(message);
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

      <div className={`theme-activity-bar ${activityVisible ? 'show' : ''}`} aria-live="polite">
        <span className="theme-activity-bar__label">提示</span>
        <strong>{activityMessage}</strong>
      </div>

      {features.searchPanel && (
        <section id="local-search" className={`theme-search ${searchOpen ? 'show' : ''}`} aria-hidden={!searchOpen}>
          <button type="button" className="search-mask" onClick={() => setSearchOpen(false)} aria-label="关闭搜索面板" />
          <div className="search-dialog" role="dialog" aria-modal="true" aria-label="站内搜索">
            <div className="search-dialog__head">
              <div>
                <p className="eyebrow">站内搜索</p>
                <h2>{brandName} 内容索引</h2>
              </div>
              <button type="button" className="theme-icon-button theme-button--ghost" onClick={() => setSearchOpen(false)} aria-label="关闭搜索面板">
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
                    <img src={post.cover} alt="" loading="lazy" data-fallback-src={siteConfig.post.hero.fallbackImage} />
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
          <button type="button" className="console-mask" onClick={() => setConsoleOpen(false)} aria-label="关闭控制台" />
          <div className="console-card-group" role="dialog" aria-modal="true" aria-label="快捷控制台">
            <div className="console-card-group-left console-card-group-left--stack">
              <section className="console-card console-profile">
                <p className="author-content-item-tips">个人中心</p>
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

              <section className="console-card console-webinfo">
                <div className="console-card__head">
                  <div>
                    <p className="author-content-item-tips">运行状态</p>
                    <h2 className="author-content-item-title">站点概览</h2>
                  </div>
                  <Info className="h-5 w-5 text-theme-main" />
                </div>
                <div className="console-webinfo-grid">
                  {siteStats.map((stat, i) => (
                    <div className="webinfo-item" key={i}>
                      <span>{stat.label}</span>
                      <strong>{stat.value}</strong>
                    </div>
                  ))}
                </div>
                <div className="console-shortcuts__grid">
                  <a className="console-shortcuts__item" href="/archives/">
                    <History className="h-4 w-4" />
                    <strong>归档</strong>
                  </a>
                  <a className="console-shortcuts__item" href="/status/">
                    <LayoutGrid className="h-4 w-4" />
                    <strong>监控</strong>
                  </a>
                </div>
              </section>
            </div>

            <div className="console-card-group-right">
              <section className="console-card activity">
                <p className="author-content-item-tips">维护活跃度</p>
                <h2 className="author-content-item-title">更新记录</h2>
                <div className="activity-month-labels">
                  {monthLabels.map((m, i) => <span key={i}>{m}</span>)}
                </div>
                <div className="console-activity-grid">
                  {activityData.map((day, i) => (
                    <div 
                      key={i} 
                      className={`activity-cell ${day ? 'level-' + day.level : 'is-future'} ${day?.sparkle ? 'sparkle' : ''}`} 
                      style={day ? ({ '--sparkle-opacity': day.sparkle } as CSSProperties) : {}}
                      title={day ? `${day.date}${day.posts.length > 0 ? '\n' + day.posts.map(p => '· ' + p.title).join('\n') : ''}` : ''}
                      onClick={() => {
                        if (day) setSelectedActivityDate(day.date);
                      }}
                    />
                  ))}
                </div>
                <div className="activity-legend">
                  <div className="selected-day-preview">
                    {selectedActivity ? (
                      <div className="activity-details">
                        <strong>{selectedActivity.date}</strong>
                        {selectedActivity.posts.length > 0 ? (
                          <ul>
                            {selectedActivity.posts.slice(0, 5).map((p, i) => (
                              <li key={i}><a href={p.href}>{p.title}</a></li>
                            ))}
                          </ul>
                        ) : <span>当日无推送记录</span>}
                      </div>
                    ) : <span>点击方块查看记录</span>}
                  </div>
                  <div className="legend-group">
                    <span>Less</span>
                    <div className="activity-cell level-0" />
                    <div className="activity-cell level-1" />
                    <div className="activity-cell level-2" />
                    <div className="activity-cell level-3" />
                    <div className="activity-cell level-4" />
                    <span>More</span>
                  </div>
                </div>
              </section>

              {latestComment ? (
                <section className="console-card hot-comment">
                  <div className="console-card__head">
                    <div>
                      <p className="author-content-item-tips">活跃互动</p>
                      <h2 className="author-content-item-title">最近热评</h2>
                    </div>
                    <MessageSquare className="h-5 w-5 text-theme-main" />
                  </div>
                  <div className="hot-comment-body">
                    <div className="hot-comment-meta">
                      <strong>{latestComment.name}</strong>
                      <time>{latestComment.date}</time>
                    </div>
                    <p>{latestComment.content}</p>
                  </div>
                </section>
              ) : (
                <section className="console-card tags">
                  <p className="author-content-item-tips">热门话题</p>
                  <h2 className="author-content-item-title">内容发现</h2>
                  <div className="card-tag-cloud">
                    {tags.slice(0, 15).map((tag) => (
                      <a href={tag.href} key={tag.href}>
                        {tag.label}
                        <sup>{tag.count}</sup>
                      </a>
                    ))}
                  </div>
                </section>
              )}
            </div>
          </div>

          <div className="button-group" aria-label="控制台快捷操作">
            <button type="button" className={`console-btn-item ${theme === 'dark' ? 'on' : ''}`} onClick={toggleTheme} title="切换深浅色">
              {theme === 'dark' ? <SunMedium aria-hidden="true" /> : <MoonStar aria-hidden="true" />}
            </button>
            <button
              type="button"
              className="console-btn-item"
              onClick={() => {
                setConsoleOpen(false);
                setSearchOpen(true);
                emitActivity('已打开站内搜索');
              }}
              title="搜索内容"
            >
              <Search aria-hidden="true" />
            </button>
            <button
              type="button"
              className="console-btn-item"
              onClick={() => {
                cycleBackground();
                emitActivity('已切换页面背景');
              }}
              title="背景切换"
            >
              <Sparkles aria-hidden="true" />
            </button>
            <button
              type="button"
              className="console-btn-item"
              onClick={() => {
                window.dispatchEvent(new CustomEvent('shijianus:open-notifications'));
                emitActivity('已打开通知中心');
              }}
              title="查看通知"
            >
              <Bell aria-hidden="true" />
            </button>
            <button
              type="button"
              className="console-btn-item"
              onClick={() => {
                const randomPost = posts[Math.floor(Math.random() * posts.length)];
                if (randomPost) window.location.href = randomPost.href;
              }}
              title="随便逛逛"
            >
              <RefreshCw aria-hidden="true" />
            </button>
            <button
              type="button"
              className="console-btn-item"
              onClick={() => {
                window.scrollTo({ top: 0, behavior: 'smooth' });
                setConsoleOpen(false);
                emitActivity('已回到页面顶部');
              }}
              title="回到顶部"
            >
              <ArrowUp aria-hidden="true" />
            </button>
          </div>
        </section>
      )}

      <section className={`theme-account-overlay ${notificationOpen ? 'show' : ''}`} aria-hidden={!notificationOpen}>
        <button
          type="button"
          className="theme-account-overlay__mask"
          onClick={() => setNotificationOpen(false)}
          aria-label="关闭账号面板"
        />
        <div className="theme-account-drawer" role="dialog" aria-modal="true" aria-label="账号面板">
            <div className="theme-account-drawer__head">
              <div>
                <p className="eyebrow">账号</p>
                <h2>账号中心</h2>
              </div>
            <button
              type="button"
              className="theme-icon-button theme-button--ghost"
              onClick={() => setNotificationOpen(false)}
              aria-label="关闭账号面板"
            >
              <X className="overlay-icon" aria-hidden="true" />
            </button>
          </div>

          <div className="theme-account-drawer__summary">
            <div className="theme-account-drawer__summary-avatar">
              {account?.avatar ? (
                <img src={account.avatar} alt={account.name || brandName} loading="lazy" />
              ) : (
                <span>{getCommentInitials(account?.name || brandName)}</span>
              )}
            </div>
            <div className="theme-account-drawer__summary-copy">
              <strong>{account ? account.name : '尚未登录'}</strong>
              <p>{account ? `${accountAccessLabel} · ${accountBridgeLabel}` : accountPanel.summary}</p>
            </div>
            <div className="theme-account-drawer__summary-badge">
              <Bell aria-hidden="true" />
              <strong>{allNotifications.length}</strong>
              <small>提醒</small>
            </div>
          </div>

          <div className="theme-account-drawer__body">
            <section className={`theme-account-panel ${accountNeedsAttention ? 'is-attention' : ''}`}>
              <div className="theme-account-panel__head">
                <div>
                  <p className="author-content-item-tips">{accountPanel.title}</p>
                  <h3>{account ? '更新资料' : '登录 / 注册'}</h3>
                </div>
                <span>{accountBridgeLabel}</span>
              </div>

              <p>{accountBridgeNote}</p>

              <div className="theme-account-panel__form">
                <label className="theme-account-panel__field">
                  <span>昵称</span>
                  <input
                    value={accountForm.name}
                    onChange={(event) => setAccountForm((current) => ({ ...current, name: event.target.value }))}
                    placeholder="输入公开显示的昵称"
                  />
                </label>
                <label className="theme-account-panel__field">
                  <span>邮箱</span>
                  <input
                    value={accountForm.email}
                    onChange={(event) => setAccountForm((current) => ({ ...current, email: event.target.value }))}
                    placeholder="name@example.com"
                  />
                </label>
                <label className="theme-account-panel__field">
                  <span>个人站点</span>
                  <input
                    value={accountForm.website}
                    onChange={(event) => setAccountForm((current) => ({ ...current, website: event.target.value }))}
                    placeholder="https://example.com"
                  />
                </label>
                <label className="theme-account-panel__field">
                  <span>头像链接</span>
                  <input
                    value={accountForm.avatar}
                    onChange={(event) => setAccountForm((current) => ({ ...current, avatar: event.target.value }))}
                    placeholder="https://..."
                  />
                </label>
              </div>

              {accountNotice && <div className="theme-account-panel__notice">{accountNotice}</div>}

              <div className="theme-account-panel__actions">
                {account && (
                  <button type="button" className="theme-icon-button theme-button--ghost" onClick={clearAccount}>
                    <LogOut aria-hidden="true" />
                    <span>退出</span>
                  </button>
                )}
                <button type="button" className="theme-icon-button" onClick={saveAccount}>
                  <Save aria-hidden="true" />
                  <span>{account ? '保存更新' : '创建账号'}</span>
                </button>
              </div>
            </section>

            <section className="theme-account-panel theme-account-panel--notifications">
              <div className="theme-account-panel__head">
                <div>
                  <p className="author-content-item-tips">提醒</p>
                  <h3>动态与回复</h3>
                </div>
                <span>{allNotifications.length}</span>
              </div>

              {allNotifications.length > 0 ? (
                <div className="console-notification-list theme-account-panel__notification-list">
                  {allNotifications.map((notification) => {
                    return (
                      <a className="console-notification-item theme-account-panel__notification-item" href={notification.href} key={notification.id}>
                        <div className="console-notification-item__avatar">
                          {notification.type === 'mention' && 'avatar' in notification && notification.avatar ? (
                            <img src={notification.avatar} alt={notification.author} loading="lazy" />
                          ) : (
                            <span className="flex items-center justify-center bg-theme-op text-theme-main">
                              {notification.icon}
                            </span>
                          )}
                        </div>
                        <div className="console-notification-item__body">
                          <strong>{notification.title}</strong>
                          <span>{notification.date}</span>
                          <p>{notification.content.slice(0, 120)}</p>
                        </div>
                      </a>
                    );
                  })}
                </div>
              ) : (
                <div className="console-notification-empty theme-account-panel__notification-empty">
                  <UserRound aria-hidden="true" />
                  <strong>暂时没有新的提醒</strong>
                  <p>{account ? '这里会集中显示最新记录。' : accountPanel.loginHint}</p>
                </div>
              )}
            </section>

            <section className="theme-account-panel">
              <div className="theme-account-panel__head">
                <div>
                  <p className="author-content-item-tips">偏好</p>
                  <h3>界面语言</h3>
                </div>
                <span>{localeVariant === 'zh-CN' ? '简体' : localeVariant === 'zh-Hant' ? '繁體' : 'EN'}</span>
              </div>

              <p>语言切换独立放到账号面板里，避免和控制台、分享或评论操作混在一起。</p>

              <div className="theme-account-panel__locale-actions" role="group" aria-label="界面语言">
                <button type="button" className={localeVariant === 'zh-CN' ? 'is-active' : ''} onClick={() => selectLocale('zh-CN')}>
                  简体中文
                </button>
                <button type="button" className={localeVariant === 'zh-Hant' ? 'is-active' : ''} onClick={() => selectLocale('zh-Hant')}>
                  繁體中文
                </button>
                <button type="button" className={localeVariant === 'en' ? 'is-active' : ''} onClick={() => selectLocale('en')}>
                  English
                </button>
              </div>
            </section>
          </div>
        </div>
      </section>

      {features.centerConsole && !consolePanel.enabled && (
        <section className={`theme-search console-notice ${consoleNoticeOpen ? 'show' : ''}`} aria-hidden={!consoleNoticeOpen}>
          <button
            type="button"
            className="search-mask"
            onClick={() => setConsoleNoticeOpen(false)}
            aria-label="关闭控制台提示"
          />
          <div className="search-dialog console-notice-dialog" role="alertdialog" aria-modal="true" aria-label="控制台提示">
            <div className="search-dialog__head">
              <div>
                <p className="eyebrow">控制台</p>
                <h2>控制台暂不可用</h2>
              </div>
              <button
                type="button"
                className="theme-icon-button theme-button--ghost"
                onClick={() => setConsoleNoticeOpen(false)}
                aria-label="关闭控制台提示"
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
            aria-label="右键菜单"
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
              <button
                type="button"
                className="rightMenu-item"
                onClick={async () => {
                  if (await copyText(rightMenu.selectedText || document.title)) emitActivity('已复制选中文本');
                }}
              >
                <Copy aria-hidden="true" />
                <span>复制选中文本</span>
              </button>
              <button
                type="button"
                className="rightMenu-item"
                onClick={async () => {
                  if (await copyText(window.location.href)) emitActivity('已复制当前地址');
                }}
              >
                <Clipboard aria-hidden="true" />
                <span>复制地址</span>
              </button>
              <button
                type="button"
                className="rightMenu-item"
                onClick={() => {
                  setSearchOpen(true);
                  emitActivity('已打开站内搜索');
                }}
              >
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
