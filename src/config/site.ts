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
  accent: 'signal' | 'teal' | 'lime' | 'slate';
};

export type HomeStatusCard = {
  title: string;
  value: string;
  detail: string;
};

export type HeroStat = {
  label: string;
  value: string;
  detail: string;
};

export type HomeSpotlight = {
  eyebrow: string;
  title: string;
  summary: string;
  href: string;
};

export const siteConfig = {
  site: {
    name: 'shijianus',
    title: 'shijianus',
    domainLabel: 'shijian.us',
    locale: 'zh-CN',
    description: '用 Astro、React 和 Tailwind 构建一套高信息密度、强作者感、可长期维护的个人博客主题。',
    author: {
      name: 'shijianus',
      role: 'Builder / Student / Generalist',
      motto: '内容优先，结构优先，长期可维护。',
      bio: '记录构建、实验、写作和日常技术判断，把博客做成一个真正能持续生长的内容系统。',
      email: 'hello@shijian.us',
      location: 'UTC-8',
      avatar: '/media/shijianus/avatar.svg',
      cover: '/media/shijianus/workbench.jpg',
      statusLabel: '持续重构中',
    },
  },
  theme: {
    defaultMode: 'light',
    features: {
      hero: true,
      categoryRail: true,
      featuredDeck: true,
      homeStats: true,
      homeSkillFlow: true,
      asideAuthor: true,
      asideStatus: true,
      asideTags: true,
      asideArchives: true,
      asideWebInfo: true,
      postToc: true,
      relatedPosts: true,
      postCopyright: true,
      loadingScreen: true,
      particles: true,
      searchPanel: true,
      centerConsole: true,
      rightClickMenu: true,
    },
    motion: {
      heroParticles: 36,
      pageRevealDurationMs: 820,
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
    quickActions: [
      { label: '随便逛逛', href: '/posts/readable-geek-interfaces/' },
      { label: '进入归档', href: '/archives/' },
    ] satisfies SiteNavItem[],
  },
  home: {
    hero: {
      badge: 'Theme System',
      eyebrow: 'shijianus / writing system',
      title: '把研究、开发和生活折叠成可读的记录',
      emphasis: '在高信息密度里保留阅读秩序',
      summary:
        '重建参考主题的首页结构、交互节奏和作者感，但所有数据、组件和配置都收束到更适合 shijianus 的 Astro 体系里。',
      primaryCta: { label: '开始阅读', href: '/archives/' },
      secondaryCta: { label: '关于主题', href: '/about/' },
      image: '/media/shijianus/hero.jpg',
      imageAlt: 'shijianus theme hero background',
      chips: ['Astro 6', 'React 19', 'Tailwind 4', 'Config First'],
      stats: [
        { label: 'Theme Core', value: 'SSR + Islands', detail: '内容和交互分层清晰' },
        { label: 'UI Target', value: 'Reference-class', detail: '首页与文章页整体复刻' },
        { label: 'Delivery', value: 'Local now / API later', detail: '数据源未来可替换' },
      ] satisfies HeroStat[],
      skillFlow: [
        'Astro',
        'React',
        'Tailwind',
        'TypeScript',
        'Content Collections',
        'MDX',
        'Motion',
        'SSR',
      ],
    },
    categories: [
      { label: '系统设计', description: '架构判断与演进记录', href: '/categories/系统设计/', accent: 'signal' },
      { label: '前端工程', description: '界面、组件和体验实现', href: '/categories/前端工程/', accent: 'teal' },
      { label: '学习笔记', description: '课程、实验与思考', href: '/categories/学习笔记/', accent: 'lime' },
      { label: '产品观察', description: '工具、写作与产品判断', href: '/categories/产品观察/', accent: 'slate' },
    ] satisfies HomeCategory[],
    statusCards: [
      { title: '当前阶段', value: 'UI 复刻中', detail: '先把首页、文章页和侧栏系统做完整' },
      { title: '实现原则', value: 'Config Surface', detail: '所有区块有明确配置入口' },
      { title: '长期方向', value: 'API Ready', detail: '远程数据接入不重写模板' },
    ] satisfies HomeStatusCard[],
    announcement: {
      eyebrow: '本次重构',
      title: '先把真正的主题感和交互密度做出来',
      summary:
        '这一步不再停留在“有内容的默认壳子”，而是把头图、导航、卡片、侧栏、按钮反馈、开场过渡和页面层次一起重新做完整。',
      href: '/about/',
    },
    spotlight: [
      {
        eyebrow: '结构',
        title: '首页不是 Landing Page',
        summary: '首屏要能建立作者感，也要直接把内容入口交给读者。',
        href: '/archives/',
      },
      {
        eyebrow: '样式',
        title: '交互要有手感',
        summary: '按钮、卡片、滚动和开场都要有明确反馈，而不是静止排版。',
        href: '/tags/',
      },
      {
        eyebrow: '工程',
        title: '数据面不能写死',
        summary: '所有主要区块都必须保留后续切 API 或增删模块的能力。',
        href: '/about/',
      },
    ] satisfies HomeSpotlight[],
    feed: {
      eyebrow: 'Latest Writing',
      title: '近期更新',
      summary: '保留强结构文章流和明显封面卡片，用更稳定的元信息层次提高扫描效率。',
    },
  },
  aside: {
    stack: ['Astro', 'React', 'Tailwind', 'MDX', 'Content Collections'],
    notes: [
      '配置先于样式，保证每个模块都能被开关和替换。',
      '首页优先服务阅读，不做空洞品牌页。',
      '交互只在需要时 Hydrate，内容结构保持 Astro 驱动。',
    ],
    status: [
      { title: 'Theme Status', value: 'Rebuilding', detail: '共享壳层、首页、文章页同步重做' },
      { title: 'Interface Tone', value: 'Editorial + Geek', detail: '强化作者感，但不牺牲阅读性' },
    ] satisfies HomeStatusCard[],
  },
  footer: {
    since: 2020,
    badges: ['Astro', 'React', 'Tailwind', 'TypeScript'],
    quote: '把博客当成长期维护的软件来做。',
    links: [
      { label: 'GitHub', href: 'https://github.com/shijianus', external: true },
      { label: '归档', href: '/archives/' },
      { label: '标签', href: '/tags/' },
    ] satisfies SiteNavItem[],
    groups: [
      {
        title: '导航',
        links: [
          { label: '首页', href: '/' },
          { label: '归档', href: '/archives/' },
          { label: '分类', href: '/categories/' },
        ] satisfies SiteNavItem[],
      },
      {
        title: '联系',
        links: [
          { label: 'GitHub', href: 'https://github.com/shijianus', external: true },
          { label: '邮箱', href: 'mailto:hello@shijian.us', external: true },
        ] satisfies SiteNavItem[],
      },
    ],
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
