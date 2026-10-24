import { chromium } from 'playwright';
import fs from 'fs';

// 实验更加生动形象的 3D 纸飞机与星轨动态设计
// 包含：
// 1. 极其逼真形象的 3D 纸飞机 (立体折痕、机翼厚度光影、渐变高光脊线、拟物机身折叠阴影)
// 2. 真实长曝光星轨流光动画 (dashoffset 动态流光、同心弧流动、星芒闪烁、流星划过、机身浮动)
// 3. 左侧 Telegram Icon 组件重塑：高精立体 3D 纸飞机 + 航海微光罗盘光环

function arcPath(cx, cy, r, startDeg, endDeg) {
  const startRad = (startDeg * Math.PI) / 180;
  const endRad = (endDeg * Math.PI) / 180;
  const x1 = cx + r * Math.cos(startRad);
  const y1 = cy + r * Math.sin(startRad);
  const x2 = cx + r * Math.cos(endRad);
  const y2 = cy + r * Math.sin(endRad);
  const largeArc = Math.abs(endDeg - startDeg) > 180 ? 1 : 0;
  const sweep = endDeg > startDeg ? 1 : 0;
  return `M ${x1.toFixed(1)} ${y1.toFixed(1)} A ${r.toFixed(1)} ${r.toFixed(1)} 0 ${largeArc} ${sweep} ${x2.toFixed(1)} ${y2.toFixed(1)}`;
}

// 极其细腻形象的 3D 立体折纸飞机 SVG (高保真光影折叠)
function createHero3DPlane(size = 38) {
  return `
    <g class="promo-hero-plane" filter="url(#hero-plane-glow)">
      <!-- 飞机主体 3D 折叠结构 -->
      <svg width="${size}" height="${size}" viewBox="0 0 100 100" fill="none">
        <defs>
          <linearGradient id="main-wing-top" x1="10" y1="20" x2="90" y2="90" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stop-color="#ffffff" />
            <stop offset="60%" stop-color="#f0f7ff" />
            <stop offset="100%" stop-color="#dbeafe" />
          </linearGradient>
          <linearGradient id="main-wing-bot" x1="10" y1="40" x2="80" y2="80" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stop-color="#bfdbfe" />
            <stop offset="100%" stop-color="#93c5fd" />
          </linearGradient>
          <linearGradient id="body-fold-shade" x1="40" y1="40" x2="60" y2="90" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stop-color="#60a5fa" />
            <stop offset="100%" stop-color="#2563eb" />
          </linearGradient>
          <linearGradient id="wing-crease-highlight" x1="15" y1="20" x2="92" y2="52" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stop-color="#ffffff" stop-opacity="0.9"/>
            <stop offset="100%" stop-color="#ffffff" stop-opacity="0.2"/>
          </linearGradient>
        </defs>
        
        <!-- 投影层 (Soft Drop Shadow on atmosphere) -->
        <path d="M92 52 L12 28 L48 68 Z" fill="rgba(2, 44, 120, 0.35)" filter="blur(3px)" transform="translate(0, 4)"/>
        
        <!-- 左机翼/上翼面 (最亮高光区) -->
        <polygon points="92,52 14,24 50,60" fill="url(#main-wing-top)" />
        
        <!-- 机翼背脊高光线 (Spine Crease) -->
        <line x1="14" y1="24" x2="92" y2="52" stroke="url(#wing-crease-highlight)" stroke-width="1.2" stroke-linecap="round"/>
        
        <!-- 右机翼/下翼面 (中调折叠面) -->
        <polygon points="92,52 50,60 62,82" fill="url(#main-wing-bot)" />
        
        <!-- 机身折痕暗面与内舱折角 (深色阴影面塑造立体感) -->
        <polygon points="50,60 62,82 56,66" fill="url(#body-fold-shade)" />
        
        <!-- 翼梢微光点 -->
        <circle cx="92" cy="52" r="1.5" fill="#ffffff" />
      </svg>
    </g>
  `;
}

