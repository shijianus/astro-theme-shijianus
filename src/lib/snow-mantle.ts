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
  '#category-bar',
  '.category-bar',
  '.home-top-notice',
  '.home-mobile-focus-card',
  '#recent-posts .recent-post-item',
  '.recent-post-item',
  '#aside-content .card-widget',
  '#card-toc',
  '#card-recent-post',
  '#card-categories',
  '#card-telegram',
  '.card-announcement',
  '.card-tags',
  '.card-archives',
  '.card-webinfo',
  '.card-widget',
  '#post',
  '.post-page-shell',
  '.shijianus-ai-summary',
  '.post-copyright',
  '.relatedPosts-item',
  '.postNav-card',
  '.pagination-post',
  '#post-comment',
  '.markdown-alert',
  '.article-callout',
  '.admonition',
  '.admonition-details',
  '.code-block-shell',
  'figure.highlight',
  '.article-table-wrap',
  '.github-repo-card',
  '.video-embed-card',
  '.article-audio-card',
  '.article-encrypted-box',
  '.article-tabs',
  '.home-pagination',
  '.footer-main-shell',
  '#footer-bar',
  '.theme-card',
  '.archive-hero-card',
  '.taxonomy-index-card',
  '.taxonomy-hero-card',
  '.taxonomy-section-card',
  '.friends-page__panel',
  '.friends-page__hero',
  '.author-content-item',
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
  | 'windswept-left'
  | 'windswept-right'
  | 'dual-crest-saddle'
  | 'triple-dome'
  | 'quad-hill'
  | 'thick-plateau'
  | 'icicle-curtain'
  | 'corner-caps'
  | 'scalloped-crest'
  | 'alpine-ridge-left'
  | 'alpine-ridge-right'
  | 'center-peak'
  | 'heavy-cornice-left'
  | 'heavy-cornice-right'
  | 'puffy-cumulus'
  | 'sawtooth-drift'
  | 'gentle-powder'
  | 'wave-cascade'
  | 'center-dip-valley'
  | 'droop-cluster-left'
  | 'droop-cluster-right'
  | 'dual-plateau'
  | 'frost-pillow'
  | 'asymmetric-dune';

export const SNOW_ARCHETYPES: SnowArchetype[] = [
  'windswept-left',
  'windswept-right',
  'dual-crest-saddle',
  'triple-dome',
  'quad-hill',
  'thick-plateau',
  'icicle-curtain',
  'corner-caps',
  'scalloped-crest',
  'alpine-ridge-left',
  'alpine-ridge-right',
  'center-peak',
  'heavy-cornice-left',
  'heavy-cornice-right',
  'puffy-cumulus',
  'sawtooth-drift',
  'gentle-powder',
  'wave-cascade',
  'center-dip-valley',
  'droop-cluster-left',
  'droop-cluster-right',
  'dual-plateau',
  'frost-pillow',
  'asymmetric-dune',
];

/**
 * Generate Procedural SVG Snow Mantle with 24 Diverse Archetypes,
 * Natural Morphological Family Diversity (Center-Thick Dunes, Windswept Drifts, Uniform Blankets),
 * Width-Scaled Harmonic Waves (Zero Flat Slicing), and Full-Width Seamless Edge Bar Coverage.
 */
