import React, { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  radius: number;
  speedY: number;
  speedX: number;
  opacity: number;
  layer: number; // 0: far, 1: mid, 2: near
  phase: number;
  phaseSpeed: number;
}

/**
 * ThemeUniverse: Ultra-smooth, hardware-accelerated Winter Snowscape particle engine.
 * Renders an atmospheric falling snow canvas strictly behind content (z-index: -1).
 * Features:
 * - 3-depth particle simulation (micro-dust, classic flake, near-field snow puffs)
 * - Anti-stutter scroll-throttling: reduces RAF updates during active scrolling
 * - Page Visibility API integration: pauses loop when tab is backgrounded
 * - 0 DOM interference: pointer-events: none, completely non-blocking
 */
export function ThemeUniverse() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

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
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      initParticles();
    };

    // Initialize 3-layer particles
    const initParticles = () => {
      // Density based on viewport area (approx 75 particles per 1000px width on desktop)
      const count = Math.min(160, Math.max(45, Math.round((width * height) / 14000)));
      particles = [];

      for (let i = 0; i < count; i++) {
        // Distribute layers: 45% far, 40% mid, 15% near
        const rand = Math.random();
        let layer = 1;
        let radius = 2.0;
        let speedY = 1.2;
        let opacity = 0.7;

        if (rand < 0.45) {
          layer = 0; // far
          radius = 0.8 + Math.random() * 0.8;
          speedY = 0.4 + Math.random() * 0.6;
          opacity = 0.25 + Math.random() * 0.35;
        } else if (rand < 0.85) {
          layer = 1; // mid
          radius = 1.8 + Math.random() * 1.2;
          speedY = 1.0 + Math.random() * 1.0;
          opacity = 0.55 + Math.random() * 0.35;
        } else {
          layer = 2; // near
          radius = 3.2 + Math.random() * 2.2;
          speedY = 2.0 + Math.random() * 1.6;
          opacity = 0.75 + Math.random() * 0.25;
        }

        particles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          radius,
          speedY,
          speedX: (Math.random() - 0.5) * 0.4,
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

      // If scrolling, skip heavy redraw every second frame to guarantee 60FPS interaction
      if (isScrolling && Math.random() > 0.5) {
        animId = requestAnimationFrame(render);
        return;
      }

      ctx.clearRect(0, 0, width, height);

      const dark = isDarkMode();
      const globalWind = Math.sin(now * 0.0006) * 0.8 + Math.sin(now * 0.0018) * 0.3;

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.phase += p.phaseSpeed;

        // Position update
        const sway = Math.sin(p.phase) * (p.layer === 2 ? 1.4 : p.layer === 1 ? 0.8 : 0.4);
        p.x += (p.speedX + sway + globalWind * (p.layer * 0.4 + 0.6)) * dt * 60;
        p.y += p.speedY * dt * 60;

        // Boundary wrap-around
        if (p.y > height + p.radius + 10) {
          p.y = -p.radius - 5;
          p.x = Math.random() * width;
        }
        if (p.x < -p.radius - 10) p.x = width + p.radius;
        else if (p.x > width + p.radius + 10) p.x = -p.radius;

        // Render particle
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);

        if (dark) {
          // Night: Moonlit crystal glow
          if (p.layer === 2) {
            ctx.fillStyle = `rgba(220, 240, 255, ${p.opacity * 0.9})`;
            ctx.shadowColor = 'rgba(180, 220, 255, 0.5)';
            ctx.shadowBlur = 4;
          } else {
            ctx.fillStyle = `rgba(200, 225, 255, ${p.opacity * 0.8})`;
            ctx.shadowBlur = 0;
          }
        } else {
          // Day: Pure crisp snowfall with slight cool ice-blue tint
          if (p.layer === 2) {
            ctx.fillStyle = `rgba(255, 255, 255, ${p.opacity * 0.95})`;
            ctx.shadowColor = 'rgba(140, 175, 225, 0.3)';
            ctx.shadowBlur = 3;
          } else if (p.layer === 1) {
            ctx.fillStyle = `rgba(240, 246, 255, ${p.opacity * 0.85})`;
            ctx.shadowBlur = 0;
          } else {
            ctx.fillStyle = `rgba(215, 230, 255, ${p.opacity * 0.6})`;
            ctx.shadowBlur = 0;
          }
        }

        ctx.fill();
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
      if (ctx) ctx.clearRect(0, 0, width, height);
    };

    const updateState = () => {
      const active = isSnowActive();
      if (active) {
        canvas.style.opacity = '1';
        startLoop();
      } else {
        canvas.style.opacity = '0';
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

  return (
    <canvas
      ref={canvasRef}
      id="theme-snow-universe"
      className="theme-snow-universe"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: -1,
        transition: 'opacity 0.4s ease',
        opacity: 0,
      }}
      aria-hidden="true"
    />
  );
}

export default ThemeUniverse;
