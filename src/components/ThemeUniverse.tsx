import React, { useEffect, useRef } from 'react';

interface BackgroundParticle {
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

interface SnowSurface {
  id: string;
  type: 'notice' | 'banner' | 'category' | 'today' | 'post' | 'profile' | 'aside' | 'pagination';
  docX: number;
  docY: number;
  width: number;
  height: number;
  radius: number;
  seed: number;
  accumulatedSnow: number; // 1.0 baseline, pulses on impact
  lastShedTime: number;
  el: HTMLElement;
}

interface FallingClump {
  x: number;
  y: number;
  vx: number;
  vy: number;
  ay: number;
  radius: number;
  rotation: number;
  vRot: number;
  alpha: number;
  sourceId: string;
}

interface SplatterParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  alpha: number;
  life: number;
  maxLife: number;
}

/**
 * ThemeUniverse: Autonomous Physics Snowscape Engine.
 * 
 * Key Architectural Principles:
 * 1. 100% Zero In-Card Code Pollution: Cards stay pure, standard UI components.
 * 2. Over-the-Border & Corner-Wrapping Geometry: Renders continuous snowcaps that gently drape
 *    over card rounded corners (rounded-xl) and outer borders on the foreground canvas (z-index: 35),
 *    completely breaking free of any card's `overflow: hidden` trap.
 * 3. Top vs. Bottom Heterogeneity:
 *    - Top Surface: Soft piled snow mantle with organic wave crests.
 *    - Bottom Lip: Delicate frost rim with downward crystal icicles.
 * 4. Distinct Surface Boundaries: Each card matrix (notice, banner, category buttons, post stream,
 *    pagination) retains its own sharp, distinct physical accumulation boundary.
 * 5. Dynamic Cascading Gravity Physics:
 *    - Snow clumps periodically or interactively slide off card edges with gravitational acceleration (ay).
 *    - Descending clumps collide with lower surfaces (e.g. from post card onto .home-pagination).
 *    - Secondary impact triggers outward splatter puffs and accumulation ripples!
 * 6. Dual-Plane Visual Stacking:
 *    - Background Canvas (z-index: -1): Serene 3-depth falling snow in the sky.
 *    - Foreground Canvas (z-index: 35, pointer-events: none): Physical snowcaps, icicles, sliding clumps, splatters.
 */
