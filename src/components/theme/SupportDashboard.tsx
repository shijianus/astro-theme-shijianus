import React, { useState, useEffect, useMemo } from 'react';
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

/* ── 6 个档位专属温馨生动、纯粹专业的咖啡品类阶梯与交互动画 SVG (100% 咖啡主题、零杂质) ── */

/** Tier 0 (RM3 / $1 / ¥4): 便捷速溶咖啡条与小纸杯 (轻盈便捷的每日第一口咖啡) */
const SceneInstantCoffee: React.FC<{ isSelected?: boolean }> = () => (
  <svg viewBox="0 0 115 44" className="w-full h-10 sm:h-11 overflow-visible" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* 桌面边缘微基线 */}
    <line x1="20" y1="38" x2="100" y2="38" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" opacity="0.3" />
    
    {/* 细长速溶咖啡包装条 (Sachet Pack - 40度倾斜往杯里倒) */}
    <g transform="rotate(-36 48 18)" className="animate-coffee-sachet-pour" style={{ transformOrigin: '48px 18px' }}>
      {/* 包装长条 */}
      <rect x="24" y="14" width="34" height="9" rx="1.5" fill="currentColor" fillOpacity="0.35" stroke="currentColor" strokeWidth="1.2" />
      {/* 封口锯齿纹 */}
      <line x1="26" y1="14" x2="26" y2="23" stroke="currentColor" strokeWidth="1" strokeDasharray="1.5 1.5" opacity="0.7" />
      <line x1="56" y1="14" x2="56" y2="23" stroke="currentColor" strokeWidth="1" strokeDasharray="1.5 1.5" opacity="0.7" />
      {/* 撕开缺口 */}
      <path d="M 58 17 L 55 18.5 L 58 20" stroke="currentColor" strokeWidth="0.8" fill="currentColor" opacity="0.8" />
      {/* 咖啡豆小标签 */}
      <ellipse cx="40" cy="18.5" rx="3.5" ry="2.2" fill="currentColor" fillOpacity="0.6" />
      <path d="M 40 16.5 Q 40 18.5 38 18.5 Q 40 18.5 40 20.5" stroke="#ffffff" strokeWidth="0.7" fill="none" opacity="0.9" />
    </g>

    {/* 倾倒落下的微小咖啡颗粒动效 */}
    <g className="animate-coffee-granules">
      <circle cx="56" cy="22" r="0.9" fill="currentColor" opacity="0.85" />
      <circle cx="58" cy="25" r="0.8" fill="currentColor" opacity="0.75" />
      <circle cx="55" cy="27" r="0.7" fill="currentColor" opacity="0.65" />
    </g>

    {/* 便捷小纸杯 */}
    <path d="M 56 22 L 60 38 H 78 L 82 22 Z" fill="currentColor" fillOpacity="0.22" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
    {/* 杯口卷边 */}
    <rect x="54" y="20.5" width="30" height="2.5" rx="1.2" fill="currentColor" fillOpacity="0.5" stroke="currentColor" strokeWidth="0.8" />
    {/* 杯身波纹隔热贴纸 */}
    <path d="M 60 26 H 78 L 76 34 H 62 Z" fill="currentColor" fillOpacity="0.18" />
    <line x1="63" y1="30" x2="75" y2="30" stroke="currentColor" strokeWidth="1" strokeDasharray="2 1.5" opacity="0.5" />

    {/* 热气升腾 */}
    <path className="animate-coffee-steam-1" d="M 66 18 C 64 14, 68 10, 65 6" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    <path className="animate-coffee-steam-2" d="M 72 17 C 74 13, 70 9, 73 5" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
  </svg>
);

/** Tier 1 (RM8 / $2.5 / ¥9): 经典商品外带咖啡纸杯 (工位与街角外带美式咖啡) */
const SceneTakeawayCup: React.FC<{ isSelected?: boolean }> = () => (
  <svg viewBox="0 0 115 44" className="w-full h-10 sm:h-11 overflow-visible" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* 桌面边缘基线 */}
    <line x1="20" y1="38" x2="98" y2="38" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" opacity="0.3" />

    {/* 外带咖啡杯主体 */}
    <g className="animate-coffee-cup-bounce" style={{ transformOrigin: '58px 38px' }}>
      {/* 杯身 */}
      <path d="M 44 14 L 48 38 H 68 L 72 14 Z" fill="currentColor" fillOpacity="0.25" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
      {/* 加厚防烫瓦楞杯套 */}
      <path d="M 46 20 L 48 32 H 68 L 70 20 Z" fill="currentColor" fillOpacity="0.45" stroke="currentColor" strokeWidth="1" />
      {/* 杯套中央爱心咖啡标 */}
      <circle cx="58" cy="26" r="3.6" fill="currentColor" fillOpacity="0.75" />
      <path d="M 58 24.5 C 57 23.5, 55.5 24, 55.5 25 C 55.5 25.8, 58 27.2, 58 27.2 C 58 27.2, 60.5 25.8, 60.5 25 C 60.5 24, 59 23.5, 58 24.5 Z" fill="#ffffff" opacity="0.95" />

      {/* 专业防溢外凸杯盖 */}
      <path d="M 42 14 H 74 V 11 C 74 9.8, 72.8 9, 71.5 9 H 44.5 C 43.2 9, 42 9.8, 42 11 Z" fill="currentColor" fillOpacity="0.5" stroke="currentColor" strokeWidth="1.2" />
      {/* 杯盖饮口突起与小吸口 */}
      <rect x="44" y="7.5" width="8" height="2" rx="0.5" fill="currentColor" fillOpacity="0.8" />
      <ellipse cx="48" cy="7.5" rx="1.5" ry="0.6" fill="#ffffff" opacity="0.8" />
    </g>

    {/* 从杯盖吸口袅袅飘出的两缕热气动效 */}
    <path className="animate-coffee-steam-1" d="M 48 6 C 46 2, 51 -1, 48 -4" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    <path className="animate-coffee-steam-2" d="M 52 5 C 55 1, 50 -2, 53 -5" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />

    {/* 杯旁的 2 颗饱满咖啡豆点缀 */}
    <g transform="translate(80, 29) rotate(25)">
      <ellipse cx="0" cy="0" rx="4" ry="2.6" fill="currentColor" fillOpacity="0.55" stroke="currentColor" strokeWidth="0.8" />
      <path d="M -3 0 Q 0 1 3 0" stroke="#ffffff" strokeWidth="0.8" fill="none" opacity="0.85" />
    </g>
    <g transform="translate(88, 34) rotate(-35)">
      <ellipse cx="0" cy="0" rx="3.5" ry="2.3" fill="currentColor" fillOpacity="0.4" stroke="currentColor" strokeWidth="0.8" />
      <path d="M -2.5 0 Q 0 -0.8 2.5 0" stroke="#ffffff" strokeWidth="0.7" fill="none" opacity="0.85" />
    </g>
  </svg>
);

