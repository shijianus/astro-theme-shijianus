import React, { useEffect } from 'react';

interface Particle {
  x: number;
  y: number;
  radius: number;
  speedY: number;
  speedX: number;
  opacity: number;
  layer: number; // 0: far (bg), 1: mid (bg), 2: near (fg)
  phase: number;
  phaseSpeed: number;
}

/**
 * ThemeUniverse: Ultra-smooth, hardware-accelerated Winter Snowscape particle engine.
 * Renders atmospheric falling snow across a dual-depth visual stack:
 * - Background Canvas (#theme-snow-universe, z-index: -1): Far ice-dust and mid-field crisp snowflakes
 * - Foreground Canvas (#theme-snow-foreground, z-index: 25): Soft crystalline puffs drifting in front of cards
 * 
 * Optical & Performance Features:
 * - Daylight High Contrast: Dual-layer ice-crystal refraction edge + pure white core (visible against both white cards and sky)
 * - Zero shadowBlur: Eliminates all CPU/GPU Gaussian blur convolution lag, locking 60FPS
 * - Anti-stutter scroll-throttling: Skips unnecessary calculations during active scrolling
 * - Page Visibility API: Pauses loop when tab is backgrounded
 * - Clean Mode Suppression: 100% opacity 0 and RAF stopped when switched to clean mode
 * - 0 DOM interference: pointer-events: none, completely non-blocking
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
    let particles: Particle[] = [];
    let isScrolling = false;
    let scrollTimeout: any = null;

    // Check if snow mode is active
    const isSnowActive = () => {
      const bg = document.documentElement.dataset.background;
      return bg === 'snow';
    };

    const isDarkMode = () => {
      return document.documentElement.dataset.theme === 'dark';
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

    // Initialize 3-layer particles (40% far bg, 45% mid bg, 15% near fg)
    const initParticles = () => {
      // Density based on viewport area: approx 80-120 particles on standard desktop
      const count = Math.min(150, Math.max(45, Math.round((width * height) / 13000)));
      particles = [];

      for (let i = 0; i < count; i++) {
        const rand = Math.random();
        let layer = 1;
        let radius = 2.0;
        let speedY = 1.2;
        let opacity = 0.7;

        if (rand < 0.40) {
          layer = 0; // far background ice dust
          radius = 0.8 + Math.random() * 0.9;
          speedY = 0.4 + Math.random() * 0.5;
          opacity = 0.4 + Math.random() * 0.4;
        } else if (rand < 0.85) {
          layer = 1; // mid background crisp flakes
          radius = 1.8 + Math.random() * 1.3;
          speedY = 1.0 + Math.random() * 0.9;
          opacity = 0.6 + Math.random() * 0.35;
        } else {
          layer = 2; // near foreground gentle floating puffs
          radius = 3.2 + Math.random() * 2.2;
          speedY = 1.6 + Math.random() * 1.2;
          opacity = 0.75 + Math.random() * 0.25;
        }

        particles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          radius,
          speedY,
          speedX: (Math.random() - 0.5) * 0.45,
          opacity,
          layer,
          phase: Math.random() * Math.PI * 2,
          phaseSpeed: 0.01 + Math.random() * 0.02,
        });
      }
    };

    let lastTime = performance.now();

    // Render loop with sinusoidal wind drift and delta timing
    const render = (now: number) => {
      if (!isRunning) return;

      const dt = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      // If scrolling, throttle to skip heavy redraw and preserve 60FPS
      if (isScrolling && Math.random() > 0.5) {
        animId = requestAnimationFrame(render);
        return;
      }

      bgCtx.clearRect(0, 0, width, height);
      if (fgCtx) fgCtx.clearRect(0, 0, width, height);

      const dark = isDarkMode();
      const globalWind = Math.sin(now * 0.0006) * 0.8 + Math.sin(now * 0.0018) * 0.3;

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.phase += p.phaseSpeed;

        // Position update with sinusoidal natural sway
        const sway = Math.sin(p.phase) * (p.layer === 2 ? 1.5 : p.layer === 1 ? 0.9 : 0.45);
        p.x += (p.speedX + sway + globalWind * (p.layer * 0.35 + 0.65)) * dt * 60;
        p.y += p.speedY * dt * 60;

        // Boundary wrap-around
        if (p.y > height + p.radius + 12) {
          p.y = -p.radius - 6;
          p.x = Math.random() * width;
        }
        if (p.x < -p.radius - 12) p.x = width + p.radius;
        else if (p.x > width + p.radius + 12) p.x = -p.radius;

        // ── RENDER ACCORDING TO LAYER ──
        if (p.layer === 0) {
          // Far layer: Atmospheric ice dust (on bgCanvas)
          bgCtx.beginPath();
          bgCtx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
          if (dark) {
            bgCtx.fillStyle = `rgba(175, 210, 255, ${p.opacity * 0.55})`;
          } else {
            bgCtx.fillStyle = `rgba(130, 168, 220, ${p.opacity * 0.72})`;
          }
          bgCtx.fill();
        } else if (p.layer === 1) {
          // Mid layer: Crisp snowflakes (on bgCanvas)
          // 1. Ice refraction rim for crisp contrast
          bgCtx.beginPath();
          bgCtx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
          if (dark) {
            bgCtx.fillStyle = `rgba(140, 195, 255, ${p.opacity * 0.45})`;
          } else {
            bgCtx.fillStyle = `rgba(120, 162, 215, ${p.opacity * 0.62})`;
          }
          bgCtx.fill();

          // 2. Pure crystalline snow core
          bgCtx.beginPath();
          bgCtx.arc(p.x, p.y, p.radius * 0.72, 0, Math.PI * 2);
          if (dark) {
            bgCtx.fillStyle = `rgba(230, 245, 255, ${p.opacity * 0.92})`;
          } else {
            bgCtx.fillStyle = `rgba(255, 255, 255, ${p.opacity * 0.98})`;
          }
          bgCtx.fill();
        } else if (fgCtx) {
          // Near layer: Soft foreground snow puffs floating over cards (on fgCanvas)
          // 1. Outer subtle ice refraction halo
          fgCtx.beginPath();
          fgCtx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
          if (dark) {
            fgCtx.fillStyle = `rgba(150, 205, 255, ${p.opacity * 0.4})`;
          } else {
            fgCtx.fillStyle = `rgba(115, 155, 210, ${p.opacity * 0.55})`;
          }
          fgCtx.fill();

          // 2. Middle soft snow mantle
          fgCtx.beginPath();
          fgCtx.arc(p.x, p.y, p.radius * 0.74, 0, Math.PI * 2);
          if (dark) {
            fgCtx.fillStyle = `rgba(215, 238, 255, ${p.opacity * 0.88})`;
          } else {
            fgCtx.fillStyle = `rgba(238, 246, 255, ${p.opacity * 0.92})`;
          }
          fgCtx.fill();

          // 3. Inner crystal core
          fgCtx.beginPath();
          fgCtx.arc(p.x, p.y, p.radius * 0.42, 0, Math.PI * 2);
          fgCtx.fillStyle = `rgba(255, 255, 255, ${p.opacity * 0.98})`;
          fgCtx.fill();
        }
      }

      animId = requestAnimationFrame(render);
    };

    const startLoop = () => {
      if (isRunning) return;
      isRunning = true;
      lastTime = performance.now();
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

    // Scroll-pause listener to keep frame rates locked at 60FPS
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
