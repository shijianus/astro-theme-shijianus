import { chromium } from 'playwright';
import fs from 'fs';

// 官方 Telegram 纸飞机的标准几何折叠参数
// 官方 SVG 原生 viewBox 是 0 0 24 24 或 14 68 168 118
// 经典 Telegram 飞机由 3 个核心面构成：
// 1. 主翼面 (Main Left Wing)：从机头尖锐顶端，延伸至尾部左翼梢，再连到中腹折痕
// 2. 右翼面 (Right Wing)：从机头尖锐顶端，延伸到右翼梢，再连到中腹折痕
// 3. 折叠机腹与小三角 (Fold Triangle)：从中腹折痕折出的小三角面
// 我们将其精确矢量化，并施加 3D 拟物光影

function createOfficialTelegram3DPlane(size = 42) {
  // 基于官方比例 14 68 168 118 精准构筑：
  // 机头: (166, 75)
  // 左翼梢: (24.8, 111)
  // 右翼梢: (148.4, 180.2)
  // 中腹折痕: (100, 144.5)
  // 折叠龙骨小角: (82, 132.2) -> (98, 175) -> (120, 156.5)
  return `
    <svg width="${size}" height="${size}" viewBox="0 0 170 170" fill="none" style="overflow: visible;">
      <defs>
        <!-- 主机翼 (朝上迎光面)：高纯度明亮纯白高光渐变 -->
        <linearGradient id="tg-main-wing" x1="25" y1="110" x2="165" y2="75" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stop-color="#ffffff" />
          <stop offset="65%" stop-color="#ffffff" />
          <stop offset="100%" stop-color="#f0f7ff" />
        </linearGradient>

        <!-- 侧翼 (折叠下翼面)：优雅天蓝半透明调 -->
        <linearGradient id="tg-side-wing" x1="60" y1="120" x2="165" y2="75" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stop-color="#93c5fd" />
          <stop offset="60%" stop-color="#bfdbfe" />
          <stop offset="100%" stop-color="#e0f2fe" />
        </linearGradient>

        <!-- 折叠小三角 (立体腹鳍面)：深邃宝蓝立体阴影 -->
        <linearGradient id="tg-fin-shade" x1="80" y1="130" x2="120" y2="175" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stop-color="#3b82f6" />
          <stop offset="100%" stop-color="#1d4ed8" />
        </linearGradient>

        <!-- 折叠底面透气阴影 (微透暗角) -->
        <linearGradient id="tg-fin-inner" x1="82" y1="132" x2="98" y2="175" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stop-color="#1e40af" />
          <stop offset="100%" stop-color="#172554" />
        </linearGradient>

        <!-- 机脊锋利高光线 -->
        <linearGradient id="tg-crease-light" x1="25" y1="111" x2="166" y2="75" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stop-color="#ffffff" stop-opacity="0.9"/>
          <stop offset="80%" stop-color="#ffffff" stop-opacity="1"/>
          <stop offset="100%" stop-color="#ffffff" stop-opacity="0.5"/>
        </linearGradient>

        <!-- 柔和拟物高空投射阴影 -->
        <filter id="tg-plane-drop" x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="-2" dy="4" stdDeviation="3" flood-color="rgba(2, 44, 120, 0.4)" />
        </filter>
      </defs>

      <g filter="url(#tg-plane-drop)">
        <!-- 1. 折叠三角机腹 (深色内层) -->
        <path d="M98 175c-3.8 0-3.2-1.5-4.5-5.2L82 132.2 152.8 88" fill="url(#tg-fin-inner)" opacity="0.85" />
        <!-- 2. 中腹折叠小角 -->
        <path d="M98 175c3 0 4.3-1.4 6-3l16-15.5-20-12" fill="url(#tg-fin-shade)" />
        <!-- 3. 主翼与右翼整体标准官方折痕结构 -->
        <!-- 右机翼 (下翼展面) -->
        <polygon points="166,75 100,144.5 148.4,180.2" fill="url(#tg-side-wing)" />
        <!-- 左机翼 (主受光翼面：机鼻 166,75 -> 尾梢 24.8,111 -> 折痕 100,144.5) -->
        <polygon points="166,75 24.8,111 100,144.5" fill="url(#tg-main-wing)" />
        <!-- 4. 机脊贯穿锋利高光线 (从尾端到机鼻) -->
        <line x1="24.8" y1="111" x2="166" y2="75" stroke="url(#tg-crease-light)" stroke-width="1.2" stroke-linecap="round"/>
        <!-- 5. 机尖破空微光点 -->
        <circle cx="166" cy="75" r="1.5" fill="#ffffff" />
      </g>
    </svg>
  `;
}

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

