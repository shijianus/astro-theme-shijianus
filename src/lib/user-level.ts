/**
 * User Level & Trust System for EpoCanvas / Shijianus Blog
 *
 * Implements the community leveling ladder:
 * - LV.0 新兴用户 (Newcomer): TL 0 (New account / initial state)
 * - LV.0 初始用户 (Initial Reader): TL 2 (First read / hasReadAny)
 * - LV.1 基本用户 (Basic User): TL 5 (First comment / commentCount >= 1)
 * - LV.1 贡献者 (Contributor): TL 7 (Reading > 30min && comments >= 10)
 * - LV.2 活跃用户 (Active User): TL 10 (Active > 20 days && reading > 300min && comments >= 30 && reactions >= 30)
 * - LV.3 先驱 (Pioneer): TL 15 (Active > 60 days && reading > 12h && comments >= 100 && reactions >= 50)
 * - LV.3 年度用户 (Annual Member): TL 20 (Active > 365 days)
 * - LV.4 核心成员 (Core Member): TL 25 (Promoted by webmaster, circular avatar)
 * - LV.4 站长 (Webmaster): TL 99 (Site owner, UNIQUE square avatar)
 */

export type UserLevelTitle =
  | '站长'
  | '核心成员'
  | '墨海宗师'
  | '年度用户'
  | '先驱'
  | '常青极客'
  | '活跃用户'
  | '思辨学者'
  | '贡献者'
  | '基本用户'
  | '初始用户'
  | '新兴用户';

export interface UserStats {
  hasAccount: boolean;
  hasReadAny: boolean;
  readingMinutes: number;
  commentCount: number; // Includes boost
  reactionsReceived: number; // Any emoji reactions received on authored comments
  activeDays: number;
  activeDates: string[]; // YYYY-MM-DD list
  firstSeenAt: string;
  isWebmaster: boolean;
  customLevel?: number;
}

export interface UserLevelInfo {
  level: number; // 0, 1, 2, 3, 4
  levelCode: 'lv0' | 'lv1' | 'lv2' | 'lv3' | 'lv4';
  title: UserLevelTitle;
  trustLevel: number; // 当前实际拥有的 TL 数值
  maxTrustLevel: number; // 当前称号决定的最高 TL 上限 (TL Cap)
  badge: string; // e.g. "LV.1 · 贡献者"
  isWebmaster: boolean;
  isSquareAvatar: boolean;
  nextLevelTitle?: string;
  nextRequirementHint?: string;
  progressPercent: number;
  stats: UserStats;
}

export const USER_STATS_STORAGE_KEY = 'shijianus-user-activity-stats';

export interface UserStatus {
  emoji: string;
  text: string;
  updatedAt?: string;
}

export const USER_STATUS_STORAGE_KEY = 'shijianus-user-status';

export const PRESET_STATUS_OPTIONS: { emoji: string; text: string }[] = [
  { emoji: '☕', text: '喝咖啡中' },
  { emoji: '💻', text: '写代码中' },
  { emoji: '🚀', text: '忙碌中' },
  { emoji: '🎯', text: '深度专注' },
  { emoji: '🌿', text: '摸鱼小憩' },
  { emoji: '💡', text: '构思想法' },
  { emoji: '🎧', text: '听歌沉浸' },
  { emoji: '💤', text: '暂离休息' },
];

export function readUserStatus(): UserStatus {
  if (typeof window === 'undefined') return { emoji: '', text: '' };
  try {
    const raw = window.localStorage.getItem(USER_STATUS_STORAGE_KEY);
    if (!raw) return { emoji: '', text: '' };
    const parsed = JSON.parse(raw);
    return {
      emoji: typeof parsed.emoji === 'string' ? parsed.emoji : '',
      text: typeof parsed.text === 'string' ? parsed.text : '',
      updatedAt: parsed.updatedAt,
    };
  } catch {
    return { emoji: '', text: '' };
  }
}

export function writeUserStatus(status: UserStatus): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(
      USER_STATUS_STORAGE_KEY,
      JSON.stringify({
        ...status,
        updatedAt: new Date().toISOString(),
      })
    );
    window.dispatchEvent(new CustomEvent('shijianus:user-status-change', { detail: status }));
  } catch {}
}

const TITLE_TRANSLATIONS: Record<UserLevelTitle, Record<string, string>> = {
  站长: {
    'zh-CN': '站长',
    'zh-TW': '站長',
    en: 'Webmaster',
    fr: 'Webmestre',
    es: 'Webmaster',
    de: 'Webmaster',
  },
  核心成员: {
    'zh-CN': '核心成员',
    'zh-TW': '核心成員',
    en: 'Core Member',
    fr: 'Membre clé',
    es: 'Miembro clave',
    de: 'Kernmitglied',
  },
  墨海宗师: {
    'zh-CN': '墨海宗师',
    'zh-TW': '墨海宗師',
    en: 'Ink Master',
    fr: 'Maître d’Encre',
    es: 'Maestro de Tinta',
    de: 'Meister der Tinte',
  },
  年度用户: {
    'zh-CN': '年度用户',
    'zh-TW': '年度使用者',
    en: 'Annual Member',
    fr: 'Membre annuel',
    es: 'Usuario anual',
    de: 'Jahresnutzer',
  },
  先驱: {
    'zh-CN': '先驱',
    'zh-TW': '先驅',
    en: 'Pioneer',
    fr: 'Pionnier',
    es: 'Pionero',
    de: 'Pionier',
  },
  常青极客: {
    'zh-CN': '常青极客',
    'zh-TW': '常青極客',
    en: 'Evergreen Geek',
    fr: 'Geek Éternel',
    es: 'Geek Perenne',
    de: 'Immergrüner Geek',
  },
  活跃用户: {
    'zh-CN': '活跃用户',
    'zh-TW': '活躍使用者',
    en: 'Active User',
    fr: 'Utilisateur actif',
    es: 'Usuario activo',
    de: 'Aktiver Nutzer',
  },
  思辨学者: {
    'zh-CN': '思辨学者',
    'zh-TW': '思辨學者',
    en: 'Reflective Scholar',
    fr: 'Savant Réflexif',
    es: 'Erudito Reflexivo',
    de: 'Reflektierter Gelehrter',
  },
  贡献者: {
    'zh-CN': '贡献者',
    'zh-TW': '貢獻者',
    en: 'Contributor',
    fr: 'Contributeur',
    es: 'Contribuyente',
    de: 'Beitragender',
  },
  基本用户: {
    'zh-CN': '基本用户',
    'zh-TW': '基本使用者',
    en: 'Basic User',
    fr: 'Utilisateur de base',
    es: 'Usuario básico',
    de: 'Basisnutzer',
  },
  初始用户: {
    'zh-CN': '初始用户',
    'zh-TW': '初始使用者',
    en: 'Initial User',
    fr: 'Utilisateur initial',
    es: 'Usuario inicial',
    de: 'Erstnutzer',
  },
  新兴用户: {
    'zh-CN': '新兴用户',
    'zh-TW': '新興使用者',
    en: 'Newcomer',
    fr: 'Nouvel arrivant',
    es: 'Recién llegado',
    de: 'Neuling',
  },
};

