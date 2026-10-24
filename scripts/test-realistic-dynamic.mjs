import { chromium } from 'playwright';
import fs from 'fs';

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

// 极其形象、逼真、结构严谨的 3D 折纸飞机 (具有机头尖锋、左翼朝光面、右翼中调面、机身三角折角、尾翼投影)
// 标准朝向：指向右上约 45°
function createRealistic3DPaperPlane(size = 46) {
  return `
    <svg width="${size}" height="${size}" viewBox="0 0 120 120" fill="none" style="overflow: visible;">
      <defs>
        <!-- 主机翼高光纯白渐变 -->
        <linearGradient id="plane-wing-bright" x1="20" y1="90" x2="110" y2="15" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stop-color="#ffffff" />
          <stop offset="60%" stop-color="#ffffff" />
          <stop offset="100%" stop-color="#e0f2fe" />
        </linearGradient>
        
        <!-- 侧翼柔光渐变 -->
        <linearGradient id="plane-wing-mid" x1="50" y1="65" x2="110" y2="15" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stop-color="#bae6fd" />
          <stop offset="50%" stop-color="#93c5fd" />
          <stop offset="100%" stop-color="#dbeafe" />
        </linearGradient>
        
        <!-- 纸张折叠立体暗面 -->
        <linearGradient id="plane-body-dark" x1="45" y1="70" x2="70" y2="95" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stop-color="#3b82f6" />
          <stop offset="100%" stop-color="#1d4ed8" />
        </linearGradient>

        <!-- 内部折叠遮光面 -->
        <linearGradient id="plane-inner-shade" x1="55" y1="75" x2="65" y2="85" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stop-color="#1e40af" />
          <stop offset="100%" stop-color="#172554" />
        </linearGradient>

        <!-- 飞机背脊高光高亮线 -->
        <linearGradient id="plane-spine-glow" x1="15" y1="85" x2="110" y2="15" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stop-color="#ffffff" stop-opacity="0.95"/>
          <stop offset="85%" stop-color="#ffffff" stop-opacity="1"/>
          <stop offset="100%" stop-color="#ffffff" stop-opacity="0.6"/>
        </linearGradient>

        <!-- 拟物阴影 -->
        <filter id="plane-real-shadow" x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="-2" dy="5" stdDeviation="3.5" flood-color="rgba(2, 44, 120, 0.45)" />
        </filter>
      </defs>

      <g filter="url(#plane-real-shadow)">
        <!-- 1. 左翼 (主受光翼面：机头 108,18 -> 机尾底 18,80 -> 中央折痕 62,64) -->
        <polygon points="108,18 18,80 62,64" fill="url(#plane-wing-bright)" />

        <!-- 2. 右翼 (斜下展翼：机头 108,18 -> 中央折痕 62,64 -> 右翼梢 86,96) -->
        <polygon points="108,18 62,64 86,96" fill="url(#plane-wing-mid)" />

        <!-- 3. 机腹中央三角龙骨 (折纸下沉折叠：中央折痕 62,64 -> 右翼梢 86,96 -> 龙骨尖 70,82) -->
        <polygon points="62,64 86,96 70,82" fill="url(#plane-body-dark)" />

        <!-- 4. 机身底部微阴影角 (龙骨尖 70,82 -> 尾翼收束 62,64 -> 翼根暗点 60,74) -->
        <polygon points="62,64 70,82 60,74" fill="url(#plane-inner-shade)" opacity="0.8" />

        <!-- 5. 机脊锋刃高光线 (从机尾到机鼻最锐利的一道光) -->
        <line x1="18" y1="80" x2="108" y2="18" stroke="url(#plane-spine-glow)" stroke-width="1.4" stroke-linecap="round"/>

        <!-- 6. 机鼻尖端耀斑光点 -->
        <circle cx="108" cy="18" r="1.6" fill="#ffffff" />
      </g>
    </svg>
  `;
}

