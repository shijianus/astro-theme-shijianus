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
  Mail,
  Copy,
  Check,
  Crown,
  Globe,
  AtSign,
  Shield,
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
import {
  computeUserLevel,
  getAuthorGroups,
  type UserLevelInfo,
} from '../../lib/user-level';
import { renderCommentMarkdown } from '../../lib/comment-markdown';
import type { LocaleVariant } from '../../lib/user-persona.ts';
import { getCommentTranslations } from '../../lib/comments-i18n.ts';
import { readStoredLocaleVariant, normaliseLocaleVariant } from '../../lib/client-locale';

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

function formatCommentTime(value: string, locale: LocaleVariant = 'zh-CN') {
  if (!value) return '';
  try {
    const d = new Date(value);
    const now = Date.now();
    const diff = (now - d.getTime()) / 1000;
    if (diff < 60) {
      if (locale === 'en') return 'just now';
      if (locale === 'fr') return "à l'instant";
      if (locale === 'es') return 'ahora mismo';
      if (locale === 'de') return 'gerade eben';
      if (locale === 'zh-Hant') return '剛剛';
      return '刚刚';
    }
    if (diff < 3600) {
      const m = Math.floor(diff / 60);
      if (locale === 'en') return `${m} ${m === 1 ? 'min' : 'mins'} ago`;
      if (locale === 'fr') return `il y a ${m} min`;
      if (locale === 'es') return `hace ${m} min`;
      if (locale === 'de') return `vor ${m} Min.`;
      if (locale === 'zh-Hant') return `${m} 分鐘前`;
      return `${m} 分钟前`;
    }
    if (diff < 86400) {
      const h = Math.floor(diff / 3600);
      if (locale === 'en') return `${h} ${h === 1 ? 'hour' : 'hours'} ago`;
      if (locale === 'fr') return `il y a ${h} h`;
      if (locale === 'es') return `hace ${h} h`;
      if (locale === 'de') return `vor ${h} Std.`;
      if (locale === 'zh-Hant') return `${h} 小時前`;
      return `${h} 小时前`;
    }
    if (diff < 86400 * 30) {
      const days = Math.floor(diff / 86400);
      if (locale === 'en') return `${days} ${days === 1 ? 'day' : 'days'} ago`;
      if (locale === 'fr') return `il y a ${days} j`;
      if (locale === 'es') return `hace ${days} días`;
      if (locale === 'de') return `vor ${days} Tagen`;
      if (locale === 'zh-Hant') return `${days} 天前`;
      return `${days} 天前`;
    }
    return d.toLocaleDateString(locale === 'zh-Hant' ? 'zh-TW' : locale, {
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
  // Locale state
  const [currentLocale, setCurrentLocale] = useState<LocaleVariant>(() => typeof window !== 'undefined' ? readStoredLocaleVariant() : 'zh-CN');

  useEffect(() => {
    const stored = readStoredLocaleVariant();
    if (stored && stored !== 'zh-CN') {
      setCurrentLocale(stored);
    }
    const handleLocaleChange = (e: Event) => {
      const custom = e as CustomEvent<LocaleVariant | { variant?: LocaleVariant }>;
      const next = typeof custom.detail === 'string' ? custom.detail : custom.detail?.variant;
      if (next) {
        setCurrentLocale(normaliseLocaleVariant(next));
      }
    };
    window.addEventListener('shijianus:localechange', handleLocaleChange);
    return () => window.removeEventListener('shijianus:localechange', handleLocaleChange);
  }, []);

  const tC = getCommentTranslations(currentLocale);

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

  // User Profile Popover state (click or hover on author avatar)
  const [profilePopover, setProfilePopover] = useState<{
    isOpen: boolean;
    author: {
      name: string;
      avatar?: string;
      role: 'admin' | 'reader' | 'visitor';
      email?: string;
      website?: string;
      bio?: string;
      isWebmaster: boolean;
      levelInfo: UserLevelInfo;
      groups: string[];
      ipCountryFlag?: string | null;
      ipCountryName?: string | null;
      ipLocation?: string | null;
    } | null;
    anchorRect: { top: number; left: number; width: number; height: number } | null;
    isPinned: boolean;
  }>({
    isOpen: false,
    author: null,
    anchorRect: null,
    isPinned: false,
  });
  const [copiedEmail, setCopiedEmail] = useState(false);
  const hoverCloseTimerRef = useRef<any>(null);

  const openAuthorProfile = (
    comment: BlogComment,
    event: React.MouseEvent<HTMLElement>,
    isPinned: boolean
  ) => {
    if (hoverCloseTimerRef.current) {
      clearTimeout(hoverCloseTimerRef.current);
      hoverCloseTimerRef.current = null;
    }
    const target = event.currentTarget;
    const rect = target.getBoundingClientRect();
    const isWebmaster =
      comment.authorRole === 'admin' ||
      (comment as any).isWebmaster === true ||
      comment.authorEmail?.toLowerCase() === 'admin@epomail.bond';

    const isCurrentAccount = account && (
      account.id === comment.authorId ||
      account.name === comment.authorName ||
      account.email === comment.authorEmail
    );

    const stats = {
      hasAccount: Boolean(comment.authorEmail || comment.authorRole !== 'visitor'),
      hasReadAny: true,
      readingMinutes: isWebmaster ? 9999 : isCurrentAccount ? 120 : (comment.authorRole === 'reader' ? 45 : 5),
      commentCount: isWebmaster ? 999 : (comment.authorRole === 'reader' ? 12 : 1),
      reactionsReceived: isWebmaster ? 999 : (comment.likesCount || 0),
      activeDays: isWebmaster ? 400 : (comment.authorRole === 'reader' ? 15 : 1),
      activeDates: [],
      firstSeenAt: comment.createdAt,
      isWebmaster,
    };

    const levelInfo = computeUserLevel(stats, comment.authorRole, comment.authorEmail);
    const groups = getAuthorGroups({
      role: comment.authorRole,
      isWebmaster,
      email: comment.authorEmail,
      groups: (comment as any).groups,
    });

    setProfilePopover({
      isOpen: true,
      author: {
        name: comment.authorName,
        avatar: comment.authorAvatar || (isWebmaster ? '/media/shijianus/avatar.jpg' : undefined),
        role: comment.authorRole,
        email: comment.authorEmail,
        website: comment.authorWebsite,
        bio: (comment as any).authorBio || (isWebmaster ? 'EpoCanvas 站长 · 博客创作者与架构设计者' : comment.authorEmail?.endsWith('@epomail.bond') ? 'Epomail 认证读者' : undefined),
        isWebmaster,
        levelInfo,
        groups,
        ipCountryFlag: comment.ipCountryFlag,
        ipCountryName: comment.ipCountryName,
        ipLocation: comment.ipLocation,
      },
      anchorRect: {
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
      },
      isPinned,
    });
  };

  const handleAvatarMouseEnter = (comment: BlogComment, e: React.MouseEvent<HTMLElement>) => {
    if (!profilePopover.isPinned) {
      openAuthorProfile(comment, e, false);
    }
  };

  const handleAvatarMouseLeave = () => {
    if (!profilePopover.isPinned) {
      hoverCloseTimerRef.current = setTimeout(() => {
        setProfilePopover((prev) => ({ ...prev, isOpen: false }));
      }, 350);
    }
  };

  const handleAvatarClick = (comment: BlogComment, e: React.MouseEvent<HTMLElement>) => {
    e.stopPropagation();
    openAuthorProfile(comment, e, true);
  };

  const handleQuickMentionAuthor = (authorName: string) => {
    const mentionText = `@${authorName} `;
    setMainMessage((prev) => (prev.includes(mentionText) ? prev : `${mentionText}${prev}`));
    setMainInputFocused(true);
    setProfilePopover({ isOpen: false, author: null, anchorRect: null, isPinned: false });
    setTimeout(() => {
      const textarea = document.querySelector('#post-comment textarea') as HTMLTextAreaElement | null;
      if (textarea) {
        textarea.focus();
        textarea.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 50);
  };

  const handleCopyEmail = (email: string) => {
    const markCopied = () => {
      setCopiedEmail(true);
      setTimeout(() => setCopiedEmail(false), 2000);
    };

    if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(email)
        .then(markCopied)
        .catch(() => {
          try {
            const temp = document.createElement('textarea');
            temp.value = email;
            document.body.appendChild(temp);
            temp.select();
            document.execCommand('copy');
            document.body.removeChild(temp);
            markCopied();
          } catch {}
        });
    } else {
      try {
        const temp = document.createElement('textarea');
        temp.value = email;
        document.body.appendChild(temp);
        temp.select();
        document.execCommand('copy');
        document.body.removeChild(temp);
        markCopied();
      } catch {}
    }
  };

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && !target.closest('.author-profile-popover') && !target.closest('.tk-avatar')) {
        setProfilePopover((prev) => ({ ...prev, isOpen: false, isPinned: false }));
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setProfilePopover((prev) => ({ ...prev, isOpen: false, isPinned: false }));
      }
    };
    window.addEventListener('click', handleOutsideClick);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('click', handleOutsideClick);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

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

  // Unified geo badge renderer supporting graphic flag image + i18n name + admin privileged IP display
  const renderGeoBadge = (item: BlogComment) => {
    const isCurrentAdmin = account?.role === 'admin' || Boolean(item.ip);
    const canShowToVisitor = item.showLocation !== false && Boolean(item.ipCountryFlag || item.ipCountry || item.ipLocation);

    if (!canShowToVisitor && !isCurrentAdmin) return null;
    if (!item.ipCountry && !item.ipCountryFlag && !item.ipLocation) return null;

    const geo = resolveGeoInfo(item.ipCountry || item.ipLocation || item.ipCountryName || 'GLOBAL', currentLocale);
    const flag = geo.flag || item.ipCountryFlag || '🌐';
    const rawName = item.ipLocation || geo.name || item.ipCountryName || '全球';

    // Strip any leading flag emojis or duplicate country codes and strictly ensure Taiwan/HK/Macau have no "中国" prefix
    let cleanName = (geo && geo.code !== 'GLOBAL' && geo.name) ? geo.name : rawName
      .replace(/[\uD83C][\uDDE6-\uDDFF][\uD83C][\uDDE6-\uDDFF]/g, '')
      .replace(/^[\uD83C-\uDBFF\uDC00-\uDFFF\s]+/, '')
      .replace(/^([A-Z]{2})\s+/, '')
      .replace(/中国台湾/g, '台湾')
      .replace(/中國台灣/g, '台灣')
      .replace(/中国香港/g, '香港')
      .replace(/中國香港/g, '香港')
      .replace(/中国澳门/g, '澳门')
      .replace(/中國澳門/g, '澳門')
      .replace(/Taiwan,\s*Province of China/gi, 'Taiwan')
      .replace(/Hong Kong\s*SAR\s*China/gi, 'Hong Kong')
      .replace(/Macao\s*SAR\s*China/gi, 'Macau')
      .trim() || geo.name || '全球';

    // If cleanName is still a 2-letter country code (e.g. 'MY' or 'TW'), resolve to its proper localized name
    if (/^[A-Z]{2}$/i.test(cleanName) || cleanName === geo.code) {
      cleanName = geo.name || cleanName;
    }

    const isTwoLetterCode = geo.code && geo.code !== 'GLOBAL' && /^[A-Z]{2}$/.test(geo.code);
    const lowerCode = (geo.code || '').toLowerCase();

    return (
      <span
        className="tk-geo-badge"
        title={`${tC.geoRegionPrefix}${geo.formatted}${isCurrentAdmin && item.ip ? `${tC.geoRealIpPrefix}${item.ip})` : ''}`}
      >
        <span className="tk-geo-flag" role="img" aria-label={geo.code}>
          {isTwoLetterCode ? (
            <img
              src={`/media/flags/${lowerCode}.png`}
              srcSet={`/media/flags/${lowerCode}.png 1x, https://flagcdn.com/48x36/${lowerCode}.png 2x`}
              width="15"
              height="11"
              alt={geo.code}
              className="tk-geo-flag-img"
              loading="eager"
              onError={(e) => {
                const target = e.currentTarget;
                if (!target.dataset.triedCdn) {
                  target.dataset.triedCdn = 'true';
                  target.src = `https://flagcdn.com/48x36/${lowerCode}.png`;
                } else {
                  target.style.display = 'none';
                  if (target.parentElement) {
                    target.parentElement.textContent = flag;
                  }
                }
              }}
            />
          ) : (
            flag
          )}
        </span>
        <span className="tk-geo-name">{cleanName}</span>
        {isCurrentAdmin && item.ip && (
          <span className="tk-admin-ip-tag" title={tC.geoAdminPrivilege}>
            ({item.ip})
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
  const [modalPollOptions, setModalPollOptions] = useState<string[]>(['', '']);
  const [modalPollType, setModalPollType] = useState<'regular' | 'multiple'>('regular');

  const [modalTableRows, setModalTableRows] = useState(3);
  const [modalTableCols, setModalTableCols] = useState(3);
  const [modalTableHeaders, setModalTableHeaders] = useState<string[]>([]);

  const [modalDetailsSummary, setModalDetailsSummary] = useState('');
  const [modalDetailsContent, setModalDetailsContent] = useState('');

  const [modalSpoilerText, setModalSpoilerText] = useState('');

  const [modalMathFormula, setModalMathFormula] = useState('\\int_{0}^{\\infty} e^{-x^2} dx = \\frac{\\sqrt{\\pi}}{2}');

  const [modalScrollHeight, setModalScrollHeight] = useState(160);
  const [modalScrollContent, setModalScrollContent] = useState('');

  const [modalCalloutType, setModalCalloutType] = useState<'note' | 'tip' | 'warning' | 'danger'>('note');
  const [modalCalloutTitle, setModalCalloutTitle] = useState('');
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
    setModalPollOptions(['', '']);
    setModalPollType('regular');
    setActiveModal('poll');
    setActiveDropdown(null);
  };

  const openTableModal = () => {
    setModalTableRows(3);
    setModalTableCols(3);
    setModalTableHeaders([]);
    setActiveModal('table');
    setActiveDropdown(null);
  };

  const openDetailsModal = () => {
    setModalDetailsSummary('');
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
    setModalCalloutTitle('');
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
      flowchart: `graph TD\n    A[Start] --> B{Condition};\n    B -->|Yes| C[Execute Core Process];\n    B -->|No| D[Rollback & Alert];\n    C --> E[End];`,
      sequence: `sequenceDiagram\n    autonumber\n    actor User\n    participant Gateway\n    participant Service\n    participant DB\n    User->>Gateway: POST /api/comments\n    Gateway->>Service: Validate\n    Service->>DB: Persist\n    DB-->>Service: Result\n    Service-->>User: 200 OK`,
      gantt: `gantt\n    title Feature Roadmap\n    dateFormat YYYY-MM-DD\n    section UI/UX\n    Design & Specs: 2026-09-01, 3d\n    section Components\n    Modals & Rules: 2026-09-04, 2d`,
      class: `classDiagram\n    class CommentItem {\n        +String id\n        +String author\n        +String message\n        +Date createdAt\n        +renderMarkdown()\n    }`,
      pie: `pie title Architecture Overhead\n    "Markdown Parsing" : 35\n    "Network Transfer" : 25\n    "Storage" : 20\n    "Animations" : 20`,
      state: `stateDiagram-v2\n    [*] --> Draft\n    Draft --> Validating: Submit\n    Validating --> Published: Success\n    Validating --> Error: Failure\n    Published --> [*]`,
    };
    setModalMermaidCode(presets[type] || presets.flowchart);
    setActiveModal('mermaid');
    setActiveDropdown(null);
  };

  const openChartModal = (type: 'bar' | 'line' | 'pie' = 'bar') => {
    setModalChartType(type);
    const presets: Record<string, string> = {
      bar: `{\n  "type": "bar",\n  "data": {\n    "labels": ["Q1", "Q2", "Q3", "Q4"],\n    "datasets": [{ "label": "Metrics", "data": [120, 290, 480, 650] }]\n  }\n}`,
      line: `{\n  "type": "line",\n  "data": {\n    "labels": ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],\n    "datasets": [{ "label": "Traffic", "data": [1500, 2300, 4200, 3800, 6200, 8900] }]\n  }\n}`,
      pie: `{\n  "type": "pie",\n  "data": {\n    "labels": ["Frontend", "Gateway", "Database", "ThirdParty"],\n    "datasets": [{ "data": [40, 25, 20, 15] }]\n  }\n}`,
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
      setUploadError(tC.uploadErrorType);
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setUploadError(tC.uploadErrorSize);
      return;
    }
    setIsUploadingImage(true);
    setUploadError(null);
    showToast(tC.toastUploadingImage, 'info', 3000);
    try {
      const res = await uploadCommentImage(file);
      if (!res.ok || !res.url) {
        setUploadError(res.error || tC.uploadErrorFailed);
        showToast(tC.toastUploadFailed(res.error || ''), 'error');
      } else {
        setModalImageUrl(res.url);
        if (!modalImageAlt) {
          const rawName = file.name.replace(/\.[^/.]+$/, '');
          setModalImageAlt(rawName);
        }
        showToast(tC.toastUploadSuccess, 'success');
      }
    } catch (err: any) {
      setUploadError(err?.message || tC.uploadErrorNetwork);
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
        showToast(tC.toastClipboardDetected, 'info', 3500);
        try {
          const res = await uploadCommentImage(file);
          if (res.ok && res.url) {
            const mdSnippet = `\n![${file.name || 'image'}](${res.url})\n`;
            targetSetter((prev) => prev + mdSnippet);
            showToast(tC.toastClipboardSuccess, 'success');
          } else {
            showToast(tC.toastUploadFailed(res.error || ''), 'error');
          }
        } catch (err: any) {
          showToast(tC.toastUploadError(err?.message || ''), 'error');
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
        showToast(tC.toastDragUploading(file.name), 'info', 3500);
        try {
          const res = await uploadCommentImage(file);
          if (res.ok && res.url) {
            const mdSnippet = `\n![${file.name || 'image'}](${res.url})\n`;
            targetSetter((prev) => prev + mdSnippet);
            showToast(tC.toastDragSuccess(file.name), 'success');
          } else {
            showToast(tC.toastUploadFailed(res.error || ''), 'error');
          }
        } catch (err: any) {
          showToast(tC.toastUploadError(err?.message || ''), 'error');
        }
      }
    }
  };

  const handleConfirmModal = () => {
    if (activeModal === 'poll') {
      const q = modalPollQuestion.trim();
      const validOpts = modalPollOptions.map((o) => o.trim()).filter(Boolean);
      const opts = validOpts.length >= 2 ? validOpts : [tC.pollDefaultOpt1, tC.pollDefaultOpt2];
      const qLine = q ? `> 🗳️ ${tC.pollTopicPrefix}${q}\n` : '';
      const markdown = `\n${qLine}[poll type=${modalPollType}]\n${opts.map((o) => `* ${o}`).join('\n')}\n[/poll]\n`;
      insertMarkdown(markdown);
      showToast(tC.toastInsertedPoll);
    } else if (activeModal === 'table') {
      const rows = Math.max(1, Math.min(10, modalTableRows));
      const cols = Math.max(1, Math.min(6, modalTableCols));
      const headers = Array.from({ length: cols }, (_, i) => modalTableHeaders[i]?.trim() || tC.modalColumnDefaultTitle(i + 1));
      const headerLine = `| ${headers.join(' | ')} |`;
      const separatorLine = `| ${Array(cols).fill('---').join(' | ')} |`;
      const bodyLines = Array.from({ length: rows }, (_, r) => {
        const cells = Array.from({ length: cols }, (_, c) => tC.modalTableDataSample(r + 1, c + 1));
        return `| ${cells.join(' | ')} |`;
      });
      insertMarkdown(`\n${headerLine}\n${separatorLine}\n${bodyLines.join('\n')}\n`);
      showToast(tC.toastInsertedTable);
    } else if (activeModal === 'details') {
      const summary = modalDetailsSummary.trim() || tC.detailsDefaultSummary;
      const content = modalDetailsContent.trim() || tC.detailsDefaultContent;
      insertMarkdown(`\n<details>\n<summary>${summary}</summary>\n\n${content}\n</details>\n`);
      showToast(tC.toastInsertedDetails);
    } else if (activeModal === 'spoiler') {
      const text = modalSpoilerText.trim() || tC.spoilerDefaultText;
      insertMarkdown(`[spoiler]${text}[/spoiler]`);
      showToast(tC.toastInsertedSpoiler);
    } else if (activeModal === 'math') {
      const formula = modalMathFormula.trim() || 'E = mc^2';
      insertMarkdown(`\n$$\n${formula}\n$$\n`);
      showToast(tC.toastInsertedMath);
    } else if (activeModal === 'scroll') {
      const height = Math.max(80, Math.min(600, modalScrollHeight));
      const content = modalScrollContent.trim() || tC.scrollDefaultContent;
      insertMarkdown(`\n::: scroll height=${height}\n${content}\n:::\n`);
      showToast(tC.toastInsertedScroll);
    } else if (activeModal === 'callout') {
      const type = modalCalloutType || 'note';
      const title = modalCalloutTitle.trim() ? ` ${modalCalloutTitle.trim()}` : '';
      const content = modalCalloutContent.trim() || tC.calloutDefaultContent;
      insertMarkdown(`\n::: ${type}${title}\n${content}\n:::\n`);
      showToast(tC.toastInsertedCallout);
    } else if (activeModal === 'toc') {
      const depth = Math.max(1, Math.min(6, modalTocDepth));
      const includeHeaders = modalTocIncludeHeaders ? ' headers=true' : '';
      insertMarkdown(`\n[toc depth=${depth}${includeHeaders}]\n`);
      showToast(tC.toastInsertedToc);
    } else if (activeModal === 'mermaid') {
      const code = modalMermaidCode.trim() || 'graph TD\n    A[Start] --> B[End]';
      insertMarkdown(`\n\`\`\`mermaid\n${code}\n\`\`\`\n`);
      showToast(tC.toastInsertedMermaid);
    } else if (activeModal === 'chart') {
      const code = modalChartCode.trim() || '{\n  "type": "bar",\n  "data": { "labels": ["A", "B"], "datasets": [{ "data": [1, 2] }] }\n}';
      insertMarkdown(`\n\`\`\`chart\n${code}\n\`\`\`\n`);
      showToast(tC.toastInsertedChart);
    } else if (activeModal === 'graphviz') {
      const code = modalGraphvizCode.trim() || 'digraph G {\n  A -> B;\n}';
      insertMarkdown(`\n\`\`\`graphviz\n${code}\n\`\`\`\n`);
      showToast(tC.toastInsertedGraphviz);
    } else if (activeModal === 'datetime') {
      const format = modalDatetimeFormat;
      const custom = modalDatetimeCustom.trim();
      const val = custom || new Date().toISOString();
      insertMarkdown(`[date=${val} format="${format}"]`);
      showToast(tC.toastInsertedDatetime);
    } else if (activeModal === 'template') {
      const templates: Record<string, string> = {
        tech: tC.templateTechSample,
        bug: tC.templateBugSample,
        opinion: tC.templateOpinionSample,
      };
      insertMarkdown(`\n${templates[modalTemplateType] || templates.tech}\n`);
      showToast(tC.toastInsertedTemplate);
    } else if (activeModal === 'footnote') {
      const fid = modalFootnoteId.trim() || '1';
      const fcontent = modalFootnoteContent.trim() || tC.footnoteDefaultContent;
      insertMarkdown(`[^${fid}]`, `\n\n[^${fid}]: ${fcontent}\n`);
      showToast(tC.toastInsertedFootnote);
    } else if (activeModal === 'image') {
      if (!modalImageUrl.trim()) {
        showToast(tC.toastImageMissing, 'error');
        return;
      }
      const alt = modalImageAlt.trim() || tC.imageDefaultAlt;
      insertMarkdown(`\n![${alt}](${modalImageUrl.trim()})\n`);
      showToast(tC.toastInsertedImage);
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

  const commentsRef = useRef<BlogComment[]>([]);
  commentsRef.current = comments;
  const lastFocusRefreshRef = useRef<number>(0);

  // Fetch real comments with silent refresh capability ensuring zero UI flashing
  const loadComments = useCallback(
    async (sort = sortOrder, isSilent = false) => {
      // Only set loading if initial load and no comments are currently rendered
      if (!isSilent && commentsRef.current.length === 0) {
        setLoading(true);
      }
      try {
        const currentIdentity = readCommentIdentity();
        const token = currentIdentity?.token;
        const data = await fetchComments(slug, sort, { token });
        setComments((prev) => {
          // Compare if data changed to avoid needless DOM re-renders
          if (prev.length === data.length) {
            let changed = false;
            for (let i = 0; i < prev.length; i++) {
              if (
                prev[i].id !== data[i].id ||
                prev[i].updatedAt !== data[i].updatedAt ||
                prev[i].likesCount !== data[i].likesCount ||
                prev[i].message !== data[i].message ||
                JSON.stringify(prev[i].reactions) !== JSON.stringify(data[i].reactions)
              ) {
                changed = true;
                break;
              }
            }
            if (!changed) return prev;
          }
          return data;
        });
      } catch (err) {
        console.warn('[PostComments] Load error:', err);
        // Only clear if initial load with no cached comments
        if (commentsRef.current.length === 0) {
          setComments([]);
        }
      } finally {
        setLoading(false);
      }
    },
    [slug, sortOrder]
  );

  useEffect(() => {
    setAccount(readCommentIdentity());

    const syncAccountState = () => {
      setAccount(readCommentIdentity());
    };

    const handleAccountChange = (event: Event) => {
      const detail = (event as CustomEvent<CommentIdentity | null>).detail ?? readCommentIdentity();
      setAccount(detail);
      void loadComments(sortOrder, true);
    };

    const handleWindowFocus = () => {
      syncAccountState();
      const now = Date.now();
      // Silently refresh on window focus only if more than 30s have elapsed, never flash loading
      if (now - lastFocusRefreshRef.current > 30000) {
        lastFocusRefreshRef.current = now;
        void loadComments(sortOrder, true);
      }
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

      const quoteBlock = `> ${tC.quoteFromArticle(detail.title || title)}:\n> ${detail.text.trim()}\n\n`;
      insertMarkdown(quoteBlock, '', '');
      showToast(tC.toastQuotedSelection, 'success');
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
    window.addEventListener('focus', handleWindowFocus);
    document.addEventListener('click', handleOutsideClick);
    window.addEventListener('shijianus:quote-post-text', handleQuotePostText);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('shijianus:comment-account-change', handleAccountChange);
      window.removeEventListener('storage', syncAccountState);
      window.removeEventListener('focus', handleWindowFocus);
      document.removeEventListener('click', handleOutsideClick);
      window.removeEventListener('shijianus:quote-post-text', handleQuotePostText);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [title, loadComments, sortOrder]);

  // Initial load
  useEffect(() => {
    void loadComments(sortOrder, false);
  }, [loadComments, sortOrder, account?.token, account?.role]);

  // Permanent resident silent auto-refresh: polls silently in background every 25s without blinking UI
  useEffect(() => {
    const timer = setInterval(() => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        void loadComments(sortOrder, true);
      }
    }, 25000);
    return () => clearInterval(timer);
  }, [loadComments, sortOrder]);

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
    void loadComments(newSort, true);
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
      showToast(tC.toastCommentEmpty, 'error');
      return;
    }

    if (trimmed.length > COMMENT_LIMIT) {
      showToast(tC.toastCommentLimit(COMMENT_LIMIT), 'error');
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
        showToast(tC.toastCommentSuccess, 'success');

        await loadComments(sortOrder, true);
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('shijianus:comment-thread-change'));
        }
      } else {
        showToast(tC.toastCommentFailed(res.error || ''), 'error');
      }
    } catch {
      showToast(tC.toastCommentNetworkError, 'error');
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
          ? tC.toastBoostLimit(BOOST_LIMIT)
          : tC.toastCommentLimit(COMMENT_LIMIT),
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
        showToast(replyMode === 'boost' ? tC.toastReplyBoostSuccess : tC.toastReplySuccess, 'success');

        await loadComments(sortOrder, true);
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('shijianus:comment-thread-change'));
        }
      } else {
        showToast(tC.toastReplyFailed(res.error || ''), 'error');
      }
    } catch {
      showToast(tC.toastReplyNetworkError, 'error');
    } finally {
      setReplySubmitting(false);
    }
  };

  // Inline Edit Save
  const handleSaveEdit = async (commentId: string) => {
    const trimmed = editingMessage.trim();
    if (!trimmed) {
      showToast(tC.toastEditEmpty, 'error');
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
        showToast(tC.toastEditSuccess, 'success');
        await loadComments(sortOrder, true);
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('shijianus:comment-thread-change'));
        }
      } else {
        showToast(tC.toastEditFailed(res.error || ''), 'error');
      }
    } catch {
      showToast(tC.toastEditNetworkError, 'error');
    } finally {
      setSavingEdit(false);
    }
  };

  // Delete Comment
  const handleDelete = async (commentId: string) => {
    if (typeof window !== 'undefined' && !window.confirm(tC.modalConfirmDelete)) {
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
        showToast(tC.toastDeleteSuccess, 'success');
        await loadComments(sortOrder, true);
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('shijianus:comment-thread-change'));
        }
      } else {
        showToast(tC.toastDeleteFailed(res.error || ''), 'error');
      }
    } catch {
      showToast(tC.toastDeleteNetworkError, 'error');
    }
  };

  // Like / Reaction (Strict visitor blocking: visitors have 0 like permission)
  const handleLike = async (commentId: string, emoji = '👍') => {
    if (!account || account.role === 'visitor') {
      showToast(tC.toastVisitorLikeForbidden, 'error');
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
        showToast(tC.toastLikeFailed(res.error || ''), 'error');
      }
    } catch {
      showToast(tC.toastLikeNetworkError, 'error');
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
          <span>{tC.headingComments || heading}</span>
        </h3>
        <div className="comment-randomInfo">
          <a
            onClick={openAccountDrawer}
            title={tC.loginDrawerTitle}
            style={{ cursor: 'pointer' }}
          >
            {account?.provider === 'epomail'
              ? `⚡ ${account.name} (Epomail)`
              : account && account.role !== 'visitor'
              ? `👤 ${account.name}`
              : tC.loginAsGuest}
          </a>
          <a
            href="/about"
            target="_blank"
            rel="noreferrer"
            title={tC.policyTitle}
          >
            {tC.policyLabel || policyLabel}
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
                  ✏️ {tC.tabEdit}
                </button>
                <button
                  type="button"
                  className={`tk-editor-tab-btn ${editorTab === 'preview' ? 'is-active' : ''}`}
                  onClick={() => setEditorTab('preview')}
                >
                  👁️ {tC.tabPreview}
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
                    ? tC.avatarGuestTitle
                    : tC.avatarUserTitle(effectiveCurrentAvatar.name, effectiveCurrentAvatar.role)
                }
                style={{ cursor: 'pointer' }}
              >
                {effectiveCurrentAvatar.url ? (
                  <img src={effectiveCurrentAvatar.url} alt={effectiveCurrentAvatar.name} loading="lazy" />
                ) : !effectiveCurrentAvatar.isVisitor ? (
                  <span className="tk-avatar-initials">{effectiveCurrentAvatar.initials}</span>
                ) : (
                  <div className="tk-avatar-visitor-icon" title={tC.visitorBadge}>
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
                      <span>{tC.quoteBannerPrefix(quoteState.authorName)}</span>
                      <button type="button" onClick={() => setQuoteState(null)}>✕</button>
                    </div>
                    <p className="tk-quote-preview-text">{quoteState.text}</p>
                  </div>
                )}

                {/* 1. Linuxdo-style Markdown Toolbar (Placed right above tk-input el-textarea) */}
                {editorTab === 'edit' && (
                  <div className="tk-markdown-toolbar" role="toolbar" aria-label={tC.toolbarAria}>
                    {/* ① 贴文语言 */}
                    <div className="tk-toolbar-item">
                      <button
                        type="button"
                        className="tk-tb-btn tk-tb-btn-lang"
                        title={tC.toolbarLangTitle}
                        aria-label={tC.toolbarLangAria}
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
                          <div className="tk-dropdown-title">{tC.toolbarLangMenuTitle}</div>
                          {POST_LANGUAGES.map((lang) => (
                            <button
                              key={lang.code}
                              type="button"
                              className="tk-dropdown-item"
                              onClick={() => {
                                insertMarkdown(`<div lang="${lang.code}">\n`, '\n</div>', lang.label);
                                showToast(tC.toastLangInserted(lang.label));
                              }}
                            >
                              <div className="tk-dropdown-item-content">
                                <div className="tk-dropdown-icon-col">
                                  <Languages size={14} className="tk-dropdown-svg" />
                                </div>
                                <div className="tk-dropdown-text-col">
                                  <span className="tk-dropdown-label">{lang.label}</span>
                                  <span className="tk-dropdown-desc">{tC.toolbarLangItemDesc(lang.code)}</span>
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
                      title={tC.toolbarBold}
                      onClick={() => insertMarkdown('**', '**', tC.toolbarBoldPlaceholder)}
                    >
                      <Bold size={15} />
                    </button>

                    {/* ③ 斜体 */}
                    <button
                      type="button"
                      className="tk-tb-btn tk-tb-italic"
                      title={tC.toolbarItalic}
                      onClick={() => insertMarkdown('*', '*', tC.toolbarItalicPlaceholder)}
                    >
                      <Italic size={15} />
                    </button>

                    {/* ④ 文字大小 */}
                    <button
                      type="button"
                      className="tk-tb-btn tk-tb-heading"
                      title={tC.toolbarHeading}
                      onClick={() => insertMarkdown('### ', '', tC.toolbarHeadingPlaceholder)}
                    >
                      <Heading size={15} />
                    </button>

                    {/* ⑤ 块引用 */}
                    <button
                      type="button"
                      className="tk-tb-btn tk-tb-quote tk-tb-btn-quote"
                      title={tC.toolbarQuote}
                      onClick={() => insertMarkdown('> ', '', tC.toolbarQuotePlaceholder)}
                    >
                      <Quote size={15} />
                    </button>

                    {/* ⑥ 预初始化文字 (代码) */}
                    <button
                      type="button"
                      className="tk-tb-btn tk-tb-code tk-tb-btn-code"
                      title={tC.toolbarCode}
                      onClick={() => insertMarkdown('```\n', '\n```', 'console.log("Hello, World!");')}
                    >
                      <Code size={15} />
                    </button>

                    {/* ⑦ 清单 */}
                    <button
                      type="button"
                      className="tk-tb-btn tk-tb-list tk-tb-btn-list"
                      title={tC.toolbarList}
                      onClick={() => insertMarkdown('- ', '', tC.toolbarListPlaceholder)}
                    >
                      <List size={15} />
                    </button>

                    {/* ⑧ 切换方向 */}
                    <button
                      type="button"
                      className={`tk-tb-btn tk-tb-direction tk-tb-btn-direction ${textDirection === 'rtl' ? 'is-active' : ''}`}
                      title={tC.toolbarDirection}
                      onClick={() => {
                        const nextDir = textDirection === 'ltr' ? 'rtl' : 'ltr';
                        setTextDirection(nextDir);
                        showToast(tC.toolbarDirectionToast(nextDir));
                      }}
                    >
                      <ArrowLeftRight size={15} />
                    </button>

                    {/* ⑨ emoji */}
                    <div className="tk-toolbar-item">
                      <button
                        type="button"
                        className="tk-tb-btn tk-tb-emoji"
                        title={tC.toolbarEmoji}
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveDropdown((prev) => (prev === 'emoji' ? null : 'emoji'));
                        }}
                      >
                        <Smile size={15} />
                      </button>
                      {activeDropdown === 'emoji' && (
                        <div className="tk-dropdown-panel tk-emoji-picker-dropdown" onClick={(e) => e.stopPropagation()}>
                          <div className="tk-dropdown-title">{tC.toolbarEmojiTitle}</div>
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
                      title={tC.toolbarImage}
                      aria-label={tC.toolbarImageAria}
                      onClick={() => openImageModal('upload')}
                    >
                      <ImageIcon size={15} />
                    </button>

                    <span className="tk-tb-divider" />

                    {/* ⑩ 选项 (下拉包含 15 个高级拓展功能，含居中 UI 弹窗与 SVG 图标及注释文本) */}
                    <div className="tk-toolbar-item">
                      <button
                        type="button"
                        className="tk-tb-btn tk-tb-options tk-tb-btn-options"
                        title={tC.toolbarOptions}
                        aria-label={tC.toolbarOptionsAria}
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
                          <div className="tk-dropdown-title">{tC.toolbarOptionsTitle}</div>

                          {/* 1. 引用贴文 */}
                          <button
                            type="button"
                            className="tk-dropdown-item"
                            onClick={() => {
                              setActiveDropdown(null);
                              const sel = typeof window !== 'undefined' ? window.getSelection()?.toString().trim() : '';
                              if (sel) {
                                insertMarkdown(`> ${tC.quoteFromArticle(title)}:\n> ${sel}\n\n`);
                                showToast(tC.toastQuoteSelection);
                              } else {
                                insertMarkdown(`> ${tC.quoteFromArticle(title)}:\n> `, '\n\n', tC.quoteEmptyPlaceholder);
                                showToast(tC.toastQuoteTip, 'success', 4000);
                              }
                            }}
                          >
                            <div className="tk-dropdown-item-content">
                              <div className="tk-dropdown-icon-col">
                                <Quote size={15} className="tk-dropdown-svg" />
                              </div>
                              <div className="tk-dropdown-text-col">
                                <span className="tk-dropdown-label">{tC.optQuoteLabel}</span>
                                <span className="tk-dropdown-desc">{tC.optQuoteDesc}</span>
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
                                <span className="tk-dropdown-label">{tC.optTableLabel}</span>
                                <span className="tk-dropdown-desc">{tC.optTableDesc}</span>
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
                                <span className="tk-dropdown-label">{tC.optTocLabel}</span>
                                <span className="tk-dropdown-desc">{tC.optTocDesc}</span>
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
                                <span className="tk-dropdown-label">{tC.optScrollLabel}</span>
                                <span className="tk-dropdown-desc">{tC.optScrollDesc}</span>
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
                                <span className="tk-dropdown-label">{tC.optMermaidLabel}</span>
                                <span className="tk-dropdown-desc">{tC.optMermaidDesc}</span>
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
                                <span className="tk-dropdown-label">{tC.optChartLabel}</span>
                                <span className="tk-dropdown-desc">{tC.optChartDesc}</span>
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
                                <span className="tk-dropdown-label">{tC.optDetailsLabel}</span>
                                <span className="tk-dropdown-desc">{tC.optDetailsDesc}</span>
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
                                <span className="tk-dropdown-label">{tC.optGraphvizLabel}</span>
                                <span className="tk-dropdown-desc">{tC.optGraphvizDesc}</span>
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
                                <span className="tk-dropdown-label">{tC.optDatetimeLabel}</span>
                                <span className="tk-dropdown-desc">{tC.optDatetimeDesc}</span>
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
                                <span className="tk-dropdown-label">{tC.optMathLabel}</span>
                                <span className="tk-dropdown-desc">{tC.optMathDesc}</span>
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
                                <span className="tk-dropdown-label">{tC.optTemplateLabel}</span>
                                <span className="tk-dropdown-desc">{tC.optTemplateDesc}</span>
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
                                <span className="tk-dropdown-label">{tC.optFootnoteLabel}</span>
                                <span className="tk-dropdown-desc">{tC.optFootnoteDesc}</span>
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
                                <span className="tk-dropdown-label">{tC.optSpoilerLabel}</span>
                                <span className="tk-dropdown-desc">{tC.optSpoilerDesc}</span>
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
                                <span className="tk-dropdown-label">{tC.optPollLabel}</span>
                                <span className="tk-dropdown-desc">{tC.optPollDesc}</span>
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
                                <span className="tk-dropdown-label">{tC.optCalloutLabel}</span>
                                <span className="tk-dropdown-desc">{tC.optCalloutDesc}</span>
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
                                <span className="tk-dropdown-label">{tC.optImageLabel}</span>
                                <span className="tk-dropdown-desc">{tC.optImageDesc}</span>
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
                      placeholder={tC.mainPlaceholder(title)}
                      rows={mainInputFocused || mainMessage.trim() ? 5 : 2}
                    />
                    <span className="el-input__count">
                      {mainMessage.length}/{COMMENT_LIMIT}
                    </span>
                  </div>
                ) : (
                  <div className="tk-preview-container">
                    <div className="tk-preview-badge">{tC.previewBadge}</div>
                    <div
                      className="tk-preview-box"
                      dangerouslySetInnerHTML={{
                        __html:
                          renderCommentMarkdown(mainMessage.trim()) ||
                          `<p class="tk-preview-empty">${tC.previewEmpty}</p>`,
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
                        {tC.cancelBtn}
                      </button>
                      <button
                        type="button"
                        className="tk-send"
                        disabled={submitting || !mainMessage.trim()}
                        onClick={handleMainSubmit}
                      >
                        {submitting ? tC.sendingBtn : (submitLabel === '发送' ? tC.sendBtn : submitLabel)}
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
                <span>{tC.publicComments}</span>
                <strong>({comments.length})</strong>
              </div>

              <div className="tk-sort-group">
                <button
                  type="button"
                  className={`tk-sort-btn ${sortOrder === 'new' ? 'is-active' : ''}`}
                  onClick={() => handleSortToggle('new')}
                >
                  {tC.sortNew}
                </button>
                <span className="tk-sort-divider">|</span>
                <button
                  type="button"
                  className={`tk-sort-btn ${sortOrder === 'hot' ? 'is-active' : ''}`}
                  onClick={() => handleSortToggle('hot')}
                >
                  {tC.sortHot}
                </button>
              </div>
            </div>

            {loading && comments.length === 0 ? (
              <div className="tk-comments-no">
                <span>{tC.loadingComments}</span>
              </div>
            ) : comments.length === 0 ? (
              <div className="tk-comments-no">
                <div className="tk-comments-empty-icon" style={{ fontSize: '28px', opacity: 0.65 }}>💬</div>
                <span>{tC.emptyComments || `${emptyTitle}，${emptySummary}`}</span>
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
                      {(() => {
                        const isAuthorWebmaster = item.authorRole === 'admin' || (item as any).isWebmaster === true || item.authorEmail?.toLowerCase() === 'admin@epomail.bond';
                        return (
                          <div
                            className={`tk-avatar ${isAuthorWebmaster ? 'is-webmaster-avatar' : 'is-user-avatar'} theme-account-drawer__summary-avatar is-clickable`}
                            onClick={(e) => handleAvatarClick(item, e)}
                            onMouseEnter={(e) => handleAvatarMouseEnter(item, e)}
                            onMouseLeave={handleAvatarMouseLeave}
                            role="button"
                            tabIndex={0}
                            aria-label={`查看 ${item.authorName} 的个人资料`}
                            title={isAuthorWebmaster ? '站长专属方形头像 (点击查看资料)' : '点击/悬停查看用户资料'}
                          >
                            {item.authorAvatar ? (
                              <img src={item.authorAvatar} alt={item.authorName} loading="lazy" />
                            ) : isAuthorWebmaster ? (
                              <img src="/media/shijianus/avatar.jpg" alt={item.authorName} loading="lazy" />
                            ) : item.authorName && item.authorName !== '访客' && item.authorName !== tC.visitorBadge ? (
                              <span className="tk-avatar-initials">{getCommentInitials(item.authorName)}</span>
                            ) : (
                              <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                              </svg>
                            )}
                          </div>
                        );
                      })()}

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
                              ? tC.pinnedBadge
                              : item.authorRole === 'admin'
                              ? tC.bloggerBadge
                              : tC.visitorBadge}
                          </span>

                          {/* Country / IP Location badge */}
                          {renderGeoBadge(item)}

                          {isBoost && (
                            <span className="tk-boost-pill">
                              <Rocket size={11} className="tk-boost-icon" />
                              <span>Boost</span>
                            </span>
                          )}

                          <time className="tk-time">{formatCommentTime(item.createdAt, currentLocale)}</time>
                          {edited && (
                            <span className="tk-edited-mark">
                              <span className="tk-edited-bracket">(</span>
                              <span className="tk-edited-text">{tC.editedBadge}</span>
                              <span className="tk-edited-bracket">)</span>
                            </span>
                          )}
                        </div>

                        {/* Quoted Source Card */}
                        {item.quote && (
                          <div className="tk-quote-display-card">
                            <div className="tk-quote-display-author">
                              <span>{tC.quoteBannerPrefix(item.quote.authorName)}</span>
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
                                {savingEdit ? tC.savingBtn : tC.saveBtn}
                              </button>
                              <button
                                type="button"
                                className="tk-btn-cancel"
                                onClick={() => setEditingCommentId(null)}
                              >
                                {tC.cancelBtn}
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
                                {isTextExpanded ? tC.collapseText : tC.expandText}
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
                              aria-label={tC.likeAria}
                              title={
                                rxMeta.totalCount > 0
                                  ? tC.likeTitleWithCount(rxMeta.entries.map(([e, c]) => `${e} ${c}`).join(' '))
                                  : tC.likeTitleEmpty
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
                                <div className="tk-reaction-bubble-title">{tC.reactionPickerTitle}</div>
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
                            aria-label={tC.replyCommentAria}
                            title={tC.replyCommentTitle}
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
                            aria-label={tC.boostActionAria}
                            title={tC.boostActionTitle}
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
                            aria-label={tC.quoteActionAria}
                            title={tC.quoteActionTitle}
                            onClick={() => handleQuoteClick(item)}
                          >
                            <Quote size={14} className="tk-action-svg" />
                          </button>
                          {isManageable && (
                            <>
                              <button
                                type="button"
                                className="tk-action-btn tk-action-edit"
                                aria-label={tC.editActionAria}
                                title={tC.editActionTitle}
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
                                aria-label={tC.deleteActionAria}
                                title={tC.deleteActionTitle}
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
                                      <span>{tC.boostModeBadge}</span>
                                      <button
                                        type="button"
                                        className="tk-reply-mode-toggle"
                                        onClick={() => setReplyMode('comment')}
                                        title={tC.boostToggleNormalTitle}
                                      >
                                        {tC.boostToggleNormal}
                                      </button>
                                    </div>
                                  ) : (
                                    <div className="tk-reply-hint-bar">
                                      <span className="tk-reply-to-text">{tC.normalReplyTo(replyingTargetAuthor)}</span>
                                      <button
                                        type="button"
                                        className="tk-reply-mode-toggle tk-reply-mode-toggle-boost"
                                        onClick={() => setReplyMode('boost')}
                                        title={tC.normalToggleBoostTitle}
                                      >
                                        <Rocket size={12} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '3px' }} />
                                        {tC.normalToggleBoost}
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
                                        ? tC.boostPlaceholder(replyingTargetAuthor)
                                        : tC.normalPlaceholder(replyingTargetAuthor)
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
                                    {tC.cancelBtn}
                                  </button>
                                  <button
                                    type="button"
                                    className={`tk-send tk-send-small ${replyMode === 'boost' ? 'is-boost-btn' : ''}`}
                                    disabled={replySubmitting || !replyMessage.trim()}
                                    onClick={() => handleReplySubmit(item.id)}
                                  >
                                    {replySubmitting
                                      ? tC.sendingBtn
                                      : replyMode === 'boost'
                                      ? (
                                        <>
                                          <Rocket size={12} style={{ marginRight: '4px' }} />
                                          Boost
                                        </>
                                      )
                                      : tC.replyBtn}
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
                                  ? tC.collapseReplies(replies.length)
                                  : tC.viewReplies(replies.length)}
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
                                      {/* Avatar */}
                                      {(() => {
                                        const isReplyWebmaster = reply.authorRole === 'admin' || (reply as any).isWebmaster === true || reply.authorEmail?.toLowerCase() === 'admin@epomail.bond';
                                        return (
                                          <div
                                            className={`tk-avatar tk-avatar-small ${isReplyWebmaster ? 'is-webmaster-avatar' : 'is-user-avatar'} theme-account-drawer__summary-avatar is-clickable`}
                                            onClick={(e) => handleAvatarClick(reply, e)}
                                            onMouseEnter={(e) => handleAvatarMouseEnter(reply, e)}
                                            onMouseLeave={handleAvatarMouseLeave}
                                            role="button"
                                            tabIndex={0}
                                            aria-label={`查看 ${reply.authorName} 的个人资料`}
                                            title={isReplyWebmaster ? '站长专属方形头像 (点击查看资料)' : '点击/悬停查看用户资料'}
                                          >
                                            {reply.authorAvatar ? (
                                              <img src={reply.authorAvatar} alt={reply.authorName} loading="lazy" />
                                            ) : isReplyWebmaster ? (
                                              <img src="/media/shijianus/avatar.jpg" alt={reply.authorName} loading="lazy" />
                                            ) : reply.authorName && reply.authorName !== '访客' ? (
                                              <span className="tk-avatar-initials">{getCommentInitials(reply.authorName)}</span>
                                            ) : (
                                              <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                                                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                                              </svg>
                                            )}
                                          </div>
                                        );
                                      })()}

                                      <div className="tk-main">
                                        <div className="tk-row tk-meta">
                                          <strong className="tk-nick">{reply.authorName}</strong>
                                          <span
                                            className={`tk-badge ${
                                              reply.authorRole === 'admin' ? 'is-admin' : 'is-visitor'
                                            }`}
                                          >
                                            {reply.authorRole === 'admin' ? tC.bloggerBadge : tC.visitorBadge}
                                          </span>

                                          {/* Country / IP Location badge */}
                                          {renderGeoBadge(reply)}

                                          {isReplyBoost && (
                                            <span className="tk-boost-pill">
                                              <Rocket size={11} className="tk-boost-icon" />
                                              <span>Boost</span>
                                            </span>
                                          )}

                                          <time className="tk-time">{formatCommentTime(reply.createdAt, currentLocale)}</time>
                                          {isReplyEdited && (
                                            <span className="tk-edited-mark">
                                              <span className="tk-edited-bracket">(</span>
                                              <span className="tk-edited-text">{tC.editedBadge}</span>
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
                                                {savingEdit ? tC.savingBtn : tC.saveBtn}
                                              </button>
                                              <button
                                                type="button"
                                                className="tk-btn-cancel"
                                                onClick={() => setEditingCommentId(null)}
                                              >
                                                {tC.cancelBtn}
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
                                                {isReplyTextExpanded ? tC.collapseText : tC.expandText}
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
                                              aria-label={tC.likeAria}
                                              title={
                                                replyRxMeta.totalCount > 0
                                                  ? tC.likeTitleWithCount(replyRxMeta.entries.map(([e, c]) => `${e} ${c}`).join(' '))
                                                  : tC.likeTitleEmpty
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
                                                <div className="tk-reaction-bubble-title">{tC.reactionPickerTitle}</div>
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
                                            aria-label={tC.replyToUserAria(reply.authorName)}
                                            title={tC.replyToUserTitle(reply.authorName)}
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
                                            aria-label={tC.boostActionAria}
                                            title={tC.boostActionTitle}
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
                                            aria-label={tC.quoteActionAria}
                                            title={tC.quoteActionTitle}
                                            onClick={() => handleQuoteClick(reply)}
                                          >
                                            <Quote size={14} className="tk-action-svg" />
                                          </button>
                                          {isReplyManageable && (
                                            <>
                                              <button
                                                type="button"
                                                className="tk-action-btn tk-action-edit"
                                                aria-label={tC.editActionAria}
                                                title={tC.editActionTitle}
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
                                                aria-label={tC.deleteActionAria}
                                                title={tC.deleteActionTitle}
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
                      <Vote size={16} /> {tC.modalPollTitle}
                    </>
                  )}
                  {activeModal === 'table' && (
                    <>
                      <Table size={16} /> {tC.modalTableTitle}
                    </>
                  )}
                  {activeModal === 'toc' && (
                    <>
                      <ListOrdered size={16} /> {tC.modalTocTitle}
                    </>
                  )}
                  {activeModal === 'details' && (
                    <>
                      <ChevronRight size={16} /> {tC.modalDetailsTitle}
                    </>
                  )}
                  {activeModal === 'spoiler' && (
                    <>
                      <EyeOff size={16} /> {tC.modalSpoilerTitle}
                    </>
                  )}
                  {activeModal === 'math' && (
                    <>
                      <Sigma size={16} /> {tC.modalMathTitle}
                    </>
                  )}
                  {activeModal === 'scroll' && (
                    <>
                      <ScrollText size={16} /> {tC.modalScrollTitle}
                    </>
                  )}
                  {activeModal === 'callout' && (
                    <>
                      <Layers size={16} /> {tC.modalCalloutTitle}
                    </>
                  )}
                  {activeModal === 'mermaid' && (
                    <>
                      <GitFork size={16} /> {tC.modalMermaidTitle}
                    </>
                  )}
                  {activeModal === 'chart' && (
                    <>
                      <BarChart3 size={16} /> {tC.modalChartTitle}
                    </>
                  )}
                  {activeModal === 'graphviz' && (
                    <>
                      <Share2 size={16} /> {tC.modalGraphvizTitle}
                    </>
                  )}
                  {activeModal === 'datetime' && (
                    <>
                      <Clock size={16} /> {tC.modalDatetimeTitle}
                    </>
                  )}
                  {activeModal === 'template' && (
                    <>
                      <LayoutTemplate size={16} /> {tC.modalTemplateTitle}
                    </>
                  )}
                  {activeModal === 'footnote' && (
                    <>
                      <Bookmark size={16} /> {tC.modalFootnoteTitle}
                    </>
                  )}
                  {activeModal === 'image' && (
                    <>
                      <ImageIcon size={16} /> {tC.modalImageTitle}
                    </>
                  )}
                </h4>
                <button
                  type="button"
                  className="tk-tool-modal-close"
                  onClick={() => setActiveModal(null)}
                  title={tC.modalClose}
                  aria-label={tC.modalClose}
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
                        <div className="tk-modal-rule-title">{tC.pollRuleTitle}</div>
                        <div className="tk-modal-rule-text">
                          {tC.pollRuleText}
                        </div>
                      </div>
                    </div>
                    <div className="tk-modal-field">
                      <label className="tk-modal-label">{tC.pollQuestionLabel}</label>
                      <input
                        type="text"
                        className="tk-modal-input"
                        value={modalPollQuestion}
                        onChange={(e) => setModalPollQuestion(e.target.value)}
                        placeholder={tC.pollQuestionPlaceholder}
                        autoFocus
                      />
                    </div>
                    <div className="tk-modal-field">
                      <label className="tk-modal-label">{tC.pollOptionsLabel}</label>
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
                              placeholder={tC.modalOptionPlaceholder(idx + 1)}
                            />
                            {modalPollOptions.length > 2 && (
                              <button
                                type="button"
                                className="tk-modal-btn-del"
                                onClick={() => {
                                  setModalPollOptions(modalPollOptions.filter((_, i) => i !== idx));
                                }}
                                title={tC.modalDeleteOption}
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
                            setModalPollOptions([...modalPollOptions, tC.modalOptionPlaceholder(modalPollOptions.length + 1)])
                          }
                        >
                          <Plus size={13} /> {tC.modalAddOption}
                        </button>
                      )}
                    </div>
                    <div className="tk-modal-field">
                      <label className="tk-modal-label">{tC.pollMechanismLabel}</label>
                      <div className="tk-modal-radio-group">
                        <label className="tk-modal-radio">
                          <input
                            type="radio"
                            name="pollType"
                            value="regular"
                            checked={modalPollType === 'regular'}
                            onChange={() => setModalPollType('regular')}
                          />
                          <span>{tC.modalPollTypeRegular}</span>
                        </label>
                        <label className="tk-modal-radio">
                          <input
                            type="radio"
                            name="pollType"
                            value="multiple"
                            checked={modalPollType === 'multiple'}
                            onChange={() => setModalPollType('multiple')}
                          />
                          <span>{tC.modalPollTypeMultiple}</span>
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
                        <div className="tk-modal-rule-title">{tC.tableRuleTitle}</div>
                        <div className="tk-modal-rule-text">
                          {tC.tableRuleText}
                        </div>
                      </div>
                    </div>
                    <div className="tk-modal-row-grid">
                      <div className="tk-modal-field">
                        <label className="tk-modal-label">{tC.tableRowsLabel}</label>
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
                        <label className="tk-modal-label">{tC.tableColsLabel}</label>
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
                              Array.from({ length: val }, (_, i) => prev[i] || tC.modalColumnDefaultTitle(i + 1))
                            );
                          }}
                        />
                      </div>
                    </div>
                    <div className="tk-modal-field">
                      <label className="tk-modal-label">{tC.tableCustomHeadersLabel}</label>
                      <div className="tk-modal-table-headers-grid">
                        {Array.from({ length: modalTableCols }, (_, i) => (
                          <div key={i} className="tk-modal-header-item">
                            <input
                              type="text"
                              className="tk-modal-input"
                              value={modalTableHeaders[i] || tC.modalColumnDefaultTitle(i + 1)}
                              onChange={(e) => {
                                const next = [...modalTableHeaders];
                                next[i] = e.target.value;
                                setModalTableHeaders(next);
                              }}
                              placeholder={tC.modalColumnPlaceholder(i + 1)}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="tk-modal-field">
                      <label className="tk-modal-label">{tC.tablePreviewLabel}</label>
                      <pre className="tk-modal-preview-box">
{`| ${Array.from({ length: modalTableCols }, (_, i) => modalTableHeaders[i] || tC.modalColumnDefaultTitle(i + 1)).join(' | ')} |
| ${Array(modalTableCols).fill('---').join(' | ')} |
${Array.from({ length: modalTableRows }, (_, r) => `| ${Array.from({ length: modalTableCols }, (_, c) => tC.modalTableDataSample(r + 1, c + 1)).join(' | ')} |`).join('\n')}`}
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
                        <div className="tk-modal-rule-title">{tC.tocRuleTitle}</div>
                        <div className="tk-modal-rule-text">
                          {tC.tocRuleText}
                        </div>
                      </div>
                    </div>
                    <div className="tk-modal-field">
                      <label className="tk-modal-label">{tC.tocSkeletonLabel}</label>
                      <label className="tk-modal-radio" style={{ marginTop: '4px' }}>
                        <input
                          type="checkbox"
                          checked={modalTocIncludeHeaders}
                          onChange={(e) => setModalTocIncludeHeaders(e.target.checked)}
                        />
                        <span>{tC.tocIncludeHeadersCheckbox}</span>
                      </label>
                    </div>
                    <div className="tk-modal-field">
                      <label className="tk-modal-label">{tC.tocPreviewLabel}</label>
                      <pre className="tk-modal-preview-box">
{modalTocIncludeHeaders ? tC.tocSampleText : `[TOC]`}
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
                        <div className="tk-modal-rule-title">{tC.mermaidRuleTitle}</div>
                        <div className="tk-modal-rule-text">
                          {tC.mermaidRuleText}
                        </div>
                      </div>
                    </div>
                    <div className="tk-modal-field">
                      <label className="tk-modal-label">{tC.mermaidTypeLabel}</label>
                      <div className="tk-modal-type-chips">
                        {(['flowchart', 'sequence', 'gantt', 'class', 'pie', 'state'] as const).map((t) => (
                          <button
                            key={t}
                            type="button"
                            className={`tk-modal-chip-btn ${modalMermaidType === t ? 'is-active' : ''}`}
                            onClick={() => openMermaidModal(t)}
                          >
                            {t === 'flowchart' && tC.mermaidTypeFlowchart}
                            {t === 'sequence' && tC.mermaidTypeSequence}
                            {t === 'gantt' && tC.mermaidTypeGantt}
                            {t === 'class' && tC.mermaidTypeClass}
                            {t === 'pie' && tC.mermaidTypePie}
                            {t === 'state' && tC.mermaidTypeState}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="tk-modal-field">
                      <label className="tk-modal-label">{tC.mermaidCodeLabel}</label>
                      <textarea
                        className="tk-modal-textarea"
                        rows={7}
                        value={modalMermaidCode}
                        onChange={(e) => setModalMermaidCode(e.target.value)}
                        placeholder={tC.mermaidCodePlaceholder}
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
                        <div className="tk-modal-rule-title">{tC.chartRuleTitle}</div>
                        <div className="tk-modal-rule-text">
                          {tC.chartRuleText}
                        </div>
                      </div>
                    </div>
                    <div className="tk-modal-field">
                      <label className="tk-modal-label">{tC.chartPresetLabel}</label>
                      <div className="tk-modal-type-chips">
                        {(['bar', 'line', 'pie'] as const).map((ct) => (
                          <button
                            key={ct}
                            type="button"
                            className={`tk-modal-chip-btn ${modalChartType === ct ? 'is-active' : ''}`}
                            onClick={() => openChartModal(ct)}
                          >
                            {ct === 'bar' && tC.chartTypeBar}
                            {ct === 'line' && tC.chartTypeLine}
                            {ct === 'pie' && tC.chartTypePie}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="tk-modal-field">
                      <label className="tk-modal-label">{tC.chartConfigLabel}</label>
                      <textarea
                        className="tk-modal-textarea"
                        rows={7}
                        value={modalChartCode}
                        onChange={(e) => setModalChartCode(e.target.value)}
                        placeholder={tC.chartConfigPlaceholder}
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
                        <div className="tk-modal-rule-title">{tC.graphvizRuleTitle}</div>
                        <div className="tk-modal-rule-text">
                          {tC.graphvizRuleText}
                        </div>
                      </div>
                    </div>
                    <div className="tk-modal-field">
                      <label className="tk-modal-label">{tC.graphvizCategoryLabel}</label>
                      <div className="tk-modal-type-chips">
                        <button
                          type="button"
                          className={`tk-modal-chip-btn ${modalGraphvizType === 'digraph' ? 'is-active' : ''}`}
                          onClick={() => openGraphvizModal('digraph')}
                        >
                          {tC.graphvizDigraph}
                        </button>
                        <button
                          type="button"
                          className={`tk-modal-chip-btn ${modalGraphvizType === 'graph' ? 'is-active' : ''}`}
                          onClick={() => openGraphvizModal('graph')}
                        >
                          {tC.graphvizGraph}
                        </button>
                      </div>
                    </div>
                    <div className="tk-modal-field">
                      <label className="tk-modal-label">{tC.graphvizCodeLabel}</label>
                      <textarea
                        className="tk-modal-textarea"
                        rows={6}
                        value={modalGraphvizCode}
                        onChange={(e) => setModalGraphvizCode(e.target.value)}
                        placeholder={tC.graphvizCodePlaceholder}
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
                        <div className="tk-modal-rule-title">{tC.detailsRuleTitle}</div>
                        <div className="tk-modal-rule-text">
                          {tC.detailsRuleText}
                        </div>
                      </div>
                    </div>
                    <div className="tk-modal-field">
                      <label className="tk-modal-label">{tC.detailsSummaryLabel}</label>
                      <input
                        type="text"
                        className="tk-modal-input"
                        value={modalDetailsSummary}
                        onChange={(e) => setModalDetailsSummary(e.target.value)}
                        placeholder={tC.detailsSummaryPlaceholder}
                        autoFocus
                      />
                    </div>
                    <div className="tk-modal-field">
                      <label className="tk-modal-label">{tC.detailsContentLabel}</label>
                      <textarea
                        className="tk-modal-textarea"
                        rows={5}
                        value={modalDetailsContent}
                        onChange={(e) => setModalDetailsContent(e.target.value)}
                        placeholder={tC.detailsContentPlaceholder}
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
                        <div className="tk-modal-rule-title">{tC.spoilerRuleTitle}</div>
                        <div className="tk-modal-rule-text">
                          {tC.spoilerRuleText}
                        </div>
                      </div>
                    </div>
                    <div className="tk-modal-field">
                      <label className="tk-modal-label">{tC.spoilerTextLabel}</label>
                      <textarea
                        className="tk-modal-textarea"
                        rows={3}
                        value={modalSpoilerText}
                        onChange={(e) => setModalSpoilerText(e.target.value)}
                        placeholder={tC.spoilerTextPlaceholder}
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
                        <div className="tk-modal-rule-title">{tC.mathRuleTitle}</div>
                        <div className="tk-modal-rule-text">
                          {tC.mathRuleText}
                        </div>
                      </div>
                    </div>
                    <div className="tk-modal-field">
                      <label className="tk-modal-label">{tC.mathFormulaLabel}</label>
                      <textarea
                        className="tk-modal-textarea"
                        rows={3}
                        value={modalMathFormula}
                        onChange={(e) => setModalMathFormula(e.target.value)}
                        placeholder={tC.mathFormulaPlaceholder}
                        autoFocus
                      />
                    </div>
                    <div className="tk-modal-field">
                      <label className="tk-modal-label">{tC.mathQuickTemplatesLabel}</label>
                      <div className="tk-modal-quick-math">
                        <button type="button" onClick={() => setModalMathFormula('\\frac{a}{b}')}>{tC.mathFraction}</button>
                        <button type="button" onClick={() => setModalMathFormula('\\sqrt{x}')}>{tC.mathSqrt}</button>
                        <button type="button" onClick={() => setModalMathFormula('\\sum_{i=1}^{n} x_i')}>{tC.mathSum}</button>
                        <button type="button" onClick={() => setModalMathFormula('\\int_{a}^{b} f(x)dx')}>{tC.mathIntegral}</button>
                        <button type="button" onClick={() => setModalMathFormula('\\lim_{x \\to \\infty} f(x)')}>{tC.mathLimit}</button>
                        <button type="button" onClick={() => setModalMathFormula('\\begin{matrix} a & b \\\\ c & d \\end{matrix}')}>{tC.mathMatrix}</button>
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
                        <div className="tk-modal-rule-title">{tC.scrollRuleTitle}</div>
                        <div className="tk-modal-rule-text">
                          {tC.scrollRuleText}
                        </div>
                      </div>
                    </div>
                    <div className="tk-modal-field">
                      <label className="tk-modal-label">{tC.scrollMaxHeightLabel}</label>
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
                      <label className="tk-modal-label">{tC.scrollContentLabel}</label>
                      <textarea
                        className="tk-modal-textarea"
                        rows={5}
                        value={modalScrollContent}
                        onChange={(e) => setModalScrollContent(e.target.value)}
                        placeholder={tC.scrollContentPlaceholder}
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
                        <div className="tk-modal-rule-title">{tC.datetimeRuleTitle}</div>
                        <div className="tk-modal-rule-text">
                          {tC.datetimeRuleText}
                        </div>
                      </div>
                    </div>
                    <div className="tk-modal-field">
                      <label className="tk-modal-label">{tC.datetimeQuickLabel}</label>
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
                          {tC.datetimeFull}
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
                          {tC.datetimeDate}
                        </button>
                      </div>
                    </div>
                    <div className="tk-modal-field">
                      <label className="tk-modal-label">{tC.datetimeValueLabel}</label>
                      <input
                        type="text"
                        className="tk-modal-input"
                        value={modalDatetimeCustom}
                        onChange={(e) => setModalDatetimeCustom(e.target.value)}
                        placeholder={tC.datetimeValuePlaceholder}
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
                        <div className="tk-modal-rule-title">{tC.templateRuleTitle}</div>
                        <div className="tk-modal-rule-text">
                          {tC.templateRuleText}
                        </div>
                      </div>
                    </div>
                    <div className="tk-modal-field">
                      <label className="tk-modal-label">{tC.templateScenarioLabel}</label>
                      <div className="tk-modal-type-chips">
                        <button
                          type="button"
                          className={`tk-modal-chip-btn ${modalTemplateType === 'tech' ? 'is-active' : ''}`}
                          onClick={() => setModalTemplateType('tech')}
                        >
                          {tC.templateTech}
                        </button>
                        <button
                          type="button"
                          className={`tk-modal-chip-btn ${modalTemplateType === 'bug' ? 'is-active' : ''}`}
                          onClick={() => setModalTemplateType('bug')}
                        >
                          {tC.templateBug}
                        </button>
                        <button
                          type="button"
                          className={`tk-modal-chip-btn ${modalTemplateType === 'opinion' ? 'is-active' : ''}`}
                          onClick={() => setModalTemplateType('opinion')}
                        >
                          {tC.templateOpinion}
                        </button>
                      </div>
                    </div>
                    <div className="tk-modal-field">
                      <label className="tk-modal-label">{tC.templatePreviewLabel}</label>
                      <pre className="tk-modal-preview-box">
{modalTemplateType === 'tech' && tC.templateTechSample}
{modalTemplateType === 'bug' && tC.templateBugSample}
{modalTemplateType === 'opinion' && tC.templateOpinionSample}
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
                        <div className="tk-modal-rule-title">{tC.footnoteRuleTitle}</div>
                        <div className="tk-modal-rule-text">
                          {tC.footnoteRuleText}
                        </div>
                      </div>
                    </div>
                    <div className="tk-modal-field">
                      <label className="tk-modal-label">{tC.footnoteIdLabel}</label>
                      <input
                        type="text"
                        className="tk-modal-input"
                        value={modalFootnoteId}
                        onChange={(e) => setModalFootnoteId(e.target.value)}
                        placeholder={tC.footnoteIdPlaceholder}
                        autoFocus
                      />
                    </div>
                    <div className="tk-modal-field">
                      <label className="tk-modal-label">{tC.footnoteContentLabel}</label>
                      <textarea
                        className="tk-modal-textarea"
                        rows={3}
                        value={modalFootnoteContent}
                        onChange={(e) => setModalFootnoteContent(e.target.value)}
                        placeholder={tC.footnoteContentPlaceholder}
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
                        <div className="tk-modal-rule-title">{tC.calloutRuleTitle}</div>
                        <div className="tk-modal-rule-text">
                          {tC.calloutRuleText}
                        </div>
                      </div>
                    </div>
                    <div className="tk-modal-field">
                      <label className="tk-modal-label">{tC.calloutStyleLabel}</label>
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
                      <label className="tk-modal-label">{tC.calloutTitleLabel}</label>
                      <input
                        type="text"
                        className="tk-modal-input"
                        value={modalCalloutTitle}
                        onChange={(e) => setModalCalloutTitle(e.target.value)}
                        placeholder={tC.calloutTitlePlaceholder}
                      />
                    </div>
                    <div className="tk-modal-field">
                      <label className="tk-modal-label">{tC.calloutContentLabel}</label>
                      <textarea
                        className="tk-modal-textarea"
                        rows={3}
                        value={modalCalloutContent}
                        onChange={(e) => setModalCalloutContent(e.target.value)}
                        placeholder={tC.calloutContentPlaceholder}
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
                        <div className="tk-modal-rule-title">{tC.imageRuleTitle}</div>
                        <div className="tk-modal-rule-text">
                          {tC.imageRuleText}
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
                        <Upload size={14} /> {tC.imageTabUpload}
                      </button>
                      <button
                        type="button"
                        className={`tk-modal-tab-btn ${modalImageTab === 'guide' ? 'is-active' : ''}`}
                        onClick={() => setModalImageTab('guide')}
                      >
                        <FileText size={14} /> {tC.imageTabGuide}
                      </button>
                      <button
                        type="button"
                        className={`tk-modal-tab-btn ${modalImageTab === 'url' ? 'is-active' : ''}`}
                        onClick={() => setModalImageTab('url')}
                      >
                        <Link size={14} /> {tC.imageTabUrl}
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
                              <img src={modalImageUrl} alt={tC.imagePreviewAlt} className="tk-uploaded-preview-img" />
                            </div>
                            <div className="tk-uploaded-preview-info">
                              <div className="tk-uploaded-status-badge">
                                <CheckCircle2 size={13} />
                                <span>{tC.imageStatusUploaded}</span>
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
                                  {tC.imageReselectBtn}
                                </button>
                                <button
                                  type="button"
                                  className="tk-uploaded-remove-btn"
                                  onClick={() => {
                                    setModalImageUrl('');
                                    setModalImageAlt('');
                                  }}
                                >
                                  {tC.imageRemoveBtn}
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
                            }}
                          >
                            {isUploadingImage ? (
                              <div className="tk-dropzone-loading">
                                <div className="tk-dropzone-spinner" />
                                <p className="tk-dropzone-loading-title">{tC.imageLoadingTitle}</p>
                                <p className="tk-dropzone-loading-desc">{tC.imageLoadingDesc}</p>
                              </div>
                            ) : (
                              <div className="tk-dropzone-content">
                                <div className="tk-dropzone-icon-wrap">
                                  <Upload size={24} className="tk-dropzone-icon" />
                                </div>
                                <p className="tk-dropzone-primary-text">
                                  <strong>{tC.imageDropzonePrimary}</strong>{tC.imageDropzoneOrDrag}
                                </p>
                                <p className="tk-dropzone-hint-text">
                                  {tC.imageDropzoneHint}
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
                          <label className="tk-modal-label">{tC.imageAltLabel}</label>
                          <input
                            type="text"
                            className="tk-modal-input"
                            value={modalImageAlt}
                            onChange={(e) => setModalImageAlt(e.target.value)}
                            placeholder={tC.imageAltPlaceholder}
                          />
                        </div>
                      </div>
                    )}

                    {modalImageTab === 'guide' && (
                      <div className="tk-image-guide-tab-pane">
                        <div className="tk-guide-grid">
                          <div className="tk-guide-card">
                            <div className="tk-guide-card-head">
                              <span className="tk-guide-step-badge">{tC.imageGuide1Badge}</span>
                              <strong className="tk-guide-card-title">{tC.imageGuide1Title}</strong>
                            </div>
                            <p className="tk-guide-card-desc">
                              {tC.imageGuide1Desc}
                            </p>
                            <div className="tk-guide-keyboard-row">
                              <kbd className="tk-guide-kbd">Ctrl</kbd> + <kbd className="tk-guide-kbd">V</kbd>
                              <span className="tk-guide-kbd-arrow">➜</span>
                              <span className="tk-guide-kbd-result">{tC.imageGuide1Result}</span>
                            </div>
                          </div>

                          <div className="tk-guide-card">
                            <div className="tk-guide-card-head">
                              <span className="tk-guide-step-badge">{tC.imageGuide2Badge}</span>
                              <strong className="tk-guide-card-title">{tC.imageGuide2Title}</strong>
                            </div>
                            <p className="tk-guide-card-desc">
                              {tC.imageGuide2Desc}
                            </p>
                          </div>

                          <div className="tk-guide-card">
                            <div className="tk-guide-card-head">
                              <span className="tk-guide-step-badge">{tC.imageGuide3Badge}</span>
                              <strong className="tk-guide-card-title">{tC.imageGuide3Title}</strong>
                            </div>
                            <p className="tk-guide-card-desc">
                              {tC.imageGuide3Desc}
                            </p>
                            <pre className="tk-guide-code"><code>{tC.imageGuide3Sample}</code></pre>
                          </div>
                        </div>
                      </div>
                    )}

                    {modalImageTab === 'url' && (
                      <div className="tk-image-url-tab-pane">
                        <div className="tk-modal-field">
                          <label className="tk-modal-label">{tC.imageUrlLabel}</label>
                          <input
                            type="url"
                            className="tk-modal-input"
                            value={modalImageUrl}
                            onChange={(e) => setModalImageUrl(e.target.value)}
                            placeholder={tC.imageUrlPlaceholder}
                            autoFocus
                          />
                        </div>
                        <div className="tk-modal-field">
                          <label className="tk-modal-label">{tC.imageAltLabel}</label>
                          <input
                            type="text"
                            className="tk-modal-input"
                            value={modalImageAlt}
                            onChange={(e) => setModalImageAlt(e.target.value)}
                            placeholder={tC.imageUrlAltPlaceholder}
                          />
                        </div>
                        {modalImageUrl && (
                          <div className="tk-url-preview-box">
                            <span className="tk-url-preview-label">{tC.imageExternalPreviewLabel}</span>
                            <img
                              src={modalImageUrl}
                              alt={modalImageAlt || tC.imageExternalPreviewAlt}
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
                  {tC.modalCancel}
                </button>
                <button
                  type="button"
                  className="tk-modal-btn tk-modal-btn-confirm"
                  onClick={handleConfirmModal}
                >
                  {tC.modalConfirm}
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* Author Profile Popover */}
      {typeof document !== 'undefined' &&
        profilePopover.isOpen &&
        profilePopover.author &&
        profilePopover.anchorRect &&
        createPortal(
          <div
            className={`author-profile-popover ${profilePopover.isPinned ? 'is-pinned' : ''} ${
              profilePopover.author.isWebmaster ? 'is-webmaster-card' : ''
            }`}
            style={(() => {
              const rect = profilePopover.anchorRect!;
              const popoverWidth = 320;
              const margin = 12;

              let left = rect.left + rect.width / 2 - popoverWidth / 2;
              if (typeof window !== 'undefined') {
                if (left < margin) left = margin;
                if (left + popoverWidth > window.innerWidth - margin) {
                  left = window.innerWidth - popoverWidth - margin;
                }
              }

              const popoverHeight = 310;
              let top = rect.top - popoverHeight - 12;
              if (top < margin) {
                top = rect.bottom + 12;
              }

              return {
                position: 'fixed',
                left: `${Math.round(left)}px`,
                top: `${Math.round(top)}px`,
                width: `${popoverWidth}px`,
                zIndex: 9999,
              };
            })()}
            onMouseEnter={() => {
              if (hoverCloseTimerRef.current) {
                clearTimeout(hoverCloseTimerRef.current);
                hoverCloseTimerRef.current = null;
              }
            }}
            onMouseLeave={() => {
              if (!profilePopover.isPinned) {
                hoverCloseTimerRef.current = setTimeout(() => {
                  setProfilePopover((prev) => ({ ...prev, isOpen: false }));
                }, 350);
              }
            }}
          >
            <div className="profile-popover-inner">
              {/* Header: Avatar, Name, Badges & Close Button */}
              <div className="profile-popover-header">
                <div
                  className={`profile-popover-avatar ${
                    profilePopover.author.isWebmaster ? 'is-webmaster-avatar' : 'is-user-avatar'
                  }`}
                >
                  {profilePopover.author.avatar ? (
                    <img src={profilePopover.author.avatar} alt={profilePopover.author.name} />
                  ) : profilePopover.author.isWebmaster ? (
                    <img src="/media/shijianus/avatar.jpg" alt={profilePopover.author.name} />
                  ) : (
                    <span className="profile-popover-initials">
                      {getCommentInitials(profilePopover.author.name)}
                    </span>
                  )}
                  {profilePopover.author.isWebmaster && (
                    <span className="profile-popover-avatar-badge" title="站长专属身份">
                      <Crown size={12} />
                    </span>
                  )}
                </div>

                <div className="profile-popover-identity">
                  <div className="profile-popover-name-row">
                    <span className="profile-popover-name">{profilePopover.author.name}</span>
                    {profilePopover.author.isWebmaster ? (
                      <span className="profile-popover-badge is-webmaster">
                        <Crown size={11} /> 站长
                      </span>
                    ) : (
                      <span className="profile-popover-badge is-role">
                        {profilePopover.author.role === 'admin'
                          ? '管理员'
                          : profilePopover.author.role === 'reader'
                          ? '注册读者'
                          : '访客'}
                      </span>
                    )}
                  </div>

                  <div className="profile-popover-level-row">
                    <span className="profile-popover-badge is-level">
                      {profilePopover.author.levelInfo.badge}
                    </span>
                    <span className="profile-popover-badge is-trust">
                      TL.{profilePopover.author.levelInfo.trustLevel}
                    </span>
                    {profilePopover.author.ipCountryFlag && (
                      <span
                        className="profile-popover-badge is-geo"
                        title={profilePopover.author.ipLocation || profilePopover.author.ipCountryName || ''}
                      >
                        {profilePopover.author.ipCountryFlag} {profilePopover.author.ipCountryName || ''}
                      </span>
                    )}
                  </div>
                </div>

                {profilePopover.isPinned && (
                  <button
                    type="button"
                    className="profile-popover-close-btn"
                    onClick={() => setProfilePopover((prev) => ({ ...prev, isOpen: false, isPinned: false }))}
                    aria-label="关闭名片"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              {/* Bio / 个人介绍 */}
              <div className="profile-popover-bio">
                {profilePopover.author.bio || (
                  <span className="profile-popover-bio-empty">这位读者很低调，暂未留下介绍</span>
                )}
              </div>

              {/* Epomail 邮箱绑定状态 (支持完全独立工作) */}
              <div className="profile-popover-email-box">
                <div className="profile-popover-email-header">
                  <span className="profile-popover-section-label">
                    <Mail size={12} /> 电子邮箱 / Epomail
                  </span>
                  {profilePopover.author.email?.toLowerCase().endsWith('@epomail.bond') ? (
                    <span className="profile-popover-epomail-tag">Epomail 认证</span>
                  ) : profilePopover.author.email ? (
                    <span className="profile-popover-mail-tag">已验证</span>
                  ) : (
                    <span className="profile-popover-mail-tag is-offline">独立模式 / 未绑定</span>
                  )}
                </div>
                {profilePopover.author.email ? (
                  <div className="profile-popover-email-row">
                    <span className="profile-popover-email-text" title={profilePopover.author.email}>
                      {profilePopover.author.email}
                    </span>
                    <button
                      type="button"
                      className="profile-popover-copy-btn"
                      onClick={() => handleCopyEmail(profilePopover.author!.email!)}
                      title="复制邮箱地址"
                    >
                      {copiedEmail ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                      <span>{copiedEmail ? '已复制' : '复制'}</span>
                    </button>
                  </div>
                ) : (
                  <div className="profile-popover-email-notice">
                    访客未公开邮箱或处于 Epomail 离线模式
                  </div>
                )}
              </div>

              {/* 所属群组 / 用户组 (如果公开的话) */}
              {profilePopover.author.groups && profilePopover.author.groups.length > 0 && (
                <div className="profile-popover-groups-box">
                  <div className="profile-popover-section-label">
                    <Shield size={12} /> 所属群组
                  </div>
                  <div className="profile-popover-groups-list">
                    {profilePopover.author.groups.map((group, idx) => (
                      <span key={idx} className="profile-popover-group-pill">
                        {group}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* 行为指标统计 */}
              <div className="profile-popover-stats-grid">
                <div className="profile-popover-stat-item">
                  <span className="stat-label">阅读时长</span>
                  <span className="stat-value">{profilePopover.author.levelInfo.readingMinutes}m</span>
                </div>
                <div className="profile-popover-stat-item">
                  <span className="stat-label">互动评论</span>
                  <span className="stat-value">{profilePopover.author.levelInfo.commentCount}</span>
                </div>
                <div className="profile-popover-stat-item">
                  <span className="stat-label">收到获赞</span>
                  <span className="stat-value">{profilePopover.author.levelInfo.reactionsReceived}</span>
                </div>
              </div>

              {/* Actions: @Mention & Website */}
              <div className="profile-popover-footer">
                <button
                  type="button"
                  className="profile-popover-action-btn is-mention"
                  onClick={() => handleQuickMentionAuthor(profilePopover.author!.name)}
                >
                  <AtSign size={13} />
                  <span>提及此人</span>
                </button>
                {profilePopover.author.website && (
                  <a
                    href={profilePopover.author.website}
                    target="_blank"
                    rel="noopener noreferrer nofollow"
                    className="profile-popover-action-btn is-website"
                    title="访问主页"
                  >
                    <Globe size={13} />
                    <span>个人站点</span>
                  </a>
                )}
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
