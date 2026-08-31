const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('http://127.0.0.1:4321/posts/content-formats-and-markup-mastery/', { waitUntil: 'networkidle' });

  const getActivePanelTokens = async () => {
    return await page.evaluate(() => {
      const pnl = document.querySelector('.article-dropdown-panel.is-active pre code');
      if (!pnl) return [];
      return Array.from(pnl.querySelectorAll('span')).map(s => ({
        text: s.textContent.trim(),
        class: s.className,
        color: window.getComputedStyle(s).color
      })).filter(x => x.text.length > 0 && x.text !== '复制');
    });
  };

  console.log("REACT PANEL TOKENS:", (await getActivePanelTokens()).slice(0, 8));

  // Select Vue
  await page.selectOption('.dropdown-switcher__select', 'vue-tab');
  await page.waitForTimeout(300);
  console.log("VUE PANEL TOKENS:", (await getActivePanelTokens()).slice(0, 8));

  // Select Astro
  await page.selectOption('.dropdown-switcher__select', 'astro-tab');
  await page.waitForTimeout(300);
  console.log("ASTRO PANEL TOKENS:", (await getActivePanelTokens()).slice(0, 8));

  // Select Svelte
  await page.selectOption('.dropdown-switcher__select', 'svelte-tab');
  await page.waitForTimeout(300);
  console.log("SVELTE PANEL TOKENS:", (await getActivePanelTokens()).slice(0, 8));

  await browser.close();
})();
