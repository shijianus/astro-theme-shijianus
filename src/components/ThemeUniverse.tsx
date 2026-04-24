import React, { useEffect, useRef } from 'react';

type Star = {
  x: number;
  y: number;
  radius: number;
  speed: number;
  alpha: number;
  drift: number;
  glow: number;
  tint: 'white' | 'blue' | 'gold' | 'cyan' | 'green' | 'rose';
};

type ShootingStar = {
  x: number;
  y: number;
  length: number;
  speed: number;
  angle: number;
  alpha: number;
};

type UniverseMode = 'starfield' | 'nebula' | 'aurora' | 'light-grid' | 'light-clean';

const ACTIVE_DARK_BACKGROUNDS = new Set<UniverseMode>(['starfield', 'nebula', 'aurora']);
const ACTIVE_LIGHT_BACKGROUNDS = new Set(['grid', 'clean']);

function isUniverseActive() {
  return getUniverseMode() !== null;
}

function getUniverseMode(): UniverseMode | null {
  const root = document.documentElement;
  const background = root.dataset.background;
  if (root.dataset.theme === 'dark') {
    return ACTIVE_DARK_BACKGROUNDS.has(background as UniverseMode) ? (background as UniverseMode) : null;
  }

  if (root.dataset.theme === 'light' && ACTIVE_LIGHT_BACKGROUNDS.has(background || '')) {
    return background === 'clean' ? 'light-clean' : 'light-grid';
  }

  return null;
}

