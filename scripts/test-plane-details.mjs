import { chromium } from 'playwright';
import fs from 'fs';

// 让我们在黑底和流光蓝底上以 120px 大图测试四种极高精度 3D 折纸飞机模型
// 保证完全没有黑线，纸张折叠真实自然，具备光影厚度，一眼看出是完美的拟物 3D 折纸飞机！

const planes = {
  // 模型 1: 精准几何 3D 飞镖纸飞机 (Precision Origami Dart)
  // 比例黄金分割：迎光主翼纯白通透，背光下倾翼晴空淡蓝，龙骨暗面柔和群青，机脊刃线高光，纸边微弱高光
  p1: (size = 120) => `
    <svg width="${size}" height="${size}" viewBox="0 0 120 120" fill="none" style="overflow: visible;">
      <defs>
        <!-- 主迎光大翼面：纯白高光渐变 -->
        <linearGradient id="p1-main" x1="18" y1="92" x2="110" y2="18" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stop-color="#ffffff" />
          <stop offset="70%" stop-color="#ffffff" />
          <stop offset="100%" stop-color="#f0f7ff" />
        </linearGradient>
        <!-- 下倾副翼展面：柔美晴空天蓝 -->
        <linearGradient id="p1-side" x1="60" y1="72" x2="110" y2="18" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stop-color="#93c5fd" />
          <stop offset="50%" stop-color="#bfdbfe" />
          <stop offset="100%" stop-color="#e0f2fe" />
        </linearGradient>
        <!-- 龙骨折痕小腹面：纯净宝蓝，与背景浑然一体，绝无黑块 -->
        <linearGradient id="p1-keel" x1="56" y1="68" x2="84" y2="96" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stop-color="#3b82f6" />
          <stop offset="100%" stop-color="#1d4ed8" />
        </linearGradient>
        <!-- 折脊高光刃线 -->
        <linearGradient id="p1-crease" x1="18" y1="92" x2="110" y2="18" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stop-color="#ffffff" stop-opacity="0.95" />
          <stop offset="85%" stop-color="#ffffff" stop-opacity="1" />
          <stop offset="100%" stop-color="#ffffff" stop-opacity="0.6" />
        </linearGradient>
        <!-- 柔和大气漫射投影 (纯净软蓝，绝无黑斑) -->
        <filter id="p1-shadow" x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="-2" dy="4" stdDeviation="3" flood-color="rgba(2, 44, 120, 0.24)" />
        </filter>
      </defs>
      <g filter="url(#p1-shadow)">
        <!-- 1. 下沉龙骨腹鳍 (立体折角，纯净宝蓝) -->
        <polygon points="60,72 84,96 72,82" fill="url(#p1-keel)" />
        <!-- 2. 右侧下倾副翼 (柔和天蓝) -->
        <polygon points="110,18 60,72 88,96" fill="url(#p1-side)" />
        <!-- 3. 左侧迎光主翼 (挺拔纯白大翼面) -->
        <polygon points="110,18 18,92 60,72" fill="url(#p1-main)" />
        <!-- 4. 贯穿折脊高光折线 -->
        <line x1="18" y1="92" x2="110" y2="18" stroke="url(#p1-crease)" stroke-width="1.4" stroke-linecap="round" />
        <!-- 5. 机尖破空微星 -->
        <circle cx="110" cy="18" r="1.6" fill="#ffffff" />
      </g>
    </svg>
  `,

  // 模型 2: 真实双折立体折纸机 (Real Origami V-Wing)
  // 两个机翼向上形成自然 V 型上反角 (Dihedral Angle)，露出内侧机身折线
  p2: (size = 120) => `
    <svg width="${size}" height="${size}" viewBox="0 0 120 120" fill="none" style="overflow: visible;">
      <defs>
        <linearGradient id="p2-left" x1="16" y1="82" x2="108" y2="20" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stop-color="#ffffff" />
          <stop offset="100%" stop-color="#f0fdf4" />
        </linearGradient>
        <linearGradient id="p2-right" x1="64" y1="70" x2="108" y2="20" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stop-color="#bae6fd" />
          <stop offset="100%" stop-color="#e0f2fe" />
        </linearGradient>
        <linearGradient id="p2-belly" x1="48" y1="64" x2="76" y2="92" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stop-color="#38bdf8" />
          <stop offset="100%" stop-color="#0284c7" />
        </linearGradient>
        <filter id="p2-shadow" x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="-2" dy="4" stdDeviation="3" flood-color="rgba(2, 44, 120, 0.22)" />
        </filter>
      </defs>
      <g filter="url(#p2-shadow)">
        <!-- 腹部中缝龙骨 -->
        <polygon points="54,66 76,90 66,76" fill="url(#p2-belly)" />
        <!-- 右翼 -->
        <polygon points="108,20 54,66 86,88" fill="url(#p2-right)" />
        <!-- 左主翼 -->
        <polygon points="108,20 14,80 54,66" fill="url(#p2-left)" />
        <!-- 主脊折线 -->
        <line x1="14" y1="80" x2="108" y2="20" stroke="#ffffff" stroke-width="1.3" stroke-linecap="round" />
        <!-- 翼尖微芒 -->
        <circle cx="108" cy="20" r="1.5" fill="#ffffff" />
      </g>
    </svg>
  `,

  // 模型 3: Telegram 经典官方构型 3D 升华版 (Telegram Official 3D Pure)
  // 按照官方 Telegram 标志性线条重塑，但彻底移除任何内腹脏色，重排前后图层，杜绝黑线穿刺！
  p3: (size = 120) => `
    <svg width="${size}" height="${size}" viewBox="0 0 120 120" fill="none" style="overflow: visible;">
      <defs>
        <linearGradient id="p3-wing-top" x1="20" y1="84" x2="108" y2="22" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stop-color="#ffffff" />
          <stop offset="70%" stop-color="#ffffff" />
          <stop offset="100%" stop-color="#f0f7ff" />
        </linearGradient>
        <linearGradient id="p3-wing-bottom" x1="56" y1="70" x2="108" y2="22" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stop-color="#93c5fd" />
          <stop offset="50%" stop-color="#bfdbfe" />
          <stop offset="100%" stop-color="#e0f2fe" />
        </linearGradient>
        <linearGradient id="p3-keel-clean" x1="52" y1="68" x2="78" y2="94" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stop-color="#3b82f6" />
          <stop offset="100%" stop-color="#1d4ed8" />
        </linearGradient>
        <filter id="p3-shadow" x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="-1.5" dy="3.5" stdDeviation="3" flood-color="rgba(2, 44, 120, 0.22)" />
        </filter>
      </defs>
      <g filter="url(#p3-shadow)">
        <!-- 龙骨折痕 (紧贴机身，清澈宝蓝) -->
        <polygon points="56,70 78,92 68,78" fill="url(#p3-keel-clean)" />
        <!-- 下侧机翼 -->
        <polygon points="108,22 56,70 82,92" fill="url(#p3-wing-bottom)" />
        <!-- 上方主迎光机翼 -->
        <polygon points="108,22 18,84 56,70" fill="url(#p3-wing-top)" />
        <!-- 折脊高光刃线 -->
        <line x1="18" y1="84" x2="108" y2="22" stroke="#ffffff" stroke-width="1.3" stroke-linecap="round" />
        <circle cx="108" cy="22" r="1.5" fill="#ffffff" />
      </g>
    </svg>
  `
};

