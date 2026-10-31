import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  Rocket,
  MessageSquare,
  Sparkles,
  Flame,
  Clock,
  Search,
  Bold,
  Italic,
  Code,
  Quote,
  List,
  Link as LinkIcon,
  Smile,
  Image as ImageIcon,
  Send,
  Share2,
  Trash2,
  Pencil,
  X,
  ChevronDown,
  ChevronUp,
  Tag,
  AlertCircle,
  Pin,
  CheckCircle2,
  Bookmark,
  Compass,
  Eye,
  Layers,
  CornerDownRight,
  ArrowLeft,
  ChevronsUp,
  ChevronsDown,
  SlidersHorizontal,
  Minus,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import {
  fetchComments,
  createComment,
  editComment,
  deleteComment,
  likeComment,
  readCommentIdentity,
  getCommentInitials,
  uploadCommentImage,
  type BlogComment,
  type CommentIdentity,
} from '../../lib/comment-client';
import { renderCommentMarkdown } from '../../lib/comment-markdown';
import { computeUserLevel } from '../../lib/user-level';

// Board topic channels / dimensions configuration
export const CHANNELS = [
  { id: 'all', label: '全部维度', icon: '🌟', desc: '全站所有主题留言与讨论' },
  { id: 'chat', label: '畅所欲言', icon: '💬', desc: '自由闲聊、日常问候与生活点滴' },
  { id: 'tech', label: '技术探讨', icon: '🛠️', desc: '前端工程、边缘计算、AI与架构心得' },
  { id: 'ideas', label: '灵感交流', icon: '💡', desc: '设计思考、新颖想法与作品探讨' },
  { id: 'life', label: '生活碎碎念', icon: '☕', desc: '阅读留痕、咖啡时光与随感随笔' },
  { id: 'feedback', label: '站点建议', icon: '📮', desc: '功能建议、体验反馈与缺陷报告' },
] as const;

export type ChannelId = (typeof CHANNELS)[number]['id'];

// Horizontal categories requested by user
export const NAV_CATEGORIES = [
  { id: 'latest', label: '最新', icon: Clock },
  { id: 'recent', label: '近期', icon: Sparkles },
  { id: 'dimensions', label: '维度', icon: Layers },
  { id: 'hot', label: '热门', icon: Flame },
  { id: 'featured', label: '精选', icon: Pin },
  { id: 'my', label: '我的贴文', icon: MessageSquare },
  { id: 'read', label: '已读', icon: Eye },
  { id: 'bookmarked', label: '书签', icon: Bookmark },
] as const;

export type NavCategoryId = (typeof NAV_CATEGORIES)[number]['id'];

// Curated Emojis Palette
const EMOJI_GROUPS = [
  {
    name: '常用表情',
    emojis: ['😀', '😃', '😄', '😆', '😅', '😂', '🤣', '😊', '🥹', '😍', '🥰', '😋', '🤔', '🤫', '🤗', '🫡', '🥳', '😎'],
  },
  {
    name: '思想与手势',
    emojis: ['👍', '🙌', '👏', '🤝', '✌️', '🫰', '🤙', '💪', '🙏', '💡', '🔥', '🚀', '✨', '🎯', '💯', '⚡', '🎉', '🌟'],
  },
  {
    name: '生活与符号',
    emojis: ['☕', '🍵', '🌱', '🌿', '📖', '💻', '🎨', '🎵', '🕹️', '🛡️', '💬', '💭', '❤️', '🧡', '💛', '💚', '💙', '💜'],
  },
];

// Starter Boost viewpoint messages (ensuring top stream has diverse thoughts on first view)
const STARTER_BOOSTS: BlogComment[] = [
  // Track 1 (Index 0, 3, 6)
  {
    id: 'boost_starter_1',
    postSlug: 'guestbook',
    parentId: null,
    postType: 'boost',
    tag: 'chat',
    authorId: 'reader_1',
    authorName: '星河漫游者',
    authorAvatar: '/media/shijianus/avatar.jpg',
    authorRole: 'member',
    message: '🌟 尺素寸心，愿我们的独立思考在边缘节点恒久闪烁！',
    likesCount: 5,
    reactions: { summary: { '❤️': 3, '🚀': 2 }, users: {} },
    status: 'approved',
    createdAt: '2026-10-31T01:00:00.000Z',
    showLocation: true,
    ipCountryFlag: '🇨🇳',
    ipCountryName: '中国',
    ipLocation: '上海',
  },
  {
    id: 'boost_starter_4',
    postSlug: 'guestbook',
    parentId: null,
    postType: 'boost',
    tag: 'ideas',
    authorId: 'reader_4',
    authorName: 'DesignCrafter',
    authorRole: 'member',
    message: '🎨 楼下 Gesture 的楼层时间轴滑块做得非常有质感，很有仪式感！',
    likesCount: 6,
    reactions: { summary: { '💡': 4, '✨': 2 }, users: {} },
    status: 'approved',
    createdAt: '2026-10-31T02:15:00.000Z',
    showLocation: true,
    ipCountryFlag: '🇯🇵',
    ipCountryName: '日本',
    ipLocation: 'Tokyo',
  },
  {
    id: 'boost_starter_7',
    postSlug: 'guestbook',
    parentId: null,
    postType: 'boost',
    tag: 'tech',
    authorId: 'reader_7',
    authorName: 'Rustacean',
    authorRole: 'member',
    message: '🦀 边缘运行时轻量可靠，低延迟交互让全站讨论流畅如飞。',
    likesCount: 4,
    reactions: { summary: { '⚡': 4 }, users: {} },
    status: 'approved',
    createdAt: '2026-10-31T03:00:00.000Z',
    showLocation: true,
    ipCountryFlag: '🇩🇪',
    ipCountryName: '德国',
    ipLocation: 'Frankfurt',
  },

  // Track 2 (Index 1, 4, 7)
  {
    id: 'boost_starter_2',
    postSlug: 'guestbook',
    parentId: null,
    postType: 'boost',
    tag: 'tech',
    authorId: 'reader_2',
    authorName: 'KernelHacker',
    authorRole: 'member',
    message: '⚡ 边缘计算的毫秒级落盘体验非常丝滑，短句观点随手记录毫无负担！',
    likesCount: 4,
    reactions: { summary: { '🔥': 4 }, users: {} },
    status: 'approved',
    createdAt: '2026-10-31T01:30:00.000Z',
    showLocation: true,
    ipCountryFlag: '🇸🇬',
    ipCountryName: '新加坡',
    ipLocation: 'Singapore',
  },
  {
    id: 'boost_starter_5',
    postSlug: 'guestbook',
    parentId: null,
    postType: 'boost',
    tag: 'feedback',
    authorId: 'reader_5',
    authorName: 'CodePilot',
    authorRole: 'member',
    message: '🚀 Boost 轻触即发，30字极简观点表达，随时留下思想切片！',
    likesCount: 2,
    reactions: { summary: { '🎉': 2 }, users: {} },
    status: 'approved',
    createdAt: '2026-10-31T02:40:00.000Z',
    showLocation: true,
    ipCountryFlag: '🇺🇸',
    ipCountryName: '美国',
    ipLocation: 'California',
  },
  {
    id: 'boost_starter_8',
    postSlug: 'guestbook',
    parentId: null,
    postType: 'boost',
    tag: 'life',
    authorId: 'reader_8',
    authorName: '青空与海',
    authorRole: 'member',
    message: '🌊 无论身处何地，敲下几句此刻的想法，都是给世界的信号。',
    likesCount: 5,
    reactions: { summary: { '✨': 3, '❤️': 2 }, users: {} },
    status: 'approved',
    createdAt: '2026-10-31T03:20:00.000Z',
    showLocation: true,
    ipCountryFlag: '🇨🇦',
    ipCountryName: '加拿大',
    ipLocation: 'Vancouver',
  },

  // Track 3 (Index 2, 5, 8)
  {
    id: 'boost_starter_3',
    postSlug: 'guestbook',
    parentId: null,
    postType: 'boost',
    tag: 'life',
    authorId: 'reader_3',
    authorName: '晨光微熹',
    authorRole: 'member',
    message: '☕ 清晨喝一杯手冲曼特宁，阅读博主的工程规范，收获满满。',
    likesCount: 3,
    reactions: { summary: { '👍': 3 }, users: {} },
    status: 'approved',
    createdAt: '2026-10-31T02:00:00.000Z',
    showLocation: true,
    ipCountryFlag: '🇨🇳',
    ipCountryName: '中国',
    ipLocation: '浙江 · 杭州',
  },
  {
    id: 'boost_starter_6',
    postSlug: 'guestbook',
    parentId: null,
    postType: 'boost',
    tag: 'chat',
    authorId: 'reader_6',
    authorName: '极客漫步',
    authorRole: 'member',
    message: '💡 悬浮面板边浏览边拟稿，完全不遮挡阅读心流，体验满分！',
    likesCount: 7,
    reactions: { summary: { '💯': 4, '👍': 3 }, users: {} },
    status: 'approved',
    createdAt: '2026-10-31T02:50:00.000Z',
    showLocation: true,
    ipCountryFlag: '🇨🇳',
    ipCountryName: '中国',
    ipLocation: '北京',
  },
  {
    id: 'boost_starter_9',
    postSlug: 'guestbook',
    parentId: null,
    postType: 'boost',
    tag: 'ideas',
    authorId: 'reader_9',
    authorName: 'PixelArtist',
    authorRole: 'member',
    message: '🎯 3排自适应流速展示很舒展，单句焦点清晰，毫无视觉喧嚣感。',
    likesCount: 3,
    reactions: { summary: { '🎨': 3 }, users: {} },
    status: 'approved',
    createdAt: '2026-10-31T03:40:00.000Z',
    showLocation: true,
    ipCountryFlag: '🇦🇺',
    ipCountryName: '澳大利亚',
    ipLocation: 'Sydney',
  },
];

