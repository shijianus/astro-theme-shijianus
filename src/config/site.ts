export type SiteNavItem = {
  label: string;
  href: string;
  description?: string;
  external?: boolean;
  icon?: 'github' | 'mail' | 'archive' | 'tags' | 'about' | 'home';
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

export type AboutSkill = {
  label: string;
  icon: string;
  accent: string;
};

export type AboutCareer = {
  label: string;
  accent: string;
};

export type AboutReward = {
  name: string;
  amount: string;
  date: string;
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
      asideCategories: true,
      asideFeatureCard: true,
      asideWebInfo: true,
      postToc: true,
      relatedPosts: true,
      postCopyright: true,
      loadingScreen: true,
      pageIntro: true,
      particles: true,
      searchPanel: true,
      centerConsole: true,
      rightClickMenu: true,
      footerSocialBar: true,
      footerRuntime: true,
    },
    motion: {
      heroParticles: 18,
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
    announcement:
      '这里会继续同步 shijianus 主题的重构进度，优先把首页、侧栏、文章页和基础交互动效做成完整、可长期维护的版本。',
    featureCard: {
      eyebrow: '界面状态',
      title: '继续对齐参考主题的真实手感',
      summary: '这一步优先收口侧栏、footer、首屏进入过渡和卡片交互，再继续处理页面级细节。',
      chips: ['入场动画', '侧栏面板', 'Footer', 'Hover 动效'],
    },
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
    startedAt: '2020-06-01',
    badges: ['Astro', 'React', 'Tailwind', 'TypeScript'],
    quote: '把博客当成长期维护的软件来做。',
    customText: '保持高密度信息、明确反馈和稳定排版，把博客做成真正可生长的内容系统。',
    socialBar: {
      left: [
        { label: 'GitHub', href: 'https://github.com/shijianus', external: true, icon: 'github' },
        { label: '邮箱', href: 'mailto:hello@shijian.us', external: true, icon: 'mail' },
      ] satisfies SiteNavItem[],
      right: [
        { label: '归档', href: '/archives/', icon: 'archive' },
        { label: '标签', href: '/tags/', icon: 'tags' },
      ] satisfies SiteNavItem[],
    },
    runtime: {
      label: '运行状态',
      workLabel: '持续维护中',
      workDetail: 'shijianus 正在同步首页、文章页、页脚与交互动效',
    },
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
          { label: '关于', href: '/about/' },
        ] satisfies SiteNavItem[],
      },
      {
        title: '联系',
        links: [
          { label: 'GitHub', href: 'https://github.com/shijianus', external: true },
          { label: '邮箱', href: 'mailto:hello@shijian.us', external: true },
        ] satisfies SiteNavItem[],
      },
      {
        title: '专题',
        links: [
          { label: '最新文章', href: '/archives/' },
          { label: '设计对齐', href: '/about/' },
          { label: '主题说明', href: '/tags/' },
        ] satisfies SiteNavItem[],
      },
    ],
  },
  post: {
    copyright: {
      badge: '原创',
      title: '转载或引用请保留出处',
      notice:
        '本文属于 shijianus 的长期写作记录。允许分享与引用，但请保留原文链接、作者署名，并避免脱离上下文的片段搬运。',
      copyLabel: '复制链接',
      rewardLabel: '打赏作者',
      rewardNote: '感谢你赐予我继续写下去的动力。',
    },
    related: {
      eyebrow: '相关文章',
      title: '继续阅读',
    },
    comments: {
      title: '评论',
      policyLabel: '隐私政策',
      notice: '你无需删除空行，直接评论即可保留最佳展示效果。',
      submitLabel: '发送',
      previewLabel: '预览',
      emptyTitle: '还没有公开评论',
      emptySummary: '留下第一条反馈，评论会保存在当前浏览器中，方便本地预览评论区外观与交互。',
      tips: ['理性交流', '就事论事', '欢迎补充资料'],
    },
  },
  pages: {
    about: {
      title: '关于我',
      subtitle: '生而热烈 / 写而笃定',
      floatingTagsLeft: ['内容优先创作者', '长期维护者', '体验洁癖'],
      floatingTagsRight: ['构建系统', '前端工程', '写作记录'],
      helloTips: '你好，很高兴认识你',
      helloLead: '我叫 shijianus',
      helloDescription: '学生 / 开发者 / 写作者 / 系统整理者',
      siteTips: {
        tips: '追求',
        titleTop: '源于',
        titleBottom: '热爱而去感受',
        words: ['源于热爱', '敬畏秩序', '持续构建', '写给未来'],
      },
      helloWordmark: 'Hello there!',
      skills: {
        tips: '技能',
        title: '开启创造力',
        items: [
          { label: 'Astro', icon: 'AS', accent: '#5b27ff' },
          { label: 'React', icon: 'RC', accent: '#4fb4ff' },
          { label: 'Tailwind', icon: 'TW', accent: '#22c1c3' },
          { label: 'TypeScript', icon: 'TS', accent: '#2f74ff' },
          { label: 'Node.js', icon: 'ND', accent: '#63b85f' },
          { label: 'MDX', icon: 'MD', accent: '#ffb02e' },
          { label: 'Design', icon: 'UI', accent: '#ff6a88' },
          { label: 'Writing', icon: 'WR', accent: '#6f6bff' },
        ] satisfies AboutSkill[],
      },
      careers: {
        tips: '生涯',
        title: '阶段与长期方向',
        items: [
          { label: '工程化地整理自己的内容系统', accent: '#5b8cff' },
          { label: '把主题做成可维护的产品，而不是一次性页面', accent: '#ff7d55' },
          { label: '建立兼顾速度、阅读感和扩展性的个人博客架构', accent: '#30c48d' },
        ] satisfies AboutCareer[],
      },
      statistics: {
        tips: '数据',
        title: '访问统计',
        buttonLabel: '查看归档',
        buttonHref: '/archives/',
      },
      map: {
        title: '现在住在',
        accent: 'UTC-8',
      },
      selfInfo: [
        { label: '生于', value: '2002', accent: '#43a6c6' },
        { label: '职业方向', value: '软件工程', accent: '#c69043' },
        { label: '当前阶段', value: '大学生', accent: '#b04fe6' },
      ],
      personality: {
        tips: '性格',
        title: 'INFJ / Builder',
        summary: '偏好建立秩序、耐心打磨细节，对长期可维护的系统有天然执念。',
      },
      photoTitle: '工作台',
      maxim: {
        tips: '座右铭',
        top: '生活明朗',
        bottom: '万物可爱。',
      },
      buff: {
        tips: '加成',
        top: '意图明确的构建',
        bottom: '比一次性的热闹更重要',
      },
      game: {
        tips: '正在沉迷',
        title: '构建主题与写作系统',
        summary: '把内容、界面与交互收束成长期可迭代的个人产品。',
      },
      comic: {
        tips: '最近在看',
        title: '关注的主题',
        items: ['接口设计', '阅读体验', '设计系统', '站点性能'],
      },
      likeTech: {
        tips: '偏好',
        title: '高信息密度，不等于高噪音',
        summary: '我更喜欢克制但有手感的界面，愿意花时间把阅读路径和交互反馈都打磨清楚。',
      },
      likeMusic: {
        tips: '另一面',
        title: '在代码与写作之间保持节奏',
        summary: '保持输出，保持记录，保持对细节和秩序的耐心。',
      },
      rewards: [
        { name: 'Astra', amount: '¥66', date: '2026-04-15' },
        { name: 'Noah', amount: '¥32', date: '2026-04-12' },
        { name: 'Luna', amount: '¥21', date: '2026-04-10' },
      ] satisfies AboutReward[],
    },
    categories: {
      title: '分类',
      summary: '把长期主题拆成稳定入口，方便从具体兴趣点快速进入文章流。',
    },
    tags: {
      title: '标签',
      summary: '用更细的关键词把相邻主题串起来，减少信息孤岛。',
    },
    archives: {
      title: '文章总览',
      summary: '按年份集中查看所有记录，把时间感和主题线索保留下来。',
    },
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
