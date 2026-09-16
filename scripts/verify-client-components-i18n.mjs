import http from 'http';
import fs from 'fs';
import path from 'path';
import { chromium } from 'playwright';

const DIST_DIR = path.resolve('dist');
const PORT = 4398;

function startStaticServer() {
  const mimeTypes = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.woff2': 'font/woff2',
    '.woff': 'font/woff',
  };

  const server = http.createServer((req, res) => {
    let reqPath = decodeURIComponent(req.url.split('?')[0]);
    if (reqPath.endsWith('/')) reqPath += 'index.html';
    let filePath = path.join(DIST_DIR, reqPath);

    if (!fs.existsSync(filePath)) {
      if (fs.existsSync(filePath + '.html')) {
        filePath += '.html';
      } else if (fs.existsSync(path.join(filePath, 'index.html'))) {
        filePath = path.join(filePath, 'index.html');
      } else {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('404 Not Found');
        return;
      }
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = mimeTypes[ext] || 'application/octet-stream';

    fs.readFile(filePath, (err, content) => {
      if (err) {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('500 Server Error');
      } else {
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(content);
      }
    });
  });

  return new Promise((resolve) => {
    server.listen(PORT, '127.0.0.1', () => {
      console.log(`[StaticServer] Serving ${DIST_DIR} on http://127.0.0.1:${PORT}`);
      resolve(server);
    });
  });
}

const TEST_CASES = [
  {
    locale: 'es',
    url: `http://127.0.0.1:${PORT}/posts/content-formats-and-markup-mastery-es/`,
    chatTitle: 'Simulación de Diálogo en Vivo',
    chatBadge: 'Animación al Desplazarse',
    chatReplay: '↺ Reproducir',
    chatSoundTitle: 'Efectos de sonido activados',
    taskBadge: '⏳ Pendiente de preparación',
    taskProgress: 'Progreso actual: 1/4 (25%)',
    taskSteps: '1/4 pasos completados (25%)',
    copyBtn: 'Copiar',
  },
  {
    locale: 'de',
    url: `http://127.0.0.1:${PORT}/posts/content-formats-and-markup-mastery-de/`,
    chatTitle: 'Echtzeit-Dialogsimulation',
    chatBadge: 'Scroll-in-Animation',
    chatReplay: '↺ Wiederholen',
    chatSoundTitle: 'Soundeffekte aktiviert',
    taskBadge: '⏳ Vorbereitung ausstehend',
    taskProgress: 'Aktueller Fortschritt: 1/4 (25%)',
    taskSteps: '1/4 Schritte abgeschlossen (25%)',
    copyBtn: 'Kopieren',
  },
  {
    locale: 'fr',
    url: `http://127.0.0.1:${PORT}/posts/content-formats-and-markup-mastery-fr/`,
    chatTitle: 'Simulation de Dialogue en Direct',
    chatBadge: 'Animation au Défilement',
    chatReplay: '↺ Rejouer',
    chatSoundTitle: 'Effets sonores activés',
    taskBadge: '⏳ En attente de préparation',
    taskProgress: 'Progression actuelle : 1/4 (25%)',
    taskSteps: '1/4 étapes terminées (25%)',
    copyBtn: 'Copier',
  },
  {
    locale: 'en',
    url: `http://127.0.0.1:${PORT}/posts/content-formats-and-markup-mastery-en/`,
    chatTitle: 'Live Dialogue Stream Simulation',
    chatBadge: 'Scroll-in Animation',
    chatReplay: '↺ Replay',
    chatSoundTitle: 'Sound enabled',
    taskBadge: '⏳ In Progress',
    taskProgress: 'Current Progress: 1/4 (25%)',
    taskSteps: '1/4 steps completed (25%)',
    copyBtn: 'Copy',
  },
  {
    locale: 'zh-Hant',
    url: `http://127.0.0.1:${PORT}/posts/content-formats-and-markup-mastery-zh-hant/`,
    chatTitle: '即時對話模擬流',
    chatBadge: '首次滑入動效',
    chatReplay: '↺ 重播',
    chatSoundTitle: '音效開啟中',
    taskBadge: '⏳ 待辦就緒中',
    taskProgress: '目前進度：1/4 (25%)',
    taskSteps: '1/4 步驟已完成 (25%)',
    copyBtn: '複製',
  },
];

