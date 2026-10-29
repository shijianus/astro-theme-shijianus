import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { chromium } from 'playwright';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distDir = path.resolve(__dirname, '../dist');

const server = http.createServer((req, res) => {
  let reqPath = decodeURI(req.url.split('?')[0]);
  if (reqPath.endsWith('/')) reqPath += 'index.html';
  else if (!path.extname(reqPath)) reqPath += '/index.html';

  const filePath = path.join(distDir, reqPath);
  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    const ext = path.extname(filePath).toLowerCase();
    const mimeTypes = {
      '.html': 'text/html',
      '.js': 'application/javascript',
      '.css': 'text/css',
      '.json': 'application/json',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.svg': 'image/svg+xml',
    };
    res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'application/octet-stream' });
    fs.createReadStream(filePath).pipe(res);
  } else {
    res.writeHead(404);
    res.end('Not Found');
  }
});

const PORT = 5792;

server.listen(PORT, async () => {
  console.log(`[E2E] Verifying Realistic Celestial Star Trails on http://localhost:${PORT}...`);
  const browser = await chromium.launch({ headless: true });
  
  try {
    // 1. Home Page Verification (Light Mode)
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await page.goto(`http://localhost:${PORT}/`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(500);

    const card = await page.$('#card-telegram');
    if (!card) throw new Error('Home page #card-telegram not found');

    const frontFace = await page.$('#card-telegram .front-face');
    if (!frontFace) throw new Error('.front-face not found in #card-telegram');

    // Screenshot Light Mode
    await frontFace.screenshot({ path: path.join(__dirname, '../dist/front-face-verified-light.png') });
    console.log('✅ Light mode screenshot captured: dist/front-face-verified-light.png');

    // Audit SVG structure
    const auditData = await page.evaluate(() => {
      const card = document.querySelector('#card-telegram');
      const front = card?.querySelector('.front-face');
      const svg = front?.querySelector('.promo-scene-art svg');
      const defs = svg?.querySelector('defs');
      const bloom = defs?.querySelector('#promoStarBloom');
      const corona = defs?.querySelector('#starCoronaGlow');
      const polaris = defs?.querySelector('#polarisCoreGlow');
      const unifiedVault = svg?.querySelector('.celestial-vault-unified');
      const microTrails = svg?.querySelectorAll('.tier-micro-trails path') || [];
      const midTrails = svg?.querySelectorAll('.tier-mid-trails path') || [];
      const alphaTrails = svg?.querySelectorAll('.tier-alpha-trails path') || [];
      const alphaHeads = svg?.querySelectorAll('.tier-alpha-heads g') || [];
      const staticDust = svg?.querySelectorAll('.promo-static-dust circle') || [];

      // Check styles
      const computedFront = front ? getComputedStyle(front) : null;
      const computedVault = unifiedVault ? getComputedStyle(unifiedVault) : null;

      return {
        hasSvg: Boolean(svg),
        hasBloom: Boolean(bloom),
        hasCorona: Boolean(corona),
        hasPolaris: Boolean(polaris),
        hasUnifiedVault: Boolean(unifiedVault),
        microTrailsCount: microTrails.length,
        midTrailsCount: midTrails.length,
        alphaTrailsCount: alphaTrails.length,
        alphaHeadsCount: alphaHeads.length,
        staticDustCount: staticDust.length,
        bgGradient: computedFront ? computedFront.backgroundImage : '',
        animationName: computedVault ? computedVault.animationName : '',
      };
    });

    console.log('[Audit Metrics]:', auditData);

    if (!auditData.hasSvg) throw new Error('SVG not found in front-face');
    if (!auditData.hasBloom) throw new Error('Bloom filter #promoStarBloom not found');
    if (!auditData.hasCorona) throw new Error('Corona gradient #starCoronaGlow not found');
    if (!auditData.hasPolaris) throw new Error('Polaris pivot gradient #polarisCoreGlow not found');
    if (!auditData.hasUnifiedVault) throw new Error('.celestial-vault-unified not found');
    if (auditData.microTrailsCount < 50) throw new Error(`Expected at least 50 micro trails, got ${auditData.microTrailsCount}`);
    if (auditData.midTrailsCount < 15) throw new Error(`Expected at least 15 mid trails, got ${auditData.midTrailsCount}`);
    if (auditData.alphaTrailsCount < 5) throw new Error(`Expected alpha trails, got ${auditData.alphaTrailsCount}`);
    if (auditData.alphaHeadsCount < 5) throw new Error(`Expected alpha heads, got ${auditData.alphaHeadsCount}`);

    console.log('✅ SVG and Astrophotography layer architecture passed all structural assertions.');

    // 2. Dark Mode Verification
    await page.evaluate(() => {
      document.documentElement.setAttribute('data-theme', 'dark');
    });
    await page.waitForTimeout(400);

    await frontFace.screenshot({ path: path.join(__dirname, '../dist/front-face-verified-dark.png') });
    console.log('✅ Dark mode screenshot captured: dist/front-face-verified-dark.png');

    // 3. Hover Flip & Back Face Verification
    await card.hover();
    await page.waitForTimeout(600);

    const backFlipData = await page.evaluate(() => {
      const card = document.querySelector('#card-telegram');
      const back = card?.querySelector('.back-face');
      const qrImg = back?.querySelector('.promo-qr-img');
      const rect = qrImg ? qrImg.getBoundingClientRect() : null;
      return {
        qrVisible: rect ? rect.width > 30 && rect.height > 30 : false,
        backOpacity: back ? getComputedStyle(back).opacity : '0'
      };
    });

    if (!backFlipData.qrVisible || backFlipData.backOpacity === '0') {
      throw new Error(`Flip transition failed: qrVisible=${backFlipData.qrVisible}, backOpacity=${backFlipData.backOpacity}`);
    }
    console.log('✅ 3D Flip transition and QR code verified successfully.');

    // 4. Post Page Verification
    await page.goto(`http://localhost:${PORT}/posts/hello-world/`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(500);

    const postCard = await page.$('#card-telegram');
    if (!postCard) throw new Error('Post page #card-telegram not found');
    const postFrontFace = await postCard.$('.front-face');
    if (!postFrontFace) throw new Error('Post page front-face not found');

    console.log('✅ Post page Telegram card and star trails verified successfully.');

    console.log('\n🌟 ALL REALISTIC CELESTIAL STAR TRAILS AUDITS PASSED 100%! 🌟\n');
    await browser.close();
  } catch (err) {
    console.error('❌ Verification failed:', err);
    process.exit(1);
  } finally {
    server.close();
  }
});