/** Tier 2 (RM13 / $4 / ¥14): 精致意式拿铁拉花陶瓷杯 (默认推荐热门档位：现磨爱心拉花咖啡) */
const SceneLatteArt: React.FC<{ isSelected?: boolean }> = () => (
  <svg viewBox="0 0 115 44" className="w-full h-10 sm:h-11 overflow-visible" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* 陶瓷托盘 (Saucer) */}
    <ellipse cx="58" cy="37.5" rx="28" ry="3.5" fill="currentColor" fillOpacity="0.25" stroke="currentColor" strokeWidth="1.2" />
    <ellipse cx="58" cy="37" rx="16" ry="1.5" fill="currentColor" fillOpacity="0.2" />

    {/* 陶瓷咖啡杯身与把手 */}
    <g className="animate-coffee-cup-gentle">
      {/* 宽口圆润杯身 */}
      <path d="M 40 21 C 40 33, 47 36, 58 36 C 69 36, 76 33, 76 21 Z" fill="currentColor" fillOpacity="0.3" stroke="currentColor" strokeWidth="1.3" />
      {/* 圆润杯把手 */}
      <path d="M 75 23 C 83 23, 83 31, 74 32" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.75" />
      {/* 杯口液面椭圆 */}
      <ellipse cx="58" cy="21" rx="18" ry="4" fill="currentColor" fillOpacity="0.65" stroke="currentColor" strokeWidth="1.1" />

      {/* 绝美拿铁爱心拉花 (Heart Latte Foam Art) */}
      <g className="animate-coffee-latte-pulse" style={{ transformOrigin: '58px 21px' }}>
        <ellipse cx="58" cy="21" rx="14" ry="3" fill="#ffffff" fillOpacity="0.9" />
        {/* 咖啡色拉花心形与叶瓣纹理 */}
        <path d="M 58 23 C 54 20, 52 18, 55 17.2 C 57.5 16.5, 58 19, 58 19 C 58 19, 58.5 16.5, 61 17.2 C 64 18, 62 20, 58 23 Z" fill="currentColor" opacity="0.8" />
        <path d="M 58 19.5 V 23.5" stroke="currentColor" strokeWidth="0.8" strokeLinecap="round" opacity="0.85" />
      </g>
    </g>

    {/* 袅袅升华的香醇蒸汽 */}
    <path className="animate-coffee-steam-1" d="M 52 15 C 50 10, 54 6, 51 2" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    <path className="animate-coffee-steam-2" d="M 58 15 C 60 11, 56 6, 59 1" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    <path className="animate-coffee-steam-3" d="M 64 15 C 62 10, 66 7, 64 3" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />

    {/* 托盘边的香浓咖啡豆 */}
    <g transform="translate(26, 35) rotate(-20)">
      <ellipse cx="0" cy="0" rx="3.8" ry="2.4" fill="currentColor" fillOpacity="0.55" stroke="currentColor" strokeWidth="0.8" />
      <path d="M -2.8 0 Q 0 0.8 2.8 0" stroke="#ffffff" strokeWidth="0.8" fill="none" opacity="0.85" />
    </g>
  </svg>
);

/** Tier 3 (RM17 / $5 / ¥16): 经典意式八角摩卡壶萃取 (浓烈纯正的意式 Espresso 冲煮) */
const SceneMokaPot: React.FC<{ isSelected?: boolean }> = () => (
  <svg viewBox="0 0 115 44" className="w-full h-10 sm:h-11 overflow-visible" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* 桌面边缘 */}
    <line x1="16" y1="38" x2="102" y2="38" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" opacity="0.3" />

    {/* 经典 Bialetti 八角摩卡壶 */}
    <g className="animate-coffee-moka-rumble" style={{ transformOrigin: '48px 38px' }}>
      {/* 底部下壶 (储水腔与压力安全阀) */}
      <path d="M 38 38 L 40 28 H 58 L 60 38 Z" fill="currentColor" fillOpacity="0.38" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
      {/* 铜质安全泄压阀 */}
      <circle cx="41" cy="33" r="1.3" fill="currentColor" opacity="0.9" />
      
      {/* 中间旋紧接环腰线 */}
      <rect x="39" y="26.5" width="20" height="2" rx="0.5" fill="currentColor" fillOpacity="0.65" stroke="currentColor" strokeWidth="0.8" />

      {/* 上壶 (经典的倒梯形八角棱面刻线) */}
      <path d="M 40 26.5 L 36 15 H 62 L 58 26.5 Z" fill="currentColor" fillOpacity="0.28" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
      {/* 八角切面反光棱线 */}
      <line x1="45" y1="26.5" x2="43" y2="15" stroke="currentColor" strokeWidth="0.9" opacity="0.5" />
      <line x1="53" y1="26.5" x2="55" y2="15" stroke="currentColor" strokeWidth="0.9" opacity="0.5" />

      {/* 尖形出液鹰嘴壶嘴 */}
      <path d="M 36 17 L 31 15 L 36 21 Z" fill="currentColor" fillOpacity="0.5" stroke="currentColor" strokeWidth="1" strokeLinejoin="round" />

      {/* 棱角分明的壶盖与球形提纽 */}
      <path d="M 36 15 L 49 10 L 62 15 Z" fill="currentColor" fillOpacity="0.5" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
      <circle cx="49" cy="8.5" r="1.8" fill="currentColor" opacity="0.9" />

      {/* 经典黑色人体工学隔热侧把手 */}
      <path d="M 61 16 H 67 C 69 16, 70 18, 69 22 L 67 31 C 66 33, 64 34, 62 34 H 59" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" opacity="0.85" />
    </g>

    {/* 从壶嘴升腾的浓郁蒸汽与香气气团 */}
    <path className="animate-coffee-steam-1" d="M 30 13 C 27 9, 32 5, 29 1" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    <path className="animate-coffee-steam-2" d="M 34 11 C 37 7, 33 3, 36 -1" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />

    {/* 旁边放着的一杯已萃取出的 Espresso Demitasse 小杯 */}
    <g transform="translate(76, 26)">
      <ellipse cx="10" cy="12" rx="8" ry="1.8" fill="currentColor" fillOpacity="0.25" stroke="currentColor" strokeWidth="0.8" />
      <path d="M 4 3 C 4 9, 6 11, 10 11 C 14 11, 16 9, 16 3 Z" fill="currentColor" fillOpacity="0.35" stroke="currentColor" strokeWidth="1" />
      <ellipse cx="10" cy="3" rx="6" ry="1.6" fill="currentColor" fillOpacity="0.75" />
      <path d="M 16 4 C 18.5 4, 18.5 8, 16 9" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
      {/* 浓缩表层的金黄油脂 Crema 光泽 */}
      <ellipse cx="10" cy="3" rx="4" ry="1" fill="#ffffff" opacity="0.6" />
      <path className="animate-coffee-steam-3" d="M 10 0 C 9 -3, 12 -5, 10 -8" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
    </g>
  </svg>
);

