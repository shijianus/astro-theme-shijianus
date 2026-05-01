const siteOrigin = 'https://shijian.us';

export type SiteNavIcon =
  | 'github'
  | 'mail'
  | 'archive'
  | 'tags'
  | 'about'
  | 'home'
  | 'category'
  | 'rss'
  | 'link'
  | 'book'
  | 'message';

export type SiteNavItem = {
  label: string;
  href: string;
  description?: string;
  external?: boolean;
  children?: Array<{
    label: string;
    href: string;
    description?: string;
    external?: boolean;
    icon?: SiteNavIcon;
  }>;
  icon?: SiteNavIcon;
};

export type HomeCategory = {
  label: string;
  description: string;
  href: string;
  accent: 'signal' | 'teal' | 'lime' | 'slate';
  icon: 'boxes' | 'code' | 'book' | 'compass';
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

export type HeroShowcase = {
  eyebrow: string;
  leadTop: string;
  leadBottom: string;
  foot: string;
  hoverHint: string;
  tiles: HeroShowcaseTile[];
};

export type HeroShowcaseTile = {
  label: string;
  short: string;
  accent: 'blue' | 'dark' | 'light' | 'teal' | 'orange' | 'green';
};

export type HeroTopDeck = {
  hoverMonogram: string;
  hoverActionLabel: string;
  hoverActionHint: string;
  primaryCardBadge: string;
  secondaryCardBadge: string;
  toggleLabel: string;
  panelLabel: string;
  panelAction: string;
  panelFootnote: string;
};

export type HomeCategoryRail = {
  homeLabel: string;
  moreLabel: string;
  nextLabel: string;
};

export type HomeAnnouncement = {
  eyebrow: string;
  title: string;
  summary: string;
  href: string;
  linkLabel: string;
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

export type CommentProvider = 'local' | 'cloudflare' | 'giscus' | 'waline' | 'twikoo';

export type RewardChannel = {
  id: string;
  label: string;
  shortLabel: string;
  description: string;
  qrImageSrc: string;
  note?: string;
  priority?: 'primary' | 'secondary' | 'extra';
  gate?: 'direct' | 'spoiler' | 'modal';
  qrHidden?: boolean;
  revealLabel?: string;
  clickNotice?: string;
  clickNoticeTitle?: string;
  availability?: 'always' | 'crypto-eligible-only';
  walletNetwork?: string;
  accent: string;
};

export type RewardRegionId = 'cn' | 'hk' | 'uk';

export type RewardRegion = {
  id: RewardRegionId;
  label: string;
  shortLabel: string;
  description: string;
  ipCountryCodes: string[];
  channels: RewardChannel[];
};

export type SharePlatform = {
  id:
    | 'native'
    | 'copy'
    | 'wechat'
    | 'x'
    | 'facebook'
    | 'threads'
    | 'linkedin'
    | 'telegram'
    | 'reddit'
    | 'weibo'
    | 'qq'
    | 'email';
  label: string;
  shortLabel: string;
  description: string;
  accent: string;
};

export const siteConfig = {
  site: {
    name: 'shijianus',
    title: 'shijianus',
    url: siteOrigin,
    domainLabel: 'shijian.us',
    locale: 'zh-CN',
    description: '用 Astro、React 和 Tailwind 搭建一套高信息密度、重阅读体验、能长期维护的个人博客。',
    author: {
      name: 'shijianus',
      role: '构建者 / 学生 / 通才型实践者',
      motto: '内容优先，结构优先，长期可维护。',
      bio: '记录构建、实验、写作和日常技术判断，把博客做成一个真正能持续生长的内容系统。',
      email: 'hello@shijian.us',
      location: 'UTC-8',
      avatar: '/media/shijianus/avatar.jpg',
      cover: '/media/shijianus/workbench.jpg',
      statusLabel: '持续重构中',
    },
  },
  theme: {
    defaultMode: 'light',
    background: {
      defaultMode: 'daybreak',
      darkMode: 'starfield',
      modes: [
        { id: 'daybreak', label: '晨光背景' },
        { id: 'grid', label: '网格背景' },
        { id: 'starfield', label: '星空背景' },
        { id: 'nebula', label: '星云背景' },
        { id: 'aurora', label: '极光背景' },
        { id: 'clean', label: '纯净背景' },
      ],
    },
    consolePanel: {
      enabled: true,
      defaultOpen: false,
      disabledNotice: '由于当前处于维护与安全审查阶段，我们暂时关闭了控制台下访问网站的权限，请联系管理员。',
    },
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
      pageRevealDurationMs: 980,
    },
  },
  navigation: {
    primary: [
      { label: '首页', href: '/', description: '回到首页', icon: 'home' },
      {
        label: '归档',
        href: '/archives/',
        description: '时间线总览',
        icon: 'archive',
        children: [
          { label: '全部文章', href: '/archives/', description: '时间线总览', icon: 'archive' },
          { label: '主题路线', href: '/roadmap/', description: '尚在整理中的专题入口', icon: 'book' },
          { label: '站点状态', href: '/status/', description: '查看当前重构进度', icon: 'rss' },
        ],
      },
      {
        label: '分类',
        href: '/categories/',
        description: '按主题浏览文章',
        icon: 'category',
        children: [
          { label: '全部分类', href: '/categories/', description: '分类总览与入口', icon: 'category' },
          { label: '系统设计', href: '/categories/系统设计/', description: '架构、契约与配置表面', icon: 'book' },
          { label: '前端工程', href: '/categories/前端工程/', description: 'UI、组件与体验实现', icon: 'home' },
        ],
      },
      {
        label: '标签',
        href: '/tags/',
        description: '关键词索引',
        icon: 'tags',
        children: [
          { label: '全部标签', href: '/tags/', description: '标签索引与聚合入口', icon: 'tags' },
          { label: 'Astro', href: '/tags/astro/', description: 'Astro 相关内容', icon: 'book' },
          { label: '主题重构', href: '/tags/主题重构/', description: '界面与结构重建记录', icon: 'rss' },
        ],
      },
      {
        label: '关于',
        href: '/about/',
        description: '作者与站点说明',
        icon: 'about',
        children: [
          { label: '关于作者', href: '/about/', description: '作者与站点说明', icon: 'about' },
          { label: '实验室', href: '/lab/', description: '界面与功能的试验场', icon: 'book' },
          { label: '友链与社群', href: '/friends/', description: '互链、社群与交流入口', icon: 'link' },
        ],
      },
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
      badge: '主题系统',
      eyebrow: '写作系统 / 持续构建',
      title: '把研究、开发和生活折叠成可读的记录',
      emphasis: '在高信息密度里保留阅读秩序',
      summary:
        '用更稳定的首页结构、交互节奏和作者表达，把数据、组件和配置收束成一套更适合长期维护的 Astro 体系。',
      showcase: {
        eyebrow: 'shijian.us',
        leadTop: '内容优先',
        leadBottom: '界面有序。',
        foot: '内容、结构与交互一起重做',
        hoverHint: '点击快速进入当前推荐文章',
        tiles: [
          { label: 'Astro', short: 'AS', accent: 'light' },
          { label: 'React', short: 'RC', accent: 'blue' },
          { label: 'Tailwind', short: 'TW', accent: 'green' },
          { label: 'Motion', short: 'MT', accent: 'dark' },
          { label: 'TypeScript', short: 'TS', accent: 'light' },
          { label: 'Config', short: 'CF', accent: 'orange' },
        ] satisfies HeroShowcaseTile[],
      } satisfies HeroShowcase,
      topDeck: {
        hoverMonogram: 'SJ',
        hoverActionLabel: '随便逛逛',
        hoverActionHint: '打开当前推荐文章',
        primaryCardBadge: '荐',
        secondaryCardBadge: '文',
        toggleLabel: '更多推荐',
        panelLabel: '本次重构',
        panelAction: '更多推荐',
        panelFootnote: '推荐卡组会在这里继续展开',
      } satisfies HeroTopDeck,
      primaryCta: { label: '开始阅读', href: '/archives/' },
      secondaryCta: { label: '关于主题', href: '/about/' },
      image: '/media/shijianus/hero.jpg',
      imageAlt: '博客首页头图',
      chips: ['Astro 6', 'React 19', 'Tailwind 4', 'Config First'],
      stats: [
        { label: '核心结构', value: 'SSR + Islands', detail: '内容和交互边界清晰' },
        { label: '界面目标', value: '编辑式阅读系统', detail: '首页与文章页持续精修' },
        { label: '演进方向', value: '本地优先 / 可接远端', detail: '数据源后续可替换' },
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
      { label: '系统设计', description: '架构判断与演进记录', href: '/categories/系统设计/', accent: 'signal', icon: 'boxes' },
      { label: '前端工程', description: '界面、组件和体验实现', href: '/categories/前端工程/', accent: 'teal', icon: 'code' },
      { label: '学习笔记', description: '课程、实验与思考', href: '/categories/学习笔记/', accent: 'lime', icon: 'book' },
      { label: '产品观察', description: '工具、写作与产品判断', href: '/categories/产品观察/', accent: 'slate', icon: 'compass' },
    ] satisfies HomeCategory[],
    categoryRail: {
      homeLabel: '首页',
      moreLabel: '更多',
      nextLabel: '向右查看更多分类',
    } satisfies HomeCategoryRail,
    statusCards: [
      { title: '当前阶段', value: 'UI 精修中', detail: '先把首页、文章页和侧栏系统做完整' },
      { title: '实现原则', value: '配置先行', detail: '所有区块都有明确配置入口' },
      { title: '长期方向', value: '随时接远端', detail: '远程数据接入不需要重写模板' },
    ] satisfies HomeStatusCard[],
    announcement: {
      eyebrow: '本次重构',
      title: '先把真正的主题感和交互密度做出来',
      summary:
        '这一步不再停留在“有内容的默认壳子”，而是把头图、导航、卡片、侧栏、按钮反馈、开场过渡和页面层次一起重新做完整。',
      href: '/about/',
      linkLabel: '更多',
    } satisfies HomeAnnouncement,
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
      eyebrow: '最新发布',
      title: '近期更新',
      summary: '保留强结构文章流和明显封面卡片，用更稳定的元信息层次提高扫描效率。',
      pageSize: 6,
    },
  },
  aside: {
    stack: ['Astro', 'React', 'Tailwind', 'MDX', 'Content Collections'],
    announcement:
      '这里会继续同步当前重构进度，优先把首页、侧栏、文章页和基础交互动效做成完整、稳定、可长期维护的版本。',
    featureCard: {
      eyebrow: '界面状态',
      title: '继续打磨真实可用的阅读与交互手感',
      summary: '这一轮优先收口侧栏系统、目录固定、首页分页、控制台按钮和页脚头像，再继续处理页面级细节。',
      chips: ['目录固定', '首页分页', '控制台', '动态头像'],
    },
    telegramWidget: {
      title: 'Telegram',
      subtitle: '加入 chronoral 社群',
      summary: '海外更新、测试通知和小范围交流入口。',
      qrImage: '/media/shijianus/tg-group.jpg',
      href: 'https://t.me/chronoral',
      handle: '@chronoral',
      ctaLabel: '加入',
      backLabel: '扫码加入',
      note: '悬停翻面查看二维码，点击直接跳转 Telegram。',
    },
    notes: [
      '配置先于样式，保证每个模块都能被开关和替换。',
      '首页优先服务阅读，不做空洞品牌页。',
      '交互只在需要时 Hydrate，内容结构保持 Astro 驱动。',
    ],
    status: [
      { title: '主题状态', value: '持续重构中', detail: '共享壳层、首页、文章页同步重做' },
      { title: '界面语气', value: '克制但有手感', detail: '强化作者感，但不牺牲阅读性' },
    ] satisfies HomeStatusCard[],
  },
  footer: {
    since: 2020,
    startedAt: '2020-06-01',
    badges: ['Astro', 'React', 'Tailwind', 'TypeScript', 'MDX'],
    quote: '把博客当成长期维护的软件来做。',
    customText: '保持高密度信息、明确反馈和稳定排版，把博客做成真正可生长的内容系统。',
    miniLogoVideo: '/media/shijianus/avatar-dynamic.mp4',
    socialBar: {
      left: [
        { label: 'GitHub', href: 'https://github.com/shijianus', external: true, icon: 'github' },
        { label: '邮箱', href: 'mailto:hello@shijian.us', external: true, icon: 'mail' },
        { label: '归档', href: '/archives/', icon: 'archive' },
        { label: '标签', href: '/tags/', icon: 'tags' },
      ] satisfies SiteNavItem[],
      right: [
        { label: '关于', href: '/about/', icon: 'about' },
        { label: '首页', href: '/', icon: 'home' },
        { label: '动态', href: '/tags/', icon: 'rss' },
        { label: '链接', href: '/categories/', icon: 'link' },
      ] satisfies SiteNavItem[],
    },
    runtime: {
      label: '运行状态',
      workLabel: '持续维护中',
      workDetail: '目前正在同步打磨首页、文章页、页脚、按钮反馈与交互动效。',
    },
    links: [
      { label: 'GitHub', href: 'https://github.com/shijianus', external: true, icon: 'github' },
      { label: '归档', href: '/archives/', icon: 'archive' },
      { label: '标签', href: '/tags/', icon: 'tags' },
      { label: '关于', href: '/about/', icon: 'about' },
    ] satisfies SiteNavItem[],
    groups: [
      {
        title: '服务',
        links: [
          { label: '首页', href: '/' },
          { label: '归档', href: '/archives/' },
          { label: '分类', href: '/categories/' },
        ] satisfies SiteNavItem[],
      },
      {
        title: '主题',
        links: [
          { label: '设计对齐', href: '/about/' },
          { label: '重构进度', href: '/archives/' },
          { label: '内容系统', href: '/tags/' },
        ] satisfies SiteNavItem[],
      },
      {
        title: '导航',
        links: [
          { label: '最新文章', href: '/archives/' },
          { label: '系统设计', href: '/categories/系统设计/' },
          { label: '前端工程', href: '/categories/前端工程/' },
        ] satisfies SiteNavItem[],
      },
      {
        title: '协议',
        links: [
          { label: '隐私说明', href: '/about/#about-reward' },
          { label: '版权说明', href: '/about/' },
          { label: '使用条款', href: '/tags/' },
        ] satisfies SiteNavItem[],
      },
      {
        title: '友链',
        links: [
          { label: 'Astro', href: 'https://astro.build/', external: true },
          { label: 'Tailwind', href: 'https://tailwindcss.com/', external: true },
          { label: 'React', href: 'https://react.dev/', external: true },
          { label: 'MDN', href: 'https://developer.mozilla.org/', external: true },
        ] satisfies SiteNavItem[],
      },
    ],
  },
  support: {
    reward: {
      title: '打赏作者',
      summary: '文章页和关于页共用同一套地区化打赏配置。当前开放中国大陆、中国香港与英国三个区域，会优先按访问地区、时区与语言画像推荐方式；高风险渠道会先弹窗提醒并按当前环境收紧，加密钱包只会在高置信度的英国访问环境下展示。',
      historyLabel: '查看支持记录',
      historyHref: '/about/#about-reward',
      geoEndpoint: '/api/geo-risk',
      storageKey: 'shijianus-reward-region',
      detect: {
        regionLabel: '打赏地区',
        autoLabel: '按 IP 推荐',
        autoDescription: '将优先根据访问地区、时区和语言环境推荐中国大陆、中国香港或英国区的打赏方式。',
        switchLabel: '切换地区',
        manualDescription: '如果识别到的地区和你的实际情况不一致，可以在右侧手动切换；但跨区渠道与加密钱包仍会按当前环境继续校验。',
        resetLabel: '恢复按 IP 推荐',
        unsupportedTitle: '该地区暂不支援打赏',
        unsupportedDescription: '当前仅开放中国大陆、中国香港与英国三个打赏区。如果你的实际地区在这些范围内，请手动切换。',
        moreChannelsLabel: '展开更多方式',
        lessChannelsLabel: '收起附加方式',
        cryptoBlockedTitle: '当前环境不展示加密钱包',
        cryptoBlockedDescription: '检测到当前网络或设备画像存在地区冲突，已主动关闭 USDT 钱包展示。若你处于中国大陆环境，即使通过海外节点访问，也不会显示该渠道。',
        modalConfirmLabel: '继续查看',
        modalDismissLabel: '暂不显示',
      },
      regions: [
        {
          id: 'cn',
          label: '中国大陆',
          shortLabel: 'CN',
          description: '中国大陆区打赏方式',
          ipCountryCodes: ['CN'],
          channels: [
            {
              id: 'alipay-cn',
              label: 'Alipay CN',
              shortLabel: 'ALI',
              description: '中国大陆默认推荐渠道，适合直接用支付宝扫一扫打赏。',
              qrImageSrc: '/media/shijianus/support/alipay-cn.jpg',
              note: '请使用支付宝扫一扫。',
              priority: 'primary',
              gate: 'direct',
              accent: '#1677ff',
            },
            {
              id: 'weixin-pay-cn',
              label: 'Weixin Pay',
              shortLabel: 'WX',
              description: '中国大陆次选渠道，适合使用微信扫一扫直接打赏。',
              qrImageSrc: '/media/shijianus/support/weixin-pay-cn.jpg',
              note: '请使用微信扫一扫。',
              priority: 'secondary',
              gate: 'direct',
              accent: '#07c160',
            },
            {
              id: 'paypal-cn',
              label: 'PayPal CN',
              shortLabel: 'PP-CN',
              description: '适合需要使用 PayPal 且确认以 CNY 汇款的中国大陆用户。',
              qrImageSrc: '/media/shijianus/support/paypal-cn.jpg',
              note: '点击二维码会显示币种提醒。',
              priority: 'extra',
              gate: 'modal',
              clickNoticeTitle: 'PayPal CN 使用提醒',
              clickNotice:
                '请确定汇款使用的币种是 CNY；如可选择，仍更推荐使用 Alipay。若你准备使用非 CNY 币种，尤其是 HKD 或 GBP，请优先汇款 HKD 至我的中国香港区 PayPal。',
              accent: '#0070ba',
            },
          ] satisfies RewardChannel[],
        },
        {
          id: 'hk',
          label: '中国香港',
          shortLabel: 'HK',
          description: '中国香港区打赏方式',
          ipCountryCodes: ['HK'],
          channels: [
            {
              id: 'alipay-hk',
              label: 'Alipay HK',
              shortLabel: 'ALI-HK',
              description: '中国香港默认推荐渠道，适合使用 Alipay HK 扫码打赏。',
              qrImageSrc: '/media/shijianus/support/alipay-hk.jpg',
              note: '请使用 Alipay HK 扫码。',
              priority: 'primary',
              gate: 'direct',
              accent: '#7b61ff',
            },
            {
              id: 'paypal-hk',
              label: 'PayPal HK',
              shortLabel: 'PP-HK',
              description: '中国香港与跨区支付的主推荐渠道，优先按 HKD 汇款。',
              qrImageSrc: '/media/shijianus/support/paypal-hk.jpg',
              note: '推荐以 HKD 汇款。',
              priority: 'extra',
              gate: 'modal',
              qrHidden: true,
              revealLabel: '点击显示 PayPal HK 二维码',
              clickNoticeTitle: 'PayPal HK 使用提醒',
              clickNotice: '建议优先选择 HKD 汇款；若你的钱包或银行卡会产生跨币种手续费，建议在付款前先确认换汇与手续费规则。',
              accent: '#003087',
            },
            {
              id: 'wechat-pay-hk',
              label: 'WeChat Pay HK',
              shortLabel: 'WX-HK',
              description: '中国香港次选渠道，适合使用 WeChat Pay HK 扫码。',
              qrImageSrc: '/media/shijianus/support/wechat-pay-hk.jpg',
              note: '请使用 WeChat Pay HK 扫码。',
              priority: 'secondary',
              gate: 'direct',
              accent: '#00c26f',
            },
          ] satisfies RewardChannel[],
        },
        {
          id: 'uk',
          label: '英国',
          shortLabel: 'UK',
          description: '英国区与国际支付方式',
          ipCountryCodes: ['GB'],
          channels: [
            {
              id: 'paypal-hk-uk',
              label: 'PayPal HK',
              shortLabel: 'PP-HK',
              description: '英国区默认推荐渠道，优先使用中国香港区 PayPal 汇款，通常比部分跨区路径更稳。',
              qrImageSrc: '/media/shijianus/support/paypal-hk.jpg',
              note: '建议优先使用 HKD 汇款。',
              priority: 'primary',
              gate: 'modal',
              qrHidden: true,
              revealLabel: '点击显示 PayPal HK 二维码',
              clickNoticeTitle: 'PayPal HK 使用提醒',
              clickNotice: '若你位于英国或欧洲，建议先确认 PayPal 的换汇成本；当 GBP 费率不理想时，可以优先使用 HKD 汇款到 PayPal HK。',
              accent: '#003087',
            },
            {
              id: 'paypal-uk',
              label: 'PayPal UK',
              shortLabel: 'PP-UK',
              description: '英国本地渠道，适合已经确认要使用 GBP 的用户。',
              qrImageSrc: '/media/shijianus/support/paypal-uk.jpg',
              note: '如果跨区付款手续费较高，建议改用中国香港区 PayPal 并以 HKD 汇款。',
              priority: 'extra',
              gate: 'modal',
              qrHidden: true,
              revealLabel: '点击显示 PayPal UK 二维码',
              clickNoticeTitle: 'PayPal UK 使用提醒',
              clickNotice: '如果付款方或收款方的换汇成本偏高，建议退回 PayPal HK 路径；此渠道更适合明确需要使用 GBP 的场景。',
              accent: '#012169',
            },
            {
              id: 'trustwallet-usdt',
              label: 'Trust Wallet / USDT',
              shortLabel: 'USDT',
              description: '仅在高置信度的非中国大陆访问环境下显示，用于加密货币打赏。',
              qrImageSrc: '/media/shijianus/support/trust-wallet.jpg',
              note: '仅支持在确认网络与币种后继续。',
              priority: 'extra',
              gate: 'modal',
              qrHidden: true,
              revealLabel: '点击显示 USDT 钱包地址',
              clickNoticeTitle: 'USDT 钱包使用提醒',
              clickNotice: '继续前请确认你使用的是正确的链路与网络，建议仅在你完全理解转账不可逆、手续费和币种风险时再继续。',
              availability: 'crypto-eligible-only',
              walletNetwork: 'USDT',
              accent: '#18c58f',
            },
          ] satisfies RewardChannel[],
        },
      ] satisfies RewardRegion[],
    },
    share: {
      title: '分享这篇文章',
      summary: '保留系统分享，同时补齐国际平台和本地平台的显式分享入口。',
      qrcodeLabel: '扫码分享',
      qrcodeDescription: '使用手机扫码，直接在另一台设备上打开当前页面。',
      platforms: [
        { id: 'native', label: '系统分享', shortLabel: 'SYS', description: '唤起系统分享面板', accent: '#425AEF' },
        { id: 'copy', label: '复制链接', shortLabel: 'COPY', description: '复制当前文章链接', accent: '#111827' },
        { id: 'wechat', label: '二维码', shortLabel: 'QR', description: '通过二维码在移动端继续阅读', accent: '#07c160' },
        { id: 'x', label: 'X', shortLabel: 'X', description: '分享到 X', accent: '#111111' },
        { id: 'facebook', label: 'Facebook', shortLabel: 'FB', description: '分享到 Facebook', accent: '#1877f2' },
        { id: 'threads', label: 'Threads', shortLabel: 'TH', description: '分享到 Threads', accent: '#101010' },
        { id: 'linkedin', label: 'LinkedIn', shortLabel: 'IN', description: '分享到 LinkedIn', accent: '#0a66c2' },
        { id: 'telegram', label: 'Telegram', shortLabel: 'TG', description: '分享到 Telegram', accent: '#229ed9' },
        { id: 'reddit', label: 'Reddit', shortLabel: 'RD', description: '分享到 Reddit', accent: '#ff4500' },
        { id: 'weibo', label: 'Weibo', shortLabel: 'WB', description: '分享到微博', accent: '#e6162d' },
        { id: 'qq', label: 'QQ', shortLabel: 'QQ', description: '分享到 QQ', accent: '#12b7f5' },
        { id: 'email', label: '邮件', shortLabel: 'MAIL', description: '通过邮件分享', accent: '#7c3aed' },
      ] satisfies SharePlatform[],
    },
  },
  post: {
    hero: {
      detectOriginalTag: true,
      maxTags: 10,
      runtimeMetrics: true,
      fallbackImage: '/media/shijianus/default-cover.jpg',
      summaryFallback: '文章头图、标签和元信息会从 Markdown 自动扫描，小字部分按模板规则收束展示。',
      metaLabels: {
        published: '发表于',
        updated: '更新于',
        category: '分类',
        words: '字数',
        reading: '阅读',
        views: '浏览',
        dwell: '停留',
      },
    },
    tools: {
      aboutTitle: '关于说明',
      modeLabel: '运营模式与责任',
      modeHref: '/about/',
      modeDescription: '这篇文章按长期维护内容来处理，分享、转载和支持入口都统一收口，便于后续持续更新。',
      shareLabel: '分享文章',
      rewardHref: '/about/#about-reward',
      rewardDescription: '如果这篇文章对你有帮助，可以直接使用二维码支持入口，或把它分享到你正在使用的平台。',
      copyDoneLabel: '链接已复制',
      shareDoneLabel: '已唤起系统分享',
      shareFallbackLabel: '当前环境不支持系统分享，已回退为复制链接',
    },
    copyright: {
      badge: '原创',
      title: '转载或引用请保留出处',
      notice:
        '本文属于长期维护中的写作记录。允许分享与引用，但请保留原文链接、作者署名，并避免脱离上下文的片段搬运。',
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
      emptySummary: '留下第一条反馈后，评论会直接出现在下方的公开评论流中。',
      tips: ['理性交流', '就事论事', '欢迎补充资料'],
      accountTitle: '账号中心',
      accountSummary: '头像、昵称、提醒和评论身份都统一收在独立账号面板里，文章页只保留输入区和公开评论流。',
      disabledNotice: '当前没有接入外部评论数据库，账号面板仍可保存本地身份，后续接入远端后会自动复用。',
      loginHint: '未登录时评论输入会保持灰色锁定，点击后会提示你先创建一个本地账号。',
    },
  },
  pages: {
    about: {
      title: '关于我',
      subtitle: '生而热烈 / 写而笃定',
      floatingTagsLeft: ['内容优先创作者', '长期维护者', '体验洁癖'],
      floatingTagsRight: ['构建系统', '前端工程', '写作记录'],
      helloTips: '你好，很高兴认识你',
      helloLead: '你好，我在这里写作与构建',
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
    comments: {
      provider: 'local' as CommentProvider,
      fallback: 'local' as CommentProvider,
      cloudflare: {
        apiBase: '/api/comments',
      },
      giscus: {
        repo: '',
        repoId: '',
        category: '',
        categoryId: '',
        mapping: 'pathname',
        theme: 'light',
      },
      waline: {
        serverURL: '',
        lang: 'zh-CN',
        pageSize: 10,
      },
      twikoo: {
        envId: '',
        region: '',
        lang: 'zh-CN',
      },
    },
  },
} as const;

export type SiteConfig = typeof siteConfig;
