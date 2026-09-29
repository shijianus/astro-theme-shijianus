import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  let consoleErrors = 0;
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors++;
      // console.error(`Page Error: ${msg.text()}`);
    }
  });

  page.on('pageerror', err => {
    consoleErrors++;
    console.error(`Uncaught Exception: ${err.message}`);
  });

  try {
    console.log("Navigating to https://blog.epocanvas.com...");
    await page.goto('https://blog.epocanvas.com/', { waitUntil: 'networkidle' });
    
    // Check if any element has class card-snow-svg
    let hasSnow = await page.$$('.card-snow-svg');
    if (hasSnow.length === 0) {
        // Force snow background
        await page.evaluate(() => {
            document.documentElement.setAttribute('data-background', 'snow');
            window.dispatchEvent(new Event('resize'));
        });
        try {
           await page.waitForSelector('.card-snow-svg', { timeout: 5000 });
        } catch (e) {
           console.log("Still no snow. Let's see if we can trigger the global toggle if it exists...");
           // try to click background toggle if it exists
           const toggle = await page.$('#bg-snow-btn, .bg-snow, [data-bg="snow"]');
           if (toggle) {
               await toggle.click();
               await page.waitForTimeout(2000);
           }
        }
    }
    
    await page.waitForTimeout(1000); // Give it time to render

    const auditResults = await page.evaluate(async () => {
      const results = {
        snowElementsFound: 0,
        edgesThin: true,
        edgeThicknesses: [],
        centerHeights: [],
        paths: [],
        gaps: [],
        verticalHeadrooms: []
      };

      const snowSvgs = document.querySelectorAll('.card-snow-svg');
      results.snowElementsFound = snowSvgs.length;
      
      snowSvgs.forEach(svg => {
        const top = parseFloat(getComputedStyle(svg).getPropertyValue('--snow-svg-top') || '0');
        const rise = -top;
        if (rise > 0) {
            results.centerHeights.push(Math.round(rise));
        }

        const path = svg.querySelector('.snow-body');
        if (path) {
            const d = path.getAttribute('d');
            const matchStart = d.match(/M\s*0\s*([\d.]+)/);
            if (matchStart) {
                // Approximate thickness at left edge
                const y = parseFloat(matchStart[1]);
                results.edgeThicknesses.push(Math.round(Math.abs(y - rise))); 
                // wait, rise is the top offset. y is the coordinate inside SVG.
            }
        }
      });
      
      // Horizontal gaps
      const recentPosts = document.querySelectorAll('.recent-post-item');
      if (recentPosts.length >= 2) {
         for (let i = 0; i < recentPosts.length - 1; i++) {
             const rect1 = recentPosts[i].getBoundingClientRect();
             const rect2 = recentPosts[i+1].getBoundingClientRect();
             if (rect1.top === rect2.top) { // same row
                 const gap = rect2.left - rect1.right;
                 results.gaps.push(Math.round(gap));
             }
         }
      }
      
      // Vertical headrooms 
      const categoryBar = document.querySelector('.category-bar');
      if (categoryBar) {
          let prev = categoryBar.previousElementSibling;
          while (prev && (prev.offsetParent === null || window.getComputedStyle(prev).display === 'none')) {
            prev = prev.previousElementSibling;
          }
          if (prev) {
             const catRect = categoryBar.getBoundingClientRect();
             const prevRect = prev.getBoundingClientRect();
             results.verticalHeadrooms.push(Math.round(catRect.top - prevRect.bottom));
          }
      }

      return results;
    });

    console.log("Audit Results:", JSON.stringify(auditResults, null, 2));

    // Dynamic hover
    console.log("Testing dynamic hover...");
    const postItems = await page.$$('.recent-post-item');
    if (postItems.length > 0) {
        // scroll into view
        await postItems[0].scrollIntoViewIfNeeded();
        await page.waitForTimeout(500);
        
        await postItems[0].hover({ force: true });
        await page.waitForTimeout(500);
        console.log("Hover applied.");
    }

    console.log("Testing scrolling...");
    await page.evaluate(() => window.scrollBy(0, 1500));
    await page.waitForTimeout(1000);
    console.log(`Console errors after interaction: ${consoleErrors}`);

  } catch (error) {
    console.error("Audit failed:", error);
  } finally {
    await browser.close();
  }
})();
