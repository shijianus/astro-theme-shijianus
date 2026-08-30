const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 1440, height: 1080 } });
  const page = await context.newPage();

  console.log("Navigating to http://127.0.0.1:4322/posts/content-formats-and-markup-mastery/ ...");
  await page.goto('http://127.0.0.1:4322/posts/content-formats-and-markup-mastery/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);

  const outDir = '/home/shijian/projects/shijianus-blog';

  // 1. Interactive Task Tracker & Chained Progression
  console.log("Capturing Task Tracker...");
  const taskTracker = await page.$('.article-task-tracker');
  if (taskTracker) {
    await taskTracker.scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(outDir, 'verify-01-task-tracker-initial.png') });

    // Click checkboxes to trigger reactive update
    const checkboxes = await page.$$('.article-task-tracker input[type="checkbox"]');
    for (const cb of checkboxes) {
      const isChecked = await cb.isChecked();
      if (!isChecked) {
        await cb.click();
        await page.waitForTimeout(150);
      }
    }
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(outDir, 'verify-02-task-tracker-completed.png') });
    console.log("Saved: verify-01 & 02 task tracker");
  }

  // 2. Video Embeds (Bilibili + YouTube + Native MP4s)
  console.log("Capturing Video Embeds...");
  const videoSection = await page.$('h3:has-text("video")');
  if (videoSection) {
    await videoSection.scrollIntoViewIfNeeded();
    await page.waitForTimeout(800);
    await page.screenshot({ path: path.join(outDir, 'verify-03-video-embeds.png') });
    console.log("Saved: verify-03-video-embeds.png");
  }

  // 3. Audio Cards (FLAC, MP3, M4A)
  console.log("Capturing Audio Cards...");
  const audioSection = await page.$('h3:has-text("audio")');
  if (audioSection) {
    await audioSection.scrollIntoViewIfNeeded();
    await page.waitForTimeout(800);
    await page.screenshot({ path: path.join(outDir, 'verify-04-audio-cards.png') });
    console.log("Saved: verify-04-audio-cards.png");
  }

  // 4. Chat Dialogue (Léon Boven + Green answer bubble)
  console.log("Capturing Chat Dialogue...");
  const chatDialogue = await page.$('.article-chat');
  if (chatDialogue) {
    await chatDialogue.scrollIntoViewIfNeeded();
    await page.waitForTimeout(600);
    await page.screenshot({ path: path.join(outDir, 'verify-05-chat-dialogue.png') });
    console.log("Saved: verify-05-chat-dialogue.png");
  }

  // 5. Accordions (Exclusive & Non-exclusive)
  console.log("Capturing Accordions...");
  const exclusiveAcc = await page.$('h3:has-text("互斥手风琴")');
  if (exclusiveAcc) {
    await exclusiveAcc.scrollIntoViewIfNeeded();
    await page.waitForTimeout(600);
    await page.screenshot({ path: path.join(outDir, 'verify-06-accordions-exclusive.png') });
  }

  const nonExclusiveAcc = await page.$('h3:has-text("非互斥独立手风琴")');
  if (nonExclusiveAcc) {
    await nonExclusiveAcc.scrollIntoViewIfNeeded();
    await page.waitForTimeout(600);
    await page.screenshot({ path: path.join(outDir, 'verify-06-accordions-nonexclusive.png') });
    console.log("Saved: verify-06 accordions");
  }

  // 6. Foldable Admonition (Tip)
  console.log("Capturing Foldable Admonition (Tip)...");
  const tipAdmonition = await page.$('.admonition-details.admonition-tip');
  if (tipAdmonition) {
    await tipAdmonition.scrollIntoViewIfNeeded();
    await page.waitForTimeout(600);
    await page.screenshot({ path: path.join(outDir, 'verify-07-foldable-tip-closed.png') });

    await tipAdmonition.click();
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(outDir, 'verify-08-foldable-tip-opened.png') });
    console.log("Saved: verify-07 & 08 foldable tip");
  }

  // 7. Mermaid Diagrams (Flowchart & Sequence)
  console.log("Capturing Mermaid 11 Diagrams...");
  const flowchartDiagram = await page.$('.mermaid-diagram-wrap');
  if (flowchartDiagram) {
    await flowchartDiagram.scrollIntoViewIfNeeded();
    await page.waitForTimeout(800);
    await page.screenshot({ path: path.join(outDir, 'verify-09-mermaid-flowchart.png') });
  }

  const mermaidWraps = await page.$$('.mermaid-diagram-wrap');
  if (mermaidWraps.length > 1) {
    await mermaidWraps[1].scrollIntoViewIfNeeded();
    await page.waitForTimeout(800);
    await page.screenshot({ path: path.join(outDir, 'verify-10-mermaid-sequence.png') });
    console.log("Saved: verify-09 & 10 mermaid diagrams");
  }

  console.log("All visual verification screenshots captured successfully!");
  await browser.close();
})();
