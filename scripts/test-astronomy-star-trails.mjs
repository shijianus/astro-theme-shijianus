import { chromium } from 'playwright';

async function main() {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1400, height: 950 } });

  const emblemSvg = `
    <div class="emblem">
      <svg width="27" height="27" viewBox="14 68 168 118" fill="none">
        <path d="M98 175c-3.8 0-3.2-1.5-4.5-5.2L82 132.2 152.8 88" fill="rgba(255,255,255,0.72)"/>
        <path d="M98 175c3 0 4.3-1.4 6-3l16-15.5-20-12" fill="rgba(255,255,255,0.48)"/>
        <path d="M100 144.5l48.4 35.7c5.6 3.1 9.6 1.5 11-5.2l19.5-92c2-8.3-3.2-12-8.6-9.6L24.8 111c-8 3.2-8 7.7-1.4 9.7l37.4 11.7 86.8-54.8c4.1-2.5 7.8-1.2 4.7 1.6" fill="#ffffff"/>
      </svg>
    </div>
  `;

  // 4-point star formula helper:
  // cx, cy, radius, innerRadius
  const diamondStar = (cx, cy, r, opacity = 0.85) => `
    <g transform="translate(${cx}, ${cy})">
      <path d="M 0 -${r} Q 0 0 ${r} 0 Q 0 0 0 ${r} Q 0 0 -${r} 0 Q 0 0 0 -${r} Z" fill="#ffffff" opacity="${opacity}"/>
      <circle cx="0" cy="0" r="${r * 0.28}" fill="#ffffff"/>
      <circle cx="0" cy="0" r="${r * 1.5}" fill="#38bdf8" opacity="${opacity * 0.35}" filter="blur(1px)"/>
    </g>
  `;

  // Celestial Pole center: (300, 15)
  // Arc path generator: cx=300, cy=15, r, startAngle, endAngle
  const arcPath = (cx, cy, r, startDeg, endDeg) => {
    const toRad = deg => (deg * Math.PI) / 180;
    const x1 = cx + r * Math.cos(toRad(startDeg));
    const y1 = cy + r * Math.sin(toRad(startDeg));
    const x2 = cx + r * Math.cos(toRad(endDeg));
    const y2 = cy + r * Math.sin(toRad(endDeg));
    const largeArc = Math.abs(endDeg - startDeg) > 180 ? 1 : 0;
    return `M ${x1.toFixed(1)} ${y1.toFixed(1)} A ${r} ${r} 0 ${largeArc} 1 ${x2.toFixed(1)} ${y2.toFixed(1)}`;
  };

  const html = `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <style>
      body {
        background: #f1f5f9;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "PingFang SC", sans-serif;
        padding: 40px;
        display: grid;
        grid-template-columns: repeat(2, 340px);
        gap: 30px;
        justify-content: center;
      }
      .card-wrap {
        display: flex;
        flex-direction: column;
        gap: 10px;
      }
      h4 {
        margin: 0;
        font-size: 13px;
        font-weight: 700;
        color: #1e293b;
      }
      .promo-card {
        width: 320px;
        height: 114px;
        border-radius: 8px;
        position: relative;
        overflow: hidden;
        display: flex;
        align-items: center;
        padding: 0 16px;
        box-sizing: border-box;
        color: #fff;
        background: 
          radial-gradient(circle at 10% 12%, rgba(255, 255, 255, 0.35) 0%, transparent 40%),
          radial-gradient(circle at 92% 82%, rgba(6, 182, 212, 0.45) 0%, transparent 45%),
          linear-gradient(135deg, #1d4ed8 0%, #2563eb 38%, #0284c7 72%, #06b6d4 100%);
        border: 1px solid rgba(255, 255, 255, 0.48);
        box-shadow: 0 10px 25px -5px rgba(2, 132, 199, 0.38), 0 2px 6px rgba(0, 0, 0, 0.05);
      }
      .scene-art {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        z-index: 1;
      }
      .card-content {
        position: relative;
        z-index: 2;
        display: flex;
        align-items: center;
        gap: 13px;
        width: 100%;
      }
      .emblem {
        width: 46px;
        height: 46px;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.2);
        backdrop-filter: blur(8px);
        -webkit-backdrop-filter: blur(8px);
        border: 1px solid rgba(255, 255, 255, 0.45);
        box-shadow: inset 0 1px 1px rgba(255, 255, 255, 0.6), 0 4px 10px rgba(0, 0, 0, 0.12);
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
      }
      .emblem svg {
        filter: drop-shadow(0 2px 3px rgba(0, 0, 0, 0.15));
      }
      .info {
        display: flex;
        flex-direction: column;
        justify-content: center;
        min-width: 0;
        flex: 1;
      }
      .title-row {
        display: flex;
        align-items: center;
        gap: 7px;
        margin-bottom: 3px;
      }
      .title {
        font-size: 1.15rem;
        font-weight: 800;
        letter-spacing: 0.2px;
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
        white-space: nowrap;
      }
      .subtitle {
        font-size: 0.76rem;
        color: rgba(255, 255, 255, 0.95);
        line-height: 1.35;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
        text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
      }
    </style>
  </head>
  <body>

    <!-- 方案 1: 真实天文天极长曝光同心星轨 (Celestial Pole Star Trails) -->
    <div class="card-wrap">
      <h4>方案 1: 天文天极同心圆弧星轨 + 四角十字星芒 + 航天交汇</h4>
      <div class="promo-card">
        <svg class="scene-art" viewBox="0 0 320 114" fill="none" xmlns="http://www.w3.org/2000/svg">
          <!-- 天极中心定位在右上角 (295, 12) -->
          <!-- 层叠真实同心圆弧星轨 (弧长随距离变化，两端渐隐，粗细各异) -->
          <path d="${arcPath(295, 12, 38, 90, 210)}" stroke="rgba(255,255,255,0.32)" stroke-width="1.2" stroke-linecap="round"/>
          <path d="${arcPath(295, 12, 58, 100, 220)}" stroke="rgba(255,255,255,0.22)" stroke-width="0.9" stroke-dasharray="18 10 32 14" stroke-linecap="round"/>
          <path d="${arcPath(295, 12, 78, 110, 215)}" stroke="rgba(255,255,255,0.28)" stroke-width="1.4" stroke-linecap="round"/>
          <path d="${arcPath(295, 12, 105, 115, 210)}" stroke="rgba(255,255,255,0.18)" stroke-width="0.8" stroke-dasharray="8 6 22 10" stroke-linecap="round"/>
          <path d="${arcPath(295, 12, 135, 125, 205)}" stroke="rgba(255,255,255,0.24)" stroke-width="1.1" stroke-linecap="round"/>
          <path d="${arcPath(295, 12, 170, 130, 200)}" stroke="rgba(255,255,255,0.15)" stroke-width="0.8" stroke-dasharray="30 16" stroke-linecap="round"/>
          <path d="${arcPath(295, 12, 210, 135, 195)}" stroke="rgba(255,255,255,0.2)" stroke-width="1.0" stroke-linecap="round"/>
          <path d="${arcPath(295, 12, 260, 140, 190)}" stroke="rgba(255,255,255,0.12)" stroke-width="0.7" stroke-dasharray="14 10" stroke-linecap="round"/>

          <!-- 穿透长空的极速航天切线破空轨道 (Tangent Flight Arc) -->
          <path d="M-15 118 C85 105, 180 70, 280 24" stroke="rgba(255,255,255,0.35)" stroke-width="1.5" stroke-dasharray="5 4" stroke-linecap="round"/>

          <!-- 真实恒星四角光芒 (4-Point Diffraction Spike Stars) -->
          ${diamondStar(280, 24, 5.5, 0.95)}
          ${diamondStar(220, 48, 4.2, 0.85)}
          ${diamondStar(168, 72, 3.2, 0.7)}
          ${diamondStar(248, 86, 3.8, 0.75)}
          ${diamondStar(298, 76, 2.8, 0.65)}

          <!-- 微细星尘散斑 (Star Dust Particles) -->
          <circle cx="205" cy="28" r="1.2" fill="#ffffff" opacity="0.6"/>
          <circle cx="238" cy="18" r="1.4" fill="#ffffff" opacity="0.7"/>
          <circle cx="188" cy="56" r="1.0" fill="#ffffff" opacity="0.5"/>
          <circle cx="270" cy="58" r="1.5" fill="#ffffff" opacity="0.65"/>
          <circle cx="145" cy="85" r="1.1" fill="#ffffff" opacity="0.45"/>
          <circle cx="288" cy="100" r="1.3" fill="#ffffff" opacity="0.55"/>

          <!-- 远空领航微型纸飞机 (沿切线飞掠星轨) -->
          <path d="M272 20 L292 10 L285 28 L281 23 Z" fill="#ffffff" opacity="0.6"/>
        </svg>
        <div class="card-content">
          ${emblemSvg}
          <div class="info">
            <div class="title-row">
              <span class="title">Telegram</span>
              <span class="badge">官方社群</span>
            </div>
            <div class="subtitle">加入 chronoral 社群</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 方案 2: 深空天文测绘星座天球星盘 (Celestial Astrolabe & Constellation) -->
    <div class="card-wrap">
      <h4>方案 2: 天球测绘星盘弧线 + 星座几何连线 + 脉冲星芒</h4>
      <div class="promo-card">
        <svg class="scene-art" viewBox="0 0 320 114" fill="none" xmlns="http://www.w3.org/2000/svg">
          <!-- 同心星轨极点 (305, 18) -->
          <circle cx="305" cy="18" r="32" stroke="rgba(255,255,255,0.25)" stroke-width="1" stroke-dasharray="3 3"/>
          <circle cx="305" cy="18" r="62" stroke="rgba(255,255,255,0.2)" stroke-width="1"/>
          <circle cx="305" cy="18" r="95" stroke="rgba(255,255,255,0.15)" stroke-width="0.8" stroke-dasharray="6 4 18 6"/>
          <circle cx="305" cy="18" r="135" stroke="rgba(255,255,255,0.12)" stroke-width="0.8"/>
          <circle cx="305" cy="18" r="185" stroke="rgba(255,255,255,0.08)" stroke-width="0.7"/>

          <!-- 星座几何连线 (Constellation Asterisms) -->
          <line x1="225" y1="42" x2="275" y2="28" stroke="rgba(255,255,255,0.3)" stroke-width="0.9" stroke-dasharray="2 2"/>
          <line x1="225" y1="42" x2="195" y2="78" stroke="rgba(255,255,255,0.22)" stroke-width="0.8" stroke-dasharray="2 2"/>
          <line x1="195" y1="78" x2="252" y2="82" stroke="rgba(255,255,255,0.25)" stroke-width="0.8" stroke-dasharray="2 2"/>
          <line x1="252" y1="82" x2="285" y2="60" stroke="rgba(255,255,255,0.28)" stroke-width="0.8" stroke-dasharray="2 2"/>
          <line x1="285" y1="60" x2="275" y2="28" stroke="rgba(255,255,255,0.3)" stroke-width="0.9" stroke-dasharray="2 2"/>

          <!-- 亮星十字星芒 -->
          ${diamondStar(275, 28, 5.0, 0.9)}
          ${diamondStar(225, 42, 4.5, 0.85)}
          ${diamondStar(195, 78, 3.5, 0.75)}
          ${diamondStar(252, 82, 4.0, 0.8)}
          ${diamondStar(285, 60, 3.8, 0.8)}
          ${diamondStar(305, 18, 6.0, 0.95)}

          <!-- 天球经纬刻度线 -->
          <line x1="240" y1="18" x2="305" y2="18" stroke="rgba(255,255,255,0.2)" stroke-width="0.8"/>
          <line x1="305" y1="18" x2="305" y2="80" stroke="rgba(255,255,255,0.2)" stroke-width="0.8"/>

          <!-- 远景微型领航翼 -->
          <path d="M268 24 L288 14 L282 32 L278 27 Z" fill="#ffffff" opacity="0.55"/>
        </svg>
        <div class="card-content">
          ${emblemSvg}
          <div class="info">
            <div class="title-row">
              <span class="title">Telegram</span>
              <span class="badge">官方社群</span>
            </div>
            <div class="subtitle">加入 chronoral 社群</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 方案 3: 密集彗尾流光星轨 (Tapered Meteor & Dense Star Streaks) -->
    <div class="card-wrap">
      <h4>方案 3: 密集天文流光弧线 + 双天极同心圆弧 + 渐隐流星</h4>
      <div class="promo-card">
        <svg class="scene-art" viewBox="0 0 320 114" fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="meteor-grad" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stop-color="#ffffff" stop-opacity="0"/>
              <stop offset="60%" stop-color="#ffffff" stop-opacity="0.3"/>
              <stop offset="100%" stop-color="#ffffff" stop-opacity="0.95"/>
            </linearGradient>
            <linearGradient id="arc-grad-1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#ffffff" stop-opacity="0.4"/>
              <stop offset="100%" stop-color="#ffffff" stop-opacity="0.05"/>
            </linearGradient>
          </defs>

          <!-- 密集天极星轨 (290, 10) -->
          <path d="${arcPath(290, 10, 45, 95, 205)}" stroke="url(#arc-grad-1)" stroke-width="1.4" stroke-linecap="round"/>
          <path d="${arcPath(290, 10, 68, 105, 215)}" stroke="rgba(255,255,255,0.22)" stroke-width="0.8" stroke-dasharray="14 8 26 12" stroke-linecap="round"/>
          <path d="${arcPath(290, 10, 92, 115, 210)}" stroke="url(#arc-grad-1)" stroke-width="1.8" stroke-linecap="round"/>
          <path d="${arcPath(290, 10, 118, 120, 200)}" stroke="rgba(255,255,255,0.18)" stroke-width="0.9" stroke-dasharray="20 12" stroke-linecap="round"/>
          <path d="${arcPath(290, 10, 148, 125, 195)}" stroke="rgba(255,255,255,0.25)" stroke-width="1.3" stroke-linecap="round"/>
          <path d="${arcPath(290, 10, 182, 130, 190)}" stroke="rgba(255,255,255,0.15)" stroke-width="0.8" stroke-dasharray="8 6 36 14" stroke-linecap="round"/>
          <path d="${arcPath(290, 10, 225, 135, 185)}" stroke="rgba(255,255,255,0.2)" stroke-width="1.0" stroke-linecap="round"/>

          <!-- 渐隐流星弧线 (Meteor Trail with Gradient) -->
          <path d="M 60 114 C 130 95, 210 60, 282 20" stroke="url(#meteor-grad)" stroke-width="2.2" stroke-linecap="round"/>

          <!-- 亮星与十字星芒 -->
          ${diamondStar(282, 20, 6.0, 1.0)}
          ${diamondStar(225, 45, 4.0, 0.8)}
          ${diamondStar(170, 75, 3.2, 0.7)}
          ${diamondStar(260, 70, 3.6, 0.75)}

          <!-- 星尘微粒 -->
          <circle cx="210" cy="22" r="1.3" fill="#ffffff" opacity="0.65"/>
          <circle cx="245" cy="14" r="1.1" fill="#ffffff" opacity="0.5"/>
          <circle cx="195" cy="50" r="1.4" fill="#ffffff" opacity="0.6"/>
          <circle cx="140" cy="80" r="1.0" fill="#ffffff" opacity="0.4"/>
          <circle cx="275" cy="52" r="1.6" fill="#ffffff" opacity="0.7"/>

          <!-- 领航纸飞机 -->
          <path d="M276 16 L296 6 L289 24 L285 19 Z" fill="#ffffff" opacity="0.65"/>
        </svg>
        <div class="card-content">
          ${emblemSvg}
          <div class="info">
            <div class="title-row">
              <span class="title">Telegram</span>
              <span class="badge">官方社群</span>
            </div>
            <div class="subtitle">加入 chronoral 社群</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 方案 4: 细密深空长曝光轨道 (Dense Long-Exposure Astrophotography) -->
    <div class="card-wrap">
      <h4>方案 4: 细密天文长曝光旋转星轨 (双向弧线 + 丰富星等层级)</h4>
      <div class="promo-card">
        <svg class="scene-art" viewBox="0 0 320 114" fill="none" xmlns="http://www.w3.org/2000/svg">
          <!-- 极点在视口右上微上方 (310, 5) -->
          <!-- 12 条不同星等的真实旋转星轨圆弧，呈现相机长曝光 30 分钟真实效果 -->
          <path d="${arcPath(310, 5, 28, 90, 220)}" stroke="rgba(255,255,255,0.3)" stroke-width="1.0" stroke-linecap="round"/>
          <path d="${arcPath(310, 5, 42, 95, 215)}" stroke="rgba(255,255,255,0.18)" stroke-width="0.7" stroke-dasharray="16 8" stroke-linecap="round"/>
          <path d="${arcPath(310, 5, 58, 100, 218)}" stroke="rgba(255,255,255,0.35)" stroke-width="1.5" stroke-linecap="round"/>
          <path d="${arcPath(310, 5, 74, 105, 210)}" stroke="rgba(255,255,255,0.15)" stroke-width="0.6" stroke-linecap="round"/>
          <path d="${arcPath(310, 5, 92, 110, 212)}" stroke="rgba(255,255,255,0.28)" stroke-width="1.2" stroke-dasharray="28 14 10 8" stroke-linecap="round"/>
          <path d="${arcPath(310, 5, 112, 115, 205)}" stroke="rgba(255,255,255,0.14)" stroke-width="0.6" stroke-linecap="round"/>
          <path d="${arcPath(310, 5, 134, 120, 202)}" stroke="rgba(255,255,255,0.32)" stroke-width="1.6" stroke-linecap="round"/>
          <path d="${arcPath(310, 5, 158, 125, 198)}" stroke="rgba(255,255,255,0.16)" stroke-width="0.7" stroke-dasharray="20 12" stroke-linecap="round"/>
          <path d="${arcPath(310, 5, 185, 130, 195)}" stroke="rgba(255,255,255,0.22)" stroke-width="1.1" stroke-linecap="round"/>
          <path d="${arcPath(310, 5, 216, 135, 192)}" stroke="rgba(255,255,255,0.12)" stroke-width="0.6" stroke-linecap="round"/>
          <path d="${arcPath(310, 5, 252, 140, 188)}" stroke="rgba(255,255,255,0.18)" stroke-width="0.9" stroke-dasharray="32 16" stroke-linecap="round"/>
          <path d="${arcPath(310, 5, 295, 145, 185)}" stroke="rgba(255,255,255,0.1)" stroke-width="0.6" stroke-linecap="round"/>

          <!-- 航线穿行虚线 -->
          <path d="M-10 115 C75 102, 165 72, 276 26" stroke="rgba(255,255,255,0.32)" stroke-width="1.4" stroke-dasharray="4 4" stroke-linecap="round"/>

          <!-- 真实星等十字星芒 (亮星) -->
          ${diamondStar(276, 26, 5.2, 0.95)}
          ${diamondStar(236, 52, 4.0, 0.8)}
          ${diamondStar(185, 78, 3.2, 0.7)}
          ${diamondStar(262, 88, 3.6, 0.75)}
          ${diamondStar(300, 68, 3.0, 0.7)}

          <!-- 丰富微尘星点 (10+ 散点，真实星野) -->
          <circle cx="218" cy="18" r="1.3" fill="#ffffff" opacity="0.7"/>
          <circle cx="255" cy="12" r="1.1" fill="#ffffff" opacity="0.6"/>
          <circle cx="282" cy="6" r="1.4" fill="#ffffff" opacity="0.75"/>
          <circle cx="160" cy="54" r="1.0" fill="#ffffff" opacity="0.45"/>
          <circle cx="198" cy="40" r="1.2" fill="#ffffff" opacity="0.55"/>
          <circle cx="145" cy="80" r="0.9" fill="#ffffff" opacity="0.4"/>
          <circle cx="212" cy="72" r="1.2" fill="#ffffff" opacity="0.5"/>
          <circle cx="278" cy="48" r="1.5" fill="#ffffff" opacity="0.65"/>
          <circle cx="242" cy="75" r="1.1" fill="#ffffff" opacity="0.5"/>
          <circle cx="312" cy="85" r="1.2" fill="#ffffff" opacity="0.6"/>

          <!-- 远空领航微型纸飞机 -->
          <path d="M268 22 L288 12 L281 30 L277 25 Z" fill="#ffffff" opacity="0.6"/>
        </svg>
        <div class="card-content">
          ${emblemSvg}
          <div class="info">
            <div class="title-row">
              <span class="title">Telegram</span>
              <span class="badge">官方社群</span>
            </div>
            <div class="subtitle">加入 chronoral 社群</div>
          </div>
        </div>
      </div>
    </div>

  </body>
  </html>
  `;

  await page.setContent(html);
  await page.screenshot({ path: 'scratch/star_trails_refined.png', fullPage: true });
  await browser.close();
  console.log('Saved scratch/star_trails_refined.png');
}

main().catch(console.error);
