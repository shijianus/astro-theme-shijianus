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

/* ── 6 个档位专属温馨生动、风格迥异的创作者场景与交互动画 SVG (零重复模板) ── */

/** Tier 0 (RM3 / $1 / ¥4): 掌心微光与爱心拍拍 (轻盈温馨的点赞与友爱) */
const SceneHeartPulse: React.FC<{ isSelected?: boolean }> = () => (
  <svg viewBox="0 0 115 44" className="w-full h-10 sm:h-11 overflow-visible" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* 友善击掌/托举小手掌 */}
    <path d="M 26 38 C 24 33, 23 27, 27 24 C 29 22, 32 23, 33 26 L 35 21 C 36 19, 39 20, 40 22 L 42 20 C 43 18, 46 19, 46 22 L 47 23 C 48 21, 51 22, 51 25 C 51 32, 46 38, 38 38 Z" fill="currentColor" fillOpacity="0.25" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
    {/* 掌心托起的爱心（心跳律动动效） */}
    <g className="animate-support-heart-beat" style={{ transformOrigin: '68px 21px' }}>
      <path d="M 68 30 C 59 21, 54 13, 61 7 C 67 2, 68 9, 68 9 C 68 9, 69 2, 75 7 C 82 13, 77 21, 68 30 Z" fill="currentColor" fillOpacity="0.85" stroke="currentColor" strokeWidth="1.2" />
      <path d="M 62 8 C 60 11, 61 14, 64 17" stroke="currentColor" strokeWidth="1" strokeLinecap="round" opacity="0.6" />
    </g>
    {/* 围绕爱心的灵动扩散波纹与星芒 */}
    <circle cx="68" cy="18" r="14" stroke="currentColor" strokeWidth="1" strokeDasharray="3 3" opacity="0.35" className="animate-support-ripple" style={{ transformOrigin: '68px 18px' }} />
    <path className="animate-support-twinkle-1" d="M 88 12 L 89 14.5 L 91.5 15 L 89 16.5 L 88 19 L 87 16.5 L 84.5 15 L 87 14.5 Z" fill="currentColor" opacity="0.9" />
    <path className="animate-support-twinkle-2" d="M 96 23 L 96.6 24.5 L 98.5 25 L 96.6 25.5 L 96 27 L 95.4 25.5 L 93.5 25 L 95.4 24.5 Z" fill="currentColor" opacity="0.75" />
    <circle cx="82" cy="27" r="1.5" fill="currentColor" opacity="0.7" className="animate-support-twinkle-1" />
  </svg>
);

