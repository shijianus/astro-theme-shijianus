import { chromium } from 'playwright';
import fs from 'fs';

// 复制 PromoWidgetCard.astro 中的全部算法
function createCelestialRNG(seed = 42) {
  let s = seed;
  return function() {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
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

// 1. 42 颗真随机散落微星
const randomStars = (() => {
  const rng = createCelestialRNG(77);
  const stars = [];
  const colors = ['#ffffff', '#ffffff', '#bae6fd', '#e0f2fe', '#7dd3fc'];
  for (let i = 0; i < 42; i++) {
    const x = 6 + rng() * 304;
    const y = 6 + rng() * 102;
    const isTextZone = (x > 50 && x < 180 && y > 25 && y < 85);
    const opacity = isTextZone ? (0.1 + rng() * 0.15) : (0.18 + rng() * 0.55);
    const r = Number((0.45 + rng() * 0.65).toFixed(1));
    const color = colors[Math.floor(rng() * colors.length)];
    const isTwinkle = (i % 9 === 0);
    const twClass = isTwinkle ? `twinkle-${(i % 3) + 1}` : '';
    stars.push({ x: Number(x.toFixed(1)), y: Number(y.toFixed(1)), r, opacity: Number(opacity.toFixed(2)), color, twClass });
  }
  return stars;
})();

// 2. 26 轨长曝光星轨
const frontStarTrails = (() => {
  const rng = createCelestialRNG(108);
  const cx = 345;
  const cy = -45;
  const count = 26;
  const items = [];
  for (let i = 0; i < count; i++) {
    const r = 50 + i * 13.5 + (rng() * 4 - 2);
    const s = 95 + rng() * 25;
    const span = 60 + rng() * 35;
    const e = s + span;
    const randMag = rng();
    let strokeWidth = 0.5;
    let opacity = 0.15 + rng() * 0.12;
    let color = '#7dd3fc';
    let flowClass = '';
    let dashArray = undefined;

    if (randMag > 0.88) {
      strokeWidth = 1.35;
      opacity = 0.65 + rng() * 0.15;
      color = '#ffffff';
      flowClass = 'trail-flow-major';
      dashArray = '140 40 70 30';
    } else if (randMag > 0.6) {
      strokeWidth = 0.85;
      opacity = 0.35 + rng() * 0.15;
      color = '#bae6fd';
      flowClass = 'trail-flow-medium';
      dashArray = '65 20 30 15';
    } else {
      strokeWidth = Number((0.45 + rng() * 0.2).toFixed(1));
      opacity = 0.12 + rng() * 0.12;
      color = (i % 2 === 0) ? '#38bdf8' : '#7dd3fc';
      flowClass = 'trail-drift';
      dashArray = '35 12 18 8';
    }

    const d = arcPath(cx, cy, r, s, e);
    items.push({ d, color, strokeWidth, opacity: Number(opacity.toFixed(2)), isMajor: randMag > 0.88, flowClass, dashArray });
  }
  return items;
})();

// 3. 背面 16 轨星轨
const backStarTrails = (() => {
  const cx = 345;
  const cy = -45;
  const count = 16;
  const items = [];
  for (let i = 0; i < count; i++) {
    const r = 68 + i * 22;
    const s = 105 + ((i * 15) % 20);
    const e = 180 + ((i * 20) % 30);
    const isBright = (i % 4 === 0);
    const strokeWidth = isBright ? 0.9 : 0.55;
    const opacity = isBright ? 0.3 : 0.15;
    const color = isBright ? '#e0f2fe' : '#7dd3fc';
    const flowClass = isBright ? 'trail-flow-medium' : '';
    const dashArray = isBright ? '70 18 35 12' : undefined;
    const d = arcPath(cx, cy, r, s, e);
    items.push({ d, strokeWidth, opacity, color, flowClass, dashArray });
  }
  return items;
})();

const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body {
      margin: 0;
      padding: 60px 40px;
      background: #080d1a;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      color: #f8fafc;
    }
    .wrapper {
      display: flex;
      gap: 40px;
      justify-content: center;
      align-items: flex-start;
    }
    .card-wrap {
      display: flex;
      flex-direction: column;
      gap: 12px;
      align-items: center;
    }
    .card-title {
      font-size: 14px;
      color: #94a3b8;
      font-weight: 600;
    }
    .promo-widget {
      position: relative;
      width: 320px;
      height: 114px;
      border-radius: 8px;
      cursor: pointer;
    }
    #flip-wrapper {
      perspective: 1000px;
      position: relative;
      width: 100%;
      height: 100%;
      border-radius: 8px;
      --promo-bg-gradient: 
        radial-gradient(circle at 10% 12%, rgba(255, 255, 255, 0.35) 0%, transparent 40%),
        radial-gradient(circle at 92% 82%, rgba(6, 182, 212, 0.45) 0%, transparent 45%),
        linear-gradient(135deg, #1d4ed8 0%, #2563eb 38%, #0284c7 72%, #06b6d4 100%);
      --promo-card-shadow: 0 10px 25px -5px rgba(2, 132, 199, 0.38), 0 2px 6px rgba(0, 0, 0, 0.05);
      --promo-border-color: rgba(255, 255, 255, 0.48);
    }
    .face {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      border-radius: 8px;
      background: var(--promo-bg-gradient);
      border: 1px solid var(--promo-border-color);
      box-shadow: var(--promo-card-shadow);
      color: #ffffff;
      overflow: hidden;
      padding: 12px 16px;
      display: flex;
      align-items: center;
      box-sizing: border-box;
    }
    .promo-scene-art {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 1;
    }
    .promo-front-body {
      position: relative;
      z-index: 2;
      display: flex;
      align-items: center;
      gap: 13px;
      width: 100%;
    }
    /* 干净纯净的 Apple 级磨砂玻璃徽章，彻底移除旋转虚线环 podRadarRotate */
    .promo-icon-emblem {
      position: relative;
      width: 44px;
      height: 44px;
      border-radius: 50%;
      background: radial-gradient(circle at 35% 30%, rgba(255, 255, 255, 0.38) 0%, rgba(255, 255, 255, 0.14) 65%, rgba(2, 44, 120, 0.25) 100%);
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255, 255, 255, 0.55);
      box-shadow: inset 0 1px 2px rgba(255, 255, 255, 0.7), 0 4px 12px rgba(2, 44, 120, 0.25);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .promo-icon-plane {
      width: 24px;
      height: 24px;
      filter: drop-shadow(0 2px 4px rgba(2, 44, 120, 0.3));
    }
    .promo-front-info {
      display: flex;
      flex-direction: column;
      justify-content: center;
      min-width: 0;
      flex: 1;
    }
    .promo-title-row {
      display: flex;
      align-items: center;
      gap: 7px;
      margin-bottom: 3px;
    }
    .promo-title {
      font-size: 1.15rem;
      font-weight: 800;
      color: #ffffff;
      line-height: 1.2;
      text-shadow: 0 1px 2px rgba(0, 0, 0, 0.15);
    }
    .promo-badge {
      font-size: 0.65rem;
      font-weight: 700;
      padding: 1.5px 6px;
      border-radius: 4px;
      background: rgba(255, 255, 255, 0.25);
      border: 1px solid rgba(255, 255, 255, 0.45);
      color: #ffffff;
      line-height: 1.2;
    }
    .promo-subtitle {
      font-size: 0.76rem;
      color: rgba(255, 255, 255, 0.95);
      line-height: 1.35;
      text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
    }

    /* 纸飞机轻盈悬浮 (纯净无黑线，无外围圆圈) */
    .tg-plane-flight-rig {
      animation: tgPlaneHover 4s ease-in-out infinite;
      will-change: transform;
      transform-origin: 246px 35px;
    }
    @keyframes tgPlaneHover {
      0%, 100% {
        transform: translate(232px, 16px) rotate(0deg);
      }
      50% {
        transform: translate(234px, 12px) rotate(2deg);
      }
    }

    /* 星轨流光 */
    .trail-flow-major { animation: trailMajor 14s linear infinite; }
    .trail-flow-medium { animation: trailMed 20s linear infinite; }
    .trail-drift { animation: trailDrift 28s linear infinite; }
    @keyframes trailMajor { from { stroke-dashoffset: 0; } to { stroke-dashoffset: -345; } }
    @keyframes trailMed { from { stroke-dashoffset: 0; } to { stroke-dashoffset: -280; } }
    @keyframes trailDrift { from { stroke-dashoffset: 0; } to { stroke-dashoffset: -200; } }

    .twinkle-1 { animation: starTwinkle 3.2s ease-in-out infinite; }
    .twinkle-2 { animation: starTwinkle 4.5s ease-in-out 1.5s infinite; }
    .twinkle-3 { animation: starTwinkle 3.8s ease-in-out 0.8s infinite; }
    @keyframes starTwinkle {
      0%, 100% { transform: scale(0.85); opacity: 0.55; }
      50% { transform: scale(1.22); opacity: 1; }
    }

    /* BACK FACE */
    .promo-back-grid {
      position: relative;
      z-index: 2;
      display: grid;
      grid-template-columns: 1fr 76px;
      align-items: center;
      gap: 12px;
      width: 100%;
      height: 100%;
    }
    .promo-back-left {
      display: flex;
      flex-direction: column;
      justify-content: center;
      min-width: 0;
    }
    .promo-back-title {
      font-size: 1.05rem;
      font-weight: 800;
      color: #ffffff;
      margin-bottom: 2px;
      line-height: 1.2;
      text-shadow: 0 1px 2px rgba(0, 0, 0, 0.15);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .promo-back-subtitle {
      font-size: 0.72rem;
      color: rgba(255, 255, 255, 0.92);
      line-height: 1.35;
      margin-bottom: 8px;
    }
    .promo-cta-btn {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 3px 12px;
      background: #ffffff;
      color: #0369a1;
      font-size: 0.75rem;
      font-weight: 700;
      border-radius: 999px;
      text-decoration: none;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.14);
      width: fit-content;
    }
    .promo-qr-wrapper {
      width: 76px;
      height: 76px;
      background: #ffffff;
      border-radius: 6px;
      padding: 3px;
      box-sizing: border-box;
      box-shadow: 0 4px 12px rgba(3, 105, 161, 0.25);
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .promo-qr-wrapper img {
      width: 100%;
      height: 100%;
      object-fit: contain;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <!-- 正面板展示 -->
    <div class="card-wrap">
      <div class="card-title">正面 (FRONT FACE) - 自然随机星野 + 3D 飞镖纸飞机 (彻底无黑线)</div>
      <div class="promo-widget">
        <div id="flip-wrapper">
          <div class="face front-face">
            <div class="promo-scene-art">
              <svg viewBox="0 0 320 114" fill="none">
                <defs>
                  <!-- 纯净纯白主翼 -->
                  <linearGradient id="p-wing-top" x1="16" y1="80" x2="96" y2="16" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stop-color="#ffffff" />
                    <stop offset="70%" stop-color="#ffffff" />
                    <stop offset="100%" stop-color="#f0f7ff" />
                  </linearGradient>
                  <!-- 清澈天蓝副翼 -->
                  <linearGradient id="p-wing-side" x1="52" y1="62" x2="96" y2="16" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stop-color="#93c5fd" />
                    <stop offset="50%" stop-color="#bfdbfe" />
                    <stop offset="100%" stop-color="#e0f2fe" />
                  </linearGradient>
                  <!-- 纯净宝蓝龙骨，绝无黑块 -->
                  <linearGradient id="p-keel" x1="50" y1="58" x2="74" y2="82" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stop-color="#3b82f6" />
                    <stop offset="100%" stop-color="#1d4ed8" />
                  </linearGradient>
                  <!-- 折脊高光刃线 -->
                  <linearGradient id="p-spine" x1="16" y1="80" x2="96" y2="16" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stop-color="#ffffff" stop-opacity="0.95" />
                    <stop offset="85%" stop-color="#ffffff" stop-opacity="1" />
                    <stop offset="100%" stop-color="#ffffff" stop-opacity="0.5" />
                  </linearGradient>
                  <!-- 轻柔纯蓝大气漫射阴影 -->
                  <filter id="p-shadow" x="-30%" y="-30%" width="160%" height="160%">
                    <feDropShadow dx="-1.5" dy="3.5" stdDeviation="2.5" flood-color="rgba(2, 44, 120, 0.22)" />
                  </filter>
                </defs>

                <!-- 1. 自然随机散落的深空微恒星群 (42 颗散落星野) -->
                ${randomStars.map(s => `<circle class="${s.twClass}" cx="${s.x}" cy="${s.y}" r="${s.r}" fill="${s.color}" opacity="${s.opacity}" />`).join('\n')}

                <!-- 2. 长曝光非等距同心星流 -->
                ${frontStarTrails.map(t => `
                  ${t.isMajor ? `<path class="${t.flowClass} glow-trail" d="${t.d}" fill="none" stroke="${t.color}" stroke-width="${t.strokeWidth * 2.4}" opacity="${t.opacity * 0.35}" stroke-linecap="round" filter="blur(1.2px)" stroke-dasharray="${t.dashArray}" />` : ''}
                  <path class="${t.flowClass}" d="${t.d}" fill="none" stroke="${t.color}" stroke-width="${t.strokeWidth}" opacity="${t.opacity}" stroke-linecap="round" stroke-dasharray="${t.dashArray}" />
                `).join('\n')}

                <!-- 3. 十字衍射星芒 -->
                <g class="twinkle-1" transform="translate(192, 74)">
                  <path d="M 0 -6.5 Q 0 0 6.5 0 Q 0 0 0 6.5 Q 0 0 -6.5 0 Q 0 0 0 -6.5 Z" fill="#ffffff" />
                  <circle cx="0" cy="0" r="1.6" fill="#ffffff" />
                  <circle cx="0" cy="0" r="8.5" fill="#ffffff" opacity="0.32" filter="blur(1px)" />
                </g>
                <g class="twinkle-2" transform="translate(142, 22)">
                  <path d="M 0 -4.2 Q 0 0 4.2 0 Q 0 0 0 4.2 Q 0 0 -4.2 0 Q 0 0 0 -4.2 Z" fill="#bae6fd" />
                  <circle cx="0" cy="0" r="1.2" fill="#ffffff" />
                  <circle cx="0" cy="0" r="6" fill="#bae6fd" opacity="0.3" filter="blur(1px)" />
                </g>
                <g class="twinkle-3" transform="translate(280, 84)">
                  <path d="M 0 -3.8 Q 0 0 3.8 0 Q 0 0 0 3.8 Q 0 0 -3.8 0 Q 0 0 0 -3.8 Z" fill="#e0f2fe" />
                  <circle cx="0" cy="0" r="1.0" fill="#ffffff" />
                  <circle cx="0" cy="0" r="5" fill="#e0f2fe" opacity="0.3" filter="blur(1px)" />
                </g>

                <!-- 4. 右侧形象生动的 3D 飞镖纸飞机 (绝无黑线、圆圈与杂线) -->
                <g class="tg-plane-flight-rig">
                  <svg width="48" height="48" viewBox="0 0 100 100" fill="none" style="overflow: visible;">
                    <g filter="url(#p-shadow)">
                      <!-- 龙骨折面 -->
                      <polygon points="52,62 72,82 62,70" fill="url(#p-keel)" />
                      <!-- 右展翼面 -->
                      <polygon points="96,16 52,62 76,82" fill="url(#p-wing-side)" />
                      <!-- 左主翼面 -->
                      <polygon points="96,16 16,80 52,62" fill="url(#p-wing-top)" />
                      <!-- 折脊刃线 -->
                      <line x1="16" y1="80" x2="96" y2="16" stroke="url(#p-spine)" stroke-width="1.3" stroke-linecap="round" />
                      <!-- 破空微光 -->
                      <circle cx="96" cy="16" r="1.4" fill="#ffffff" />
                    </g>
                  </svg>
                </g>
              </svg>
            </div>

            <div class="promo-front-body">
              <div class="promo-icon-emblem">
                <svg class="promo-icon-plane" viewBox="14 68 168 118" fill="none">
                  <path d="M98 175c-3.8 0-3.2-1.5-4.5-5.2L82 132.2 152.8 88" fill="rgba(255,255,255,0.78)" />
                  <path d="M98 175c3 0 4.3-1.4 6-3l16-15.5-20-12" fill="rgba(255,255,255,0.52)" />
                  <path d="M100 144.5l48.4 35.7c5.6 3.1 9.6 1.5 11-5.2l19.5-92c2-8.3-3.2-12-8.6-9.6L24.8 111c-8 3.2-8 7.7-1.4 9.7l37.4 11.7 86.8-54.8c4.1-2.5 7.8-1.2 4.7 1.6" fill="#ffffff" />
                </svg>
              </div>
              <div class="promo-front-info">
                <div class="promo-title-row">
                  <span class="promo-title">Telegram</span>
                  <span class="promo-badge">官方社群</span>
                </div>
                <div class="promo-subtitle">加入 chronoral 官方社群</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 背面板展示 -->
    <div class="card-wrap">
      <div class="card-title">背面 (BACK FACE) - 高清矢量二维码 + 快捷直达</div>
      <div class="promo-widget">
        <div id="flip-wrapper">
          <div class="face back-face">
            <div class="promo-scene-art">
              <svg viewBox="0 0 320 114" fill="none">
                ${backStarTrails.map(t => `
                  <path class="${t.flowClass}" d="${t.d}" fill="none" stroke="${t.color}" stroke-width="${t.strokeWidth}" opacity="${t.opacity}" stroke-linecap="round" stroke-dasharray="${t.dashArray}" />
                `).join('\n')}
              </svg>
            </div>
            <div class="promo-back-grid">
              <div class="promo-back-left">
                <div class="promo-back-title">扫码加入</div>
                <div class="promo-back-subtitle">获取最新动态与文章更新推送</div>
                <div class="promo-cta-action">
                  <a href="#" class="promo-cta-btn">
                    <span>立即加入</span>
                    <span>&nearr;</span>
                  </a>
                </div>
              </div>
              <div class="promo-qr-chassis">
                <div class="promo-qr-wrapper">
                  <img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=https://t.me/chronoral" alt="QR" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</body>
</html>
`;

fs.writeFileSync('scratch/test_full_widget_preview.html', html);

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 900, height: 350 } });
  await page.setContent(html);
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'scratch/full_widget_preview.png' });
  await browser.close();
  console.log('Saved scratch/full_widget_preview.png');
})();
