// ══════════════════════════════════════════
// DATA
// ══════════════════════════════════════════
const PROSPECTS = {
  hs: { av:'HS', cls:'', name:'Howard Sullivan', role:'Founder & Executive Creative Director · YouStudio', first:'Howard', last:'Sullivan', email:'', website:'youstudio.com', company:'YouStudio', industry:'Design Services', size:'51–200', about:'A creative leader spearheading next generation retail. Working at the intersection of digital, brand and experience innovation globally. YouStudio is a strategically led creative design agency.' },
  mj: { av:'MJ', cls:'', name:'Mark Jory', role:'CEO · Latitude Agency · London', first:'Mark', last:'Jory', email:'', website:'latitudeagency.co.uk', company:'Latitude Agency', industry:'Marketing', size:'11–50', about:'CEO of Latitude Agency, a growth-focused agency based in London.' },
  sc: { av:'SC', cls:'t', name:'Sophie Clarke', role:'Managing Director · Fold Studio', first:'Sophie', last:'Clarke', email:'sophie@foldstudio.co.uk', website:'foldstudio.co.uk', company:'Fold Studio', industry:'Design', size:'1–10', about:'Managing Director at Fold Studio, an independent design agency based in London.' },
};
let currentPD = null;
let sendConfirmed = false;
let liMsg = "Hi {{first_name}}, I wanted to connect to introduce myself and the fractional new business support I help agencies with. I've sent over an email with a bit more info — if it resonates, I'd love to chat.\n\nCheers\nCoris";

// ══════════════════════════════════════════
// TABS
// ══════════════════════════════════════════
function switchTab(name) {
  document.querySelectorAll('.tab').forEach(t => t.classList.toggle('on', t.dataset.tab === name));
  document.querySelectorAll('.tc').forEach(t => t.classList.toggle('on', t.id === 'tc-' + name));
}

// ══════════════════════════════════════════
// PROSPECT CARDS
// ══════════════════════════════════════════
function approveCard(cardId, name) {
  const el = document.getElementById(cardId);
  if (!el) return;
  el.style.transition = 'opacity 0.3s, transform 0.3s';
  el.style.opacity = '0'; el.style.transform = 'translateX(20px)';
  setTimeout(() => el.remove(), 310);
  toast('✓', name + ' approved — draft ready', 'tg');
}
function skipCard(cardId, name) {
  const el = document.getElementById(cardId);
  if (!el) return;
  el.style.transition = 'opacity 0.3s';
  el.style.opacity = '0';
  setTimeout(() => el.remove(), 310);
  toast('→', name + ' skipped', 'tc');
}

// ══════════════════════════════════════════
// PROSPECT DETAIL DRAWER
// ══════════════════════════════════════════
function openPD(id) {
  const p = PROSPECTS[id];
  if (!p) return;
  currentPD = id;
  document.getElementById('pd-av').textContent = p.av;
  document.getElementById('pd-av').className = 'pd-av' + (p.cls ? ' ' + p.cls : '');
  document.getElementById('pd-name').textContent = p.name;
  document.getElementById('pd-role').textContent = p.role;
  document.getElementById('pd-first').value = p.first;
  document.getElementById('pd-last').value = p.last;
  document.getElementById('pd-email').value = p.email;
  document.getElementById('pd-email').dataset.website = p.website;
  document.getElementById('pd-email').dataset.firstname = p.first;
  document.getElementById('pd-company').value = p.company;
  document.getElementById('pd-industry').textContent = p.industry;
  document.getElementById('pd-size').textContent = p.size;
  document.getElementById('pd-about').textContent = p.about;
  updateGenBadge();
  document.getElementById('pd-backdrop').classList.add('open');
  document.getElementById('pd-panel').classList.add('open');
}
function closePD() {
  document.getElementById('pd-backdrop').classList.remove('open');
  document.getElementById('pd-panel').classList.remove('open');
  currentPD = null;
}
function approveFromPD() {
  if (currentPD) approveCard('pc-' + currentPD, PROSPECTS[currentPD].name);
  closePD();
}
function skipFromPD() {
  if (currentPD) skipCard('pc-' + currentPD, PROSPECTS[currentPD].name);
  closePD();
}

