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

// 恒星十字星芒
function diffractionStar(cx, cy, size, opacity = 1, color = '#ffffff') {
  const arm = size;
  const sub = size * 0.28;
  return `
    <g transform="translate(${cx}, ${cy})" opacity="${opacity}">
      <path d="M 0 ${-arm} Q 0 0 ${arm} 0 Q 0 0 0 ${arm} Q 0 0 ${-arm} 0 Q 0 0 0 ${-arm} Z" fill="${color}" />
      <circle cx="0" cy="0" r="${sub}" fill="#ffffff" />
      <circle cx="0" cy="0" r="${arm * 1.5}" fill="${color}" opacity="0.3" filter="blur(1px)" />
    </g>
  `;
}

// 纸飞机组件
const paperPlaneSvg = `
  <g transform="translate(232, 14) rotate(16)">
    <circle cx="20" cy="20" r="22" fill="none" stroke="rgba(255,255,255,0.22)" stroke-width="1" stroke-dasharray="3 3"/>
    <circle cx="20" cy="20" r="17" fill="rgba(255, 255, 255, 0.14)" />
    <svg x="5" y="5" width="30" height="30" viewBox="14 68 168 118" fill="none" style="overflow: visible;">
      <defs>
        <filter id="plane-glow-sub" x="-40%" y="-40%" width="180%" height="180%">
          <feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="rgba(2, 44, 120, 0.45)" />
        </filter>
        <linearGradient id="body-grad" x1="20" y1="70" x2="180" y2="180" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stop-color="#ffffff" />
          <stop offset="100%" stop-color="#e0edff" />
        </linearGradient>
        <linearGradient id="fold-grad" x1="40" y1="110" x2="150" y2="180" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stop-color="#93c5fd" />
          <stop offset="100%" stop-color="#60a5fa" />
        </linearGradient>
        <linearGradient id="under-grad" x1="70" y1="130" x2="120" y2="190" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stop-color="#3b82f6" />
          <stop offset="100%" stop-color="#1d4ed8" />
        </linearGradient>
      </defs>
      <g filter="url(#plane-glow-sub)">
        <polygon points="175,76 22,126 84,148" fill="url(#body-grad)" />
        <polygon points="175,76 84,148 108,184" fill="url(#fold-grad)" />
        <polygon points="84,148 108,184 100,154" fill="url(#under-grad)" opacity="0.9" />
      </g>
    </svg>
  </g>
`;

// 生成高密度、天文学长曝光圆弧轨迹序列
function generateLongExposureStarTrails(cx, cy) {
  // 定义一簇从天极同心扩散的弧线，模拟真实的 45 分钟长曝光
  // 半径由近及远，且每条弧线根据恒星光度具有不同粗细、透明度与虚实
  const trails = [
    // 近极区弧（天极附近旋转半径小）
    { r: 32, s: 95, e: 195, w: 0.7, op: 0.35, color: '#bae6fd' },
    { r: 48, s: 80, e: 215, w: 1.1, op: 0.55, color: '#ffffff', star: true },
    { r: 62, s: 105, e: 190, w: 0.6, op: 0.25, color: '#7dd3fc' },
    { r: 76, s: 85, e: 220, w: 0.8, op: 0.4, dash: '35 8 15 6', color: '#e0f2fe' },
    { r: 92, s: 75, e: 230, w: 1.4, op: 0.65, color: '#ffffff', glow: true, star: true },
    
    // 中距极区弧（横贯卡片中右上到右下）
    { r: 108, s: 90, e: 210, w: 0.65, op: 0.3, color: '#93c5fd' },
    { r: 122, s: 100, e: 225, w: 0.9, op: 0.45, color: '#e0f2fe' },
    { r: 138, s: 82, e: 235, w: 1.6, op: 0.75, color: '#ffffff', glow: true, star: true }, // 织女星主轨
    { r: 154, s: 110, e: 215, w: 0.7, op: 0.28, dash: '42 12 20 8', color: '#7dd3fc' },
    { r: 170, s: 92, e: 230, w: 1.0, op: 0.5, color: '#dbeafe' },
    { r: 188, s: 105, e: 228, w: 0.8, op: 0.35, color: '#a5f3fc' },
    
    // 远极区弧（大曲率舒展横跨，延伸至底部和左下）
    { r: 208, s: 98, e: 225, w: 1.3, op: 0.6, color: '#ffffff', star: true },
    { r: 228, s: 112, e: 218, w: 0.6, op: 0.22, color: '#93c5fd' },
    { r: 248, s: 106, e: 224, w: 1.1, op: 0.45, color: '#e0f2fe' },
    { r: 270, s: 115, e: 216, w: 0.75, op: 0.3, dash: '50 15 25 10', color: '#7dd3fc' },
    { r: 295, s: 110, e: 218, w: 1.2, op: 0.4, color: '#bae6fd' },
    { r: 325, s: 118, e: 210, w: 0.8, op: 0.25, color: '#e0f2fe' },
  ];

  let svgElements = '';

  // 天极点 (North Celestial Pole)
  svgElements += `
    <!-- 天极极点光心 -->
    <circle cx="${cx}" cy="${cy}" r="3.5" fill="#ffffff" opacity="0.9" />
    <circle cx="${cx}" cy="${cy}" r="7" fill="none" stroke="#bae6fd" stroke-width="0.8" opacity="0.5" />
    <circle cx="${cx}" cy="${cy}" r="14" fill="none" stroke="#7dd3fc" stroke-width="0.5" stroke-dasharray="2 3" opacity="0.3" />
  `;

  // 渲染所有同心星轨圆弧
  trails.forEach((t) => {
    const d = arcPath(cx, cy, t.r, t.s, t.e);
    const dashAttr = t.dash ? `stroke-dasharray="${t.dash}"` : '';
    
    // 如果是亮星轨，增加外层柔光
    if (t.glow) {
      svgElements += `
        <path d="${d}" fill="none" stroke="${t.color}" stroke-width="${(t.w * 2.4).toFixed(1)}" opacity="${(t.op * 0.3).toFixed(2)}" stroke-linecap="round" filter="blur(1.5px)" ${dashAttr}/>
      `;
    }
    
    svgElements += `
      <path d="${d}" fill="none" stroke="${t.color}" stroke-width="${t.w}" opacity="${t.op}" stroke-linecap="round" ${dashAttr}/>
    `;

    // 在星轨两端或中段点缀星点/微光
    if (t.star) {
      const angle = (t.s + t.e) * 0.5;
      const rad = (angle * Math.PI) / 180;
      const sx = cx + t.r * Math.cos(rad);
      const sy = cy + t.r * Math.sin(rad);
      svgElements += `
        <circle cx="${sx.toFixed(1)}" cy="${sy.toFixed(1)}" r="${(t.w * 0.9).toFixed(1)}" fill="#ffffff" opacity="${Math.min(1, t.op + 0.3)}" />
      `;
    }
  });

  return svgElements;
}

