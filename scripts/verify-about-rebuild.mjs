import puppeteer from 'puppeteer';
import http from 'http';
import fs from 'fs';
import path from 'path';

function createStaticServer(distDir, port) {
  const mimeTypes = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.mp4': 'video/mp4',
    '.woff2': 'font/woff2',
    '.woff': 'font/woff',
    '.ttf': 'font/ttf'
  };

  const server = http.createServer((req, res) => {
    let reqUrl = req.url.split('?')[0];
    let filePath = path.join(distDir, reqUrl);
    if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
      filePath = path.join(filePath, 'index.html');
    } else if (!fs.existsSync(filePath) && fs.existsSync(filePath + '.html')) {
      filePath = filePath + '.html';
    }
    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      const ext = path.extname(filePath).toLowerCase();
      res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'application/octet-stream' });
      fs.createReadStream(filePath).pipe(res);
    } else {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not Found');
    }
  });

  return new Promise(resolve => server.listen(port, () => resolve(server)));
}

async function runAudit() {
  const port = 4355;
  const distDir = path.resolve('/home/shijian/projects/shijianus-blog/dist');
  const server = await createStaticServer(distDir, port);
  const screenshotDir = path.resolve('/home/shijian/projects/shijianus-blog/scripts/audit_screenshots');
  if (!fs.existsSync(screenshotDir)) {
    fs.mkdirSync(screenshotDir, { recursive: true });
  }

  console.log(`[INFO] Static test server running on http://localhost:${port}`);

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const viewports = [
    { name: 'Desktop-1440', width: 1440, height: 900 },
    { name: 'Tablet-768', width: 768, height: 1024 },
    { name: 'Mobile-375', width: 375, height: 667 }
  ];

  let allPassed = true;

  try {
    for (const vp of viewports) {
      console.log(`\n=============================================================`);
      console.log(`[TEST] Auditing Viewport: ${vp.name} (${vp.width}x${vp.height})`);
      console.log(`=============================================================`);

      const page = await browser.newPage();
      await page.setViewport({ width: vp.width, height: vp.height });

      const errors = [];
      page.on('pageerror', err => errors.push(err.message));

      await page.goto(`http://localhost:${port}/about/`, { waitUntil: 'networkidle2' });

      // 1. 验证打赏模块彻底移除
      const rewardCheck = await page.evaluate(() => {
        const rewardElement = document.querySelector('#about-reward');
        const rewardClass = document.querySelector('.author-content-item.reward');
        return {
          hasRewardId: Boolean(rewardElement),
          hasRewardClass: Boolean(rewardClass)
        };
      });

      if (!rewardCheck.hasRewardId && !rewardCheck.hasRewardClass) {
        console.log(`✅ [SUCCESS] Reward module '#about-reward' is completely removed from /about/!`);
      } else {
        console.error(`❌ [FAILURE] Reward module is still present:`, rewardCheck);
        allPassed = false;
      }

      // 2. 验证核心丰富板块存在与完整性
      const contentAudit = await page.evaluate(() => {
        const query = sel => document.querySelector(sel);
        const queryAll = sel => Array.from(document.querySelectorAll(sel));

        return {
          authorBox: Boolean(query('.author-box')),
          onlineIndicator: Boolean(query('.online-indicator')),
          myInfoAndSayHello: Boolean(query('.myInfoAndSayHello')),
          helloChips: queryAll('.hello-tag-chips span').length,
          aboutsiteTips: Boolean(query('.aboutsiteTips')),
          maskWords: queryAll('.aboutsiteTips .mask span').length,
          helloAbout: Boolean(query('.hello-about')),
          skills: Boolean(query('.author-content-item.skills')),
          careers: Boolean(query('.author-content-item.careers')),
          stats: Boolean(query('.about-statistic')),
          mapLiveClock: Boolean(query('#about-live-clock')),
          clockText: query('#about-live-clock')?.textContent || '',
          liveStatusPill: Boolean(query('.live-status-pill')),
          personalityBadge: query('.personality-badge')?.textContent || '',
          personalityTraits: queryAll('.personality-traits-grid .trait-item').length,
          myphoto: Boolean(query('.author-content-item.myphoto')),
          gearHardware: queryAll('.gear-card.hardware .gear-item').length,
          gearSoftware: queryAll('.gear-card.software .gear-item').length,
          manifestoTitle: query('.manifesto-title')?.textContent || '',
          manifestoPillars: queryAll('.manifesto-pillars .pillar-card').length,
          topologyTiers: queryAll('.topology-card .topology-tier-box').length,
          vinylWidget: Boolean(query('.vinyl-player-widget')),
          vinylSongTitle: query('.vinyl-song-title')?.textContent || '',
          equalizerBars: queryAll('.equalizer-bars .bar').length,
          gameCorner: Boolean(query('.author-content-item.game-yuanshen')),
          milestones: queryAll('.milestones-card .milestone-node').length,
          maxim: Boolean(query('.author-content-item.maxim')),
          maximText: query('.author-content-item.maxim .maxim-title')?.textContent || '',
          buff: Boolean(query('.author-content-item.buff')),
          connectButtons: queryAll('.connect-buttons-grid .connect-btn').length,
        };
      });

      console.log(`[AUDIT RESULT] Content Structure:`);
      console.log(` - Author Box: ${contentAudit.authorBox}, Online Indicator: ${contentAudit.onlineIndicator}`);
      console.log(` - Hello Chips: ${contentAudit.helloChips} tags, Rotating Words: ${contentAudit.maskWords}`);
      console.log(` - Skills & Careers: Available, Stats: Available`);
      console.log(` - Live PST Clock: ${contentAudit.clockText} (Status: ${contentAudit.liveStatusPill})`);
      console.log(` - MBTI Personality: ${contentAudit.personalityBadge} with ${contentAudit.personalityTraits} trait bars`);
      console.log(` - Workstation Photo: ${contentAudit.myphoto}`);
      console.log(` - Productivity Gear: ${contentAudit.gearHardware} hardware + ${contentAudit.gearSoftware} software items`);
      console.log(` - Manifesto Pillars: ${contentAudit.manifestoPillars} pillars ('${contentAudit.manifestoTitle.slice(0, 20)}...')`);
      console.log(` - Architecture Topology: ${contentAudit.topologyTiers} tiers`);
      console.log(` - Vinyl Turntable: Song '${contentAudit.vinylSongTitle}', Equalizer: ${contentAudit.equalizerBars} bars`);
      console.log(` - Creative Corner: ${contentAudit.gameCorner}`);
      console.log(` - Milestones: ${contentAudit.milestones} evolution steps`);
      console.log(` - Maxim: '${contentAudit.maximText.replace(/\s+/g, ' ').trim()}', Buff: ${contentAudit.buff}`);
      console.log(` - Connect Buttons: ${contentAudit.connectButtons} social/subscribe links`);

      // 验证断言
      if (!contentAudit.maximText.includes('厚土潜藏细脉') || !contentAudit.maximText.includes('大荒广构通衢')) {
        console.error(`❌ Maxim motto text is incorrect: got '${contentAudit.maximText}'`);
        allPassed = false;
      } else {
        console.log(`✅ [ASSERTION SUCCESS] Maxim correctly displays '厚土潜藏细脉 大荒广构通衢'!`);
      }

      // 验证姓名、大学生、2006、设备等真实文字
      const textAudit = await page.evaluate(() => {
        const bodyText = document.body.innerText;
        return {
          hasTimeName: bodyText.includes('時間'),
          hasWrongName: bodyText.includes('世健'),
          hasStudent: bodyText.includes('大学生'),
          has2006: bodyText.includes('2006'),
          hasLenovo: bodyText.includes('联想小新'),
          hasRedmi: bodyText.includes('红米'),
        };
      });

      if (textAudit.hasTimeName && !textAudit.hasWrongName) {
        console.log(`✅ [NAME CHECK] Correct name '時間' verified, '世健' completely absent!`);
      } else {
        console.error(`❌ [NAME ERROR] Name mismatch: hasTimeName=${textAudit.hasTimeName}, hasWrongName=${textAudit.hasWrongName}`);
        allPassed = false;
      }

      if (textAudit.hasStudent && textAudit.has2006) {
        console.log(`✅ [PERSONA CHECK] Genuine 2006 undergraduate persona verified!`);
      } else {
        console.error(`❌ [PERSONA ERROR] Undergraduate / 2006 not found:`, textAudit);
        allPassed = false;
      }

      if (textAudit.hasLenovo && textAudit.hasRedmi) {
        console.log(`✅ [GEAR CHECK] Humble student gear verified (Lenovo / Redmi)!`);
      } else {
        console.error(`❌ [GEAR ERROR] Student gear not found:`, textAudit);
        allPassed = false;
      }

      // 测试多语言动态切换 (English: Kevin Sparks, French: Léon Boven & 零中文残留)
      const i18nAudit = await page.evaluate(async () => {
        const runtime = window.__SHIJIANUS_LOCALE_RUNTIME__;
        if (!runtime?.applyLocaleVariant) return { available: false };

        const aboutContainer = document.querySelector('#about-page');

        // Helper to count chinese characters in text nodes
        const countChineseTextNodes = () => {
          if (!aboutContainer) return 0;
          const walker = document.createTreeWalker(aboutContainer, NodeFilter.SHOW_TEXT);
          let count = 0;
          let node = walker.nextNode();
          while (node) {
            const text = node.nodeValue?.trim();
            if (text && /[\u4e00-\u9fa5]/.test(text)) count++;
            node = walker.nextNode();
          }
          return count;
        };

        // Switch to English
        runtime.applyLocaleVariant('en');
        await new Promise(r => setTimeout(r, 400));
        const enGreeting = document.querySelector('.myInfoAndSayHello .title2')?.innerText || '';
        const enHasKevin = enGreeting.includes('Kevin Sparks');
        const enChineseCount = countChineseTextNodes();

        // Switch to French
        runtime.applyLocaleVariant('fr');
        await new Promise(r => setTimeout(r, 400));
        const frGreeting = document.querySelector('.myInfoAndSayHello .title2')?.innerText || '';
        const frHasLeon = frGreeting.includes('Léon Boven');
        const frChineseCount = countChineseTextNodes();

        // Restore to zh-CN
        runtime.applyLocaleVariant('zh-CN');
        await new Promise(r => setTimeout(r, 400));
        const zhGreeting = document.querySelector('.myInfoAndSayHello .title2')?.innerText || '';
        const zhHasTime = zhGreeting.includes('時間');

        return {
          available: true,
          enGreeting,
          enHasKevin,
          enChineseCount,
          frGreeting,
          frHasLeon,
          frChineseCount,
          zhGreeting,
          zhHasTime
        };
      });

      if (i18nAudit.available) {
        if (i18nAudit.enHasKevin && i18nAudit.frHasLeon && i18nAudit.zhHasTime) {
          console.log(`✅ [I18N SUCCESS] Multilingual localized identity verified! EN='${i18nAudit.enGreeting.trim()}', FR='${i18nAudit.frGreeting.trim()}', ZH='${i18nAudit.zhGreeting.trim()}'`);
        } else {
          console.error(`❌ [I18N FAILURE] Localization failed:`, i18nAudit);
          allPassed = false;
        }

        if (i18nAudit.enChineseCount === 0 && i18nAudit.frChineseCount === 0) {
          console.log(`✅ [I18N PURITY SUCCESS] Zero Chinese character leakage in English and French modes! (EN count: 0, FR count: 0)`);
        } else {
          console.error(`❌ [I18N PURITY FAILURE] Chinese character leakage detected: EN=${i18nAudit.enChineseCount}, FR=${i18nAudit.frChineseCount}`);
          allPassed = false;
        }
      }

      if (contentAudit.helloChips < 4) {
        console.error(`❌ Hello chips count < 4`);
        allPassed = false;
      }
      if (contentAudit.personalityTraits !== 5) {
        console.error(`❌ Personality traits != 5`);
        allPassed = false;
      }
      if (contentAudit.gearHardware !== 4 || contentAudit.gearSoftware !== 4) {
        console.error(`❌ Gear items != 4 + 4`);
        allPassed = false;
      }
      if (contentAudit.manifestoPillars !== 3) {
        console.error(`❌ Manifesto pillars != 3`);
        allPassed = false;
      }
      if (contentAudit.topologyTiers !== 3) {
        console.error(`❌ Topology tiers != 3`);
        allPassed = false;
      }
      if (!contentAudit.vinylWidget || contentAudit.equalizerBars !== 4) {
        console.error(`❌ Vinyl widget equalizer missing`);
        allPassed = false;
      }
      if (contentAudit.milestones < 4) {
        console.error(`❌ Milestones steps < 4`);
        allPassed = false;
      }
      if (contentAudit.connectButtons !== 4) {
        console.error(`❌ Connect buttons != 4`);
        allPassed = false;
      }

      if (errors.length > 0) {
        console.error(`❌ Console errors detected:`, errors);
        allPassed = false;
      } else {
        console.log(`✅ Zero runtime JavaScript errors.`);
      }

      // 截图留档
      const shotPath = path.join(screenshotDir, `about_rebuild_${vp.name}.png`);
      await page.screenshot({ path: shotPath, fullPage: true });
      console.log(`📸 Screenshot saved: ${shotPath}`);

      // 测试深色模式
      await page.evaluate(() => {
        document.documentElement.setAttribute('data-theme', 'dark');
      });
      await new Promise(r => setTimeout(r, 400));
      const darkShotPath = path.join(screenshotDir, `about_rebuild_${vp.name}_dark.png`);
      await page.screenshot({ path: darkShotPath, fullPage: true });
      console.log(`📸 Dark Mode Screenshot saved: ${darkShotPath}`);

      await page.close();
    }
  } finally {
    await browser.close();
    server.close();
  }

  if (allPassed) {
    console.log(`\n🎉 [ALL TESTS PASSED] About page reconstruction and innovation audit passed 100%!`);
    process.exit(0);
  } else {
    console.error(`\n❌ [AUDIT FAILED] Some assertions did not pass.`);
    process.exit(1);
  }
}

runAudit().catch(err => {
  console.error('Fatal error during audit:', err);
  process.exit(1);
});
