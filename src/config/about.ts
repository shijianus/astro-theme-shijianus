/**
 * About Page Configuration & Multi-Language Dictionary
 * 
 * 关于页全量配置与多语言字典
 * 用户可在此文件中自由修改关于页的任意内容，并配置对应的 i18n 多语言翻译 (en / fr / es / de)。
 */

export type AboutSkill = {
  label: string;
  icon: string;
  accent: string;
};

export type AboutCareer = {
  label: string;
  accent: string;
};

export type AboutGearItem = {
  name: string;
  desc: string;
  icon: string;
  badge?: string;
};

export type AboutManifestoPillar = {
  title: string;
  desc: string;
  tag: string;
  icon: string;
};

export type AboutTrait = {
  label: string;
  value: number;
  desc: string;
};

export type AboutConnectItem = {
  label: string;
  href: string;
  desc: string;
  icon: string;
};

export type AboutSelfInfo = {
  label: string;
  value: string;
  accent: string;
};

export type AboutTopologyItem = {
  name: string;
  role: string;
  color: 'blue' | 'green' | 'purple';
};

export type AboutTopologyTier = {
  num: string;
  title: string;
  subtitle: string;
  items: AboutTopologyItem[];
};

export type AboutMilestoneItem = {
  year: string;
  tag: string;
  title: string;
  desc: string;
  dotClass?: string;
  hasLine?: boolean;
  yearClass?: string;
  tagClass?: string;
};

export interface AboutConfig {
  title: string;
  subtitle: string;
  floatingTagsLeft: string[];
  floatingTagsRight: string[];
  onlineStatus: string;
  helloTips: string;
  helloLead: string;
  helloDescription: string;
  helloWordmark: string;
  helloChips: string[];
  siteTips: {
    tips: string;
    titleTop: string;
    titleBottom: string;
    words: string[];
    lead: string;
  };
  skills: {
    tips: string;
    title: string;
    items: AboutSkill[];
  };
  careers: {
    tips: string;
    title: string;
    items: AboutCareer[];
  };
  statistics: {
    tips: string;
    title: string;
    buttonLabel: string;
    buttonHref: string;
    items: {
      posts: string;
      categories: string;
      tags: string;
      readingMinutes: string;
    };
  };
  map: {
    title: string;
    accent: string;
    liveStatus: string;
  };
  selfInfo: AboutSelfInfo[];
  personality: {
    tips: string;
    type: string;
    title: string;
    summary: string;
    link: string;
    traits: AboutTrait[];
  };
  photoTitle: string;
  photoOverlay: string;
  gear: {
    tips: string;
    title: string;
    hardwareTips: string;
    hardwareTitle: string;
    hardwareDesc: string;
    hardware: AboutGearItem[];
    softwareTips: string;
    softwareTitle: string;
    softwareDesc: string;
    software: AboutGearItem[];
  };
  manifesto: {
    tips: string;
    title: string;
    subtitle: string;
    pillars: AboutManifestoPillar[];
  };
  topology: {
    tips: string;
    title: string;
    lead: string;
    tiers: AboutTopologyTier[];
  };
  soundtrack: {
    tips: string;
    title: string;
    summary: string;
    song: string;
    artist: string;
    cover: string;
  };
  game: {
    tips: string;
    title: string;
    summary: string;
  };
  comic: {
    tips: string;
    title: string;
    items: string[];
  };
  likeTech?: {
    tips: string;
    title: string;
    summary: string;
  };
  likeMusic?: {
    tips: string;
    title: string;
    summary: string;
  };
  rewards?: {
    name: string;
    amount: string;
    date: string;
  }[];
  milestones: {
    tips: string;
    title: string;
    lead: string;
    items: AboutMilestoneItem[];
  };
  maxim: {
    tips: string;
    top: string;
    bottom: string;
    annotation: string;
  };
  buff: {
    tips: string;
    top: string;
    bottom: string;
  };
  connect: {
    tips: string;
    title: string;
    summary: string;
    items: AboutConnectItem[];
  };
}

/**
 * 关于页主体内容配置
 */
