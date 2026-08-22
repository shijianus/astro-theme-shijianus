import { chromium } from 'playwright';
import fs from 'fs';

const viewports = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'laptop', width: 1024, height: 768 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'mobile', width: 390, height: 844 }
];

const testRoutes = [
  { name: 'home', path: '/' },
  { name: 'post-anzhiyu', path: '/posts/anzhiyu-markdown-showcase/' },
  { name: 'post-content', path: '/posts/content-first-homepage/' },
  { name: 'archives', path: '/archives/' },
  { name: 'categories', path: '/categories/' },
  { name: 'category-item', path: '/categories/前端工程/' },
  { name: 'tags', path: '/tags/' },
  { name: 'tag-item', path: '/tags/astro/' },
  { name: 'friends', path: '/friends/' },
  { name: 'about', path: '/about/' }
];

async function runDetailedAudit() {
  const browser = await chromium.launch({ headless: true });
  const allFindings = [];

  for (const vp of viewports) {
    for (const route of testRoutes) {
      const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height } });
      const url = `http://localhost:4321${route.path}`;

      try {
        await page.goto(url, { waitUntil: 'networkidle', timeout: 15000 });
        await page.waitForFunction(() => {
          const box = document.getElementById('loading-box');
          return !box || box.classList.contains('loaded') || window.getComputedStyle(box).opacity === '0' || window.getComputedStyle(box).display === 'none';
        }, { timeout: 5000 }).catch(() => {});
        await page.waitForTimeout(300);

        const checkResults = await page.evaluate((context) => {
          const { vpName, routeName, vpWidth } = context;
          const issues = [];

          // 1. Horizontal overflow
          const docEl = document.documentElement;
          if (docEl.scrollWidth > docEl.clientWidth + 1) {
            issues.push({
              level: 'ERROR',
              type: 'OVERFLOW',
              msg: `Horizontal scrollbar exists: scrollWidth ${docEl.scrollWidth}px > clientWidth ${docEl.clientWidth}px`
            });
          }

          // 2. Header layout and overlap check
          const header = document.querySelector('#page-header');
          if (header) {
            const headerRect = header.getBoundingClientRect();
            const navRight = document.querySelector('#nav-right');
            const blogName = document.querySelector('#blog_name');
            const menus = document.querySelector('#menus');
            const toggleMenu = document.querySelector('#toggle-menu');

            if (vpWidth >= 769 && menus && window.getComputedStyle(menus).display !== 'none') {
              const menusRect = menus.getBoundingClientRect();
              if (blogName) {
                const blogRect = blogName.getBoundingClientRect();
                if (menusRect.left < blogRect.right) {
                  issues.push({
                    level: 'ERROR',
                    type: 'HEADER_OVERLAP',
                    msg: `Desktop #menus overlaps with #blog_name by ${blogRect.right - menusRect.left}px`
                  });
                }
              }
              if (navRight) {
                const rightRect = navRight.getBoundingClientRect();
                if (menusRect.right > rightRect.left) {
                  issues.push({
                    level: 'ERROR',
                    type: 'HEADER_OVERLAP',
                    msg: `Desktop #menus overlaps with #nav-right by ${menusRect.right - rightRect.left}px`
                  });
                }
              }
            }

            if (vpWidth <= 768) {
              if (menus && window.getComputedStyle(menus).display !== 'none') {
                issues.push({
                  level: 'ERROR',
                  type: 'MOBILE_NAV_LEAK',
                  msg: `Desktop #menus is visible on mobile viewport (${vpWidth}px)`
                });
              }
            }
          }

          // 3. Home top alignment check
          const randomBanner = document.querySelector('#random-banner');
          const randomHover = document.querySelector('#random-hover');
          const catGroup = document.querySelector('.categoryGroup');
          if (randomBanner && catGroup && vpWidth >= 1200) {
            const rbRect = randomBanner.getBoundingClientRect();
            const catItems = Array.from(catGroup.querySelectorAll('.categoryItem'));
            if (catItems.length > 0) {
              const lastItem = catItems[catItems.length - 1];
              const lastRect = lastItem.getBoundingClientRect();
              const diffRight = Math.abs(rbRect.right - lastRect.right);
              if (diffRight > 1) {
                issues.push({
                  level: 'ERROR',
                  type: 'ALIGNMENT_HERO_RIGHT',
                  msg: `Right edge mismatch between #random-banner (${rbRect.right}px) and last categoryItem (${lastRect.right}px): diff ${diffRight}px`
                });
              }
            }
          }

          // 4. Aside widgets spacing check
          const asides = Array.from(document.querySelectorAll('#aside-content, #post-toc-aside, #post-secondary-aside'));
          for (const aside of asides) {
            if (window.getComputedStyle(aside).display === 'none') continue;
            const widgets = Array.from(aside.querySelectorAll('.card-widget')).filter(w => {
              const cs = window.getComputedStyle(w);
              return cs.display !== 'none' && cs.visibility !== 'hidden' && w.offsetHeight > 0;
            });

            for (let i = 0; i < widgets.length - 1; i++) {
              const r1 = widgets[i].getBoundingClientRect();
              const r2 = widgets[i + 1].getBoundingClientRect();
              const gap = r2.top - r1.bottom;
              if (gap < 4) {
                issues.push({
                  level: 'ERROR',
                  type: 'SIDEBAR_COLLAPSE',
                  msg: `Card spacing collapsed (${gap}px) between ${widgets[i].className.trim()} and ${widgets[i+1].className.trim()} in ${aside.id}`
                });
              } else if (gap > 32) {
                issues.push({
                  level: 'WARN',
                  type: 'SIDEBAR_GAP_LARGE',
                  msg: `Card spacing unusually large (${gap}px) between ${widgets[i].className.trim()} and ${widgets[i+1].className.trim()} in ${aside.id}`
                });
              }
            }
          }

          // 5. Post Content & Footer overlaps
          const postSections = [
            { el: document.querySelector('#article-container'), name: 'Article' },
            { el: document.querySelector('#post-copyright'), name: 'Copyright' },
            { el: document.querySelector('#pagination-post'), name: 'PostNav' },
            { el: document.querySelector('.relatedPosts'), name: 'RelatedPosts' },
            { el: document.querySelector('#post-comment'), name: 'Comments' }
          ].filter(item => item.el && window.getComputedStyle(item.el).display !== 'none');

          for (let i = 0; i < postSections.length - 1; i++) {
            const r1 = postSections[i].el.getBoundingClientRect();
            const r2 = postSections[i + 1].el.getBoundingClientRect();
            const gap = r2.top - r1.bottom;
            if (gap < 0) {
              issues.push({
                level: 'ERROR',
                type: 'POST_SECTION_OVERLAP',
                msg: `${postSections[i].name} overlaps with ${postSections[i+1].name} by ${Math.abs(gap)}px`
              });
            }
          }

          // 6. Article card alignment (2D AABB Collision Check)
          const postCards = Array.from(document.querySelectorAll('.recent-post-item'));
          for (let i = 0; i < postCards.length; i++) {
            for (let j = i + 1; j < postCards.length; j++) {
              const r1 = postCards[i].getBoundingClientRect();
              const r2 = postCards[j].getBoundingClientRect();
              // Check if rectangles actually intersect in 2D space
              const intersects = !(r2.left >= r1.right - 1 || 
                                   r2.right <= r1.left + 1 || 
                                   r2.top >= r1.bottom - 1 || 
                                   r2.bottom <= r1.top + 1);
              if (intersects) {
                issues.push({
                  level: 'ERROR',
                  type: 'POST_CARD_OVERLAP',
                  msg: `Post cards ${i} and ${j} physically collide in 2D space`
                });
              }
            }
          }

          return {
            vpName,
            routeName,
            vpWidth,
            issues
          };
        }, { vpName: vp.name, routeName: route.name, vpWidth: vp.width });

        allFindings.push(checkResults);

      } catch (err) {
        allFindings.push({
          vpName: vp.name,
          routeName: route.name,
          error: err.message
        });
      } finally {
        await page.close();
      }
    }
  }

  await browser.close();

  fs.writeFileSync('./scripts/detailed_audit_results.json', JSON.stringify(allFindings, null, 2));
  console.log('Detailed alignment audit finished. Results saved to scripts/detailed_audit_results.json');
}

runDetailedAudit().catch(console.error);
