/**
 * pulse-motion.js
 * Pulse. UI Source Pack — Ambient Motion System
 * Version: 1.0 · April 2026
 *
 * Three self-contained ambient effects, all extracted from electric6.html
 * and tuned to dashboard intensity. Drop this file into the app shell and
 * call initPulseMotion() after DOMContentLoaded.
 *
 * Effects:
 *   1. Heartbeat canvas  — pulsing blob field behind all content
 *   2. Scan effect       — invisible line that flares card borders as it passes
 *   3. Button interactions — ink drop bloom + pulse ring on primary CTAs
 *
 * Usage:
 *   <script src="pulse-motion.js"></script>
 *   <script>document.addEventListener('DOMContentLoaded', initPulseMotion);</script>
 *
 * Or in Next.js (pages/_app.tsx or a useEffect):
 *   import { initPulseMotion } from '@/lib/pulse-motion';
 *   useEffect(() => { const cleanup = initPulseMotion(); return cleanup; }, []);
 */

// ─────────────────────────────────────────────────────────────────────────────
// EFFECT 1: HEARTBEAT CANVAS
// Canonical source: electric6.html in corisleachman/beta-invite
//
// Dashboard values differ from beta page — lower opacity so it never
// competes with data. DO NOT increase OPACITY_BASE above 0.09.
// ─────────────────────────────────────────────────────────────────────────────
function initHeartbeatCanvas(canvasId = 'pulse-canvas') {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return () => {};

  const ctx = canvas.getContext('2d');

  // ── Dashboard-tuned parameters (lower intensity than beta page) ──
  const BLOB_COUNT   = 9;
  const RADIUS_MIN   = 110;
  const RADIUS_MAX   = 240;
  const CYCLE_MS     = 8000;   // 8s — canonical heartbeat period
  const PULSE_SWELL  = 0.22;   // How much blobs swell on beat
  const OPACITY_BASE = 0.08;   // Lower than beta (0.10) — won't compete with data
  const OPACITY_FLARE= 0.12;   // Lower than beta (0.14)
  const DRIFT        = 0.4;    // px/frame organic drift
  const BLUR_PX      = 55;     // Canvas Gaussian blur
  const STAGGER      = 0.15;   // Phase offset across blobs (ripple not flash)
  const PARALLAX     = 0.03;   // Mouse parallax strength
  const MOBILE_FACTOR= 0.6;    // Reduce blob count on mobile

  // ── Dark mode blob palette (from brand guidelines) ──
  const PALETTE_DARK = [
    [255, 20, 147],   // Pink × 2
    [255, 20, 147],
    [  0, 212, 255],  // Cyan × 2
    [  0, 212, 255],
    [180,  10, 120],  // Deep pink
    [ 80, 160, 220],  // Slate
  ];

  // ── Light mode blob palette ──
  const PALETTE_LIGHT = [
    [160,   0,  90],  // Plum × 2
    [160,   0,  90],
    [  0, 100, 130],  // Teal × 2
    [  0, 100, 130],
    [120,  20, 100],  // Deep plum
    [ 80, 120, 160],  // Slate
  ];

  // Two-bump cardiac heartbeat curve
  function heartbeatCurve(t) {
    const b1 = Math.exp(-((t - 0.04) ** 2) / 0.0012);
    const b2 = 0.45 * Math.exp(-((t - 0.13) ** 2) / 0.0022);
    return Math.min(1, Math.max(0, b1 + b2));
  }

  function isMobile() { return window.innerWidth < 768; }
  function isLightMode() {
    return document.documentElement.dataset.theme === 'light';
  }

  let W, H, blobs = [];
  let mx = 0.5, my = 0.5, tmx = 0.5, tmy = 0.5;
  let off, octx, raf;

  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
    off = document.createElement('canvas');
    off.width = W; off.height = H;
    octx = off.getContext('2d');
    initBlobs();
  }

  function initBlobs() {
    blobs = [];
    const PALETTE = isLightMode() ? PALETTE_LIGHT : PALETTE_DARK;
    const count = Math.floor(BLOB_COUNT * (isMobile() ? MOBILE_FACTOR : 1));
    const cols  = Math.ceil(Math.sqrt(count * W / H));
    const rows  = Math.ceil(count / cols);
    const cw = W / cols, ch = H / rows;

    for (let i = 0; i < count; i++) {
      const col = i % cols, row = Math.floor(i / cols);
      const pal = PALETTE[Math.floor(Math.random() * PALETTE.length)];
      const br  = RADIUS_MIN + Math.random() * (RADIUS_MAX - RADIUS_MIN);
      blobs.push({
        x: (col + 0.15 + Math.random() * 0.7) * cw,
        y: (row + 0.15 + Math.random() * 0.7) * ch,
        baseR: br, r: br, col: pal,
        baseOpacity: OPACITY_BASE + Math.random() * 0.04,
        ax: Math.random() * Math.PI * 2,
        ay: Math.random() * Math.PI * 2,
        sx: 0.0002 + Math.random() * 0.0003,
        sy: 0.0002 + Math.random() * 0.0003,
        phaseOffset: (i / count) * STAGGER,
      });
    }
  }

  function frame(ts) {
    octx.clearRect(0, 0, W, H);
    ctx.clearRect(0, 0, W, H);

    mx += (tmx - mx) * 0.03;
    my += (tmy - my) * 0.03;

    const ox = (0.5 - mx) * W * PARALLAX;
    const oy = (0.5 - my) * H * PARALLAX;

    blobs.forEach(b => {
      b.ax += b.sx; b.ay += b.sy;
      b.x  += Math.sin(b.ax) * DRIFT;
      b.y  += Math.cos(b.ay) * DRIFT;

      const pad = b.baseR + 10;
      if (b.x < -pad) b.x = W + pad;
      if (b.x > W + pad) b.x = -pad;
      if (b.y < -pad) b.y = H + pad;
      if (b.y > H + pad) b.y = -pad;

      const cycleT = ((ts / CYCLE_MS) + b.phaseOffset) % 1;
      const hb = heartbeatCurve(cycleT);
      b.r = b.baseR * (1 + PULSE_SWELL * hb);
      const opacity = b.baseOpacity + OPACITY_FLARE * hb;

      const gx = b.x + ox, gy = b.y + oy;
      const [r, g, bv] = b.col;
      const grad = octx.createRadialGradient(gx, gy, 0, gx, gy, b.r);
      grad.addColorStop(0,   `rgba(${r},${g},${bv},${opacity.toFixed(3)})`);
      grad.addColorStop(0.4, `rgba(${r},${g},${bv},${(opacity * 0.5).toFixed(3)})`);
      grad.addColorStop(1,   `rgba(${r},${g},${bv},0)`);

      octx.beginPath();
      octx.arc(gx, gy, b.r, 0, Math.PI * 2);
      octx.fillStyle = grad;
      octx.fill();
    });

    ctx.filter = `blur(${BLUR_PX}px)`;
    ctx.drawImage(off, 0, 0);
    ctx.filter = 'none';
    raf = requestAnimationFrame(frame);
  }

  const onMouseMove = e => { tmx = e.clientX / W; tmy = e.clientY / H; };
  const onTouchMove = e => {
    if (e.touches.length) {
      tmx = e.touches[0].clientX / W;
      tmy = e.touches[0].clientY / H;
    }
  };
  const onResize = () => { cancelAnimationFrame(raf); resize(); raf = requestAnimationFrame(frame); };

  window.addEventListener('mousemove', onMouseMove);
  window.addEventListener('touchmove', onTouchMove, { passive: true });
  window.addEventListener('resize', onResize);
  resize();
  raf = requestAnimationFrame(frame);

  // Return cleanup function
  return () => {
    cancelAnimationFrame(raf);
    window.removeEventListener('mousemove', onMouseMove);
    window.removeEventListener('touchmove', onTouchMove);
    window.removeEventListener('resize', onResize);
  };
}


