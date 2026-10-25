import { chromium } from 'playwright';
import fs from 'fs';

function createRNG(seed = 42) {
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

// 48 颗多相深空恒星
const randomStars = (() => {
  const rng = createRNG(88);
  const stars = [];
  const colors = ['#ffffff', '#ffffff', '#bae6fd', '#e0f2fe', '#7dd3fc'];
  for (let i = 0; i < 48; i++) {
    const x = 6 + rng() * 304;
    const y = 6 + rng() * 102;
    const inText = (x > 50 && x < 185 && y > 25 && y < 85);
    const op = inText ? (0.1 + rng() * 0.15) : (0.2 + rng() * 0.55);
    const r = Number((0.45 + rng() * 0.7).toFixed(1));
    const c = colors[Math.floor(rng() * colors.length)];
    const twGroup = `twinkle-phase-${(i % 6) + 1}`;
    stars.push({ x: Number(x.toFixed(1)), y: Number(y.toFixed(1)), r, opacity: Number(op.toFixed(2)), color: c, twGroup });
  }
  return stars;
})();

// 22 轨平滑连续同心星流 (绝无怪异滑动虚线)
const frontStarTrails = (() => {
  const rng = createRNG(108);
  const cx = 345;
  const cy = -45;
  const items = [];
  for (let i = 0; i < 22; i++) {
    const r = 52 + i * 14.5 + (rng() * 3 - 1.5);
    const s = 95 + rng() * 20;
    const span = 60 + rng() * 35;
    const e = s + span;
    const d = arcPath(cx, cy, r, s, e);
    const mag = rng();
    let isMajor = mag > 0.82;
    let strokeWidth = isMajor ? 0.95 : (mag > 0.5 ? 0.6 : 0.4);
    let opacity = isMajor ? 0.65 : (mag > 0.5 ? 0.32 : 0.16);
    let color = isMajor ? '#ffffff' : (mag > 0.5 ? '#bae6fd' : (i % 2 === 0 ? '#38bdf8' : '#7dd3fc'));
    items.push({ d, strokeWidth, opacity, color, isMajor });
  }
  return items;
})();

const backStarTrails = (() => {
  const cx = 345;
  const cy = -45;
  const items = [];
  for (let i = 0; i < 16; i++) {
    const r = 68 + i * 22;
    const s = 105 + ((i * 15) % 20);
    const e = 180 + ((i * 20) % 30);
    const isBright = (i % 4 === 0);
    const strokeWidth = isBright ? 0.85 : 0.5;
    const opacity = isBright ? 0.35 : 0.18;
    const color = isBright ? '#e0f2fe' : '#7dd3fc';
    const d = arcPath(cx, cy, r, s, e);
    items.push({ d, strokeWidth, opacity, color, isBright });
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
      padding: 50px 30px;
      background: #080d1a;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      color: #f8fafc;
    }
    .wrapper {
      display: flex;
      gap: 36px;
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
    .promo-card-fixed {
      position: relative;
      width: 320px;
      height: 114px;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 10px 25px -5px rgba(2, 132, 199, 0.38), 0 2px 6px rgba(0, 0, 0, 0.05);
      background: 
        radial-gradient(circle at 10% 12%, rgba(255, 255, 255, 0.35) 0%, transparent 40%),
        radial-gradient(circle at 92% 82%, rgba(6, 182, 212, 0.45) 0%, transparent 45%),
        linear-gradient(135deg, #1d4ed8 0%, #2563eb 38%, #0284c7 72%, #06b6d4 100%);
      border: 1px solid rgba(255, 255, 255, 0.48);
      padding: 12px 16px;
      box-sizing: border-box;
      display: flex;
      align-items: center;
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

    /* 纸飞机悬浮：精致 52px，昂首 30° 翱翔 */
    .tg-plane-flight-rig {
      animation: tgPlaneHover 4.5s ease-in-out infinite;
      will-change: transform;
      transform-origin: 248px 34px;
    }
    @keyframes tgPlaneHover {
      0%, 100% {
        transform: translate(222px, 14px) rotate(0deg);
      }
      50% {
        transform: translate(224px, 9px) rotate(2.5deg);
      }
    }

    /* 6 组完全错相的深空有机微星闪烁 (绝无滑动循环) */
    .twinkle-phase-1 { animation: twPulse 2.1s ease-in-out infinite; }
    .twinkle-phase-2 { animation: twPulse 3.4s ease-in-out 0.6s infinite; }
    .twinkle-phase-3 { animation: twPulse 2.8s ease-in-out 1.2s infinite; }
    .twinkle-phase-4 { animation: twPulse 4.2s ease-in-out 0.3s infinite; }
    .twinkle-phase-5 { animation: twPulse 3.1s ease-in-out 1.7s infinite; }
    .twinkle-phase-6 { animation: twPulse 2.5s ease-in-out 0.9s infinite; }

    @keyframes twPulse {
      0%, 100% { opacity: 0.18; transform: scale(0.85); }
      50% { opacity: 0.92; transform: scale(1.3); }
    }

    /* 核心亮星彻底动起来：自转星芒、呼吸绽放与光晕交替 */
    .beacon-spike-rotate {
      animation: spikeSpin 16s linear infinite;
      transform-box: fill-box;
      transform-origin: center;
    }
    @keyframes spikeSpin {
      from { transform: rotate(0deg) scale(0.85); }
      50% { transform: rotate(180deg) scale(1.22); }
      to { transform: rotate(360deg) scale(0.85); }
    }

    .beacon-spike-pulse {
      animation: spikePulseA 3.6s ease-in-out infinite;
      transform-box: fill-box;
      transform-origin: center;
    }
    @keyframes spikePulseA {
      0%, 100% { transform: scale(0.75); opacity: 0.45; }
      50% { transform: scale(1.25); opacity: 1; }
    }

    .beacon-spike-pulse-alt {
      animation: spikePulseB 4.2s ease-in-out 1s infinite;
      transform-box: fill-box;
      transform-origin: center;
    }
    @keyframes spikePulseB {
      0%, 100% { transform: scale(0.8); opacity: 0.4; }
      50% { transform: scale(1.2); opacity: 0.95; }
    }

    .beacon-glow-pulse {
      animation: glowBreathing 3s ease-in-out infinite;
    }
    @keyframes glowBreathing {
      0%, 100% { opacity: 0.15; transform: scale(0.8); }
      50% { opacity: 0.5; transform: scale(1.3); }
    }

    .celestial-orbit-star {
      animation: celestialDrift 28s ease-in-out infinite alternate;
    }
    @keyframes celestialDrift {
      from { transform: rotate(0deg); }
      to { transform: rotate(-8deg); }
    }

    /* 连续平滑星轨光迹柔和呼吸 */
    .trail-glow-aura {
      animation: trailAuraPulse 6s ease-in-out infinite alternate;
    }
    @keyframes trailAuraPulse {
      from { opacity: 0.12; }
      to { opacity: 0.28; }
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
    .promo-qr-chassis {
      display: flex;
      align-items: center;
      justify-content: center;
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
    <!-- 正面板 -->
    <div class="card-wrap">
      <div class="card-title">正面 (FRONT FACE) - 真实 3D Telegram 纸飞机 + 动态旋转呼吸亮星 + 纯净星空</div>
      <div class="promo-card-fixed">
        <div class="promo-scene-art">
          <svg viewBox="0 0 320 114" fill="none">
            <defs>
              <linearGradient id="p-wing-main" x1="24.8" y1="111" x2="166" y2="75" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stop-color="#ffffff" />
                <stop offset="70%" stop-color="#ffffff" />
                <stop offset="100%" stop-color="#f0f7ff" />
              </linearGradient>
              <linearGradient id="p-wing-side" x1="60" y1="120" x2="166" y2="75" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stop-color="#93c5fd" />
                <stop offset="55%" stop-color="#bae6fd" />
                <stop offset="100%" stop-color="#e0f2fe" />
              </linearGradient>
              <linearGradient id="p-keel-clean" x1="80" y1="130" x2="120" y2="175" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stop-color="#3b82f6" />
                <stop offset="100%" stop-color="#1d4ed8" />
              </linearGradient>
              <linearGradient id="p-keel-inner" x1="82" y1="132" x2="105" y2="175" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stop-color="#2563eb" />
                <stop offset="100%" stop-color="#1e40af" />
              </linearGradient>
              <linearGradient id="p-spine-light" x1="24.8" y1="111" x2="166" y2="75" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stop-color="#ffffff" stop-opacity="0.95" />
                <stop offset="85%" stop-color="#ffffff" stop-opacity="1" />
                <stop offset="100%" stop-color="#ffffff" stop-opacity="0.6" />
              </linearGradient>
              <filter id="p-shadow" x="-30%" y="-30%" width="160%" height="160%">
                <feDropShadow dx="-2" dy="4" stdDeviation="3.5" flood-color="rgba(2, 44, 120, 0.28)" />
              </filter>
            </defs>

            <!-- 1. 48 颗多阶随机恒星 -->
            ${randomStars.map(s => `<circle class="${s.twGroup}" cx="${s.x}" cy="${s.y}" r="${s.r}" fill="${s.color}" opacity="${s.opacity}" />`).join('\n')}

            <!-- 2. 长曝光平滑连续星轨 -->
            ${frontStarTrails.map(t => `
              ${t.isMajor ? `<path class="trail-glow-aura" d="${t.d}" fill="none" stroke="${t.color}" stroke-width="${t.strokeWidth * 2.2}" opacity="${t.opacity * 0.3}" stroke-linecap="round" filter="blur(1.2px)" />` : ''}
              <path d="${t.d}" fill="none" stroke="${t.color}" stroke-width="${t.strokeWidth}" opacity="${t.opacity}" stroke-linecap="round" />
            `).join('\n')}

            <!-- 3. 动态旋转呼吸亮星 (彻底告别死板站桩) -->
            <g class="celestial-beacon-1" transform="translate(196, 72)">
              <g class="beacon-spike-rotate">
                <path d="M 0 -8 Q 0 0 8 0 Q 0 0 0 8 Q 0 0 -8 0 Q 0 0 0 -8 Z" fill="#ffffff" />
              </g>
              <circle cx="0" cy="0" r="1.8" fill="#ffffff" />
              <circle class="beacon-glow-pulse" cx="0" cy="0" r="10" fill="#ffffff" opacity="0.35" filter="blur(1.5px)" />
            </g>

            <g class="celestial-orbit-star" transform-origin="345px -45px">
              <g transform="translate(142, 22)">
                <path class="beacon-spike-pulse" d="M 0 -5 Q 0 0 5 0 Q 0 0 0 5 Q 0 0 -5 0 Q 0 0 0 -5 Z" fill="#bae6fd" />
                <circle cx="0" cy="0" r="1.4" fill="#ffffff" />
                <circle class="beacon-glow-pulse" cx="0" cy="0" r="7" fill="#bae6fd" opacity="0.35" filter="blur(1.2px)" />
              </g>
            </g>

            <g class="celestial-beacon-3" transform="translate(282, 86)">
              <path class="beacon-spike-pulse-alt" d="M 0 -4.5 Q 0 0 4.5 0 Q 0 0 0 4.5 Q 0 0 -4.5 0 Q 0 0 0 -4.5 Z" fill="#e0f2fe" />
              <circle cx="0" cy="0" r="1.2" fill="#ffffff" />
              <circle class="beacon-glow-pulse" cx="0" cy="0" r="6" fill="#e0f2fe" opacity="0.3" filter="blur(1px)" />
            </g>

            <!-- 4. 醒目、一眼必识的 3D Telegram 纸飞机 (52px，昂首翱翔，0 黑斑) -->
            <g class="tg-plane-flight-rig">
              <svg width="52" height="52" viewBox="0 0 170 170" fill="none" style="overflow: visible;">
                <g filter="url(#p-shadow)" transform="rotate(-8 85 85)">
                  <!-- 1. 折叠机腹内层三角 (群青蓝) -->
                  <path d="M98 175c-3.8 0-3.2-1.5-4.5-5.2L82 132.2 152.8 88" fill="url(#p-keel-inner)" />
                  <!-- 2. 中腹折叠小角 (宝蓝) -->
                  <path d="M98 175c3 0 4.3-1.4 6-3l16-15.5-20-12" fill="url(#p-keel-clean)" />
                  <!-- 3. 右展翼面 (淡蓝) -->
                  <polygon points="166,75 100,144.5 148.4,180.2" fill="url(#p-wing-side)" />
                  <!-- 4. 左主翼面 (纯白) -->
                  <polygon points="166,75 24.8,111 100,144.5" fill="url(#p-wing-main)" />
                  <!-- 5. 机脊贯穿锋刃高光线 -->
                  <line x1="24.8" y1="111" x2="166" y2="75" stroke="url(#p-spine-light)" stroke-width="1.8" stroke-linecap="round" />
                  <!-- 6. 机尖光点 -->
                  <circle cx="166" cy="75" r="2.2" fill="#ffffff" />
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

    <!-- 背面板 -->
    <div class="card-wrap">
      <div class="card-title">背面 (BACK FACE) - 高清矢量二维码 + 快捷直达</div>
      <div class="promo-card-fixed">
        <div class="promo-scene-art">
          <svg viewBox="0 0 320 114" fill="none">
            ${backStarTrails.map(t => `
              <path d="${t.d}" fill="none" stroke="${t.color}" stroke-width="${t.strokeWidth}" opacity="${t.opacity}" stroke-linecap="round" />
            `).join('\n')}
          </svg>
        </div>
        <div class="promo-back-grid">
          <div class="promo-back-left">
            <div class="promo-back-title">扫码加入</div>
            <div class="promo-back-subtitle">获取最新动态与文章更新推送</div>
            <div class="promo-cta-action">
              <a href="#" class="promo-cta-btn">
                <span>立即直达</span>
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
</body>
</html>
`;

fs.writeFileSync('scratch/test_card_comparison_v5.html', html);

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 850, height: 350 } });
  await page.setContent(html);

  await page.screenshot({ path: 'scratch/card_v5_side_by_side.png' });
  console.log('Saved scratch/card_v5_side_by_side.png');

  await browser.close();
})();