export function getLocalizedTitle(title: UserLevelTitle, locale: string = 'zh-CN'): string {
  const dict = TITLE_TRANSLATIONS[title] || TITLE_TRANSLATIONS['新兴用户'];
  return dict[locale] || dict['en'] || title;
}

/**
 * Returns default blank stats.
 */
export function getDefaultUserStats(): UserStats {
  const today = new Date().toISOString().slice(0, 10);
  return {
    hasAccount: false,
    hasReadAny: false,
    readingMinutes: 0,
    commentCount: 0,
    reactionsReceived: 0,
    activeDays: 1,
    activeDates: [today],
    firstSeenAt: new Date().toISOString(),
    isWebmaster: false,
  };
}

/**
 * Reads user stats safely from localStorage.
 */
export function readUserStats(): UserStats {
  if (typeof window === 'undefined') return getDefaultUserStats();
  try {
    const raw = window.localStorage.getItem(USER_STATS_STORAGE_KEY);
    if (!raw) return getDefaultUserStats();
    const parsed = JSON.parse(raw);
    const today = new Date().toISOString().slice(0, 10);
    const activeDates = Array.isArray(parsed.activeDates) ? parsed.activeDates : [today];
    return {
      hasAccount: Boolean(parsed.hasAccount),
      hasReadAny: Boolean(parsed.hasReadAny),
      readingMinutes: Number(parsed.readingMinutes) || 0,
      commentCount: Number(parsed.commentCount) || 0,
      reactionsReceived: Number(parsed.reactionsReceived) || 0,
      activeDays: Math.max(1, activeDates.length),
      activeDates,
      firstSeenAt: parsed.firstSeenAt || new Date().toISOString(),
      isWebmaster: Boolean(parsed.isWebmaster),
      customLevel: parsed.customLevel !== undefined ? Number(parsed.customLevel) : undefined,
    };
  } catch {
    return getDefaultUserStats();
  }
}

/**
 * Writes user stats to localStorage.
 */
export function writeUserStats(stats: UserStats): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(USER_STATS_STORAGE_KEY, JSON.stringify(stats));
  } catch {}
}

/**
 * Updates stats partially and returns new state.
 */
export function updateUserStats(updates: Partial<UserStats>): UserStats {
  const current = readUserStats();
  const next: UserStats = {
    ...current,
    ...updates,
    activeDays: updates.activeDates ? updates.activeDates.length : current.activeDays,
  };
  writeUserStats(next);
  return next;
}

/**
 * Records daily visit and marks active date.
 */
export function recordDailyVisit(): void {
  if (typeof window === 'undefined') return;
  const current = readUserStats();
  const today = new Date().toISOString().slice(0, 10);
  if (!current.activeDates.includes(today)) {
    const nextDates = [...current.activeDates, today];
    updateUserStats({ activeDates: nextDates, activeDays: nextDates.length });
  }
}

/**
 * Marks that the user has read content on the site.
 */
export function recordReadingActivity(minutes: number = 0): void {
  if (typeof window === 'undefined') return;
  const current = readUserStats();
  const newMinutes = current.readingMinutes + Math.max(0, minutes);
  updateUserStats({
    hasReadAny: true,
    readingMinutes: newMinutes,
  });
}

export const OFFICIAL_LADDER_TITLES: readonly UserLevelTitle[] = [
  '站长',
  '核心成员',
  '墨海宗师',
  '年度用户',
  '先驱',
  '常青极客',
  '活跃用户',
  '思辨学者',
  '贡献者',
  '基本用户',
  '初始用户',
  '新兴用户',
] as const;

/**
 * Calculates user earned Trust Level (TL) within their current title interval.
 *
 * Core Principle:
 * - Title dictates the Max TL Cap (maxTrustLevel).
 * - Activity points lift TL up from baseTL up to maxTrustLevel:
 *   1 pt per 30m reading, 1 pt per 3 comments, 1 pt per 2 reactions, 1 pt per 3 active days.
 */
export function calculateEarnedTrustLevel(stats: UserStats, baseTL: number, maxTL: number): number {
  if (baseTL >= maxTL) return maxTL;
  const earnedBonus =
    Math.floor((stats.readingMinutes || 0) / 30) +
    Math.floor((stats.commentCount || 0) / 3) +
    Math.floor((stats.reactionsReceived || 0) / 2) +
    Math.floor((stats.activeDays || 1) / 3);
  return Math.min(maxTL, baseTL + Math.max(0, earnedBonus));
}

/**
 * Computes level, trust level, badge, and hints according to the strict waterfall leveling ladder.
 */
