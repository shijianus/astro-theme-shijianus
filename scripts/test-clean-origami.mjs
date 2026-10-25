import { chromium } from 'playwright';
import fs from 'fs';

// 确定性伪随机算法
function createRNG(seed = 108) {
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

// 生成真实深空随机微恒星与长曝光同心星轨
function renderStarfield() {
  const rng = createRNG(77);
  let starsSvg = '';

  // 1. 42 颗自然随机微星 (真实天文深空星野)
  const colors = ['#ffffff', '#ffffff', '#bae6fd', '#e0f2fe', '#7dd3fc'];
  for (let i = 0; i < 42; i++) {
    const x = 6 + rng() * 300;
    const y = 6 + rng() * 102;
    // 避开文字核心区
    const inText = (x > 55 && x < 185 && y > 28 && y < 85);
    const op = inText ? (0.08 + rng() * 0.12) : (0.16 + rng() * 0.55);
    const r = (0.4 + rng() * 0.6).toFixed(1);
    const c = colors[Math.floor(rng() * colors.length)];
    const tw = (i % 8 === 0) ? ` class="twinkle-${(i % 3) + 1}"` : '';
    starsSvg += `<circle${tw} cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r}" fill="${c}" opacity="${op.toFixed(2)}" />\n`;
  }

  // 2. 26 轨长曝光非等距同心星流 (天极: cx: 345, cy: -45)
  let trailsSvg = '';
  const cx = 345;
  const cy = -45;
  for (let i = 0; i < 26; i++) {
    const r = 50 + i * 13.5 + (rng() * 4 - 2);
    const s = 95 + rng() * 25;
    const span = 55 + rng() * 40;
    const e = s + span;
    const d = arcPath(cx, cy, r, s, e);
    const mag = rng();
    if (mag > 0.88) {
      trailsSvg += `<path class="trail-flow-major glow-trail" d="${d}" fill="none" stroke="#ffffff" stroke-width="2.6" opacity="0.22" stroke-linecap="round" filter="blur(1.2px)" stroke-dasharray="140 40 70 30" />\n`;
      trailsSvg += `<path class="trail-flow-major" d="${d}" fill="none" stroke="#ffffff" stroke-width="1.3" opacity="0.75" stroke-linecap="round" stroke-dasharray="140 40 70 30" />\n`;
    } else if (mag > 0.6) {
      trailsSvg += `<path class="trail-flow-medium" d="${d}" fill="none" stroke="#bae6fd" stroke-width="0.8" opacity="0.42" stroke-linecap="round" stroke-dasharray="65 20 30 15" />\n`;
    } else {
      const c = (i % 2 === 0) ? '#38bdf8' : '#7dd3fc';
      trailsSvg += `<path class="trail-drift" d="${d}" fill="none" stroke="${c}" stroke-width="0.45" opacity="0.18" stroke-linecap="round" stroke-dasharray="35 12 18 8" />\n`;
    }
  }

  // 3. 3 处十字衍射星芒 (不同位置、不同大小，无流星)
  const spikesSvg = `
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
  `;

  return starsSvg + trailsSvg + spikesSvg;
}

// 纸飞机方案 A: 经典 3D 飞镖纸飞机 (Classic Dart Aero 3D)
// 绝无任何黑块、黑线或外围圆圈，比例逼真修长，机头冲刺 40°
function planeClassicDart(size = 50) {
  return `
    <svg width="${size}" height="${size}" viewBox="0 0 100 100" fill="none" style="overflow: visible;">
      <defs>
        <!-- 主迎光大翼面：纯白高光渐变 -->
        <linearGradient id="cd-wing-top" x1="16" y1="80" x2="96" y2="16" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stop-color="#ffffff" />
          <stop offset="68%" stop-color="#ffffff" />
          <stop offset="100%" stop-color="#f0f7ff" />
        </linearGradient>
        <!-- 侧翼斜下展面：清澈晴空天蓝 -->
        <linearGradient id="cd-wing-side" x1="52" y1="62" x2="96" y2="16" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stop-color="#93c5fd" />
          <stop offset="55%" stop-color="#bae6fd" />
          <stop offset="100%" stop-color="#e0f2fe" />
        </linearGradient>
        <!-- 龙骨折痕小腹鳍：纯正清澈宝蓝，绝不用任何黑色或脏灰 -->
        <linearGradient id="cd-keel" x1="50" y1="58" x2="74" y2="82" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stop-color="#3b82f6" />
          <stop offset="100%" stop-color="#2563eb" />
        </linearGradient>
        <!-- 机背中央锐利高光折痕刃线 -->
        <linearGradient id="cd-spine" x1="16" y1="80" x2="96" y2="16" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stop-color="#ffffff" stop-opacity="0.95" />
          <stop offset="85%" stop-color="#ffffff" stop-opacity="1" />
          <stop offset="100%" stop-color="#ffffff" stop-opacity="0.5" />
        </linearGradient>
        <!-- 纯净轻盈的大气漫射光晕 (软蓝微影，彻底告别深重黑边) -->
        <filter id="cd-shadow" x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="-1" dy="3" stdDeviation="2.5" flood-color="rgba(2, 44, 120, 0.22)" />
        </filter>
      </defs>

      <g filter="url(#cd-shadow)">
        <!-- 1. 紧凑龙骨小腹鳍 (折面立体小角，清澈宝蓝) -->
        <polygon points="52,62 72,82 62,70" fill="url(#cd-keel)" />
        <!-- 2. 右展翼面 (下倾侧翼) -->
        <polygon points="96,16 52,62 76,82" fill="url(#cd-wing-side)" />
        <!-- 3. 左主翼面 (迎光主翼面) -->
        <polygon points="96,16 16,80 52,62" fill="url(#cd-wing-top)" />
        <!-- 4. 贯穿折脊高光线 (从尾梢贯穿到机头) -->
        <line x1="16" y1="80" x2="96" y2="16" stroke="url(#cd-spine)" stroke-width="1.3" stroke-linecap="round" />
        <!-- 5. 机尖破空微星芒 -->
        <circle cx="96" cy="16" r="1.4" fill="#ffffff" />
      </g>
    </svg>
  `;
}

// 纸飞机方案 B: 真实折纸折叠层 (Real Origami Folded Wing)
// 翼展更宽，呈现出更真实的纸张折叠厚度与折边质感
function planeOrigamiFold(size = 50) {
  return `
    <svg width="${size}" height="${size}" viewBox="0 0 100 100" fill="none" style="overflow: visible;">
      <defs>
        <linearGradient id="of-main" x1="18" y1="72" x2="94" y2="18" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stop-color="#ffffff" />
          <stop offset="65%" stop-color="#ffffff" />
          <stop offset="100%" stop-color="#f0f7ff" />
        </linearGradient>
        <linearGradient id="of-side" x1="48" y1="64" x2="94" y2="18" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stop-color="#7dd3fc" />
          <stop offset="50%" stop-color="#bae6fd" />
          <stop offset="100%" stop-color="#e0f2fe" />
        </linearGradient>
        <linearGradient id="of-under" x1="40" y1="58" x2="68" y2="86" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stop-color="#38bdf8" />
          <stop offset="100%" stop-color="#0284c7" />
        </linearGradient>
        <filter id="of-shadow" x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="-1" dy="3" stdDeviation="2.5" flood-color="rgba(2, 44, 120, 0.22)" />
        </filter>
      </defs>
      <g filter="url(#of-shadow)">
        <!-- 腹部暗面折层 (纯净海蓝，绝无黑块) -->
        <polygon points="46,60 68,84 58,70" fill="url(#of-under)" />
        <!-- 右翼 -->
        <polygon points="94,18 46,60 74,84" fill="url(#of-side)" />
        <!-- 左主翼 -->
        <polygon points="94,18 14,72 46,60" fill="url(#of-main)" />
        <!-- 高光折脊线 -->
        <line x1="14" y1="72" x2="94" y2="18" stroke="#ffffff" stroke-width="1.3" stroke-linecap="round" />
        <circle cx="94" cy="18" r="1.4" fill="#ffffff" />
      </g>
    </svg>
  `;
}

// 纸飞机方案 C: 官方 Telegram 构型 42° 倾角 3D 精准拟物 (Telegram Standard 3D Restored)
// 保持官方识别度，但将角度调至充满朝气的 40°，并用纯白、浅蓝与天蓝彻底重构，无任何黑块
function planeTgStandard3D(size = 50) {
  return `
    <svg width="${size}" height="${size}" viewBox="0 0 100 100" fill="none" style="overflow: visible;">
      <defs>
        <linearGradient id="tg3d-main" x1="20" y1="76" x2="94" y2="20" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stop-color="#ffffff" />
          <stop offset="65%" stop-color="#ffffff" />
          <stop offset="100%" stop-color="#f0f7ff" />
        </linearGradient>
        <linearGradient id="tg3d-side" x1="52" y1="62" x2="94" y2="20" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stop-color="#93c5fd" />
          <stop offset="55%" stop-color="#bfdbfe" />
          <stop offset="100%" stop-color="#e0f2fe" />
        </linearGradient>
        <linearGradient id="tg3d-fin" x1="48" y1="60" x2="70" y2="86" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stop-color="#38bdf8" />
          <stop offset="100%" stop-color="#2563eb" />
        </linearGradient>
        <filter id="tg3d-shadow" x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="-1" dy="3" stdDeviation="2.5" flood-color="rgba(2, 44, 120, 0.22)" />
        </filter>
      </defs>
      <g filter="url(#tg3d-shadow)">
        <!-- 腹部折角 (纯净亮蓝) -->
        <polygon points="50,62 70,84 60,70" fill="url(#tg3d-fin)" />
        <!-- 右翼 -->
        <polygon points="94,20 50,62 74,84" fill="url(#tg3d-side)" />
        <!-- 左主翼 (官方大展角) -->
        <polygon points="94,20 16,74 50,62" fill="url(#tg3d-main)" />
        <!-- 高光折痕 -->
        <line x1="16" y1="74" x2="94" y2="20" stroke="#ffffff" stroke-width="1.3" stroke-linecap="round" />
        <circle cx="94" cy="20" r="1.4" fill="#ffffff" />
      </g>
    </svg>
  `;
}

const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body {
      margin: 0;
      padding: 50px 30px;
      background: #090f1e;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      color: #f8fafc;
    }
    .container {
      display: flex;
      flex-direction: column;
      gap: 30px;
      max-width: 750px;
      margin: 0 auto;
    }
    .row {
      display: flex;
      align-items: center;
      gap: 24px;
    }
    .card-label {
      width: 220px;
      font-size: 14px;
      line-height: 1.4;
      color: #cbd5e1;
    }
    .card-label b {
      color: #38bdf8;
      display: block;
      margin-bottom: 4px;
      font-size: 15px;
    }
    .promo-card {
      position: relative;
      width: 310px;
      height: 114px;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 10px 25px -5px rgba(2, 132, 199, 0.38);
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
      padding: 12px 16px;
      display: flex;
      align-items: center;
      gap: 13px;
      z-index: 10;
      pointer-events: none;
    }
    .tg-avatar-clean {
      position: relative;
      width: 44px;
      height: 44px;
      border-radius: 50%;
      background: radial-gradient(circle at 35% 30%, rgba(255, 255, 255, 0.35) 0%, rgba(255, 255, 255, 0.12) 65%, rgba(2, 44, 120, 0.25) 100%);
      border: 1px solid rgba(255, 255, 255, 0.5);
      backdrop-filter: blur(8px);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      box-shadow: 0 4px 12px rgba(2, 44, 120, 0.25), inset 0 1px 1px rgba(255, 255, 255, 0.6);
    }
    .tg-avatar-plane {
      width: 24px;
      height: 24px;
      filter: drop-shadow(0 2px 4px rgba(2, 44, 120, 0.3));
    }
    .tg-meta {
      display: flex;
      flex-direction: column;
      justify-content: center;
    }
    .title-row {
      display: flex;
      align-items: center;
      gap: 7px;
      margin-bottom: 3px;
    }
    .brand-title {
      font-size: 1.15rem;
      font-weight: 800;
      color: #ffffff;
      line-height: 1.2;
      text-shadow: 0 1px 2px rgba(0, 0, 0, 0.15);
    }
    .badge {
      font-size: 0.65rem;
      font-weight: 700;
      padding: 1.5px 6px;
      border-radius: 4px;
      background: rgba(255, 255, 255, 0.25);
      border: 1px solid rgba(255, 255, 255, 0.45);
      color: #ffffff;
      line-height: 1.2;
    }
    .desc {
      font-size: 0.76rem;
      color: rgba(255, 255, 255, 0.95);
      line-height: 1.35;
      text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
    }

    /* 纸飞机容器定位 (纯净翱翔，无任何外圈与喷气杂线) */
    .hero-plane-box {
      transform: translate(236px, 20px);
    }

    /* 动效 */
    .trail-flow-major { animation: trailMajor 14s linear infinite; }
    .trail-flow-medium { animation: trailMed 20s linear infinite; }
    .trail-drift { animation: trailDrift 28s linear infinite; }
    @keyframes trailMajor { from { stroke-dashoffset: 0; } to { stroke-dashoffset: -345; } }
    @keyframes trailMed { from { stroke-dashoffset: 0; } to { stroke-dashoffset: -280; } }
    @keyframes trailDrift { from { stroke-dashoffset: 0; } to { stroke-dashoffset: -200; } }

    .twinkle-1 { animation: tw1 3.2s ease-in-out infinite; }
    .twinkle-2 { animation: tw1 4.5s ease-in-out 1.5s infinite; }
    .twinkle-3 { animation: tw1 3.8s ease-in-out 0.8s infinite; }
    @keyframes tw1 {
      0%, 100% { transform: scale(0.85); opacity: 0.55; }
      50% { transform: scale(1.22); opacity: 1; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="row">
      <div class="card-label">
        <b>方案 A: 经典 3D 飞镖纸飞机</b>
        机身修长，比例精准，冲刺动势极强，彻底无黑线、无杂线、无圆圈。
      </div>
      <div class="promo-card">
        <svg class="promo-scene-art" viewBox="0 0 310 114">
          ${renderStarfield()}
          <g class="hero-plane-box">
            ${planeClassicDart(48)}
          </g>
        </svg>
        <div class="promo-content">
          <div class="tg-avatar-clean">
            <svg class="tg-avatar-plane" viewBox="14 68 168 118" fill="none">
              <path d="M98 175c-3.8 0-3.2-1.5-4.5-5.2L82 132.2 152.8 88" fill="rgba(255,255,255,0.78)" />
              <path d="M98 175c3 0 4.3-1.4 6-3l16-15.5-20-12" fill="rgba(255,255,255,0.52)" />
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

    <div class="row">
      <div class="card-label">
        <b>方案 B: 折叠层翼展纸飞机</b>
        翼展略宽，机翼后掠角度自然，折痕鲜明，纯蓝纯白无黑线。
      </div>
      <div class="promo-card">
        <svg class="promo-scene-art" viewBox="0 0 310 114">
          ${renderStarfield()}
          <g class="hero-plane-box">
            ${planeOrigamiFold(48)}
          </g>
        </svg>
        <div class="promo-content">
          <div class="tg-avatar-clean">
            <svg class="tg-avatar-plane" viewBox="14 68 168 118" fill="none">
              <path d="M98 175c-3.8 0-3.2-1.5-4.5-5.2L82 132.2 152.8 88" fill="rgba(255,255,255,0.78)" />
              <path d="M98 175c3 0 4.3-1.4 6-3l16-15.5-20-12" fill="rgba(255,255,255,0.52)" />
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

    <div class="row">
      <div class="card-label">
        <b>方案 C: 官方构型 40° 昂扬 3D</b>
        最贴近官方 Telegram 原生构型，但提升至 40° 昂首冲刺姿态，纯净微影。
      </div>
      <div class="promo-card">
        <svg class="promo-scene-art" viewBox="0 0 310 114">
          ${renderStarfield()}
          <g class="hero-plane-box">
            ${planeTgStandard3D(48)}
          </g>
        </svg>
        <div class="promo-content">
          <div class="tg-avatar-clean">
            <svg class="tg-avatar-plane" viewBox="14 68 168 118" fill="none">
              <path d="M98 175c-3.8 0-3.2-1.5-4.5-5.2L82 132.2 152.8 88" fill="rgba(255,255,255,0.78)" />
              <path d="M98 175c3 0 4.3-1.4 6-3l16-15.5-20-12" fill="rgba(255,255,255,0.52)" />
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
  </div>
</body>
</html>
`;

fs.writeFileSync('scratch/test_clean_origami.html', html);

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 850, height: 600 } });
  await page.setContent(html);
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'scratch/clean_origami_comparison.png' });
  await browser.close();
  console.log('Saved scratch/clean_origami_comparison.png');
})();
