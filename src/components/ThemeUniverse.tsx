import React, { useEffect, useRef } from 'react';

type Star = {
  x: number;
  y: number;
  radius: number;
  speed: number;
  alpha: number;
};

type ShootingStar = {
  x: number;
  y: number;
  length: number;
  speed: number;
  angle: number;
  alpha: number;
};

type UniverseMode = 'starfield' | 'nebula' | 'aurora';

const ACTIVE_BACKGROUNDS = new Set<UniverseMode>(['starfield', 'nebula', 'aurora']);

function isUniverseActive() {
  return getUniverseMode() !== null;
}

function getUniverseMode(): UniverseMode | null {
  const root = document.documentElement;
  if (root.dataset.theme !== 'dark') return null;
  const background = root.dataset.background;
  return ACTIVE_BACKGROUNDS.has(background as UniverseMode) ? (background as UniverseMode) : null;
}

function randomBetween(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

export function ThemeUniverse() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext('2d');
    if (!context) return;

    let frameId = 0;
    let width = 0;
    let height = 0;
    let lastShootingAt = 0;
    let stars: Star[] = [];
    let shootingStars: ShootingStar[] = [];

    const createStar = (): Star => ({
      x: randomBetween(0, width),
      y: randomBetween(0, height),
      radius: randomBetween(0.45, 1.8),
      speed: randomBetween(0.02, 0.12),
      alpha: randomBetween(0.32, 1),
    });

    const populate = () => {
      const mode = getUniverseMode();
      const density = mode === 'starfield' ? 9_000 : mode === 'nebula' ? 11_500 : 13_500;
      const minimum = mode === 'starfield' ? 180 : mode === 'nebula' ? 140 : 110;
      const count = Math.max(minimum, Math.floor((width * height) / density));
      stars = Array.from({ length: count }, createStar);
      shootingStars = [];
      lastShootingAt = performance.now();
    };

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      const dpr = window.devicePixelRatio || 1;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      populate();
    };

    const drawBackgroundGlow = (mode: UniverseMode) => {
      const first = context.createRadialGradient(width * 0.18, height * 0.16, 0, width * 0.18, height * 0.16, width * 0.36);
      first.addColorStop(0, mode === 'aurora' ? 'rgba(66, 190, 255, 0.12)' : 'rgba(61, 122, 255, 0.18)');
      first.addColorStop(1, 'rgba(61, 122, 255, 0)');
      context.fillStyle = first;
      context.fillRect(0, 0, width, height);

      const second = context.createRadialGradient(width * 0.82, height * 0.18, 0, width * 0.82, height * 0.18, width * 0.24);
      second.addColorStop(0, mode === 'nebula' ? 'rgba(140, 104, 255, 0.16)' : 'rgba(242, 185, 75, 0.15)');
      second.addColorStop(1, 'rgba(242, 185, 75, 0)');
      context.fillStyle = second;
      context.fillRect(0, 0, width, height);

      if (mode === 'starfield') {
        const band = context.createLinearGradient(width * 0.08, height * 0.78, width * 0.92, height * 0.24);
        band.addColorStop(0, 'rgba(255, 255, 255, 0)');
        band.addColorStop(0.45, 'rgba(255, 255, 255, 0.035)');
        band.addColorStop(0.52, 'rgba(92, 161, 255, 0.07)');
        band.addColorStop(1, 'rgba(255, 255, 255, 0)');
        context.fillStyle = band;
        context.fillRect(0, 0, width, height);
      }

      if (mode === 'aurora') {
        const ribbon = context.createLinearGradient(width * 0.1, 0, width * 0.85, height);
        ribbon.addColorStop(0, 'rgba(0, 255, 184, 0)');
        ribbon.addColorStop(0.4, 'rgba(0, 255, 184, 0.05)');
        ribbon.addColorStop(0.65, 'rgba(96, 165, 250, 0.08)');
        ribbon.addColorStop(1, 'rgba(0, 255, 184, 0)');
        context.fillStyle = ribbon;
        context.fillRect(0, 0, width, height);
      }
    };

    const drawStar = (star: Star, tick: number) => {
      const twinkle = (Math.sin((tick + star.x) * 0.0025) + 1) / 2;
      context.beginPath();
      context.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
      context.fillStyle = `rgba(255, 255, 255, ${Math.max(0.2, Math.min(1, star.alpha * (0.55 + twinkle * 0.45)))})`;
      context.fill();
    };

    const maybeSpawnShootingStar = (now: number, mode: UniverseMode) => {
      const cooldown = mode === 'starfield' ? 2200 : mode === 'nebula' ? 3400 : 4800;
      if (now - lastShootingAt < cooldown + Math.random() * cooldown) return;
      lastShootingAt = now;
      shootingStars.push({
        x: randomBetween(width * 0.2, width * 0.88),
        y: randomBetween(-40, height * 0.32),
        length: randomBetween(mode === 'starfield' ? 110 : 90, mode === 'starfield' ? 210 : 160),
        speed: randomBetween(mode === 'starfield' ? 10 : 8, mode === 'starfield' ? 16 : 12),
        angle: Math.PI / 3.2,
        alpha: randomBetween(0.65, 0.95),
      });
    };

    const drawShootingStars = () => {
      shootingStars = shootingStars.filter((shootingStar) => shootingStar.alpha > 0.04 && shootingStar.y < height + 80);
      shootingStars.forEach((shootingStar) => {
        const endX = shootingStar.x - Math.cos(shootingStar.angle) * shootingStar.length;
        const endY = shootingStar.y - Math.sin(shootingStar.angle) * shootingStar.length;
        const gradient = context.createLinearGradient(shootingStar.x, shootingStar.y, endX, endY);
        gradient.addColorStop(0, `rgba(255, 255, 255, ${shootingStar.alpha})`);
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
        context.beginPath();
        context.moveTo(shootingStar.x, shootingStar.y);
        context.lineTo(endX, endY);
        context.strokeStyle = gradient;
        context.lineWidth = 1.6;
        context.stroke();
        shootingStar.x += shootingStar.speed;
        shootingStar.y += shootingStar.speed * 0.58;
        shootingStar.alpha *= 0.965;
      });
    };

    const render = (tick: number) => {
      const mode = getUniverseMode();
      canvas.style.opacity = mode ? '1' : '0';
      if (!mode) {
        context.clearRect(0, 0, width, height);
        frameId = window.requestAnimationFrame(render);
        return;
      }

      context.clearRect(0, 0, width, height);
      drawBackgroundGlow(mode);

      stars.forEach((star) => {
        star.y += star.speed;
        if (star.y > height + 2) {
          star.y = -2;
          star.x = randomBetween(0, width);
        }
        drawStar(star, tick);
      });

      maybeSpawnShootingStar(tick, mode);
      drawShootingStars();
      frameId = window.requestAnimationFrame(render);
    };

    resize();
    frameId = window.requestAnimationFrame(render);

    const observer = new MutationObserver(() => {
      if (!isUniverseActive()) {
        context.clearRect(0, 0, width, height);
        return;
      }

      populate();
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme', 'data-background'],
    });

    window.addEventListener('resize', resize, { passive: true });
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', resize);
      window.cancelAnimationFrame(frameId);
    };
  }, []);

  return <canvas id="universe" ref={canvasRef} aria-hidden="true" />;
}
