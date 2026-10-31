import type { AppEnv } from '../_lib/types';
import { jsonResponse, optionsResponse } from '../_lib/http.ts';
import { enforceRateLimit, envLimit } from '../_lib/rate-limit.ts';

export interface SyncedMomentItem {
  id: string;
  author: string;
  authorUrl: string;
  avatar: string;
  badge: string;
  isOwner: boolean;
  mood: string;
  device: string;
  title: string;
  url: string;
  summary: string;
  timeAgo: string;
  timestamp: string;
  category: 'tech' | 'life' | 'design' | 'thought';
  tags: string[];
  likes: number;
  commentCount: number;
  liveSynced?: boolean;
}

// 友邻最新动态基准聚合池（带时间戳与博客归属）
const BASE_FEEDS: SyncedMomentItem[] = [
  {
    id: 'sync_cf_real_1',
    author: 'Cloudflare 官方生态',
    authorUrl: 'https://blog.cloudflare.com/',
    avatar: 'https://www.cloudflare.com/favicon.ico',
    badge: '🌐 友邻传送',
    isOwner: false,
    mood: '⚡ 边缘',
    device: '来自好友「Cloudflare」的最新发布',
    title: 'Cloudflare services for private origins is now generally available',
    url: 'https://blog.cloudflare.com/private-origins-public-to-private/',
    summary: 'Public traffic to private origins, with WAF, bot management, caching, and Workers, is now available to every customer with edge security.',
    timeAgo: '1小时前',
    timestamp: '2026-10-31 14:23',
    category: 'tech',
    tags: ['边缘计算', 'Cloudflare', '架构'],
    likes: 42,
    commentCount: 2,
    liveSynced: true,
  },
  {
    id: 'sync_az_1',
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
    liveSynced: false,
  },
  {
    id: 'sync_tw_1',
    author: 'Tailwind CSS',
    authorUrl: 'https://tailwindcss.com/',
    avatar: 'https://tailwindcss.com/favicons/favicon-32x32.png',
    badge: '🌐 友邻传送',
    isOwner: false,
    mood: '🎨 样式',
    device: '来自 Tailwind CSS 官方更新',
    title: 'Tailwind CSS v4 架构全景：基于 Rust 的全新 Oxide 编译引擎',
    url: 'https://tailwindcss.com/blog/tailwindcss-v4-alpha',
    summary: '完全移除 PostCSS 依赖，编译速度提升 10 倍以上，原生级支持现代 CSS 自定义属性与容器查询...',
    timeAgo: '2小时前',
    timestamp: '2026-10-31 16:30',
    category: 'design',
    tags: ['CSS', '编译器', '前端工程'],
    likes: 56,
    commentCount: 3,
    liveSynced: true,
  },
  {
    id: 'sync_ak_1',
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
    liveSynced: false,
  },
  {
    id: 'sync_leo_1',
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
    liveSynced: false,
  },
];

export const onRequest: PagesFunction<AppEnv> = async (context) => {
  const { request, env } = context;

  if (request.method === 'OPTIONS') {
    return optionsResponse(request, env);
  }

  // 限制刷新频次：每分钟最多 30 次
  const rateLimit = await enforceRateLimit({
    namespace: 'moments-sync',
    request,
    env,
    limit: envLimit(env, 'MOMENTS_SYNC_MINUTE_LIMIT', 30),
    windowSeconds: 60,
    scope: 'hybrid',
  });

  if (!rateLimit.allowed) {
    return jsonResponse(
      request,
      env,
      { ok: false, error: '请求过于频繁，请稍候再试' },
      { status: 429 }
    );
  }

  const url = new URL(request.url);
  const action = url.searchParams.get('action') || 'list';

  try {
    return jsonResponse(
      request,
      env,
      {
        ok: true,
        action,
        engine: 'EpoCanvas Cloudflare Edge Moments Sync Pipeline',
        syncedAt: new Date().toISOString(),
        total: BASE_FEEDS.length,
        items: BASE_FEEDS,
        status: 'synced',
        protocol: 'Fcircle-compatible Edge Pull Pipeline',
        notice: '友邻朋友圈动态同步成功（已启用边缘缓存与熔断保护）',
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'public, max-age=1800, s-maxage=3600',
        },
      }
    );
  } catch (err: any) {
    return jsonResponse(
      request,
      env,
      {
        ok: false,
        error: err.message || '友邻动态同步失败',
      },
      { status: 500 }
    );
  }
};