export function generateSnowMantleSvg(
  W: number,
  H_card: number,
  radius: number,
  seed: number,
  className: string = '',
  _cardKey: string = '',
  maxAllowedRise: number = 14
): string {
  const prng = createPRNG(seed);
  const isCategory = className.includes('categoryItem');
  const isCardInfo = className.includes('card-info') || className.includes('profile-card');
  const isCategoryBar = className.includes('category-bar') || className.includes('catalog-bar');
  const isFooterBar = className.includes('footer-bar') || _cardKey === 'footer-bar' || _cardKey.includes('footer-bar');
  const isFooterMain = className.includes('footer-main-shell');
  const isRecentPost = className.includes('recent-post-item');
  const isCodeBlock = className.includes('code-block-shell') || className.includes('highlight');
  const isCallout = className.includes('markdown-alert') || className.includes('article-callout') || className.includes('admonition');
  const isNotice = className.includes('home-top-notice');
  const isShort = H_card < 120;

  // 1. Select Archetype
  let archetypeIndex = Math.abs(seed) % SNOW_ARCHETYPES.length;
  if (isRecentPost) {
    // Rich diversified dispersion across all 24 archetypes
    archetypeIndex = (Math.abs(seed) + Math.abs(seed >> 3) * 7 + Math.abs(seed >> 7)) % SNOW_ARCHETYPES.length;
  } else if (isCategoryBar || isFooterBar) {
    archetypeIndex = 17; // wave-cascade: continuous rolling dunes
  } else if (isFooterMain || isCardInfo) {
    archetypeIndex = 5; // thick-plateau: even, generous snow cushion
  } else if (isNotice || isCategory) {
    archetypeIndex = 16; // gentle-powder
  }
  const archetypeName = SNOW_ARCHETYPES[archetypeIndex];

  // 2. Identify Morphological Family:
  // - 'center-thick': Natural mountain/dune - thickest in center, gracefully sloping to softer, thinner ends
  // - 'windswept-left': Asymmetrical drift - thick overhanging drift on left, sleek and thin on right
  // - 'windswept-right': Asymmetrical drift - thick overhanging drift on right, sleek and thin on left
  // - 'level-blanket': Uniform calm snow mattress
  // - 'corner-caps': Specific archetype with prominent corner drifts
  let morphology: 'center-thick' | 'windswept-left' | 'windswept-right' | 'level-blanket' | 'corner-caps' = 'center-thick';
  if (archetypeName === 'windswept-left' || archetypeName === 'heavy-cornice-left' || archetypeName === 'alpine-ridge-left' || archetypeName === 'droop-cluster-left') {
    morphology = 'windswept-left';
  } else if (archetypeName === 'windswept-right' || archetypeName === 'heavy-cornice-right' || archetypeName === 'alpine-ridge-right' || archetypeName === 'droop-cluster-right') {
    morphology = 'windswept-right';
  } else if (archetypeName === 'thick-plateau' || archetypeName === 'gentle-powder' || archetypeName === 'icicle-curtain' || archetypeName === 'dual-plateau') {
    morphology = 'level-blanket';
  } else if (archetypeName === 'corner-caps') {
    morphology = 'corner-caps';
  } else {
    morphology = 'center-thick';
  }

  // 3. Overhang and Geometric Bounds
  let padX = Math.round(Math.max(3.5, Math.min(8.0, radius * 0.50)));
  let extraSide = 2.0;
  let leftOffset = padX + extraSide;
  let totalW = Math.round(W + leftOffset * 2);
  let cardLeft = leftOffset;
  let cardRight = leftOffset + W;

  if (isFooterBar) {
    // #footer-bar spans edge-to-edge from 0 to 100vw: no outer pad overhang
    padX = 0;
    extraSide = 0;
    leftOffset = 0;
    totalW = W;
    cardLeft = 0;
    cardRight = W;
  }

  // 4. Base Thickness & Droop Calibration
  let targetRise = Math.min(13.0, Math.max(8.5, H_card * 0.095));
  let baseDrop = 2.4;
  let maxDroop = Math.min(8.5, Math.max(4.5, H_card * 0.065));

  if (isCategoryBar) {
    targetRise = 6.2;
    baseDrop = 1.2;
    maxDroop = 2.4;
  } else if (isFooterBar) {
    targetRise = 8.5;
    baseDrop = 1.8;
    maxDroop = 3.6;
  } else if (isFooterMain) {
    targetRise = 10.5;
    baseDrop = 2.4;
    maxDroop = 5.2;
  } else if (isNotice) {
    targetRise = 4.5;
    baseDrop = 1.0;
    maxDroop = 1.8;
  } else if (isCodeBlock) {
    targetRise = 4.8;
    baseDrop = 1.2;
    maxDroop = 2.0;
  } else if (isCallout) {
    targetRise = 5.2;
    baseDrop = 1.4;
    maxDroop = 2.2;
  } else if (isCategory) {
    targetRise = 5.5;
    baseDrop = 1.4;
    maxDroop = 2.8;
  } else if (isCardInfo) {
    targetRise = 7.5;
    baseDrop = 1.6;
    maxDroop = 3.8;
  } else if (isShort) {
    targetRise = Math.min(7.0, H_card * 0.095);
    maxDroop = Math.min(3.5, H_card * 0.05);
    baseDrop = 1.4;
  }

  // Clearance scaling: smooth proportional scaling if clearance is tight
  if (maxAllowedRise > 0 && maxAllowedRise < 14) {
    const scaleFactor = Math.min(1.0, Math.max(0.55, (maxAllowedRise - 2.0) / 11.0));
    targetRise *= scaleFactor;
  }

  const yOffset = Math.round(Math.max(22, targetRise * 1.6 + 8));
  const svgHeight = Math.round(yOffset + maxDroop + baseDrop + radius + 18);

  const phi1 = prng() * Math.PI * 2;
  const phi2 = prng() * Math.PI * 2;

  // 5. Width-Scaled Wave Cycles: Across wide cards/bars (W > 500px), generate multiple rolling dunes every ~240px
  const waveCycles = Math.max(1, Math.min(7, Math.round(W / 240)));
  const waveAmplitude = Math.max(4.0, Math.min(9.0, targetRise * 0.58));

  // 6. Archetype Profile Function: Evaluates thickness multiplier at u in [0, 1]
  const getArchetypeProfile = (u: number): number => {
    switch (archetypeName) {
      case 'windswept-left': {
        return 0.50 + 0.85 * Math.exp(-Math.pow(u / 0.32, 2)) + (1 - u) * 0.35;
      }
      case 'windswept-right': {
        return 0.50 + 0.85 * Math.exp(-Math.pow((1 - u) / 0.32, 2)) + u * 0.35;
      }
      case 'dual-crest-saddle': {
        const p1 = Math.exp(-Math.pow((u - 0.25) / 0.18, 2)) * 0.75;
        const p2 = Math.exp(-Math.pow((u - 0.75) / 0.18, 2)) * 0.75;
        return 0.45 + p1 + p2 + 0.10 * Math.sin(u * Math.PI * 4 + phi1);
      }
      case 'triple-dome': {
        const p1 = Math.exp(-Math.pow((u - 0.18) / 0.14, 2)) * 0.65;
        const p2 = Math.exp(-Math.pow((u - 0.50) / 0.15, 2)) * 0.75;
        const p3 = Math.exp(-Math.pow((u - 0.82) / 0.14, 2)) * 0.65;
        return 0.45 + p1 + p2 + p3;
      }
      case 'quad-hill': {
        return 0.55 + 0.45 * Math.sin(u * Math.PI * 4 * waveCycles + phi1);
      }
      case 'thick-plateau': {
        return 0.85 + 0.25 * Math.sin(u * Math.PI * 2 * waveCycles + phi1) + 0.12 * Math.cos(u * Math.PI * 4);
      }
      case 'icicle-curtain': {
        return 0.75 + 0.22 * Math.sin(u * Math.PI * 3 * waveCycles + phi1);
      }
      case 'corner-caps': {
        const leftCap = Math.exp(-Math.pow(u / 0.22, 2)) * 0.80;
        const rightCap = Math.exp(-Math.pow((1 - u) / 0.22, 2)) * 0.80;
        return 0.45 + leftCap + rightCap;
      }
      case 'scalloped-crest': {
        return 0.60 + 0.42 * Math.abs(Math.sin(u * Math.PI * 3 * waveCycles + phi1));
      }
      case 'alpine-ridge-left': {
        return 0.40 + 0.95 * Math.exp(-Math.pow((u - 0.30) / 0.20, 2)) + 0.15 * Math.sin(u * Math.PI * 2 + phi1);
      }
      case 'alpine-ridge-right': {
        return 0.40 + 0.95 * Math.exp(-Math.pow((u - 0.70) / 0.20, 2)) + 0.15 * Math.sin(u * Math.PI * 2 + phi1);
      }
      case 'center-peak': {
        return 0.38 + 1.05 * Math.exp(-Math.pow((u - 0.50) / 0.22, 2));
      }
      case 'heavy-cornice-left': {
        return 0.45 + 0.85 * Math.pow(Math.max(0, 1 - u), 1.2) + 0.15 * Math.sin(u * Math.PI * 2 + phi1);
      }
      case 'heavy-cornice-right': {
        return 0.45 + 0.85 * Math.pow(Math.max(0, u), 1.2) + 0.15 * Math.sin(u * Math.PI * 2 + phi1);
      }
      case 'sawtooth-drift': {
        return 0.55 + ((u * waveCycles * 2 + phi1 / Math.PI) % 1.0) * 0.45;
      }
      case 'puffy-cumulus': {
        return 0.55 + 0.50 * Math.abs(Math.sin(u * Math.PI * 2.5 * waveCycles + phi1));
      }
      case 'gentle-powder': {
        return 0.75 + 0.24 * Math.sin(u * Math.PI * 2 * waveCycles + phi1);
      }
      case 'wave-cascade': {
        return 0.55 + 0.45 * Math.sin(u * Math.PI * 2 * waveCycles + phi1) + 0.20 * Math.sin(u * Math.PI * 4 * waveCycles + phi2);
      }
      case 'center-dip-valley': {
        return 0.45 + 0.75 * Math.pow(Math.abs(u - 0.5) * 2, 1.5);
      }
      case 'droop-cluster-left': {
        return 0.45 + 0.75 * Math.exp(-Math.pow(u / 0.28, 2));
      }
      case 'droop-cluster-right': {
        return 0.45 + 0.75 * Math.exp(-Math.pow((1 - u) / 0.28, 2));
      }
      case 'dual-plateau': {
        return 0.65 + 0.40 * (u < 0.5 ? 0.9 : 0.4) + 0.15 * Math.sin(u * Math.PI * 2 * waveCycles + phi1);
      }
      case 'frost-pillow': {
        return 0.45 + 0.85 * Math.sin(u * Math.PI);
      }
      case 'asymmetric-dune':
      default: {
        return 0.45 + 0.80 * Math.sin(Math.pow(u, 0.7) * Math.PI);
      }
    }
  };

  // 7. Top Points Generation: Natural Undulating Mountain & Dune Crests
  const numTop = Math.max(32, Math.min(120, Math.round(totalW / 14)));
  const topPoints: { x: number; y: number }[] = [];

  for (let i = 0; i < numTop; i++) {
    const uTotal = i / (numTop - 1);
    const x = uTotal * totalW;

    const uCard = Math.max(0, Math.min(1, (x - cardLeft) / W));
    const baseProf = getArchetypeProfile(uCard);
    const microTexture = 0.04 * Math.sin(uTotal * Math.PI * 12 + phi1);
    
    // Wave height calculated directly from profile and targetRise - NEVER clamped to a flat floor
    const waveOffset = (baseProf - 0.80) * waveAmplitude;
    const snowRise = targetRise * 0.65 + waveOffset + microTexture * targetRise;

    // Overhang rounding on outer ends
    let cornerRounding = 0;
    if (radius > 0 && !isFooterBar) {
      if (x < cardLeft) {
        const tOut = (cardLeft - x) / leftOffset;
        cornerRounding = Math.pow(tOut, 1.3) * (morphology === 'windswept-left' || morphology === 'corner-caps' ? 2.2 : 1.2);
      } else if (x > cardRight) {
        const tOut = (x - cardRight) / leftOffset;
        cornerRounding = Math.pow(tOut, 1.3) * (morphology === 'windswept-right' || morphology === 'corner-caps' ? 2.2 : 1.2);
      }
    }

    const y = yOffset - snowRise + cornerRounding;
    topPoints.push({ x, y });
  }

  // 8. Generate Drooping Lobes Tailored to Archetype
  const lobes: { cx: number; lw: number; ld: number }[] = [];

  if (archetypeName === 'windswept-left' || archetypeName === 'heavy-cornice-left' || archetypeName === 'alpine-ridge-left' || archetypeName === 'droop-cluster-left') {
    lobes.push({ cx: cardLeft + Math.min(W * 0.20, W - 20), lw: 36 + prng() * 14, ld: maxDroop * 0.95 });
    lobes.push({ cx: cardLeft + Math.min(W * 0.42, W - 20), lw: 26 + prng() * 10, ld: maxDroop * 0.60 });
  } else if (archetypeName === 'windswept-right' || archetypeName === 'heavy-cornice-right' || archetypeName === 'alpine-ridge-right' || archetypeName === 'droop-cluster-right') {
    lobes.push({ cx: cardLeft + Math.max(W * 0.80, 20), lw: 36 + prng() * 14, ld: maxDroop * 0.95 });
    lobes.push({ cx: cardLeft + Math.max(W * 0.58, 20), lw: 26 + prng() * 10, ld: maxDroop * 0.60 });
  } else if (archetypeName === 'corner-caps') {
    lobes.push({ cx: cardLeft + Math.max(14, W * 0.16), lw: 32 + prng() * 10, ld: maxDroop * 0.85 });
    lobes.push({ cx: cardLeft + Math.min(W - 14, W * 0.84), lw: 32 + prng() * 10, ld: maxDroop * 0.85 });
  } else if (archetypeName === 'dual-crest-saddle') {
    lobes.push({ cx: cardLeft + W * 0.25, lw: 30 + prng() * 10, ld: maxDroop * 0.80 });
    lobes.push({ cx: cardLeft + W * 0.75, lw: 30 + prng() * 10, ld: maxDroop * 0.80 });
  } else if (archetypeName === 'triple-dome' || archetypeName === 'quad-hill') {
    lobes.push({ cx: cardLeft + Math.max(14, W * 0.22), lw: 24 + prng() * 10, ld: maxDroop * 0.70 });
    lobes.push({ cx: cardLeft + W * 0.50, lw: 28 + prng() * 10, ld: maxDroop * 0.85 });
    lobes.push({ cx: cardLeft + Math.min(W - 14, W * 0.78), lw: 24 + prng() * 10, ld: maxDroop * 0.70 });
  } else if (archetypeName === 'center-peak' || archetypeName === 'frost-pillow') {
    lobes.push({ cx: cardLeft + W * 0.50, lw: 40 + prng() * 14, ld: maxDroop * 0.90 });
    lobes.push({ cx: cardLeft + W * 0.24, lw: 22 + prng() * 8, ld: maxDroop * 0.40 });
    lobes.push({ cx: cardLeft + W * 0.76, lw: 22 + prng() * 8, ld: maxDroop * 0.40 });
  } else if (archetypeName === 'icicle-curtain') {
    const numIcicles = W < 260 ? 3 : Math.min(6, Math.round(W / 65));
    for (let k = 0; k < numIcicles; k++) {
      const targetU = (k + 0.5 + (prng() - 0.5) * 0.25) / numIcicles;
      lobes.push({
        cx: cardLeft + Math.max(radius + 10, Math.min(W - radius - 10, targetU * W)),
        lw: 16 + prng() * 8,
        ld: Math.min(maxDroop, 3.5 + prng() * 3.5),
      });
    }
  } else if (archetypeName === 'thick-plateau') {
    const numL = isCategory ? 2 : W < 260 ? 3 : 4;
    for (let k = 0; k < numL; k++) {
      const targetU = (k + 0.5 + (prng() - 0.5) * 0.2) / numL;
      lobes.push({
        cx: cardLeft + Math.max(radius + 10, Math.min(W - radius - 10, targetU * W)),
        lw: 24 + prng() * 10,
        ld: Math.min(maxDroop * 0.50, 2.5),
      });
    }
  } else {
    const numL = W < 260 ? 2 : 3;
    for (let k = 0; k < numL; k++) {
      const targetU = (k + 0.5 + (prng() - 0.5) * 0.3) / numL;
      lobes.push({
        cx: cardLeft + Math.max(radius + 10, Math.min(W - radius - 10, targetU * W)),
        lw: 24 + prng() * 14,
        ld: Math.min(maxDroop * (0.40 + prng() * 0.50), maxDroop),
      });
    }
  }

  // 9. Bottom Points Generation & Organic Corner Wrap
  const numBottom = Math.max(32, Math.min(120, Math.round(totalW / 14)));
  const bottomPoints: { x: number; y: number }[] = [];

  // Determine drop factors based on morphology:
  // center-thick: gentle 0.30 drop (ends are naturally, softly thinner!)
  // windswept-left: left drops 0.65, right drops 0.20
  // windswept-right: right drops 0.65, left drops 0.20
  // level-blanket: even 0.38 drop
  // corner-caps: both corners 0.75 drop
  let leftDropFactor = 0.30;
  let rightDropFactor = 0.30;

  if (morphology === 'windswept-left') {
    leftDropFactor = 0.65;
    rightDropFactor = 0.20;
  } else if (morphology === 'windswept-right') {
    leftDropFactor = 0.20;
    rightDropFactor = 0.65;
  } else if (morphology === 'level-blanket') {
    leftDropFactor = 0.38;
    rightDropFactor = 0.38;
  } else if (morphology === 'corner-caps') {
    leftDropFactor = 0.75;
    rightDropFactor = 0.75;
  } else {
    leftDropFactor = 0.30;
    rightDropFactor = 0.30;
  }

  for (let i = numBottom - 1; i >= 0; i--) {
    const uTotal = i / (numBottom - 1);
    const x = uTotal * totalW;

    let droop = 0;
    for (let k = 0; k < lobes.length; k++) {
      const lb = lobes[k];
      const dist = Math.abs(x - lb.cx);
      if (dist < lb.lw * 0.5) {
        const norm = dist / (lb.lw * 0.5);
        droop += lb.ld * Math.pow(1 - norm * norm, 1.8);
      }
    }

    let cardCornerDrop = 0;
    if (radius > 0 && !isFooterBar) {
      if (x < cardLeft) {
        const tOut = (cardLeft - x) / leftOffset;
        cardCornerDrop = radius * leftDropFactor + tOut * (leftDropFactor > 0.5 ? 2.2 : 0.8);
      } else if (x > cardRight) {
        const tOut = (x - cardRight) / leftOffset;
        cardCornerDrop = radius * rightDropFactor + tOut * (rightDropFactor > 0.5 ? 2.2 : 0.8);
      } else {
        const xCard = x - cardLeft;
        if (xCard < radius) {
          const curve = radius - Math.sqrt(Math.max(0, radius * radius - Math.pow(radius - xCard, 2)));
          cardCornerDrop = curve * leftDropFactor;
        } else if (xCard > W - radius) {
          const curve = radius - Math.sqrt(Math.max(0, radius * radius - Math.pow(xCard - (W - radius), 2)));
          cardCornerDrop = curve * rightDropFactor;
        }
      }
    }

    const y = yOffset + baseDrop + droop + cardCornerDrop;
    bottomPoints.push({ x, y });
  }

  // 10. Build SVG Path strings
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

  if (isFooterBar) {
    // #footer-bar spans edge-to-edge across window: flush vertical ends
    pathD += ` L ${bottomPoints[0].x.toFixed(1)} ${bottomPoints[0].y.toFixed(1)}`;
  } else {
    // Cards: soft filleted end cap
    const rMidY = (lastTop.y + bottomPoints[0].y) * 0.5;
    pathD += ` Q ${(totalW + 1.2).toFixed(1)} ${rMidY.toFixed(1)} ${bottomPoints[0].x.toFixed(1)} ${bottomPoints[0].y.toFixed(1)}`;
  }

  for (let i = 0; i < bottomPoints.length - 1; i++) {
    const curr = bottomPoints[i];
    const next = bottomPoints[i + 1];
    const mx = (curr.x + next.x) * 0.5;
    const my = (curr.y + next.y) * 0.5;
    pathD += ` Q ${curr.x.toFixed(1)} ${curr.y.toFixed(1)} ${mx.toFixed(1)} ${my.toFixed(1)}`;
  }
  const lastBottom = bottomPoints[bottomPoints.length - 1];
  pathD += ` L ${lastBottom.x.toFixed(1)} ${lastBottom.y.toFixed(1)}`;

  if (isFooterBar) {
    pathD += ` L ${topPoints[0].x.toFixed(1)} ${topPoints[0].y.toFixed(1)} Z`;
  } else {
    const lMidY = (lastBottom.y + topPoints[0].y) * 0.5;
    pathD += ` Q ${(-1.2).toFixed(1)} ${lMidY.toFixed(1)} ${topPoints[0].x.toFixed(1)} ${topPoints[0].y.toFixed(1)} Z`;
  }

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
  const numSparkles = isCategory || isCategoryBar || isFooterBar ? 2 : Math.max(3, Math.min(8, Math.round(W / 80)));
  let sparklesSvg = '';
  for (let s = 0; s < numSparkles; s++) {
    const ptIdx = Math.floor(prng() * (topPoints.length - 2)) + 1;
    const pt = topPoints[ptIdx];
    const sx = (pt.x + (prng() - 0.5) * 8).toFixed(1);
    const sy = (pt.y + 1.2 + prng() * 2.5).toFixed(1);
    const sr = (0.7 + prng() * 0.4).toFixed(1);
    const delay = (prng() * 3).toFixed(1);
    sparklesSvg += `<circle cx="${sx}" cy="${sy}" r="${sr}" fill="#ffffff" style="animation: snow-sparkle 2.5s ease-in-out ${delay}s infinite;" />`;
  }

  const gradId = 'snow_g_' + seed;
  const filterId = 'snow_f_' + seed;

  const svgViewBox = isFooterBar
    ? `0 0 ${totalW} ${svgHeight}`
    : `-2 0 ${totalW + 4} ${svgHeight}`;
  const svgStyle = isFooterBar
    ? `--snow-svg-top: -${yOffset}px; --snow-svg-left: 0px; --snow-svg-width: 100%; height: ${svgHeight}px;`
    : `--snow-svg-top: -${yOffset}px; --snow-svg-left: -${leftOffset}px; --snow-svg-width: calc(100% + ${leftOffset * 2}px); height: ${svgHeight}px;`;

  return `
<svg class="card-snow-svg" data-snow-seed="${seed}" data-snow-archetype="${archetypeName}" viewBox="${svgViewBox}" preserveAspectRatio="none" style="${svgStyle}">
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
  private resizeObserver: ResizeObserver | null = null;

  constructor(_ctx?: CanvasRenderingContext2D) {
    this.init();
  }

  private init() {
    this.scanCards();

    if (typeof window !== 'undefined') {
      window.addEventListener('resize', this.handleResize, { passive: true });
      document.addEventListener('astro:page-load', this.handlePageLoad);

      if (typeof MutationObserver !== 'undefined') {
        if (document.body) {
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

        // Listen for background and theme switching
        const themeObserver = new MutationObserver((mutations) => {
          for (const m of mutations) {
            if (m.attributeName === 'data-background' || m.attributeName === 'data-theme') {
              this.handleResize();
              break;
            }
          }
        });
        themeObserver.observe(document.documentElement, {
          attributes: true,
          attributeFilter: ['data-background', 'data-theme'],
        });
      }

      if (typeof ResizeObserver !== 'undefined') {
        this.resizeObserver = new ResizeObserver(() => {
          this.handleResize();
        });
        if (document.body) {
          this.resizeObserver.observe(document.body);
        }
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

      // 彻底消除串层：#footer-wrap 跳过（雪挂在里面的 .footer-main-shell 上）
      if (el.id === 'footer-wrap') continue;

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
            el.classList.contains('card-widget') ||
            el.classList.contains('category-bar') ||
            el.id === 'category-bar' ||
            el.classList.contains('home-top-notice') ||
            el.classList.contains('shijianus-ai-summary') ||
            el.classList.contains('markdown-alert') ||
            el.classList.contains('article-callout') ||
            el.classList.contains('admonition') ||
            el.classList.contains('admonition-details') ||
            el.classList.contains('github-repo-card') ||
            el.classList.contains('video-embed-card') ||
            el.classList.contains('article-audio-card') ||
            el.classList.contains('article-encrypted-box') ||
            el.classList.contains('article-tabs') ||
            el.classList.contains('code-block-shell') ||
            el.matches('figure.highlight') ||
            el.classList.contains('article-table-wrap') ||
            el.classList.contains('footer-main-shell') ||
            el.id === 'footer-bar' ||
            el.id === 'post-comment';
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
      if (W < 40 || H_card < 20) {
        // Element not yet laid out (e.g. dynamically inserted code block or inactive tab)
        if (this.resizeObserver) {
          this.resizeObserver.observe(el);
        }
        continue;
      }

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

      const containerTag = el.closest('.topGroup') ? 'topdeck' : el.closest('#recent-posts') ? 'recentfeed' : 'page';
      const seed = hashString(`${containerTag}-${cardKey}-${resolvedIndex}-${index}`);

      // Compute actual available clearance above this box
      let maxAllowedRise = 14; // Default pleasant snow rise

      // 1. Measure distance to previous sibling or nearest upper element in document flow
      let prev = el.previousElementSibling as HTMLElement | null;
      while (prev && (prev.offsetParent === null || window.getComputedStyle(prev).display === 'none')) {
        prev = prev.previousElementSibling as HTMLElement | null;
      }

      const elRect = el.getBoundingClientRect();
      if (prev) {
        const prevRect = prev.getBoundingClientRect();
        const overlapPrevX = Math.min(elRect.right, prevRect.right) - Math.max(elRect.left, prevRect.left);
        const verticalGap = elRect.top - prevRect.bottom;
        if (overlapPrevX > 20 && verticalGap > 0 && verticalGap < 60) {
          // Leave at least 3.2px breathing air: can snuggle close ("可以紧挨"), but never overlap ("绝不遮挡")!
          maxAllowedRise = Math.min(maxAllowedRise, Math.max(3.8, Math.floor(verticalGap - 3.2)));
        }
      }

      // 2. Universal clearance detection against ANY preceding card vertically above this card
      for (const other of seen) {
        if (other === el || other.offsetParent === null) continue;
        const otherRect = other.getBoundingClientRect();
        const overlapX = Math.min(elRect.right, otherRect.right) - Math.max(elRect.left, otherRect.left);
        if (overlapX > 25 && otherRect.bottom <= elRect.top) {
          const gap = elRect.top - otherRect.bottom;
          if (gap > 0 && gap < 60) {
            maxAllowedRise = Math.min(maxAllowedRise, Math.max(3.8, Math.floor(gap - 3.2)));
          }
        }
      }

      // 3. Special slender components:
      if (el.classList.contains('category-bar') || el.id === 'category-bar') {
        maxAllowedRise = Math.min(maxAllowedRise, 8.5);
      } else if (el.classList.contains('footer-bar-links')) {
        maxAllowedRise = Math.min(maxAllowedRise, 8.0);
      } else if (el.classList.contains('categoryItem')) {
        maxAllowedRise = Math.min(maxAllowedRise, 8.0);
      } else if (el.classList.contains('footer-main-shell')) {
        maxAllowedRise = Math.min(maxAllowedRise, 13.5);
      } else if (el.classList.contains('home-top-notice')) {
        maxAllowedRise = Math.min(maxAllowedRise, 7.5);
      }

      const svgString = generateSnowMantleSvg(W, H_card, radius, seed, el.className || '', cardKey, maxAllowedRise);

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
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
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
