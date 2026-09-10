import React, { type CSSProperties, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
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
  Info,
  Quote,
  X,
  GitCommit,
  CheckCircle2,
  ShieldCheck,
  Mail,
  Lock,
  Key,
  Globe,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  Settings,
  Camera,
  Upload,
  Image as ImageIcon,
  Megaphone,
  UserCheck,
  Clock,
  MapPin,
  Sliders,
  MessageSquare,
  Heart,
  Volume2,
  VolumeX,
} from 'lucide-react';
import type { SiteBroadcastData } from '../lib/broadcast';
import { siteConfig } from '../config/site';
import {
  createCommentId,
  getCommentInitials,
  normaliseAvatar,
  normaliseWebsite,
  readAllLocalThreads,
  readCommentIdentity,
  writeCommentIdentity,
  fetchAuthConfig,
  exchangeEpomailCode,
  directEpomailLogin,
  loginLocalReader,
  logoutAuthAccount,
  uploadCommentImage,
  updateAuthProfile,
  fetchUserFeed,
  readUserPreferences,
  writeUserPreferences,
  type CommentIdentity,
  type PublicAuthConfig,
  type UserPreferences,
  type UserInteractionNotification,
} from '../lib/comment-client';
import {
  applyThemeWithBackground,
  markBackgroundAsManual,
  readStorage,
  resolveBackgroundSource,
  resolveInitialBackground,
  type ThemeMode,
} from '../lib/client-theme';
import { 
  applyLocaleVariant, 
  readStoredLocaleVariant, 
  LOCALE_METADATA, 
  SUPPORTED_LOCALES,
  getI18nText,
  convertText,
  type LocaleVariant 
} from '../lib/client-locale';
import { 
  ensureUserPersona, 
  readStoredUserPersona, 
  type UserPersonaProfile 
} from '../lib/user-persona';
import { resolveGeoInfo } from '../lib/geo-names.ts';