function randomBetween(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

function sampleTint(mode: UniverseMode): Star['tint'] {
  const roll = Math.random();
  if (isLightMode(mode)) {
    if (roll > 0.84) return 'rose';
    if (roll > 0.64) return 'gold';
    if (roll > 0.38) return 'green';
    return 'blue';
  }

  if (mode === 'starfield') {
    if (roll > 0.88) return 'gold';
    if (roll > 0.7) return 'cyan';
    if (roll > 0.46) return 'blue';
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
  return `rgba(255, 255, 255, ${alpha})`;
}

function isLightMode(mode: UniverseMode) {
  return mode === 'light-grid' || mode === 'light-clean';
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

    const createStar = (mode: UniverseMode): Star => {
      const lightMode = isLightMode(mode);
      const depth = Math.random();
      const radiusBase = lightMode
        ? randomBetween(0.9, mode === 'light-grid' ? 3.1 : 2.4)
        : mode === 'starfield'
          ? randomBetween(0.32, 2.7)
          : mode === 'nebula'
            ? randomBetween(0.45, 2.2)
            : randomBetween(0.5, 1.9);
      const radius = radiusBase * (0.66 + depth * (mode === 'starfield' ? 1.35 : 0.95));
      const speedBase = lightMode
        ? randomBetween(0.012, mode === 'light-grid' ? 0.09 : 0.055)
        : mode === 'starfield'
          ? randomBetween(0.018, 0.22)
          : mode === 'nebula'
            ? randomBetween(0.018, 0.12)
            : randomBetween(0.016, 0.09);

      return {
        x: randomBetween(0, width),
        y: randomBetween(0, height),
        radius,
        speed: speedBase * (0.6 + depth * 0.95),
        alpha: lightMode ? randomBetween(0.12, mode === 'light-grid' ? 0.38 : 0.24) : randomBetween(mode === 'starfield' ? 0.4 : 0.3, 1),
        drift: lightMode ? randomBetween(-0.08, 0.08) : randomBetween(-0.035, 0.035) * (mode === 'starfield' ? 1.35 : 0.75),
        glow: lightMode
          ? depth > 0.62
            ? randomBetween(0.04, 0.14)
            : 0
          : depth > (mode === 'starfield' ? 0.5 : 0.72)
            ? randomBetween(0.16, mode === 'starfield' ? 0.5 : 0.3)
            : 0,
        tint: sampleTint(mode),
      };
    };

    const populate = () => {
      const mode = getUniverseMode();
      if (!mode) {
        stars = [];
        shootingStars = [];
        return;
      }

      const density = isLightMode(mode)
        ? mode === 'light-grid'
          ? 13_000
          : 18_000
        : mode === 'starfield'
          ? 5_400
          : mode === 'nebula'
            ? 11_500
            : 13_500;
      const minimum = isLightMode(mode) ? (mode === 'light-grid' ? 90 : 62) : mode === 'starfield' ? 340 : mode === 'nebula' ? 140 : 110;
      const count = Math.max(minimum, Math.floor((width * height) / density));
      stars = Array.from({ length: count }, () => createStar(mode));
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

    const drawBackgroundGlow = (mode: UniverseMode, tick: number) => {
      if (isLightMode(mode)) {
        const drift = Math.sin(tick * 0.00022) * width * 0.04;
        const morning = context.createRadialGradient(width * 0.16 + drift, height * 0.12, 0, width * 0.16 + drift, height * 0.12, width * 0.42);
        morning.addColorStop(0, 'rgba(255, 190, 112, 0.12)');
        morning.addColorStop(1, 'rgba(255, 190, 112, 0)');
        context.fillStyle = morning;
        context.fillRect(0, 0, width, height);

        const air = context.createLinearGradient(width * 0.06, height * 0.86, width * 0.96, height * 0.12);
        air.addColorStop(0, 'rgba(66, 90, 239, 0)');
        air.addColorStop(0.42, mode === 'light-grid' ? 'rgba(66, 90, 239, 0.045)' : 'rgba(78, 191, 154, 0.035)');
        air.addColorStop(0.72, 'rgba(255, 174, 80, 0.038)');
        air.addColorStop(1, 'rgba(66, 90, 239, 0)');
        context.fillStyle = air;
        context.fillRect(0, 0, width, height);
        return;
      }

      context.fillStyle = mode === 'starfield' ? 'rgba(3, 8, 18, 0.72)' : mode === 'nebula' ? 'rgba(8, 10, 24, 0.58)' : 'rgba(5, 12, 26, 0.52)';
      context.fillRect(0, 0, width, height);

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
        band.addColorStop(0.36, 'rgba(255, 255, 255, 0.03)');
        band.addColorStop(0.49, 'rgba(137, 196, 255, 0.085)');
        band.addColorStop(0.58, 'rgba(255, 222, 173, 0.048)');
        band.addColorStop(1, 'rgba(255, 255, 255, 0)');
        context.fillStyle = band;
        context.fillRect(0, 0, width, height);

        const horizon = context.createLinearGradient(0, height * 0.72, 0, height);
        horizon.addColorStop(0, 'rgba(8, 16, 30, 0)');
        horizon.addColorStop(1, 'rgba(6, 10, 20, 0.4)');
        context.fillStyle = horizon;
        context.fillRect(0, 0, width, height);

        const cornerGlow = context.createRadialGradient(width * 0.78, height * 0.72, 0, width * 0.78, height * 0.72, width * 0.34);
        cornerGlow.addColorStop(0, 'rgba(84, 138, 255, 0.11)');
        cornerGlow.addColorStop(1, 'rgba(84, 138, 255, 0)');
        context.fillStyle = cornerGlow;
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

    const drawStar = (star: Star, tick: number, mode: UniverseMode) => {
      const lightMode = isLightMode(mode);
      const twinkle = (Math.sin((tick + star.x) * 0.0025) + 1) / 2;
      const alpha = lightMode
        ? Math.max(0.08, Math.min(0.42, star.alpha * (0.62 + twinkle * 0.42)))
        : Math.max(0.24, Math.min(1, star.alpha * (0.52 + twinkle * 0.56)));

      if (star.glow > 0) {
        const glow = context.createRadialGradient(star.x, star.y, 0, star.x, star.y, star.radius * (lightMode ? 8.5 : 4.8));
        glow.addColorStop(0, colorForTint(star.tint, star.glow * (lightMode ? 0.55 : 0.68)));
        glow.addColorStop(1, colorForTint(star.tint, 0));
        context.beginPath();
        context.fillStyle = glow;
        context.arc(star.x, star.y, star.radius * (lightMode ? 8.5 : 4.8), 0, Math.PI * 2);
        context.fill();
      }

      context.beginPath();
      context.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
      context.fillStyle = colorForTint(star.tint, alpha);
      context.fill();

      if (lightMode) {
        context.beginPath();
        context.arc(star.x, star.y, star.radius * 2.8, 0, Math.PI * 2);
        context.strokeStyle = colorForTint(star.tint, alpha * 0.16);
        context.lineWidth = 1;
        context.stroke();
        return;
      }

      if (star.radius > 1.7) {
        context.beginPath();
        context.arc(star.x, star.y, Math.max(0.7, star.radius * 0.34), 0, Math.PI * 2);
        context.fillStyle = 'rgba(255, 255, 255, 0.9)';
        context.fill();
      }
    };

    const drawLightConstellations = (tick: number) => {
      const maxDistance = Math.min(150, Math.max(92, width * 0.09));
      const stride = Math.max(2, Math.floor(stars.length / 54));

      context.lineWidth = 1;
      for (let i = 0; i < stars.length; i += stride) {
        const first = stars[i];
        const second = stars[i + stride];
        if (!first || !second) continue;

        const distance = Math.hypot(first.x - second.x, first.y - second.y);
        if (distance > maxDistance) continue;

        const pulse = (Math.sin(tick * 0.001 + first.x * 0.02) + 1) / 2;
        context.beginPath();
        context.moveTo(first.x, first.y);
        context.lineTo(second.x, second.y);
        context.strokeStyle = colorForTint(first.tint, (1 - distance / maxDistance) * (0.035 + pulse * 0.035));
        context.stroke();
      }
    };

    const maybeSpawnShootingStar = (now: number, mode: UniverseMode) => {
      const cooldown = mode === 'starfield' ? 980 : mode === 'nebula' ? 3400 : 4800;
      const maxConcurrent = mode === 'starfield' ? 3 : 1;
      if (shootingStars.length >= maxConcurrent) return;
      if (now - lastShootingAt < cooldown + Math.random() * cooldown) return;
      lastShootingAt = now;
      shootingStars.push({
        x: randomBetween(width * 0.2, width * 0.88),
        y: randomBetween(-40, height * 0.32),
        length: randomBetween(mode === 'starfield' ? 140 : 90, mode === 'starfield' ? 280 : 160),
        speed: randomBetween(mode === 'starfield' ? 13 : 8, mode === 'starfield' ? 22 : 12),
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
        gradient.addColorStop(0.2, `rgba(164, 210, 255, ${shootingStar.alpha * 0.72})`);
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
        context.beginPath();
        context.moveTo(shootingStar.x, shootingStar.y);
        context.lineTo(endX, endY);
        context.strokeStyle = gradient;
        context.lineWidth = 1.8;
        context.stroke();
        shootingStar.x += shootingStar.speed;
        shootingStar.y += shootingStar.speed * 0.58;
        shootingStar.alpha *= 0.965;
      });
    };

    const render = (tick: number) => {
      const mode = getUniverseMode();
      canvas.style.opacity = mode ? (isLightMode(mode) ? '0.62' : '1') : '0';
      if (!mode) {
        context.clearRect(0, 0, width, height);
        frameId = window.requestAnimationFrame(render);
        return;
      }

      context.clearRect(0, 0, width, height);
      drawBackgroundGlow(mode, tick);
      if (isLightMode(mode)) drawLightConstellations(tick);

      stars.forEach((star) => {
        star.x += star.drift;
        star.y += star.speed;
        if (star.y > height + 2) {
          star.y = -2;
          star.x = randomBetween(0, width);
        }
        if (star.x > width + 2) star.x = -2;
        if (star.x < -2) star.x = width + 2;
        drawStar(star, tick, mode);
      });

      if (!isLightMode(mode)) {
        maybeSpawnShootingStar(tick, mode);
        drawShootingStars();
      }
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
