import { chromium } from 'playwright';
import fs from 'fs';

// 测试方案：
// 1. 三种绝对一眼可认出的 3D 纸飞机（放大到 58px~64px，比例鲜明，折痕真实，任何人一眼认出纸飞机）
// 2. 彻底终结怪异虚线滑动循环：改用真实的顺滑天体旋转与呼吸流光
// 3. 亮星绝不死板：亮星沿天极圆弧自然漫游/自转，并伴随真实星芒衍射绽放

// Telegram 官方原生矢量 3D 精雕版 (Official Telegram 3D Masterpiece)
// 使用全球 10 亿用户一眼即识的原生折角比例，但赋予顶奢 3D 拟物折纸质感：
// - 主迎光大翼面：纯白高光，折痕分明
// - 展向副翼面：通透天蓝
// - 纸张腹鳍折面：纯净宝蓝，0黑斑
function renderOfficialTg3D(size = 60) {
  return `
    <svg width="${size}" height="${size}" viewBox="0 0 170 170" fill="none" style="overflow: visible;">
      <defs>
        <!-- 主翼迎光大面：纯白高光微渐变 -->
        <linearGradient id="tg3d-wing-main" x1="24.8" y1="111" x2="166" y2="75" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stop-color="#ffffff" />
          <stop offset="75%" stop-color="#ffffff" />
          <stop offset="100%" stop-color="#f0f7ff" />
        </linearGradient>

        <!-- 侧翼下倾展面：通透晴空淡蓝 -->
        <linearGradient id="tg3d-wing-side" x1="60" y1="120" x2="166" y2="75" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stop-color="#93c5fd" />
          <stop offset="55%" stop-color="#bae6fd" />
          <stop offset="100%" stop-color="#e0f2fe" />
        </linearGradient>

        <!-- 龙骨折痕外翼角：纯净宝蓝 -->
        <linearGradient id="tg3d-fin-shade" x1="80" y1="130" x2="120" y2="175" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stop-color="#3b82f6" />
          <stop offset="100%" stop-color="#1d4ed8" />
        </linearGradient>

        <!-- 龙骨折痕内层角：高明度纯正群青（绝不用 #172554 或黑色！） -->
        <linearGradient id="tg3d-fin-inner" x1="82" y1="132" x2="105" y2="175" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stop-color="#2563eb" />
          <stop offset="100%" stop-color="#1e40af" />
        </linearGradient>

        <!-- 折痕主脊高光刃线 -->
        <linearGradient id="tg3d-spine-light" x1="24.8" y1="111" x2="166" y2="75" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stop-color="#ffffff" stop-opacity="0.9" />
          <stop offset="85%" stop-color="#ffffff" stop-opacity="1" />
          <stop offset="100%" stop-color="#ffffff" stop-opacity="0.6" />
        </linearGradient>

        <!-- 超轻盈纯净大气漫射投影 (软蓝，绝无黑斑) -->
        <filter id="tg3d-shadow" x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="-2" dy="5" stdDeviation="3.5" flood-color="rgba(2, 44, 120, 0.28)" />
        </filter>
      </defs>

      <g filter="url(#tg3d-shadow)">
        <!-- 1. 折叠机腹内层三角 (折纸深层，纯净群青蓝) -->
        <path d="M98 175c-3.8 0-3.2-1.5-4.5-5.2L82 132.2 152.8 88" fill="url(#tg3d-fin-inner)" />
        
        <!-- 2. 中腹折叠小角 (纯净宝蓝) -->
        <path d="M98 175c3 0 4.3-1.4 6-3l16-15.5-20-12" fill="url(#tg3d-fin-shade)" />
        
        <!-- 3. 右展翼面 (下翼面：机鼻 166,75 -> 腹折点 100,144.5 -> 右翼尾梢 148.4,180.2) -->
        <polygon points="166,75 100,144.5 148.4,180.2" fill="url(#tg3d-wing-side)" />
        
        <!-- 4. 左主翼面 (主受光翼面：机鼻 166,75 -> 左翼尾梢 24.8,111 -> 腹折点 100,144.5) -->
        <polygon points="166,75 24.8,111 100,144.5" fill="url(#tg3d-wing-main)" />
        
        <!-- 5. 机脊贯穿锋刃高光线 -->
        <line x1="24.8" y1="111" x2="166" y2="75" stroke="url(#tg3d-spine-light)" stroke-width="1.6" stroke-linecap="round" />
        
        <!-- 6. 机尖破空耀斑微光 -->
        <circle cx="166" cy="75" r="2.2" fill="#ffffff" />
      </g>
    </svg>
  `;
}