export function computeUserLevel(stats: UserStats, accountRole?: string, email?: string): UserLevelInfo {
  const isOwner = stats.isWebmaster || accountRole === 'admin' || (email && email.toLowerCase() === 'admin@epomail.bond');

  // 1. LV.4 站长 (Webmaster) - All-site ONLY square avatar, TL 100, absolute content penetration
  if (isOwner) {
    return {
      level: 4,
      levelCode: 'lv4',
      title: '站长',
      trustLevel: 100,
      maxTrustLevel: 100,
      badge: 'LV.4 · 站长',
      isWebmaster: true,
      isSquareAvatar: true,
      progressPercent: 100,
      nextRequirementHint: '全站最高权威主创与系统所有者 (TL.100 全站无条件穿透权限)',
      stats,
    };
  }

  // 2. LV.4 核心成员 / 管理员 (Admin / Core Member) - Standard Circular avatar, TL 91 ~ 99
  if (stats.customLevel === 4 || accountRole === 'admin_moderator') {
    const adminTL = calculateEarnedTrustLevel(stats, 95, 99);
    return {
      level: 4,
      levelCode: 'lv4',
      title: '核心成员',
      trustLevel: adminTL,
      maxTrustLevel: 99,
      badge: 'LV.4 · 核心成员',
      isWebmaster: false,
      isSquareAvatar: false,
      progressPercent: 100,
      nextRequirementHint: '站长特邀委任理事与社区常务管理核心 (TL.91~99)',
      stats,
    };
  }

  // Strict Waterfall Stage Verification (前置解锁链条，逐级依赖，严禁越级)
  // Stage 1: 初始用户 (LV.0) - Max TL 2
  const stage1_initial = stats.hasReadAny || stats.readingMinutes >= 1;

  // Stage 2: 基本用户 (LV.1) - Depends on Stage 1 - Max TL 10
  const stage2_basic = stage1_initial && stats.commentCount >= 1;

  // Stage 3: 贡献者 (LV.1) - Depends on Stage 2 - Max TL 20
  const stage3_contributor = stage2_basic && stats.readingMinutes >= 30 && stats.commentCount >= 10;

  // Stage 4: 思辨学者 (LV.1) - Depends on Stage 3 - Max TL 30
  const stage4_scholar =
    stage3_contributor && stats.readingMinutes >= 120 && stats.commentCount >= 20 && stats.reactionsReceived >= 10;

  // Stage 5: 活跃用户 (LV.2) - Depends on Stage 4 - Max TL 45
  const stage5_active =
    stage4_scholar &&
    stats.activeDays >= 20 &&
    stats.readingMinutes >= 300 &&
    stats.commentCount >= 30 &&
    stats.reactionsReceived >= 20;

  // Stage 6: 常青极客 (LV.2) - Depends on Stage 5 - Max TL 60
  const stage6_geek =
    stage5_active &&
    stats.activeDays >= 45 &&
    stats.readingMinutes >= 480 &&
    stats.commentCount >= 60 &&
    stats.reactionsReceived >= 40;

  // Stage 7: 先驱 (LV.3) - Depends on Stage 6 - Max TL 75
  const stage7_pioneer =
    stage6_geek &&
    stats.activeDays >= 90 &&
    stats.readingMinutes >= 720 &&
    stats.commentCount >= 100 &&
    stats.reactionsReceived >= 60;

  // Stage 8: 年度用户 (LV.3) - Depends on Stage 7 (必须先解锁先驱!) - Max TL 85
  const stage8_annual =
    stage7_pioneer && stats.activeDays >= 180 && stats.readingMinutes >= 1440 && stats.commentCount >= 150;

  // Stage 9: 墨海宗师 (LV.3) - Depends on Stage 8 - Max TL 90 (<= 365 天!)
  const stage9_inkMaster =
    stage8_annual && stats.activeDays >= 300 && stats.readingMinutes >= 2160 && stats.reactionsReceived >= 100;

  // 9. 墨海宗师
  if (stage9_inkMaster) {
    const tl = calculateEarnedTrustLevel(stats, 86, 90);
    return {
      level: 3,
      levelCode: 'lv3',
      title: '墨海宗师',
      trustLevel: tl,
      maxTrustLevel: 90,
      badge: 'LV.3 · 墨海宗师',
      isWebmaster: false,
      isSquareAvatar: false,
      progressPercent: 100,
      nextRequirementHint: '已登顶读者自动晋升最高巅峰 (LV.3 顶级荣誉)',
      stats,
    };
  }

  // 8. 年度用户
  if (stage8_annual) {
    const tl = calculateEarnedTrustLevel(stats, 76, 85);
    const pDays = Math.min(1, stats.activeDays / 300);
    const pRead = Math.min(1, stats.readingMinutes / 2160);
    const pRx = Math.min(1, stats.reactionsReceived / 100);
    const progress = Math.round(((pDays + pRead + pRx) / 3) * 100);

    return {
      level: 3,
      levelCode: 'lv3',
      title: '年度用户',
      trustLevel: tl,
      maxTrustLevel: 85,
      badge: 'LV.3 · 年度用户',
      isWebmaster: false,
      isSquareAvatar: false,
      nextLevelTitle: '墨海宗师',
      nextRequirementHint: `晋升「墨海宗师」还需: 活跃 ${Math.max(0, 300 - stats.activeDays)} 天 | 阅读 ${Math.max(0, 2160 - stats.readingMinutes)}m | 获赞 ${Math.max(0, 100 - stats.reactionsReceived)}个`,
      progressPercent: Math.min(99, progress),
      stats,
    };
  }

  // 7. 先驱
  if (stage7_pioneer) {
    const tl = calculateEarnedTrustLevel(stats, 61, 75);
    const pDays = Math.min(1, stats.activeDays / 180);
    const pRead = Math.min(1, stats.readingMinutes / 1440);
    const pCom = Math.min(1, stats.commentCount / 150);
    const progress = Math.round(((pDays + pRead + pCom) / 3) * 100);

    return {
      level: 3,
      levelCode: 'lv3',
      title: '先驱',
      trustLevel: tl,
      maxTrustLevel: 75,
      badge: 'LV.3 · 先驱',
      isWebmaster: false,
      isSquareAvatar: false,
      nextLevelTitle: '年度用户',
      nextRequirementHint: `晋升「年度用户」还需: 活跃 ${Math.max(0, 180 - stats.activeDays)} 天 | 阅读 ${Math.max(0, 1440 - stats.readingMinutes)}m | 评论 ${Math.max(0, 150 - stats.commentCount)}条`,
      progressPercent: Math.min(99, progress),
      stats,
    };
  }

  // 6. 常青极客
  if (stage6_geek) {
    const tl = calculateEarnedTrustLevel(stats, 46, 60);
    const pDays = Math.min(1, stats.activeDays / 90);
    const pRead = Math.min(1, stats.readingMinutes / 720);
    const pCom = Math.min(1, stats.commentCount / 100);
    const pRx = Math.min(1, stats.reactionsReceived / 60);
    const progress = Math.round(((pDays + pRead + pCom + pRx) / 4) * 100);

    return {
      level: 2,
      levelCode: 'lv2',
      title: '常青极客',
      trustLevel: tl,
      maxTrustLevel: 60,
      badge: 'LV.2 · 常青极客',
      isWebmaster: false,
      isSquareAvatar: false,
      nextLevelTitle: '先驱',
      nextRequirementHint: `晋升「先驱」还需: 活跃 ${Math.max(0, 90 - stats.activeDays)} 天 | 阅读 ${Math.max(0, 720 - stats.readingMinutes)}m | 评论 ${Math.max(0, 100 - stats.commentCount)}条 | 获赞 ${Math.max(0, 60 - stats.reactionsReceived)}个`,
      progressPercent: Math.min(99, progress),
      stats,
    };
  }

  // 5. 活跃用户
  if (stage5_active) {
    const tl = calculateEarnedTrustLevel(stats, 31, 45);
    const pDays = Math.min(1, stats.activeDays / 45);
    const pRead = Math.min(1, stats.readingMinutes / 480);
    const pCom = Math.min(1, stats.commentCount / 60);
    const pRx = Math.min(1, stats.reactionsReceived / 40);
    const progress = Math.round(((pDays + pRead + pCom + pRx) / 4) * 100);

    return {
      level: 2,
      levelCode: 'lv2',
      title: '活跃用户',
      trustLevel: tl,
      maxTrustLevel: 45,
      badge: 'LV.2 · 活跃用户',
      isWebmaster: false,
      isSquareAvatar: false,
      nextLevelTitle: '常青极客',
      nextRequirementHint: `晋升「常青极客」还需: 活跃 ${Math.max(0, 45 - stats.activeDays)} 天 | 阅读 ${Math.max(0, 480 - stats.readingMinutes)}m | 评论 ${Math.max(0, 60 - stats.commentCount)}条 | 获赞 ${Math.max(0, 40 - stats.reactionsReceived)}个`,
      progressPercent: Math.min(99, progress),
      stats,
    };
  }

  // 4. 思辨学者
  if (stage4_scholar) {
    const tl = calculateEarnedTrustLevel(stats, 21, 30);
    const pDays = Math.min(1, stats.activeDays / 20);
    const pRead = Math.min(1, stats.readingMinutes / 300);
    const pCom = Math.min(1, stats.commentCount / 30);
    const pRx = Math.min(1, stats.reactionsReceived / 20);
    const progress = Math.round(((pDays + pRead + pCom + pRx) / 4) * 100);

    return {
      level: 1,
      levelCode: 'lv1',
      title: '思辨学者',
      trustLevel: tl,
      maxTrustLevel: 30,
      badge: 'LV.1 · 思辨学者',
      isWebmaster: false,
      isSquareAvatar: false,
      nextLevelTitle: '活跃用户',
      nextRequirementHint: `晋升「活跃用户」还需: 活跃 ${Math.max(0, 20 - stats.activeDays)} 天 | 阅读 ${Math.max(0, 300 - stats.readingMinutes)}m | 评论 ${Math.max(0, 30 - stats.commentCount)}条 | 获赞 ${Math.max(0, 20 - stats.reactionsReceived)}个`,
      progressPercent: Math.min(99, progress),
      stats,
    };
  }

  // 3. 贡献者
  if (stage3_contributor) {
    const tl = calculateEarnedTrustLevel(stats, 11, 20);
    const pRead = Math.min(1, stats.readingMinutes / 120);
    const pCom = Math.min(1, stats.commentCount / 20);
    const pRx = Math.min(1, stats.reactionsReceived / 10);
    const progress = Math.round(((pRead + pCom + pRx) / 3) * 100);

    return {
      level: 1,
      levelCode: 'lv1',
      title: '贡献者',
      trustLevel: tl,
      maxTrustLevel: 20,
      badge: 'LV.1 · 贡献者',
      isWebmaster: false,
      isSquareAvatar: false,
      nextLevelTitle: '思辨学者',
      nextRequirementHint: `晋升「思辨学者」还需: 阅读 ${Math.max(0, 120 - stats.readingMinutes)}m | 评论 ${Math.max(0, 20 - stats.commentCount)}条 | 获赞 ${Math.max(0, 10 - stats.reactionsReceived)}个`,
      progressPercent: Math.min(99, progress),
      stats,
    };
  }

  // 2. 基本用户
  if (stage2_basic) {
    const tl = calculateEarnedTrustLevel(stats, 3, 10);
    const pRead = Math.min(1, stats.readingMinutes / 30);
    const pCom = Math.min(1, stats.commentCount / 10);
    const progress = Math.round(((pRead + pCom) / 2) * 100);

    return {
      level: 1,
      levelCode: 'lv1',
      title: '基本用户',
      trustLevel: tl,
      maxTrustLevel: 10,
      badge: 'LV.1 · 基本用户',
      isWebmaster: false,
      isSquareAvatar: false,
      nextLevelTitle: '贡献者',
      nextRequirementHint: `晋升「贡献者」还需: 阅读 ${Math.max(0, 30 - stats.readingMinutes)}m | 评论 ${Math.max(0, 10 - stats.commentCount)}条`,
      progressPercent: Math.min(99, progress),
      stats,
    };
  }

  // 1. 初始用户
  if (stage1_initial) {
    const tl = calculateEarnedTrustLevel(stats, 1, 2);
    return {
      level: 0,
      levelCode: 'lv0',
      title: '初始用户',
      trustLevel: tl,
      maxTrustLevel: 2,
      badge: 'LV.0 · 初始用户',
      isWebmaster: false,
      isSquareAvatar: false,
      nextLevelTitle: '基本用户',
      nextRequirementHint: '在博文底部发表首次评论即可晋升「基本用户 (LV.1)」！',
      progressPercent: 50,
      stats,
    };
  }

  // 0. 新兴用户
  return {
    level: 0,
    levelCode: 'lv0',
    title: '新兴用户',
    trustLevel: 0,
    maxTrustLevel: 0,
    badge: 'LV.0 · 新兴用户',
    isWebmaster: false,
    isSquareAvatar: false,
    nextLevelTitle: '初始用户',
    nextRequirementHint: '点击浏览任意博文即刻解锁「初始用户」称号与信任等级！',
    progressPercent: 10,
    stats,
  };
}

