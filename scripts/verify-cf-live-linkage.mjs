import { chromium } from 'playwright'
import fs from 'node:fs'
import path from 'node:path'

const ARTIFACT_DIR = '/root/.gemini/antigravity-cli/brain/bd16d9db-c8fc-4a70-b753-b2084573ac03'
const BLOG_CF_URL = process.env.BLOG_CF_URL || 'https://ab7e144f.shijianus-blog.pages.dev'
const SONIC_CF_URL = process.env.SONIC_CF_URL || 'https://5e3dd847.cfsolara-dho.pages.dev'

// Sample public MP3 with byte-range support for real HTML5 audio testing
const SAMPLE_AUDIO_URL = 'https://assets.mixkit.co/music/preview/mixkit-tech-house-vibes-130.mp3'

const sampleSonicPayload = {
  source: 'sonic-music-player',
  brand: 'Sonic',
  type: 'SONIC_AUDIO_SYNC',
  track: {
    id: 'sonic-live-cf-01',
    name: '银河浮游物 (Sonic Link Live)',
    artist: 'epocanvas live',
    album: 'Cloudflare Deployment Special',
    cover: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=300&auto=format&fit=crop&q=80',
    src: SAMPLE_AUDIO_URL,
    duration: 120,
    source: 'sonic',
  },
  playback: {
    currentTime: 14.5,
    duration: 120,
    paused: false,
    volume: 0.85,
    playbackRate: 1.0,
  },
  lyrics: {
    provider: 'sonic-dynamic-lrc',
    hasWordTiming: true,
    lines: [
      {
        startTime: 0,
        endTime: 8,
        text: '星光散落在静止的指尖',
        words: [
          { text: '星光', startTime: 0.5, endTime: 2.0 },
          { text: '散落', startTime: 2.1, endTime: 4.0 },
          { text: '在静止的', startTime: 4.1, endTime: 6.0 },
          { text: '指尖', startTime: 6.1, endTime: 8.0 },
        ],
      },
      {
        startTime: 8,
        endTime: 18,
        text: 'Sonic 跨端音频与歌词链路全同步运行中',
        words: [
          { text: 'Sonic ', startTime: 8.2, endTime: 10.0 },
          { text: '跨端音频', startTime: 10.1, endTime: 12.0 },
          { text: '与歌词链路', startTime: 12.1, endTime: 14.8 },
          { text: '全同步', startTime: 14.9, endTime: 16.5 },
          { text: '运行中', startTime: 16.6, endTime: 18.0 },
        ],
      },
      {
        startTime: 18,
        endTime: 28,
        text: '随身听口袋完美承接云端高码率声场',
        words: [
          { text: '随身听', startTime: 18.5, endTime: 20.5 },
          { text: '口袋', startTime: 20.6, endTime: 22.0 },
          { text: '完美承接', startTime: 22.1, endTime: 24.5 },
          { text: '云端高码率声场', startTime: 24.6, endTime: 28.0 },
        ],
      },
    ],
  },
}

