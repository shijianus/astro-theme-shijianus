import React, { useEffect, useRef } from 'react';

type Star = {
  x: number;
  y: number;
  radius: number;
  speed: number;
  alpha: number;
  drift: number;
  glow: number;
  tint: 'white' | 'blue' | 'gold' | 'cyan' | 'green' | 'rose' | 'neon';
  char?: string; // For matrix
  cachedGlow?: CanvasGradient;
};

type ShootingStar = {
  x: number;
  y: number;
  length: number;
  speed: number;
  angle: number;
  alpha: number;
};

type UniverseMode = 
  | 'starfield' | 'nebula' | 'aurora' | 'matrix'
  | 'light-grid' | 'light-clean' | 'light-daybreak' | 'light-twilight' | 'light-snow';

const ACTIVE_DARK_BACKGROUNDS = new Set<string>(['starfield', 'nebula', 'aurora', 'matrix']);
const ACTIVE_LIGHT_BACKGROUNDS = new Set<string>(['daybreak', 'grid', 'clean', 'twilight', 'snow']);
const MAX_DEVICE_PIXEL_RATIO = 1.5;
const UNIVERSE_FRAME_INTERVAL = 1000 / 15; /* [PERF] was 24fps — 15fps is visually identical for slow-drifting stars */

function isUniverseActive() {
  return getUniverseMode() !== null;
}

function getUniverseMode(): UniverseMode | null {
  const root = document.documentElement;
  const background = root.dataset.background;
  if (root.dataset.theme === 'dark') {
    /* [REBUILD] Dark mode no longer uses Canvas animation.
       Background visuals are handled entirely by pure CSS on #web_bg
       (gradients + ::before pseudo-element star dots + CSS animation drift).
       This eliminates all per-frame JS computation in dark mode. */
    return null;
  }

  if (root.dataset.theme === 'light' && ACTIVE_LIGHT_BACKGROUNDS.has(background || '')) {
    if (background === 'clean') return 'light-clean';
    if (background === 'daybreak') return 'light-daybreak';
    if (background === 'twilight') return 'light-twilight';
    if (background === 'snow') return 'light-snow';
    return 'light-grid';
  }

  return null;
}

