/**
 * EpoCanvas Starry Universe Engine (浩瀚深空与科技星轨引擎).
 * 
 * 深度复刻并进化自安知鱼（Anzhiyu）夜晚星空系统 (https://hexo.anheyu.com/):
 * 1. 三层天体物理粒子模型 (Three-Tier Celestial Classification):
 *    - 幽蓝巨星 (Giant Stars, ~3%): 冷紫蓝光斑 (rgba(180,184,240,alpha))，圆润光核，慢速优雅漂移；
 *    - 离子彗星 (Comets/Meteors, ~1%): 纯银白冷光 (rgba(226,225,224,alpha))，30阶线性衰减离子拖尾，超高速破空划过；
 *    - 漫天恒星 (Regular Stars, ~96%): 微暖金黄 (rgba(226,225,142,alpha))，自然呼吸闪烁，平滑淡入淡出。
 * 2. 现代科技感与性能升级 (EpoCanvas Tech Enhancements):
 *    - High-DPI Retina 硬件级像素矩阵映射（setTransform 缩放适配 2K/4K/Mac 显示器）；
 *    - 鼠标微引力场扰动 (Gravitational Micro-Lensing)，交互时星光轻微偏转；
 *    - 零冗余 RAF 挂起与状态感知（仅在 data-background='universe' 且 Tab 可见时运算，0 CPU 浪费）。
 */

export interface StarryUniverseOptions {
  particleDensityMultiplier?: number;
  enableComet?: boolean;
  enableGiantStars?: boolean;
  enableMouseInteraction?: boolean;
}

interface StarParticle {
  giant: boolean;
  comet: boolean;
  x: number;
  y: number;
  r: number;
  dx: number;
  dy: number;
  fadingOut: boolean | null;
  fadingIn: boolean;
  opacity: number;
  opacityTresh: number;
  deltaOpacity: number;
  reset(): void;
  fadeIn(): void;
  fadeOut(): void;
  draw(ctx: CanvasRenderingContext2D, isDark: boolean): void;
  move(width: number, height: number, pointerX: number, pointerY: number): void;
}

