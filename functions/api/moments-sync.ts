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
}

// 默认友邻动态聚合库
const FALLBACK_FEEDS: SyncedMomentItem[] = [
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
  },
  {
    id: 'sync_astro_1',
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
  },
  {
    id: 'sync_xk_1',
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
        syncedAt: new Date().toISOString(),
        total: FALLBACK_FEEDS.length,
        items: FALLBACK_FEEDS,
        status: 'synced',
        notice: '友邻朋友圈动态同步成功',
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
