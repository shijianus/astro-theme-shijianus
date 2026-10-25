import { chromium } from 'playwright';
import fs from 'fs';

// 确定性随机数
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

// 极其鲜明、100% 无法错认的官方 3D Telegram 纸飞机 (Telegram 3D Iconic Masterpiece)
// 尺寸 56px，32° 昂首冲刺姿态，纯白大主翼 + 通透淡蓝展翼 + 纯净宝蓝龙骨，绝无任何黑线！
function renderIconicTg3D(size = 56) {
  return `
    <svg width="${size}" height="${size}" viewBox="0 0 170 170" fill="none" style="overflow: visible;">
      <defs>
        <!-- 主迎光大翼面：纯白高光微渐变 (166,75 -> 24.8,111 -> 100,144.5) -->
        <linearGradient id="plane-wing-main" x1="24.8" y1="111" x2="166" y2="75" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stop-color="#ffffff" />
          <stop offset="70%" stop-color="#ffffff" />
          <stop offset="100%" stop-color="#f0f7ff" />
        </linearGradient>

        <!-- 侧展副翼面：通透晴空淡蓝 (166,75 -> 100,144.5 -> 148.4,180.2) -->
        <linearGradient id="plane-wing-side" x1="60" y1="120" x2="166" y2="75" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stop-color="#93c5fd" />
          <stop offset="55%" stop-color="#bae6fd" />
          <stop offset="100%" stop-color="#e0f2fe" />
        </linearGradient>

        <!-- 折纸龙骨折叠角：纯净宝蓝，与深空浑然一体，绝无黑色 -->
        <linearGradient id="plane-keel-clean" x1="80" y1="130" x2="120" y2="175" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stop-color="#3b82f6" />
          <stop offset="100%" stop-color="#1d4ed8" />
        </linearGradient>

        <!-- 龙骨折痕内层角：高明度纯正群青（绝无 #172554 或暗斑） -->
        <linearGradient id="plane-keel-inner" x1="82" y1="132" x2="105" y2="175" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stop-color="#2563eb" />
          <stop offset="100%" stop-color="#1e40af" />
        </linearGradient>

        <!-- 折痕主脊锋利高光线 -->
        <linearGradient id="plane-crease-light" x1="24.8" y1="111" x2="166" y2="75" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stop-color="#ffffff" stop-opacity="0.95" />
          <stop offset="85%" stop-color="#ffffff" stop-opacity="1" />
          <stop offset="100%" stop-color="#ffffff" stop-opacity="0.6" />
        </linearGradient>

        <!-- 超轻盈纯净大气漫射投影 (软蓝，绝无黑斑) -->
        <filter id="plane-soft-shadow" x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="-2" dy="4" stdDeviation="3.5" flood-color="rgba(2, 44, 120, 0.28)" />
        </filter>
      </defs>

      <g filter="url(#plane-soft-shadow)" transform="rotate(-6 85 85)">
        <!-- 1. 折叠机腹内层三角 (折纸深层，纯净群青蓝) -->
        <path d="M98 175c-3.8 0-3.2-1.5-4.5-5.2L82 132.2 152.8 88" fill="url(#plane-keel-inner)" />
        
        <!-- 2. 中腹折叠小角 (纯净宝蓝) -->
        <path d="M98 175c3 0 4.3-1.4 6-3l16-15.5-20-12" fill="url(#plane-keel-clean)" />
        
        <!-- 3. 右展翼面 (下翼面：机鼻 166,75 -> 腹折点 100,144.5 -> 右翼尾梢 148.4,180.2) -->
        <polygon points="166,75 100,144.5 148.4,180.2" fill="url(#plane-wing-side)" />
        
        <!-- 4. 左主翼面 (主受光翼面：机鼻 166,75 -> 左翼尾梢 24.8,111 -> 腹折点 100,144.5) -->
        <polygon points="166,75 24.8,111 100,144.5" fill="url(#plane-wing-main)" />
        
        <!-- 5. 机脊贯穿锋刃高光线 (从尾梢笔直贯穿至机鼻) -->
        <line x1="24.8" y1="111" x2="166" y2="75" stroke="url(#plane-crease-light)" stroke-width="1.8" stroke-linecap="round" />
        
        <!-- 6. 机尖破空耀斑微光点 -->
        <circle cx="166" cy="75" r="2.2" fill="#ffffff" />
      </g>
    </svg>
  `;
}

