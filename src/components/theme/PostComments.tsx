import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Rocket,
  Languages,
  Bold,
  Italic,
  Heading,
  Quote,
  Code,
  List,
  ArrowLeftRight,
  Smile,
  SlidersHorizontal,
  ChevronDown,
  Table,
  ListOrdered,
  ScrollText,
  GitFork,
  BarChart3,
  EyeOff,
  Share2,
  Clock,
  Sigma,
  LayoutTemplate,
  Bookmark,
  Vote,
  Layers,
  ChevronRight,
  ThumbsUp,
  MessageSquare,
  Pencil,
  Trash2,
  X,
  Plus,
  Info,
  Image as ImageIcon,
  Upload,
  Link,
  FileText,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import type { CommentProvider } from '../../config/site';
import {
  fetchComments,
  createComment,
  editComment,
  deleteComment,
  likeComment,
  readCommentIdentity,
  getCommentInitials,
  uploadCommentImage,
  resolveGeoInfo,
  type BlogComment,
  type CommentIdentity,
  type CommentQuote,
  type PostType,
} from '../../lib/comment-client';
import { renderCommentMarkdown } from '../../lib/comment-markdown';

type CommentsIntegrationConfig = Readonly<{
  provider: CommentProvider;
  fallback: CommentProvider;
  cloudflare: Readonly<{
    apiBase: string;
  }>;
  giscus: Readonly<{
    repo: string;
    repoId: string;
    category: string;
    categoryId: string;
    mapping: string;
    theme: string;
  }>;
  waline: Readonly<{
    serverURL: string;
    lang: string;
    pageSize: number;
  }>;
  twikoo: Readonly<{
    envId: string;
    region: string;
    lang: string;
  }>;
}>;

type PostCommentsProps = {
  slug: string;
  title: string;
  heading?: string;
  policyLabel?: string;
  submitLabel?: string;
  previewLabel?: string;
  emptyTitle?: string;
  emptySummary?: string;
  integration: CommentsIntegrationConfig;
};

const COMMENT_LIMIT = 500;
const BOOST_LIMIT = 16;
const LONG_TEXT_THRESHOLD = 240;

const QUICK_EMOJIS = ['👍', '❤️', '🔥', '🚀', '💡', '🎉', '👏', '🤯', '☕', '✨', '😂', '😍', '🙏', '🤔'];

const POST_LANGUAGES = [
  { label: '中文 (简体)', code: 'zh-Hans' },
  { label: '正體中文', code: 'zh-Hant' },
  { label: 'English', code: 'en' },
  { label: '日本語', code: 'ja' },
  { label: '한국어', code: 'ko' },
  { label: 'Español', code: 'es' },
  { label: 'Français', code: 'fr' },
  { label: 'Deutsch', code: 'de' },
];