const TIMEZONE_LABELS: Record<LocaleVariant, Record<string, string>> = {
  'zh-CN': {
    'Asia/Shanghai': '北京/上海 (UTC+8)',
    'Asia/Hong_Kong': '香港 (UTC+8)',
    'Asia/Taipei': '台北 (UTC+8)',
    'Asia/Tokyo': '东京 (UTC+9)',
    'America/New_York': '纽约 (EST/EDT)',
    'America/Los_Angeles': '洛杉矶 (PST/PDT)',
    'Europe/London': '伦敦 (UTC+0)',
    'UTC': '世界协调时 (UTC)',
  },
  'zh-Hant': {
    'Asia/Shanghai': '北京/上海 (UTC+8)',
    'Asia/Hong_Kong': '香港 (UTC+8)',
    'Asia/Taipei': '台北 (UTC+8)',
    'Asia/Tokyo': '東京 (UTC+9)',
    'America/New_York': '紐約 (EST/EDT)',
    'America/Los_Angeles': '洛杉磯 (PST/PDT)',
    'Europe/London': '倫敦 (UTC+0)',
    'UTC': '世界協調時 (UTC)',
  },
  'en': {
    'Asia/Shanghai': 'Beijing/Shanghai (UTC+8)',
    'Asia/Hong_Kong': 'Hong Kong (UTC+8)',
    'Asia/Taipei': 'Taipei (UTC+8)',
    'Asia/Tokyo': 'Tokyo (UTC+9)',
    'America/New_York': 'New York (EST/EDT)',
    'America/Los_Angeles': 'Los Angeles (PST/PDT)',
    'Europe/London': 'London (UTC+0)',
    'UTC': 'Coordinated Universal Time (UTC)',
  },
  'fr': {
    'Asia/Shanghai': 'Pékin/Shanghai (UTC+8)',
    'Asia/Hong_Kong': 'Hong Kong (UTC+8)',
    'Asia/Taipei': 'Taipei (UTC+8)',
    'Asia/Tokyo': 'Tokyo (UTC+9)',
    'America/New_York': 'New York (EST/EDT)',
    'America/Los_Angeles': 'Los Angeles (PST/PDT)',
    'Europe/London': 'Londres (UTC+0)',
    'UTC': 'Temps universel coordonné (UTC)',
  },
  'es': {
    'Asia/Shanghai': 'Pekín/Shanghái (UTC+8)',
    'Asia/Hong_Kong': 'Hong Kong (UTC+8)',
    'Asia/Taipei': 'Taipéi (UTC+8)',
    'Asia/Tokyo': 'Tokio (UTC+9)',
    'America/New_York': 'Nueva York (EST/EDT)',
    'America/Los_Angeles': 'Los Ángeles (PST/PDT)',
    'Europe/London': 'Londres (UTC+0)',
    'UTC': 'Tiempo Universal Coordinado (UTC)',
  },
  'de': {
    'Asia/Shanghai': 'Peking/Shanghai (UTC+8)',
    'Asia/Hong_Kong': 'Hongkong (UTC+8)',
    'Asia/Taipei': 'Taipeh (UTC+8)',
    'Asia/Tokyo': 'Tokio (UTC+9)',
    'America/New_York': 'New York (EST/EDT)',
    'America/Los_Angeles': 'Los Angeles (PST/PDT)',
    'Europe/London': 'London (UTC+0)',
    'UTC': 'Koordinierte Weltzeit (UTC)',
  },
};

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
    totalWords: number;
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
  broadcast?: SiteBroadcastData;
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
  broadcast,
}: ThemeOverlaysProps) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [consoleOpen, setConsoleOpen] = useState(features.centerConsole && consolePanel.enabled && consolePanel.defaultOpen);
  const [consoleNoticeOpen, setConsoleNoticeOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [theme, setTheme] = useState<ThemeMode>('light');
  const [background, setBackground] = useState(defaultBackground);
  const [localeVariant, setLocaleVariant] = useState<LocaleVariant>(() => typeof window !== 'undefined' ? readStoredLocaleVariant() : 'zh-CN');
  const t = useCallback((key: string, fallback?: string) => getI18nText(key, localeVariant, fallback), [localeVariant]);
  const [userPersona, setUserPersona] = useState<UserPersonaProfile | null>(null);
  const [account, setAccount] = useState<CommentIdentity | null>(null);
  const [pageType, setPageType] = useState(initialPageType || 'page');
  const [accountForm, setAccountForm] = useState({
    name: '',
    email: '',
    website: '',
    avatar: '',
    bio: '',
    timezone: '',
    location: '',
    showLocation: true,
  });
  const [accountNotice, setAccountNotice] = useState('');
  const [commentThreadVersion, setCommentThreadVersion] = useState(0);
  const [accountNeedsAttention, setAccountNeedsAttention] = useState(false);
  const [accountTab, setAccountTab] = useState<'auth' | 'notifications' | 'settings'>('notifications');
  const [notifPartition, setNotifPartition] = useState<'broadcast' | 'personal'>('personal');
  const [userPreferences, setUserPreferences] = useState<UserPreferences>(() => readUserPreferences());
  const [userFeed, setUserFeed] = useState<{
    userComments: any[];
    notifications: UserInteractionNotification[];
    loading: boolean;
    fetchedAt: number;
  }>({
    userComments: [],
    notifications: [],
    loading: false,
    fetchedAt: 0,
  });
  const [authConfig, setAuthConfig] = useState<PublicAuthConfig | null>(null);
  const [epomailForm, setEpomailForm] = useState({ email: '', password: '', code: '' });
  const [showDirectAppAuth, setShowDirectAppAuth] = useState(false);
  const [isAuthorizing, setIsAuthorizing] = useState(false);
  const [authStatusMessage, setAuthStatusMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [syncStats, setSyncStats] = useState(stats);
  const [closeBtnStyle, setCloseBtnStyle] = useState<React.CSSProperties>({});
  const avatarFileInputRef = useRef<HTMLInputElement>(null);

  const updateCloseBtnPosition = useCallback(() => {
    const trigger = document.querySelector('.shijianus-dashboard-icon');
    if (trigger) {
      const rect = trigger.getBoundingClientRect();
      setCloseBtnStyle({
        top: `${rect.top}px`,
        left: `${rect.left}px`,
        width: `${rect.width}px`,
        height: `${rect.height}px`,
      });
    }
  }, []);

  useLayoutEffect(() => {
    if (consoleOpen) {
      updateCloseBtnPosition();
      window.addEventListener('resize', updateCloseBtnPosition);
      window.addEventListener('scroll', updateCloseBtnPosition, { passive: true });
    }
    return () => {
      window.removeEventListener('resize', updateCloseBtnPosition);
      window.removeEventListener('scroll', updateCloseBtnPosition);
    };
  }, [consoleOpen, updateCloseBtnPosition]);

  const [activityRecords, setActivityRecords] = useState<{ date: string; level: number; posts: { title: string; href: string }[] }[]>([]);
  const [rightMenu, setRightMenu] = useState<{ open: boolean; x: number; y: number; selectedText: string }>({
    open: false,
    x: 0,
    y: 0,
    selectedText: '',
  });
  // 用 ref 追踪 open 状态，让 closeRightMenu 可在未打开时 early-return，
  // 避免每次点击都触发整个 ThemeOverlays re-render
  const rightMenuOpenRef = useRef(false);

  // Data Sync Framework Placeholder
  useEffect(() => {
    if (!consoleOpen) return;

    const syncConsoleData = async () => {
      try {
        // Future API endpoint: const response = await fetch('/api/console/data');
        // const data = await response.json();
        // setSyncStats(data.stats);
        // setActivityRecords(data.activity);
        
        // Currently using static mock data structure for stability
        setSyncStats(stats);
      } catch (error) {
        console.error('Failed to sync console data:', error);
      }
    };

    syncConsoleData();
  }, [consoleOpen, stats]);
  const [latestComment, setLatestComment] = useState<{ name: string; content: string; date: string } | null>(null);
  const [selectedActivityDate, setSelectedActivityDate] = useState<string | null>(null);
  const [selectedActivityPage, setSelectedActivityPage] = useState(1);
  const searchInputRef = useRef<HTMLInputElement>(null);

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

  const activityData = useMemo(() => {
    const now = new Date();
    const utc8Time = now.getTime() + (now.getTimezoneOffset() * 60000) + (8 * 3600000);
    const today = new Date(utc8Time);
    today.setHours(0, 0, 0, 0);

    const totalSlots = 52 * 7;
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - today.getDay() - (51 * 7));

    const data = [];
    for (let i = 0; i < totalSlots; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + i);
      
      if (currentDate > today) {
        data.push(null);
        continue;
      }

      const postsOnDate = posts.filter(p => {
        const d = new Date(p.date);
        return d.getFullYear() === currentDate.getFullYear() && 
               d.getMonth() === currentDate.getMonth() && 
               d.getDate() === currentDate.getDate();
      });
      
      const level = postsOnDate.length === 0 ? 0 : Math.min(4, postsOnDate.length);

      data.push({
        date: currentDate.toLocaleDateString('zh-CN'),
        rawDate: currentDate,
        level,
        posts: postsOnDate.map(p => ({ title: p.title, href: p.href })),
      });
    }
    return data;
  }, [posts]);

  const selectedActivity = useMemo(() => {
    if (!selectedActivityDate) return null;
    return activityData.find(d => d && d.date === selectedActivityDate);
  }, [selectedActivityDate, activityData]);

  const activityPagination = useMemo(() => {
    if (!selectedActivity || selectedActivity.posts.length <= 3) return { total: 1, current: 1, items: selectedActivity?.posts || [] };
    const total = Math.ceil(selectedActivity.posts.length / 3);
    const start = (selectedActivityPage - 1) * 3;
    return {
      total,
      current: selectedActivityPage,
      items: selectedActivity.posts.slice(start, start + 3),
    };
  }, [selectedActivity, selectedActivityPage]);

  const monthLabels = useMemo(() => {
    const labels: { label: string; index: number }[] = [];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    for (let week = 0; week < 52; week++) {
      const dayIndex = week * 7;
      const dayData = activityData[dayIndex];
      if (!dayData) continue;
      
      const date = dayData.rawDate;
      const month = months[date.getMonth()];
      
      if (labels.length === 0 || labels[labels.length - 1].label !== month) {
        labels.push({ label: month, index: week });
      }
    }
    
    return labels;
  }, [activityData]);

  const tagData = useMemo(() => {
    const subset = tags.slice(0, 50);
    const count = subset.length;
    // Dynamic font size: <=5 tags -> 13px, 50 tags -> 10px.
    const fontSize = count <= 5 ? 13 : Math.max(10, 13 - (count - 5) * (3 / 45));
    return { items: subset, fontSize: `${fontSize.toFixed(1)}px` };
  }, [tags]);

  const siteStats = useMemo(() => {
    const sPosts = syncStats?.posts ?? 0;
    const sReading = syncStats?.readingMinutes ?? 0;
    const sWords = syncStats?.totalWords ?? 0;

    // DYNAMIC DATA ACTUALIZATION ENGINE (憲法 V3 合規版)
    // 1. FIND TRUE LATEST POST DATE (Ignoring sticky sorting)
    const sortedByDate = [...posts].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const latestPost = sortedByDate[0];

    // 2. CALCULATE REAL UPTIME
    const startDate = new Date('2024-01-01');
    const today = new Date();
    const uptimeDays = Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

    // 3. DYNAMIC ACTIVE LEVEL (POSTS IN LAST 30 DAYS)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);
    const recentPostCount = posts.filter(p => new Date(p.date) >= thirtyDaysAgo).length;
    
    let activeLevel = 'Status 0';
    if (recentPostCount > 8) activeLevel = 'Status 4';
    else if (recentPostCount >= 5) activeLevel = 'Status 3';
    else if (recentPostCount >= 3) activeLevel = 'Status 2';
    else if (recentPostCount >= 1) activeLevel = 'Status 1';

    // 4. DYNAMIC CONTENT DENSITY (AVG WORDS PER POST)
    const avgWords = sPosts > 0 ? sWords / sPosts : 0;
    let densityLevel = 'Level 1 (Low)';
    if (avgWords > 3000) densityLevel = 'Level 4 (Ultra)';
    else if (avgWords > 1500) densityLevel = 'Level 3 (High)';
    else if (avgWords > 800) densityLevel = 'Level 2 (Standard)';

    return [
      {
        label: '本站总字数',
        value: `${sWords.toLocaleString()} 字`,
        tooltip: '基于全站 Markdown 节点物理扫描精算的实时总字数'
      },
      {
        label: '安全运行天数',
        value: `${uptimeDays} 天`,
        tooltip: '自 2024-01-01 以来稳定运行的物理时长记录'
      },
      {
        label: '最后推送',
        value: latestPost?.date || '今天',
        href: latestPost?.href,
        tooltip: '系统实时检索的全站最新内容或特性的精确时间戳。'
      },
      {
        label: '版本协议',
        value: 'v2.6.0-shijianus',
        tooltip: 'shijianus-blog 核心引擎版本及开发协议',
        href: '/version'
      },
      {
        label: '活跃等级',
        value: activeLevel,
        tooltip: `基于近30天内发布文章数量(${recentPostCount}篇)计算的实时活跃等级`,
        href: '/standards'
      },
      {
        label: '内容密度',
        value: densityLevel,
        tooltip: `基于全站平均单篇字数(${Math.round(avgWords)})计算的系统信息密度评级`,
        href: '/standards'
      },
      {
        label: '全站阅读',
        value: `${sReading} min`,
        tooltip: '涵盖所有公开内容的平均总阅读时长'
      },
      {
        label: '系统架构',
        value: 'Astro Edge',
        tooltip: '基于 Astro 核心引擎与 Edge Functions 的现代响应式架构',
      },
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

  // 1. 全站广播通告（每个人可见，构建期扫描渲染，0 DB 开销）
  const broadcastNotifications = useMemo(() => {
    const list: Array<{
      id: string;
      type: 'announcement' | 'post';
      badge: string;
      title: string;
      content: string;
      date: string;
      href: string;
      category: string;
      cover?: string;
      bullets?: string[];
    }> = [];

    // 博主在构建前编写或AI协助生成的全站广播公告 (构建期预渲染，零DB损耗)
    if (broadcast) {
      list.push({
        id: broadcast.id,
        type: 'announcement',
        badge: broadcast.badge || '博主动态',
        title: broadcast.title,
        content: broadcast.summary,
        date: broadcast.date || posts[0]?.date || '最新',
        href: broadcast.href || '#',
        category: '站点通告',
        bullets: broadcast.bullets,
      });
    }

    // 最新发布博文列表 (构建期自动编译生成最新置顶，零 DB 开销)
    const latestArticles = posts.slice(0, 8).map((p, idx) => ({
      id: `post-broadcast-${p.href}`,
      type: 'post' as const,
      badge: idx === 0 ? '🎉 最新博文发布' : '📝 精选博文',
      title: p.title,
      content: p.description || '点击前往阅读全文，欢迎在文末评论区交流探讨...',
      date: p.date,
      href: p.href,
      category: p.category || '博文推荐',
      cover: p.cover,
    }));

    list.push(...latestArticles);
    return list;
  }, [posts, broadcast]);

  // 2. 个人账户互动通知与足迹 (连结真实 DB 数据)
  const refreshUserFeed = useCallback(async () => {
    const currentName = (account?.name || '').trim();
    const currentId = (account?.id || '').trim();
    const currentEmail = (account?.email || '').trim();
    const token = account?.token || (typeof window !== 'undefined' ? window.localStorage.getItem('shijianus-auth-token') : '');

    if (!currentName && !currentId && !currentEmail && !token) {
      setUserFeed({ userComments: [], notifications: [], loading: false, fetchedAt: Date.now() });
      return;
    }

    setUserFeed((prev) => ({ ...prev, loading: true }));
    try {
      const result = await fetchUserFeed({
        authorName: currentName,
        authorId: currentId,
        authorEmail: currentEmail,
        sessionToken: token || undefined,
      });
      if (result.ok) {
        setUserFeed({
          userComments: result.userComments,
          notifications: result.notifications,
          loading: false,
          fetchedAt: Date.now(),
        });
      } else {
        setUserFeed((prev) => ({ ...prev, loading: false }));
      }
    } catch {
      setUserFeed((prev) => ({ ...prev, loading: false }));
    }
  }, [account]);

  const refreshUserFeedRef = useRef(refreshUserFeed);
  refreshUserFeedRef.current = refreshUserFeed;

  useEffect(() => {
    if (notificationOpen) {
      refreshUserFeedRef.current();
    }
  }, [notificationOpen]);

  const personalNotifications = useMemo(() => {
    return userFeed.notifications || [];
  }, [userFeed.notifications]);

  // 全站与个人综合通知列表 (用于计算 Badge 计数)
  const allNotifications = useMemo(() => {
    const combined: any[] = [];
    if (userPreferences.broadcastNotify) {
      combined.push(...broadcastNotifications);
    }
    if (userPreferences.personalNotify) {
      combined.push(...personalNotifications);
    }
    return combined;
  }, [broadcastNotifications, personalNotifications, userPreferences.broadcastNotify, userPreferences.personalNotify]);

  const myRecentComments = useMemo(() => {
    if (userFeed.userComments.length > 0) {
      return userFeed.userComments;
    }
    if (typeof window === 'undefined') return [];
    const all = readAllLocalThreads();
    const currentName = (account?.name || accountForm.name || '').trim().toLowerCase();
    const currentEmail = (account?.email || accountForm.email || '').trim().toLowerCase();
    if (!currentName && !currentEmail) return [];
    return all
      .filter((c) => {
        const matchName = currentName && c.name?.trim().toLowerCase() === currentName;
        const matchEmail = currentEmail && c.email?.trim().toLowerCase() === currentEmail;
        return matchName || matchEmail;
      })
      .map(c => ({
        id: c.id,
        postSlug: c.slug,
        message: c.message,
        createdAt: c.createdAt,
        likesCount: c.likes?.length || 0,
      }))
      .sort((a, b) => new Date(b.createdAt).valueOf() - new Date(a.createdAt).valueOf())
      .slice(0, 10);
  }, [userFeed.userComments, account, accountForm.name, accountForm.email]);

  const emitActivity = (message: string, overrideLocale?: LocaleVariant) => {
    if (!message.trim()) return;
    const targetLocale = overrideLocale || localeVariant;
    const translated = convertText(message, targetLocale);
    window.dispatchEvent(new CustomEvent('shijianus:activity', { detail: { message: translated } }));
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

      let autoTz = next?.timezone ?? '';
      if (!autoTz) {
        try {
          autoTz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
        } catch {}
      }

      let autoLoc = next?.location ?? '';
      if (!autoLoc && autoTz) {
        if (autoTz.includes('Taipei')) {
          autoLoc = localeVariant === 'en' ? 'Taipei, Taiwan' : localeVariant === 'zh-Hant' ? '台灣·台北' : '台湾·台北';
        } else if (autoTz.includes('Hong_Kong')) {
          autoLoc = localeVariant === 'en' ? 'Hong Kong' : '香港';
        } else if (autoTz.includes('Macau') || autoTz.includes('Macao')) {
          autoLoc = localeVariant === 'en' ? 'Macau' : localeVariant === 'zh-Hant' ? '澳門' : '澳门';
        } else if (autoTz.includes('Shanghai') || autoTz.includes('Chongqing') || autoTz.includes('Urumqi') || autoTz.includes('Beijing')) {
          autoLoc = localeVariant === 'en' ? 'Beijing, China' : localeVariant === 'zh-Hant' ? '中國·北京' : '中国·北京';
        } else if (autoTz.includes('Tokyo')) {
          autoLoc = localeVariant === 'en' ? 'Tokyo, Japan' : localeVariant === 'zh-Hant' ? '日本·東京' : '日本·东京';
        } else if (autoTz.includes('New_York')) {
          autoLoc = localeVariant === 'en' ? 'New York, US' : localeVariant === 'zh-Hant' ? '美國·紐約' : '美国·纽约';
        } else if (autoTz.includes('Los_Angeles')) {
          autoLoc = localeVariant === 'en' ? 'California, US' : localeVariant === 'zh-Hant' ? '美國·加州' : '美国·加州';
        } else if (autoTz.includes('London')) {
          autoLoc = localeVariant === 'en' ? 'London, UK' : localeVariant === 'zh-Hant' ? '英國·倫敦' : '英国·伦敦';
        } else if (autoTz.includes('Paris')) {
          autoLoc = localeVariant === 'en' ? 'Paris, France' : localeVariant === 'zh-Hant' ? '法國·巴黎' : '法国·巴黎';
        } else if (autoTz.includes('Berlin')) {
          autoLoc = localeVariant === 'en' ? 'Berlin, Germany' : localeVariant === 'zh-Hant' ? '德國·柏林' : '德国·柏林';
        } else if (autoTz.includes('Singapore')) {
          autoLoc = localeVariant === 'en' ? 'Singapore' : '新加坡';
        } else if (autoTz.includes('Seoul')) {
          autoLoc = localeVariant === 'en' ? 'Seoul, South Korea' : localeVariant === 'zh-Hant' ? '韓國·首爾' : '韩国·首尔';
        }
      }

      setAccountForm({
        name: next?.name ?? '',
        email: next?.email ?? '',
        website: next?.website ?? '',
        avatar: next?.avatar ?? '',
        bio: next?.bio ?? '',
        timezone: autoTz,
        location: autoLoc,
        showLocation: next?.showLocation !== false,
      });

      // Query geo-profile endpoint if location is still unset
      if (typeof fetch !== 'undefined') {
        fetch(`/api/geo-profile?locale=${encodeURIComponent(localeVariant)}`)
          .then((r) => r.json())
          .then((data: any) => {
            if (data?.country) {
              const updated = ensureUserPersona(data.country);
              setUserPersona(updated);
            }
            if (data?.location && !next?.location) {
              setAccountForm((prev) => (prev.location ? prev : { ...prev, location: data.location }));
            }
          })
          .catch(() => {});
      }
    };

    const onAccountChange = (event: Event) => {
      const next = (event as CustomEvent<CommentIdentity | null>).detail ?? readCommentIdentity();
      setAccount(next);
      setAccountForm((prev) => ({
        ...prev,
        name: next?.name ?? '',
        email: next?.email ?? '',
        website: next?.website ?? '',
        avatar: next?.avatar ?? '',
        bio: next?.bio ?? '',
        timezone: next?.timezone || prev.timezone,
        location: next?.location || prev.location,
        showLocation: next?.showLocation !== false,
      }));
      setAccountNeedsAttention(false);
      refreshUserFeedRef.current();
    };

    const onAccountRequired = () => {
      setConsoleNoticeOpen(false);
      setSearchOpen(false);
      setConsoleOpen(false);
      setNotificationOpen(true);
      setAccountNotice(accountPanel.loginHint);
      setAccountNeedsAttention(true);
      setAccountTab('auth');
    };

    const onThreadChange = () => {
      setCommentThreadVersion((value) => value + 1);
      refreshUserFeedRef.current();
    };

    const onPrefsChange = (event: Event) => {
      const next = (event as CustomEvent<UserPreferences>).detail;
      if (next) setUserPreferences(next);
    };

    const onStorage = (event: StorageEvent) => {
      if (!event.key) return;
      if (event.key === 'shijianus-comment-account' || event.key === 'shijianus-comment-identity') {
        syncAccount();
        refreshUserFeedRef.current();
      }
      if (event.key === 'shijianus-user-preferences') {
        setUserPreferences(readUserPreferences());
      }
      if (event.key.startsWith('shijianus-comments:')) {
        setCommentThreadVersion((value) => value + 1);
        refreshUserFeedRef.current();
      }
    };

    syncAccount();
    window.addEventListener('shijianus:comment-account-change', onAccountChange as EventListener);
    window.addEventListener('shijianus:comment-account-required', onAccountRequired);
    window.addEventListener('shijianus:comment-thread-change', onThreadChange);
    window.addEventListener('shijianus:preferences-change', onPrefsChange as EventListener);
    window.addEventListener('storage', onStorage);

    return () => {
      window.removeEventListener('shijianus:comment-account-change', onAccountChange as EventListener);
      window.removeEventListener('shijianus:comment-account-required', onAccountRequired);
      window.removeEventListener('shijianus:comment-thread-change', onThreadChange);
      window.removeEventListener('shijianus:preferences-change', onPrefsChange as EventListener);
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
    setUserPersona(ensureUserPersona());

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
    const openNotifications = (event?: Event) => {
      setConsoleNoticeOpen(false);
      setSearchOpen(false);
      setConsoleOpen(false);
      setNotificationOpen(true);
      const customEvent = event as CustomEvent<{ tab?: 'auth' | 'notifications' | 'settings' }> | undefined;
      if (customEvent?.detail?.tab) {
        setAccountTab(customEvent.detail.tab);
      } else {
        setAccountTab('notifications');
      }
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
      setUserPersona(ensureUserPersona());
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

      rightMenuOpenRef.current = true;
      setRightMenu({
        open: true,
        x: clampPosition(event.clientX, 180, window.innerWidth),
        y: clampPosition(event.clientY, 290, window.innerHeight),
        selectedText,
      });
    };
    const closeRightMenu = () => {
      // 菜单未打开时直接 return，避免每次点击都触发 ThemeOverlays re-render
      if (!rightMenuOpenRef.current) return;
      rightMenuOpenRef.current = false;
      setRightMenu((menu) => ({ ...menu, open: false }));
    };

    window.addEventListener('shijianus:open-search', openSearch);
    window.addEventListener('shijianus:open-console', openConsole);
    window.addEventListener('shijianus:close-console', closeConsole);
    window.addEventListener('shijianus:open-notifications', openNotifications);
    // shijianus:open-account is dispatched by SiteHeader account button → maps to notification/account overlay
    window.addEventListener('shijianus:open-account', openNotifications);
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
      window.removeEventListener('shijianus:open-account', openNotifications);
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
      showLocation: accountForm.showLocation,
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
      showLocation: true,
    });
    setAccountNotice('当前账号已退出，评论将恢复只读。');
    setAccountNeedsAttention(false);
    emitActivity('已退出当前账号');
  };

  useEffect(() => {
    fetchAuthConfig().then((cfg) => {
      if (cfg) setAuthConfig(cfg);
    });

    const onWindowMessage = async (event: MessageEvent) => {
      // 1. Direct authorization code from Epomail popup (authorize.vue sends EPOMAIL_OAUTH_SUCCESS)
      if (event.data?.type === 'EPOMAIL_OAUTH_SUCCESS' && event.data.code) {
        const code = event.data.code;
        setIsAuthorizing(true);
        setAuthStatusMessage({ type: 'info', text: '正在验证 Epomail 凭据并同步账号...' });
        try {
          const redirectUri = `${window.location.origin}/auth/callback`;
          const result = await exchangeEpomailCode(code, redirectUri);
          if (!result.ok || !result.user) {
            throw new Error(result.error || 'OAuth 授权码交换失败');
          }
          setAccount(result.user);
          setAccountForm({
            name: result.user.name || '',
            email: result.user.email || '',
            website: result.user.website || '',
            avatar: result.user.avatar || '',
          });
          setAuthStatusMessage({ type: 'success', text: `Epomail 授权登录成功！欢迎，${result.user.name}` });
          emitActivity(`Epomail 授权登录: ${result.user.name}`);
        } catch (err: any) {
          console.error('[ThemeOverlays] EPOMAIL_OAUTH_SUCCESS exchange error:', err);
          setAuthStatusMessage({ type: 'error', text: err?.message || 'Epomail 授权凭据交换失败，请重试' });
        } finally {
          setIsAuthorizing(false);
        }
        return;
      }

      // 2. Pre-exchanged identity from callback page popup (callback.astro sends EPOMAIL_AUTH_SUCCESS)
      if (event.data?.type === 'EPOMAIL_AUTH_SUCCESS' && event.data.user) {
        const user = event.data.user;
        const token = event.data.token;
        writeCommentIdentity(user);
        if (token) {
          try {
            window.localStorage.setItem('shijianus-auth-token', token);
          } catch {}
        }
        setAccount(user);
        setAccountForm({
          name: user.name || '',
          email: user.email || '',
          website: user.website || '',
          avatar: user.avatar || '',
        });
        setAuthStatusMessage({ type: 'success', text: `Epomail 授权登录成功！欢迎，${user.name}` });
        emitActivity(`Epomail 授权登录: ${user.name}`);
      }
    };
    window.addEventListener('message', onWindowMessage);
    return () => window.removeEventListener('message', onWindowMessage);
  }, []);

  const handleEpomailOAuth = () => {
    setIsAuthorizing(true);
    setAuthStatusMessage({ type: 'info', text: '请在弹出的 Epomail 窗口中完成授权...' });
    try {
      sessionStorage.setItem('epomail_auth_return', window.location.href);
    } catch {}

    const cfg = authConfig?.epomail || {
      baseUrl: 'https://mail.epocanvas.com',
      clientId: 'epo_live_shijianus_blog',
      authorizeUrl: 'https://mail.epocanvas.com/oauth/authorize',
      redirectUri: `${window.location.origin}/auth/callback`,
      scope: 'openid profile email',
    };

    const redirectUri = `${window.location.origin}/auth/callback`;
    const authUrl = `${cfg.authorizeUrl}?client_id=${encodeURIComponent(cfg.clientId)}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${encodeURIComponent(cfg.scope)}&state=blog_sso`;

    const width = 600;
    const height = 700;
    const left = window.screen.width / 2 - width / 2;
    const top = window.screen.height / 2 - height / 2;
    const popup = window.open(
      authUrl,
      'EpomailOAuth',
      `width=${width},height=${height},top=${top},left=${left},scrollbars=yes,status=no`
    );

    if (!popup || popup.closed || typeof popup.closed === 'undefined') {
      window.location.href = authUrl;
    } else {
      const checkPopup = setInterval(() => {
        if (!popup || popup.closed) {
          clearInterval(checkPopup);
          setIsAuthorizing(false);
        }
      }, 1000);
    }
  };

  const handleDirectEpomailSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!epomailForm.email.trim()) {
      setAuthStatusMessage({ type: 'error', text: '请填写 Epomail 账号或邮箱' });
      return;
    }
    setIsAuthorizing(true);
    setAuthStatusMessage(null);

    const res = await directEpomailLogin(epomailForm);
    setIsAuthorizing(false);
    if (res.ok && res.user) {
      setAccount(res.user);
      setAccountForm({
        name: res.user.name,
        email: res.user.email,
        website: res.user.website || '',
        avatar: res.user.avatar || '',
      });
      setAuthStatusMessage({ type: 'success', text: `Epomail 授权成功 (APP 外接方案)！欢迎，${res.user.name}` });
      emitActivity(`Epomail 登录: ${res.user.name}`);
    } else {
      setAuthStatusMessage({ type: 'error', text: res.error || 'Epomail 授权验证失败，请重试' });
    }
  };

  const handleAvatarFileSelect = async (file: File) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setAuthStatusMessage({ type: 'error', text: '仅支持上传图片格式文件 (PNG, JPG, WebP, GIF, SVG)' });
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setAuthStatusMessage({ type: 'error', text: '头像文件不能超过 10MB' });
      return;
    }

    setIsAuthorizing(true);
    setAuthStatusMessage({ type: 'info', text: '正在上传新头像至 Telegram 图床...' });
    try {
      const res = await uploadCommentImage(file);
      if (!res.ok || !res.url) {
        setAuthStatusMessage({ type: 'error', text: res.error || '头像上传失败' });
      } else {
        const newAvatarUrl = res.url;
        setAccountForm((prev) => ({ ...prev, avatar: newAvatarUrl }));
        if (account) {
          const updateRes = await updateAuthProfile({ avatar: newAvatarUrl });
          if (updateRes.ok && updateRes.user) {
            setAccount(updateRes.user);
          }
        } else {
          const current = readCommentIdentity();
          const nextIdentity: CommentIdentity = current
            ? { ...current, avatar: newAvatarUrl }
            : {
                id: createCommentId('local'),
                name: accountForm.name.trim() || '访客朋友',
                email: accountForm.email.trim(),
                website: accountForm.website.trim(),
                avatar: newAvatarUrl,
                bio: accountForm.bio.trim(),
                timezone: accountForm.timezone.trim(),
                location: accountForm.location.trim(),
                role: 'reader',
                provider: 'local',
                showLocation: accountForm.showLocation,
              };
          writeCommentIdentity(nextIdentity);
          setAccount(nextIdentity);
        }
        setAuthStatusMessage({ type: 'success', text: '新头像已上传至 Telegram 图床并应用！' });
        emitActivity('已上传并更新头像');
      }
    } catch (err: any) {
      setAuthStatusMessage({ type: 'error', text: err?.message || '头像上传异常' });
    } finally {
      setIsAuthorizing(false);
    }
  };

  const handleRestoreEpomailAvatar = async () => {
    if (!account?.epomailAvatar) return;
    const original = account.epomailAvatar;
    setAccountForm((prev) => ({ ...prev, avatar: original }));
    setIsAuthorizing(true);
    try {
      const updateRes = await updateAuthProfile({ avatar: original });
      if (updateRes.ok && updateRes.user) {
        setAccount(updateRes.user);
      }
      setAuthStatusMessage({ type: 'success', text: '已恢复默认 Epomail 官方头像' });
      emitActivity('恢复默认 Epomail 官方头像');
    } catch (err: any) {
      setAuthStatusMessage({ type: 'error', text: err?.message || '恢复头像失败' });
    } finally {
      setIsAuthorizing(false);
    }
  };

  const handleSaveProfile = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsAuthorizing(true);
    setAccountNeedsAttention(false);

    const trimmedName = accountForm.name.trim();
    const effectiveName = trimmedName || (account?.name ? account.name : '访客朋友');

    try {
      if (account) {
        // Logged in user updating profile
        const res = await updateAuthProfile({
          name: effectiveName,
          avatar: accountForm.avatar,
          website: accountForm.website.trim(),
          bio: accountForm.bio.trim(),
          timezone: accountForm.timezone.trim(),
          location: accountForm.location.trim(),
          showLocation: accountForm.showLocation,
        });
        setIsAuthorizing(false);
        if (res.ok && res.user) {
          setAccount(res.user);
          setAuthStatusMessage({ type: 'success', text: '个人资料已成功保存！' });
          emitActivity('更新个人资料');
        } else {
          setAuthStatusMessage({ type: 'error', text: res.error || '保存资料失败' });
        }
      } else {
        // Local reader or visitor updating identity
        const nextUser: CommentIdentity = {
          id: (account as any)?.id || createCommentId('local'),
          name: effectiveName,
          email: accountForm.email.trim(),
          website: normaliseWebsite(accountForm.website.trim()),
          avatar: normaliseAvatar(accountForm.avatar.trim()),
          bio: accountForm.bio.trim(),
          timezone: accountForm.timezone.trim(),
          location: accountForm.location.trim(),
          role: 'reader',
          provider: 'local',
          showLocation: accountForm.showLocation,
        };
        writeCommentIdentity(nextUser);
        setAccount(nextUser);
        setIsAuthorizing(false);
        setAuthStatusMessage({ type: 'success', text: '个人资料与本地身份已保存！' });
        emitActivity('更新本地个人资料');
      }
      setTimeout(() => setAuthStatusMessage(null), 3000);
    } catch (err: any) {
      setIsAuthorizing(false);
      setAuthStatusMessage({ type: 'error', text: err?.message || '保存资料异常' });
    }
  };

  const handleLocalSave = async () => {
    await handleSaveProfile();
  };

  const handleLogout = async () => {
    await logoutAuthAccount(account?.token);
    setAccount(null);
    setAccountForm({
      name: '',
      email: '',
      website: '',
      avatar: '',
      bio: '',
      timezone: '',
      location: '',
      showLocation: true,
    });
    setEpomailForm({ email: '', password: '', code: '' });
    setAuthStatusMessage({ type: 'info', text: '已退出登录并清除身份凭证' });
    emitActivity('已退出账号');
  };

  const selectLocale = (nextLocale: LocaleVariant) => {
    const applied = applyLocaleVariant(nextLocale, { manual: true });
    setLocaleVariant(applied);
    setUserPersona(ensureUserPersona());
    setAccountForm((prev) => {
      if (!prev.location) return prev;
      const resolved = resolveGeoInfo(prev.location, applied);
      if (resolved && resolved.code !== 'GLOBAL' && resolved.name) {
        return { ...prev, location: resolved.name };
      }
      return prev;
    });
    const meta = LOCALE_METADATA[applied];
    emitActivity(`已切换为${meta ? meta.nativeName : applied}界面`, applied);
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

      {features.searchPanel && (
        <section id="local-search" className={`theme-search ${searchOpen ? 'show' : ''}`} aria-hidden={!searchOpen}>
          <button type="button" className="search-mask" onClick={() => setSearchOpen(false)} aria-label="关闭搜索面板" />
          <div className="search-dialog" role="dialog" aria-modal="true" aria-label={t('search.title', '站内搜索')}>
            <div className="search-dialog__head">
              <div>
                <p className="eyebrow">{t('search.title', '站内搜索')}</p>
                <h2>{brandName} {t('search.index', '内容索引')}</h2>
              </div>
              <button type="button" className="theme-icon-button theme-button--ghost" onClick={() => setSearchOpen(false)} aria-label={t('search.close', '关闭搜索面板')}>
                <X className="overlay-icon" aria-hidden="true" />
              </button>
            </div>

            <label className="search-input-wrap">
              <Search className="overlay-icon" aria-hidden="true" />
              <input
                ref={searchInputRef}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={t('search.placeholder', '搜索标题、摘要或分类')}
              />
              <span>Ctrl K</span>
            </label>

            <div className="search-result-list">
              {filteredPosts.length > 0 ? (
                filteredPosts.map((post) => (
                  <a className="search-result-item" href={post.href} key={post.href}>
                    <img
                      src={post.cover}
                      alt=""
                      loading="lazy"
                      data-fallback-src={siteConfig.post.hero.fallbackImage}
                      data-remote-fallback-src={siteConfig.post.hero.remoteFallbackImage}
                      onError={(e) => {
                        const target = e.currentTarget;
                        if (target.dataset.failed === '1') {
                          target.src = siteConfig.post.hero.remoteFallbackImage;
                          target.dataset.failed = '2';
                        } else if (!target.dataset.failed) {
                          target.dataset.failed = '1';
                          target.src = siteConfig.post.hero.fallbackImage;
                        }
                      }}
                    />
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
                <p className="search-empty">{t('search.empty', '没有找到匹配内容')}</p>
              )}
            </div>
          </div>
        </section>
      )}

      {features.centerConsole && (
        <section id="console" className={consoleOpen ? 'show' : ''} aria-hidden={!consoleOpen}>
          <button type="button" className="console-mask" onClick={() => setConsoleOpen(false)} aria-label="关闭控制台" />
          
          {/* === 安知鱼纯正血统：中控台独立关闭按钮 (映射对齐) === */}
          <button 
            type="button" 
            className="console-close-btn" 
            onClick={() => setConsoleOpen(false)} 
            aria-label="关闭中控台"
            title="关闭 (Esc)"
            style={{ 
              position: 'fixed', 
              margin: 0, 
              padding: 0, 
              boxSizing: 'border-box',
              ...closeBtnStyle 
            }}
          >
            <X size={20} strokeWidth={3} />
          </button>

          <div className="console-card-group" role="dialog" aria-modal="true" aria-label={t('console.title', '快捷控制台')}>
            <div className="console-card-group-left">
              <section className="console-card console-profile">
                <p className="author-content-item-tips">{t('console.personal', '个人中心')}</p>
                <h2 className="author-content-item-title">{authorName}</h2>
                <p>{convertText('始于极简，构筑坚实；内容为核，长期演进。', localeVariant)}</p>
                <div className="console-stat-grid">
                  <span>
                    <strong>{stats.posts}</strong>
                    <small>{t('console.stat.posts', '文章')}</small>
                  </span>
                  <span>
                    <strong>{stats.categories}</strong>
                    <small>{t('console.stat.categories', '分类')}</small>
                  </span>
                  <span>
                    <strong>{stats.tags}</strong>
                    <small>{t('console.stat.tags', '标签')}</small>
                  </span>
                  <span>
                    <strong>{stats.readingMinutes}m</strong>
                    <small>{t('console.stat.reading', '阅读')}</small>
                  </span>
                </div>
              </section>

              <section className="console-card console-webinfo">
                <div className="console-card__head">
                  <div>
                    <p className="author-content-item-tips">{t('console.status', '运行状态')}</p>
                    <h2 className="author-content-item-title">{t('console.overview', '站点概览')}</h2>
                  </div>
                  <div 
                    data-tooltip="数据是系统的脉络，客观映射着每一次渲染与交互的物理回响。"
                    style={{ position: 'relative', cursor: 'pointer', overflow: 'visible' }}
                  >
                    <Info className="h-5 w-5 text-theme-main info-icon" />
                  </div>
                </div>
                <p className="webinfo-description">{convertText('数据是系统的脉络，客观映射着每一次渲染与交互的物理回响。', localeVariant)}</p>
                <div className="console-webinfo-grid">
                  {[
                    ...siteStats,
                    { label: '构建引擎', value: 'Astro / Vite', tooltip: '基于现代化的 Vite 构建工具及 Astro 框架的极速静态生成与混合渲染，支持高度优化的分块策略。' },
                    { label: '样式底层', value: 'Tailwind CSS', tooltip: '采用原子级 CSS 框架实现的高性能、响应式且易于扩展的视觉体系，具备极高的运行时性能优势。' },
                    { label: '部署节点', value: 'Vercel / CF', tooltip: '依托全球分布式边缘计算节点（Vercel 或 Cloudflare）实现的全时段低延迟分发与无服务器函数响应。' },
                    { label: '运行反馈', value: '< 50ms', tooltip: '极致优化的边缘预渲染与资源调度，确保首屏加载与交互响应均低于感知阈值。' },
                  ].map((stat, i) => (
                    <div className="webinfo-item" key={i}>
                      <div className="webinfo-item-label">
                        {stat.href ? (
                          <a 
                            href={stat.href} 
                            data-tooltip={stat.tooltip} 
                            style={{ position: 'relative', cursor: 'pointer', overflow: 'visible', display: 'flex', alignItems: 'center', gap: '4px' }}
                          >
                            <span>{stat.label}</span>
                            <Info className="info-icon" size={12} />
                          </a>
                        ) : (
                          <div 
                            data-tooltip={stat.tooltip} 
                            style={{ position: 'relative', cursor: 'pointer', overflow: 'visible', display: 'flex', alignItems: 'center', gap: '4px' }}
                          >
                            <span>{stat.label}</span>
                            <Info className="info-icon" size={12} />
                          </div>
                        )}
                      </div>
                      <strong>{stat.value}</strong>
                    </div>
                  ))}
                </div>
              </section>
            </div>

            <div className="console-card-group-right">
              <section className="console-card tags">
                <p className="author-content-item-tips">热门话题</p>
                <h2 className="author-content-item-title">内容发现</h2>
                <div className="card-tag-cloud" style={{ fontSize: tagData.fontSize }}>
                  {tagData.items.map((tag) => (
                    <a href={tag.href} key={tag.href}>
                      {tag.label}
                      <sup>{tag.count}</sup>
                    </a>
                  ))}
                </div>
              </section>

              <section className="console-card activity">
                <div className="console-card__head" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <p className="author-content-item-tips">shijianus {t('console.activity.tips', '活跃度')}</p>
                    <h2 className="author-content-item-title">{t('console.activity.title', '更新记录')}</h2>
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
                <div className="activity-grid-container">
                  <div className="heatmap-internal-wrapper">
                    <div className="activity-month-labels">
                      {monthLabels.map((m, i) => (
                        <span 
                          key={i} 
                          className="month-label"
                          style={{ 
                            left: `${m.index * 14}px` 
                          }}
                        >
                          {m.label}
                        </span>
                      ))}
                    </div>
                    <div className="heatmap-grid-row">
                      <div className="activity-weekday-labels">
                        <span />
                        <span>Mon</span>
                        <span />
                        <span>Wed</span>
                        <span />
                        <span>Fri</span>
                        <span />
                      </div>
                      <div className="console-activity-grid">
                        {activityData.map((day, i) => (
                          <div 
                            key={i} 
                            className={day ? `activity-cell level-${day.level}` : 'activity-cell hidden'} 
                            style={day ? {} : { visibility: 'hidden', pointerEvents: 'none' }}
                            data-tooltip={day ? `${day.date}${day.posts.length > 0 ? '\n' + day.posts.map(p => '· ' + p.title).join('\n') : '\nNo contributions'}` : undefined}
                            onClick={() => {
                              if (day) {
                                setSelectedActivityDate(day.date);
                                setSelectedActivityPage(1);
                              }
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="activity-details-footer">
                  <div className="selected-day-preview">
                    {selectedActivity ? (
                      <div className="activity-details">
                        <div className="activity-details__head">
                          <strong>{selectedActivity.date}</strong>
                          {activityPagination.total > 1 && (
                            <div className="activity-pagination">
                              <button
                                disabled={activityPagination.current === 1}
                                onClick={() => setSelectedActivityPage(p => Math.max(1, p - 1))}
                              >
                                <ArrowLeft className="h-3 w-3" />
                              </button>
                              <span>{activityPagination.current} / {activityPagination.total}</span>
                              <button
                                disabled={activityPagination.current === activityPagination.total}
                                onClick={() => setSelectedActivityPage(p => Math.min(activityPagination.total, p + 1))}
                              >
                                <ArrowRight className="h-3 w-3" />
                              </button>
                            </div>
                          )}
                        </div>
                        {activityPagination.items.length > 0 ? (
                          <ul className="activity-details-list">
                            {activityPagination.items.map((p, i) => (
                              <li key={i}>
                                <GitCommit className="h-3.5 w-3.5 activity-commit-icon" />
                                <a href={p.href}>{p.title}</a>
                              </li>
                            ))}
                          </ul>
                        ) : <span className="no-activity-text">{t('console.activity.empty', '当日无推送记录')}</span>}
                      </div>
                    ) : <span className="activity-hint-text">{t('console.activity.hint', '点击方块查看记录')}</span>}
                  </div>
                </div>
              </section>
            </div>
          </div>

          <div className="button-group" aria-label="控制台快捷操作" style={{ pointerEvents: consoleOpen ? 'auto' : 'none' }}>
            <button
              type="button"
              className={`console-btn-item ${theme === 'dark' ? 'on' : ''}`}
              onClick={toggleTheme}
              title="切换深浅色"
              tabIndex={consoleOpen ? 0 : -1}
              disabled={!consoleOpen}
            >
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
              title={t('console.btn.search', '搜索内容')}
              tabIndex={consoleOpen ? 0 : -1}
              disabled={!consoleOpen}
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
              title={t('console.btn.bg', '背景切换')}
              tabIndex={consoleOpen ? 0 : -1}
              disabled={!consoleOpen}
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
              title={t('console.btn.notifications', '查看通知')}
              tabIndex={consoleOpen ? 0 : -1}
              disabled={!consoleOpen}
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
              title={t('console.btn.random', '随便逛逛')}
              tabIndex={consoleOpen ? 0 : -1}
              disabled={!consoleOpen}
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
              title={t('console.btn.top', '回到顶部')}
              tabIndex={consoleOpen ? 0 : -1}
              disabled={!consoleOpen}
            >
              <ArrowUp aria-hidden="true" />
            </button>
          </div>
        </section>
      )}

      <section className={`theme-account-overlay ${notificationOpen ? 'show' : ''}`} aria-hidden={!notificationOpen} data-no-translate="true">
        <button
          type="button"
          className="theme-account-overlay__mask"
          onClick={() => setNotificationOpen(false)}
          aria-label="关闭账号面板"
        />
        <div className="theme-account-drawer" role="dialog" aria-modal="true" aria-label={t('drawer.title', '账号中心')}>
          {/* 1. Header */}
          <div className="theme-account-drawer__head">
            <div className="theme-account-drawer__head-title-wrap">
              <div className="theme-account-drawer__head-badge">
                <span className={`status-indicator-dot ${account ? 'is-active' : ''}`} />
                <span className="eyebrow">{t('drawer.eyebrow', 'READER HUB · 读者中心')}</span>
              </div>
              <h2>{t('drawer.title', '账号中心')}</h2>
            </div>
            <button
              type="button"
              className="theme-icon-button theme-button--ghost theme-account-drawer__close"
              onClick={() => setNotificationOpen(false)}
              aria-label={t('drawer.close', '关闭账号面板')}
            >
              <X className="overlay-icon" aria-hidden="true" />
            </button>
          </div>

          {/* 2. Hero Summary Profile Card */}
          <div className="account-hero-card">
            <div
              className="account-hero-card__avatar is-clickable"
              onClick={() => avatarFileInputRef.current?.click()}
              title={t('hero.avatarTitle', '点击更换头像 (支持选择本地图片上传)')}
              role="button"
              tabIndex={0}
              aria-label={t('hero.avatarTitle', '点击更换头像')}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  avatarFileInputRef.current?.click();
                }
              }}
            >
              {account?.avatar ? (
                <img src={account.avatar} alt={account.name || brandName} loading="lazy" />
              ) : account?.role === 'admin' ? (
                <img src="/media/shijianus/avatar.jpg" alt={account.name || brandName} loading="lazy" />
              ) : accountForm.avatar ? (
                <img src={accountForm.avatar} alt={accountForm.name || '读者'} loading="lazy" />
              ) : account ? (
                <span>{getCommentInitials(account.name || brandName)}</span>
              ) : accountForm.name ? (
                <span>{getCommentInitials(accountForm.name)}</span>
              ) : (
                <UserRound className="h-6 w-6 text-theme-main" />
              )}
              <div className="account-hero-card__avatar-overlay">
                <Camera className="h-4 w-4" />
                <span>{t('hero.avatarChange', '更换')}</span>
              </div>
              <span className="account-hero-card__avatar-badge" title="点击更换头像">
                <Camera className="h-2.5 w-2.5" />
              </span>
              {account?.provider === 'epomail' && (
                <span className="account-hero-card__badge-icon" title="Epomail 认证身份">
                  ⚡
                </span>
              )}
            </div>

            <div className="account-hero-card__info">
              <div className="account-hero-card__name-row">
                <strong>{account ? account.name : accountForm.name ? accountForm.name : t('hero.guestFriend', '访客朋友')}</strong>
                {account?.provider === 'epomail' ? (
                  <span className="account-pill account-pill--epomail">{t('hero.badge.epomail')}</span>
                ) : account ? (
                  <span className="account-pill account-pill--local">{t('hero.badge.local')}</span>
                ) : accountForm.name ? (
                  <span className="account-pill account-pill--local">{t('hero.badge.local')}</span>
                ) : (
                  <span className="account-pill account-pill--guest">{t('hero.badge.guest')}</span>
                )}
                {account?.role === 'admin' && (
                  <span className="account-pill account-pill--admin">{t('hero.badge.admin', '管理员')}</span>
                )}
              </div>
              <p className="account-hero-card__desc">
                {accountForm.bio || account?.bio || (account?.email || (account ? t('hero.boundIdentity', '已绑定评论身份') : accountForm.email ? accountForm.email : t('hero.emptyBio', '点击设置个人简介、时区与位置')))}
              </p>
              {(accountForm.location || accountForm.timezone || account?.location || account?.timezone) && (
                <div className="account-hero-card__meta-row">
                  {(accountForm.location || account?.location) && (
                    <span className="account-meta-badge" title="所在位置">
                      📍 {accountForm.location || account?.location}
                    </span>
                  )}
                  {(accountForm.timezone || account?.timezone) && (
                    <span className="account-meta-badge" title="当前时区">
                      🕒 {accountForm.timezone || account?.timezone}
                    </span>
                  )}
                </div>
              )}
            </div>

            <div className="account-hero-card__actions">
              {account && (
                <button
                  type="button"
                  className="account-btn-icon"
                  onClick={handleLogout}
                  title={t('hero.signout')}
                  aria-label={t('hero.signout')}
                >
                  <LogOut className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          {/* 3. Navigation Tabs */}
          <div className="account-nav-tabs" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={accountTab === 'auth'}
              className={`account-nav-tab ${accountTab === 'auth' ? 'is-active' : ''}`}
              onClick={() => setAccountTab('auth')}
            >
              <UserRound className="h-4 w-4" />
              <span>{t('tab.auth')}</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={accountTab === 'notifications'}
              className={`account-nav-tab ${accountTab === 'notifications' ? 'is-active' : ''}`}
              onClick={() => setAccountTab('notifications')}
            >
              <Bell className="h-4 w-4" />
              <span>{t('tab.notifications')}</span>
              {allNotifications.length > 0 && (
                <span className="account-tab-badge">{allNotifications.length}</span>
              )}
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={accountTab === 'settings'}
              className={`account-nav-tab ${accountTab === 'settings' ? 'is-active' : ''}`}
              onClick={() => setAccountTab('settings')}
            >
              <Settings className="h-4 w-4" />
              <span>{t('tab.settings')}</span>
            </button>
          </div>

          {/* 4. Status Toast / Notice */}
          {authStatusMessage && (
            <div className={`account-toast-notice account-toast-notice--${authStatusMessage.type}`}>
              {authStatusMessage.type === 'success' && <CheckCircle2 className="h-4 w-4 flex-shrink-0" />}
              {authStatusMessage.type === 'error' && <Info className="h-4 w-4 flex-shrink-0" />}
              <span>{convertText(authStatusMessage.text, localeVariant)}</span>
            </div>
          )}

          {/* 5. TAB 1: 个人资料与账户设置 */}
          {accountTab === 'auth' && (
            <div className="account-tab-content">
              {/* 隐藏的头像文件选择框 */}
              <input
                type="file"
                ref={avatarFileInputRef}
                accept="image/png,image/jpeg,image/gif,image/webp,image/svg+xml,image/avif"
                style={{ display: 'none' }}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleAvatarFileSelect(file);
                  e.target.value = '';
                }}
              />

              {/* 专属账户资料设置面板 */}
              <section className="account-card">
                <div className="account-card__head">
                  <h3 className="account-card__title">{t('profile.card.title')}</h3>
                </div>

                <form onSubmit={handleSaveProfile} className="account-profile-form">
                  <div className="account-form-grid">
                    <label className="account-field">
                      <span>{t('profile.field.name')}</span>
                      <div className="account-field-control">
                        <UserRound className="account-field-icon" />
                        <input
                          type="text"
                          name="name"
                          value={accountForm.name}
                          onChange={(e) => {
                            const val = e.target.value;
                            setAccountForm((prev) => ({ ...prev, name: val }));
                          }}
                          placeholder={t('profile.field.namePlaceholder')}
                        />
                      </div>
                    </label>

                    <label className="account-field">
                      <span>{t('profile.field.website')}</span>
                      <div className="account-field-control">
                        <Globe className="account-field-icon" />
                        <input
                          type="url"
                          name="website"
                          value={accountForm.website}
                          onChange={(e) => {
                            const val = e.target.value;
                            setAccountForm((prev) => ({ ...prev, website: val }));
                          }}
                          placeholder="https://example.com"
                        />
                      </div>
                    </label>

                    <label className="account-field account-field--full">
                      <span>{t('profile.field.bio')}</span>
                      <div className="account-field-control">
                        <Sparkles className="account-field-icon" />
                        <input
                          type="text"
                          name="bio"
                          maxLength={120}
                          value={accountForm.bio}
                          onChange={(e) => {
                            const val = e.target.value;
                            setAccountForm((prev) => ({ ...prev, bio: val }));
                          }}
                          placeholder={t('profile.field.bioPlaceholder')}
                        />
                      </div>
                    </label>

                    <label className="account-field">
                      <span>{t('profile.field.timezone')}</span>
                      <div className="account-field-control">
                        <Clock className="account-field-icon" />
                        <input
                          type="text"
                          name="timezone"
                          list="account-common-timezones"
                          value={accountForm.timezone}
                          onChange={(e) => {
                            const val = e.target.value;
                            setAccountForm((prev) => ({ ...prev, timezone: val }));
                          }}
                          placeholder={t('profile.field.timezonePlaceholder', '自动获取或选择')}
                        />
                        <datalist id="account-common-timezones">
                          {Object.entries(TIMEZONE_LABELS[localeVariant] || TIMEZONE_LABELS['zh-CN']).map(([val, label]) => (
                            <option key={val} value={val}>{label}</option>
                          ))}
                        </datalist>
                        <button
                          type="button"
                          className="account-field-quick-btn"
                          title={t('profile.field.detectTzTitle', '重新检测本机当前时区')}
                          onClick={() => {
                            try {
                              const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
                              setAccountForm((prev) => ({ ...prev, timezone: tz }));
                            } catch {}
                          }}
                        >
                          {t('profile.field.detectTz')}
                        </button>
                      </div>
                    </label>

                    <label className="account-field">
                      <span>{t('profile.field.location')}</span>
                      <div className="account-field-control">
                        <MapPin className="account-field-icon" />
                        <input
                          type="text"
                          name="location"
                          value={accountForm.location}
                          onChange={(e) => {
                            const val = e.target.value;
                            setAccountForm((prev) => ({ ...prev, location: val }));
                          }}
                          placeholder={t('profile.field.locationPlaceholder', '自动获取或自定义')}
                        />
                        <button
                          type="button"
                          className="account-field-quick-btn"
                          title={t('profile.field.detectLocTitle', '重新获取网络地理位置')}
                          onClick={() => {
                            fetch(`/api/geo-profile?locale=${encodeURIComponent(localeVariant)}`)
                              .then((r) => r.json())
                              .then((data: any) => {
                                if (data?.location) {
                                  setAccountForm((prev) => ({ ...prev, location: data.location }));
                                } else if (data?.country) {
                                  const info = resolveGeoInfo(data.country, localeVariant);
                                  setAccountForm((prev) => ({ ...prev, location: info.name || data.country }));
                                }
                              })
                              .catch(() => {});
                          }}
                        >
                          {t('profile.field.detectLoc')}
                        </button>
                      </div>
                    </label>
                  </div>

                  <div className="account-card__foot">
                    <button
                      type="submit"
                      className="account-btn-primary"
                      disabled={isAuthorizing}
                    >
                      <Save className="h-4 w-4" />
                      <span>{t('profile.btn.save')}</span>
                    </button>
                  </div>
                </form>
              </section>

              {/* 未登录 Epomail 时的统一身份认证与漫游通道 */}
              {(!account || account.provider !== 'epomail') && (
                <section className="account-card account-card--epomail">
                  <div className="account-card__head">
                    <div className="account-brand-header">
                      <div className="epomail-badge-icon">
                        <Mail className="h-5 w-5 text-theme-main" />
                      </div>
                      <h3 className="account-card__title">{t('epomail.card.title')}</h3>
                    </div>
                  </div>

                  <div className="epomail-benefits-row">
                    <div className="epomail-benefit-item">
                      <Sparkles className="h-3.5 w-3.5 text-blue-500 flex-shrink-0" />
                      <span>{t('epomail.benefit.pwdless', '一键免密授权')}</span>
                    </div>
                    <div className="epomail-benefit-item">
                      <Camera className="h-3.5 w-3.5 text-blue-500 flex-shrink-0" />
                      <span>{t('epomail.benefit.avatar', '云端头像漫游')}</span>
                    </div>
                    <div className="epomail-benefit-item">
                      <Bell className="h-3.5 w-3.5 text-blue-500 flex-shrink-0" />
                      <span>{t('epomail.benefit.instant', '回复即刻送达')}</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="epomail-primary-login-btn"
                    onClick={handleEpomailOAuth}
                    disabled={isAuthorizing}
                  >
                    <Sparkles className="h-4 w-4" />
                    <span>{t('epomail.btn.login')}</span>
                  </button>

                  {/* 管理员或开发者通道 (折叠设计) */}
                  <div className="direct-app-auth-accordion">
                    <button
                      type="button"
                      className="direct-app-auth-toggle"
                      onClick={() => setShowDirectAppAuth(!showDirectAppAuth)}
                    >
                      <span>{t('epomail.direct.toggle', '站长或开发者直接授权通道')}</span>
                      {showDirectAppAuth ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                    </button>

                    {showDirectAppAuth && (
                      <form className="direct-app-auth-form" onSubmit={handleDirectEpomailSubmit}>
                        <div className="account-form-grid">
                          <label className="account-field">
                            <span>{t('epomail.direct.email', 'Epomail 邮箱')}</span>
                            <div className="account-input-wrap">
                              <Mail className="account-input-icon" />
                              <input
                                type="email"
                                value={epomailForm.email}
                                onChange={(e) => setEpomailForm({ ...epomailForm, email: e.target.value })}
                                placeholder="admin@epomail.bond"
                                required
                              />
                            </div>
                          </label>

                          <label className="account-field">
                            <span>{t('epomail.direct.password', '账户密码')}</span>
                            <div className="account-input-wrap">
                              <Lock className="account-input-icon" />
                              <input
                                type="password"
                                value={epomailForm.password}
                                onChange={(e) => setEpomailForm({ ...epomailForm, password: e.target.value })}
                                placeholder={t('epomail.direct.passwordPlaceholder', '输入登录密码')}
                              />
                            </div>
                          </label>

                          <label className="account-field account-field--full">
                            <span>{t('epomail.direct.totp', '动态验证码 (选填)')}</span>
                            <div className="account-input-wrap">
                              <Key className="account-input-icon" />
                              <input
                                type="text"
                                maxLength={6}
                                value={epomailForm.code}
                                onChange={(e) => setEpomailForm({ ...epomailForm, code: e.target.value })}
                                placeholder={t('epomail.direct.totpPlaceholder', '如已开启双重认证请输入 6 位 TOTP')}
                              />
                            </div>
                          </label>
                        </div>

                        <div className="auth-scope-box">
                          <span className="auth-scope-title">{t('epomail.scope.title', '该授权将允许：')}</span>
                          <ul className="auth-scope-list">
                            <li>
                              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0" />
                              <span>{t('epomail.scope.profile', '获取公开资料（姓名与头像）')}</span>
                            </li>
                            <li>
                              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0" />
                              <span>{t('epomail.scope.email', '验证邮箱并绑定为博客评论作者')}</span>
                            </li>
                            <li>
                              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0" />
                              <span>{t('epomail.scope.notify', '接收博文评论 @ 与回复站内提醒')}</span>
                            </li>
                          </ul>
                        </div>

                        <button
                          type="submit"
                          className="direct-app-submit-btn"
                          disabled={isAuthorizing}
                        >
                          <ShieldCheck className="h-4 w-4" />
                          <span>{isAuthorizing ? t('epomail.direct.verifying', '正在验证授权...') : t('epomail.direct.submit', '验证并接续授予权限')}</span>
                        </button>
                      </form>
                    )}
                  </div>
                </section>
              )}
            </div>
          )}

          {/* 6. TAB 2: 站内提醒与双分区 */}
          {accountTab === 'notifications' && (
            <div className="account-tab-content">
              {/* 双分区切换控制器 */}
              <div className="account-partition-nav" role="tablist">
                <button
                  type="button"
                  className={`account-partition-btn ${notifPartition === 'broadcast' ? 'is-active' : ''}`}
                  onClick={() => setNotifPartition('broadcast')}
                >
                  <Megaphone className="h-4 w-4" />
                  <span>{t('notify.partition.broadcast', '全站广播通告')}</span>
                  <span className="account-partition-pill">{broadcastNotifications.length}</span>
                </button>
                <button
                  type="button"
                  className={`account-partition-btn ${notifPartition === 'personal' ? 'is-active' : ''}`}
                  onClick={() => setNotifPartition('personal')}
                >
                  <UserCheck className="h-4 w-4" />
                  <span>{t('notify.partition.personal', '个人互动与足迹')}</span>
                  {personalNotifications.length > 0 && (
                    <span className="account-partition-pill account-partition-pill--highlight">
                      {personalNotifications.length}
                    </span>
                  )}
                </button>
              </div>

              {/* 分区 1: 全站广播通告 (每个人都能看到，构建期扫描渲染，0 DB 损耗) */}
              {notifPartition === 'broadcast' && (
                <section className="account-card">
                  <div className="account-card__head">
                    <div className="flex items-center gap-2">
                      <Megaphone className="h-5 w-5 text-theme-main" />
                      <h3 className="account-card__title">{t('notify.broadcast.title')}</h3>
                    </div>
                  </div>

                  <div className="account-broadcast-list">
                    {broadcastNotifications.map((item) => {
                      if (item.type === 'announcement') {
                        return (
                          <div key={item.id} className="account-broadcast-item account-broadcast-item--featured">
                            <div className="account-broadcast-head">
                              <span className="account-broadcast-badge account-broadcast-badge--featured">
                                <Megaphone className="h-3 w-3" />
                                <span>{item.badge}</span>
                              </span>
                              <span className="account-broadcast-date">{item.date}</span>
                            </div>
                            <strong className="account-broadcast-title">{item.title}</strong>
                            <p className="account-broadcast-desc">{item.content}</p>

                            {item.bullets && item.bullets.length > 0 && (
                              <ul className="account-broadcast-bullets">
                                {item.bullets.map((bullet, idx) => (
                                  <li key={idx} dangerouslySetInnerHTML={{ __html: bullet }} />
                                ))}
                              </ul>
                            )}

                            {item.href && item.href !== '#' && (
                              <div className="account-broadcast-action">
                                <a
                                  href={item.href}
                                  className="account-broadcast-link"
                                  onClick={() => setNotificationOpen(false)}
                                >
                                  <span>{t('notify.broadcast.readMore', '阅读详情')}</span>
                                  <ChevronRight className="h-3.5 w-3.5" />
                                </a>
                              </div>
                            )}
                          </div>
                        );
                      }

                      return (
                        <a
                          key={item.id}
                          href={item.href}
                          className="account-broadcast-item"
                          onClick={() => {
                            if (item.href !== '#') setNotificationOpen(false);
                          }}
                        >
                          <div className="account-broadcast-head">
                            <span className="account-broadcast-badge">
                              <Tags className="h-3 w-3" />
                              <span>{item.badge}</span>
                            </span>
                            <span className="account-broadcast-date">{item.date}</span>
                          </div>
                          <strong className="account-broadcast-title">{item.title}</strong>
                          <p className="account-broadcast-desc">{item.content}</p>
                        </a>
                      );
                    })}
                  </div>
                </section>
              )}

              {/* 分区 2: 个人互动与足迹 (真实连结 DB，回复、点赞、Boost 与足迹) */}
              {notifPartition === 'personal' && (
                <>
                  {/* 收到的个人互动提醒 */}
                  <section className="account-card">
                    <div className="account-card__head">
                      <h3 className="account-card__title">{t('notify.mentions.title')}</h3>
                    </div>

                    {personalNotifications.length > 0 ? (
                      <div className="account-notification-list">
                        {personalNotifications.map((notification) => (
                          <a
                            className="account-notification-item"
                            href={`/posts/${notification.postSlug}/#comment-${notification.commentId}`}
                            key={notification.id}
                            onClick={() => setNotificationOpen(false)}
                          >
                            <div className="account-notification-avatar">
                              {notification.actorAvatar ? (
                                <img src={notification.actorAvatar} alt={notification.actorName} loading="lazy" />
                              ) : (
                                <span className="notification-icon-wrap">
                                  {notification.type === 'like' ? (
                                    <Heart className="h-4 w-4 text-rose-500" />
                                  ) : notification.type === 'boost' ? (
                                    <Sparkles className="h-4 w-4 text-amber-500" />
                                  ) : (
                                    <MessageSquare className="h-4 w-4 text-blue-500" />
                                  )}
                                </span>
                              )}
                            </div>
                            <div className="account-notification-body">
                              <div className="account-notification-title-row">
                                <strong>{notification.title}</strong>
                                <span className="account-notification-date">
                                  {new Date(notification.createdAt).toLocaleDateString('zh-CN')}
                                </span>
                              </div>
                              <p>{notification.message.slice(0, 120)}</p>
                            </div>
                          </a>
                        ))}
                      </div>
                    ) : (
                      <div className="account-empty-state">
                        <div className="account-empty-state-icon">
                          <Bell className="h-6 w-6" />
                        </div>
                        <strong>{t('notify.mentions.emptyTitle', '暂时没有新的个人互动提醒')}</strong>
                        <p>
                          {account
                            ? t('notify.mentions.emptyDescLogged', '当其他读者在文章评论区回复你、为你点赞或发送 Boost 时，这里将实时呈现。')
                            : t('notify.mentions.emptyDescGuest', '设置昵称或登录后，当有人与你互动时将在此处即刻通知。')}
                        </p>
                      </div>
                    )}
                  </section>

                  {/* 我的评论足迹 (真实连结 DB) */}
                  <section className="account-card">
                    <div className="account-card__head">
                      <h3 className="account-card__title">{t('notify.comments.title')}</h3>
                      <button
                        type="button"
                        className="account-link-btn account-refresh-feed-btn"
                        onClick={() => refreshUserFeed()}
                        disabled={userFeed.loading}
                        title={t('notify.comments.refreshTitle', '从数据库刷新最新记录')}
                      >
                        <RefreshCw className={`h-3 w-3 inline mr-1 ${userFeed.loading ? 'animate-spin' : ''}`} />
                        {t('notify.comments.refresh', '刷新')}
                      </button>
                    </div>

                    {userFeed.userComments.length > 0 ? (
                      <div className="account-my-comments-list">
                        {userFeed.userComments.map((item) => (
                          <a
                            key={item.id}
                            href={`/posts/${item.postSlug}/#comment-${item.id}`}
                            className="account-my-comment-item"
                            onClick={() => setNotificationOpen(false)}
                          >
                            <div className="account-my-comment-head">
                              <span className="account-my-comment-post">
                                item.postSlug ? `${t('notify.comments.postPrefix', '文章：')}${item.postSlug}` : t('notify.comments.defaultPost', '博文评论')
                              </span>
                              <div className="flex items-center gap-2">
                                {item.likesCount > 0 && (
                                  <span className="text-xs font-semibold text-rose-500">
                                    👍 {item.likesCount}
                                  </span>
                                )}
                                <span className="account-my-comment-date">
                                  {new Date(item.createdAt).toLocaleDateString('zh-CN')}
                                </span>
                              </div>
                            </div>
                            <p className="account-my-comment-msg">{item.message}</p>
                          </a>
                        ))}
                      </div>
                    ) : (
                      <div className="account-empty-state account-empty-state--compact">
                        <p>{t('notify.comments.emptyDesc', '数据库中暂无您的评论记录，前往任意文章底部发表评论即可自动记录足迹。')}</p>
                      </div>
                    )}
                  </section>
                </>
              )}
            </div>
          )}

          {/* 7. TAB 3: 偏好设置与隐私 (全站唯一偏好设置中心) */}
          {accountTab === 'settings' && (
            <div className="account-tab-content">
              {/* 语言偏好 */}
              <section className="account-card">
                <div className="account-card__head">
                  <div className="flex items-center gap-2">
                    <Globe className="h-5 w-5 text-theme-main" />
                    <h3 className="account-card__title">{t('settings.lang.title')}</h3>
                  </div>
                </div>

                <div className="account-locale-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(135px, 1fr))', gap: '8px' }}>
                  {SUPPORTED_LOCALES.map((code) => {
                    const meta = LOCALE_METADATA[code];
                    const isActive = localeVariant === code;
                    return (
                      <button
                        key={code}
                        type="button"
                        className={`account-locale-btn ${isActive ? 'is-active' : ''}`}
                        onClick={() => selectLocale(code)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '8px 10px',
                          borderRadius: '8px',
                          fontSize: '13px',
                          fontWeight: isActive ? 600 : 400,
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                        }}
                      >
                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontSize: '15px' }}>{meta.flag}</span>
                          <span>{meta.nativeName}</span>
                        </span>
                        <span
                          style={{
                            fontSize: '10px',
                            fontWeight: 700,
                            padding: '1px 5px',
                            borderRadius: '4px',
                            opacity: isActive ? 1 : 0.65,
                            background: isActive ? 'var(--anzhiyu-theme, #425aef)' : 'rgba(125,125,125,0.15)',
                            color: isActive ? '#ffffff' : 'inherit',
                          }}
                        >
                          {meta.badge}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </section>

              {/* 1. 站内通知接收偏好 */}
              <section className="account-card">
                <div className="account-card__head">
                  <div className="flex items-center gap-2">
                    <Bell className="h-5 w-5 text-theme-main" />
                    <h3 className="account-card__title">{t('settings.notify.title')}</h3>
                  </div>
                </div>

                <div className="account-prefs-group">
                  <div className="account-pref-card">
                    <div className="account-pref-info">
                      <span className="account-pref-title">
                        <Megaphone className="h-4 w-4 text-theme-main" />
                        <span>{t('settings.notify.broadcast.title')}</span>
                      </span>
                      <span className="account-pref-desc">
                        {t('settings.notify.broadcast.desc')}
                      </span>
                    </div>
                    <label className="theme-switch-label relative inline-flex items-center cursor-pointer flex-shrink-0">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={userPreferences.broadcastNotify}
                        onChange={(e) => {
                          const val = e.target.checked;
                          const next = writeUserPreferences({ broadcastNotify: val });
                          setUserPreferences(next);
                        }}
                      />
                      <div className="theme-switch-slider"></div>
                    </label>
                  </div>

                  <div className="account-pref-card">
                    <div className="account-pref-info">
                      <span className="account-pref-title">
                        <MessageSquare className="h-4 w-4 text-theme-main" />
                        <span>{t('settings.notify.personal.title')}</span>
                      </span>
                      <span className="account-pref-desc">
                        {t('settings.notify.personal.desc')}
                      </span>
                    </div>
                    <label className="theme-switch-label relative inline-flex items-center cursor-pointer flex-shrink-0">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={userPreferences.personalNotify}
                        onChange={(e) => {
                          const val = e.target.checked;
                          const next = writeUserPreferences({ personalNotify: val });
                          setUserPreferences(next);
                        }}
                      />
                      <div className="theme-switch-slider"></div>
                    </label>
                  </div>
                </div>
              </section>

              {/* 2. 评论区互动与显示偏好 */}
              <section className="account-card">
                <div className="account-card__head">
                  <div className="flex items-center gap-2">
                    <Sliders className="h-5 w-5 text-theme-main" />
                    <h3 className="account-card__title">{t('settings.comments.title')}</h3>
                  </div>
                </div>

                <div className="account-prefs-group">
                  {/* 默认排序 */}
                  <div className="account-pref-card">
                    <div className="account-pref-info">
                      <span className="account-pref-title">
                        <Clock className="h-4 w-4 text-theme-main" />
                        <span>{t('settings.comments.sort.title')}</span>
                      </span>
                      <span className="account-pref-desc">
                        {t('settings.comments.sort.desc')}
                      </span>
                    </div>
                    <div className="account-pref-sort-group">
                      <button
                        type="button"
                        className={`account-pref-sort-btn ${userPreferences.defaultCommentSort === 'new' ? 'is-active' : ''}`}
                        onClick={() => {
                          const next = writeUserPreferences({ defaultCommentSort: 'new' });
                          setUserPreferences(next);
                        }}
                      >
                        {t('settings.comments.sort.new')}
                      </button>
                      <button
                        type="button"
                        className={`account-pref-sort-btn ${userPreferences.defaultCommentSort === 'hot' ? 'is-active' : ''}`}
                        onClick={() => {
                          const next = writeUserPreferences({ defaultCommentSort: 'hot' });
                          setUserPreferences(next);
                        }}
                      >
                        {t('settings.comments.sort.hot')}
                      </button>
                    </div>
                  </div>

                  {/* 属地徽章开关 */}
                  <div className="account-pref-card">
                    <div className="account-pref-info">
                      <span className="account-pref-title">
                        <Globe className="h-4 w-4 text-theme-main" />
                        <span>{t('settings.comments.location.title')}</span>
                      </span>
                      <span className="account-pref-desc">
                        {t('settings.comments.location.desc')}
                      </span>
                    </div>
                    <label className="theme-switch-label relative inline-flex items-center cursor-pointer flex-shrink-0">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={accountForm.showLocation}
                        onChange={async (e) => {
                          const checked = e.target.checked;
                          setAccountForm((prev) => ({ ...prev, showLocation: checked }));
                          writeUserPreferences({ showLocation: checked });
                          if (account) {
                            await updateAuthProfile({ showLocation: checked });
                            setAccount((prev) => (prev ? { ...prev, showLocation: checked } : null));
                          } else {
                            const current = readCommentIdentity();
                            if (current) {
                              writeCommentIdentity({ ...current, showLocation: checked });
                            }
                          }
                        }}
                      />
                      <div className="theme-switch-slider"></div>
                    </label>
                  </div>

                  {/* 折叠二级回复 */}
                  <div className="account-pref-card">
                    <div className="account-pref-info">
                      <span className="account-pref-title">
                        <ChevronDown className="h-4 w-4 text-theme-main" />
                        <span>{t('settings.comments.collapse.title')}</span>
                      </span>
                      <span className="account-pref-desc">
                        {t('settings.comments.collapse.desc')}
                      </span>
                    </div>
                    <label className="theme-switch-label relative inline-flex items-center cursor-pointer flex-shrink-0">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={userPreferences.collapseReplies}
                        onChange={(e) => {
                          const val = e.target.checked;
                          const next = writeUserPreferences({ collapseReplies: val });
                          setUserPreferences(next);
                        }}
                      />
                      <div className="theme-switch-slider"></div>
                    </label>
                  </div>
                </div>
              </section>

              {/* 3. 交互反馈与无障碍 */}
              <section className="account-card">
                <div className="account-card__head">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-theme-main" />
                    <h3 className="account-card__title">{t('settings.a11y.title')}</h3>
                  </div>
                </div>

                <div className="account-prefs-group">
                  <div className="account-pref-card">
                    <div className="account-pref-info">
                      <span className="account-pref-title">
                        {userPreferences.soundEffects ? <Volume2 className="h-4 w-4 text-theme-main" /> : <VolumeX className="h-4 w-4 text-secondtext" />}
                        <span>{t('settings.a11y.haptic.title')}</span>
                      </span>
                      <span className="account-pref-desc">
                        {t('settings.a11y.haptic.desc')}
                      </span>
                    </div>
                    <label className="theme-switch-label relative inline-flex items-center cursor-pointer flex-shrink-0">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={userPreferences.soundEffects}
                        onChange={(e) => {
                          const val = e.target.checked;
                          const next = writeUserPreferences({ soundEffects: val });
                          setUserPreferences(next);
                        }}
                      />
                      <div className="theme-switch-slider"></div>
                    </label>
                  </div>

                  <div className="account-pref-card">
                    <div className="account-pref-info">
                      <span className="account-pref-title">
                        <Sparkles className="h-4 w-4 text-theme-main" />
                        <span>{t('settings.a11y.scroll.title')}</span>
                      </span>
                      <span className="account-pref-desc">
                        {t('settings.a11y.scroll.desc')}
                      </span>
                    </div>
                    <label className="theme-switch-label relative inline-flex items-center cursor-pointer flex-shrink-0">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={!userPreferences.reducedMotion}
                        onChange={(e) => {
                          const val = !e.target.checked;
                          const next = writeUserPreferences({ reducedMotion: val });
                          setUserPreferences(next);
                        }}
                      />
                      <div className="theme-switch-slider"></div>
                    </label>
                  </div>
                </div>

                {/* 真实合规的管理目的说明 */}
                <div className="account-privacy-note">
                  <Info className="h-4 w-4 text-theme-main flex-shrink-0 mt-0.5" />
                  <span>
                    {t('settings.compliance.note', '特别说明：前台隐匿仅针对普通访客隐藏属地徽章。出于社区反垃圾、网络安全与评论风控管理合规需要，系统后台仍会如实记录发件连接 IP，仅站长与管理员后台可见，绝不对公众展示。')}
                  </span>
                </div>
              </section>
            </div>
          )}
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
          <div className="search-dialog console-notice-dialog" role="alertdialog" aria-modal="true" aria-label={t('console.notice.title', '控制台提示')}>
            <div className="search-dialog__head">
              <div>
                <p className="eyebrow">{t('console.eyebrow', '控制台')}</p>
                <h2>{t('console.notice.unavailable', '控制台暂不可用')}</h2>
              </div>
              <button
                type="button"
                className="theme-icon-button theme-button--ghost"
                onClick={() => setConsoleNoticeOpen(false)}
                aria-label={t('console.notice.close', '关闭控制台提示')}
              >
                <X className="overlay-icon" aria-hidden="true" />
              </button>
            </div>

            <div className="console-notice-dialog__body">
              <p>{convertText(consolePanel.disabledNotice, localeVariant)}</p>
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
            aria-label={t('menu.title', '右键菜单')}
          >
            <div className="rightMenu-group rightMenu-small">
              <button type="button" className="rightMenu-item" onClick={() => window.history.back()} title={t('menu.back', '后退')}>
                <ArrowLeft aria-hidden="true" />
              </button>
              <button type="button" className="rightMenu-item" onClick={() => window.history.forward()} title={t('menu.forward', '前进')}>
                <ArrowRight aria-hidden="true" />
              </button>
              <button type="button" className="rightMenu-item" onClick={() => window.location.reload()} title={t('menu.refresh', '刷新')}>
                <RefreshCw aria-hidden="true" />
              </button>
              <button type="button" className="rightMenu-item" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} title={t('menu.top', '顶部')}>
                <ArrowUp aria-hidden="true" />
              </button>
            </div>

            <div className="rightMenu-group rightMenu-line">
              {rightMenu.selectedText && (
                <button
                  type="button"
                  className="rightMenu-item"
                  onClick={() => {
                    window.dispatchEvent(
                      new CustomEvent('shijianus:quote-post-text', {
                        detail: {
                          text: rightMenu.selectedText,
                          url: window.location.pathname,
                          title: document.title.replace(/\s*[-|_|—].*$/, '').trim(),
                        },
                      })
                    );
                    emitActivity('已将选中文本引用至评论区');
                  }}
                  title={t('menu.quote', '将选中文本引用至评论区')}
                >
                  <Quote aria-hidden="true" />
                  <span>{t('menu.quote', '引用至评论区')}</span>
                </button>
              )}
              <button
                type="button"
                className="rightMenu-item"
                onClick={async () => {
                  if (await copyText(rightMenu.selectedText || document.title)) emitActivity('已复制选中文本');
                }}
              >
                <Copy aria-hidden="true" />
                <span>{t('menu.copyText', '复制选中文本')}</span>
              </button>
              <button
                type="button"
                className="rightMenu-item"
                onClick={async () => {
                  if (await copyText(window.location.href)) emitActivity('已复制当前地址');
                }}
              >
                <Clipboard aria-hidden="true" />
                <span>{t('menu.copyUrl', '复制地址')}</span>
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
                <span>{t('menu.search', '站内搜索')}</span>
              </button>
              <button type="button" className="rightMenu-item" onClick={toggleTheme}>
                {theme === 'dark' ? <SunMedium aria-hidden="true" /> : <MoonStar aria-hidden="true" />}
                <span>{theme === 'dark' ? t('menu.lightMode', '浅色模式') : t('menu.darkMode', '深色模式')}</span>
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
