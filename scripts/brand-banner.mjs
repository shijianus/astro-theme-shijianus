import process from 'node:process';

/**
 * Terminal color and capabilities detection
 */
export function supportsColor() {
  if (process.env.NO_COLOR || process.argv.includes('--no-color') || process.argv.includes('--plain')) {
    return false;
  }
  if (process.env.FORCE_COLOR || process.argv.includes('--color')) {
    return true;
  }
  return process.stdout.isTTY !== false && process.env.TERM !== 'dumb';
}

/**
 * Interpolates smooth 2D diagonal gradient across lines of text
 * @param {string[]} lines Array of text lines
 * @param {[number, number, number]} startRGB [r, g, b]
 * @param {[number, number, number]} endRGB [r, g, b]
 * @returns {string[]}
 */
export function colorize2D(lines, startRGB, endRGB) {
  if (!supportsColor()) return lines;
  const numLines = lines.length;
  return lines.map((line, row) => {
    const rowRatio = row / Math.max(1, numLines - 1);
    const len = line.length;
    let out = '';
    for (let col = 0; col < len; col++) {
      const char = line[col];
      if (char === ' ') {
        out += ' ';
        continue;
      }
      const colRatio = col / Math.max(1, len - 1);
      // Diagonal gradient weighting
      const combined = rowRatio * 0.35 + colRatio * 0.65;
      const r = startRGB[0] + (endRGB[0] - startRGB[0]) * combined;
      const g = startRGB[1] + (endRGB[1] - startRGB[1]) * combined;
      const b = startRGB[2] + (endRGB[2] - startRGB[2]) * combined;
      out += `\x1b[38;2;${Math.round(r)};${Math.round(g)};${Math.round(b)}m${char}\x1b[0m`;
    }
    return out;
  });
}

/**
 * Generates the clean, borderless, English brand banner for EpoCanvas & shijianus
 * @param {object} options
 * @param {boolean} [options.plain] Force plain ASCII output without ANSI escape codes
 */
export function generateBrandBanner(options = {}) {
  const isColor = supportsColor() && !options.plain;

  // Primary Major Title: EpoCanvas (Heavy Bold Slant)
  const epoCanvasArt = [
    "  ______             ______                                ",
    " / ____/___  ____   / ____/___ _____ _   ______ ______     ",
    "/ __/ / __ \\/ __ \\ / /   / __ `/ __ \\ | / / __ `/ ___/     ",
    "/ /___/ /_/ / /_/ // /___/ /_/ / / / / |/ / /_/ (__  )      ",
    "/_____/ .___/\\____/ \\____/\\__,_/_/ /_/|___/\\__,_/____/       ",
    "     /_/                                                     "
  ];

  // Secondary Title: shijianus (Precision Block Wordmark & Tagline)
  const shijianusArt = isColor
    ? [
        "    █▀ █ █ █ ░░█ █ ▄▀█ █▄░█ █░█ █▀   ·   A R C H I T E C T U R E",
        "    ▄█ █▀█ █ █▄█ █ █▀█ █░▀█ ▀▄▀ ▄█   ·   v 2 . 6 . 0"
      ]
    : [
        "    SHIJIANUS   ·   ARCHITECTURE & UI ENGINE   ·   v2.6.0"
      ];

  // Signature Palette: Cyan (#06B6D4) -> Sky (#38BDF8) -> Indigo (#6366F1) -> Purple (#A855F7) -> Fuchsia (#D946EF)
  const coloredEpo = isColor
    ? colorize2D(epoCanvasArt, [6, 182, 212], [217, 70, 239])
    : epoCanvasArt;

  const coloredShijian = isColor
    ? colorize2D(shijianusArt, [56, 189, 248], [168, 85, 247])
    : shijianusArt;

  const lines = [];

  // 1. Primary Major Brand Title
  lines.push(...coloredEpo);
  lines.push('');

  // 2. Secondary Sub-Brand Title
  lines.push(...coloredShijian);
  lines.push('');

  // 3. Green [TIP] with Official Sites (Clean, Minimal, All-English)
  const tipTag = isColor ? '\x1b[1;32m[TIP]\x1b[0m' : '[TIP]';
  const label = isColor ? '\x1b[1;97mOfficial Sites:\x1b[0m' : 'Official Sites:';
  const site1 = isColor ? '\x1b[38;2;6;182;212mhttps://shijian.us\x1b[0m' : 'https://shijian.us';
  const dot = isColor ? '\x1b[90m·\x1b[0m' : '·';
  const site2 = isColor ? '\x1b[38;2;168;85;247mhttps://epocanvas.com\x1b[0m' : 'https://epocanvas.com';

  lines.push(`  ${tipTag} ${label} ${site1} ${dot} ${site2}`);

  return lines.join('\n');
}

/**
 * Print the brand banner to console
 */
export function printBrandBanner(options = {}) {
  console.log('\n' + generateBrandBanner(options) + '\n');
}

// Standalone execution support
if (process.argv[1] && (process.argv[1].endsWith('brand-banner.mjs') || process.argv[1].endsWith('print-brand.mjs'))) {
  const plain = process.argv.includes('--plain') || process.argv.includes('--no-color');
  printBrandBanner({ plain });
}
