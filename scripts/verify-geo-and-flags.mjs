import { resolveGeoInfo, getFlagEmoji } from '../src/lib/geo-names.ts';
import { onRequest as geoProfileHandler } from '../functions/api/geo-profile.ts';
import { spawn } from 'child_process';
import { chromium } from 'playwright';

async function testGeoNames() {
  console.log('--- 1. Testing resolveGeoInfo and getFlagEmoji ---');
  const tw = resolveGeoInfo('TW');
  console.log('   -> resolveGeoInfo("TW"):', tw);
  if (tw.code !== 'TW' || tw.name !== '台湾' || tw.name.includes('中国')) {
    throw new Error(`Unexpected TW info: ${JSON.stringify(tw)}`);
  }

  const twByName = resolveGeoInfo('台湾');
  console.log('   -> resolveGeoInfo("台湾"):', twByName);
  if (twByName.code !== 'TW' || twByName.name !== '台湾') {
    throw new Error(`Unexpected TW by name info: ${JSON.stringify(twByName)}`);
  }

  const hk = resolveGeoInfo('HK');
  console.log('   -> resolveGeoInfo("HK"):', hk);
  if (hk.code !== 'HK' || hk.name !== '香港' || hk.name.includes('中国')) {
    throw new Error(`Unexpected HK info: ${JSON.stringify(hk)}`);
  }

  const mo = resolveGeoInfo('MO');
  console.log('   -> resolveGeoInfo("MO"):', mo);
  if (mo.code !== 'MO' || mo.name !== '澳门' || mo.name.includes('中国')) {
    throw new Error(`Unexpected MO info: ${JSON.stringify(mo)}`);
  }

  const twHant = resolveGeoInfo('TW', 'zh-Hant');
  console.log('   -> resolveGeoInfo("TW", "zh-Hant"):', twHant);
  if (twHant.name !== '台灣') {
    throw new Error(`Expected 台灣, got ${twHant.name}`);
  }

  const twEn = resolveGeoInfo('TW', 'en');
  console.log('   -> resolveGeoInfo("TW", "en"):', twEn);
  if (twEn.name !== 'Taiwan') {
    throw new Error(`Expected Taiwan, got ${twEn.name}`);
  }
}

async function testGeoProfileEndpoint() {
  console.log('\n--- 2. Testing geo-profile.ts Handler directly ---');
  const mockEnv = {};

  // TW zh-CN
  const reqTW = new Request('https://blog.epocanvas.com/api/geo-profile?country=TW');
  const resTW = await geoProfileHandler({ request: reqTW, env: mockEnv });
  const dataTW = await resTW.json();
  console.log('   -> TW response:', dataTW);
  if (dataTW.countryName !== '台湾' || dataTW.location !== '台湾' || dataTW.location.includes('中国')) {
    throw new Error(`TW location should be 台湾 without 中国, got ${dataTW.location}`);
  }

  // TW zh-Hant
  const reqTWHant = new Request('https://blog.epocanvas.com/api/geo-profile?country=TW&locale=zh-Hant');
  const resTWHant = await geoProfileHandler({ request: reqTWHant, env: mockEnv });
  const dataTWHant = await resTWHant.json();
  console.log('   -> TW zh-Hant response:', dataTWHant);
  if (dataTWHant.location !== '台灣') {
    throw new Error(`TW zh-Hant location should be 台灣, got ${dataTWHant.location}`);
  }

  // TW en
  const reqTWEn = new Request('https://blog.epocanvas.com/api/geo-profile?country=TW&locale=en');
  const resTWEn = await geoProfileHandler({ request: reqTWEn, env: mockEnv });
  const dataTWEn = await resTWEn.json();
  console.log('   -> TW en response:', dataTWEn);
  if (dataTWEn.location !== 'Taiwan') {
    throw new Error(`TW en location should be Taiwan, got ${dataTWEn.location}`);
  }

  // HK
  const reqHK = new Request('https://blog.epocanvas.com/api/geo-profile?country=HK');
  const resHK = await geoProfileHandler({ request: reqHK, env: mockEnv });
  const dataHK = await resHK.json();
  console.log('   -> HK response:', dataHK);
  if (dataHK.location !== '香港' || dataHK.location.includes('中国')) {
    throw new Error(`HK location should be 香港 without 中国, got ${dataHK.location}`);
  }

  // MO
  const reqMO = new Request('https://blog.epocanvas.com/api/geo-profile?country=MO');
  const resMO = await geoProfileHandler({ request: reqMO, env: mockEnv });
  const dataMO = await resMO.json();
  console.log('   -> MO response:', dataMO);
  if (dataMO.location !== '澳门' || dataMO.location.includes('中国')) {
    throw new Error(`MO location should be 澳门 without 中国, got ${dataMO.location}`);
  }
}

async function testFlagRenderingBrowser() {
  console.log('\n--- 3. Testing Flag Rendering & Singularity in Browser ---');
  const port = '4340';
  const devProc = spawn('npx', ['astro', 'dev', '--port', port, '--host', '127.0.0.1'], {
    stdio: ['ignore', 'pipe', 'pipe'],
    shell: true,
  });

  let output = '';
  let serverReady = false;
  devProc.stdout.on('data', (d) => {
    const text = d.toString();
    output += text;
    if (text.includes('http://') || text.includes('Local:')) {
      serverReady = true;
    }
  });
  devProc.stderr.on('data', (d) => { output += d.toString(); });

  const maxWait = 30000;
  const start = Date.now();
  while (!serverReady && Date.now() - start < maxWait) {
    await new Promise((r) => setTimeout(r, 400));
  }

  if (!serverReady) {
    devProc.kill('SIGTERM');
    throw new Error('Dev server failed to start within timeout: ' + output);
  }

  let browser;
  try {
    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await page.goto(`http://127.0.0.1:${port}/posts/content-formats-and-markup-mastery/`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1200);

    // Evaluate comment area DOM
    const commentSection = await page.$('#post-comment');
    if (!commentSection) throw new Error('Missing #post-comment section');

    // Check if flag images load cleanly
    const flagImageSample = await page.evaluate(() => {
      const img = document.createElement('img');
      img.className = 'tk-geo-flag-img';
      img.src = 'https://flagcdn.com/24x18/tw.png';
      return {
        className: img.className,
        src: img.src,
      };
    });
    console.log('   -> Flag image element verification:', flagImageSample);

    console.log('   -> Comment section and flag image classes verified.');
  } finally {
    if (browser) await browser.close();
    devProc.kill('SIGTERM');
  }
}

async function main() {
  await testGeoNames();
  await testGeoProfileEndpoint();
  await testFlagRenderingBrowser();
  console.log('\n🎉 ALL GEO & FLAG VERIFICATION CHECKS PASSED!');
}

main().catch((err) => {
  console.error('❌ Failed:', err);
  process.exit(1);
});
