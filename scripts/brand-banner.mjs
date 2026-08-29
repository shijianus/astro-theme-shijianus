import process from 'node:process';

// Embedded Encrypted Brand Manifest Payload
const _0xeb1 = "IXgseGB4aHRsdGp4dngqeGB4Hyo1GTs0LDspeHZ4KXhgeCkyMzAzOzQvKXh2eC94YHgyLi4qKWB1dT8qNTk7NCw7KXQ5NTd4dng7KC5reGABeHp6enoFBQUFBQV6enp6enp6enp6enp6BQUFBQUFenp6enp6enp6enp6enp6enp6enp6enp6enp6enp6enp4dnh6enp1egUFBQV1BQUFenoFBQUFenp6dXoFBQUFdQUFBXoFBQUFBXoFenp6BQUFBQUFegUFBQUFBXp6enp6eHZ4enp1egUFdXp1egUFegYGdXoFBXoGBnp1enV6enp1egUFejp1egUFegYGeiZ6dXp1egUFejp1egUFBXV6enp6enh2eHp1enUFBQV1enUFdXp1enUFdXp1dXp1BQUFdXp1BXV6dXp1enV6dXomdXp1enUFdXpyBQV6enN6enp6enp4dnh1BQUFBQV1enQFBQV1BgYFBQUFdXoGBgUFBQV1BgYFBXYFdQV1enUFdSYFBQV1BgYFBXYFdQUFBQV1enp6enp6enh2eHp6enp6dQV1enp6enp6enp6enp6enp6enp6enp6enp6enp6enp6enp6enp6enp6enp6enp6enp6enp6enp4B3Z4OyguaHhgAXh6enp6enp6erjM0rjM2nq4zNJ6uMzSerjM0nq4zMu4zMu4zNJ6uMzSerjM3rjM2rjM0nq4zNK4zN64zMu4zNJ6uMzSuMzLuMzSerjM0rjM2np6epjtenp6G3oIehl6EnoTeg56H3oZeg56D3oIeh94dnh6enp6enp6erjM3rjM0nq4zNK4zNq4zNJ6uMzSerjM0rjM3rjM0nq4zNJ6uMzSuMzauMzSerjM0rjMy7jM2rjM0nq4zNq4zN64zNp6uMzeuMzSenp6mO16enosemh6dHpsenR6angHdng5a3hgAWx2a2JodmhraAd2eDloeGABaGttdm1qdmhpYwd2eDlpeGABb2x2a2JjdmhuYgd2eDlueGABa2xidmJvdmhubQcn";
const _0xkey = 0x5A;

/**
 * Decodes the embedded encrypted brand manifest
 */
export function getBrandManifest() {
  try {
    const buf = Buffer.from(_0xeb1, 'base64');
    for (let i = 0; i < buf.length; i++) {
      buf[i] ^= _0xkey;
    }
    return JSON.parse(buf.toString('utf8'));
  } catch {
    return {
      v: "2.6.0",
      p: "EpoCanvas",
      s: "shijianus",
      u: "https://epocanvas.com",
      art1: [
        "    ______             ______                                ",
        "   / ____/___  ____   / ____/___ _____ _   ______ ______     ",
        "  / __/ / __ \\/ __ \\ / /   / __ `/ __ \\ | / / __ `/ ___/     ",
        " / /___/ /_/ / /_/ // /___/ /_/ / / / / |/ / /_/ (__  )      ",
        "/_____/ .___/\\____/ \\____/\\__,_/_/ /_/|___/\\__,_/____/       ",
        "     /_/                                                     "
      ],
      art2: [
        "        █▀ █ █ █ ░░█ █ ▄▀█ █▄░█ █░█ █▀   ·   A R C H I T E C T U R E",
        "        ▄█ █▀█ █ █▄█ █ █▀█ █░▀█ ▀▄▀ ▄█   ·   v 2 . 6 . 0"
      ],
      c1: [6, 182, 212],   // Cyan #06B6D4
      c2: [217, 70, 239],  // Fuchsia #D946EF
      c3: [56, 189, 248],  // Sky Blue #38BDF8
      c4: [168, 85, 247],  // Purple #A855F7
    };
  }
}

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
      // 2D diagonal gradient weighting
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
  const manifest = getBrandManifest();

  // Primary Major Title: EpoCanvas
  const epoCanvasArt = manifest.art1;

  // Secondary Sub-Brand Title: shijianus
  const shijianusArt = isColor
    ? manifest.art2
    : [
        "    SHIJIANUS   ·   ARCHITECTURE & UI ENGINE   ·   v" + manifest.v
      ];

  const coloredEpo = isColor
    ? colorize2D(epoCanvasArt, manifest.c1, manifest.c2)
    : epoCanvasArt;

  const coloredShijian = isColor
    ? colorize2D(shijianusArt, manifest.c3, manifest.c4 || manifest.c2)
    : shijianusArt;

  const lines = [];

  // 1. Primary Major Brand Title (EpoCanvas)
  lines.push(...coloredEpo);
  lines.push('');

  // 2. Secondary Sub-Brand Title (shijianus)
  lines.push(...coloredShijian);
  lines.push('');
  lines.push('');

  // 3. Standard Left-Aligned Green [TIP] Notification (Separated & Dedicated)
  const tipTag = isColor ? '\x1b[1;32m[TIP]\x1b[0m' : '[TIP]';
  const label = isColor ? '\x1b[1;97mOfficial Website:\x1b[0m' : 'Official Website:';
  const site = isColor ? '\x1b[38;2;6;182;212m' + manifest.u + '\x1b[0m' : manifest.u;

  lines.push(`${tipTag} ${label} ${site}`);

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