// 方案 2: 经典双折折纸飞机 (Classic Origami Airplane with distinct Wings & Keel)
// 俯仰视角 35°，双翼清晰展开，中间龙骨脊线分明，任何三岁小孩都能看出是纸飞机
function renderClassicOrigami(size = 60) {
  return `
    <svg width="${size}" height="${size}" viewBox="0 0 100 100" fill="none" style="overflow: visible;">
      <defs>
        <!-- 左机翼面 (迎光面)：高亮纯白 -->
        <linearGradient id="origami-left" x1="12" y1="58" x2="90" y2="22" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stop-color="#ffffff" />
          <stop offset="70%" stop-color="#ffffff" />
          <stop offset="100%" stop-color="#f0f7ff" />
        </linearGradient>

        <!-- 右机翼面 (背光展翼面)：浅天蓝 -->
        <linearGradient id="origami-right" x1="48" y1="68" x2="90" y2="22" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stop-color="#bae6fd" />
          <stop offset="60%" stop-color="#93c5fd" />
          <stop offset="100%" stop-color="#bfdbfe" />
        </linearGradient>

        <!-- 机身中缝底鳍 (下折龙骨)：纯净宝蓝 -->
        <linearGradient id="origami-keel" x1="42" y1="62" x2="68" y2="88" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stop-color="#3b82f6" />
          <stop offset="100%" stop-color="#1d4ed8" />
        </linearGradient>

        <filter id="origami-shadow" x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="-2" dy="4" stdDeviation="3" flood-color="rgba(2, 44, 120, 0.28)" />
        </filter>
      </defs>

      <g filter="url(#origami-shadow)">
        <!-- 1. 机腹龙骨 (下折小三角) -->
        <polygon points="46,56 68,80 58,66" fill="url(#origami-keel)" />
        <!-- 2. 右翼 (机头 90,22 -> 尾折 46,56 -> 右翼梢 76,82) -->
        <polygon points="90,22 46,56 76,82" fill="url(#origami-right)" />
        <!-- 3. 左翼 (机头 90,22 -> 左翼梢 12,58 -> 尾折 46,56) -->
        <polygon points="90,22 12,58 46,56" fill="url(#origami-left)" />
        <!-- 4. 机脊中央折线 -->
        <line x1="46" y1="56" x2="90" y2="22" stroke="#ffffff" stroke-width="1.5" stroke-linecap="round" />
        <!-- 5. 翼梢与机鼻微光 -->
        <circle cx="90" cy="22" r="1.8" fill="#ffffff" />
      </g>
    </svg>
  `;
}

