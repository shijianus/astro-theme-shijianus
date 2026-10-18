import type { CollectionEntry } from 'astro:content';
import { estimateWordCount, estimateReadingMinutes, getPostPath, getPublicPosts, sortPostsByDate } from './content.ts';

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
  };
  densityLevel: {
    level: string; // e.g. "Level 4 (Ultra)"
    shortLevel: string; // e.g. "Lv.4"
    levelNumber: number;
    title: string;
    description: string;
  };
  standards: {
    activeLevel: MetricStandard;
    contentDensity: MetricStandard;
    runtime: MetricStandard;
    wordCount: MetricStandard;
  };
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

  // 1. 活跃等级分级测算 (Active / Maintainer Level)
  let activeStatus = 'Status 0';
  let activeLevel = 'Lv.0';
  let activeLevelNum = 0;
  let activeTitle = '维护休眠';
  let activeDesc = '近30天暂无公开发布，系统处于常规维护休眠状态';

  if (recentPostCount30d > 8) {
    activeStatus = 'Status 4';
    activeLevel = 'Lv.4';
    activeLevelNum = 4;
    activeTitle = '极度活跃';
    activeDesc = '近30天发布 > 8 篇，内容高密度产出与极速迭代';
  } else if (recentPostCount30d >= 5) {
    activeStatus = 'Status 3';
    activeLevel = 'Lv.3';
    activeLevelNum = 3;
    activeTitle = '高频迭代';
    activeDesc = '近30天发布 5~8 篇，保持高质量与快节奏迭代更新';
  } else if (recentPostCount30d >= 3) {
    activeStatus = 'Status 2';
    activeLevel = 'Lv.2';
    activeLevelNum = 2;
    activeTitle = '稳定维护';
    activeDesc = '近30天发布 3~4 篇，系统节奏稳定，稳步推进技术专题';
  } else if (recentPostCount30d >= 1) {
    activeStatus = 'Status 1';
    activeLevel = 'Lv.1';
    activeLevelNum = 1;
    activeTitle = '周期推送';
    activeDesc = '近30天发布 1~2 篇，处于周期性常规推送与维护中';
  }

  // 活跃度各梯队标准
  const activeThresholds: StandardThreshold[] = [
    { level: 'Status 4', badge: 'Lv.4 Ultra', title: '极度活跃', min: 9, description: '近 30 天发文 > 8 篇', isCurrent: activeLevelNum === 4 },
    { level: 'Status 3', badge: 'Lv.3 High', title: '高频迭代', min: 5, max: 8, description: '近 30 天发文 5 ~ 8 篇', isCurrent: activeLevelNum === 3 },
    { level: 'Status 2', badge: 'Lv.2 Standard', title: '稳定维护', min: 3, max: 4, description: '近 30 天发文 3 ~ 4 篇', isCurrent: activeLevelNum === 2 },
    { level: 'Status 1', badge: 'Lv.1 Low', title: '周期推送', min: 1, max: 2, description: '近 30 天发文 1 ~ 2 篇', isCurrent: activeLevelNum === 1 },
    { level: 'Status 0', badge: 'Lv.0 Idle', title: '维护休眠', min: 0, max: 0, description: '近 30 天无新发文章', isCurrent: activeLevelNum === 0 },
  ];

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

  // 2. 内容密度分级测算 (Content Density Level)
  let densityStatus = 'Level 1 (Low)';
  let densityShort = 'Lv.1';
  let densityLevelNum = 1;
  let densityTitle = '微动态速记';
  let densityDesc = '全站平均单篇字数 <= 800 字，侧重碎片速记与敏捷分享';

  if (avgWordsPerPost > 3000) {
    densityStatus = 'Level 4 (Ultra)';
    densityShort = 'Lv.4';
    densityLevelNum = 4;
    densityTitle = '硬核深度长文';
    densityDesc = '全站平均单篇字数 > 3000 字，具备极高的技术沉淀与详实图文论述';
  } else if (avgWordsPerPost > 1500) {
    densityStatus = 'Level 3 (High)';
    densityShort = 'Lv.3';
    densityLevelNum = 3;
    densityTitle = '详实系统专栏';
    densityDesc = '全站平均单篇字数 1500~3000 字，体系完备、图文并茂的专业级专栏文章';
  } else if (avgWordsPerPost > 800) {
    densityStatus = 'Level 2 (Standard)';
    densityShort = 'Lv.2';
    densityLevelNum = 2;
    densityTitle = '标准技术博客';
    densityDesc = '全站平均单篇字数 800~1500 字，标准技术博文规范，论述清晰明确';
  }

  const densityThresholds: StandardThreshold[] = [
    { level: 'Level 4', badge: 'Lv.4 Ultra', title: '硬核深度长文', min: 3001, description: '平均单篇字数 > 3,000 字', isCurrent: densityLevelNum === 4 },
    { level: 'Level 3', badge: 'Lv.3 High', title: '详实系统专栏', min: 1501, max: 3000, description: '平均单篇字数 1,501 ~ 3,000 字', isCurrent: densityLevelNum === 3 },
    { level: 'Level 2', badge: 'Lv.2 Standard', title: '标准技术博客', min: 801, max: 1500, description: '平均单篇字数 801 ~ 1,500 字', isCurrent: densityLevelNum === 2 },
    { level: 'Level 1', badge: 'Lv.1 Low', title: '微动态速记', min: 0, max: 800, description: '平均单篇字数 <= 800 字', isCurrent: densityLevelNum === 1 },
  ];

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
    },
    densityLevel: {
      level: densityStatus,
      shortLevel: densityShort,
      levelNumber: densityLevelNum,
      title: densityTitle,
      description: densityDesc,
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
      },
    },
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
