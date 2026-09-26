/**
 * EpoCanvas Cinematic Snow Mantle & Procedural Accumulation Engine (积雪/雪幔引擎)
 * 
 * 架构核心特性 (Architecture Pillars):
 * 1. 2.5D Volumetric Organic Contour (自研程序化起伏雪丘与有机雪舌下垂模型):
 *    - 基于确定性 PRNG 种子 (Mulberry32) 生成每张卡片独一无二的波浪波丘与雪幔几何形态。
 *    - 顶面柔和起伏高地 (Undulating Dunes)，以连续中点二次贝塞尔弧线平滑连接。
 *    - 底缘下垂雪舌 (Drooping Lobes / Cornices)，以非均匀间距自然垂挂于卡片顶沿前端。
 * 2. Multi-Pass Volumetric Shading & Daylight Contrast (多层立体光影与白昼高反差冬日光照模型):
 *    - Pass 1: 接触面微环境光遮挡阴影 (Contact AO Shadow)，将雪体牢牢压在卡片顶沿，彻底消除浮空感；
 *    - Pass 2: 垂直天光散射自阴影渐变 (Volumetric Skylight Gradient)，顶沿向阳面纯白晶莹 (#ffffff)，
 *             底端雪舌微冷天光散射 (Daylight: rgba(148, 178, 210, 0.94))，在纯白卡片 (#ffffff) 上呈现极高清晰度与真实感；
 *    - Pass 3: 顶层迎光弧面微凸层次 (Inner Volumetric Dome) 与晶莹高光线 (Sunlit Specular Rim)；
 *    - Pass 4: 微细冰晶闪光 (Micro Crystalline Sparkles)，随时间轻微闪烁。
 * 3. Zero DOM Pollution & 60FPS Performance (零 DOM 污染与视口视差同步渲染):
 *    - 完全在固定视口 Canvas (#theme-snow-mid, z-index: 20) 上绘制，卡片内部 DOM 保持 100% 纯净；
 *    - 文档绝对坐标预计算与视锥剔除 (Frustum Culling)，滚动时直接基于 screenY = docTop - scrollY 投影；
 *    - 严格 0 ctx.shadowBlur，避免 GPU/Skia CPU 模糊开销，保障上下动态滑动稳定 60FPS。
 */