export const aboutConfig: AboutConfig = {
  title: '关于我',
  subtitle: '厚土潜藏细脉 · 大荒广构通衢',
  floatingTagsLeft: ['00后大学生', '计算机在读', '体验洁癖'],
  floatingTagsRight: ['开源求索', '长效构建', '数字花园'],
  onlineStatus: '当前在线 · 持续构建中',
  helloTips: '你好，很高兴认识你',
  helloLead: '你好，我在这里写作与构建',
  helloDescription: '00后在读大学生 · Web 全栈初探者 · 数字花园建造者',
  helloWordmark: 'Hello there!',
  helloChips: ['#Astro', '#TypeScript', '#Tailwind', '#Cloudflare', '#UI/UX', '#系统架构', '#数据主权'],
  siteTips: {
    tips: '基调',
    titleTop: '深耕',
    titleBottom: '厚土潜藏细脉',
    words: ['潜藏细脉', '广构通衢', '敬畏秩序', '长效沉淀'],
    lead: '深潜底层打磨隐秘细脉，拓越远方构筑长效通衢。在信息快餐与算法喧嚣的时代，为你我保留一处专注慢思考、深度阅读与自由构建的数字静地。',
  },
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
    ],
  },
  careers: {
    tips: '求索',
    title: '阶段与长期方向',
    items: [
      { label: '在大学本科阶段踏实打好计算机与工程基础', accent: '#5b8cff' },
      { label: '把个人主页打磨成长效可演进的数字花园，而非一次性产物', accent: '#ff7d55' },
      { label: '探索 Web 全栈、现代设计系统与人机协同的融合实践', accent: '#30c48d' },
    ],
  },
  statistics: {
    tips: '数据',
    title: '访问统计',
    buttonLabel: '查看归档',
    buttonHref: '/archives/',
    items: {
      posts: '文章总量',
      categories: '专题分类',
      tags: '知识标签',
      readingMinutes: '阅读分钟',
    },
  },
  map: {
    title: '现在住在',
    accent: '中国 · 太平洋时区 (UTC-8)',
    liveStatus: '灵感涌现 · 持续构建中',
  },
  selfInfo: [
    { label: '生于', value: '2006 (大二在读)', accent: '#43a6c6' },
    { label: '城市', value: '中国 · 校园与自习室', accent: '#3b82f6' },
    { label: '阶段', value: '在读大学生', accent: '#b04fe6' },
    { label: '方向', value: 'Web 全栈求索', accent: '#c69043' },
  ],
  personality: {
    tips: '性格',
    type: 'INFJ-A',
    title: '提倡者 / 架构思考者',
    summary: '偏好建立秩序、耐心打磨细节，对长期可维护的系统与极致体验有天然执念。',
    link: 'https://www.16personalities.com/ch/infj-%E4%BA%BA%E6%A0%BC',
    traits: [
      { label: '专注深度 (Introverted)', value: 82, desc: '偏好独处构思与深度心流' },
      { label: '直觉远见 (Intuitive)', value: 86, desc: '洞察系统全貌与长远演进' },
      { label: '人文感受 (Feeling)', value: 74, desc: '关注使用者体验与情感共鸣' },
      { label: '秩序判断 (Judging)', value: 90, desc: '严苛自律、追求清晰与条理' },
      { label: '坚定果决 (Assertive)', value: 78, desc: '从容自信、笃定落实每一行代码' },
    ],
  },
  photoTitle: '工作台',
  photoOverlay: 'Clean Desk, Clear Mind · 工作台一角',
  gear: {
    tips: '实用装备',
    title: '日常学习与开发伙伴',
    hardwareTips: '实用装备 / Gear',
    hardwareTitle: '日常学习与开发伙伴',
    hardwareDesc: '工欲善其事，实用当先。用高性价比的平价设备，在自习室与宿舍搭建专注写码的轻量桌面。',
    hardware: [
      { name: '联想小新 Pro / 拯救者便携本', desc: '自习室与寝室主力 · 陪我熬夜跑实验写代码的高性价比伙伴', icon: 'laptop', badge: 'Daily' },
      { name: '红米 / AOC 24寸 护眼显示屏', desc: '桌面副屏扩展 · 平价实用，双屏分屏查文档编码更专注', icon: 'monitor' },
      { name: '国产客制化红轴机械键盘', desc: '轻柔静音 · 宿舍不扰室友，长时间打字指尖轻快舒适', icon: 'keyboard' },
      { name: '实用入耳式降噪耳机', desc: '自习防线 · 图书馆与宿舍里隔绝杂音、开启心流沉浸', icon: 'headphones' },
    ],
    softwareTips: '实用工具 / Software',
    softwareTitle: '学习与开发工作流',
    softwareDesc: '轻量敏捷、注重实效。用好基础开源与免费工具，满足日常求索与写码需求。',
    software: [
      { name: 'VS Code & 终端', desc: '代码编写与调试 · 课业实验与个人博客维护主力', icon: 'code', badge: 'Editor' },
      { name: 'Obsidian / Markdown', desc: '知识沉淀与课程笔记 · 构建双向链接的个人知识库', icon: 'zap' },
      { name: 'Chrome / Edge DevTools', desc: '前端调试与查阅文档 · 边看文档边排查样式布局', icon: 'figma' },
      { name: 'Cloudflare Pages & GitHub', desc: '自动化部署与版本控制 · 零成本托管个人数字花园', icon: 'cloud', badge: 'Cloud' },
    ],
  },
  manifesto: {
    tips: '造物初心',
    title: '在算法喧嚣的时代，构筑一座属于自己的数字花园。',
    subtitle: '不迎合瞬息万变的快餐式流量，用代码与文字沉淀可穿越周期的长效价值。',
    pillars: [
      {
        title: '数据主权与自由表达',
        desc: '不为算法推荐妥协，不被商业平台锁定。把每一次技术探索、深度思考与真实试错完整归档在自己的领地上。',
        tag: 'Sovereignty',
        icon: 'shield',
      },
      {
        title: '慢思考与长效价值',
        desc: '拒绝碎片化浮躁。以系统化、结构化的长文记录解决真实技术痛点的轨迹，让知识随时间复利持续增值。',
        tag: 'Longevity',
        icon: 'feather',
      },
      {
        title: '数字工匠精神',
        desc: '代码架构、字距留白、色彩平衡与微交互，处处皆是作品。追求极致的前端性能与符合人体感官的美学舒适。',
        tag: 'Craftsmanship',
        icon: 'hammer',
      },
    ],
  },
  topology: {
    tips: '系统架构 / Architecture Topology',
    title: '全栈工程架构与云端底座',
    lead: '从浏览器感知交互、排版编译管道到底层全球分布式边缘运算的全链路技术选型。',
    tiers: [
      {
        num: '01',
        title: '感知交互层',
        subtitle: 'Client & UX Tier',
        items: [
          { name: 'Astro 6', role: 'Islands 极速渲染', color: 'blue' },
          { name: 'React 19', role: '动态交互状态岛', color: 'blue' },
          { name: 'TypeScript', role: '全链路类型守卫', color: 'blue' },
          { name: 'Tailwind CSS', role: '现代原子设计系统', color: 'blue' },
        ],
      },
      {
        num: '02',
        title: '排版编译管道',
        subtitle: 'Content Engine',
        items: [
          { name: 'MDX & Shiki', role: '双主题自适应高亮', color: 'green' },
          { name: 'KaTeX Math', role: '严谨科学公式排版', color: 'green' },
          { name: 'Mermaid 图谱', role: '知识拓扑可视化', color: 'green' },
          { name: 'i18n 多语言', role: '多语种语义分块转译', color: 'green' },
        ],
      },
      {
        num: '03',
        title: '分布式边缘底座',
        subtitle: 'Edge & Cloud',
        items: [
          { name: 'Cloudflare Pages', role: '全球 Anycast 边缘', color: 'purple' },
          { name: 'Cloudflare D1', role: '边缘分布式 SQLite', color: 'purple' },
          { name: 'Workers Serverless', role: '零冷启动轻量路由', color: 'purple' },
          { name: 'GitOps 流水线', role: '多远端双向自动同步', color: 'purple' },
        ],
      },
    ],
  },
  soundtrack: {
    tips: '灵感音轨',
    title: '在旋律与代码间寻得心流',
    summary: '敲下代码时，音乐是最好的白噪音；文字流淌时，旋律是心流的节拍器。在旋律与思考中保持节奏。',
    song: 'Way Back Home / 彼女は旅に出る',
    artist: 'Scop · SHAUN · 悠扬日常',
    cover: '/media/audio/covers/way_back_home.jpg',
  },
  game: {
    tips: '沉浸热爱',
    title: '数字造物与极客实验',
    summary: '把内容、界面与交互收束成真正能穿越周期的个人作品。',
  },
  comic: {
    tips: '关注的主题',
    title: '关注的主题',
    items: ['系统架构', '设计系统', '阅读体验', '人机协同'],
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
  ],
  milestones: {
    tips: '演进足迹 / Milestones',
    title: '站点演进与造物足迹',
    lead: '从一行简单的 Markdown，到高度工程化、全球边缘化分发的内容产品演进史。',
    items: [
      {
        year: '2006',
        tag: '始于盛夏 (Origins)',
        title: '出生于 2006 年',
        desc: '出生于 2006 年盛夏，与现代互联网和开源浪潮共同成长，对未知世界充满好奇与求知欲。',
        dotClass: '',
        hasLine: true,
      },
      {
        year: '2022',
        tag: '初探代码 (First Code)',
        title: '敲下第一行 Hello World',
        desc: '高中偶然接触编程，被代码创造数字界面的奇妙深深吸引，确立了拒绝快餐化、保持长期沉淀的创作基调。',
        dotClass: '',
        hasLine: true,
      },
      {
        year: '2024',
        tag: '步入大学 (Campus Journey)',
        title: '开启计算机专业求学历程',
        desc: '成为一名在读大学生，在自习室与宿舍搭建个人独立博客，重构为现代前端工程架构，确立产品级维护标准。',
        dotClass: '',
        hasLine: true,
      },
      {
        year: '2026',
        tag: '旗舰成型 (Flagship Maturity)',
        title: '自研 Shijianus 旗舰主题与边缘原生底座',
        desc: '深度集成 Cloudflare D1 边缘原生留言系统、国际多币种收银台、多语言自动流水线与端到端自动化测试，达到工业级水准。',
        dotClass: '',
        tagClass: 'current-tag',
        hasLine: true,
      },
      {
        year: '未来',
        tag: '持续演进 (Continuous Evolution)',
        title: '构筑跨越时空的知识通衢',
        desc: '践行“厚土潜藏细脉，大荒广构通衢”之志，在系统架构、数字交互与人机智能协同创作的前沿持续深耕。',
        dotClass: 'future-dot',
        yearClass: 'future-year',
        tagClass: 'future-tag',
        hasLine: false,
      },
    ],
  },
  maxim: {
    tips: '座右铭',
    top: '厚土潜藏细脉',
    bottom: '大荒广构通衢',
    annotation: '深潜底层打磨隐秘细脉，拓越远方构筑长效通衢。',
  },
  buff: {
    tips: '加成',
    top: '意图明确的构建',
    bottom: '比一次性的热闹更重要',
  },
  connect: {
    tips: '保持连接',
    title: '与志同道合者同行',
    summary: '无论你想探讨前端工程、系统架构，还是交流写作体验与设计思考，欢迎随时与我连接。',
    items: [
      { label: 'GitHub', href: 'https://github.com/shijianus', desc: '查看开源项目与构建足迹', icon: 'github' },
      { label: 'Telegram', href: 'https://t.me/chronoral', desc: '日常交流与即时互动探讨', icon: 'telegram' },
      { label: 'RSS 订阅', href: '/rss.xml', desc: '通过现代阅读器第一时间获知更新', icon: 'rss' },
      { label: '邮件信箱', href: 'mailto:contact@epocanvas.com', desc: '欢迎深度长信交流探讨', icon: 'mail' },
    ],
  },
};

export type TranslationDict = Record<'en' | 'fr' | 'es' | 'de', string>;

/**
 * 关于页全量词条的多语言翻译字典
 * 用户在此修改或添加自定义文字的英文、法语、西班牙语、德语对应翻译。
 */