/** Tier 1 (RM8 / $2.5 / ¥9): 办公桌、热咖啡与笔记本 (用户指定专属场景) */
const SceneDeskCoffee: React.FC<{ isSelected?: boolean }> = () => (
  <svg viewBox="0 0 115 44" className="w-full h-10 sm:h-11 overflow-visible" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* 创作者办公桌面 */}
    <line x1="6" y1="38" x2="110" y2="38" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" opacity="0.35" />
    {/* 办公笔记本电脑 (键盘底座与展开屏幕) */}
    <path d="M 11 38 L 39 38 L 37 34 L 13 34 Z" fill="currentColor" fillOpacity="0.25" stroke="currentColor" strokeWidth="1" opacity="0.85" />
    <path d="M 15 34 L 15 19 C 15 17.5, 16.5 16, 18 16 H 34 C 35.5 16, 37 17.5, 37 19 L 37 34 Z" fill="currentColor" fillOpacity="0.18" stroke="currentColor" strokeWidth="1.2" />
    {/* 屏幕代码高亮 */}
    <line x1="19" y1="21" x2="28" y2="21" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" opacity="0.6" />
    <line x1="19" y1="25" x2="33" y2="25" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" opacity="0.5" />
    <line x1="19" y1="29" x2="25" y2="29" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" opacity="0.6" />
    {/* 办公桌上的冒热气热咖啡杯 */}
    <path d="M 48 23 H 64 V 35 C 64 37.5, 48 37.5, 48 35 Z" fill="currentColor" fillOpacity="0.32" stroke="currentColor" strokeWidth="1.3" />
    <path d="M 64 25.5 C 68.5 25.5, 68.5 32.5, 64 32.5" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    <ellipse cx="56" cy="23" rx="8" ry="2" fill="currentColor" fillOpacity="0.35" />
    {/* 咖啡杯上的温暖爱心徽标 */}
    <path d="M 56 29.5 C 54.5 27.5, 53 28.3, 53 29.5 C 53 30.5, 56 32.3, 56 32.3 C 56 32.3, 59 30.5, 59 29.5 C 59 28.3, 57.5 27.5, 56 29.5 Z" fill="currentColor" opacity="0.65" />
    {/* 3 道冒热气袅袅动画线条 */}
    <path className="animate-support-steam-1" d="M 52 19 C 50 14, 54 11, 52 6" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    <path className="animate-support-steam-2" d="M 56 19 C 58 15, 54 11, 57 5" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    <path className="animate-support-steam-3" d="M 60 19 C 58 14, 62 10, 60 6" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    {/* 办公桌旁边的绿植盆栽装饰 */}
    <path d="M 78 31 L 90 31 L 88 38 L 80 38 Z" fill="currentColor" fillOpacity="0.32" stroke="currentColor" strokeWidth="1.1" />
    <rect x="77" y="30" width="14" height="2" rx="0.5" fill="currentColor" fillOpacity="0.5" />
    <path className="animate-support-plant-sway" d="M 84 30 C 80 25, 82 20, 84 19 C 86 20, 88 25, 84 30 Z" fill="currentColor" fillOpacity="0.55" />
    <path d="M 80 30 C 77 27, 78 24, 81 23 C 82 26, 81 29, 80 30 Z" fill="currentColor" fillOpacity="0.38" />
    <path d="M 88 30 C 91 27, 90 24, 87 23 C 86 26, 87 29, 88 30 Z" fill="currentColor" fillOpacity="0.38" />
  </svg>
);

/** Tier 2 (RM13 / $4 / ¥14): 灵感火花与复古发光灯泡 (默认热门推荐：顿悟与知识启迪) */
const SceneInspirationBulb: React.FC<{ isSelected?: boolean }> = () => (
  <svg viewBox="0 0 115 44" className="w-full h-10 sm:h-11 overflow-visible" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* 发光灯泡主体 (微浮动效) */}
    <g style={{ transformOrigin: '58px 22px' }} className="animate-support-bulb-float">
      {/* 玻璃灯泡外罩 */}
      <path d="M 50 25 C 45 20, 47 11, 54 8 C 61 5, 69 9, 68 18 C 67 22, 64 24, 64 27 H 53 C 53 25, 51 24, 50 25 Z" fill="currentColor" fillOpacity="0.22" stroke="currentColor" strokeWidth="1.3" />
      {/* 内部螺旋心动钨丝 */}
      <path d="M 55 26 V 19 L 58 15 L 61 19 V 26" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" opacity="0.9" />
      <circle cx="58" cy="15" r="2" fill="currentColor" opacity="0.95" />
      {/* 灯泡螺口底座 */}
      <rect x="54" y="27" width="9" height="2.5" rx="0.5" fill="currentColor" fillOpacity="0.45" stroke="currentColor" strokeWidth="0.8" />
      <rect x="54.5" y="29.5" width="8" height="2" rx="0.5" fill="currentColor" fillOpacity="0.55" />
      <path d="M 56 32 C 56 33.5, 61 33.5, 61 32 Z" fill="currentColor" opacity="0.7" />
    </g>
    {/* 放射状灵感光芒光束 */}
    <g className="animate-support-ray-glow" style={{ transformOrigin: '58px 16px' }}>
      <line x1="58" y1="2" x2="58" y2="5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" opacity="0.85" />
      <line x1="45" y1="7" x2="48" y2="10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" opacity="0.75" />
      <line x1="71" y1="7" x2="68" y2="10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" opacity="0.75" />
      <line x1="40" y1="18" x2="43" y2="18" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" opacity="0.8" />
      <line x1="76" y1="18" x2="73" y2="18" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" opacity="0.8" />
    </g>
    {/* 左右 Eureka 顿悟灵感小火花与星光 */}
    <path className="animate-support-twinkle-1" d="M 28 16 L 29.5 19 L 32.5 19.5 L 29.5 21 L 28 24 L 26.5 21 L 23.5 19.5 L 26.5 19 Z" fill="currentColor" opacity="0.85" />
    <path className="animate-support-twinkle-2" d="M 88 14 L 89.2 16.5 L 92 17 L 89.2 18 L 88 20.5 L 86.8 18 L 84 17 L 86.8 16.5 Z" fill="currentColor" opacity="0.85" />
    <circle cx="36" cy="27" r="1.5" fill="currentColor" opacity="0.6" className="animate-support-twinkle-2" />
    <circle cx="82" cy="28" r="1.5" fill="currentColor" opacity="0.6" className="animate-support-twinkle-1" />
  </svg>
);