const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body {
      margin: 0;
      padding: 60px;
      background: #080d1a;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      color: #f8fafc;
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(3, 260px);
      gap: 30px;
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
      gap: 20px;
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
  <div class="grid">
    <div class="card">
      <div class="title">模型 1: 黄金分割飞镖 (Dart Aero)</div>
      ${planes.p1(110)}
      <div class="desc">机身修长凌厉，冲刺角 40°，挺拔纯白迎光翼 + 晴空淡蓝展翼 + 纯蓝龙骨</div>
    </div>
    <div class="card">
      <div class="title">模型 2: 双折立体折纸机 (V-Wing)</div>
      ${planes.p2(110)}
      <div class="desc">机翼上反角更明显，立体感强烈，折纸质感真实，绝无黑斑杂线</div>
    </div>
    <div class="card">
      <div class="title">模型 3: 官方 3D 升华 (Telegram 3D Pure)</div>
      ${planes.p3(110)}
      <div class="desc">原汁原味 Telegram 官方比例，纯白与天蓝纯净升华，无穿刺黑线</div>
    </div>
  </div>
</body>
</html>
`;

fs.writeFileSync('scratch/test_plane_details.html', html);

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 900, height: 400 } });
  await page.setContent(html);
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'scratch/plane_details.png' });
  await browser.close();
  console.log('Saved scratch/plane_details.png');
})();
