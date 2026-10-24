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

function diffractionStar(cx, cy, size, opacity = 1, color = '#ffffff') {
  const arm = size;
  const sub = size * 0.28;
  return `
    <g transform="translate(${cx}, ${cy})" opacity="${opacity}">
      <path d="M 0 ${-arm} Q 0 0 ${arm} 0 Q 0 0 0 ${arm} Q 0 0 ${-arm} 0 Q 0 0 0 ${-arm} Z" fill="${color}" />
      <circle cx="0" cy="0" r="${sub}" fill="#ffffff" />
      <circle cx="0" cy="0" r="${arm * 1.6}" fill="${color}" opacity="0.35" filter="blur(1px)" />
    </g>
  `;
}

const paperPlaneSvg = `
  <g transform="translate(230, 16) rotate(15)">
    <circle cx="20" cy="20" r="22" fill="none" stroke="rgba(255,255,255,0.2)" stroke-width="1" stroke-dasharray="3 3"/>
    <circle cx="20" cy="20" r="17" fill="rgba(255, 255, 255, 0.12)" />
    <svg x="5" y="5" width="30" height="30" viewBox="14 68 168 118" fill="none" style="overflow: visible;">
      <defs>
        <filter id="plane-glow-sub2" x="-40%" y="-40%" width="180%" height="180%">
          <feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="rgba(2, 44, 120, 0.45)" />
        </filter>
        <linearGradient id="body-grad2" x1="20" y1="70" x2="180" y2="180" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stop-color="#ffffff" />
          <stop offset="100%" stop-color="#e0edff" />
        </linearGradient>
        <linearGradient id="fold-grad2" x1="40" y1="110" x2="150" y2="180" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stop-color="#93c5fd" />
          <stop offset="100%" stop-color="#60a5fa" />
        </linearGradient>
        <linearGradient id="under-grad2" x1="70" y1="130" x2="120" y2="190" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stop-color="#3b82f6" />
          <stop offset="100%" stop-color="#1d4ed8" />
        </linearGradient>
      </defs>
      <g filter="url(#plane-glow-sub2)">
        <polygon points="175,76 22,126 84,148" fill="url(#body-grad2)" />
        <polygon points="175,76 84,148 108,184" fill="url(#fold-grad2)" />
        <polygon points="84,148 108,184 100,154" fill="url(#under-grad2)" opacity="0.9" />
      </g>
    </svg>
  </g>
`;

// 生成长曝光同心星轨系统 (天极位于画框外，形成开阔的无闭合圆环的星轨丝线)
function buildStarTrailsSystem(cx = 330, cy = -30, density = 28) {
  let svg = '';
  // 模拟长曝光（曝光时间使得每颗星划过约 40° 到 75° 的弧长）
  // 基础半径从 60 到 440，覆盖整个卡片从右上至左下的对角线
  for (let i = 0; i < density; i++) {
    // 随机或参数化分布半径
    const r = 55 + i * (380 / density);
    
    // 起止角度：从右侧（95°~120°）到左下方（190°~225°）
    // 给每条星轨一些微小的起始相位差，模拟真实天空中不同经纬度的恒星长曝光
    const s = 100 + ((i * 17) % 25);
    const e = 185 + ((i * 23) % 40);
    
    // 模拟恒星等级（星等）：1等亮星、2等中星、多数为3-5等暗星
    const isFirstMag = (i % 7 === 0);
    const isSecondMag = (i % 3 === 0 && !isFirstMag);
    
    let strokeWidth = 0.5;
    let opacity = 0.2;
    let color = '#7dd3fc';
    
    if (isFirstMag) {
      strokeWidth = 1.35;
      opacity = 0.65;
      color = '#ffffff';
    } else if (isSecondMag) {
      strokeWidth = 0.85;
      opacity = 0.42;
      color = '#bae6fd';
    } else if (i % 2 === 0) {
      strokeWidth = 0.6;
      opacity = 0.28;
      color = '#38bdf8';
    }
    
    const d = arcPath(cx, cy, r, s, e);
    
    // 亮星轨带有长曝光光晕（Exposure Glow）
    if (isFirstMag) {
      svg += `<path d="${d}" fill="none" stroke="${color}" stroke-width="${strokeWidth * 2.2}" opacity="${opacity * 0.3}" stroke-linecap="round" filter="blur(1px)"/>`;
    }
    
    // 虚实交替的星轨（模拟断续长曝光或微弱星等）
    const isDashed = (i % 5 === 2);
    const dashAttr = isDashed ? `stroke-dasharray="35 8 18 6"` : '';
    
    svg += `<path d="${d}" fill="none" stroke="${color}" stroke-width="${strokeWidth}" opacity="${opacity}" stroke-linecap="round" ${dashAttr}/>`;
    
    // 在部分星轨头部或中段点缀长曝光星核（Star Nucleus）
    if (isFirstMag || (i === 11) || (i === 19)) {
      const angle = s + (e - s) * 0.65;
      const rad = (angle * Math.PI) / 180;
      const sx = cx + r * Math.cos(rad);
      const sy = cy + r * Math.sin(rad);
      if (sx >= 0 && sx <= 310 && sy >= 0 && sy <= 114) {
        svg += `<circle cx="${sx.toFixed(1)}" cy="${sy.toFixed(1)}" r="${(strokeWidth * 0.9).toFixed(1)}" fill="#ffffff" opacity="${Math.min(1, opacity + 0.3)}" />`;
      }
    }
  }
  return svg;
}