// 制作动态化星轨
function generateDynamicStarTrails() {
  const cx = 340;
  const cy = -40;
  const count = 30;
  let svg = '';
  
  for (let i = 0; i < count; i++) {
    const r = 50 + i * (380 / count);
    const s = 98 + ((i * 17) % 24);
    const e = 192 + ((i * 23) % 36);
    const isMajor = (i % 6 === 0);
    const isMedium = (i % 3 === 0 && !isMajor);
    
    let strokeWidth = 0.55;
    let opacity = 0.2;
    let color = '#7dd3fc';
    
    if (isMajor) {
      strokeWidth = 1.4;
      opacity = 0.7;
      color = '#ffffff';
    } else if (isMedium) {
      strokeWidth = 0.9;
      opacity = 0.45;
      color = '#bae6fd';
    } else if (i % 2 === 0) {
      strokeWidth = 0.65;
      opacity = 0.3;
      color = '#38bdf8';
    }
    
    const d = arcPath(cx, cy, r, s, e);
    // 给部分主星轨添加流光动效类名
    const animClass = isMajor ? 'star-trail-flow' : (isMedium ? 'star-trail-pulse' : '');
    const dash = isMajor ? 'stroke-dasharray="140 30 80 40"' : (i % 4 === 1 ? 'stroke-dasharray="40 12 20 8"' : '');
    
    if (isMajor) {
      svg += `<path class="${animClass} star-glow" d="${d}" fill="none" stroke="${color}" stroke-width="${strokeWidth * 2.2}" opacity="${opacity * 0.3}" stroke-linecap="round" filter="blur(1.2px)" ${dash}/>`;
    }
    svg += `<path class="${animClass}" d="${d}" fill="none" stroke="${color}" stroke-width="${strokeWidth}" opacity="${opacity}" stroke-linecap="round" ${dash}/>`;
  }
  return svg;
}