/** Tier 3 (RM17 / $5 / ¥16): 探索火箭与星辰大海 (加满燃料、一飞冲天) */
const SceneRocketLaunch: React.FC<{ isSelected?: boolean }> = () => (
  <svg viewBox="0 0 115 44" className="w-full h-10 sm:h-11 overflow-visible" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* 背景土星光环星球 */}
    <ellipse cx="23" cy="26" rx="8" ry="8" fill="currentColor" fillOpacity="0.2" stroke="currentColor" strokeWidth="1" opacity="0.6" />
    <ellipse cx="23" cy="26" rx="14" ry="4" stroke="currentColor" strokeWidth="1" strokeDasharray="18 4" opacity="0.45" transform="rotate(-20 23 26)" />
    
    {/* 穿梭火箭主体 (斜向 45 度腾空飞升) */}
    <g className="animate-support-rocket-hover" style={{ transformOrigin: '66px 18px' }}>
      {/* 火箭船舱锥体与机身 */}
      <path d="M 76 8 C 71 10, 58 18, 54 26 L 66 35 C 73 30, 81 17, 83 12 Z" fill="currentColor" fillOpacity="0.35" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
      {/* 舷窗圆形 */}
      <circle cx="68" cy="20" r="3.5" fill="currentColor" fillOpacity="0.6" stroke="currentColor" strokeWidth="1" />
      <circle cx="67" cy="19" r="1" fill="#ffffff" opacity="0.9" />
      {/* 火箭左右尾翼 */}
      <path d="M 54 26 L 45 28 L 51 34 L 57 30 Z" fill="currentColor" fillOpacity="0.5" stroke="currentColor" strokeWidth="1" />
      <path d="M 66 35 L 68 42 L 74 39 L 72 33 Z" fill="currentColor" fillOpacity="0.5" stroke="currentColor" strokeWidth="1" />
      {/* 动力喷管 */}
      <path d="M 56 31 L 50 35" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      {/* 喷射推进火焰 (动态剧烈闪动) */}
      <path className="animate-support-flame-jet" d="M 51 34 C 45 38, 40 42, 36 41 C 39 37, 44 32, 49 32 Z" fill="currentColor" opacity="0.9" />
      <path className="animate-support-flame-inner" d="M 50 34 C 46 37, 43 39, 40 38 C 42 36, 46 33, 48 33 Z" fill="#ffffff" opacity="0.85" />
    </g>
    
    {/* 宇宙星辰与航行光迹 */}
    <path className="animate-support-twinkle-1" d="M 94 8 L 95 10.5 L 97.5 11 L 95 12.5 L 94 15 L 93 12.5 L 90.5 11 L 93 10.5 Z" fill="currentColor" opacity="0.95" />
    <path className="animate-support-twinkle-2" d="M 88 28 L 88.6 29.5 L 90.5 30 L 88.6 30.5 L 88 32 L 87.4 30.5 L 85.5 30 L 87.4 29.5 Z" fill="currentColor" opacity="0.8" />
    <circle cx="78" cy="38" r="1.2" fill="currentColor" opacity="0.6" className="animate-support-twinkle-1" />
  </svg>
);

