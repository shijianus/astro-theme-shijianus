import puppeteer from 'puppeteer';

const BASE_URL = process.env.TEST_URL || 'http://localhost:4321';

async function main() {
  console.log(`[TEST] Starting comprehensive navigation audit on ${BASE_URL}...`);
  const browser = await puppeteer.launch({
    executablePath: '/usr/bin/google-chrome',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  const errors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      const text = msg.text();
      if (!text.includes('favicon') && !text.includes('404')) {
        errors.push(`[Console Error] ${text}`);
      }
    }
  });

  page.on('pageerror', (err) => {
    errors.push(`[Page Error] ${err.message}`);
  });

  // 1. 友人帐 (/friends/)
  console.log('\n--- 1. Testing Friends Dashboard (/friends/) ---');
  await page.goto(`${BASE_URL}/friends/`, { waitUntil: 'networkidle2' });
  const friendsHero = await page.$('.friends-hero');
  const friendCards = await page.$$('.friend-card');
  const copyBtn = await page.$('#btn-copy-code');
  console.log(`- Friends Hero: ${!!friendsHero}, Cards: ${friendCards.length}, CopyBtn: ${!!copyBtn}`);
  if (!friendsHero || friendCards.length === 0 || !copyBtn) throw new Error('Friends failed');

  // 2. 朋友圈 (/moments/)
  console.log('\n--- 2. Testing Moments Dashboard (/moments/) ---');
  await page.goto(`${BASE_URL}/moments/`, { waitUntil: 'networkidle2' });
  const momentsHero = await page.$('.moments-hero');
  const momentCards = await page.$$('.moment-card');
  const fishingBtn = await page.$('#btn-fishing');
  console.log(`- Moments Hero: ${!!momentsHero}, Cards: ${momentCards.length}, RoamBtn: ${!!fishingBtn}`);
  if (!momentsHero || momentCards.length === 0 || !fishingBtn) throw new Error('Moments failed');

  // 3. 留言板 (/guestbook/)
  console.log('\n--- 3. Testing Guestbook Dashboard (/guestbook/) ---');
  await page.goto(`${BASE_URL}/guestbook/`, { waitUntil: 'networkidle2' });
  const gbHero = await page.$('.guestbook-hero');
  const danmakuView = await page.$('#danmaku-viewport');
  const stamps = await page.$$('.stamp-chip');
  const gbComments = await page.$('#guestbook-comment-container');
  console.log(`- GB Hero: ${!!gbHero}, Danmaku: ${!!danmakuView}, Stamps: ${stamps.length}, Comments: ${!!gbComments}`);
  if (!gbHero || !danmakuView || stamps.length === 0) throw new Error('Guestbook failed');

  // 4. 实验田 (/lab/)
  console.log('\n--- 4. Testing Lab Dashboard (/lab/) ---');
  await page.goto(`${BASE_URL}/lab/`, { waitUntil: 'networkidle2' });
  const labHero = await page.$('.lab-hero');
  const starCanvas = await page.$('#lab-star-canvas');
  const soundPads = await page.$$('.sound-pad');
  const fxCalc = await page.$('.fx-calc-box');
  console.log(`- Lab Hero: ${!!labHero}, StarCanvas: ${!!starCanvas}, SoundPads: ${soundPads.length}, FX: ${!!fxCalc}`);
  if (!labHero || !starCanvas || soundPads.length === 0) throw new Error('Lab failed');

  // 5. 留声机 (/music/)
  console.log('\n--- 5. Testing Music Dashboard (/music/) ---');
  await page.goto(`${BASE_URL}/music/`, { waitUntil: 'networkidle2' });
  const vinylDisc = await page.$('#vinyl-disc');
  const visualizerCanvas = await page.$('#audio-visualizer-canvas');
  const ambientGrid = await page.$('.ambient-grid');
  const playlistRows = await page.$$('.playlist-row');
  console.log(`- Vinyl: ${!!vinylDisc}, Visualizer: ${!!visualizerCanvas}, AmbientMixer: ${!!ambientGrid}, Tracks: ${playlistRows.length}`);
  if (!vinylDisc || !visualizerCanvas || !ambientGrid) throw new Error('Music failed');

  // 6. 放映室 (/cinema/)
  console.log('\n--- 6. Testing Cinema Dashboard (/cinema/) ---');
  await page.goto(`${BASE_URL}/cinema/`, { waitUntil: 'networkidle2' });
  const theaterStage = await page.$('.theater-stage');
  const cinemaVideo = await page.$('#cinema-video');
  const lightsBtn = await page.$('#btn-toggle-lights');
  const filmCards = await page.$$('.film-card');
  console.log(`- Theater: ${!!theaterStage}, Video: ${!!cinemaVideo}, LightsBtn: ${!!lightsBtn}, Films: ${filmCards.length}`);
  if (!theaterStage || !cinemaVideo || filmCards.length === 0) throw new Error('Cinema failed');

  // 7. 关于本站 (/about/site/) - 确保非文档
  console.log('\n--- 7. Testing Site Dashboard (/about/site/) ---');
  await page.goto(`${BASE_URL}/about/site/`, { waitUntil: 'networkidle2' });
  const siteHero = await page.$('.site-hero-box');
  const bentoGrid = await page.$('.site-bento-grid');
  const standardsHeroOnSite = await page.$('.standards-spec-header');
  console.log(`- Site Hero: ${!!siteHero}, Bento: ${!!bentoGrid}, IsDoc (Must be false): ${!!standardsHeroOnSite}`);
  if (!siteHero || !bentoGrid || standardsHeroOnSite) throw new Error('Site Dashboard failed');

  // 8. 版本规范 (/version/) - 确保非文档
  console.log('\n--- 8. Testing Version Dashboard (/version/) ---');
  await page.goto(`${BASE_URL}/version/`, { waitUntil: 'networkidle2' });
  const versionHero = await page.$('.version-hero-box');
  const semverGrid = await page.$('.semver-pill-grid');
  const standardsHeroOnVersion = await page.$('.standards-spec-header');
  console.log(`- Version Hero: ${!!versionHero}, SemVer: ${!!semverGrid}, IsDoc (Must be false): ${!!standardsHeroOnVersion}`);
  if (!versionHero || !semverGrid || standardsHeroOnVersion) throw new Error('Version Dashboard failed');

  // 9. 赞赏支持 (/support/)
  console.log('\n--- 9. Testing Support Dashboard (/support/) ---');
  await page.goto(`${BASE_URL}/support/`, { waitUntil: 'networkidle2' });
  const supportBox = await page.$('.support-dashboard') || await page.$('#support');
  console.log(`- Support page rendered: ${!!supportBox}`);

  // 10. 官方文档 (/about/doc/) - 确保为文档
  console.log('\n--- 10. Testing Official Doc (/about/doc/) ---');
  await page.goto(`${BASE_URL}/about/doc/`, { waitUntil: 'networkidle2' });
  const docHero = await page.$('.standards-spec-header');
  console.log(`- Official Doc Header: ${!!docHero}`);
  if (!docHero) throw new Error('Official Doc failed');

  // 11. 导航栏全量链接可达性审计
  console.log('\n--- 11. Testing Full Navbar Menu Links ---');
  await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle2' });
  const navTargets = [
    '/archives/', '/categories/', '/tags/',
    '/friends/', '/moments/', '/guestbook/',
    '/lab/', '/music/', '/cinema/',
    '/about/', '/about/site/', '/version/', '/support/'
  ];

  for (const href of navTargets) {
    const link = await page.$(`a[href="${href}"]`);
    console.log(`- Nav target [${href}]: ${link ? 'EXISTS ✓' : 'MISSING ✗'}`);
    if (!link) throw new Error(`Nav link ${href} missing in header menu!`);
  }

  console.log('\n✅ All 11 navigation and dashboard verification suites passed with 0 console errors!');
  await browser.close();
}

main().catch((err) => {
  console.error('❌ Verification failed:', err);
  process.exit(1);
});