async function runAudit() {
  const server = await startStaticServer();
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      failed++;
    }
  }

  try {
    for (const tc of TEST_CASES) {
      console.log(`\n========================================`);
      console.log(`Auditing Locale: [${tc.locale}] -> ${tc.url}`);
      console.log(`========================================`);

      const resp = await page.goto(tc.url, { waitUntil: 'networkidle', timeout: 30000 });
      assert(resp.status() === 200, `Page HTTP Status 200`);

      // 1. Audit Article Chat Component (client hydrated headerBar)
      const chatContainer = await page.$('.article-chat');
      assert(!!chatContainer, `Found .article-chat element`);

      if (chatContainer) {
        // Scroll into view to trigger animation & headerBar injection if needed
        await chatContainer.scrollIntoViewIfNeeded();
        await page.waitForTimeout(400);

        const chatHeader = await page.$('.chat-header-bar');
        assert(!!chatHeader, `Found .chat-header-bar injected in DOM`);

        const chatTitle = await page.$eval('.chat-header-title', el => el.textContent.trim());
        assert(chatTitle === tc.chatTitle, `Chat Header Title matches "${tc.chatTitle}" (Actual: "${chatTitle}")`);

        const chatBadge = await page.$eval('.chat-header-badge', el => el.textContent.trim());
        assert(chatBadge === tc.chatBadge, `Chat Header Badge matches "${tc.chatBadge}" (Actual: "${chatBadge}")`);

        const replayBtn = await page.$eval('.chat-replay-btn', el => el.textContent.trim());
        assert(replayBtn === tc.chatReplay, `Chat Replay Button text matches "${tc.chatReplay}" (Actual: "${replayBtn}")`);

        const soundBtnTitle = await page.$eval('.chat-sound-toggle', el => el.getAttribute('title'));
        assert(soundBtnTitle === tc.chatSoundTitle, `Chat Sound Toggle title matches "${tc.chatSoundTitle}" (Actual: "${soundBtnTitle}")`);
      }

      // 2. Audit Task Tracker Component (client hydrated progress & status card)
      const tracker = await page.$('.article-task-tracker');
      assert(!!tracker, `Found .article-task-tracker element`);

      if (tracker) {
        const countLabel = await page.$eval('.task-tracker__count', el => el.textContent.trim());
        assert(countLabel === tc.taskSteps, `Task Count Label matches "${tc.taskSteps}" (Actual: "${countLabel}")`);

        const statusBadge = await page.$eval('.task-tracker__status-card .badge', el => el.textContent.trim());
        assert(statusBadge === tc.taskBadge, `Task Status Badge matches "${tc.taskBadge}" (Actual: "${statusBadge}")`);

        const statusProgress = await page.$eval('.status-card__header span:nth-child(2)', el => el.textContent.trim());
        assert(statusProgress === tc.taskProgress, `Task Status Progress matches "${tc.taskProgress}" (Actual: "${statusProgress}")`);

        // Test interactive click on checkbox (checking all boxes toggles completion)
        const unchecked = await page.$$('.article-task-tracker input[type="checkbox"]:not(:checked)');
        for (const cb of unchecked) {
          await cb.click();
        }
        await page.waitForTimeout(200);

        const completedBadge = await page.$eval('.task-tracker__status-card .badge', el => el.textContent.trim());
        assert(!completedBadge.includes('待办') && !completedBadge.includes('⏳'), `Completed status card correctly unlocked in target locale (Badge: "${completedBadge}")`);
      }

      // 3. Audit Code Copy Button
      const copyBtnText = await page.$eval('.code-copy-button span', el => el.textContent.trim());
      assert(copyBtnText === tc.copyBtn, `Code Block Copy button text matches "${tc.copyBtn}" (Actual: "${copyBtnText}")`);

      // 4. Residual Chinese verification in chat and task tracker components for non-Chinese locales
      if (tc.locale !== 'zh-Hant') {
        const chatHtml = await page.$eval('.article-chat', el => el.innerHTML);
        // Exclude avatar images or names if any, test header bar
        const chatHeaderHtml = await page.$eval('.chat-header-bar', el => el.innerHTML);
        const zhInChatHeader = chatHeaderHtml.match(/[\u4e00-\u9fa5]/g) || [];
        assert(zhInChatHeader.length === 0, `Zero residual Chinese in .chat-header-bar (Found: ${zhInChatHeader.join('')})`);

        const trackerHtml = await page.$eval('.task-tracker__status-card', el => el.innerHTML);
        const zhInTracker = trackerHtml.match(/[\u4e00-\u9fa5]/g) || [];
        assert(zhInTracker.length === 0, `Zero residual Chinese in .task-tracker__status-card (Found: ${zhInTracker.join('')})`);
      }
    }

    console.log(`\n========================================`);
    console.log(`AUDIT COMPLETE: ${passed} PASSED, ${failed} FAILED`);
    console.log(`========================================`);

    if (failed > 0) {
      process.exit(1);
    }
  } finally {
    await browser.close();
    server.close();
  }
}

runAudit().catch((err) => {
  console.error('Fatal error during audit:', err);
  process.exit(1);
});