/** Tier 4 (RM20 / $6.5 / ¥20): 专业慢调手冲咖啡壶 (精品手冲 V60 滤杯、长颈细嘴壶与分享壶) */
const ScenePourOver: React.FC<{ isSelected?: boolean }> = () => (
  <svg viewBox="0 0 115 44" className="w-full h-10 sm:h-11 overflow-visible" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* 桌面边缘基线 */}
    <line x1="16" y1="38" x2="104" y2="38" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" opacity="0.3" />

    {/* 手冲细嘴长颈壶 (Gooseneck Kettle) 正在精准注水 */}
    <g className="animate-coffee-kettle-pour" style={{ transformOrigin: '32px 14px' }}>
      {/* 壶身 */}
      <path d="M 18 26 L 20 12 H 30 L 33 26 Z" fill="currentColor" fillOpacity="0.3" stroke="currentColor" strokeWidth="1.1" strokeLinejoin="round" />
      <path d="M 21 12 Q 25 10 29 12" stroke="currentColor" strokeWidth="1" fill="none" />
      {/* 壶把手 */}
      <path d="M 18 14 C 13 14, 13 24, 18 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.7" />
      {/* 优雅的天鹅颈细长壶嘴 (Gooseneck Spout) */}
      <path d="M 32 23 C 37 21, 38 10, 43 9 L 45 10" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      {/* 缓缓注入的一道细水流 */}
      <path d="M 45 11 Q 48 13 49 17" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" opacity="0.8" strokeDasharray="3 1" />
    </g>

    {/* V60 滤杯与玻璃分享壶整体 */}
    <g className="animate-coffee-server-glow">
      {/* 下方耐热玻璃咖啡分享壶 (Server Carat) */}
      <path d="M 49 26 L 46 38 H 74 L 71 26 Z" fill="currentColor" fillOpacity="0.2" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
      {/* 壶身刻度线与玻璃把手 */}
      <line x1="50" y1="30" x2="54" y2="30" stroke="currentColor" strokeWidth="0.8" opacity="0.5" />
      <line x1="49" y1="34" x2="55" y2="34" stroke="currentColor" strokeWidth="0.8" opacity="0.5" />
      <path d="M 72 28 C 77 28, 77 36, 73 36" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.75" />
      {/* 壶内积聚的金黄色咖啡液位 */}
      <path d="M 47.5 33 L 46 38 H 74 L 72.5 33 Z" fill="currentColor" fillOpacity="0.45" />

      {/* 上方 V60 圆锥形滤杯 (Cone Dripper) */}
      <path d="M 46 17 L 54 26 H 66 L 74 17 Z" fill="currentColor" fillOpacity="0.35" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
      {/* 锥形滤纸边沿与咖啡粉层粉坑 */}
      <path d="M 48 18 H 72" stroke="currentColor" strokeWidth="1" strokeDasharray="2 2" opacity="0.6" />
      <ellipse cx="60" cy="18" rx="8" ry="2" fill="currentColor" fillOpacity="0.65" />
    </g>

    {/* 滤出滴落的咖啡液滴动效 */}
    <circle cx="60" cy="28.5" r="1.1" fill="currentColor" opacity="0.9" className="animate-coffee-drip" />

    {/* 氤氲优雅的香气热气 */}
    <path className="animate-coffee-steam-1" d="M 64 13 C 66 9, 62 5, 65 1" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    <path className="animate-coffee-steam-2" d="M 70 14 C 73 10, 68 6, 71 2" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
  </svg>
);

/** Tier 5 (RM25 / $8 / ¥25): 殿堂冷萃冰滴塔与特调大冰球杯 (数小时慢滴萃取的夏日冰滴特调) */
const SceneColdBrewTower: React.FC<{ isSelected?: boolean }> = () => (
  <svg viewBox="0 0 115 44" className="w-full h-10 sm:h-11 overflow-visible" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* 桌面边缘 */}
    <line x1="16" y1="38" x2="104" y2="38" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" opacity="0.3" />

    {/* 精密古典冰滴咖啡塔架 (Dutch Cold Drip Tower) */}
    <g className="animate-coffee-tower-drip">
      {/* 木质/金属垂直支架 */}
      <line x1="28" y1="6" x2="28" y2="38" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
      <line x1="52" y1="6" x2="52" y2="38" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
      <line x1="26" y1="6" x2="54" y2="6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" opacity="0.7" />
      <line x1="26" y1="21" x2="54" y2="21" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" opacity="0.5" />

      {/* 上层：晶莹冰块与冷水上壶 */}
      <ellipse cx="40" cy="9" rx="9" ry="3" fill="currentColor" fillOpacity="0.25" stroke="currentColor" strokeWidth="1" />
      <path d="M 31 9 C 31 15, 33 18, 40 18 C 47 18, 49 15, 49 9" fill="currentColor" fillOpacity="0.2" stroke="currentColor" strokeWidth="1" />
      {/* 冰块多面体小轮廓 */}
      <rect x="36" y="11" width="3.5" height="3.5" rx="0.5" fill="#ffffff" opacity="0.7" />
      <rect x="41" y="12" width="3" height="3" rx="0.5" fill="#ffffff" opacity="0.6" />

      {/* 中层：慢速点滴微调阀门与咖啡粉滤杯 */}
      <circle cx="40" cy="20" r="1.5" fill="currentColor" opacity="0.9" />
      <path d="M 34 22 L 36 28 H 44 L 46 22 Z" fill="currentColor" fillOpacity="0.4" stroke="currentColor" strokeWidth="1" />

      {/* 下层：慢萃深色冷萃咖啡收集烧瓶 */}
      <path d="M 37 30 L 33 38 H 47 L 43 30 Z" fill="currentColor" fillOpacity="0.3" stroke="currentColor" strokeWidth="1" />
      <path d="M 34.5 35 L 33 38 H 47 L 45.5 35 Z" fill="currentColor" fillOpacity="0.65" />
      {/* 慢滴水珠动画 */}
      <circle cx="40" cy="24" r="0.9" fill="currentColor" opacity="0.9" className="animate-coffee-drop-slow" />
    </g>

    {/* 旁边放着的威士忌特调杯与纯净大圆冰球 */}
    <g transform="translate(68, 16)" className="animate-coffee-glass-shine">
      {/* 厚底水晶古典杯 (Rock Glass) */}
      <path d="M 6 4 L 9 22 H 27 L 30 4 Z" fill="currentColor" fillOpacity="0.2" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
      {/* 厚重玻璃底座 */}
      <rect x="8.5" y="19" width="19" height="3" rx="1" fill="currentColor" fillOpacity="0.4" />
      {/* 杯内冷萃咖啡液 */}
      <path d="M 7.5 10 L 9 22 H 27 L 28.5 10 Z" fill="currentColor" fillOpacity="0.4" />

      {/* 晶莹大圆冰球 (Crystal Ice Sphere) */}
      <circle cx="18" cy="12" r="6" fill="#ffffff" fillOpacity="0.6" stroke="currentColor" strokeWidth="1" />
      <ellipse cx="16" cy="10" rx="2" ry="1" fill="#ffffff" opacity="0.9" />

      {/* 杯沿插着的一枚鲜亮香橙片点缀 */}
      <path d="M 27 5 A 5 5 0 0 1 33 11 L 29 11 Z" fill="currentColor" fillOpacity="0.75" stroke="currentColor" strokeWidth="0.8" />
    </g>

    {/* 奢华冷萃香气与冰雾 */}
    <path className="animate-coffee-steam-1" d="M 86 12 C 84 8, 88 5, 85 1" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" opacity="0.7" />
    <path className="animate-coffee-steam-2" d="M 92 13 C 95 9, 91 6, 94 2" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" opacity="0.6" />
  </svg>
);

