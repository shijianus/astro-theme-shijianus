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
      this.comet = options?.enableComet !== false && !this.giant && !firstLaunch && (this.isCluster ? chance(16) : chance(12));

      if (this.comet) {
        // Shooting star / Meteor: spawn along bottom or left edge to streak across the entire sky
        if (Math.random() < 0.65) {
          this.x = random(-60, width * 0.85);
          this.y = random(height * 0.45, height + 40);
        } else {
          this.x = random(-60, width * 0.35);
          this.y = random(height * 0.2, height);
        }
        this.r = random(2.2, 3.4);
        const cometSpeed = random(6.5, 12);
        this.dx = cometSpeed * random(0.9, 1.3);
        this.dy = -cometSpeed * random(0.65, 1.05);
        this.opacity = 0;
        this.opacityTresh = random(0.85, 1.0);
        this.deltaOpacity = random(0.04, 0.08); // Rapid luminous entry
      } else if (this.isCluster) {
        // Bottom-left cosmic nursery enhancement (gentle density bias)
        const xDist = Math.pow(Math.random(), 1.2);
        const yDist = Math.pow(Math.random(), 1.2);
        this.x = xDist * (width * 0.65);
        this.y = height - yDist * (height * 0.65);
        this.r = this.giant ? random(2.2, 3.6) : random(1.1, 2.4);
        this.dx = random(baseSpeed, 4 * baseSpeed);
        this.dy = -random(baseSpeed, 4 * baseSpeed);
        this.opacity = firstLaunch ? random(0.1, 0.7) : 0;
        this.opacityTresh = random(0.35, 0.95);
        this.deltaOpacity = random(0.0008, 0.0028);
      } else {
        // Uniform distribution across full screen (including right sidebar at x: 1096~1416)
        this.x = random(0, width);
        this.y = random(0, height);
        this.r = this.giant ? random(2.2, 3.6) : random(1.1, 2.4);
        this.dx = random(baseSpeed, 4 * baseSpeed);
        this.dy = -random(baseSpeed, 4 * baseSpeed);
        this.opacity = firstLaunch ? random(0.1, 0.7) : 0;
        this.opacityTresh = random(0.35, 0.95);
        this.deltaOpacity = random(0.0008, 0.0028);
      }

      this.fadingOut = null;
      this.fadingIn = true;
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
        if (this.x > width + 80 || this.y < -50) {
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

      // ONLY fade out when particle actually exits off-screen (reaches beyond right/top edges)
      // Removed previous premature `this.x > w - w / 4` cutoff which left the right sidebar in pitch black!
      if (this.x > w + 60 || this.y < -40) {
        this.fadingOut = true;
      }
    }

    draw(c: CanvasRenderingContext2D, isDark: boolean) {
      c.beginPath();
      const alpha = Math.max(0, Math.min(1, this.opacity));

      if (this.giant) {
        // 幽蓝巨星 (Giant Star): 冷紫蓝圆形光斑 + 柔和光晕
        c.fillStyle = `rgba(${giantColor}, ${alpha * 0.35})`;
        c.arc(this.x, this.y, this.r * 2.2, 0, 2 * Math.PI, false);
        c.fill();
        c.fillStyle = `rgba(${giantColor}, ${alpha})`;
        c.arc(this.x, this.y, this.r, 0, 2 * Math.PI, false);
        c.fill();
      } else if (this.comet) {
        // 离子彗星/流星 (Comet/Meteor): 纯银白亮核 + 离子晕光 + 40阶衰减长离子拖尾
        c.fillStyle = `rgba(190, 215, 255, ${alpha * 0.65})`;
        c.arc(this.x, this.y, this.r * 2.2, 0, 2 * Math.PI, false);
        c.fill();

        c.fillStyle = `rgba(255, 255, 255, ${alpha})`;
        c.arc(this.x, this.y, this.r, 0, 2 * Math.PI, false);
        c.fill();

        // 40 阶离子拖尾
        const trailSteps = 40;
        for (let t = 1; t <= trailSteps; t++) {
          const trailOpacity = alpha * (1 - t / trailSteps);
          if (trailOpacity > 0.02) {
            const tx = this.x - (this.dx / 3.6) * t;
            const ty = this.y - (this.dy / 3.6) * t;
            const tw = Math.max(1, this.r * (1 - (t / trailSteps) * 0.55));
            c.fillStyle = `rgba(${cometColor}, ${trailOpacity * 0.9})`;
            c.fillRect(tx, ty - tw / 2, tw, tw);
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
    // 增加总体星空密度并设定 320 最低基准
    const count = Math.round(Math.max(320, 0.42 * width * mult));
    particles = [];
    const clusterCount = Math.round(count * 0.25); // 25% 粒子微偏左下角星云育婴室，其余 75% 全屏均匀散布
    for (let i = 0; i < count; i++) {
      const isCluster = i < clusterCount;
      particles.push(new Star(isCluster));
    }
  };

  // Dedicated continuous meteor generator (流星生成调度器)
  let lastMeteorTime = 0;
  const ensureMeteorActivity = () => {
    const now = Date.now();
    if (now - lastMeteorTime > 2800) { // Every ~2.8s ensure a meteor streaks through
      lastMeteorTime = now;
      // Find an available inactive or fading star to turn into a brilliant meteor
      const candidate = particles.find(p => !p.comet && (p.fadingOut || p.opacity < 0.2));
      if (candidate) {
        candidate.giant = false;
        candidate.comet = true;
        candidate.fadingOut = false;
        candidate.fadingIn = true;
        // 50% chance to streak across the right half (through sidebar)
        if (Math.random() < 0.5) {
          candidate.x = random(width * 0.4, width * 0.85);
          candidate.y = random(height * 0.5, height + 20);
        } else {
          candidate.x = random(-40, width * 0.5);
          candidate.y = random(height * 0.4, height + 20);
        }
        candidate.r = random(2.4, 3.6);
        const speed = random(7, 12);
        candidate.dx = speed * random(0.95, 1.25);
        candidate.dy = -speed * random(0.7, 1.05);
        candidate.opacity = 0;
        candidate.opacityTresh = random(0.9, 1.0);
        candidate.deltaOpacity = 0.06;
      }
    }
  };

  const render = () => {
    if (!isRunning) return;

    ctx.clearRect(0, 0, width, height);
    const isDark = isDarkMode();
    ensureMeteorActivity();

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
