export type SiteNavItem = {
  label: string;
  href: string;
  description?: string;
  external?: boolean;
};

export type HomeCategory = {
  label: string;
  description: string;
  href: string;
  accent: 'signal' | 'teal' | 'lime' | 'ember';
};

export type StatusCard = {
  title: string;
  value: string;
  detail: string;
};

export const siteConfig = {
  site: {
    name: 'shijianus',
    title: 'shijianus',
    domainLabel: 'shijian.us',
    locale: 'zh-CN',
    description: '用 Astro、React 和 Tailwind 构建一套更极客但仍然好读的个人博客主题。',
    author: {
      name: 'shijianus',
      role: 'Builder / Student / Generalist',
      bio: '记录构建、实验、写作和日常技术判断，让内容和界面都能长期维护。',
      email: 'hello@shijian.us',
      location: 'UTC-8',
      avatar: '/img/siteicon/apple-icon-180.png',
    },
  },
  theme: {
    defaultMode: 'dark',
    features: {
      hero: true,
      categoryRail: true,
      featuredDeck: true,
      homeStats: true,
      asideAuthor: true,
      asideStatus: true,
      asideTags: true,
      asideArchives: true,
      asideWebInfo: true,
      postToc: true,
      relatedPosts: true,
      postCopyright: true,
    },
  },
  navigation: {
    primary: [
      { label: '首页', href: '/' },
      { label: '归档', href: '/archives/' },
      { label: '分类', href: '/categories/' },
      { label: '标签', href: '/tags/' },
      { label: '关于', href: '/about/' },
    ] satisfies SiteNavItem[],
    utility: [
      { label: 'GitHub', href: 'https://github.com/shijianus', external: true },
      { label: '邮箱', href: 'mailto:hello@shijian.us', external: true },
    ] satisfies SiteNavItem[],
  },
  home: {
    hero: {
      eyebrow: 'shijianus / research log',
      title: '把研究、开发和生活折叠成可读的记录',
      summary: '保留强结构首页、信息密度和模块化配置，同时把品牌、视觉语言和交互节奏重建为更适合 shijianus 的版本。',
      primaryCta: { label: '进入归档', href: '/archives/' },
      secondaryCta: { label: '查看关于', href: '/about/' },
      image: '/img/default_cover.jpg',
      imageAlt: 'shijianus theme hero background',
    },
    categories: [
      { label: '系统设计', description: '架构判断与演进记录', href: '/categories/system-design/', accent: 'signal' },
      { label: '前端工程', description: '界面、组件和体验实现', href: '/categories/frontend/', accent: 'teal' },
      { label: '学习笔记', description: '课程、实验与思考', href: '/categories/learning/', accent: 'lime' },
      { label: '产品观察', description: '工具与写作习惯', href: '/categories/product/', accent: 'ember' },
    ] satisfies HomeCategory[],
    statusCards: [
      { title: 'Theme Core', value: 'Astro + React', detail: '内容渲染与交互分层' },
      { title: 'Config Surface', value: 'Section Toggles', detail: '各板块独立开关' },
      { title: 'API Ready', value: 'Provider Friendly', detail: '后续接 API 不拆模板' },
    ] satisfies StatusCard[],
    announcement: {
      eyebrow: '本次重构',
      title: '做成一个可长期迭代的 shijianus 主题内核',
      summary: '结构参考原主题的强配置能力，但视觉、交互和文案全部重新组织，不保留上游品牌。',
      href: '/about/',
    },
  },
  aside: {
    stack: ['Astro', 'React', 'Tailwind', 'MDX', 'Content Collections'],
    notes: [
      '配置先于样式，保证切换和扩展能力。',
      '首页优先呈现内容，不做空洞 landing page。',
      'React 只负责交互，内容与数据整理由 Astro 驱动。',
    ],
  },
  footer: {
    since: 2020,
    badges: ['Astro', 'React', 'Tailwind', 'TypeScript'],
    links: [
      { label: 'GitHub', href: 'https://github.com/shijianus', external: true },
      { label: '归档', href: '/archives/' },
      { label: '标签', href: '/tags/' },
    ] satisfies SiteNavItem[],
  },
  integrations: {
    dataSource: {
      homeFeed: 'local',
      metrics: 'local',
      search: 'future-api',
    },
  },
} as const;

export type SiteConfig = typeof siteConfig;