/**
 * Returns user public group tags (e.g. for avatar hover card).
 */
export function getAuthorGroups(author: {
  role?: string;
  isWebmaster?: boolean;
  email?: string;
  provider?: string;
  groups?: string[];
}): string[] {
  if (author.groups && author.groups.length > 0) {
    return author.groups;
  }
  const isOwner =
    author.isWebmaster ||
    author.role === 'admin' ||
    (author.email && author.email.toLowerCase() === 'admin@epomail.bond');

  if (isOwner) {
    return ['站长团队', '核心架构师'];
  }

  const isEpomail =
    author.provider === 'epomail' ||
    (author.email && author.email.toLowerCase().endsWith('@epomail.bond'));

  if (isEpomail) {
    return ['Epomail 认证读者', '邮件公测组'];
  }

  return ['社区读者圈'];
}

/**
 * Official group / identity tags whitelist.
 */
export const OFFICIAL_ALLOWED_GROUPS: readonly string[] = [
  '站长团队',
  '核心架构师',
  'Epomail 认证读者',
  '邮件公测组',
  '社区读者圈',
] as const;

export interface CommunityBadge {
  id: string;
  name: string;
  icon: string;
  category: 'tier' | 'read' | 'comment' | 'reaction' | 'activity';
  priority: number; // 稀有度与排序权重，数值越大越优先展示
  description: string;
  isUnlocked: boolean;
  label?: string; // 兼容别名 (同 name)
}

export interface OfficialBadge {
  icon?: string;
  label: string;
  name?: string;
  isSpecial?: boolean;
  description?: string;
  category?: string;
  priority?: number;
}

export interface UserBadgeContext {
  readingTime?: number; // 分钟数
  readingMinutes?: number; // 兼容别名
  commentCount?: number;
  reactionsReceived?: number;
  reactionsGiven?: number;
  activeDays?: number;
  daysSinceRegistered?: number;
  hasEditedComment?: boolean;
  hasEmojiReaction?: boolean;
  hasMentioned?: boolean;
  bio?: string;
  avatarUrl?: string;
  email?: string;
  epomail?: boolean;
  isWebmaster?: boolean;
  role?: string;
  customLevel?: number;
}

/**
 * 博客专属徽章池自动判定引擎 (evaluateUserBadges):
 * 全部基于真实指标动态判定，严禁硬编码假标签！
 *
 * 1. 【等级主称号】（互斥取最高级，权重 100）：
 *    👑 站长 / ⭐ 先驱 / 🎖️ 活跃用户 / 🏅 贡献者 / 🥉 基本用户 / 📘 初始用户 / 🐣 新兴用户
 * 2. 【阅读沉淀成就】（权重 40-70）：
 *    - 📖 通读全文: readingTime >= 15m (40)
 *    - ☕ 慢读时光: readingTime >= 120m (55)
 *    - 📚 博览群书: readingTime >= 600m (70)
 * 3. 【互动交流成就】（权重 30-60）：
 *    - ✍️ 初露锋芒: hasEditedComment === true (30)
 *    - 😀 丰富表情: hasEmojiReaction === true (35)
 *    - 💬 言之有物: commentCount >= 5 (50)
 *    - 🔔 回音激荡: hasMentioned === true (45)
 * 4. 【赞赏喝彩成就】（权重 40-80）：
 *    - ❤️ 不吝赞美: reactionsGiven >= 10 (45)
 *    - ✨ 初见回响: reactionsReceived >= 1 (40)
 *    - 🔥 引发共鸣: reactionsReceived >= 20 (65)
 *    - 💎 深得人心: reactionsReceived >= 50 (80)
 * 5. 【常客与资料成就】（权重 30-80）：
 *    - 🏷️ 自传作者: bio && bio.trim().length >= 10 && avatarUrl (35)
 *    - ✉️ 信件连结: epomail || email (40)
 *    - 🏃 常客印记: activeDays >= 10 (50)
 *    - 🏔️ 百日墨客: activeDays >= 100 (75)
 *    - 🎂 同舟一载: daysSinceRegistered >= 365 (85)
 *
 * 严格按照 priority 从高到低降序排序，返回已解锁徽章列表。
 */
