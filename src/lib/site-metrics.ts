import type { CollectionEntry } from 'astro:content';
import { estimateWordCount, estimateReadingMinutes, getPostPath, getPublicPosts, sortPostsByDate } from './content.ts';
import { standardsConfig, matchActivityTier, matchContentDensityTier, type ActivityTier, type ContentDensityTier } from '../config/standards.ts';

type PostEntry = CollectionEntry<'posts'>;

export interface StandardThreshold {
  level: string;
  badge: string;
  title: string;
  min: number;
  max?: number;
  description: string;
  isCurrent?: boolean;
}

export interface MetricStandard {
  key: string;
  label: string;
  unit: string;
  currentValue: number | string;
  currentLevel: string;
  currentLevelNumber: number;
  description: string;
  thresholds: StandardThreshold[];
  nextMilestone?: string;
  progressPercent: number;
  href?: string;
}

export interface FullSiteMetrics {
  totalPosts: number;
  totalWords: number;
  totalReadingMinutes: number;
  avgWordsPerPost: number;
  uptimeDays: number;
  recentPostCount30d: number;
  activeLevel: {
    status: string; // e.g. "Status 3"
    level: string;  // e.g. "Lv.3"
    levelNumber: number;
    title: string;
    description: string;
    badge: string;
    href: string;
  };
  densityLevel: {
    level: string; // e.g. "Level 4 (Ultra)"
    shortLevel: string; // e.g. "Lv.4"
    levelNumber: number;
    title: string;
    description: string;
    badge: string;
    href: string;
  };
  standards: {
    activeLevel: MetricStandard;
    contentDensity: MetricStandard;
    runtime: MetricStandard;
    wordCount: MetricStandard;
  };
  standardsConfig: typeof standardsConfig;
}

const START_DATE = new Date('2024-01-01T00:00:00Z');

/**
 * 完整测算全站核心指标与分级说明 (Authoritative Site Metrics Engine)
 */
