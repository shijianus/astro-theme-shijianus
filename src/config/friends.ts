/**
 * Friends & Moments Configuration
 * 
 * 友人帐与朋友圈数据配置
 * 站长可在此自由增删博友名片、分类与最新动态聚合数据
 */

export interface MomentsSettings {
  /**
   * 空间个性化背景大图 / 装扮壁纸
   */
  coverBg?: string;
  wallpaper?: string;
  /**
   * 站长当前个性签名与状态
   */
  signature?: string;
  statusText?: string;
  weather?: string;
  /**
   * 时间范围过滤，默认为 'all'（完整瀑布流，加载所有历史记录）
   * 可选：'3d' (3天内) | '1w' (1周内) | '1m' (1个月内) | '3m' (3个月内) | '6m' (6个月内) | '1y' (1年内) | 'all' (全部)
   */
  timeRange?: '3d' | '1w' | '1m' | '3m' | '6m' | '1y' | 'all';
  /**
   * 最大展示数量限制，默认 undefined（不设限制，完整瀑布流）
   */
  maxCount?: number;
  /**
   * 是否仅展示置顶说说，默认为 false
   */
  pinnedOnly?: boolean;
  /**
   * 是否自动聚合已开启的友链动态，默认为 true
   */
  autoLoadFriends?: boolean;
}

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
  images?: string[];
  content?: string;
  pinned?: boolean;
}

export const friendsConfig: {
  siteInfo: {
    name: string;
    url: string;
    avatar: string;
    desc: string;
  };
  momentsSettings: MomentsSettings;
  rules: string[];
  categories: FriendCategory[];
  moments: MomentItem[];
} = {
  siteInfo: {
    name: 'EpoCanvas (shijianus)',
    url: 'https://blog.epocanvas.com',
    avatar: '/media/shijianus/avatar.jpg',
    desc: '把研究、开发和生活折叠成可读的记录。在高信息密度里保留阅读秩序。',
  },
  momentsSettings: {
    coverBg: '/media/shijianus/geek-cover.jpg',
    signature: '把研究、开发和生活折叠成可读的记录。在高信息密度里保留阅读秩序。',
    statusText: '☕ 喝咖啡中',
    weather: '☀️ 今日晴 · 状态 空间全速运行中',
    timeRange: 'all', // 默认无时间范围限制，完整瀑布流
    maxCount: undefined, // 默认不设条数上限，加载全部记录
    pinnedOnly: false,
    autoLoadFriends: true,
  },
  rules: [
    '原创优先：内容持续维护，拥有独立思考，杜绝纯搬运或采集站。',
    '稳定可达：支持全站 HTTPS 访问，近 3 个月内有稳定访问与更新记录。',
    '体验良善：界面排版具备基本可读性，无大面积遮挡式广告或弹窗。',
    '先友后链：申请互链前请先将本站添加至您的友链中，互帮互助。',
  ],
  categories: [
    {
      id: 'brand',
      name: 'EpoCanvas 品牌矩阵 · 原生生态',
      desc: '探索数字创作、加密通讯与极客音频的下一代网络服务体系',
      icon: 'terminal',
      items: [
        {
          name: 'EpoMail',
          url: 'https://mail.epocanvas.com',
          avatar: '/media/shijianus/avatar.jpg',
          desc: '极简无干扰的端到端加密极客邮箱服务。',
          tag: '品牌矩阵',
          tagColor: 'blue',
          status: 'online',
          featured: true,
          shijianusTheme: true,
        },
        {
          name: 'EpoCanvas',
          url: 'https://epocanvas.com',
          avatar: '/media/shijianus/avatar.jpg',
          desc: '時代画布：面向现代独立构建者的数字创作工坊与设计系统。',
          tag: '品牌工坊',
          tagColor: 'purple',
          status: 'online',
          featured: true,
          shijianusTheme: true,
        },
        {
          name: 'Sonic',
          url: 'https://sonic.epocanvas.com',
          avatar: '/media/shijianus/avatar.jpg',
          desc: '极客音频工作站：双耳节拍与 Lo-Fi 沉浸心流白噪音引擎。',
          tag: '流媒体音频',
          tagColor: 'green',
          status: 'online',
          featured: true,
          shijianusTheme: true,
        },
      ],
    },
  ],
  moments: [],
};
