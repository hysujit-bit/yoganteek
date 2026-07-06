/* ═══════════════════════════════════════════════════════════════════════════
   Booking Modal – form → Calendly flow (popup version of Yoganteek_ad_enquiry)
   ═══════════════════════════════════════════════════════════════════════════ */

(function () {
  /* ── Load Calendly assets if not already present ───────────────────── */
  if (!document.querySelector('link[href*="calendly.com/assets/external/widget.css"]')) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://assets.calendly.com/assets/external/widget.css';
    document.head.appendChild(link);
  }
  if (!document.querySelector('script[src*="calendly.com/assets/external/widget.js"]')) {
    const script = document.createElement('script');
    script.src = 'https://assets.calendly.com/assets/external/widget.js';
    script.type = 'text/javascript';
    script.async = true;
    document.head.appendChild(script);
  }

  /* ── Inject styles ─────────────────────────────────────────────────── */
  const css = document.createElement('style');
  css.textContent = `
/* ── Modal overlay ── */
#booking-modal-overlay {
  position: fixed; inset: 0; z-index: 9999;
  display: flex; align-items: center; justify-content: center;
  opacity: 0; pointer-events: none;
  transition: opacity .35s ease;
}
#booking-modal-overlay.open { opacity: 1; pointer-events: auto; }

#booking-modal-backdrop {
  position: absolute; inset: 0;
  background: rgba(44,44,44,.55);
  backdrop-filter: blur(6px); -webkit-backdrop-filter: blur(6px);
}

#booking-modal {
  position: relative; z-index: 1;
  width: 94%; max-width: 680px;
  max-height: 92vh; overflow-y: auto;
  background: #fff; border-radius: 20px;
  box-shadow: 0 24px 80px rgba(0,0,0,.22);
  transform: translateY(24px) scale(.97);
  transition: transform .35s cubic-bezier(.4,0,.2,1);
  -webkit-overflow-scrolling: touch;
}
#booking-modal-overlay.open #booking-modal {
  transform: translateY(0) scale(1);
}

/* scrollbar */
#booking-modal::-webkit-scrollbar { width: 5px; }
#booking-modal::-webkit-scrollbar-thumb { background: #ccc; border-radius: 10px; }

/* ── Close button ── */
#booking-modal-close {
  position: sticky; top: 0; float: right; z-index: 10;
  width: 36px; height: 36px; margin: 12px 12px 0 0;
  border: none; border-radius: 50%; cursor: pointer;
  background: rgba(0,0,0,.06); color: #555;
  display: flex; align-items: center; justify-content: center;
  transition: background .2s;
}
#booking-modal-close:hover { background: rgba(0,0,0,.12); }

/* ── Inner content ── */
#booking-modal-content { padding: 28px 28px 32px; }

/* ── Step indicator ── */
.bm-step-row { display: flex; align-items: center; justify-content: center; gap: 8px; margin-bottom: 6px; }
.bm-step-num {
  width: 28px; height: 28px; border-radius: 50%;
  background: #5A4A72; color: #fff; font-size: 12px; font-weight: 700;
  display: flex; align-items: center; justify-content: center;
}
.bm-step-dash { color: #ccc; }
.bm-step-label { font-size: 14px; font-weight: 600; color: #5A4A72; }
.bm-step-sub { text-align: center; font-size: 11px; color: #888; margin-bottom: 12px; }
.bm-back-btn {
  display: block; margin: 0 auto 12px; background: none; border: none;
  font-size: 12px; color: #5A4A72; text-decoration: underline; cursor: pointer;
}
.bm-back-btn:hover { color: #4a3c62; }

/* ── Form grid ── */
.bm-form-grid { display: grid; grid-template-columns: 1fr; gap: 18px; }
@media (min-width: 640px) { .bm-form-grid { grid-template-columns: 1fr 1fr; gap: 18px 32px; } }

.bm-field-group { display: flex; flex-direction: column; }
.bm-field-group.full-span { grid-column: 1 / -1; }

.bm-label {
  font-size: 11px; font-weight: 600; color: #555;
  text-transform: uppercase; letter-spacing: .8px; margin-bottom: 5px;
}
.bm-label .req { color: #e57373; }

.bm-input, .bm-select, .bm-textarea {
  width: 100%; padding: 11px 14px; border-radius: 10px;
  border: 1.5px solid #e0dce6; background: #fafafa;
  font-size: 14px; color: #333; font-family: 'DM Sans', sans-serif;
  outline: none; transition: all .2s;
}
.bm-input:focus, .bm-select:focus, .bm-textarea:focus {
  background: #fff; border-color: #5A4A72;
  box-shadow: 0 0 0 3px rgba(90,74,114,.12);
}
.bm-input::placeholder, .bm-textarea::placeholder { color: #aaa; }
.bm-textarea { resize: none; min-height: 72px; }

/* custom select arrow */
.bm-select {
  appearance: none; -webkit-appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23888' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E");
  background-repeat: no-repeat; background-position: right 12px center;
  padding-right: 32px;
}

/* error */
.bm-field-error { border-color: #e57373 !important; background: #fff5f5 !important; }
.bm-error-msg { color: #c62828; font-size: 11px; margin-top: 4px; display: none; font-weight: 500; }
.bm-error-msg.show { display: block; }

/* ── Submit button ── */
.bm-submit-btn {
  display: inline-flex; align-items: center; justify-content: center; gap: 8px;
  width: 100%; padding: 13px 24px; border: none; border-radius: 12px;
  background: #5A4A72; color: #fff; font-size: 14px; font-weight: 600;
  letter-spacing: .3px; cursor: pointer;
  box-shadow: 0 4px 18px rgba(90,74,114,.28);
  transition: all .25s;
}
.bm-submit-btn:hover:not(:disabled) { background: #4a3c62; transform: translateY(-1px); box-shadow: 0 6px 24px rgba(90,74,114,.35); }
.bm-submit-btn:disabled { opacity: .7; cursor: not-allowed; }
.bm-submit-btn .bm-spinner { display: none; animation: spin .7s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

.bm-privacy { text-align: center; font-size: 11px; color: #999; margin-top: 12px; }

/* ── Calendly container ── */
#bm-calendly-widget { min-height: 600px; height: 600px; }

/* ── Mobile tweaks ── */
@media (max-width: 639px) {
  #booking-modal { width: 100%; max-height: 100vh; border-radius: 0; min-height: 100vh; }
  #booking-modal-content { padding: 16px 16px 24px; }
  .bm-form-grid { gap: 14px; }
  .bm-input, .bm-select, .bm-textarea { padding: 12px 14px; font-size: 16px; } /* prevent iOS zoom */
  #bm-calendly-widget { min-height: 500px; height: 500px; }
}
  `;
  document.head.appendChild(css);

  /* ── Inject HTML ───────────────────────────────────────────────────── */
  const modal = document.createElement('div');
  modal.id = 'booking-modal-overlay';
  modal.innerHTML = `
    <div id="booking-modal-backdrop"></div>
    <div id="booking-modal">
      <button id="booking-modal-close" aria-label="Close">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
      <div id="booking-modal-content">

        <!-- Step 1 -->
        <div id="bm-step-1">
          <div style="text-align:center;margin-bottom:18px;">
            <h3 style="font-family:'Cormorant Garamond',serif;font-size:22px;font-weight:600;color:#2D2A3E;margin-bottom:4px;">Begin Your Wellness Journey</h3>
            <p style="font-size:12px;color:#888;">Fill in your details below to get started</p>
          </div>

          <form id="bm-consultation-form" novalidate>
            <div class="bm-form-grid">
              <div class="bm-field-group">
                <label class="bm-label" for="bm-form-name">Name <span class="req">*</span></label>
                <input id="bm-form-name" type="text" placeholder="Full Name" class="bm-input" autocomplete="name">
                <p class="bm-error-msg" id="bm-err-name">Please enter your full name.</p>
              </div>
              <div class="bm-field-group">
                <label class="bm-label" for="bm-form-email">Email Address <span class="req">*</span></label>
                <input id="bm-form-email" type="email" placeholder="Email Address" class="bm-input" autocomplete="email">
                <p class="bm-error-msg" id="bm-err-email">Please enter a valid email address.</p>
              </div>
              <div class="bm-field-group">
                <label class="bm-label" for="bm-form-phone">Phone Number <span class="req">*</span></label>
                <input id="bm-form-phone" type="tel" placeholder="Phone Number" class="bm-input" autocomplete="tel">
                <p class="bm-error-msg" id="bm-err-phone">Please enter your phone number.</p>
              </div>
              <div class="bm-field-group">
                <label class="bm-label" for="bm-form-goal">Primary Health Goal <span class="req">*</span></label>
                <select id="bm-form-goal" class="bm-select">
                  <option value="">— Select your goal —</option>
                  <option value="stress">Stress, Sleep &amp; Anxiety</option>
                  <option value="energy">Focus &amp; Energy</option>
                  <option value="weight">Weight Management</option>
                  <option value="pain">Pain Relief</option>
                  <option value="hormonal">Hormonal Balance</option>
                  <option value="general">General Wellness</option>
                </select>
                <p class="bm-error-msg" id="bm-err-goal">Please select a health goal.</p>
              </div>
              <div class="bm-field-group">
                <label class="bm-label" for="bm-form-concern">Select Your Concern</label>
                <select id="bm-form-concern" class="bm-select">
                  <option value="">— Select a concern —</option>
                  <option value="fatty-liver">Fatty Liver Issue</option>
                  <option value="weight">Weight Management</option>
                  <option value="pcos-pcod">Gynecology Disorder (PCOS &amp; PCOD)</option>
                  <option value="anxiety-stress">Anxiety &amp; Stress Management</option>
                  <option value="diabetes">Diabetes &amp; Sugar Control</option>
                  <option value="sleep">Sleeping Disorder</option>
                </select>
              </div>
              <div class="bm-field-group full-span">
                <label class="bm-label" for="bm-form-message">Please Describe the Issues</label>
                <textarea id="bm-form-message" rows="3" placeholder="Describe your health concerns..." class="bm-textarea"></textarea>
              </div>
            </div>

            <div style="margin-top:22px;">
              <button type="submit" class="bm-submit-btn" id="bm-form-submit-btn">
                <span id="bm-btn-text">Schedule My Consultation</span>
                <span id="bm-btn-arrow">&rarr;</span>
                <svg id="bm-btn-spinner" class="bm-spinner" width="20" height="20" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" opacity=".25"/><path d="M4 12a8 8 0 018-8v8H4z" fill="currentColor" opacity=".75"/></svg>
              </button>
              <p class="bm-privacy">&#128274; Your information is 100% private. No spam, ever.</p>
            </div>
          </form>
        </div>

        <!-- Step 2 -->
        <div id="bm-step-2" style="display:none;">
          <div class="bm-step-row">
            <span class="bm-step-num">1</span>
            <span class="bm-step-dash">&mdash;</span>
            <span class="bm-step-num">2</span>
            <span class="bm-step-label" style="margin-left:4px;">Schedule Your Slot</span>
          </div>
          <p class="bm-step-sub">Pick a date &amp; time that works best for you</p>
          <button type="button" class="bm-back-btn" id="bm-back-to-form">&larr; Go back to edit details</button>
          <div id="bm-calendly-widget"></div>
        </div>

      </div>
    </div>`;
  document.body.appendChild(modal);

  /* ── Elements ──────────────────────────────────────────────────────── */
  const overlay    = document.getElementById('booking-modal-overlay');
  const backdrop   = document.getElementById('booking-modal-backdrop');
  const modalEl    = document.getElementById('booking-modal');
  const closeBtn   = document.getElementById('booking-modal-close');
  const step1      = document.getElementById('bm-step-1');
  const step2      = document.getElementById('bm-step-2');
  const form       = document.getElementById('bm-consultation-form');
  const backBtn    = document.getElementById('bm-back-to-form');

  /* ── Open / Close ──────────────────────────────────────────────────── */
  function openModal() {
    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
    resetForm();
  }
  function closeModal() {
    overlay.classList.remove('open');
    document.body.style.overflow = '';
  }
  window.openBookingModal = openModal;

  closeBtn.addEventListener('click', closeModal);
  backdrop.addEventListener('click', closeModal);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });

  /* swipe-down to close on mobile */
  let touchStartY = 0;
  modalEl.addEventListener('touchstart', (e) => { touchStartY = e.touches[0].clientY; }, { passive: true });
  modalEl.addEventListener('touchend', (e) => {
    const dy = e.changedTouches[0].clientY - touchStartY;
    if (dy > 80 && modalEl.scrollTop <= 0) closeModal();
  }, { passive: true });

  /* ── Form helpers ──────────────────────────────────────────────────── */
  function showError(input, msg) { input.classList.add('bm-field-error'); msg.classList.add('show'); }
  function clearError(input, msg) { input.classList.remove('bm-field-error'); msg.classList.remove('show'); }

  /* live clear */
  [
    ['bm-form-name','bm-err-name'],
    ['bm-form-email','bm-err-email'],
    ['bm-form-goal','bm-err-goal'],
    ['bm-form-phone','bm-err-phone'],
  ].forEach(([iid, eid]) => {
    const inp = document.getElementById(iid);
    const err = document.getElementById(eid);
    if (inp && err) {
      inp.addEventListener('input',  () => clearError(inp, err));
      inp.addEventListener('change', () => clearError(inp, err));
    }
  });

  /* ── Reset form state ──────────────────────────────────────────────── */
  function resetForm() {
    step1.style.display = '';
    step2.style.display = 'none';
    form.reset();
    const btn     = document.getElementById('bm-form-submit-btn');
    const btnText = document.getElementById('bm-btn-text');
    const btnArr  = document.getElementById('bm-btn-arrow');
    const spinner = document.getElementById('bm-btn-spinner');
    btn.disabled = false;
    btnText.textContent = 'Schedule My Consultation';
    btnArr.style.display = '';
    spinner.style.display = 'none';
    /* clear errors */
    form.querySelectorAll('.bm-field-error').forEach(el => el.classList.remove('bm-field-error'));
    form.querySelectorAll('.bm-error-msg.show').forEach(el => el.classList.remove('show'));
  }

  /* ── Submit ────────────────────────────────────────────────────────── */
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    let valid = true;

    const nameEl  = document.getElementById('bm-form-name');
    const errName = document.getElementById('bm-err-name');
    if (!nameEl.value.trim()) { showError(nameEl, errName); valid = false; } else clearError(nameEl, errName);

    const emailEl  = document.getElementById('bm-form-email');
    const errEmail = document.getElementById('bm-err-email');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailEl.value.trim())) { showError(emailEl, errEmail); valid = false; } else clearError(emailEl, errEmail);

    const goalEl  = document.getElementById('bm-form-goal');
    const errGoal = document.getElementById('bm-err-goal');
    if (!goalEl.value) { showError(goalEl, errGoal); valid = false; } else clearError(goalEl, errGoal);

    const phoneEl  = document.getElementById('bm-form-phone');
    const errPhone = document.getElementById('bm-err-phone');
    if (!phoneEl.value.trim()) { showError(phoneEl, errPhone); valid = false; } else clearError(phoneEl, errPhone);

    if (!valid) return;

    /* loading state */
    const btn     = document.getElementById('bm-form-submit-btn');
    const btnText = document.getElementById('bm-btn-text');
    const btnArr  = document.getElementById('bm-btn-arrow');
    const spinner = document.getElementById('bm-btn-spinner');
    btn.disabled = true;
    btnText.textContent = 'Submitting…';
    btnArr.style.display = 'none';
    spinner.style.display = '';

    /* collect data */
    const fd = {
      name:       nameEl.value.trim(),
      email:      emailEl.value.trim(),
      phone:      phoneEl.value.trim(),
      health_goal: goalEl.value,
      concern:    document.getElementById('bm-form-concern').value,
      message:    document.getElementById('bm-form-message').value.trim()
    };

    /* API call (fire-and-forget) */
    fetch('https://yoganteek-api.onrender.com/api/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(fd)
    })
    .then(r => r.json())
    .then(d => console.log('Lead saved:', d))
    .catch(err => { console.error('API error, saving locally:', err); localStorage.setItem('yoganteek_lead', JSON.stringify(fd)); });

    /* transition to Calendly */
    setTimeout(() => {
      step1.style.display = 'none';
      step2.style.display = '';

      /* check if Calendly is loaded, wait if not */
      function initCalendly() {
        if (typeof Calendly !== 'undefined' && Calendly.initInlineWidget) {
          Calendly.initInlineWidget({
            url: 'https://calendly.com/jspyoga1986/30min?email=' + encodeURIComponent(fd.email) + '&name=' + encodeURIComponent(fd.name),
            parentElement: document.getElementById('bm-calendly-widget')
          });
        } else {
          setTimeout(initCalendly, 200);
        }
      }
      initCalendly();
    }, 800);
  });

  /* ── Back to form ──────────────────────────────────────────────────── */
  backBtn.addEventListener('click', () => {
    step2.style.display = 'none';
    step1.style.display = '';
    const btn     = document.getElementById('bm-form-submit-btn');
    const btnText = document.getElementById('bm-btn-text');
    const btnArr  = document.getElementById('bm-btn-arrow');
    const spinner = document.getElementById('bm-btn-spinner');
    btn.disabled = false;
    btnText.textContent = 'Schedule My Consultation';
    btnArr.style.display = '';
    spinner.style.display = 'none';
  });
})();
