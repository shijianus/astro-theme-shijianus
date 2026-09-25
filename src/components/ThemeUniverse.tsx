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
  layer: number; // 0: back (distant dust), 1: mid (standard snow), 2: front (close flakes), 3: camera (lens flakes)
}

/**
 * ThemeUniverse: Cinematic, Photorealistic Multi-Layer Snowfall Engine.
 * 
 * Inspired by and modeled after react-cinematic-snow (https://github.com/khoama/react-cinematic-snow):
 * 1. Organic Irregular Polygons: Procedural 5-8 vertex natural snow clumps/aggregates (zero clipart, zero geometric circles).
 * 2. Physical Size-Speed Correlation: Larger flakes have higher terminal velocity and fall faster; tiny flakes drift slowly.
 * 3. Dynamic Multi-Scale Wind System:
 *    - Slow directional oscillation (~20-40s primary wave)
 *    - Medium oscillation & rapid flutter
 *    - Random natural gusts with smooth sinusoidal fade in/out
 *    - Dual-frequency sway and aerodynamic back-and-forth tilt
 * 4. Cinematic Depth-of-Field Layering:
 *    - Background Canvas (#theme-snow-universe, z-index: -1): Layer 0 (distant atmospheric dust) + Layer 1 (in-focus mid-plane snow)
 *    - Foreground Canvas (#theme-snow-foreground, z-index: 25): Layer 2 (close snow) + Layer 3 (camera out-of-focus close-call flakes)
 *      Offloaded to hardware compositor via CSS `filter: blur(2.5px)`.
 * 5. High-Contrast Natural Daylight Shading:
 *    - Light Mode: Dual-pass optical scattering (soft cool atmospheric ice fringe + pure white body) ensures
 *      complete, natural visibility across pure white cards (#ffffff) without artificial black/dark lines.
 *    - Dark Mode: Luminous crystalline white and soft ice-blue glints against the deep night sky.
 * 6. High Performance: Zero ctx.shadowBlur (avoiding Skia offscreen Gaussian blur CPU lag), locked at 60FPS.
 */