export function calculateSiteMetrics(posts: PostEntry[], now = new Date()): FullSiteMetrics {
  const publicPosts = getPublicPosts(posts);
  const totalPosts = publicPosts.length;

  let totalWords = 0;
  let totalReadingMinutes = 0;

  for (const post of publicPosts) {
    const words = (post.data as any).wordCount ?? estimateWordCount(post);
    const reading = (post.data as any).readingMinutes ?? estimateReadingMinutes(post);
    totalWords += words;
    totalReadingMinutes += reading;
  }

  const avgWordsPerPost = totalPosts > 0 ? Math.round(totalWords / totalPosts) : 0;

  // 运行天数计算 (从 2024-01-01 起)
  const diffTime = Math.max(0, now.getTime() - START_DATE.getTime());
  const uptimeDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  // 近 30 天发文统计 (UTC/本地安全比对)
  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(now.getDate() - 30);
  thirtyDaysAgo.setHours(0, 0, 0, 0);

  const recentPostCount30d = publicPosts.filter((p) => {
    const postDate = new Date(p.data.pubDate);
    return postDate >= thirtyDaysAgo && postDate <= now;
  }).length;

  // 1. 活跃等级分级测算 (Active / Maintainer Level) - 统一调用规范配置
  const activeTier = matchActivityTier(recentPostCount30d);
  const activeStatus = activeTier.status;
  const activeLevel = activeTier.level;
  const activeLevelNum = parseInt(activeTier.level.replace('Lv.', ''), 10) || 0;
  const activeTitle = activeTier.title;
  const activeDesc = activeTier.description;

  // 活跃度各梯队标准 (由 standardsConfig 统一驱动)
  const activeThresholds: StandardThreshold[] = standardsConfig.activityLevels.map((tier) => ({
    level: tier.status,
    badge: tier.badge,
    title: tier.title,
    min: tier.minPosts,
    max: tier.maxPosts,
    description: tier.description,
    isCurrent: tier.level === activeTier.level,
  }));

  let nextActiveMilestone: string | undefined;
  let activeProgressPercent = 100;
  if (activeLevelNum === 0) {
    nextActiveMilestone = '距离 Lv.1 还需发布 1 篇文章';
    activeProgressPercent = Math.min(100, Math.round((recentPostCount30d / 1) * 100));
  } else if (activeLevelNum === 1) {
    nextActiveMilestone = `距离 Lv.2 还需发布 ${Math.max(0, 3 - recentPostCount30d)} 篇`;
    activeProgressPercent = Math.min(100, Math.round(((recentPostCount30d - 1) / (3 - 1)) * 100));
  } else if (activeLevelNum === 2) {
    nextActiveMilestone = `距离 Lv.3 还需发布 ${Math.max(0, 5 - recentPostCount30d)} 篇`;
    activeProgressPercent = Math.min(100, Math.round(((recentPostCount30d - 3) / (5 - 3)) * 100));
  } else if (activeLevelNum === 3) {
    nextActiveMilestone = `距离 Lv.4 还需发布 ${Math.max(0, 9 - recentPostCount30d)} 篇`;
    activeProgressPercent = Math.min(100, Math.round(((recentPostCount30d - 5) / (9 - 5)) * 100));
  } else {
    nextActiveMilestone = '已达到最高活跃级别 (Lv.4 Ultra)';
    activeProgressPercent = 100;
  }

  // 2. 内容密度分级测算 (Content Density Level) - 统一调用规范配置
  const densityTier = matchContentDensityTier(avgWordsPerPost);
  const densityStatus = densityTier.status;
  const densityShort = densityTier.level;
  const densityLevelNum = parseInt(densityTier.level.replace('Lv.', ''), 10) || 1;
  const densityTitle = densityTier.title;
  const densityDesc = densityTier.description;

  const densityThresholds: StandardThreshold[] = standardsConfig.contentDensityLevels.map((tier) => ({
    level: tier.status,
    badge: tier.badge,
    title: tier.title,
    min: tier.minAvgWords,
    max: tier.maxAvgWords,
    description: tier.description,
    isCurrent: tier.level === densityTier.level,
  }));

  let nextDensityMilestone: string | undefined;
  let densityProgressPercent = 100;
  if (densityLevelNum === 1) {
    nextDensityMilestone = `距离 Lv.2 尚差 ${Math.max(0, 801 - avgWordsPerPost)} 字/篇`;
    densityProgressPercent = Math.min(100, Math.round((avgWordsPerPost / 801) * 100));
  } else if (densityLevelNum === 2) {
    nextDensityMilestone = `距离 Lv.3 尚差 ${Math.max(0, 1501 - avgWordsPerPost)} 字/篇`;
    densityProgressPercent = Math.min(100, Math.round(((avgWordsPerPost - 801) / (1501 - 801)) * 100));
  } else if (densityLevelNum === 3) {
    nextDensityMilestone = `距离 Lv.4 尚差 ${Math.max(0, 3001 - avgWordsPerPost)} 字/篇`;
    densityProgressPercent = Math.min(100, Math.round(((avgWordsPerPost - 1501) / (3001 - 1501)) * 100));
  } else {
    nextDensityMilestone = '已达到最高内容密度级别 (Lv.4 Ultra)';
    densityProgressPercent = 100;
  }

  return {
    totalPosts,
    totalWords,
    totalReadingMinutes,
    avgWordsPerPost,
    uptimeDays,
    recentPostCount30d,
    activeLevel: {
      status: activeStatus,
      level: activeLevel,
      levelNumber: activeLevelNum,
      title: activeTitle,
      description: activeDesc,
      badge: activeTier.badge,
      href: '/standards/activity-level/',
    },
    densityLevel: {
      level: densityStatus,
      shortLevel: densityShort,
      levelNumber: densityLevelNum,
      title: densityTitle,
      description: densityDesc,
      badge: densityTier.badge,
      href: '/standards/content-density/',
    },
    standards: {
      activeLevel: {
        key: 'activeLevel',
        label: '活跃等级',
        unit: '篇',
        currentValue: recentPostCount30d,
        currentLevel: activeLevel,
        currentLevelNumber: activeLevelNum,
        description: activeDesc,
        thresholds: activeThresholds,
        nextMilestone: nextActiveMilestone,
        progressPercent: activeProgressPercent,
        href: '/standards/activity-level/',
      },
      contentDensity: {
        key: 'density',
        label: '内容密度',
        unit: '字/篇',
        currentValue: avgWordsPerPost,
        currentLevel: densityShort,
        currentLevelNumber: densityLevelNum,
        description: densityDesc,
        thresholds: densityThresholds,
        nextMilestone: nextDensityMilestone,
        progressPercent: densityProgressPercent,
        href: '/standards/content-density/',
      },
      runtime: {
        key: 'runtime',
        label: '安全运行',
        unit: '天',
        currentValue: uptimeDays,
        currentLevel: 'Stable',
        currentLevelNumber: 1,
        description: `自 2024-01-01 起安全稳定运行累计 ${uptimeDays} 天`,
        thresholds: [
          { level: '1000d+', badge: '1000d+', title: '长治久安', min: 1000, description: '运行 > 1,000 天', isCurrent: uptimeDays >= 1000 },
          { level: '500d+', badge: '500d+', title: '深耕沉淀', min: 500, max: 999, description: '运行 500 ~ 999 天', isCurrent: uptimeDays >= 500 && uptimeDays < 1000 },
          { level: '100d+', badge: '100d+', title: '稳步发展', min: 100, max: 499, description: '运行 100 ~ 499 天', isCurrent: uptimeDays >= 100 && uptimeDays < 500 },
        ],
        progressPercent: 100,
        href: '/standards/',
      },
      wordCount: {
        key: 'words',
        label: '全站字数',
        unit: '字',
        currentValue: totalWords,
        currentLevel: `${(totalWords / 10000).toFixed(1)}万字`,
        currentLevelNumber: 1,
        description: `基于全站 ${totalPosts} 篇公开文章物理精算`,
        thresholds: [
          { level: '100w+', badge: '100w+', title: '巨擘体量', min: 1000000, description: '总字数超过 100 万字', isCurrent: totalWords >= 1000000 },
          { level: '50w+', badge: '50w+', title: '鸿篇巨制', min: 500000, max: 999999, description: '总字数 50 万 ~ 100 万字', isCurrent: totalWords >= 500000 && totalWords < 1000000 },
          { level: '10w+', badge: '10w+', title: '初具规模', min: 100000, max: 499999, description: '总字数 10 万 ~ 50 万字', isCurrent: totalWords >= 100000 && totalWords < 500000 },
        ],
        progressPercent: Math.min(100, Math.round((totalWords / 1000000) * 100)),
        href: '/standards/',
      },
    },
    standardsConfig,
  };
}