function formatCommentTime(value: string) {
  try {
    const d = new Date(value);
    const now = Date.now();
    const diff = (now - d.getTime()) / 1000;
    if (diff < 60) return '刚刚';
    if (diff < 3600) return `${Math.floor(diff / 60)} 分钟前`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} 小时前`;
    if (diff < 86400 * 30) return `${Math.floor(diff / 86400)} 天前`;
    return d.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  } catch {
    return value;
  }
}

function isEdited(created: string, updated?: string) {
  if (!updated) return false;
  try {
    const cTime = new Date(created).getTime();
    const uTime = new Date(updated).getTime();
    return uTime - cTime > 3000;
  } catch {
    return false;
  }
}

function computeReactionsMeta(comment: BlogComment, currentUserId?: string) {
  const summary = comment.reactions?.summary || {};
  const entries = Object.entries(summary).filter(([_, count]) => count > 0);
  if (entries.length === 0 && (comment.likesCount || 0) > 0) {
    entries.push(['👍', comment.likesCount]);
  }

  entries.sort((a, b) => b[1] - a[1]);
  const totalCount = entries.reduce((acc, [_, count]) => acc + count, 0);
  const top3 = entries.slice(0, 3).map(([emoji, count]) => ({ emoji, count }));
  const userReaction = currentUserId ? comment.reactions?.users?.[currentUserId] || null : null;

  return { totalCount, top3, userReaction, entries };
}

export function PostComments({
  slug,
  title,
  heading = '评论',
  policyLabel = '隐私政策',
  submitLabel = '发送',
  emptyTitle = '还没有公开评论',
  emptySummary = '留下第一条反馈后，评论会直接出现在下方的公开评论流中。',
}: PostCommentsProps) {
  // Comments data
  const [comments, setComments] = useState<BlogComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [sortOrder, setSortOrder] = useState<'hot' | 'new'>('new');
  const [noticeText, setNoticeText] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Tab: 'edit' | 'preview'
  const [editorTab, setEditorTab] = useState<'edit' | 'preview'>('edit');

  // Toolbar menus
  const [activeDropdown, setActiveDropdown] = useState<'lang' | 'options' | 'emoji' | null>(null);
  const [textDirection, setTextDirection] = useState<'ltr' | 'rtl'>('ltr');

  // Main input state
  const [mainMessage, setMainMessage] = useState('');
  const [mainInputFocused, setMainInputFocused] = useState(false);
  const [quoteState, setQuoteState] = useState<CommentQuote | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  // In-place reply state (YouTube style)
  const [replyingToCommentId, setReplyingToCommentId] = useState<string | null>(null);
  const [replyingTargetAuthor, setReplyingTargetAuthor] = useState<string>('');
  const [replyMode, setReplyMode] = useState<'comment' | 'boost'>('comment');
  const [replyMessage, setReplyMessage] = useState('');
  const [replySubmitting, setReplySubmitting] = useState(false);

  // Inline edit state
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingMessage, setEditingMessage] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

  // Accordion state
  const [expandedReplies, setExpandedReplies] = useState<Set<string>>(() => new Set());
  const [expandedTexts, setExpandedTexts] = useState<Set<string>>(() => new Set());

  // Account identity
  const [account, setAccount] = useState<CommentIdentity | null>(null);

  // In-memory visitor session tokens map: { commentId -> sessionToken }
  const [visitorSessionTokens, setVisitorSessionTokens] = useState<Map<string, string>>(() => new Map());

  // Reaction picker hover/long-press popup state
  const [activeReactionPopupId, setActiveReactionPopupId] = useState<string | null>(null);
  const longPressTimerRef = useRef<any>(null);
  const isLongPressTriggeredRef = useRef(false);

  // Compute effective avatar for current user with full role fallback
  const effectiveCurrentAvatar = useMemo(() => {
    if (account?.avatar) {
      return {
        url: account.avatar,
        name: account.name || '用户',
        initials: getCommentInitials(account.name || '用'),
        isVisitor: false,
        role: account.role,
      };
    }
    if (account?.role === 'admin') {
      return {
        url: '/media/shijianus/avatar.jpg',
        name: account.name || 'shijianus',
        initials: '博',
        isVisitor: false,
        role: 'admin',
      };
    }
    if (account?.name && account?.role !== 'visitor') {
      return {
        url: '',
        name: account.name,
        initials: getCommentInitials(account.name),
        isVisitor: false,
        role: account.role,
      };
    }
    return {
      url: '',
      name: '访客',
      initials: '访',
      isVisitor: true,
      role: 'visitor',
    };
  }, [account]);

  // Unified geo badge renderer supporting flag + code + i18n name + admin privileged IP display
  const renderGeoBadge = (item: BlogComment) => {
    const isCurrentAdmin = account?.role === 'admin' || Boolean(item.ip);
    const canShowToVisitor = item.showLocation !== false && Boolean(item.ipCountryFlag || item.ipCountry);

    if (!canShowToVisitor && !isCurrentAdmin) return null;
    if (!item.ipCountry && !item.ipCountryFlag && !item.ipLocation) return null;

    const currentLocale = (typeof document !== 'undefined' && document.documentElement.dataset.localeVariant) || 'zh-CN';
    const geo = resolveGeoInfo(item.ipCountry || item.ipCountryName || 'GLOBAL', currentLocale);
    const flag = geo.flag || item.ipCountryFlag || '🌐';
    const code = geo.code !== 'GLOBAL' ? geo.code : '';
    const name = geo.name || item.ipCountryName || item.ipLocation || '全球';

    return (
      <span
        className="tk-geo-badge"
        title={`来源地区: ${flag} ${geo.formatted}${isCurrentAdmin && item.ip ? ` (真实IP: ${item.ip})` : ''}`}
      >
        <span className="tk-geo-flag" role="img" aria-label={geo.code}>
          {flag}
        </span>
        {code && <span className="tk-geo-code">{code}</span>}
        <span className="tk-geo-name">{name}</span>
        {isCurrentAdmin && item.ip && (
          <span className="tk-admin-ip-tag" title="博主管理特权：查看真实IP">
            {item.ip}
          </span>
        )}
      </span>
    );
  };

  // Toast notification helper - dispatched directly to blog top #global-activity-bar at #nav
  const showToast = (text: string, type: 'success' | 'error' = 'success', duration = 3000) => {
    setNoticeText({ text, type });
    setTimeout(() => setNoticeText(null), duration + 500);

    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('shijianus:activity', {
          detail: {
            message: text,
            duration,
          },
        })
      );
    }
  };

  const [mounted, setMounted] = useState(false);

  // Active modal for interactive UI configuration dialogs
  const [activeModal, setActiveModal] = useState<
    | 'poll'
    | 'table'
    | 'details'
    | 'spoiler'
    | 'math'
    | 'scroll'
    | 'callout'
    | 'toc'
    | 'mermaid'
    | 'chart'
    | 'graphviz'
    | 'datetime'
    | 'template'
    | 'footnote'
    | 'image'
    | null
  >(null);

  // Image upload modal state
  const [modalImageTab, setModalImageTab] = useState<'upload' | 'guide' | 'url'>('upload');
  const [modalImageUrl, setModalImageUrl] = useState('');
  const [modalImageAlt, setModalImageAlt] = useState('');
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isMainDragOver, setIsMainDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Modal form states
  const [modalPollQuestion, setModalPollQuestion] = useState('');
  const [modalPollOptions, setModalPollOptions] = useState<string[]>(['非常认同', '有待探讨']);
  const [modalPollType, setModalPollType] = useState<'regular' | 'multiple'>('regular');

  const [modalTableRows, setModalTableRows] = useState(3);
  const [modalTableCols, setModalTableCols] = useState(3);
  const [modalTableHeaders, setModalTableHeaders] = useState<string[]>(['标题 1', '标题 2', '标题 3']);

  const [modalDetailsSummary, setModalDetailsSummary] = useState('点击展开详细内容');
  const [modalDetailsContent, setModalDetailsContent] = useState('');

  const [modalSpoilerText, setModalSpoilerText] = useState('');

  const [modalMathFormula, setModalMathFormula] = useState('\\int_{0}^{\\infty} e^{-x^2} dx = \\frac{\\sqrt{\\pi}}{2}');

  const [modalScrollHeight, setModalScrollHeight] = useState(160);
  const [modalScrollContent, setModalScrollContent] = useState('');

  const [modalCalloutType, setModalCalloutType] = useState<'note' | 'tip' | 'warning' | 'danger'>('note');
  const [modalCalloutTitle, setModalCalloutTitle] = useState('重点提示');
  const [modalCalloutContent, setModalCalloutContent] = useState('');

  // Extended Modal States
  const [modalTocIncludeHeaders, setModalTocIncludeHeaders] = useState(true);
  const [modalTocDepth, setModalTocDepth] = useState(3);

  const [modalMermaidType, setModalMermaidType] = useState<'flowchart' | 'sequence' | 'gantt' | 'class' | 'pie' | 'state'>('flowchart');
  const [modalMermaidCode, setModalMermaidCode] = useState('');

  const [modalChartType, setModalChartType] = useState<'bar' | 'line' | 'pie'>('bar');
  const [modalChartCode, setModalChartCode] = useState('');

  const [modalGraphvizType, setModalGraphvizType] = useState<'digraph' | 'graph'>('digraph');
  const [modalGraphvizCode, setModalGraphvizCode] = useState('');

  const [modalDatetimeFormat, setModalDatetimeFormat] = useState<'datetime' | 'date' | 'time'>('datetime');
  const [modalDatetimeCustom, setModalDatetimeCustom] = useState('');

  const [modalTemplateType, setModalTemplateType] = useState<'tech' | 'bug' | 'opinion'>('tech');

  const [modalFootnoteId, setModalFootnoteId] = useState('1');
  const [modalFootnoteContent, setModalFootnoteContent] = useState('');

  const openPollModal = () => {
    setModalPollQuestion('');
    setModalPollOptions(['非常认同', '有待探讨']);
    setModalPollType('regular');
    setActiveModal('poll');
    setActiveDropdown(null);
  };

  const openTableModal = () => {
    setModalTableRows(3);
    setModalTableCols(3);
    setModalTableHeaders(['标题 1', '标题 2', '标题 3']);
    setActiveModal('table');
    setActiveDropdown(null);
  };

  const openDetailsModal = () => {
    setModalDetailsSummary('点击展开详细内容');
    setModalDetailsContent('');
    setActiveModal('details');
    setActiveDropdown(null);
  };

  const openSpoilerModal = () => {
    setModalSpoilerText('');
    setActiveModal('spoiler');
    setActiveDropdown(null);
  };

  const openMathModal = () => {
    setModalMathFormula('\\int_{0}^{\\infty} e^{-x^2} dx = \\frac{\\sqrt{\\pi}}{2}');
    setActiveModal('math');
    setActiveDropdown(null);
  };

  const openScrollModal = () => {
    setModalScrollHeight(160);
    setModalScrollContent('');
    setActiveModal('scroll');
    setActiveDropdown(null);
  };

  const openCalloutModal = () => {
    setModalCalloutType('note');
    setModalCalloutTitle('重点提示');
    setModalCalloutContent('');
    setActiveModal('callout');
    setActiveDropdown(null);
  };

  const openTocModal = () => {
    setModalTocIncludeHeaders(true);
    setModalTocDepth(3);
    setActiveModal('toc');
    setActiveDropdown(null);
  };

  const openMermaidModal = (type: 'flowchart' | 'sequence' | 'gantt' | 'class' | 'pie' | 'state' = 'flowchart') => {
    setModalMermaidType(type);
    const presets: Record<string, string> = {
      flowchart: `graph TD\n    A[开始 Start] --> B{判定条件};\n    B -->|满足条件| C[执行目标核心流程];\n    B -->|异常未通过| D[回滚并记录告警];\n    C --> E[结束 End];`,
      sequence: `sequenceDiagram\n    autonumber\n    actor User as 用户\n    participant Gateway as 边缘网关\n    participant Service as 评论服务\n    participant DB as D1 数据库\n    User->>Gateway: 发起请求 POST /api/comments\n    Gateway->>Service: 鉴权与内容校验\n    Service->>DB: 事务安全持久化\n    DB-->>Service: 返回操作结果\n    Service-->>User: 200 OK 响应最新评论`,
      gantt: `gantt\n    title 项目功能迭代推进计划\n    dateFormat YYYY-MM-DD\n    section UI规范\n    原型与规范打磨: 2026-09-01, 3d\n    section 交互与功能\n    居中弹窗与规则说明: 2026-09-04, 2d`,
      class: `classDiagram\n    class CommentItem {\n        +String id\n        +String author\n        +String message\n        +Date createdAt\n        +renderMarkdown()\n    }`,
      pie: `pie title 架构模块耗时占比\n    "Markdown 解析" : 35\n    "网络传输" : 25\n    "数据存储" : 20\n    "前端动效" : 20`,
      state: `stateDiagram-v2\n    [*] --> 草稿态 Draft\n    草稿态 Draft --> 校验中 Validating: 提交发表\n    校验中 Validating --> 已发布 Published: 校验通过\n    校验中 Validating --> 错误态 Error: 校验失败\n    已发布 Published --> [*]`,
    };
    setModalMermaidCode(presets[type] || presets.flowchart);
    setActiveModal('mermaid');
    setActiveDropdown(null);
  };

  const openChartModal = (type: 'bar' | 'line' | 'pie' = 'bar') => {
    setModalChartType(type);
    const presets: Record<string, string> = {
      bar: `{\n  "type": "bar",\n  "data": {\n    "labels": ["Q1", "Q2", "Q3", "Q4"],\n    "datasets": [{ "label": "活跃指标", "data": [120, 290, 480, 650] }]\n  }\n}`,
      line: `{\n  "type": "line",\n  "data": {\n    "labels": ["01月", "02月", "03月", "04月", "05月", "06月"],\n    "datasets": [{ "label": "访问量趋势", "data": [1500, 2300, 4200, 3800, 6200, 8900] }]\n  }\n}`,
      pie: `{\n  "type": "pie",\n  "data": {\n    "labels": ["前端交互", "边缘网关", "D1 存储", "第三方服务"],\n    "datasets": [{ "data": [40, 25, 20, 15] }]\n  }\n}`,
    };
    setModalChartCode(presets[type] || presets.bar);
    setActiveModal('chart');
    setActiveDropdown(null);
  };

  const openGraphvizModal = (type: 'digraph' | 'graph' = 'digraph') => {
    setModalGraphvizType(type);
    const presets: Record<string, string> = {
      digraph: `digraph Architecture {\n  rankdir=LR;\n  node [shape=box, style=rounded];\n  Browser -> CloudflarePages [label="HTTPS"];\n  CloudflarePages -> WorkersAPI [label="Edge Functions"];\n  WorkersAPI -> D1Database [label="SQL Binding"];\n}`,
      graph: `graph Cluster {\n  layout=neato;\n  NodeA -- NodeB;\n  NodeB -- NodeC;\n  NodeC -- NodeA;\n  NodeC -- NodeD;\n}`,
    };
    setModalGraphvizCode(presets[type] || presets.digraph);
    setActiveModal('graphviz');
    setActiveDropdown(null);
  };

  const openDatetimeModal = () => {
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const full = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
    setModalDatetimeFormat('datetime');
    setModalDatetimeCustom(full);
    setActiveModal('datetime');
    setActiveDropdown(null);
  };

  const openTemplateModal = (type: 'tech' | 'bug' | 'opinion' = 'tech') => {
    setModalTemplateType(type);
    setActiveModal('template');
    setActiveDropdown(null);
  };

  const openFootnoteModal = () => {
    setModalFootnoteId('1');
    setModalFootnoteContent('');
    setActiveModal('footnote');
    setActiveDropdown(null);
  };

  const openImageModal = (tab: 'upload' | 'guide' | 'url' = 'upload') => {
    setModalImageTab(tab);
    setModalImageUrl('');
    setModalImageAlt('');
    setUploadError(null);
    setIsUploadingImage(false);
    setActiveModal('image');
    setActiveDropdown(null);
  };

  const handleImageFileSelect = async (file: File) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setUploadError('仅支持上传图片文件 (JPG, PNG, GIF, WebP, SVG, AVIF)');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setUploadError('图片体积超过 10MB 上限');
      return;
    }
    setIsUploadingImage(true);
    setUploadError(null);
    showToast('正在将图片上传至 Telegram 图床...', 'info', 3000);
    try {
      const res = await uploadCommentImage(file);
      if (!res.ok || !res.url) {
        setUploadError(res.error || '图片上传失败');
        showToast(`上传失败: ${res.error || '未知错误'}`, 'error');
      } else {
        setModalImageUrl(res.url);
        if (!modalImageAlt) {
          const rawName = file.name.replace(/\.[^/.]+$/, '');
          setModalImageAlt(rawName);
        }
        showToast('图片上传成功并已持久化至 Telegram！', 'success');
      }
    } catch (err: any) {
      setUploadError(err?.message || '图片上传异常');
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handlePasteOnInput = async (
    e: React.ClipboardEvent<HTMLTextAreaElement>,
    targetSetter: React.Dispatch<React.SetStateAction<string>>
  ) => {
    const items = e.clipboardData?.items;
    if (!items || items.length === 0) return;
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.type.indexOf('image') !== -1) {
        e.preventDefault();
        const file = item.getAsFile();
        if (!file) continue;
        showToast('检测到剪贴板图片，正在自动上传至 Telegram 图床...', 'info', 3500);
        try {
          const res = await uploadCommentImage(file);
          if (res.ok && res.url) {
            const mdSnippet = `\n![${file.name || 'image'}](${res.url})\n`;
            targetSetter((prev) => prev + mdSnippet);
            showToast('剪贴板图片已成功上传并插入！', 'success');
          } else {
            showToast(`图片上传失败: ${res.error || '未知错误'}`, 'error');
          }
        } catch (err: any) {
          showToast(`图片上传异常: ${err?.message || '网络超时'}`, 'error');
        }
        return;
      }
    }
  };

  const handleDropOnInput = async (
    e: React.DragEvent<HTMLTextAreaElement>,
    targetSetter: React.Dispatch<React.SetStateAction<string>>
  ) => {
    e.preventDefault();
    setIsMainDragOver(false);
    const files = e.dataTransfer?.files;
    if (!files || files.length === 0) return;
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.type.startsWith('image/')) {
        showToast(`正在上传拖拽图片 ${file.name} 至 Telegram 图床...`, 'info', 3500);
        try {
          const res = await uploadCommentImage(file);
          if (res.ok && res.url) {
            const mdSnippet = `\n![${file.name || 'image'}](${res.url})\n`;
            targetSetter((prev) => prev + mdSnippet);
            showToast(`拖拽图片 ${file.name} 上传成功！`, 'success');
          } else {
            showToast(`图片上传失败: ${res.error || '未知错误'}`, 'error');
          }
        } catch (err: any) {
          showToast(`图片上传异常: ${err?.message || '网络超时'}`, 'error');
        }
      }
    }
  };

  const handleConfirmModal = () => {
    if (activeModal === 'poll') {
      const q = modalPollQuestion.trim();
      const validOpts = modalPollOptions.map((o) => o.trim()).filter(Boolean);
      const opts = validOpts.length >= 2 ? validOpts : ['非常认同', '有待探讨'];
      const qLine = q ? `> 🗳️ 投票主题：${q}\n` : '';
      const markdown = `\n${qLine}[poll type=${modalPollType}]\n${opts.map((o) => `* ${o}`).join('\n')}\n[/poll]\n`;
      insertMarkdown(markdown);
      showToast('已成功插入互动投票组件');
    } else if (activeModal === 'table') {
      const rows = Math.max(1, Math.min(10, modalTableRows));
      const cols = Math.max(1, Math.min(6, modalTableCols));
      const headers = Array.from({ length: cols }, (_, i) => modalTableHeaders[i]?.trim() || `列 ${i + 1}`);
      const headerLine = `| ${headers.join(' | ')} |`;
      const separatorLine = `| ${Array(cols).fill('---').join(' | ')} |`;
      const bodyLines = Array.from({ length: rows }, (_, r) => {
        const cells = Array.from({ length: cols }, (_, c) => `数据 ${r + 1}-${c + 1}`);
        return `| ${cells.join(' | ')} |`;
      });
      insertMarkdown(`\n${headerLine}\n${separatorLine}\n${bodyLines.join('\n')}\n`);
      showToast('已成功插入数据表格');
    } else if (activeModal === 'details') {
      const summary = modalDetailsSummary.trim() || '点击展开详细内容';
      const content = modalDetailsContent.trim() || '在此输入折叠区块详细内容...';
      insertMarkdown(`\n<details>\n<summary>${summary}</summary>\n\n${content}\n</details>\n`);
      showToast('已成功插入折叠区块');
    } else if (activeModal === 'spoiler') {
      const text = modalSpoilerText.trim() || '剧透内容';
      insertMarkdown(`[spoiler]${text}[/spoiler]`);
      showToast('已成功插入剧透隐藏内容');
    } else if (activeModal === 'math') {
      const formula = modalMathFormula.trim() || 'E = mc^2';
      insertMarkdown(`\n$$\n${formula}\n$$\n`);
      showToast('已成功插入 LaTeX 公式');
    } else if (activeModal === 'scroll') {
      const height = Math.max(80, Math.min(600, modalScrollHeight));
      const content = modalScrollContent.trim() || '在此输入定高滚动的长篇日志、排查记录或大量文本...';
      insertMarkdown(`\n::: scroll height=${height}\n${content}\n:::\n`);
      showToast('已成功插入滚动内容容器');
    } else if (activeModal === 'callout') {
      const type = modalCalloutType || 'note';
      const title = modalCalloutTitle.trim() ? ` ${modalCalloutTitle.trim()}` : '';
      const content = modalCalloutContent.trim() || '在此输入高光卡片内容...';
      insertMarkdown(`\n::: ${type}${title}\n${content}\n:::\n`);
      showToast('已成功套用高光卡片格式');
    } else if (activeModal === 'toc') {
      const depth = Math.max(1, Math.min(6, modalTocDepth));
      const includeHeaders = modalTocIncludeHeaders ? ' headers=true' : '';
      insertMarkdown(`\n[toc depth=${depth}${includeHeaders}]\n`);
      showToast('已成功插入文章目录标记');
    } else if (activeModal === 'mermaid') {
      const code = modalMermaidCode.trim() || 'graph TD\n    A[开始] --> B[结束]';
      insertMarkdown(`\n\`\`\`mermaid\n${code}\n\`\`\`\n`);
      showToast('已成功插入 Mermaid 图表');
    } else if (activeModal === 'chart') {
      const code = modalChartCode.trim() || '{\n  "type": "bar",\n  "data": { "labels": ["A", "B"], "datasets": [{ "data": [1, 2] }] }\n}';
      insertMarkdown(`\n\`\`\`chart\n${code}\n\`\`\`\n`);
      showToast('已成功插入 Build Chart');
    } else if (activeModal === 'graphviz') {
      const code = modalGraphvizCode.trim() || 'digraph G {\n  A -> B;\n}';
      insertMarkdown(`\n\`\`\`graphviz\n${code}\n\`\`\`\n`);
      showToast('已成功插入 Graphviz 拓扑');
    } else if (activeModal === 'datetime') {
      const format = modalDatetimeFormat;
      const custom = modalDatetimeCustom.trim();
      const val = custom || new Date().toISOString();
      insertMarkdown(`[date=${val} format="${format}"]`);
      showToast('已成功插入日期时间标记');
    } else if (activeModal === 'template') {
      const templates: Record<string, string> = {
        tech: `### 💡 核心观点与设计方案\n在此简明扼要概括您的核心技术方案或核心论点...\n\n### 🔍 依据与量化分析\n1. **优势分析**：分析方案带来的性能提升或体验改善。\n2. **潜在风险**：针对边界异常或高并发下的应对策略。\n\n### 🎯 改进与落地建议\n- [ ] 建议步骤一：...\n- [ ] 建议步骤二：...\n`,
        bug: `### ⚠️ 异常现象描述\n在此详细描述出现的非预期现象或错误提示...\n\n### 🖥️ 运行环境与复现步骤\n- **环境信息**：操作系统 / 浏览器版本\n- **复现步骤**：\n  1. 访问对应页面...\n  2. 点击某个交互按钮...\n  3. 观察控制台/页面显示...\n\n### 🪵 报错日志与初步排查\n\`\`\`bash\n在此粘贴相关报错堆栈或网络请求抓包\n\`\`\`\n\n### 💡 期望的正确行为\n说明理论上应该展现的正确效果或预期返回结果。\n`,
        opinion: `### 🤝 认同之处\n非常赞同博文中关于这一视角的论述，特别是在...方面很有启发。\n\n### 🤔 补充视角与延伸思考\n从另一个角度来看，或许可以补充考虑以下几点：\n1. ...\n2. ...\n\n### 💬 交流请教\n对于...的实现细节，博主是否有进一步的实践经验分享？\n`,
      };
      insertMarkdown(`\n${templates[modalTemplateType] || templates.tech}\n`);
      showToast('已成功插入论述范本');
    } else if (activeModal === 'footnote') {
      const fid = modalFootnoteId.trim() || '1';
      const fcontent = modalFootnoteContent.trim() || '在此输入脚注参考说明与文献出处';
      insertMarkdown(`[^${fid}]`, `\n\n[^${fid}]: ${fcontent}\n`);
      showToast('已成功插入参考脚注');
    } else if (activeModal === 'image') {
      if (!modalImageUrl.trim()) {
        showToast('请先选择并上传图片，或输入图片外部链接', 'error');
        return;
      }
      const alt = modalImageAlt.trim() || '图片';
      insertMarkdown(`\n![${alt}](${modalImageUrl.trim()})\n`);
      showToast('已成功插入图片');
    }
    setActiveModal(null);
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (activeModal && typeof document !== 'undefined') {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [activeModal]);

  // Fetch real comments with admin token capability for IP inspection
  const loadComments = useCallback(async (sort = sortOrder) => {
    setLoading(true);
    try {
      const currentIdentity = readCommentIdentity();
      const token = currentIdentity?.token;
      const data = await fetchComments(slug, sort, { token });
      setComments(data);
    } catch (err) {
      console.warn('[PostComments] Load error:', err);
      setComments([]);
    } finally {
      setLoading(false);
    }
  }, [slug, sortOrder]);

  useEffect(() => {
    setAccount(readCommentIdentity());

    const syncAccountState = () => {
      setAccount(readCommentIdentity());
      void loadComments();
    };

    const handleAccountChange = (event: Event) => {
      const detail = (event as CustomEvent<CommentIdentity | null>).detail ?? readCommentIdentity();
      setAccount(detail);
      void loadComments();
    };

    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.tk-toolbar-item') && !target.closest('.tk-dropdown-panel')) {
        setActiveDropdown(null);
      }
      if (!target.closest('.tk-reaction-interactive-wrapper')) {
        setActiveReactionPopupId(null);
      }
    };

    const handleQuotePostText = (event: Event) => {
      const detail = (event as CustomEvent<{ text: string; url: string; title: string }>).detail;
      if (!detail?.text) return;

      const commentEl = document.querySelector('#post-comment');
      commentEl?.scrollIntoView({ behavior: 'smooth' });

      setEditorTab('edit');
      setMainInputFocused(true);

      const quoteBlock = `> 引用自《${detail.title || title}》：\n> ${detail.text.trim()}\n\n`;
      insertMarkdown(quoteBlock, '', '');
      showToast('已将博文选中文段引用至评论区', 'success');
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setActiveModal(null);
        setActiveDropdown(null);
        setActiveReactionPopupId(null);
      }
    };

    window.addEventListener('shijianus:comment-account-change', handleAccountChange);
    window.addEventListener('storage', syncAccountState);
    window.addEventListener('focus', syncAccountState);
    document.addEventListener('click', handleOutsideClick);
    window.addEventListener('shijianus:quote-post-text', handleQuotePostText);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('shijianus:comment-account-change', handleAccountChange);
      window.removeEventListener('storage', syncAccountState);
      window.removeEventListener('focus', syncAccountState);
      document.removeEventListener('click', handleOutsideClick);
      window.removeEventListener('shijianus:quote-post-text', handleQuotePostText);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [title, loadComments]);

  useEffect(() => {
    loadComments(sortOrder);
  }, [loadComments, sortOrder, account?.token, account?.role]);

  const canManage = (comment: BlogComment) => {
    if (account?.role === 'admin') return true;
    return visitorSessionTokens.has(comment.id);
  };

  const openAccountDrawer = () => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('shijianus:open-notifications'));
    }
  };

  const handleSortToggle = (newSort: 'hot' | 'new') => {
    if (newSort === sortOrder) return;
    setSortOrder(newSort);
  };

  const toggleReplies = (rootId: string) => {
    setExpandedReplies((prev) => {
      const next = new Set(prev);
      if (next.has(rootId)) {
        next.delete(rootId);
      } else {
        next.add(rootId);
      }
      return next;
    });
  };

  const toggleLongText = (commentId: string) => {
    setExpandedTexts((prev) => {
      const next = new Set(prev);
      if (next.has(commentId)) {
        next.delete(commentId);
      } else {
        next.add(commentId);
      }
      return next;
    });
  };

  // Helper: insert Markdown syntax at textarea cursor
  const insertMarkdown = (prefix: string, suffix = '', defaultPlaceholder = '') => {
    const el = textareaRef.current;
    if (!el) {
      setMainMessage((prev) => `${prev}${prefix}${defaultPlaceholder}${suffix}`);
      return;
    }
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const prev = el.value;
    const selected = prev.substring(start, end);
    const content = selected || defaultPlaceholder;
    const replacement = `${prefix}${content}${suffix}`;
    const nextVal = prev.substring(0, start) + replacement + prev.substring(end);

    setMainMessage(nextVal.slice(0, COMMENT_LIMIT));
    setActiveDropdown(null);
    setMainInputFocused(true);

    setTimeout(() => {
      el.focus();
      const newPos = start + prefix.length + content.length;
      el.setSelectionRange(newPos, newPos);
    }, 20);
  };

  // Main Submission (Normal Comment)
  const handleMainSubmit = async () => {
    const trimmed = mainMessage.trim();
    if (!trimmed) {
      showToast('请填写评论内容', 'error');
      return;
    }

    if (trimmed.length > COMMENT_LIMIT) {
      showToast(`评论内容不能超过 ${COMMENT_LIMIT} 字`, 'error');
      return;
    }

    setSubmitting(true);

    try {
      const res = await createComment({
        slug,
        message: trimmed,
        postType: 'comment',
        quote: quoteState,
        author: account,
      });

      if (res.ok && res.comment) {
        if (res.sessionToken && res.comment.id) {
          setVisitorSessionTokens((prev) => {
            const next = new Map(prev);
            next.set(res.comment!.id, res.sessionToken!);
            return next;
          });
        }

        setMainMessage('');
        setQuoteState(null);
        setMainInputFocused(false);
        setEditorTab('edit');
        showToast('评论已成功发布！', 'success');

        await loadComments();
      } else {
        showToast(res.error || '提交失败，请重试', 'error');
      }
    } catch {
      showToast('提交异常，请稍后重试', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // In-place Reply Submission
  const handleReplySubmit = async (rootCommentId: string) => {
    const trimmed = replyMessage.trim();
    if (!trimmed) return;
    const currentLimit = replyMode === 'boost' ? BOOST_LIMIT : COMMENT_LIMIT;
    if (trimmed.length > currentLimit) {
      showToast(
        replyMode === 'boost'
          ? `🚀 Boost 回复不能超过 ${BOOST_LIMIT} 个字`
          : `回复内容不能超过 ${COMMENT_LIMIT} 字`,
        'error'
      );
      return;
    }

    setReplySubmitting(true);
    try {
      const res = await createComment({
        slug,
        message: trimmed,
        postType: replyMode,
        parentId: rootCommentId,
        author: account,
      });

      if (res.ok && res.comment) {
        if (res.sessionToken && res.comment.id) {
          setVisitorSessionTokens((prev) => {
            const next = new Map(prev);
            next.set(res.comment!.id, res.sessionToken!);
            return next;
          });
        }

        setReplyMessage('');
        setReplyingToCommentId(null);
        setReplyingTargetAuthor('');
        setReplyMode('comment');
        setExpandedReplies((prev) => new Set(prev).add(rootCommentId));
        showToast(replyMode === 'boost' ? '🚀 Boost 回复已成功发表！' : '回复已成功发表！', 'success');

        await loadComments();
      } else {
        showToast(res.error || '回复失败', 'error');
      }
    } catch {
      showToast('回复异常，请重试', 'error');
    } finally {
      setReplySubmitting(false);
    }
  };

  // Inline Edit Save
  const handleSaveEdit = async (commentId: string) => {
    const trimmed = editingMessage.trim();
    if (!trimmed) {
      showToast('修改内容不能为空', 'error');
      return;
    }

    const token = visitorSessionTokens.get(commentId) || '';
    setSavingEdit(true);
    try {
      const res = await editComment({
        id: commentId,
        message: trimmed,
        sessionToken: token,
      });

      if (res.ok) {
        setEditingCommentId(null);
        setEditingMessage('');
        showToast('评论修改成功！', 'success');
        await loadComments();
      } else {
        showToast(res.error || '修改失败', 'error');
      }
    } catch {
      showToast('修改请求异常', 'error');
    } finally {
      setSavingEdit(false);
    }
  };

  // Delete Comment
  const handleDelete = async (commentId: string) => {
    if (typeof window !== 'undefined' && !window.confirm('确定要删除这条内容吗？')) {
      return;
    }

    const token = visitorSessionTokens.get(commentId) || '';
    try {
      const res = await deleteComment({
        id: commentId,
        sessionToken: token,
      });

      if (res.ok) {
        setVisitorSessionTokens((prev) => {
          const next = new Map(prev);
          next.delete(commentId);
          return next;
        });
        showToast('内容已删除', 'success');
        await loadComments();
      } else {
        showToast(res.error || '删除失败', 'error');
      }
    } catch {
      showToast('删除请求异常', 'error');
    }
  };

  // Like / Reaction (Strict visitor blocking: visitors have 0 like permission)
  const handleLike = async (commentId: string, emoji = '👍') => {
    if (!account || account.role === 'visitor') {
      showToast('⚠️ 访客无点赞权限，仅注册/登录用户可点赞或进行表情互动', 'error');
      openAccountDrawer();
      setActiveReactionPopupId(null);
      return;
    }

    try {
      const res = await likeComment({
        id: commentId,
        emoji,
        author: account,
      });

      if (res.ok) {
        setComments((prev) =>
          prev.map((c) =>
            c.id === commentId
              ? {
                  ...c,
                  likesCount: res.likesCount ?? c.likesCount,
                  reactions: res.reactions ?? c.reactions,
                }
              : c
          )
        );
        setActiveReactionPopupId(null);
      } else {
        showToast(res.error || '点赞失败', 'error');
      }
    } catch {
      showToast('点赞异常，请稍后重试', 'error');
    }
  };

  // Reaction hover / long press management
  const triggerReactionPressStart = (commentId: string) => {
    isLongPressTriggeredRef.current = false;
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
    }
    longPressTimerRef.current = setTimeout(() => {
      isLongPressTriggeredRef.current = true;
      setActiveReactionPopupId(commentId);
    }, 260);
  };

  const triggerReactionPressEnd = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const handleReactionButtonClick = (commentId: string, currentReaction?: string) => {
    if (isLongPressTriggeredRef.current) {
      isLongPressTriggeredRef.current = false;
      return;
    }
    handleLike(commentId, currentReaction || '👍');
  };

  // Trigger Quote
  const handleQuoteClick = (item: BlogComment) => {
    setQuoteState({
      id: item.id,
      authorName: item.authorName,
      text: item.message.slice(0, 120),
    });
    setMainInputFocused(true);
    setEditorTab('edit');
    document.querySelector('#post-comment')?.scrollIntoView({ behavior: 'smooth' });
  };

  // Build comment tree
  const commentTree = useMemo(() => {
    const roots: BlogComment[] = [];
    const replyMap = new Map<string, BlogComment[]>();

    comments.forEach((c) => {
      if (c.parentId) {
        const list = replyMap.get(c.parentId) || [];
        list.push(c);
        replyMap.set(c.parentId, list);
      } else {
        roots.push(c);
      }
    });

    return { roots, replyMap };
  }, [comments]);

  return (
    <div id="post-comment">
      {/* Header bar */}
      <div className="comment-head">
        <h3 className="comment-headline">
          <i className="anzhiyufont anzhiyu-icon-comments" aria-hidden="true"></i>
          <span>{heading}</span>
        </h3>
        <div className="comment-randomInfo">
          <a
            onClick={openAccountDrawer}
            title="前往账号中心登录或设置个性化资料"
            style={{ cursor: 'pointer' }}
          >
            {account?.provider === 'epomail'
              ? `⚡ ${account.name} (Epomail)`
              : account && account.role !== 'visitor'
              ? `👤 ${account.name}`
              : '访客身份 (点击登录)'}
          </a>
          <a
            href="/about"
            target="_blank"
            rel="noreferrer"
            title="阅读站点使用协议与隐私政策"
          >
            {policyLabel}
          </a>
        </div>
      </div>

      <div className="comment-wrap">
        <div className="twikoo tk-comments">
          {/* Main Input Box */}
          <div className={`tk-submit ${mainInputFocused || mainMessage.trim() ? 'is-expanded' : ''}`}>
            {/* Top Mode Bar: replaced tk-mode-tabs with Edit & Preview tabs */}
            <div className="tk-mode-bar">
              <div className="tk-editor-tabs">
                <button
                  type="button"
                  className={`tk-editor-tab-btn ${editorTab === 'edit' ? 'is-active' : ''}`}
                  onClick={() => setEditorTab('edit')}
                >
                  ✏️ 编辑
                </button>
                <button
                  type="button"
                  className={`tk-editor-tab-btn ${editorTab === 'preview' ? 'is-active' : ''}`}
                  onClick={() => setEditorTab('preview')}
                >
                  👁️ 预览
                </button>
              </div>
            </div>

            {/* Standard Input Area */}
            <div className="tk-row">
              <div
                className="tk-avatar theme-account-drawer__summary-avatar"
                onClick={openAccountDrawer}
                title={
                  effectiveCurrentAvatar.isVisitor
                    ? '访客身份 (点击登录账号/设置专属头像)'
                    : `当前身份: ${effectiveCurrentAvatar.name} (${effectiveCurrentAvatar.role === 'admin' ? '博主' : '读者'})`
                }
                style={{ cursor: 'pointer' }}
              >
                {effectiveCurrentAvatar.url ? (
                  <img src={effectiveCurrentAvatar.url} alt={effectiveCurrentAvatar.name} loading="lazy" />
                ) : !effectiveCurrentAvatar.isVisitor ? (
                  <span className="tk-avatar-initials">{effectiveCurrentAvatar.initials}</span>
                ) : (
                  <div className="tk-avatar-visitor-icon" title="访客">
                    <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
                      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                    </svg>
                  </div>
                )}
              </div>

              <div className="tk-col">
                {/* Quoted Source Preview Box */}
                {quoteState && (
                  <div className="tk-quote-preview-card">
                    <div className="tk-quote-preview-meta">
                      <span>🔗 引用 <strong>@{quoteState.authorName}</strong> 的评论：</span>
                      <button type="button" onClick={() => setQuoteState(null)}>✕</button>
                    </div>
                    <p className="tk-quote-preview-text">{quoteState.text}</p>
                  </div>
                )}

                {/* 1. Linuxdo-style Markdown Toolbar (Placed right above tk-input el-textarea) */}
                {editorTab === 'edit' && (
                  <div className="tk-markdown-toolbar" role="toolbar" aria-label="Markdown 编辑工具栏">
                    {/* ① 贴文语言 */}
                    <div className="tk-toolbar-item">
                      <button
                        type="button"
                        className="tk-tb-btn tk-tb-btn-lang"
                        title="贴文语言：选择并插入指定语种区块"
                        aria-label="贴文语言选择"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveDropdown((prev) => (prev === 'lang' ? null : 'lang'));
                        }}
                      >
                        <Languages size={15} />
                        <ChevronDown size={10} className="tk-tb-chevron" />
                      </button>
                      {activeDropdown === 'lang' && (
                        <div className="tk-dropdown-panel tk-lang-dropdown" onClick={(e) => e.stopPropagation()}>
                          <div className="tk-dropdown-title">选择贴文语言</div>
                          {POST_LANGUAGES.map((lang) => (
                            <button
                              key={lang.code}
                              type="button"
                              className="tk-dropdown-item"
                              onClick={() => {
                                insertMarkdown(`<div lang="${lang.code}">\n`, '\n</div>', '在此处输入该语言内容');
                                showToast(`已插入 ${lang.label} 语言区块`);
                              }}
                            >
                              <div className="tk-dropdown-item-content">
                                <div className="tk-dropdown-icon-col">
                                  <Languages size={14} className="tk-dropdown-svg" />
                                </div>
                                <div className="tk-dropdown-text-col">
                                  <span className="tk-dropdown-label">{lang.label}</span>
                                  <span className="tk-dropdown-desc">设置该区块为 {lang.code} 语种</span>
                                </div>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    <span className="tk-tb-divider" />

                    {/* ② 加粗 */}
                    <button
                      type="button"
                      className="tk-tb-btn tk-tb-bold"
                      title="加粗 (Ctrl+B)"
                      onClick={() => insertMarkdown('**', '**', '粗体文字')}
                    >
                      <Bold size={15} />
                    </button>

                    {/* ③ 斜体 */}
                    <button
                      type="button"
                      className="tk-tb-btn tk-tb-italic"
                      title="斜体 (Ctrl+I)"
                      onClick={() => insertMarkdown('*', '*', '斜体文字')}
                    >
                      <Italic size={15} />
                    </button>

                    {/* ④ 文字大小 */}
                    <button
                      type="button"
                      className="tk-tb-btn tk-tb-heading"
                      title="标题字号"
                      onClick={() => insertMarkdown('### ', '', '标题内容')}
                    >
                      <Heading size={15} />
                    </button>

                    {/* ⑤ 块引用 */}
                    <button
                      type="button"
                      className="tk-tb-btn tk-tb-quote tk-tb-btn-quote"
                      title="块引用"
                      onClick={() => insertMarkdown('> ', '', '引用文本内容')}
                    >
                      <Quote size={15} />
                    </button>

                    {/* ⑥ 预初始化文字 (代码) */}
                    <button
                      type="button"
                      className="tk-tb-btn tk-tb-code tk-tb-btn-code"
                      title="预格式化代码"
                      onClick={() => insertMarkdown('```\n', '\n```', 'console.log("Hello, World!");')}
                    >
                      <Code size={15} />
                    </button>

                    {/* ⑦ 清单 */}
                    <button
                      type="button"
                      className="tk-tb-btn tk-tb-list tk-tb-btn-list"
                      title="列表清单"
                      onClick={() => insertMarkdown('- ', '', '列表项清单')}
                    >
                      <List size={15} />
                    </button>

                    {/* ⑧ 切换方向 */}
                    <button
                      type="button"
                      className={`tk-tb-btn tk-tb-direction tk-tb-btn-direction ${textDirection === 'rtl' ? 'is-active' : ''}`}
                      title="切换文本排版书写方向 (LTR / RTL)"
                      onClick={() => {
                        const nextDir = textDirection === 'ltr' ? 'rtl' : 'ltr';
                        setTextDirection(nextDir);
                        showToast(`已切换排版方向为：${nextDir.toUpperCase()}`);
                      }}
                    >
                      <ArrowLeftRight size={15} />
                    </button>

                    {/* ⑨ emoji */}
                    <div className="tk-toolbar-item">
                      <button
                        type="button"
                        className="tk-tb-btn tk-tb-emoji"
                        title="插入表情"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveDropdown((prev) => (prev === 'emoji' ? null : 'emoji'));
                        }}
                      >
                        <Smile size={15} />
                      </button>
                      {activeDropdown === 'emoji' && (
                        <div className="tk-dropdown-panel tk-emoji-picker-dropdown" onClick={(e) => e.stopPropagation()}>
                          <div className="tk-dropdown-title">常用表情 (点击插入)</div>
                          <div className="tk-emoji-grid">
                            {QUICK_EMOJIS.map((em) => (
                              <button
                                key={em}
                                type="button"
                                className="tk-emoji-cell-btn"
                                onClick={() => insertMarkdown(em)}
                              >
                                {em}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* ⑩ 插入图片 */}
                    <button
                      type="button"
                      className="tk-tb-btn tk-tb-image"
                      title="插入图片 (支持本地上传、剪贴板粘贴与拖拽上传至 Telegram 图床)"
                      aria-label="插入图片"
                      onClick={() => openImageModal('upload')}
                    >
                      <ImageIcon size={15} />
                    </button>

                    <span className="tk-tb-divider" />

                    {/* ⑩ 选项 (下拉包含 15 个高级拓展功能，含居中 UI 弹窗与 SVG 图标及注释文本) */}
                    <div className="tk-toolbar-item">
                      <button
                        type="button"
                        className="tk-tb-btn tk-tb-options"
                        title="高级选项：插入表格、目录、图表与各类交互组件"
                        aria-label="更多高级格式与插入选项"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveDropdown((prev) => (prev === 'options' ? null : 'options'));
                        }}
                      >
                        <SlidersHorizontal size={15} />
                        <ChevronDown size={10} className="tk-tb-chevron" />
                      </button>
                      {activeDropdown === 'options' && (
                        <div className="tk-dropdown-panel tk-options-dropdown" onClick={(e) => e.stopPropagation()}>
                          <div className="tk-dropdown-title">高级选项与交互工具</div>

                          {/* 1. 引用贴文 */}
                          <button
                            type="button"
                            className="tk-dropdown-item"
                            onClick={() => {
                              setActiveDropdown(null);
                              const sel = typeof window !== 'undefined' ? window.getSelection()?.toString().trim() : '';
                              if (sel) {
                                insertMarkdown(`> 引用自《${title}》：\n> ${sel}\n\n`);
                                showToast('已引用页面选中文段');
                              } else {
                                insertMarkdown(`> 引用自《${title}》：\n> `, '\n\n', '探讨文章核心逻辑与论点...');
                                showToast('💡 提示：在正文中框选文本后点击右键菜单『引用至评论区』可精准引用！', 'success', 4000);
                              }
                            }}
                          >
                            <div className="tk-dropdown-item-content">
                              <div className="tk-dropdown-icon-col">
                                <Quote size={15} className="tk-dropdown-svg" />
                              </div>
                              <div className="tk-dropdown-text-col">
                                <span className="tk-dropdown-label">引用贴文 (博文内容)</span>
                                <span className="tk-dropdown-desc">引用当前博文选中文段或核心论述</span>
                              </div>
                            </div>
                          </button>

                          {/* 2. 插入表格 (UI 弹窗) */}
                          <button
                            type="button"
                            className="tk-dropdown-item"
                            onClick={() => openTableModal()}
                          >
                            <div className="tk-dropdown-item-content">
                              <div className="tk-dropdown-icon-col">
                                <Table size={15} className="tk-dropdown-svg" />
                              </div>
                              <div className="tk-dropdown-text-col">
                                <span className="tk-dropdown-label">插入表格</span>
                                <span className="tk-dropdown-desc">可视化行列配置，生成规范数据表格</span>
                              </div>
                            </div>
                          </button>

                          {/* 3. 插入目录 (UI 弹窗) */}
                          <button
                            type="button"
                            className="tk-dropdown-item"
                            onClick={() => openTocModal()}
                          >
                            <div className="tk-dropdown-item-content">
                              <div className="tk-dropdown-icon-col">
                                <ListOrdered size={15} className="tk-dropdown-svg" />
                              </div>
                              <div className="tk-dropdown-text-col">
                                <span className="tk-dropdown-label">插入目录</span>
                                <span className="tk-dropdown-desc">自动提取各级标题生成 [TOC] 树</span>
                              </div>
                            </div>
                          </button>

                          {/* 4. 插入滚动内容 (UI 弹窗) */}
                          <button
                            type="button"
                            className="tk-dropdown-item"
                            onClick={() => openScrollModal()}
                          >
                            <div className="tk-dropdown-item-content">
                              <div className="tk-dropdown-icon-col">
                                <ScrollText size={15} className="tk-dropdown-svg" />
                              </div>
                              <div className="tk-dropdown-text-col">
                                <span className="tk-dropdown-label">插入滚动内容</span>
                                <span className="tk-dropdown-desc">定高容器展示超长日志与排查数据</span>
                              </div>
                            </div>
                          </button>

                          {/* 5. 插入 Mermaid chart (UI 弹窗) */}
                          <button
                            type="button"
                            className="tk-dropdown-item"
                            onClick={() => openMermaidModal()}
                          >
                            <div className="tk-dropdown-item-content">
                              <div className="tk-dropdown-icon-col">
                                <GitFork size={15} className="tk-dropdown-svg" />
                              </div>
                              <div className="tk-dropdown-text-col">
                                <span className="tk-dropdown-label">插入 Mermaid chart</span>
                                <span className="tk-dropdown-desc">流程图、时序图、甘特图等拓扑绘制</span>
                              </div>
                            </div>
                          </button>

                          {/* 6. 插入 Build Chart (UI 弹窗) */}
                          <button
                            type="button"
                            className="tk-dropdown-item"
                            onClick={() => openChartModal()}
                          >
                            <div className="tk-dropdown-item-content">
                              <div className="tk-dropdown-icon-col">
                                <BarChart3 size={15} className="tk-dropdown-svg" />
                              </div>
                              <div className="tk-dropdown-text-col">
                                <span className="tk-dropdown-label">插入 Build Chart</span>
                                <span className="tk-dropdown-desc">柱状图、折线图与饼图配置</span>
                              </div>
                            </div>
                          </button>

                          {/* 7. 隐藏详细内容 (UI 弹窗) */}
                          <button
                            type="button"
                            className="tk-dropdown-item"
                            onClick={() => openDetailsModal()}
                          >
                            <div className="tk-dropdown-item-content">
                              <div className="tk-dropdown-icon-col">
                                <ChevronRight size={15} className="tk-dropdown-svg" />
                              </div>
                              <div className="tk-dropdown-text-col">
                                <span className="tk-dropdown-label">隐藏详细内容</span>
                                <span className="tk-dropdown-desc">折叠收拢冗长细节与补充材料</span>
                              </div>
                            </div>
                          </button>

                          {/* 8. 插入 Graphviz graph (UI 弹窗) */}
                          <button
                            type="button"
                            className="tk-dropdown-item"
                            onClick={() => openGraphvizModal()}
                          >
                            <div className="tk-dropdown-item-content">
                              <div className="tk-dropdown-icon-col">
                                <Share2 size={15} className="tk-dropdown-svg" />
                              </div>
                              <div className="tk-dropdown-text-col">
                                <span className="tk-dropdown-label">插入 Graphviz graph</span>
                                <span className="tk-dropdown-desc">DOT 语言生成系统架构与状态流转</span>
                              </div>
                            </div>
                          </button>

                          {/* 9. 插入日期/时间 (UI 弹窗) */}
                          <button
                            type="button"
                            className="tk-dropdown-item"
                            onClick={() => openDatetimeModal()}
                          >
                            <div className="tk-dropdown-item-content">
                              <div className="tk-dropdown-icon-col">
                                <Clock size={15} className="tk-dropdown-svg" />
                              </div>
                              <div className="tk-dropdown-text-col">
                                <span className="tk-dropdown-label">插入日期/时间</span>
                                <span className="tk-dropdown-desc">当前时间戳或自定义日期标记</span>
                              </div>
                            </div>
                          </button>

                          {/* 10. 插入数学式 (UI 弹窗) */}
                          <button
                            type="button"
                            className="tk-dropdown-item"
                            onClick={() => openMathModal()}
                          >
                            <div className="tk-dropdown-item-content">
                              <div className="tk-dropdown-icon-col">
                                <Sigma size={15} className="tk-dropdown-svg" />
                              </div>
                              <div className="tk-dropdown-text-col">
                                <span className="tk-dropdown-label">插入数学式</span>
                                <span className="tk-dropdown-desc">KaTeX / LaTeX 标准数学公式渲染</span>
                              </div>
                            </div>
                          </button>

                          {/* 11. 插入范本 (UI 弹窗) */}
                          <button
                            type="button"
                            className="tk-dropdown-item"
                            onClick={() => openTemplateModal()}
                          >
                            <div className="tk-dropdown-item-content">
                              <div className="tk-dropdown-icon-col">
                                <LayoutTemplate size={15} className="tk-dropdown-svg" />
                              </div>
                              <div className="tk-dropdown-text-col">
                                <span className="tk-dropdown-label">插入范本</span>
                                <span className="tk-dropdown-desc">技术研讨、Bug反馈与观点探讨预设</span>
                              </div>
                            </div>
                          </button>

                          {/* 12. 新增脚注 (UI 弹窗) */}
                          <button
                            type="button"
                            className="tk-dropdown-item"
                            onClick={() => openFootnoteModal()}
                          >
                            <div className="tk-dropdown-item-content">
                              <div className="tk-dropdown-icon-col">
                                <Bookmark size={15} className="tk-dropdown-svg" />
                              </div>
                              <div className="tk-dropdown-text-col">
                                <span className="tk-dropdown-label">新增脚注</span>
                                <span className="tk-dropdown-desc">正文引用标记与文末参考释义联动</span>
                              </div>
                            </div>
                          </button>

                          {/* 13. 模糊化剧透内容 (UI 弹窗) */}
                          <button
                            type="button"
                            className="tk-dropdown-item"
                            onClick={() => openSpoilerModal()}
                          >
                            <div className="tk-dropdown-item-content">
                              <div className="tk-dropdown-icon-col">
                                <EyeOff size={15} className="tk-dropdown-svg" />
                              </div>
                              <div className="tk-dropdown-text-col">
                                <span className="tk-dropdown-label">模糊化剧透内容</span>
                                <span className="tk-dropdown-desc">打码隐藏关键剧透，悬浮即显</span>
                              </div>
                            </div>
                          </button>

                          {/* 14. 建立投票 (UI 弹窗) */}
                          <button
                            type="button"
                            className="tk-dropdown-item"
                            onClick={() => openPollModal()}
                          >
                            <div className="tk-dropdown-item-content">
                              <div className="tk-dropdown-icon-col">
                                <Vote size={15} className="tk-dropdown-svg" />
                              </div>
                              <div className="tk-dropdown-text-col">
                                <span className="tk-dropdown-label">建立投票</span>
                                <span className="tk-dropdown-desc">互动投票组件，支持单选与多选</span>
                              </div>
                            </div>
                          </button>

                          {/* 15. 套用包装格式 (UI 弹窗) */}
                          <button
                            type="button"
                            className="tk-dropdown-item"
                            onClick={() => openCalloutModal()}
                          >
                            <div className="tk-dropdown-item-content">
                              <div className="tk-dropdown-icon-col">
                                <Layers size={15} className="tk-dropdown-svg" />
                              </div>
                              <div className="tk-dropdown-text-col">
                                <span className="tk-dropdown-label">套用包装格式</span>
                                <span className="tk-dropdown-desc">Note / Tip / Warning / Danger 高光卡片</span>
                              </div>
                            </div>
                          </button>

                          {/* 15. 插入图片与指南 (UI 弹窗) */}
                          <button
                            type="button"
                            className="tk-dropdown-item"
                            onClick={() => openImageModal('upload')}
                          >
                            <div className="tk-dropdown-item-content">
                              <div className="tk-dropdown-icon-col">
                                <ImageIcon size={15} className="tk-dropdown-svg" />
                              </div>
                              <div className="tk-dropdown-text-col">
                                <span className="tk-dropdown-label">插入图片 / Telegram 图床</span>
                                <span className="tk-dropdown-desc">本地上传、Ctrl+V 粘贴与拖拽上传托管</span>
                              </div>
                            </div>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Textarea or Preview container */}
                {editorTab === 'edit' ? (
                  <div className="tk-input el-textarea">
                    <textarea
                      ref={textareaRef}
                      dir={textDirection}
                      className={`el-textarea__inner ${isMainDragOver ? 'is-drag-over' : ''}`}
                      value={mainMessage}
                      onFocus={() => setMainInputFocused(true)}
                      onChange={(e) => setMainMessage(e.target.value.slice(0, COMMENT_LIMIT))}
                      onPaste={(e) => handlePasteOnInput(e, setMainMessage)}
                      onDrop={(e) => handleDropOnInput(e, setMainMessage)}
                      onDragOver={(e) => {
                        e.preventDefault();
                        setIsMainDragOver(true);
                      }}
                      onDragLeave={() => setIsMainDragOver(false)}
                      placeholder={`围绕《${title}》发表公开评论... (支持 Markdown 排版、图片快捷粘贴与拖拽上传)`}
                      rows={mainInputFocused || mainMessage.trim() ? 5 : 2}
                    />
                    <span className="el-input__count">
                      {mainMessage.length}/{COMMENT_LIMIT}
                    </span>
                  </div>
                ) : (
                  <div className="tk-preview-container">
                    <div className="tk-preview-badge">最终渲染预览</div>
                    <div
                      className="tk-preview-box"
                      dangerouslySetInnerHTML={{
                        __html:
                          renderCommentMarkdown(mainMessage.trim()) ||
                          '<p class="tk-preview-empty">暂无评论内容可预览，请在“编辑”模式下输入 Markdown 文本。</p>',
                      }}
                    />
                  </div>
                )}

                {/* Actions row */}
                {(mainInputFocused || mainMessage.trim().length > 0) && (
                  <div className="tk-row actions tk-actions-end-only">
                    <div className="tk-row-actions-end">
                      <button
                        type="button"
                        className="tk-btn-cancel"
                        onClick={() => {
                          setMainMessage('');
                          setQuoteState(null);
                          setMainInputFocused(false);
                          setEditorTab('edit');
                        }}
                      >
                        取消
                      </button>
                      <button
                        type="button"
                        className="tk-send"
                        disabled={submitting || !mainMessage.trim()}
                        onClick={handleMainSubmit}
                      >
                        {submitting ? '发送中...' : submitLabel}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Global Notice Toast */}
            {noticeText && (
              <div className={`tk-global-toast is-${noticeText.type}`}>
                {noticeText.type === 'success' ? '✅' : '⚠️'} {noticeText.text}
              </div>
            )}
          </div>

          {/* Public Comments Stream */}
          <div className="tk-comments-container">
            <div className="tk-comments-title">
              <div className="tk-comments-count">
                <span>公开评论</span>
                <strong>({comments.length})</strong>
              </div>

              <div className="tk-sort-group">
                <button
                  type="button"
                  className={`tk-sort-btn ${sortOrder === 'new' ? 'is-active' : ''}`}
                  onClick={() => handleSortToggle('new')}
                >
                  ⏱️ 最新
                </button>
                <span className="tk-sort-divider">|</span>
                <button
                  type="button"
                  className={`tk-sort-btn ${sortOrder === 'hot' ? 'is-active' : ''}`}
                  onClick={() => handleSortToggle('hot')}
                >
                  🔥 最热
                </button>
              </div>
            </div>

            {loading ? (
              <div className="tk-comments-no">
                <span>正在加载评论...</span>
              </div>
            ) : comments.length === 0 ? (
              <div className="tk-comments-no">
                <div className="tk-comments-empty-icon" style={{ fontSize: '28px', opacity: 0.65 }}>💬</div>
                <span>{emptyTitle}，{emptySummary}</span>
              </div>
            ) : (
              <div className="tk-comments-list">
                {commentTree.roots.map((item) => {
                  const replies = commentTree.replyMap.get(item.id) || [];
                  const isEditing = editingCommentId === item.id;
                  const isManageable = canManage(item);
                  const isReplying = replyingToCommentId === item.id;
                  const areRepliesExpanded = expandedReplies.has(item.id);
                  const isTextExpanded = expandedTexts.has(item.id);
                  const isLongText = item.message.length > LONG_TEXT_THRESHOLD;
                  const edited = isEdited(item.createdAt, item.updatedAt);
                  const isBoost = item.postType === 'boost';

                  const rxMeta = computeReactionsMeta(item, account?.id);
                  const isPopupOpen = activeReactionPopupId === item.id;

                  return (
                    <div className={`tk-comment ${isBoost ? 'is-boost-card' : ''}`} key={item.id} id={`comment-${item.id}`}>
                      {/* Avatar */}
                      <div className="tk-avatar theme-account-drawer__summary-avatar">
                        {item.authorAvatar ? (
                          <img src={item.authorAvatar} alt={item.authorName} loading="lazy" />
                        ) : item.authorRole === 'admin' ? (
                          <img src="/media/shijianus/avatar.jpg" alt={item.authorName} loading="lazy" />
                        ) : item.authorName && item.authorName !== '访客' ? (
                          <span className="tk-avatar-initials">{getCommentInitials(item.authorName)}</span>
                        ) : (
                          <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                          </svg>
                        )}
                      </div>

                      {/* Comment Main */}
                      <div className="tk-main">
                        <div className="tk-row tk-meta">
                          <strong className="tk-nick">{item.authorName}</strong>

                          {/* Role Badge */}
                          <span
                            className={`tk-badge ${
                              item.status === 'pinned'
                                ? 'is-pinned'
                                : item.authorRole === 'admin'
                                ? 'is-admin'
                                : 'is-visitor'
                            }`}
                          >
                            {item.status === 'pinned'
                              ? '置顶'
                              : item.authorRole === 'admin'
                              ? '博主'
                              : '访客'}
                          </span>

                          {/* Country / IP Location badge */}
                          {renderGeoBadge(item)}

                          {isBoost && (
                            <span className="tk-boost-pill">
                              <Rocket size={11} className="tk-boost-icon" />
                              <span>Boost</span>
                            </span>
                          )}

                          <time className="tk-time">{formatCommentTime(item.createdAt)}</time>
                          {edited && (
                            <span className="tk-edited-mark">
                              <span className="tk-edited-bracket">(</span>
                              <span className="tk-edited-text">已编辑</span>
                              <span className="tk-edited-bracket">)</span>
                            </span>
                          )}
                        </div>

                        {/* Quoted Source Card */}
                        {item.quote && (
                          <div className="tk-quote-display-card">
                            <div className="tk-quote-display-author">
                              <span>🔗 引用 <strong>@{item.quote.authorName}</strong>：</span>
                            </div>
                            <p className="tk-quote-display-text">{item.quote.text}</p>
                          </div>
                        )}

                        {/* Content or Inline Edit */}
                        {isEditing ? (
                          <div className="tk-inline-edit">
                            <textarea
                              className="el-textarea__inner"
                              value={editingMessage}
                              onChange={(e) => setEditingMessage(e.target.value.slice(0, COMMENT_LIMIT))}
                              onPaste={(e) => handlePasteOnInput(e, setEditingMessage)}
                              onDrop={(e) => handleDropOnInput(e, setEditingMessage)}
                              rows={3}
                            />
                            <div className="tk-inline-edit-actions">
                              <button
                                type="button"
                                className="tk-btn-save"
                                disabled={savingEdit || !editingMessage.trim()}
                                onClick={() => handleSaveEdit(item.id)}
                              >
                                {savingEdit ? '保存中...' : '保存'}
                              </button>
                              <button
                                type="button"
                                className="tk-btn-cancel"
                                onClick={() => setEditingCommentId(null)}
                              >
                                取消
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className={`tk-content ${isBoost ? 'is-boost-text' : ''} ${!isTextExpanded && isLongText ? 'is-clamped' : ''}`}>
                            <div
                              className="tk-rendered-markdown"
                              dangerouslySetInnerHTML={{ __html: renderCommentMarkdown(item.message) }}
                            />
                            {isLongText && (
                              <button
                                type="button"
                                className="tk-expand-text-btn"
                                onClick={() => toggleLongText(item.id)}
                              >
                                {isTextExpanded ? '收起' : '...展开全文'}
                              </button>
                            )}
                          </div>
                        )}

                        {/* Action Toolbar with Long-press Reaction & Top 3 Ranking */}
                        <div className="tk-actions-group">
                          {/* Rich Reaction Interactive Button */}
                          <div className="tk-reaction-interactive-wrapper">
                            <button
                              type="button"
                              className={`tk-action-btn tk-action-like ${rxMeta.userReaction ? 'is-reacted' : ''}`}
                              onClick={() => {
                                handleReactionButtonClick(item.id, rxMeta.userReaction || '👍');
                              }}
                              onMouseDown={() => triggerReactionPressStart(item.id)}
                              onMouseUp={triggerReactionPressEnd}
                              onMouseLeave={triggerReactionPressEnd}
                              onTouchStart={() => triggerReactionPressStart(item.id)}
                              onTouchEnd={triggerReactionPressEnd}
                              aria-label="点赞或长按互动"
                              title={
                                rxMeta.totalCount > 0
                                  ? `互动详情: ${rxMeta.entries.map(([e, c]) => `${e} ${c}`).join(' ')} (长按可切换表情)`
                                  : '点赞 (长按可选择更多表情)'
                              }
                            >
                              {rxMeta.top3.length > 0 ? (
                                <span className="tk-reaction-display-row">
                                  <span className="tk-reaction-emojis-top3">
                                    {rxMeta.top3.map((t) => t.emoji).join('')}
                                  </span>
                                  <span className="tk-reaction-count-badge">{rxMeta.totalCount}</span>
                                </span>
                              ) : (
                                <ThumbsUp size={14} className="tk-action-svg" />
                              )}
                            </button>

                            {/* Long-press / Triggered Emoji Picker Tray */}
                            {isPopupOpen && (
                              <div className="tk-reaction-bubble-popup">
                                <div className="tk-reaction-bubble-title">选择表达表情：</div>
                                <div className="tk-reaction-bubble-list">
                                  {QUICK_EMOJIS.slice(0, 10).map((em) => (
                                    <button
                                      key={em}
                                      type="button"
                                      className={`tk-bubble-emoji-btn ${rxMeta.userReaction === em ? 'is-current' : ''}`}
                                      onClick={() => handleLike(item.id, em)}
                                    >
                                      {em}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>

                          <button
                            type="button"
                            className={`tk-action-btn tk-action-reply ${isReplying && replyMode === 'comment' ? 'is-active' : ''}`}
                            aria-label="回复此评论"
                            title="回复此评论"
                            onClick={() => {
                              if (isReplying && replyMode === 'comment') {
                                setReplyingToCommentId(null);
                                setReplyingTargetAuthor('');
                              } else {
                                setReplyingToCommentId(item.id);
                                setReplyingTargetAuthor(item.authorName);
                                setReplyMode('comment');
                                setReplyMessage('');
                              }
                            }}
                          >
                            <MessageSquare size={14} className="tk-action-svg" />
                          </button>
                          <button
                            type="button"
                            className={`tk-action-btn tk-action-boost ${isReplying && replyMode === 'boost' ? 'is-active' : ''}`}
                            aria-label="发送 16 字以内的火箭 Boost 快速回复"
                            title="发送 16 字以内的火箭 Boost 快速回复"
                            onClick={() => {
                              if (isReplying && replyMode === 'boost') {
                                setReplyingToCommentId(null);
                                setReplyingTargetAuthor('');
                                setReplyMode('comment');
                              } else {
                                setReplyingToCommentId(item.id);
                                setReplyingTargetAuthor(item.authorName);
                                setReplyMode('boost');
                                setReplyMessage('');
                              }
                            }}
                          >
                            <Rocket size={14} className="tk-action-svg tk-action-svg-boost" />
                          </button>
                          <button
                            type="button"
                            className="tk-action-btn tk-action-quote"
                            aria-label="引用此条内容发表评论"
                            title="引用此条内容发表评论"
                            onClick={() => handleQuoteClick(item)}
                          >
                            <Quote size={14} className="tk-action-svg" />
                          </button>
                          {isManageable && (
                            <>
                              <button
                                type="button"
                                className="tk-action-btn tk-action-edit"
                                aria-label="编辑此条评论"
                                title="编辑此条评论"
                                onClick={() => {
                                  setEditingCommentId(item.id);
                                  setEditingMessage(item.message);
                                }}
                              >
                                <Pencil size={14} className="tk-action-svg" />
                              </button>
                              <button
                                type="button"
                                className="tk-action-btn tk-action-delete"
                                aria-label="删除此条评论"
                                title="删除此条评论"
                                onClick={() => handleDelete(item.id)}
                              >
                                <Trash2 size={14} className="tk-action-svg" />
                              </button>
                            </>
                          )}
                        </div>

                        {/* In-place Nested Reply Form */}
                        {isReplying && (
                          <div className={`tk-nested-reply-box ${replyMode === 'boost' ? 'is-boost-mode' : ''}`}>
                            <div className="tk-row">
                              <div className="tk-avatar tk-avatar-small theme-account-drawer__summary-avatar">
                                {effectiveCurrentAvatar.url ? (
                                  <img src={effectiveCurrentAvatar.url} alt={effectiveCurrentAvatar.name} />
                                ) : (
                                  <span>{effectiveCurrentAvatar.initials}</span>
                                )}
                              </div>
                              <div className="tk-col">
                                <div className="tk-reply-header-bar">
                                  {replyMode === 'boost' ? (
                                    <div className="tk-reply-boost-badge">
                                      <Rocket size={12} className="tk-boost-icon" />
                                      <span>火箭 Boost 回复模式 (≤16字)</span>
                                      <button
                                        type="button"
                                        className="tk-reply-mode-toggle"
                                        onClick={() => setReplyMode('comment')}
                                        title="切换回普通 500 字回复"
                                      >
                                        切换为普通回复
                                      </button>
                                    </div>
                                  ) : (
                                    <div className="tk-reply-hint-bar">
                                      <span className="tk-reply-to-text">回复 <strong>@{replyingTargetAuthor}</strong></span>
                                      <button
                                        type="button"
                                        className="tk-reply-mode-toggle tk-reply-mode-toggle-boost"
                                        onClick={() => setReplyMode('boost')}
                                        title="切换为 16 字快速火箭 Boost 回复"
                                      >
                                        <Rocket size={12} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '3px' }} />
                                        切换为 Boost (≤16字)
                                      </button>
                                    </div>
                                  )}
                                </div>

                                <div className="tk-input el-textarea">
                                  <textarea
                                    className={`el-textarea__inner ${replyMode === 'boost' ? 'is-boost-input' : ''}`}
                                    value={replyMessage}
                                    onChange={(e) => {
                                      const limit = replyMode === 'boost' ? BOOST_LIMIT : COMMENT_LIMIT;
                                      setReplyMessage(e.target.value.slice(0, limit));
                                    }}
                                    onPaste={(e) => handlePasteOnInput(e, setReplyMessage)}
                                    onDrop={(e) => handleDropOnInput(e, setReplyMessage)}
                                    placeholder={
                                      replyMode === 'boost'
                                        ? `🚀 发表 16 字以内的 Boost 快速回复 @${replyingTargetAuthor}...`
                                        : `回复 @${replyingTargetAuthor}...`
                                    }
                                    rows={replyMode === 'boost' ? 2 : 3}
                                    autoFocus
                                  />
                                  <span className="el-input__count">
                                    {replyMessage.length}/{replyMode === 'boost' ? BOOST_LIMIT : COMMENT_LIMIT}
                                  </span>
                                </div>
                                <div className="tk-nested-reply-actions">
                                  <button
                                    type="button"
                                    className="tk-btn-cancel"
                                    onClick={() => {
                                      setReplyingToCommentId(null);
                                      setReplyingTargetAuthor('');
                                      setReplyMessage('');
                                      setReplyMode('comment');
                                    }}
                                  >
                                    取消
                                  </button>
                                  <button
                                    type="button"
                                    className={`tk-send tk-send-small ${replyMode === 'boost' ? 'is-boost-btn' : ''}`}
                                    disabled={replySubmitting || !replyMessage.trim()}
                                    onClick={() => handleReplySubmit(item.id)}
                                  >
                                    {replySubmitting
                                      ? '发送中...'
                                      : replyMode === 'boost'
                                      ? (
                                        <>
                                          <Rocket size={12} style={{ marginRight: '4px' }} />
                                          Boost
                                        </>
                                      )
                                      : '回复'}
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Expandable Replies Accordion */}
                        {replies.length > 0 && (
                          <div className="tk-replies-section">
                            <button
                              type="button"
                              className="tk-replies-toggle-btn"
                              onClick={() => toggleReplies(item.id)}
                            >
                              <span className="tk-toggle-icon">
                                {areRepliesExpanded ? '▴' : '▾'}
                              </span>
                              <span>
                                {areRepliesExpanded
                                  ? `收起 ${replies.length} 条回复`
                                  : `查看 ${replies.length} 条回复`}
                              </span>
                            </button>

                            {areRepliesExpanded && (
                              <div className="tk-replies">
                                {replies.map((reply) => {
                                  const isReplyEditing = editingCommentId === reply.id;
                                  const isReplyManageable = canManage(reply);
                                  const isReplyEdited = isEdited(reply.createdAt, reply.updatedAt);
                                  const isReplyTextExpanded = expandedTexts.has(reply.id);
                                  const isReplyLong = reply.message.length > LONG_TEXT_THRESHOLD;
                                  const isReplyBoost = reply.postType === 'boost';

                                  const replyRxMeta = computeReactionsMeta(reply, account?.id);
                                  const isReplyPopupOpen = activeReactionPopupId === reply.id;

                                  return (
                                    <div className={`tk-comment tk-comment-reply ${isReplyBoost ? 'is-boost-card' : ''}`} key={reply.id} id={`comment-${reply.id}`}>
                                      <div className="tk-avatar tk-avatar-small theme-account-drawer__summary-avatar">
                                        {reply.authorAvatar ? (
                                          <img src={reply.authorAvatar} alt={reply.authorName} loading="lazy" />
                                        ) : reply.authorRole === 'admin' ? (
                                          <img src="/media/shijianus/avatar.jpg" alt={reply.authorName} loading="lazy" />
                                        ) : reply.authorName && reply.authorName !== '访客' ? (
                                          <span className="tk-avatar-initials">{getCommentInitials(reply.authorName)}</span>
                                        ) : (
                                          <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                                            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                                          </svg>
                                        )}
                                      </div>

                                      <div className="tk-main">
                                        <div className="tk-row tk-meta">
                                          <strong className="tk-nick">{reply.authorName}</strong>
                                          <span
                                            className={`tk-badge ${
                                              reply.authorRole === 'admin' ? 'is-admin' : 'is-visitor'
                                            }`}
                                          >
                                            {reply.authorRole === 'admin' ? '博主' : '访客'}
                                          </span>

                                          {/* Country / IP Location badge */}
                                          {renderGeoBadge(reply)}

                                          {isReplyBoost && (
                                            <span className="tk-boost-pill">
                                              <Rocket size={11} className="tk-boost-icon" />
                                              <span>Boost</span>
                                            </span>
                                          )}

                                          <time className="tk-time">{formatCommentTime(reply.createdAt)}</time>
                                          {isReplyEdited && (
                                            <span className="tk-edited-mark">
                                              <span className="tk-edited-bracket">(</span>
                                              <span className="tk-edited-text">已编辑</span>
                                              <span className="tk-edited-bracket">)</span>
                                            </span>
                                          )}
                                        </div>

                                        {isReplyEditing ? (
                                          <div className="tk-inline-edit">
                                            <textarea
                                              className="el-textarea__inner"
                                              value={editingMessage}
                                              onChange={(e) => setEditingMessage(e.target.value.slice(0, COMMENT_LIMIT))}
                                              onPaste={(e) => handlePasteOnInput(e, setEditingMessage)}
                                              onDrop={(e) => handleDropOnInput(e, setEditingMessage)}
                                              rows={2}
                                            />
                                            <div className="tk-inline-edit-actions">
                                              <button
                                                type="button"
                                                className="tk-btn-save"
                                                disabled={savingEdit || !editingMessage.trim()}
                                                onClick={() => handleSaveEdit(reply.id)}
                                              >
                                                {savingEdit ? '保存中...' : '保存'}
                                              </button>
                                              <button
                                                type="button"
                                                className="tk-btn-cancel"
                                                onClick={() => setEditingCommentId(null)}
                                              >
                                                取消
                                              </button>
                                            </div>
                                          </div>
                                        ) : (
                                          <div className={`tk-content ${isReplyBoost ? 'is-boost-text' : ''} ${!isReplyTextExpanded && isReplyLong ? 'is-clamped' : ''}`}>
                                            <div
                                              className="tk-rendered-markdown"
                                              dangerouslySetInnerHTML={{ __html: renderCommentMarkdown(reply.message) }}
                                            />
                                            {isReplyLong && (
                                              <button
                                                type="button"
                                                className="tk-expand-text-btn"
                                                onClick={() => toggleLongText(reply.id)}
                                              >
                                                {isReplyTextExpanded ? '收起' : '...展开全文'}
                                              </button>
                                            )}
                                          </div>
                                        )}

                                        <div className="tk-actions-group">
                                          {/* Nested Reply Reaction Button */}
                                          <div className="tk-reaction-interactive-wrapper">
                                            <button
                                              type="button"
                                              className={`tk-action-btn tk-action-like ${replyRxMeta.userReaction ? 'is-reacted' : ''}`}
                                              onClick={() => handleReactionButtonClick(reply.id, replyRxMeta.userReaction || '👍')}
                                              onMouseDown={() => triggerReactionPressStart(reply.id)}
                                              onMouseUp={triggerReactionPressEnd}
                                              onMouseLeave={triggerReactionPressEnd}
                                              onTouchStart={() => triggerReactionPressStart(reply.id)}
                                              onTouchEnd={triggerReactionPressEnd}
                                              title={
                                                replyRxMeta.totalCount > 0
                                                  ? `互动详情: ${replyRxMeta.entries.map(([e, c]) => `${e} ${c}`).join(' ')}`
                                                  : '点赞 (长按可选择表情)'
                                              }
                                            >
                                              {replyRxMeta.top3.length > 0 ? (
                                                <span className="tk-reaction-display-row">
                                                  <span className="tk-reaction-emojis-top3">
                                                    {replyRxMeta.top3.map((t) => t.emoji).join('')}
                                                  </span>
                                                  <span className="tk-reaction-count-badge">{replyRxMeta.totalCount}</span>
                                                </span>
                                              ) : (
                                                <ThumbsUp size={14} className="tk-action-svg" />
                                              )}
                                            </button>

                                            {isReplyPopupOpen && (
                                              <div className="tk-reaction-bubble-popup">
                                                <div className="tk-reaction-bubble-title">选择表达表情：</div>
                                                <div className="tk-reaction-bubble-list">
                                                  {QUICK_EMOJIS.slice(0, 10).map((em) => (
                                                    <button
                                                      key={em}
                                                      type="button"
                                                      className={`tk-bubble-emoji-btn ${replyRxMeta.userReaction === em ? 'is-current' : ''}`}
                                                      onClick={() => handleLike(reply.id, em)}
                                                    >
                                                      {em}
                                                    </button>
                                                  ))}
                                                </div>
                                              </div>
                                            )}
                                          </div>

                                          <button
                                            type="button"
                                            className="tk-action-btn tk-action-reply"
                                            aria-label={`回复 @${reply.authorName}`}
                                            title={`回复 @${reply.authorName}`}
                                            onClick={() => {
                                              setReplyingToCommentId(item.id);
                                              setReplyingTargetAuthor(reply.authorName);
                                              setReplyMode('comment');
                                              setReplyMessage(`@${reply.authorName} `);
                                            }}
                                          >
                                            <MessageSquare size={14} className="tk-action-svg" />
                                          </button>
                                          <button
                                            type="button"
                                            className="tk-action-btn tk-action-boost"
                                            aria-label="发送 16 字以内的火箭 Boost 快速回复"
                                            title="发送 16 字以内的火箭 Boost 快速回复"
                                            onClick={() => {
                                              setReplyingToCommentId(item.id);
                                              setReplyingTargetAuthor(reply.authorName);
                                              setReplyMode('boost');
                                              setReplyMessage(`@${reply.authorName} `);
                                            }}
                                          >
                                            <Rocket size={14} className="tk-action-svg tk-action-svg-boost" />
                                          </button>
                                          <button
                                            type="button"
                                            className="tk-action-btn tk-action-quote"
                                            aria-label="引用此条内容发表评论"
                                            title="引用此条内容发表评论"
                                            onClick={() => handleQuoteClick(reply)}
                                          >
                                            <Quote size={14} className="tk-action-svg" />
                                          </button>
                                          {isReplyManageable && (
                                            <>
                                              <button
                                                type="button"
                                                className="tk-action-btn tk-action-edit"
                                                aria-label="编辑此条内容"
                                                title="编辑此条内容"
                                                onClick={() => {
                                                  setEditingCommentId(reply.id);
                                                  setEditingMessage(reply.message);
                                                }}
                                              >
                                                <Pencil size={14} className="tk-action-svg" />
                                              </button>
                                              <button
                                                type="button"
                                                className="tk-action-btn tk-action-delete"
                                                aria-label="删除此条内容"
                                                title="删除此条内容"
                                                onClick={() => handleDelete(reply.id)}
                                              >
                                                <Trash2 size={14} className="tk-action-svg" />
                                              </button>
                                            </>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Interactive UI Configuration Modal Dialog for Complex Options (Rendered via Portal strictly centered) */}
      {mounted &&
        activeModal &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            className="tk-tool-modal-overlay"
            onClick={() => setActiveModal(null)}
            role="dialog"
            aria-modal="true"
          >
            <div className="tk-tool-modal" onClick={(e) => e.stopPropagation()}>
              <div className="tk-tool-modal-header">
                <h4 className="tk-tool-modal-title">
                  {activeModal === 'poll' && (
                    <>
                      <Vote size={16} /> 发起互动投票
                    </>
                  )}
                  {activeModal === 'table' && (
                    <>
                      <Table size={16} /> 插入数据表格
                    </>
                  )}
                  {activeModal === 'toc' && (
                    <>
                      <ListOrdered size={16} /> 插入目录导航 (TOC)
                    </>
                  )}
                  {activeModal === 'details' && (
                    <>
                      <ChevronRight size={16} /> 插入折叠隐藏区块
                    </>
                  )}
                  {activeModal === 'spoiler' && (
                    <>
                      <EyeOff size={16} /> 模糊化剧透内容
                    </>
                  )}
                  {activeModal === 'math' && (
                    <>
                      <Sigma size={16} /> 插入 LaTeX 数学公式
                    </>
                  )}
                  {activeModal === 'scroll' && (
                    <>
                      <ScrollText size={16} /> 插入滚动长内容
                    </>
                  )}
                  {activeModal === 'callout' && (
                    <>
                      <Layers size={16} /> 套用包装格式卡片
                    </>
                  )}
                  {activeModal === 'mermaid' && (
                    <>
                      <GitFork size={16} /> 插入 Mermaid 图表
                    </>
                  )}
                  {activeModal === 'chart' && (
                    <>
                      <BarChart3 size={16} /> 插入 Build Chart 数据图表
                    </>
                  )}
                  {activeModal === 'graphviz' && (
                    <>
                      <Share2 size={16} /> 插入 Graphviz 拓扑图
                    </>
                  )}
                  {activeModal === 'datetime' && (
                    <>
                      <Clock size={16} /> 插入日期与时间
                    </>
                  )}
                  {activeModal === 'template' && (
                    <>
                      <LayoutTemplate size={16} /> 插入结构化论述范本
                    </>
                  )}
                  {activeModal === 'footnote' && (
                    <>
                      <Bookmark size={16} /> 新增参考脚注
                    </>
                  )}
                  {activeModal === 'image' && (
                    <>
                      <ImageIcon size={16} /> 插入图片与 Telegram 图床托管
                    </>
                  )}
                </h4>
                <button
                  type="button"
                  className="tk-tool-modal-close"
                  onClick={() => setActiveModal(null)}
                  title="关闭 (Esc)"
                  aria-label="关闭"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="tk-tool-modal-body">
                {/* 1. Poll Form */}
                {activeModal === 'poll' && (
                  <>
                    <div className="tk-modal-rule-banner">
                      <Info size={15} />
                      <div>
                        <div className="tk-modal-rule-title">互动投票机制与发布规则</div>
                        <div className="tk-modal-rule-text">
                          采用标准 <code>[poll type=...]</code> 语法。支持单选或多选机制，发布后系统将渲染交互式投票选项。
                        </div>
                      </div>
                    </div>
                    <div className="tk-modal-field">
                      <label className="tk-modal-label">投票主题 / 问题：</label>
                      <input
                        type="text"
                        className="tk-modal-input"
                        value={modalPollQuestion}
                        onChange={(e) => setModalPollQuestion(e.target.value)}
                        placeholder="输入投票主题，例如：你如何看待这一技术方案？"
                        autoFocus
                      />
                    </div>
                    <div className="tk-modal-field">
                      <label className="tk-modal-label">投票选项：</label>
                      <div className="tk-modal-options-list">
                        {modalPollOptions.map((opt, idx) => (
                          <div key={idx} className="tk-modal-opt-row">
                            <span className="tk-modal-opt-idx">#{idx + 1}</span>
                            <input
                              type="text"
                              className="tk-modal-input"
                              value={opt}
                              onChange={(e) => {
                                const next = [...modalPollOptions];
                                next[idx] = e.target.value;
                                setModalPollOptions(next);
                              }}
                              placeholder={`选项 ${idx + 1}`}
                            />
                            {modalPollOptions.length > 2 && (
                              <button
                                type="button"
                                className="tk-modal-btn-del"
                                onClick={() => {
                                  setModalPollOptions(modalPollOptions.filter((_, i) => i !== idx));
                                }}
                                title="删除此项"
                              >
                                <Trash2 size={13} />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                      {modalPollOptions.length < 6 && (
                        <button
                          type="button"
                          className="tk-modal-btn-add"
                          onClick={() =>
                            setModalPollOptions([...modalPollOptions, `选项 ${modalPollOptions.length + 1}`])
                          }
                        >
                          <Plus size={13} /> 添加选项
                        </button>
                      )}
                    </div>
                    <div className="tk-modal-field">
                      <label className="tk-modal-label">投票机制：</label>
                      <div className="tk-modal-radio-group">
                        <label className="tk-modal-radio">
                          <input
                            type="radio"
                            name="pollType"
                            value="regular"
                            checked={modalPollType === 'regular'}
                            onChange={() => setModalPollType('regular')}
                          />
                          <span>单选投票 (Regular)</span>
                        </label>
                        <label className="tk-modal-radio">
                          <input
                            type="radio"
                            name="pollType"
                            value="multiple"
                            checked={modalPollType === 'multiple'}
                            onChange={() => setModalPollType('multiple')}
                          />
                          <span>多选投票 (Multiple)</span>
                        </label>
                      </div>
                    </div>
                  </>
                )}

                {/* 2. Table Form */}
                {activeModal === 'table' && (
                  <>
                    <div className="tk-modal-rule-banner">
                      <Info size={15} />
                      <div>
                        <div className="tk-modal-rule-title">GFM 管道表格发布规则</div>
                        <div className="tk-modal-rule-text">
                          采用标准 GitHub 表格语法（<code>| 表头 |</code> 与 <code>| --- |</code>）。在下方设定行列数及标题后，系统将自动生成规范网格，插入后可直接在编辑器中修改各单元格数据。
                        </div>
                      </div>
                    </div>
                    <div className="tk-modal-row-grid">
                      <div className="tk-modal-field">
                        <label className="tk-modal-label">数据行数 (Rows)：</label>
                        <input
                          type="number"
                          min={1}
                          max={10}
                          className="tk-modal-input"
                          value={modalTableRows}
                          onChange={(e) => setModalTableRows(Number(e.target.value))}
                        />
                      </div>
                      <div className="tk-modal-field">
                        <label className="tk-modal-label">数据列数 (Cols)：</label>
                        <input
                          type="number"
                          min={1}
                          max={6}
                          className="tk-modal-input"
                          value={modalTableCols}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            setModalTableCols(val);
                            setModalTableHeaders((prev) =>
                              Array.from({ length: val }, (_, i) => prev[i] || `标题 ${i + 1}`)
                            );
                          }}
                        />
                      </div>
                    </div>
                    <div className="tk-modal-field">
                      <label className="tk-modal-label">自定义各列标题：</label>
                      <div className="tk-modal-table-headers-grid">
                        {Array.from({ length: modalTableCols }, (_, i) => (
                          <div key={i} className="tk-modal-header-item">
                            <input
                              type="text"
                              className="tk-modal-input"
                              value={modalTableHeaders[i] || `标题 ${i + 1}`}
                              onChange={(e) => {
                                const next = [...modalTableHeaders];
                                next[i] = e.target.value;
                                setModalTableHeaders(next);
                              }}
                              placeholder={`第 ${i + 1} 列标题`}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="tk-modal-field">
                      <label className="tk-modal-label">生成的表格结构实时预览：</label>
                      <pre className="tk-modal-preview-box">
{`| ${Array.from({ length: modalTableCols }, (_, i) => modalTableHeaders[i] || `标题 ${i + 1}`).join(' | ')} |
| ${Array(modalTableCols).fill('---').join(' | ')} |
${Array.from({ length: modalTableRows }, (_, r) => `| ${Array.from({ length: modalTableCols }, (_, c) => `数据 ${r + 1}-${c + 1}`).join(' | ')} |`).join('\n')}`}
                      </pre>
                    </div>
                  </>
                )}

                {/* 3. TOC Form */}
                {activeModal === 'toc' && (
                  <>
                    <div className="tk-modal-rule-banner">
                      <Info size={15} />
                      <div>
                        <div className="tk-modal-rule-title">目录导航自动提取机制与发布规则</div>
                        <div className="tk-modal-rule-text">
                          采用标准 <code>[TOC]</code> 语法标签。评论系统在渲染时，将自动抓取该条评论正文中的所有 Markdown 标题（<code># 一级</code>、<code>## 二级</code>、<code>### 三级</code>）并构建为具备平滑锚点跳转的树形导航。
                        </div>
                      </div>
                    </div>
                    <div className="tk-modal-field">
                      <label className="tk-modal-label">结构骨架选项：</label>
                      <label className="tk-modal-radio" style={{ marginTop: '4px' }}>
                        <input
                          type="checkbox"
                          checked={modalTocIncludeHeaders}
                          onChange={(e) => setModalTocIncludeHeaders(e.target.checked)}
                        />
                        <span>附带示例小节分段标题（推荐勾选，一键生成规范章节结构）</span>
                      </label>
                    </div>
                    <div className="tk-modal-field">
                      <label className="tk-modal-label">将插入的代码预览：</label>
                      <pre className="tk-modal-preview-box">
{modalTocIncludeHeaders
  ? `[TOC]\n\n### 一、 背景与架构目标\n在此输入第一小节的核心论点...\n\n### 二、 核心技术实现细节\n在此输入第二小节的详细分析...\n\n### 三、 总结建议与展望\n在此输入总结结论...`
  : `[TOC]`}
                      </pre>
                    </div>
                  </>
                )}

                {/* 4. Mermaid Form */}
                {activeModal === 'mermaid' && (
                  <>
                    <div className="tk-modal-rule-banner">
                      <Info size={15} />
                      <div>
                        <div className="tk-modal-rule-title">Mermaid 图表矢量渲染与发布规则</div>
                        <div className="tk-modal-rule-text">
                          使用 <code>```mermaid ... ```</code> 代码块包裹。系统在前端自动将其编译为高质量矢量 SVG 拓扑图。可点击下方按钮切换预设类型并按需修改代码。
                        </div>
                      </div>
                    </div>
                    <div className="tk-modal-field">
                      <label className="tk-modal-label">选择图表类型模版：</label>
                      <div className="tk-modal-type-chips">
                        {(['flowchart', 'sequence', 'gantt', 'class', 'pie', 'state'] as const).map((t) => (
                          <button
                            key={t}
                            type="button"
                            className={`tk-modal-chip-btn ${modalMermaidType === t ? 'is-active' : ''}`}
                            onClick={() => openMermaidModal(t)}
                          >
                            {t === 'flowchart' && '流程图 (Flowchart)'}
                            {t === 'sequence' && '时序图 (Sequence)'}
                            {t === 'gantt' && '甘特图 (Gantt)'}
                            {t === 'class' && '类图 (Class)'}
                            {t === 'pie' && '饼图 (Pie)'}
                            {t === 'state' && '状态图 (State)'}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="tk-modal-field">
                      <label className="tk-modal-label">图表代码编辑 (可直接调整节点与文字)：</label>
                      <textarea
                        className="tk-modal-textarea"
                        rows={7}
                        value={modalMermaidCode}
                        onChange={(e) => setModalMermaidCode(e.target.value)}
                        placeholder="输入符合 Mermaid 语法的图表代码..."
                        style={{ fontFamily: 'monospace', fontSize: '12px' }}
                      />
                    </div>
                  </>
                )}

                {/* 5. Build Chart Form */}
                {activeModal === 'chart' && (
                  <>
                    <div className="tk-modal-rule-banner">
                      <Info size={15} />
                      <div>
                        <div className="tk-modal-rule-title">Build Chart 数据图表发布规则</div>
                        <div className="tk-modal-rule-text">
                          使用 <code>```chart ... ```</code> 代码块包裹标准 JSON 配置。支持 <code>bar</code>（柱状图）、<code>line</code>（折线图）与 <code>pie</code>（饼图）。
                        </div>
                      </div>
                    </div>
                    <div className="tk-modal-field">
                      <label className="tk-modal-label">图表样式预设：</label>
                      <div className="tk-modal-type-chips">
                        {(['bar', 'line', 'pie'] as const).map((ct) => (
                          <button
                            key={ct}
                            type="button"
                            className={`tk-modal-chip-btn ${modalChartType === ct ? 'is-active' : ''}`}
                            onClick={() => openChartModal(ct)}
                          >
                            {ct === 'bar' && '柱状图 (Bar)'}
                            {ct === 'line' && '折线图 (Line)'}
                            {ct === 'pie' && '饼图 (Pie)'}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="tk-modal-field">
                      <label className="tk-modal-label">JSON 图表配置：</label>
                      <textarea
                        className="tk-modal-textarea"
                        rows={7}
                        value={modalChartCode}
                        onChange={(e) => setModalChartCode(e.target.value)}
                        placeholder="输入标准 JSON 图表数据..."
                        style={{ fontFamily: 'monospace', fontSize: '12px' }}
                      />
                    </div>
                  </>
                )}

                {/* 6. Graphviz Form */}
                {activeModal === 'graphviz' && (
                  <>
                    <div className="tk-modal-rule-banner">
                      <Info size={15} />
                      <div>
                        <div className="tk-modal-rule-title">Graphviz 拓扑图发布规则</div>
                        <div className="tk-modal-rule-text">
                          采用 <code>```graphviz ... ```</code> 代码块，基于 DOT 描述语言。适合展示微服务架构关系、调用链路与状态转移。
                        </div>
                      </div>
                    </div>
                    <div className="tk-modal-field">
                      <label className="tk-modal-label">拓扑图类别：</label>
                      <div className="tk-modal-type-chips">
                        <button
                          type="button"
                          className={`tk-modal-chip-btn ${modalGraphvizType === 'digraph' ? 'is-active' : ''}`}
                          onClick={() => openGraphvizModal('digraph')}
                        >
                          有向图 (Digraph - 带箭头)
                        </button>
                        <button
                          type="button"
                          className={`tk-modal-chip-btn ${modalGraphvizType === 'graph' ? 'is-active' : ''}`}
                          onClick={() => openGraphvizModal('graph')}
                        >
                          无向图 (Graph - 关联群)
                        </button>
                      </div>
                    </div>
                    <div className="tk-modal-field">
                      <label className="tk-modal-label">DOT 语法代码：</label>
                      <textarea
                        className="tk-modal-textarea"
                        rows={6}
                        value={modalGraphvizCode}
                        onChange={(e) => setModalGraphvizCode(e.target.value)}
                        placeholder="输入 DOT 拓扑语法代码..."
                        style={{ fontFamily: 'monospace', fontSize: '12px' }}
                      />
                    </div>
                  </>
                )}

                {/* 7. Details Form */}
                {activeModal === 'details' && (
                  <>
                    <div className="tk-modal-rule-banner">
                      <Info size={15} />
                      <div>
                        <div className="tk-modal-rule-title">折叠隐藏区块发布规则</div>
                        <div className="tk-modal-rule-text">
                          采用原生 HTML5 <code>&lt;details&gt;</code> 与 <code>&lt;summary&gt;</code> 标签。用于收拢大段报错日志、长排查步骤或补充资料，保持评论流清爽。
                        </div>
                      </div>
                    </div>
                    <div className="tk-modal-field">
                      <label className="tk-modal-label">折叠摘要 (标题)：</label>
                      <input
                        type="text"
                        className="tk-modal-input"
                        value={modalDetailsSummary}
                        onChange={(e) => setModalDetailsSummary(e.target.value)}
                        placeholder="例如：点击展开详细报错日志 / 排查细节"
                        autoFocus
                      />
                    </div>
                    <div className="tk-modal-field">
                      <label className="tk-modal-label">折叠展开内容：</label>
                      <textarea
                        className="tk-modal-textarea"
                        rows={5}
                        value={modalDetailsContent}
                        onChange={(e) => setModalDetailsContent(e.target.value)}
                        placeholder="在此处输入默认被隐藏的详细文本、数据或排查日志..."
                      />
                    </div>
                  </>
                )}

                {/* 8. Spoiler Form */}
                {activeModal === 'spoiler' && (
                  <>
                    <div className="tk-modal-rule-banner">
                      <Info size={15} />
                      <div>
                        <div className="tk-modal-rule-title">模糊化剧透发布规则</div>
                        <div className="tk-modal-rule-text">
                          采用 <code>[spoiler]内容[/spoiler]</code> 语法。内容在评论区中默认以高斯模糊显示，读者将光标悬停在其上方即可清晰查看，避免非预期剧透。
                        </div>
                      </div>
                    </div>
                    <div className="tk-modal-field">
                      <label className="tk-modal-label">剧透打码文本：</label>
                      <textarea
                        className="tk-modal-textarea"
                        rows={3}
                        value={modalSpoilerText}
                        onChange={(e) => setModalSpoilerText(e.target.value)}
                        placeholder="输入需要打码模糊的内容，鼠标悬浮时才会清晰可见..."
                        autoFocus
                      />
                    </div>
                  </>
                )}

                {/* 9. Math Form */}
                {activeModal === 'math' && (
                  <>
                    <div className="tk-modal-rule-banner">
                      <Info size={15} />
                      <div>
                        <div className="tk-modal-rule-title">LaTeX 数学公式发布规则</div>
                        <div className="tk-modal-rule-text">
                          采用 KaTeX 标准 <code>$$ 公式 $$</code> 块级语法。系统在前端自动渲染为高品质数学公式，支持微积分、分式、矩阵与求和等学术符号。
                        </div>
                      </div>
                    </div>
                    <div className="tk-modal-field">
                      <label className="tk-modal-label">LaTeX 数学表达式：</label>
                      <textarea
                        className="tk-modal-textarea"
                        rows={3}
                        value={modalMathFormula}
                        onChange={(e) => setModalMathFormula(e.target.value)}
                        placeholder="例如：\int_{0}^{\infty} e^{-x^2} dx = \frac{\sqrt{\pi}}{2}"
                        autoFocus
                      />
                    </div>
                    <div className="tk-modal-field">
                      <label className="tk-modal-label">快捷常用模板：</label>
                      <div className="tk-modal-quick-math">
                        <button type="button" onClick={() => setModalMathFormula('\\frac{a}{b}')}>分式 a/b</button>
                        <button type="button" onClick={() => setModalMathFormula('\\sqrt{x}')}>平方根 √x</button>
                        <button type="button" onClick={() => setModalMathFormula('\\sum_{i=1}^{n} x_i')}>求和 ∑</button>
                        <button type="button" onClick={() => setModalMathFormula('\\int_{a}^{b} f(x)dx')}>定积分 ∫</button>
                        <button type="button" onClick={() => setModalMathFormula('\\lim_{x \\to \\infty} f(x)')}>极限 lim</button>
                        <button type="button" onClick={() => setModalMathFormula('\\begin{matrix} a & b \\\\ c & d \\end{matrix}')}>矩阵</button>
                      </div>
                    </div>
                  </>
                )}

                {/* 10. Scroll Form */}
                {activeModal === 'scroll' && (
                  <>
                    <div className="tk-modal-rule-banner">
                      <Info size={15} />
                      <div>
                        <div className="tk-modal-rule-title">滚动容器发布规则</div>
                        <div className="tk-modal-rule-text">
                          采用定高与内置滚动条（<code>overflow-y: auto</code>）限制超长文本的高度，防止几十行代码或日志拉长整个评论流。
                        </div>
                      </div>
                    </div>
                    <div className="tk-modal-field">
                      <label className="tk-modal-label">最大容器高度 (像素)：</label>
                      <input
                        type="number"
                        min={80}
                        max={600}
                        step={20}
                        className="tk-modal-input"
                        value={modalScrollHeight}
                        onChange={(e) => setModalScrollHeight(Number(e.target.value))}
                      />
                    </div>
                    <div className="tk-modal-field">
                      <label className="tk-modal-label">长文本 / 日志内容：</label>
                      <textarea
                        className="tk-modal-textarea"
                        rows={5}
                        value={modalScrollContent}
                        onChange={(e) => setModalScrollContent(e.target.value)}
                        placeholder="输入将在定高容器中带滚动条展示的超长文本..."
                        autoFocus
                      />
                    </div>
                  </>
                )}

                {/* 11. Datetime Form */}
                {activeModal === 'datetime' && (
                  <>
                    <div className="tk-modal-rule-banner">
                      <Info size={15} />
                      <div>
                        <div className="tk-modal-rule-title">日期时间标记发布规则</div>
                        <div className="tk-modal-rule-text">
                          采用 <code>[date=YYYY-MM-DD HH:mm:ss]</code> 标签。用于在评论中标注关键排期、问题出现时间或更新节点，系统将自动高亮显示。
                        </div>
                      </div>
                    </div>
                    <div className="tk-modal-field">
                      <label className="tk-modal-label">快捷时间选择：</label>
                      <div className="tk-modal-type-chips">
                        <button
                          type="button"
                          className="tk-modal-chip-btn"
                          onClick={() => {
                            const now = new Date();
                            const pad = (n: number) => String(n).padStart(2, '0');
                            setModalDatetimeCustom(`${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`);
                          }}
                        >
                          当前完整时间 (精确到秒)
                        </button>
                        <button
                          type="button"
                          className="tk-modal-chip-btn"
                          onClick={() => {
                            const now = new Date();
                            const pad = (n: number) => String(n).padStart(2, '0');
                            setModalDatetimeCustom(`${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`);
                          }}
                        >
                          当前日期 (YYYY-MM-DD)
                        </button>
                      </div>
                    </div>
                    <div className="tk-modal-field">
                      <label className="tk-modal-label">时间值内容：</label>
                      <input
                        type="text"
                        className="tk-modal-input"
                        value={modalDatetimeCustom}
                        onChange={(e) => setModalDatetimeCustom(e.target.value)}
                        placeholder="例如：2026-09-05 12:00:00"
                        autoFocus
                      />
                    </div>
                  </>
                )}

                {/* 12. Template Form */}
                {activeModal === 'template' && (
                  <>
                    <div className="tk-modal-rule-banner">
                      <Info size={15} />
                      <div>
                        <div className="tk-modal-rule-title">结构化论述范本发布规则</div>
                        <div className="tk-modal-rule-text">
                          严谨的结构化评论能极大提高交流质量。选择适合当前话题的结构框架，一键插入并填入您的分析见解。
                        </div>
                      </div>
                    </div>
                    <div className="tk-modal-field">
                      <label className="tk-modal-label">选择范本场景：</label>
                      <div className="tk-modal-type-chips">
                        <button
                          type="button"
                          className={`tk-modal-chip-btn ${modalTemplateType === 'tech' ? 'is-active' : ''}`}
                          onClick={() => setModalTemplateType('tech')}
                        >
                          💡 深度技术研讨 (观点/分析/建议)
                        </button>
                        <button
                          type="button"
                          className={`tk-modal-chip-btn ${modalTemplateType === 'bug' ? 'is-active' : ''}`}
                          onClick={() => setModalTemplateType('bug')}
                        >
                          ⚠️ 异常/缺陷排查 (现象/环境/日志)
                        </button>
                        <button
                          type="button"
                          className={`tk-modal-chip-btn ${modalTemplateType === 'opinion' ? 'is-active' : ''}`}
                          onClick={() => setModalTemplateType('opinion')}
                        >
                          🤝 观点探讨交流 (认同/视角/请教)
                        </button>
                      </div>
                    </div>
                    <div className="tk-modal-field">
                      <label className="tk-modal-label">范本结构骨架预览：</label>
                      <pre className="tk-modal-preview-box">
{modalTemplateType === 'tech' && `### 💡 核心观点与设计方案\n在此简要概括您的核心技术方案或核心论点...\n\n### 🔍 依据与量化分析\n1. 优势分析：分析性能提升或体验改善。\n2. 潜在风险：应对边界异常或高并发。\n\n### 🎯 改进与落地建议\n- [ ] 建议步骤一：...\n- [ ] 建议步骤二：...`}
{modalTemplateType === 'bug' && `### ⚠️ 异常现象描述\n在此详细描述出现的非预期现象或错误提示...\n\n### 🖥️ 运行环境与复现步骤\n- 环境信息：操作系统 / 浏览器版本\n- 复现步骤：...\n\n### 🪵 报错日志与初步排查\n\`\`\`bash\n在此粘贴报错堆栈\n\`\`\`\n\n### 💡 期望的正确行为\n说明理论上的正确效果。`}
{modalTemplateType === 'opinion' && `### 🤝 认同之处\n非常赞同博文中关于这一视角的论述...\n\n### 🤔 补充视角与延伸思考\n从另一个角度来看，或许可以补充考虑以下几点：\n1. ...\n\n### 💬 交流请教\n对于...细节，博主是否有进一步经验分享？`}
                      </pre>
                    </div>
                  </>
                )}

                {/* 13. Footnote Form */}
                {activeModal === 'footnote' && (
                  <>
                    <div className="tk-modal-rule-banner">
                      <Info size={15} />
                      <div>
                        <div className="tk-modal-rule-title">参考脚注联动发布规则</div>
                        <div className="tk-modal-rule-text">
                          采用 Markdown 标准脚注语法。将在正文光标位置插入引用标记 <code>[^标号]</code>，并在评论文末自动生成对应该标号的 <code>[^标号]: 详细注释内容</code>。
                        </div>
                      </div>
                    </div>
                    <div className="tk-modal-field">
                      <label className="tk-modal-label">脚注标识 (标号)：</label>
                      <input
                        type="text"
                        className="tk-modal-input"
                        value={modalFootnoteId}
                        onChange={(e) => setModalFootnoteId(e.target.value)}
                        placeholder="例如：1 或 ref"
                        autoFocus
                      />
                    </div>
                    <div className="tk-modal-field">
                      <label className="tk-modal-label">脚注详细注释与出处内容：</label>
                      <textarea
                        className="tk-modal-textarea"
                        rows={3}
                        value={modalFootnoteContent}
                        onChange={(e) => setModalFootnoteContent(e.target.value)}
                        placeholder="输入该脚注引用的文献出处、文档链接或补充说明..."
                      />
                    </div>
                  </>
                )}

                {/* 14. Callout Form */}
                {activeModal === 'callout' && (
                  <>
                    <div className="tk-modal-rule-banner">
                      <Info size={15} />
                      <div>
                        <div className="tk-modal-rule-title">高光包装卡片发布规则</div>
                        <div className="tk-modal-rule-text">
                          采用 <code>::: note/tip/warning/danger 标题</code> 语法。评论区将渲染为带有对应语义主题色、左侧重点边框和图标的高光提示卡片。
                        </div>
                      </div>
                    </div>
                    <div className="tk-modal-field">
                      <label className="tk-modal-label">包装卡片风格：</label>
                      <div className="tk-modal-radio-group">
                        {(['note', 'tip', 'warning', 'danger'] as const).map((type) => (
                          <label key={type} className="tk-modal-radio">
                            <input
                              type="radio"
                              name="calloutType"
                              value={type}
                              checked={modalCalloutType === type}
                              onChange={() => setModalCalloutType(type)}
                            />
                            <span style={{ textTransform: 'capitalize' }}>{type}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                    <div className="tk-modal-field">
                      <label className="tk-modal-label">卡片标题：</label>
                      <input
                        type="text"
                        className="tk-modal-input"
                        value={modalCalloutTitle}
                        onChange={(e) => setModalCalloutTitle(e.target.value)}
                        placeholder="输入卡片高光标题..."
                      />
                    </div>
                    <div className="tk-modal-field">
                      <label className="tk-modal-label">卡片主体内容：</label>
                      <textarea
                        className="tk-modal-textarea"
                        rows={3}
                        value={modalCalloutContent}
                        onChange={(e) => setModalCalloutContent(e.target.value)}
                        placeholder="输入卡片主体说明内容..."
                        autoFocus
                      />
                    </div>
                  </>
                )}

                {/* 15. Image Upload & Host Form */}
                {activeModal === 'image' && (
                  <>
                    <div className="tk-modal-rule-banner">
                      <ImageIcon size={15} />
                      <div>
                        <div className="tk-modal-rule-title">官方 Telegram 图床托管与图片插入规则</div>
                        <div className="tk-modal-rule-text">
                          上传的文件将自动转存至官方 Telegram 永久图床 (<code>img.epocanvas.com</code>)，支持最大 10MB 的主流图片格式。在评论输入框中支持直接使用键盘 <code>Ctrl+V</code> / <code>Cmd+V</code> 快速粘贴截图，或直接拖拽图片入框。
                        </div>
                      </div>
                    </div>

                    {/* Tab switch */}
                    <div className="tk-modal-tabs-bar">
                      <button
                        type="button"
                        className={`tk-modal-tab-btn ${modalImageTab === 'upload' ? 'is-active' : ''}`}
                        onClick={() => setModalImageTab('upload')}
                      >
                        <Upload size={14} /> 本地上传
                      </button>
                      <button
                        type="button"
                        className={`tk-modal-tab-btn ${modalImageTab === 'guide' ? 'is-active' : ''}`}
                        onClick={() => setModalImageTab('guide')}
                      >
                        <FileText size={14} /> 📋 粘贴与拖拽指南
                      </button>
                      <button
                        type="button"
                        className={`tk-modal-tab-btn ${modalImageTab === 'url' ? 'is-active' : ''}`}
                        onClick={() => setModalImageTab('url')}
                      >
                        <Link size={14} /> 🔗 外部图片链接
                      </button>
                    </div>

                    {/* Hidden file input */}
                    <input
                      type="file"
                      ref={fileInputRef}
                      accept="image/png,image/jpeg,image/gif,image/webp,image/svg+xml,image/avif"
                      style={{ display: 'none' }}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleImageFileSelect(file);
                        e.target.value = '';
                      }}
                    />

                    {modalImageTab === 'upload' && (
                      <div className="tk-image-upload-tab-pane">
                        {modalImageUrl ? (
                          <div className="tk-uploaded-preview-card">
                            <div className="tk-uploaded-preview-img-wrap">
                              <img src={modalImageUrl} alt="上传预览" className="tk-uploaded-preview-img" />
                            </div>
                            <div className="tk-uploaded-preview-info">
                              <div className="tk-uploaded-status-badge">
                                <CheckCircle2 size={13} />
                                <span>已成功转存至 Telegram CDN</span>
                              </div>
                              <div className="tk-uploaded-url-text" title={modalImageUrl}>
                                {modalImageUrl}
                              </div>
                              <div className="tk-uploaded-actions">
                                <button
                                  type="button"
                                  className="tk-uploaded-reselect-btn"
                                  onClick={() => fileInputRef.current?.click()}
                                >
                                  重新选择
                                </button>
                                <button
                                  type="button"
                                  className="tk-uploaded-remove-btn"
                                  onClick={() => {
                                    setModalImageUrl('');
                                    setModalImageAlt('');
                                  }}
                                >
                                  清除
                                </button>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div
                            className={`tk-image-dropzone ${isUploadingImage ? 'is-uploading' : ''}`}
                            onClick={() => !isUploadingImage && fileInputRef.current?.click()}
                            onDragOver={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                            }}
                            onDrop={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              const file = e.dataTransfer.files?.[0];
                              if (file) handleImageFileSelect(file);
                            }}
                          >
                            {isUploadingImage ? (
                              <div className="tk-dropzone-loading">
                                <div className="tk-dropzone-spinner" />
                                <p className="tk-dropzone-loading-title">正在持久化至 Telegram 图床通道...</p>
                                <p className="tk-dropzone-loading-desc">传输并解析中，请稍候</p>
                              </div>
                            ) : (
                              <div className="tk-dropzone-content">
                                <div className="tk-dropzone-icon-wrap">
                                  <Upload size={24} className="tk-dropzone-icon" />
                                </div>
                                <p className="tk-dropzone-primary-text">
                                  <strong>点击选择图片</strong> 或将图片拖放至此处
                                </p>
                                <p className="tk-dropzone-hint-text">
                                  支持 JPG, PNG, GIF, WebP, SVG, AVIF (单个文件最高 10MB)
                                </p>
                              </div>
                            )}
                          </div>
                        )}

                        {uploadError && (
                          <div className="tk-upload-error-alert">
                            <AlertCircle size={14} />
                            <span>{uploadError}</span>
                          </div>
                        )}

                        <div className="tk-modal-field" style={{ marginTop: '14px' }}>
                          <label className="tk-modal-label">图片说明 / Alt (选填)：</label>
                          <input
                            type="text"
                            className="tk-modal-input"
                            value={modalImageAlt}
                            onChange={(e) => setModalImageAlt(e.target.value)}
                            placeholder="例如: 界面排查截图、架构拓扑流程"
                          />
                        </div>
                      </div>
                    )}

                    {modalImageTab === 'guide' && (
                      <div className="tk-image-guide-tab-pane">
                        <div className="tk-guide-grid">
                          <div className="tk-guide-card">
                            <div className="tk-guide-card-head">
                              <span className="tk-guide-step-badge">方法 1</span>
                              <strong className="tk-guide-card-title">剪贴板直接粘贴 (快捷方便)</strong>
                            </div>
                            <p className="tk-guide-card-desc">
                              使用截图工具 (如 Windows <code>Win + Shift + S</code> 或 Mac <code>Cmd + Shift + 4</code>) 截图后，在评论区任意输入框内直接按 <code>Ctrl + V</code> (Mac 为 <code>Cmd + V</code>)。
                            </p>
                            <div className="tk-guide-keyboard-row">
                              <kbd className="tk-guide-kbd">Ctrl</kbd> + <kbd className="tk-guide-kbd">V</kbd>
                              <span className="tk-guide-kbd-arrow">➜</span>
                              <span className="tk-guide-kbd-result">自动上传并就地插入 Markdown 链接</span>
                            </div>
                          </div>

                          <div className="tk-guide-card">
                            <div className="tk-guide-card-head">
                              <span className="tk-guide-step-badge">方法 2</span>
                              <strong className="tk-guide-card-title">直接拖拽入框 (直观高效)</strong>
                            </div>
                            <p className="tk-guide-card-desc">
                              从您的文件管理器、桌面或浏览器其他标签页，直接将图片文件拖放至下方评论输入区域，系统将自动识别并上传至 Telegram。
                            </p>
                          </div>

                          <div className="tk-guide-card">
                            <div className="tk-guide-card-head">
                              <span className="tk-guide-step-badge">方法 3</span>
                              <strong className="tk-guide-card-title">标准 Markdown 语法插入</strong>
                            </div>
                            <p className="tk-guide-card-desc">
                              如果您已有外部 CDN 或图片直链，可随时书写标准格式：
                            </p>
                            <pre className="tk-guide-code"><code>![图片说明](https://...)</code></pre>
                          </div>
                        </div>
                      </div>
                    )}

                    {modalImageTab === 'url' && (
                      <div className="tk-image-url-tab-pane">
                        <div className="tk-modal-field">
                          <label className="tk-modal-label">图片直链 URL (必须为有效链接)：</label>
                          <input
                            type="url"
                            className="tk-modal-input"
                            value={modalImageUrl}
                            onChange={(e) => setModalImageUrl(e.target.value)}
                            placeholder="https://img.epocanvas.com/file/... 或 https://..."
                            autoFocus
                          />
                        </div>
                        <div className="tk-modal-field">
                          <label className="tk-modal-label">图片说明 / Alt (选填)：</label>
                          <input
                            type="text"
                            className="tk-modal-input"
                            value={modalImageAlt}
                            onChange={(e) => setModalImageAlt(e.target.value)}
                            placeholder="输入简要图片描述..."
                          />
                        </div>
                        {modalImageUrl && (
                          <div className="tk-url-preview-box">
                            <span className="tk-url-preview-label">外部预览：</span>
                            <img
                              src={modalImageUrl}
                              alt={modalImageAlt || '预览'}
                              className="tk-url-preview-img"
                              onError={(e) => {
                                (e.target as HTMLElement).style.display = 'none';
                              }}
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>

              <div className="tk-tool-modal-footer">
                <button
                  type="button"
                  className="tk-modal-btn tk-modal-btn-cancel"
                  onClick={() => setActiveModal(null)}
                >
                  取消
                </button>
                <button
                  type="button"
                  className="tk-modal-btn tk-modal-btn-confirm"
                  onClick={handleConfirmModal}
                >
                  确认插入
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
