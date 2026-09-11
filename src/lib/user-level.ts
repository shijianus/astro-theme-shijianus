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

/**
 * Official 8 title ladder names.
 */
export const OFFICIAL_LADDER_TITLES: readonly UserLevelTitle[] = [
  '站长',
  '核心成员',
  '年度用户',
  '先驱',
  '活跃用户',
  '贡献者',
  '基本用户',
  '初始用户',
  '新兴用户',
] as const;

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
      description: '博客站长与系统主创，拥有最高全站管理权限',
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
  } else if (levelInfo.title === '年度用户') {
    unlocked.push({
      id: 'tier_annual_member',
      name: '年度用户',
      label: '年度用户',
      icon: '🏅',
      category: 'tier',
      priority: 100,
      description: '与博客结缘满一年的尊贵读者',
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

  // 2. 【阅读沉淀成就】（权重 40-70）
  const readingTime = merged.readingTime ?? merged.readingMinutes ?? 0;
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
  if ((merged.commentCount ?? 0) >= 5) {
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

  // 4. 【赞赏喝彩成就】（权重 40-80）
  const reactionsGiven = merged.reactionsGiven ?? 0;
  const reactionsReceived = merged.reactionsReceived ?? 0;
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

  // 5. 【常客与资料成就】（权重 30-80）
  const bio = merged.bio || '';
  const avatarUrl = merged.avatarUrl || '';
  const activeDays = merged.activeDays ?? 1;
  const daysSinceRegistered = merged.daysSinceRegistered ?? 0;
  const hasEmail = Boolean(merged.epomail || merged.email);

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
 * If user has customized equipped badges, returns those in selected order.
 * Otherwise falls back to the top 4 unlocked badges by default priority.
 */
export function getEquippedBadges(
  unlockedBadges: CommunityBadge[],
  equippedIds?: string[]
): CommunityBadge[] {
  if (!unlockedBadges || unlockedBadges.length === 0) return [];
  const ids = equippedIds && equippedIds.length > 0 ? equippedIds : readEquippedBadges();
  if (ids && ids.length > 0) {
    const map = new Map(unlockedBadges.map((b) => [b.id, b]));
    const equipped = ids.map((id) => map.get(id)).filter(Boolean) as CommunityBadge[];
    if (equipped.length > 0) {
      return equipped.slice(0, 4);
    }
  }
  return unlockedBadges.slice(0, 4);
}

export interface LevelRequirementItem {
  id: string;
  label: string;
  icon: string;
  unit: string;
  current: number;
  target: number;
  progressPercent: number; // 0 - 100, strictly capped
  isMet: boolean;
}

export interface NextLevelRequirementPlan {
  currentLevel: number; // 0, 1, 2, 3, 4
  currentTitle: string;
  nextTitle: string;
  isMaxAutoLevel: boolean; // True when reaching LV.3 (automatic promotion cap) or LV.4
  isWebmaster: boolean;
  totalRequirements: number;
  metRequirements: number;
  items: LevelRequirementItem[];
}

/**
 * Computes exact comparison data for next level requirements.
 * Rules:
 * - Direct comparison between real current stats and next level targets.
 * - Even if current exceeds target, progress bar strictly caps at 100% (即使超出了，也是直接显示满了).
 * - Satisfied criteria stack downwards (满足可以继续向下叠加).
 * - LV.3 is the automatic promotion ceiling (到达LV.3是自动升级的上限).
 */
export function getNextLevelRequirements(
  stats: UserStats,
  accountRole?: string,
  email?: string
): NextLevelRequirementPlan {
  const isOwner =
    stats.isWebmaster ||
    accountRole === 'admin' ||
    (email && email.toLowerCase() === 'admin@epomail.bond');

  if (isOwner) {
    return {
      currentLevel: 4,
      currentTitle: '站长',
      nextTitle: '站长专属顶级权限',
      isMaxAutoLevel: true,
      isWebmaster: true,
      totalRequirements: 4,
      metRequirements: 4,
      items: [
        {
          id: 'activeDays',
          label: '活跃天数',
          icon: '📅',
          unit: '天',
          current: stats.activeDays,
          target: stats.activeDays,
          progressPercent: 100,
          isMet: true,
        },
        {
          id: 'readingMinutes',
          label: '阅读时长',
          icon: '📖',
          unit: 'min',
          current: Math.round(stats.readingMinutes),
          target: Math.round(stats.readingMinutes),
          progressPercent: 100,
          isMet: true,
        },
        {
          id: 'commentCount',
          label: '发表讨论',
          icon: '💬',
          unit: '次',
          current: stats.commentCount,
          target: stats.commentCount,
          progressPercent: 100,
          isMet: true,
        },
        {
          id: 'reactionsReceived',
          label: '互动获赞',
          icon: '❤️',
          unit: '个',
          current: stats.reactionsReceived,
          target: stats.reactionsReceived,
          progressPercent: 100,
          isMet: true,
        },
      ],
    };
  }

  if (stats.customLevel === 4) {
    return {
      currentLevel: 4,
      currentTitle: '核心成员',
      nextTitle: '站长特邀特权',
      isMaxAutoLevel: true,
      isWebmaster: false,
      totalRequirements: 4,
      metRequirements: 4,
      items: [
        {
          id: 'activeDays',
          label: '活跃天数',
          icon: '📅',
          unit: '天',
          current: stats.activeDays,
          target: stats.activeDays,
          progressPercent: 100,
          isMet: true,
        },
        {
          id: 'readingMinutes',
          label: '阅读时长',
          icon: '📖',
          unit: 'min',
          current: Math.round(stats.readingMinutes),
          target: Math.round(stats.readingMinutes),
          progressPercent: 100,
          isMet: true,
        },
        {
          id: 'commentCount',
          label: '发表讨论',
          icon: '💬',
          unit: '次',
          current: stats.commentCount,
          target: stats.commentCount,
          progressPercent: 100,
          isMet: true,
        },
        {
          id: 'reactionsReceived',
          label: '互动获赞',
          icon: '❤️',
          unit: '个',
          current: stats.reactionsReceived,
          target: stats.reactionsReceived,
          progressPercent: 100,
          isMet: true,
        },
      ],
    };
  }

  // LV.3 年度用户 (activeDays >= 365) - Automatic leveling ceiling
  if (stats.activeDays >= 365) {
    const items: LevelRequirementItem[] = [
      {
        id: 'activeDays',
        label: '活跃天数',
        icon: '📅',
        unit: '天',
        current: stats.activeDays,
        target: 365,
        progressPercent: 100,
        isMet: true,
      },
      {
        id: 'readingMinutes',
        label: '阅读时长',
        icon: '📖',
        unit: 'min',
        current: Math.round(stats.readingMinutes),
        target: 720,
        progressPercent: Math.min(100, Math.round((stats.readingMinutes / 720) * 100)),
        isMet: stats.readingMinutes >= 720,
      },
      {
        id: 'commentCount',
        label: '发表讨论',
        icon: '💬',
        unit: '次',
        current: stats.commentCount,
        target: 100,
        progressPercent: Math.min(100, Math.round((stats.commentCount / 100) * 100)),
        isMet: stats.commentCount >= 100,
      },
      {
        id: 'reactionsReceived',
        label: '互动获赞',
        icon: '❤️',
        unit: '个',
        current: stats.reactionsReceived,
        target: 50,
        progressPercent: Math.min(100, Math.round((stats.reactionsReceived / 50) * 100)),
        isMet: stats.reactionsReceived >= 50,
      },
    ];
    return {
      currentLevel: 3,
      currentTitle: '年度用户',
      nextTitle: '已达自动晋升上限 (LV.3)',
      isMaxAutoLevel: true,
      isWebmaster: false,
      totalRequirements: items.length,
      metRequirements: items.filter((i) => i.isMet).length,
      items,
    };
  }

  // LV.3 先驱 (activeDays >= 60 && readingMinutes >= 720 && commentCount >= 100 && reactionsReceived >= 50)
  const pioneerMet =
    stats.activeDays >= 60 &&
    stats.readingMinutes >= 720 &&
    stats.commentCount >= 100 &&
    stats.reactionsReceived >= 50;

  if (pioneerMet) {
    const items: LevelRequirementItem[] = [
      {
        id: 'activeDays',
        label: '活跃天数',
        icon: '📅',
        unit: '天',
        current: stats.activeDays,
        target: 365,
        progressPercent: Math.min(100, Math.round((stats.activeDays / 365) * 100)),
        isMet: stats.activeDays >= 365,
      },
      {
        id: 'readingMinutes',
        label: '阅读时长',
        icon: '📖',
        unit: 'min',
        current: Math.round(stats.readingMinutes),
        target: 720,
        progressPercent: 100,
        isMet: true,
      },
      {
        id: 'commentCount',
        label: '发表讨论',
        icon: '💬',
        unit: '次',
        current: stats.commentCount,
        target: 100,
        progressPercent: 100,
        isMet: true,
      },
      {
        id: 'reactionsReceived',
        label: '互动获赞',
        icon: '❤️',
        unit: '个',
        current: stats.reactionsReceived,
        target: 50,
        progressPercent: 100,
        isMet: true,
      },
    ];
    return {
      currentLevel: 3,
      currentTitle: '先驱',
      nextTitle: '年度用户 (LV.3 上限)',
      isMaxAutoLevel: true,
      isWebmaster: false,
      totalRequirements: items.length,
      metRequirements: items.filter((i) => i.isMet).length,
      items,
    };
  }

  // LV.2 活跃用户 (activeDays >= 20 && readingMinutes >= 300 && commentCount >= 30 && reactionsReceived >= 30)
  const activeUserMet =
    stats.activeDays >= 20 &&
    stats.readingMinutes >= 300 &&
    stats.commentCount >= 30 &&
    stats.reactionsReceived >= 30;

  if (activeUserMet) {
    const items: LevelRequirementItem[] = [
      {
        id: 'activeDays',
        label: '活跃天数',
        icon: '📅',
        unit: '天',
        current: stats.activeDays,
        target: 60,
        progressPercent: Math.min(100, Math.round((stats.activeDays / 60) * 100)),
        isMet: stats.activeDays >= 60,
      },
      {
        id: 'readingMinutes',
        label: '阅读时长',
        icon: '📖',
        unit: 'min',
        current: Math.round(stats.readingMinutes),
        target: 720,
        progressPercent: Math.min(100, Math.round((stats.readingMinutes / 720) * 100)),
        isMet: stats.readingMinutes >= 720,
      },
      {
        id: 'commentCount',
        label: '发表讨论',
        icon: '💬',
        unit: '次',
        current: stats.commentCount,
        target: 100,
        progressPercent: Math.min(100, Math.round((stats.commentCount / 100) * 100)),
        isMet: stats.commentCount >= 100,
      },
      {
        id: 'reactionsReceived',
        label: '互动获赞',
        icon: '❤️',
        unit: '个',
        current: stats.reactionsReceived,
        target: 50,
        progressPercent: Math.min(100, Math.round((stats.reactionsReceived / 50) * 100)),
        isMet: stats.reactionsReceived >= 50,
      },
    ];
    return {
      currentLevel: 2,
      currentTitle: '活跃用户',
      nextTitle: '先驱 (LV.3)',
      isMaxAutoLevel: false,
      isWebmaster: false,
      totalRequirements: items.length,
      metRequirements: items.filter((i) => i.isMet).length,
      items,
    };
  }

  // LV.1 贡献者 (readingMinutes >= 30 && commentCount >= 10)
  const contributorMet = stats.readingMinutes >= 30 && stats.commentCount >= 10;

  if (contributorMet) {
    const items: LevelRequirementItem[] = [
      {
        id: 'activeDays',
        label: '活跃天数',
        icon: '📅',
        unit: '天',
        current: stats.activeDays,
        target: 20,
        progressPercent: Math.min(100, Math.round((stats.activeDays / 20) * 100)),
        isMet: stats.activeDays >= 20,
      },
      {
        id: 'readingMinutes',
        label: '阅读时长',
        icon: '📖',
        unit: 'min',
        current: Math.round(stats.readingMinutes),
        target: 300,
        progressPercent: Math.min(100, Math.round((stats.readingMinutes / 300) * 100)),
        isMet: stats.readingMinutes >= 300,
      },
      {
        id: 'commentCount',
        label: '发表讨论',
        icon: '💬',
        unit: '次',
        current: stats.commentCount,
        target: 30,
        progressPercent: Math.min(100, Math.round((stats.commentCount / 30) * 100)),
        isMet: stats.commentCount >= 30,
      },
      {
        id: 'reactionsReceived',
        label: '互动获赞',
        icon: '❤️',
        unit: '个',
        current: stats.reactionsReceived,
        target: 30,
        progressPercent: Math.min(100, Math.round((stats.reactionsReceived / 30) * 100)),
        isMet: stats.reactionsReceived >= 30,
      },
    ];
    return {
      currentLevel: 1,
      currentTitle: '贡献者',
      nextTitle: '活跃用户 (LV.2)',
      isMaxAutoLevel: false,
      isWebmaster: false,
      totalRequirements: items.length,
      metRequirements: items.filter((i) => i.isMet).length,
      items,
    };
  }

  // LV.1 基本用户 (commentCount >= 1)
  if (stats.commentCount >= 1) {
    const items: LevelRequirementItem[] = [
      {
        id: 'readingMinutes',
        label: '阅读时长',
        icon: '📖',
        unit: 'min',
        current: Math.round(stats.readingMinutes),
        target: 30,
        progressPercent: Math.min(100, Math.round((stats.readingMinutes / 30) * 100)),
        isMet: stats.readingMinutes >= 30,
      },
      {
        id: 'commentCount',
        label: '发表讨论',
        icon: '💬',
        unit: '次',
        current: stats.commentCount,
        target: 10,
        progressPercent: Math.min(100, Math.round((stats.commentCount / 10) * 100)),
        isMet: stats.commentCount >= 10,
      },
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

  // LV.0 初始用户 (hasReadAny || readingMinutes > 0)
  if (stats.hasReadAny || stats.readingMinutes > 0) {
    const items: LevelRequirementItem[] = [
      {
        id: 'commentCount',
        label: '发表讨论',
        icon: '💬',
        unit: '次',
        current: stats.commentCount,
        target: 1,
        progressPercent: Math.min(100, Math.round((stats.commentCount / 1) * 100)),
        isMet: stats.commentCount >= 1,
      },
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

  // LV.0 新兴用户
  const items: LevelRequirementItem[] = [
    {
      id: 'readingMinutes',
      label: '阅读探索',
      icon: '📖',
      unit: 'min',
      current: Math.round(stats.readingMinutes),
      target: 1,
      progressPercent: (stats.hasReadAny || stats.readingMinutes > 0) ? 100 : 0,
      isMet: (stats.hasReadAny || stats.readingMinutes > 0),
    },
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