/** Tier 4 (RM20 / $6.5 / ¥20): 黑胶唱机与漫游音符 (艺术格调与灵动旋律) */
const SceneVinylTurntable: React.FC<{ isSelected?: boolean }> = () => (
  <svg viewBox="0 0 115 44" className="w-full h-10 sm:h-11 overflow-visible" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* 复古黑胶机底座 */}
    <rect x="16" y="16" width="56" height="23" rx="3" fill="currentColor" fillOpacity="0.22" stroke="currentColor" strokeWidth="1.2" />
    {/* 调音旋钮 */}
    <circle cx="64" cy="32" r="2.2" fill="currentColor" fillOpacity="0.5" stroke="currentColor" strokeWidth="0.8" />
    <circle cx="64" cy="24" r="1.5" fill="currentColor" fillOpacity="0.4" />

    {/* 匀速旋转的黑胶唱片 */}
    <g className="animate-support-vinyl-spin" style={{ transformOrigin: '36px 27px' }}>
      <circle cx="36" cy="27" r="13" fill="currentColor" fillOpacity="0.4" stroke="currentColor" strokeWidth="1.2" />
      <circle cx="36" cy="27" r="10" stroke="currentColor" strokeWidth="0.8" strokeDasharray="5 2" opacity="0.5" />
      <circle cx="36" cy="27" r="7" stroke="currentColor" strokeWidth="0.8" strokeDasharray="4 2" opacity="0.55" />
      <circle cx="36" cy="27" r="4" fill="currentColor" fillOpacity="0.65" />
      <circle cx="36" cy="27" r="1.2" fill="#ffffff" opacity="0.9" />
    </g>

    {/* 金属唱针唱臂 (Tonearm) */}
    <circle cx="56" cy="20" r="2" fill="currentColor" fillOpacity="0.7" />
    <path d="M 56 20 L 51 23 L 40 24" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" opacity="0.85" />
    <rect x="38" y="23" width="2.5" height="3" rx="0.5" fill="currentColor" fillOpacity="0.8" />

    {/* 浮动飘逸上升的音乐音符与律动 */}
    <g className="animate-support-note-float-1" style={{ transformOrigin: '80px 20px' }}>
      <path d="M 80 22 C 80 24, 77 25, 75 24 C 73 23, 73 21, 75 20 C 77 19, 80 20, 80 22 Z M 80 22 V 14 L 87 12 V 18 M 87 18 C 87 20, 84 21, 82 20 C 80 19, 80 17, 82 16 C 84 15, 87 16, 87 18 Z" fill="currentColor" opacity="0.85" />
    </g>
    <g className="animate-support-note-float-2" style={{ transformOrigin: '96px 14px' }}>
      <path d="M 97 18 C 97 20, 94 21, 92 20 C 90 19, 91 17, 93 16 C 95 15, 97 16, 97 18 Z M 97 18 V 10 L 102 9 V 12" fill="currentColor" opacity="0.8" />
    </g>
    <path className="animate-support-twinkle-1" d="M 88 29 L 89 30.5 L 90.5 31 L 89 31.5 L 88 33 L 87.5 31.5 L 86 31 L 87.5 30.5 Z" fill="currentColor" opacity="0.7" />
  </svg>
);

/** Tier 5 (RM25 / $8 / ¥25): 荣耀王冠与庆典礼花 (至尊赞赏、盛大加冕) */
const SceneCrownCelebration: React.FC<{ isSelected?: boolean }> = () => (
  <svg viewBox="0 0 115 44" className="w-full h-10 sm:h-11 overflow-visible" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* 浮动华丽王冠主体 */}
    <g className="animate-support-crown-float" style={{ transformOrigin: '56px 23px' }}>
      {/* 王冠底环 */}
      <rect x="36" y="27" width="40" height="4.5" rx="1.5" fill="currentColor" fillOpacity="0.45" stroke="currentColor" strokeWidth="1.2" />
      <line x1="38" y1="29.2" x2="74" y2="29.2" stroke="currentColor" strokeWidth="1" strokeDasharray="3 2" opacity="0.7" />
      
      {/* 王冠五峰造型 */}
      <path d="M 37 27 L 39 16 L 46 22 L 56 12 L 66 22 L 73 16 L 75 27 Z" fill="currentColor" fillOpacity="0.35" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
      
      {/* 峰顶璀璨宝石与光芒圆球 */}
      <circle cx="39" cy="15" r="2" fill="currentColor" opacity="0.9" />
      <circle cx="56" cy="11" r="2.8" fill="currentColor" opacity="0.95" />
      <circle cx="73" cy="15" r="2" fill="currentColor" opacity="0.9" />
      <polygon points="56,17 58.5,21 53.5,21" fill="currentColor" opacity="0.85" />
    </g>

    {/* 四周喷发的庆典礼花碎片与闪耀星芒 */}
    <g className="animate-support-confetti-pop">
      <rect x="22" y="16" width="3.5" height="1.8" rx="0.5" fill="currentColor" opacity="0.85" transform="rotate(35 22 16)" />
      <rect x="28" y="26" width="3" height="1.5" rx="0.5" fill="currentColor" opacity="0.75" transform="rotate(-25 28 26)" />
      <rect x="85" y="16" width="3.5" height="1.8" rx="0.5" fill="currentColor" opacity="0.85" transform="rotate(-30 85 16)" />
      <rect x="81" y="28" width="3" height="1.5" rx="0.5" fill="currentColor" opacity="0.75" transform="rotate(40 81 28)" />
      
      <path className="animate-support-twinkle-1" d="M 24 10 L 25.2 12.5 L 28 13 L 25.2 14 L 24 16.5 L 22.8 14 L 20 13 L 22.8 12.5 Z" fill="currentColor" opacity="0.95" />
      <path className="animate-support-twinkle-2" d="M 92 10 L 93.2 12.5 L 96 13 L 93.2 14 L 92 16.5 L 90.8 14 L 88 13 L 90.8 12.5 Z" fill="currentColor" opacity="0.95" />
      <circle cx="17" cy="22" r="1.5" fill="currentColor" opacity="0.75" className="animate-support-twinkle-2" />
      <circle cx="98" cy="22" r="1.5" fill="currentColor" opacity="0.75" className="animate-support-twinkle-1" />
    </g>
  </svg>
);

