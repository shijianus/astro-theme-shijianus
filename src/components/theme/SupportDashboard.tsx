import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Coffee,
  CreditCard,
  Heart,
  ExternalLink,
  Search,
  ChevronDown,
  Coins,
  ArrowRight,
  Maximize2,
  X,
  ChevronLeft,
  ChevronRight,
  Check,
  Copy,
  Users,
  Sparkles,
} from 'lucide-react';
import {
  supportConfig,
  type SponsorItem,
  getLocalCurrencyByCountry,
  convertByLocalPPP,
} from '../../config/support';
import { readStoredLocaleVariant, normaliseLocaleVariant, getI18nText, convertText, type LocaleVariant } from '../../lib/client-locale';

/* ── SVG Brand Icons ── */
const WeChatIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path
      d="M8.691 2.188C3.891 2.188 0 5.478 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 0 1 .213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.294.295a.34.34 0 0 0 .17-.05l1.92-1.11c.176-.102.383-.127.577-.07 1.05.31 2.18.48 3.35.48.33 0 .66-.014.99-.044a6.66 6.66 0 0 1-.29-1.956c0-3.66 3.49-6.63 7.79-6.63.29 0 .58.014.86.042C17.65 5.86 13.56 2.188 8.69 2.188zm-2.4 4.54a1.09 1.09 0 1 1 0 2.18 1.09 1.09 0 0 1 0-2.18zm5.09 0a1.09 1.09 0 1 1 0 2.18 1.09 1.09 0 0 1 0-2.18zm4.81 4.72c-3.69 0-6.69 2.54-6.69 5.67 0 1.72.9 3.27 2.33 4.32.13.09.21.25.17.41l-.3 1.15c-.01.05-.03.11-.03.17 0 .13.1.23.23.23.05 0 .09-.01.13-.04l1.5-.86c.14-.08.3-.1.45-.06.71.21 1.48.33 2.28.33 3.69 0 6.69-2.54 6.69-5.67s-3-5.67-6.69-5.67zm-2.22 3.55a.85.85 0 1 1 0 1.7.85.85 0 0 1 0-1.7zm3.96 0a.85.85 0 1 1 0 1.7.85.85 0 0 1 0-1.7z"
      fill="#07C160"
    />
  </svg>
);

const AlipayIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path
      d="M21.422 17.568c-1.78-1.077-3.957-2.094-5.328-2.613.82-1.92 1.423-4.04 1.706-6.313H21.5V6.75h-5.068C16.143 3.86 14.89 1.83 14.89 1.83l-2.02.94s1.082 1.684 1.393 3.98H8.5V4.75H6.25v2H1.5v1.892h10.457c-.244 1.785-.722 3.488-1.393 5.06-2.05-.733-4.467-1.332-6.527-.852-2.915.682-4.54 2.875-4.015 5.342.502 2.36 2.84 3.758 5.767 3.758 3.593 0 6.467-1.892 8.358-4.417 2.19 1.05 5.08 2.22 7.275 3.01l.957-1.975h-.95zM7.227 20.06c-2.08 0-3.69-.948-3.972-2.274-.298-1.405.578-2.628 2.378-3.05 1.63-.38 3.65.17 5.405.85-1.075 2.518-2.507 4.474-3.81 4.474z"
      fill="#1677FF"
    />
  </svg>
);

const PayPalIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path
      d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.286-.023.143-.05.288-.082.434-.848 4.248-3.47 6.425-7.79 6.425H9.684l-1.393 7.84a.641.641 0 0 1-.633.542h-.582z"
      fill="#003087"
    />
    <path
      d="M9.13 8.955h2.604c2.88 0 4.63-.45 5.2-2.316.516-1.687.11-2.91-1.205-3.64C14.77 2.47 13.06 2.3 10.96 2.3H6.84a.64.64 0 0 0-.632.542L4.032 17.5a.64.64 0 0 0 .633.74h3.19l1.275-9.285z"
      fill="#0079C1"
    />
  </svg>
);

const UsdtIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <circle cx="12" cy="12" r="11" fill="#26A17B" />
    <path
      d="M12.75 6.75h4.5v2.25h-3.375v1.275c2.46.12 4.35.615 4.35 1.23 0 .615-1.89 1.11-4.35 1.23V18h-2.25v-5.265c-2.46-.12-4.35-.615-4.35-1.23 0-.615 1.89-1.11 4.35-1.23V9H8.25V6.75h4.5z"
      fill="#FFFFFF"
    />
  </svg>
);

/* ── 6 个档位专属现代极简咖啡矢量徽标 (方案 A：100% 极简几何、单色微拟物与浮水印质感) ── */

/** Tier 0 (RM3 / $1 / ¥4): 便捷速溶咖啡条与小纸杯 (轻盈便捷的每日第一口咖啡) */
const SceneInstantCoffee: React.FC<{ isSelected?: boolean }> = () => (
  <svg viewBox="0 0 48 48" className="w-8 h-8 sm:w-8.5 sm:h-8.5 transition-transform duration-300 group-hover:scale-110" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* 便捷速溶小纸杯 */}
    <path d="M 23 23 L 26 41 C 26 42.2, 40 42.2, 40 41 L 43 23 Z" fill="currentColor" fillOpacity="0.12" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
    <path d="M 24.5 28 L 26 37 C 28.5 37.8, 37.5 37.8, 40 37 L 41.5 28 Z" fill="currentColor" fillOpacity="0.22" stroke="currentColor" strokeWidth="1" />
    <ellipse cx="33" cy="23" rx="10" ry="2.8" fill="currentColor" fillOpacity="0.3" stroke="currentColor" strokeWidth="1.6" />
    {/* 倾斜速溶包装条 */}
    <rect x="7" y="11" width="22" height="7" rx="1.5" transform="rotate(-34 7 11)" fill="currentColor" fillOpacity="0.25" stroke="currentColor" strokeWidth="1.8" />
    <line x1="12" y1="12" x2="16" y2="17" stroke="currentColor" strokeWidth="1.2" strokeOpacity="0.6" />
    <circle cx="21" cy="21" r="1.1" fill="currentColor" />
    <circle cx="24" cy="25" r="0.9" fill="currentColor" />
  </svg>
);

/** Tier 1 (RM8 / $2.5 / ¥9): 经典商品外带咖啡纸杯 (工位与街角随行现磨美式) */
const SceneTakeawayCup: React.FC<{ isSelected?: boolean }> = () => (
  <svg viewBox="0 0 48 48" className="w-8 h-8 sm:w-8.5 sm:h-8.5 transition-transform duration-300 group-hover:scale-110" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* 外带纸杯身 */}
    <path d="M 16 16 L 19 41 C 19 42.2, 33 42.2, 33 41 L 36 16 Z" fill="currentColor" fillOpacity="0.12" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
    {/* 防烫杯套 */}
    <path d="M 17.5 24 L 18.8 34 C 21.5 35, 30.5 35, 33.2 34 L 34.5 24 Z" fill="currentColor" fillOpacity="0.25" stroke="currentColor" strokeWidth="1.2" />
    {/* 杯套中央极简爱心 */}
    <path d="M 26 28 C 24.8 26.8, 23.2 27.4, 23.2 28.5 C 23.2 29.6, 26 31.2, 26 31.2 C 26 31.2, 28.8 29.6, 28.8 28.5 C 28.8 27.4, 27.2 26.8, 26 28 Z" fill="currentColor" fillOpacity="0.8" />
    {/* 杯盖 */}
    <path d="M 14 16 H 38 V 13 C 38 11.5, 36.5 11, 35 11 H 17 C 15.5 11, 14 11.5, 14 13 Z" fill="currentColor" fillOpacity="0.2" stroke="currentColor" strokeWidth="1.6" />
    <rect x="18" y="9" width="6" height="2" rx="0.8" fill="currentColor" />
    {/* 轻柔微热气 (高度安全在 viewBox 内部) */}
    <path d="M 26 7 C 25 4, 27 3, 26 1" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeOpacity="0.6" />
  </svg>
);

/** Tier 2 (RM13 / $4 / ¥14): 精致意式拿铁拉花陶瓷杯 (默认推荐热门档位) */
const SceneLatteArt: React.FC<{ isSelected?: boolean }> = () => (
  <svg viewBox="0 0 48 48" className="w-8 h-8 sm:w-8.5 sm:h-8.5 transition-transform duration-300 group-hover:scale-110" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* 极简托盘 (Saucer) */}
    <ellipse cx="23" cy="40" rx="17" ry="2.6" fill="currentColor" fillOpacity="0.15" stroke="currentColor" strokeWidth="1.4" />
    {/* 马克杯把手 */}
    <path d="M 33 24 C 40 24, 40 32, 31 33" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    {/* 宽口圆润杯身 */}
    <path d="M 11 22 C 11 34, 17 38, 23 38 C 29 38, 35 34, 35 22 Z" fill="currentColor" fillOpacity="0.18" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
    {/* 咖啡表面椭圆 */}
    <ellipse cx="23" cy="22" rx="12" ry="4" fill="currentColor" fillOpacity="0.3" stroke="currentColor" strokeWidth="1.6" />
    {/* 极简爱心拉花 (Heart Latte Foam Art) */}
    <path d="M 23 24.5 C 19.8 21.8, 18.2 19.8, 20.4 18.8 C 22.2 18, 23 20, 23 20 C 23 20, 23.8 18, 25.6 18.8 C 27.8 19.8, 26.2 21.8, 23 24.5 Z" fill="currentColor" fillOpacity="0.95" />
    {/* 飘逸双热气 (严格控制在 Y=4 处，安全杜绝顶边裁切) */}
    <path d="M 19 14 C 18 10, 21 8, 20 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeOpacity="0.55" />
    <path d="M 25 15 C 26 11, 23 9, 24 5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeOpacity="0.55" />
  </svg>
);

