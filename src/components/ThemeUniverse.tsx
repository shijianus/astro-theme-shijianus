import React, { useEffect, useRef } from 'react';

type Snowflake = {
  x: number;
  y: number;
  radius: number;
  speedY: number;
  speedX: number;
  sway: number;
  swayOffset: number;
  swaySpeed: number;
  alpha: number;
  layer: 'near' | 'mid' | 'far';
};

const MAX_DEVICE_PIXEL_RATIO = 1.5;
const FRAME_INTERVAL = 1000 / 30; // Solid 30~60 FPS rate

function isSnowActive(): boolean {
  if (typeof document === 'undefined') return false;
  return document.documentElement.dataset.background === 'snow';
}

export function ThemeUniverse() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext('2d', { alpha: true });
    if (!context) return;

    let width = 0;
    let height = 0;
    let frameId = 0;
    let lastFrameAt = 0;
    let isLooping = false;
    let isScrolling = false;
    let scrollPauseTimer = 0;
    let flakes: Snowflake[] = [];

    const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

    const cachedGradients: {
      nightMoonGlow?: CanvasGradient;
      dayFrostGlow?: CanvasGradient;
    } = {};

    const createSnowflake = (initY = false): Snowflake => {
      const depth = Math.random();
      let layer: Snowflake['layer'] = 'mid';
      let radiusBase = 2.0;
      let speedBase = 0.8;
      let alpha = 0.75;

      if (depth < 0.2) {
        // Near: Large fluffy flakes, falling faster, more sway
        layer = 'near';
        radiusBase = Math.random() * 1.5 + 2.6; // 2.6 - 4.1px
        speedBase = Math.random() * 0.5 + 1.1; // 1.1 - 1.6
        alpha = Math.random() * 0.2 + 0.8;
      } else if (depth > 0.65) {
        // Far: Small snow dust drifting slowly
        layer = 'far';
        radiusBase = Math.random() * 0.6 + 0.8; // 0.8 - 1.4px
        speedBase = Math.random() * 0.3 + 0.4; // 0.4 - 0.7
        alpha = Math.random() * 0.25 + 0.4;
      } else {
        // Mid: Standard snowflakes
        layer = 'mid';
        radiusBase = Math.random() * 0.8 + 1.6; // 1.6 - 2.4px
        speedBase = Math.random() * 0.4 + 0.7; // 0.7 - 1.1
        alpha = Math.random() * 0.2 + 0.65;
      }

      return {
        x: Math.random() * (width || window.innerWidth),
        y: initY ? Math.random() * (height || window.innerHeight) : -12,
        radius: radiusBase,
        speedY: speedBase,
        speedX: (Math.random() - 0.5) * 0.25,
        sway: Math.random() * 0.7 + 0.3,
        swayOffset: Math.random() * Math.PI * 2,
        swaySpeed: Math.random() * 0.0015 + 0.0008,
        alpha,
        layer,
      };
    };

    const populate = () => {
      if (!isSnowActive()) {
        flakes = [];
        return;
      }

      // Density calculation: roughly 1 flake per 22000 px^2, clamped between 35 and 90
      const count = Math.min(95, Math.max(35, Math.floor((width * height) / 22000)));
      flakes = Array.from({ length: count }, () => createSnowflake(true));
      cachedGradients.nightMoonGlow = undefined;
      cachedGradients.dayFrostGlow = undefined;
    };

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, MAX_DEVICE_PIXEL_RATIO);

      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      populate();
    };

    const onScrollPause = () => {
      isScrolling = true;
      if (scrollPauseTimer) window.clearTimeout(scrollPauseTimer);
      scrollPauseTimer = window.setTimeout(() => {
        isScrolling = false;
        if (!isLooping && isSnowActive() && !reducedMotionQuery.matches && document.visibilityState === 'visible') {
          frameId = window.requestAnimationFrame(render);
        }
      }, 160);
    };

    const drawAtmosphere = (isDark: boolean) => {
      if (isDark) {
        if (!cachedGradients.nightMoonGlow) {
          const glow = context.createRadialGradient(width * 0.5, 0, 0, width * 0.5, 0, height * 0.55);
          glow.addColorStop(0, 'rgba(186, 220, 255, 0.07)');
          glow.addColorStop(0.5, 'rgba(147, 197, 253, 0.025)');
          glow.addColorStop(1, 'rgba(9, 12, 20, 0)');
          cachedGradients.nightMoonGlow = glow;
        }
        context.fillStyle = cachedGradients.nightMoonGlow;
        context.fillRect(0, 0, width, height);
      } else {
        if (!cachedGradients.dayFrostGlow) {
          const glow = context.createLinearGradient(0, 0, 0, height * 0.6);
          glow.addColorStop(0, 'rgba(219, 234, 254, 0.28)');
          glow.addColorStop(0.6, 'rgba(239, 246, 255, 0.08)');
          glow.addColorStop(1, 'rgba(255, 255, 255, 0)');
          cachedGradients.dayFrostGlow = glow;
        }
        context.fillStyle = cachedGradients.dayFrostGlow;
        context.fillRect(0, 0, width, height);
      }
    };

    const drawFlake = (flake: Snowflake, isDark: boolean) => {
      context.save();
      context.beginPath();
      context.arc(flake.x, flake.y, flake.radius, 0, Math.PI * 2);

      if (isDark) {
        // Moonlit Crisp Snow in Deep Night
        if (flake.layer === 'near') {
          context.shadowBlur = 4;
          context.shadowColor = 'rgba(210, 235, 255, 0.55)';
          context.fillStyle = `rgba(248, 251, 255, ${flake.alpha})`;
        } else if (flake.layer === 'mid') {
          context.shadowBlur = 2;
          context.shadowColor = 'rgba(186, 220, 255, 0.35)';
          context.fillStyle = `rgba(240, 246, 255, ${flake.alpha})`;
        } else {
          context.fillStyle = `rgba(224, 238, 255, ${flake.alpha * 0.8})`;
        }
      } else {
        // Crisp Snow in Daylight with Soft Contrast Shadow
        if (flake.layer === 'near') {
          context.shadowBlur = 3;
          context.shadowColor = 'rgba(66, 90, 239, 0.16)';
          context.fillStyle = `rgba(255, 255, 255, ${flake.alpha})`;
        } else if (flake.layer === 'mid') {
          context.shadowBlur = 1.5;
          context.shadowColor = 'rgba(59, 130, 246, 0.12)';
          context.fillStyle = `rgba(255, 255, 255, ${flake.alpha * 0.95})`;
        } else {
          context.fillStyle = `rgba(235, 244, 255, ${flake.alpha * 0.85})`;
        }
      }

      context.fill();
      context.restore();
    };

    const render = (tick: number) => {
      const active = isSnowActive();
      canvas.style.opacity = active ? '1' : '0';

      if (!active || reducedMotionQuery.matches || document.visibilityState !== 'visible') {
        isLooping = false;
        context.clearRect(0, 0, width, height);
        return;
      }

      // During scrolling, skip render loop to protect compositor
      if (isScrolling) {
        frameId = window.requestAnimationFrame(render);
        return;
      }

      if (lastFrameAt && tick - lastFrameAt < FRAME_INTERVAL) {
        frameId = window.requestAnimationFrame(render);
        return;
      }

      const delta = lastFrameAt ? Math.min(2.5, (tick - lastFrameAt) / 16.67) : 1;
      lastFrameAt = tick;
      isLooping = true;

      const isDark = document.documentElement.dataset.theme === 'dark';

      context.clearRect(0, 0, width, height);
      drawAtmosphere(isDark);

      for (let i = 0; i < flakes.length; i++) {
        const f = flakes[i];
        f.y += f.speedY * delta;
        f.x += (Math.sin(tick * f.swaySpeed + f.swayOffset) * f.sway + f.speedX) * delta;

        // Wrap around boundaries
        if (f.y > height + 10) {
          f.y = -10;
          f.x = Math.random() * width;
        }
        if (f.x > width + 10) {
          f.x = -10;
        } else if (f.x < -10) {
          f.x = width + 10;
        }

        drawFlake(f, isDark);
      }

      frameId = window.requestAnimationFrame(render);
    };

    resize();

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible' && isSnowActive()) {
        lastFrameAt = 0;
        frameId = window.requestAnimationFrame(render);
      }
    };

    const onBackgroundChange = () => {
      populate();
      if (isSnowActive() && !isLooping) {
        lastFrameAt = 0;
        frameId = window.requestAnimationFrame(render);
      }
    };

    window.addEventListener('resize', resize, { passive: true });
    window.addEventListener('scroll', onScrollPause, { passive: true });
    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('shijianus:backgroundchange', onBackgroundChange);
    window.addEventListener('shijianus:themechange', () => {
      cachedGradients.nightMoonGlow = undefined;
      cachedGradients.dayFrostGlow = undefined;
    });

    if (isSnowActive()) {
      frameId = window.requestAnimationFrame(render);
    }

    return () => {
      if (frameId) window.cancelAnimationFrame(frameId);
      if (scrollPauseTimer) window.clearTimeout(scrollPauseTimer);
      window.removeEventListener('resize', resize);
      window.removeEventListener('scroll', onScrollPause);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('shijianus:backgroundchange', onBackgroundChange);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      id="theme-snow-universe"
      aria-hidden="true"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: -998,
        pointerEvents: 'none',
        transition: 'opacity 0.4s ease',
        contain: 'strict',
      }}
    />
  );
}

export default ThemeUniverse;