const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body {
      margin: 0;
      padding: 50px;
      background: #090d16;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      color: #f8fafc;
    }
    .container {
      display: flex;
      flex-direction: column;
      gap: 30px;
      max-width: 800px;
      margin: 0 auto;
    }
    .demo-card {
      position: relative;
      width: 310px;
      height: 114px;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 10px 28px -4px rgba(2, 132, 199, 0.45);
      background: linear-gradient(135deg, #1d4ed8 0%, #2563eb 38%, #0284c7 72%, #06b6d4 100%);
      border: 1px solid rgba(255, 255, 255, 0.4);
    }
    .promo-scene-art {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
    }
    .promo-content {
      position: absolute;
      inset: 0;
      padding: 14px 16px;
      display: flex;
      align-items: center;
      gap: 14px;
      z-index: 10;
      pointer-events: none;
    }
    
    /* 左侧 Telegram Icon 组件重塑：3D 形象立体舱 + 呼吸光环 */
    .tg-avatar-pod {
      position: relative;
      width: 46px;
      height: 46px;
      border-radius: 50%;
      background: radial-gradient(circle at 35% 30%, rgba(255, 255, 255, 0.38) 0%, rgba(255, 255, 255, 0.12) 70%, rgba(2, 44, 120, 0.25) 100%);
      border: 1px solid rgba(255, 255, 255, 0.45);
      backdrop-filter: blur(8px);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      box-shadow: 0 4px 14px rgba(2, 44, 120, 0.3), inset 0 1px 2px rgba(255, 255, 255, 0.6);
      transition: transform 0.4s ease;
    }
    .tg-avatar-pod::before {
      content: '';
      position: absolute;
      inset: -3px;
      border-radius: 50%;
      border: 1px dashed rgba(255, 255, 255, 0.35);
      animation: rotateRing 16s linear infinite;
    }
    
    @keyframes rotateRing {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }

    .tg-meta {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .title-row {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .brand-title {
      font-size: 16px;
      font-weight: 700;
      color: #ffffff;
      line-height: 1.2;
      text-shadow: 0 1px 3px rgba(0,0,0,0.25);
    }
    .badge {
      font-size: 10px;
      padding: 2px 7px;
      border-radius: 4px;
      background: rgba(255, 255, 255, 0.24);
      border: 1px solid rgba(255, 255, 255, 0.4);
      color: #ffffff;
      font-weight: 600;
      letter-spacing: 0.2px;
    }
    .desc {
      font-size: 12px;
      color: rgba(255, 255, 255, 0.9);
      font-weight: 400;
    }

    /* ======================================================== */
    /* 核心动态化动效 CSS (Keyframe Animations)                 */
    /* ======================================================== */

    /* 1. 星轨天体流光流动 (Star Trails Flow) */
    .star-trail-flow {
      animation: starFlow 12s linear infinite;
    }
    @keyframes starFlow {
      0% { stroke-dashoffset: 0; }
      100% { stroke-dashoffset: -320; }
    }
    .star-trail-pulse {
      animation: starPulse 4s ease-in-out infinite alternate;
    }
    @keyframes starPulse {
      0% { opacity: 0.3; }
      100% { opacity: 0.7; }
    }

    /* 2. 真实长曝光微流星划破天际 (Meteor Animation) */
    .promo-meteor {
      animation: meteorShoot 6s cubic-bezier(0.25, 1, 0.5, 1) infinite;
      transform-origin: 150px 30px;
    }
    @keyframes meteorShoot {
      0% {
        opacity: 0;
        transform: translate(-40px, -20px) scale(0.6);
      }
      8% {
        opacity: 1;
        transform: translate(0, 0) scale(1);
      }
      22% {
        opacity: 0;
        transform: translate(70px, 35px) scale(1.1);
      }
      100% {
        opacity: 0;
        transform: translate(70px, 35px) scale(1.1);
      }
    }

    /* 3. 四角十字星芒闪烁脉动 (Twinkling Stars) */
    .twinkle-star-1 {
      animation: starTwinkle 3.2s ease-in-out infinite;
    }
    .twinkle-star-2 {
      animation: starTwinkle 4.5s ease-in-out 1.5s infinite;
    }
    .twinkle-star-3 {
      animation: starTwinkle 3.8s ease-in-out 0.8s infinite;
    }
    @keyframes starTwinkle {
      0%, 100% {
        transform: scale(0.85);
        opacity: 0.55;
      }
      50% {
        transform: scale(1.25);
        opacity: 1;
      }
    }

    /* 4. 纸飞机破空轻盈物理浮动与航迹流光 (Plane Hover & Flight Stream) */
    .promo-plane-carrier {
      animation: planeHover 4.5s ease-in-out infinite;
    }
    @keyframes planeHover {
      0%, 100% {
        transform: translate(228px, 16px) rotate(14deg);
      }
      50% {
        transform: translate(229px, 12px) rotate(16.5deg);
      }
    }

    /* 5. 机尾喷气切线虚线航迹流动 */
    .flight-trail-stream {
      animation: streamFlow 2s linear infinite;
    }
    @keyframes streamFlow {
      from { stroke-dashoffset: 0; }
      to { stroke-dashoffset: -24; }
    }
  </style>
</head>
<body>
  <div class="container">
    <h2>方案展示：充分动态化 + 形象具象化 3D 纸飞机与星流图谱</h2>
    <div class="demo-card">
      <svg class="promo-scene-art" viewBox="0 0 310 114">
        <defs>
          <radialGradient id="nebula-glow" cx="85%" cy="15%" r="75%">
            <stop offset="0%" stop-color="#38bdf8" stop-opacity="0.45"/>
            <stop offset="45%" stop-color="#0284c7" stop-opacity="0.2"/>
            <stop offset="100%" stop-color="#1d4ed8" stop-opacity="0"/>
          </radialGradient>
          <linearGradient id="meteor-stream" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#ffffff" stop-opacity="0"/>
            <stop offset="65%" stop-color="#bae6fd" stop-opacity="0.6"/>
            <stop offset="100%" stop-color="#ffffff" stop-opacity="1"/>
          </linearGradient>
          <filter id="hero-plane-glow" x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="0" dy="2" stdDeviation="2.5" flood-color="rgba(2, 44, 120, 0.45)" />
          </filter>
        </defs>

        <!-- 柔和星云基底 -->
        <rect x="0" y="0" width="310" height="114" fill="url(#nebula-glow)" />

        <!-- 动态长曝光星轨群 -->
        <g>
          ${generateDynamicStarTrails()}
        </g>

        <!-- 闪烁四角十字衍射星芒 -->
        <g class="twinkle-star-1" transform-origin="188 76">
          <g transform="translate(188, 76)">
            <path d="M 0 -7 Q 0 0 7 0 Q 0 0 0 7 Q 0 0 -7 0 Q 0 0 0 -7 Z" fill="#ffffff" />
            <circle cx="0" cy="0" r="1.8" fill="#ffffff" />
            <circle cx="0" cy="0" r="10" fill="#ffffff" opacity="0.4" filter="blur(1px)" />
          </g>
        </g>
        <g class="twinkle-star-2" transform-origin="136 24">
          <g transform="translate(136, 24)">
            <path d="M 0 -4.8 Q 0 0 4.8 0 Q 0 0 0 4.8 Q 0 0 -4.8 0 Q 0 0 0 -4.8 Z" fill="#bae6fd" />
            <circle cx="0" cy="0" r="1.3" fill="#ffffff" />
            <circle cx="0" cy="0" r="7.5" fill="#bae6fd" opacity="0.35" filter="blur(1px)" />
          </g>
        </g>
        <g class="twinkle-star-3" transform-origin="272 86">
          <g transform="translate(272, 86)">
            <path d="M 0 -4.2 Q 0 0 4.2 0 Q 0 0 0 4.2 Q 0 0 -4.2 0 Q 0 0 0 -4.2 Z" fill="#e0f2fe" />
            <circle cx="0" cy="0" r="1.1" fill="#ffffff" />
            <circle cx="0" cy="0" r="6.5" fill="#e0f2fe" opacity="0.35" filter="blur(1px)" />
          </g>
        </g>

        <!-- 周期划过的微流星 (Shooting Meteor) -->
        <g class="promo-meteor">
          <path d="M 120 12 L 182 48" stroke="url(#meteor-stream)" stroke-width="1.8" stroke-linecap="round" />
          <circle cx="182" cy="48" r="1.8" fill="#ffffff" />
          <circle cx="182" cy="48" r="4.5" fill="#38bdf8" opacity="0.7" filter="blur(1px)" />
        </g>

        <!-- 切线航迹：机尾喷气流光 (带动态 streamFlow) -->
        <path class="flight-trail-stream" d="M 165 68 C 196 48, 220 34, 235 24" fill="none" stroke="rgba(255, 255, 255, 0.65)" stroke-width="1.4" stroke-dasharray="4 3" stroke-linecap="round" />
        <path d="M 160 72 C 192 52, 218 38, 232 26" fill="none" stroke="rgba(56, 189, 248, 0.35)" stroke-width="2.8" filter="blur(1.5px)" />

        <!-- 右侧具象化 3D 纸飞机载体 (带平滑浮动) -->
        <g class="promo-plane-carrier">
          <!-- 领航能量光环 -->
          <circle cx="20" cy="20" r="23" fill="none" stroke="rgba(255,255,255,0.22)" stroke-width="1" stroke-dasharray="3 3"/>
          <circle cx="20" cy="20" r="18" fill="rgba(255, 255, 255, 0.14)" />
          ${createHero3DPlane(40)}
        </g>
      </svg>

      <div class="promo-content">
        <!-- 左侧 Telegram Icon 组件重塑：3D 质感圆舱 -->
        <div class="tg-avatar-pod">
          <!-- 官方纸飞机高精立体矢量 -->
          <svg width="25" height="25" viewBox="0 0 24 24" fill="none">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.75-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .37z" fill="#ffffff"/>
          </svg>
        </div>
        <div class="tg-meta">
          <div class="title-row">
            <span class="brand-title">Telegram</span>
            <span class="badge">官方社群</span>
          </div>
          <div class="desc">加入 chronoral 社群</div>
        </div>
      </div>
    </div>
  </div>
</body>
</html>
`;

fs.writeFileSync('scratch/test_dynamic_promo.html', html);

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 800, height: 400 } });
  await page.setContent(html);
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'scratch/dynamic_promo_frame1.png' });
  // 等待动画推进 1.5 秒后截取第二帧
  await page.waitForTimeout(1500);
  await page.screenshot({ path: 'scratch/dynamic_promo_frame2.png' });
  await browser.close();
  console.log('Saved dynamic promo frames');
})();