// Official Pinned Rule & Welcome Threads (Anchor)
export const OFFICIAL_PINNED_POSTS: BlogComment[] = [
  {
    id: 'pinned_welcome_official',
    postSlug: 'guestbook',
    parentId: null,
    postType: 'gesture',
    tag: 'chat',
    authorId: 'admin',
    authorName: 'shijianus',
    authorAvatar: '/media/shijianus/avatar.jpg',
    authorRole: 'admin',
    authorWebsite: 'https://blog.epocanvas.com',
    message: `### 🌟 欢迎来到全站留言与读者交流广场！

这里是为所有读者与探索者打造的开放交流空间。我们采用了**楼上 Boost 观点流 + 楼下 Gesture 话题广场**的分层架构：

#### 🚀 楼上 Boost：瞬时观点流
- 专为**快速表达即时想法与简短看法**设计的短句平台（限 30 字以内）；
- 不设长文排版与复杂回复，免去沉重负担，在顶部平台常驻轮播呈现全站最新声音。

#### 📝 楼下 Gesture：深度讨论广场
- 适合展开系统性思考与深度对话（8 字以上），支持完整 Markdown、代码高亮、多图与楼层跟帖；
- **点击条目直接点进去查看详情**，配备**右侧长条百分比滑动当前楼层进度条**（支持拖拽/点击指定楼层快速跳转）；
- 顶部导航条支持切换 **最新、近期、维度、热门、精选、我的贴文、已读、书签**；
- 底部配备**非阻塞悬浮起草面板**，支持在浏览全站讨论的同时随时拟写观点与话题。

欢迎点击 **「发布 Gesture」** 留下你的思想足迹！✨`,
    likesCount: 12,
    reactions: {
      summary: { '👍': 7, '🚀': 5, '✨': 4, '❤️': 6 },
      users: {},
    },
    status: 'pinned',
    createdAt: '2026-10-31T00:20:00.000Z',
    showLocation: true,
    ipCountryFlag: '🇨🇳',
    ipCountryName: '中国',
    ipLocation: '浙江 · 杭州',
  },
  {
    id: 'pinned_rules_community',
    postSlug: 'guestbook',
    parentId: null,
    postType: 'gesture',
    tag: 'feedback',
    authorId: 'admin',
    authorName: 'shijianus',
    authorAvatar: '/media/shijianus/avatar.jpg',
    authorRole: 'admin',
    authorWebsite: 'https://blog.epocanvas.com',
    message: `### 📜 全站留言与讨论广场公约及社群守则

为了维护理性、自由、深度且充满温度的技术与思考交流环境，请所有参与者共同遵守本公约：

#### 1. 关于 Boost 与 Gesture 的定位规范
- **Boost（短句观点）**：适合表达即时的思考片段、短评、感悟与问候。字数限 **30 字以内**，不设多级嵌套回复，由系统在顶部观点流自适应轮播呈现；
- **Gesture（深度讨论）**：适合展开严谨的技术探讨、架构分析、生活随笔或设计沉淀。需 **8 字以上**，支持完整 Markdown、语法高亮代码块、多图画廊与多楼层跟帖互动。

#### 2. 发帖与文明互动守则
- **友善交流，互相尊重**：尊重不同技术选型与认知视角，严禁人身攻击、煽动对立、低俗谩骂或歧视性言论；
- **拒绝无意义灌水与垃圾信息**：请勿发布无意义纯标点符号或批量重复刷屏，简短心得请优先使用 Boost；
- **排版规范与结构化沉淀**：长篇讨论请善用 Markdown 分级标题、代码块与引用，方便其他探索者深度阅读与索引；
- **知识产权与原创保护**：转载或引用他处内容请务必注明出处来源，鼓励原创思考与真诚交流。

共同守护这片属于所有探索者的思想绿洲！🌿`,
    likesCount: 9,
    reactions: {
      summary: { '🛡️': 6, '👍': 5, '❤️': 3 },
      users: {},
    },
    status: 'pinned',
    createdAt: '2026-10-31T00:05:00.000Z',
    showLocation: true,
    ipCountryFlag: '🇨🇳',
    ipCountryName: '中国',
    ipLocation: '浙江 · 杭州',
  },
  {
    id: 'pinned_architecture_privacy',
    postSlug: 'guestbook',
    parentId: null,
    postType: 'gesture',
    tag: 'tech',
    authorId: 'admin',
    authorName: 'shijianus',
    authorAvatar: '/media/shijianus/avatar.jpg',
    authorRole: 'admin',
    authorWebsite: 'https://blog.epocanvas.com',
    message: `### ⚡ 关于边缘分布式架构、D1 毫秒级落盘与数据隐私保护说明

本站留言板与交流广场采用现代 Serverless 边缘分布式架构，为所有读者提供极低延迟与数据隐私保障：

#### 1. 边缘计算与分布式数据架构
- **零冷启动全球就近处理**：基于 Cloudflare Pages Functions 与 Workers，所有读写请求在离你物理距离最近的边缘节点瞬时响应；
- **分布式 D1 数据库**：留言数据持久化落盘至全球分布式 SQL 引擎，配合智能缓存策略保障首屏即时加载；
- **非阻塞交互体验**：全站单页路由与右下角非阻塞悬浮起草底座协同工作，边看帖边构思，绝不割裂阅读心流。

#### 2. 隐私合规与访客权益保护
- **无明文 IP 暴露**：边缘节点仅提取合规的地理国家/地区国旗与城市名称（如 🇨🇳 浙江 · 杭州），严禁向任何前端或第三方接口暴露明文 IP；
- **访客临时会话安全所有权**：访客发言后持有时效性临时凭证，可对当前留言就地微调；关闭或刷新浏览器后凭证在内存中安全销毁，杜绝越权；
- **数据自主与去中心化**：不接入任何第三方广告追踪器或数据采集脚本，尊重每位读者的数字足迹。`,
    likesCount: 11,
    reactions: {
      summary: { '⚡': 7, '💡': 6, '🚀': 4 },
      users: {},
    },
    status: 'pinned',
    createdAt: '2026-10-31T00:10:00.000Z',
    showLocation: true,
    ipCountryFlag: '🇨🇳',
    ipCountryName: '中国',
    ipLocation: '浙江 · 杭州',
  },
  {
    id: 'pinned_dimensions_guide',
    postSlug: 'guestbook',
    parentId: null,
    postType: 'gesture',
    tag: 'ideas',
    authorId: 'admin',
    authorName: 'shijianus',
    authorAvatar: '/media/shijianus/avatar.jpg',
    authorRole: 'admin',
    authorWebsite: 'https://blog.epocanvas.com',
    message: `### 💡 讨论维度（Channels）划分、Tag 标签与内容检索指南

为了让每一种思考与话题都能在广场中找到最契合的声场与归属，我们设立了清晰的分类与索引机制：

#### 1. 六大讨论维度说明
- 💬 **畅所欲言**：日常闲聊、生活感悟、友邻问候；
- 🛠️ **技术探讨**：前端架构、边缘计算、AI 工具、工程实践；
- 💡 **灵感交流**：UI/UX 设计思考、新想法探讨、原型分享；
- ☕ **生活碎碎念**：阅读心得、咖啡时光、户外探索；
- 📮 **站点建议**：功能建议、体验反馈与缺陷报告；
- 🌟 **全部维度**：全景聚合全站所有话题。

#### 2. 自定义 Tag 标签与智能分类
- 在悬浮面板起草话题时，可自由添加标签（如 \`#前端 #性能优化\`），便于关键词关联；
- 当内容低于 8 字或低于 30 字且未填写标题与标签时，系统将智能识别为 **Boost** 观点，一键即刻发布上墙；
- 广场活跃区默认展示最新 20 篇热议 Gesture，所有历史长帖均可通过顶部的**分区下拉框**或**全文搜索框**随时检索。`,
    likesCount: 8,
    reactions: {
      summary: { '✨': 5, '🎯': 4, '👍': 3 },
      users: {},
    },
    status: 'pinned',
    createdAt: '2026-10-31T00:12:00.000Z',
    showLocation: true,
    ipCountryFlag: '🇨🇳',
    ipCountryName: '中国',
    ipLocation: '浙江 · 杭州',
  },
];

const OFFICIAL_PINNED_POST = OFFICIAL_PINNED_POSTS[0];

// Starter replies for pinned post to demonstrate the floor slider immediately
const STARTER_PINNED_REPLIES: BlogComment[] = [
  {
    id: 'reply_floor_2_official',
    postSlug: 'guestbook',
    parentId: 'pinned_welcome_official',
    postType: 'gesture',
    tag: 'tech',
    authorId: 'reader_alice',
    authorName: 'Alice',
    authorRole: 'member',
    message: '体验了右侧的长条百分比楼层滑块，拖拽和点击跳转指定楼层非常灵敏，阅读长篇讨论毫无迷航感！',
    likesCount: 3,
    reactions: { summary: { '👍': 3 }, users: {} },
    status: 'approved',
    createdAt: '2026-10-31T00:15:00.000Z',
    showLocation: true,
    ipCountryFlag: '🇨🇳',
    ipCountryName: '中国',
    ipLocation: '北京',
  },
  {
    id: 'reply_floor_3_official',
    postSlug: 'guestbook',
    parentId: 'pinned_welcome_official',
    postType: 'gesture',
    tag: 'tech',
    authorId: 'reader_bob',
    authorName: 'Bob_Dev',
    authorRole: 'member',
    message: '楼上常驻的 Boost 观点流很生动，把即时短评和深度长帖解耦，界面的层次感瞬间拉满了。支持！',
    likesCount: 4,
    reactions: { summary: { '🚀': 2, '❤️': 2 }, users: {} },
    status: 'approved',
    createdAt: '2026-10-31T00:45:00.000Z',
    showLocation: true,
    ipCountryFlag: '🇺🇸',
    ipCountryName: '美国',
    ipLocation: 'San Jose',
  },
  {
    id: 'reply_floor_4_official',
    postSlug: 'guestbook',
    parentId: 'pinned_welcome_official',
    postType: 'gesture',
    tag: 'tech',
    authorId: 'reader_carol',
    authorName: 'Carol_UI',
    authorRole: 'member',
    message: '横排分类里的“书签”和“已读”功能很实用，逛论坛或者深度讨论时可以随手收藏感兴趣的 Gesture。',
    likesCount: 2,
    reactions: { summary: { '💡': 2 }, users: {} },
    status: 'approved',
    createdAt: '2026-10-31T01:10:00.000Z',
    showLocation: true,
    ipCountryFlag: '🇨🇳',
    ipCountryName: '中国',
    ipLocation: '广东 · 深圳',
  },
];