export function ThemeUniverse() {
  useEffect(() => {
    const bgCanvas = document.getElementById('theme-snow-universe') as HTMLCanvasElement | null;
    const fgCanvas = document.getElementById('theme-snow-foreground') as HTMLCanvasElement | null;
    if (!bgCanvas) return;

    const bgCtx = bgCanvas.getContext('2d', { alpha: true });
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

    // Helper: Create irregular 5-8 vertex polygon shape (from react-cinematic-snow)
    const createIrregularShape = (radius: number, rough: number) => {
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
        let opacity = 0.25 + (sizeFactor * 0.55) + (Math.random() * 0.3 - 0.15);
        opacity = Math.max(0.2, Math.min(1.0, opacity));

        // Speed: physically correlated with radius (larger flakes fall faster)
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
          wobbleSpeed: random(0.006, 0.026),
          swayAmplitude: random(0.3, 0.8) * sizeScale,
          shapeOffsets: createIrregularShape(radius, roughness),
          layer,
        });
      }
      return list;
    };

    // Initialize 4-tier optical layering
    const initParticles = () => {
      const density = Math.min(260, Math.max(130, Math.round((width * height) / 8500)));
      const roughness = 0.85;

      // 1. Back: Distant snow dust & micro flakes (small, slow, hazy on bgCanvas)
      const backParticles = createTierParticles(
        Math.floor(density * 0.48),
        0.5,
        1.6,
        0.55,
        0,
        roughness
      );

      // 2. Mid: In-focus standard snow flakes (crisp on bgCanvas)
      const midParticles = createTierParticles(
        Math.floor(density * 0.38),
        1.5,
        3.2,
        0.95,
        1,
        roughness
      );

      // 3. Front: Fast close flakes (drifting over cards on fgCanvas)
      const frontParticles = createTierParticles(
        Math.floor(density * 0.11),
        3.2,
        5.5,
        1.45,
        2,
        roughness
      );

      // 4. Camera: Rare massive lens flakes (cinematic out-of-focus close calls)
      const cameraParticles = createTierParticles(
        Math.max(2, Math.floor(density * 0.018)),
        6.5,
        13.0,
        1.95,
        3,
        roughness
      );

      particles = [...backParticles, ...midParticles, ...frontParticles, ...cameraParticles];
    };

    // Responsive Canvas Resize
    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;

      bgCanvas.width = Math.round(width * dpr);
      bgCanvas.height = Math.round(height * dpr);
      bgCanvas.style.width = `${width}px`;
      bgCanvas.style.height = `${height}px`;
      bgCtx.setTransform(dpr, 0, 0, dpr, 0, 0);

      if (fgCanvas && fgCtx) {
        fgCanvas.width = Math.round(width * dpr);
        fgCanvas.height = Math.round(height * dpr);
        fgCanvas.style.width = `${width}px`;
        fgCanvas.style.height = `${height}px`;
        fgCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
      }

      initParticles();
    };

    // Draw single irregular polygon
    const drawPolygonPath = (ctx: CanvasRenderingContext2D, p: CinematicSnowParticle) => {
      if (p.shapeOffsets.length > 0) {
        ctx.beginPath();
        ctx.moveTo(p.shapeOffsets[0].x, p.shapeOffsets[0].y);
        for (let j = 1; j < p.shapeOffsets.length; j++) {
          ctx.lineTo(p.shapeOffsets[j].x, p.shapeOffsets[j].y);
        }
        ctx.closePath();
      } else {
        ctx.beginPath();
        ctx.arc(0, 0, p.radius, 0, Math.PI * 2);
      }
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
        const wMult = p.layer === 0 ? 0.55 : p.layer === 1 ? 1.0 : 1.5;

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

        // Target context: Layer 0 & 1 -> bgCtx, Layer 2 & 3 -> fgCtx
        const isForeground = p.layer >= 2;
        const targetCtx = isForeground && fgCtx ? fgCtx : bgCtx;
        const layerOpacity = p.layer === 0 ? 0.45 : p.layer === 1 ? 0.75 : 0.85;
        const alpha = Math.min(1, p.opacity * layerOpacity);

        targetCtx.save();
        targetCtx.translate(p.x, p.y);
        // Aerodynamic oscillation rocking
        targetCtx.rotate(Math.sin(p.wobble));

        if (isDark) {
          // ── NIGHT SCENARIO ──
          drawPolygonPath(targetCtx, p);
          if (isForeground) {
            targetCtx.fillStyle = `rgba(220, 240, 255, ${alpha * 0.78})`;
          } else {
            targetCtx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.95})`;
          }
          targetCtx.fill();
        } else {
          // ── DAYLIGHT SCENARIO (HIGH VISIBILITY OVER WHITE CARDS) ──
          if (isForeground) {
            // Foreground / camera flakes on blurred canvas: soft frost bokeh
            drawPolygonPath(targetCtx, p);
            targetCtx.fillStyle = `rgba(225, 240, 255, ${alpha * 0.82})`;
            targetCtx.fill();
          } else if (p.layer === 1 && p.radius > 1.0) {
            // Mid in-focus flakes: Dual-pass optical scattering
            // 1. Soft atmospheric winter ice fringe (provides crisp silhouette on pure white #ffffff)
            targetCtx.save();
            targetCtx.scale(1.22, 1.22);
            drawPolygonPath(targetCtx, p);
            targetCtx.fillStyle = `rgba(125, 155, 195, ${alpha * 0.62})`;
            targetCtx.fill();
            targetCtx.restore();

            // 2. High-brightness pure snow body
            drawPolygonPath(targetCtx, p);
            targetCtx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.98})`;
            targetCtx.fill();
          } else {
            // Layer 0 distant atmospheric ice dust
            drawPolygonPath(targetCtx, p);
            targetCtx.fillStyle = `rgba(135, 165, 205, ${alpha * 0.75})`;
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
      if (fgCtx) fgCtx.clearRect(0, 0, width, height);
    };

    const updateState = () => {
      const active = isSnowActive();
      if (active) {
        if (bgCanvas) bgCanvas.style.opacity = '1';
        if (fgCanvas) fgCanvas.style.opacity = '1';
        startLoop();
      } else {
        if (bgCanvas) bgCanvas.style.opacity = '0';
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
