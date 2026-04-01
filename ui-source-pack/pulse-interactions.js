/**
 * pulse-interactions.js
 * Pulse. UI Source Pack — UI Interaction System
 * Version: 1.0 · April 2026
 *
 * Vanilla JS implementations of all Pulse. UI interaction patterns.
 * These describe the BEHAVIOUR for Codex to re-implement as React
 * hooks and components in the live app. They are also directly usable
 * in the source pack HTML files for testing.
 *
 * Interaction patterns covered:
 *   1. Modal system     — open, close, backdrop click, Escape key
 *   2. Drawer system    — slide in/out from right edge
 *   3. Toast system     — spring entrance, auto-dismiss, undo support
 *   4. Row collapse     — fade + height collapse on send/approve/skip
 *   5. Tab switching    — active tab state + flash
 *   6. Milestone reveal — scale + fade, no confetti
 *   7. Momentum prompt  — slide up, auto-expire 10s
 *
 * Usage (source pack HTML):
 *   <script src="pulse-interactions.js"></script>
 *   Interaction functions are globally available.
 *
 * Usage (Next.js):
 *   These patterns map to React hooks. See comments on each function
 *   for the equivalent React implementation.
 */


// ─────────────────────────────────────────────────────────────────────────────
// INTERACTION 1: MODAL SYSTEM
// Opens/closes a modal overlay + box.
// Animation: overlay fades in, box slides up 12px → 0.
//
// React equivalent:
//   const [open, setOpen] = useState(false);
//   Framer Motion: <AnimatePresence> + motion.div with opacity/y variants
// ─────────────────────────────────────────────────────────────────────────────
function openModal(modalId) {
  const overlay = document.getElementById(modalId);
  if (!overlay) return;
  overlay.classList.add('open');
  document.body.style.overflow = 'hidden';

  // Close on backdrop click
  overlay.addEventListener('click', e => {
    if (e.target === overlay) closeModal(modalId);
  }, { once: true });
}

function closeModal(modalId) {
  const overlay = document.getElementById(modalId);
  if (!overlay) return;
  overlay.classList.remove('open');
  document.body.style.overflow = '';
}

// Close any open modal on Escape
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    document.querySelectorAll('.modal-overlay.open').forEach(el => {
      el.classList.remove('open');
      document.body.style.overflow = '';
    });
    document.querySelectorAll('.drawer.open').forEach(el => {
      el.classList.remove('open');
    });
    document.querySelectorAll('.drawer-backdrop.open').forEach(el => {
      el.classList.remove('open');
    });
  }
});


// ─────────────────────────────────────────────────────────────────────────────
// INTERACTION 2: DRAWER SYSTEM
// Slides a right-edge panel in/out. Backdrop dims the rest of the screen.
// Animation: translateX(100%) → translateX(0), 280ms cubic-bezier(0.4,0,0.2,1)
// (The CSS handles the animation — JS just adds/removes .open class)
//
// React equivalent:
//   const [drawerOpen, setDrawerOpen] = useState(false);
//   CSS transition on transform: translateX. Backdrop: conditional render.
// ─────────────────────────────────────────────────────────────────────────────
function openDrawer(drawerId, backdropId) {
  const drawer   = document.getElementById(drawerId);
  const backdrop = backdropId ? document.getElementById(backdropId) : null;
  if (!drawer) return;

  drawer.classList.add('open');
  if (backdrop) {
    backdrop.classList.add('open');
    backdrop.addEventListener('click', () => closeDrawer(drawerId, backdropId), { once: true });
  }
  document.body.style.overflow = 'hidden';
}

function closeDrawer(drawerId, backdropId) {
  const drawer   = document.getElementById(drawerId);
  const backdrop = backdropId ? document.getElementById(backdropId) : null;
  if (drawer)   drawer.classList.remove('open');
  if (backdrop) backdrop.classList.remove('open');
  document.body.style.overflow = '';
}


// ─────────────────────────────────────────────────────────────────────────────
// INTERACTION 3: TOAST SYSTEM
// Spring entrance from bottom-right. Auto-dismisses after 4 seconds.
// Colour variants: cyan (info), pink (action), green (success), amber (warn).
// LOCKED: Toast always shows the recipient email address on send — never "Sent!"
//
// Undo support: pass an onUndo callback for reversible actions.
//
// React equivalent:
//   useToast() hook — maintains a toasts[] array in state, renders via portal.
//   Each toast: { id, message, colour, duration, onUndo }
// ─────────────────────────────────────────────────────────────────────────────
const _toastQueue = [];