export function evaluateUserBadges(
  statsOrContext: UserStats | UserBadgeContext,
  authorExtra?: Partial<UserBadgeContext>
): CommunityBadge[] {
  const isStats = 'hasAccount' in statsOrContext;
  const merged: UserBadgeContext = {
    ...(isStats
      ? {
          readingTime: (statsOrContext as UserStats).readingMinutes,
          readingMinutes: (statsOrContext as UserStats).readingMinutes,
          commentCount: (statsOrContext as UserStats).commentCount,
          reactionsReceived: (statsOrContext as UserStats).reactionsReceived,
          activeDays: (statsOrContext as UserStats).activeDays,
          isWebmaster: (statsOrContext as UserStats).isWebmaster,
          customLevel: (statsOrContext as UserStats).customLevel,
        }
      : {}),
    ...statsOrContext,
    ...(authorExtra || {}),
  };

  const unlocked: CommunityBadge[] = [];

  // 计算用户所属阶梯信息
  const statsForLevel: UserStats = {
    hasAccount: Boolean(merged.email || (merged.role && merged.role !== 'visitor')),
    hasReadAny: (merged.readingTime || merged.readingMinutes || 0) > 0,
    readingMinutes: merged.readingTime ?? merged.readingMinutes ?? 0,
    commentCount: merged.commentCount || 0,
    reactionsReceived: merged.reactionsReceived || 0,
    activeDays: merged.activeDays || 1,
    activeDates: [],
    firstSeenAt: '',
    isWebmaster: Boolean(merged.isWebmaster),
    customLevel: merged.customLevel,
  };
  const levelInfo = computeUserLevel(statsForLevel, merged.role, merged.email);

  // 1. 【等级主称号】（互斥取最高级，权重 100）
  if (levelInfo.isWebmaster || merged.isWebmaster) {
    unlocked.push({
      id: 'tier_webmaster',
      name: '站长',
      label: '站长',
      icon: '👑',
      category: 'tier',
      priority: 100,
      description: '博客站长与系统主创，拥有最高全站管理权限 (TL.100)',
      isUnlocked: true,
    });
  } else if (levelInfo.title === '核心成员' || merged.role === 'core_member') {
    unlocked.push({
      id: 'tier_core_member',
      name: '核心成员',
      label: '核心成员',
      icon: '⭐',
      category: 'tier',
      priority: 100,
      description: '社区核心成员与架构协作者',
      isUnlocked: true,
    });
  } else if (levelInfo.title === '墨海宗师') {
    unlocked.push({
      id: 'tier_ink_master',
      name: '墨海宗师',
      label: '墨海宗师',
      icon: '📜',
      category: 'tier',
      priority: 100,
      description: '登峰造极的读者宗师，博学笃行 (TL.90 上限)',
      isUnlocked: true,
    });
  } else if (levelInfo.title === '年度用户') {
    unlocked.push({
      id: 'tier_annual_member',
      name: '年度用户',
      label: '年度用户',
      icon: '🏅',
      category: 'tier',
      priority: 100,
      description: '与博客结缘满一年的尊贵常客读者',
      isUnlocked: true,
    });
  } else if (levelInfo.title === '先驱') {
    unlocked.push({
      id: 'tier_pioneer',
      name: '先驱',
      label: '先驱',
      icon: '⭐',
      category: 'tier',
      priority: 100,
      description: '深度见证博客成长的社区先驱读者',
      isUnlocked: true,
    });
  } else if (levelInfo.title === '常青极客') {
    unlocked.push({
      id: 'tier_evergreen_geek',
      name: '常青极客',
      label: '常青极客',
      icon: '🌲',
      category: 'tier',
      priority: 100,
      description: '高频沉浸与深度探讨的常青读者',
      isUnlocked: true,
    });
  } else if (levelInfo.title === '活跃用户') {
    unlocked.push({
      id: 'tier_active_user',
      name: '活跃用户',
      label: '活跃用户',
      icon: '🎖️',
      category: 'tier',
      priority: 100,
      description: '高频互动并深研博客内容的活跃读者',
      isUnlocked: true,
    });
  } else if (levelInfo.title === '思辨学者') {
    unlocked.push({
      id: 'tier_reflective_scholar',
      name: '思辨学者',
      label: '思辨学者',
      icon: '💡',
      category: 'tier',
      priority: 100,
      description: '见解深刻且频频引发读者共鸣的学术读者',
      isUnlocked: true,
    });
  } else if (levelInfo.title === '贡献者') {
    unlocked.push({
      id: 'tier_contributor',
      name: '贡献者',
      label: '贡献者',
      icon: '🏅',
      category: 'tier',
      priority: 100,
      description: '积极留下高质量见解的社区贡献者',
      isUnlocked: true,
    });
  } else if (levelInfo.title === '基本用户') {
    unlocked.push({
      id: 'tier_basic_user',
      name: '基本用户',
      label: '基本用户',
      icon: '🥉',
      category: 'tier',
      priority: 100,
      description: '在博客留下过真实评论足迹的基础读者',
      isUnlocked: true,
    });
  } else if (levelInfo.title === '初始用户') {
    unlocked.push({
      id: 'tier_initial_user',
      name: '初始用户',
      label: '初始用户',
      icon: '📘',
      category: 'tier',
      priority: 100,
      description: '开启深度阅读探索的初始读者',
      isUnlocked: true,
    });
  } else {
    unlocked.push({
      id: 'tier_newcomer',
      name: '新兴用户',
      label: '新兴用户',
      icon: '🐣',
      category: 'tier',
      priority: 100,
      description: '初次邂逅博客的新兴读者',
      isUnlocked: true,
    });
  }

  // 2. 【阅读沉淀成就】（权重 40-75）
  const readingTime = merged.readingTime ?? merged.readingMinutes ?? 0;
  if (readingTime >= 3600) {
    unlocked.push({
      id: 'read_3600m',
      name: '墨海领航',
      label: '墨海领航',
      icon: '🧭',
      category: 'read',
      priority: 75,
      description: '累计沉浸博文阅读突破 60 小时，博大精深',
      isUnlocked: true,
    });
  }
  if (readingTime >= 1800) {
    unlocked.push({
      id: 'read_1800m',
      name: '学贯中西',
      label: '学贯中西',
      icon: '📜',
      category: 'read',
      priority: 72,
      description: '累计潜心研读文章突破 30 小时',
      isUnlocked: true,
    });
  }
  if (readingTime >= 600) {
    unlocked.push({
      id: 'read_600m',
      name: '博览群书',
      label: '博览群书',
      icon: '📚',
      category: 'read',
      priority: 70,
      description: '累计沉浸阅读博客超过 10 小时',
      isUnlocked: true,
    });
  }
  if (readingTime >= 120) {
    unlocked.push({
      id: 'read_120m',
      name: '慢读时光',
      label: '慢读时光',
      icon: '☕',
      category: 'read',
      priority: 55,
      description: '累计享受深度慢读时光超过 2 小时',
      isUnlocked: true,
    });
  }
  if (readingTime >= 15) {
    unlocked.push({
      id: 'read_15m',
      name: '通读全文',
      label: '通读全文',
      icon: '📖',
      category: 'read',
      priority: 40,
      description: '累计深度阅读博文时长达到 15 分钟',
      isUnlocked: true,
    });
  }

  // 3. 【互动交流成就】（权重 30-60）
  if (merged.hasEditedComment) {
    unlocked.push({
      id: 'comment_edited',
      name: '初露锋芒',
      label: '初露锋芒',
      icon: '✍️',
      category: 'comment',
      priority: 30,
      description: '精益求精，就地编辑完善过自己的发言',
      isUnlocked: true,
    });
  }
  if (merged.hasEmojiReaction) {
    unlocked.push({
      id: 'comment_emoji',
      name: '丰富表情',
      label: '丰富表情',
      icon: '😀',
      category: 'comment',
      priority: 35,
      description: '使用生动丰富的表情符号参与互动交流',
      isUnlocked: true,
    });
  }
  const cCount = merged.commentCount ?? 0;
  if (cCount >= 50) {
    unlocked.push({
      id: 'comment_50',
      name: '纵论古今',
      label: '纵论古今',
      icon: '🗣️',
      category: 'comment',
      priority: 65,
      description: '累计发表 50 条及以上富有见地的思辨言论',
      isUnlocked: true,
    });
  }
  if (cCount >= 20) {
    unlocked.push({
      id: 'comment_20',
      name: '真知灼见',
      label: '真知灼见',
      icon: '💡',
      category: 'comment',
      priority: 58,
      description: '累计发表 20 条及以上优质独立见解',
      isUnlocked: true,
    });
  }
  if (cCount >= 5) {
    unlocked.push({
      id: 'comment_5',
      name: '言之有物',
      label: '言之有物',
      icon: '💬',
      category: 'comment',
      priority: 50,
      description: '累计发表 5 条及以上优质独立见解',
      isUnlocked: true,
    });
  }
  if (merged.hasMentioned) {
    unlocked.push({
      id: 'comment_mentioned',
      name: '回音激荡',
      label: '回音激荡',
      icon: '🔔',
      category: 'comment',
      priority: 45,
      description: '在评论互动中主动提及或呼应他人',
      isUnlocked: true,
    });
  }

  // 4. 【赞赏喝彩成就】（权重 40-85）
  const reactionsGiven = merged.reactionsGiven ?? 0;
  const reactionsReceived = merged.reactionsReceived ?? 0;
  if (reactionsReceived >= 100) {
    unlocked.push({
      id: 'reaction_rec_100',
      name: '众望所归',
      label: '众望所归',
      icon: '🌟',
      category: 'reaction',
      priority: 85,
      description: '见解深邃，累计收获超过 100 次读者热烈喝彩',
      isUnlocked: true,
    });
  }
  if (reactionsReceived >= 50) {
    unlocked.push({
      id: 'reaction_rec_50',
      name: '深得人心',
      label: '深得人心',
      icon: '💎',
      category: 'reaction',
      priority: 80,
      description: '累计获得超过 50 次读者共鸣喝彩与赞赏',
      isUnlocked: true,
    });
  }
  if (reactionsReceived >= 20) {
    unlocked.push({
      id: 'reaction_rec_20',
      name: '引发共鸣',
      label: '引发共鸣',
      icon: '🔥',
      category: 'reaction',
      priority: 65,
      description: '发表的见解累计收获 20 次以上喝彩互动',
      isUnlocked: true,
    });
  }
  if (reactionsGiven >= 30) {
    unlocked.push({
      id: 'reaction_given_30',
      name: '乐善好施',
      label: '乐善好施',
      icon: '💖',
      category: 'reaction',
      priority: 55,
      description: '由衷赞赏他人，送出超过 30 次喝彩互动',
      isUnlocked: true,
    });
  }
  if (reactionsGiven >= 10) {
    unlocked.push({
      id: 'reaction_given_10',
      name: '不吝赞美',
      label: '不吝赞美',
      icon: '❤️',
      category: 'reaction',
      priority: 45,
      description: '慷慨为他人的深刻思考送出 10 次以上喝彩',
      isUnlocked: true,
    });
  }
  if (reactionsReceived >= 1) {
    unlocked.push({
      id: 'reaction_rec_1',
      name: '初见回响',
      label: '初见回响',
      icon: '✨',
      category: 'reaction',
      priority: 40,
      description: '个人发言收获了读者的第一枚热烈喝彩',
      isUnlocked: true,
    });
  }

  // 5. 【常客与资料成就】（权重 30-90）
  const bio = merged.bio || '';
  const avatarUrl = merged.avatarUrl || '';
  const activeDays = merged.activeDays ?? 1;
  const daysSinceRegistered = merged.daysSinceRegistered ?? 0;
  const hasEmail = Boolean(merged.epomail || merged.email);

  if (activeDays >= 200 || daysSinceRegistered >= 365) {
    unlocked.push({
      id: 'activity_evergreen',
      name: '坚韧长青',
      label: '坚韧长青',
      icon: '🌲',
      category: 'activity',
      priority: 88,
      description: '持之以恒，在博客积累了长青般的持久印记',
      isUnlocked: true,
    });
  }
  if (daysSinceRegistered >= 365) {
    unlocked.push({
      id: 'activity_365d',
      name: '同舟一载',
      label: '同舟一载',
      icon: '🎂',
      category: 'activity',
      priority: 85,
      description: '与本博客相识相伴同行超过 1 年时光',
      isUnlocked: true,
    });
  }
  if (activeDays >= 100) {
    unlocked.push({
      id: 'activity_100d',
      name: '百日墨客',
      label: '百日墨客',
      icon: '🏔️',
      category: 'activity',
      priority: 75,
      description: '累计在博客活跃长达 100 天的深厚笔友',
      isUnlocked: true,
    });
  }
  if (activeDays >= 30) {
    unlocked.push({
      id: 'activity_30d',
      name: '见缝插针',
      label: '见缝插针',
      icon: '⚡',
      category: 'activity',
      priority: 60,
      description: '保持高频活跃，累计活跃访问达到 30 天',
      isUnlocked: true,
    });
  }
  if (activeDays >= 10) {
    unlocked.push({
      id: 'activity_10d',
      name: '常客印记',
      label: '常客印记',
      icon: '🏃',
      category: 'activity',
      priority: 50,
      description: '累计在博客活跃探索 10 天以上',
      isUnlocked: true,
    });
  }
  if (hasEmail) {
    unlocked.push({
      id: 'activity_email',
      name: '信件连结',
      label: '信件连结',
      icon: '✉️',
      category: 'activity',
      priority: 40,
      description: '绑定了专属邮箱，开启思想交流连结通道',
      isUnlocked: true,
    });
  }
  if (bio.trim().length >= 10 && avatarUrl) {
    unlocked.push({
      id: 'activity_bio_avatar',
      name: '自传作者',
      label: '自传作者',
      icon: '🏷️',
      category: 'activity',
      priority: 35,
      description: '完善了个性签名介绍并配置了专属头像',
      isUnlocked: true,
    });
  }

  // 严格按照 priority 从高到低降序排序
  unlocked.sort((a, b) => b.priority - a.priority);

  return unlocked;
}

