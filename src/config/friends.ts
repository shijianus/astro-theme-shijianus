/**
 * Friends & Moments Configuration
 * 
 * 友人帐与朋友圈数据配置
 * 站长可在此自由增删博友名片、分类与最新动态聚合数据
 */

export interface FriendLink {
  name: string;
  url: string;
  avatar: string;
  desc: string;
  tag?: string;
  tagColor?: 'blue' | 'green' | 'purple' | 'orange' | 'cyan';
  status?: 'online' | 'checking';
  featured?: boolean;
  feed?: string;
  shijianusTheme?: boolean;
  shijianusEndpoint?: string;
}

export interface FriendCategory {
  id: string;
  name: string;
  desc: string;
  icon: string;
  items: FriendLink[];
}

export interface MomentItem {
  id: string;
  author: string;
  authorUrl: string;
  avatar: string;
  badge?: string;
  isOwner?: boolean;
  mood?: string;
  device?: string;
  title: string;
  url: string;
  summary: string;
  timeAgo: string;
  timestamp: string;
  category: 'tech' | 'life' | 'design' | 'thought';
  tags: string[];
  likes: number;
  commentCount?: number;
  origin?: string;
  originUrl?: string;
  originApi?: string;
}

export const friendsConfig: {
  siteInfo: {
    name: string;
    url: string;
    avatar: string;
    desc: string;
  };
  rules: string[];
  categories: FriendCategory[];
  moments: MomentItem[];
} = {
  siteInfo: {
    name: 'EpoCanvas (shijianus)',
    url: 'https://blog.epocanvas.com',
    avatar: 'https://drawing.shijian.qzz.io/file/AgACAgEAAyEGAAS6jkJbAAMTaojJ2HJEypU1KmG8jAv2wXTVKB4AAjYMaxuc3khE9paUm5Tomx8BAAMCAAN3AAM9BA.png',
    desc: '把研究、开发和生活折叠成可读的记录。在高信息密度里保留阅读秩序。',
  },
  rules: [
    '原创优先：内容持续维护，拥有独立思考，杜绝纯搬运或采集站。',
    '稳定可达：支持全站 HTTPS 访问，近 3 个月内有稳定访问与更新记录。',
    '体验良善：界面排版具备基本可读性，无大面积遮挡式广告或弹窗。',
    '先友后链：申请互链前请先将本站添加至您的友链中，互帮互助。',
  ],
  categories: [
    {
      id: 'core',
      name: '核心友邻 · 技术先锋',
      desc: '深耕技术底层、架构设计与开源实践的极客同行',
      icon: 'terminal',
      items: [
        {
          name: '安知鱼',
          url: 'https://anzhiyu.cpolar.top/',
          avatar: 'https://img02.anzhiy.cn/wordpress/927429623dc10b992167d49ee4329241.jpg',
          desc: '生活明朗，万物可爱。Hexo-Theme-Anzhiyu 主题作者。',
          tag: 'UI/UX 先驱',
          tagColor: 'blue',
          status: 'online',
          featured: true,
          feed: 'https://anzhiyu.cpolar.top/rss.xml',
        },
        {
          name: 'Astro 官方生态',
          url: 'https://astro.build/',
          avatar: 'https://astro.build/favicon.svg',
          desc: 'The web framework for content-driven websites. 极速岛屿架构。',
          tag: '核心引擎',
          tagColor: 'purple',
          status: 'online',
          featured: true,
          feed: 'https://astro.build/rss.xml',
        },
        {
          name: 'Cloudflare Workers',
          url: 'https://workers.cloudflare.com/',
          avatar: 'https://www.cloudflare.com/favicon.ico',
          desc: 'Build serverless applications and deploy globally to edge.',
          tag: '边缘算力',
          tagColor: 'orange',
          status: 'online',
          featured: true,
          feed: 'https://blog.cloudflare.com/rss/',
        },
        {
          name: 'Tailwind CSS',
          url: 'https://tailwindcss.com/',
          avatar: 'https://tailwindcss.com/favicons/favicon-32x32.png',
          desc: 'A utility-first CSS framework packed with classes.',
          tag: '原子设计',
          tagColor: 'cyan',
          status: 'online',
          featured: true,
          feed: 'https://tailwindcss.com/feeds/feed.xml',
        },
      ],
    },
    {
      id: 'design',
      name: '灵感花园 · 宝藏博客',
      desc: '在数字世界构建独立美学与优雅交互的造物者',
      icon: 'palette',
      items: [
        {
          name: 'Akilarの糖果屋',
          url: 'https://akilar.top/',
          avatar: 'https://npm.elemecdn.com/akilar-candyassets/image/siteicon/favicon.png',
          desc: '期待每一次探索，期待每一次相遇。',
          tag: '前端美学',
          tagColor: 'green',
          status: 'online',
          feed: 'https://akilar.top/atom.xml',
        },
        {
          name: 'Leonus',
          url: 'https://blog.leonus.cn/',
          avatar: 'https://q1.qlogo.cn/g?b=qq&nk=990320751&s=640',
          desc: '热爱折腾与设计的全栈开发者。',
          tag: '极客折腾',
          tagColor: 'blue',
          status: 'online',
          feed: 'https://blog.leonus.cn/atom.xml',
        },
        {
          name: '小康的个人博客',
          url: 'https://www.antmoe.com/',
          avatar: 'https://cdn.jsdelivr.net/gh/sviptzk/StaticFile_HEXO@v3.2.7/butterfly/img/avatar.jpg',
          desc: '一个爱好前端的程序员小窝。',
          tag: '开源探索',
          tagColor: 'purple',
          status: 'online',
          feed: 'https://www.antmoe.com/atom.xml',
        },
        {
          name: '糖果屋实验室',
          url: 'https://candylab.net/',
          avatar: 'https://drawing.shijian.qzz.io/file/AgACAgEAAyEGAAS6jkJbAAMTaojJ2HJEypU1KmG8jAv2wXTVKB4AAjYMaxuc3khE9paUm5Tomx8BAAMCAAN3AAM9BA.png',
          desc: 'Web 动画与交互组件实战试验场。',
          tag: '创意交互',
          tagColor: 'orange',
          status: 'online',
          feed: 'https://candylab.net/rss.xml',
        },
      ],
    },
    {
      id: 'life',
      name: '漫游行者 · 生活与思索',
      desc: '记录平凡生活、深度思考与文字温度的漫步者',
      icon: 'compass',
      items: [
        {
          name: '木子吉的漫游志',
          url: 'https://muzi.dev/',
          avatar: 'https://drawing.shijian.qzz.io/file/AgACAgEAAyEGAAS6jkJbAAMTaojJ2HJEypU1KmG8jAv2wXTVKB4AAjYMaxuc3khE9paUm5Tomx8BAAMCAAN3AAM9BA.png',
          desc: '行走在代码与自然之间，观察世界的细微褶皱。',
          tag: '旅行摄影',
          tagColor: 'green',
          status: 'online',
          feed: 'https://muzi.dev/feed.xml',
        },
        {
          name: '深夜拾遗',
          url: 'https://notes.shijian.us/',
          avatar: 'https://drawing.shijian.qzz.io/file/AgACAgEAAyEGAAS6jkJbAAMTaojJ2HJEypU1KmG8jAv2wXTVKB4AAjYMaxuc3khE9paUm5Tomx8BAAMCAAN3AAM9BA.png',
          desc: '记录睡前突然闪过的想法与工程复盘。',
          tag: '随笔反思',
          tagColor: 'blue',
          status: 'online',
          feed: 'https://notes.shijian.us/rss.xml',
        },
      ],
    },
  ],
  moments: [
    {
      id: 'm1',
      author: 'shijianus (站长)',
      authorUrl: 'https://blog.epocanvas.com',
      avatar: 'https://drawing.shijian.qzz.io/file/AgACAgEAAyEGAAS6jkJbAAMTaojJ2HJEypU1KmG8jAv2wXTVKB4AAjYMaxuc3khE9paUm5Tomx8BAAMCAAN3AAM9BA.png',
      badge: '👑 站长原声',
      isOwner: true,
      mood: '🚀 专注',
      device: 'Mac Studio · 边缘开发终端',
      title: '朋友圈全面升级 QQ 空间模式：站长原声与友邻多端聚合',
      url: '/about/site/',
      summary: '今天把朋友圈从原本单调的静态列表全面改造为 QQ 空间式的多人分享聚合！站长专属说说沉淀生活碎碎念与架构灵感，同时支持友邻动态实时传送与极客漫游串门。欢迎大家在下方就地留言互动！',
      timeAgo: '刚刚',
      timestamp: '2026-10-31 19:20',
      category: 'thought',
      tags: ['系统设计', 'QQ空间模式', '友链聚合'],
      likes: 58,
      commentCount: 3,
    },
    {
      id: 'm2',
      author: '安知鱼',
      authorUrl: 'https://anzhiyu.cpolar.top/',
      avatar: 'https://img02.anzhiy.cn/wordpress/927429623dc10b992167d49ee4329241.jpg',
      badge: '🌐 友邻传送',
      isOwner: false,
      mood: '🎨 灵感',
      device: '来自好友「安知鱼」的花园',
      title: '关于 Hexo 主题色彩与暗黑模式适配的几点新思考',
      url: 'https://anzhiyu.cpolar.top/',
      summary: '在多设备自适应的今天，单纯的黑色背景已经不足以支撑高级感，深灰与半透明材质的搭配才是视觉呼吸感的关键。探索了新的色彩对比度算法...',
      timeAgo: '15分钟前',
      timestamp: '2026-10-31 18:45',
      category: 'design',
      tags: ['UI/UX', '暗黑模式', '色彩科学'],
      likes: 34,
      commentCount: 5,
    },
    {
      id: 'm3',
      author: 'shijianus (站长)',
      authorUrl: 'https://blog.epocanvas.com',
      avatar: 'https://drawing.shijian.qzz.io/file/AgACAgEAAyEGAAS6jkJbAAMTaojJ2HJEypU1KmG8jAv2wXTVKB4AAjYMaxuc3khE9paUm5Tomx8BAAMCAAN3AAM9BA.png',
      badge: '👑 站长原声',
      isOwner: true,
      mood: '☕ 惬意',
      device: 'iPhone 16 Pro',
      title: '把主导航下拉菜单彻底“应用化”：告别冰冷文档，迎接交互仪表盘',
      url: '/about/site/',
      summary: '主导航下拉栏不应该只是又一篇长篇大论的文档，而应该是一组鲜活、可交互、有实际功能的界面组件！夜深了，在屏幕前敲下一行行代码，看着界面像积木一样拼装成型，这种造物的快乐是无可替代的。',
      timeAgo: '2小时前',
      timestamp: '2026-10-31 17:15',
      category: 'thought',
      tags: ['前端工程', '组件化', '极客生活'],
      likes: 47,
      commentCount: 2,
    },
    {
      id: 'm4',
      author: 'Astro 官方生态',
      authorUrl: 'https://astro.build/',
      avatar: 'https://astro.build/favicon.svg',
      badge: '🌐 友邻传送',
      isOwner: false,
      mood: '⚡ 极速',
      device: '来自 Astro 官方博客',
      title: 'Astro 6 核心编译引擎速度再次提升 40%',
      url: 'https://astro.build/',
      summary: '通过底层 Vite 打包管线的全新 Rust 插件加速，万级内容集合的冷启动与热重载延时显著降低，边缘按需渲染与静态生成的边界更加清晰。',
      timeAgo: '3小时前',
      timestamp: '2026-10-31 16:00',
      category: 'tech',
      tags: ['Astro', 'Compiler', 'Release'],
      likes: 72,
      commentCount: 8,
    },
    {
      id: 'm5',
      author: 'Akilarの糖果屋',
      authorUrl: 'https://akilar.top/',
      avatar: 'https://npm.elemecdn.com/akilar-candyassets/image/siteicon/favicon.png',
      badge: '🌐 友邻传送',
      isOwner: false,
      mood: '🎵 律动',
      device: '来自好友「Akilar」的花园',
      title: '在浏览器中使用 Web Audio API 绘制实时声波瀑布',
      url: 'https://akilar.top/',
      summary: '音乐不仅是听觉的享受，更是视觉的律动。分享一段仅用纯原生 JS 捕捉音频频谱并渲染在 Canvas 上的轻量方案，不需要引入庞大的第三方音频库。',
      timeAgo: '5小时前',
      timestamp: '2026-10-31 14:10',
      category: 'tech',
      tags: ['WebAudio', 'Canvas', '动效'],
      likes: 29,
      commentCount: 1,
    },
    {
      id: 'm6',
      author: 'Leonus',
      authorUrl: 'https://blog.leonus.cn/',
      avatar: 'https://q1.qlogo.cn/g?b=qq&nk=990320751&s=640',
      badge: '🌐 友邻传送',
      isOwner: false,
      mood: '🌅 自由',
      device: '来自好友「Leonus」的随想',
      title: '秋日骑行记：在城市边缘追逐落日余晖',
      url: 'https://blog.leonus.cn/',
      summary: '放下键盘，骑上单车，沿着滨海公路一路向西。风在耳边呼啸，带走了连续多日重构代码的疲惫。生活除了终端和像素，还有金黄色的落日与旷野。',
      timeAgo: '昨天',
      timestamp: '2026-10-30 19:12',
      category: 'life',
      tags: ['生活记录', '骑行', '摄影'],
      likes: 41,
      commentCount: 4,
    },
    {
      id: 'm7',
      author: '小康的个人博客',
      authorUrl: 'https://www.antmoe.com/',
      avatar: 'https://cdn.jsdelivr.net/gh/sviptzk/StaticFile_HEXO@v3.2.7/butterfly/img/avatar.jpg',
      badge: '🌐 友邻传送',
      isOwner: false,
      mood: '💡 探索',
      device: '来自好友「小康」的笔记',
      title: 'Cloudflare D1 边缘数据库在个人博客评论系统中的实践踩坑',
      url: 'https://www.antmoe.com/',
      summary: '记录一下最近使用 D1 替代传统 MongoDB / MySQL 的心得。Serverless SQLite 的读性能极为惊艳，但并发写入需注意事务边界与冷启动优化。',
      timeAgo: '2天前',
      timestamp: '2026-10-29 14:00',
      category: 'tech',
      tags: ['Cloudflare', 'D1', 'Serverless'],
      likes: 63,
      commentCount: 6,
    },
  ],
};