// 方案 A: 极客深空·密集真实长曝光同心星轨（天极位于 (296, 6)）
const sceneA = `
  <defs>
    <radialGradient id="nebula-a" cx="80%" cy="15%" r="70%">
      <stop offset="0%" stop-color="#38bdf8" stop-opacity="0.38"/>
      <stop offset="50%" stop-color="#0284c7" stop-opacity="0.15"/>
      <stop offset="100%" stop-color="#1d4ed8" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <!-- 柔和星云基底 -->
  <rect x="0" y="0" width="310" height="114" fill="url(#nebula-a)" />
  
  <!-- 长曝光同心圆弧星轨群 -->
  <g>
    ${generateLongExposureStarTrails(292, 8)}
  </g>
  
  <!-- 天文四角衍射星芒亮星 -->
  ${diffractionStar(195, 78, 6.5, 0.85, '#ffffff')}
  ${diffractionStar(142, 28, 4.5, 0.75, '#bae6fd')}
  ${diffractionStar(265, 88, 3.8, 0.65, '#e0f2fe')}
  ${diffractionStar(220, 102, 3.2, 0.55, '#7dd3fc')}

  <!-- 微细星际星尘粒子 -->
  <circle cx="165" cy="48" r="0.9" fill="#ffffff" opacity="0.45" />
  <circle cx="180" cy="18" r="0.7" fill="#bae6fd" opacity="0.35" />
  <circle cx="215" cy="55" r="0.8" fill="#ffffff" opacity="0.4" />
  <circle cx="248" cy="42" r="0.6" fill="#e0f2fe" opacity="0.3" />
  <circle cx="282" cy="72" r="0.9" fill="#7dd3fc" opacity="0.5" />
  <circle cx="130" cy="92" r="0.6" fill="#bae6fd" opacity="0.25" />

  <!-- 飞机切线破空喷气微流光 -->
  <path d="M 175 62 C 205 45, 225 32, 238 24" fill="none" stroke="rgba(255, 255, 255, 0.45)" stroke-width="1.2" stroke-dasharray="4 3" stroke-linecap="round" />
  <path d="M 160 70 C 195 52, 220 38, 235 27" fill="none" stroke="rgba(56, 189, 248, 0.3)" stroke-width="2.5" filter="blur(1.5px)" />

  ${paperPlaneSvg}
`;

// 方案 B: 双色温长曝光星轨（暖金蓝交织星轨 + 彗星切线）
const sceneB = `
  <defs>
    <radialGradient id="nebula-b" cx="85%" cy="10%" r="75%">
      <stop offset="0%" stop-color="#38bdf8" stop-opacity="0.35"/>
      <stop offset="40%" stop-color="#0ea5e9" stop-opacity="0.18"/>
      <stop offset="100%" stop-color="#1e40af" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect x="0" y="0" width="310" height="114" fill="url(#nebula-b)" />
  
  <!-- 长曝光星轨：天极位于 (304, -4) -->
  <g>
    ${generateLongExposureStarTrails(304, -4)}
  </g>

  <!-- 渐隐流星划痕 (Shooting Star with Trail) -->
  <defs>
    <linearGradient id="meteor-grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0"/>
      <stop offset="60%" stop-color="#bae6fd" stop-opacity="0.4"/>
      <stop offset="100%" stop-color="#ffffff" stop-opacity="0.95"/>
    </linearGradient>
  </defs>
  <path d="M 140 12 L 205 52" stroke="url(#meteor-grad)" stroke-width="1.8" stroke-linecap="round" />
  <circle cx="205" cy="52" r="1.8" fill="#ffffff" />
  <circle cx="205" cy="52" r="4.5" fill="#38bdf8" opacity="0.6" filter="blur(1px)" />

  <!-- 衍射星芒 -->
  ${diffractionStar(185, 90, 7.0, 0.9, '#ffffff')}
  ${diffractionStar(135, 38, 4.5, 0.7, '#bae6fd')}
  ${diffractionStar(270, 75, 4.0, 0.6, '#e0f2fe')}

  ${paperPlaneSvg}
`;