/**
 * 兼容层：获取前 4 个官方徽章
 */
export function computeOfficialBadges(
  statsOrContext: UserStats | UserBadgeContext,
  author?: Partial<UserBadgeContext>
): OfficialBadge[] {
  const unlocked = evaluateUserBadges(statsOrContext, author);
  return unlocked.slice(0, 4).map((b) => ({
    icon: b.icon,
    label: b.name,
    name: b.name,
    isSpecial: b.category === 'tier',
    description: b.description,
    category: b.category,
    priority: b.priority,
  }));
}

export const EQUIPPED_BADGES_STORAGE_KEY = 'shijianus-equipped-badges';

/**
 * Reads user custom equipped badge IDs from localStorage (max 4).
 */
export function readEquippedBadges(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(EQUIPPED_BADGES_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.slice(0, 4);
    }
    return [];
  } catch {
    return [];
  }
}

/**
 * Writes user custom equipped badge IDs to localStorage (max 4) and dispatches custom event.
 */
export function writeEquippedBadges(badgeIds: string[]): void {
  if (typeof window === 'undefined') return;
  try {
    const cleaned = Array.from(new Set(badgeIds)).slice(0, 4);
    window.localStorage.setItem(EQUIPPED_BADGES_STORAGE_KEY, JSON.stringify(cleaned));
    window.dispatchEvent(new CustomEvent('shijianus:equipped-badges-change', { detail: cleaned }));
  } catch {}
}

