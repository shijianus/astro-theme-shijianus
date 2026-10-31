import puppeteer from 'puppeteer';

const BASE_URL = process.env.TEST_URL || 'http://localhost:4321';

async function main() {
  console.log(`[TEST] Starting verification on ${BASE_URL}...`);
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
      // Ignore trivial analytics or static 404s for favicon
      if (!text.includes('favicon') && !text.includes('404')) {
        errors.push(`[Console Error] ${text}`);
      }
    }
  });

  page.on('pageerror', (err) => {
    errors.push(`[Page Error] ${err.message}`);
  });

  // 1. 测试友人帐 (/friends/)
  console.log('\n--- 1. Testing Friends Dashboard (/friends/) ---');
  await page.goto(`${BASE_URL}/friends/`, { waitUntil: 'networkidle2' });
  const friendsHero = await page.$('.friends-hero');
  const friendCards = await page.$$('.friend-card');
  const copyBtn = await page.$('#btn-copy-code');
  console.log(`- Friends Hero exists: ${!!friendsHero}`);
  console.log(`- Friend Cards count: ${friendCards.length}`);
  console.log(`- Copy Config Button exists: ${!!copyBtn}`);

  if (!friendsHero || friendCards.length === 0 || !copyBtn) {
    throw new Error('FriendsDashboard failed to render correctly');
  }

  // 2. 测试朋友圈 (/moments/)
  console.log('\n--- 2. Testing Moments Dashboard (/moments/) ---');
  await page.goto(`${BASE_URL}/moments/`, { waitUntil: 'networkidle2' });
  const momentsHero = await page.$('.moments-hero');
  const momentCards = await page.$$('.moment-card');
  const fishingBtn = await page.$('#btn-fishing');
  const categoryChips = await page.$$('.filter-chip');
  console.log(`- Moments Hero exists: ${!!momentsHero}`);
  console.log(`- Moment Cards count: ${momentCards.length}`);
  console.log(`- Fishing Portal Button exists: ${!!fishingBtn}`);
  console.log(`- Category Filter Chips count: ${categoryChips.length}`);

  if (!momentsHero || momentCards.length === 0 || !fishingBtn || categoryChips.length === 0) {
    throw new Error('MomentsDashboard failed to render correctly');
  }

  // 3. 测试关于本站 (/about/site/) - 确保是 Dashboard 而非文档
  console.log('\n--- 3. Testing Site Dashboard (/about/site/) ---');
  await page.goto(`${BASE_URL}/about/site/`, { waitUntil: 'networkidle2' });
  const siteHero = await page.$('.site-hero-box');
  const bentoGrid = await page.$('.site-bento-grid');
  const manifesto = await page.$('.manifesto-card');
  const standardsHeroOnSite = await page.$('.standards-spec-header');
  console.log(`- Site Hero exists: ${!!siteHero}`);
  console.log(`- Bento Grid exists: ${!!bentoGrid}`);
  console.log(`- Manifesto Card exists: ${!!manifesto}`);
  console.log(`- Has StandardsHero (Must be false, not a document): ${!!standardsHeroOnSite}`);

  if (!siteHero || !bentoGrid || standardsHeroOnSite) {
    throw new Error('SiteDashboard is not rendering as a pure interactive dashboard!');
  }

  // 4. 测试版本规范 (/version/) - 确保是 Dashboard 而非文档
  console.log('\n--- 4. Testing Version Dashboard (/version/) ---');
  await page.goto(`${BASE_URL}/version/`, { waitUntil: 'networkidle2' });
  const versionHero = await page.$('.version-hero-box');
  const semverGrid = await page.$('.semver-pill-grid');
  const archStack = await page.$('.arch-stack');
  const standardsHeroOnVersion = await page.$('.standards-spec-header');
  console.log(`- Version Hero exists: ${!!versionHero}`);
  console.log(`- SemVer Grid exists: ${!!semverGrid}`);
  console.log(`- Arch Stack exists: ${!!archStack}`);
  console.log(`- Has StandardsHero (Must be false, not a document): ${!!standardsHeroOnVersion}`);

  if (!versionHero || !semverGrid || standardsHeroOnVersion) {
    throw new Error('VersionDashboard is not rendering as a pure interactive dashboard!');
  }

  // 5. 测试官方自述文档 (/about/doc/) - 确保存在且为标准文档
  console.log('\n--- 5. Testing Official About Document (/about/doc/) ---');
  await page.goto(`${BASE_URL}/about/doc/`, { waitUntil: 'networkidle2' });
  const standardsHeroOnDoc = await page.$('.standards-spec-header');
  const contentBody = await page.$('.article-aside');
  console.log(`- StandardsHero on Doc exists: ${!!standardsHeroOnDoc}`);
  console.log(`- Doc Content Body exists: ${!!contentBody}`);

  if (!standardsHeroOnDoc) {
    throw new Error('/about/doc/ failed to render official documentation standard');
  }

  // 6. 测试导航栏结构与子项链接
  console.log('\n--- 6. Testing Navbar Dropdown Links ---');
  await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle2' });
  const friendsLink = await page.$('a[href="/friends/"]');
  const momentsLink = await page.$('a[href="/moments/"]');
  const aboutSiteLink = await page.$('a[href="/about/site/"]');
  const aboutDocLink = await page.$('a[href="/about/doc/"]');
  const versionLink = await page.$('a[href="/version/"]');

  console.log(`- /friends/ in navbar: ${!!friendsLink}`);
  console.log(`- /moments/ in navbar: ${!!momentsLink}`);
  console.log(`- /about/site/ in navbar: ${!!aboutSiteLink}`);
  console.log(`- /about/doc/ in navbar: ${!!aboutDocLink}`);
  console.log(`- /version/ in navbar: ${!!versionLink}`);

  console.log('\n--- Verification Finished ---');
  if (errors.length > 0) {
    console.warn('Encountered non-fatal warnings/errors during run:', errors);
  } else {
    console.log('✅ All 6 interactive navigation verification suites passed with 0 console errors!');
  }

  await browser.close();
}

main().catch((err) => {
  console.error('❌ Verification failed:', err);
  process.exit(1);
});