// 方案 3: 充满朝气的破空飞镖折纸机 (Piercing Dart Paper Jet)
// 翼展大，流线型折痕清晰，双翼高光边缘，绝对不容认错
function renderDartAero(size = 60) {
  return `
    <svg width="${size}" height="${size}" viewBox="0 0 100 100" fill="none" style="overflow: visible;">
      <defs>
        <linearGradient id="dart-top" x1="16" y1="72" x2="92" y2="18" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stop-color="#ffffff" />
          <stop offset="80%" stop-color="#ffffff" />
          <stop offset="100%" stop-color="#e0f2fe" />
        </linearGradient>
        <linearGradient id="dart-bottom" x1="50" y1="62" x2="92" y2="18" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stop-color="#93c5fd" />
          <stop offset="60%" stop-color="#bfdbfe" />
          <stop offset="100%" stop-color="#e0f2fe" />
        </linearGradient>
        <linearGradient id="dart-keel" x1="46" y1="58" x2="70" y2="84" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stop-color="#3b82f6" />
          <stop offset="100%" stop-color="#2563eb" />
        </linearGradient>
        <filter id="dart-shadow" x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="-2" dy="4" stdDeviation="3" flood-color="rgba(2, 44, 120, 0.28)" />
        </filter>
      </defs>
      <g filter="url(#dart-shadow)">
        <!-- 龙骨 -->
        <polygon points="48,58 68,82 58,68" fill="url(#dart-keel)" />
        <!-- 右翼 -->
        <polygon points="92,18 48,58 74,84" fill="url(#dart-bottom)" />
        <!-- 左主翼 -->
        <polygon points="92,18 16,72 48,58" fill="url(#dart-top)" />
        <!-- 折脊高光线 -->
        <line x1="16" y1="72" x2="92" y2="18" stroke="#ffffff" stroke-width="1.5" stroke-linecap="round" />
        <!-- 机头光点 -->
        <circle cx="92" cy="18" r="1.8" fill="#ffffff" />
      </g>
    </svg>
  `;
}

// 模拟生成 HTML 测试用例
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
    .grid {
      display: grid;
      grid-template-columns: repeat(3, 260px);
      gap: 30px;
      margin-bottom: 50px;
    }
    .card {
      background: 
        radial-gradient(circle at 10% 12%, rgba(255, 255, 255, 0.35) 0%, transparent 40%),
        radial-gradient(circle at 92% 82%, rgba(6, 182, 212, 0.45) 0%, transparent 45%),
        linear-gradient(135deg, #1d4ed8 0%, #2563eb 38%, #0284c7 72%, #06b6d4 100%);
      border: 1px solid rgba(255, 255, 255, 0.48);
      border-radius: 12px;
      padding: 30px 20px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 16px;
      box-shadow: 0 10px 25px -5px rgba(2, 132, 199, 0.4);
    }
    .title {
      font-size: 15px;
      font-weight: 700;
      color: #ffffff;
      text-align: center;
    }
    .desc {
      font-size: 12px;
      color: rgba(255, 255, 255, 0.85);
      text-align: center;
      line-height: 1.4;
    }
  </style>
</head>
<body>
  <h2 style="text-align:center; margin-bottom: 30px;">三种一眼必能认出是“纸飞机”的 3D 拟物折纸模型</h2>
  <div class="grid">
    <div class="card">
      <div class="title">方案 A: 官方经典 Telegram 3D 灵魂重塑</div>
      ${renderOfficialTg3D(90)}
      <div class="desc">100% 官方经典 Telegram 折叠比例！一眼必识！纯白主翼 + 浅蓝下翼 + 纯蓝龙骨，绝无任何黑线或变形！</div>
    </div>
    <div class="card">
      <div class="title">方案 B: 真实折纸双翼展开 (Classic Origami)</div>
      ${renderClassicOrigami(90)}
      <div class="desc">清晰呈现左、右两只展开的机翼和中间折痕龙骨，最经典的纸飞机折纸外形，任何人绝不可能认错。</div>
    </div>
    <div class="card">
      <div class="title">方案 C: 凌厉冲刺飞镖纸飞机 (Dart Aero)</div>
      ${renderDartAero(90)}
      <div class="desc">修长锐利的折纸飞镖，大展角机翼与锋利折脊，充满飞翔速度感。</div>
    </div>
  </div>
</body>
</html>
`;

fs.writeFileSync('scratch/test_plane_clarity.html', html);

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 900, height: 420 } });
  await page.setContent(html);
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'scratch/plane_clarity.png' });
  await browser.close();
  console.log('Saved scratch/plane_clarity.png');
})();