// 方案 1: 天极出框 (330, -30) + 26 轨纯粹长曝光星轨（真实天文摄影风格）
const scene1 = `
  <defs>
    <radialGradient id="nebula-1" cx="85%" cy="15%" r="70%">
      <stop offset="0%" stop-color="#38bdf8" stop-opacity="0.38"/>
      <stop offset="45%" stop-color="#0284c7" stop-opacity="0.16"/>
      <stop offset="100%" stop-color="#1d4ed8" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect x="0" y="0" width="310" height="114" fill="url(#nebula-1)" />
  
  <!-- 长曝光同心圆弧星轨 -->
  <g>
    ${buildStarTrailsSystem(330, -25, 26)}
  </g>
  
  <!-- 四角十字衍射星芒 -->
  ${diffractionStar(185, 76, 6.5, 0.9, '#ffffff')}
  ${diffractionStar(140, 26, 4.5, 0.75, '#bae6fd')}
  ${diffractionStar(265, 88, 3.8, 0.7, '#e0f2fe')}

  <!-- 微细星际星尘点 -->
  <circle cx="160" cy="46" r="0.8" fill="#ffffff" opacity="0.45" />
  <circle cx="210" cy="62" r="0.7" fill="#bae6fd" opacity="0.35" />
  <circle cx="250" cy="38" r="0.6" fill="#e0f2fe" opacity="0.3" />
  <circle cx="280" cy="72" r="0.8" fill="#7dd3fc" opacity="0.45" />

  <!-- 飞机切线破空喷气微流光 -->
  <path d="M 172 65 C 200 48, 222 34, 235 25" fill="none" stroke="rgba(255, 255, 255, 0.55)" stroke-width="1.2" stroke-dasharray="3 3" stroke-linecap="round" />

  ${paperPlaneSvg}
`;

// 方案 2: 天极出框 (345, -45) + 34 轨极致细腻密织星轨（高精丝绸流光）
const scene2 = `
  <defs>
    <radialGradient id="nebula-2" cx="85%" cy="15%" r="75%">
      <stop offset="0%" stop-color="#38bdf8" stop-opacity="0.42"/>
      <stop offset="50%" stop-color="#0284c7" stop-opacity="0.18"/>
      <stop offset="100%" stop-color="#1d4ed8" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect x="0" y="0" width="310" height="114" fill="url(#nebula-2)" />
  
  <g>
    ${buildStarTrailsSystem(345, -45, 34)}
  </g>
  
  <!-- 十字衍射星芒 -->
  ${diffractionStar(192, 74, 7.5, 0.95, '#ffffff')}
  ${diffractionStar(138, 22, 4.8, 0.8, '#bae6fd')}
  ${diffractionStar(270, 84, 4.2, 0.75, '#e0f2fe')}
  ${diffractionStar(215, 98, 3.2, 0.6, '#7dd3fc')}

  <!-- 彗星流光划痕 -->
  <defs>
    <linearGradient id="meteor-grad2" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0"/>
      <stop offset="70%" stop-color="#bae6fd" stop-opacity="0.5"/>
      <stop offset="100%" stop-color="#ffffff" stop-opacity="0.95"/>
    </linearGradient>
  </defs>
  <path d="M 125 15 L 180 50" stroke="url(#meteor-grad2)" stroke-width="1.5" stroke-linecap="round" />
  <circle cx="180" cy="50" r="1.5" fill="#ffffff" />
  <circle cx="180" cy="50" r="4" fill="#38bdf8" opacity="0.6" filter="blur(1px)" />

  <!-- 飞机航线 -->
  <path d="M 172 65 C 200 48, 222 34, 235 25" fill="none" stroke="rgba(255, 255, 255, 0.55)" stroke-width="1.2" stroke-dasharray="3 3" stroke-linecap="round" />

  ${paperPlaneSvg}
`;

