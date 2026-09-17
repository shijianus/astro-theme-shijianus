import { chromium } from 'playwright';

async function test() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  page.on('console', (msg) => console.log('[LOG]', msg.type(), msg.text()));

  console.log('1. Go to post page');
  await page.goto('https://blog.epocanvas.com/posts/content-formats-and-markup-mastery/', { waitUntil: 'networkidle' });
  console.log('Current URL:', page.url());

  // Check language elements in page
  const langElements = await page.evaluate(() => {
    const selector = '[data-locale], [data-lang], .lang-select, .language-selector, select, [class*="locale"], [class*="lang"]';
    return Array.from(document.querySelectorAll(selector)).map((el) => ({
      tag: el.tagName,
      className: el.className,
      id: el.id,
      text: (el.textContent || '').trim().slice(0, 60),
    }));
  });
  console.log('Language elements found:', langElements);

  // Check how language is selected in ThemeOverlays / ThemeDock / Account Drawer
  const buttons = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('button, a')).map(b => ({
      text: b.textContent.trim().slice(0, 40),
      id: b.id,
      className: b.className,
      href: b.getAttribute('href')
    })).filter(b => b.text.includes('文') || b.text.includes('语') || b.text.includes('Lang') || b.text.includes('English') || b.text.includes('繁'));
  });
  console.log('Language-related buttons:', buttons);

  await browser.close();
}

test().catch(console.error);