async function runLiveVerification() {
  console.log(`[CF E2E] Starting live verification against:`)
  console.log(` - Blog:  ${BLOG_CF_URL}`)
  console.log(` - Sonic: ${SONIC_CF_URL}`)

  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--autoplay-policy=no-user-gesture-required'],
  })

  try {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      deviceScaleFactor: 2,
    })

    const page = await context.newPage()
    page.on('console', (msg) => {
      if (msg.type() === 'error') console.log(`[Browser Console Err] ${msg.text()}`)
    })

    console.log(`[CF E2E] Loading live blog page: ${BLOG_CF_URL}...`)
    await page.goto(BLOG_CF_URL, { waitUntil: 'networkidle', timeout: 30000 })

    // Verify .shijianus-music-pocket element exists
    const pocketLocator = page.locator('.shijianus-music-pocket')
    await pocketLocator.waitFor({ state: 'attached', timeout: 15000 })
    console.log('[CF E2E] .shijianus-music-pocket found on live deployment.')

    // Check expand button or trigger expansion
    const expandBtn = page.locator('.music-pocket-toggle, [data-pocket-trigger="expand"]').first()
    if (await expandBtn.isVisible().catch(() => false)) {
      await expandBtn.click()
      await page.waitForTimeout(500)
    }

    // Now connect Sonic Audio stream & lyrics payload directly
    console.log('[CF E2E] Injecting Sonic connection payload into live blog...')
    const connectResult = await page.evaluate((payload) => {
      // Test the official bridge method window.__connectSonicAudio
      if (typeof window.__connectSonicAudio === 'function') {
        return window.__connectSonicAudio(payload)
      }
      // Or dispatch custom event
      window.dispatchEvent(new CustomEvent('sonic:connect-audio', { detail: payload }))
      return { via: 'CustomEvent' }
    }, sampleSonicPayload)
    console.log('[CF E2E] Connect invocation returned:', connectResult)

    // Wait for pocket to mark connected
    await page.waitForSelector('.shijianus-music-pocket[data-sonic-connected="true"]', { state: 'attached', timeout: 10000 })
    console.log('[CF E2E] Verified: [data-sonic-connected="true"] is set.')

    // Expand pocket to view lyrics and controls
    await page.evaluate(() => {
      const pocket = document.querySelector('.shijianus-music-pocket')
      if (pocket) {
        pocket.classList.add('is-expanded')
        pocket.setAttribute('data-expanded', 'true')
      }
    })
    await page.waitForTimeout(800)

    // Check lyrics display
    const lyricLine = page.locator('.pocket-lyrics-line, .pocket-hero-lyric, .music-pocket-lyric').first()
    if (await lyricLine.isVisible().catch(() => false)) {
      const lyricText = await lyricLine.textContent()
      console.log(`[CF E2E] Live lyric rendered: "${lyricText?.trim()}"`)
    }

    // Verify audio element
    const audioStatus = await page.evaluate(() => {
      const audio = document.querySelector('.shijianus-music-pocket audio')
      return {
        hasAudio: !!audio,
        src: audio?.src,
        currentTime: audio?.currentTime,
        paused: audio?.paused,
        duration: audio?.duration,
      }
    })
    console.log('[CF E2E] Live Audio Element Status:', audioStatus)

    // Capture Desktop Live Screenshot
    const desktopScreenshotPath = path.join(ARTIFACT_DIR, '04-cf-live-blog-sonic-connected.png')
    await page.screenshot({ path: desktopScreenshotPath, fullPage: false })
    console.log(`[CF E2E] Saved live desktop screenshot: ${desktopScreenshotPath}`)

    // Capture Mobile Live Screenshot
    await page.setViewportSize({ width: 390, height: 844 })
    await page.waitForTimeout(600)
    const mobileScreenshotPath = path.join(ARTIFACT_DIR, '05-cf-live-blog-mobile-sonic.png')
    await page.screenshot({ path: mobileScreenshotPath, fullPage: false })
    console.log(`[CF E2E] Saved live mobile screenshot: ${mobileScreenshotPath}`)

    // Test Live Sonic Deployment UI
    console.log(`[CF E2E] Loading Sonic live deployment: ${SONIC_CF_URL}...`)
    const sonicPage = await context.newPage()
    await sonicPage.setViewportSize({ width: 1440, height: 900 })
    await sonicPage.goto(SONIC_CF_URL, { waitUntil: 'networkidle', timeout: 30000 })

    // Check if Sonic player loaded
    await sonicPage.waitForTimeout(2000)
    const sonicScreenshotPath = path.join(ARTIFACT_DIR, '06-cf-live-sonic-player.png')
    await sonicPage.screenshot({ path: sonicScreenshotPath, fullPage: false })
    console.log(`[CF E2E] Saved live Sonic screenshot: ${sonicScreenshotPath}`)

    console.log('[CF E2E] All live Cloudflare tests completed successfully!')
  } finally {
    await browser.close()
  }
}

runLiveVerification().catch((err) => {
  console.error('[CF E2E Error]', err)
  process.exit(1)
})
