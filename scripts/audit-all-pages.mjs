import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const routes = [
  { name: 'home', path: '/' },
  { name: 'post-markdown', path: '/posts/anzhiyu-markdown-showcase/' },
  { name: 'post-content', path: '/posts/content-first-homepage/' },
  { name: 'archives', path: '/archives/' },
  { name: 'categories-index', path: '/categories/' },
  { name: 'category-single', path: '/categories/前端工程/' },
  { name: 'tags-index', path: '/tags/' },
  { name: 'tag-single', path: '/tags/astro/' },
  { name: 'about', path: '/about/' },
  { name: 'friends', path: '/friends/' },
  { name: 'lab', path: '/lab/' },
  { name: 'roadmap', path: '/roadmap/' },
  { name: 'status', path: '/status/' }
];

const screenshotDir = './scripts/audit_screenshots';
if (!fs.existsSync(screenshotDir)) {
  fs.mkdirSync(screenshotDir, { recursive: true });
}

async function runAudit() {
  const browser = await chromium.launch({ headless: true });
  const results = [];

  for (const route of routes) {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    const url = `http://localhost:4321${route.path}`;
    
    try {
      await page.goto(url, { waitUntil: 'networkidle', timeout: 15000 });
      await page.waitForFunction(() => {
        const box = document.getElementById('loading-box');
        return !box || box.classList.contains('loaded') || window.getComputedStyle(box).opacity === '0' || window.getComputedStyle(box).display === 'none';
      }, { timeout: 5000 }).catch(() => {});
      await page.waitForTimeout(400);

      // Desktop screenshot
      const desktopImg = `${screenshotDir}/${route.name}_desktop.png`;
      await page.screenshot({ path: desktopImg, fullPage: false });

      // Page metrics analysis
      const analysis = await page.evaluate((routeName) => {
        const issues = [];
        const docWidth = document.documentElement.clientWidth;
        const scrollWidth = document.documentElement.scrollWidth;
        
        if (scrollWidth > docWidth + 1) {
          issues.push({
            type: 'HORIZONTAL_OVERFLOW',
            detail: `scrollWidth (${scrollWidth}px) > clientWidth (${docWidth}px)`
          });
        }

        // Header check
        const header = document.querySelector('#page-header');
        const headerRect = header ? header.getBoundingClientRect() : null;

        // Hero check
        const hero = document.querySelector('.page-shell__hero') || document.querySelector('.post-hero') || document.querySelector('#page-hero');
        const heroRect = hero ? hero.getBoundingClientRect() : null;

        // Content inner check
        const contentInner = document.querySelector('#content-inner') || document.querySelector('.post-layout-stack') || document.querySelector('main');
        const contentRect = contentInner ? contentInner.getBoundingClientRect() : null;

        // Aside check
        const asides = Array.from(document.querySelectorAll('#aside-content, #post-toc-aside, #post-secondary-aside, .post-layout-row__aside'));
        const asideData = asides.map((aside) => {
          const widgets = Array.from(aside.querySelectorAll('.card-widget')).filter(w => {
            const style = window.getComputedStyle(w);
            return style.display !== 'none' && style.visibility !== 'hidden';
          });

          const widgetGaps = [];
          for (let i = 0; i < widgets.length - 1; i++) {
            const w1 = widgets[i].getBoundingClientRect();
            const w2 = widgets[i + 1].getBoundingClientRect();
            const gap = w2.top - w1.bottom;
            widgetGaps.push({
              from: widgets[i].className.replace(/card-widget\s*/, '').trim() || widgets[i].id || `widget-${i}`,
              to: widgets[i + 1].className.replace(/card-widget\s*/, '').trim() || widgets[i + 1].id || `widget-${i + 1}`,
              gap: Math.round(gap * 100) / 100
            });
            if (gap < 4) {
              issues.push({
                type: 'SIDEBAR_ZERO_GAP',
                detail: `Gap between ${widgets[i].className} and ${widgets[i + 1].className} is only ${gap}px`
              });
            } else if (gap > 40) {
              issues.push({
                type: 'SIDEBAR_LARGE_GAP',
                detail: `Gap between ${widgets[i].className} and ${widgets[i + 1].className} is abnormally large: ${gap}px`
              });
            }
          }

          return {
            id: aside.id || aside.className,
            widgetCount: widgets.length,
            gaps: widgetGaps
          };
        });

        // Post specific footer sections check
        const articleContainer = document.querySelector('#article-container');
        const postCopyright = document.querySelector('#post-copyright');
        const postNav = document.querySelector('#pagination-post') || document.querySelector('.post-nav');
        const relatedPosts = document.querySelector('.relatedPosts') || document.querySelector('#related-posts');
        const postComments = document.querySelector('#post-comment') || document.querySelector('.post-comments');
        const footer = document.querySelector('#footer');

        const postSectionGaps = [];
        const checkGap = (el1, el2, name1, name2) => {
          if (el1 && el2) {
            const r1 = el1.getBoundingClientRect();
            const r2 = el2.getBoundingClientRect();
            const gap = r2.top - r1.bottom;
            postSectionGaps.push({ from: name1, to: name2, gap: Math.round(gap * 100) / 100 });
            if (gap < 0) {
              issues.push({
                type: 'OVERLAPPING_SECTIONS',
                detail: `${name1} and ${name2} overlap by ${Math.abs(gap)}px`
              });
            } else if (gap > 80) {
              issues.push({
                type: 'EXCESSIVE_SECTION_GAP',
                detail: `Gap between ${name1} and ${name2} is ${gap}px`
              });
            }
          }
        };

        checkGap(articleContainer, postCopyright, 'Article', 'Copyright');
        checkGap(postCopyright, postNav, 'Copyright', 'PostNav');
        checkGap(postNav, relatedPosts, 'PostNav', 'RelatedPosts');
        checkGap(relatedPosts, postComments, 'RelatedPosts', 'Comments');
        checkGap(contentInner, footer, 'MainContent', 'Footer');

        return {
          routeName,
          docWidth,
          scrollWidth,
          headerHeight: headerRect ? headerRect.height : null,
          heroRect: heroRect ? { top: heroRect.top, height: heroRect.height } : null,
          contentRect: contentRect ? { top: contentRect.top, width: contentRect.width } : null,
          asideData,
          postSectionGaps,
          issues
        };
      }, route.name);

      // Mobile check
      await page.setViewportSize({ width: 390, height: 844 });
      await page.waitForTimeout(200);
      const mobileImg = `${screenshotDir}/${route.name}_mobile.png`;
      await page.screenshot({ path: mobileImg, fullPage: false });

      const mobileAnalysis = await page.evaluate((routeName) => {
        const issues = [];
        const docWidth = document.documentElement.clientWidth;
        const scrollWidth = document.documentElement.scrollWidth;
        if (scrollWidth > docWidth + 1) {
          issues.push({
            type: 'MOBILE_HORIZONTAL_OVERFLOW',
            detail: `Mobile scrollWidth (${scrollWidth}px) > clientWidth (${docWidth}px)`
          });
        }
        return { issues };
      }, route.name);

      analysis.mobileIssues = mobileAnalysis.issues;
      results.push(analysis);

    } catch (err) {
      results.push({
        routeName: route.name,
        error: err.message
      });
    } finally {
      await page.close();
    }
  }

  await browser.close();

  fs.writeFileSync('./scripts/audit_report.json', JSON.stringify(results, null, 2));
  console.log('Audit completed. Report saved to scripts/audit_report.json');
}

runAudit().catch(console.error);