// 纯净优雅的天体长曝光同心星流 (无任何划破天际的流星，纯粹天文星轨)
function generatePureStarTrails(cx = 340, cy = -40) {
  let svg = '';
  for (let i = 0; i < 30; i++) {
    const r = 52 + i * 12;
    const s = 100 + ((i * 17) % 24);
    const e = 188 + ((i * 23) % 36);
    
    const isMajor = (i % 7 === 0);
    const isMedium = (i % 3 === 0 && !isMajor);
    
    let strokeWidth = 0.55;
    let opacity = 0.18;
    let color = '#7dd3fc';
    let flowClass = '';
    let dash = 'stroke-dasharray="36 9 18 6"';

    if (isMajor) {
      strokeWidth = 1.35;
      opacity = 0.7;
      color = '#ffffff';
      flowClass = 'trail-flow-major';
      dash = 'stroke-dasharray="160 35 80 35"';
    } else if (isMedium) {
      strokeWidth = 0.85;
      opacity = 0.42;
      color = '#bae6fd';
      flowClass = 'trail-flow-medium';
      dash = 'stroke-dasharray="75 20 35 15"';
    } else if (i % 2 === 0) {
      strokeWidth = 0.6;
      opacity = 0.25;
      color = '#38bdf8';
      flowClass = 'trail-drift';
      dash = 'stroke-dasharray="45 15 20 10"';
    }
    
    const d = arcPath(cx, cy, r, s, e);
    
    if (isMajor) {
      svg += `<path class="${flowClass} glow-trail" d="${d}" fill="none" stroke="${color}" stroke-width="${strokeWidth * 2.2}" opacity="${opacity * 0.3}" stroke-linecap="round" filter="blur(1px)" ${dash}/>\n`;
    }
    svg += `<path class="${flowClass}" d="${d}" fill="none" stroke="${color}" stroke-width="${strokeWidth}" opacity="${opacity}" stroke-linecap="round" ${dash}/>\n`;

    if (isMajor || i === 11 || i === 19 || i === 27) {
      const angle = s + (e - s) * 0.62;
      const rad = (angle * Math.PI) / 180;
      const sx = cx + r * Math.cos(rad);
      const sy = cy + r * Math.sin(rad);
      if (sx >= 5 && sx <= 315 && sy >= 5 && sy <= 109) {
        svg += `<circle cx="${sx.toFixed(1)}" cy="${sy.toFixed(1)}" r="${(strokeWidth * 0.9).toFixed(1)}" fill="#ffffff" opacity="${Math.min(1, opacity + 0.35)}" />\n`;
      }
    }
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
      background: #080d1a;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      color: #f8fafc;
    }
    .card-wrap {
      display: flex;
      flex-direction: column;
      gap: 20px;
      max-width: 600px;
      margin: 0 auto;
    }
    .promo-card {
      position: relative;
      width: 310px;
      height: 114px;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 12px 28px -4px rgba(2, 132, 199, 0.4);
      background: 
        radial-gradient(circle at 10% 12%, rgba(255, 255, 255, 0.35) 0%, transparent 40%),
        radial-gradient(circle at 92% 82%, rgba(6, 182, 212, 0.45) 0%, transparent 45%),
        linear-gradient(135deg, #1d4ed8 0%, #2563eb 38%, #0284c7 72%, #06b6d4 100%);
      border: 1px solid rgba(255, 255, 255, 0.48);
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
      gap: 13px;
      z-index: 10;
      pointer-events: none;
    }

    /* 左侧 Telegram Icon 组件：纯正精致深空微光圆舱 */
    .tg-avatar-pod {
      position: relative;
      width: 44px;
      height: 44px;
      border-radius: 50%;
      background: radial-gradient(circle at 35% 30%, rgba(255, 255, 255, 0.35) 0%, rgba(255, 255, 255, 0.12) 65%, rgba(2, 44, 120, 0.25) 100%);
      border: 1px solid rgba(255, 255, 255, 0.45);
      backdrop-filter: blur(8px);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      box-shadow: 0 4px 12px rgba(2, 44, 120, 0.25), inset 0 1px 1px rgba(255, 255, 255, 0.6);
    }
    /* 优雅的天文细光环 */
    .tg-avatar-pod::before {
      content: '';
      position: absolute;
      inset: -3px;
      border-radius: 50%;
      border: 1px dashed rgba(255, 255, 255, 0.35);
      animation: podRotate 20s linear infinite;
    }
    @keyframes podRotate {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }

    .tg-avatar-plane {
      width: 25px;
      height: 25px;
      filter: drop-shadow(0 2px 4px rgba(2, 44, 120, 0.35));
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

    /* 动态流光体系 */
    .trail-flow-major {
      animation: flowMajor 15s linear infinite;
    }
    .trail-flow-medium {
      animation: flowMedium 22s linear infinite;
    }
    .trail-drift {
      animation: flowDrift 30s linear infinite;
    }
    @keyframes flowMajor {
      from { stroke-dashoffset: 0; }
      to { stroke-dashoffset: -310; }
    }
    @keyframes flowMedium {
      from { stroke-dashoffset: 0; }
      to { stroke-dashoffset: -250; }
    }
    @keyframes flowDrift {
      from { stroke-dashoffset: 0; }
      to { stroke-dashoffset: -180; }
    }

    /* 四角星芒呼吸闪烁 */
    .twinkle-1 {
      animation: starTwinkle 3.2s ease-in-out infinite;
    }
    .twinkle-2 {
      animation: starTwinkle 4.5s ease-in-out 1.5s infinite;
    }
    .twinkle-3 {
      animation: starTwinkle 3.8s ease-in-out 0.8s infinite;
    }
    @keyframes starTwinkle {
      0%, 100% { transform: scale(0.85); opacity: 0.55; }
      50% { transform: scale(1.22); opacity: 1; }
    }

    /* 经典 Telegram 纸飞机轻盈悬浮动效 */
    .tg-plane-flight-rig {
      animation: tgPlaneHover 4s ease-in-out infinite;
      will-change: transform;
      transform-origin: 245px 36px;
    }
    @keyframes tgPlaneHover {
      0%, 100% {
        transform: translate(228px, 14px) rotate(0deg);
      }
      50% {
        transform: translate(230px, 9px) rotate(3deg);
      }
    }

    /* 飞机机尾喷气推进航迹流动 */
    .stream-jet {
      animation: jetStream 1.8s linear infinite;
    }
    @keyframes jetStream {
      from { stroke-dashoffset: 0; }
      to { stroke-dashoffset: -24; }
    }
  </style>
</head>
<body>
  <div class="card-wrap">
    <h3>经典官方 Telegram 纸飞机 3D 重塑 + 纯净天文星轨 (无突兀流星)</h3>
    <div class="promo-card">
      <svg class="promo-scene-art" viewBox="0 0 310 114">
        <!-- 动态纯净长曝光星轨群 (纯粹同心弧线，无流星划破) -->
        <g>
          ${generatePureStarTrails(340, -40)}
        </g>

        <!-- 3 处柔和呼吸的四角十字衍射星芒 -->
        <g class="twinkle-1" transform-origin="188 76">
          <g transform="translate(188, 76)">
            <path d="M 0 -7 Q 0 0 7 0 Q 0 0 0 7 Q 0 0 -7 0 Q 0 0 0 -7 Z" fill="#ffffff" />
            <circle cx="0" cy="0" r="1.8" fill="#ffffff" />
            <circle cx="0" cy="0" r="10" fill="#ffffff" opacity="0.38" filter="blur(1px)" />
          </g>
        </g>
        <g class="twinkle-2" transform-origin="136 24">
          <g transform="translate(136, 24)">
            <path d="M 0 -4.6 Q 0 0 4.6 0 Q 0 0 0 4.6 Q 0 0 -4.6 0 Q 0 0 0 -4.6 Z" fill="#bae6fd" />
            <circle cx="0" cy="0" r="1.3" fill="#ffffff" />
            <circle cx="0" cy="0" r="7" fill="#bae6fd" opacity="0.35" filter="blur(1px)" />
          </g>
        </g>
        <g class="twinkle-3" transform-origin="272 86">
          <g transform="translate(272, 86)">
            <path d="M 0 -4 Q 0 0 4 0 Q 0 0 0 4 Q 0 0 -4 0 Q 0 0 0 -4 Z" fill="#e0f2fe" />
            <circle cx="0" cy="0" r="1.1" fill="#ffffff" />
            <circle cx="0" cy="0" r="6" fill="#e0f2fe" opacity="0.35" filter="blur(1px)" />
          </g>
        </g>

        <!-- 机尾喷气切线航迹 (纯净推进航线) -->
        <path class="stream-jet" d="M 172 65 C 200 48, 222 34, 238 25" fill="none" stroke="rgba(255, 255, 255, 0.65)" stroke-width="1.3" stroke-dasharray="4 3" stroke-linecap="round" />
        <path d="M 166 69 C 196 52, 220 38, 235 27" fill="none" stroke="rgba(56, 189, 248, 0.35)" stroke-width="2.6" filter="blur(1.5px)" />

        <!-- 右侧标准 Telegram 官方 3D 拟物立体纸飞机 (带轻盈悬浮) -->
        <g class="tg-plane-flight-rig">
          <!-- 航海罗盘微光舱 -->
          <circle cx="24" cy="24" r="22" fill="none" stroke="rgba(255,255,255,0.22)" stroke-width="1" stroke-dasharray="3 3"/>
          <circle cx="24" cy="24" r="17" fill="rgba(255, 255, 255, 0.12)" />
          <g transform="translate(3, -2)">
            ${createOfficialTelegram3DPlane(42)}
          </g>
        </g>
      </svg>

      <div class="promo-content">
        <!-- 左侧 Telegram Icon 组件 -->
        <div class="tg-avatar-pod">
          <svg class="tg-avatar-plane" viewBox="14 68 168 118" fill="none">
            <!-- 官方标准 Telegram 矢量路径 -->
            <path d="M98 175c-3.8 0-3.2-1.5-4.5-5.2L82 132.2 152.8 88" fill="rgba(255,255,255,0.75)" />
            <path d="M98 175c3 0 4.3-1.4 6-3l16-15.5-20-12" fill="rgba(255,255,255,0.5)" />
            <path d="M100 144.5l48.4 35.7c5.6 3.1 9.6 1.5 11-5.2l19.5-92c2-8.3-3.2-12-8.6-9.6L24.8 111c-8 3.2-8 7.7-1.4 9.7l37.4 11.7 86.8-54.8c4.1-2.5 7.8-1.2 4.7 1.6" fill="#ffffff" />
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

fs.writeFileSync('scratch/test_standard_plane.html', html);

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 800, height: 380 } });
  await page.setContent(html);
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'scratch/standard_plane_frame.png' });
  await browser.close();
  console.log('Saved scratch/standard_plane_frame.png');
})();