// 生成 48 颗具有真实多频随机闪烁的星空 (绝无死板静态，绝无怪异虚线滑动)
function generateLivingStarfield(cx = 345, cy = -45) {
  const rng = createRNG(88);
  let starsSvg = '';

  // 1. 48 颗多阶随机恒星，每颗拥有独立相位与闪烁周期
  const colors = ['#ffffff', '#ffffff', '#bae6fd', '#e0f2fe', '#7dd3fc'];
  for (let i = 0; i < 48; i++) {
    const x = 6 + rng() * 304;
    const y = 6 + rng() * 102;
    const inText = (x > 50 && x < 185 && y > 25 && y < 85);
    const op = inText ? (0.1 + rng() * 0.15) : (0.2 + rng() * 0.55);
    const r = (0.45 + rng() * 0.7).toFixed(1);
    const c = colors[Math.floor(rng() * colors.length)];
    // 6 组完全错开的真实呼吸类名
    const twGroup = `twinkle-phase-${(i % 6) + 1}`;
    starsSvg += `<circle class="${twGroup}" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r}" fill="${c}" opacity="${op.toFixed(2)}" />\n`;
  }

  // 2. 长曝光纯净同心星轨：改用【连续平滑光晕圆弧】！彻底移除怪异的滑动虚线 (stroke-dashoffset 循环)！
  // 在真实天文延时中，星轨是长曝光光迹，静谧柔滑，伴随天光微弱呼吸，绝不是虚线毛毛虫在爬！
  let trailsSvg = '';
  for (let i = 0; i < 22; i++) {
    const r = 52 + i * 14.5 + (rng() * 3 - 1.5);
    const s = 95 + rng() * 20;
    const span = 60 + rng() * 35;
    const e = s + span;
    const d = arcPath(cx, cy, r, s, e);
    const mag = rng();
    if (mag > 0.82) {
      // 亮轨：双层微光扩散，柔和呼吸
      trailsSvg += `<path class="trail-glow-aura" d="${d}" fill="none" stroke="#ffffff" stroke-width="2.2" opacity="0.18" stroke-linecap="round" filter="blur(1.2px)" />\n`;
      trailsSvg += `<path class="trail-core-line" d="${d}" fill="none" stroke="#ffffff" stroke-width="0.9" opacity="0.6" stroke-linecap="round" />\n`;
    } else if (mag > 0.5) {
      trailsSvg += `<path d="${d}" fill="none" stroke="#bae6fd" stroke-width="0.6" opacity="0.32" stroke-linecap="round" />\n`;
    } else {
      const c = (i % 2 === 0) ? '#38bdf8' : '#7dd3fc';
      trailsSvg += `<path d="${d}" fill="none" stroke="${c}" stroke-width="0.4" opacity="0.16" stroke-linecap="round" />\n`;
    }
  }

  // 3. 动态【真实漫游与深空呼吸】的核心大亮星 (绝不再是死板站桩！)
  // 核心星 1: 伴随星芒自转与呼吸绽放，在星空中如同北极星般灵动运转
  // 核心星 2: 沿天极圆弧做微漫游漂移 (celestial drift)
  const livingStars = `
    <!-- 亮星 1: 天极灯塔巨星 (动态光芒绽放 + 错相自转呼吸) -->
    <g class="celestial-beacon-1" transform="translate(196, 72)">
      <g class="beacon-spike-rotate">
        <path d="M 0 -8 Q 0 0 8 0 Q 0 0 0 8 Q 0 0 -8 0 Q 0 0 0 -8 Z" fill="#ffffff" />
      </g>
      <circle cx="0" cy="0" r="1.8" fill="#ffffff" />
      <circle class="beacon-glow-pulse" cx="0" cy="0" r="10" fill="#ffffff" opacity="0.35" filter="blur(1.5px)" />
    </g>

    <!-- 亮星 2: 晴空微漂移亮星 (天极圆弧轨道漫游) -->
    <g class="celestial-orbit-star" transform-origin="${cx}px ${cy}px">
      <g transform="translate(142, 22)">
        <path class="beacon-spike-pulse" d="M 0 -5 Q 0 0 5 0 Q 0 0 0 5 Q 0 0 -5 0 Q 0 0 0 -5 Z" fill="#bae6fd" />
        <circle cx="0" cy="0" r="1.4" fill="#ffffff" />
        <circle class="beacon-glow-pulse" cx="0" cy="0" r="7" fill="#bae6fd" opacity="0.35" filter="blur(1.2px)" />
      </g>
    </g>

    <!-- 亮星 3: 右下深空呼吸星 -->
    <g class="celestial-beacon-3" transform="translate(282, 86)">
      <path class="beacon-spike-pulse-alt" d="M 0 -4.5 Q 0 0 4.5 0 Q 0 0 0 4.5 Q 0 0 -4.5 0 Q 0 0 0 -4.5 Z" fill="#e0f2fe" />
      <circle cx="0" cy="0" r="1.2" fill="#ffffff" />
      <circle class="beacon-glow-pulse" cx="0" cy="0" r="6" fill="#e0f2fe" opacity="0.3" filter="blur(1px)" />
    </g>
  `;

  return starsSvg + trailsSvg + livingStars;
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
      background: #080d1a;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      color: #f8fafc;
    }
    .wrap {
      display: flex;
      flex-direction: column;
      gap: 30px;
      max-width: 700px;
      margin: 0 auto;
    }
    .promo-card {
      position: relative;
      width: 320px;
      height: 114px;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 10px 25px -5px rgba(2, 132, 199, 0.4);
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
      background: radial-gradient(circle at 35% 30%, rgba(255, 255, 255, 0.38) 0%, rgba(255, 255, 255, 0.14) 65%, rgba(2, 44, 120, 0.25) 100%);
      border: 1px solid rgba(255, 255, 255, 0.55);
      backdrop-filter: blur(10px);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      box-shadow: inset 0 1px 2px rgba(255, 255, 255, 0.7), 0 4px 12px rgba(2, 44, 120, 0.25);
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

    /* 纸飞机容器：悬浮在右侧 (清晰醒目，比例分明) */
    .hero-tg-plane {
      animation: tgHeroHover 4.5s ease-in-out infinite;
      will-change: transform;
      transform-origin: 250px 32px;
    }
    @keyframes tgHeroHover {
      0%, 100% {
        transform: translate(222px, 12px) rotate(0deg);
      }
      50% {
        transform: translate(224px, 7px) rotate(2.5deg);
      }
    }

    /* 核心：真实星空多阶独立呼吸闪烁体系 (6 组完全错相，绝不死板，绝无虚线滑动！) */
    .twinkle-phase-1 { animation: twPulse 2.1s ease-in-out infinite; }
    .twinkle-phase-2 { animation: twPulse 3.4s ease-in-out 0.6s infinite; }
    .twinkle-phase-3 { animation: twPulse 2.8s ease-in-out 1.2s infinite; }
    .twinkle-phase-4 { animation: twPulse 4.2s ease-in-out 0.3s infinite; }
    .twinkle-phase-5 { animation: twPulse 3.1s ease-in-out 1.7s infinite; }
    .twinkle-phase-6 { animation: twPulse 2.5s ease-in-out 0.9s infinite; }

    @keyframes twPulse {
      0%, 100% { opacity: 0.2; transform: scale(0.85); }
      50% { opacity: 0.85; transform: scale(1.25); }
    }

    /* 最明亮星芒：完全动起来！动态自转、星芒衍射绽放、光晕脉动 */
    .beacon-spike-rotate {
      animation: spikeSpin 16s linear infinite;
      transform-box: fill-box;
      transform-origin: center;
    }
    @keyframes spikeSpin {
      from { transform: rotate(0deg) scale(0.85); }
      50% { transform: rotate(180deg) scale(1.2); }
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

    /* 亮星天体圆周漫游 (围绕天极自然运转，告别死寂站桩) */
    .celestial-orbit-star {
      animation: celestialDrift 28s ease-in-out infinite alternate;
    }
    @keyframes celestialDrift {
      from { transform: rotate(0deg); }
      to { transform: rotate(-8deg); }
    }

    /* 星轨光迹柔和呼吸 (连续平滑光流，绝无滑动虚线) */
    .trail-glow-aura {
      animation: trailAuraPulse 6s ease-in-out infinite alternate;
    }
    @keyframes trailAuraPulse {
      from { opacity: 0.12; }
      to { opacity: 0.28; }
    }
  </style>
</head>
<body>
  <div class="wrap">
    <h2>彻底解决三大问题：官方 3D 纸飞机一眼即识 + 亮星灵动旋转呼吸 + 真实深空有机星野</h2>
    <div class="promo-card">
      <svg class="promo-scene-art" viewBox="0 0 320 114">
        <!-- 真实深空星野 + 动感亮星 + 连续平滑星轨 (无任何虚线滑动！) -->
        ${generateLivingStarfield(345, -45)}

        <!-- 右侧官方经典 3D Telegram 纸飞机 (清晰醒目，一眼必识，绝无黑斑) -->
        <g class="hero-tg-plane">
          ${renderIconicTg3D(58)}
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
</body>
</html>
`;

fs.writeFileSync('scratch/test_living_celestial.html', html);

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 800, height: 350 } });
  await page.setContent(html);

  // 捕获 0s 初始帧
  await page.screenshot({ path: 'scratch/living_celestial_t0.png' });
  console.log('Saved scratch/living_celestial_t0.png');

  // 等待 1.5s 捕获动态第二帧 (验证亮星旋转呼吸与星点相位交替)
  await page.waitForTimeout(1500);
  await page.screenshot({ path: 'scratch/living_celestial_t15.png' });
  console.log('Saved scratch/living_celestial_t15.png');

  // 等待 3.0s 捕获动态第三帧
  await page.waitForTimeout(1500);
  await page.screenshot({ path: 'scratch/living_celestial_t30.png' });
  console.log('Saved scratch/living_celestial_t30.png');

  await browser.close();
})();
