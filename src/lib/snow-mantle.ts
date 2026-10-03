import { siteConfig } from '../config/site';

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

export const INTERACTIVE_CARD_SELECTORS = [
  '#recent-posts .recent-post-item',
  '.recent-post-item',
  '.todayCard',
  '.categoryItem',
  '#random-banner',
  '.relatedPosts-item',
  '.postNav-card',
  '.pagination-post',
  '.home-mobile-focus-card',
  '.github-repo-card',
  '.theme-card',
  '.taxonomy-index-card',
];

export const STATIC_CONTAINER_SELECTORS = [
  '.site-footer',
  '#footer',
  '#footer-wrap',
  '.footer-main-shell',
  '#footer-bar',
  '#post',
  '.post-page-shell',
  '#post-comment',
  '.code-block-shell',
  'figure.highlight',
  '.markdown-alert',
  '.article-callout',
  '.admonition',
  '.admonition-details',
  '.article-table-wrap',
  '.shijianus-ai-summary',
  '.post-copyright',
  '.home-top-notice',
  '#category-bar',
  '.category-bar',
  '.home-pagination',
  '#card-toc',
  '#aside-content .card-widget',
  '.card-widget',
  '.friends-page__panel',
  '.friends-page__hero',
  '.archive-hero-card',
  '.taxonomy-hero-card',
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
  | 'alpine-dune'
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
  'central-cushion',
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
  'alpine-dune',
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

  // 2. Identify Morphological Family (strictly ban two-headed-thick/corner-caps):
  // - 'center-thick': Natural mountain/dune - thickest in center, gracefully sloping to softer, tapered thin ends
  // - 'windswept-left': Asymmetrical drift - thick overhanging drift on left, sleek and thin on right
  // - 'windswept-right': Asymmetrical drift - thick overhanging drift on right, sleek and thin on left
  // - 'level-blanket': Uniform calm snow mattress
  let morphology: 'center-thick' | 'windswept-left' | 'windswept-right' | 'level-blanket' = 'center-thick';
  if (archetypeName === 'windswept-left' || archetypeName === 'heavy-cornice-left' || archetypeName === 'alpine-ridge-left' || archetypeName === 'droop-cluster-left') {
    morphology = 'windswept-left';
  } else if (archetypeName === 'windswept-right' || archetypeName === 'heavy-cornice-right' || archetypeName === 'alpine-ridge-right' || archetypeName === 'droop-cluster-right') {
    morphology = 'windswept-right';
  } else if (
    archetypeName === 'thick-plateau' ||
    archetypeName === 'gentle-powder' ||
    archetypeName === 'icicle-curtain' ||
    archetypeName === 'dual-plateau' ||
    archetypeName === 'frost-pillow' ||
    archetypeName === 'central-cushion'
  ) {
    morphology = 'level-blanket';
  } else {
    morphology = 'center-thick';
  }

  // 3. Geometric Bounds: Zero lateral bleed to guarantee horizontally adjacent cards never fuse
  const padX = 0;
  const extraSide = 0;
  const leftOffset = 0;
  const totalW = W;
  const cardLeft = 0;
  const cardRight = W;

  // 4. Base Thickness & Droop Calibration: Rich natural peaks reaching towards upper bounds
  // Generous drape over card top edge (eliminating naked border lines and sheer membrane effect)
  let targetRise = Math.min(22.0, Math.max(13.0, H_card * 0.12));
  let baseDrop = Math.min(9.5, Math.max(6.5, H_card * 0.04));
  let maxDroop = Math.min(16.0, Math.max(8.5, H_card * 0.08));

  if (isCategoryBar) {
    targetRise = 14.0;
    baseDrop = 4.8;
    maxDroop = 6.8;
  } else if (isFooterBar) {
    targetRise = 12.5;
    baseDrop = 4.2;
    maxDroop = 6.2;
  } else if (isFooterMain) {
    targetRise = 15.0;
    baseDrop = 6.5;
    maxDroop = 9.5;
  } else if (isNotice) {
    targetRise = 6.5;
    baseDrop = 3.2;
    maxDroop = 4.5;
  } else if (isCodeBlock) {
    targetRise = 6.0;
    baseDrop = 3.5;
    maxDroop = 4.8;
  } else if (isCallout) {
    targetRise = 7.0;
    baseDrop = 3.8;
    maxDroop = 5.2;
  } else if (isCategory) {
    targetRise = 8.0;
    baseDrop = 4.0;
    maxDroop = 5.8;
  } else if (isCardInfo) {
    targetRise = 14.5;
    baseDrop = 6.5;
    maxDroop = 9.5;
  } else if (isShort) {
    targetRise = Math.min(9.0, H_card * 0.11);
    maxDroop = Math.min(6.5, H_card * 0.07);
    baseDrop = 3.8;
  }

  // Smooth clearance constraint: Reach generously up to upper baseline without exceeding or occluding
  if (maxAllowedRise > 0 && maxAllowedRise < targetRise) {
    targetRise = Math.max(3.8, maxAllowedRise);
  }

  const yOffset = Math.round(Math.max(28, targetRise * 1.6 + 10));
  const svgHeight = Math.round(yOffset + maxDroop + baseDrop + radius + 20);

  const phi1 = prng() * Math.PI * 2;
  const phi2 = prng() * Math.PI * 2;

  // 5. Width-Scaled Wave Cycles: Across wide cards/bars (W > 500px), generate multiple rolling dunes every ~180px
  const waveCycles = Math.max(1, Math.min(8, Math.round(W / 180)));
  const waveAmplitude = Math.max(3.5, Math.min(8.5, targetRise * 0.50));

  // 6. Archetype Profile Function: Evaluates thickness multiplier at u in [0, 1]
  // Every archetype provides vibrant, organic topography with ZERO ruler-flat tabletop segments
  const getArchetypeProfile = (u: number): number => {
    switch (archetypeName) {
      case 'windswept-left': {
        return 0.55 + 0.55 * Math.exp(-Math.pow(u / 0.38, 2)) + (1 - u) * 0.20 + 0.08 * Math.sin(u * Math.PI * 3 + phi1);
      }
      case 'windswept-right': {
        return 0.55 + 0.55 * Math.exp(-Math.pow((1 - u) / 0.38, 2)) + u * 0.20 + 0.08 * Math.sin(u * Math.PI * 3 + phi1);
      }
      case 'dual-crest-saddle': {
        const p1 = Math.exp(-Math.pow((u - 0.26) / 0.18, 2)) * 0.48;
        const p2 = Math.exp(-Math.pow((u - 0.74) / 0.18, 2)) * 0.48;
        return 0.50 + p1 + p2 + 0.10 * Math.sin(u * Math.PI * 4 + phi1);
      }
      case 'triple-dome': {
        const p1 = Math.exp(-Math.pow((u - 0.20) / 0.15, 2)) * 0.42;
        const p2 = Math.exp(-Math.pow((u - 0.50) / 0.16, 2)) * 0.50;
        const p3 = Math.exp(-Math.pow((u - 0.80) / 0.15, 2)) * 0.42;
        return 0.48 + p1 + p2 + p3;
      }
      case 'quad-hill': {
        return 0.60 + 0.38 * Math.sin(u * Math.PI * 4 * waveCycles + phi1) + 0.10 * Math.cos(u * Math.PI * 2 + phi2);
      }
      case 'thick-plateau': {
        return 0.65 + 0.28 * Math.sin(u * Math.PI * 2 * waveCycles + phi1) + 0.16 * Math.cos(u * Math.PI * 3.5 * waveCycles + phi2);
      }
      case 'icicle-curtain': {
        return 0.62 + 0.32 * Math.sin(u * Math.PI * 3 * waveCycles + phi1) + 0.10 * Math.sin(u * Math.PI * 6 + phi2);
      }
      case 'central-cushion': {
        return 0.58 + 0.48 * Math.exp(-Math.pow((u - 0.50) / 0.28, 2)) + 0.10 * Math.sin(u * Math.PI * 3 + phi1);
      }
      case 'scalloped-crest': {
        return 0.58 + 0.40 * Math.abs(Math.sin(u * Math.PI * 2.5 * waveCycles + phi1)) + 0.08 * Math.cos(u * Math.PI * 5);
      }
      case 'alpine-ridge-left': {
        return 0.50 + 0.58 * Math.exp(-Math.pow((u - 0.30) / 0.22, 2)) + 0.12 * Math.sin(u * Math.PI * 2.5 + phi1);
      }
      case 'alpine-ridge-right': {
        return 0.50 + 0.58 * Math.exp(-Math.pow((u - 0.70) / 0.22, 2)) + 0.12 * Math.sin(u * Math.PI * 2.5 + phi1);
      }
      case 'center-peak': {
        return 0.48 + 0.68 * Math.exp(-Math.pow((u - 0.50) / 0.24, 2)) + 0.08 * Math.sin(u * Math.PI * 4 + phi1);
      }
      case 'heavy-cornice-left': {
        return 0.52 + 0.54 * Math.exp(-Math.pow((u - 0.25) / 0.26, 2)) + 0.12 * Math.sin(u * Math.PI * 2 + phi1);
      }
      case 'heavy-cornice-right': {
        return 0.52 + 0.54 * Math.exp(-Math.pow((u - 0.75) / 0.26, 2)) + 0.12 * Math.sin(u * Math.PI * 2 + phi1);
      }
      case 'sawtooth-drift': {
        return 0.55 + ((u * waveCycles * 2 + phi1 / Math.PI) % 1.0) * 0.42;
      }
      case 'puffy-cumulus': {
        return 0.56 + 0.42 * Math.abs(Math.sin(u * Math.PI * 2.2 * waveCycles + phi1)) + 0.10 * Math.cos(u * Math.PI * 4.4 + phi2);
      }
      case 'gentle-powder': {
        return 0.68 + 0.26 * Math.sin(u * Math.PI * 2 * waveCycles + phi1) + 0.12 * Math.cos(u * Math.PI * 3.8 + phi2);
      }
      case 'wave-cascade': {
        return 0.58 + 0.34 * Math.sin(u * Math.PI * 2 * waveCycles + phi1) + 0.16 * Math.sin(u * Math.PI * 4.2 * waveCycles + phi2);
      }
      case 'alpine-dune': {
        return 0.52 + 0.52 * Math.sin(Math.pow(u, 0.8) * Math.PI) + 0.12 * Math.sin(u * Math.PI * 3 + phi1);
      }
      case 'droop-cluster-left': {
        return 0.54 + 0.48 * Math.exp(-Math.pow((u - 0.25) / 0.24, 2)) + 0.10 * Math.sin(u * Math.PI * 2 + phi1);
      }
      case 'droop-cluster-right': {
        return 0.54 + 0.48 * Math.exp(-Math.pow((u - 0.75) / 0.24, 2)) + 0.10 * Math.sin(u * Math.PI * 2 + phi1);
      }
      case 'dual-plateau': {
        return 0.62 + 0.28 * (u < 0.5 ? 0.75 : 0.45) + 0.16 * Math.sin(u * Math.PI * 2 * waveCycles + phi1);
      }
      case 'frost-pillow': {
        return 0.65 + 0.38 * Math.sin(u * Math.PI) + 0.10 * Math.cos(u * Math.PI * 3 + phi1);
      }
      case 'asymmetric-dune':
      default: {
        return 0.52 + 0.54 * Math.sin(Math.pow(u, 0.7) * Math.PI) + 0.10 * Math.sin(u * Math.PI * 2.5 + phi2);
      }
    }
  };

  // 7. Organic Shoulder & Rollover Parameters (Eradicate Artificial Flat Boundary Slicing)
  // Real snow drifts form rounded volumetric crowns that naturally cap the corner shoulders of objects.
  const isScreenEdge = isFooterBar;
  const shoulderL = isScreenEdge ? 10 : Math.max(14, Math.min(W * 0.28, radius * 1.35 + 4 + prng() * 4));
  const shoulderR = isScreenEdge ? 10 : Math.max(14, Math.min(W * 0.28, radius * 1.35 + 4 + prng() * 4));

  // Organic crest shift: Nature doesn't place the mountain crest at exact 50.00% center
  const centerShift = (prng() - 0.5) * 0.16; // -0.08 to +0.08 shift
  const peakU = Math.max(0.40, Math.min(0.60, 0.5 + centerShift));

  // Volumetric corner snow cap thickness: genuine substance (never an artificial 1.2px shaved wire!)
  const cornerThickL = isScreenEdge
    ? targetRise * 0.82
    : Math.max(6.0, Math.min(targetRise * 0.50, targetRise * 0.40 + (prng() - 0.5) * 1.5));
  const cornerThickR = isScreenEdge
    ? targetRise * 0.82
    : Math.max(6.0, Math.min(targetRise * 0.50, targetRise * 0.40 + (prng() - 0.5) * 1.5));

  // 8. Top Points Generation: Natural Morphological Profiles with Organic Relief
  // Inset provides horizontal runway for convex bulbous corner domes that wrap around edges
  const inset = isScreenEdge ? 0 : Math.max(2.4, Math.min(3.6, radius > 0 ? radius * 0.28 : 2.5));
  const numTop = Math.max(48, Math.min(160, Math.round(W / 8)));
  const topPoints: { x: number; y: number }[] = [];

  for (let i = 0; i < numTop; i++) {
    const u = i / (numTop - 1); // 0.0 to 1.0 across card width
    const x = inset + u * (W - 2 * inset);

    // A. Morphological family envelope with organic crest shift:
    let envelope = 1.0;
    if (morphology === 'level-blanket') {
      const uShifted = Math.pow(u, 0.95 + centerShift * 0.25);
      envelope = 0.72 + 0.22 * Math.sin(uShifted * Math.PI) + 0.10 * Math.sin(u * Math.PI * 2 * waveCycles + phi1);
    } else if (morphology === 'windswept-left') {
      const uW = Math.max(0, Math.min(1, 1 - u));
      envelope = 0.22 + 0.78 * Math.sin(Math.pow(uW, 0.65 + centerShift * 0.4) * (Math.PI * 0.5));
    } else if (morphology === 'windswept-right') {
      const uW = Math.max(0, Math.min(1, u));
      envelope = 0.22 + 0.78 * Math.sin(Math.pow(uW, 0.65 - centerShift * 0.4) * (Math.PI * 0.5));
    } else {
      // 'center-thick' / natural rolling dunes:
      const distFromPeak = u < peakU ? u / peakU : (1 - u) / (1 - peakU);
      envelope = 0.35 + 0.70 * Math.sin(distFromPeak * (Math.PI * 0.5));
    }

    // B. Archetype base profile (individual personality per card)
    const baseProf = getArchetypeProfile(u);

    // C. Multi-frequency organic waves & granular micro-texture for living snow relief (never ruler-flat, never synthetic)
    const wave1 = Math.sin(u * Math.PI * 2.0 * waveCycles + phi1) * 0.16;
    const wave2 = Math.cos(u * Math.PI * 4.2 * waveCycles + phi2) * 0.08;
    const microPuff = Math.sin(u * Math.PI * 9.5 * waveCycles + phi1 * 1.5) * 0.045;
    // Granular drift perturbation (organic natural lumpiness, breaks mathematical perfection)
    const organicNoise = (Math.sin(u * 37.3 + phi2 * 2.1) * 0.5 + Math.cos(u * 53.1 + phi1 * 1.7) * 0.5) * 0.035;
    const organicRelief = Math.max(0.48, baseProf * 0.82 + wave1 + wave2 + microPuff + organicNoise);

    // D. Target full snow height without edge decay
    const rawHeight = targetRise * envelope * organicRelief;

    // E. Natural shoulder rollover with cubic smoothstep + organic grain texture at edges
    // Real snow crystal structure at boundaries: high-frequency micro-irregularity, NOT a smooth mathematical arc
    let snowThick = rawHeight;
    let cardCornerDrop = 0;

    if (x < shoulderL) {
      const t = x / shoulderL;
      const s = t * t * (3 - 2 * t);
      // Edge crystalline grain: multi-frequency noise strongest at x=0, fading toward body
      // This breaks the mathematically perfect smoothstep curve with organic micro-protrusions
      const edgeGrain = (
        Math.sin(x * 11.7 + phi1 * 3.2) * 0.40 +
        Math.cos(x * 7.3 + phi2 * 1.9) * 0.25 +
        Math.sin(x * 21.9 + phi1 * 0.8) * 0.16 +
        Math.cos(x * 4.1 + phi2 * 2.7) * 0.12
      ) * cornerThickL * 0.18 * (1 - s);
      snowThick = cornerThickL + (rawHeight - cornerThickL) * s + edgeGrain;
      if (radius > 0 && x < radius) {
        const xOffset = radius - x;
        cardCornerDrop = radius - Math.sqrt(Math.max(0, radius * radius - xOffset * xOffset));
      }
    } else if (x > W - shoulderR) {
      const t = (W - x) / shoulderR;
      const s = t * t * (3 - 2 * t);
      // Edge crystalline grain at right shoulder
      const dx = W - x;
      const edgeGrain = (
        Math.sin(dx * 11.7 + phi2 * 3.2) * 0.40 +
        Math.cos(dx * 7.3 + phi1 * 1.9) * 0.25 +
        Math.sin(dx * 21.9 + phi2 * 0.8) * 0.16 +
        Math.cos(dx * 4.1 + phi1 * 2.7) * 0.12
      ) * cornerThickR * 0.18 * (1 - s);
      snowThick = cornerThickR + (rawHeight - cornerThickR) * s + edgeGrain;
      if (radius > 0 && x > W - radius) {
        const xOffset = x - (W - radius);
        cardCornerDrop = radius - Math.sqrt(Math.max(0, radius * radius - xOffset * xOffset));
      }
    }

    // Snow top: softly crowns the corner shoulder with a smooth convex dome
    const y = yOffset + cardCornerDrop * 0.70 - snowThick;
    topPoints.push({ x, y });
  }

  // 8. Generate Drooping Lobes Tailored to Archetype (Central hanging tongues / drapes)
  const lobes: { cx: number; lw: number; ld: number }[] = [];

  if (archetypeName === 'windswept-left' || archetypeName === 'heavy-cornice-left' || archetypeName === 'alpine-ridge-left' || archetypeName === 'droop-cluster-left') {
    lobes.push({ cx: Math.max(radius + 15, Math.min(W - radius - 15, W * 0.28)), lw: 40 + prng() * 16, ld: maxDroop * 0.95 });
    lobes.push({ cx: Math.max(radius + 15, Math.min(W - radius - 15, W * 0.48)), lw: 28 + prng() * 12, ld: maxDroop * 0.65 });
  } else if (archetypeName === 'windswept-right' || archetypeName === 'heavy-cornice-right' || archetypeName === 'alpine-ridge-right' || archetypeName === 'droop-cluster-right') {
    lobes.push({ cx: Math.max(radius + 15, Math.min(W - radius - 15, W * 0.72)), lw: 40 + prng() * 16, ld: maxDroop * 0.95 });
    lobes.push({ cx: Math.max(radius + 15, Math.min(W - radius - 15, W * 0.52)), lw: 28 + prng() * 12, ld: maxDroop * 0.65 });
  } else if (archetypeName === 'alpine-dune') {
    lobes.push({ cx: Math.max(radius + 15, Math.min(W - radius - 15, W * 0.25)), lw: 32 + prng() * 10, ld: maxDroop * 0.70 });
    lobes.push({ cx: Math.max(radius + 15, Math.min(W - radius - 15, W * 0.75)), lw: 32 + prng() * 10, ld: maxDroop * 0.70 });
  } else if (archetypeName === 'dual-crest-saddle') {
    lobes.push({ cx: Math.max(radius + 15, Math.min(W - radius - 15, W * 0.32)), lw: 32 + prng() * 12, ld: maxDroop * 0.85 });
    lobes.push({ cx: Math.max(radius + 15, Math.min(W - radius - 15, W * 0.68)), lw: 32 + prng() * 12, ld: maxDroop * 0.85 });
  } else if (archetypeName === 'triple-dome' || archetypeName === 'quad-hill') {
    lobes.push({ cx: Math.max(radius + 15, Math.min(W - radius - 15, W * 0.28)), lw: 26 + prng() * 10, ld: maxDroop * 0.70 });
    lobes.push({ cx: Math.max(radius + 15, Math.min(W - radius - 15, W * 0.50)), lw: 32 + prng() * 12, ld: maxDroop * 0.90 });
    lobes.push({ cx: Math.max(radius + 15, Math.min(W - radius - 15, W * 0.72)), lw: 26 + prng() * 10, ld: maxDroop * 0.70 });
  } else if (archetypeName === 'center-peak' || archetypeName === 'frost-pillow') {
    lobes.push({ cx: W * 0.50, lw: 44 + prng() * 16, ld: maxDroop * 0.95 });
    lobes.push({ cx: Math.max(radius + 15, W * 0.26), lw: 24 + prng() * 8, ld: maxDroop * 0.45 });
    lobes.push({ cx: Math.min(W - radius - 15, W * 0.74), lw: 24 + prng() * 8, ld: maxDroop * 0.45 });
  } else if (archetypeName === 'icicle-curtain') {
    const numIcicles = W < 260 ? 3 : Math.min(6, Math.round(W / 65));
    for (let k = 0; k < numIcicles; k++) {
      const targetU = (k + 0.5 + (prng() - 0.5) * 0.25) / numIcicles;
      lobes.push({
        cx: Math.max(radius + 15, Math.min(W - radius - 15, targetU * W)),
        lw: 18 + prng() * 8,
        ld: Math.min(maxDroop, 3.5 + prng() * 4.0),
      });
    }
  } else if (archetypeName === 'thick-plateau') {
    const numL = isCategory ? 2 : W < 260 ? 3 : 4;
    for (let k = 0; k < numL; k++) {
      const targetU = (k + 0.5 + (prng() - 0.5) * 0.2) / numL;
      lobes.push({
        cx: Math.max(radius + 15, Math.min(W - radius - 15, targetU * W)),
        lw: 26 + prng() * 10,
        ld: Math.min(maxDroop * 0.60, 3.5),
      });
    }
  } else {
    const numL = W < 260 ? 2 : 3;
    for (let k = 0; k < numL; k++) {
      const targetU = (k + 0.5 + (prng() - 0.5) * 0.3) / numL;
      lobes.push({
        cx: Math.max(radius + 15, Math.min(W - radius - 15, targetU * W)),
        lw: 26 + prng() * 14,
        ld: Math.min(maxDroop * (0.45 + prng() * 0.50), maxDroop),
      });
    }
  }

  // 9. Bottom Points Generation: Sampled from Right (W) to Left (0)
  const numBottom = Math.max(48, Math.min(160, Math.round(W / 8)));
  const bottomPoints: { x: number; y: number }[] = [];

  for (let i = numBottom - 1; i >= 0; i--) {
    const u = i / (numBottom - 1);
    const x = inset + u * (W - 2 * inset);

    // Organic living drape wave along bottom edge (continuous natural sag, never a flat ruler line)
    const bottomWave = (Math.sin(u * Math.PI * 3.8 + phi1) * 0.55 + Math.cos(u * Math.PI * 7.2 + phi2) * 0.35) * (baseDrop * 0.35);

    // Central drooping lobes (hanging snow tongues, naturally centered)
    const lobeEnvelope = Math.pow(Math.sin(u * Math.PI), 0.75);
    let rawDroop = 0;
    for (let k = 0; k < lobes.length; k++) {
      const lb = lobes[k];
      const dist = Math.abs(x - lb.cx);
      if (dist < lb.lw * 0.5) {
        const norm = dist / (lb.lw * 0.5);
        rawDroop += lb.ld * Math.pow(1 - norm * norm, 1.8);
      }
    }
    const droop = rawDroop * lobeEnvelope;

    // Corner conforming for bottom edge (wrapping card rounded corners gracefully down)
    let cardCornerDrop = 0;
    let endDrape = 1.0;

    if (x < shoulderL) {
      const t = x / shoulderL;
      const s = t * t * (3 - 2 * t);
      endDrape = 0.65 + 0.35 * s;
      if (radius > 0 && x < radius) {
        const xOffset = radius - x;
        cardCornerDrop = radius - Math.sqrt(Math.max(0, radius * radius - xOffset * xOffset));
      }
    } else if (x > W - shoulderR) {
      const t = (W - x) / shoulderR;
      const s = t * t * (3 - 2 * t);
      endDrape = 0.65 + 0.35 * s;
      if (radius > 0 && x > W - radius) {
        const xOffset = x - (W - radius);
        cardCornerDrop = radius - Math.sqrt(Math.max(0, radius * radius - xOffset * xOffset));
      }
    }

    // Wrap around corner shoulders: cardCornerDrop * 0.72 ensures snow smoothly rounds over the corner curve
    const y = yOffset + (baseDrop + bottomWave + droop) * endDrape + cardCornerDrop * 0.72;
    bottomPoints.push({ x, y });
  }

  // 10. Build SVG Path strings: Clean Boundary Fillets & Smooth Convex Connectors
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

  // Right edge connection: Organic convex bulbous dome (soft rounded nose, zero sliced flat wall)
  // Real snow forms a rounded convex cap over corners rather than being sliced flush vertically
  const rBot = bottomPoints[0];
  if (isScreenEdge) {
    pathD += ` L ${W.toFixed(1)} ${lastTop.y.toFixed(1)} L ${W.toFixed(1)} ${rBot.y.toFixed(1)} L ${rBot.x.toFixed(1)} ${rBot.y.toFixed(1)}`;
  } else {
    // Convex bulbous dome: curves smoothly from lastTop outward to card edge and into rBot
    const rSpanY = rBot.y - lastTop.y;
    const numSteps = 8;
    const maxBulge = Math.max(1.8, inset - 0.4);
    for (let k = 1; k < numSteps; k++) {
      const t = k / numSteps;
      const wy = lastTop.y + rSpanY * t;
      const bulge = Math.sin(t * Math.PI) * maxBulge;
      // Gentle crystalline grain noise that fades at the two endpoints
      const grain = (Math.sin(t * 13.7 + phi1 * 2.1) * 0.15 + Math.cos(t * 7.3 + phi2 * 1.5) * 0.10) * Math.sin(t * Math.PI);
      const wx = Math.min(W - 0.2, (W - inset) + bulge + grain);
      pathD += ` L ${wx.toFixed(1)} ${wy.toFixed(1)}`;
    }
    pathD += ` L ${rBot.x.toFixed(1)} ${rBot.y.toFixed(1)}`;
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

  // Left edge connection: Organic convex bulbous dome (soft rounded nose, zero sliced flat wall)
  // Curves smoothly from lastBottom outward to left edge and into lTop
  const lTop = topPoints[0];
  if (isScreenEdge) {
    pathD += ` L 0.0 ${lastBottom.y.toFixed(1)} L 0.0 ${lTop.y.toFixed(1)} Z`;
  } else {
    const lSpanY = lTop.y - lastBottom.y;
    const numSteps = 8;
    const maxBulge = Math.max(1.8, inset - 0.4);
    for (let k = 1; k < numSteps; k++) {
      const t = k / numSteps;
      const wy = lastBottom.y + lSpanY * t;
      const bulge = Math.sin(t * Math.PI) * maxBulge;
      const grain = (Math.cos(t * 13.7 + phi2 * 2.1) * 0.15 + Math.sin(t * 7.3 + phi1 * 1.5) * 0.10) * Math.sin(t * Math.PI);
      const wx = Math.max(0.2, inset - bulge - grain);
      pathD += ` L ${wx.toFixed(1)} ${wy.toFixed(1)}`;
    }
    pathD += ` L ${lTop.x.toFixed(1)} ${lTop.y.toFixed(1)} Z`;
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
    const inY = yOffset - (yOffset - pt.y) * 0.40;
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

  const svgViewBox = `0 0 ${W} ${svgHeight}`;
  const svgStyle = `--snow-svg-top: -${yOffset}px; --snow-svg-left: 0px; --snow-svg-width: 100%; height: ${svgHeight}px;`;

  return `
<svg class="card-snow-svg" data-snow-seed="${seed}" data-snow-archetype="${archetypeName}" viewBox="${svgViewBox}" preserveAspectRatio="none" style="${svgStyle}">
  <defs>
    <linearGradient id="${gradId}" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="1" />
      <stop offset="55%" stop-color="#f8fafc" stop-opacity="1" />
      <stop offset="85%" stop-color="#eef5fc" stop-opacity="1" />
      <stop offset="100%" stop-color="var(--snow-lobe-color, #94b2d2)" stop-opacity="1" />
    </linearGradient>
    <filter id="${filterId}" x="-10%" y="-10%" width="120%" height="130%">
      <feDropShadow dx="0" dy="1.5" stdDeviation="1.2" flood-color="var(--snow-ao-color, rgba(70,95,130,0.32))" />
    </filter>
  </defs>
  <path class="snow-solid-base" d="${pathD}" fill="#ffffff" />
  <path class="snow-body" d="${pathD}" fill="url(#${gradId})" filter="url(#${filterId})" />
  <path class="snow-dome" d="${domeD}" fill="var(--snow-dome-color, rgba(255, 255, 255, 0.65))" />
  <path class="snow-rim" d="${rimD}" fill="none" stroke="var(--snow-rim-color, rgba(255, 255, 255, 0.95))" stroke-width="1.2" stroke-linecap="round" />
  <g class="snow-sparkles">${sparklesSvg}</g>
</svg>
`.trim();
}

export interface SnowMantleOptions {
  enableMantle?: boolean;
  homeOnly?: boolean;
  enableAccumulation?: boolean; // alias for enableMantle
  onlyHome?: boolean; // alias for homeOnly
}

/**
 * SnowMantleEngine: In-Card Attached DOM Vector Snow Mantle Controller
 */
export class SnowMantleEngine {
  private resizeTimeout: any = null;
  private isDestroyed = false;
  private mutationObserver: MutationObserver | null = null;
  private resizeObserver: ResizeObserver | null = null;
  private intersectionObserver: IntersectionObserver | null = null;
  private options?: SnowMantleOptions;

  constructor(_ctx?: CanvasRenderingContext2D, options?: SnowMantleOptions) {
    this.options = options;
    this.init();
  }

  public updateConfig(options?: SnowMantleOptions) {
    if (options) {
      this.options = { ...this.options, ...options };
    }
    if (!this.isMantleActiveOnCurrentPage()) {
      this.clearAllMantles();
    } else {
      this.scanCards();
    }
  }

  /**
   * Determine whether snow mantle accumulation is enabled and active on the current page
   * Evaluation precedence:
   * 1. SSR HTML attributes (data-snow-mantle-enabled, data-snow-mantle-home-only)
   * 2. Engine instance options
   * 3. Runtime window.__SNOW_MANTLE_CONFIG__ (highest priority for dynamic tests/scripts)
   */
  public isMantleActiveOnCurrentPage(): boolean {
    if (typeof window === 'undefined' || typeof document === 'undefined') return false;

    const win = window as any;
    const root = document.documentElement;

    let enableMantle = siteConfig.theme.background.snow?.enableMantle ?? false;
    let homeOnly = siteConfig.theme.background.snow?.homeOnly ?? false;

    // 1. SSR HTML attributes
    if (root?.dataset?.snowMantleEnabled !== undefined) {
      enableMantle = root.dataset.snowMantleEnabled === 'true';
    }
    if (root?.dataset?.snowMantleHomeOnly !== undefined) {
      homeOnly = root.dataset.snowMantleHomeOnly === 'true';
    }

    // 2. Engine constructor options
    if (this.options?.enableMantle !== undefined) {
      enableMantle = this.options.enableMantle;
    } else if (this.options?.enableAccumulation !== undefined) {
      enableMantle = this.options.enableAccumulation;
    }
    if (this.options?.homeOnly !== undefined) {
      homeOnly = this.options.homeOnly;
    } else if (this.options?.onlyHome !== undefined) {
      homeOnly = this.options.onlyHome;
    }

    // 3. Runtime window.__SNOW_MANTLE_CONFIG__ (highest priority for live tests and stationmaster dynamic scripts)
    if (win.__SNOW_MANTLE_CONFIG__?.enableMantle !== undefined) {
      enableMantle = !!win.__SNOW_MANTLE_CONFIG__.enableMantle;
    } else if (win.__SNOW_MANTLE_CONFIG__?.enableAccumulation !== undefined) {
      enableMantle = !!win.__SNOW_MANTLE_CONFIG__.enableAccumulation;
    }
    if (win.__SNOW_MANTLE_CONFIG__?.homeOnly !== undefined) {
      homeOnly = !!win.__SNOW_MANTLE_CONFIG__.homeOnly;
    } else if (win.__SNOW_MANTLE_CONFIG__?.onlyHome !== undefined) {
      homeOnly = !!win.__SNOW_MANTLE_CONFIG__.onlyHome;
    }

    if (!enableMantle) {
      return false;
    }

    if (homeOnly) {
      return this.isHomePage();
    }

    return true;
  }

  public isHomePage(): boolean {
    if (typeof document === 'undefined') return false;
    const pageType = document.body?.getAttribute('data-type') || document.body?.dataset?.type;
    if (pageType === 'home') return true;
    if (pageType && pageType !== 'home') return false;

    if (typeof window !== 'undefined') {
      const p = window.location.pathname.replace(/\/+$/, '') || '/';
      return p === '/' || /^\/(?:page\/\d+)$/.test(p);
    }
    return false;
  }

  public clearAllMantles() {
    if (typeof document === 'undefined') return;
    document.documentElement.dataset.snowMantle = 'disabled';
    const detachedFlakes = document.querySelectorAll('.snow-detached-flake');
    detachedFlakes.forEach((flake) => flake.remove());
    const svgs = document.querySelectorAll('.card-snow-svg');
    svgs.forEach((svg) => {
      const parent = svg.parentElement;
      if (parent) {
        parent.style.removeProperty('border-top-color');
        parent.style.removeProperty('overflow');
      }
      svg.remove();
    });
  }

  private init() {
    this.scanCards();

    if (typeof window !== 'undefined') {
      window.addEventListener('resize', this.handleResize, { passive: true });
      document.addEventListener('astro:page-load', this.handlePageLoad);

      if (typeof IntersectionObserver !== 'undefined') {
        this.intersectionObserver = new IntersectionObserver(
          (entries) => {
            for (const entry of entries) {
              const svg = entry.target.querySelector<SVGElement>(':scope > .card-snow-svg');
              if (svg) {
                if (entry.isIntersecting) {
                  svg.classList.remove('is-offscreen');
                } else {
                  svg.classList.add('is-offscreen');
                }
              }
            }
          },
          { rootMargin: '200px 0px 200px 0px' }
        );
      }

      if (typeof document !== 'undefined') {
        document.addEventListener('pointerenter', this.handlePointerEnter, true);
        document.addEventListener('pointerover', this.handlePointerEnter, { passive: true });
      }

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

  private handlePointerEnter = (e: PointerEvent) => {
    if (this.isDestroyed || !this.isMantleActiveOnCurrentPage()) return;
    if (e.pointerType === 'touch') return; // Ignore mobile touch taps
    const rawTarget = e.target;
    if (!rawTarget) return;
    const target = (rawTarget instanceof Element ? rawTarget : (rawTarget as Node).parentElement) as HTMLElement | null;
    if (!target || typeof target.closest !== 'function') return;

    // 1. Strict defense: if within any static structural container or reading block, bail out immediately!
    if (target.closest(STATIC_CONTAINER_SELECTORS.join(', '))) {
      return;
    }

    // 2. Strict whitelist: only trigger for truly interactive, clickable cards
    const card = target.closest<HTMLElement>(INTERACTIVE_CARD_SELECTORS.join(', '));
    if (!card) return;
    const svg = card.querySelector<SVGElement>(':scope > .card-snow-svg');
    if (!svg) return;

    // Debounce per card (1.2s cooldown)
    const now = performance.now();
    const lastTime = Number(card.dataset.snowLastFlakeTime || 0);
    if (now - lastTime < 1200) return;
    card.dataset.snowLastFlakeTime = String(now);

    this.spawnMicroFlakes(card);
  };

  private spawnMicroFlakes(card: HTMLElement) {
    const W = card.offsetWidth;
    if (W < 40) return;

    // Spawn 2~3 detaching micro-snowflakes from the snow lobes
    const count = 2 + Math.floor(Math.random() * 2);
    for (let i = 0; i < count; i++) {
      const flake = document.createElement('div');
      flake.className = 'snow-detached-flake';

      const startX = Math.round(W * 0.15 + Math.random() * (W * 0.70));
      const startY = Math.round(14 + Math.random() * 10);
      const driftX = (Math.random() - 0.45) * 22;
      const driftY = 32 + Math.random() * 28;
      const duration = 1.1 + Math.random() * 0.45;
      const delay = i * 0.12;

      flake.style.left = `${startX}px`;
      flake.style.top = `${startY}px`;
      flake.style.setProperty('--drift-x', `${driftX.toFixed(1)}px`);
      flake.style.setProperty('--drift-y', `${driftY.toFixed(1)}px`);
      flake.style.setProperty('--drift-duration', `${duration.toFixed(2)}s`);
      flake.style.setProperty('--drift-delay', `${delay.toFixed(2)}s`);

      card.appendChild(flake);

      const cleanup = () => {
        if (flake && flake.parentNode) {
          flake.parentNode.removeChild(flake);
        }
      };

      flake.addEventListener('animationend', cleanup, { once: true });
      flake.addEventListener('animationcancel', cleanup, { once: true });
      setTimeout(cleanup, 1800);
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

    if (!this.isMantleActiveOnCurrentPage()) {
      this.clearAllMantles();
      return;
    }

    document.documentElement.dataset.snowMantle = 'active';

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
          if (this.intersectionObserver) {
            this.intersectionObserver.observe(el);
          }
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
      let maxAllowedRise = 22; // Default generous snow rise for open headroom

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
        if (overlapPrevX > 20 && verticalGap > 0 && verticalGap < 80) {
          // Can snuggle close ("可以到达其它方框的底线，但绝不遮挡、超越")
          // Leave 1.5px micro air-cushion to prevent overlapping
          maxAllowedRise = Math.min(maxAllowedRise, Math.max(4.0, Math.floor(verticalGap - 1.5)));
        }
      }

      // 2. Universal clearance detection against ANY preceding card vertically above this card
      for (const other of seen) {
        if (other === el || other.offsetParent === null) continue;
        const otherRect = other.getBoundingClientRect();
        const overlapX = Math.min(elRect.right, otherRect.right) - Math.max(elRect.left, otherRect.left);
        if (overlapX > 25 && otherRect.bottom <= elRect.top) {
          const gap = elRect.top - otherRect.bottom;
          if (gap > 0 && gap < 80) {
            maxAllowedRise = Math.min(maxAllowedRise, Math.max(4.0, Math.floor(gap - 1.5)));
          }
        }
      }

      const svgString = generateSnowMantleSvg(W, H_card, radius, seed, el.className || '', cardKey, maxAllowedRise);

      // Ensure card has relative/absolute positioning and visible overflow
      if (computed.position === 'static') {
        el.style.position = 'relative';
      }
      el.style.setProperty('overflow', 'visible', 'important');
      el.style.setProperty('border-top-color', 'transparent', 'important');

      // Insert as last child of the card so it renders above background and images
      el.insertAdjacentHTML('beforeend', svgString);

      if (this.intersectionObserver) {
        this.intersectionObserver.observe(el);
      }
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
    if (this.intersectionObserver) {
      this.intersectionObserver.disconnect();
      this.intersectionObserver = null;
    }
    if (typeof window !== 'undefined') {
      window.removeEventListener('resize', this.handleResize);
      document.removeEventListener('astro:page-load', this.handlePageLoad);
    }
    if (typeof document !== 'undefined') {
      document.removeEventListener('pointerenter', this.handlePointerEnter, true);
      document.removeEventListener('pointerover', this.handlePointerEnter);
      this.clearAllMantles();
    }
  }
}
