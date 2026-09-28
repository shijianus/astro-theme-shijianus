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
  '.footer-bar-links',
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
  | 'thick-plateau'
  | 'icicle-curtain'
  | 'corner-caps'
  | 'scalloped-crest'
  | 'alpine-ridge'
  | 'sawtooth-drift'
  | 'puffy-cumulus'
  | 'heavy-cornice'
  | 'gentle-powder'
  | 'wave-cascade'
  | 'center-dip-valley'
  | 'droop-cluster';

export const SNOW_ARCHETYPES: SnowArchetype[] = [
  'windswept-left',
  'windswept-right',
  'dual-crest-saddle',
  'triple-dome',
  'thick-plateau',
  'icicle-curtain',
  'corner-caps',
  'scalloped-crest',
  'alpine-ridge',
  'sawtooth-drift',
  'puffy-cumulus',
  'heavy-cornice',
  'gentle-powder',
  'wave-cascade',
  'center-dip-valley',
  'droop-cluster',
];

/**
 * Generate Procedural SVG Snow Mantle with 16 Diverse Archetypes,
 * Full Volumetric Corner Crowns (Zero Sagging at Edges), and Zero-Occlusion Clearance.
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
  const isFooterBarLinks = className.includes('footer-bar-links');
  const isFooterMain = className.includes('footer-main-shell');
  const isShort = H_card < 120;

  // 1. Select from 16 Rich Archetypes
  let archetypeIndex = Math.abs(seed) % SNOW_ARCHETYPES.length;
  if (className.includes('recent-post-item')) {
    // Dynamically varied across the 16 distinct archetypes using resolved index offset
    archetypeIndex = (Math.abs(seed) + Math.abs(seed >> 4)) % SNOW_ARCHETYPES.length;
  }
  if (isCategory) {
    archetypeIndex = 4; // categoryItem uses compact thick-plateau
  } else if (isCardInfo) {
    archetypeIndex = 4; // profile-card uses clean thick-plateau
  } else if (isCategoryBar || isFooterBarLinks) {
    archetypeIndex = 12; // Slender bars use delicate gentle-powder
  }
  const archetypeName = SNOW_ARCHETYPES[archetypeIndex];

  // 0. Overhang padding to allow snow to wrap naturally around card corners
  const padX = Math.min(6.0, Math.max(3.5, radius * 0.35));
  const totalW = Math.round(W + padX * 2);
  const cardLeft = padX;
  const cardRight = padX + W;

  // Base thickness & droop calibration (Decoupled upwards rise vs downwards drape)
  let targetRise = Math.min(11.5, Math.max(7.5, H_card * 0.09));
  let baseDrop = 2.2;
  let maxDroop = Math.min(8.0, Math.max(4.2, H_card * 0.06));

  if (isCategory) {
    targetRise = 5.5;
    baseDrop = 1.2;
    maxDroop = 3.0;
  } else if (isCardInfo) {
    targetRise = 7.5;
    baseDrop = 1.5;
    maxDroop = 4.0;
  } else if (isCategoryBar) {
    targetRise = 5.0;
    baseDrop = 1.0;
    maxDroop = 2.5;
  } else if (isFooterBarLinks) {
    targetRise = 5.5;
    baseDrop = 1.2;
    maxDroop = 3.0;
  } else if (isFooterMain) {
    targetRise = 9.5;
    baseDrop = 2.5;
    maxDroop = 5.5;
  } else if (isShort) {
    targetRise = Math.min(7.0, H_card * 0.095);
    maxDroop = Math.min(3.5, H_card * 0.05);
    baseDrop = 1.4;
  }

  // Strictly enforce the zero-occlusion clearance limit when close to upper card:
  if (maxAllowedRise > 0) {
    targetRise = Math.min(targetRise, Math.max(3.8, maxAllowedRise - 3.2));
  }

  const yOffset = Math.round(targetRise + 3.0);
  const svgHeight = Math.round(yOffset + maxDroop + baseDrop + 16);

  const phi1 = prng() * Math.PI * 2;
  const phi2 = prng() * Math.PI * 2;

  // 2. Archetype Profile Function: Evaluates thickness multiplier at u in [0, 1]
  const getArchetypeProfile = (u: number): number => {
    switch (archetypeName) {
      case 'windswept-left': {
        // High dune on left (u=0.15), sloping down across to the right
        return 0.58 + 0.76 * Math.exp(-Math.pow((u - 0.16) / 0.28, 2)) + (1 - u) * 0.38;
      }
      case 'windswept-right': {
        // High dune on right (u=0.84), sloping down across to the left
        return 0.58 + 0.76 * Math.exp(-Math.pow((u - 0.84) / 0.28, 2)) + u * 0.38;
      }
      case 'dual-crest-saddle': {
        // Twin pillows at 0.24 and 0.76 with deep saddle dip in center (no center hump!)
        const p1 = Math.exp(-Math.pow((u - 0.24) / 0.18, 2)) * 0.62;
        const p2 = Math.exp(-Math.pow((u - 0.76) / 0.18, 2)) * 0.62;
        return 0.50 + p1 + p2 + 0.06 * Math.sin(u * Math.PI * 6 + phi1);
      }
      case 'triple-dome': {
        // Three undulating hills across the span
        const p1 = Math.exp(-Math.pow((u - 0.18) / 0.14, 2)) * 0.50;
        const p2 = Math.exp(-Math.pow((u - 0.50) / 0.15, 2)) * 0.55;
        const p3 = Math.exp(-Math.pow((u - 0.82) / 0.14, 2)) * 0.50;
        return 0.52 + p1 + p2 + p3;
      }
      case 'thick-plateau': {
        // Generous level snow mattress from edge to edge with plump corners
        return 1.08 + 0.08 * Math.sin(u * Math.PI * 2 + phi1) + 0.04 * Math.cos(u * Math.PI * 4);
      }
      case 'icicle-curtain': {
        // Uniform level mantle with fine high-frequency frost
        return 0.82 + 0.10 * Math.sin(u * Math.PI * 4 + phi1);
      }
      case 'corner-caps': {
        // EXACT OPPOSITE OF THIN ENDS: High puffy snow on BOTH corners, lower in middle!
        const leftCap = Math.exp(-Math.pow(u / 0.22, 2)) * 0.72;
        const rightCap = Math.exp(-Math.pow((1 - u) / 0.22, 2)) * 0.72;
        return 0.55 + leftCap + rightCap + 0.06 * Math.cos(u * Math.PI * 3);
      }
      case 'scalloped-crest': {
        // 4-5 rhythmic shell wave cusps
        return 0.72 + 0.26 * Math.cos(u * Math.PI * 5 + phi1) + 0.08 * Math.sin(u * Math.PI * 10 + phi2);
      }
      case 'alpine-ridge': {
        // Offset rugged mountain peak with sharp asymmetric slope
        const peakU = seed % 2 === 0 ? 0.34 : 0.66;
        return 0.46 + 0.84 * Math.exp(-Math.pow((u - peakU) / 0.22, 2)) + 0.12 * Math.cos(u * Math.PI * 3 + phi1);
      }
      case 'sawtooth-drift': {
        // Stepped sastrugi wind flutes
        const sawtooth = ((u * 4 + phi1 / Math.PI) % 1.0) * 0.32;
        return 0.65 + sawtooth + 0.12 * Math.sin(u * Math.PI * 2);
      }
      case 'puffy-cumulus': {
        // 3-4 bulbous, cloud-like rounded mounds
        return 0.70 + 0.34 * Math.abs(Math.sin(u * Math.PI * 3.5 + phi1)) + 0.08 * Math.cos(u * Math.PI * 2);
      }
      case 'heavy-cornice': {
        // Thick projecting overhang
        return 0.85 + 0.32 * Math.sin(u * Math.PI * 2 + phi1) + 0.12 * Math.cos(u * Math.PI * 4);
      }
      case 'gentle-powder': {
        // Sleek, compact dusting
        return 0.72 + 0.14 * Math.sin(u * Math.PI * 3 + phi1);
      }
      case 'wave-cascade': {
        // Asymmetric flowing cascade waves
        return 0.65 + 0.30 * Math.sin(u * Math.PI * 2.5 + phi1) + 0.16 * Math.sin(u * Math.PI * 5 + phi2);
      }
      case 'center-dip-valley': {
        // Elevated shoulders at edges, descending into a gentle wide valley
        return 0.52 + 0.56 * Math.pow(Math.abs(u - 0.5) * 2, 1.6);
      }
      case 'droop-cluster':
      default: {
        // Asymmetric clusters of melting ice drops
        return 0.68 + 0.24 * Math.cos(u * Math.PI * 3 + phi1) + 0.14 * Math.sin(u * Math.PI * 7 + phi2);
      }
    }
  };

  // 3. Top Points Generation:
  // 彻底消灭“像被硬是切平”！引入双向外溢 (padX Overhang) 与高低起伏连绵大雪包！
  const numTop = Math.max(28, Math.min(68, Math.round(totalW / 14)));
  const topPoints: { x: number; y: number }[] = [];

  // 保证波峰波谷落差至少有 3.2px ~ 6.5px，肉眼可见连绵起伏的小雪包与馒头丘陵
  const waveAmplitude = Math.max(3.2, Math.min(6.5, targetRise * 0.46));

  for (let i = 0; i < numTop; i++) {
    const uTotal = i / (numTop - 1);
    const x = uTotal * totalW;

    // 映射到卡片内部相对坐标 u in [0, 1]
    const uCard = Math.max(0, Math.min(1, (x - cardLeft) / W));
    const baseProf = getArchetypeProfile(uCard);
    // 自然微细风纹
    const microTexture = 0.08 * Math.sin(uTotal * Math.PI * 8 + phi1) + 0.04 * Math.cos(uTotal * Math.PI * 16 + phi2);
    
    // 雪顶向上凸起高度计算：中心基准高度 + 动态波形落差，形成起伏连绵山丘
    const waveOffset = (baseProf - 1.0) * waveAmplitude;
    const snowRise = Math.max(2.2, Math.min(targetRise + waveOffset + microTexture * targetRise, yOffset - 1.5));

    // 两端外溢与圆角雪帽圆润处理 (Overhang & Crown Wrap):
    let cornerCapRounding = 0;
    if (x < cardLeft) {
      // 左外溢区：雪从卡片左端向外探出，优雅外凸微垂（最多下弯 2.2px）
      const tOut = (cardLeft - x) / padX; // 0在卡片边缘, 1在最外端
      cornerCapRounding = Math.pow(tOut, 1.4) * 2.2;
    } else if (x > cardRight) {
      // 右外溢区：雪从卡片右端向外探出，优雅外凸微垂（最多下弯 2.2px）
      const tOut = (x - cardRight) / padX;
      cornerCapRounding = Math.pow(tOut, 1.4) * 2.2;
    } else {
      // 卡片内部靠近两端圆角处：微拱自然过渡（最多 1.2px）
      const distToEdge = Math.min(x - cardLeft, cardRight - x);
      if (distToEdge < radius) {
        const t = distToEdge / radius;
        cornerCapRounding = (1 - Math.sin(t * Math.PI * 0.5)) * 1.2;
      }
    }

    // SVG 坐标：yOffset 是卡片顶沿，y 越小越向上凸起
    const y = yOffset - snowRise + cornerCapRounding;
    topPoints.push({ x, y });
  }

  // 4. Generate Drooping Lobes (雪舌 / 垂挂雪檐) Tailored to Archetype
  const lobes: { cx: number; lw: number; ld: number }[] = [];

  if (archetypeName === 'windswept-left') {
    lobes.push({ cx: cardLeft + Math.min(W * 0.20, W - 20), lw: 36 + prng() * 14, ld: maxDroop * 0.95 });
    lobes.push({ cx: cardLeft + Math.min(W * 0.44, W - 20), lw: 30 + prng() * 12, ld: maxDroop * 0.70 });
  } else if (archetypeName === 'windswept-right') {
    lobes.push({ cx: cardLeft + Math.max(W * 0.80, 20), lw: 36 + prng() * 14, ld: maxDroop * 0.95 });
    lobes.push({ cx: cardLeft + Math.max(W * 0.56, 20), lw: 30 + prng() * 12, ld: maxDroop * 0.70 });
  } else if (archetypeName === 'dual-crest-saddle') {
    lobes.push({ cx: cardLeft + Math.max(radius + 15, W * 0.24), lw: 34 + prng() * 12, ld: maxDroop * 0.88 });
    lobes.push({ cx: cardLeft + Math.min(W - radius - 15, W * 0.76), lw: 34 + prng() * 12, ld: maxDroop * 0.88 });
  } else if (archetypeName === 'triple-dome') {
    lobes.push({ cx: cardLeft + Math.max(radius + 10, W * 0.18), lw: 26 + prng() * 10, ld: maxDroop * 0.75 });
    lobes.push({ cx: cardLeft + W * 0.50, lw: 32 + prng() * 12, ld: maxDroop * 0.90 });
    lobes.push({ cx: cardLeft + Math.min(W - radius - 10, W * 0.82), lw: 26 + prng() * 10, ld: maxDroop * 0.75 });
  } else if (archetypeName === 'icicle-curtain') {
    const numIcicles = W < 260 ? 4 : Math.min(7, Math.round(W / 55));
    for (let k = 0; k < numIcicles; k++) {
      const targetU = (k + 0.5 + (prng() - 0.5) * 0.25) / numIcicles;
      lobes.push({
        cx: cardLeft + Math.max(radius + 10, Math.min(W - radius - 10, targetU * W)),
        lw: 16 + prng() * 8,
        ld: Math.min(maxDroop, 3.5 + prng() * 3.5),
      });
    }
  } else if (archetypeName === 'corner-caps') {
    lobes.push({ cx: cardLeft + Math.max(12, W * 0.12), lw: 32 + prng() * 10, ld: maxDroop * 0.80 });
    lobes.push({ cx: cardLeft + Math.min(W - 12, W * 0.88), lw: 32 + prng() * 10, ld: maxDroop * 0.80 });
  } else if (archetypeName === 'alpine-ridge') {
    const peakU = seed % 2 === 0 ? 0.34 : 0.66;
    lobes.push({ cx: cardLeft + peakU * W, lw: 44 + prng() * 16, ld: maxDroop });
    const flankU = peakU > 0.5 ? 0.22 : 0.78;
    lobes.push({ cx: cardLeft + flankU * W, lw: 24 + prng() * 8, ld: maxDroop * 0.45 });
  } else if (archetypeName === 'thick-plateau') {
    const numL = isCategory ? 2 : W < 260 ? 3 : 5;
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
        lw: 26 + prng() * 18,
        ld: Math.min(maxDroop * (0.45 + prng() * 0.55), maxDroop),
      });
    }
  }

  // 5. Bottom Points Generation:
  // 顺应卡片真实圆角向下自然包裹（Corner Wrap），形成立体包角雪帽与外溢雪爪
  const numBottom = Math.max(28, Math.min(68, Math.round(totalW / 14)));
  const bottomPoints: { x: number; y: number }[] = [];
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

    // 卡片圆角及两端外溢区向下圆弧垂挂量
    let cardCornerDrop = 0;
    if (x < cardLeft) {
      // 左外溢悬檐：抱紧卡片左外圆角
      const tOut = (cardLeft - x) / padX;
      cardCornerDrop = radius * 0.95 + tOut * 2.5;
    } else if (x > cardRight) {
      // 右外溢悬檐：抱紧卡片右外圆角
      const tOut = (x - cardRight) / padX;
      cardCornerDrop = radius * 0.95 + tOut * 2.5;
    } else {
      // 卡片内部圆角区
      const xCard = x - cardLeft;
      if (xCard < radius) {
        cardCornerDrop = (radius - Math.sqrt(Math.max(0, radius * radius - Math.pow(radius - xCard, 2)))) * 0.95;
      } else if (xCard > W - radius) {
        cardCornerDrop = (radius - Math.sqrt(Math.max(0, radius * radius - Math.pow(xCard - (W - radius), 2)))) * 0.95;
      }
    }

    // 雪底向下垂挂：基准垂挂 + 雪舌下垂 + 卡片圆角包裹
    const y = yOffset + baseDrop + droop + cardCornerDrop;
    bottomPoints.push({ x, y });
  }

  // 6. Build SVG Path strings
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
  const numSparkles = isCategory || isCategoryBar || isFooterBarLinks ? 2 : Math.max(3, Math.min(8, Math.round(W / 80)));
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

  return `
<svg class="card-snow-svg" data-snow-seed="${seed}" data-snow-archetype="${archetypeName}" viewBox="0 0 ${totalW} ${svgHeight}" preserveAspectRatio="none" style="--snow-svg-top: -${yOffset}px; height: ${svgHeight}px; left: -${padX}px; width: calc(100% + ${padX * 2}px);">
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

      if (typeof ResizeObserver !== 'undefined') {
        this.resizeObserver = new ResizeObserver(() => {
          this.handleResize();
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

      // 彻底消除串层：#footer-wrap 跳过（雪挂在里面的 .footer-main-shell 上）
      if (el.id === 'footer-wrap') continue;
      // #footer-bar 跳过（雪挂在里面的 .footer-bar-links 上）
      if (el.id === 'footer-bar') continue;

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
            el.classList.contains('footer-bar-links') ||
            el.id === 'post-comment';
          if (!isAllowed) {
            isNested = true;
            break;
          }
        }
      }
      if (isNested) continue;
      seen.add(el);

      // Register with ResizeObserver to handle dynamic layout / tab changes
      if (this.resizeObserver) {
        this.resizeObserver.observe(el);
      }

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
        const verticalGap = elRect.top - prevRect.bottom;
        if (verticalGap > 0 && verticalGap < 60) {
          // Leave at least 3.5px breathing air: can snuggle close ("可以紧挨"), but never overlap ("绝不遮挡")!
          maxAllowedRise = Math.min(maxAllowedRise, Math.max(3.8, Math.floor(verticalGap - 3.5)));
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
            maxAllowedRise = Math.min(maxAllowedRise, Math.max(3.8, Math.floor(gap - 3.5)));
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
