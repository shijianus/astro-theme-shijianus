import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

// Helper: Mulberry32 PRNG
function mulberry32(a) {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Generate an HTML page with cards of various dimensions and light/dark modes
const testHtml = `
<!DOCTYPE html>
<html lang="zh-CN" data-theme="light" data-background="snow">
<head>
  <meta charset="UTF-8">
  <title>Snow Mantle Procedural Accumulation Test</title>
  <style>
    :root {
      --bg-color: #f7f9fe;
      --card-bg: #ffffff;
      --card-border: rgba(227, 232, 247, 0.85);
      --card-shadow: 0 8px 16px -4px rgba(44, 45, 48, 0.047);
      --text-main: #363636;
      --text-sub: #666666;
    }
    :root[data-theme='dark'] {
      --bg-color: #18171d;
      --card-bg: #1e1e24;
      --card-border: rgba(255, 255, 255, 0.08);
      --card-shadow: 0 8px 16px -4px rgba(0, 0, 0, 0.3);
      --text-main: #f0f0f0;
      --text-sub: #a0a0a0;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: var(--bg-color);
      color: var(--text-main);
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      padding: 60px 40px;
      min-height: 2500px;
    }
    .container {
      max-width: 1200px;
      margin: 0 auto;
      display: flex;
      flex-direction: column;
      gap: 36px;
    }
    .row {
      display: flex;
      gap: 24px;
      flex-wrap: wrap;
    }
    /* Closed box cards mimicking blog cards */
    .test-card {
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: 8px;
      box-shadow: var(--card-shadow);
      padding: 24px;
      position: relative;
    }
    .banner {
      width: 100%;
      height: 140px;
      background: linear-gradient(135deg, #425aef 0%, #2b3fc2 100%);
      color: #fff;
    }
    .notice {
      width: 100%;
      height: 60px;
      display: flex;
      align-items: center;
      padding: 0 20px;
    }
    .post-item {
      flex: 1 1 350px;
      height: 220px;
    }
    .widget {
      flex: 1 1 260px;
      height: 280px;
    }
    .wide-post {
      width: 100%;
      height: 380px;
    }
    canvas#snow-mantle-canvas {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 20;
    }
  </style>
</head>
<body>
  <canvas id="snow-mantle-canvas"></canvas>

  <div class="container">
    <h1 style="margin-bottom: 20px;">❄️ Procedural Snow Accumulation (雪幔) Visual Verification</h1>
    
    <!-- 1. Home Top Notice -->
    <div class="test-card notice" id="notice-1">
      <strong>🔔 首页顶部通知栏</strong>: 最新系统更新已发布，支持全天候雪景与卡片积雪。
    </div>

    <!-- 2. Random Banner (Dark/Color) -->
    <div class="test-card banner" id="banner-1">
      <h2>EpoCanvas Cinematic Snowflake Showcase</h2>
      <p>彩色横幅背景上的积雪效果对照</p>
    </div>

    <!-- 3. Post Card Row (Daylight Pure White Cards) -->
    <div class="row">
      <div class="test-card post-item" id="post-1">
        <h3>📄 文章卡片 A (纯白卡片对比)</h3>
        <p style="margin-top: 10px; color: var(--text-sub);">
          测试雪幔下垂雪舌与纯白卡片背景的明暗反差与接触阴影。
        </p>
      </div>
      <div class="test-card post-item" id="post-2">
        <h3>📄 文章卡片 B</h3>
        <p style="margin-top: 10px; color: var(--text-sub);">
          测试不同种子生成的自然起伏波浪与不同雪舌数量。
        </p>
      </div>
      <div class="test-card post-item" id="post-3">
        <h3>📄 文章卡片 C</h3>
        <p style="margin-top: 10px; color: var(--text-sub);">
          三列卡片各自独立的雪堆几何形态。
        </p>
      </div>
    </div>

    <!-- 4. Sidebar Widgets -->
    <div class="row">
      <div class="test-card widget" id="widget-1">
        <h3>👤 博主个人信息</h3>
        <p style="margin-top: 12px; color: var(--text-sub);">侧边栏窄卡片积雪</p>
      </div>
      <div class="test-card widget" id="widget-2">
        <h3>📑 目录卡片 (TOC)</h3>
        <p style="margin-top: 12px; color: var(--text-sub);">侧边栏目录卡片积雪</p>
      </div>
      <div class="test-card widget" id="widget-3">
        <h3>🏷️ 标签与分类</h3>
        <p style="margin-top: 12px; color: var(--text-sub);">侧边栏组件卡片积雪</p>
      </div>
      <div class="test-card widget" id="widget-4">
        <h3>📢 推广翻转卡片</h3>
        <p style="margin-top: 12px; color: var(--text-sub);">侧边栏卡片积雪</p>
      </div>
    </div>

    <!-- 5. Big Post Shell -->
    <div class="test-card wide-post" id="post-shell">
      <h2>📖 文章详情页主框 (Big Shell)</h2>
      <p style="margin-top: 16px; color: var(--text-sub);">
        超宽容器 (1200px) 上的多波节自然雪幔与垂挂雪舌群。
      </p>
    </div>
  </div>

  <script>
    // Include SnowMantle Prototype implementation
    ${generateClientScript()}
  </script>
</body>
</html>
`;

function generateClientScript() {
  return `
  (function() {
    function hashString(str) {
      let hash = 0;
      for (let i = 0; i < str.length; i++) {
        hash = (hash << 5) - hash + str.charCodeAt(i);
        hash |= 0;
      }
      return Math.abs(hash);
    }

    function createPRNG(seed) {
      let a = seed;
      return function() {
        let t = (a += 0x6d2b79f5);
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
      };
    }

    class SnowMantleEngine {
      constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.cards = [];
        this.dpr = window.devicePixelRatio || 1;
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        this.time = 0;

        this.init();
      }

      init() {
        this.resize();
        window.addEventListener('resize', () => {
          this.resize();
          this.scanCards();
        });
        this.scanCards();
        this.loop = this.loop.bind(this);
        requestAnimationFrame(this.loop);
      }

      resize() {
        this.dpr = Math.min(window.devicePixelRatio || 1, 2);
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        this.canvas.width = Math.round(this.width * this.dpr);
        this.canvas.height = Math.round(this.height * this.dpr);
        this.canvas.style.width = this.width + 'px';
        this.canvas.style.height = this.height + 'px';
        this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
      }

      scanCards() {
        const elements = document.querySelectorAll('.test-card');
        const scrollY = window.scrollY;
        const scrollX = window.scrollX;
        this.cards = [];

        elements.forEach((el, index) => {
          const rect = el.getBoundingClientRect();
          const docTop = rect.top + scrollY;
          const docLeft = rect.left + scrollX;
          const w = rect.width;
          const h = rect.height;
          const id = el.id || ('card-' + index);
          const seed = hashString(id + index);

          const mantle = this.generateMantle(w, seed);
          this.cards.push({
            el,
            docTop,
            docLeft,
            width: w,
            height: h,
            mantle
          });
        });
      }

      generateMantle(W, seed) {
        const prng = createPRNG(seed);
        // Base snow depth: generous, pillowy volume
        const H = W < 260 ? 12 : (W < 700 ? 16 : 20);
        const radius = 8; // standard card radius

        // 1. Generate top crest points (undulating dunes)
        const numTopPoints = Math.max(16, Math.min(48, Math.round(W / 24)));
        const topPoints = [];
        const phi1 = prng() * Math.PI * 2;
        const phi2 = prng() * Math.PI * 2;
        const phi3 = prng() * Math.PI * 2;

        for (let i = 0; i < numTopPoints; i++) {
          const u = i / (numTopPoints - 1);
          const x = u * W;

          // Corner roll-off: snow curves over the rounded corners
          const dLeft = Math.min(1, x / (radius * 1.6));
          const dRight = Math.min(1, (W - x) / (radius * 1.6));
          const edgeFactor = Math.sin(dLeft * Math.PI * 0.5) * Math.sin(dRight * Math.PI * 0.5);

          // Harmonic waves for natural dune undulation
          const w1 = Math.sin(u * Math.PI) * 0.35;
          const w2 = Math.sin(u * Math.PI * 3 + phi1) * 0.25;
          const w3 = Math.cos(u * Math.PI * 5 + phi2) * 0.15;
          const micro = (prng() - 0.5) * 0.12;

          const thickness = H * (0.75 + w1 + w2 + w3 + micro) * (0.35 + 0.65 * edgeFactor);
          const y = -(thickness + 2.0);
          topPoints.push({ x, y });
        }

        // 2. Generate bottom drooping lobes (雪舌 / 垂挂雪檐)
        // Number of lobes scaled by width
        const numLobes = W < 220 ? 2 : (W < 450 ? 3 + Math.floor(prng() * 2) : 5 + Math.floor(prng() * 4));
        const lobes = [];
        for (let k = 0; k < numLobes; k++) {
          const targetU = (k + 0.5 + (prng() - 0.5) * 0.5) / numLobes;
          const cx = Math.max(radius + 15, Math.min(W - radius - 15, targetU * W));
          const lw = 32 + prng() * 45; // lobe width (wider, pillowy)
          const ld = 5.5 + prng() * 7.5; // droop depth (5.5px to 13px)
          lobes.push({ cx, lw, ld });
        }

        // Sample bottom contour from right to left
        const numBottomPoints = Math.max(20, Math.min(60, Math.round(W / 18)));
        const bottomPoints = [];
        const baseDrop = 2.8; // base coverage below card top edge (px)

        for (let i = numBottomPoints - 1; i >= 0; i--) {
          const u = i / (numBottomPoints - 1);
          const x = u * W;

          let droop = 0;
          for (let k = 0; k < lobes.length; k++) {
            const lb = lobes[k];
            const dist = Math.abs(x - lb.cx);
            if (dist < lb.lw * 0.5) {
              const norm = dist / (lb.lw * 0.5);
              droop += lb.ld * Math.pow(1 - norm * norm, 1.8);
            }
          }

          // Edge taper for corners
          const dLeft = Math.min(1, x / radius);
          const dRight = Math.min(1, (W - x) / radius);
          const cornerFactor = Math.sin(dLeft * Math.PI * 0.5) * Math.sin(dRight * Math.PI * 0.5);

          const y = (baseDrop + droop) * cornerFactor;
          bottomPoints.push({ x, y });
        }

        // 3. Assemble Paths
        // A. Main Snow Body Path
        const bodyPath = new Path2D();
        bodyPath.moveTo(-2, 2.5);
        bodyPath.quadraticCurveTo(-2.5, topPoints[0].y * 0.4, topPoints[0].x, topPoints[0].y);

        for (let i = 0; i < topPoints.length - 1; i++) {
          const curr = topPoints[i];
          const next = topPoints[i + 1];
          const mx = (curr.x + next.x) * 0.5;
          const my = (curr.y + next.y) * 0.5;
          bodyPath.quadraticCurveTo(curr.x, curr.y, mx, my);
        }
        const lastTop = topPoints[topPoints.length - 1];
        bodyPath.lineTo(lastTop.x, lastTop.y);

        bodyPath.quadraticCurveTo(W + 2.5, lastTop.y * 0.4, W + 2, 2.5);

        for (let i = 0; i < bottomPoints.length - 1; i++) {
          const curr = bottomPoints[i];
          const next = bottomPoints[i + 1];
          const mx = (curr.x + next.x) * 0.5;
          const my = (curr.y + next.y) * 0.5;
          bodyPath.quadraticCurveTo(curr.x, curr.y, mx, my);
        }
        bodyPath.closePath();

        // B. Inner Volumetric Crest Path (for 2.5D puffy highlight dome)
        const innerPath = new Path2D();
        innerPath.moveTo(topPoints[0].x, topPoints[0].y);
        for (let i = 0; i < topPoints.length - 1; i++) {
          const curr = topPoints[i];
          const next = topPoints[i + 1];
          const mx = (curr.x + next.x) * 0.5;
          const my = (curr.y + next.y) * 0.5;
          innerPath.quadraticCurveTo(curr.x, curr.y, mx, my);
        }
        innerPath.lineTo(lastTop.x, lastTop.y);
        // Swell inwards across the upper middle
        for (let i = topPoints.length - 1; i >= 0; i--) {
          const pt = topPoints[i];
          const inY = pt.y * 0.45;
          if (i === topPoints.length - 1) innerPath.lineTo(pt.x, inY);
          else {
            const prevPt = topPoints[i + 1];
            const mx = (pt.x + prevPt.x) * 0.5;
            const my = (inY + prevPt.y * 0.45) * 0.5;
            innerPath.quadraticCurveTo(pt.x, inY, mx, my);
          }
        }
        innerPath.closePath();

        // C. Rim Path (Top crest highlight stroke)
        const rimPath = new Path2D();
        rimPath.moveTo(topPoints[0].x, topPoints[0].y);
        for (let i = 0; i < topPoints.length - 1; i++) {
          const curr = topPoints[i];
          const next = topPoints[i + 1];
          const mx = (curr.x + next.x) * 0.5;
          const my = (curr.y + next.y) * 0.5;
          rimPath.quadraticCurveTo(curr.x, curr.y, mx, my);
        }
        rimPath.lineTo(lastTop.x, lastTop.y);

        // D. Contact Shadow Path (two soft layers underneath drooping lobes)
        const shadowPath = new Path2D();
        shadowPath.moveTo(bottomPoints[0].x, bottomPoints[0].y);
        for (let i = 0; i < bottomPoints.length - 1; i++) {
          const curr = bottomPoints[i];
          const next = bottomPoints[i + 1];
          const mx = (curr.x + next.x) * 0.5;
          const my = (curr.y + next.y) * 0.5;
          shadowPath.quadraticCurveTo(curr.x, curr.y, mx, my);
        }
        shadowPath.lineTo(bottomPoints[bottomPoints.length - 1].x, bottomPoints[bottomPoints.length - 1].y + 2.5);
        for (let i = bottomPoints.length - 1; i > 0; i--) {
          const curr = bottomPoints[i];
          const prev = bottomPoints[i - 1];
          const mx = (curr.x + prev.x) * 0.5;
          const my = (curr.y + prev.y) * 0.5 + 2.5;
          shadowPath.quadraticCurveTo(curr.x, curr.y + 2.5, mx, my);
        }
        shadowPath.closePath();

        // E. Micro sparkles near crest
        const numSparkles = Math.max(4, Math.min(12, Math.round(W / 75)));
        const sparkles = [];
        for (let s = 0; s < numSparkles; s++) {
          const ptIdx = Math.floor(prng() * (topPoints.length - 2)) + 1;
          const pt = topPoints[ptIdx];
          sparkles.push({
            x: pt.x + (prng() - 0.5) * 10,
            y: pt.y + 2.0 + prng() * 4,
            r: 0.8 + prng() * 0.6,
            phase: prng() * Math.PI * 2
          });
        }

        // Gradients
        const minY = -H * 1.45;
        const maxY = 15;

        // Daylight mode gradient:
        // Top: pure white -> mid: luminous crisp snow -> bottom: cold sky shadow blue
        const lightGrad = this.ctx.createLinearGradient(0, minY, 0, maxY);
        lightGrad.addColorStop(0.0, 'rgba(255, 255, 255, 0.99)');
        lightGrad.addColorStop(0.35, 'rgba(246, 250, 255, 0.98)');
        lightGrad.addColorStop(0.68, 'rgba(226, 238, 250, 0.96)');
        lightGrad.addColorStop(0.88, 'rgba(182, 208, 234, 0.94)');
        lightGrad.addColorStop(1.0, 'rgba(148, 178, 210, 0.94)');

        // Dark mode gradient:
        const darkGrad = this.ctx.createLinearGradient(0, minY, 0, maxY);
        darkGrad.addColorStop(0.0, 'rgba(255, 255, 255, 0.97)');
        darkGrad.addColorStop(0.40, 'rgba(235, 244, 255, 0.94)');
        darkGrad.addColorStop(0.75, 'rgba(185, 210, 240, 0.88)');
        darkGrad.addColorStop(1.0, 'rgba(135, 165, 205, 0.86)');

        return {
          bodyPath,
          innerPath,
          rimPath,
          shadowPath,
          sparkles,
          lightGrad,
          darkGrad
        };
      }

      loop() {
        this.time += 0.016;
        const ctx = this.ctx;
        ctx.clearRect(0, 0, this.width, this.height);

        const isDark = document.documentElement.dataset.theme === 'dark';
        const scrollY = window.scrollY;
        const scrollX = window.scrollX;

        for (let i = 0; i < this.cards.length; i++) {
          const card = this.cards[i];
          const screenY = card.docTop - scrollY;
          if (screenY + 40 < 0 || screenY - 20 > this.height) continue;
          const screenX = card.docLeft - scrollX;
          if (screenX + card.width < 0 || screenX > this.width) continue;

          ctx.save();
          ctx.translate(screenX, screenY);

          // 1. Contact AO shadow
          ctx.fillStyle = isDark ? 'rgba(0, 0, 0, 0.38)' : 'rgba(110, 140, 175, 0.28)';
          ctx.fill(card.mantle.shadowPath);

          // 2. Snow body
          ctx.fillStyle = isDark ? card.mantle.darkGrad : card.mantle.lightGrad;
          ctx.fill(card.mantle.bodyPath);

          // 2.5 Inner volumetric crest highlight (pillowy dome)
          ctx.fillStyle = isDark ? 'rgba(255, 255, 255, 0.18)' : 'rgba(255, 255, 255, 0.65)';
          ctx.fill(card.mantle.innerPath);

          // 3. Crest rim highlight
          ctx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.85)' : 'rgba(255, 255, 255, 0.95)';
          ctx.lineWidth = 1.2;
          ctx.stroke(card.mantle.rimPath);

          // 4. Micro specular sparkles
          for (let s = 0; s < card.mantle.sparkles.length; s++) {
            const sp = card.mantle.sparkles[s];
            const spAlpha = Math.max(0.2, Math.min(1.0, 0.5 + 0.45 * Math.sin(this.time * 2.5 + sp.phase)));
            ctx.fillStyle = 'rgba(255, 255, 255, ' + spAlpha + ')';
            ctx.beginPath();
            ctx.arc(sp.x, sp.y, sp.r, 0, Math.PI * 2);
            ctx.fill();
          }

          ctx.restore();
        }

        requestAnimationFrame(this.loop);
      }
    }

    window.snowMantle = new SnowMantleEngine('snow-mantle-canvas');
  })();
  `;
}

async function run() {
  const auditDir = path.resolve('scripts/audit_screenshots');
  if (!fs.existsSync(auditDir)) fs.mkdirSync(auditDir, { recursive: true });

  const tempHtmlPath = path.resolve('scripts/test_mantle.html');
  fs.writeFileSync(tempHtmlPath, testHtml, 'utf8');

  console.log('Launching browser to audit procedural snow mantle...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    deviceScaleFactor: 2,
  });
  const page = await context.newPage();

  // Audit 1: Daylight Mode
  await page.goto('file://' + tempHtmlPath);
  await page.waitForTimeout(600);

  const daylightShot = path.join(auditDir, 'mantle_proto_daylight.png');
  await page.screenshot({ path: daylightShot, fullPage: false });
  console.log('📸 Daylight screenshot saved to:', daylightShot);

  // Close-up on Post Card A (white on white)
  const cardElement = await page.$('#post-1');
  const cardShot = path.join(auditDir, 'mantle_proto_white_card_zoom.png');
  await cardElement.screenshot({ path: cardShot });
  console.log('📸 White card close-up screenshot saved to:', cardShot);

  // Close-up on Banner (color contrast)
  const bannerElement = await page.$('#banner-1');
  const bannerShot = path.join(auditDir, 'mantle_proto_banner_zoom.png');
  await bannerElement.screenshot({ path: bannerShot });
  console.log('📸 Banner card close-up screenshot saved to:', bannerShot);

  // Audit 2: Scrolling Down and Up
  console.log('Testing dynamic scroll sync...');
  await page.evaluate(() => window.scrollBy({ top: 300, behavior: 'instant' }));
  await page.waitForTimeout(300);
  const scrollShot = path.join(auditDir, 'mantle_proto_scrolled_300px.png');
  await page.screenshot({ path: scrollShot, fullPage: false });
  console.log('📸 Scrolled 300px screenshot saved to:', scrollShot);

  // Audit 3: Dark Mode
  await page.evaluate(() => {
    document.documentElement.dataset.theme = 'dark';
  });
  await page.waitForTimeout(400);
  const darkShot = path.join(auditDir, 'mantle_proto_dark.png');
  await page.screenshot({ path: darkShot, fullPage: false });
  console.log('📸 Dark mode screenshot saved to:', darkShot);

  await browser.close();
  // Clean up test file
  fs.unlinkSync(tempHtmlPath);
  console.log('🎉 Prototype verification complete!');
}

run().catch((err) => {
  console.error('Error during prototype verification:', err);
  process.exit(1);
});
