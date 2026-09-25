import React, { useEffect } from 'react';

interface CinematicSnowParticle {
  x: number;
  y: number;
  radius: number;
  opacity: number;
  vx: number;
  vy: number;
  wobble: number;
  wobbleSpeed: number;
  swayAmplitude: number;
  shapeOffsets: { x: number; y: number }[];
  layer: number; // 0: back (distant dust), 1: mid (standard snow over cards), 2: front (close flakes), 3: camera (lens flakes)
}

/**
 * ThemeUniverse: Cinematic, Photorealistic Multi-Layer Snowfall Engine.
 * 
 * Inspired by and modeled after react-cinematic-snow (https://github.com/khoama/react-cinematic-snow):
 * 1. Organic Smooth Clump Aggregates:
 *    - Procedural 5-8 vertex natural snow clumps connected with quadratic curves through midpoints.
 *    - Completely eliminates artificial straight-polygon razor corners and geometric vector stamps.
 * 2. Physical Size-Speed Correlation & Parallax:
 *    - Terminal velocity strictly proportional to radius (v_y = (radius / 2.5) * sMult).
 *    - Larger flakes sway and fall faster; tiny background ice dust drifts lazily.
 * 3. Dynamic Multi-Scale Harmonic Wind System:
 *    - Slow primary wave (~20-40s directional drift)
 *    - Medium oscillation & rapid flutter
 *    - Random natural gusts (2-5s sinusoidal bursts)
 *    - Dual-frequency wobble sway with aerodynamic tilt
 * 4. 3-Canvas True Depth-of-Field Architectural Layering:
 *    - Background Canvas (#theme-snow-universe, z-index: -1): Layer 0 (distant atmospheric dust behind cards).
 *    - Content Snow Canvas (#theme-snow-mid, z-index: 20): Layer 1 (in-focus organic snowflakes drifting over cards).
 *    - Foreground Bokeh Canvas (#theme-snow-foreground, z-index: 25): Layer 2 (front flakes) + Layer 3 (camera close calls)
 *      with hardware compositor CSS `filter: blur(2.5px)`.
 * 5. High-Visibility Directional Winter Light Model (Daylight & Nighttime):
 *    - Daylight Mode: Top pure snow white (#fff) -> crisp snow core -> underside soft ambient winter shadow (rgba(138, 172, 210, 0.94)).
 *      Flakes are 100% clearly visible over pure white cards (#ffffff) without any hollow rings, cartoon outlines, or dark dirty borders.
 *    - Dark Mode: Pure luminous white with delicate glints against the deep night sky.
 * 6. High Performance & Zero DOM Pollution:
 *    - Zero ctx.shadowBlur (avoiding Skia offscreen Gaussian blur CPU lag), locked at 60FPS.
 *    - All cards remain 100% clean DOM with pointer-events: none on all canvases.
 */