// ─────────────────────────────────────────────────────────────────────────────
// EFFECT 2: SCAN EFFECT
// Canonical source: electric6.html in corisleachman/beta-invite
//
// An invisible scan line travels bottom→top over CYCLE_MS.
// Elements tagged with data-scan="pink" or data-scan="cyan" get a brief
// border flare as the line passes within TRIGGER_DIST px of their centre.
//
// Dashboard targets: campaign cards (pink=active, amber=follow-ups due),
// new reply indicators (cyan), sidebar icons (pink, subtle).
// ─────────────────────────────────────────────────────────────────────────────
function initScanEffect() {
  const CYCLE_MS      = 8000;   // Must match heartbeat
  const LIT_MS        = 280;    // Border at full brightness
  const FADE_MS       = 1400;   // Long slow return to resting
  const TRIGGER_DIST  = 60;     // px from element centre to trigger

  // CSS classes (add these to your stylesheet or pulse-foundation.css)
  // .scan-lit-pink { border-color: rgba(255,20,147,0.35) !important; box-shadow: 0 0 10px rgba(255,20,147,0.10) !important; }
  // .scan-lit-cyan { border-color: rgba(0,212,255,0.35) !important;  box-shadow: 0 0 10px rgba(0,212,255,0.10) !important; }
  // .scan-lit-amber{ border-color: rgba(255,157,66,0.35) !important; box-shadow: 0 0 10px rgba(255,157,66,0.10) !important; }
  // .scan-fade { transition: border-color 1400ms ease, box-shadow 1400ms ease !important; }

  let scanTargets = [];

  function collectTargets() {
    scanTargets = Array.from(document.querySelectorAll('[data-scan]')).map(el => ({
      el,
      colour: el.dataset.scan,      // 'pink' | 'cyan' | 'amber'
      lastFired: -Infinity,
    }));
  }

  function getScanY(ts) {
    const t = (ts % CYCLE_MS) / CYCLE_MS;
    return document.documentElement.scrollHeight * (1 - t);
  }

  function lightElement(el, colour) {
    el.classList.remove('scan-lit-pink', 'scan-lit-cyan', 'scan-lit-amber', 'scan-fade');
    void el.offsetWidth; // Force reflow

    const litClass = colour === 'cyan'  ? 'scan-lit-cyan'
                   : colour === 'amber' ? 'scan-lit-amber'
                   : 'scan-lit-pink';
    el.classList.add(litClass);

    setTimeout(() => {
      el.classList.add('scan-fade');
      el.classList.remove('scan-lit-pink', 'scan-lit-cyan', 'scan-lit-amber');
      setTimeout(() => el.classList.remove('scan-fade'), FADE_MS + 50);
    }, LIT_MS);
  }

  let rafId;
  function frame(ts) {
    const scanY   = getScanY(ts);
    const scrollY = window.scrollY;

    scanTargets.forEach(target => {
      const rect = target.el.getBoundingClientRect();
      const elCentreDoc = scrollY + rect.top + rect.height * 0.5;
      const dist = Math.abs(scanY - elCentreDoc);

      if (dist < TRIGGER_DIST && (ts - target.lastFired) > CYCLE_MS * 0.9) {
        target.lastFired = ts;
        lightElement(target.el, target.colour);
      }
    });

    rafId = requestAnimationFrame(frame);
  }

  // Re-collect when DOM changes (e.g. tabs switching, route changes)
  const observer = new MutationObserver(collectTargets);
  observer.observe(document.body, { childList: true, subtree: true });

  window.addEventListener('resize', collectTargets);
  collectTargets();
  rafId = requestAnimationFrame(frame);

  return () => {
    cancelAnimationFrame(rafId);
    observer.disconnect();
    window.removeEventListener('resize', collectTargets);
  };
}