/**
 * Resolves which badges to display in the author profile popover (max 4).
 * Strictly synchronized with user's equipped badges selection.
 * If user has not equipped any badge (ids is empty), returns an empty array.
 */
export function getEquippedBadges(
  unlockedBadges: CommunityBadge[],
  equippedIds?: string[]
): CommunityBadge[] {
  if (!unlockedBadges || unlockedBadges.length === 0) return [];
  const ids = equippedIds !== undefined ? equippedIds : readEquippedBadges();
  if (ids && ids.length > 0) {
    const map = new Map(unlockedBadges.map((b) => [b.id, b]));
    const equipped = ids.map((id) => map.get(id)).filter(Boolean) as CommunityBadge[];
    return equipped.slice(0, 4);
  }
  return [];
}

export interface LevelRequirementItem {
  id: string;
  label: string;
  icon: string;
  unit: string;
  current: number;
  target: number;
  progressPercent: number; // 0 - 100, strictly capped
  colorTier: 'red' | 'yellow' | 'green';
  isMet: boolean;
}

export interface NextLevelRequirementPlan {
  currentLevel: number; // 0, 1, 2, 3, 4
  currentTitle: string;
  nextTitle: string;
  isMaxAutoLevel: boolean; // True when reaching LV.3 (automatic promotion cap) or LV.4
  isWebmaster: boolean;
  isExempt?: boolean;
  totalRequirements: number;
  metRequirements: number;
  items: LevelRequirementItem[];
}

export function getProgressColorTier(percent: number): 'red' | 'yellow' | 'green' {
  if (percent < 40) return 'red';
  if (percent < 80) return 'yellow';
  return 'green';
}

/**
 * Computes exact comparison data for next level requirements.
 * Rules:
 * - Direct comparison between real current stats and next level targets.
 * - Even if current exceeds target, progress bar strictly caps at 100%.
 * - LV.3「墨海宗师」is the automatic promotion ceiling.
 * - Webmaster (站长) is the unique owner who bypasses level restrictions with TL 100.
 * - Progress bar colors: Red (<40%), Yellow (40%-79%), Green (>=80%).
 */
