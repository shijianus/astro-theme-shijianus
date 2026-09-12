#!/usr/bin/env node
/**
 * Production Cloudflare Pages Playwright Verification for AI-Assisted Article i18n
 * Tests real live non-Chinese language presentation, TOC localization, URL routing, and pill switching.
 */

import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const outDir = path.resolve('verification-screenshots');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

// Target domains: production custom domain and direct Cloudflare Pages deployment URL
const LIVE_URL = 'https://blog.epocanvas.com';
const PAGES_DEPLOY_URL = 'https://c3df6f1f.shijianus-blog.pages.dev';

async function runLiveAudit() {
  console.log('🚀 开始对生产环境 (Cloudflare Pages) 进行非中文多语言 (i18n) 真实端到端 Playwright 审计...\n');

  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
  });

  const page = await context.newPage();

  const consoleErrors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });

  try {
    // ── Test 1: Direct visit to non-Chinese (English) article on Cloudflare Pages ──
    const enUrl = `${PAGES_DEPLOY_URL}/posts/hello-world-en/`;
    console.log(`[Test 1] 正在直接访问生产端非中文英文文章页面: ${enUrl}`);
    const res1 = await page.goto(enUrl, { waitUntil: 'networkidle', timeout: 30000 });
    console.log(`[Test 1] 响应状态码: ${res1.status()}`);
    if (res1.status() !== 200) {
      throw new Error(`Expected 200 OK for ${enUrl}, got ${res1.status()}`);
    }

    // Wait for hero to render
    await page.waitForSelector('.post-hero h1', { timeout: 10000 });

    // Check Post Hero title in English
    const heroTitle = await page.textContent('.post-hero h1');
    console.log(`[Test 1] PostHero 标题 (英文): "${heroTitle?.trim()}"`);
    if (!heroTitle || !heroTitle.includes('Theme Refactoring Kickoff Log') && !heroTitle.toLowerCase().includes('refactor')) {
      throw new Error(`Expected English title containing 'Theme Refactoring Kickoff Log', got "${heroTitle}"`);
    }

    // Check Language Switcher Pill in PostHero
    const pillCount = await page.locator('.post-hero__i18n-pill').count();
    console.log(`[Test 1] PostHero 多语言切换药丸数量: ${pillCount}`);
    if (pillCount < 2) {
      throw new Error(`Expected at least 2 language pills, got ${pillCount}`);
    }

    // Check active pill is English (with AI tag)
    const activePillText = await page.locator('.post-hero__i18n-pill.is-active').textContent();
    console.log(`[Test 1] 当前高亮活跃语言药丸: "${activePillText?.trim()}"`);
    if (!activePillText?.includes('EN') && !activePillText?.includes('English')) {
      throw new Error(`Expected active pill to be English, got "${activePillText}"`);
    }

    // Check AI badge presence on generated English pill
    const hasAiBadge = await page.locator('.post-hero__i18n-pill.is-active .post-hero__i18n-tag').count();
    console.log(`[Test 1] 是否展示专属金色 AI 标识: ${hasAiBadge > 0 ? '✅ 是 (AI)' : '❌ 否'}`);
    if (hasAiBadge === 0) {
      throw new Error('Expected AI badge on AI-generated English pill');
    }

    // ── Test 2: Verify TOC (Table of Contents) Localization in Non-Chinese ──
    console.log('\n[Test 2] 验证文章目录 (TOC) 在非中文 (英文) 状态下的本地化渲染...');
    await page.waitForSelector('#card-toc .toc-link .toc-text', { timeout: 10000 });
    const tocItems = await page.$$eval('#card-toc .toc-link .toc-text', (els) => els.map((el) => el.textContent.trim()));
    console.log(`[Test 2] TOC 目录项数量: ${tocItems.length}`);
    console.log(`[Test 2] TOC 目录项内容展示:`, tocItems.filter(Boolean));

    if (tocItems.length === 0) {
      throw new Error('TOC items should not be empty');
    }

    // Assert that TOC contains English headings, not Chinese headings
    const tocText = tocItems.join(' ');
    const isEnglishToc = /Judging|Refactor|Baseline|Structure|Next|Step/i.test(tocText);
    const hasChineseInToc = /判断|基线|阶段|下一步/.test(tocText);
    console.log(`[Test 2] TOC 包含英文目标标题: ${isEnglishToc ? '✅ 是' : '❌ 否'}`);
    console.log(`[Test 2] TOC 是否残留中文原标题: ${hasChineseInToc ? '❌ 是 (未本地化)' : '✅ 否 (完全本地化)'}`);

    if (!isEnglishToc) {
      throw new Error(`Expected TOC to have localized English headings, got: "${tocText}"`);
    }
    if (hasChineseInToc) {
      throw new Error(`TOC unexpectedly contains Chinese source headings: "${tocText}"`);
    }

    // ── Test 3: Verify Article Body Content in Non-Chinese (English) ──
    console.log('\n[Test 3] 验证正文 (#article-container) 在非中文 (英文) 状态下的完整呈现...');
    const articleHeadings = await page.$$eval('#article-container h1, #article-container h2, #article-container h3', (els) => els.map(el => el.textContent.trim()));
    console.log(`[Test 3] 正文各级标题:`, articleHeadings);

    const firstParagraph = await page.$eval('#article-container p', (el) => el.textContent.trim());
    console.log(`[Test 3] 正文首段预览: "${firstParagraph.slice(0, 120)}..."`);

    // Verify code block is preserved
    const codeBlockCount = await page.locator('#article-container pre, #article-container code').count();
    console.log(`[Test 3] 正文代码块数量: ${codeBlockCount}`);
    if (codeBlockCount === 0) {
      throw new Error('Expected code blocks to be preserved in English article');
    }

    // Take screenshot of English article on Cloudflare Pages
    const enScreenshotPath = path.join(outDir, 'live_article_i18n_en.png');
    await page.screenshot({ path: enScreenshotPath, fullPage: false });
    console.log(`[Test 3] 📸 已保存非中文 (英文) 页面渲染截图: ${enScreenshotPath}`);

    // ── Test 4: Switching back to Chinese via Pill Click ──
    console.log('\n[Test 4] 验证通过 PostHero 语言药丸点击无缝切换回中文原文...');
    const zhPill = page.locator('.post-hero__i18n-pill').filter({ hasText: /简体中文|ZH/i }).first();
    await zhPill.click();
    await page.waitForURL('**/posts/hello-world/', { timeout: 10000 });
    console.log(`[Test 4] 成功重定向至中文原文: ${page.url()}`);

    const zhHeroTitle = await page.textContent('.post-hero h1');
    console.log(`[Test 4] 中文页面标题: "${zhHeroTitle?.trim()}"`);
    if (!zhHeroTitle?.includes('主题重构启动记录')) {
      throw new Error(`Expected Chinese title on switch back, got "${zhHeroTitle}"`);
    }

    const zhTocText = (await page.$$eval('#card-toc .toc-link .toc-text', (els) => els.map(el => el.textContent.trim()))).join(' ');
    console.log(`[Test 4] 中文页面 TOC 标题: "${zhTocText}"`);
    if (!/判断|基线|阶段|下一步/.test(zhTocText)) {
      throw new Error(`Expected Chinese TOC headings, got "${zhTocText}"`);
    }

    // ── Test 5: Verify Second Non-Chinese Post on Production Domain: api-ready-theme-contracts-en ──
    const secondEnUrl = `${LIVE_URL}/posts/api-ready-theme-contracts-en/`;
    console.log(`\n[Test 5] 验证生产主域名 (${LIVE_URL}) 下第二篇非中文 (英文) 文章: ${secondEnUrl}`);
    const res2 = await page.goto(secondEnUrl, { waitUntil: 'networkidle', timeout: 30000 });
    console.log(`[Test 5] 响应状态码: ${res2.status()}`);
    if (res2.status() !== 200) {
      throw new Error(`Expected 200 OK for ${secondEnUrl}, got ${res2.status()}`);
    }

    const secondTitle = await page.textContent('.post-hero h1');
    console.log(`[Test 5] 第二篇英文标题: "${secondTitle?.trim()}"`);
    if (!secondTitle || (!secondTitle.includes('Theme') && !secondTitle.includes('API') && !secondTitle.includes('Contract'))) {
      throw new Error(`Expected English theme contracts title, got "${secondTitle}"`);
    }

    const secondToc = (await page.$$eval('#card-toc .toc-link .toc-text', (els) => els.map(el => el.textContent.trim()))).join(' ');
    console.log(`[Test 5] 第二篇英文 TOC: "${secondToc}"`);

    // Verify English body snippet
    const secondSnippet = await page.$eval('#article-container p', (el) => el.textContent.trim());
    console.log(`[Test 5] 第二篇英文正文段落预览: "${secondSnippet.slice(0, 100)}..."`);

    // Take screenshot of second English article
    const secondScreenshotPath = path.join(outDir, 'live_article_i18n_api_contracts_en.png');
    await page.screenshot({ path: secondScreenshotPath, fullPage: false });
    console.log(`[Test 5] 📸 已保存第二篇非中文文章渲染截图: ${secondScreenshotPath}`);

    // Check for fatal console errors
    const fatalErrors = consoleErrors.filter(e => !e.includes('favicon') && !e.includes('404') && !e.includes('clarity'));
    console.log(`\n[Audit] 致命控制台 JS 报错数量: ${fatalErrors.length}`);
    if (fatalErrors.length > 0) {
      console.warn(`[Audit Warning] 控制台错误:`, fatalErrors);
    }

    console.log('\n================================================================');
    console.log('🎉 生产端 (Cloudflare Pages) 非中文多语言真实 Playwright 审计 100% 全部通过！');
    console.log('================================================================\n');
  } finally {
    await browser.close();
  }
}

runLiveAudit().catch((err) => {
  console.error('\n❌ 生产环境非中文多语言审计失败:', err);
  process.exit(1);
});
