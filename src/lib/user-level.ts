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
  | '年度用户'
  | '先驱'
  | '活跃用户'
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
  trustLevel: number;
  badge: string; // e.g. "LV.1 · 贡献者"
  isWebmaster: boolean;
  isSquareAvatar: boolean;
  nextLevelTitle?: string;
  nextRequirementHint?: string;
  progressPercent: number;
  stats: UserStats;
}

export const USER_STATS_STORAGE_KEY = 'shijianus-user-activity-stats';

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
  活跃用户: {
    'zh-CN': '活跃用户',
    'zh-TW': '活躍使用者',
    en: 'Active User',
    fr: 'Utilisateur actif',
    es: 'Usuario activo',
    de: 'Aktiver Nutzer',
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

/**
 * Computes level, trust level, badge, and hints according to the strict leveling ladder.
 */
export function computeUserLevel(stats: UserStats, accountRole?: string, email?: string): UserLevelInfo {
  const isOwner = stats.isWebmaster || accountRole === 'admin' || (email && email.toLowerCase() === 'admin@epomail.bond');

  // 1. LV.4 站长 (Webmaster) - All-site ONLY square avatar
  if (isOwner) {
    return {
      level: 4,
      levelCode: 'lv4',
      title: '站长',
      trustLevel: 99,
      badge: 'LV.4 · 站长',
      isWebmaster: true,
      isSquareAvatar: true,
      progressPercent: 100,
      nextRequirementHint: '全站权威所有者与最高架构管理者',
      stats,
    };
  }

  // 2. LV.4 核心成员 (Core Member / Promoted by Webmaster) - Circular avatar
  if (stats.customLevel === 4) {
    return {
      level: 4,
      levelCode: 'lv4',
      title: '核心成员',
      trustLevel: 25,
      badge: 'LV.4 · 核心成员',
      isWebmaster: false,
      isSquareAvatar: false,
      progressPercent: 100,
      nextRequirementHint: '站长特邀理事与最高荣誉成员',
      stats,
    };
  }

  // 3. LV.3 年度用户: 活跃超过 365 天 (activeDays >= 365)
  if (stats.activeDays >= 365) {
    return {
      level: 3,
      levelCode: 'lv3',
      title: '年度用户',
      trustLevel: 20,
      badge: 'LV.3 · 年度用户',
      isWebmaster: false,
      isSquareAvatar: false,
      progressPercent: 100,
      nextRequirementHint: '已达成常青学者顶级荣誉',
      stats,
    };
  }

  // 4. LV.3 先驱: 活跃 > 60 天, 阅读 > 12h (720m), 评论 >= 100 (含 boost), 收到 50+ 赞/Emoji 互动
  const pioneerMet =
    stats.activeDays >= 60 &&
    stats.readingMinutes >= 720 &&
    stats.commentCount >= 100 &&
    stats.reactionsReceived >= 50;
  if (pioneerMet) {
    return {
      level: 3,
      levelCode: 'lv3',
      title: '先驱',
      trustLevel: 15,
      badge: 'LV.3 · 先驱',
      isWebmaster: false,
      isSquareAvatar: false,
      nextLevelTitle: '年度用户',
      nextRequirementHint: `距 LV.3「年度用户」还需活跃 ${Math.max(0, 365 - stats.activeDays)} 天`,
      progressPercent: Math.min(99, Math.round((stats.activeDays / 365) * 100)),
      stats,
    };
  }

  // 5. LV.2 活跃用户: 活跃 > 20 天, 阅读 > 300min, 评论 >= 30 (含 boost), 收到 30+ 赞
  const activeUserMet =
    stats.activeDays >= 20 &&
    stats.readingMinutes >= 300 &&
    stats.commentCount >= 30 &&
    stats.reactionsReceived >= 30;
  if (activeUserMet) {
    const pDays = Math.min(1, stats.activeDays / 60);
    const pRead = Math.min(1, stats.readingMinutes / 720);
    const pCom = Math.min(1, stats.commentCount / 100);
    const pRx = Math.min(1, stats.reactionsReceived / 50);
    const progress = Math.round(((pDays + pRead + pCom + pRx) / 4) * 100);

    return {
      level: 2,
      levelCode: 'lv2',
      title: '活跃用户',
      trustLevel: 10,
      badge: 'LV.2 · 活跃用户',
      isWebmaster: false,
      isSquareAvatar: false,
      nextLevelTitle: '先驱',
      nextRequirementHint: `晋升「先驱」还需: 活跃 ${Math.max(0, 60 - stats.activeDays)} 天 | 阅读 ${Math.max(0, 720 - stats.readingMinutes)}m | 评论 ${Math.max(0, 100 - stats.commentCount)}条 | 获赞 ${Math.max(0, 50 - stats.reactionsReceived)}个`,
      progressPercent: Math.min(99, progress),
      stats,
    };
  }

  // 6. LV.1 贡献者: 阅读 > 30min, 评论 >= 10 (含 boost)
  const contributorMet = stats.readingMinutes >= 30 && stats.commentCount >= 10;
  if (contributorMet) {
    const pDays = Math.min(1, stats.activeDays / 20);
    const pRead = Math.min(1, stats.readingMinutes / 300);
    const pCom = Math.min(1, stats.commentCount / 30);
    const pRx = Math.min(1, stats.reactionsReceived / 30);
    const progress = Math.round(((pDays + pRead + pCom + pRx) / 4) * 100);

    return {
      level: 1,
      levelCode: 'lv1',
      title: '贡献者',
      trustLevel: 7,
      badge: 'LV.1 · 贡献者',
      isWebmaster: false,
      isSquareAvatar: false,
      nextLevelTitle: '活跃用户',
      nextRequirementHint: `晋升「活跃用户」还需: 活跃 ${Math.max(0, 20 - stats.activeDays)} 天 | 阅读 ${Math.max(0, 300 - stats.readingMinutes)}m | 评论 ${Math.max(0, 30 - stats.commentCount)}条 | 获赞 ${Math.max(0, 30 - stats.reactionsReceived)}个`,
      progressPercent: Math.min(99, progress),
      stats,
    };
  }

  // 7. LV.1 基本用户: 首次发表评论 (commentCount >= 1)
  if (stats.commentCount >= 1) {
    const pRead = Math.min(1, stats.readingMinutes / 30);
    const pCom = Math.min(1, stats.commentCount / 10);
    const progress = Math.round(((pRead + pCom) / 2) * 100);

    return {
      level: 1,
      levelCode: 'lv1',
      title: '基本用户',
      trustLevel: 5,
      badge: 'LV.1 · 基本用户',
      isWebmaster: false,
      isSquareAvatar: false,
      nextLevelTitle: '贡献者',
      nextRequirementHint: `晋升「贡献者」还需: 阅读 ${Math.max(0, 30 - stats.readingMinutes)}m | 评论 ${Math.max(0, 10 - stats.commentCount)}条`,
      progressPercent: Math.min(99, progress),
      stats,
    };
  }

  // 8. LV.0 初始用户: 首次进行阅读 (hasReadAny || readingMinutes > 0)
  if (stats.hasReadAny || stats.readingMinutes > 0) {
    return {
      level: 0,
      levelCode: 'lv0',
      title: '初始用户',
      trustLevel: 2,
      badge: 'LV.0 · 初始用户',
      isWebmaster: false,
      isSquareAvatar: false,
      nextLevelTitle: '基本用户',
      nextRequirementHint: '在博文底部发表首次评论即可晋升「基本用户 (LV.1)」！',
      progressPercent: 50,
      stats,
    };
  }

  // 9. LV.0 新兴用户: 初始情况 / 新建账号
  return {
    level: 0,
    levelCode: 'lv0',
    title: '新兴用户',
    trustLevel: 0,
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