/* ── 6 个档位专属咖啡品类主题配置 (100% 咖啡主题、层次递进) ── */
const TIER_STYLES = [
  {
    name: 'amber',
    scene: SceneInstantCoffee,
    selected:
      'bg-gradient-to-br from-amber-500 via-amber-600 to-amber-700 border-amber-500 text-white shadow-md shadow-amber-500/25 ring-2 ring-amber-400/50 scale-[1.02]',
    unselected:
      'bg-gradient-to-b from-amber-50/90 via-amber-50/40 to-orange-50/25 dark:from-amber-950/25 dark:via-amber-950/15 dark:to-slate-900/60 border-amber-200/80 dark:border-amber-800/40 text-amber-950 dark:text-amber-100 hover:border-amber-400 dark:hover:border-amber-500 hover:shadow-xs',
    sceneColorSelected: 'text-white',
    sceneColorUnselected: 'text-amber-700/70 dark:text-amber-300/60 group-hover:text-amber-900 dark:group-hover:text-amber-100',
    amountSelected: 'text-white',
    amountUnselected: 'text-amber-950 dark:text-amber-100',
  },
  {
    name: 'orange',
    scene: SceneTakeawayCup,
    selected:
      'bg-gradient-to-br from-orange-500 via-orange-600 to-amber-600 border-orange-500 text-white shadow-md shadow-orange-500/25 ring-2 ring-orange-400/50 scale-[1.02]',
    unselected:
      'bg-gradient-to-b from-orange-50/90 via-orange-50/40 to-amber-50/25 dark:from-orange-950/25 dark:via-orange-950/15 dark:to-slate-900/60 border-orange-200/80 dark:border-orange-800/40 text-orange-950 dark:text-orange-100 hover:border-orange-400 dark:hover:border-orange-500 hover:shadow-xs',
    sceneColorSelected: 'text-white',
    sceneColorUnselected: 'text-orange-700/70 dark:text-orange-300/60 group-hover:text-orange-900 dark:group-hover:text-orange-100',
    amountSelected: 'text-white',
    amountUnselected: 'text-orange-950 dark:text-orange-100',
  },
  {
    name: 'blue',
    scene: SceneLatteArt,
    selected:
      'bg-gradient-to-br from-[#425aef] via-blue-600 to-indigo-700 border-[#425aef] text-white shadow-md shadow-blue-500/30 ring-2 ring-blue-400/50 scale-[1.02]',
    unselected:
      'bg-gradient-to-b from-blue-50/90 via-indigo-50/40 to-blue-50/25 dark:from-blue-950/25 dark:via-blue-950/15 dark:to-slate-900/60 border-blue-200/80 dark:border-blue-800/40 text-blue-950 dark:text-blue-100 hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-xs',
    sceneColorSelected: 'text-white',
    sceneColorUnselected: 'text-[#425aef]/75 dark:text-blue-300/65 group-hover:text-blue-700 dark:group-hover:text-blue-200',
    amountSelected: 'text-white',
    amountUnselected: 'text-blue-950 dark:text-blue-100',
  },
  {
    name: 'emerald',
    scene: SceneMokaPot,
    selected:
      'bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-700 border-emerald-500 text-white shadow-md shadow-emerald-500/25 ring-2 ring-emerald-400/50 scale-[1.02]',
    unselected:
      'bg-gradient-to-b from-emerald-50/90 via-teal-50/40 to-emerald-50/25 dark:from-emerald-950/25 dark:via-emerald-950/15 dark:to-slate-900/60 border-emerald-200/80 dark:border-emerald-800/40 text-emerald-950 dark:text-emerald-100 hover:border-emerald-400 dark:hover:border-emerald-500 hover:shadow-xs',
    sceneColorSelected: 'text-white',
    sceneColorUnselected: 'text-emerald-700/70 dark:text-emerald-300/60 group-hover:text-emerald-900 dark:group-hover:text-emerald-100',
    amountSelected: 'text-white',
    amountUnselected: 'text-emerald-950 dark:text-emerald-100',
  },
  {
    name: 'purple',
    scene: ScenePourOver,
    selected:
      'bg-gradient-to-br from-purple-500 via-purple-600 to-violet-700 border-purple-500 text-white shadow-md shadow-purple-500/25 ring-2 ring-purple-400/50 scale-[1.02]',
    unselected:
      'bg-gradient-to-b from-purple-50/90 via-violet-50/40 to-purple-50/25 dark:from-purple-950/25 dark:via-purple-950/15 dark:to-slate-900/60 border-purple-200/80 dark:border-purple-800/40 text-purple-950 dark:text-purple-100 hover:border-purple-400 dark:hover:border-purple-500 hover:shadow-xs',
    sceneColorSelected: 'text-white',
    sceneColorUnselected: 'text-purple-700/70 dark:text-purple-300/60 group-hover:text-purple-900 dark:group-hover:text-purple-100',
    amountSelected: 'text-white',
    amountUnselected: 'text-purple-950 dark:text-purple-100',
  },
  {
    name: 'rose',
    scene: SceneColdBrewTower,
    selected:
      'bg-gradient-to-br from-rose-500 via-pink-600 to-rose-700 border-rose-500 text-white shadow-md shadow-rose-500/25 ring-2 ring-rose-400/50 scale-[1.02]',
    unselected:
      'bg-gradient-to-b from-rose-50/90 via-pink-50/40 to-rose-50/25 dark:from-rose-950/25 dark:via-rose-950/15 dark:to-slate-900/60 border-rose-200/80 dark:border-rose-800/40 text-rose-950 dark:text-rose-100 hover:border-rose-400 dark:hover:border-rose-500 hover:shadow-xs',
    sceneColorSelected: 'text-white',
    sceneColorUnselected: 'text-rose-700/70 dark:text-rose-300/60 group-hover:text-rose-900 dark:group-hover:text-rose-100',
    amountSelected: 'text-white',
    amountUnselected: 'text-rose-950 dark:text-rose-100',
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

export const SupportDashboard: React.FC = () => {
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

    // 3. 拉取 D1 真实致谢记录（绝无 mock 伪造）
    setIsLoadingSponsors(true);
    fetch(`/api/sponsorships?limit=50&_t=${Date.now()}`, { cache: 'no-store' })
      .then((res) => res.json())
      .then((data: any) => {
        if (data?.ok && Array.isArray(data.list)) {
          const apiItems: SponsorItem[] = data.list.map((item: any) => ({
            id: item.id,
            name: item.name || '匿名支持者',
            amount: item.amount,
            currency: item.currency,
            message: item.message,
            channel: item.channel || 'Stripe (国际收银台)',
            allocation: item.allocation || '-',
            date: item.createdAt ? item.createdAt.split('T')[0] : '近期',
          }));
          setSponsors(apiItems);
        }
      })
      .catch(() => {})
      .finally(() => {
        setIsLoadingSponsors(false);
      });
  }, []);

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

    const latestDonor =
      sponsors.length > 0 ? (sponsors[0]?.name || '热心读者') : '虚位以待 · 期待支持 ✨';

    return {
      totalSupporters,
      totalCups,
      currencyCount: currencies.size,
      latestDonor,
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
      {/* ── Scoped Keyframe Animations for Warm Interactive Creator SVG Scenes ── */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes coffeeSteamRise1 {
          0% { transform: translateY(0) scaleX(1); opacity: 0; }
          25% { opacity: 0.85; }
          70% { opacity: 0.45; }
          100% { transform: translateY(-7px) scaleX(1.3); opacity: 0; }
        }
        @keyframes coffeeSteamRise2 {
          0% { transform: translateY(0) scaleX(1); opacity: 0; }
          30% { opacity: 0.9; }
          75% { opacity: 0.4; }
          100% { transform: translateY(-8px) scaleX(1.25); opacity: 0; }
        }
        @keyframes coffeeSteamRise3 {
          0% { transform: translateY(0) scaleX(1); opacity: 0; }
          25% { opacity: 0.8; }
          80% { opacity: 0.35; }
          100% { transform: translateY(-6px) scaleX(1.2); opacity: 0; }
        }
        @keyframes coffeeSachetPour {
          0%, 100% { transform: rotate(-36deg) translateY(0); }
          50% { transform: rotate(-44deg) translateY(1px); }
        }
        @keyframes coffeeGranulesDrop {
          0% { transform: translateY(0) scale(0.6); opacity: 0; }
          35% { opacity: 0.95; }
          75% { transform: translateY(4px) scale(1); opacity: 0.7; }
          100% { transform: translateY(8px) scale(0.4); opacity: 0; }
        }
        @keyframes coffeeCupBounce {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-1.5px) scale(1.02); }
        }
        @keyframes coffeeCupGentle {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-1px); }
        }
        @keyframes coffeeLattePulse {
          0%, 100% { transform: scale(1); opacity: 0.9; }
          50% { transform: scale(1.05); opacity: 1; }
        }
        @keyframes coffeeMokaRumble {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          25% { transform: translateY(-0.8px) rotate(-0.5deg); }
          50% { transform: translateY(-1.4px) rotate(0.6deg); }
          75% { transform: translateY(-0.4px) rotate(-0.3deg); }
        }
        @keyframes coffeeKettlePour {
          0%, 100% { transform: rotate(0deg) translateY(0); }
          50% { transform: rotate(-5deg) translateY(-1px); }
        }
        @keyframes coffeeServerGlow {
          0%, 100% { opacity: 0.95; }
          50% { opacity: 1; }
        }
        @keyframes coffeeDripDrop {
          0% { transform: translateY(0) scale(0.6); opacity: 0; }
          30% { opacity: 1; transform: translateY(1.5px) scale(1); }
          80% { opacity: 0.8; transform: translateY(5px) scale(0.8); }
          100% { transform: translateY(7px) scale(0.2); opacity: 0; }
        }
        @keyframes coffeeTowerDrip {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-0.8px); }
        }
        @keyframes coffeeDropSlow {
          0% { transform: translateY(0) scale(0.5); opacity: 0; }
          25% { opacity: 1; transform: translateY(1px) scale(1); }
          75% { opacity: 0.85; transform: translateY(7px) scale(0.9); }
          100% { transform: translateY(11px) scale(0.3); opacity: 0; }
        }
        @keyframes coffeeGlassShine {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-1.2px); }
        }

        .animate-coffee-steam-1 {
          animation: coffeeSteamRise1 2.4s ease-in-out infinite;
        }
        .animate-coffee-steam-2 {
          animation: coffeeSteamRise2 2.8s ease-in-out 0.6s infinite;
        }
        .animate-coffee-steam-3 {
          animation: coffeeSteamRise3 2.2s ease-in-out 1.2s infinite;
        }
        .animate-coffee-sachet-pour {
          animation: coffeeSachetPour 2.6s ease-in-out infinite;
        }
        .animate-coffee-granules {
          animation: coffeeGranulesDrop 1.8s cubic-bezier(0.4, 0, 0.2, 1) infinite;
        }
        .animate-coffee-cup-bounce {
          animation: coffeeCupBounce 2.8s ease-in-out infinite;
        }
        .animate-coffee-cup-gentle {
          animation: coffeeCupGentle 3s ease-in-out infinite;
        }
        .animate-coffee-latte-pulse {
          animation: coffeeLattePulse 2.4s ease-in-out infinite;
        }
        .animate-coffee-moka-rumble {
          animation: coffeeMokaRumble 2.2s ease-in-out infinite;
        }
        .animate-coffee-kettle-pour {
          animation: coffeeKettlePour 3.2s ease-in-out infinite;
        }
        .animate-coffee-server-glow {
          animation: coffeeServerGlow 2.5s ease-in-out infinite;
        }
        .animate-coffee-drip {
          animation: coffeeDripDrop 1.6s cubic-bezier(0.4, 0, 0.2, 1) infinite;
        }
        .animate-coffee-tower-drip {
          animation: coffeeTowerDrip 3.5s ease-in-out infinite;
        }
        .animate-coffee-drop-slow {
          animation: coffeeDropSlow 2.4s cubic-bezier(0.4, 0, 0.2, 1) infinite;
        }
        .animate-coffee-glass-shine {
          animation: coffeeGlassShine 3s ease-in-out infinite;
        }

        /* 悬浮微交互：各咖啡场景独立加速 */
        .group:hover .animate-coffee-sachet-pour {
          animation-duration: 1.5s;
        }
        .group:hover .animate-coffee-granules {
          animation-duration: 1.0s;
        }
        .group:hover .animate-coffee-cup-bounce {
          animation-duration: 1.6s;
        }
        .group:hover .animate-coffee-latte-pulse {
          animation-duration: 1.3s;
        }
        .group:hover .animate-coffee-moka-rumble {
          animation-duration: 1.2s;
        }
        .group:hover .animate-coffee-kettle-pour {
          animation-duration: 1.8s;
        }
        .group:hover .animate-coffee-drip {
          animation-duration: 0.9s;
        }
        .group:hover .animate-coffee-drop-slow {
          animation-duration: 1.4s;
        }
        .group:hover .animate-coffee-glass-shine {
          animation-duration: 1.5s;
        }
        .group:hover .animate-coffee-steam-1 {
          animation-duration: 1.4s;
        }
        .group:hover .animate-coffee-steam-2 {
          animation-duration: 1.6s;
        }
        .group:hover .animate-coffee-steam-3 {
          animation-duration: 1.3s;
        }
      ` }} />

      {/* ── 1. Hero Header ────────────────────────────────────────────── */}
      <section className="support-hero relative overflow-hidden rounded-3xl p-6 sm:p-10 md:p-12 text-center bg-gradient-to-b from-blue-50/70 via-white to-slate-50/50 dark:from-[#151a2e]/80 dark:via-[#0e121f] dark:to-[#0a0d17] border border-blue-100/80 dark:border-white/[0.08] shadow-sm">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-blue-100/80 dark:bg-blue-500/20 text-[#425aef] dark:text-blue-300 border border-blue-200/60 dark:border-blue-500/30 mb-4">
          <Coffee className="w-4 h-4 text-[#425aef]" />
          <span>{supportConfig.subtitle}</span>
        </div>

        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight mb-4">
          {supportConfig.title}
        </h1>

        <p className="max-w-2xl mx-auto text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed mb-6">
          {supportConfig.description}
        </p>

        <div className="flex flex-wrap justify-center gap-2 sm:gap-2.5 max-w-3xl mx-auto">
          {supportConfig.trustPills.map((pill, idx) => (
            <span
              key={idx}
              className="px-3 py-1 text-xs rounded-lg bg-white/80 dark:bg-white/[0.05] border border-slate-200/80 dark:border-white/[0.08] text-slate-700 dark:text-slate-300 shadow-2xs backdrop-blur-xs font-medium"
            >
              {pill}
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
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3.5 border-b border-slate-100 dark:border-white/[0.06]">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#425aef] dark:text-blue-400">
                  Stripe 国际收银台
                </span>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mt-0.5">
                  自选金额与寄语
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
                  title={`本地货币 (${localCurrencyOption.name})`}
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
                  title={`统一结算货币 (${globalCurrencyOption.name})`}
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
                  推荐支持档位
                </label>
                {activeCurrencyType === 'global' ? (
                  <span className="text-[11px] text-[#425aef] dark:text-blue-400 font-medium">
                    ⚡ 已随本地购买力（PPP）汇率自适应
                  </span>
                ) : (
                  <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
                    自适应常用赞赏梯度
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
                      title={`赞赏支持 ${activeCurrencySymbol}${amt} ${activeCurrencyCode.toUpperCase()}`}
                      aria-label={`${activeCurrencySymbol}${amt}`}
                    >
                      {/* Left: Warm Bold Amount + Currency Code + Active Checkmark */}
                      <div className="relative z-10 flex flex-col justify-center select-none shrink-0 pointer-events-none">
                        <div className="flex items-baseline gap-1.5">
                          <span
                            className={`text-base sm:text-lg font-black tracking-tight leading-none transition-transform duration-200 group-hover:scale-105 ${
                              isSelected ? tier.amountSelected : tier.amountUnselected
                            }`}
                          >
                            {activeCurrencySymbol}{amt}
                          </span>
                          {isSelected && (
                            <span className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full bg-white/25 text-white shadow-2xs">
                              <Check className="w-2.5 h-2.5 stroke-[3]" />
                            </span>
                          )}
                        </div>
                        <span
                          className={`text-[9px] sm:text-[9.5px] font-bold tracking-wider uppercase leading-none mt-1 ${
                            isSelected ? 'text-white/80' : 'text-slate-400 dark:text-slate-500'
                          }`}
                        >
                          {activeCurrencyCode}
                        </span>
                      </div>

                      {/* Right: Rich Interactive Animated SVG Creator Scene */}
                      <div
                        className={`absolute right-0.5 sm:right-1 bottom-0 top-0 w-16 sm:w-28 md:w-32 flex items-center justify-end pointer-events-none transition-all duration-200 ${
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
                    placeholder={`自定义金额（${activeCurrencySymbol}${activeMin} ~ ${activeCurrencySymbol}${activeMax}）`}
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
                    请输入 {activeCurrencySymbol}{activeMin} ~ {activeCurrencySymbol}{activeMax} 之间的金额
                  </div>
                )}
              </div>
            </div>

            {/* Supporter Inputs */}
            <div className="space-y-2.5 pt-0.5">
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                留下你的名字与寄语（可选）
              </label>
              <div className="space-y-2.5">
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                    👤 称呼或社交账号 (Name or social handle) (可选)
                  </label>
                  <input
                    type="text"
                    maxLength={32}
                    placeholder="例如：@github_username 或 Shijian Friend"
                    value={donorName}
                    onChange={(e) => setDonorName(e.target.value)}
                    className="w-full px-4 py-2 text-xs sm:text-sm rounded-xl bg-slate-50/70 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#425aef]/40 transition-all"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                    💬 留言寄语 (Say something nice) (可选)
                  </label>
                  <textarea
                    rows={2}
                    maxLength={120}
                    placeholder="写下想对作者说的话或鼓励..."
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
              className="w-full group relative overflow-hidden py-3.5 px-6 rounded-2xl text-white font-bold text-sm sm:text-base flex items-center justify-center gap-2.5 shadow-lg shadow-blue-500/25 transition-all duration-200 bg-[linear-gradient(115deg,#3B82F6_0%,#425AEF_50%,#7C3AED_100%)] hover:shadow-xl hover:shadow-blue-500/40 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              <CreditCard className="w-5 h-5 text-white/90" />
              <span>
                前往 Stripe 安全收银台支付 — {activeCurrencySymbol}
                {effectiveAmount} {activeCurrencyCode}
              </span>
              <ArrowRight className="w-4 h-4 text-white/80 group-hover:translate-x-1 transition-transform" />
            </button>
            <p className="text-center text-[11px] text-slate-400 dark:text-slate-500 mt-2">
              🔒 由 Stripe 提供金融级加密结账 · 支持 Apple Pay / Google Pay / 国际信用卡
            </p>
          </div>
        </div>

        {/* Right Column: Local & Cross-border QR Codes (5 Cols, perfectly filled without empty space) */}
        <div className="lg:col-span-5 bg-white dark:bg-[#121520] rounded-3xl p-5 sm:p-6 border border-slate-200/80 dark:border-white/[0.08] shadow-sm flex flex-col justify-between space-y-4">
          <div className="space-y-3.5 flex-1 flex flex-col">
            <div className="pb-3 border-b border-slate-100 dark:border-white/[0.06]">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                本地与跨国支付通道
              </span>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mt-0.5">
                微信 / 支付宝 / PayPal / Web3
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
                <span>国内扫码</span>
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
                <span>港澳渠道</span>
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
                <span>PayPal</span>
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
                <span>USDT</span>
              </button>
            </div>

            {/* Tab 1: CN QR Codes */}
            {qrTab === 'cn' && (
              <div className="grid grid-cols-2 gap-3 sm:gap-3.5 py-1 animate-in fade-in duration-200 flex-1 items-center">
                <div className="p-3 sm:p-3.5 rounded-2xl bg-gradient-to-b from-slate-50 to-emerald-50/35 dark:from-emerald-950/20 dark:to-[#151928] border border-emerald-200/70 dark:border-emerald-500/20 text-center space-y-2 group transition-all duration-150 hover:shadow-md hover:border-emerald-300 dark:hover:border-emerald-500/40">
                  <div className="flex items-center justify-center gap-1.5 text-xs sm:text-sm font-bold text-emerald-700 dark:text-emerald-300">
                    <WeChatIcon className="w-4 h-4" />
                    <span>微信支付</span>
                  </div>
                  <div
                    className="relative aspect-square rounded-xl overflow-hidden bg-white p-2 shadow-2xs border border-slate-100 dark:border-white/5 cursor-pointer max-w-[190px] mx-auto"
                    onClick={() =>
                      setModalImage({
                        src: '/media/shijianus/support/weixin-pay-cn.jpg',
                        title: '微信支付赞赏码',
                      })
                    }
                  >
                    <img
                      src="/media/shijianus/support/weixin-pay-cn.jpg"
                      alt="微信支付赞赏码"
                      className="w-full h-full object-contain rounded-lg group-hover:scale-105 transition-transform"
                    />
                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-semibold transition-opacity rounded-xl gap-1">
                      <Maximize2 className="w-3.5 h-3.5" />
                      <span>查看大图</span>
                    </div>
                  </div>
                  <span className="block text-xs text-emerald-600/90 dark:text-emerald-400 font-medium">
                    微信扫一扫赞赏
                  </span>
                </div>

                <div className="p-3 sm:p-3.5 rounded-2xl bg-gradient-to-b from-slate-50 to-blue-50/35 dark:from-blue-950/20 dark:to-[#151928] border border-blue-200/70 dark:border-blue-500/20 text-center space-y-2 group transition-all duration-150 hover:shadow-md hover:border-blue-300 dark:hover:border-blue-500/40">
                  <div className="flex items-center justify-center gap-1.5 text-xs sm:text-sm font-bold text-blue-700 dark:text-blue-300">
                    <AlipayIcon className="w-4 h-4" />
                    <span>支付宝</span>
                  </div>
                  <div
                    className="relative aspect-square rounded-xl overflow-hidden bg-white p-2 shadow-2xs border border-slate-100 dark:border-white/5 cursor-pointer max-w-[190px] mx-auto"
                    onClick={() =>
                      setModalImage({
                        src: '/media/shijianus/support/alipay-cn.jpg',
                        title: '支付宝赞赏码',
                      })
                    }
                  >
                    <img
                      src="/media/shijianus/support/alipay-cn.jpg"
                      alt="支付宝赞赏码"
                      className="w-full h-full object-contain rounded-lg group-hover:scale-105 transition-transform"
                    />
                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-semibold transition-opacity rounded-xl gap-1">
                      <Maximize2 className="w-3.5 h-3.5" />
                      <span>查看大图</span>
                    </div>
                  </div>
                  <span className="block text-xs text-blue-600/90 dark:text-blue-400 font-medium">
                    支付宝扫一扫赞赏
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
                        title: 'Alipay HK 赞赏码',
                      })
                    }
                  >
                    <img
                      src="/media/shijianus/support/alipay-hk.jpg"
                      alt="Alipay HK 赞赏码"
                      className="w-full h-full object-contain rounded-lg group-hover:scale-105 transition-transform"
                    />
                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-semibold transition-opacity rounded-xl gap-1">
                      <Maximize2 className="w-3.5 h-3.5" />
                      <span>查看大图</span>
                    </div>
                  </div>
                  <span className="block text-xs text-indigo-600/90 dark:text-indigo-400 font-medium">
                    港币 HKD 扫码
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
                        title: 'WeChat Pay HK 赞赏码',
                      })
                    }
                  >
                    <img
                      src="/media/shijianus/support/wechat-pay-hk.jpg"
                      alt="WeChat Pay HK 赞赏码"
                      className="w-full h-full object-contain rounded-lg group-hover:scale-105 transition-transform"
                    />
                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-semibold transition-opacity rounded-xl gap-1">
                      <Maximize2 className="w-3.5 h-3.5" />
                      <span>查看大图</span>
                    </div>
                  </div>
                  <span className="block text-xs text-emerald-600/90 dark:text-emerald-400 font-medium">
                    WeChat HK 扫码
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
                        推荐使用同币种 PayPal 转账赞赏以减少手续费
                      </div>
                    </div>
                  </div>
                  <ExternalLink className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                </a>

                <div className="grid grid-cols-2 gap-3 sm:gap-3.5">
                  <div className="p-3 rounded-2xl border border-slate-200/80 dark:border-white/10 text-center space-y-1.5 bg-slate-50/50 dark:bg-white/[0.02]">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">PayPal HK 码</span>
                    <img
                      src="/media/shijianus/support/paypal-hk.jpg"
                      alt="PayPal HK"
                      className="w-full aspect-square object-contain rounded-xl p-1 bg-white cursor-pointer shadow-2xs max-w-[170px] mx-auto"
                      onClick={() =>
                        setModalImage({ src: '/media/shijianus/support/paypal-hk.jpg', title: 'PayPal HK' })
                      }
                    />
                  </div>
                  <div className="p-3 rounded-2xl border border-slate-200/80 dark:border-white/10 text-center space-y-1.5 bg-slate-50/50 dark:bg-white/[0.02]">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">PayPal UK 码</span>
                    <img
                      src="/media/shijianus/support/paypal-uk.jpg"
                      alt="PayPal UK"
                      className="w-full aspect-square object-contain rounded-xl p-1 bg-white cursor-pointer shadow-2xs max-w-[170px] mx-auto"
                      onClick={() =>
                        setModalImage({ src: '/media/shijianus/support/paypal-uk.jpg', title: 'PayPal UK' })
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
                          以太坊 Layer 2 极低矿工费通道
                        </div>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">
                      Arbitrum
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-white dark:bg-[#1a1e2d] border border-slate-200/70 dark:border-white/10 space-y-1.5 shadow-2xs">
                    <div className="text-[10px] text-slate-400 font-mono">收款钱包地址 (EVM Compatible)：</div>
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
                        <span>已复制到剪贴板！</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>复制 USDT Arbitrum 钱包地址</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="p-3 rounded-xl bg-slate-50/80 dark:bg-white/[0.02] border border-slate-200/60 dark:border-white/[0.05] text-[11px] text-slate-500 dark:text-slate-400 space-y-1">
                  <div className="font-semibold text-slate-700 dark:text-slate-300">💡 转账提示：</div>
                  <p>仅支持 Arbitrum One 网络的 USDT (ERC-20) 资产，链上确认极速且 Gas 极低（约 $0.01）。</p>
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
                扫码赞赏可在转账附言中备注称呼与寄语，博主核对账单后将手动录入名册；误操作支持原路退款，资金去向与变动均如实公示。
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── 3. Part 2: Supporter Roster (公开致谢名册与资金公示) ────────────────── */}
      <section id="sponsor-records" className="space-y-6 pt-4">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#425aef] dark:text-blue-400 mb-1">
              <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
              <span>公开致谢名册</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
              支援名录与资金公示
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              致谢每一位慷慨支持的读者与同行，真实资金去向透明挂钩，未动用部分严谨显示“-”。
            </p>
          </div>

          {/* Search bar */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="搜索支持者、寄语或渠道..."
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
              <span>累计支持人次</span>
              <Users className="w-3.5 h-3.5 text-blue-500" />
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
              {isLoadingSponsors ? (
                <span className="text-slate-400 text-lg">加载中…</span>
              ) : (
                <>
                  {metrics.totalSupporters} <span className="text-xs font-normal text-slate-400">位</span>
                </>
              )}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              {metrics.totalSupporters === 0 ? '期待第一位支持者 ✨' : `来自 ${metrics.currencyCount} 个货币区`}
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-[#121520] border border-slate-200/80 dark:border-white/[0.08] shadow-2xs hover:shadow-xs transition-all">
            <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              <span>咖啡档位支持</span>
              <Coffee className="w-3.5 h-3.5 text-amber-500" />
            </div>
            <div className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">
              {isLoadingSponsors ? (
                <span className="text-slate-400 text-lg">加载中…</span>
              ) : (
                <>
                  {metrics.totalCups} <span className="text-xs font-normal text-slate-400">杯 ☕</span>
                </>
              )}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              {metrics.totalCups === 0 ? '暂无咖啡记录' : '等值咖啡换算累计'}
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-[#121520] border border-slate-200/80 dark:border-white/[0.08] shadow-2xs hover:shadow-xs transition-all">
            <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              <span>汇聚币种</span>
              <Sparkles className="w-3.5 h-3.5 text-[#425aef]" />
            </div>
            <div className="text-2xl font-black text-[#425aef] dark:text-blue-400 mt-1">
              {isLoadingSponsors ? (
                <span className="text-slate-400 text-lg">加载中…</span>
              ) : (
                <>
                  {metrics.currencyCount} <span className="text-xs font-normal text-slate-400">种</span>
                </>
              )}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              {metrics.currencyCount === 0 ? '支持 14 款法币' : '真实跨币种结算'}
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-[#121520] border border-slate-200/80 dark:border-white/[0.08] shadow-2xs hover:shadow-xs transition-all">
            <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              <span>最新支持</span>
              <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
            </div>
            <div
              className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400 mt-2 truncate"
              title={metrics.latestDonor}
            >
              {isLoadingSponsors ? '同步中…' : metrics.latestDonor}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              {sponsors.length > 0 ? '实时入库同步' : '虚位以待'}
            </div>
          </div>
        </div>

        {/* Supporter Table: with explicit Allocation (资金去向 / 消费公示) column */}
        <div className="rounded-2xl border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#121520] overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50 dark:bg-white/[0.03] border-b border-slate-200/80 dark:border-white/[0.07] text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                <tr>
                  <th scope="col" className="px-5 py-3.5">赞赏支持者</th>
                  <th scope="col" className="px-4 py-3.5">支持金额</th>
                  <th scope="col" className="px-4 py-3.5">祝福与寄语</th>
                  <th scope="col" className="px-4 py-3.5">支付渠道</th>
                  <th scope="col" className="px-4 py-3.5">资金去向 / 消费公示</th>
                  <th scope="col" className="px-5 py-3.5 text-right">日期</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/[0.05]">
                {isLoadingSponsors ? (
                  <tr>
                    <td colSpan={6} className="py-14 text-center text-sm text-slate-400 dark:text-slate-500">
                      正在从数据库读取公开致谢名册…
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
                            默默送上心意 ❤️
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
                        {searchQuery ? '未搜索到相关支持者记录' : '暂无公开致谢记录'}
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                        {searchQuery
                          ? '请尝试更换关键词搜索'
                          : '所有通过 Stripe 国际收银台、微信、支付宝等完成的赞赏均在此实时公开展示。欢迎通过上方收银台成为第一位支持者 ✨'}
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
                第 <strong className="text-slate-800 dark:text-white font-bold">{tablePage}</strong> / {totalPages} 页 (共 {filteredSponsors.length} 条记录)
              </div>

              <div className="flex items-center gap-1.5 relative">
                <button
                  type="button"
                  disabled={tablePage <= 1}
                  onClick={() => setTablePage((p) => Math.max(p - 1, 1))}
                  className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/5 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors flex items-center gap-1 font-medium"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>上一页</span>
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
                          title="点击快速跳转页面"
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
                  <span>下一页</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>

                {showJumpPopover && (
                  <div className="absolute right-0 bottom-full mb-2 z-20 p-3 rounded-2xl bg-white dark:bg-[#1a1e2d] border border-slate-200 dark:border-white/10 shadow-xl animate-in zoom-in-95 duration-150 w-48">
                    <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-slate-100 dark:border-white/10">
                      <span className="text-[11px] font-bold text-slate-800 dark:text-white">快速跳转至页码</span>
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
                        跳转
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
            常見問題與透明度承諾
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1.5">
            关于资金流向、多币种换算、退款机制与隐私安全的坦诚说明
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
                  <span>{faq.question}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-400 transition-transform duration-200 shrink-0 ${
                      isOpen ? 'rotate-180 text-[#425aef]' : ''
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="px-5 pb-4 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed border-t border-slate-100 dark:border-white/[0.06] pt-3 animate-in fade-in">
                    {faq.answer}
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
              请使用相应 App 扫描上方二维码完成赞赏
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default SupportDashboard;