// ─────────────────────────────────────────────────────────────────────────────
// EFFECT 3: BUTTON INTERACTIONS
// Canonical source: pulse-variants.html in corisleachman/beta-invite
//
// Two effects fire simultaneously on mouseenter on any .btn-primary element:
//   Effect A — Ink drop bloom: radial gradient from exact cursor entry point
//   Effect B — Pulse ring: ring expands from button border outward
//
// LOCKED DECISION: No translateY on hover. Button stays physically still.
// Both effects are one-shot per hover.
//
// HTML structure required for pulse ring:
//   <div class="btn-ring-wrap">
//     <button class="btn-primary">Label</button>
//   </div>
// ─────────────────────────────────────────────────────────────────────────────
function initButtonInteractions(selector = '.btn-primary') {
  // ── Ink drop parameters ──
  const INK_DURATION  = 1800;   // ms — total dispersion time
  const INK_MAX_SCALE = 2.8;    // Ring expands to 2.8× button diagonal
  const INK_PEAK_AT   = 0.08;   // Opacity peaks at 8% through animation
  const INK_PEAK_OPACITY = 0.22;

  function easeOut(t) { return 1 - Math.pow(1 - t, 3); }

  function initButton(btn) {
    // Don't double-initialise
    if (btn._pulseInitialised) return;
    btn._pulseInitialised = true;

    // ── Ink drop canvas ──
    const cvs = document.createElement('canvas');
    cvs.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;pointer-events:none;border-radius:inherit;';
    btn.style.position = 'relative';
    btn.style.overflow = 'hidden';
    btn.appendChild(cvs);

    const inkCtx = cvs.getContext('2d');
    let W, H, diagonal, inkRaf, startTs, ox, oy;
    let ready = true;

    function resize() {
      const r = btn.getBoundingClientRect();
      W = cvs.width  = r.width;
      H = cvs.height = r.height;
      diagonal = Math.sqrt(W * W + H * H);
    }
    resize();
    window.addEventListener('resize', resize);

    function inkFrame(ts) {
      const elapsed = ts - startTs;
      const t       = Math.min(elapsed / INK_DURATION, 1);
      const eased   = easeOut(t);
      const radius  = eased * diagonal * INK_MAX_SCALE;

      inkCtx.clearRect(0, 0, W, H);

      let opacity = t < INK_PEAK_AT
        ? t / INK_PEAK_AT
        : Math.pow(1 - (t - INK_PEAK_AT) / (1 - INK_PEAK_AT), 1.6);
      opacity *= INK_PEAK_OPACITY;

      const grad = inkCtx.createRadialGradient(ox, oy, 0, ox, oy, Math.max(radius, 1));
      grad.addColorStop(0,    `rgba(255,255,255,${(opacity * 1.8).toFixed(3)})`);
      grad.addColorStop(0.15, `rgba(255,255,255,${(opacity * 1.2).toFixed(3)})`);
      grad.addColorStop(0.5,  `rgba(255,255,255,${(opacity * 0.5).toFixed(3)})`);
      grad.addColorStop(1,    `rgba(255,255,255,0)`);

      inkCtx.beginPath();
      inkCtx.arc(ox, oy, Math.max(radius, 1), 0, Math.PI * 2);
      inkCtx.fillStyle = grad;
      inkCtx.fill();

      if (t < 1) {
        inkRaf = requestAnimationFrame(inkFrame);
      } else {
        inkCtx.clearRect(0, 0, W, H);
      }
    }

    btn.addEventListener('mouseenter', e => {
      if (!ready) return;
      ready = false;
      if (inkRaf) cancelAnimationFrame(inkRaf);

      const rect = btn.getBoundingClientRect();
      ox = e.clientX - rect.left;
      oy = e.clientY - rect.top;
      startTs = null;

      inkRaf = requestAnimationFrame(ts => { startTs = ts; inkFrame(ts); });

      // ── Pulse ring (on wrapper if present) ──
      const wrap = btn.closest('.btn-ring-wrap');
      if (wrap) {
        wrap.classList.remove('ring-pulse');
        void wrap.offsetWidth; // Force reflow to re-trigger animation
        wrap.classList.add('ring-pulse');
        wrap.addEventListener('animationend', () => wrap.classList.remove('ring-pulse'), { once: true });
      }
    });

    btn.addEventListener('mouseleave', () => {
      setTimeout(() => { ready = true; }, 100);
    });
  }

  // Init all existing buttons
  document.querySelectorAll(selector).forEach(initButton);

  // Watch for dynamically added buttons (route changes, modal opens)
  const observer = new MutationObserver(mutations => {
    mutations.forEach(m => {
      m.addedNodes.forEach(node => {
        if (node.nodeType !== 1) return;
        if (node.matches?.(selector)) initButton(node);
        node.querySelectorAll?.(selector).forEach(initButton);
      });
    });
  });
  observer.observe(document.body, { childList: true, subtree: true });

  return () => observer.disconnect();
}


// ─────────────────────────────────────────────────────────────────────────────
// MASTER INIT FUNCTION
// Call after DOMContentLoaded. Returns a cleanup function.
// ─────────────────────────────────────────────────────────────────────────────
function initPulseMotion(options = {}) {
  const {
    canvasId         = 'pulse-canvas',
    enableHeartbeat  = true,
    enableScan       = true,
    enableButtons    = true,
    buttonSelector   = '.btn-primary',
    respectMotion    = true,   // Honour prefers-reduced-motion
  } = options;

  // Respect accessibility preference
  if (respectMotion && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return () => {};
  }

  const cleanups = [];

  if (enableHeartbeat) cleanups.push(initHeartbeatCanvas(canvasId));
  if (enableScan)      cleanups.push(initScanEffect());
  if (enableButtons)   cleanups.push(initButtonInteractions(buttonSelector));

  return () => cleanups.forEach(fn => fn?.());
}

// ─────────────────────────────────────────────────────────────────────────────
// EXPORTS (for Next.js / ES module environments)
// ─────────────────────────────────────────────────────────────────────────────
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { initPulseMotion, initHeartbeatCanvas, initScanEffect, initButtonInteractions };
}