export const aboutI18nDictionary: Record<string, TranslationDict> = {
  // 1. 作者与身份在不同语境下的名字本地化映射 (Kevin Sparks / Léon Boven)
  'shijianus (時間)': { en: 'Kevin Sparks', fr: 'Léon Boven', es: 'Kevin Sparks', de: 'Kevin Sparks' },
  '時間': { en: 'Kevin Sparks', fr: 'Léon Boven', es: 'Kevin Sparks', de: 'Kevin Sparks' },
  '(時間)': { en: '', fr: '', es: '', de: '' },
  ' (時間)': { en: '', fr: '', es: '', de: '' },
  '我叫': { en: "I'm", fr: "Je m'appelle", es: 'Soy', de: 'Ich heiße' },
  'shijianus': { en: 'Kevin Sparks', fr: 'Léon Boven', es: 'Kevin Sparks', de: 'Kevin Sparks' },
  '我叫 shijianus (時間)': { en: "I'm Kevin Sparks", fr: "Je m'appelle Léon Boven", es: "Soy Kevin Sparks", de: "Ich heiße Kevin Sparks" },
  '00后在读大学生 · Web 全栈初探者 · 数字花园建造者': {
    en: 'Undergraduate (b. 2006) · Web Explorer · Digital Gardener',
    fr: 'Étudiant (né en 2006) · Explorateur Web · Jardinier numérique',
    es: 'Estudiante (nacido en 2006) · Explorador Web · Jardinero digital',
    de: 'Student (geb. 2006) · Web-Entdecker · Digitaler Gärtner',
  },
  '00后在读大学生': { en: 'Undergraduate (b. 2006)', fr: 'Étudiant (né en 2006)', es: 'Estudiante universitario', de: 'Student' },
  '00后大学生': { en: 'Undergraduate (b. 2006)', fr: 'Étudiant (né en 2006)', es: 'Estudiante universitario', de: 'Student' },
  '计算机在读': { en: 'CS Student', fr: 'Étudiant en informatique', es: 'Estudiante de informática', de: 'Informatik-Student' },
  '计算机专业': { en: 'Computer Science', fr: 'Informatique', es: 'Ciencias de la computación', de: 'Informatik' },
  '在读大学生': { en: 'Undergraduate Student', fr: 'Étudiant universitaire', es: 'Estudiante universitario', de: 'Student' },
  '体验洁癖': { en: 'UX Perfectionist', fr: 'Perfectionniste UX', es: 'Obsesión por UX', de: 'UX-Perfektionist' },
  '开源求索': { en: 'Open Source', fr: 'Open Source', es: 'Código abierto', de: 'Open Source' },
  '长效构建': { en: 'Long-term Building', fr: 'Construction durable', es: 'Construcción a largo plazo', de: 'Langfristiger Aufbau' },
  '数字花园': { en: 'Digital Garden', fr: 'Jardin numérique', es: 'Jardín digital', de: 'Digitaler Garten' },
  '当前在线 · 持续构建中': { en: 'Online · Actively Building', fr: 'En ligne · En construction continue', es: 'En línea · Construyendo activamente', de: 'Online · Aktiv am Bauen' },
  '你好，很高兴认识你': { en: 'Hello, nice to meet you', fr: 'Bonjour, ravi de vous rencontrer', es: 'Hola, encantado de conocerte', de: 'Hallo, schön dich kennenzulernen' },
  '你好，我在这里写作与构建': { en: 'Hello, I write and build here', fr: "Bonjour, j'écris et je conçois ici", es: 'Hola, aquí escribo y construyo', de: 'Hallo, hier schreibe und baue ich' },
  '#系统架构': { en: '#System Architecture', fr: '#Architecture Système', es: '#Arquitectura de Sistemas', de: '#Systemarchitektur' },
  '#数据主权': { en: '#Data Sovereignty', fr: '#Souveraineté des Données', es: '#Soberanía de Datos', de: '#Datensouveränität' },

  // 2. 基调与座右铭
  '关于我': { en: 'About Me', fr: 'À propos de moi', es: 'Sobre mí', de: 'Über mich' },
  '厚土潜藏细脉 · 大荒广构通衢': {
    en: 'Nurture deep roots quietly · Build broad paths forward',
    fr: "Enracinement discret · Voies larges vers l'avenir",
    es: 'Echar raíces en silencio · Construir amplios caminos',
    de: 'Wurzeln im Verborgenen schlagen · Breite Wege bauen',
  },
  '厚土潜藏细脉 大荒广构通衢': {
    en: 'Nurture deep roots quietly · Build broad paths forward',
    fr: "Enracinement discret · Voies larges vers l'avenir",
    es: 'Echar raíces en silencio · Construir amplios caminos',
    de: 'Wurzeln im Verborgenen schlagen · Breite Wege bauen',
  },
  '厚土潜藏细脉': { en: 'Nurture Deep Roots Quietly', fr: 'Enracinement Discret', es: 'Echar raíces en silencio', de: 'Wurzeln im Verborgenen' },
  '大荒广构通衢': { en: 'Build Broad Paths Forward', fr: "Voies Larges Vers l'Avenir", es: 'Construir amplios caminos', de: 'Breite Wege bauen' },
  '潜藏细脉': { en: 'Hidden Roots', fr: 'Racines Discrètes', es: 'Raíces discretas', de: 'Verborgene Wurzeln' },
  '广构通衢': { en: 'Broad Pathways', fr: 'Voies Ouvertes', es: 'Caminos abiertos', de: 'Weite Wege' },
  '敬畏秩序': { en: 'Respect for Order', fr: "Respect de l'Ordre", es: 'Respeto por el orden', de: 'Respekt vor Ordnung' },
  '长效沉淀': { en: 'Enduring Value', fr: 'Valeur Durable', es: 'Valor duradero', de: 'Dauerhafter Wert' },
  '基调': { en: 'Essence', fr: 'Tonalité', es: 'Esencia', de: 'Grundton' },
  '深耕': { en: 'Cultivation', fr: 'Culture Profonde', es: 'Cultivo profundo', de: 'Vertiefung' },
  '深潜底层打磨隐秘细脉，拓越远方构筑长效通衢。': {
    en: 'Delve into quiet fundamentals to connect distant horizons.',
    fr: 'Forger des bases solides pour ouvrir de vastes horizons.',
    es: 'Profundizar en lo esencial para alcanzar nuevos horizontes.',
    de: 'Solide Grundlagen schaffen, um weite Horizonte zu erreichen.',
  },
  '深潜底层打磨隐秘细脉，拓越远方构筑长效通衢。在信息快餐与算法喧嚣的时代，为你我保留一处专注慢思考、深度阅读与自由构建的数字静地。': {
    en: 'Delving into quiet fundamentals to connect distant horizons. Reserving a tranquil corner for deep thinking, focused reading, and continuous building amidst algorithmic noise.',
    fr: 'Forger des bases solides pour ouvrir de vastes horizons. Préserver un espace paisible pour la réflexion lente, la lecture attentive et la création libre.',
    es: 'Profundizar en lo esencial para alcanzar nuevos horizontes. Un rincón sereno para pensar, leer y crear con calma.',
    de: 'Solide Grundlagen schaffen, um weite Horizonte zu erreichen. Ein ruhiger Ort für konzentriertes Nachdenken und freies Schaffen.',
  },

  // 3. 技能与求索生涯
  '技能': { en: 'Skills', fr: 'Compétences', es: 'Habilidades', de: 'Fähigkeiten' },
  '开启创造力': { en: 'Unlocking Creativity', fr: 'Libérer la créativité', es: 'Desbloquear la creatividad', de: 'Kreativität freisetzen' },
  '正在求索与打磨的技术栈': { en: 'Tech Stack in Active Practice', fr: 'Technologies en cours de pratique', es: 'Tecnologías en práctica', de: 'Praktizierte Technologien' },
  '求索': { en: 'Aspirations', fr: 'Aspirations', es: 'Aspiraciones', de: 'Bestrebungen' },
  '阶段与长期方向': { en: 'Current Stage & Long-Term Direction', fr: 'Étape actuelle & Orientation à long terme', es: 'Etapa actual y dirección a largo plazo', de: 'Aktuelle Phase & Langfristige Richtung' },
  '在大学本科阶段踏实打好计算机与工程基础': {
    en: 'Build solid computer science and engineering foundations during undergraduate studies',
    fr: 'Bâtir de solides bases en informatique et en ingénierie durant le cursus universitaire',
    es: 'Construir una base sólida de informática e ingeniería durante el grado',
    de: 'Solide Grundlagen in Informatik und Ingenieurwesen im Bachelorstudium erarbeiten',
  },
  '把个人主页打磨成长效可演进的数字花园，而非一次性产物': {
    en: 'Cultivate this personal site as a living, enduring digital garden rather than a disposable project',
    fr: 'Faire évoluer ce site personnel comme un jardin numérique durable plutôt qu un produit éphémère',
    es: 'Desarrollar este sitio como un jardín digital duradero y no como un producto desechable',
    de: 'Diese Website als langlebigen digitalen Garten statt als Einwegprojekt pflegen',
  },
  '探索 Web 全栈、现代设计系统与人机协同的融合实践': {
    en: 'Explore web full-stack development, modern design systems, and human-AI synergy',
    fr: 'Explorer le développement web full-stack, les systèmes de design et la synergie humain-IA',
    es: 'Explorar desarrollo web full-stack, sistemas de diseño y sinergia humano-IA',
    de: 'Web-Full-Stack-Entwicklung, Designsysteme und Mensch-KI-Synergien erforschen',
  },

  // 4. 数据统计与地图
  '数据': { en: 'Metrics', fr: 'Données', es: 'Datos', de: 'Daten' },
  '访问统计': { en: 'Blog Statistics', fr: 'Statistiques du Blog', es: 'Estadísticas del Blog', de: 'Blog-Statistiken' },
  '持续生长的博客足迹': { en: 'Blog Footprint & Growth', fr: 'Statistiques et Croissance', es: 'Huella y crecimiento del blog', de: 'Blog-Wachstum und Verlauf' },
  '文章总量': { en: 'Total Posts', fr: 'Articles Totaux', es: 'Artículos Totales', de: 'Artikel Gesamt' },
  '专题分类': { en: 'Categories', fr: 'Catégories', es: 'Categorías', de: 'Kategorien' },
  '知识标签': { en: 'Tags', fr: 'Étiquettes', es: 'Etiquetas', de: 'Schlagwörter' },
  '阅读分钟': { en: 'Reading Mins', fr: 'Minutes de Lecture', es: 'Minutos de Lectura', de: 'Lese-Minuten' },
  '查看归档': { en: 'View Archives', fr: 'Voir les archives', es: 'Ver archivos', de: 'Archiv ansehen' },
  '查看归档 →': { en: 'View Archives →', fr: 'Voir les archives →', es: 'Ver archivos →', de: 'Archiv ansehen →' },
  '探索全部文章': { en: 'Explore All Posts', fr: 'Explorer tous les articles', es: 'Explorar todos los artículos', de: 'Alle Artikel erkunden' },
  '现在住在': { en: 'Currently Living In', fr: 'Réside actuellement', es: 'Viviendo actualmente en', de: 'Aktueller Wohnort' },
  '目前生活在': { en: 'Currently Living In', fr: 'Réside actuellement', es: 'Viviendo actualmente en', de: 'Aktueller Wohnort' },
  '中国 · 太平洋时区 (UTC-8)': { en: 'China · Pacific Time (UTC-8)', fr: 'Chine · Heure du Pacifique (UTC-8)', es: 'China · Hora del Pacífico (UTC-8)', de: 'China · Pazifische Zeitzone (UTC-8)' },
  '灵感涌现 · 持续构建中': { en: 'Inspired · Actively Building', fr: 'Inspiré · En construction continue', es: 'Inspirado · Construyendo activamente', de: 'Inspiriert · Aktiv am Bauen' },
  '生于': { en: 'Born', fr: 'Né en', es: 'Nacido en', de: 'Geboren' },
  '2006 (大二在读)': { en: '2006 (Sophomore)', fr: '2006 (Étudiant en 2e année)', es: '2006 (2º año universitario)', de: '2006 (2. Studienjahr)' },
  '城市': { en: 'Location', fr: 'Lieu', es: 'Ubicación', de: 'Ort' },
  '中国 · 校园与自习室': { en: 'China · Campus & Library', fr: 'Chine · Campus & Bibliothèque', es: 'China · Campus y biblioteca', de: 'China · Campus & Bibliothek' },
  '当前阶段': { en: 'Status', fr: 'Statut', es: 'Estado', de: 'Status' },
  '阶段': { en: 'Status', fr: 'Statut', es: 'Estado', de: 'Status' },
  '职业方向': { en: 'Focus', fr: 'Orientation', es: 'Enfoque', de: 'Schwerpunkt' },
  '方向': { en: 'Focus', fr: 'Orientation', es: 'Enfoque', de: 'Schwerpunkt' },
  'Web 全栈求索': { en: 'Web Full-Stack Exploration', fr: 'Exploration Web Full-Stack', es: 'Exploración Web Full-Stack', de: 'Web-Full-Stack-Erkundung' },

  // 5. 性格与 MBTI
  '性格': { en: 'Personality', fr: 'Personnalité', es: 'Personalidad', de: 'Persönlichkeit' },
  '提倡者 / 架构思考者': { en: 'Advocate / System Thinker', fr: 'Avocat / Penseur système', es: 'Abogado / Pensador de sistemas', de: 'Advokat / Systemdenker' },
  '提倡者 (Advocate)': { en: 'Advocate (INFJ-A)', fr: 'Avocat (INFJ-A)', es: 'Abogado (INFJ-A)', de: 'Advokat (INFJ-A)' },
  '偏好建立秩序、耐心打磨细节，对长期可维护的系统与极致体验有天然执念。': {
    en: 'Prefers establishing order, patiently refining details, and holding a natural dedication to long-term maintainable systems and craft.',
    fr: 'Préfère établir l ordre, soigner patiemment les détails et cultive une exigence naturelle pour les systèmes durables.',
    es: 'Prefiere establecer orden, pulir detalles con paciencia y buscar sistemas mantenibles a largo plazo.',
    de: 'Bevorzugt Ordnung, feilt geduldig an Details und setzt auf langfristig wartbare Systeme.',
  },
  '安静而富有洞察力，既有严谨的工程思维，又重视细腻的情感共鸣。追求极致的美学秩序与长效价值。': {
    en: 'Quiet and insightful, combining rigorous engineering thinking with nuanced emotional resonance. Striving for aesthetic order and enduring value.',
    fr: 'Calme et perspicace, alliant rigueur technique et sensibilité humaine. En quête d ordre esthétique et de valeur durable.',
    es: 'Tranquilo y perspicaz, combinando pensamiento de ingeniería con resonancia emocional. Buscando orden estético y valor duradero.',
    de: 'Ruhig und einsichtsvoll, verbindet ingenieurmäßiges Denken mit feiner Resonanz. Strebt nach ästhetischer Ordnung und dauerhaftem Wert.',
  },
  '专注深度 (Introverted)': { en: 'Focus & Depth (Introverted)', fr: 'Profondeur & Intériorité (Introverti)', es: 'Profundidad (Introvertido)', de: 'Fokus & Tiefe (Introvertiert)' },
  '偏好独处构思与深度心流': { en: 'Prefers deep focus and solitude', fr: 'Préfère la concentration et le calme', es: 'Prefiere el enfoque profundo y la soledad', de: 'Bevorzugt tiefen Fokus und Ruhe' },
  '直觉远见 (Intuitive)': { en: 'Intuition & Vision (Intuitive)', fr: 'Intuition & Vision (Intuitif)', es: 'Intuición y visión (Intuitivo)', de: 'Intuition & Weitblick (Intuitiv)' },
  '洞察系统全貌与长远演进': { en: 'Grasps big-picture systems and long-term evolution', fr: 'Perçoit la vision d ensemble et l avenir', es: 'Comprende el panorama general de los sistemas', de: 'Erkennt das Gesamtsystem und langfristige Entwicklungen' },
  '人文感受 (Feeling)': { en: 'Empathy & Resonance (Feeling)', fr: 'Empathie & Résonance (Sentimental)', es: 'Empatía y resonancia (Sentimental)', de: 'Empathie & Resonanz (Fühlend)' },
  '关注使用者体验与情感共鸣': { en: 'Values user experience and emotional resonance', fr: 'Sensible à l expérience humaine et l écoute', es: 'Valora la experiencia humana y la empatía', de: 'Achtet auf Nutzererfahrung und emotionale Resonanz' },
  '秩序判断 (Judging)': { en: 'Order & Organization (Judging)', fr: 'Ordre & Rigueur (Jugement)', es: 'Orden y juicio (Juicio)', de: 'Ordnung & Urteilskraft (Urteilend)' },
  '严苛自律、追求清晰与条理': { en: 'Disciplined, seeking clarity and structure', fr: 'Discipliné, attaché à la clarté et la structure', es: 'Disciplinado, buscando claridad y orden', de: 'Diszipliniert, auf Klarheit und Struktur bedacht' },
  '坚定果决 (Assertive)': { en: 'Confidence & Resolve (Assertive)', fr: 'Assurance & Résolution (Assuré)', es: 'Firmeza y asertividad (Asertivo)', de: 'Zuversicht & Entschlossenheit (Durchsetzungsfähig)' },
  '从容自信、笃定落实每一行代码': { en: 'Confidently executes each line of code', fr: 'Confiant et méthodique dans la réalisation', es: 'Ejecuta cada línea de código con seguridad', de: 'Setzt jede Zeile Code mit Zuversicht um' },
  '深入了解 16Personalities': { en: 'Learn more on 16Personalities', fr: 'En savoir plus sur 16Personalities', es: 'Saber más en 16Personalities', de: 'Mehr auf 16Personalities erfahren' },
  '工作台': { en: 'Workstation', fr: 'Poste de travail', es: 'Puesto de trabajo', de: 'Arbeitsplatz' },
  'Clean Desk, Clear Mind · 工作台一角': { en: 'Clean Desk, Clear Mind · Desk Corner', fr: 'Bureau net, esprit clair · Coin de travail', es: 'Escritorio limpio, mente clara · Rincón de trabajo', de: 'Aufgeräumter Schreibtisch, klarer Kopf · Arbeitsecke' },

  // 6. 实用装备与开发工作流
  '实用装备 / Gear': { en: 'Gear & Hardware', fr: 'Équipements & Matériel', es: 'Equipamiento y Hardware', de: 'Hardware & Ausrüstung' },
  '硬件装备 / Hardware': { en: 'Hardware Gear', fr: 'Matériel Informatique', es: 'Hardware y Equipos', de: 'Hardware' },
  '生产力工作站': { en: 'Daily Workstation', fr: 'Poste de Travail', es: 'Estación de Trabajo', de: 'Arbeitsplatz' },
  '日常学习与开发伙伴': { en: 'Daily Learning & Development Gear', fr: 'Équipement d apprentissage et de développement', es: 'Equipo de aprendizaje y desarrollo', de: 'Werkzeuge für Studium und Entwicklung' },
  '工欲善其事，实用当先。用高性价比的平价设备，在自习室与宿舍搭建专注写码的轻量桌面。': {
    en: 'Practicality first. Building a lightweight desk setup for coding and coursework in dorms and study rooms on a student budget.',
    fr: 'Priorité à la praticité. Un poste de travail léger et abordable en chambre étudiante ou bibliothèque.',
    es: 'Prioridad a lo práctico. Un espacio ligero y accesible para programar y estudiar con presupuesto universitario.',
    de: 'Praxisnähe zuerst. Ein leichtes und bezahlbares Setup zum Lernen und Programmieren im Wohnheim.',
  },
  '实用工具 / Software': { en: 'Software & Dev Stack', fr: 'Logiciels & Environnement', es: 'Software y Herramientas', de: 'Software & Umgebung' },
  '软件环境 / Dev Stack': { en: 'Software & Dev Stack', fr: 'Logiciels & Environnement', es: 'Software y Herramientas', de: 'Software & Umgebung' },
  '数字工具箱': { en: 'Digital Toolbox', fr: 'Boîte à Outils Numérique', es: 'Caja de herramientas digital', de: 'Digitale Werkzeugkiste' },
  '学习与开发工作流': { en: 'Learning & Dev Workflow', fr: 'Flux de travail & Développement', es: 'Flujo de aprendizaje y desarrollo', de: 'Workflow für Studium & Entwicklung' },
  '轻量敏捷、注重实效。用好基础开源与免费工具，满足日常求索与写码需求。': {
    en: 'Lightweight, agile, and effective. Making the best of open-source and free tools for student studies and coding projects.',
    fr: 'Léger, agile et pragmatique. Tirer parti des outils open source et gratuits pour les études et projets de code.',
    es: 'Ligero, ágil y eficaz. Aprovechando herramientas abiertas y gratuitas para el estudio y la programación.',
    de: 'Leicht, agil und zweckmäßig. Nutzen von Open-Source- und kostenlosen Tools für Studium und Entwicklung.',
  },
  '联想小新 Pro / 拯救者便携本': { en: 'Lenovo Laptop (Xiaoxin / Legion)', fr: 'PC Portable Lenovo (Xiaoxin / Legion)', es: 'Portátil Lenovo (Xiaoxin / Legion)', de: 'Lenovo Laptop (Xiaoxin / Legion)' },
  '红米 / AOC 24寸 护眼显示屏': { en: 'Redmi / AOC 24" Eye-Care Monitor', fr: 'Écran 24" Redmi / AOC Confort Visuel', es: 'Monitor 24" Redmi / AOC', de: 'Redmi / AOC 24" Monitor' },
  '国产客制化红轴机械键盘': { en: 'Custom Red-Switch Mechanical Keyboard', fr: 'Clavier Mécanique Switch Rouge', es: 'Teclado Mecánico Switch Rojo', de: 'Mechanische Tastatur Rote Switches' },
  '实用入耳式降噪耳机': { en: 'Noise-Canceling In-Ear Earphones', fr: 'Écouteurs Intra-auriculaires Réduction de Bruit', es: 'Auriculares con Cancelación de Ruido', de: 'In-Ear-Kopfhörer mit Geräuschunterdrückung' },
  '自习室与寝室主力 · 陪我熬夜跑实验写代码的高性价比伙伴': {
    en: 'Daily driver for coursework, lab experiments, and late-night coding',
    fr: 'Machine principale pour cours, TPs et séances de code nocturnes',
    es: 'Portátil principal para tareas y experimentos de programación',
    de: 'Hauptgerät für Studium, Laborexperimente und Programmieren',
  },
  '桌面副屏扩展 · 平价实用，双屏分屏查文档编码更专注': {
    en: 'Affordable secondary display for referencing documentation while coding',
    fr: 'Affichage secondaire abordable pour lire la doc tout en codant',
    es: 'Pantalla secundaria asequible para consultar documentación',
    de: 'Erschwinglicher Zweitbildschirm zum Lesen von Dokumentationen beim Coden',
  },
  '轻柔静音 · 宿舍不扰室友，长时间打字指尖轻快舒适': {
    en: 'Quiet and comfortable keystrokes for dorm rooms without disturbing others',
    fr: 'Frappe douce et silencieuse en dortoir pour de longues sessions',
    es: 'Teclas silenciosas y cómodas para no molestar a los compañeros',
    de: 'Leise und komfortable Tastenanschläge für das Wohnheim',
  },
  '自习防线 · 图书馆与宿舍里隔绝杂音、开启心流沉浸': {
    en: 'Effective ambient noise blocking for library flow and focus',
    fr: 'Isolation sonore efficace pour rester concentré en bibliothèque',
    es: 'Aislamiento de ruido ambiental para concentrarse en la biblioteca',
    de: 'Geräuschabschirmung für konzentriertes Arbeiten in der Bibliothek',
  },
  'VS Code & 终端': { en: 'VS Code & Terminal', fr: 'VS Code & Terminal', es: 'VS Code y Terminal', de: 'VS Code & Terminal' },
  '代码编写与调试 · 课业实验与个人博客维护主力': {
    en: 'Primary tools for university lab experiments and blog maintenance',
    fr: 'Outils principaux pour les TPs universitaires et la maintenance du blog',
    es: 'Herramientas principales para prácticas universitarias y blog',
    de: 'Hauptwerkzeuge für Hochschulpraktika und Blog-Wartung',
  },
  'Obsidian / Markdown': { en: 'Obsidian / Markdown', fr: 'Obsidian / Markdown', es: 'Obsidian / Markdown', de: 'Obsidian / Markdown' },
  '知识沉淀与课程笔记 · 构建双向链接的个人知识库': {
    en: 'Course notes and knowledge retention with bidirectional links',
    fr: 'Prise de notes et base de connaissances avec liens bidirectionnels',
    es: 'Notas de clase y base de conocimientos con enlaces bidireccionales',
    de: 'Vorlesungsnotizen und Wissensbasis mit bidirektionalen Verknüpfungen',
  },
  'Chrome / Edge DevTools': { en: 'Chrome / Edge DevTools', fr: 'Chrome / Edge DevTools', es: 'Chrome / Edge DevTools', de: 'Chrome / Edge DevTools' },
  '前端调试与查阅文档 · 边看文档边排查样式布局': {
    en: 'Front-end debugging, layout inspection, and MDN references',
    fr: 'Débogage front-end, inspection de mise en page et doc MDN',
    es: 'Depuración frontend, inspección de estilos y lectura de MDN',
    de: 'Frontend-Debugging, Layout-Prüfung und MDN-Dokumentation',
  },
  'Cloudflare Pages & GitHub': { en: 'Cloudflare Pages & GitHub', fr: 'Cloudflare Pages & GitHub', es: 'Cloudflare Pages & GitHub', de: 'Cloudflare Pages & GitHub' },
  '自动化部署与版本控制 · 零成本托管个人数字花园': {
    en: 'Automated CI/CD and zero-cost hosting for my digital garden',
    fr: 'Déploiement CI/CD automatisé et hébergement gratuit du jardin numérique',
    es: 'Despliegue automatizado y alojamiento sin coste del jardín digital',
    de: 'Automatisierte Bereitstellung und kostenloses Hosting des digitalen Gartens',
  },

  // 7. 数字花园建站宣言
  '造物初心': { en: 'Original Intention', fr: 'Intention Première', es: 'Propósito inicial', de: 'Ursprung & Haltung' },
  '在算法喧嚣的时代，构筑一座属于自己的数字花园。': {
    en: 'Cultivating a personal digital garden in an era of algorithmic noise.',
    fr: 'Cultiver un jardin numérique personnel à l ère du bruit algorithmique.',
    es: 'Cultivar un jardín digital propio en tiempos de ruido algorítmico.',
    de: 'Einen persönlichen digitalen Garten im Zeitalter des algorithmischen Lärms pflegen.',
  },
  '不迎合瞬息万变的快餐式流量，用代码与文字沉淀可穿越周期的长效价值。': {
    en: 'Steering clear of disposable hype, distilling enduring value through code and deliberate writing.',
    fr: 'Loin du bruit éphémère, façonner une valeur durable par le code et l écriture.',
    es: 'Sin ceder a las modas pasajeras, destilando valor duradero con código y palabras.',
    de: 'Ohne sich kurzlebigen Trends zu beugen, schaffen Code und Worte bleibende Werte.',
  },
  '数据主权与自由表达': { en: 'Data Sovereignty & Free Expression', fr: 'Souveraineté des Données & Expression Libre', es: 'Soberanía de datos y libre expresión', de: 'Datensouveränität & Freier Ausdruck' },
  '不为算法推荐妥协，不被商业平台锁定。把每一次技术探索、深度思考与真实试错完整归档在自己的领地上。': {
    en: 'Refusing algorithmic dictates or platform lock-in. Archiving every technical inquiry, reflection, and lesson learned on sovereign soil.',
    fr: 'Sans compromis algorithmique ni enfermement propriétaire. Archiver chaque exploration technique et réflexion sur son propre domaine.',
    es: 'Sin compromisos con algoritmos ni ataduras a plataformas comerciales. Archivando cada exploración y reflexión en terreno propio.',
    de: 'Keine Kompromisse für Algorithmen, keine Bindung an kommerzielle Plattformen. Jede Entdeckung auf eigenem Boden bewahren.',
  },
  '慢思考与长效价值': { en: 'Deep Reflection & Enduring Value', fr: 'Réflexion Approfondie & Valeur Durable', es: 'Pensamiento pausado y valor duradero', de: 'Bedachtes Denken & Bleibender Wert' },
  '拒绝碎片化浮躁。以系统化、结构化的长文记录解决真实技术痛点的轨迹，让知识随时间复利持续增值。': {
    en: 'Rejecting fragmented distraction. Documenting solutions to real-world engineering hurdles in structured essays that compound over time.',
    fr: 'Rejeter la superficialité. Consigner les réponses aux défis techniques réels dans des écrits structurés qui fructifient avec le temps.',
    es: 'Rechazando la prisa fragmentada. Registrando soluciones a problemas técnicos reales en textos que generan valor acumulado.',
    de: 'Gegen fragmentierte Hektik. Lösungen für echte technische Herausforderungen in strukturierten Texten festhalten.',
  },
  '数字工匠精神': { en: 'Digital Craftsmanship', fr: 'Artisanat Numérique', es: 'Artesanía Digital', de: 'Digitales Handwerk' },
  '代码架构、字距留白、色彩平衡与微交互，处处皆是作品。追求极致的前端性能与符合人体感官的美学舒适。': {
    en: 'From architecture and typography to palette harmony and micro-interactions. Striving for peak frontend performance and sensory comfort.',
    fr: 'De l architecture et la typographie jusqu à l harmonie visuelle et les micro-interactions. Viser l excellence technique et le confort esthétique.',
    es: 'De la arquitectura y la tipografía a la paleta de color y las microinteracciones. Buscando un alto rendimiento y confort estético.',
    de: 'Von der Architektur über Typografie bis zur Farbharmonie und Mikrointeraktion. Streben nach Spitzenleistung und ästhetischem Wohlbefinden.',
  },

  // 8. 系统架构三层拓扑
  '系统架构 / Architecture Topology': { en: 'System Architecture / Architecture Topology', fr: 'Architecture Système / Topologie', es: 'Arquitectura de Sistemas / Topología', de: 'Systemarchitektur / Topologie' },
  '全栈工程架构与云端底座': { en: 'Full-Stack Engineering & Cloud Infrastructure', fr: 'Architecture Full-Stack & Infrastructure Cloud', es: 'Arquitectura Full-Stack e Infraestructura Cloud', de: 'Full-Stack-Architektur & Cloud-Infrastruktur' },
  '从浏览器感知交互、排版编译管道到底层全球分布式边缘运算的全链路技术选型。': {
    en: 'End-to-end tech stack from client-side perceptual UX to content compilation and global edge compute.',
    fr: 'De la perception et l expérience client aux pipelines de compilation et au calcul distribué à la périphérie.',
    es: 'De la experiencia de usuario y diseño a la compilación de contenidos y computación en el borde global.',
    de: 'Vom Nutzererlebnis im Browser über Inhalts-Pipelines bis hin zur weltweit verteilten Edge-Infrastruktur.',
  },
  '感知交互层': { en: 'Perceptual UX Tier', fr: 'Couche Expérience & Perception', es: 'Capa de Experiencia de Usuario', de: 'Wahrnehmungs- & UX-Schicht' },
  'Client & UX Tier': { en: 'Client & UX Tier', fr: 'Couche Client & UX', es: 'Capa Cliente y UX', de: 'Client- & UX-Ebene' },
  'Islands 极速渲染': { en: 'Islands Lightning Rendering', fr: 'Rendu ultrarapide par Îlots', es: 'Renderizado ultrarrápido por Islas', de: 'Islands Blitzschnelles Rendern' },
  '动态交互状态岛': { en: 'Interactive Dynamic Islands', fr: 'Îlots interactifs dynamiques', es: 'Islas dinámicas interactivas', de: 'Interaktive dynamische Inseln' },
  '全链路类型守卫': { en: 'End-to-End Type Safety', fr: 'Sécurité de typage de bout en bout', es: 'Seguridad de tipos de extremo a extremo', de: 'Durchgängige Typsicherheit' },
  '现代原子设计系统': { en: 'Modern Atomic Design System', fr: 'Système de design atomique moderne', es: 'Sistema moderno de diseño atómico', de: 'Modernes atomares Designsystem' },
  '排版编译管道': { en: 'Content Engine Pipeline', fr: 'Pipeline de Compilation de Contenu', es: 'Pipeline de compilación de contenidos', de: 'Inhalts- & Verarbeitungs-Pipeline' },
  'Content Engine': { en: 'Content Engine', fr: 'Moteur de Contenu', es: 'Motor de Contenidos', de: 'Content-Engine' },
  '双主题自适应高亮': { en: 'Dual-Theme Adaptive Syntax', fr: 'Coloration syntaxique bithème', es: 'Resaltado sintáctico de doble tema', de: 'Adaptives Syntax-Highlighting' },
  '严谨科学公式排版': { en: 'Rigorous Math Typesetting', fr: 'Composition mathématique rigoureuse', es: 'Tipografía matemática rigurosa', de: 'Präziser mathematischer Formelsatz' },
  'Mermaid 图谱': { en: 'Mermaid Charts', fr: 'Diagrammes Mermaid', es: 'Diagramas Mermaid', de: 'Mermaid-Diagramme' },
  '知识拓扑可视化': { en: 'Knowledge Graph Visualization', fr: 'Visualisation de graphes de savoir', es: 'Visualización de grafos de conocimiento', de: 'Visualisierung von Wissensgraphen' },
  'i18n 多语言': { en: 'i18n Multilingual', fr: 'i18n Multilingue', es: 'i18n Multilingüe', de: 'i18n Mehrsprachig' },
  '多语种语义分块转译': { en: 'Multilingual Semantic Chunking', fr: 'Traduction sémantique multilingue', es: 'Traducción semántica multilingüe', de: 'Mehrsprachige semantische Übersetzung' },
  '分布式边缘底座': { en: 'Distributed Edge Foundation', fr: 'Socle Distribué à la Périphérie', es: 'Base distribuida en el borde', de: 'Verteiltes Edge-Fundament' },
  'Edge & Cloud': { en: 'Edge & Cloud', fr: 'Edge & Cloud', es: 'Edge y Cloud', de: 'Edge & Cloud' },
  '全球 Anycast 边缘': { en: 'Global Anycast Edge Network', fr: 'Réseau Anycast mondial', es: 'Red Anycast global en el borde', de: 'Weltweites Anycast-Edge-Netzwerk' },
  '边缘分布式 SQLite': { en: 'Distributed Edge SQLite', fr: 'SQLite distribué sur le réseau bord', es: 'SQLite distribuido en el borde', de: 'Verteiltes Edge-SQLite' },
  '零冷启动轻量路由': { en: 'Zero-Cold-Start Serverless Routing', fr: 'Routage Serverless sans démarrage à froid', es: 'Enrutamiento sin arranque en frío', de: 'Serverless-Routing ohne Kaltstart' },
  'GitOps 流水线': { en: 'GitOps Pipeline', fr: 'Pipeline GitOps', es: 'Canalización GitOps', de: 'GitOps-Pipeline' },
  '多远端双向自动同步': { en: 'Multi-Remote Dual Automated Sync', fr: 'Synchronisation automatique multi-dépôts', es: 'Sincronización automática multidestino', de: 'Automatische Synchronisierung mehrerer Remotes' },

  // 9. 灵感音轨与创作角落
  '灵感音轨': { en: 'Soundtrack', fr: 'Bande Sonore', es: 'Banda Sonora', de: 'Inspirations-Soundtrack' },
  '在旋律与代码间寻得心流': { en: 'Finding Flow Between Melody & Code', fr: 'Trouver l état de flow entre mélodie et code', es: 'Hallar el estado de flujo entre melodía y código', de: 'Flow finden zwischen Melodie und Code' },
  '敲下代码时，音乐是最好的白噪音；文字流淌时，旋律是心流的节拍器。在旋律与思考中保持节奏。': {
    en: 'Music is the ultimate ambient noise when writing code; melody acts as a metronome for deep focus. Keeping pace between rhythm and contemplation.',
    fr: 'La musique est le meilleur bruit blanc pour coder ; la mélodie rythme l état de concentration profonde. Garder le tempo entre réflexion et création.',
    es: 'La música es el mejor ruido blanco al programar; la melodía marca el ritmo de la concentración. Manteniendo el compás entre pensar y crear.',
    de: 'Beim Coden ist Musik das beste weiße Rauschen; Melodie wirkt wie ein Metronom für tiefen Fokus. Den Takt halten zwischen Rhythmus und Nachdenken.',
  },
  'Scop · SHAUN · 悠扬日常': { en: 'Scop · SHAUN · Melodic Flow', fr: 'Scop · SHAUN · Ambiance mélodique', es: 'Scop · SHAUN · Flujo melódico', de: 'Scop · SHAUN · Sanfte Klänge' },
  'Way Back Home / 彼女は旅に出る': { en: 'Way Back Home', fr: 'Way Back Home', es: 'Way Back Home', de: 'Way Back Home' },
  '彼女は旅に出る': { en: 'She Goes on a Journey', fr: 'Elle part en voyage', es: 'Ella emprende un viaje', de: 'Sie geht auf Reisen' },
  '沉浸热爱': { en: 'Creative Passions', fr: 'Passions Créatives', es: 'Pasiones Creativas', de: 'Kreative Leidenschaften' },
  '数字造物与极客实验': { en: 'Digital Creation & Geek Experiments', fr: 'Création Numérique & Expérimentations', es: 'Creación Digital y Experimentos Geek', de: 'Digitales Schaffen & Geek-Experimente' },
  '把内容、界面与交互收束成真正能穿越周期的个人作品。': {
    en: 'Unifying content, interface, and interaction into timeless digital craft.',
    fr: 'Harmoniser contenu, interface et interaction en créations durables.',
    es: 'Uniendo contenido, interfaz e interacción en creaciones personales perdurables.',
    de: 'Inhalt, Interface und Interaktion zu zeitlosen Werken bündeln.',
  },
  '关注的主题': { en: 'Focus Topics', fr: 'Thèmes d Intérêt', es: 'Temas de interés', de: 'Themenschwerpunkte' },
  '系统架构': { en: 'System Architecture', fr: 'Architecture Système', es: 'Arquitectura de Sistemas', de: 'Systemarchitektur' },
  '设计系统': { en: 'Design Systems', fr: 'Systèmes de Design', es: 'Sistemas de Diseño', de: 'Designsysteme' },
  '阅读体验': { en: 'Reading Experience', fr: 'Expérience de Lecture', es: 'Experiencia de Lectura', de: 'Leseerlebnis' },
  '人机协同': { en: 'Human-AI Synergy', fr: 'Synergie Humain-IA', es: 'Sinergia Humano-IA', de: 'Mensch-KI-Synergie' },

  // 10. 演进里程碑
  '演进足迹 / Milestones': { en: 'Evolution Milestones', fr: 'Jalons d Évolution', es: 'Hitos de Evolución', de: 'Entwicklungsmeilensteine' },
  '站点演进与造物足迹': { en: 'Journey & Evolution Milestones', fr: 'Parcours et Jalons de Création', es: 'Recorrido e Hitos de Creación', de: 'Reise & Meilensteine des Schaffens' },
  '从一行简单的 Markdown，到高度工程化、全球边缘化分发的内容产品演进史。': {
    en: 'The evolution from a single line of Markdown to an engineered, globally distributed content platform.',
    fr: 'L évolution d une simple ligne de Markdown vers une plateforme éditoriale distribuée mondialement.',
    es: 'La evolución de una simple línea de Markdown a una plataforma editorial de distribución global.',
    de: 'Der Weg von einer einfachen Zeile Markdown zu einer durchdachten, weltweit verteilten Plattform.',
  },
  '始于盛夏 (Origins)': { en: 'Origins (Summer 2006)', fr: 'Origines (Été 2006)', es: 'Orígenes (Verano 2006)', de: 'Ursprung (Sommer 2006)' },
  '出生于 2006 年': { en: 'Born in 2006', fr: 'Né en 2006', es: 'Nacido en 2006', de: 'Geboren 2006' },
  '出生于 2006 年盛夏，与现代互联网和开源浪潮共同成长，对未知世界充满好奇与求知欲。': {
    en: 'Born in the summer of 2006, growing up alongside modern web developments and the open-source movement with enduring curiosity.',
    fr: 'Né durant l été 2006, grandissant aux côtés du web moderne et du logiciel libre avec une curiosité constante pour le monde.',
    es: 'Nacido en el verano de 2006, creciendo junto al auge de la web moderna y el código abierto con gran curiosidad.',
    de: 'Geboren im Sommer 2006, aufgewachsen mit dem modernen Web und der Open-Source-Bewegung, getrieben von Neugier.',
  },
  '初探代码 (First Code)': { en: 'First Code (2022)', fr: 'Premières lignes de code (2022)', es: 'Primer código (2022)', de: 'Erster Code (2022)' },
  '敲下第一行 Hello World': { en: 'Writing My First Hello World', fr: 'Première ligne Hello World', es: 'Escribiendo el primer Hello World', de: 'Die erste Zeile Hello World' },
  '高中偶然接触编程，被代码创造数字界面的奇妙深深吸引，确立了拒绝快餐化、保持长期沉淀的创作基调。': {
    en: 'Encountered coding in high school and fell in love with creating digital interfaces, establishing a commitment to thoughtful building.',
    fr: 'Découverte de la programmation au lycée, fasciné par la création d interfaces numériques et attaché à un apprentissage approfondi.',
    es: 'Descubrió la programación en la escuela secundaria, atraído por crear interfaces digitales con un enfoque pausado y duradero.',
    de: 'In der Schule erstmals mit Programmieren in Berührung gekommen, fasziniert von digitalen Schnittstellen und langfristigem Lernen.',
  },
  '步入大学 (Campus Journey)': { en: 'Campus Journey (2024)', fr: 'Arrivée à l Université (2024)', es: 'Camino Universitario (2024)', de: 'Universitätsbeginn (2024)' },
  '开启计算机专业求学历程': { en: 'Beginning University in Computer Science', fr: 'Début des études universitaires en informatique', es: 'Inicio del grado en Informática', de: 'Beginn des Informatikstudiums' },
  '成为一名在读大学生，在自习室与宿舍搭建个人独立博客，重构为现代前端工程架构，确立产品级维护标准。': {
    en: 'Became a CS undergraduate, building this independent blog in dorms and study rooms while adopting modern frontend engineering standards.',
    fr: 'Étudiant en informatique, création de ce blog indépendant en chambre et bibliothèque avec des standards d ingénierie modernes.',
    es: 'Como estudiante universitario de informática, creando este blog independiente y adoptando estándares de ingeniería modernos.',
    de: 'Als Informatikstudent diesen unabhängigen Blog im Wohnheim und in Bibliotheken mit modernen Standards aufgebaut.',
  },
  '旗舰成型 (Flagship Maturity)': { en: 'Flagship Maturity (2026)', fr: 'Maturité Majeure (2026)', es: 'Madurez del Proyecto (2026)', de: 'Flaggschiff-Reife (2026)' },
  '自研 Shijianus 旗舰主题与边缘原生底座': {
    en: 'Authoring the Shijianus Flagship Theme & Edge Stack',
    fr: 'Création du thème Shijianus et de l infrastructure bord',
    es: 'Desarrollo del tema Shijianus y la plataforma en el borde',
    de: 'Entwicklung des Shijianus-Themes und der Edge-Infrastruktur',
  },
  '深度集成 Cloudflare D1 边缘原生留言系统、国际多币种收银台、多语言自动流水线与端到端自动化测试，达到工业级水准。': {
    en: 'Integrating edge comments on Cloudflare D1, international checkout, automated multilingual pipelines, and end-to-end tests.',
    fr: 'Intégration de commentaires distribués D1, paiement international, pipeline multilingue et tests de bout en bout.',
    es: 'Integración de comentarios en D1, pasarela de pago internacional, pipeline multilingüe y pruebas de extremo a extremo.',
    de: 'Integration von D1-Kommentaren am Edge, internationalem Checkout, mehrsprachiger Pipeline und End-to-End-Tests.',
  },
  '未来': { en: 'Future', fr: 'Futur', es: 'Futuro', de: 'Zukunft' },
  '持续演进 (Continuous Evolution)': { en: 'Continuous Evolution', fr: 'Évolution Continue', es: 'Evolución Continua', de: 'Kontinuierliche Entwicklung' },
  '构筑跨越时空的知识通衢': { en: 'Building Enduring Bridges of Knowledge', fr: 'Bâtir des passerelles durables de savoir', es: 'Construyendo puentes de conocimiento perdurables', de: 'Brücken des Wissens über die Zeit schlagen' },
  '践行“厚土潜藏细脉，大荒广构通衢”之志，在系统架构、数字交互与人机智能协同创作的前沿持续深耕。': {
    en: "Living by the ethos: 'Nurture deep roots quietly, build broad paths forward', continuing to explore system architecture and human-AI synergy.",
    fr: "Fidèle à la devise : forger des bases solides pour ouvrir de vastes horizons, en continuant d explorer l architecture et l IA.",
    es: "Fiel a la máxima: echar raíces en silencio y construir amplios caminos, explorando la arquitectura de software y la colaboración con IA.",
    de: "Dem Leitgedanken treu: Im Verborgenen Wurzeln schlagen, um weite Wege zu bauen, und neue Wege in Architektur und KI erforschen.",
  },

  // 11. 箴言、加成与连接
  '座右铭': { en: 'Motto', fr: 'Devise', es: 'Lema', de: 'Motto' },
  '加成': { en: 'Core Belief', fr: 'Conviction', es: 'Convicción', de: 'Kernüberzeugung' },
  '意图明确的构建': { en: 'Deliberate Building', fr: 'Construction Intentionnelle', es: 'Construcción con propósito', de: 'Gezieltes Schaffen' },
  '比一次性的热闹更重要': { en: 'Outlasts Temporary Hype', fr: 'Surpasse le Bruit Éphémère', es: 'Supera el ruido pasajero', de: 'Überdauert flüchtigen Lärm' },
  '保持连接': { en: 'Stay Connected', fr: 'Rester en Contact', es: 'Mantenerse Conectado', de: 'In Verbindung Bleiben' },
  '与志同道合者同行': { en: 'Walking with Like-Minded Creators', fr: 'Cheminer avec des Esprits Complices', es: 'Caminar con creadores afines', de: 'Mit Gleichgesinnten unterwegs sein' },
  '无论你想探讨前端工程、系统架构，还是交流写作体验与设计思考，欢迎随时与我连接。': {
    en: 'Whether you want to discuss frontend engineering, system architecture, or exchange writing and design thoughts, feel free to reach out.',
    fr: 'Que vous souhaitiez échanger sur le développement web, l architecture système ou partager des réflexions, n hésitez pas à me contacter.',
    es: 'Tanto si quieres hablar de ingeniería frontend como de arquitectura o diseño, no dudes en ponerte en contacto.',
    de: 'Ob über Frontend-Engineering, Systemarchitektur oder Designphilosophie – ich freue mich über jeden Austausch.',
  },
  '查看开源项目与构建足迹': { en: 'Explore open-source projects & code', fr: 'Découvrir les projets open source', es: 'Explorar proyectos de código abierto', de: 'Open-Source-Projekte entdecken' },
  '日常交流与即时互动探讨': { en: 'Daily chats & instant discussions', fr: 'Échanges quotidiens et discussions en direct', es: 'Conversaciones diarias y debates', de: 'Täglicher Austausch und Diskussionen' },
  'RSS 订阅': { en: 'RSS Feed', fr: 'Flux RSS', es: 'Canal RSS', de: 'RSS-Feed' },
  '通过现代阅读器第一时间获知更新': { en: 'Subscribe via modern readers for instant updates', fr: 'S abonner via un lecteur RSS pour être informé en direct', es: 'Suscríbete con lectores modernos para actualizaciones inmediatas', de: 'Über moderne Feed-Reader stets auf dem Laufenden bleiben' },
  '邮件信箱': { en: 'Email', fr: 'Courriel', es: 'Correo', de: 'E-Mail' },
  '欢迎深度长信交流探讨': { en: 'Warmly welcome in-depth thoughtful letters', fr: 'Bienvenue pour des échanges approfondis par courriel', es: 'Correspondencia reflexiva y profunda bienvenida', de: 'Ausführliche und tiefgehende Briefe herzlich willkommen' },
};