function showToast(message, colour = 'cyan', duration = 4000, onUndo = null) {
  const zone = document.getElementById('toast-zone');
  if (!zone) {
    console.warn('pulse-interactions: no #toast-zone element found');
    return;
  }

  const id   = `toast-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const el   = document.createElement('div');
  el.id      = id;
  el.className = `toast ${colour}`;

  // Icon per colour
  const icons = {
    green: '<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><polyline points="1.5 7 5 10.5 12.5 3" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    cyan:  '<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="6" stroke="currentColor" stroke-width="1.4"/><path d="M7 4.5v4M7 10h.01" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>',
    pink:  '<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 1l1.5 4.5H13l-4 2.5 1.5 4.5L7 10l-3.5 2.5L5 8 1 5.5h4.5z" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/></svg>',
    amber: '<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 1l6 12H1L7 1z" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/><path d="M7 5v4M7 11h.01" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>',
  };

  el.innerHTML = `
    ${icons[colour] || icons.cyan}
    <span style="flex:1;">${message}</span>
    ${onUndo ? `<button onclick="(${onUndo.toString()})();document.getElementById('${id}')?.remove();" style="background:none;border:none;font-family:var(--of);font-size:12px;font-weight:700;color:var(--cyan);cursor:pointer;text-decoration:underline;text-underline-offset:2px;padding:0 4px;">Undo</button>` : ''}
    <button onclick="document.getElementById('${id}')?.remove();" style="background:none;border:none;color:var(--td);cursor:pointer;font-size:16px;line-height:1;padding:0 2px;opacity:0.6;">×</button>
  `;

  el.style.cssText = `
    display:flex;align-items:center;gap:10px;padding:12px 15px;
    background:rgba(13,9,20,0.97);border:1px solid var(--b2);border-radius:10px;
    font-size:13px;color:var(--t);max-width:340px;backdrop-filter:blur(12px);
    border-left:3px solid var(--${colour});
    animation:toast-in 0.3s cubic-bezier(0.22,0.68,0,1.2) forwards;
    pointer-events:all;
  `;

  zone.appendChild(el);

  // Auto-dismiss
  const timer = setTimeout(() => {
    el.style.opacity    = '0';
    el.style.transform  = 'translateY(4px)';
    el.style.transition = 'opacity 0.3s, transform 0.3s';
    setTimeout(() => el.remove(), 300);
  }, duration);

  // Cancel auto-dismiss on hover (lets user read it)
  el.addEventListener('mouseenter', () => clearTimeout(timer));

  return id;
}


// ─────────────────────────────────────────────────────────────────────────────
// INTERACTION 4: ROW COLLAPSE (send/approve/skip)
// Pattern 1 from the Seven Named Dashboard Interaction Patterns:
// Fade to 40% opacity + 5px X offset → collapse height to 0.
// Toast fires in parallel (call showToast separately).
//
// React equivalent:
//   Framer Motion: AnimatePresence + exit: { opacity: 0, x: 5, height: 0 }
//   Or CSS: add .removing class, listen for transitionend to remove from DOM.
// ─────────────────────────────────────────────────────────────────────────────
function collapseRow(rowElement, onComplete = null) {
  const el = typeof rowElement === 'string'
    ? document.getElementById(rowElement)
    : rowElement;
  if (!el) return;

  // Store original height for smooth collapse
  const height = el.getBoundingClientRect().height;
  el.style.overflow = 'hidden';

  // Step 1: fade out + slide right (200ms)
  el.style.transition = 'opacity 200ms ease, transform 200ms ease';
  el.style.opacity    = '0.4';
  el.style.transform  = 'translateX(5px)';

  setTimeout(() => {
    // Step 2: collapse height (300ms)
    el.style.transition = 'height 300ms ease, margin 300ms ease, padding 300ms ease, opacity 300ms ease';
    el.style.height     = height + 'px';
    void el.offsetHeight;
    el.style.height     = '0';
    el.style.marginTop  = '0';
    el.style.marginBottom = '0';
    el.style.paddingTop   = '0';
    el.style.paddingBottom = '0';

    setTimeout(() => {
      el.remove();
      onComplete?.();
    }, 300);
  }, 200);
}


// ─────────────────────────────────────────────────────────────────────────────
// INTERACTION 5: TAB SWITCHING
// Active tab state + 150ms pink underline flash on switch (Pattern V1).
// The flash is a brief border-bottom brightness flare before settling.
//
// React equivalent:
//   activeTab state in CampaignDetailClient. Tab component renders with
//   border-bottom: 2px solid var(--pink) when active.
//   Flash: add/remove .tab-flash class with a 150ms CSS animation.
// ─────────────────────────────────────────────────────────────────────────────
function switchTab(tabBarId, tabName, onSwitch = null) {
  const bar = document.getElementById(tabBarId);
  if (!bar) return;

  bar.querySelectorAll('.tab').forEach(tab => {
    const isActive = tab.dataset.tab === tabName || tab.textContent.trim().startsWith(tabName);
    tab.classList.toggle('active', isActive);

    // Flash on the newly activated tab
    if (isActive) {
      tab.classList.remove('tab-flash');
      void tab.offsetWidth;
      tab.classList.add('tab-flash');
      tab.addEventListener('animationend', () => tab.classList.remove('tab-flash'), { once: true });
    }
  });

  // Hide/show content panels
  document.querySelectorAll('.tab-panel').forEach(panel => {
    panel.style.display = panel.dataset.tab === tabName ? 'block' : 'none';
  });

  onSwitch?.(tabName);
}


// ─────────────────────────────────────────────────────────────────────────────
// INTERACTION 6: MILESTONE REVEAL
// Pattern 6 from the Seven Named Dashboard Interaction Patterns.
// scale(0.96→1) + opacity 0→1, 400ms. 300ms stagger when multiple cards.
// NO CONFETTI. Permanently excluded by brand guidelines.
//
// Triggers:
//   - First campaign sent
//   - First reply received
//   - 10 replies milestone
//   - 100 prospects contacted
//
// React equivalent (Phase 2.13):
//   useMilestone() hook checks user_milestones array from DB.
//   Framer Motion: initial={{ scale: 0.96, opacity: 0 }}
//                  animate={{ scale: 1, opacity: 1 }}
//                  transition={{ duration: 0.4, stagger: 0.3 }}
// ─────────────────────────────────────────────────────────────────────────────
function showMilestone(message, subMessage = '', colour = 'pink') {
  // Remove any existing milestone
  document.getElementById('pulse-milestone')?.remove();

  const el = document.createElement('div');
  el.id = 'pulse-milestone';

  const colourMap = {
    pink:  { bg: 'rgba(255,20,147,0.08)',  border: 'rgba(255,20,147,0.2)',  text: 'var(--pink)' },
    cyan:  { bg: 'rgba(0,212,255,0.06)',   border: 'rgba(0,212,255,0.18)',  text: 'var(--cyan)' },
    green: { bg: 'rgba(100,220,120,0.08)', border: 'rgba(100,220,120,0.2)', text: 'var(--green)' },
  };
  const c = colourMap[colour] || colourMap.pink;

  el.style.cssText = `
    position:fixed;top:50%;left:50%;transform:translate(-50%,-50%) scale(0.96);
    background:${c.bg};border:1px solid ${c.border};border-radius:16px;
    padding:32px 40px;text-align:center;z-index:600;max-width:360px;width:90%;
    backdrop-filter:blur(20px);opacity:0;
    transition:opacity 400ms cubic-bezier(0.22,0.68,0,1.2), transform 400ms cubic-bezier(0.22,0.68,0,1.2);
    pointer-events:none;
  `;

  el.innerHTML = `
    <div style="font-size:32px;margin-bottom:12px;">✦</div>
    <div style="font-family:var(--of);font-size:20px;font-weight:800;color:${c.text};margin-bottom:6px;">${message}</div>
    ${subMessage ? `<div style="font-size:13px;color:var(--tm);line-height:1.6;">${subMessage}</div>` : ''}
  `;

  document.body.appendChild(el);

  // Trigger animation
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      el.style.opacity   = '1';
      el.style.transform = 'translate(-50%,-50%) scale(1)';
    });
  });

  // Auto-dismiss after 3s — fade out then remove
  setTimeout(() => {
    el.style.opacity   = '0';
    el.style.transform = 'translate(-50%,-50%) scale(0.97)';
    setTimeout(() => el.remove(), 400);
  }, 3000);
}


// ─────────────────────────────────────────────────────────────────────────────
// INTERACTION 7: MOMENTUM PROMPT
// Pattern 5 from the Seven Named Dashboard Interaction Patterns.
// Slides up 6px + fades in over 300ms. Left-border accent.
// Auto-expires after 10s. Dismissed on next user action.
// NEVER persists across navigation.
//
// React equivalent (Phase 2.13):
//   useMomentumPrompt() hook. Framer Motion:
//   initial={{ y: 6, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
//   Duration: 300ms. Auto-dismiss via setTimeout.
// ─────────────────────────────────────────────────────────────────────────────
function showMomentumPrompt(message, actionLabel = null, onAction = null) {
  // Remove any existing prompt
  document.getElementById('pulse-momentum')?.remove();

  const el = document.createElement('div');
  el.id = 'pulse-momentum';

  el.style.cssText = `
    position:fixed;bottom:80px;left:calc(56px + 24px);
    background:rgba(13,9,20,0.95);border:1px solid var(--b2);
    border-left:3px solid var(--pink);border-radius:10px;
    padding:14px 18px;max-width:300px;z-index:400;
    display:flex;align-items:flex-start;gap:12px;
    backdrop-filter:blur(12px);
    transform:translateY(6px);opacity:0;
    transition:transform 300ms cubic-bezier(0.22,0.68,0,1.2), opacity 300ms ease;
    pointer-events:all;
  `;

  el.innerHTML = `
    <div style="flex:1;">
      <div style="font-size:13px;color:var(--t);line-height:1.5;">${message}</div>
      ${actionLabel ? `<button onclick="(${(onAction || (() => {})).toString()})();document.getElementById('pulse-momentum')?.remove();" style="margin-top:8px;background:none;border:none;font-family:var(--of);font-size:12px;font-weight:700;color:var(--pink);cursor:pointer;padding:0;">${actionLabel} →</button>` : ''}
    </div>
    <button onclick="document.getElementById('pulse-momentum')?.remove();" style="background:none;border:none;color:var(--td);cursor:pointer;font-size:16px;line-height:1;flex-shrink:0;padding:0;">×</button>
  `;

  document.body.appendChild(el);

  // Trigger animation
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      el.style.transform = 'translateY(0)';
      el.style.opacity   = '1';
    });
  });

  // Auto-expire 10s
  const timer = setTimeout(() => {
    el.style.opacity   = '0';
    el.style.transform = 'translateY(4px)';
    setTimeout(() => el.remove(), 300);
  }, 10000);

  // Dismiss on next navigation/action
  const dismiss = () => { clearTimeout(timer); el.remove(); };
  document.addEventListener('click', dismiss, { once: true });

  return dismiss;
}


// ─────────────────────────────────────────────────────────────────────────────
// CSS injected at runtime — scan effect classes + toast animation + tab flash
// These can be moved to pulse-foundation.css for production
// ─────────────────────────────────────────────────────────────────────────────
(function injectRuntimeStyles() {
  if (document.getElementById('pulse-interactions-styles')) return;
  const style = document.createElement('style');
  style.id = 'pulse-interactions-styles';
  style.textContent = `
    /* Scan effect classes */
    .scan-lit-pink  { border-color: rgba(255,20,147,0.35) !important; box-shadow: 0 0 10px rgba(255,20,147,0.10) !important; }
    .scan-lit-cyan  { border-color: rgba(0,212,255,0.35)  !important; box-shadow: 0 0 10px rgba(0,212,255,0.10)  !important; }
    .scan-lit-amber { border-color: rgba(255,157,66,0.35) !important; box-shadow: 0 0 10px rgba(255,157,66,0.10) !important; }
    .scan-fade      { transition: border-color 1400ms ease, box-shadow 1400ms ease !important; }

    /* Toast entrance animation */
    @keyframes toast-in {
      from { opacity:0; transform:translateY(6px); }
      to   { opacity:1; transform:translateY(0); }
    }

    /* Pulse ring on .btn-ring-wrap */
    .btn-ring-wrap { position:relative; display:inline-flex; }
    .btn-ring-wrap::after {
      content:'';
      position:absolute; inset:-2px;
      border-radius:100px;
      border:1.5px solid rgba(255,255,255,0.55);
      opacity:0;
      pointer-events:none;
    }
    .btn-ring-wrap.ring-pulse::after {
      animation:ring-expand 1.2s cubic-bezier(0.2,0.6,0.3,1) forwards;
    }
    @keyframes ring-expand {
      from { opacity:0.44; transform:scale(1); }
      to   { opacity:0;    transform:scale(1.48); }
    }

    /* Tab flash */
    .tab.tab-flash {
      animation: tab-flash 150ms ease forwards;
    }
    @keyframes tab-flash {
      0%   { border-bottom-color: var(--pink); filter: brightness(1.8); }
      100% { border-bottom-color: var(--pink); filter: brightness(1); }
    }
  `;
  document.head.appendChild(style);
})();