export function initStarryUniverse(options?: StarryUniverseOptions): (() => void) | undefined {
  if (typeof window === 'undefined' || typeof document === 'undefined') return undefined;

  const canvas = document.getElementById('universe') as HTMLCanvasElement | null;
  if (!canvas) return undefined;

  const ctx = canvas.getContext('2d', { alpha: true });
  if (!ctx) return undefined;

  let animId = 0;
  let isRunning = false;
  let width = 0;
  let height = 0;
  let dpr = 1;
  let firstLaunch = true;
  let particles: StarParticle[] = [];

  const baseSpeed = 0.05;
  const giantColor = '180,184,240';
  const regularColor = '226,225,142';
  const cometColor = '226,225,224';

  const isUniverseActive = () => {
    const bg = document.documentElement.dataset.background;
    return bg === 'universe';
  };

  const isDarkMode = () => {
    return document.documentElement.dataset.theme === 'dark';
  };

  const random = (min: number, max: number) => Math.random() * (max - min) + min;
  const chance = (threshold: number) => Math.floor(1000 * Math.random()) + 1 < 10 * threshold;

  // Pointer state for micro-gravitational interaction
  let pointerX = -1000;
  let pointerY = -1000;

  const handlePointerMove = (e: PointerEvent) => {
    if (e.pointerType === 'touch') return;
    pointerX = e.clientX;
    pointerY = e.clientY;
  };

  const handlePointerLeave = () => {
    pointerX = -1000;
    pointerY = -1000;
  };

  class Star implements StarParticle {
    giant = false;
    comet = false;
    x = 0;
    y = 0;
    r = 1.5;
    dx = 0;
    dy = 0;
    fadingOut: boolean | null = null;
    fadingIn = true;
    opacity = 0;
    opacityTresh = 0.8;
    deltaOpacity = 0.001;
    isCluster = false;

    constructor(isCluster = false) {
      this.isCluster = isCluster;
      this.reset();
    }

    reset() {
      this.giant = options?.enableGiantStars !== false && (this.isCluster ? chance(4) : chance(3));
      this.comet = options?.enableComet !== false && !this.giant && !firstLaunch && (this.isCluster ? chance(14) : chance(8));

      if (this.isCluster) {
        // Bottom-left cosmic nursery (biased toward x: 0 ~ 0.55*width, y: 0.45*height ~ height)
        const xDist = Math.pow(Math.random(), 1.4);
        const yDist = Math.pow(Math.random(), 1.4);
        this.x = xDist * (width * 0.55);
        this.y = height - yDist * (height * 0.55);
      } else {
        this.x = random(0, Math.max(10, width - 10));
        this.y = random(0, Math.max(10, height));
      }

      this.r = random(1.1, 2.6);

      const cometSpeedFactor = this.comet ? random(50, 120) : 0;
      this.dx = random(baseSpeed, 6 * baseSpeed) + cometSpeedFactor * baseSpeed + 2 * baseSpeed;
      this.dy = -random(baseSpeed, 6 * baseSpeed) - cometSpeedFactor * baseSpeed;

      this.fadingOut = null;
      this.fadingIn = true;
      this.opacity = 0;
      this.opacityTresh = random(0.25, 1 - (this.comet ? 0.4 : 0));
      this.deltaOpacity = random(0.0006, 0.0024) + (this.comet ? 0.0012 : 0);
    }

    fadeIn() {
      if (this.fadingIn) {
        this.fadingIn = this.opacity <= this.opacityTresh;
        this.opacity += this.deltaOpacity;
      }
    }

    fadeOut() {
      if (this.fadingOut) {
        this.fadingOut = this.opacity >= 0;
        this.opacity -= this.deltaOpacity / 2;
        if (this.x > width || this.y < 0) {
          this.fadingOut = false;
          this.reset();
        }
      }
    }

    move(w: number, h: number, px: number, py: number) {
      // Base natural drift
      this.x += this.dx;
      this.y += this.dy;

      // Subtle gravitational lens interaction
      if (options?.enableMouseInteraction !== false && px > -500 && !this.comet) {
        const dx = this.x - px;
        const dy = this.y - py;
        const distSq = dx * dx + dy * dy;
        const interactRadius = 100;
        if (distSq < interactRadius * interactRadius && distSq > 9) {
          const dist = Math.sqrt(distSq);
          const force = (1 - dist / interactRadius) * 0.45;
          this.x += (dx / dist) * force;
          this.y += (dy / dist) * force;
        }
      }

      if (this.fadingOut === false) {
        this.reset();
      }

      if (this.x > w - w / 4 || this.y < 0) {
        this.fadingOut = true;
      }
    }

    draw(c: CanvasRenderingContext2D, isDark: boolean) {
      c.beginPath();
      const alpha = Math.max(0, Math.min(1, this.opacity));

      if (this.giant) {
        // 幽蓝巨星 (Giant Star): 冷紫蓝圆形光斑
        c.fillStyle = `rgba(${giantColor}, ${alpha})`;
        c.arc(this.x, this.y, 2, 0, 2 * Math.PI, false);
        c.fill();
      } else if (this.comet) {
        // 离子彗星 (Comet): 银白光核 + 30 阶衰减残影离子拖尾
        c.fillStyle = `rgba(${cometColor}, ${alpha})`;
        c.arc(this.x, this.y, 1.5, 0, 2 * Math.PI, false);
        c.fill();

        for (let t = 0; t < 30; t++) {
          const trailOpacity = alpha - (alpha / 20) * t;
          if (trailOpacity > 0) {
            c.fillStyle = `rgba(${cometColor}, ${trailOpacity})`;
            c.fillRect(this.x - (this.dx / 4) * t, this.y - (this.dy / 4) * t - 2, 2, 2);
          }
        }
      } else {
        // 漫天恒星 (Regular Star): 微暖金黄小方点
        const starColor = isDark ? regularColor : '140,165,220';
        c.fillStyle = `rgba(${starColor}, ${alpha})`;
        c.fillRect(this.x, this.y, this.r, this.r);
      }
      c.closePath();
    }
  }

  const resize = () => {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = window.innerWidth;
    height = window.innerHeight;

    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const mult = options?.particleDensityMultiplier ?? 1.0;
    // 增加总体星空密度 (从 0.216 提升至 0.36 并设定 280 最低基准)
    const count = Math.round(Math.max(280, 0.36 * width * mult));
    particles = [];
    const clusterCount = Math.round(count * 0.38); // 38% 粒子增设至左下角星云育婴室 (Bottom-Left Cluster)
    for (let i = 0; i < count; i++) {
      const isCluster = i < clusterCount;
      particles.push(new Star(isCluster));
    }
  };

  const render = () => {
    if (!isRunning) return;

    ctx.clearRect(0, 0, width, height);
    const isDark = isDarkMode();

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      p.move(width, height, pointerX, pointerY);
      p.fadeIn();
      p.fadeOut();
      p.draw(ctx, isDark);
    }

    animId = requestAnimationFrame(render);
  };

  const startLoop = () => {
    if (isRunning) return;
    isRunning = true;
    animId = requestAnimationFrame(render);
  };

  const stopLoop = () => {
    isRunning = false;
    if (animId) cancelAnimationFrame(animId);
    if (ctx) ctx.clearRect(0, 0, width, height);
  };

  const updateState = () => {
    const active = isUniverseActive();
    if (active) {
      canvas.style.opacity = '1';
      startLoop();
    } else {
      canvas.style.opacity = '0';
      setTimeout(() => {
        if (!isUniverseActive()) stopLoop();
      }, 400);
    }
  };

  const handleVisibility = () => {
    if (document.hidden) {
      stopLoop();
    } else if (isUniverseActive()) {
      startLoop();
    }
  };

  const observer = new MutationObserver((mutations) => {
    for (const m of mutations) {
      if (m.attributeName === 'data-background' || m.attributeName === 'data-theme') {
        updateState();
      }
    }
  });

  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-background', 'data-theme'],
  });

  window.addEventListener('resize', resize, { passive: true });
  window.addEventListener('pointermove', handlePointerMove, { passive: true });
  window.addEventListener('pointerleave', handlePointerLeave, { passive: true });
  document.addEventListener('visibilitychange', handleVisibility);

  // Initial setup
  resize();
  updateState();

  setTimeout(() => {
    firstLaunch = false;
  }, 100);

  return () => {
    stopLoop();
    observer.disconnect();
    window.removeEventListener('resize', resize);
    window.removeEventListener('pointermove', handlePointerMove);
    window.removeEventListener('pointerleave', handlePointerLeave);
    document.removeEventListener('visibilitychange', handleVisibility);
  };
}

export default initStarryUniverse;