export function GuestbookBoard() {
  // Navigation & View state
  const [activeView, setActiveView] = useState<'list' | 'detail'>('list');
  const [activeGestureId, setActiveGestureId] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<NavCategoryId>('latest');
  const [selectedDimension, setSelectedDimension] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [showDimensionDropdown, setShowDimensionDropdown] = useState(false);

  const categoryDropdownRef = useRef<HTMLDivElement>(null);
  const dimensionDropdownRef = useRef<HTMLDivElement>(null);

  // Local storage lists for read & bookmarked posts
  const [readPostIds, setReadPostIds] = useState<string[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      return JSON.parse(localStorage.getItem('shijianus_guestbook_reads') || '[]');
    } catch {
      return [];
    }
  });

  const [bookmarkedPostIds, setBookmarkedPostIds] = useState<string[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      return JSON.parse(localStorage.getItem('shijianus_guestbook_bookmarks') || '[]');
    } catch {
      return [];
    }
  });

  // DB comments
  const [dbComments, setDbComments] = useState<BlogComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);
  const [identity, setIdentity] = useState<CommentIdentity | null>(null);

  // Top Boost Stream State
  const [isBoostMarqueePaused, setIsBoostMarqueePaused] = useState(false);

  // Floating Non-blocking Composer Dock State
  const [showComposer, setShowComposer] = useState(false);
  const [isComposerMinimized, setIsComposerMinimized] = useState(false);
  const [isComposerMaximized, setIsComposerMaximized] = useState(false);

  // Unified Draft inputs for Composer (Intelligently detects Boost vs Gesture)
  const [composerTitle, setComposerTitle] = useState('');
  const [composerText, setComposerText] = useState('');
  const [composerDimension, setComposerDimension] = useState<string>('all');
  const [composerTags, setComposerTags] = useState('');
  const [composerImages, setComposerImages] = useState<string[]>([]);
  const [composerUploading, setComposerUploading] = useState(false);
  const [composerPreviewTab, setComposerPreviewTab] = useState<'write' | 'preview'>('write');
  const [composerShowEmoji, setComposerShowEmoji] = useState(false);
  const [composerSubmitting, setComposerSubmitting] = useState(false);
  const [composerError, setComposerError] = useState<string | null>(null);

  // Gesture Detail View State
  const [detailReplyMessage, setDetailReplyMessage] = useState('');
  const [detailReplyImages, setDetailReplyImages] = useState<string[]>([]);
  const [detailReplyUploading, setDetailReplyUploading] = useState(false);
  const [detailReplyPreviewTab, setDetailReplyPreviewTab] = useState<'write' | 'preview'>('write');
  const [detailReplyShowEmoji, setDetailReplyShowEmoji] = useState(false);
  const [detailReplySubmitting, setDetailReplySubmitting] = useState(false);
  const [replyTargetFloor, setReplyTargetFloor] = useState<{ id: string; author: string } | null>(null);

  // Floor Timeline Scroller State (for detail view)
  const [currentFloor, setCurrentFloor] = useState(1);
  const [scrollPercent, setScrollPercent] = useState(0);

  const gestureTextareaRef = useRef<HTMLTextAreaElement>(null);
  const detailReplyTextareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const detailFileInputRef = useRef<HTMLInputElement>(null);

  const showToast = (msg: string) => setToastMessage(msg);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        categoryDropdownRef.current &&
        !categoryDropdownRef.current.contains(target)
      ) {
        setShowCategoryDropdown(false);
      }
      if (
        dimensionDropdownRef.current &&
        !dimensionDropdownRef.current.contains(target)
      ) {
        setShowDimensionDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Load identity & fetch comments
  useEffect(() => {
    setIdentity(readCommentIdentity());

    async function loadData() {
      try {
        setLoading(true);
        const res = await fetchComments('guestbook');
        if (res.ok && res.comments) {
          setDbComments(res.comments);
        }
      } catch (err) {
        console.error('Failed to load guestbook comments:', err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  // Sync with URL hash for direct links (e.g., #gesture-<id>)
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      if (hash.startsWith('#gesture-')) {
        const targetId = hash.replace('#gesture-', '');
        setActiveGestureId(targetId);
        setActiveView('detail');
        markAsRead(targetId);
      } else if (!hash) {
        setActiveView('list');
        setActiveGestureId(null);
      }
    };

    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Update read posts
  const markAsRead = useCallback((id: string) => {
    setReadPostIds((prev) => {
      if (prev.includes(id)) return prev;
      const next = [id, ...prev];
      try {
        localStorage.setItem('shijianus_guestbook_reads', JSON.stringify(next));
      } catch {}
      return next;
    });
  }, []);

  // Toggle bookmark
  const toggleBookmark = useCallback((id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setBookmarkedPostIds((prev) => {
      const isBookmarked = prev.includes(id);
      const next = isBookmarked ? prev.filter((item) => item !== id) : [id, ...prev];
      try {
        localStorage.setItem('shijianus_guestbook_bookmarks', JSON.stringify(next));
      } catch {}
      showToast(isBookmarked ? '🔖 已移出书签' : '⭐ 已加入书签');
      return next;
    });
  }, []);

  // Toast timer
  useEffect(() => {
    if (!toastMessage) return;
    const t = setTimeout(() => setToastMessage(null), 3200);
    return () => clearTimeout(t);
  }, [toastMessage]);

  // Merge starter Boosts with DB Boosts
  const allBoostComments = useMemo(() => {
    const fromDb = dbComments.filter((c) => c.postType === 'boost');
    const existingIds = new Set(fromDb.map((c) => c.id));
    const starters = STARTER_BOOSTS.filter((c) => !existingIds.has(c.id));
    return [...fromDb, ...starters];
  }, [dbComments]);

  // 3 Tracks partitioning for Boost stream (Each Boost comment appears strictly ONCE)
  const { boostRow1, boostRow2, boostRow3 } = useMemo(() => {
    const row1: BlogComment[] = [];
    const row2: BlogComment[] = [];
    const row3: BlogComment[] = [];

    allBoostComments.forEach((b, idx) => {
      if (idx % 3 === 0) row1.push(b);
      else if (idx % 3 === 1) row2.push(b);
      else row3.push(b);
    });

    return { boostRow1: row1, boostRow2: row2, boostRow3: row3 };
  }, [allBoostComments]);

  // Animation speed directly proportional to information density:
  // More items -> faster scroll (shorter duration); Fewer items -> slower scroll (longer duration)
  const boostAnimDuration = useMemo(() => {
    const count = allBoostComments.length;
    const dur = Math.max(18, Math.min(58, Math.round(58 - count * 1.5)));
    return `${dur}s`;
  }, [allBoostComments.length]);

  // Merge starter pinned posts (all 4 official topics) & starter replies with DB comments
  const allGestureCommentsWithPinned = useMemo(() => {
    const existingIds = new Set(dbComments.map((c) => c.id));
    const missingPinned = OFFICIAL_PINNED_POSTS.filter((p) => !existingIds.has(p.id));
    let list = [...missingPinned, ...dbComments];

    // Ensure starter replies exist if pinned post has no replies
    const hasStarterReplies = list.some((c) => c.parentId === OFFICIAL_PINNED_POSTS[0].id);
    if (!hasStarterReplies) {
      list = [...list, ...STARTER_PINNED_REPLIES];
    }
    return list;
  }, [dbComments]);

  // Intelligent Dynamic Type Detection for Floating Composer:
  // - < 8 chars: definitely Boost
  // - <= 30 chars with no title, no custom tag, no image, no specific dimension: Boost
  // - otherwise: Gesture
  const trimmedComposerText = composerText.trim();
  const hasComposerTitle = composerTitle.trim().length > 0;
  const hasComposerTags = composerTags.trim().length > 0;
  const hasComposerImages = composerImages.length > 0;
  const hasComposerSpecificDim = composerDimension !== 'all' && composerDimension !== '';

  const determinedType: 'boost' | 'gesture' = useMemo(() => {
    const len = trimmedComposerText.length;
    if (len < 8) return 'boost';
    if (len <= 30 && !hasComposerTitle && !hasComposerTags && !hasComposerImages && !hasComposerSpecificDim) {
      return 'boost';
    }
    return 'gesture';
  }, [trimmedComposerText, hasComposerTitle, hasComposerTags, hasComposerImages, hasComposerSpecificDim]);

  // Organize Gestures into Top-Level Posts vs Replies
  const { topLevelGestures, repliesByParent } = useMemo(() => {
    const top: BlogComment[] = [];
    const rep: Record<string, BlogComment[]> = {};

    for (const c of allGestureCommentsWithPinned) {
      // Exclude Boost from Gesture feed
      if (c.postType === 'boost') continue;

      if (c.parentId) {
        if (!rep[c.parentId]) rep[c.parentId] = [];
        rep[c.parentId].push(c);
      } else {
        top.push(c);
      }
    }

    return { topLevelGestures: top, repliesByParent: rep };
  }, [allGestureCommentsWithPinned]);

  // Filtered Gestures according to the 8 horizontal categories
  const filteredGestures = useMemo(() => {
    let list = [...topLevelGestures];

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (c) =>
          c.message.toLowerCase().includes(q) ||
          (c.authorName && c.authorName.toLowerCase().includes(q)) ||
          (c.tag && c.tag.toLowerCase().includes(q))
      );
    }

    // Dimension / Tag filter (when active or selected)
    if (selectedDimension !== 'all') {
      list = list.filter((c) => (c.tag || 'tech') === selectedDimension);
    }

    // Apply the 8 categories
    switch (categoryFilter) {
      case 'latest':
        // Pinned on top, then newest
        list.sort((a, b) => {
          if (a.status === 'pinned' && b.status !== 'pinned') return -1;
          if (b.status === 'pinned' && a.status !== 'pinned') return 1;
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });
        break;

      case 'recent':
        // Active recently (within 7 days)
        const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
        list = list.filter(
          (c) => new Date(c.createdAt).getTime() >= sevenDaysAgo || c.status === 'pinned'
        );
        list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;

      case 'dimensions':
        // Kept filtered by dimension, default order
        list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;

      case 'hot':
        // Hot: sort by replies count * 3 + likes
        list.sort((a, b) => {
          const scoreA = (repliesByParent[a.id]?.length || 0) * 3 + (a.likesCount || 0);
          const scoreB = (repliesByParent[b.id]?.length || 0) * 3 + (b.likesCount || 0);
          return scoreB - scoreA;
        });
        break;

      case 'featured':
        // Featured: pinned or high likes
        list = list.filter((c) => c.status === 'pinned' || (c.likesCount || 0) >= 3);
        list.sort((a, b) => (b.likesCount || 0) - (a.likesCount || 0));
        break;

      case 'my':
        // My posts
        if (!identity?.id) {
          list = [];
        } else {
          list = list.filter(
            (c) => c.authorId === identity.id || c.authorName === identity.name
          );
        }
        break;

      case 'read':
        // Read posts
        list = list.filter((c) => readPostIds.includes(c.id));
        break;

      case 'bookmarked':
        // Bookmarked posts
        list = list.filter((c) => bookmarkedPostIds.includes(c.id));
        break;
    }

    return list;
  }, [
    topLevelGestures,
    categoryFilter,
    selectedDimension,
    searchQuery,
    repliesByParent,
    identity,
    readPostIds,
    bookmarkedPostIds,
  ]);

  // Active Gesture Display Cap (At most 20 items per view, older items remain in DB and searchable)
  const displayedGestures = useMemo(() => {
    return filteredGestures.slice(0, 20);
  }, [filteredGestures]);

  // Current Active Gesture in detail view
  const currentGesture = useMemo(() => {
    if (!activeGestureId) return null;
    return allGestureCommentsWithPinned.find((c) => c.id === activeGestureId) || null;
  }, [activeGestureId, allGestureCommentsWithPinned]);

  // Current Active Gesture's replies
  const currentReplies = useMemo(() => {
    if (!activeGestureId) return [];
    const rep = repliesByParent[activeGestureId] || [];
    return [...rep].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
  }, [activeGestureId, repliesByParent]);

  // Total floors for detail view: 1 (OP) + replies.length
  const totalFloors = useMemo(() => {
    return 1 + currentReplies.length;
  }, [currentReplies]);

  // Floor Timeline Scroll Tracker in Detail View
  useEffect(() => {
    if (activeView !== 'detail') return;

    const handleScroll = () => {
      const floors = document.querySelectorAll('.gb-floor-target');
      if (!floors.length) return;

      const viewportMiddle = window.innerHeight * 0.45;
      let activeIdx = 0;

      floors.forEach((floor, idx) => {
        const rect = floor.getBoundingClientRect();
        if (rect.top <= viewportMiddle) {
          activeIdx = idx;
        }
      });

      const floorNum = activeIdx + 1;
      setCurrentFloor(floorNum);
      const total = floors.length;
      const pct = Math.min(100, Math.max(0, Math.round((floorNum / total) * 100)));
      setScrollPercent(pct);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    // Run once initially
    setTimeout(handleScroll, 200);

    return () => window.removeEventListener('scroll', handleScroll);
  }, [activeView, activeGestureId, currentReplies]);

  // Jump to floor
  const jumpToFloor = (floorNumber: number) => {
    const el = document.getElementById(`floor-${floorNumber}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Jump to reply composer
  const jumpToComposer = () => {
    const el = document.getElementById('detail-reply-composer');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      detailReplyTextareaRef.current?.focus();
    }
  };

  // Enter Gesture Detail View
  const openGestureDetail = (item: BlogComment) => {
    setActiveGestureId(item.id);
    setActiveView('detail');
    markAsRead(item.id);
    window.location.hash = `#gesture-${item.id}`;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Exit Gesture Detail View
  const closeGestureDetail = () => {
    setActiveView('list');
    setActiveGestureId(null);
    window.location.hash = '';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Open Floating Dock Composer
  const openFloatingComposer = useCallback(() => {
    setShowComposer(true);
    setIsComposerMinimized(false);
    setComposerError(null);
  }, []);

  // ----------------------------------------------------
  // SUBMISSION HANDLERS
  // ----------------------------------------------------

  // 1. Submit from Floating Composer (Intelligently handles Boost or Gesture)
  const handleComposerSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const text = composerText.trim();
    if (!text) {
      setComposerError('⚠️ 请输入讨论或观点内容');
      return;
    }

    try {
      setComposerSubmitting(true);
      setComposerError(null);

      if (determinedType === 'boost') {
        if (text.length > 30) {
          setComposerError('🚀 Boost 不能超过 30 个字');
          setComposerSubmitting(false);
          return;
        }

        const res = await createComment({
          postSlug: 'guestbook',
          message: text,
          postType: 'boost',
          tag: composerDimension !== 'all' ? composerDimension : 'chat',
          identity: identity || undefined,
        });

        if (res.ok && res.comment) {
          setDbComments((prev) => [res.comment!, ...prev]);
          setComposerText('');
          setShowComposer(false);
          showToast('🚀 Boost 观点已成功发布！');
        } else {
          setComposerError(res.error || '发布失败，请稍后重试');
        }
      } else {
        // Gesture Mode
        if (text.length < 8) {
          setComposerError('📝 Gesture 讨论内容至少需要 8 个字');
          setComposerSubmitting(false);
          return;
        }

        let finalMessage = text;
        if (composerTitle.trim()) {
          finalMessage = `### ${composerTitle.trim()}\n\n${finalMessage}`;
        }
        if (composerTags.trim()) {
          const formattedTags = composerTags
            .split(/[\s,，]+/)
            .filter(Boolean)
            .map((t) => (t.startsWith('#') ? t : `#${t}`))
            .join(' ');
          finalMessage = `${finalMessage}\n\n${formattedTags}`;
        }
        if (composerImages.length > 0) {
          const imgMd = composerImages.map((src) => `\n![image](${src})`).join('');
          finalMessage += imgMd;
        }

        const res = await createComment({
          postSlug: 'guestbook',
          message: finalMessage,
          postType: 'gesture',
          tag: composerDimension !== 'all' ? composerDimension : 'tech',
          identity: identity || undefined,
        });

        if (res.ok && res.comment) {
          setDbComments((prev) => [res.comment!, ...prev]);
          setShowComposer(false);
          setComposerTitle('');
          setComposerText('');
          setComposerTags('');
          setComposerImages([]);
          showToast('✨ Gesture 发布成功！已进入详情讨论');
          openGestureDetail(res.comment);
        } else {
          setComposerError(res.error || '发布失败，请检查网络');
        }
      }
    } catch (err: any) {
      setComposerError(err.message || '网络连接异常');
    } finally {
      setComposerSubmitting(false);
    }
  };

  // 3. Submit Reply in Detail View
  const handleDetailReplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentGesture) return;

    let body = detailReplyMessage.trim();
    if (!body) {
      showToast('⚠️ 请填写回复内容');
      return;
    }

    if (replyTargetFloor) {
      body = `> @${replyTargetFloor.author}\n\n${body}`;
    }

    if (detailReplyImages.length > 0) {
      const imgMd = detailReplyImages.map((src) => `\n![image](${src})`).join('');
      body += imgMd;
    }

    try {
      setDetailReplySubmitting(true);
      const res = await createComment({
        postSlug: 'guestbook',
        parentId: currentGesture.id,
        message: body,
        postType: 'gesture',
        tag: currentGesture.tag,
        identity: identity || undefined,
      });

      if (res.ok && res.comment) {
        setDbComments((prev) => [...prev, res.comment!]);
        setDetailReplyMessage('');
        setDetailReplyImages([]);
        setReplyTargetFloor(null);
        showToast('💬 回复已发表到最新楼层！');
        // Scroll to the new floor
        setTimeout(() => {
          jumpToFloor(totalFloors + 1);
        }, 300);
      } else {
        showToast(res.error || '回复失败，请重试');
      }
    } catch (err: any) {
      showToast(err.message || '网络连接异常');
    } finally {
      setDetailReplySubmitting(false);
    }
  };

  // Reactions toggle
  const handleReaction = async (commentId: string, emoji: string) => {
    try {
      const res = await likeComment(commentId, emoji);
      if (res.ok && res.comment) {
        setDbComments((prev) =>
          prev.map((c) => (c.id === commentId ? { ...c, ...res.comment } : c))
        );
      }
    } catch (err) {
      console.error('Reaction toggle error:', err);
    }
  };

  // Markdown tool handler
  const insertMarkdownHelper = (
    ref: React.RefObject<HTMLTextAreaElement | null>,
    setter: React.Dispatch<React.SetStateAction<string>>,
    prefix: string,
    suffix: string = ''
  ) => {
    const textarea = ref.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const val = textarea.value;
    const selected = val.substring(start, end);
    const replacement = `${prefix}${selected}${suffix}`;
    setter(val.substring(0, start) + replacement + val.substring(end));
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, end + prefix.length);
    }, 50);
  };

  // Image Upload helper
  const handleImageFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
    setUploading: (b: boolean) => void,
    setImages: React.Dispatch<React.SetStateAction<string[]>>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      const res = await uploadCommentImage(file);
      if (res.ok && res.url) {
        setImages((prev) => [...prev, res.url!]);
        showToast('🖼️ 图片上传成功！');
      } else {
        showToast(res.error || '图片上传失败');
      }
    } catch (err: any) {
      showToast(err.message || '上传异常');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const formatTime = (isoString?: string) => {
    if (!isoString) return '刚刚';
    try {
      const date = new Date(isoString);
      const diff = Date.now() - date.getTime();
      const minutes = Math.floor(diff / 60000);
      if (minutes < 1) return '刚刚';
      if (minutes < 60) return `${minutes}分钟前`;
      const hours = Math.floor(minutes / 60);
      if (hours < 24) return `${hours}小时前`;
      const days = Math.floor(hours / 24);
      if (days < 30) return `${days}天前`;
      return date.toLocaleDateString();
    } catch {
      return '刚刚';
    }
  };

  const currentCategoryObj = NAV_CATEGORIES.find((c) => c.id === categoryFilter) || NAV_CATEGORIES[0];
  const CurrentCatIcon = currentCategoryObj.icon;
  const currentCatBadgeCount = categoryFilter === 'bookmarked' ? bookmarkedPostIds.length : categoryFilter === 'read' ? readPostIds.length : 0;
  const currentDimensionObj = CHANNELS.find((c) => c.id === selectedDimension) || CHANNELS[0];

  return (
    <div className="guestbook-board-container">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="gb-toast" role="status">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Lightbox Zoom */}
      {zoomedImage && (
        <div className="gb-lightbox" onClick={() => setZoomedImage(null)}>
          <button className="gb-lightbox__close" onClick={() => setZoomedImage(null)}>
            <X className="w-5 h-5" />
          </button>
          <img src={zoomedImage} alt="Zoomed view" className="gb-lightbox__img" />
        </div>
      )}

      {/* ========================================================
          1. 楼上：BOOST 实时观点流 (TOP BOOST STREAM)
          - 3 排自适应观点流
          - 速度与信息总量成正比
          - 每个 Boost 仅在板上出现 1 次（不重复堆叠）
          - 宽间距聚焦单句展台（同屏不超过 2 句）
          ======================================================== */}
      <section className="gb-boost-wall-card" aria-label="Boost 实时观点流">
        {/* Boost Header */}
        <div className="gb-boost-wall-head">
          <div className="gb-boost-head-left">
            <span className="gb-boost-badge">
              <span className="gb-pulse-dot"></span>
              <Rocket className="w-3.5 h-3.5 mr-1" /> Boost
            </span>
            <span className="gb-boost-status-count">
              {allBoostComments.length > 20
                ? `全站共收录 ${allBoostComments.length} 条观点 · 轮播呈现最新热门观点`
                : `全站共收录 ${allBoostComments.length} 条观点`}
            </span>
          </div>

          <div className="gb-boost-head-right">
            <span className="gb-boost-spec-badge">
              ⚡ 3排观点流 · 速度自适应 · 单句展台
            </span>
          </div>
        </div>

        {/* 3 Tracks Stream (Smooth Horizontal Floating Viewpoints, Speed Adaptive) */}
        <div
          className={`gb-boost-marquee-container is-three-rows ${isBoostMarqueePaused ? 'is-paused' : ''}`}
          onMouseEnter={() => setIsBoostMarqueePaused(true)}
          onMouseLeave={() => setIsBoostMarqueePaused(false)}
        >
          {/* Track 1: Normal Direction */}
          <div
            className="gb-boost-track gb-track-1"
            style={{ animationDuration: boostAnimDuration }}
          >
            {boostRow1.map((b) => (
              <div key={`track1-${b.id}`} className="gb-boost-pill-card">
                <div className="gb-boost-pill__avatar">
                  {b.authorAvatar ? (
                    <img src={b.authorAvatar} alt={b.authorName} />
                  ) : (
                    <span>{getCommentInitials(b.authorName)}</span>
                  )}
                </div>
                <div className="gb-boost-pill__body">
                  <div className="gb-boost-pill__meta">
                    <span className="gb-boost-pill__name">{b.authorName || '访客'}</span>
                    {b.ipCountryFlag && (
                      <span className="gb-boost-pill__flag" title={b.ipCountryName}>
                        {b.ipCountryFlag}
                      </span>
                    )}
                    <span className="gb-boost-pill__time">{formatTime(b.createdAt)}</span>
                  </div>
                  <div className="gb-boost-pill__text">{b.message}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Track 2: Reverse Direction */}
          <div
            className="gb-boost-track gb-track-2 is-reverse"
            style={{ animationDuration: boostAnimDuration }}
          >
            {boostRow2.map((b) => (
              <div key={`track2-${b.id}`} className="gb-boost-pill-card is-reverse">
                <div className="gb-boost-pill__avatar is-purple">
                  {b.authorAvatar ? (
                    <img src={b.authorAvatar} alt={b.authorName} />
                  ) : (
                    <span>{getCommentInitials(b.authorName)}</span>
                  )}
                </div>
                <div className="gb-boost-pill__body">
                  <div className="gb-boost-pill__meta">
                    <span className="gb-boost-pill__name">{b.authorName || '访客'}</span>
                    {b.ipCountryFlag && (
                      <span className="gb-boost-pill__flag" title={b.ipCountryName}>
                        {b.ipCountryFlag}
                      </span>
                    )}
                    <span className="gb-boost-pill__time">{formatTime(b.createdAt)}</span>
                  </div>
                  <div className="gb-boost-pill__text">{b.message}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Track 3: Normal Direction (Teal Accent) */}
          <div
            className="gb-boost-track gb-track-3 is-track-3"
            style={{ animationDuration: boostAnimDuration }}
          >
            {boostRow3.map((b) => (
              <div key={`track3-${b.id}`} className="gb-boost-pill-card is-teal">
                <div className="gb-boost-pill__avatar is-emerald">
                  {b.authorAvatar ? (
                    <img src={b.authorAvatar} alt={b.authorName} />
                  ) : (
                    <span>{getCommentInitials(b.authorName)}</span>
                  )}
                </div>
                <div className="gb-boost-pill__body">
                  <div className="gb-boost-pill__meta">
                    <span className="gb-boost-pill__name">{b.authorName || '访客'}</span>
                    {b.ipCountryFlag && (
                      <span className="gb-boost-pill__flag" title={b.ipCountryName}>
                        {b.ipCountryFlag}
                      </span>
                    )}
                    <span className="gb-boost-pill__time">{formatTime(b.createdAt)}</span>
                  </div>
                  <div className="gb-boost-pill__text">{b.message}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========================================================
          2. 分区与维度下拉导航条 (NAV DROPDOWNS BAR)
          - 分区下拉：最多 4 个同时展示，支持滚轮平滑滚动
          - 维度下拉：最多 4 个同时展示，支持滚轮平滑滚动
          - 右侧保留统一发布入口：发布 Gesture
          ======================================================== */}
      <nav className="gb-nav-bar" aria-label="Gesture 讨论分类与维度">
        <div className="gb-nav-bar__dropdowns">
          {/* 1. 分区下拉选择器 (Category Dropdown) */}
          <div className="gb-dropdown-wrapper" ref={categoryDropdownRef}>
            <button
              type="button"
              className={`gb-nav-dropdown-btn ${categoryFilter !== 'latest' ? 'is-filtered' : ''}`}
              onClick={() => {
                setShowCategoryDropdown((prev) => !prev);
                setShowDimensionDropdown(false);
              }}
              aria-haspopup="listbox"
              aria-expanded={showCategoryDropdown}
            >
              <span className="gb-dropdown-prefix">分区:</span>
              <CurrentCatIcon className="w-4 h-4 mr-1.5 text-indigo-500 flex-shrink-0" />
              <span className="gb-dropdown-value">{currentCategoryObj?.label || '最新'}</span>
              {currentCatBadgeCount > 0 && (
                <span className="gb-dropdown-badge">{currentCatBadgeCount}</span>
              )}
              <ChevronDown className={`w-3.5 h-3.5 ml-1.5 text-slate-400 transition-transform ${showCategoryDropdown ? 'rotate-180' : ''}`} />
            </button>

            {showCategoryDropdown && (
              <div className="gb-scrollable-dropdown is-four-items-max" role="listbox">
                {NAV_CATEGORIES.map((cat) => {
                  const Icon = cat.icon;
                  const isSelected = categoryFilter === cat.id;
                  const count = cat.id === 'bookmarked' ? bookmarkedPostIds.length : cat.id === 'read' ? readPostIds.length : 0;

                  return (
                    <button
                      key={cat.id}
                      type="button"
                      className={`gb-scrollable-dropdown__item ${isSelected ? 'is-selected' : ''}`}
                      onClick={() => {
                        setCategoryFilter(cat.id);
                        setShowCategoryDropdown(false);
                      }}
                      role="option"
                      aria-selected={isSelected}
                    >
                      <Icon className="w-4 h-4 mr-2.5 text-slate-500 dark:text-slate-400 flex-shrink-0" />
                      <span className="gb-dropdown-item__label">{cat.label}</span>
                      {count > 0 && <span className="gb-dropdown-item__badge">{count}</span>}
                      {isSelected && <span className="gb-dropdown-item__check">✓</span>}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* 2. 维度下拉选择器 (Dimension Dropdown) */}
          <div className="gb-dropdown-wrapper" ref={dimensionDropdownRef}>
            <button
              type="button"
              className={`gb-nav-dropdown-btn ${selectedDimension !== 'all' ? 'is-filtered' : ''}`}
              onClick={() => {
                setShowDimensionDropdown((prev) => !prev);
                setShowCategoryDropdown(false);
              }}
              aria-haspopup="listbox"
              aria-expanded={showDimensionDropdown}
            >
              <span className="gb-dropdown-prefix">维度:</span>
              <span className="mr-1.5 text-base flex-shrink-0">{currentDimensionObj?.icon || '🌟'}</span>
              <span className="gb-dropdown-value">{currentDimensionObj?.label || '全部维度'}</span>
              <ChevronDown className={`w-3.5 h-3.5 ml-1.5 text-slate-400 transition-transform ${showDimensionDropdown ? 'rotate-180' : ''}`} />
            </button>

            {showDimensionDropdown && (
              <div className="gb-scrollable-dropdown is-four-items-max" role="listbox">
                {CHANNELS.map((ch) => {
                  const isSelected = selectedDimension === ch.id;

                  return (
                    <button
                      key={ch.id}
                      type="button"
                      className={`gb-scrollable-dropdown__item ${isSelected ? 'is-selected' : ''}`}
                      onClick={() => {
                        setSelectedDimension(ch.id);
                        setShowDimensionDropdown(false);
                      }}
                      role="option"
                      aria-selected={isSelected}
                    >
                      <span className="mr-2.5 text-base flex-shrink-0">{ch.icon}</span>
                      <div className="gb-dim-text-wrap">
                        <span className="gb-dropdown-item__label">{ch.label}</span>
                        <span className="gb-dropdown-item__desc">{ch.desc}</span>
                      </div>
                      {isSelected && <span className="gb-dropdown-item__check">✓</span>}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Tools: Search & New Gesture Button */}
        <div className="gb-nav-bar__tools">
          <div className="gb-nav-search">
            <Search className="w-3.5 h-3.5 gb-search-icon" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索 Gesture..."
              className="gb-search-input"
            />
            {searchQuery && (
              <button
                type="button"
                className="gb-search-clear"
                onClick={() => setSearchQuery('')}
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          <button
            type="button"
            className="gb-new-gesture-btn"
            onClick={openFloatingComposer}
          >
            <Pencil className="w-4 h-4 mr-1.5" />
            <span>发布 Gesture</span>
          </button>
        </div>
      </nav>

      {/* Dimension Pills Quick Strip (When Dimensions is selected) */}
      {selectedDimension !== 'all' && (
        <div className="gb-active-dimension-strip">
          <span className="gb-active-dim-label">当前维度筛选：</span>
          <span className="gb-active-dim-pill">
            {CHANNELS.find((c) => c.id === selectedDimension)?.icon}{' '}
            {CHANNELS.find((c) => c.id === selectedDimension)?.label}
          </span>
          <button
            type="button"
            className="gb-active-dim-reset"
            onClick={() => setSelectedDimension('all')}
          >
            清除维度筛选 <X className="w-3 h-3 ml-0.5 inline" />
          </button>
        </div>
      )}

      {/* ========================================================
          3. 楼下：GESTURE 广场列表 / 详情双视图 (GESTURE STREAM)
          ======================================================== */}
      {activeView === 'list' ? (
        /* LIST VIEW (GESTURE 列表广场) */
        <main className="gb-gesture-list-view">
          {loading ? (
            <div className="gb-loading-state">
              <div className="gb-spinner"></div>
              <span>正在连接边缘节点并加载 Gesture 讨论广场...</span>
            </div>
          ) : filteredGestures.length === 0 ? (
            <div className="gb-empty-state">
              <div className="gb-empty-icon">🌱</div>
              <h3 className="gb-empty-title">
                {searchQuery ? '未找到匹配的 Gesture 贴文' : '暂无符合当前分类的 Gesture'}
              </h3>
              <p className="gb-empty-desc">
                {searchQuery
                  ? '可以尝试更换关键词或清除筛选条件'
                  : '成为第一个发起话题的人吧！写下你的见解，启动全站讨论。'}
              </p>
              <button
                type="button"
                className="gb-new-gesture-btn"
                onClick={() => openFloatingComposer('gesture')}
              >
                <Pencil className="w-4 h-4 mr-1.5" /> 发起第一条 Gesture
              </button>
            </div>
          ) : (
            <div className="gb-gesture-table">
              {displayedGestures.map((item) => {
                const isPinned = item.status === 'pinned';
                const isBookmarked = bookmarkedPostIds.includes(item.id);
                const isRead = readPostIds.includes(item.id);
                const replies = repliesByParent[item.id] || [];
                const channel = CHANNELS.find((c) => c.id === item.tag) || CHANNELS[2];
                const userLevel = computeUserLevel(item.authorId || item.authorName);

                // Excerpt clean up
                const cleanExcerpt = item.message
                  .replace(/^###\s+.*$/m, '')
                  .replace(/!\[.*?\]\(.*?\)/g, '')
                  .replace(/[#*`_>]/g, '')
                  .trim();

                // Extract title if present
                const titleMatch = item.message.match(/^###\s+(.*)$/m);
                const title = titleMatch ? titleMatch[1] : cleanExcerpt.slice(0, 48) || '无标题讨论';

                return (
                  <article
                    key={item.id}
                    className={`gb-gesture-row ${isPinned ? 'is-pinned-row' : ''} ${isRead ? 'is-read-row' : ''}`}
                    onClick={() => openGestureDetail(item)}
                  >
                    {/* Left: Author Avatar & Channel Icon */}
                    <div className="gb-gesture-row__avatar-wrap">
                      <div className="gb-gesture-row__avatar">
                        {item.authorAvatar ? (
                          <img src={item.authorAvatar} alt={item.authorName} />
                        ) : (
                          <span>{getCommentInitials(item.authorName)}</span>
                        )}
                      </div>
                      <span className="gb-gesture-row__channel-icon" title={channel.label}>
                        {channel.icon}
                      </span>
                    </div>

                    {/* Middle: Title & Meta Info */}
                    <div className="gb-gesture-row__main">
                      <div className="gb-gesture-row__header">
                        {isPinned && (
                          <span className="gb-badge is-pinned" title="官方置顶">
                            <Pin className="w-3 h-3 inline mr-0.5" /> 官方置顶
                          </span>
                        )}
                        <span className="gb-channel-tag">
                          {channel.icon} {channel.label}
                        </span>
                        <h2 className="gb-gesture-row__title">
                          {title}
                        </h2>
                      </div>

                      <p className="gb-gesture-row__excerpt">
                        {cleanExcerpt.slice(0, 110)}
                        {cleanExcerpt.length > 110 ? '...' : ''}
                      </p>

                      <div className="gb-gesture-row__footer">
                        <span className="gb-gesture-row__author">
                          {item.authorName || '访客'}
                          {item.authorRole === 'admin' && (
                            <span className="gb-badge is-admin ml-1">👑 站长</span>
                          )}
                          <span className="gb-level-badge ml-1">{userLevel.badge}</span>
                        </span>
                        <span className="gb-dot-divider">•</span>
                        <time className="gb-gesture-row__time">{formatTime(item.createdAt)}</time>
                        {item.ipLocation && (
                          <>
                            <span className="gb-dot-divider">•</span>
                            <span className="gb-gesture-row__loc">
                              {item.ipCountryFlag} {item.ipLocation}
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Right: Metrics & Bookmark */}
                    <div className="gb-gesture-row__right">
                      {/* Replies count */}
                      <div className="gb-gesture-metric is-replies" title="跟帖回复数">
                        <MessageSquare className="w-4 h-4 mr-1 text-indigo-500" />
                        <span>{replies.length}</span>
                      </div>

                      {/* Likes count */}
                      <div className="gb-gesture-metric is-likes" title="表态点赞数">
                        <Flame className="w-4 h-4 mr-1 text-orange-500" />
                        <span>{item.likesCount || 0}</span>
                      </div>

                      {/* Bookmark Button */}
                      <button
                        type="button"
                        className={`gb-bookmark-toggle ${isBookmarked ? 'is-bookmarked' : ''}`}
                        title={isBookmarked ? '移出书签' : '加入书签'}
                        onClick={(e) => toggleBookmark(item.id, e)}
                      >
                        <Bookmark className="w-4 h-4" />
                      </button>
                    </div>
                  </article>
                );
              })}

              {/* 20-Item Display Cap Notice */}
              {filteredGestures.length > 20 && (
                <div className="gb-list-cap-notice">
                  <span>
                    已呈现当前分类前 20 条热议 Gesture（全站匹配共 {filteredGestures.length} 篇）· 历史讨论可通过顶部搜索或分类维度检索
                  </span>
                </div>
              )}
            </div>
          )}
        </main>
      ) : (
        /* ========================================================
           DETAIL VIEW (GESTURE 详情与楼层时间轴滑块)
           ======================================================== */
        currentGesture && (
          <div className="gb-gesture-detail-view">
            {/* Detail Top Navigation */}
            <div className="gb-detail-topbar">
              <button
                type="button"
                className="gb-back-btn"
                onClick={closeGestureDetail}
              >
                <ArrowLeft className="w-4 h-4 mr-1.5" />
                <span>返回 Gesture 列表</span>
              </button>

              <div className="gb-detail-topbar__actions">
                <button
                  type="button"
                  className={`gb-action-icon-btn ${bookmarkedPostIds.includes(currentGesture.id) ? 'is-active' : ''}`}
                  onClick={(e) => toggleBookmark(currentGesture.id, e)}
                  title="书签收藏"
                >
                  <Bookmark className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  className="gb-action-icon-btn"
                  onClick={() => {
                    navigator.clipboard.writeText(window.location.href);
                    showToast('🔗 贴文直达链接已复制到剪贴板！');
                  }}
                  title="复制直达链接"
                >
                  <Share2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Layout Grid: Left Stream (Floors) + Right Timeline Scroller */}
            <div className="gb-detail-layout">
              {/* Left Column: Floor Stream */}
              <div className="gb-detail-stream">
                {/* 1 楼 (主楼 / OP Floor) */}
                <article
                  id="floor-1"
                  className="gb-floor-item is-op-floor gb-floor-target"
                >
                  {/* Floor Header */}
                  <div className="gb-floor-head">
                    <div className="gb-floor-author-info">
                      <div className="gb-floor-avatar">
                        {currentGesture.authorAvatar ? (
                          <img src={currentGesture.authorAvatar} alt={currentGesture.authorName} />
                        ) : (
                          <span>{getCommentInitials(currentGesture.authorName)}</span>
                        )}
                      </div>
                      <div className="gb-floor-meta">
                        <div className="gb-floor-name-row">
                          <span className="gb-floor-name">{currentGesture.authorName || '访客'}</span>
                          {currentGesture.authorRole === 'admin' && (
                            <span className="gb-badge is-admin">👑 站长</span>
                          )}
                          <span className="gb-level-badge">
                            {computeUserLevel(currentGesture.authorId || currentGesture.authorName).badge}
                          </span>
                          {currentGesture.status === 'pinned' && (
                            <span className="gb-badge is-pinned">📌 置顶</span>
                          )}
                        </div>
                        <div className="gb-floor-sub-row">
                          <time>{formatTime(currentGesture.createdAt)}</time>
                          {currentGesture.ipLocation && (
                            <>
                              <span className="gb-dot-divider">•</span>
                              <span>
                                {currentGesture.ipCountryFlag} {currentGesture.ipLocation}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="gb-floor-number">#1 楼主</div>
                  </div>

                  {/* Floor Body (Markdown) */}
                  <div className="gb-floor-body">
                    <div
                      className="gb-markdown-body"
                      dangerouslySetInnerHTML={{
                        __html: renderCommentMarkdown(currentGesture.message),
                      }}
                    />
                  </div>

                  {/* Floor Footer & Reactions */}
                  <div className="gb-floor-foot">
                    <div className="gb-reactions-bar">
                      {['👍', '❤️', '🚀', '🎉', '💡', '🔥'].map((emoji) => {
                        const count = currentGesture.reactions?.summary?.[emoji] || 0;
                        return (
                          <button
                            key={emoji}
                            type="button"
                            className={`gb-reaction-btn ${count > 0 ? 'has-reactions' : ''}`}
                            onClick={() => handleReaction(currentGesture.id, emoji)}
                          >
                            <span>{emoji}</span>
                            {count > 0 && <span className="gb-reaction-num">{count}</span>}
                          </button>
                        );
                      })}
                    </div>

                    <div className="gb-floor-actions">
                      <button
                        type="button"
                        className="gb-floor-action-btn"
                        onClick={() => {
                          setReplyTargetFloor({ id: currentGesture.id, author: currentGesture.authorName });
                          jumpToComposer();
                        }}
                      >
                        <CornerDownRight className="w-3.5 h-3.5 mr-1" /> 回复楼主
                      </button>
                    </div>
                  </div>
                </article>

                {/* 后续楼层 (Replies / 2楼、3楼...) */}
                {currentReplies.map((reply, index) => {
                  const floorNum = index + 2;
                  const userLevel = computeUserLevel(reply.authorId || reply.authorName);

                  return (
                    <article
                      key={reply.id}
                      id={`floor-${floorNum}`}
                      className="gb-floor-item gb-floor-target"
                    >
                      <div className="gb-floor-head">
                        <div className="gb-floor-author-info">
                          <div className="gb-floor-avatar">
                            {reply.authorAvatar ? (
                              <img src={reply.authorAvatar} alt={reply.authorName} />
                            ) : (
                              <span>{getCommentInitials(reply.authorName)}</span>
                            )}
                          </div>
                          <div className="gb-floor-meta">
                            <div className="gb-floor-name-row">
                              <span className="gb-floor-name">{reply.authorName || '访客'}</span>
                              {reply.authorRole === 'admin' && (
                                <span className="gb-badge is-admin">👑 站长</span>
                              )}
                              <span className="gb-level-badge">{userLevel.badge}</span>
                            </div>
                            <div className="gb-floor-sub-row">
                              <time>{formatTime(reply.createdAt)}</time>
                              {reply.ipLocation && (
                                <>
                                  <span className="gb-dot-divider">•</span>
                                  <span>
                                    {reply.ipCountryFlag} {reply.ipLocation}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="gb-floor-number">#{floorNum} 楼</div>
                      </div>

                      <div className="gb-floor-body">
                        <div
                          className="gb-markdown-body"
                          dangerouslySetInnerHTML={{
                            __html: renderCommentMarkdown(reply.message),
                          }}
                        />
                      </div>

                      <div className="gb-floor-foot">
                        <div className="gb-reactions-bar">
                          {['👍', '❤️', '🚀', '🎉', '💡', '🔥'].map((emoji) => {
                            const count = reply.reactions?.summary?.[emoji] || 0;
                            return (
                              <button
                                key={emoji}
                                type="button"
                                className={`gb-reaction-btn ${count > 0 ? 'has-reactions' : ''}`}
                                onClick={() => handleReaction(reply.id, emoji)}
                              >
                                <span>{emoji}</span>
                                {count > 0 && <span className="gb-reaction-num">{count}</span>}
                              </button>
                            );
                          })}
                        </div>

                        <div className="gb-floor-actions">
                          <button
                            type="button"
                            className="gb-floor-action-btn"
                            onClick={() => {
                              setReplyTargetFloor({ id: reply.id, author: reply.authorName });
                              jumpToComposer();
                            }}
                          >
                            <CornerDownRight className="w-3.5 h-3.5 mr-1" /> 回复 #{floorNum}
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                })}

                {/* 底部楼层跟帖工坊 (Detail Reply Composer) */}
                <section
                  id="detail-reply-composer"
                  className="gb-detail-reply-box"
                >
                  <div className="gb-detail-reply-head">
                    <span className="gb-detail-reply-title">
                      <MessageSquare className="w-4 h-4 mr-1.5 text-indigo-500" />
                      跟帖回复讨论
                    </span>
                    {replyTargetFloor && (
                      <span className="gb-reply-quote-target">
                        正在引用 @{replyTargetFloor.author}
                        <button
                          type="button"
                          className="gb-quote-clear"
                          onClick={() => setReplyTargetFloor(null)}
                        >
                          <X className="w-3 h-3 ml-1 inline" />
                        </button>
                      </span>
                    )}
                  </div>

                  <form onSubmit={handleDetailReplySubmit}>
                    {/* Toolbar */}
                    <div className="gb-md-toolbar">
                      <button
                        type="button"
                        title="粗体"
                        onClick={() =>
                          insertMarkdownHelper(detailReplyTextareaRef, setDetailReplyMessage, '**', '**')
                        }
                      >
                        <Bold className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        title="斜体"
                        onClick={() =>
                          insertMarkdownHelper(detailReplyTextareaRef, setDetailReplyMessage, '*', '*')
                        }
                      >
                        <Italic className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        title="代码块"
                        onClick={() =>
                          insertMarkdownHelper(
                            detailReplyTextareaRef,
                            setDetailReplyMessage,
                            '\n```\n',
                            '\n```\n'
                          )
                        }
                      >
                        <Code className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        title="引用"
                        onClick={() =>
                          insertMarkdownHelper(detailReplyTextareaRef, setDetailReplyMessage, '\n> ', '\n')
                        }
                      >
                        <Quote className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        title="列表"
                        onClick={() =>
                          insertMarkdownHelper(detailReplyTextareaRef, setDetailReplyMessage, '\n- ', '\n')
                        }
                      >
                        <List className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        title="超链接"
                        onClick={() =>
                          insertMarkdownHelper(
                            detailReplyTextareaRef,
                            setDetailReplyMessage,
                            '[说明](',
                            ')'
                          )
                        }
                      >
                        <LinkIcon className="w-4 h-4" />
                      </button>

                      <div className="gb-toolbar-divider"></div>

                      <button
                        type="button"
                        title="插入表情"
                        onClick={() => setDetailReplyShowEmoji((prev) => !prev)}
                      >
                        <Smile className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        title="上传图片"
                        onClick={() => detailFileInputRef.current?.click()}
                      >
                        <ImageIcon className="w-4 h-4" />
                      </button>

                      <input
                        ref={detailFileInputRef}
                        type="file"
                        accept="image/*"
                        style={{ display: 'none' }}
                        onChange={(e) =>
                          handleImageFileChange(e, setDetailReplyUploading, setDetailReplyImages)
                        }
                      />

                      <div className="gb-tab-switch ml-auto">
                        <button
                          type="button"
                          className={`gb-tab-btn ${detailReplyPreviewTab === 'write' ? 'is-active' : ''}`}
                          onClick={() => setDetailReplyPreviewTab('write')}
                        >
                          编辑
                        </button>
                        <button
                          type="button"
                          className={`gb-tab-btn ${detailReplyPreviewTab === 'preview' ? 'is-active' : ''}`}
                          onClick={() => setDetailReplyPreviewTab('preview')}
                        >
                          预览
                        </button>
                      </div>
                    </div>

                    {/* Emoji Palette */}
                    {detailReplyShowEmoji && (
                      <div className="gb-emoji-popover">
                        {EMOJI_GROUPS.map((group, idx) => (
                          <div key={idx} className="gb-emoji-group">
                            <span className="gb-emoji-group__title">{group.name}</span>
                            <div className="gb-emoji-grid">
                              {group.emojis.map((em) => (
                                <button
                                  key={em}
                                  type="button"
                                  className="gb-emoji-btn"
                                  onClick={() => {
                                    insertMarkdownHelper(detailReplyTextareaRef, setDetailReplyMessage, em);
                                    setDetailReplyShowEmoji(false);
                                  }}
                                >
                                  {em}
                                </button>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Textarea or Preview */}
                    {detailReplyPreviewTab === 'write' ? (
                      <textarea
                        ref={detailReplyTextareaRef}
                        rows={3}
                        value={detailReplyMessage}
                        onChange={(e) => setDetailReplyMessage(e.target.value)}
                        placeholder="撰写你的回复讨论（支持 Markdown 排版、代码高亮）..."
                        className="gb-textarea is-reply-box"
                      />
                    ) : (
                      <div className="gb-preview-box">
                        {detailReplyMessage.trim() ? (
                          <div
                            className="gb-markdown-body"
                            dangerouslySetInnerHTML={{
                              __html: renderCommentMarkdown(detailReplyMessage),
                            }}
                          />
                        ) : (
                          <span className="text-slate-400 text-xs">暂无预览内容</span>
                        )}
                      </div>
                    )}

                    {/* Attached Images */}
                    {detailReplyImages.length > 0 && (
                      <div className="gb-attached-images">
                        {detailReplyImages.map((src, idx) => (
                          <div key={idx} className="gb-thumb-wrap">
                            <img src={src} alt="Attached" className="gb-thumb" />
                            <button
                              type="button"
                              className="gb-thumb-del"
                              onClick={() =>
                                setDetailReplyImages((prev) => prev.filter((_, i) => i !== idx))
                              }
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Submit Bar */}
                    <div className="gb-detail-reply-footer">
                      <span className="gb-word-count">字数: {detailReplyMessage.length}</span>
                      <button
                        type="submit"
                        disabled={detailReplySubmitting || !detailReplyMessage.trim()}
                        className="gb-submit-btn"
                      >
                        <Send className="w-3.5 h-3.5 mr-1" />
                        <span>{detailReplySubmitting ? '发表中...' : '提交回复'}</span>
                      </button>
                    </div>
                  </form>
                </section>
              </div>

              {/* ========================================================
                  右侧侧边栏：长条百分比滑动当前楼层进度条 (TIMELINE SCROLLER)
                  ======================================================== */}
              <aside className="gb-floor-scroller-aside">
                <div className="gb-floor-scroller-card">
                  {/* Scroller Header: Percentage & Current Floor */}
                  <div className="gb-scroller-header">
                    <span className="gb-scroller-pct">{scrollPercent}%</span>
                    <span className="gb-scroller-floor-label">
                      {currentFloor} / {totalFloors} 楼
                    </span>
                  </div>

                  {/* Jump to Top Button */}
                  <button
                    type="button"
                    className="gb-scroller-jump-btn"
                    title="跳转至 1 楼 (顶部)"
                    onClick={() => jumpToFloor(1)}
                  >
                    <ChevronsUp className="w-4 h-4" />
                  </button>

                  {/* Vertical Progress Rail & Interactive Floor Notches */}
                  <div className="gb-scroller-rail-wrap">
                    <div className="gb-scroller-rail">
                      {/* Active Progress Fill */}
                      <div
                        className="gb-scroller-fill"
                        style={{ height: `${scrollPercent}%` }}
                      ></div>

                      {/* Notches for each floor */}
                      {Array.from({ length: totalFloors }).map((_, idx) => {
                        const floorNum = idx + 1;
                        const notchPercent = (floorNum / totalFloors) * 100;
                        const isReached = currentFloor >= floorNum;

                        return (
                          <button
                            key={floorNum}
                            type="button"
                            className={`gb-scroller-notch ${isReached ? 'is-reached' : ''} ${currentFloor === floorNum ? 'is-current' : ''}`}
                            style={{ top: `${notchPercent}%` }}
                            onClick={() => jumpToFloor(floorNum)}
                            title={`跳转至 #${floorNum} 楼`}
                          >
                            <span className="gb-notch-tooltip">#{floorNum} 楼</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Jump to Bottom / Reply Button */}
                  <button
                    type="button"
                    className="gb-scroller-jump-btn"
                    title="跳转至底部回复"
                    onClick={jumpToComposer}
                  >
                    <ChevronsDown className="w-4 h-4" />
                  </button>
                </div>
              </aside>
            </div>
          </div>
        )
      )}

      {/* ========================================================
          4. 悬浮非阻塞草拟面板 (FLOATING NON-BLOCKING COMPOSER DOCK)
          智能识别机制：
          - 低于 8 字：默认智能识别为 Boost
          - 低于 30 字且无标题、无自定义 Tag、无特定分类：默认智能识别为 Boost
          - 其余情况（包含标题、选择专属分类、输入 Tag、或达到 30 字以上）：自动转为 Gesture
          ======================================================== */}
      {showComposer && (
        isComposerMinimized ? (
          <div
            className="gb-composer-minimized-pill"
            onClick={() => setIsComposerMinimized(false)}
            role="button"
            tabIndex={0}
            title="点击展开草拟面板"
          >
            <span className="gb-pulse-dot"></span>
            <span className={`gb-minimized-badge ${determinedType === 'boost' ? 'is-boost' : 'is-gesture'}`}>
              {determinedType === 'boost' ? '🚀 Boost' : '📝 Gesture'}
            </span>
            <span className="gb-minimized-preview">
              {composerTitle.trim() || composerText.trim()
                ? (composerTitle.trim() || composerText.trim()).slice(0, 20)
                : determinedType === 'boost'
                ? '正在拟写短句观点...'
                : '正在草拟讨论话题...'}
            </span>
            <div className="gb-minimized-actions">
              <button
                type="button"
                className="gb-minimized-btn"
                title="展开"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsComposerMinimized(false);
                }}
              >
                <ChevronUp className="w-4 h-4" />
              </button>
              <button
                type="button"
                className="gb-minimized-btn is-close"
                title="关闭"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowComposer(false);
                }}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ) : (
          <div className={`gb-floating-composer ${isComposerMaximized ? 'is-maximized' : ''}`}>
            {/* Composer Header: Title & Dynamic Smart Indicator */}
            <div className="gb-composer-header">
              <div className="gb-composer-header-title">
                <span className="gb-composer-title-main">起草讨论 / 观点</span>
                <span className={`gb-smart-type-badge ${determinedType === 'boost' ? 'is-boost' : 'is-gesture'}`}>
                  {determinedType === 'boost' ? (
                    <>
                      <Rocket className="w-3.5 h-3.5 mr-1 text-amber-500" />
                      <span>智能识别：Boost (短句观点流)</span>
                    </>
                  ) : (
                    <>
                      <MessageSquare className="w-3.5 h-3.5 mr-1 text-indigo-500" />
                      <span>智能识别：Gesture (讨论长帖)</span>
                    </>
                  )}
                </span>
              </div>

              <div className="gb-composer-window-tools">
                <button
                  type="button"
                  className="gb-window-tool-btn"
                  title="最小化到右下角"
                  onClick={() => setIsComposerMinimized(true)}
                >
                  <Minus className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  className="gb-window-tool-btn"
                  title={isComposerMaximized ? '恢复大小' : '最大化'}
                  onClick={() => setIsComposerMaximized((prev) => !prev)}
                >
                  {isComposerMaximized ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-3.5 h-3.5" />}
                </button>
                <button
                  type="button"
                  className="gb-window-tool-btn is-close"
                  title="关闭起草面板"
                  onClick={() => setShowComposer(false)}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Composer Content Body */}
            <div className="gb-composer-body">
              {/* Dynamic Type Hint Banner */}
              <div className="gb-composer-smart-hint">
                {determinedType === 'boost' ? (
                  <span>
                    💡 <strong>Boost 模式已激活</strong>：当前内容
                    {trimmedComposerText.length < 8 ? ' 少于 8 字' : ' 处于 30 字内且未填写标题/分类/Tag'}
                    ，将作为即时轻量短句发布至顶部观点流。
                  </span>
                ) : (
                  <span>
                    📝 <strong>Gesture 模式已激活</strong>：
                    {trimmedComposerText.length >= 30
                      ? ' 字数已达到 30 字以上'
                      : hasComposerTitle
                      ? ' 已包含标题'
                      : hasComposerTags
                      ? ' 已添加自定义 Tag'
                      : ' 已选择专属讨论维度'}
                    ，将沉淀为广场深度长帖（支持楼层跟帖互动与时间轴滑块）。
                  </span>
                )}
              </div>

              {/* Title Input */}
              <div className="gb-modal-row">
                <input
                  type="text"
                  value={composerTitle}
                  onChange={(e) => setComposerTitle(e.target.value)}
                  placeholder="话题标题（可选，添加标题将自动识别为 Gesture）..."
                  maxLength={100}
                  className="gb-modal-title-input"
                />
              </div>

              {/* Dimension & Custom Tag Row */}
              <div className="gb-composer-meta-row">
                <div className="gb-composer-dim-selector">
                  <label className="gb-composer-field-label">讨论维度：</label>
                  <select
                    value={composerDimension}
                    onChange={(e) => setComposerDimension(e.target.value)}
                    className="gb-composer-select"
                  >
                    <option value="all">🌟 默认 / 全部维度</option>
                    {CHANNELS.filter((ch) => ch.id !== 'all').map((ch) => (
                      <option key={ch.id} value={ch.id}>
                        {ch.icon} {ch.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="gb-composer-tag-input-wrap">
                  <Tag className="w-3.5 h-3.5 text-slate-400 mr-1.5 flex-shrink-0" />
                  <input
                    type="text"
                    value={composerTags}
                    onChange={(e) => setComposerTags(e.target.value)}
                    placeholder="话题标签 Tag（可选，如 #前端 #设计，空格分隔）..."
                    className="gb-composer-tag-input"
                  />
                </div>
              </div>

              {/* Toolbar */}
              <div className="gb-md-toolbar">
                <button
                  type="button"
                  title="粗体"
                  onClick={() =>
                    insertMarkdownHelper(gestureTextareaRef, setComposerText, '**', '**')
                  }
                >
                  <Bold className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  title="斜体"
                  onClick={() =>
                    insertMarkdownHelper(gestureTextareaRef, setComposerText, '*', '*')
                  }
                >
                  <Italic className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  title="代码块"
                  onClick={() =>
                    insertMarkdownHelper(gestureTextareaRef, setComposerText, '\n```\n', '\n```\n')
                  }
                >
                  <Code className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  title="引用"
                  onClick={() =>
                    insertMarkdownHelper(gestureTextareaRef, setComposerText, '\n> ', '\n')
                  }
                >
                  <Quote className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  title="列表"
                  onClick={() =>
                    insertMarkdownHelper(gestureTextareaRef, setComposerText, '\n- ', '\n')
                  }
                >
                  <List className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  title="超链接"
                  onClick={() =>
                    insertMarkdownHelper(gestureTextareaRef, setComposerText, '[说明](', ')')
                  }
                >
                  <LinkIcon className="w-4 h-4" />
                </button>

                <div className="gb-toolbar-divider"></div>

                <button
                  type="button"
                  title="插入表情"
                  onClick={() => setComposerShowEmoji((prev) => !prev)}
                >
                  <Smile className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  title="上传图片"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <ImageIcon className="w-4 h-4" />
                </button>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={(e) =>
                    handleImageFileChange(e, setComposerUploading, setComposerImages)
                  }
                />

                <div className="gb-tab-switch ml-auto">
                  <button
                    type="button"
                    className={`gb-tab-btn ${composerPreviewTab === 'write' ? 'is-active' : ''}`}
                    onClick={() => setComposerPreviewTab('write')}
                  >
                    编辑
                  </button>
                  <button
                    type="button"
                    className={`gb-tab-btn ${composerPreviewTab === 'preview' ? 'is-active' : ''}`}
                    onClick={() => setComposerPreviewTab('preview')}
                  >
                    实时预览
                  </button>
                </div>
              </div>

              {/* Emoji Popover */}
              {composerShowEmoji && (
                <div className="gb-emoji-popover">
                  {EMOJI_GROUPS.map((group, idx) => (
                    <div key={idx} className="gb-emoji-group">
                      <span className="gb-emoji-group__title">{group.name}</span>
                      <div className="gb-emoji-grid">
                        {group.emojis.map((em) => (
                          <button
                            key={em}
                            type="button"
                            className="gb-emoji-btn"
                            onClick={() => {
                              insertMarkdownHelper(gestureTextareaRef, setComposerText, em);
                              setComposerShowEmoji(false);
                            }}
                          >
                            {em}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Textarea or Preview */}
              {composerPreviewTab === 'write' ? (
                <textarea
                  ref={gestureTextareaRef}
                  rows={isComposerMaximized ? 12 : 5}
                  value={composerText}
                  onChange={(e) => setComposerText(e.target.value)}
                  placeholder={
                    determinedType === 'boost'
                      ? '写下你此时此刻的想法、简短观点或问候（少于8字或30字以内无标题自动作为 Boost 观点上墙）...'
                      : '畅所欲言，阐述你的深度思考（支持 Markdown 排版、代码块、列表、多图）...'
                  }
                  className="gb-textarea is-modal-textarea"
                />
              ) : (
                <div className="gb-preview-box is-modal-preview">
                  {composerText.trim() ? (
                    <div
                      className="gb-markdown-body"
                      dangerouslySetInnerHTML={{
                        __html: renderCommentMarkdown(composerText),
                      }}
                    />
                  ) : (
                    <span className="text-slate-400 text-xs">暂无预览内容</span>
                  )}
                </div>
              )}

              {/* Attached Images */}
              {composerImages.length > 0 && (
                <div className="gb-attached-images">
                  {composerImages.map((src, idx) => (
                    <div key={idx} className="gb-thumb-wrap">
                      <img src={src} alt="Attached" className="gb-thumb" />
                      <button
                        type="button"
                        className="gb-thumb-del"
                        onClick={() =>
                          setComposerImages((prev) => prev.filter((_, i) => i !== idx))
                        }
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Error Alert */}
              {composerError && (
                <div className="gb-error-alert">
                  <AlertCircle className="w-4 h-4 mr-1 text-rose-500" />
                  <span>{composerError}</span>
                </div>
              )}

              {/* Footer */}
              <div className="gb-modal-foot">
                <span className="gb-word-count">
                  当前字数: {trimmedComposerText.length} 字
                  {determinedType === 'boost' ? ' (Boost 限 30 字内)' : ' (Gesture 需最少 8 字)'}
                </span>
                <div className="gb-modal-actions">
                  <button
                    type="button"
                    className="gb-cancel-btn"
                    onClick={() => setShowComposer(false)}
                  >
                    取消
                  </button>

                  {determinedType === 'boost' ? (
                    <button
                      type="button"
                      disabled={composerSubmitting || !trimmedComposerText || trimmedComposerText.length > 30}
                      onClick={handleComposerSubmit}
                      className="gb-submit-btn is-boost-btn"
                    >
                      <Rocket className="w-3.5 h-3.5 mr-1" />
                      <span>{composerSubmitting ? '发布中...' : '发布为 Boost'}</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={composerSubmitting || trimmedComposerText.length < 8}
                      onClick={handleComposerSubmit}
                      className="gb-submit-btn"
                    >
                      <Send className="w-3.5 h-3.5 mr-1" />
                      <span>{composerSubmitting ? '发布中...' : '发布为 Gesture'}</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )
      )}
    </div>
  );
}

export default GuestbookBoard;