export const CLOSED_BOX_SELECTORS = [
  '#random-banner',
  '.todayCard',
  '.categoryItem',
  '.home-mobile-focus-card',
  '.recent-post-item',
  '#aside-content .card-widget',
  '#card-toc',
  '#page',
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

interface Sparkle {
  x: number;
  y: number;
  r: number;
  phase: number;
}

interface SnowMantleGeometry {
  bodyPath: Path2D;
  innerPath: Path2D;
  rimPath: Path2D;
  shadowPath: Path2D;
  sparkles: Sparkle[];
  lightGrad: CanvasGradient;
  darkGrad: CanvasGradient;
}

interface TrackedCard {
  element: HTMLElement;
  id: string;
  seed: number;
  docTop: number;
  docLeft: number;
  width: number;
  height: number;
  isSticky: boolean;
  mantle: SnowMantleGeometry;
}

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

export class SnowMantleEngine {
  private ctx: CanvasRenderingContext2D;
  private cards: TrackedCard[] = [];
  private resizeObserver: ResizeObserver | null = null;
  private resizeTimeout: any = null;
  private scrollEndTimeout: any = null;
  private isDestroyed = false;

  constructor(ctx: CanvasRenderingContext2D) {
    this.ctx = ctx;
    this.init();
  }

  private init() {
    this.scanCards();

    // Listen to document layout changes
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', this.handleResize, { passive: true });
      window.addEventListener('scroll', this.handleScrollCheck, { passive: true });
      document.addEventListener('astro:page-load', this.handlePageLoad);

      if (typeof ResizeObserver !== 'undefined' && document.body) {
        this.resizeObserver = new ResizeObserver(() => {
          this.handleResize();
        });
        this.resizeObserver.observe(document.body);
      }
    }
  }

  private handleResize = () => {
    if (this.resizeTimeout) clearTimeout(this.resizeTimeout);
    this.resizeTimeout = setTimeout(() => {
      if (this.isDestroyed) return;
      this.scanCards();
    }, 120);
  };

  private handleScrollCheck = () => {
    // When scroll settles, verify coordinates in case of dynamic lazy-load layout shift
    if (this.scrollEndTimeout) clearTimeout(this.scrollEndTimeout);
    this.scrollEndTimeout = setTimeout(() => {
      if (this.isDestroyed) return;
      this.refreshPositions();
    }, 200);
  };

  private handlePageLoad = () => {
    setTimeout(() => {
      if (this.isDestroyed) return;
      this.scanCards();
    }, 100);
  };

  /**
   * Rescan DOM for all target closed-box cards and generate cached snow mantle geometry
   */
  public scanCards() {
    if (typeof document === 'undefined' || !this.ctx) return;

    const selector = CLOSED_BOX_SELECTORS.join(', ');
    const elements = Array.from(document.querySelectorAll<HTMLElement>(selector));
    const scrollY = window.scrollY || window.pageYOffset || 0;
    const scrollX = window.scrollX || window.pageXOffset || 0;

    const newCards: TrackedCard[] = [];
    const seenElements = new Set<HTMLElement>();

    for (let index = 0; index < elements.length; index++) {
      const el = elements[index];
      if (seenElements.has(el)) continue;

      // Filter out hidden or collapsed elements
      if (el.offsetParent === null) continue;
      const rect = el.getBoundingClientRect();
      if (rect.width < 50 || rect.height < 30) continue;

      // Filter out hidden styles
      const style = window.getComputedStyle(el);
      if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') continue;

      // Avoid nested boxes within another box unless it's a distinct structural block
      let isNestedDuplicate = false;
      for (const parent of seenElements) {
        if (parent.contains(el)) {
          // Allow specific known sub-cards like .recent-post-item, .relatedPosts-item or .postNav-card
          const isAllowedSubCard =
            el.classList.contains('recent-post-item') ||
            el.classList.contains('relatedPosts-item') ||
            el.classList.contains('postNav-card') ||
            el.classList.contains('post-copyright') ||
            el.classList.contains('card-widget');
          if (!isAllowedSubCard) {
            isNestedDuplicate = true;
            break;
          }
        }
      }
      if (isNestedDuplicate) continue;

      seenElements.add(el);

      const docTop = rect.top + scrollY;
      const docLeft = rect.left + scrollX;
      const w = Math.round(rect.width);
      const h = Math.round(rect.height);

      // Check if sticky
      const isSticky = style.position === 'sticky' || style.position === 'fixed' || el.closest('.aside-sticky-box') !== null;

      const id = el.id || el.className.split(' ')[0] || `card-${index}`;
      const className = el.className || '';
      const seed = hashString(`${id}-${w}-${index}`);

      const mantle = this.generateMantle(w, h, seed, className);

      newCards.push({
        element: el,
        id,
        className,
        seed,
        docTop,
        docLeft,
        width: w,
        height: h,
        isSticky,
        mantle,
      });
    }

    this.cards = newCards;
  }

  /**
   * Fast position refresh (0 geometry re-generation)
   */
  public refreshPositions() {
    const scrollY = window.scrollY || window.pageYOffset || 0;
    const scrollX = window.scrollX || window.pageXOffset || 0;

    for (let i = 0; i < this.cards.length; i++) {
      const card = this.cards[i];
      if (!card.element || !card.element.isConnected) continue;
      const rect = card.element.getBoundingClientRect();
      card.docTop = rect.top + scrollY;
      card.docLeft = rect.left + scrollX;
      // If width changed significantly (> 10px), regenerate mantle
      const newW = Math.round(rect.width);
      if (Math.abs(newW - card.width) > 10) {
        card.width = newW;
        card.height = Math.round(rect.height);
        card.mantle = this.generateMantle(newW, card.height, card.seed, card.className);
      }
    }
  }

  /**
   * Generate 2.5D Volumetric Snow Mantle Geometry with Bezier Curves and Multi-layer Passes
   */
  private generateMantle(W: number, H_card: number, seed: number, className: string = ''): SnowMantleGeometry {
    const prng = createPRNG(seed);
    const isCategory = className.includes('categoryItem');
    const isCardInfo = className.includes('card-info');
    const isShort = H_card < 120;

    let H = 16;
    let maxDroop = 9;
    let baseDrop = 2.0;

    if (isCategory) {
      // Category buttons: height ~86px, text is close to top border
      H = 8;
      maxDroop = 2.0;
      baseDrop = 0.8;
    } else if (isCardInfo) {
      // Profile card: keep snow clear of the welcome badge
      H = 8;
      maxDroop = 2.0;
      baseDrop = 0.6;
    } else if (isShort) {
      H = Math.min(10, H_card * 0.15);
      maxDroop = Math.min(3.5, H_card * 0.05);
      baseDrop = 1.0;
    } else {
      const baseH = W < 260 ? 12 : W < 700 ? 16 : 20;
      H = Math.max(8, Math.min(baseH, H_card * 0.20));
      maxDroop = Math.min(10, H_card * 0.10);
      baseDrop = Math.max(1.5, Math.min(2.5, H_card * 0.035));
    }
    const radius = 8; // standard card radius

    // 1. Generate top crest points (undulating dunes)
    const numTopPoints = Math.max(16, Math.min(48, Math.round(W / 24)));
    const topPoints: { x: number; y: number }[] = [];
    const phi1 = prng() * Math.PI * 2;
    const phi2 = prng() * Math.PI * 2;

    for (let i = 0; i < numTopPoints; i++) {
      const u = i / (numTopPoints - 1);
      const x = u * W;

      // Corner roll-off: snow curves smoothly over the rounded corners
      const dLeft = Math.min(1, x / (radius * 1.6));
      const dRight = Math.min(1, (W - x) / (radius * 1.6));
      const edgeFactor = Math.sin(dLeft * Math.PI * 0.5) * Math.sin(dRight * Math.PI * 0.5);

      // Harmonic waves for natural dune undulation
      const w1 = Math.sin(u * Math.PI) * 0.35;
      const w2 = Math.sin(u * Math.PI * 3 + phi1) * 0.25;
      const w3 = Math.cos(u * Math.PI * 5 + phi2) * 0.15;
      const micro = (prng() - 0.5) * 0.12;

      const thickness = H * (0.75 + w1 + w2 + w3 + micro) * (0.35 + 0.65 * edgeFactor);
      const y = -(thickness + 2.0);
      topPoints.push({ x, y });
    }

    // 2. Generate bottom drooping lobes (雪舌 / 垂挂雪檐)
    const numLobes = isCategory ? 2 : W < 220 ? 2 : W < 450 ? 3 + Math.floor(prng() * 2) : 5 + Math.floor(prng() * 4);
    const lobes: { cx: number; lw: number; ld: number }[] = [];
    for (let k = 0; k < numLobes; k++) {
      const targetU = (k + 0.5 + (prng() - 0.5) * 0.5) / numLobes;
      const cx = Math.max(radius + 15, Math.min(W - radius - 15, targetU * W));
      const lw = (isCategory ? 24 : 32) + prng() * (isCategory ? 20 : 45); // lobe width
      const rawLd = isCategory ? 1.0 + prng() * 1.0 : 4.0 + prng() * 6.5; // droop depth
      const ld = Math.min(rawLd, maxDroop);
      lobes.push({ cx, lw, ld });
    }

    // Sample bottom contour from right to left
    const numBottomPoints = Math.max(20, Math.min(60, Math.round(W / 18)));
    const bottomPoints: { x: number; y: number }[] = [];

    for (let i = numBottomPoints - 1; i >= 0; i--) {
      const u = i / (numBottomPoints - 1);
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

      // Edge taper for corners
      const dLeft = Math.min(1, x / radius);
      const dRight = Math.min(1, (W - x) / radius);
      const cornerFactor = Math.sin(dLeft * Math.PI * 0.5) * Math.sin(dRight * Math.PI * 0.5);

      const y = (baseDrop + droop) * cornerFactor;
      bottomPoints.push({ x, y });
    }

    // 3. Assemble Bezier Paths
    // A. Main Snow Body Path
    const bodyPath = new Path2D();
    bodyPath.moveTo(-2, 2.5);
    bodyPath.quadraticCurveTo(-2.5, topPoints[0].y * 0.4, topPoints[0].x, topPoints[0].y);

    for (let i = 0; i < topPoints.length - 1; i++) {
      const curr = topPoints[i];
      const next = topPoints[i + 1];
      const mx = (curr.x + next.x) * 0.5;
      const my = (curr.y + next.y) * 0.5;
      bodyPath.quadraticCurveTo(curr.x, curr.y, mx, my);
    }
    const lastTop = topPoints[topPoints.length - 1];
    bodyPath.lineTo(lastTop.x, lastTop.y);

    bodyPath.quadraticCurveTo(W + 2.5, lastTop.y * 0.4, W + 2, 2.5);

    for (let i = 0; i < bottomPoints.length - 1; i++) {
      const curr = bottomPoints[i];
      const next = bottomPoints[i + 1];
      const mx = (curr.x + next.x) * 0.5;
      const my = (curr.y + next.y) * 0.5;
      bodyPath.quadraticCurveTo(curr.x, curr.y, mx, my);
    }
    bodyPath.closePath();

    // B. Inner Volumetric Crest Path (for 2.5D puffy highlight dome)
    const innerPath = new Path2D();
    innerPath.moveTo(topPoints[0].x, topPoints[0].y);
    for (let i = 0; i < topPoints.length - 1; i++) {
      const curr = topPoints[i];
      const next = topPoints[i + 1];
      const mx = (curr.x + next.x) * 0.5;
      const my = (curr.y + next.y) * 0.5;
      innerPath.quadraticCurveTo(curr.x, curr.y, mx, my);
    }
    innerPath.lineTo(lastTop.x, lastTop.y);
    for (let i = topPoints.length - 1; i >= 0; i--) {
      const pt = topPoints[i];
      const inY = pt.y * 0.45;
      if (i === topPoints.length - 1) innerPath.lineTo(pt.x, inY);
      else {
        const prevPt = topPoints[i + 1];
        const mx = (pt.x + prevPt.x) * 0.5;
        const my = (inY + prevPt.y * 0.45) * 0.5;
        innerPath.quadraticCurveTo(pt.x, inY, mx, my);
      }
    }
    innerPath.closePath();

    // C. Rim Path (Top crest highlight stroke)
    const rimPath = new Path2D();
    rimPath.moveTo(topPoints[0].x, topPoints[0].y);
    for (let i = 0; i < topPoints.length - 1; i++) {
      const curr = topPoints[i];
      const next = topPoints[i + 1];
      const mx = (curr.x + next.x) * 0.5;
      const my = (curr.y + next.y) * 0.5;
      rimPath.quadraticCurveTo(curr.x, curr.y, mx, my);
    }
    rimPath.lineTo(lastTop.x, lastTop.y);

    // D. Contact Shadow Path (soft AO layer underneath drooping lobes)
    const shadowPath = new Path2D();
    shadowPath.moveTo(bottomPoints[0].x, bottomPoints[0].y);
    for (let i = 0; i < bottomPoints.length - 1; i++) {
      const curr = bottomPoints[i];
      const next = bottomPoints[i + 1];
      const mx = (curr.x + next.x) * 0.5;
      const my = (curr.y + next.y) * 0.5;
      shadowPath.quadraticCurveTo(curr.x, curr.y, mx, my);
    }
    shadowPath.lineTo(bottomPoints[bottomPoints.length - 1].x, bottomPoints[bottomPoints.length - 1].y + 2.5);
    for (let i = bottomPoints.length - 1; i > 0; i--) {
      const curr = bottomPoints[i];
      const prev = bottomPoints[i - 1];
      const mx = (curr.x + prev.x) * 0.5;
      const my = (curr.y + prev.y) * 0.5 + 2.5;
      shadowPath.quadraticCurveTo(curr.x, curr.y + 2.5, mx, my);
    }
    shadowPath.closePath();

    // E. Micro sparkles near crest
    const numSparkles = Math.max(4, Math.min(12, Math.round(W / 75)));
    const sparkles: Sparkle[] = [];
    for (let s = 0; s < numSparkles; s++) {
      const ptIdx = Math.floor(prng() * (topPoints.length - 2)) + 1;
      const pt = topPoints[ptIdx];
      sparkles.push({
        x: pt.x + (prng() - 0.5) * 10,
        y: pt.y + 2.0 + prng() * 4,
        r: 0.8 + prng() * 0.6,
        phase: prng() * Math.PI * 2,
      });
    }

    // Gradients
    const minY = -H * 1.45;
    const maxY = 15;

    // Daylight mode gradient:
    // Top: pure white -> mid: luminous crisp snow -> bottom: cold sky shadow blue
    const lightGrad = this.ctx.createLinearGradient(0, minY, 0, maxY);
    lightGrad.addColorStop(0.0, 'rgba(255, 255, 255, 0.99)');
    lightGrad.addColorStop(0.35, 'rgba(246, 250, 255, 0.98)');
    lightGrad.addColorStop(0.68, 'rgba(226, 238, 250, 0.96)');
    lightGrad.addColorStop(0.88, 'rgba(182, 208, 234, 0.94)');
    lightGrad.addColorStop(1.0, 'rgba(148, 178, 210, 0.94)');

    // Dark mode gradient:
    const darkGrad = this.ctx.createLinearGradient(0, minY, 0, maxY);
    darkGrad.addColorStop(0.0, 'rgba(255, 255, 255, 0.97)');
    darkGrad.addColorStop(0.4, 'rgba(235, 244, 255, 0.94)');
    darkGrad.addColorStop(0.75, 'rgba(185, 210, 240, 0.88)');
    darkGrad.addColorStop(1.0, 'rgba(135, 165, 205, 0.86)');

    return {
      bodyPath,
      innerPath,
      rimPath,
      shadowPath,
      sparkles,
      lightGrad,
      darkGrad,
    };
  }

  /**
   * Render Snow Mantles on all visible cards
   */
  public render(scrollY: number, scrollX: number, isDark: boolean, time: number) {
    if (this.cards.length === 0) return;

    const ctx = this.ctx;
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;

    for (let i = 0; i < this.cards.length; i++) {
      const card = this.cards[i];

      let screenY: number;
      let screenX: number;

      if (card.isSticky) {
        // Sticky elements: sample their real-time client rect
        const rect = card.element.getBoundingClientRect();
        screenY = rect.top;
        screenX = rect.left;
      } else {
        // Normal flow elements: zero DOM query! 100% fast math projection
        screenY = card.docTop - scrollY;
        screenX = card.docLeft - scrollX;
      }

      // Frustum culling:
      // Skip cards that are outside the visible viewport
      if (screenY + 40 < 0 || screenY - 20 > viewportHeight) continue;
      if (screenX + card.width < 0 || screenX > viewportWidth) continue;

      ctx.save();
      ctx.translate(screenX, screenY);

      // 1. Contact AO shadow
      ctx.fillStyle = isDark ? 'rgba(0, 0, 0, 0.38)' : 'rgba(110, 140, 175, 0.28)';
      ctx.fill(card.mantle.shadowPath);

      // 2. Snow body
      ctx.fillStyle = isDark ? card.mantle.darkGrad : card.mantle.lightGrad;
      ctx.fill(card.mantle.bodyPath);

      // 2.5 Inner volumetric crest highlight (pillowy dome)
      ctx.fillStyle = isDark ? 'rgba(255, 255, 255, 0.18)' : 'rgba(255, 255, 255, 0.65)';
      ctx.fill(card.mantle.innerPath);

      // 3. Crest rim highlight
      ctx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.85)' : 'rgba(255, 255, 255, 0.95)';
      ctx.lineWidth = 1.2;
      ctx.stroke(card.mantle.rimPath);

      // 4. Micro specular sparkles
      for (let s = 0; s < card.mantle.sparkles.length; s++) {
        const sp = card.mantle.sparkles[s];
        const spAlpha = Math.max(0.2, Math.min(1.0, 0.5 + 0.45 * Math.sin(time * 2.5 + sp.phase)));
        ctx.fillStyle = `rgba(255, 255, 255, ${spAlpha})`;
        ctx.beginPath();
        ctx.arc(sp.x, sp.y, sp.r, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    }
  }

  public destroy() {
    this.isDestroyed = true;
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }
    if (this.resizeTimeout) clearTimeout(this.resizeTimeout);
    if (this.scrollEndTimeout) clearTimeout(this.scrollEndTimeout);
    if (typeof window !== 'undefined') {
      window.removeEventListener('resize', this.handleResize);
      window.removeEventListener('scroll', this.handleScrollCheck);
      document.removeEventListener('astro:page-load', this.handlePageLoad);
    }
    this.cards = [];
  }
}