/** Tier 3 (RM17 / $5 / ¥16): 经典意式八角摩卡壶萃取 (浓烈纯正的意式冲煮) */
const SceneMokaPot: React.FC<{ isSelected?: boolean }> = () => (
  <svg viewBox="0 0 48 48" className="w-8 h-8 sm:w-8.5 sm:h-8.5 transition-transform duration-300 group-hover:scale-110" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* 下壶水箱 */}
    <path d="M 16 41 L 18 29 H 30 L 32 41 Z" fill="currentColor" fillOpacity="0.15" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
    <circle cx="19" cy="35" r="1.3" fill="currentColor" />
    <rect x="17" y="27" width="14" height="2.5" rx="0.6" fill="currentColor" fillOpacity="0.3" stroke="currentColor" strokeWidth="1" />
    {/* 上壶八角刻面 */}
    <path d="M 18 27 L 15 14 H 33 L 30 27 Z" fill="currentColor" fillOpacity="0.18" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
    <line x1="24" y1="14" x2="24" y2="27" stroke="currentColor" strokeWidth="1.2" strokeOpacity="0.6" />
    {/* 鹰嘴壶嘴 */}
    <path d="M 15 17 L 10 15 L 15 21 Z" fill="currentColor" fillOpacity="0.3" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
    {/* 顶盖与顶珠 */}
    <path d="M 15 14 L 24 8.5 L 33 14 Z" fill="currentColor" fillOpacity="0.25" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    <circle cx="24" cy="7.5" r="1.6" fill="currentColor" />
    {/* 隔热侧把手 */}
    <path d="M 32 16 H 37 C 39.5 16, 40.5 18, 39 21 L 37 31 C 36 34, 34 35, 32 35 H 30" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
  </svg>
);

/** Tier 4 (RM20 / $6.5 / ¥20): 专业慢调手冲咖啡壶 (精品手冲 V60 滤杯与分享壶) */
const ScenePourOver: React.FC<{ isSelected?: boolean }> = () => (
  <svg viewBox="0 0 48 48" className="w-8 h-8 sm:w-8.5 sm:h-8.5 transition-transform duration-300 group-hover:scale-110" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* 耐热分享壶下部 */}
    <path d="M 18 26 L 14 41 C 14 42.2, 34 42.2, 34 41 L 30 26 Z" fill="currentColor" fillOpacity="0.12" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
    <path d="M 15.5 35 L 14 41 C 14 42.2, 34 42.2, 34 41 L 32.5 35 Z" fill="currentColor" fillOpacity="0.35" />
    <path d="M 31 28 C 37 28, 37 38, 32 38" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    {/* V60 锥形滤杯 */}
    <path d="M 14 14 L 21 26 H 27 L 34 14 Z" fill="currentColor" fillOpacity="0.22" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
    <ellipse cx="24" cy="14" rx="10" ry="2.5" fill="currentColor" fillOpacity="0.3" stroke="currentColor" strokeWidth="1.5" />
    {/* 咖啡水滴 */}
    <circle cx="24" cy="30" r="1.4" fill="currentColor" />
    {/* 热气 */}
    <path d="M 28 10 C 29 6, 27 4, 28 2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeOpacity="0.6" />
  </svg>
);

/** Tier 5 (RM25 / $8 / ¥25): 殿堂冷萃冰滴特调 (古典杯、大冰球与香橙片) */
const SceneColdBrewTower: React.FC<{ isSelected?: boolean }> = () => (
  <svg viewBox="0 0 48 48" className="w-8 h-8 sm:w-8.5 sm:h-8.5 transition-transform duration-300 group-hover:scale-110" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* 厚底古典杯身 */}
    <path d="M 14 16 L 17 41 C 17 42.2, 35 42.2, 35 41 L 38 16 Z" fill="currentColor" fillOpacity="0.14" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
    <rect x="17" y="38" width="18" height="3" rx="0.8" fill="currentColor" fillOpacity="0.3" />
    {/* 冷萃咖啡液位 */}
    <path d="M 15.5 24 L 17 41 C 17 42.2, 35 42.2, 35 41 L 36.5 24 Z" fill="currentColor" fillOpacity="0.25" />
    {/* 晶莹大圆冰球 */}
    <circle cx="26" cy="27" r="6.5" fill="currentColor" fillOpacity="0.2" stroke="currentColor" strokeWidth="1.6" />
    <ellipse cx="24" cy="25" rx="2" ry="1.2" fill="currentColor" fillOpacity="0.6" />
    {/* 杯沿鲜橙片点缀 */}
    <path d="M 35 15 A 5 5 0 0 1 42 22 L 38 22 Z" fill="currentColor" fillOpacity="0.4" stroke="currentColor" strokeWidth="1.1" />
  </svg>
);

/* ── 6 个档位专属咖啡品类主题配置 (色彩明度平衡：浅色不浓重深暗，暗色不刺眼过亮) ── */
const TIER_STYLES = [
  {
    name: 'amber',
    scene: SceneInstantCoffee,
    selected:
      'bg-gradient-to-br from-amber-400 to-amber-500 border-amber-400 text-white shadow-sm shadow-amber-500/20 ring-2 ring-amber-400/30 dark:from-[#483416] dark:to-[#34240d] dark:border-amber-500/50 dark:text-amber-100 dark:ring-1 dark:ring-amber-500/25 dark:shadow-none scale-[1.02]',
    unselected:
      'bg-amber-50/40 dark:bg-amber-950/15 border-amber-200/60 dark:border-amber-800/30 text-slate-800 dark:text-slate-200 hover:border-amber-300 dark:hover:border-amber-500/50 hover:shadow-xs',
    sceneColorSelected: 'text-white/50 group-hover:text-white/80 dark:text-amber-200/40 dark:group-hover:text-amber-200/70',
    sceneColorUnselected: 'text-amber-500/40 dark:text-amber-400/30 group-hover:text-amber-600/70 dark:group-hover:text-amber-300/70',
    amountSelected: 'text-white dark:text-amber-100',
    amountUnselected: 'text-slate-800 dark:text-slate-200',
    codeSelected: 'text-white/80 dark:text-amber-200/70',
    codeUnselected: 'text-slate-400 dark:text-slate-500',
  },
  {
    name: 'orange',
    scene: SceneTakeawayCup,
    selected:
      'bg-gradient-to-br from-orange-400 to-orange-500 border-orange-400 text-white shadow-sm shadow-orange-500/20 ring-2 ring-orange-400/30 dark:from-[#4c2714] dark:to-[#361a0b] dark:border-orange-500/50 dark:text-orange-100 dark:ring-1 dark:ring-orange-500/25 dark:shadow-none scale-[1.02]',
    unselected:
      'bg-orange-50/40 dark:bg-orange-950/15 border-orange-200/60 dark:border-orange-800/30 text-slate-800 dark:text-slate-200 hover:border-orange-300 dark:hover:border-orange-500/50 hover:shadow-xs',
    sceneColorSelected: 'text-white/50 group-hover:text-white/80 dark:text-orange-200/40 dark:group-hover:text-orange-200/70',
    sceneColorUnselected: 'text-orange-500/40 dark:text-orange-400/30 group-hover:text-orange-600/70 dark:group-hover:text-orange-300/70',
    amountSelected: 'text-white dark:text-orange-100',
    amountUnselected: 'text-slate-800 dark:text-slate-200',
    codeSelected: 'text-white/80 dark:text-orange-200/70',
    codeUnselected: 'text-slate-400 dark:text-slate-500',
  },
  {
    name: 'blue',
    scene: SceneLatteArt,
    selected:
      'bg-gradient-to-br from-[#4f6bf7] to-[#3b53e8] border-[#4f6bf7] text-white shadow-sm shadow-blue-500/20 ring-2 ring-blue-500/25 dark:from-[#233175] dark:to-[#1a2356] dark:border-blue-500/50 dark:text-blue-100 dark:ring-1 dark:ring-blue-500/25 dark:shadow-none scale-[1.02]',
    unselected:
      'bg-blue-50/40 dark:bg-blue-950/15 border-blue-200/60 dark:border-blue-800/30 text-slate-800 dark:text-slate-200 hover:border-blue-300 dark:hover:border-blue-500/50 hover:shadow-xs',
    sceneColorSelected: 'text-white/50 group-hover:text-white/80 dark:text-blue-200/40 dark:group-hover:text-blue-200/70',
    sceneColorUnselected: 'text-[#425aef]/40 dark:text-blue-400/30 group-hover:text-[#425aef]/70 dark:group-hover:text-blue-300/70',
    amountSelected: 'text-white dark:text-blue-100',
    amountUnselected: 'text-slate-800 dark:text-slate-200',
    codeSelected: 'text-white/80 dark:text-blue-200/70',
    codeUnselected: 'text-slate-400 dark:text-slate-500',
  },
  {
    name: 'emerald',
    scene: SceneMokaPot,
    selected:
      'bg-gradient-to-br from-emerald-400 to-emerald-500 border-emerald-400 text-white shadow-sm shadow-emerald-500/20 ring-2 ring-emerald-400/30 dark:from-[#133d2e] dark:to-[#0c2a1f] dark:border-emerald-500/50 dark:text-emerald-100 dark:ring-1 dark:ring-emerald-500/25 dark:shadow-none scale-[1.02]',
    unselected:
      'bg-emerald-50/40 dark:bg-emerald-950/15 border-emerald-200/60 dark:border-emerald-800/30 text-slate-800 dark:text-slate-200 hover:border-emerald-300 dark:hover:border-emerald-500/50 hover:shadow-xs',
    sceneColorSelected: 'text-white/50 group-hover:text-white/80 dark:text-emerald-200/40 dark:group-hover:text-emerald-200/70',
    sceneColorUnselected: 'text-emerald-500/40 dark:text-emerald-400/30 group-hover:text-emerald-600/70 dark:group-hover:text-emerald-300/70',
    amountSelected: 'text-white dark:text-emerald-100',
    amountUnselected: 'text-slate-800 dark:text-slate-200',
    codeSelected: 'text-white/80 dark:text-emerald-200/70',
    codeUnselected: 'text-slate-400 dark:text-slate-500',
  },
  {
    name: 'purple',
    scene: ScenePourOver,
    selected:
      'bg-gradient-to-br from-purple-400 to-purple-500 border-purple-400 text-white shadow-sm shadow-purple-500/20 ring-2 ring-purple-400/30 dark:from-[#351d52] dark:to-[#241339] dark:border-purple-500/50 dark:text-purple-100 dark:ring-1 dark:ring-purple-500/25 dark:shadow-none scale-[1.02]',
    unselected:
      'bg-purple-50/40 dark:bg-purple-950/15 border-purple-200/60 dark:border-purple-800/30 text-slate-800 dark:text-slate-200 hover:border-purple-300 dark:hover:border-purple-500/50 hover:shadow-xs',
    sceneColorSelected: 'text-white/50 group-hover:text-white/80 dark:text-purple-200/40 dark:group-hover:text-purple-200/70',
    sceneColorUnselected: 'text-purple-500/40 dark:text-purple-400/30 group-hover:text-purple-600/70 dark:group-hover:text-purple-300/70',
    amountSelected: 'text-white dark:text-purple-100',
    amountUnselected: 'text-slate-800 dark:text-slate-200',
    codeSelected: 'text-white/80 dark:text-purple-200/70',
    codeUnselected: 'text-slate-400 dark:text-slate-500',
  },
  {
    name: 'rose',
    scene: SceneColdBrewTower,
    selected:
      'bg-gradient-to-br from-rose-400 to-rose-500 border-rose-400 text-white shadow-sm shadow-rose-500/20 ring-2 ring-rose-400/30 dark:from-[#491626] dark:to-[#340d1a] dark:border-rose-500/50 dark:text-rose-100 dark:ring-1 dark:ring-rose-500/25 dark:shadow-none scale-[1.02]',
    unselected:
      'bg-rose-50/40 dark:bg-rose-950/15 border-rose-200/60 dark:border-rose-800/30 text-slate-800 dark:text-slate-200 hover:border-rose-300 dark:hover:border-rose-500/50 hover:shadow-xs',
    sceneColorSelected: 'text-white/50 group-hover:text-white/80 dark:text-rose-200/40 dark:group-hover:text-rose-200/70',
    sceneColorUnselected: 'text-rose-500/40 dark:text-rose-400/30 group-hover:text-rose-600/70 dark:group-hover:text-rose-300/70',
    amountSelected: 'text-white dark:text-rose-100',
    amountUnselected: 'text-slate-800 dark:text-slate-200',
    codeSelected: 'text-white/80 dark:text-rose-200/70',
    codeUnselected: 'text-slate-400 dark:text-slate-500',
  },
];