// 生成具有真实天文延时摄影流光感的多级星轨
function generateStellarFlowTrails(cx = 340, cy = -40) {
  let svg = '';
  // 32 轨精细同心圆弧
  for (let i = 0; i < 32; i++) {
    const r = 52 + i * 11.5;
    const s = 100 + ((i * 17) % 24);
    const e = 188 + ((i * 23) % 36);
    
    // 星等阶梯
    const isMajor = (i % 7 === 0);
    const isMedium = (i % 3 === 0 && !isMajor);
    
    let strokeWidth = 0.55;
    let opacity = 0.2;
    let color = '#7dd3fc';
    let flowClass = '';
    let dash = '';

    if (isMajor) {
      strokeWidth = 1.45;
      opacity = 0.75;
      color = '#ffffff';
      flowClass = 'trail-flow-major';
      dash = 'stroke-dasharray="180 35 90 40"';
    } else if (isMedium) {
      strokeWidth = 0.9;
      opacity = 0.48;
      color = '#bae6fd';
      flowClass = 'trail-flow-medium';
      dash = 'stroke-dasharray="80 20 40 15"';
    } else if (i % 2 === 0) {
      strokeWidth = 0.65;
      opacity = 0.28;
      color = '#38bdf8';
      flowClass = 'trail-drift';
      dash = 'stroke-dasharray="50 15 25 10"';
    } else {
      dash = 'stroke-dasharray="30 8 15 6"';
    }
    
    const d = arcPath(cx, cy, r, s, e);
    
    if (isMajor) {
      svg += `<path class="${flowClass} glow-layer" d="${d}" fill="none" stroke="${color}" stroke-width="${strokeWidth * 2.4}" opacity="${opacity * 0.35}" stroke-linecap="round" filter="blur(1.2px)" ${dash}/>\n`;
    }
    svg += `<path class="${flowClass}" d="${d}" fill="none" stroke="${color}" stroke-width="${strokeWidth}" opacity="${opacity}" stroke-linecap="round" ${dash}/>\n`;

    // 恒星节点
    if (isMajor || i === 11 || i === 19 || i === 27) {
      const angle = s + (e - s) * 0.62;
      const rad = (angle * Math.PI) / 180;
      const sx = cx + r * Math.cos(rad);
      const sy = cy + r * Math.sin(rad);
      if (sx >= 5 && sx <= 315 && sy >= 5 && sy <= 109) {
        svg += `<circle class="stellar-node" cx="${sx.toFixed(1)}" cy="${sy.toFixed(1)}" r="${(strokeWidth * 0.9).toFixed(1)}" fill="#ffffff" opacity="${Math.min(1, opacity + 0.35)}" />\n`;
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
      padding: 60px 40px;
      background: #060911;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      color: #f8fafc;
    }
    .wrapper {
      display: flex;
      flex-direction: column;
      gap: 32px;
      max-width: 900px;
      margin: 0 auto;
    }
    .card-preview-box {
      display: flex;
      align-items: center;
      gap: 24px;
    }
    .promo-card {
      position: relative;
      width: 310px;
      height: 114px;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 12px 30px -4px rgba(2, 132, 199, 0.45);
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
      gap: 14px;
      z-index: 10;
      pointer-events: none;
    }

    /* ======================================================== */
    /* 左侧 ICON 组件形象化重塑：立体天文舱 + 动态雷达微波      */
    /* ======================================================== */
    .tg-avatar-pod {
      position: relative;
      width: 46px;
      height: 46px;
      border-radius: 50%;
      background: radial-gradient(circle at 32% 28%, rgba(255, 255, 255, 0.4) 0%, rgba(255, 255, 255, 0.16) 65%, rgba(2, 44, 120, 0.28) 100%);
      border: 1px solid rgba(255, 255, 255, 0.55);
      backdrop-filter: blur(10px);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      box-shadow: 0 4px 14px rgba(2, 44, 120, 0.32), inset 0 1px 2px rgba(255, 255, 255, 0.7);
    }
    /* 舱外高精旋转刻度环 */
    .tg-avatar-pod::before {
      content: '';
      position: absolute;
      inset: -3.5px;
      border-radius: 50%;
      border: 1px dashed rgba(255, 255, 255, 0.4);
      animation: podRadarRotate 18s linear infinite;
    }
    /* 舱外呼吸微光波纹 */
    .tg-avatar-pod::after {
      content: '';
      position: absolute;
      inset: -6px;
      border-radius: 50%;
      border: 1px solid rgba(255, 255, 255, 0.2);
      animation: podPulseWave 3s ease-out infinite;
    }

    @keyframes podRadarRotate {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
    @keyframes podPulseWave {
      0% { transform: scale(0.92); opacity: 0.8; }
      100% { transform: scale(1.18); opacity: 0; }
    }

    /* 内部官方 Telegram 纸飞机的立体拟物化呈现 */
    .tg-avatar-plane {
      width: 25px;
      height: 25px;
      filter: drop-shadow(0 2px 4px rgba(2, 44, 120, 0.4));
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
    /* 核心动态化动效体系 (Stellar Animations)                  */
    /* ======================================================== */

    /* 1. 星轨流光流动 (不同周期差，模拟天文延时视差) */
    .trail-flow-major {
      animation: trailStreamMajor 14s linear infinite;
    }
    .trail-flow-medium {
      animation: trailStreamMedium 20s linear infinite;
    }
    .trail-drift {
      animation: trailStreamDrift 28s linear infinite;
    }
    @keyframes trailStreamMajor {
      from { stroke-dashoffset: 0; }
      to { stroke-dashoffset: -345; }
    }
    @keyframes trailStreamMedium {
      from { stroke-dashoffset: 0; }
      to { stroke-dashoffset: -280; }
    }
    @keyframes trailStreamDrift {
      from { stroke-dashoffset: 0; }
      to { stroke-dashoffset: -200; }
    }

    /* 2. 真实长曝光彗星划过天际 */
    .promo-meteor {
      animation: meteorPass 7s cubic-bezier(0.2, 0.8, 0.4, 1) infinite;
    }
    @keyframes meteorPass {
      0% {
        opacity: 0;
        transform: translate(-30px, -15px) scale(0.6);
      }
      8% {
        opacity: 1;
        transform: translate(0, 0) scale(1);
      }
      22% {
        opacity: 0;
        transform: translate(65px, 32px) scale(1.15);
      }
      100% {
        opacity: 0;
        transform: translate(65px, 32px) scale(1.15);
      }
    }

    /* 3. 十字衍射星芒多相呼吸 */
    .twinkle-1 {
      animation: starTwinkle 3.2s ease-in-out infinite;
    }
    .twinkle-2 {
      animation: starTwinkle 4.2s ease-in-out 1.2s infinite;
    }
    .twinkle-3 {
      animation: starTwinkle 3.6s ease-in-out 0.6s infinite;
    }
    .twinkle-4 {
      animation: starTwinkle 5s ease-in-out 2s infinite;
    }
    @keyframes starTwinkle {
      0%, 100% {
        transform: scale(0.85);
        opacity: 0.55;
      }
      50% {
        transform: scale(1.22);
        opacity: 1;
      }
    }

    /* 4. 右侧形象化 3D 纸飞机气流轻盈悬浮动效 */
    .plane-flight-rig {
      animation: planeAeroHover 4s ease-in-out infinite;
    }
    @keyframes planeAeroHover {
      0%, 100% {
        transform: translate(226px, 12px) rotate(0deg);
      }
      50% {
        transform: translate(227px, 7px) rotate(2.5deg);
      }
    }

    /* 5. 机尾破空航迹流光 (动态推进气流) */
    .stream-jet {
      animation: jetStream 1.6s linear infinite;
    }
    @keyframes jetStream {
      from { stroke-dashoffset: 0; }
      to { stroke-dashoffset: -21; }
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <h2>形象化重塑：严谨 3D 拟物折纸飞机 + 动态天体星流 + 航海微光舱</h2>
    <div class="card-preview-box">
      <div class="promo-card">
        <svg class="promo-scene-art" viewBox="0 0 310 114">
          <defs>
            <radialGradient id="nebula-bg" cx="85%" cy="15%" r="75%">
              <stop offset="0%" stop-color="#38bdf8" stop-opacity="0.45"/>
              <stop offset="45%" stop-color="#0284c7" stop-opacity="0.22"/>
              <stop offset="100%" stop-color="#1d4ed8" stop-opacity="0"/>
            </radialGradient>
            <linearGradient id="meteor-trail-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#ffffff" stop-opacity="0"/>
              <stop offset="70%" stop-color="#bae6fd" stop-opacity="0.6"/>
              <stop offset="100%" stop-color="#ffffff" stop-opacity="1"/>
            </linearGradient>
          </defs>

          <!-- 柔和星云基底 -->
          <rect x="0" y="0" width="310" height="114" fill="url(#nebula-bg)" />

          <!-- 动态流动星轨群 (天极出框 340, -40) -->
          <g>
            ${generateStellarFlowTrails(340, -40)}
          </g>

          <!-- 4 处闪烁脉动的四角十字衍射星芒 -->
          <g class="twinkle-1" transform-origin="188 76">
            <g transform="translate(188, 76)">
              <path d="M 0 -7 Q 0 0 7 0 Q 0 0 0 7 Q 0 0 -7 0 Q 0 0 0 -7 Z" fill="#ffffff" />
              <circle cx="0" cy="0" r="1.8" fill="#ffffff" />
              <circle cx="0" cy="0" r="11" fill="#ffffff" opacity="0.4" filter="blur(1px)" />
            </g>
          </g>
          <g class="twinkle-2" transform-origin="136 24">
            <g transform="translate(136, 24)">
              <path d="M 0 -4.6 Q 0 0 4.6 0 Q 0 0 0 4.6 Q 0 0 -4.6 0 Q 0 0 0 -4.6 Z" fill="#bae6fd" />
              <circle cx="0" cy="0" r="1.3" fill="#ffffff" />
              <circle cx="0" cy="0" r="7.5" fill="#bae6fd" opacity="0.35" filter="blur(1px)" />
            </g>
          </g>
          <g class="twinkle-3" transform-origin="272 86">
            <g transform="translate(272, 86)">
              <path d="M 0 -4 Q 0 0 4 0 Q 0 0 0 4 Q 0 0 -4 0 Q 0 0 0 -4 Z" fill="#e0f2fe" />
              <circle cx="0" cy="0" r="1.1" fill="#ffffff" />
              <circle cx="0" cy="0" r="6.5" fill="#e0f2fe" opacity="0.35" filter="blur(1px)" />
            </g>
          </g>
          <g class="twinkle-4" transform-origin="218 98">
            <g transform="translate(218, 98)">
              <path d="M 0 -3.2 Q 0 0 3.2 0 Q 0 0 0 3.2 Q 0 0 -3.2 0 Q 0 0 0 -3.2 Z" fill="#7dd3fc" />
              <circle cx="0" cy="0" r="0.9" fill="#ffffff" />
              <circle cx="0" cy="0" r="5" fill="#7dd3fc" opacity="0.35" filter="blur(1px)" />
            </g>
          </g>

          <!-- 周期划破天际的真实流星 -->
          <g class="promo-meteor">
            <path d="M 125 14 L 182 50" stroke="url(#meteor-trail-grad)" stroke-width="1.8" stroke-linecap="round" />
            <circle cx="182" cy="50" r="1.8" fill="#ffffff" />
            <circle cx="182" cy="50" r="4.5" fill="#38bdf8" opacity="0.75" filter="blur(1.2px)" />
          </g>

          <!-- 机尾切线破空喷气航迹 (带动态 jetStream 流光) -->
          <path class="stream-jet" d="M 172 65 C 200 48, 222 34, 238 25" fill="none" stroke="rgba(255, 255, 255, 0.7)" stroke-width="1.4" stroke-dasharray="4 3" stroke-linecap="round" />
          <path d="M 166 69 C 196 52, 220 38, 235 27" fill="none" stroke="rgba(56, 189, 248, 0.4)" stroke-width="3" filter="blur(1.5px)" />

          <!-- 右侧极度逼真形象的 3D 折纸飞机群组件 (带轻盈悬浮) -->
          <g class="plane-flight-rig">
            <!-- 能量罗盘微光舱 -->
            <circle cx="28" cy="28" r="23" fill="none" stroke="rgba(255,255,255,0.25)" stroke-width="1" stroke-dasharray="3 3"/>
            <circle cx="28" cy="28" r="18" fill="rgba(255, 255, 255, 0.15)" />
            <g transform="translate(6, 6)">
              ${createRealistic3DPaperPlane(44)}
            </g>
          </g>
        </svg>

        <div class="promo-content">
          <!-- 左侧形象化 3D 探测舱 -->
          <div class="tg-avatar-pod">
            <svg class="tg-avatar-plane" viewBox="14 68 168 118" fill="none">
              <!-- 立体折纸光影层次 -->
              <path d="M98 175c-3.8 0-3.2-1.5-4.5-5.2L82 132.2 152.8 88" fill="rgba(255,255,255,0.75)" />
              <path d="M98 175c3 0 4.3-1.4 6-3l16-15.5-20-12" fill="rgba(255,255,255,0.48)" />
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

fs.writeFileSync('scratch/test_realistic_dynamic.html', html);

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 900, height: 420 } });
  await page.setContent(html);
  await page.waitForTimeout(600);
  await page.screenshot({ path: 'scratch/realistic_dynamic_frame1.png' });
  await page.waitForTimeout(1600);
  await page.screenshot({ path: 'scratch/realistic_dynamic_frame2.png' });
  await browser.close();
  console.log('Saved realistic dynamic frames');
})();