export interface ActivityPostItem {
  title: string;
  href: string;
  type: 'publish' | 'update';
  date: string;
}

export interface ActivityDay {
  date: string;       // YYYY-MM-DD
  displayDate: string; // e.g. 2026/8/27
  level: number;      // 0 - 4
  posts: ActivityPostItem[];
  isFuture?: boolean;
}

/**
 * 构建权威热力图数据 (含发布与更新记录，去重多语言冗余，严格对齐真实日历)
 */
export function buildHeatmapActivity(posts: PostEntry[], now = new Date()): {
  days: ActivityDay[];
  monthLabels: { label: string; index: number }[];
  totalActivities: number;
} {
  const publicPosts = getPublicPosts(posts);

  // 1. 建立日期 -> 活动记录映射表 (以 YYYY-MM-DD 为唯一键)
  const activityMap = new Map<string, ActivityPostItem[]>();

  const addActivity = (dateStr: string, item: ActivityPostItem) => {
    if (!dateStr) return;
    const list = activityMap.get(dateStr) ?? [];
    if (!list.some((existing) => existing.href === item.href && existing.type === item.type)) {
      list.push(item);
      activityMap.set(dateStr, list);
    }
  };

  for (const post of publicPosts) {
    const pubDate = new Date(post.data.pubDate);
    const pubKey = pubDate.toISOString().split('T')[0];
    const path = getPostPath(post);

    addActivity(pubKey, {
      title: post.data.title,
      href: path,
      type: 'publish',
      date: pubKey,
    });

    if (post.data.updatedDate) {
      const upDate = new Date(post.data.updatedDate);
      const upKey = upDate.toISOString().split('T')[0];
      if (upKey !== pubKey) {
        addActivity(upKey, {
          title: `${post.data.title} (更新)`,
          href: path,
          type: 'update',
          date: upKey,
        });
      }
    }
  }

  // 2. 52 周日历框架生成 (严格以真实当天为基准对齐 Sunday ~ Saturday)
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  today.setHours(0, 0, 0, 0);

  const currentWeekSunday = new Date(today);
  currentWeekSunday.setDate(today.getDate() - today.getDay());

  const startDate = new Date(currentWeekSunday);
  startDate.setDate(currentWeekSunday.getDate() - (51 * 7));

  const totalSlots = 52 * 7;
  const days: ActivityDay[] = [];
  let totalActivities = 0;

  for (let i = 0; i < totalSlots; i++) {
    const currentDate = new Date(startDate);
    currentDate.setDate(startDate.getDate() + i);

    const y = currentDate.getFullYear();
    const m = String(currentDate.getMonth() + 1).padStart(2, '0');
    const d = String(currentDate.getDate()).padStart(2, '0');
    const dateKey = `${y}-${m}-${d}`;
    const displayDate = `${y}/${parseInt(m, 10)}/${parseInt(d, 10)}`;

    const isFuture = currentDate > today;
    const items = isFuture ? [] : (activityMap.get(dateKey) || []);
    const count = items.length;
    totalActivities += count;

    // 贡献等级梯队：0 篇为 0；1 篇为 1；2~3 篇为 2；4~6 篇为 3；7+ 篇为 4
    let level = 0;
    if (!isFuture) {
      if (count >= 7) level = 4;
      else if (count >= 4) level = 3;
      else if (count >= 2) level = 2;
      else if (count >= 1) level = 1;
    }

    days.push({
      date: dateKey,
      displayDate,
      level,
      posts: items,
      isFuture,
    });
  }

  // 3. 月份标签生成
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthLabels: { label: string; index: number }[] = [];

  for (let week = 0; week < 52; week++) {
    const dayIndex = week * 7;
    const dayData = days[dayIndex];
    if (!dayData) continue;

    const parts = dayData.date.split('-');
    const monthIdx = parseInt(parts[1], 10) - 1;
    const monthName = months[monthIdx];

    if (monthLabels.length === 0 || monthLabels[monthLabels.length - 1].label !== monthName) {
      monthLabels.push({ label: monthName, index: week });
    }
  }

  return {
    days,
    monthLabels,
    totalActivities,
  };
}
