/**
 * EpoCanvas In-Card Procedural Snow Mantle System (卡片原生吸附式程序化立体雪幔系统)
 * 
 * 核心架构升级 (Architectural Pillars):
 * 1. 0 延迟硬件级合成器同步 (Zero-Lag GPU Compositor Sync):
 *    - 摒弃旧版全局固定 Canvas 覆盖方案（Compositor 线程与 JS 主线程 1~2 帧物理延迟导致滑动撕裂与目眩）；
 *    - 采用原生注入各闭合卡片顶沿的独立矢量雪幔 (Attached In-Card Vector Snow Mantle)；
 *    - 卡片滚动、Hover translateY、3D 翻转、flex 宽度伸缩时，雪幔由浏览器合成器一同位移，物理延迟绝对为 0ms！
 * 2. 圆角自适应弧度包裹 (Radius Conformance & Corner Wrap):
 *    - 动态读取各卡片的 border-top-left/right-radius（如 8px, 12px, 16px）；
 *    - 在两端圆角处自然向下弧形包裹下垂（Drape to (0, R*0.65) and (W, R*0.65)），
 *      彻底根除旧版直线木板排列在圆角外“悬空浮起”的致命缺陷！
 * 3. 交互变形与 3D 翻转物理同步 (Interactive Flex & Flip Synchronization):
 *    - .categoryItem 在 hover 时触发 flex: 1.45 弹性展开，矢量雪幔伴随 width: 100% 同步拉伸与回缩；
 *    - .todayCard 翻转时（opacity: 0, scale: 0.96），雪幔自然伴随渐隐缩放；
 *    - 底层遮盖的卡片由于 DOM 层级与 z-index 遮挡，不再产生“穿透幽灵雪”！
 * 4. 真实 2.5D 冬日光照与微细冰晶闪光:
 *    - 接触面环境光遮挡 (feDropShadow AO Shadow)；
 *    - 垂直天光散射自阴影渐变 (Volumetric Skylight Gradient)；
 *    - 迎光拱面高光 (Inner Volumetric Dome) 与晶莹顶沿高光线 (Specular Rim)；
 *    - 微细冰晶闪烁动画 (@keyframes snow-sparkle)。
 */