export function ThemeUniverse() {
  const bgCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const fgCanvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const bgCanvas = bgCanvasRef.current;
    const fgCanvas = fgCanvasRef.current;
    if (!bgCanvas || !fgCanvas) return;

    const bgCtx = bgCanvas.getContext('2d', { alpha: true });
    const fgCtx = fgCanvas.getContext('2d', { alpha: true });
    if (!bgCtx || !fgCtx) return;

    let animId: number = 0;
    let isRunning = false;
    let width = 0;
    let height = 0;
    let dpr = 1;
    let isScrolling = false;
    let scrollTimeout: any = null;

    let bgParticles: BackgroundParticle[] = [];
    let surfaces: SnowSurface[] = [];
    let fallingClumps: FallingClump[] = [];
    let splatters: SplatterParticle[] = [];
    let lastClumpShedCheck = performance.now();

    const isSnowActive = () => document.documentElement.dataset.background === 'snow';
    const isDarkMode = () => document.documentElement.dataset.theme === 'dark';

    // ── 1. SURFACE DETECTION & DOCUMENT COORDINATE REGISTRATION ──
    const scanSurfaces = () => {
      const selectors = [
        { sel: '.home-top-notice', type: 'notice' as const, radius: 8 },
        { sel: '#bannerGroup #random-banner', type: 'banner' as const, radius: 12 },
        { sel: '#bannerGroup .categoryItem .categoryButton', type: 'category' as const, radius: 8 },
        { sel: '.todayCard', type: 'today' as const, radius: 16 },
        { sel: '.recent-post-item', type: 'post' as const, radius: 12 },
        { sel: '.card-info.profile-card', type: 'profile' as const, radius: 12 },
        { sel: '#aside-content .card-widget', type: 'aside' as const, radius: 8 },
        { sel: '#home-pagination, .home-pagination', type: 'pagination' as const, radius: 10 },
        { sel: '#pagination.pagination-post', type: 'pagination' as const, radius: 10 },
      ];

      const newSurfaces: SnowSurface[] = [];
      const scrollX = window.scrollX;
      const scrollY = window.scrollY;

      const todayToggle = document.getElementById('today-card-toggle') as HTMLInputElement | null;
      const isTodayToggled = todayToggle ? todayToggle.checked : false;

      // Bind toggle change if present
      if (todayToggle && !todayToggle.dataset.snowBound) {
        todayToggle.dataset.snowBound = 'true';
        todayToggle.addEventListener('change', () => {
          setTimeout(scanSurfaces, 150);
        });
      }

      selectors.forEach(({ sel, type, radius }) => {
        const els = document.querySelectorAll(sel);
        els.forEach((el, idx) => {
          const htmlEl = el as HTMLElement;
          const rect = htmlEl.getBoundingClientRect();
          if (rect.width <= 0 || rect.height <= 0) return;

          // Resolve todayCard vs topGroup posts mutual exclusion
          const inTopGroup = !!htmlEl.closest('.topGroup');
          if (inTopGroup) {
            if (type === 'today' && isTodayToggled) return; // todayCard is currently hidden
            if (type === 'post' && !isTodayToggled) return; // topGroup posts are covered by todayCard
          }

          const cs = window.getComputedStyle(htmlEl);
          if (cs.display === 'none' || cs.visibility === 'hidden' || cs.opacity === '0') return;

          const docX = rect.left + scrollX;
          const docY = rect.top + scrollY;
          const id = `${type}-${idx}-${Math.round(docX)}-${Math.round(docY)}`;

          // Generate stable pseudo-random seed from coordinates and index
          const seed = (Math.sin(docX * 0.05 + docY * 0.08 + idx * 7.1) * 10000) % 100;

          // Retain accumulated snow if already registered
          const existing = surfaces.find((s) => s.id === id);
          const accumulatedSnow = existing ? existing.accumulatedSnow : 1.0;

          // Interactive Hover Trigger: hover shedding
          if (!htmlEl.dataset.snowInteractive) {
            htmlEl.dataset.snowInteractive = 'true';
            htmlEl.addEventListener('pointerenter', () => {
              if (!isSnowActive()) return;
              triggerSurfaceShed(id, 2);
            }, { passive: true });
          }

          newSurfaces.push({
            id,
            type,
            docX,
            docY,
            width: rect.width,
            height: rect.height,
            radius,
            seed: Math.abs(seed),
            accumulatedSnow,
            lastShedTime: performance.now() + Math.random() * 3000,
            el: htmlEl,
          });
        });
      });

      surfaces = newSurfaces;
    };

    // ── 2. SHEDDING SNOW CLUMP TRIGGER ──
    const triggerSurfaceShed = (surfaceId: string, count: number = 1) => {
      const surface = surfaces.find((s) => s.id === surfaceId);
      if (!surface) return;

      const vx = surface.docX - window.scrollX;
      const vy = surface.docY - window.scrollY;

      // Don't shed if offscreen
      if (vy < -50 || vy > height + 50 || vx < -surface.width || vx > width) return;

      for (let i = 0; i < count; i++) {
        // Shed from left corner, center dip, or right corner
        const cornerPick = Math.random();
        let spawnX = vx + 6;
        let initVx = -0.4 - Math.random() * 0.4;
        if (cornerPick > 0.65) {
          spawnX = vx + surface.width - 6;
          initVx = 0.4 + Math.random() * 0.4;
        } else if (cornerPick > 0.35) {
          spawnX = vx + surface.width * (0.3 + Math.random() * 0.4);
          initVx = (Math.random() - 0.5) * 0.5;
        }

        fallingClumps.push({
          x: spawnX,
          y: vy + 2,
          vx: initVx,
          vy: 0.3 + Math.random() * 0.4,
          ay: 0.32 + Math.random() * 0.08, // gravity
          radius: 2.8 + Math.random() * 1.8,
          rotation: Math.random() * Math.PI * 2,
          vRot: (Math.random() - 0.5) * 0.15,
          alpha: 1.0,
          sourceId: surface.id,
        });
      }
    };

    // ── 3. RESIZE AND BUFFER CALIBRATION ──
    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;

      // Background Canvas
      bgCanvas.width = Math.round(width * dpr);
      bgCanvas.height = Math.round(height * dpr);
      bgCanvas.style.width = `${width}px`;
      bgCanvas.style.height = `${height}px`;
      bgCtx.setTransform(dpr, 0, 0, dpr, 0, 0);

      // Foreground Physics Canvas
      fgCanvas.width = Math.round(width * dpr);
      fgCanvas.height = Math.round(height * dpr);
      fgCanvas.style.width = `${width}px`;
      fgCanvas.style.height = `${height}px`;
      fgCtx.setTransform(dpr, 0, 0, dpr, 0, 0);

      initBackgroundParticles();
      scanSurfaces();
    };

    // ── 4. BACKGROUND SERENE 3-DEPTH SNOWFALL ──
    const initBackgroundParticles = () => {
      const count = Math.min(140, Math.max(45, Math.round((width * height) / 14000)));
      bgParticles = [];

      for (let i = 0; i < count; i++) {
        const rand = Math.random();
        let layer = 1;
        let radius = 1.8;
        let speedY = 1.1;
        let opacity = 0.65;

        if (rand < 0.45) {
          layer = 0; // far micro-dust
          radius = 0.7 + Math.random() * 0.6;
          speedY = 0.4 + Math.random() * 0.4;
          opacity = 0.25 + Math.random() * 0.25;
        } else if (rand < 0.85) {
          layer = 1; // mid snowflakes
          radius = 1.5 + Math.random() * 0.9;
          speedY = 0.85 + Math.random() * 0.7;
          opacity = 0.45 + Math.random() * 0.3;
        } else {
          layer = 2; // near gentle flakes
          radius = 2.6 + Math.random() * 1.6;
          speedY = 1.7 + Math.random() * 1.3;
          opacity = 0.65 + Math.random() * 0.25;
        }

        bgParticles.push({
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

    // ── 5. MAIN RAF LOOP: FOREGROUND PHYSICS + BACKGROUND PARTICLES ──
    const render = (now: number) => {
      if (!isRunning) return;

      const dt = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      const dark = isDarkMode();
      const scrollX = window.scrollX;
      const scrollY = window.scrollY;

      // ── A. RENDER BACKGROUND SKY PARTICLES ──
      bgCtx.clearRect(0, 0, width, height);
      const globalWind = Math.sin(now * 0.0006) * 0.8 + Math.sin(now * 0.0018) * 0.3;

      for (let i = 0; i < bgParticles.length; i++) {
        const p = bgParticles[i];
        p.phase += p.phaseSpeed;
        const sway = Math.sin(p.phase) * (p.layer === 2 ? 1.3 : p.layer === 1 ? 0.7 : 0.3);
        p.x += (p.speedX + sway + globalWind * (p.layer * 0.35 + 0.65)) * dt * 60;
        p.y += p.speedY * dt * 60;

        if (p.y > height + p.radius + 10) {
          p.y = -p.radius - 5;
          p.x = Math.random() * width;
        }
        if (p.x < -p.radius - 10) p.x = width + p.radius;
        else if (p.x > width + p.radius + 10) p.x = -p.radius;

        bgCtx.beginPath();
        bgCtx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);

        if (dark) {
          bgCtx.fillStyle = `rgba(215, 235, 255, ${p.opacity * 0.85})`;
        } else {
          bgCtx.fillStyle = `rgba(255, 255, 255, ${p.opacity * 0.95})`;
        }
        bgCtx.fill();
      }

      // ── B. RENDER FOREGROUND PHYSICS (SNOWCAPS, ICICLES, CLUMPS, SPLATTERS) ──
      fgCtx.clearRect(0, 0, width, height);

      // Periodic natural shedding check (every 3.0 ~ 4.5s)
      if (now - lastClumpShedCheck > 3500) {
        lastClumpShedCheck = now;
        const eligible = surfaces.filter((s) => {
          const vy = s.docY - scrollY;
          return vy > -30 && vy < height - 120 && (s.type === 'post' || s.type === 'today' || s.type === 'banner');
        });
        if (eligible.length > 0) {
          const picked = eligible[Math.floor(Math.random() * eligible.length)];
          triggerSurfaceShed(picked.id, 1);
        }
      }

      // Draw each Surface Snowcap & Bottom Icicles
      surfaces.forEach((surface) => {
        const vx = surface.docX - scrollX;
        const vy = surface.docY - scrollY;
        const w = surface.width;
        const h = surface.height;
        const r = surface.radius;

        // Frustum culling with safety margin
        if (vy + h < -80 || vy > height + 80 || vx + w < -50 || vx > width + 50) return;

        // Softly relax accumulatedSnow back to 1.0
        if (surface.accumulatedSnow > 1.0) {
          surface.accumulatedSnow = Math.max(1.0, surface.accumulatedSnow - dt * 0.15);
        }

        // Calibrate height by surface type: realistic, comfortable thickness (4.5px ~ 9.5px)
        let baseThickness = 8.5;
        if (surface.type === 'notice') baseThickness = 4.5;
        else if (surface.type === 'category') baseThickness = 4.5;
        else if (surface.type === 'today') baseThickness = 9.5;
        else if (surface.type === 'banner') baseThickness = 9.0;
        else if (surface.type === 'pagination') baseThickness = 5.0;
        else if (surface.type === 'profile') baseThickness = 7.5;
        else if (surface.type === 'aside') baseThickness = 6.0;

        const effectiveT = baseThickness * surface.accumulatedSnow;
        const cornerDrapeY = Math.min(r * 0.65, 8.5);

        // ── TOP SNOWCAP: OVER-THE-BORDER & CORNER WRAPPING ──
        fgCtx.save();
        fgCtx.beginPath();

        // 1. Start slightly outside the card's left border, wrapping over the corner
        const leftWrapX = vx - 2.5;
        const leftWrapY = vy + cornerDrapeY;
        fgCtx.moveTo(leftWrapX, leftWrapY);

        // 2. Left corner upward arc, draping around rounded-xl
        fgCtx.bezierCurveTo(
          vx - 2.8,
          vy - 0.5,
          vx + 0.5,
          vy - effectiveT,
          vx + Math.min(r, 12),
          vy - effectiveT
        );

        // 3. Across top width with continuous natural waves
        const lobeCount = Math.min(8, Math.max(3, Math.round(w / 55)));
        const lobeWidth = (w - Math.min(r, 12) * 2) / lobeCount;
        const startX = vx + Math.min(r, 12);

        for (let s = 1; s <= lobeCount; s++) {
          const curX = startX + lobeWidth * s;
          const prevX = startX + lobeWidth * (s - 1);
          const midX = (prevX + curX) / 2;
          const wave =
            Math.sin(s * 1.7 + surface.seed) * 1.5 +
            Math.cos(s * 2.9 + surface.seed * 1.3) * 0.9;
          const crestY = vy - (effectiveT + wave);
          fgCtx.quadraticCurveTo(midX, crestY, curX, vy - (effectiveT * 0.9 + wave * 0.4));
        }

        // 4. Right corner downward arc, draping around rounded-xl and landing outside
        const rightWrapX = vx + w + 2.5;
        const rightWrapY = vy + cornerDrapeY;
        fgCtx.bezierCurveTo(
          vx + w - 0.5,
          vy - effectiveT,
          vx + w + 2.8,
          vy - 0.5,
          rightWrapX,
          rightWrapY
        );

        // 5. Bottom contact seam adhering onto card face with gentle scallops
        const seamLobes = Math.min(6, Math.max(3, Math.round(w / 70)));
        const seamLobeWidth = w / seamLobes;
        for (let s = seamLobes; s >= 1; s--) {
          const curX = vx + seamLobeWidth * (s - 1);
          const prevX = vx + seamLobeWidth * s;
          const midX = (prevX + curX) / 2;
          const drop = 2.5 + Math.sin(s * 2.2 + surface.seed) * 1.2;
          fgCtx.quadraticCurveTo(midX, vy + drop, curX, vy + 2.5);
        }

        fgCtx.lineTo(leftWrapX, leftWrapY);
        fgCtx.closePath();

        // Snowcap Lighting & Gradient Fill
        const capGrad = fgCtx.createLinearGradient(vx, vy - effectiveT, vx, vy + 4);
        if (dark) {
          capGrad.addColorStop(0, 'rgba(255, 255, 255, 0.98)');
          capGrad.addColorStop(0.5, 'rgba(230, 242, 255, 0.94)');
          capGrad.addColorStop(1, 'rgba(195, 218, 246, 0.88)');
          fgCtx.shadowColor = 'rgba(150, 195, 245, 0.35)';
          fgCtx.shadowBlur = 3;
          fgCtx.shadowOffsetY = 1;
        } else {
          capGrad.addColorStop(0, 'rgba(255, 255, 255, 0.99)');
          capGrad.addColorStop(0.6, 'rgba(244, 248, 255, 0.95)');
          capGrad.addColorStop(1, 'rgba(224, 236, 252, 0.90)');
          fgCtx.shadowColor = 'rgba(50, 80, 140, 0.12)';
          fgCtx.shadowBlur = 3;
          fgCtx.shadowOffsetY = 1;
        }

        fgCtx.fillStyle = capGrad;
        fgCtx.fill();
        fgCtx.restore();

        // ── BOTTOM LIP: FROST RIM & DOWNWARD ICICLES (上下分异) ──
        // Only render icicles on tall content cards, never on buttons/notices/pagination
        const isTallCard = surface.type === 'post' || surface.type === 'today' || surface.type === 'banner' || surface.type === 'profile';
        if (h > 90 && isTallCard) {
          const botY = vy + h;
          fgCtx.save();

          // Subtle bottom frost rim
          fgCtx.beginPath();
          fgCtx.moveTo(vx + 6, botY);
          fgCtx.lineTo(vx + w - 6, botY);
          fgCtx.strokeStyle = dark ? 'rgba(200, 230, 255, 0.35)' : 'rgba(255, 255, 255, 0.55)';
          fgCtx.lineWidth = 1.2;
          fgCtx.stroke();

          // 2 ~ 3 Delicate Crystal Icicles
          const icicleCount = (surface.seed % 3) + 2;
          for (let ic = 0; ic < icicleCount; ic++) {
            const ratio = (ic + 1) / (icicleCount + 1);
            const icicleX = vx + w * ratio + (Math.sin(surface.seed + ic) * 12);
            const icicleLen = 4 + (Math.cos(surface.seed * 2 + ic) * 2 + 2.5); // 4px ~ 8.5px

            fgCtx.beginPath();
            fgCtx.moveTo(icicleX - 2, botY);
            fgCtx.lineTo(icicleX, botY + icicleLen);
            fgCtx.lineTo(icicleX + 2, botY);
            fgCtx.closePath();

            const icicleGrad = fgCtx.createLinearGradient(icicleX, botY, icicleX, botY + icicleLen);
            if (dark) {
              icicleGrad.addColorStop(0, 'rgba(210, 235, 255, 0.75)');
              icicleGrad.addColorStop(1, 'rgba(255, 255, 255, 0.95)');
            } else {
              icicleGrad.addColorStop(0, 'rgba(220, 240, 255, 0.65)');
              icicleGrad.addColorStop(1, 'rgba(255, 255, 255, 0.95)');
            }
            fgCtx.fillStyle = icicleGrad;
            fgCtx.fill();
          }
          fgCtx.restore();
        }
      });

      // ── C. UPDATE AND RENDER FALLING CLUMPS (GRAVITY SLIDING) ──
      for (let i = fallingClumps.length - 1; i >= 0; i--) {
        const clump = fallingClumps[i];
        clump.vy += clump.ay * dt * 60;
        clump.x += clump.vx * dt * 60;
        clump.y += clump.vy * dt * 60;
        clump.rotation += clump.vRot;

        // Collision detection against lower registered surfaces
        let collided = false;
        for (let s = 0; s < surfaces.length; s++) {
          const surf = surfaces[s];
          if (surf.id === clump.sourceId) continue;

          const sX = surf.docX - scrollX;
          const sY = surf.docY - scrollY;

          // Check if clump hits target surface top collision line
          if (
            clump.y >= sY - 5 &&
            clump.y <= sY + 12 &&
            clump.x >= sX - 5 &&
            clump.x <= sX + surf.width + 5
          ) {
            collided = true;
            surf.accumulatedSnow = Math.min(1.45, surf.accumulatedSnow + 0.12);

            // Trigger secondary impact splatter puff!
            const count = 8 + Math.floor(Math.random() * 5);
            for (let sp = 0; sp < count; sp++) {
              const angle = Math.PI * (1.15 + Math.random() * 0.7);
              const speed = 1.4 + Math.random() * 2.6;
              splatters.push({
                x: clump.x,
                y: sY - 1,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                radius: 1.2 + Math.random() * 1.6,
                alpha: 1.0,
                life: 30,
                maxLife: 30,
              });
            }
            break;
          }
        }

        // If hit or dropped below screen
        if (collided || clump.y > height + 20) {
          fallingClumps.splice(i, 1);
          continue;
        }

        // Draw falling clump: textured snow puff
        fgCtx.save();
        fgCtx.translate(clump.x, clump.y);
        fgCtx.rotate(clump.rotation);

        fgCtx.beginPath();
        fgCtx.arc(0, 0, clump.radius, 0, Math.PI * 2);
        fgCtx.arc(-clump.radius * 0.45, 0, clump.radius * 0.65, 0, Math.PI * 2);
        fgCtx.arc(clump.radius * 0.45, 0, clump.radius * 0.65, 0, Math.PI * 2);

        const clumpGrad = fgCtx.createRadialGradient(0, 0, 0, 0, 0, clump.radius * 1.2);
        clumpGrad.addColorStop(0, 'rgba(255, 255, 255, 0.98)');
        clumpGrad.addColorStop(1, dark ? 'rgba(205, 230, 255, 0.85)' : 'rgba(220, 235, 255, 0.85)');

        fgCtx.fillStyle = clumpGrad;
        fgCtx.shadowColor = dark ? 'rgba(180, 220, 255, 0.4)' : 'rgba(66, 90, 239, 0.18)';
        fgCtx.shadowBlur = 3;
        fgCtx.fill();
        fgCtx.restore();
      }

      // ── D. UPDATE AND RENDER SPLATTER IMPACT PUFF PARTICLES ──
      for (let i = splatters.length - 1; i >= 0; i--) {
        const sp = splatters[i];
        sp.x += sp.vx * dt * 60;
        sp.y += sp.vy * dt * 60;
        sp.vy += 0.12 * dt * 60; // gravity on debris
        sp.life -= 1;
        sp.alpha = Math.max(0, sp.life / sp.maxLife);

        if (sp.life <= 0) {
          splatters.splice(i, 1);
          continue;
        }

        fgCtx.beginPath();
        fgCtx.arc(sp.x, sp.y, sp.radius, 0, Math.PI * 2);
        fgCtx.fillStyle = dark
          ? `rgba(230, 245, 255, ${sp.alpha * 0.9})`
          : `rgba(255, 255, 255, ${sp.alpha * 0.95})`;
        fgCtx.fill();
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
        bgCanvas.style.opacity = '1';
        fgCanvas.style.opacity = '1';
        scanSurfaces();
        startLoop();
      } else {
        bgCanvas.style.opacity = '0';
        fgCanvas.style.opacity = '0';
        setTimeout(() => {
          if (!isSnowActive()) stopLoop();
        }, 350);
      }
    };

    // Fast scroll handling: no layout recalculations during scroll
    const handleScroll = () => {
      isScrolling = true;
      if (scrollTimeout) clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        isScrolling = false;
        scanSurfaces();
      }, 120);
    };

    // Tab visibility handling
    const handleVisibility = () => {
      if (document.hidden) {
        stopLoop();
      } else if (isSnowActive()) {
        startLoop();
      }
    };

    // Mutation observer for background mode and theme changes
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

    const handlePageNavigation = () => {
      setTimeout(() => {
        scanSurfaces();
      }, 60);
    };

    window.addEventListener('resize', resize, { passive: true });
    window.addEventListener('scroll', handleScroll, { passive: true });
    document.addEventListener('visibilitychange', handleVisibility);
    document.addEventListener('astro:page-load', handlePageNavigation);
    document.addEventListener('astro:after-swap', handlePageNavigation);
    window.addEventListener('load', handlePageNavigation);

    // Initial boot
    resize();
    updateState();

    return () => {
      stopLoop();
      observer.disconnect();
      window.removeEventListener('resize', resize);
      window.removeEventListener('scroll', handleScroll);
      document.removeEventListener('visibilitychange', handleVisibility);
      document.removeEventListener('astro:page-load', handlePageNavigation);
      document.removeEventListener('astro:after-swap', handlePageNavigation);
      window.removeEventListener('load', handlePageNavigation);
      if (scrollTimeout) clearTimeout(scrollTimeout);
    };
  }, []);

  return (
    <>
      <canvas
        ref={bgCanvasRef}
        id="theme-snow-bg"
        className="theme-snow-canvas theme-snow-bg"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          zIndex: -1,
          opacity: 0,
          transition: 'opacity 0.4s ease',
        }}
        aria-hidden="true"
      />
      <canvas
        ref={fgCanvasRef}
        id="theme-snow-fg"
        className="theme-snow-canvas theme-snow-fg"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          zIndex: 35,
          opacity: 0,
          transition: 'opacity 0.4s ease',
        }}
        aria-hidden="true"
      />
    </>
  );
}

export default ThemeUniverse;