/**
 * 客户端环境仅通过时区安全推测初始国家代码 (杜绝仅凭语言把马来西亚误判为台湾)
 */
function detectClientCountry(): string {
  if (typeof window === 'undefined') return 'CN';
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
    if (tz.includes('Kuala_Lumpur') || tz.includes('Kuching')) return 'MY';
    if (tz.includes('Singapore')) return 'SG';
    if (tz.includes('Hong_Kong')) return 'HK';
    if (tz.includes('Taipei')) return 'TW';
    if (tz.includes('Tokyo')) return 'JP';
    if (tz.includes('Seoul')) return 'KR';
    if (tz.includes('London')) return 'GB';
    if (tz.includes('Sydney') || tz.includes('Melbourne') || tz.includes('Brisbane') || tz.includes('Perth')) return 'AU';
    if (tz.includes('Toronto') || tz.includes('Vancouver') || tz.includes('Montreal')) return 'CA';
    if (tz.includes('Berlin') || tz.includes('Paris') || tz.includes('Rome') || tz.includes('Madrid') || tz.includes('Amsterdam') || tz.includes('Vienna') || tz.includes('Brussels') || tz.includes('Athens') || tz.includes('Dublin') || tz.includes('Helsinki') || tz.includes('Lisbon')) return 'DE';
    if (tz.startsWith('America/')) return 'US';
    if (tz.includes('Shanghai') || tz.includes('Chongqing') || tz.includes('Urumqi') || tz.includes('Harbin') || tz.includes('Beijing')) return 'CN';
  } catch {}
  return 'CN';
}

function formatSponsorDate(dateStr?: string): string {
  if (!dateStr || dateStr === '近期') return '近期';
  const clean = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr.split(' ')[0];
  const parts = clean.split('-');
  if (parts.length === 3) {
    return `${parts[1]}月${parts[2]}日`;
  }
  return clean || '近期';
}

