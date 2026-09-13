#!/usr/bin/env node
/**
 * Playwright Visual Audit: i18n Component Issues
 * 
 * Investigates the root causes of:
 * 1. interactive-unit-converter - Chinese UI strings not translated
 * 2. mindmap-header/mindmap-footer - Chinese hardcoded in JS component
 * 3. article-tabs__panels - outer wrapper UI still Chinese
 * 4. Chunk splicing issues - sections missed during translation
 */

import { chromium } from 'playwright';
import path from 'node:path';
import fs from 'node:fs';

const LIVE_BASE = 'https://blog.epocanvas.com';
const SCREENSHOT_DIR = path.resolve('scripts/audit_screenshots/component-issues');

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

// Chinese character detector
function hasChinese(text) {
  return /[\u4e00-\u9fa5]/.test(text);
}

async function auditPage(page, url, locale, outPrefix) {
  console.log(`\n🔍 Auditing [${locale}]: ${url}`);
  
  await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(2000);

  const issues = [];

  // ===== AUDIT 1: interactive-unit-converter =====
  const unitConverter = await page.$('.interactive-unit-converter');
  if (unitConverter) {
    // Wait for it to be initialized
    await page.waitForTimeout(3000);
    
    const converterText = await page.evaluate(() => {
      const el = document.querySelector('.interactive-unit-converter');
      if (!el) return null;
      return {
        innerHTML_excerpt: el.innerHTML?.slice(0, 2000) || '',
        textContent: el.textContent?.trim()?.slice(0, 500) || '',
        dataTitle: el.getAttribute('data-title') || '',
        isBound: el.dataset.unitBound,
      };
    });
    
    if (converterText) {
      const chineseInTitle = hasChinese(converterText.dataTitle);
      const chineseInContent = hasChinese(converterText.textContent);
      
      console.log(`  📋 Unit Converter data-title: ${converterText.dataTitle?.slice(0, 80)}`);
      console.log(`  📋 Unit Converter is-bound: ${converterText.isBound}`);
      console.log(`  ❗ Chinese in data-title: ${chineseInTitle}`);
      console.log(`  ❗ Chinese in content text: ${chineseInContent}`);
      
      if (chineseInTitle || chineseInContent) {
        issues.push({
          component: 'interactive-unit-converter',
          issue: 'Chinese characters detected in unit converter UI',
          dataTitle: converterText.dataTitle,
          chineseInTitle,
          chineseInContent,
          contentSnippet: converterText.textContent?.slice(0, 200),
        });
      }
      
      // Extract specific UI strings from innerHTML
      const uiStrings = await page.evaluate(() => {
        const el = document.querySelector('.interactive-unit-converter');
        if (!el) return [];
        
        const strings = [];
        // Check category buttons
        el.querySelectorAll('.unit-cat-btn span:last-child').forEach(s => {
          strings.push({ type: 'category-name', text: s.textContent });
        });
        // Check input label
        const inputLabel = el.querySelector('.unit-input-label span');
        if (inputLabel) strings.push({ type: 'input-label', text: inputLabel.textContent });
        // Check rate status
        const rateStatus = el.querySelector('.unit-live-rate-pill');
        if (rateStatus) strings.push({ type: 'rate-status', text: rateStatus.textContent });
        // Check reset button
        const resetBtn = el.querySelector('.unit-reset-btn');
        if (resetBtn) strings.push({ type: 'reset-btn', text: resetBtn.textContent });
        // Check formula bar
        const formulaLabel = el.querySelector('.unit-formula-bar span:first-child');
        if (formulaLabel) strings.push({ type: 'formula-label', text: formulaLabel.textContent });
        // Check result copy buttons
        el.querySelectorAll('.unit-result-copy').forEach(btn => {
          strings.push({ type: 'copy-btn', text: btn.textContent });
        });
        
        return strings;
      });
      
      console.log(`  📊 UI strings found in unit converter:`);
      uiStrings.forEach(s => {
        const cn = hasChinese(s.text);
        console.log(`     [${s.type}] "${s.text?.trim()}" ${cn ? '🚨 CHINESE!' : '✅'}`);
        if (cn) {
          issues.push({
            component: 'interactive-unit-converter',
            issue: `Chinese in ${s.type}: "${s.text?.trim()}"`,
            type: s.type,
          });
        }
      });
    } else {
      console.log(`  ℹ️ Unit converter not found or not initialized on this page`);
    }
    
    await page.screenshot({ path: `${SCREENSHOT_DIR}/${outPrefix}-unit-converter.png`, fullPage: false });
  } else {
    console.log(`  ℹ️ No .interactive-unit-converter found on page`);
  }

  // ===== AUDIT 2: mindmap-header/mindmap-footer =====
  const mindmapWrapper = await page.$('.mindmap-wrapper');
  if (mindmapWrapper) {
    const mindmapTexts = await page.evaluate(() => {
      const wrapper = document.querySelector('.mindmap-wrapper');
      if (!wrapper) return null;
      
      return {
        headerMeta: wrapper.querySelector('.mindmap-header__meta')?.textContent?.trim(),
        hintPill: wrapper.querySelector('.mindmap-hint-pill')?.textContent?.trim(),
        footerGuide: wrapper.querySelector('.mindmap-footer__guide')?.textContent?.trim(),
        footerBrand: wrapper.querySelector('.mindmap-footer__brand')?.textContent?.trim(),
        stateTag: wrapper.querySelector('.mindmap-state-tag')?.textContent?.trim(),
        zoomInTitle: wrapper.querySelector('.mindmap-btn--zoom-in')?.getAttribute('title'),
        zoomOutTitle: wrapper.querySelector('.mindmap-btn--zoom-out')?.getAttribute('title'),
        fitTitle: wrapper.querySelector('.mindmap-btn--fit')?.getAttribute('title'),
        expandTitle: wrapper.querySelector('.mindmap-btn--expand-all')?.getAttribute('title'),
        collapseTitle: wrapper.querySelector('.mindmap-btn--collapse-all')?.getAttribute('title'),
        fullscreenTitle: wrapper.querySelector('.mindmap-btn--fullscreen')?.getAttribute('title'),
        copyTitle: wrapper.querySelector('.mindmap-btn--copy')?.getAttribute('title'),
      };
    });
    
    if (mindmapTexts) {
      console.log(`\n  🗺️ Mindmap component texts:`);
      Object.entries(mindmapTexts).forEach(([k, v]) => {
        if (!v) return;
        const cn = hasChinese(v);
        console.log(`     [${k}] "${v?.slice(0, 100)}" ${cn ? '🚨 CHINESE!' : '✅'}`);
        if (cn) {
          issues.push({
            component: 'mindmap-header/footer',
            issue: `Chinese in mindmap ${k}: "${v?.slice(0, 100)}"`,
            field: k,
          });
        }
      });
    }
    
    await page.screenshot({ path: `${SCREENSHOT_DIR}/${outPrefix}-mindmap.png`, fullPage: false });
  } else {
    console.log(`  ℹ️ No .mindmap-wrapper found on page (may need to scroll/navigate)`);
  }

  // ===== AUDIT 3: article-tabs panels - check button text =====
  const tabsNav = await page.$$('.article-tabs__nav .article-tabs__button');
  if (tabsNav.length > 0) {
    console.log(`\n  🗂️ Article tabs buttons:`);
    for (const btn of tabsNav) {
      const text = await btn.textContent();
      const cn = hasChinese(text || '');
      console.log(`     "${text?.trim()}" ${cn ? '🚨 CHINESE!' : '✅'}`);
      if (cn) {
        issues.push({
          component: 'article-tabs',
          issue: `Chinese in tab button: "${text?.trim()}"`,
        });
      }
    }
  }

  // ===== AUDIT 4: Scan for any Chinese text in main post content =====
  const chineseInContent = await page.evaluate(() => {
    const article = document.querySelector('.post-content, article, .article-container, main');
    if (!article) return [];
    
    const problems = [];
    const walker = document.createTreeWalker(
      article,
      NodeFilter.SHOW_TEXT,
      null,
    );
    
    let node;
    while ((node = walker.nextNode())) {
      const text = node.textContent?.trim();
      if (text && /[\u4e00-\u9fa5]/.test(text) && text.length > 3) {
        const parentClass = node.parentElement?.className?.toString() || '';
        const parentTag = node.parentElement?.tagName?.toLowerCase() || '';
        problems.push({
          text: text.slice(0, 80),
          parentClass: parentClass.slice(0, 60),
          parentTag,
        });
      }
    }
    
    return problems.slice(0, 30);
  });
  
  if (chineseInContent.length > 0) {
    console.log(`\n  🔴 Chinese text found in content for locale [${locale}]:`);
    chineseInContent.forEach(p => {
      // Skip known Chinese locale pages
      if (locale === 'zh-CN' || locale === 'zh-Hant') return;
      console.log(`     [${p.parentTag}.${p.parentClass?.slice(0,40)}] "${p.text}"`);
      issues.push({
        component: 'content-body',
        issue: `Untranslated Chinese in content: "${p.text}"`,
        parentClass: p.parentClass,
        parentTag: p.parentTag,
      });
    });
  } else {
    if (locale !== 'zh-CN' && locale !== 'zh-Hant') {
      console.log(`\n  ✅ No Chinese text found in main content for [${locale}]`);
    }
  }
  
  // Full page screenshot
  await page.screenshot({ path: `${SCREENSHOT_DIR}/${outPrefix}-fullpage.png`, fullPage: true });
  
  return issues;
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await ctx.newPage();
  
  const TARGET_POST_SLUG = 'content-formats-and-markup-mastery';
  
  const localesToTest = [
    { locale: 'es', path: `/es/posts/${TARGET_POST_SLUG}-es/` },
    { locale: 'en', path: `/en/posts/${TARGET_POST_SLUG}-en/` },
    { locale: 'fr', path: `/fr/posts/${TARGET_POST_SLUG}-fr/` },
    { locale: 'de', path: `/de/posts/${TARGET_POST_SLUG}-de/` },
  ];
  
  const allIssues = {};
  
  for (const { locale, path: urlPath } of localesToTest) {
    const url = `${LIVE_BASE}${urlPath}`;
    try {
      const issues = await auditPage(page, url, locale, `${locale}-content`);
      allIssues[locale] = issues;
    } catch (err) {
      console.error(`  ❌ Error auditing [${locale}]: ${err.message}`);
      allIssues[locale] = [{ error: err.message }];
    }
  }
  
  await browser.close();
  
  console.log('\n\n======== AUDIT SUMMARY ========');
  let totalIssues = 0;
  for (const [locale, issues] of Object.entries(allIssues)) {
    const relevant = issues.filter(i => !i.error);
    totalIssues += relevant.length;
    if (relevant.length > 0) {
      console.log(`\n❌ [${locale}] - ${relevant.length} issues:`);
      relevant.forEach((issue, idx) => {
        console.log(`   ${idx+1}. [${issue.component}] ${issue.issue?.slice(0, 120)}`);
      });
    } else {
      console.log(`\n✅ [${locale}] - No i18n issues detected`);
    }
  }
  
  console.log(`\n📊 Total issues found: ${totalIssues}`);
  
  // Save report
  const reportPath = path.resolve('scripts/audit_screenshots/component-issues/audit-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(allIssues, null, 2));
  console.log(`\n📄 Full report saved to: ${reportPath}`);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
