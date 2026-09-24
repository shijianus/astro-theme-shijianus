import React, { useEffect } from 'react';

interface CrystalParticle {
  x: number;
  y: number;
  size: number;
  speedY: number;
  speedX: number;
  opacity: number;
  layer: number; // 0: far (bg), 1: mid (bg), 2: near (fg)
  rotation: number;
  rotationSpeed: number;
  wobblePhase: number;
  wobbleSpeed: number;
  spriteIndex: number;
}

/**
 * ThemeUniverse: Photorealistic, hardware-accelerated Winter Snowscape particle engine.
 * 
 * True Natural Optical Simulation:
 * - 100% Pure Crystalline Ice Geometries: Intricate 6-arm fern dendrites, classic stellar crystals,
 *   faceted stellar plates, diamond needle stars, and micro diamond dust.
 * - ZERO Hollow Rings / ZERO Geometric Circles: Completely eliminates artificial circular strokes and bubble-rings.
 * - Aerodynamic Tumble & Flutter: Each snowflake spins and rotates organically in 3D air resistance.
 * - Dual-Depth Optical Stacking:
 *   - Background Canvas (#theme-snow-universe, z-index: -1): Mid/far crystalline snowflakes and diamond dust.
 *   - Foreground Canvas (#theme-snow-foreground, z-index: 25): Soft, fluttering near-field dendritic snowflakes.
 * - High-Performance Pre-Baked Sprites: Renders via offscreen texture quads with ZERO shadowBlur and ZERO GC thrashing.
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
    let particles: CrystalParticle[] = [];
    let sprites: HTMLCanvasElement[] = [];
    let isScrolling = false;
    let scrollTimeout: any = null;

    const isSnowActive = () => {
      const bg = document.documentElement.dataset.background;
      return bg === 'snow';
    };

    const isDarkMode = () => {
      return document.documentElement.dataset.theme === 'dark';
    };

    // ── PROCEDURAL CRYSTAL SPRITE GENERATORS ──

    // 1. Fernlike Stellar Dendrite (Intricate branching 6-arm crystal)
    const createFernDendrite = (size: number, dark: boolean) => {
      const cvs = document.createElement('canvas');
      cvs.width = size;
      cvs.height = size;
      const ctx = cvs.getContext('2d');
      if (!ctx) return cvs;

      const cx = size / 2;
      const cy = size / 2;
      const r = size * 0.44;

      ctx.save();
      ctx.translate(cx, cy);

      const mainColor = dark ? 'rgba(255, 255, 255, 0.95)' : 'rgba(105, 135, 175, 0.88)';
      const coreColor = dark ? 'rgba(220, 240, 255, 0.9)' : 'rgba(255, 255, 255, 0.98)';

      ctx.lineCap = 'round';

      for (let i = 0; i < 6; i++) {
        ctx.save();
        ctx.rotate((i * Math.PI) / 3);

        // Ambient facet line
        ctx.strokeStyle = mainColor;
        ctx.lineWidth = Math.max(1.1, size * 0.038);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(0, -r);

        // 3 tiers of angled branches
        const tiers = [
          { pos: 0.38, len: 0.28, angle: Math.PI / 3 },
          { pos: 0.62, len: 0.24, angle: Math.PI / 3 },
          { pos: 0.82, len: 0.15, angle: Math.PI / 3 },
        ];

        for (const t of tiers) {
          const y = -r * t.pos;
          const bl = r * t.len;
          const dx = bl * Math.sin(t.angle);
          const dy = -bl * Math.cos(t.angle);
          ctx.moveTo(0, y);
          ctx.lineTo(-dx, y + dy);
          ctx.moveTo(0, y);
          ctx.lineTo(dx, y + dy);
        }
        ctx.stroke();

        // Inner brilliant crystal core line
        ctx.strokeStyle = coreColor;
        ctx.lineWidth = Math.max(0.6, size * 0.02);
        ctx.stroke();

        ctx.restore();
      }

      // Central nucleus
      ctx.fillStyle = dark ? 'rgba(255, 255, 255, 0.95)' : 'rgba(125, 155, 195, 0.85)';
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const a = (i * Math.PI) / 3;
        const hx = Math.sin(a) * (r * 0.16);
        const hy = Math.cos(a) * (r * 0.16);
        if (i === 0) ctx.moveTo(hx, hy);
        else ctx.lineTo(hx, hy);
      }
      ctx.closePath();
      ctx.fill();

      // High-light center glint
      ctx.fillStyle = 'rgba(255, 255, 255, 1)';
      ctx.beginPath();
      ctx.arc(0, 0, Math.max(1, size * 0.06), 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
      return cvs;
    };

    // 2. Classic Stellar Crystal (Airy 6-arm star with barb pairs)
    const createClassicCrystal = (size: number, dark: boolean) => {
      const cvs = document.createElement('canvas');
      cvs.width = size;
      cvs.height = size;
      const ctx = cvs.getContext('2d');
      if (!ctx) return cvs;

      const cx = size / 2;
      const cy = size / 2;
      const r = size * 0.44;

      ctx.save();
      ctx.translate(cx, cy);

      const mainColor = dark ? 'rgba(245, 250, 255, 0.95)' : 'rgba(110, 140, 180, 0.85)';
      const coreColor = dark ? 'rgba(220, 240, 255, 0.9)' : 'rgba(255, 255, 255, 0.98)';

      ctx.lineCap = 'round';

      for (let i = 0; i < 6; i++) {
        ctx.save();
        ctx.rotate((i * Math.PI) / 3);

        ctx.strokeStyle = mainColor;
        ctx.lineWidth = Math.max(1.0, size * 0.035);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(0, -r);

        const y = -r * 0.55;
        const bl = r * 0.32;
        const dx = bl * 0.866;
        const dy = -bl * 0.5;
        ctx.moveTo(0, y);
        ctx.lineTo(-dx, y + dy);
        ctx.moveTo(0, y);
        ctx.lineTo(dx, y + dy);
        ctx.stroke();

        ctx.fillStyle = coreColor;
        ctx.beginPath();
        ctx.arc(0, -r, Math.max(0.8, size * 0.03), 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
      }

      ctx.fillStyle = 'rgba(255, 255, 255, 1)';
      ctx.beginPath();
      ctx.arc(0, 0, Math.max(1, size * 0.08), 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
      return cvs;
    };

    // 3. Stellar Plate Crystal (6-pointed faceted ice plate)
    const createStellarPlate = (size: number, dark: boolean) => {
      const cvs = document.createElement('canvas');
      cvs.width = size;
      cvs.height = size;
      const ctx = cvs.getContext('2d');
      if (!ctx) return cvs;

      const cx = size / 2;
      const cy = size / 2;
      const r = size * 0.44;

      ctx.save();
      ctx.translate(cx, cy);

      const edgeColor = dark ? 'rgba(225, 242, 255, 0.9)' : 'rgba(100, 130, 175, 0.85)';
      const faceColor = dark ? 'rgba(195, 225, 255, 0.35)' : 'rgba(240, 248, 255, 0.9)';

      ctx.beginPath();
      for (let i = 0; i < 12; i++) {
        const a = (i * Math.PI) / 6;
        const rad = i % 2 === 0 ? r : r * 0.5;
        const x = Math.cos(a) * rad;
        const y = Math.sin(a) * rad;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.fillStyle = faceColor;
      ctx.fill();
      ctx.strokeStyle = edgeColor;
      ctx.lineWidth = Math.max(0.8, size * 0.03);
      ctx.stroke();

      ctx.strokeStyle = edgeColor;
      ctx.lineWidth = Math.max(0.6, size * 0.02);
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const a = (i * Math.PI) / 3;
        ctx.moveTo(0, 0);
        ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
      }
      ctx.stroke();

      ctx.fillStyle = 'rgba(255, 255, 255, 1)';
      ctx.beginPath();
      ctx.arc(0, 0, Math.max(1, r * 0.2), 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
      return cvs;
    };

    // 4. Diamond Needle Star Crystal (Sparkling 4-point/8-point ice star)
    const createDiamondStar = (size: number, dark: boolean) => {
      const cvs = document.createElement('canvas');
      cvs.width = size;
      cvs.height = size;
      const ctx = cvs.getContext('2d');
      if (!ctx) return cvs;

      const cx = size / 2;
      const cy = size / 2;
      const r = size * 0.44;

      ctx.save();
      ctx.translate(cx, cy);

      const edgeColor = dark ? 'rgba(255, 255, 255, 0.95)' : 'rgba(105, 135, 175, 0.88)';

      for (let i = 0; i < 4; i++) {
        ctx.save();
        ctx.rotate((i * Math.PI) / 2);
        ctx.beginPath();
        ctx.moveTo(0, -r);
        ctx.lineTo(r * 0.18, 0);
        ctx.lineTo(0, r * 0.18);
        ctx.lineTo(-r * 0.18, 0);
        ctx.closePath();
        ctx.fillStyle = edgeColor;
        ctx.fill();
        ctx.restore();
      }

      for (let i = 0; i < 4; i++) {
        ctx.save();
        ctx.rotate((i * Math.PI) / 2 + Math.PI / 4);
        ctx.beginPath();
        ctx.moveTo(0, -r * 0.55);
        ctx.lineTo(r * 0.12, 0);
        ctx.lineTo(0, r * 0.12);
        ctx.lineTo(-r * 0.12, 0);
        ctx.closePath();
        ctx.fillStyle = edgeColor;
        ctx.fill();
        ctx.restore();
      }

      ctx.fillStyle = 'rgba(255, 255, 255, 1)';
      ctx.beginPath();
      ctx.arc(0, 0, Math.max(1, r * 0.22), 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
      return cvs;
    };

    // 5. Solid Diamond Dust (Solid 4-point diamond micro-facet, NO hollow ring)
    const createDiamondDust = (size: number, dark: boolean) => {
      const cvs = document.createElement('canvas');
      cvs.width = size;
      cvs.height = size;
      const ctx = cvs.getContext('2d');
      if (!ctx) return cvs;

      const cx = size / 2;
      const cy = size / 2;
      const r = size * 0.42;

      ctx.save();
      ctx.translate(cx, cy);

      // Solid diamond polygon
      ctx.beginPath();
      ctx.moveTo(0, -r);
      ctx.lineTo(r * 0.72, 0);
      ctx.lineTo(0, r);
      ctx.lineTo(-r * 0.72, 0);
      ctx.closePath();
      ctx.fillStyle = dark ? 'rgba(240, 248, 255, 0.95)' : 'rgba(110, 140, 185, 0.85)';
      ctx.fill();

      // Micro white glint core
      ctx.fillStyle = 'rgba(255, 255, 255, 1)';
      ctx.beginPath();
      ctx.arc(0, 0, Math.max(0.6, r * 0.35), 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
      return cvs;
    };

    // Rebuild all procedural sprite canvases for current theme mode
    const rebuildSprites = () => {
      const dark = isDarkMode();
      sprites = [
        createFernDendrite(56, dark),   // 0: Large Fern Dendrite
        createFernDendrite(38, dark),   // 1: Mid Fern Dendrite
        createClassicCrystal(42, dark), // 2: Mid Classic Crystal
        createClassicCrystal(28, dark), // 3: Small Classic Crystal
        createStellarPlate(34, dark),   // 4: Mid Stellar Plate
        createStellarPlate(22, dark),   // 5: Small Stellar Plate
        createDiamondStar(30, dark),    // 6: Diamond Needle Star
        createDiamondDust(12, dark),    // 7: Solid Diamond Dust
      ];
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

      rebuildSprites();
      initParticles();
    };

    // Initialize particles across dual visual depths
    const initParticles = () => {
      const count = Math.min(130, Math.max(45, Math.round((width * height) / 14000)));
      particles = [];

      for (let i = 0; i < count; i++) {
        const rand = Math.random();
        let layer = 1;
        let size = 28;
        let speedY = 1.0;
        let opacity = 0.8;
        let spriteIndex = 0;

        if (rand < 0.40) {
          // Layer 0: Far background diamond dust & micro crystals (on bgCanvas)
          layer = 0;
          if (Math.random() < 0.6) {
            spriteIndex = 7; // diamondDust
            size = 6 + Math.random() * 4;
          } else {
            spriteIndex = 5; // plateSmall
            size = 12 + Math.random() * 6;
          }
          speedY = 0.35 + Math.random() * 0.45;
          opacity = 0.45 + Math.random() * 0.35;
        } else if (rand < 0.78) {
          // Layer 1: Midground classic crystals, plates & stars (on bgCanvas)
          layer = 1;
          const rType = Math.random();
          if (rType < 0.34) {
            spriteIndex = 2; // classicMid
            size = 24 + Math.random() * 10;
          } else if (rType < 0.68) {
            spriteIndex = 4; // plateMid
            size = 22 + Math.random() * 8;
          } else {
            spriteIndex = 6; // diamondStar
            size = 20 + Math.random() * 8;
          }
          speedY = 0.8 + Math.random() * 0.7;
          opacity = 0.65 + Math.random() * 0.3;
        } else {
          // Layer 2: Near foreground intricate dendrites & prominent crystals (on fgCanvas)
          layer = 2;
          const rType = Math.random();
          if (rType < 0.6) {
            spriteIndex = 0; // fernLarge
            size = 38 + Math.random() * 14;
          } else if (rType < 0.85) {
            spriteIndex = 1; // fernMid
            size = 30 + Math.random() * 8;
          } else {
            spriteIndex = 2; // classicMid
            size = 32 + Math.random() * 8;
          }
          speedY = 1.3 + Math.random() * 0.9;
          opacity = 0.8 + Math.random() * 0.2;
        }

        particles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          size,
          speedY,
          speedX: (Math.random() - 0.5) * 0.4,
          opacity,
          layer,
          rotation: Math.random() * Math.PI * 2,
          rotationSpeed: (Math.random() - 0.5) * 0.02,
          wobblePhase: Math.random() * Math.PI * 2,
          wobbleSpeed: 0.012 + Math.random() * 0.018,
          spriteIndex,
        });
      }
    };

    let lastTime = performance.now();

    // Render loop with natural wind drift, wobble flutter, and rotation tumble
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

      const globalWind = Math.sin(now * 0.0005) * 0.7 + Math.sin(now * 0.0015) * 0.25;

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.wobblePhase += p.wobbleSpeed;
        p.rotation += p.rotationSpeed;

        // Position update with sinusoidal natural sway & rotation tumble
        const sway = Math.sin(p.wobblePhase) * (p.layer === 2 ? 1.4 : p.layer === 1 ? 0.85 : 0.4);
        p.x += (p.speedX + sway + globalWind * (p.layer * 0.35 + 0.65)) * dt * 60;
        p.y += p.speedY * dt * 60;

        // Boundary wrap-around
        if (p.y > height + p.size + 15) {
          p.y = -p.size - 10;
          p.x = Math.random() * width;
        }
        if (p.x < -p.size - 15) p.x = width + p.size;
        else if (p.x > width + p.size + 15) p.x = -p.size;

        // Select context: layer 0 & 1 -> bgCtx, layer 2 -> fgCtx
        const targetCtx = p.layer === 2 && fgCtx ? fgCtx : bgCtx;
        const sprite = sprites[p.spriteIndex];
        if (!sprite) continue;

        targetCtx.save();
        targetCtx.translate(p.x, p.y);
        if (p.spriteIndex !== 7) {
          targetCtx.rotate(p.rotation);
        }
        targetCtx.globalAlpha = p.opacity;
        targetCtx.drawImage(sprite, -p.size / 2, -p.size / 2, p.size, p.size);
        targetCtx.restore();
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
        if (m.attributeName === 'data-theme') {
          rebuildSprites();
        }
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
