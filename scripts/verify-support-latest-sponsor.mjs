import { chromium } from 'playwright';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const PORT = 4398;
const DIST_DIR = path.resolve(process.cwd(), 'dist');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
};

function startServer() {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      try {
        let reqPath = decodeURIComponent(req.url.split('?')[0]);
        let filePath = path.join(DIST_DIR, reqPath);

        if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
          filePath = path.join(filePath, 'index.html');
        } else if (!fs.existsSync(filePath) && fs.existsSync(`${filePath}.html`)) {
          filePath = `${filePath}.html`;
        }

        if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
          const ext = path.extname(filePath).toLowerCase();
          const content = fs.readFileSync(filePath);
          res.writeHead(200, {
            'Content-Type': MIME_TYPES[ext] || 'application/octet-stream',
            'Content-Length': content.length,
            'Access-Control-Allow-Origin': '*',
          });
          res.end(content);
          return;
        }

        res.writeHead(404);
        res.end('404 Not Found');
      } catch (err) {
        res.writeHead(500);
        res.end(String(err));
      }
    });

    server.listen(PORT, '127.0.0.1', () => {
      console.log(`Test static server running at http://127.0.0.1:${PORT}`);
      resolve(server);
    });
  });
}

async function runTest() {
  const server = await startServer();
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    const page = await browser.newPage({
      viewport: { width: 1440, height: 900 },
    });

    let mockSponsors = [
      {
        id: 'cs_test_e2e_1789402319004',
        name: 'Stripe 链路自动化验收官',
        amount: 13,
        currency: 'MYR',
        message: 'Stripe 测试模式 Webhook 完整链路演练：咖啡档位与致谢名册实时联动验收 🚀',
        country: 'MY',
        channel: 'Stripe (国际收银台)',
        allocation: '-',
        status: 'completed',
        createdAt: '2026-09-14 16:12:04',
      },
      {
        id: 'cf_prod_ok_mtlsq1cl',
        name: 'Cloudflare Pages 最终验收',
        amount: 6.66,
        currency: 'USD',
        message: '生产端环境变量部署通过！',
        country: 'US',
        channel: '赞赏支持',
        allocation: '-',
        status: 'completed',
        createdAt: '2026-09-03 17:25:39',
      }
    ];

    // Route /api/sponsorships
    await page.route('**/api/sponsorships*', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          ok: true,
          list: mockSponsors,
          total: mockSponsors.length,
        }),
      });
    });

    await page.route('**/api/geo-profile*', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ country: 'MY' }),
      });
    });

    console.log('\n--- Scenario 1: Initial load with live sponsors ---');
    await page.goto(`http://127.0.0.1:${PORT}/support/`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);

    // Extract the 4 metrics cards
    const cards = await page.evaluate(() => {
      const parent = document.querySelector('.grid.grid-cols-2.sm\\:grid-cols-4');
      if (!parent) return [];
      return Array.from(parent.children).map((card) => {
        const title = card.querySelector('span')?.innerText?.trim() || '';
        const value = card.querySelector('.text-2xl, .text-xl, .text-sm')?.innerText?.trim() || '';
        const subtitle = card.querySelector('.text-\\[10px\\]')?.innerText?.trim() || '';
        const tooltip = card.querySelector('.text-\\[10px\\]')?.getAttribute('title') || '';
        return { title, value, subtitle, tooltip };
      });
    });

    console.log('Metrics Cards Rendered:', JSON.stringify(cards, null, 2));

    const latestCard = cards.find(c => c.title === '最新支持');
    if (!latestCard) throw new Error('Card "最新支持" not found!');

    console.log(`Latest Card Title: "${latestCard.title}"`);
    console.log(`Latest Card Value: "${latestCard.value}"`);
    console.log(`Latest Card Subtitle: "${latestCard.subtitle}"`);
    console.log(`Latest Card Tooltip: "${latestCard.tooltip}"`);

    if (!latestCard.value.includes('13') || !latestCard.value.includes('MYR')) {
      throw new Error(`Expected latest card value to include 13 and MYR, got: "${latestCard.value}"`);
    }
    if (!latestCard.subtitle.includes('Stripe 链路自动化验收官')) {
      throw new Error(`Expected subtitle to include supporter name, got: "${latestCard.subtitle}"`);
    }
    if (!latestCard.subtitle.includes('09月14日')) {
      throw new Error(`Expected subtitle to include formatted date '09月14日', got: "${latestCard.subtitle}"`);
    }
    if (latestCard.subtitle.includes('实时入库同步')) {
      throw new Error(`Forbidden placeholder "实时入库同步" still present!`);
    }
    console.log('✅ Scenario 1 Passed: Real supporter details cleanly rendered without placeholder!');

    console.log('\n--- Scenario 2: Real-time update via window event ---');
    // Update mock data with a brand-new supporter
    mockSponsors = [
      {
        id: 'cs_live_new_donor',
        name: '自由探索者',
        amount: 25,
        currency: 'USD',
        message: '感谢博主的开源技术分享！✨',
        country: 'US',
        channel: 'Stripe (国际收银台)',
        allocation: '-',
        status: 'completed',
        createdAt: '2026-09-19 08:30:00',
      },
      ...mockSponsors,
    ];

    // Trigger window event
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('shijianus:sponsorship-updated'));
    });
    await page.waitForTimeout(600);

    const updatedCard = await page.evaluate(() => {
      const parent = document.querySelector('.grid.grid-cols-2.sm\\:grid-cols-4');
      if (!parent) return null;
      const card = Array.from(parent.children).find(c => c.querySelector('span')?.innerText?.trim() === '最新支持');
      if (!card) return null;
      return {
        value: card.querySelector('.text-2xl')?.innerText?.trim(),
        subtitle: card.querySelector('.text-\\[10px\\]')?.innerText?.trim(),
      };
    });

    console.log('Updated Card:', updatedCard);
    if (!updatedCard.value.includes('25') || !updatedCard.value.includes('USD')) {
      throw new Error(`Expected updated value to include 25 and USD, got: "${updatedCard?.value}"`);
    }
    if (!updatedCard.subtitle.includes('自由探索者') || !updatedCard.subtitle.includes('09月19日')) {
      throw new Error(`Expected updated subtitle to include 自由探索者 and 09月19日, got: "${updatedCard?.subtitle}"`);
    }
    console.log('✅ Scenario 2 Passed: Event-driven real-time update synced successfully!');

    console.log('\n--- Scenario 3: Empty state handling ---');
    mockSponsors = [];
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('shijianus:sponsorship-updated'));
    });
    await page.waitForTimeout(600);

    const emptyCard = await page.evaluate(() => {
      const parent = document.querySelector('.grid.grid-cols-2.sm\\:grid-cols-4');
      if (!parent) return null;
      const card = Array.from(parent.children).find(c => c.querySelector('span')?.innerText?.trim() === '最新支持');
      if (!card) return null;
      return {
        value: card.querySelector('.text-2xl, .text-xl, .text-base')?.innerText?.trim(),
        subtitle: card.querySelector('.text-\\[10px\\]')?.innerText?.trim(),
      };
    });

    console.log('Empty State Card:', emptyCard);
    if (!emptyCard.value.includes('虚位以待')) {
      throw new Error(`Expected empty state to show 虚位以待, got: "${emptyCard?.value}"`);
    }
    if (!emptyCard.subtitle.includes('期待第一位支持者')) {
      throw new Error(`Expected empty subtitle to show 期待第一位支持者, got: "${emptyCard?.subtitle}"`);
    }
    console.log('✅ Scenario 3 Passed: Graceful empty state verified!');

    console.log('\n🎉 All local test scenarios passed with flying colors!');
  } finally {
    await browser.close();
    server.close();
  }
}

runTest().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