export function ThemeUniverse() {
  useEffect(() => {
    const bgCanvas = document.getElementById('theme-snow-universe') as HTMLCanvasElement | null;
    const midCanvas = document.getElementById('theme-snow-mid') as HTMLCanvasElement | null;
    const fgCanvas = document.getElementById('theme-snow-foreground') as HTMLCanvasElement | null;
    if (!bgCanvas) return;

    const bgCtx = bgCanvas.getContext('2d', { alpha: true });
    const midCtx = midCanvas ? midCanvas.getContext('2d', { alpha: true }) : null;
    const fgCtx = fgCanvas ? fgCanvas.getContext('2d', { alpha: true }) : null;
    if (!bgCtx) return;

    let animId: number = 0;
    let isRunning = false;
    let width = 0;
    let height = 0;
    let dpr = 1;
    let particles: CinematicSnowParticle[] = [];
    let isScrolling = false;
    let scrollTimeout: any = null;

    const isSnowActive = () => {
      const bg = document.documentElement.dataset.background;
      return bg === 'snow';
    };

    const isDarkMode = () => {
      return document.documentElement.dataset.theme === 'dark';
    };

    // Helper: random number in range [min, max]
    const random = (min: number, max: number) => Math.random() * (max - min) + min;

    // Helper: Create irregular 5-8 vertex polygon offsets
    const createOrganicOffsets = (radius: number, rough: number) => {
      const points = 5 + Math.floor(Math.random() * 4); // 5 to 8 vertices
      const offsets: { x: number; y: number }[] = [];
      for (let i = 0; i < points; i++) {
        const angle = (i / points) * Math.PI * 2;
        const variance = 1 + (Math.random() - 0.5) * rough;
        offsets.push({
          x: Math.cos(angle) * radius * variance,
          y: Math.sin(angle) * radius * variance,
        });
      }
      return offsets;
    };

    // Helper: Smooth organic clump contour using quadratic curves through midpoints
    const pathSmoothClump = (ctx: CanvasRenderingContext2D, offsets: { x: number; y: number }[], radius: number) => {
      const n = offsets.length;
      if (n < 3) {
        ctx.beginPath();
        ctx.arc(0, 0, radius, 0, Math.PI * 2);
        return;
      }
      ctx.beginPath();
      const mx0 = (offsets[n - 1].x + offsets[0].x) / 2;
      const my0 = (offsets[n - 1].y + offsets[0].y) / 2;
      ctx.moveTo(mx0, my0);
      for (let i = 0; i < n; i++) {
        const curr = offsets[i];
        const next = offsets[(i + 1) % n];
        const mx = (curr.x + next.x) / 2;
        const my = (curr.y + next.y) / 2;
        ctx.quadraticCurveTo(curr.x, curr.y, mx, my);
      }
      ctx.closePath();
    };

    // Dynamic multi-scale wind simulation (from react-cinematic-snow)
    const windState = {
      time: 0,
      gustTime: 0,
      gustStrength: 0,
      gustDirection: 1,
    };

    const getDynamicWind = (baseWind: number) => {
      windState.time += 0.016; // ~60fps step

      // Slow primary wave (shifts direction every ~20-40s)
      const slowWave = Math.sin(windState.time * 0.05) * 0.7;
      // Secondary medium oscillation
      const mediumWave = Math.sin(windState.time * 0.15) * 0.3;
      // Tertiary rapid flutter
      const quickWave = Math.sin(windState.time * 0.8) * 0.1;

      // Occasional random wind gusts (every 25-45s)
      windState.gustTime -= 0.016;
      if (windState.gustTime <= 0) {
        if (Math.random() < 0.0008) {
          windState.gustStrength = 0.5 + Math.random() * 1.5;
          windState.gustDirection = Math.random() > 0.5 ? 1 : -1;
          windState.gustTime = 2 + Math.random() * 3; // 2-5 seconds
        }
      }

      const gustFactor = windState.gustTime > 0
        ? Math.sin((windState.gustTime / 3) * Math.PI) * windState.gustStrength * windState.gustDirection
        : 0;

      return baseWind * (1 + slowWave + mediumWave + quickWave + gustFactor);
    };

    // Generate particles for a specific optical depth tier
    const createTierParticles = (
      count: number,
      rMin: number,
      rMax: number,
      sMult: number,
      layer: number,
      roughness: number
    ): CinematicSnowParticle[] => {
      const list: CinematicSnowParticle[] = [];
      for (let i = 0; i < count; i++) {
        const radius = random(rMin, rMax);
        const sizeFactor = (radius - rMin) / (rMax - rMin || 1);

        // Opacity: larger flakes are more solid, smaller are hazy
        let opacity = 0.3 + (sizeFactor * 0.55) + (Math.random() * 0.2 - 0.1);
        opacity = Math.max(0.25, Math.min(1.0, opacity));

        // Speed: physically correlated with radius (terminal velocity)
        const baseSpeed = (radius / 2.5) * sMult;
        const speedVariance = random(0.85, 1.15);
        const sizeScale = Math.max(0.5, radius / 2.5);

        list.push({
          x: Math.random() * width,
          y: Math.random() * height,
          radius,
          opacity,
          vx: random(-0.1, 0.1) * sizeScale,
          vy: baseSpeed * speedVariance,
          wobble: Math.random() * Math.PI * 2,
          wobbleSpeed: random(0.006, 0.024),
          swayAmplitude: random(0.3, 0.75) * sizeScale,
          shapeOffsets: radius > 1.2 ? createOrganicOffsets(radius, roughness) : [],
          layer,
        });
      }
      return list;
    };

    // Initialize 4-tier optical layering
    const initParticles = () => {
      const density = Math.min(320, Math.max(160, Math.round((width * height) / 5800)));
      const roughness = 0.88;

      // 1. Back: Distant snow dust & micro flakes (on bgCanvas, z-index: -1, behind cards)
      const backParticles = createTierParticles(
        Math.floor(density * 0.40),
        0.5,
        1.5,
        0.55,
        0,
        0.7
      );

      // 2. Mid: In-focus standard snowflakes (on midCanvas, z-index: 20, drifting over cards)
      const midParticles = createTierParticles(
        Math.floor(density * 0.48),
        1.8,
        3.8,
        1.15,
        1,
        roughness
      );

      // 3. Front: Fast close flakes (on fgCanvas, z-index: 25 with blur)
      const frontParticles = createTierParticles(
        Math.max(6, Math.floor(density * 0.10)),
        3.5,
        5.8,
        1.45,
        2,
        roughness
      );

      // 4. Camera: Rare massive lens flakes (cinematic out-of-focus close calls on fgCanvas)
      const cameraParticles = createTierParticles(
        Math.max(2, Math.floor(density * 0.015)),
        7.5,
        13.0,
        2.0,
        3,
        roughness
      );

      particles = [...backParticles, ...midParticles, ...frontParticles, ...cameraParticles];
    };

    // Responsive Canvas Resize for all 3 canvases
    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;

      // 1. Background canvas (z-index: -1)
      bgCanvas.width = Math.round(width * dpr);
      bgCanvas.height = Math.round(height * dpr);
      bgCanvas.style.width = `${width}px`;
      bgCanvas.style.height = `${height}px`;
      bgCtx.setTransform(dpr, 0, 0, dpr, 0, 0);

      // 2. Content mid canvas (z-index: 20)
      if (midCanvas && midCtx) {
        midCanvas.width = Math.round(width * dpr);
        midCanvas.height = Math.round(height * dpr);
        midCanvas.style.width = `${width}px`;
        midCanvas.style.height = `${height}px`;
        midCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
      }

      // 3. Foreground blurred canvas (z-index: 25)
      if (fgCanvas && fgCtx) {
        fgCanvas.width = Math.round(width * dpr);
        fgCanvas.height = Math.round(height * dpr);
        fgCanvas.style.width = `${width}px`;
        fgCanvas.style.height = `${height}px`;
        fgCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
      }

      initParticles();
    };

    // Main animation render loop
    const render = () => {
      if (!isRunning) return;

      // Throttle under heavy scroll to maintain 60FPS responsiveness
      if (isScrolling && Math.random() > 0.5) {
        animId = requestAnimationFrame(render);
        return;
      }

      bgCtx.clearRect(0, 0, width, height);
      if (midCtx) midCtx.clearRect(0, 0, width, height);
      if (fgCtx) fgCtx.clearRect(0, 0, width, height);

      const isDark = isDarkMode();
      const currentWind = getDynamicWind(0.32);

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.wobble += p.wobbleSpeed;

        // Dual-frequency aerodynamic sway
        const primarySway = Math.sin(p.wobble) * p.swayAmplitude;
        const secondarySway = Math.cos(p.wobble * 1.8 + p.y * 0.01) * (p.swayAmplitude * 0.2);

        // Wind multiplier based on optical depth
        const wMult = p.layer === 0 ? 0.6 : p.layer === 1 ? 1.0 : 1.5;

        // Position update
        p.x += currentWind * wMult + p.vx + primarySway + secondarySway;
        p.y += p.vy;

        // Boundary wrap-around
        if (p.y > height + p.radius * 2.5) {
          p.y = -p.radius * 2;
          p.x = Math.random() * width;
        }
        if (p.x > width + p.radius * 2.5) {
          p.x = -p.radius * 2;
        } else if (p.x < -p.radius * 2.5) {
          p.x = width + p.radius * 2;
        }

        // Target canvas context routing:
        // Layer 0 -> bgCtx (z-index: -1, behind cards)
        // Layer 1 -> midCtx (z-index: 20, drifting in front of cards)
        // Layer 2 & 3 -> fgCtx (z-index: 25, blurred bokeh camera flakes)
        let targetCtx = bgCtx;
        if (p.layer === 1) {
          targetCtx = midCtx || bgCtx;
        } else if (p.layer >= 2) {
          targetCtx = fgCtx || bgCtx;
        }

        const alpha = Math.min(1, p.opacity);

        targetCtx.save();
        targetCtx.translate(p.x, p.y);
        // Aerodynamic oscillation rocking
        targetCtx.rotate(Math.sin(p.wobble));

        if (isDark) {
          // ── NIGHT SCENARIO (PURE LUMINOUS WHITE WITH OPTICAL DEPTH) ──
          pathSmoothClump(targetCtx, p.shapeOffsets, p.radius);
          if (p.layer === 0) {
            targetCtx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.50})`;
          } else if (p.layer === 1) {
            targetCtx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.95})`;
          } else {
            targetCtx.fillStyle = `rgba(235, 245, 255, ${alpha * 0.85})`;
          }
          targetCtx.fill();
        } else {
          // ── DAYLIGHT SCENARIO (HIGH VISIBILITY OVER WHITE CARDS VIA DIRECTIONAL ILLUMINATION) ──
          if (p.layer === 0) {
            // Distant atmospheric ice dust on winter sky
            pathSmoothClump(targetCtx, p.shapeOffsets, p.radius);
            targetCtx.fillStyle = `rgba(145, 175, 210, ${alpha * 0.70})`;
            targetCtx.fill();
          } else if (p.layer === 1) {
            // Mid in-focus flakes drifting over white cards:
            // Directional winter light gradient: top pure snow white, underside soft ambient sky shadow.
            // 100% natural, solid snow clump with clear contrast against #ffffff cards, zero hollow rings.
            const grad = targetCtx.createLinearGradient(0, -p.radius, 0, p.radius);
            grad.addColorStop(0, `rgba(255, 255, 255, ${alpha * 0.98})`);
            grad.addColorStop(0.45, `rgba(238, 246, 255, ${alpha * 0.96})`);
            grad.addColorStop(1, `rgba(138, 172, 210, ${alpha * 0.94})`);

            pathSmoothClump(targetCtx, p.shapeOffsets, p.radius);
            targetCtx.fillStyle = grad;
            targetCtx.fill();
          } else {
            // Layer 2 & 3: Foreground camera flakes on blurred canvas
            const grad = targetCtx.createLinearGradient(0, -p.radius, 0, p.radius);
            grad.addColorStop(0, `rgba(255, 255, 255, ${alpha * 0.90})`);
            grad.addColorStop(1, `rgba(165, 195, 228, ${alpha * 0.85})`);

            pathSmoothClump(targetCtx, p.shapeOffsets, p.radius);
            targetCtx.fillStyle = grad;
            targetCtx.fill();
          }
        }

        targetCtx.restore();
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
      if (bgCtx) bgCtx.clearRect(0, 0, width, height);
      if (midCtx) midCtx.clearRect(0, 0, width, height);
      if (fgCtx) fgCtx.clearRect(0, 0, width, height);
    };

    const updateState = () => {
      const active = isSnowActive();
      if (active) {
        if (bgCanvas) bgCanvas.style.opacity = '1';
        if (midCanvas) midCanvas.style.opacity = '1';
        if (fgCanvas) fgCanvas.style.opacity = '1';
        startLoop();
      } else {
        if (bgCanvas) bgCanvas.style.opacity = '0';
        if (midCanvas) midCanvas.style.opacity = '0';
        if (fgCanvas) fgCanvas.style.opacity = '0';
        setTimeout(() => {
          if (!isSnowActive()) stopLoop();
        }, 300);
      }
    };

    // Scroll listener for frame budget preservation
    const handleScroll = () => {
      isScrolling = true;
      if (scrollTimeout) clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        isScrolling = false;
      }, 100);
    };

    // Tab visibility handling
    const handleVisibility = () => {
      if (document.hidden) {
        stopLoop();
      } else if (isSnowActive()) {
        startLoop();
      }
    };

    // Mutation observer for data-background and data-theme changes
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
    window.addEventListener('scroll', handleScroll, { passive: true });
    document.addEventListener('visibilitychange', handleVisibility);

    // Initial setup
    resize();
    updateState();

    return () => {
      stopLoop();
      observer.disconnect();
      window.removeEventListener('resize', resize);
      window.removeEventListener('scroll', handleScroll);
      document.removeEventListener('visibilitychange', handleVisibility);
      if (scrollTimeout) clearTimeout(scrollTimeout);
    };
  }, []);

  return null;
}

export default ThemeUniverse;