export function getNextLevelRequirements(
  stats: UserStats,
  accountRole?: string,
  email?: string
): NextLevelRequirementPlan {
  const currentInfo = computeUserLevel(stats, accountRole, email);

  const createItem = (
    id: string,
    label: string,
    icon: string,
    unit: string,
    current: number,
    target: number,
    forcedIsMet?: boolean
  ): LevelRequirementItem => {
    const progressPercent = target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 100;
    return {
      id,
      label,
      icon,
      unit,
      current,
      target,
      progressPercent,
      colorTier: getProgressColorTier(progressPercent),
      isMet: forcedIsMet !== undefined ? forcedIsMet : current >= target,
    };
  };

  // 1. 站长
  if (currentInfo.isWebmaster) {
    const items: LevelRequirementItem[] = [
      createItem('activeDays', '活跃天数', '📅', '天', stats.activeDays, 60),
      createItem('readingMinutes', '阅读时长', '📖', 'min', Math.round(stats.readingMinutes), 720),
      createItem('commentCount', '发表讨论', '💬', '次', stats.commentCount, 100),
      createItem('reactionsReceived', '互动获赞', '❤️', '个', stats.reactionsReceived, 50),
    ];
    return {
      currentLevel: 4,
      currentTitle: '站长',
      nextTitle: '站长专属全站特权 (TL.100 全穿透)',
      isMaxAutoLevel: true,
      isWebmaster: true,
      isExempt: true,
      totalRequirements: items.length,
      metRequirements: items.filter((i) => i.isMet).length,
      items,
    };
  }

  // 2. 核心成员 / 管理员
  if (currentInfo.title === '核心成员') {
    const items: LevelRequirementItem[] = [
      createItem('activeDays', '活跃天数', '📅', '天', stats.activeDays, 60),
      createItem('readingMinutes', '阅读时长', '📖', 'min', Math.round(stats.readingMinutes), 720),
      createItem('commentCount', '发表讨论', '💬', '次', stats.commentCount, 100),
      createItem('reactionsReceived', '互动获赞', '❤️', '个', stats.reactionsReceived, 50),
    ];
    return {
      currentLevel: 4,
      currentTitle: '核心成员',
      nextTitle: '社区管理特权 (TL.91~99)',
      isMaxAutoLevel: true,
      isWebmaster: false,
      isExempt: true,
      totalRequirements: items.length,
      metRequirements: items.filter((i) => i.isMet).length,
      items,
    };
  }

  // 3. LV.3 墨海宗师 - 读者晋升巅峰
  if (currentInfo.title === '墨海宗师') {
    const items: LevelRequirementItem[] = [
      createItem('activeDays', '活跃天数', '📅', '天', stats.activeDays, 300),
      createItem('readingMinutes', '阅读时长', '📖', 'min', Math.round(stats.readingMinutes), 2160),
      createItem('commentCount', '发表讨论', '💬', '次', stats.commentCount, 150),
      createItem('reactionsReceived', '互动获赞', '❤️', '个', stats.reactionsReceived, 100),
    ];
    return {
      currentLevel: 3,
      currentTitle: '墨海宗师',
      nextTitle: '已达读者自动晋升巅峰 (LV.3 · 墨海宗师)',
      isMaxAutoLevel: true,
      isWebmaster: false,
      totalRequirements: items.length,
      metRequirements: items.filter((i) => i.isMet).length,
      items,
    };
  }

  // 4. LV.3 年度用户 -> 墨海宗师 (activeDays >= 300 && readingMinutes >= 2160 && reactionsReceived >= 100)
  if (currentInfo.title === '年度用户') {
    const items: LevelRequirementItem[] = [
      createItem('activeDays', '活跃天数', '📅', '天', stats.activeDays, 300),
      createItem('readingMinutes', '阅读时长', '📖', 'min', Math.round(stats.readingMinutes), 2160),
      createItem('reactionsReceived', '互动获赞', '❤️', '个', stats.reactionsReceived, 100),
    ];
    return {
      currentLevel: 3,
      currentTitle: '年度用户',
      nextTitle: '墨海宗师 (LV.3)',
      isMaxAutoLevel: false,
      isWebmaster: false,
      totalRequirements: items.length,
      metRequirements: items.filter((i) => i.isMet).length,
      items,
    };
  }

  // 5. LV.3 先驱 -> 年度用户 (activeDays >= 180 && readingMinutes >= 1440 && commentCount >= 150)
  if (currentInfo.title === '先驱') {
    const items: LevelRequirementItem[] = [
      createItem('activeDays', '活跃天数', '📅', '天', stats.activeDays, 180),
      createItem('readingMinutes', '阅读时长', '📖', 'min', Math.round(stats.readingMinutes), 1440),
      createItem('commentCount', '发表讨论', '💬', '次', stats.commentCount, 150),
    ];
    return {
      currentLevel: 3,
      currentTitle: '先驱',
      nextTitle: '年度用户 (LV.3)',
      isMaxAutoLevel: false,
      isWebmaster: false,
      totalRequirements: items.length,
      metRequirements: items.filter((i) => i.isMet).length,
      items,
    };
  }

  // 6. LV.2 常青极客 -> 先驱 (activeDays >= 90 && readingMinutes >= 720 && commentCount >= 100 && reactionsReceived >= 60)
  if (currentInfo.title === '常青极客') {
    const items: LevelRequirementItem[] = [
      createItem('activeDays', '活跃天数', '📅', '天', stats.activeDays, 90),
      createItem('readingMinutes', '阅读时长', '📖', 'min', Math.round(stats.readingMinutes), 720),
      createItem('commentCount', '发表讨论', '💬', '次', stats.commentCount, 100),
      createItem('reactionsReceived', '互动获赞', '❤️', '个', stats.reactionsReceived, 60),
    ];
    return {
      currentLevel: 2,
      currentTitle: '常青极客',
      nextTitle: '先驱 (LV.3)',
      isMaxAutoLevel: false,
      isWebmaster: false,
      totalRequirements: items.length,
      metRequirements: items.filter((i) => i.isMet).length,
      items,
    };
  }

  // 7. LV.2 活跃用户 -> 常青极客 (activeDays >= 45 && readingMinutes >= 480 && commentCount >= 60 && reactionsReceived >= 40)
  if (currentInfo.title === '活跃用户') {
    const items: LevelRequirementItem[] = [
      createItem('activeDays', '活跃天数', '📅', '天', stats.activeDays, 45),
      createItem('readingMinutes', '阅读时长', '📖', 'min', Math.round(stats.readingMinutes), 480),
      createItem('commentCount', '发表讨论', '💬', '次', stats.commentCount, 60),
      createItem('reactionsReceived', '互动获赞', '❤️', '个', stats.reactionsReceived, 40),
    ];
    return {
      currentLevel: 2,
      currentTitle: '活跃用户',
      nextTitle: '常青极客 (LV.2)',
      isMaxAutoLevel: false,
      isWebmaster: false,
      totalRequirements: items.length,
      metRequirements: items.filter((i) => i.isMet).length,
      items,
    };
  }

  // 8. LV.1 思辨学者 -> 活跃用户 (activeDays >= 20 && readingMinutes >= 300 && commentCount >= 30 && reactionsReceived >= 20)
  if (currentInfo.title === '思辨学者') {
    const items: LevelRequirementItem[] = [
      createItem('activeDays', '活跃天数', '📅', '天', stats.activeDays, 20),
      createItem('readingMinutes', '阅读时长', '📖', 'min', Math.round(stats.readingMinutes), 300),
      createItem('commentCount', '发表讨论', '💬', '次', stats.commentCount, 30),
      createItem('reactionsReceived', '互动获赞', '❤️', '个', stats.reactionsReceived, 20),
    ];
    return {
      currentLevel: 1,
      currentTitle: '思辨学者',
      nextTitle: '活跃用户 (LV.2)',
      isMaxAutoLevel: false,
      isWebmaster: false,
      totalRequirements: items.length,
      metRequirements: items.filter((i) => i.isMet).length,
      items,
    };
  }

  // 9. LV.1 贡献者 -> 思辨学者 (readingMinutes >= 120 && commentCount >= 20 && reactionsReceived >= 10)
  if (currentInfo.title === '贡献者') {
    const items: LevelRequirementItem[] = [
      createItem('readingMinutes', '阅读时长', '📖', 'min', Math.round(stats.readingMinutes), 120),
      createItem('commentCount', '发表讨论', '💬', '次', stats.commentCount, 20),
      createItem('reactionsReceived', '互动获赞', '❤️', '个', stats.reactionsReceived, 10),
    ];
    return {
      currentLevel: 1,
      currentTitle: '贡献者',
      nextTitle: '思辨学者 (LV.1)',
      isMaxAutoLevel: false,
      isWebmaster: false,
      totalRequirements: items.length,
      metRequirements: items.filter((i) => i.isMet).length,
      items,
    };
  }

  // 10. LV.1 基本用户 -> 贡献者 (readingMinutes >= 30 && commentCount >= 10)
  if (currentInfo.title === '基本用户') {
    const items: LevelRequirementItem[] = [
      createItem('readingMinutes', '阅读时长', '📖', 'min', Math.round(stats.readingMinutes), 30),
      createItem('commentCount', '发表讨论', '💬', '次', stats.commentCount, 10),
    ];
    return {
      currentLevel: 1,
      currentTitle: '基本用户',
      nextTitle: '贡献者 (LV.1)',
      isMaxAutoLevel: false,
      isWebmaster: false,
      totalRequirements: items.length,
      metRequirements: items.filter((i) => i.isMet).length,
      items,
    };
  }

  // 11. LV.0 初始用户 -> 基本用户 (commentCount >= 1)
  if (currentInfo.title === '初始用户') {
    const items: LevelRequirementItem[] = [
      createItem('commentCount', '发表讨论', '💬', '次', stats.commentCount, 1),
    ];
    return {
      currentLevel: 0,
      currentTitle: '初始用户',
      nextTitle: '基本用户 (LV.1)',
      isMaxAutoLevel: false,
      isWebmaster: false,
      totalRequirements: items.length,
      metRequirements: items.filter((i) => i.isMet).length,
      items,
    };
  }

  // 12. LV.0 新兴用户 -> 初始用户 (readingMinutes >= 1)
  const items: LevelRequirementItem[] = [
    createItem('readingMinutes', '阅读探索', '📖', 'min', Math.round(stats.readingMinutes), 1),
  ];
  return {
    currentLevel: 0,
    currentTitle: '新兴用户',
    nextTitle: '初始用户 (LV.0)',
    isMaxAutoLevel: false,
    isWebmaster: false,
    totalRequirements: items.length,
    metRequirements: items.filter((i) => i.isMet).length,
    items,
  };
}