// ── Email generation ──
function updateGenBadge() {
  const email = document.getElementById('pd-email').value;
  const badge = document.getElementById('pd-gen-badge');
  if (!badge) return;
  if (!email.trim()) {
    badge.textContent = 'No email found — Generate';
    badge.className = 'gen-badge empty';
  } else {
    badge.textContent = '';
    badge.className = 'gen-badge';
  }
}
function genEmail() {
  const input = document.getElementById('pd-email');
  const badge = document.getElementById('pd-gen-badge');
  const first = (input.dataset.firstname || '').toLowerCase().trim();
  const domain = (input.dataset.website || '').replace(/^https?:\/\//,'').replace(/^www\./,'').split('/')[0];
  if (!first || !domain) return;
  const generated = first + '@' + domain;
  input.value = generated;
  badge.textContent = '✦ Generated';
  badge.className = 'gen-badge done';
  input.style.borderColor = 'var(--cyan)';
  input.style.boxShadow = '0 0 0 3px rgba(0,212,255,0.12)';
  setTimeout(() => { input.style.borderColor = ''; input.style.boxShadow = ''; }, 1800);
  toast('✦', 'Email generated: ' + generated, 'tc');
}

// ══════════════════════════════════════════
// SEND DRAWER
// ══════════════════════════════════════════
function openSD(type, name, email, subject) {
  sendConfirmed = false;
  document.getElementById('sd-confirm-msg').style.display = 'none';
  document.getElementById('sd-send-btn').textContent = 'Send email →';
  if (type === 'bulk') {
    document.getElementById('sd-title').textContent = 'Send all drafts';
    document.getElementById('sd-sub').textContent = '15 prospects ready';
    document.getElementById('sd-subject').value = '(individual subjects per prospect)';
  } else {
    document.getElementById('sd-title').textContent = name;
    document.getElementById('sd-sub').textContent = email;
    document.getElementById('sd-subject').value = subject;
  }
  document.getElementById('sd-backdrop').classList.add('open');
  document.getElementById('sd-panel').classList.add('open');
}
function closeSD() {
  document.getElementById('sd-backdrop').classList.remove('open');
  document.getElementById('sd-panel').classList.remove('open');
}
function handleSend() {
  if (!sendConfirmed) {
    sendConfirmed = true;
    document.getElementById('sd-confirm-msg').style.display = 'block';
    document.getElementById('sd-send-btn').textContent = 'Confirm send →';
    document.getElementById('sd-send-btn').style.background = 'var(--green)';
  } else {
    const sub = document.getElementById('sd-sub').textContent;
    closeSD();
    toast('✓', 'Sent to ' + sub, 'tg');
  }
}

// ══════════════════════════════════════════
// LINKEDIN
// ══════════════════════════════════════════
function openSequence() {
  // Always open clean — collapse all cards, scroll to top
  document.querySelectorAll('#seq-drawer .seq-card').forEach(c => c.classList.remove('expanded'));
  document.querySelectorAll('#seq-drawer .seq-del-confirm').forEach(d => d.classList.remove('show'));
  document.querySelectorAll('#seq-drawer .seq-subject-reveal').forEach(s => s.classList.remove('open'));
  document.querySelectorAll('#seq-drawer .seq-tog').forEach(t => { if (!t.classList.contains('on')) t.classList.add('on'); });
  const body = document.querySelector('#seq-drawer .seq-body');
  if (body) body.scrollTop = 0;
  document.getElementById('seq-overlay').classList.add('open');
  document.getElementById('seq-drawer').classList.add('open');
}
function closeSeq() {
  document.getElementById('seq-overlay').classList.remove('open');
  document.getElementById('seq-drawer').classList.remove('open');
}
function toggleSeqCard(id) {
  const card = document.getElementById(id);
  const wasExpanded = card.classList.contains('expanded');
  card.classList.toggle('expanded');
  if (!wasExpanded) {
    // Scroll the step row to the top of the drawer body
    setTimeout(() => {
      const stepRow = card.closest('.seq-step');
      const body = document.querySelector('#seq-drawer .seq-body');
      if (stepRow && body) {
        body.scrollTo({ top: stepRow.offsetTop - body.offsetTop - 12, behavior: 'smooth' });
      }
    }, 30);
  }
}
function showDelConfirm(dcId) {
  document.getElementById(dcId).classList.add('show');
}
function hideDelConfirm(dcId) {
  document.getElementById(dcId).classList.remove('show');
}
function removeStep(rowId) {
  const row = document.getElementById(rowId);
  if (!row) return;
  // Animate out: fade + collapse height
  const h = row.offsetHeight;
  row.style.overflow = 'hidden';
  row.style.height = h + 'px';
  row.style.transition = 'height 0.3s ease, opacity 0.25s ease, margin 0.3s ease';
  requestAnimationFrame(() => {
    row.style.opacity = '0';
    row.style.height = '0';
    row.style.marginBottom = '0';
  });
  setTimeout(() => {
    row.remove();
    renumberSteps();
    // Show add btn if under max
    const addRow = document.getElementById('seq-add-row');
    if (addRow) addRow.style.display = 'flex';
    // Ensure last connector is hidden
    updateLastConnector();
  }, 320);
}
function renumberSteps() {
  // Find all step rows in order, reassign numbers 1,2,3...
  const body = document.querySelector('#seq-drawer .seq-body');
  const rows = Array.from(body.querySelectorAll('.seq-step'));
  rows.forEach((row, i) => {
    const numEl = row.querySelector('.seq-step-num');
    if (numEl) numEl.textContent = i + 1;
  });
}
function updateLastConnector() {
  const body = document.querySelector('#seq-drawer .seq-body');
  const connectors = Array.from(body.querySelectorAll('.seq-connector'));
  connectors.forEach((c, i) => {
    c.style.display = (i < connectors.length - 1) ? '' : 'none';
  });
}
function seqToggleThread(togEl, revealId) {
  togEl.classList.toggle('on');
  const reveal = document.getElementById(revealId);
  if (reveal) {
    if (!togEl.classList.contains('on')) {
      reveal.classList.add('open');
    } else {
      reveal.classList.remove('open');
    }
  }
}
function pickChip(el, cardId, group) {
  // Deselect siblings
  const container = el.closest('.seq-chips');
  container.querySelectorAll('.seq-chip').forEach(c => {
    c.classList.remove('sel-type', 'sel-tone');
  });
  // Select this one
  el.classList.add(group === 'type' ? 'sel-type' : 'sel-tone');
  // Update badge in collapsed header
  const badge = document.getElementById(cardId + '-' + group + '-badge');
  if (badge) badge.textContent = el.textContent;
}
let seqStepCount = 3;
function addFollowUp() {
  if (seqStepCount >= 6) {
    toast('—', 'Maximum 6 steps in a sequence', 'tc');
    return;
  }
  seqStepCount++;
  const n = seqStepCount;
  const addRow = document.getElementById('seq-add-row');
  // Show connector on previous last step
  updateLastConnector();
  const stepHTML = `
  <div class="seq-step" id="step${n}row" style="opacity:0;transform:translateY(6px);transition:opacity 0.25s,transform 0.25s;">
    <div class="seq-step-left">
      <div class="seq-step-num sn" id="num${n}">${n}</div>
      <div class="seq-connector" style="display:none;"></div>
    </div>
    <div class="seq-step-body">
      <div class="seq-card" id="sc${n}">
        <div class="seq-card-hdr" onclick="toggleSeqCard('sc${n}')">
          <div class="seq-card-tags">
            <span class="seq-badge type" id="sc${n}-type-badge">Follow-up</span>
            <span class="seq-badge tone" id="sc${n}-tone-badge">Calm &amp; Commercial</span>
            <span class="seq-delay-txt">5 days after step ${n-1}</span>
          </div>
          <span class="seq-card-del" title="Remove step" onclick="event.stopPropagation();showDelConfirm('dc${n}')">
            <svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M2 4h10M5 4V3h4v1M11 4l-.8 8H3.8L3 4"/></svg>
          </span>
          <span class="seq-card-chevron">▼</span>
        </div>
        <div class="seq-del-confirm" id="dc${n}">
          <span class="seq-del-msg">Remove this follow-up?</span>
          <div class="seq-del-btns">
            <button class="btn bs bsm" onclick="hideDelConfirm('dc${n}')" style="font-size:11px;padding:4px 10px;">Cancel</button>
            <button class="btn bsm" onclick="removeStep('step${n}row')" style="font-size:11px;padding:4px 10px;background:rgba(255,77,109,0.15);border:1px solid rgba(255,77,109,0.3);color:#ff4d6d;">Remove</button>
          </div>
        </div>
        <div class="seq-editor">
          <div>
            <div class="seq-field-lbl">Delay after previous step</div>
            <div class="seq-delay-row">
              <input class="seq-delay-input" type="number" value="5" min="1" max="365">
              <span class="seq-delay-unit">days</span>
            </div>
          </div>
          <div>
            <div class="seq-field-lbl">Message type</div>
            <div class="seq-chips" data-card="sc${n}" data-group="type">
              <span class="seq-chip" onclick="pickChip(this,'sc${n}','type')">Value drop</span>
              <span class="seq-chip sel-type" onclick="pickChip(this,'sc${n}','type')">Follow-up</span>
              <span class="seq-chip" onclick="pickChip(this,'sc${n}','type')">Check-in</span>
              <span class="seq-chip" onclick="pickChip(this,'sc${n}','type')">Post-meeting</span>
            </div>
          </div>
          <div>
            <div class="seq-field-lbl">Tone</div>
            <div class="seq-chips" data-card="sc${n}" data-group="tone">
              <span class="seq-chip sel-tone" onclick="pickChip(this,'sc${n}','tone')">Calm &amp; Commercial</span>
              <span class="seq-chip" onclick="pickChip(this,'sc${n}','tone')">Direct &amp; Confident</span>
              <span class="seq-chip" onclick="pickChip(this,'sc${n}','tone')">Light Touch</span>
            </div>
          </div>
          <div>
            <div class="seq-toggle-row">
              <div class="seq-toggle-info">
                <div class="seq-toggle-lbl">Reply to original Gmail thread</div>
                <div class="seq-toggle-sub">Keeps context — recommended</div>
              </div>
              <div class="seq-tog on" id="tog${n}" onclick="seqToggleThread(this,'sr${n}')"></div>
            </div>
            <div class="seq-subject-reveal" id="sr${n}">
              <input class="seq-input" placeholder="Enter a new subject line" style="margin-top:0;">
            </div>
          </div>
          <div>
            <div class="seq-field-lbl">Body copy</div>
            <textarea class="seq-input" rows="4" placeholder="Write your follow-up message…"></textarea>
          </div>
          <div>
            <div class="seq-field-lbl">Attachment</div>
            <div class="seq-attach">
              <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"><path d="M13.5 8.5l-6 6a4 4 0 01-5.66-5.66l7-7a2.5 2.5 0 013.54 3.54l-7 7a1 1 0 01-1.42-1.42l6-6"/></svg>
              <div><div class="seq-attach-lbl">Add attachment</div><div class="seq-attach-sub">Optional — different from previous step</div></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>`;
  addRow.insertAdjacentHTML('beforebegin', stepHTML);
  requestAnimationFrame(() => {
    const newRow = document.getElementById(`step${n}row`);
    if (newRow) { newRow.style.opacity='1'; newRow.style.transform='translateY(0)'; }
  });
  setTimeout(() => {
    toggleSeqCard(`sc${n}`);
    // scroll new step into view
    const newRow = document.getElementById(`step${n}row`);
    if (newRow) newRow.scrollIntoView({behavior:'smooth', block:'nearest'});
  }, 60);
  if (seqStepCount >= 6) addRow.style.display = 'none';
  updateLastConnector();
}
function saveSeq() {
  closeSeq();
  toast('✓', 'Sequence saved', 'tc');
}
function openLI() {
  document.getElementById('li-input').value = liMsg;
  document.getElementById('li-backdrop').classList.add('open');
}
function closeLI() {
  document.getElementById('li-backdrop').classList.remove('open');
}
function saveLI() {
  liMsg = document.getElementById('li-input').value;
  closeLI();
  toast('✓', 'LinkedIn message saved', 'tc');
}
function copyLI(first, company) {
  const merged = liMsg.replace(/{{first_name}}/g, first || 'there').replace(/{{company}}/g, company || 'your company');
  const copied = document.getElementById('li-copied');
  if (navigator.clipboard) {
    navigator.clipboard.writeText(merged).catch(() => {});
  }
  copied.classList.add('show');
  setTimeout(() => copied.classList.remove('show'), 2500);
}
function filterLI(el) {
  document.querySelectorAll('.fpill').forEach(p => p.classList.remove('on'));
  el.classList.add('on');
}

// ══════════════════════════════════════════
// CAMPAIGN SWITCHER
// ══════════════════════════════════════════
function setCampaign(name, count, seq) {
  document.getElementById('ch-name').textContent = name;
  document.getElementById('bc-name').textContent = name;
  document.getElementById('ch-count').textContent = count + ' prospects';
  document.getElementById('ch-seq').textContent = seq;
}

// ══════════════════════════════════════════
// TOAST
// ══════════════════════════════════════════
function toast(icon, text, cls) {
  const z = document.getElementById('tz');
  const e = document.createElement('div');
  e.className = 'tst ' + (cls || 'tc');
  e.innerHTML = '<span>' + icon + '</span><span>' + text + '</span>';
  z.appendChild(e);
  setTimeout(() => { e.style.transition = 'opacity 0.2s'; e.style.opacity = '0'; setTimeout(() => e.remove(), 200); }, 3200);
}