// 方案 C: 天球赤道坐标系 + 极致细腻丝状星轨（Ultra-Fine Fiber Trails）
function generateUltraFineTrails(cx, cy) {
  let res = '';
  // 生成 24 条超细密高精长曝光弧线，间距仅 10-14px，营造丝绸般的流光质感
  const count = 22;
  for (let i = 0; i < count; i++) {
    const r = 36 + i * 13.5;
    const s = 82 + (i % 4) * 6;
    const e = 215 + (i % 3) * 8;
    const isMajor = i % 5 === 0;
    const isMedium = i % 3 === 0;
    const w = isMajor ? 1.4 : (isMedium ? 0.9 : 0.55);
    const op = isMajor ? 0.7 : (isMedium ? 0.42 : 0.22);
    const color = isMajor ? '#ffffff' : (isMedium ? '#e0f2fe' : (i % 2 === 0 ? '#7dd3fc' : '#38bdf8'));
    const d = arcPath(cx, cy, r, s, e);
    
    if (isMajor) {
      res += `<path d="${d}" fill="none" stroke="${color}" stroke-width="${w * 2}" opacity="${op * 0.25}" stroke-linecap="round" filter="blur(1px)"/>`;
    }
    res += `<path d="${d}" fill="none" stroke="${color}" stroke-width="${w}" opacity="${op}" stroke-linecap="round"/>`;
    
    if (isMajor || (i === 7) || (i === 17)) {
      const angle = (s + e) * 0.45;
      const rad = (angle * Math.PI) / 180;
      const sx = cx + r * Math.cos(rad);
      const sy = cy + r * Math.sin(rad);
      res += `<circle cx="${sx.toFixed(1)}" cy="${sy.toFixed(1)}" r="${(w * 0.95).toFixed(1)}" fill="#ffffff" opacity="${op + 0.2}" />`;
    }
  }
  return res;
}

const sceneC = `
  <defs>
    <radialGradient id="nebula-c" cx="80%" cy="15%" r="70%">
      <stop offset="0%" stop-color="#38bdf8" stop-opacity="0.4"/>
      <stop offset="50%" stop-color="#0284c7" stop-opacity="0.18"/>
      <stop offset="100%" stop-color="#1d4ed8" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect x="0" y="0" width="310" height="114" fill="url(#nebula-c)" />
  
  <!-- 22 轨超细密丝绸长曝光星轨 -->
  <g>
    <circle cx="288" cy="10" r="3.5" fill="#ffffff" opacity="0.95" />
    <circle cx="288" cy="10" r="8" fill="none" stroke="#bae6fd" stroke-width="0.8" opacity="0.6" />
    ${generateUltraFineTrails(288, 10)}
  </g>
  
  <!-- 核心亮星衍射十字星芒 -->
  ${diffractionStar(192, 75, 7.5, 0.95, '#ffffff')}
  ${diffractionStar(145, 26, 5.0, 0.8, '#bae6fd')}
  ${diffractionStar(260, 94, 4.0, 0.7, '#e0f2fe')}

  <!-- 航迹微流光 -->
  <path d="M 168 66 C 198 48, 222 34, 236 25" fill="none" stroke="rgba(255, 255, 255, 0.55)" stroke-width="1.2" stroke-dasharray="3 3" stroke-linecap="round" />

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
      background: #0f172a;
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
      <div class="title">方案 A: 极客深空·标准天文长曝光星轨 (17条圆弧+十字星芒)</div>
      <div class="promo-card">
        <svg class="promo-scene-art" viewBox="0 0 310 114">
          ${sceneA}
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
      <div class="title">方案 B: 双色温星轨 + 彗星流光划痕</div>
      <div class="promo-card">
        <svg class="promo-scene-art" viewBox="0 0 310 114">
          ${sceneB}
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
      <div class="title">方案 C: 丝绸级高精长曝光星轨 (22条密集同心圆弧)</div>
      <div class="promo-card">
        <svg class="promo-scene-art" viewBox="0 0 310 114">
          ${sceneC}
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

fs.writeFileSync('scratch/star_trails_compare_v2.html', html);

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1100, height: 400 } });
  await page.setContent(html);
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'scratch/star_trails_compare_v2.png' });
  await browser.close();
  console.log('Saved scratch/star_trails_compare_v2.png');
})();