export const CLOSED_BOX_SELECTORS = [
  '#random-banner',
  '.todayCard',
  '.categoryItem',
  '.home-mobile-focus-card',
  '#recent-posts .recent-post-item',
  '#aside-content .card-widget',
  '#card-toc',
  '#post',
  '.post-page-shell',
  '.post-copyright',
  '.relatedPosts-item',
  '.postNav-card',
  '.pagination-post',
  '.theme-card',
  '.archive-hero-card',
  '.taxonomy-index-card',
  '.taxonomy-hero-card',
  '.taxonomy-section-card',
  '.friends-page__panel',
  '.friends-page__hero',
  '.author-content-item',
  '.home-pagination',
  '.support-dashboard-card',
];

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function createPRNG(seed: number) {
  let a = seed;
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export type SnowArchetype =
  | 'windswept'
  | 'dual-crest'
  | 'level-blanket'
  | 'crystalline-scallops'
  | 'mountain-ridge'
  | 'cascade-cornice';

export const SNOW_ARCHETYPES: SnowArchetype[] = [
  'windswept',
  'dual-crest',
  'level-blanket',
  'crystalline-scallops',
  'mountain-ridge',
  'cascade-cornice',
];

/**
 * Generate Procedural SVG Snow Mantle with 6 Diverse Archetypes & Corner Radius Wrapping
 */
export function generateSnowMantleSvg(
  W: number,
  H_card: number,
  radius: number,
  seed: number,
  className: string = '',
  _cardKey: string = ''
): string {
  const prng = createPRNG(seed);
  const isCategory = className.includes('categoryItem');
  const isCardInfo = className.includes('card-info') || className.includes('profile-card');
  const isRecentPost = className.includes('recent-post-item');
  const isShort = H_card < 120;

  // Select Archetype: recent-post-item cycles through all 6 archetypes based on seed
  let archetypeIndex = Math.abs(seed) % SNOW_ARCHETYPES.length;
  if (isCategory) {
    archetypeIndex = 2; // Category uses compact level-blanket
  } else if (isCardInfo) {
    archetypeIndex = 2; // ProfileCard uses delicate level-blanket
  }
  const archetypeName = SNOW_ARCHETYPES[archetypeIndex];

  let H = 14;
  let maxDroop = 7;
  let baseDrop = 2.0;

  if (isCategory) {
    H = 9;
    maxDroop = 2.5;
    baseDrop = 1.0;
  } else if (isCardInfo) {
    H = 8;
    maxDroop = 2.0;
    baseDrop = 0.6;
  } else if (isShort) {
    H = Math.min(10, H_card * 0.15);
    maxDroop = Math.min(3.5, H_card * 0.05);
    baseDrop = 1.0;
  } else {
    H = Math.min(16, Math.max(11, H_card * 0.12));
    maxDroop = Math.min(8.5, H_card * 0.08);
  }

  const yOffset = Math.round(H + 8);
  const svgHeight = Math.round(yOffset + maxDroop + baseDrop + 8);

  const phi1 = prng() * Math.PI * 2;
  const phi2 = prng() * Math.PI * 2;

  // 1. Archetype Profile Function
  // Returns normalized thickness factor (approx 0.6 to 1.35)
  const getArchetypeProfile = (u: number): number => {
    switch (archetypeName) {
      case 'windswept': {
        // Asymmetric windward/leeward drift: thick on one side, tapering across
        const windRight = seed % 2 === 0;
        const peakU = windRight ? 0.22 + prng() * 0.08 : 0.78 - prng() * 0.08;
        const slope = windRight ? (1 - u) * 0.38 : u * 0.38;
        const mound = Math.exp(-Math.pow((u - peakU) / 0.32, 2)) * 0.65;
        return 0.52 + mound + slope;
      }
      case 'dual-crest': {
        // Twin-pillow saddle: peaks at ~0.26 and ~0.74, valley at center (breaks thick-middle trap!)
        const p1 = Math.exp(-Math.pow((u - 0.26) / 0.20, 2)) * 0.58;
        const p2 = Math.exp(-Math.pow((u - 0.74) / 0.20, 2)) * 0.58;
        const ripple = 0.08 * Math.sin(u * Math.PI * 6 + phi1);
        return 0.52 + p1 + p2 + ripple;
      }
      case 'level-blanket': {
        // Fluffy, consistent thickness across 80% of width
        return 0.94 + 0.12 * Math.sin(u * Math.PI * 4 + phi1) + 0.06 * Math.cos(u * Math.PI * 2);
      }
      case 'crystalline-scallops': {
        // Rhythmic wave crests with delicate scalloped scallops
        return 0.72 + 0.24 * Math.cos(u * Math.PI * 4 + phi1) + 0.10 * Math.sin(u * Math.PI * 8 + phi2);
      }
      case 'mountain-ridge': {
        // Offset prominent mountain ridge at ~0.38 or ~0.62
        const ridgePeak = (seed % 3 === 0) ? 0.36 : (seed % 3 === 1) ? 0.64 : 0.42;
        return 0.48 + 0.72 * Math.exp(-Math.pow((u - ridgePeak) / 0.26, 2)) + 0.14 * Math.cos(u * Math.PI * 3 + phi1);
      }
      case 'cascade-cornice':
      default: {
        // Multi-tier organic cascading waves
        return 0.66 + 0.28 * Math.sin(u * Math.PI * 2.5 + phi1) + 0.18 * Math.cos(u * Math.PI * 5 + phi2);
      }
    }
  };

  // Generate top points with Corner Roll-off & Shoulder Retention
  const numTop = Math.max(16, Math.min(48, Math.round(W / 20)));
  const topPoints: { x: number; y: number }[] = [];

  for (let i = 0; i < numTop; i++) {
    const u = i / (numTop - 1);
    const x = u * W;

    // Corner roll-off conforms to card radius
    const dLeft = Math.min(1, x / (radius + 1e-4));
    const dRight = Math.min(1, (W - x) / (radius + 1e-4));
    const cornerFactor = Math.sin(dLeft * Math.PI * 0.5) * Math.sin(dRight * Math.PI * 0.5);

    // Shoulder retention: maintains at least 60% thickness near corner curve
    const shoulderFactor = 0.60 + 0.40 * cornerFactor;

    const baseProf = getArchetypeProfile(u);
    const microTexture = 0.06 * Math.sin(u * Math.PI * 10 + phi1) + 0.04 * Math.cos(u * Math.PI * 16 + phi2);
    const thickness = H * (baseProf + microTexture) * shoulderFactor;

    let cornerY = 0;
    if (x < radius) {
      cornerY = (radius - Math.sqrt(Math.max(0, radius * radius - Math.pow(radius - x, 2)))) * 0.70;
    } else if (x > W - radius) {
      cornerY = (radius - Math.sqrt(Math.max(0, radius * radius - Math.pow(x - (W - radius), 2)))) * 0.70;
    }

    const y = yOffset - thickness + cornerY;
    topPoints.push({ x, y });
  }

  // 2. Generate Drooping Lobes (雪舌 / 垂挂雪檐) Tailored to Archetype
  const lobes: { cx: number; lw: number; ld: number }[] = [];

  if (archetypeName === 'windswept') {
    // Sheltered side gets lobes, windward side is smooth
    const windRight = seed % 2 === 0;
    if (windRight) {
      lobes.push({
        cx: Math.min(W - radius - 20, W * (0.45 + prng() * 0.1)),
        lw: 32 + prng() * 16,
        ld: Math.min(maxDroop * 0.75, maxDroop),
      });
      lobes.push({
        cx: Math.min(W - radius - 15, W * (0.75 + prng() * 0.1)),
        lw: 38 + prng() * 20,
        ld: Math.min(maxDroop * 0.95, maxDroop),
      });
    } else {
      lobes.push({
        cx: Math.max(radius + 15, W * (0.25 - prng() * 0.1)),
        lw: 38 + prng() * 20,
        ld: Math.min(maxDroop * 0.95, maxDroop),
      });
      lobes.push({
        cx: Math.max(radius + 20, W * (0.55 - prng() * 0.1)),
        lw: 32 + prng() * 16,
        ld: Math.min(maxDroop * 0.75, maxDroop),
      });
    }
  } else if (archetypeName === 'dual-crest') {
    // Exactly 2 prominent lobes, aligned directly under the twin peaks!
    lobes.push({
      cx: Math.max(radius + 20, W * 0.28 + (prng() - 0.5) * 15),
      lw: 36 + prng() * 14,
      ld: Math.min(maxDroop * 0.85, maxDroop),
    });
    lobes.push({
      cx: Math.min(W - radius - 20, W * 0.72 + (prng() - 0.5) * 15),
      lw: 36 + prng() * 14,
      ld: Math.min(maxDroop * 0.85, maxDroop),
    });
  } else if (archetypeName === 'level-blanket') {
    // 4-5 fine regular micro-droops
    const numL = isCategory ? 2 : W < 260 ? 3 : 5;
    for (let k = 0; k < numL; k++) {
      const targetU = (k + 0.5 + (prng() - 0.5) * 0.2) / numL;
      const cx = Math.max(radius + 15, Math.min(W - radius - 15, targetU * W));
      lobes.push({
        cx,
        lw: 24 + prng() * 12,
        ld: Math.min(maxDroop * 0.55, 3.5),
      });
    }
  } else if (archetypeName === 'crystalline-scallops') {
    // 3-4 rhythmic scallops with medium droop
    const numL = W < 260 ? 2 : 4;
    for (let k = 0; k < numL; k++) {
      const targetU = (k + 0.5 + (prng() - 0.5) * 0.25) / numL;
      const cx = Math.max(radius + 15, Math.min(W - radius - 15, targetU * W));
      lobes.push({
        cx,
        lw: 28 + prng() * 14,
        ld: Math.min(maxDroop * 0.80, maxDroop),
      });
    }
  } else if (archetypeName === 'mountain-ridge') {
    // 1 dominant deep lobe directly under the ridge peak + 1 minor companion
    const ridgePeak = (seed % 3 === 0) ? 0.36 : (seed % 3 === 1) ? 0.64 : 0.42;
    lobes.push({
      cx: Math.max(radius + 20, Math.min(W - radius - 20, ridgePeak * W)),
      lw: 44 + prng() * 16,
      ld: Math.min(maxDroop, maxDroop),
    });
    const flankU = ridgePeak > 0.5 ? 0.25 : 0.75;
    lobes.push({
      cx: Math.max(radius + 15, Math.min(W - radius - 15, flankU * W)),
      lw: 28 + prng() * 12,
      ld: Math.min(maxDroop * 0.50, 3.0),
    });
  } else {
    // cascade-cornice: 2-3 asymmetric lobes with high length variance
    const numL = W < 260 ? 2 : 3;
    for (let k = 0; k < numL; k++) {
      const targetU = (k + 0.5 + (prng() - 0.5) * 0.35) / numL;
      const cx = Math.max(radius + 15, Math.min(W - radius - 15, targetU * W));
      lobes.push({
        cx,
        lw: 26 + prng() * 26,
        ld: Math.min(maxDroop * (0.45 + prng() * 0.55), maxDroop),
      });
    }
  }

  // Sample bottom contour from right to left
  const numBottom = Math.max(20, Math.min(60, Math.round(W / 15)));
  const bottomPoints: { x: number; y: number }[] = [];
  for (let i = numBottom - 1; i >= 0; i--) {
    const u = i / (numBottom - 1);
    const x = u * W;

    let droop = 0;
    for (let k = 0; k < lobes.length; k++) {
      const lb = lobes[k];
      const dist = Math.abs(x - lb.cx);
      if (dist < lb.lw * 0.5) {
        const norm = dist / (lb.lw * 0.5);
        droop += lb.ld * Math.pow(1 - norm * norm, 1.8);
      }
    }

    const dLeft = Math.min(1, x / (radius + 1e-4));
    const dRight = Math.min(1, (W - x) / (radius + 1e-4));
    const cornerFactor = Math.sin(dLeft * Math.PI * 0.5) * Math.sin(dRight * Math.PI * 0.5);

    let cornerY = 0;
    if (x < radius) {
      cornerY = (radius - Math.sqrt(Math.max(0, radius * radius - Math.pow(radius - x, 2)))) * 0.75;
    } else if (x > W - radius) {
      cornerY = (radius - Math.sqrt(Math.max(0, radius * radius - Math.pow(x - (W - radius), 2)))) * 0.75;
    }

    const y = yOffset + (baseDrop + droop) * cornerFactor + cornerY;
    bottomPoints.push({ x, y });
  }

  // Build SVG Path strings
  let pathD = `M ${topPoints[0].x.toFixed(1)} ${topPoints[0].y.toFixed(1)}`;
  for (let i = 0; i < topPoints.length - 1; i++) {
    const curr = topPoints[i];
    const next = topPoints[i + 1];
    const mx = (curr.x + next.x) * 0.5;
    const my = (curr.y + next.y) * 0.5;
    pathD += ` Q ${curr.x.toFixed(1)} ${curr.y.toFixed(1)} ${mx.toFixed(1)} ${my.toFixed(1)}`;
  }
  const lastTop = topPoints[topPoints.length - 1];
  pathD += ` L ${lastTop.x.toFixed(1)} ${lastTop.y.toFixed(1)}`;

  for (let i = 0; i < bottomPoints.length - 1; i++) {
    const curr = bottomPoints[i];
    const next = bottomPoints[i + 1];
    const mx = (curr.x + next.x) * 0.5;
    const my = (curr.y + next.y) * 0.5;
    pathD += ` Q ${curr.x.toFixed(1)} ${curr.y.toFixed(1)} ${mx.toFixed(1)} ${my.toFixed(1)}`;
  }
  pathD += ' Z';

  // Inner Dome Path (highlight)
  let domeD = `M ${topPoints[0].x.toFixed(1)} ${topPoints[0].y.toFixed(1)}`;
  for (let i = 0; i < topPoints.length - 1; i++) {
    const curr = topPoints[i];
    const next = topPoints[i + 1];
    const mx = (curr.x + next.x) * 0.5;
    const my = (curr.y + next.y) * 0.5;
    domeD += ` Q ${curr.x.toFixed(1)} ${curr.y.toFixed(1)} ${mx.toFixed(1)} ${my.toFixed(1)}`;
  }
  domeD += ` L ${lastTop.x.toFixed(1)} ${lastTop.y.toFixed(1)}`;
  for (let i = topPoints.length - 1; i >= 0; i--) {
    const pt = topPoints[i];
    const inY = yOffset - (yOffset - pt.y) * 0.45;
    domeD += ` L ${pt.x.toFixed(1)} ${inY.toFixed(1)}`;
  }
  domeD += ' Z';

  // Rim Stroke Path
  let rimD = `M ${topPoints[0].x.toFixed(1)} ${topPoints[0].y.toFixed(1)}`;
  for (let i = 0; i < topPoints.length - 1; i++) {
    const curr = topPoints[i];
    const next = topPoints[i + 1];
    const mx = (curr.x + next.x) * 0.5;
    const my = (curr.y + next.y) * 0.5;
    rimD += ` Q ${curr.x.toFixed(1)} ${curr.y.toFixed(1)} ${mx.toFixed(1)} ${my.toFixed(1)}`;
  }
  rimD += ` L ${lastTop.x.toFixed(1)} ${lastTop.y.toFixed(1)}`;

  // Sparkles
  const numSparkles = isCategory ? 2 : Math.max(3, Math.min(8, Math.round(W / 80)));
  let sparklesSvg = '';
  for (let s = 0; s < numSparkles; s++) {
    const ptIdx = Math.floor(prng() * (topPoints.length - 2)) + 1;
    const pt = topPoints[ptIdx];
    const sx = (pt.x + (prng() - 0.5) * 8).toFixed(1);
    const sy = (pt.y + 1.5 + prng() * 3).toFixed(1);
    const sr = (0.7 + prng() * 0.5).toFixed(1);
    const delay = (prng() * 3).toFixed(1);
    sparklesSvg += `<circle cx="${sx}" cy="${sy}" r="${sr}" fill="#ffffff" style="animation: snow-sparkle 2.5s ease-in-out ${delay}s infinite;" />`;
  }

  const gradId = 'snow_g_' + seed;
  const filterId = 'snow_f_' + seed;

  return `
<svg class="card-snow-svg" data-snow-seed="${seed}" data-snow-archetype="${archetypeName}" viewBox="0 0 ${W} ${svgHeight}" preserveAspectRatio="none" style="--snow-svg-top: -${yOffset}px; height: ${svgHeight}px;">
  <defs>
    <linearGradient id="${gradId}" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.98" />
      <stop offset="50%" stop-color="#f3f8fc" stop-opacity="0.95" />
      <stop offset="100%" stop-color="var(--snow-lobe-color, #94b2d2)" stop-opacity="0.92" />
    </linearGradient>
    <filter id="${filterId}" x="-10%" y="-10%" width="120%" height="130%">
      <feDropShadow dx="0" dy="1.5" stdDeviation="1.2" flood-color="var(--snow-ao-color, rgba(70,95,130,0.32))" />
    </filter>
  </defs>
  <path class="snow-body" d="${pathD}" fill="url(#${gradId})" filter="url(#${filterId})" />
  <path class="snow-dome" d="${domeD}" fill="var(--snow-dome-color, rgba(255, 255, 255, 0.65))" />
  <path class="snow-rim" d="${rimD}" fill="none" stroke="var(--snow-rim-color, rgba(255, 255, 255, 0.95))" stroke-width="1.2" stroke-linecap="round" />
  <g class="snow-sparkles">${sparklesSvg}</g>
</svg>
`.trim();
}

/**
 * SnowMantleEngine: In-Card Attached DOM Vector Snow Mantle Controller
 */
export class SnowMantleEngine {
  private resizeTimeout: any = null;
  private isDestroyed = false;
  private mutationObserver: MutationObserver | null = null;

  constructor(_ctx?: CanvasRenderingContext2D) {
    this.init();
  }

  private init() {
    this.scanCards();

    if (typeof window !== 'undefined') {
      window.addEventListener('resize', this.handleResize, { passive: true });
      document.addEventListener('astro:page-load', this.handlePageLoad);

      if (typeof MutationObserver !== 'undefined' && document.body) {
        this.mutationObserver = new MutationObserver((mutations) => {
          let hasRelevantMutation = false;
          for (const m of mutations) {
            if (m.type === 'childList' && m.addedNodes.length > 0) {
              for (let i = 0; i < m.addedNodes.length; i++) {
                const node = m.addedNodes[i];
                if (node instanceof HTMLElement && !node.classList.contains('card-snow-svg')) {
                  hasRelevantMutation = true;
                  break;
                }
              }
            }
          }
          if (hasRelevantMutation) {
            this.handleResize();
          }
        });

        this.mutationObserver.observe(document.body, {
          childList: true,
          subtree: true,
        });
      }
    }
  }

  private handleResize = () => {
    if (this.resizeTimeout) clearTimeout(this.resizeTimeout);
    this.resizeTimeout = setTimeout(() => {
      if (this.isDestroyed) return;
      this.scanCards();
    }, 150);
  };

  private handlePageLoad = () => {
    setTimeout(() => {
      if (this.isDestroyed) return;
      this.scanCards();
    }, 80);
  };

  /**
   * Rescan DOM and dynamically attach tailored SVG Snow Mantles directly inside cards
   */
  public scanCards() {
    if (typeof document === 'undefined') return;

    const selector = CLOSED_BOX_SELECTORS.join(', ');
    const elements = Array.from(document.querySelectorAll<HTMLElement>(selector));

    const seen = new Set<HTMLElement>();

    for (let index = 0; index < elements.length; index++) {
      const el = elements[index];
      if (seen.has(el)) continue;

      // Filter out hidden elements
      if (el.offsetParent === null) continue;
      const computed = window.getComputedStyle(el);
      if (computed.display === 'none' || computed.visibility === 'hidden' || computed.opacity === '0') continue;

      // Avoid nested duplicates (except distinct cards like relatedPosts-item or postNav-card)
      let isNested = false;
      for (const parent of seen) {
        if (parent.contains(el)) {
          const isAllowed =
            el.classList.contains('recent-post-item') ||
            el.classList.contains('relatedPosts-item') ||
            el.classList.contains('postNav-card') ||
            el.classList.contains('post-copyright') ||
            el.classList.contains('card-widget');
          if (!isAllowed) {
            isNested = true;
            break;
          }
        }
      }
      if (isNested) continue;
      seen.add(el);

      const W = Math.round(el.offsetWidth);
      const H_card = Math.round(el.offsetHeight);
      if (W < 40 || H_card < 20) continue;

      // Check if card already has a snow mantle SVG
      const existingSvg = el.querySelector<SVGElement>(':scope > .card-snow-svg');
      if (existingSvg) {
        // If width hasn't changed significantly, keep existing
        const oldW = parseInt(existingSvg.getAttribute('viewBox')?.split(' ')[2] || '0');
        if (Math.abs(oldW - W) <= 25) {
          continue;
        }
        existingSvg.remove();
      }

      // Read border-top-left-radius
      const rawRadius = parseFloat(computed.borderTopLeftRadius) || 12;
      const radius = Math.max(4, Math.min(24, Math.round(rawRadius)));

      const cardKey =
        el.getAttribute('data-card-id') ||
        el.getAttribute('data-card-slug') ||
        el.getAttribute('data-card-link') ||
        el.querySelector('a')?.getAttribute('href') ||
        el.querySelector('img')?.getAttribute('alt') ||
        el.querySelector('.article-title, h1, h2, h3, h4')?.textContent?.trim() ||
        el.id ||
        el.className.split(' ')[0] ||
        `card-${index}`;

      const cardIndexAttr = el.getAttribute('data-card-index');
      const resolvedIndex =
        cardIndexAttr !== null && !isNaN(parseInt(cardIndexAttr, 10))
          ? parseInt(cardIndexAttr, 10)
          : index;

      const seed = hashString(`${cardKey}-${resolvedIndex}`);

      const svgString = generateSnowMantleSvg(W, H_card, radius, seed, el.className || '', cardKey);

      // Ensure card has relative/absolute positioning and visible overflow
      if (computed.position === 'static') {
        el.style.position = 'relative';
      }
      el.style.setProperty('overflow', 'visible', 'important');

      // Insert as last child of the card so it renders above background and images
      el.insertAdjacentHTML('beforeend', svgString);
    }
  }

  /**
   * Backwards compatible no-op render method
   */
  public render(_scrollY: number, _scrollX: number, _isDark: boolean, _time: number) {
    // In-Card attached SVGs render directly in DOM on the GPU compositor thread.
    // Zero canvas draw cost every frame!
  }

  public destroy() {
    this.isDestroyed = true;
    if (this.resizeTimeout) clearTimeout(this.resizeTimeout);
    if (this.mutationObserver) {
      this.mutationObserver.disconnect();
      this.mutationObserver = null;
    }
    if (typeof window !== 'undefined') {
      window.removeEventListener('resize', this.handleResize);
      document.removeEventListener('astro:page-load', this.handlePageLoad);
    }
    // Remove all attached SVGs
    if (typeof document !== 'undefined') {
      const svgs = document.querySelectorAll('.card-snow-svg');
      svgs.forEach((svg) => svg.remove());
    }
  }
}