// 方案 3: 真实天文星轨（带不同颜色星等光谱：纯白、冰蓝、淡金暖星）
function buildMultiColorStarTrails(cx = 335, cy = -35, count = 30) {
  let svg = '';
  const starColors = ['#ffffff', '#bae6fd', '#7dd3fc', '#fef08a', '#e0f2fe'];
  
  for (let i = 0; i < count; i++) {
    const r = 60 + i * (375 / count);
    const s = 102 + ((i * 13) % 20);
    const e = 188 + ((i * 19) % 36);
    
    const isBright = (i % 6 === 0);
    const color = isBright ? (i % 12 === 0 ? '#fef08a' : '#ffffff') : starColors[i % starColors.length];
    const w = isBright ? 1.4 : (i % 2 === 0 ? 0.8 : 0.55);
    const op = isBright ? 0.7 : (i % 2 === 0 ? 0.4 : 0.22);
    
    const d = arcPath(cx, cy, r, s, e);
    if (isBright) {
      svg += `<path d="${d}" fill="none" stroke="${color}" stroke-width="${w * 2.2}" opacity="${op * 0.3}" stroke-linecap="round" filter="blur(1px)"/>`;
    }
    svg += `<path d="${d}" fill="none" stroke="${color}" stroke-width="${w}" opacity="${op}" stroke-linecap="round"/>`;
    
    if (isBright || i === 8 || i === 22) {
      const angle = s + (e - s) * 0.6;
      const rad = (angle * Math.PI) / 180;
      const sx = cx + r * Math.cos(rad);
      const sy = cy + r * Math.sin(rad);
      if (sx >= 0 && sx <= 310 && sy >= 0 && sy <= 114) {
        svg += `<circle cx="${sx.toFixed(1)}" cy="${sy.toFixed(1)}" r="${(w * 0.9).toFixed(1)}" fill="${color}" opacity="${Math.min(1, op + 0.3)}" />`;
      }
    }
  }
  return svg;
}

const scene3 = `
  <defs>
    <radialGradient id="nebula-3" cx="85%" cy="15%" r="75%">
      <stop offset="0%" stop-color="#38bdf8" stop-opacity="0.4"/>
      <stop offset="50%" stop-color="#0284c7" stop-opacity="0.18"/>
      <stop offset="100%" stop-color="#1d4ed8" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect x="0" y="0" width="310" height="114" fill="url(#nebula-3)" />
  
  <g>
    ${buildMultiColorStarTrails(335, -35, 30)}
  </g>
  
  <!-- 十字衍射星芒 (带微暖金色织女星与白色北极星) -->
  ${diffractionStar(188, 75, 7.2, 0.95, '#ffffff')}
  ${diffractionStar(142, 24, 4.6, 0.85, '#fef08a')}
  ${diffractionStar(268, 86, 4.0, 0.7, '#bae6fd')}

  <path d="M 172 65 C 200 48, 222 34, 235 25" fill="none" stroke="rgba(255, 255, 255, 0.55)" stroke-width="1.2" stroke-dasharray="3 3" stroke-linecap="round" />

  ${paperPlaneSvg}
`;

const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body {
      margin: 0;
      padding: 40px;
      background: #0b1120;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      color: #f8fafc;
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(3, 310px);
      gap: 36px;
    }
    .card-wrap {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .title {
      font-size: 13px;
      font-weight: 600;
      color: #94a3b8;
    }
    .promo-card {
      position: relative;
      width: 310px;
      height: 114px;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 10px 25px -5px rgba(29, 78, 216, 0.35);
      background: linear-gradient(135deg, #1d4ed8 0%, #2563eb 25%, #0284c7 65%, #06b6d4 100%);
    }
    .promo-content {
      position: absolute;
      inset: 0;
      padding: 14px 16px;
      z-index: 10;
      display: flex;
      align-items: center;
      gap: 14px;
      pointer-events: none;
    }
    .tg-avatar {
      width: 44px;
      height: 44px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.22);
      border: 1px solid rgba(255, 255, 255, 0.35);
      backdrop-filter: blur(8px);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      box-shadow: 0 4px 12px rgba(2, 44, 120, 0.2);
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
      background: rgba(255, 255, 255, 0.22);
      border: 1px solid rgba(255, 255, 255, 0.35);
      color: #ffffff;
      font-weight: 600;
      letter-spacing: 0.2px;
    }
    .desc {
      font-size: 12px;
      color: rgba(255, 255, 255, 0.88);
      font-weight: 400;
    }
    .promo-scene-art {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
    }
  </style>
</head>
<body>
  <div class="grid">
    <div class="card-wrap">
      <div class="title">方案 1: 天极出框·天文长曝光同心星轨 (26轨丝滑弧线)</div>
      <div class="promo-card">
        <svg class="promo-scene-art" viewBox="0 0 310 114">
          ${scene1}
        </svg>
        <div class="promo-content">
          <div class="tg-avatar">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
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

    <div class="card-wrap">
      <div class="title">方案 2: 极致高密·天文摄影深空星轨 (34轨+彗星流痕)</div>
      <div class="promo-card">
        <svg class="promo-scene-art" viewBox="0 0 310 114">
          ${scene2}
        </svg>
        <div class="promo-content">
          <div class="tg-avatar">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
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

    <div class="card-wrap">
      <div class="title">方案 3: 光谱分级·真实星等星轨 (白/冰蓝/暖星交织)</div>
      <div class="promo-card">
        <svg class="promo-scene-art" viewBox="0 0 310 114">
          ${scene3}
        </svg>
        <div class="promo-content">
          <div class="tg-avatar">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
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
  </div>
</body>
</html>
`;

fs.writeFileSync('scratch/star_trails_v3.html', html);

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1100, height: 380 } });
  await page.setContent(html);
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'scratch/star_trails_v3.png' });
  await browser.close();
  console.log('Saved scratch/star_trails_v3.png');
})();