function randomBetween(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

function sampleTint(mode: UniverseMode): Star['tint'] {
  const roll = Math.random();
  if (mode === 'matrix') return 'neon';
  if (mode === 'light-snow') return 'white';

  if (isLightMode(mode)) {
    if (roll > 0.84) return 'rose';
    if (roll > 0.64) return 'gold';
    if (roll > 0.38) return 'green';
    return 'blue';
  }

  if (mode === 'starfield') {
    if (roll > 0.95) return 'gold';
    if (roll > 0.85) return 'cyan';
    if (roll > 0.60) return 'blue';
    return 'white';
  }

  if (mode === 'nebula') {
    if (roll > 0.72) return 'gold';
    return roll > 0.35 ? 'blue' : 'white';
  }

  return roll > 0.42 ? 'blue' : 'white';
}

function colorForTint(tint: Star['tint'], alpha: number) {
  if (tint === 'blue') return `rgba(166, 210, 255, ${alpha})`;
  if (tint === 'gold') return `rgba(255, 223, 167, ${alpha})`;
  if (tint === 'cyan') return `rgba(166, 245, 255, ${alpha})`;
  if (tint === 'green') return `rgba(78, 191, 154, ${alpha})`;
  if (tint === 'rose') return `rgba(255, 126, 126, ${alpha})`;
  if (tint === 'neon') return `rgba(0, 255, 65, ${alpha})`;
  return `rgba(255, 255, 255, ${alpha})`;
}

function isLightMode(mode: UniverseMode) {
  return mode.startsWith('light-');
}

function shouldAnimateUniverse(reducedMotionQuery?: MediaQueryList) {
  if (typeof window === 'undefined') return false;
  if (document.visibilityState !== 'visible') return false;
  if (window.innerWidth < 768) return false;
  if ((reducedMotionQuery ?? window.matchMedia('(prefers-reduced-motion: reduce)')).matches) return false;

  const navigatorWithConnection = navigator as Navigator & {
    connection?: {
      saveData?: boolean;
    };
  };

  return !navigatorWithConnection.connection?.saveData;
}

export function ThemeUniverse() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext('2d');
    if (!context) return;

    let frameId = 0;
    let isLooping = false;
    let width = 0;
    let height = 0;
    let lastShootingAt = 0;
    let lastFrameAt = 0;
    let stars: Star[] = [];
    let shootingStars: ShootingStar[] = [];
    const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

    const matrixChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789$+-*/=%""\'#&_(),.;:?!\\|{}<>[]^~';

    const createStar = (mode: UniverseMode): Star => {
      const lightMode = isLightMode(mode);
      const depth = Math.random();
      
      let radiusBase = 1.0;
      let speedBase = 0.05;
      
      if (mode === 'matrix') {
        radiusBase = randomBetween(4, 8); // font size base
        speedBase = randomBetween(0.1, 0.4);
      } else if (mode === 'light-snow') {
        radiusBase = randomBetween(1.2, 4.0);
        speedBase = randomBetween(0.08, 0.25);
      } else if (lightMode) {
        radiusBase = randomBetween(0.9, mode === 'light-grid' ? 3.1 : 2.5);
        speedBase = randomBetween(0.012, 0.08);
      } else if (mode === 'starfield') {
        radiusBase = Math.pow(Math.random(), 3) * 1.5 + 0.1; // realistic star sizes
        speedBase = randomBetween(0.005, 0.05); // very slow drift
      } else {
        radiusBase = randomBetween(0.3, 2.2);
        speedBase = randomBetween(0.015, 0.12);
      }
      
      const radius = radiusBase * (0.66 + depth * 1.2);
      
      let char;
      if (mode === 'matrix') {
         char = matrixChars[Math.floor(Math.random() * matrixChars.length)];
      }

      return {
        x: randomBetween(0, width),
        y: randomBetween(0, height),
        radius,
        speed: speedBase * (0.6 + depth * 0.95),
        alpha: mode === 'matrix' ? randomBetween(0.2, 0.9) : (lightMode ? randomBetween(0.12, 0.38) : randomBetween(0.15, 0.95)),
        drift: mode === 'matrix' ? 0 : (lightMode ? randomBetween(-0.05, 0.05) : randomBetween(-0.01, 0.01)),
        glow: mode === 'matrix' ? 0 : (lightMode ? (depth > 0.8 ? randomBetween(0.1, 0.4) : 0) : (depth > 0.92 ? randomBetween(0.1, 0.4) : 0)),
        tint: sampleTint(mode),
        char,
      };
    };

    const populate = () => {
      const mode = getUniverseMode();
      if (!mode) {
        stars = [];
        shootingStars = [];
        return;
      }

      let density = 20000;
      let minimum = 40;

      if (mode === 'matrix') {
        density = 11000;
        minimum = 60;
      } else if (mode === 'light-snow') {
        density = 12000;
        minimum = 50;
      } else if (mode === 'starfield') {
        density = 14000;
        minimum = 100;
      } else if (isLightMode(mode)) {
        density = 24000;
        minimum = 50;
      } else {
        density = 16000;
        minimum = 80;
      }
      
      const count = Math.max(minimum, Math.floor((width * height) / density));
      stars = Array.from({ length: count }, () => createStar(mode));
      shootingStars = [];
      lastShootingAt = performance.now();
      lastFrameAt = 0;
    };

    let cachedGradients: Record<string, CanvasGradient> = {};

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, MAX_DEVICE_PIXEL_RATIO);
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      cachedGradients = {};
      populate();

      if (shouldAnimateUniverse(reducedMotionQuery) && !isLooping) {
        frameId = window.requestAnimationFrame(render);
      }
    };

    const drawBackgroundGlow = (mode: UniverseMode, tick: number) => {
      if (isLightMode(mode)) {
        if (mode === 'light-twilight') {
          if (!cachedGradients.twilight) {
            const twilight = context.createLinearGradient(0, 0, 0, height);
            twilight.addColorStop(0, 'rgba(255, 238, 224, 0.4)');
            twilight.addColorStop(0.4, 'rgba(255, 212, 194, 0.15)');
            twilight.addColorStop(1, 'rgba(255, 246, 240, 0)');
            cachedGradients.twilight = twilight;
          }
          context.fillStyle = cachedGradients.twilight;
          context.fillRect(0, 0, width, height);
          return;
        }

        if (mode === 'light-snow') {
          if (!cachedGradients.snowbg) {
            const snowbg = context.createLinearGradient(0, 0, 0, height);
            snowbg.addColorStop(0, 'rgba(220, 235, 255, 0.2)');
            snowbg.addColorStop(1, 'rgba(255, 255, 255, 0)');
            cachedGradients.snowbg = snowbg;
          }
          context.fillStyle = cachedGradients.snowbg;
          context.fillRect(0, 0, width, height);
          return;
        }

        const drift = Math.sin(tick * 0.00022) * width * 0.04;
        const morning = context.createRadialGradient(width * 0.16 + drift, height * 0.12, 0, width * 0.16 + drift, height * 0.12, width * 0.42);
        morning.addColorStop(0, mode === 'light-daybreak' ? 'rgba(255, 171, 92, 0.16)' : 'rgba(255, 190, 112, 0.12)');
        morning.addColorStop(1, 'rgba(255, 190, 112, 0)');
        context.fillStyle = morning;
        context.fillRect(0, 0, width, height);

        if (!cachedGradients.air) {
          const air = context.createLinearGradient(width * 0.06, height * 0.86, width * 0.96, height * 0.12);
          air.addColorStop(0, 'rgba(66, 90, 239, 0)');
          air.addColorStop(0.42, mode === 'light-grid' ? 'rgba(66, 90, 239, 0.045)' : 'rgba(60, 154, 255, 0.052)');
          air.addColorStop(0.72, mode === 'light-daybreak' ? 'rgba(255, 138, 93, 0.052)' : 'rgba(255, 174, 80, 0.038)');
          air.addColorStop(1, 'rgba(66, 90, 239, 0)');
          cachedGradients.air = air;
        }
        context.fillStyle = cachedGradients.air;
        context.fillRect(0, 0, width, height);
        return;
      }

      if (mode === 'matrix') {
        if (!cachedGradients.matrixDark) {
          const dark = context.createLinearGradient(0, 0, 0, height);
          dark.addColorStop(0, 'rgba(0, 10, 5, 0.85)');
          dark.addColorStop(1, 'rgba(0, 15, 5, 0.6)');
          cachedGradients.matrixDark = dark;
        }
        context.fillStyle = cachedGradients.matrixDark;
        context.fillRect(0, 0, width, height);
        return;
      }

      // Deeper black for starfield
      context.fillStyle = mode === 'starfield' ? 'rgba(1, 3, 8, 0.9)' : mode === 'nebula' ? 'rgba(8, 10, 24, 0.58)' : 'rgba(5, 12, 26, 0.52)';
      context.fillRect(0, 0, width, height);

      if (!cachedGradients.firstDark) {
        const first = context.createRadialGradient(width * 0.18, height * 0.16, 0, width * 0.18, height * 0.16, width * 0.36);
        first.addColorStop(0, mode === 'aurora' ? 'rgba(66, 190, 255, 0.12)' : 'rgba(61, 122, 255, 0.08)');
        first.addColorStop(1, 'rgba(61, 122, 255, 0)');
        cachedGradients.firstDark = first;
      }
      context.fillStyle = cachedGradients.firstDark;
      context.fillRect(0, 0, width, height);

      if (!cachedGradients.secondDark) {
        const second = context.createRadialGradient(width * 0.82, height * 0.18, 0, width * 0.82, height * 0.18, width * 0.24);
        second.addColorStop(0, mode === 'nebula' ? 'rgba(140, 104, 255, 0.16)' : 'rgba(242, 185, 75, 0.06)');
        second.addColorStop(1, 'rgba(242, 185, 75, 0)');
        cachedGradients.secondDark = second;
      }
      context.fillStyle = cachedGradients.secondDark;
      context.fillRect(0, 0, width, height);

      if (mode === 'starfield') {
        if (!cachedGradients.milkyWay) {
          const band = context.createLinearGradient(0, height * 0.9, width, height * 0.1);
          band.addColorStop(0, 'rgba(255, 255, 255, 0)');
          band.addColorStop(0.3, 'rgba(40, 50, 100, 0.04)');
          band.addColorStop(0.5, 'rgba(100, 150, 255, 0.09)');
          band.addColorStop(0.7, 'rgba(60, 40, 100, 0.04)');
          band.addColorStop(1, 'rgba(255, 255, 255, 0)');
          cachedGradients.milkyWay = band;
        }
        context.save();
        context.globalAlpha = 0.6;
        context.fillStyle = cachedGradients.milkyWay;
        context.fillRect(0, 0, width, height);
        context.restore();
      }

      if (mode === 'aurora') {
        const time = tick * 0.0005;
        const cp1x = width * 0.25 + Math.sin(time) * 100;
        const cp1y = height * 0.4 + Math.cos(time * 0.8) * 100;
        const cp2x = width * 0.75 + Math.cos(time * 1.1) * 100;
        const cp2y = height * 0.6 + Math.sin(time * 0.9) * 100;

        context.beginPath();
        context.moveTo(-100, height * 0.8);
        context.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, width + 100, height * 0.2);
        
        if (!cachedGradients.auroraGradient) {
          const gradient = context.createLinearGradient(0, 0, width, height);
          gradient.addColorStop(0, 'rgba(0, 255, 128, 0.15)');
          gradient.addColorStop(0.5, 'rgba(0, 200, 255, 0.18)');
          gradient.addColorStop(1, 'rgba(150, 0, 255, 0.1)');
          cachedGradients.auroraGradient = gradient;
        }
        
        context.strokeStyle = cachedGradients.auroraGradient;
        context.globalCompositeOperation = 'screen';
        
        // Replace blur with layered strokes
        context.lineWidth = 140;
        context.globalAlpha = 0.3;
        context.stroke();
        
        context.lineWidth = 80;
        context.globalAlpha = 0.6;
        context.stroke();
        
        context.lineWidth = 30;
        context.globalAlpha = 1.0;
        context.stroke();
        
        context.globalAlpha = 1.0;
        context.globalCompositeOperation = 'source-over';
      }
    };

    const drawStar = (star: Star, tick: number, mode: UniverseMode) => {
      if (mode === 'matrix') {
        context.font = `${Math.max(10, star.radius * 2)}px monospace`;
        context.fillStyle = colorForTint(star.tint, star.alpha);
        context.fillText(star.char || '0', star.x, star.y);
        
        // randomly change char
        if (Math.random() < 0.05) {
           star.char = matrixChars[Math.floor(Math.random() * matrixChars.length)];
        }
        return;
      }

      const lightMode = isLightMode(mode);
      const twinkle = mode === 'starfield' ? (Math.sin((tick + star.x * 10) * 0.001) + 1) / 2 : (Math.sin((tick + star.x) * 0.0025) + 1) / 2;
      const alpha = lightMode
        ? Math.max(0.08, Math.min(0.6, star.alpha * (0.62 + twinkle * 0.42)))
        : Math.max(0.1, Math.min(1, star.alpha * (0.6 + twinkle * 0.4)));

      if (star.glow > 0 && mode !== 'starfield') {
        if (!star.cachedGlow) {
          const glow = context.createRadialGradient(0, 0, 0, 0, 0, star.radius * (lightMode ? 8.5 : 4.8));
          glow.addColorStop(0, colorForTint(star.tint, star.glow * (lightMode ? 0.55 : 0.68)));
          glow.addColorStop(1, colorForTint(star.tint, 0));
          star.cachedGlow = glow;
        }
        context.save();
        context.translate(star.x, star.y);
        context.beginPath();
        context.fillStyle = star.cachedGlow;
        context.arc(0, 0, star.radius * (lightMode ? 8.5 : 4.8), 0, Math.PI * 2);
        context.fill();
        context.restore();
      }

      context.beginPath();
      context.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
      context.fillStyle = colorForTint(star.tint, alpha);
      context.fill();
    };

    const maybeSpawnShootingStar = (now: number, mode: UniverseMode) => {
      const cooldown = mode === 'starfield' ? 2500 : mode === 'nebula' ? 3400 : 4800;
      const maxConcurrent = mode === 'starfield' ? 2 : 1;
      if (shootingStars.length >= maxConcurrent) return;
      if (now - lastShootingAt < cooldown + Math.random() * cooldown) return;
      lastShootingAt = now;
      shootingStars.push({
        x: randomBetween(-100, width * 0.6),
        y: randomBetween(height * 0.4, height + 100),
        length: randomBetween(mode === 'starfield' ? 80 : 90, mode === 'starfield' ? 160 : 160),
        speed: randomBetween(mode === 'starfield' ? 20 : 8, mode === 'starfield' ? 35 : 12),
        angle: -Math.PI / 4, // ↗ direction
        alpha: randomBetween(0.65, 0.95),
      });
    };

    const drawShootingStars = (delta: number) => {
      shootingStars = shootingStars.filter((s) => s.alpha > 0.04 && s.x < width + 100 && s.y > -100);
      shootingStars.forEach((s) => {
        if (!(s as any).cachedGradient) {
          const dx = -Math.cos(s.angle) * s.length;
          const dy = -Math.sin(s.angle) * s.length;
          const gradient = context.createLinearGradient(0, 0, dx, dy);
          gradient.addColorStop(0, `rgba(255, 255, 255, 1)`);
          gradient.addColorStop(0.2, `rgba(164, 210, 255, 0.72)`);
          gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
          (s as any).cachedGradient = gradient;
        }

        context.save();
        context.translate(s.x, s.y);
        context.globalAlpha = s.alpha;
        context.beginPath();
        context.moveTo(0, 0);
        context.lineTo(-Math.cos(s.angle) * s.length, -Math.sin(s.angle) * s.length);
        context.strokeStyle = (s as any).cachedGradient;
        context.lineWidth = 1.2;
        context.stroke();
        context.restore();

        s.x += s.speed * Math.cos(s.angle) * delta;
        s.y += s.speed * Math.sin(s.angle) * delta;
        s.alpha *= Math.pow(0.92, delta);
      });
    };

    let isScrolling = false;
    let scrollPauseTimer = 0;

    const onScrollPause = () => {
      isScrolling = true;
      if (scrollPauseTimer) window.clearTimeout(scrollPauseTimer);
      scrollPauseTimer = window.setTimeout(() => { isScrolling = false; }, 200);
    };

    let lastOpacity = '';

    const render = (tick: number) => {
      const mode = getUniverseMode();
      const targetOpacity = mode ? (isLightMode(mode) && mode !== 'light-snow' ? '0.62' : '1') : '0';
      if (targetOpacity !== lastOpacity) {
        canvas.style.opacity = targetOpacity;
        lastOpacity = targetOpacity;
      }
      
      if (!mode || !shouldAnimateUniverse(reducedMotionQuery) || !isIntersecting) {
        lastFrameAt = 0;
        isLooping = false;
        if (!mode || !shouldAnimateUniverse(reducedMotionQuery)) {
          context.clearRect(0, 0, width, height);
        }
        return;
      }

      isLooping = true;

      // Skip rendering during scroll to avoid competing with compositor
      if (isScrolling) {
        frameId = window.requestAnimationFrame(render);
        return;
      }

      if (lastFrameAt && tick - lastFrameAt < UNIVERSE_FRAME_INTERVAL) {
        frameId = window.requestAnimationFrame(render);
        return;
      }

      const delta = lastFrameAt ? Math.min(2.4, (tick - lastFrameAt) / 16.67) : 1;
      lastFrameAt = tick;

      context.clearRect(0, 0, width, height);
      drawBackgroundGlow(mode, tick);

      stars.forEach((star) => {
        star.x += star.speed * 0.5 * delta; // drift right
        star.y -= star.speed * delta; // move up
        
        if (star.y < -20) {
          star.y = height + 20;
          star.x = randomBetween(-20, width);
        }
        if (star.x > width + 20) {
          star.x = -20;
          star.y = randomBetween(0, height + 20);
        }

        if (mode === 'light-snow') {
           star.x += Math.sin(tick * 0.001 + star.y * 0.01) * 0.5 * delta;
        }

        drawStar(star, tick, mode);
      });

      if (!isLightMode(mode) && mode !== 'matrix') {
        maybeSpawnShootingStar(tick, mode);
        drawShootingStars(delta);
      }
      
      frameId = window.requestAnimationFrame(render);
    };

    resize();
    if (shouldAnimateUniverse(reducedMotionQuery)) {
      frameId = window.requestAnimationFrame(render);
    }
    window.addEventListener('scroll', onScrollPause, { passive: true });

    const observer = new MutationObserver(() => {
      if (!isUniverseActive()) {
        context.clearRect(0, 0, width, height);
        return;
      }
      populate();
      if (shouldAnimateUniverse(reducedMotionQuery) && isIntersecting && !isLooping) {
        frameId = window.requestAnimationFrame(render);
      }
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme', 'data-background'],
    });

    let isIntersecting = true;
    const sentinel = document.getElementById('universe-sentinel');
    let io: IntersectionObserver | null = null;
    if (sentinel) {
      io = new IntersectionObserver(([entry]) => {
        isIntersecting = entry.isIntersecting;
        if (isIntersecting && !isLooping && shouldAnimateUniverse(reducedMotionQuery)) {
          lastFrameAt = 0;
          frameId = window.requestAnimationFrame(render);
        }
      });
      io.observe(sentinel);
    }

    const handleVisibilityOrMotionChange = () => {
      lastFrameAt = 0;
      if (!shouldAnimateUniverse(reducedMotionQuery) || !isIntersecting) {
        isLooping = false;
        // Do not clear the context here to avoid flicker if it resumes
        return;
      }
      resize();
    };

    window.addEventListener('resize', resize, { passive: true });
    document.addEventListener('visibilitychange', handleVisibilityOrMotionChange);
    reducedMotionQuery.addEventListener('change', handleVisibilityOrMotionChange);
    return () => {
      observer.disconnect();
      if (io) io.disconnect();
      window.removeEventListener('resize', resize);
      window.removeEventListener('scroll', onScrollPause);
      document.removeEventListener('visibilitychange', handleVisibilityOrMotionChange);
      reducedMotionQuery.removeEventListener('change', handleVisibilityOrMotionChange);
      if (scrollPauseTimer) window.clearTimeout(scrollPauseTimer);
      window.cancelAnimationFrame(frameId);
    };
  }, []);

  return (
    <>
      <div id="universe-sentinel" style={{ position: 'absolute', top: 0, left: 0, width: '1px', height: '100vh', pointerEvents: 'none', visibility: 'hidden' }} />
      <canvas id="universe" ref={canvasRef} aria-hidden="true" style={{ position: 'fixed', top: 0, left: 0, pointerEvents: 'none', zIndex: -1, willChange: 'transform', contain: 'strict' }} />
    </>
  );
}