export const SupportDashboard: React.FC = () => {
  // ── 0. i18n Locale State ──
  const [locale, setLocale] = useState<LocaleVariant>(() => readStoredLocaleVariant());

  useEffect(() => {
    const onLocaleChange = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      const raw = typeof detail === 'string' ? detail : (detail?.locale || detail?.variant);
      setLocale(normaliseLocaleVariant(raw || readStoredLocaleVariant()));
    };
    window.addEventListener('shijianus:localechange', onLocaleChange);
    return () => window.removeEventListener('shijianus:localechange', onLocaleChange);
  }, []);

  const t = useCallback((token: string, fallback: string) => getI18nText(token, locale, fallback), [locale]);

  // ── 1. Country & Dual-Currency State ──
  const [detectedCountry, setDetectedCountry] = useState<string>(() => detectClientCountry());
  const [activeCurrencyType, setActiveCurrencyType] = useState<'local' | 'global'>('local');
  const [selectedTierIndex, setSelectedTierIndex] = useState<number>(2); // Default tier index (Americano/Latte)
  const [isCustomMode, setIsCustomMode] = useState<boolean>(false);
  const [customAmount, setCustomAmount] = useState<string>('');

  // ── 2. Supporter Inputs ──
  const [donorName, setDonorName] = useState<string>('');
  const [donorMessage, setDonorMessage] = useState<string>('');

  // ── 3. Payment QR Tabs & Modals ──
  const [qrTab, setQrTab] = useState<'cn' | 'hk' | 'paypal' | 'crypto'>('cn');
  const [modalImage, setModalImage] = useState<{ src: string; title: string } | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // ── 4. FAQ Accordion ──
  const [expandedFaq, setExpandedFaq] = useState<number | null>(0); // First FAQ opened by default

  // ── 5. Supporter Roster State (彻底清空伪造数据，100% 真实联动) ──
  const [sponsors, setSponsors] = useState<SponsorItem[]>([]);
  const [isLoadingSponsors, setIsLoadingSponsors] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [tablePage, setTablePage] = useState<number>(1);
  const [jumpPageInput, setJumpPageInput] = useState<string>('');
  const [showJumpPopover, setShowJumpPopover] = useState<boolean>(false);
  const pageSize = 5;

  // 3. 拉取 D1 真实致谢记录（绝无 mock 伪造，支持跨会话零刷新实时更新）
  const fetchSponsors = useCallback((isInitial = false) => {
    if (isInitial) setIsLoadingSponsors(true);
    fetch(`/api/sponsorships?limit=50&_t=${Date.now()}`, { cache: 'no-store' })
      .then((res) => res.json())
      .then((data: any) => {
        if (data?.ok && Array.isArray(data.list)) {
          const apiItems: SponsorItem[] = data.list.map((item: any) => {
            const rawDate = item.createdAt || item.date || '';
            const cleanDate = rawDate.includes('T')
              ? rawDate.split('T')[0]
              : rawDate.split(' ')[0] || '近期';
            return {
              id: item.id,
              name: item.name || '匿名支持者',
              amount: Number(item.amount) || 0,
              currency: (item.currency || 'USD').toUpperCase(),
              message: item.message || '',
              channel: item.channel || 'Stripe (国际收银台)',
              allocation: item.allocation || '-',
              date: cleanDate,
            };
          });
          setSponsors(apiItems);
        }
      })
      .catch(() => {})
      .finally(() => {
        setIsLoadingSponsors(false);
      });
  }, []);

  // Auto-detect country & live sponsors on mount
  useEffect(() => {
    // 1. 同步确认客户端时区属地
    const clientC = detectClientCountry();
    if (clientC) {
      setDetectedCountry(clientC);
    }

    // 2. 异步请求后端精准边缘 IP 地理位置，若检测到真实国家立即同步，杜绝硬编码冲突
    fetch(`/api/geo-profile?_t=${Date.now()}`, { cache: 'no-store' })
      .then((res) => res.json())
      .then((data: any) => {
        const c = (data?.country || '').toUpperCase();
        if (c && c !== 'GLOBAL') {
          setDetectedCountry(c);
        }
      })
      .catch(() => {});

    // 3. 初始读取 D1 致谢数据
    fetchSponsors(true);

    // 4. 监听全局赞赏成功事件与可见性恢复，实现即时无感联动
    const handleSponsorshipUpdate = () => {
      fetchSponsors(false);
    };
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchSponsors(false);
      }
    };

    window.addEventListener('shijianus:sponsorship-updated', handleSponsorshipUpdate);
    window.addEventListener('shijianus:donation-completed', handleSponsorshipUpdate);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('shijianus:sponsorship-updated', handleSponsorshipUpdate);
      window.removeEventListener('shijianus:donation-completed', handleSponsorshipUpdate);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [fetchSponsors]);

  // Compute the 2 allowed currency options based on detected location:
  // 1. Local Currency: IP-detected local fiat
  // 2. Global Currency: Unified settlement (USD; if local is USD, auto-switch to HKD)
  const { localCurrencyOption, globalCurrencyOption } = useMemo(() => {
    const local = getLocalCurrencyByCountry(detectedCountry);
    const isLocalUSD = local.code.toUpperCase() === 'USD';
    const global = isLocalUSD
      ? supportConfig.currencies['HKD']
      : supportConfig.currencies['USD'];

    return { localCurrencyOption: local, globalCurrencyOption: global };
  }, [detectedCountry]);

  // Derived active currency configuration: Single Source of Truth
  // Ensures currency selector, 6 tiers, custom input, and checkout button are 100% strictly identical
  const activeCurrencyConfig = useMemo(() => {
    return activeCurrencyType === 'local' ? localCurrencyOption : globalCurrencyOption;
  }, [activeCurrencyType, localCurrencyOption, globalCurrencyOption]);

  const activeCurrencyCode = activeCurrencyConfig.code.toUpperCase();
  const activeCurrencySymbol = activeCurrencyConfig.symbol;
  const activeAmounts = activeCurrencyConfig.amounts;
  const activeMin = Math.max(1, activeCurrencyConfig.min);
  const activeMax = activeCurrencyConfig.max;

  // Handle switching between the 2 allowed currencies (Local vs Global)
  const handleCurrencySwitch = (newType: 'local' | 'global') => {
    if (newType === activeCurrencyType) return;

    if (isCustomMode && customAmount) {
      const numeric = parseFloat(customAmount);
      if (!isNaN(numeric) && numeric > 0) {
        if (newType === 'global') {
          const converted = convertByLocalPPP(
            numeric,
            localCurrencyOption.rateToUSD,
            globalCurrencyOption.rateToUSD,
            globalCurrencyOption.code,
          );
          setCustomAmount(String(converted));
        } else {
          const converted = convertByLocalPPP(
            numeric,
            globalCurrencyOption.rateToUSD,
            localCurrencyOption.rateToUSD,
            localCurrencyOption.code,
          );
          setCustomAmount(String(converted));
        }
      }
    }

    setActiveCurrencyType(newType);
  };

  // Custom amount validation
  const parsedCustom = parseFloat(customAmount);
  const isCustomInvalid =
    isCustomMode &&
    (customAmount === '' ||
      isNaN(parsedCustom) ||
      parsedCustom < activeMin ||
      parsedCustom > activeMax);

  const effectiveAmount = isCustomMode
    ? isNaN(parsedCustom)
      ? 0
      : parsedCustom
    : activeAmounts[selectedTierIndex] || activeAmounts[2];

  const isAmountValid = effectiveAmount >= activeMin && effectiveAmount <= activeMax;

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard?.writeText(text).catch(() => {});
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Trigger Stripe Direct Checkout Modal
  const handleTriggerStripe = () => {
    if (!isAmountValid) return;

    window.dispatchEvent(
      new CustomEvent('open-stripe-modal', {
        detail: {
          directCheckout: true,
          amount: effectiveAmount,
          currency: activeCurrencyCode.toLowerCase(),
          name: donorName.trim(),
          message: donorMessage.trim(),
        },
      }),
    );
  };

  // 支援名册上方 4 个指标卡动态联动真实计算 (累计人次、精神咖啡杯数、汇聚币种、最新支持者)
  const metrics = useMemo(() => {
    const totalSupporters = sponsors.length;
    let totalCups = 0;
    const currencies = new Set<string>();

    sponsors.forEach((s) => {
      if (s.currency) currencies.add(s.currency.toUpperCase());
      const cur = (s.currency || 'cny').toLowerCase();
      const amt = Number(s.amount) || 0;
      let cups = 1;
      if (['cny', 'rmb'].includes(cur)) cups = Math.max(1, Math.round(amt / 15));
      else if (['usd', 'eur', 'gbp', 'chf'].includes(cur)) cups = Math.max(1, Math.round(amt / 4));
      else if (['hkd', 'twd', 'mop'].includes(cur)) cups = Math.max(1, Math.round(amt / 35));
      else if (['jpy', 'krw'].includes(cur)) cups = Math.max(1, Math.round(amt / 500));
      else cups = Math.max(1, Math.round(amt / 5));
      totalCups += cups;
    });

    const latest = sponsors.length > 0 ? sponsors[0] : null;
    const latestCurrencyCode = (latest?.currency || 'USD').toUpperCase();
    const currencyConfig = supportConfig.currencies[latestCurrencyCode];
    const symbol = currencyConfig?.symbol || '';
    const formattedAmount = latest ? `${symbol}${latest.amount}` : '';
    const formattedDate = latest ? formatSponsorDate(latest.date) : '';
    const latestDonor = latest?.name || '虚位以待 · 期待支持 ✨';

    return {
      totalSupporters,
      totalCups,
      currencyCount: currencies.size,
      latestDonor,
      latestSponsor: latest
        ? {
            id: latest.id,
            name: latest.name || '匿名支持者',
            amount: latest.amount,
            currency: latestCurrencyCode,
            symbol,
            formattedAmount,
            date: formattedDate,
            rawDate: latest.date,
            channel: latest.channel,
            message: latest.message,
          }
        : null,
    };
  }, [sponsors]);

  // Supporter filtering & pagination
  const filteredSponsors = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return sponsors;
    return sponsors.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        (s.message && s.message.toLowerCase().includes(q)) ||
        s.channel.toLowerCase().includes(q) ||
        (s.allocation && s.allocation.toLowerCase().includes(q)),
    );
  }, [sponsors, searchQuery]);

  const totalPages = Math.ceil(filteredSponsors.length / pageSize) || 1;
  const paginatedSponsors = useMemo(() => {
    const start = (tablePage - 1) * pageSize;
    return filteredSponsors.slice(start, start + pageSize);
  }, [filteredSponsors, tablePage]);

  // Windowed pagination items
  const paginationItems = useMemo(() => {
    const items: Array<{ type: 'page' | 'ellipsis'; page?: number; key: string }> = [];

    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) {
        items.push({ type: 'page', page: i, key: `p-${i}` });
      }
      return items;
    }

    items.push({ type: 'page', page: 1, key: 'p-1' });
    items.push({ type: 'page', page: 2, key: 'p-2' });

    if (tablePage > 4) {
      items.push({ type: 'ellipsis', key: 'ellipsis-left' });
    }

    const start = Math.max(3, tablePage - 1);
    const end = Math.min(totalPages - 2, tablePage + 1);
    for (let i = start; i <= end; i++) {
      if (i > 2 && i < totalPages - 1) {
        items.push({ type: 'page', page: i, key: `p-${i}` });
      }
    }

    if (tablePage < totalPages - 3) {
      items.push({ type: 'ellipsis', key: 'ellipsis-right' });
    }

    items.push({ type: 'page', page: totalPages - 1, key: `p-${totalPages - 1}` });
    items.push({ type: 'page', page: totalPages, key: `p-${totalPages}` });

    return items;
  }, [totalPages, tablePage]);

  const handleJumpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const p = parseInt(jumpPageInput, 10);
    if (!isNaN(p) && p >= 1 && p <= totalPages) {
      setTablePage(p);
      setShowJumpPopover(false);
      setJumpPageInput('');
    }
  };

  return (
    <div className="support-dashboard w-full max-w-[1240px] mx-auto px-3 sm:px-6 py-6 md:py-10 space-y-10 md:space-y-12 text-slate-800 dark:text-slate-100">
      {/* ── 1. Hero Header ────────────────────────────────────────────── */}
      <section className="support-hero relative overflow-hidden rounded-3xl p-6 sm:p-10 md:p-12 text-center bg-gradient-to-b from-blue-50/70 via-white to-slate-50/50 dark:from-[#151a2e]/80 dark:via-[#0e121f] dark:to-[#0a0d17] border border-blue-100/80 dark:border-white/[0.08] shadow-sm">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-blue-100/80 dark:bg-blue-500/20 text-[#425aef] dark:text-blue-300 border border-blue-200/60 dark:border-blue-500/30 mb-4">
          <Coffee className="w-4 h-4 text-[#425aef]" />
          <span>{t('support.heroBadge', supportConfig.subtitle)}</span>
        </div>

        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight mb-4">
          {t('support.heroTitle', supportConfig.title)}
        </h1>

        <p className="max-w-2xl mx-auto text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed mb-6">
          {t('support.heroDesc', supportConfig.description)}
        </p>

        <div className="flex flex-wrap justify-center gap-2 sm:gap-2.5 max-w-3xl mx-auto">
          {supportConfig.trustPills.map((pill, idx) => (
            <span
              key={idx}
              className="px-3 py-1 text-xs rounded-lg bg-white/80 dark:bg-white/[0.05] border border-slate-200/80 dark:border-white/[0.08] text-slate-700 dark:text-slate-300 shadow-2xs backdrop-blur-xs font-medium"
            >
              {convertText(pill, locale)}
            </span>
          ))}
        </div>
      </section>

      {/* ── 2. Donation Main Section: Naturally Balanced Columns ──────── */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8 items-stretch">
        {/* Left Column: Stripe Checkout & PPP Price Tiers (7 Cols) */}
        <div className="lg:col-span-7 bg-white dark:bg-[#121520] rounded-3xl p-5 sm:p-6 border border-slate-200/80 dark:border-white/[0.08] shadow-sm flex flex-col justify-between space-y-4 sm:space-y-5">
          <div className="space-y-4">
            {/* Header with 2-Currency Switcher (Local Currency & Unified Currency) */}
            <div className="support-section-header flex flex-wrap items-center justify-between gap-3 pb-3.5 border-b border-slate-100 dark:border-white/[0.06]">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#425aef] dark:text-blue-400">
                  {t('support.stripeTitle', 'Stripe 国际收银台')}
                </span>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mt-0.5">
                  {t('support.stripeSubtitle', '自选金额与寄语')}
                </h2>
              </div>

              {/* 2-Currency Switcher: strictly supports Local Currency & Unified Global Currency */}
              <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-white/[0.06] border border-slate-200/60 dark:border-white/10 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => handleCurrencySwitch('local')}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                    activeCurrencyType === 'local'
                      ? 'bg-white dark:bg-[#1e2233] text-[#425aef] dark:text-blue-400 font-bold shadow-2xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                  title={`${t('support.localCurrency', '本地货币')} (${localCurrencyOption.name})`}
                >
                  <span aria-hidden="true">{localCurrencyOption.flag}</span>
                  <span>
                    {localCurrencyOption.code.toUpperCase()} ({localCurrencyOption.symbol})
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => handleCurrencySwitch('global')}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                    activeCurrencyType === 'global'
                      ? 'bg-white dark:bg-[#1e2233] text-[#425aef] dark:text-blue-400 font-bold shadow-2xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                  title={`${t('support.globalCurrency', '统一结算货币')} (${globalCurrencyOption.name})`}
                >
                  <span aria-hidden="true">{globalCurrencyOption.flag}</span>
                  <span>
                    {globalCurrencyOption.code.toUpperCase()} ({globalCurrencyOption.symbol})
                  </span>
                </button>
              </div>
            </div>

            {/* 6 Preset Amounts Grid: strictly paired with local coffee price tiers & PPP adjustment */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  {t('support.recommendedTiers', '推荐支持档位')}
                </label>
                {activeCurrencyType === 'global' ? (
                  <span className="text-[11px] text-[#425aef] dark:text-blue-400 font-medium">
                    {t('support.pppNotice', '⚡ 已随本地购买力（PPP）汇率自适应')}
                  </span>
                ) : (
                  <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
                    {t('support.gradientNotice', '自适应常用赞赏梯度')}
                  </span>
                )}
              </div>

              {/* Grid of 6 Cards: 2 cols on mobile to prevent text truncation, 3 cols on desktop */}
              <div key={`grid-${activeCurrencyCode}`} className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-2.5">
                {activeAmounts.map((amt, idx) => {
                  const isSelected = !isCustomMode && selectedTierIndex === idx;
                  const tier = TIER_STYLES[idx] || TIER_STYLES[0];
                  const TierScene = tier.scene;

                  return (
                    <button
                      key={`${activeCurrencyCode}-${idx}-${amt}`}
                      type="button"
                      onClick={() => {
                        setIsCustomMode(false);
                        setSelectedTierIndex(idx);
                      }}
                      className={`relative overflow-hidden py-2 px-3 sm:px-3.5 rounded-xl sm:rounded-2xl text-left transition-all duration-200 cursor-pointer select-none border group flex items-center justify-between min-h-[50px] sm:min-h-[54px] max-h-[54px] ${
                        isSelected ? tier.selected : tier.unselected
                      }`}
                      title={`${t(`support.tier${idx}.title`, `Tier ${idx + 1}`)} (${activeCurrencySymbol}${amt})`}
                      aria-label={`${activeCurrencySymbol}${amt}`}
                    >
                      {/* Left: Warm Bold Amount + Currency Code + Localized Coffee Tier Title */}
                      <div className="relative z-10 flex flex-col justify-center select-none shrink-0 pointer-events-none">
                        <div className="flex items-baseline gap-1.5">
                          <span
                            className={`text-base sm:text-lg font-black tracking-tight leading-none transition-transform duration-200 group-hover:scale-105 ${
                              isSelected ? tier.amountSelected : tier.amountUnselected
                            }`}
                          >
                            {activeCurrencySymbol}{amt}
                          </span>
                          <span
                            className={`text-[9px] sm:text-[9.5px] font-bold tracking-wider uppercase leading-none ${
                              isSelected ? tier.codeSelected : tier.codeUnselected
                            }`}
                          >
                            {activeCurrencyCode}
                          </span>
                        </div>
                        <strong className="support-tier-btn text-[10px] font-semibold tracking-tight mt-0.5 truncate max-w-[105px] opacity-90 block">
                          {t(`support.tier${idx}.title`, `Tier ${idx + 1}`)}
                        </strong>
                      </div>

                      {/* Right: Sleek Minimalist Coffee Glyph Watermark */}
                      <div
                        className={`absolute right-1 bottom-0 top-0 w-12 sm:w-14 flex items-center justify-end pr-1 sm:pr-1.5 pointer-events-none transition-all duration-300 ${
                          isSelected ? tier.sceneColorSelected : tier.sceneColorUnselected
                        }`}
                        aria-hidden="true"
                      >
                        <TierScene isSelected={isSelected} />
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Custom Amount Input */}
              <div className="space-y-1 pt-1">
                <label
                  className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl border-2 transition-all cursor-text ${
                    isCustomMode
                      ? isCustomInvalid
                        ? 'border-red-400 bg-red-50/50 dark:bg-red-950/20'
                        : 'border-[#425aef] bg-blue-50/60 dark:bg-blue-950/25'
                      : 'border-slate-200 dark:border-white/10 bg-slate-50/90 dark:bg-white/[0.03]'
                  }`}
                >
                  <span className="text-sm font-semibold text-slate-500 dark:text-slate-400 shrink-0">
                    {activeCurrencySymbol}
                  </span>
                  <input
                    type="number"
                    min={activeMin}
                    max={activeMax}
                    step={
                      ['jpy', 'krw'].includes(activeCurrencyCode.toLowerCase())
                        ? 100
                        : 1
                    }
                    placeholder={`${t('support.customAmountLabel', '自定义赞助金额')}（${activeCurrencySymbol}${activeMin} ~ ${activeCurrencySymbol}${activeMax}）`}
                    value={customAmount}
                    onFocus={() => setIsCustomMode(true)}
                    onChange={(e) => {
                      setIsCustomMode(true);
                      setCustomAmount(e.target.value);
                    }}
                    className="flex-1 bg-transparent text-sm font-semibold text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-hidden"
                  />
                  {isCustomMode && customAmount && (
                    <span className="text-[11px] font-bold uppercase text-[#425aef] shrink-0">
                      {activeCurrencyCode}
                    </span>
                  )}
                </label>
                {isCustomMode && isCustomInvalid && (
                  <div className="text-[11px] text-red-500 dark:text-red-400 px-1 font-medium">
                    {t('support.customInvalid', '请输入有效金额')} ({activeCurrencySymbol}{activeMin} ~ {activeCurrencySymbol}{activeMax})
                  </div>
                )}
              </div>
            </div>

            {/* Supporter Inputs */}
            <div className="space-y-2.5 pt-0.5">
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                {t('support.supporterName', '留下你的名字与寄语（可选）')}
              </label>
              <div className="space-y-2.5">
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                    👤 {t('support.supporterName', '称呼或社交账号')} (可选)
                  </label>
                  <input
                    type="text"
                    maxLength={32}
                    placeholder={t('support.namePlaceholder', '例如：@github_username 或 Shijian Friend')}
                    value={donorName}
                    onChange={(e) => setDonorName(e.target.value)}
                    className="w-full px-4 py-2 text-xs sm:text-sm rounded-xl bg-slate-50/70 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#425aef]/40 transition-all"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                    💬 {t('support.supporterMessage', '留言寄语')} (可选)
                  </label>
                  <textarea
                    rows={2}
                    maxLength={120}
                    placeholder={t('support.messagePlaceholder', '写下想对作者说的话或鼓励...')}
                    value={donorMessage}
                    onChange={(e) => setDonorMessage(e.target.value)}
                    className="w-full px-4 py-2 text-xs sm:text-sm rounded-xl bg-slate-50/70 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#425aef]/40 resize-none transition-all"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Action Button: Strictly synchronized currency & amount */}
          <div key={`checkout-btn-${activeCurrencyCode}`} className="pt-3 border-t border-slate-100 dark:border-white/[0.06]">
            <button
              type="button"
              disabled={!isAmountValid}
              onClick={handleTriggerStripe}
              className="support-checkout-btn w-full group relative overflow-hidden py-3.5 px-6 rounded-2xl text-white font-bold text-sm sm:text-base flex items-center justify-center gap-2.5 shadow-lg shadow-blue-500/25 transition-all duration-200 bg-[linear-gradient(115deg,#3B82F6_0%,#425AEF_50%,#7C3AED_100%)] hover:shadow-xl hover:shadow-blue-500/40 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              <CreditCard className="w-5 h-5 text-white/90" />
              <span>
                {t('support.checkoutBtn', '前往 Stripe 安全收银台支付')} — {activeCurrencySymbol}
                {effectiveAmount} {activeCurrencyCode}
              </span>
              <ArrowRight className="w-4 h-4 text-white/80 group-hover:translate-x-1 transition-transform" />
            </button>
            <p className="text-center text-[11px] text-slate-400 dark:text-slate-500 mt-2">
              🔒 {t('support.stripeFootnote', '由 Stripe 提供金融级加密结账 · 支持 Apple Pay / Google Pay / 国际信用卡')}
            </p>
          </div>
        </div>

        {/* Right Column: Local & Cross-border QR Codes (5 Cols, perfectly filled without empty space) */}
        <div className="lg:col-span-5 bg-white dark:bg-[#121520] rounded-3xl p-5 sm:p-6 border border-slate-200/80 dark:border-white/[0.08] shadow-sm flex flex-col justify-between space-y-4">
          <div className="space-y-3.5 flex-1 flex flex-col">
            <div className="pb-3 border-b border-slate-100 dark:border-white/[0.06]">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                {t('support.channelsTitle', '本地与跨国支付通道')}
              </span>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mt-0.5">
                {convertText('微信 / 支付宝 / PayPal / Web3', locale)}
              </h2>
            </div>

            {/* Sub-channel Tabs: 2x2 on mobile for comfortable touch targets, flex row on desktop */}
            <div className="grid grid-cols-2 sm:flex rounded-xl p-1 bg-slate-100 dark:bg-white/[0.05] border border-slate-200/60 dark:border-white/10 text-xs font-semibold gap-1 sm:gap-0">
              <button
                type="button"
                onClick={() => setQrTab('cn')}
                className={`flex-1 py-2 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  qrTab === 'cn'
                    ? 'bg-white dark:bg-[#1e2233] text-slate-900 dark:text-white shadow-2xs font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <span aria-hidden="true">🇨🇳</span>
                <span>{t('support.tabCn', '国内扫码')}</span>
              </button>
              <button
                type="button"
                onClick={() => setQrTab('hk')}
                className={`flex-1 py-2 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  qrTab === 'hk'
                    ? 'bg-white dark:bg-[#1e2233] text-slate-900 dark:text-white shadow-2xs font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <span aria-hidden="true">🇭🇰</span>
                <span>{t('support.tabHk', '港澳渠道')}</span>
              </button>
              <button
                type="button"
                onClick={() => setQrTab('paypal')}
                className={`flex-1 py-2 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  qrTab === 'paypal'
                    ? 'bg-white dark:bg-[#1e2233] text-slate-900 dark:text-white shadow-2xs font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <PayPalIcon className="w-3.5 h-3.5" />
                <span>{t('support.tabPaypal', 'PayPal')}</span>
              </button>
              <button
                type="button"
                onClick={() => setQrTab('crypto')}
                className={`flex-1 py-2 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  qrTab === 'crypto'
                    ? 'bg-white dark:bg-[#1e2233] text-slate-900 dark:text-white shadow-2xs font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Coins className="w-3.5 h-3.5 text-emerald-500" />
                <span>{t('support.tabCrypto', 'USDT')}</span>
              </button>
            </div>

            {/* Tab 1: CN QR Codes */}
            {qrTab === 'cn' && (
              <div className="grid grid-cols-2 gap-3 sm:gap-3.5 py-1 animate-in fade-in duration-200 flex-1 items-center">
                <div className="p-3 sm:p-3.5 rounded-2xl bg-gradient-to-b from-slate-50 to-emerald-50/35 dark:from-emerald-950/20 dark:to-[#151928] border border-emerald-200/70 dark:border-emerald-500/20 text-center space-y-2 group transition-all duration-150 hover:shadow-md hover:border-emerald-300 dark:hover:border-emerald-500/40">
                  <div className="flex items-center justify-center gap-1.5 text-xs sm:text-sm font-bold text-emerald-700 dark:text-emerald-300">
                    <WeChatIcon className="w-4 h-4" />
                    <span>{convertText('微信支付', locale)}</span>
                  </div>
                  <div
                    className="relative aspect-square rounded-xl overflow-hidden bg-white p-2 shadow-2xs border border-slate-100 dark:border-white/5 cursor-pointer max-w-[190px] mx-auto"
                    onClick={() =>
                      setModalImage({
                        src: '/media/shijianus/support/weixin-pay-cn.jpg',
                        title: convertText('微信支付赞赏码', locale),
                      })
                    }
                  >
                    <img
                      src="/media/shijianus/support/weixin-pay-cn.jpg"
                      alt={convertText('微信支付赞赏码', locale)}
                      className="w-full h-full object-contain rounded-lg group-hover:scale-105 transition-transform"
                    />
                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-semibold transition-opacity rounded-xl gap-1">
                      <Maximize2 className="w-3.5 h-3.5" />
                      <span>{convertText('查看大图', locale)}</span>
                    </div>
                  </div>
                  <span className="block text-xs text-emerald-600/90 dark:text-emerald-400 font-medium">
                    {convertText('微信扫一扫赞赏', locale)}
                  </span>
                </div>

                <div className="p-3 sm:p-3.5 rounded-2xl bg-gradient-to-b from-slate-50 to-blue-50/35 dark:from-blue-950/20 dark:to-[#151928] border border-blue-200/70 dark:border-blue-500/20 text-center space-y-2 group transition-all duration-150 hover:shadow-md hover:border-blue-300 dark:hover:border-blue-500/40">
                  <div className="flex items-center justify-center gap-1.5 text-xs sm:text-sm font-bold text-blue-700 dark:text-blue-300">
                    <AlipayIcon className="w-4 h-4" />
                    <span>{convertText('支付宝', locale)}</span>
                  </div>
                  <div
                    className="relative aspect-square rounded-xl overflow-hidden bg-white p-2 shadow-2xs border border-slate-100 dark:border-white/5 cursor-pointer max-w-[190px] mx-auto"
                    onClick={() =>
                      setModalImage({
                        src: '/media/shijianus/support/alipay-cn.jpg',
                        title: convertText('支付宝赞赏码', locale),
                      })
                    }
                  >
                    <img
                      src="/media/shijianus/support/alipay-cn.jpg"
                      alt={convertText('支付宝赞赏码', locale)}
                      className="w-full h-full object-contain rounded-lg group-hover:scale-105 transition-transform"
                    />
                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-semibold transition-opacity rounded-xl gap-1">
                      <Maximize2 className="w-3.5 h-3.5" />
                      <span>{convertText('查看大图', locale)}</span>
                    </div>
                  </div>
                  <span className="block text-xs text-blue-600/90 dark:text-blue-400 font-medium">
                    {convertText('支付宝扫一扫赞赏', locale)}
                  </span>
                </div>
              </div>
            )}

            {/* Tab 2: HK QR Codes */}
            {qrTab === 'hk' && (
              <div className="grid grid-cols-2 gap-3 sm:gap-3.5 py-1 animate-in fade-in duration-200 flex-1 items-center">
                <div className="p-3 sm:p-3.5 rounded-2xl bg-gradient-to-b from-slate-50 to-indigo-50/35 dark:from-indigo-950/20 dark:to-[#151928] border border-indigo-200/70 dark:border-indigo-500/20 text-center space-y-2 group transition-all duration-150 hover:shadow-md hover:border-indigo-300 dark:hover:border-indigo-500/40">
                  <div className="flex items-center justify-center gap-1.5 text-xs sm:text-sm font-bold text-indigo-700 dark:text-indigo-300">
                    <AlipayIcon className="w-4 h-4" />
                    <span>Alipay HK</span>
                  </div>
                  <div
                    className="relative aspect-square rounded-xl overflow-hidden bg-white p-2 shadow-2xs border border-slate-100 dark:border-white/5 cursor-pointer max-w-[190px] mx-auto"
                    onClick={() =>
                      setModalImage({
                        src: '/media/shijianus/support/alipay-hk.jpg',
                        title: convertText('Alipay HK 赞赏码', locale),
                      })
                    }
                  >
                    <img
                      src="/media/shijianus/support/alipay-hk.jpg"
                      alt={convertText('Alipay HK 赞赏码', locale)}
                      className="w-full h-full object-contain rounded-lg group-hover:scale-105 transition-transform"
                    />
                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-semibold transition-opacity rounded-xl gap-1">
                      <Maximize2 className="w-3.5 h-3.5" />
                      <span>{convertText('查看大图', locale)}</span>
                    </div>
                  </div>
                  <span className="block text-xs text-indigo-600/90 dark:text-indigo-400 font-medium">
                    {convertText('港币 HKD 扫码', locale)}
                  </span>
                </div>

                <div className="p-3 sm:p-3.5 rounded-2xl bg-gradient-to-b from-slate-50 to-emerald-50/35 dark:from-emerald-950/20 dark:to-[#151928] border border-emerald-200/70 dark:border-emerald-500/20 text-center space-y-2 group transition-all duration-150 hover:shadow-md hover:border-emerald-300 dark:hover:border-emerald-500/40">
                  <div className="flex items-center justify-center gap-1.5 text-xs sm:text-sm font-bold text-emerald-700 dark:text-emerald-300">
                    <WeChatIcon className="w-4 h-4" />
                    <span>WeChat Pay HK</span>
                  </div>
                  <div
                    className="relative aspect-square rounded-xl overflow-hidden bg-white p-2 shadow-2xs border border-slate-100 dark:border-white/5 cursor-pointer max-w-[190px] mx-auto"
                    onClick={() =>
                      setModalImage({
                        src: '/media/shijianus/support/wechat-pay-hk.jpg',
                        title: convertText('WeChat Pay HK 赞赏码', locale),
                      })
                    }
                  >
                    <img
                      src="/media/shijianus/support/wechat-pay-hk.jpg"
                      alt={convertText('WeChat Pay HK 赞赏码', locale)}
                      className="w-full h-full object-contain rounded-lg group-hover:scale-105 transition-transform"
                    />
                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-semibold transition-opacity rounded-xl gap-1">
                      <Maximize2 className="w-3.5 h-3.5" />
                      <span>{convertText('查看大图', locale)}</span>
                    </div>
                  </div>
                  <span className="block text-xs text-emerald-600/90 dark:text-emerald-400 font-medium">
                    {convertText('WeChat HK 扫码', locale)}
                  </span>
                </div>
              </div>
            )}

            {/* Tab 3: PayPal */}
            {qrTab === 'paypal' && (
              <div className="space-y-3 py-1 animate-in fade-in duration-200 flex-1 flex flex-col justify-center">
                <a
                  href="https://www.paypal.com/paypalme/shijianus"
                  target="_blank"
                  rel="noreferrer noopener"
                  className="w-full p-3 rounded-2xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200/80 dark:border-blue-500/30 flex items-center justify-between group hover:bg-blue-100/70 dark:hover:bg-blue-900/40 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-[#003087] text-white flex items-center justify-center font-black">
                      <PayPalIcon className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors">
                        paypal.me/shijianus
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">
                        {convertText('推荐使用同币种 PayPal 转账赞赏以减少手续费', locale)}
                      </div>
                    </div>
                  </div>
                  <ExternalLink className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                </a>

                <div className="grid grid-cols-2 gap-3 sm:gap-3.5">
                  <div className="p-3 rounded-2xl border border-slate-200/80 dark:border-white/10 text-center space-y-1.5 bg-slate-50/50 dark:bg-white/[0.02]">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{convertText('PayPal HK 码', locale)}</span>
                    <img
                      src="/media/shijianus/support/paypal-hk.jpg"
                      alt={convertText('PayPal HK 码', locale)}
                      className="w-full aspect-square object-contain rounded-xl p-1 bg-white cursor-pointer shadow-2xs max-w-[170px] mx-auto"
                      onClick={() =>
                        setModalImage({ src: '/media/shijianus/support/paypal-hk.jpg', title: convertText('PayPal HK 码', locale) })
                      }
                    />
                  </div>
                  <div className="p-3 rounded-2xl border border-slate-200/80 dark:border-white/10 text-center space-y-1.5 bg-slate-50/50 dark:bg-white/[0.02]">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{convertText('PayPal UK 码', locale)}</span>
                    <img
                      src="/media/shijianus/support/paypal-uk.jpg"
                      alt={convertText('PayPal UK 码', locale)}
                      className="w-full aspect-square object-contain rounded-xl p-1 bg-white cursor-pointer shadow-2xs max-w-[170px] mx-auto"
                      onClick={() =>
                        setModalImage({ src: '/media/shijianus/support/paypal-uk.jpg', title: convertText('PayPal UK 码', locale) })
                      }
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Tab 4: Web3 / USDT */}
            {qrTab === 'crypto' && (
              <div className="space-y-3 py-1 animate-in fade-in duration-200 flex-1 flex flex-col justify-center">
                <div className="p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/80 dark:border-emerald-500/20 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <UsdtIcon className="w-5 h-5" />
                      <div>
                        <div className="text-sm font-bold text-slate-900 dark:text-white">
                          USDT (Arbitrum One)
                        </div>
                        <div className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                          {convertText('以太坊 Layer 2 极低矿工费通道', locale)}
                        </div>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">
                      Arbitrum
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-white dark:bg-[#1a1e2d] border border-slate-200/70 dark:border-white/10 space-y-1.5 shadow-2xs">
                    <div className="text-[10px] text-slate-400 font-mono">{convertText('收款钱包地址 (EVM Compatible)：', locale)}</div>
                    <code className="block text-xs font-mono break-all text-slate-800 dark:text-slate-200 select-all font-semibold">
                      0x00d52edc5230dD21F521D8396c68b84D576e6041
                    </code>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      handleCopy('0x00d52edc5230dD21F521D8396c68b84D576e6041', 'crypto-addr')
                    }
                    className="w-full py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                  >
                    {copiedKey === 'crypto-addr' ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>{convertText('已复制到剪贴板！', locale)}</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>{convertText('复制 USDT Arbitrum 钱包地址', locale)}</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="p-3 rounded-xl bg-slate-50/80 dark:bg-white/[0.02] border border-slate-200/60 dark:border-white/[0.05] text-[11px] text-slate-500 dark:text-slate-400 space-y-1">
                  <div className="font-semibold text-slate-700 dark:text-slate-300">{convertText('💡 转账提示：', locale)}</div>
                  <p>{convertText('仅支持 Arbitrum One 网络的 USDT (ERC-20) 资产，链上确认极速且 Gas 极低（约 $0.01）。', locale)}</p>
                </div>
              </div>
            )}
          </div>

          {/* Direct QR Transparency & Refund Guarantee Notice */}
          <div className="pt-3 border-t border-slate-100 dark:border-white/[0.06]">
            <div className="p-3 rounded-2xl bg-slate-50/80 dark:bg-white/[0.03] border border-slate-200/60 dark:border-white/[0.06] flex items-start gap-2.5">
              <div className="p-1 rounded-lg bg-blue-100 dark:bg-blue-900/40 text-[#425aef] dark:text-blue-300 shrink-0 mt-0.5">
                <Heart className="w-3.5 h-3.5 fill-current" />
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                {convertText('扫码赞赏可在转账附言中备注称呼与寄语，博主核对账单后将手动录入名册；误操作支持原路退款，资金去向与变动均如实公示。', locale)}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── 3. Part 2: Supporter Roster (公开致谢名册与资金公示) ────────────────── */}
      <section id="sponsor-records" className="space-y-6 pt-4">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="support-section-header">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#425aef] dark:text-blue-400 mb-1">
              <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
              <span>{t('support.rosterBadge', '公开致谢名册')}</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
              {t('support.records.title', '支援名录与资金公示')}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              {t('support.records.subtitle', '致谢每一位慷慨支持的读者与同行，真实资金去向透明挂钩，未动用部分严谨显示“-”。')}
            </p>
          </div>

          {/* Search bar */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder={t('support.search.placeholder', '搜索支持者、寄语或渠道...')}
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setTablePage(1);
              }}
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-white dark:bg-[#121520] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#425aef]/30"
            />
          </div>
        </div>

        {/* Highlight Metrics Cards: Strictly synchronized with database records */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
          <div className="p-4 rounded-2xl bg-white dark:bg-[#121520] border border-slate-200/80 dark:border-white/[0.08] shadow-2xs hover:shadow-xs transition-all">
            <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              <span>{convertText('累计支持人次', locale)}</span>
              <Users className="w-3.5 h-3.5 text-blue-500" />
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
              {isLoadingSponsors ? (
                <span className="text-slate-400 text-lg">{convertText('加载中…', locale)}</span>
              ) : (
                <>
                  {metrics.totalSupporters} {convertText('位', locale) ? <span className="text-xs font-normal text-slate-400">{convertText('位', locale)}</span> : null}
                </>
              )}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              {metrics.totalSupporters === 0 ? convertText('期待第一位支持者 ✨', locale) : `${metrics.currencyCount} currencies`}
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-[#121520] border border-slate-200/80 dark:border-white/[0.08] shadow-2xs hover:shadow-xs transition-all">
            <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              <span>{convertText('咖啡档位支持', locale)}</span>
              <Coffee className="w-3.5 h-3.5 text-amber-500" />
            </div>
            <div className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">
              {isLoadingSponsors ? (
                <span className="text-slate-400 text-lg">{convertText('加载中…', locale)}</span>
              ) : (
                <>
                  {metrics.totalCups} <span className="text-xs font-normal text-slate-400">{convertText('杯 ☕', locale)}</span>
                </>
              )}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              {metrics.totalCups === 0 ? convertText('暂无咖啡记录', locale) : convertText('等值咖啡换算累计', locale)}
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-[#121520] border border-slate-200/80 dark:border-white/[0.08] shadow-2xs hover:shadow-xs transition-all">
            <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              <span>{convertText('汇聚币种', locale)}</span>
              <Sparkles className="w-3.5 h-3.5 text-[#425aef]" />
            </div>
            <div className="text-2xl font-black text-[#425aef] dark:text-blue-400 mt-1">
              {isLoadingSponsors ? (
                <span className="text-slate-400 text-lg">{convertText('加载中…', locale)}</span>
              ) : (
                <>
                  {metrics.currencyCount} <span className="text-xs font-normal text-slate-400">{convertText('种', locale)}</span>
                </>
              )}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              {metrics.currencyCount === 0 ? convertText('支持 14 款法币', locale) : convertText('真实跨币种结算', locale)}
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-[#121520] border border-slate-200/80 dark:border-white/[0.08] shadow-2xs hover:shadow-xs transition-all">
            <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              <span>{convertText('最新支持', locale)}</span>
              <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
            </div>
            <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1 truncate">
              {isLoadingSponsors ? (
                <span className="text-slate-400 text-lg font-normal">{convertText('加载中…', locale)}</span>
              ) : metrics.latestSponsor ? (
                <div className="flex items-baseline gap-1.5 truncate">
                  <span className="truncate">{metrics.latestSponsor.formattedAmount}</span>
                  <span className="text-xs font-normal text-slate-400 shrink-0">
                    {metrics.latestSponsor.currency}
                  </span>
                </div>
              ) : (
                <span className="text-slate-400 text-base font-medium">{convertText('虚位以待', locale)}</span>
              )}
            </div>
            <div
              className="text-[10px] text-slate-400 mt-0.5 truncate"
              title={
                metrics.latestSponsor
                  ? `${metrics.latestSponsor.name} · ${metrics.latestSponsor.date}${metrics.latestSponsor.message ? ` · “${metrics.latestSponsor.message}”` : ''}`
                  : undefined
              }
            >
              {isLoadingSponsors ? (
                <span>{convertText('正在同步名册…', locale)}</span>
              ) : metrics.latestSponsor ? (
                <span className="inline-flex items-center gap-1 max-w-full truncate">
                  <span className="font-semibold text-slate-700 dark:text-slate-200 truncate max-w-[120px]">
                    {metrics.latestSponsor.name}
                  </span>
                  <span className="opacity-40 shrink-0">·</span>
                  <span className="shrink-0">{metrics.latestSponsor.date}</span>
                </span>
              ) : (
                <span>{convertText('期待第一位支持者 ✨', locale)}</span>
              )}
            </div>
          </div>
        </div>

        {/* Supporter Table: with explicit Allocation (资金去向 / 消费公示) column */}
        <div className="rounded-2xl border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#121520] overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50 dark:bg-white/[0.03] border-b border-slate-200/80 dark:border-white/[0.07] text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                <tr>
                  <th scope="col" className="px-5 py-3.5">{t('support.table.sponsor', '赞赏支持者')}</th>
                  <th scope="col" className="px-4 py-3.5">{t('support.table.amount', '支持金额')}</th>
                  <th scope="col" className="px-4 py-3.5">{t('support.table.message', '祝福与寄语')}</th>
                  <th scope="col" className="px-4 py-3.5">{t('support.table.channel', '支付渠道')}</th>
                  <th scope="col" className="px-4 py-3.5">{t('support.table.purpose', '资金去向 / 消费公示')}</th>
                  <th scope="col" className="px-5 py-3.5 text-right">{t('support.table.date', '日期')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/[0.05]">
                {isLoadingSponsors ? (
                  <tr>
                    <td colSpan={6} className="py-14 text-center text-sm text-slate-400 dark:text-slate-500">
                      {t('support.records.loading', '正在从数据库读取公开致谢名册…')}
                    </td>
                  </tr>
                ) : paginatedSponsors.length > 0 ? (
                  paginatedSponsors.map((sponsor) => (
                    <tr
                      key={sponsor.id}
                      className="hover:bg-slate-50/60 dark:hover:bg-white/[0.02] transition-colors"
                    >
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-900/40 text-[#425aef] dark:text-blue-300 flex items-center justify-center font-bold text-xs shrink-0">
                            {sponsor.name.slice(0, 1).toUpperCase()}
                          </div>
                          <span className="font-bold text-slate-900 dark:text-white">
                            {sponsor.name}
                          </span>
                        </div>
                      </td>

                      <td className="px-4 py-3.5 whitespace-nowrap font-bold text-slate-900 dark:text-white">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-extrabold bg-blue-50 dark:bg-blue-950/40 text-[#425aef] dark:text-blue-300 border border-blue-100 dark:border-blue-900/50">
                          {sponsor.currency === 'USD'
                            ? '$'
                            : sponsor.currency === 'CNY'
                            ? '¥'
                            : sponsor.currency === 'HKD'
                            ? 'HK$'
                            : sponsor.currency === 'GBP'
                            ? '£'
                            : sponsor.currency === 'EUR'
                            ? '€'
                            : sponsor.currency === 'JPY'
                            ? '¥'
                            : sponsor.currency === 'TWD'
                            ? 'NT$'
                            : sponsor.currency === 'SGD'
                            ? 'S$'
                            : sponsor.currency === 'CAD'
                            ? 'CA$'
                            : sponsor.currency === 'AUD'
                            ? 'A$'
                            : sponsor.currency === 'MYR'
                            ? 'RM'
                            : sponsor.currency === 'KRW'
                            ? '₩'
                            : ''}
                          {sponsor.amount} {sponsor.currency}
                        </span>
                      </td>

                      <td className="px-4 py-3.5 max-w-xs md:max-w-md">
                        {sponsor.message ? (
                          <span className="text-slate-700 dark:text-slate-300 text-xs italic">
                            "{sponsor.message}"
                          </span>
                        ) : (
                          <span className="text-slate-400 dark:text-slate-400 text-xs">
                            {convertText('默默送上心意 ❤️', locale)}
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 dark:bg-white/[0.06] text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-white/10">
                          {sponsor.channel}
                        </span>
                      </td>

                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-md text-[11px] font-medium ${
                            sponsor.allocation && sponsor.allocation !== '-'
                              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/40'
                              : 'text-slate-400 dark:text-slate-500 font-mono text-center'
                          }`}
                        >
                          {sponsor.allocation && sponsor.allocation !== '-' ? `🎯 ${sponsor.allocation}` : '—'}
                        </span>
                      </td>

                      <td className="px-5 py-3.5 whitespace-nowrap text-right text-xs text-slate-400 dark:text-slate-400 font-mono">
                        {sponsor.date}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="py-14 text-center">
                      <div className="w-12 h-12 mx-auto rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-[#425aef] dark:text-blue-400 flex items-center justify-center border border-blue-100 dark:border-blue-900/40 shadow-xs mb-3">
                        <Coffee className="w-6 h-6" />
                      </div>
                      <div className="text-sm font-bold text-slate-800 dark:text-slate-200">
                        {searchQuery ? convertText('未搜索到相关支持者记录', locale) : convertText('暂无公开致谢记录', locale)}
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                        {searchQuery
                          ? convertText('请尝试更换关键词搜索', locale)
                          : convertText('所有通过 Stripe 国际收银台、微信、支付宝等完成的赞赏均在此实时公开展示。欢迎通过上方收银台成为第一位支持者 ✨', locale)}
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Advanced Pagination Bar */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-5 py-3.5 border-t border-slate-100 dark:border-white/[0.06] text-xs text-slate-500 dark:text-slate-400">
              <div>
                {convertText('第', locale)} <strong className="text-slate-800 dark:text-white font-bold">{tablePage}</strong> / {totalPages} {locale === 'en' ? 'pages' : convertText('页', locale)} ({filteredSponsors.length} {locale === 'en' ? 'records total' : convertText('条记录', locale)})
              </div>

              <div className="flex items-center gap-1.5 relative">
                <button
                  type="button"
                  disabled={tablePage <= 1}
                  onClick={() => setTablePage((p) => Math.max(p - 1, 1))}
                  className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/5 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors flex items-center gap-1 font-medium"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>{convertText('上一页', locale)}</span>
                </button>

                <div className="flex items-center gap-1">
                  {paginationItems.map((item) => {
                    if (item.type === 'page' && item.page !== undefined) {
                      const isCurrent = item.page === tablePage;
                      return (
                        <button
                          key={item.key}
                          type="button"
                          onClick={() => setTablePage(item.page!)}
                          className={`w-8 h-8 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center ${
                            isCurrent
                              ? 'bg-[#425aef] text-white shadow-xs'
                              : 'border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/5 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          {item.page}
                        </button>
                      );
                    }

                    return (
                      <div key={item.key} className="relative">
                        <button
                          type="button"
                          onClick={() => setShowJumpPopover((prev) => !prev)}
                          title={convertText('点击快速跳转页面', locale)}
                          className="w-8 h-8 rounded-lg border border-slate-200 dark:border-white/10 hover:border-[#425aef] hover:text-[#425aef] text-slate-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-xs font-bold transition-colors cursor-pointer flex items-center justify-center"
                        >
                          ...
                        </button>
                      </div>
                    );
                  })}
                </div>

                <button
                  type="button"
                  disabled={tablePage >= totalPages}
                  onClick={() => setTablePage((p) => Math.min(p + 1, totalPages))}
                  className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/5 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors flex items-center gap-1 font-medium"
                >
                  <span>{convertText('下一页', locale)}</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>

                {showJumpPopover && (
                  <div className="absolute right-0 bottom-full mb-2 z-20 p-3 rounded-2xl bg-white dark:bg-[#1a1e2d] border border-slate-200 dark:border-white/10 shadow-xl animate-in zoom-in-95 duration-150 w-48">
                    <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-slate-100 dark:border-white/10">
                      <span className="text-[11px] font-bold text-slate-800 dark:text-white">{convertText('快速跳转至页码', locale)}</span>
                      <button
                        type="button"
                        onClick={() => setShowJumpPopover(false)}
                        className="text-slate-400 hover:text-slate-600"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <form onSubmit={handleJumpSubmit} className="flex gap-1.5">
                      <input
                        type="number"
                        min={1}
                        max={totalPages}
                        placeholder={`1 ~ ${totalPages}`}
                        value={jumpPageInput}
                        onChange={(e) => setJumpPageInput(e.target.value)}
                        className="w-full px-2.5 py-1 text-xs font-bold rounded-lg bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white focus:outline-hidden focus:ring-1 focus:ring-[#425aef]"
                        autoFocus
                      />
                      <button
                        type="submit"
                        className="px-2.5 py-1 rounded-lg bg-[#425aef] hover:bg-blue-600 text-white font-bold text-xs cursor-pointer"
                      >
                        {convertText('跳转', locale)}
                      </button>
                    </form>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ── 4. FAQs Section: Strictly Aligned Full-Width With Above Cards ───── */}
      <section className="space-y-4 pt-4 w-full">
        <div className="text-center max-w-xl mx-auto mb-6">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            FAQ & Transparency
          </span>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mt-0.5">
            {t('support.faqTitle', '常見問題與透明度承諾')}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1.5">
            {convertText('关于资金流向、多币种换算、退款机制与隐私安全的坦诚说明', locale)}
          </p>
        </div>

        <div className="w-full space-y-3">
          {supportConfig.faqs.map((faq, idx) => {
            const isOpen = expandedFaq === idx;
            return (
              <div
                key={idx}
                className="w-full rounded-2xl border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#121520] overflow-hidden transition-all shadow-2xs"
              >
                <button
                  type="button"
                  onClick={() => setExpandedFaq(isOpen ? null : idx)}
                  className="w-full px-5 py-4 text-left flex items-center justify-between gap-4 font-bold text-sm text-slate-900 dark:text-white hover:text-[#425aef] dark:hover:text-blue-400 transition-colors cursor-pointer"
                >
                  <span>{convertText(faq.question, locale)}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-400 transition-transform duration-200 shrink-0 ${
                      isOpen ? 'rotate-180 text-[#425aef]' : ''
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="px-5 pb-4 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed border-t border-slate-100 dark:border-white/[0.06] pt-3 animate-in fade-in">
                    {convertText(faq.answer, locale)}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* ── 5. Modal for Enlarging QR Codes ───────────────────────────── */}
      {modalImage && (
        <div
          className="fixed inset-0 z-[10001] flex items-center justify-center p-4 bg-black/65 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={() => setModalImage(null)}
        >
          <div
            className="w-full max-w-sm bg-white dark:bg-[#121520] rounded-3xl p-6 border border-slate-200 dark:border-white/10 shadow-2xl text-center space-y-4 animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-white/10">
              <span className="font-bold text-sm text-slate-900 dark:text-white">
                {modalImage.title}
              </span>
              <button
                type="button"
                onClick={() => setModalImage(null)}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="aspect-square bg-white p-3 rounded-2xl shadow-inner border border-slate-100">
              <img
                src={modalImage.src}
                alt={modalImage.title}
                className="w-full h-full object-contain"
              />
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400">
              {convertText('请使用相应 App 扫描上方二维码完成赞赏', locale)}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default SupportDashboard;
