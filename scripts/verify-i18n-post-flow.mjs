import { chromium } from 'playwright';

const BASE_URL = process.env.TEST_BASE_URL || 'http://127.0.0.1:4399';

async function runTests() {
  console.log('===============================================================');
  console.log(`[E2E Verification] Testing i18n URL Navigation & Component Localization`);
  console.log(`Target: ${BASE_URL}`);
  console.log('===============================================================\n');

  const browser = await chromium.launch({ headless: true });
  let totalTests = 0;
  let passedTests = 0;
  let failedTests = 0;

  function assert(condition, desc) {
    totalTests++;
    if (condition) {
      passedTests++;
      console.log(`  ✅ [PASS] ${desc}`);
    } else {
      failedTests++;
      console.error(`  ❌ [FAIL] ${desc}`);
    }
  }

  // Group 1: Verify No URL Hijacking when user has zh-CN stored in localStorage
  console.log('--- Test Group 1: Explicit URL Navigation Persistence (No Hijacking) ---');
  const localesToTest = [
    { lang: 'en', slug: 'content-formats-and-markup-mastery-en', expectedSub: 'en' },
    { lang: 'es', slug: 'content-formats-and-markup-mastery-es', expectedSub: 'es' },
    { lang: 'de', slug: 'content-formats-and-markup-mastery-de', expectedSub: 'de' },
    { lang: 'fr', slug: 'content-formats-and-markup-mastery-fr', expectedSub: 'fr' },
    { lang: 'zh-hant', slug: 'content-formats-and-markup-mastery-zh-hant', expectedSub: 'zh-hant' },
    { lang: 'zh-CN', slug: 'content-formats-and-markup-mastery', expectedSub: 'content-formats-and-markup-mastery' },
    // Cross-article verification
    { lang: 'en', slug: 'example-embeds-en', expectedSub: 'example-embeds-en' },
    { lang: 'es', slug: 'example-embeds-es', expectedSub: 'example-embeds-es' },
    { lang: 'en', slug: 'badges-guide-en', expectedSub: 'badges-guide-en' },
  ];

  for (const item of localesToTest) {
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.addInitScript(() => {
      window.localStorage.setItem('shijianus-manual-locale-selected', 'zh-CN');
    });

    const targetUrl = `${BASE_URL}/posts/${item.slug}/`;
    await page.goto(targetUrl, { waitUntil: 'networkidle', timeout: 30000 });
    const finalUrl = page.url();
    assert(
      finalUrl.includes(item.slug),
      `Navigating to /posts/${item.slug}/ persists on target URL (Final URL: ${finalUrl})`
    );
    await context.close();
  }

  // Group 2: PostHero Translation Switcher UI & Interactive Switching
  console.log('\n--- Test Group 2: PostHero Translation Switcher Interaction ---');
  {
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto(`${BASE_URL}/posts/content-formats-and-markup-mastery-en/`, { waitUntil: 'networkidle' });

    const switcherExists = await page.locator('.post-hero__translations').isVisible();
    assert(switcherExists, 'PostHero .post-hero__translations switcher is rendered and visible');

    const activeLangText = await page.locator('.post-hero__lang-tag.is-active').textContent();
    assert(activeLangText?.trim() === 'English', `Active language tag displays "English" (Actual: "${activeLangText?.trim()}")`);

    // Click Spanish translation link
    const esLink = page.locator('.post-hero__lang-tag[data-target-lang="es"]');
    const esLinkCount = await esLink.count();
    assert(esLinkCount === 1, 'Spanish translation link exists in PostHero');

    await esLink.click();
    await page.waitForURL(/content-formats-and-markup-mastery-es/);
    const newUrl = page.url();
    assert(newUrl.includes('content-formats-and-markup-mastery-es'), `Clicking Spanish link navigates to Spanish post (URL: ${newUrl})`);

    const newActiveLang = await page.locator('.post-hero__lang-tag.is-active').textContent();
    assert(newActiveLang?.trim() === 'Español', `Active tag in new page is "Español" (Actual: "${newActiveLang?.trim()}")`);

    await context.close();
  }

  // Group 3: Component Localization (Chat, Task Tracker) across all 5 languages
  console.log('\n--- Test Group 3: Component Localization (Chat & Task Tracker) ---');
  const componentExpectations = [
    {
      lang: 'en',
      url: `${BASE_URL}/posts/content-formats-and-markup-mastery-en/`,
      chatTitle: 'Live Dialogue Stream Simulation',
      chatBadge: 'Scroll-in Animation',
      chatReplay: '↺ Replay',
      taskBadgeSnippet: 'Progress',
    },
    {
      lang: 'es',
      url: `${BASE_URL}/posts/content-formats-and-markup-mastery-es/`,
      chatTitle: 'Simulación de Diálogo en Vivo',
      chatBadge: 'Animación al Desplazarse',
      chatReplay: '↺ Reproducir',
      taskBadgeSnippet: 'preparación',
    },
    {
      lang: 'de',
      url: `${BASE_URL}/posts/content-formats-and-markup-mastery-de/`,
      chatTitle: 'Echtzeit-Dialogsimulation',
      chatBadge: 'Scroll-in-Animation',
      chatReplay: '↺ Wiederholen',
      taskBadgeSnippet: 'Vorbereitung',
    },
    {
      lang: 'fr',
      url: `${BASE_URL}/posts/content-formats-and-markup-mastery-fr/`,
      chatTitle: 'Simulation de Dialogue en Direct',
      chatBadge: 'Animation au Défilement',
      chatReplay: '↺ Rejouer',
      taskBadgeSnippet: 'attente',
    },
    {
      lang: 'zh-hant',
      url: `${BASE_URL}/posts/content-formats-and-markup-mastery-zh-hant/`,
      chatTitle: '即時對話模擬流',
      chatBadge: '首次滑入動效',
      chatReplay: '↺ 重播',
      taskBadgeSnippet: '待辦',
    },
  ];

  for (const exp of componentExpectations) {
    const context = await browser.newContext();
    const page = await context.newPage();
    // Simulate user with default zh-CN stored preference
    await page.addInitScript(() => {
      window.localStorage.setItem('shijianus-manual-locale-selected', 'zh-CN');
    });
    await page.goto(exp.url, { waitUntil: 'networkidle' });

    // 1. Check chat header localization
    const chatTitle = await page.locator('.chat-header-title').textContent();
    assert(
      chatTitle?.trim() === exp.chatTitle,
      `[${exp.lang}] Chat title is "${exp.chatTitle}" (Actual: "${chatTitle?.trim()}")`
    );

    const chatBadge = await page.locator('.chat-header-badge').textContent();
    assert(
      chatBadge?.trim() === exp.chatBadge,
      `[${exp.lang}] Chat badge is "${exp.chatBadge}" (Actual: "${chatBadge?.trim()}")`
    );

    const chatReplay = await page.locator('.chat-replay-btn').textContent();
    assert(
      chatReplay?.trim() === exp.chatReplay,
      `[${exp.lang}] Chat replay button is "${exp.chatReplay}" (Actual: "${chatReplay?.trim()}")`
    );

    // 2. Check task tracker status card localization
    const taskStatusCardText = await page.locator('.task-tracker__status-card').textContent();
    assert(
      taskStatusCardText?.includes(exp.taskBadgeSnippet),
      `[${exp.lang}] Task tracker contains "${exp.taskBadgeSnippet}" (Snippet: "${taskStatusCardText?.slice(0, 40).trim()}")`
    );

    // Ensure no Chinese fallback in non-Chinese languages
    if (exp.lang !== 'zh-hant') {
      const hasPendingChinese = taskStatusCardText?.includes('待办就绪中');
      assert(!hasPendingChinese, `[${exp.lang}] Task tracker does NOT leak Chinese "待办就绪中"`);

      const hasChatChinese = chatTitle?.includes('实时对话模拟流') || chatBadge?.includes('首次滑入动效') || chatReplay?.includes('重播');
      assert(!hasChatChinese, `[${exp.lang}] Chat components do NOT leak Chinese strings`);
    }

    await context.close();
  }

  await browser.close();

  console.log('\n===============================================================');
  console.log(`[E2E Results] Total: ${totalTests} | Passed: ${passedTests} | Failed: ${failedTests}`);
  console.log('===============================================================\n');

  if (failedTests > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('[E2E Fatal Error]', err);
  process.exit(1);
});