/* ── 6 个档位专属温馨生动主题配置 (零重复、场景对应) ── */
const TIER_STYLES = [
  {
    name: 'amber',
    scene: SceneHeartPulse,
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
    scene: SceneDeskCoffee,
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
    scene: SceneInspirationBulb,
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
    scene: SceneRocketLaunch,
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
    scene: SceneVinylTurntable,
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
    scene: SceneCrownCelebration,
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
        @keyframes supportHeartBeat {
          0%, 100% { transform: scale(1); }
          14% { transform: scale(1.18); }
          28% { transform: scale(1); }
          42% { transform: scale(1.12); }
          70% { transform: scale(1); }
        }
        @keyframes supportRipple {
          0% { transform: scale(0.85); opacity: 0.5; }
          50% { transform: scale(1.15); opacity: 0.15; }
          100% { transform: scale(0.85); opacity: 0.5; }
        }
        @keyframes supportSteamRise1 {
          0% { transform: translateY(0) scaleX(1); opacity: 0; }
          25% { opacity: 0.85; }
          70% { opacity: 0.45; }
          100% { transform: translateY(-7px) scaleX(1.3); opacity: 0; }
        }
        @keyframes supportSteamRise2 {
          0% { transform: translateY(0) scaleX(1); opacity: 0; }
          30% { opacity: 0.9; }
          75% { opacity: 0.4; }
          100% { transform: translateY(-8px) scaleX(1.25); opacity: 0; }
        }
        @keyframes supportSteamRise3 {
          0% { transform: translateY(0) scaleX(1); opacity: 0; }
          25% { opacity: 0.8; }
          80% { opacity: 0.35; }
          100% { transform: translateY(-6px) scaleX(1.2); opacity: 0; }
        }
        @keyframes supportPlantSway {
          0%, 100% { transform: rotate(0deg); }
          50% { transform: rotate(3.5deg); }
        }
        @keyframes supportBulbFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-1.5px); }
        }
        @keyframes supportRayGlow {
          0%, 100% { opacity: 0.35; transform: scale(0.92); }
          50% { opacity: 0.95; transform: scale(1.08); }
        }
        @keyframes supportRocketHover {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-2px) rotate(1.2deg); }
        }
        @keyframes supportFlameJet {
          0%, 100% { transform: scale(0.85, 0.9); opacity: 0.75; }
          50% { transform: scale(1.18, 1.2); opacity: 1; }
        }
        @keyframes supportVinylSpin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes supportNoteFloat1 {
          0% { transform: translateY(2px) rotate(0deg); opacity: 0.2; }
          40% { opacity: 0.95; }
          80% { opacity: 0.7; }
          100% { transform: translateY(-8px) rotate(-10deg); opacity: 0; }
        }
        @keyframes supportNoteFloat2 {
          0% { transform: translateY(2px) rotate(0deg); opacity: 0.2; }
          45% { opacity: 0.9; }
          85% { opacity: 0.6; }
          100% { transform: translateY(-7px) rotate(12deg); opacity: 0; }
        }
        @keyframes supportCrownFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-2.2px); }
        }
        @keyframes supportConfettiPop {
          0%, 100% { transform: scale(0.92); opacity: 0.6; }
          50% { transform: scale(1.08); opacity: 1; }
        }
        @keyframes supportTwinkle1 {
          0%, 100% { transform: scale(0.8); opacity: 0.3; }
          50% { transform: scale(1.15); opacity: 0.95; }
        }
        @keyframes supportTwinkle2 {
          0%, 100% { transform: scale(1.1); opacity: 0.85; }
          50% { transform: scale(0.75); opacity: 0.25; }
        }

        .animate-support-heart-beat {
          animation: supportHeartBeat 1.4s ease-in-out infinite;
        }
        .animate-support-ripple {
          animation: supportRipple 2.2s ease-in-out infinite;
        }
        .animate-support-steam-1 {
          animation: supportSteamRise1 2.4s ease-in-out infinite;
        }
        .animate-support-steam-2 {
          animation: supportSteamRise2 2.8s ease-in-out 0.6s infinite;
        }
        .animate-support-steam-3 {
          animation: supportSteamRise3 2.2s ease-in-out 1.2s infinite;
        }
        .animate-support-plant-sway {
          animation: supportPlantSway 3.5s ease-in-out infinite;
          transform-origin: 84px 30px;
        }
        .animate-support-bulb-float {
          animation: supportBulbFloat 2.5s ease-in-out infinite;
        }
        .animate-support-ray-glow {
          animation: supportRayGlow 2s ease-in-out infinite;
        }
        .animate-support-rocket-hover {
          animation: supportRocketHover 2.2s ease-in-out infinite;
        }
        .animate-support-flame-jet {
          animation: supportFlameJet 0.4s ease-in-out infinite alternate;
          transform-origin: 52px 34px;
        }
        .animate-support-flame-inner {
          animation: supportFlameJet 0.35s ease-in-out 0.1s infinite alternate;
          transform-origin: 51px 34px;
        }
        .animate-support-vinyl-spin {
          animation: supportVinylSpin 4s linear infinite;
        }
        .animate-support-note-float-1 {
          animation: supportNoteFloat1 2.6s ease-in-out infinite;
        }
        .animate-support-note-float-2 {
          animation: supportNoteFloat2 2.8s ease-in-out 0.9s infinite;
        }
        .animate-support-crown-float {
          animation: supportCrownFloat 2.4s ease-in-out infinite;
        }
        .animate-support-confetti-pop {
          animation: supportConfettiPop 2s ease-in-out infinite;
          transform-origin: 56px 22px;
        }
        .animate-support-twinkle-1 {
          animation: supportTwinkle1 2s ease-in-out infinite;
          transform-origin: center;
        }
        .animate-support-twinkle-2 {
          animation: supportTwinkle2 2.4s ease-in-out 0.8s infinite;
          transform-origin: center;
        }

        /* 悬浮微交互：各场景独立加速与高亮 */
        .group:hover .animate-support-heart-beat {
          animation-duration: 0.8s;
        }
        .group:hover .animate-support-steam-1 {
          animation-duration: 1.4s;
        }
        .group:hover .animate-support-steam-2 {
          animation-duration: 1.6s;
        }
        .group:hover .animate-support-steam-3 {
          animation-duration: 1.3s;
        }
        .group:hover .animate-support-ray-glow {
          animation-duration: 1.2s;
          opacity: 1;
        }
        .group:hover .animate-support-flame-jet {
          animation-duration: 0.2s;
        }
        .group:hover .animate-support-vinyl-spin {
          animation-duration: 1.8s;
        }
        .group:hover .animate-support-note-float-1 {
          animation-duration: 1.6s;
        }
        .group:hover .animate-support-note-float-2 {
          animation-duration: 1.7s;
        }
        .group:hover .animate-support-crown-float {
          animation-duration: 1.4s;
        }
        .group:hover .animate-support-confetti-pop {
          animation-duration: 1.2s;
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
