import { chromium } from 'playwright';

const BASE_URL = 'https://blog.epocanvas.com';

async function inspect() {
  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true
  });
  const page = await context.newPage();

  console.log('=== Inspecting Home Nav on Mobile ===');
  await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' });
  
  const navDetails = await page.evaluate(() => {
    const nav = document.getElementById('nav');
    const allLinks = Array.from(nav.querySelectorAll('a, button, div[class*="btn"], div[class*="menu"], div[class*="icon"]')).map(el => ({
      tag: el.tagName,
      id: el.id,
      className: el.className,
      text: el.innerText.trim(),
      display: window.getComputedStyle(el).display,
      visibility: window.getComputedStyle(el).visibility,
      rect: el.getBoundingClientRect()
    }));
    return {
      navInnerHtmlSnippet: nav ? nav.innerHTML.slice(0, 1000) : null,
      elements: allLinks
    };
  });
  console.log('Nav Elements on Mobile:', JSON.stringify(navDetails.elements, null, 2));

  console.log('\n=== Inspecting Sidebar Menus / Drawer (#sidebar-menus) ===');
  const sidebarDetails = await page.evaluate(() => {
    const sidebar = document.getElementById('sidebar-menus');
    const toggle = document.getElementById('toggle-menu');
    return {
      toggleExists: !!toggle,
      toggleDisplay: toggle ? window.getComputedStyle(toggle).display : 'none',
      sidebarExists: !!sidebar,
      sidebarDisplay: sidebar ? window.getComputedStyle(sidebar).display : 'none',
      sidebarClass: sidebar ? sidebar.className : '',
      sidebarInnerHtml: sidebar ? sidebar.innerHTML.slice(0, 1500) : ''
    };
  });
  console.log('Sidebar Details:', sidebarDetails);

  // Click toggle menu and see what happens to sidebar-menus and mask
  if (sidebarDetails.toggleExists) {
    await page.click('#toggle-menu');
    await page.waitForTimeout(600);
    const afterClick = await page.evaluate(() => {
      const sidebar = document.getElementById('sidebar-menus');
      const mask = document.getElementById('menu-mask');
      return {
        sidebarClass: sidebar ? sidebar.className : '',
        sidebarTransform: sidebar ? window.getComputedStyle(sidebar).transform : '',
        sidebarLeft: sidebar ? sidebar.getBoundingClientRect().left : null,
        maskDisplay: mask ? window.getComputedStyle(mask).display : null,
        maskOpacity: mask ? window.getComputedStyle(mask).opacity : null
      };
    });
    console.log('Sidebar after clicking toggle:', afterClick);
    await page.screenshot({ path: 'scripts/audit_screenshots/mobile_audit/04_sidebar_opened.png' });
  }

  console.log('\n=== Inspecting Article Page Elements ===');
  await page.goto(`${BASE_URL}/posts/content-formats-and-markup-mastery/`, { waitUntil: 'networkidle' });
  
  const articleDetails = await page.evaluate(() => {
    const postHero = document.querySelector('.post-hero, #post-hero');
    const heroTitle = document.querySelector('.post-hero__title, h1');
    const rewardBtn = document.querySelector('#reward-button, .reward-button, [class*="reward"], [class*="sponsor"]');
    const aiCard = document.querySelector('#post-ai-summary, .ai-summary, [class*="ai-summary"], [class*="aiCard"]');
    const rightside = document.getElementById('rightside');
    const rightsideBtns = rightside ? Array.from(rightside.querySelectorAll('button, a')).map(b => ({
      id: b.id,
      className: b.className,
      title: b.getAttribute('title') || b.getAttribute('aria-label') || b.innerText.trim(),
      display: window.getComputedStyle(b).display,
      rect: b.getBoundingClientRect()
    })) : [];

    const aside = document.getElementById('aside-content');
    return {
      postHeroFound: !!postHero,
      heroTitleText: heroTitle ? heroTitle.innerText : null,
      heroTitleClass: heroTitle ? heroTitle.className : null,
      rewardBtnFound: !!rewardBtn,
      rewardBtnOuterHtml: rewardBtn ? rewardBtn.outerHTML.slice(0, 300) : null,
      aiCardFound: !!aiCard,
      asideDisplay: aside ? window.getComputedStyle(aside).display : 'none',
      rightsideBtns
    };
  });
  console.log('Article Details:', JSON.stringify(articleDetails, null, 2));

  await browser.close();
}

inspect().catch(console.error);
