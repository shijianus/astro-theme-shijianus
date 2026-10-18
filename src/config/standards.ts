/**
 * EpoCanvas Engineering Standards (EES) Configuration
 * 管理员可在此自由调整活跃等级与内容密度的分级评定算法与阈值
 */

export interface ActivityTier {
  key: string;
  status: string;
  level: string;
  badge: string;
  title: string;
  minPosts: number;
  maxPosts?: number;
  description: string;
  paceGuide: string;
  badgeColor: string;
}

export interface ContentDensityTier {
  key: string;
  status: string;
  level: string;
  badge: string;
  title: string;
  minAvgWords: number;
  maxAvgWords?: number;
  description: string;
  readingExpectation: string;
  badgeColor: string;
}

export interface StandardsConfig {
  specId: string;
  version: string;
  siteStartDate: string;
  activityLevels: ActivityTier[];
  contentDensityLevels: ContentDensityTier[];
}

export const standardsConfig: StandardsConfig = {
  specId: 'EES-2026.4',
  version: '2.6.0',
  siteStartDate: '2024-01-01',

  /**
   * 活跃等级分级阶梯 (Activity Level Tiers)
   * 基于近 30 天发布的公开文章数量精算
   * 规则均衡实用：既不过于苛刻（非商业日更媒体），也不过低失效
   */
  activityLevels: [
    {
      key: 'status-4',
      status: 'Status 4',
      level: 'Lv.4',
      badge: 'Lv.4 Ultra',
      title: '极客狂热',
      minPosts: 9,
      description: '近 30 天发文 >= 9 篇，超高密度爆发式技术输出与深度攻坚',
      paceGuide: '每周 2 篇以上（全职/冲刺研究阶段）',
      badgeColor: '#8e44ad',
    },
    {
      key: 'status-3',
      status: 'Status 3',
      level: 'Lv.3',
      badge: 'Lv.3 High',
      title: '高频迭代',
      minPosts: 5,
      maxPosts: 8,
      description: '近 30 天发文 5 ~ 8 篇，保持高质量与快节奏迭代更新',
      paceGuide: '每周 1 ~ 2 篇（高产持续创作阶段）',
      badgeColor: '#425aef',
    },
    {
      key: 'status-2',
      status: 'Status 2',
      level: 'Lv.2',
      badge: 'Lv.2 Standard',
      title: '稳定维护',
      minPosts: 3,
      maxPosts: 4,
      description: '近 30 天发文 3 ~ 4 篇，系统节奏稳定，稳步推进技术专题',
      paceGuide: '每周约 1 篇（健康稳定博主基线）',
      badgeColor: '#0052d9',
    },
    {
      key: 'status-1',
      status: 'Status 1',
      level: 'Lv.1',
      badge: 'Lv.1 Low',
      title: '周期推送',
      minPosts: 1,
      maxPosts: 2,
      description: '近 30 天发文 1 ~ 2 篇，维持基础的周期性心跳推送',
      paceGuide: '每两周至每月 1 篇（基础心跳维护）',
      badgeColor: '#2ba471',
    },
    {
      key: 'status-0',
      status: 'Status 0',
      level: 'Lv.0',
      badge: 'Lv.0 Idle',
      title: '维护休眠',
      minPosts: 0,
      maxPosts: 0,
      description: '近 30 天内暂无公开内容发布，站点处于常规静默维护态',
      paceGuide: '超过 30 天未发布新内容',
      badgeColor: '#9e9e9e',
    },
  ],

  /**
   * 内容密度分级阶梯 (Content Density Tiers)
   * 基于全站所有公开文章的平均物理字数精算
   * 倡导硬核扎实的技术论述，杜绝碎片灌水
   */
  contentDensityLevels: [
    {
      key: 'level-4',
      status: 'Level 4 (Ultra)',
      level: 'Lv.4',
      badge: 'Lv.4 Ultra',
      title: '硬核深度长文',
      minAvgWords: 3001,
      description: '全站平均单篇字数 > 3,000 字，具备极高的技术沉淀与详实图文论述',
      readingExpectation: '单篇阅读预计需 15 ~ 35 分钟，多为完整架构设计或原理剖析',
      badgeColor: '#8e44ad',
    },
    {
      key: 'level-3',
      status: 'Level 3 (High)',
      level: 'Lv.3',
      badge: 'Lv.3 High',
      title: '详实系统专栏',
      minAvgWords: 1501,
      maxAvgWords: 3000,
      description: '全站平均单篇字数 1,501 ~ 3,000 字，体系完备、图文并茂的专业级专栏文章',
      readingExpectation: '单篇阅读预计需 7 ~ 15 分钟，论证充分，覆盖实战关键点',
      badgeColor: '#425aef',
    },
    {
      key: 'level-2',
      status: 'Level 2 (Standard)',
      level: 'Lv.2',
      badge: 'Lv.2 Standard',
      title: '标准技术博客',
      minAvgWords: 801,
      maxAvgWords: 1500,
      description: '全站平均单篇字数 801 ~ 1,500 字，标准技术博文规范，论述清晰明确',
      readingExpectation: '单篇阅读预计需 3 ~ 7 分钟，聚焦解决具体工程痛点',
      badgeColor: '#0052d9',
    },
    {
      key: 'level-1',
      status: 'Level 1 (Low)',
      level: 'Lv.1',
      badge: 'Lv.1 Low',
      title: '微动态速记',
      minAvgWords: 0,
      maxAvgWords: 800,
      description: '全站平均单篇字数 <= 800 字，侧重碎片速记、备忘清单与敏捷分享',
      readingExpectation: '单篇阅读预计需 1 ~ 3 分钟，轻量级随笔或简短代码片',
      badgeColor: '#2ba471',
    },
  ],
};

/**
 * 匹配活跃等级
 */
export function matchActivityTier(recentPostsCount: number): ActivityTier {
  const count = Math.max(0, recentPostsCount);
  for (const tier of standardsConfig.activityLevels) {
    if (tier.maxPosts !== undefined) {
      if (count >= tier.minPosts && count <= tier.maxPosts) {
        return tier;
      }
    } else {
      if (count >= tier.minPosts) {
        return tier;
      }
    }
  }
  return standardsConfig.activityLevels[standardsConfig.activityLevels.length - 1];
}

/**
 * 匹配内容密度等级
 */
export function matchContentDensityTier(avgWords: number): ContentDensityTier {
  const words = Math.max(0, avgWords);
  for (const tier of standardsConfig.contentDensityLevels) {
    if (tier.maxAvgWords !== undefined) {
      if (words >= tier.minAvgWords && words <= tier.maxAvgWords) {
        return tier;
      }
    } else {
      if (words >= tier.minAvgWords) {
        return tier;
      }
    }
  }
  return standardsConfig.contentDensityLevels[standardsConfig.contentDensityLevels.length - 1];
}
