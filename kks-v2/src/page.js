// Inner pages: reveals, pinned steps, FAQ, pricing toggles, filters, demo forms.
import './pages.css';
import { gsap, ScrollTrigger, SplitText, reduced, simple, $, $$, scrollToEl } from './common.js';

/* ---------------- reveals ---------------- */
if (!reduced) {
  const intro = gsap.timeline({ delay: 0.1, defaults: { ease: 'power3.out' } });
  const ht = SplitText.create('.ph-title span', { type: 'words', mask: 'words', wordsClass: 'w' });
  const has = (s) => $$(s);
  intro.from('.ph .crumbs, .ph .eyebrow', { y: 18, opacity: 0, duration: 0.7, stagger: 0.08 })
    .from(ht.words, { yPercent: 115, duration: 1.05, ease: 'power4.out', stagger: 0.05 }, '-=.45');
  if (has('.ph .lead, .ph .ctas').length) intro.from(has('.ph .lead, .ph .ctas'), { y: 26, opacity: 0, duration: 0.8, stagger: 0.1 }, '-=.7');
  if ($('.ph-visual')) intro.from('.ph-visual', { y: 50, opacity: 0, scale: 0.96, duration: 1.1 }, '-=.9');
  $$('h2.split').forEach((h) => {
    const s = SplitText.create(h, { type: 'words', mask: 'words', wordsClass: 'w' });
    gsap.from(s.words, { yPercent: 110, duration: 1, ease: 'power4.out', stagger: 0.04, scrollTrigger: { trigger: h, start: 'top 88%', toggleActions: 'play none none reverse' } });
  });
  gsap.utils.toArray('main .sec .label, main .sec .head-split .lead, [data-reveal], .why-copy .lead, .cta .ctas').forEach((el) => {
    gsap.from(el, { y: 40, opacity: 0, duration: 0.9, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 92%', toggleActions: 'play none none reverse' } });
  });
  $$('[data-stagger]').forEach((g) => gsap.from(g.children, { y: 50, opacity: 0, duration: 0.85, ease: 'power3.out', stagger: 0.07, scrollTrigger: { trigger: g, start: 'top 88%' } }));
  // hero background drift
  gsap.to('.ph-bg .o1', { yPercent: 30, xPercent: -10, ease: 'none', scrollTrigger: { trigger: '.ph', start: 'top top', end: 'bottom top', scrub: true } });
  if ($('.ph-visual')) gsap.to('.ph-visual', { y: -60, ease: 'none', scrollTrigger: { trigger: '.ph', start: 'top top', end: 'bottom top', scrub: true } });
}

/* ---------------- live queue card (service heroes) ---------------- */
const queue = $('[data-queue]');
if (queue) {
  $$('.st', queue).forEach((el, i) => setTimeout(() => { el.textContent = el.dataset.st; el.classList.add('done'); }, reduced ? 0 : 1300 + i * 550));
  queue.classList.add('go');
}

/* ---------------- pinned step-by-step ---------------- */
$$('[data-pinsteps]').forEach((sec) => {
  const items = $$('.ps-list li', sec), cards = $$('.ps-card', sec), bar = $('.ps-progress span', sec), n = cards.length;
  const set = (idx) => {
    items.forEach((li, i) => li.classList.toggle('on', i === idx));
    cards.forEach((c, i) => { c.classList.toggle('on', i === idx); c.classList.toggle('past', i < idx); });
  };
  if (simple) {
    cards.forEach((c) => c.classList.add('on'));
    if (!reduced) cards.forEach((c) => gsap.from(c, { y: 50, opacity: 0, duration: 0.8, ease: 'power3.out', scrollTrigger: { trigger: c, start: 'top 88%' } }));
    return;
  }
  ScrollTrigger.create({ trigger: sec, start: 'top top', end: 'bottom bottom', onUpdate: (s) => { set(Math.min(n - 1, Math.floor(s.progress * n))); bar.style.width = s.progress * 100 + '%'; } });
  items.forEach((li, i) => li.addEventListener('click', () => {
    const st = sec.offsetTop + ((sec.offsetHeight - innerHeight) * (i + 0.5)) / n;
    scrollToEl(st, 0);
  }));
});

/* ---------------- 3D layer stack (technology hero) ---------------- */
const stack = $('[data-stack3d]');
if (stack) {
  if (!reduced) {
    gsap.fromTo(stack, { '--sp': 0.15 }, { '--sp': 1, duration: 1.6, ease: 'power3.out', delay: 0.5 });
    gsap.to(stack, { '--rot': 25, ease: 'none', scrollTrigger: { trigger: '.ph', start: 'top top', end: 'bottom top', scrub: true } });
    if (!simple) stack.parentElement.addEventListener('pointermove', (e) => { const r = stack.getBoundingClientRect(); gsap.to(stack, { '--tx': ((e.clientY - r.top) / r.height - 0.5) * -10, '--ty': ((e.clientX - r.left) / r.width - 0.5) * 12, duration: 0.6 }); });
  } else stack.style.setProperty('--sp', 1);
}

/* ---------------- stacking cards (why us) ---------------- */
const pcards = $$('.pcard');
if (!simple) pcards.forEach((c, i) => { if (i < pcards.length - 1) gsap.fromTo(c, { scale: 1, filter: 'brightness(1)' }, { scale: 0.94, filter: 'brightness(.9)', ease: 'none', scrollTrigger: { trigger: pcards[i + 1], start: 'top bottom', end: 'top 30%', scrub: true } }); });

/* ---------------- task flow line ---------------- */
const flow = $('[data-flow]');
if (flow && !reduced) {
  gsap.fromTo(flow, { '--p': 0 }, { '--p': 1, ease: 'none', scrollTrigger: { trigger: flow, start: 'top 85%', end: 'top 35%', scrub: 0.6, onUpdate: (s) => $$('li', flow).forEach((li, i, a) => li.classList.toggle('on', s.progress >= i / (a.length - 1) - 0.02)) } });
} else if (flow) { flow.style.setProperty('--p', 1); $$('li', flow).forEach((li) => li.classList.add('on')); }

/* ---------------- before/after bars ---------------- */
$$('.ba-row').forEach((row) => {
  if (reduced) return row.classList.add('in');
  ScrollTrigger.create({ trigger: row, start: 'top 85%', once: true, onEnter: () => row.classList.add('in') });
});

/* ---------------- tilt ---------------- */
if (!simple) $$('.tilt').forEach((el) => {
  el.addEventListener('pointermove', (e) => { const r = el.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5; el.style.transform = `perspective(900px) rotateX(${-y * 7}deg) rotateY(${x * 9}deg) translateY(-4px)`; });
  el.addEventListener('pointerleave', () => (el.style.transform = ''));
});

/* ---------------- FAQ accordion ---------------- */
$$('[data-faq] button').forEach((btn) => {
  const panel = document.getElementById(btn.getAttribute('aria-controls'));
  btn.addEventListener('click', () => {
    const open = btn.getAttribute('aria-expanded') !== 'true';
    btn.setAttribute('aria-expanded', open);
    btn.closest('.qa').classList.toggle('open', open);
    if (open) { panel.hidden = false; if (!reduced) gsap.from(panel, { height: 0, opacity: 0, duration: 0.45, ease: 'power3.out', clearProps: 'height,opacity', onComplete: () => ScrollTrigger.refresh() }); else ScrollTrigger.refresh(); }
    else if (!reduced) gsap.to(panel, { height: 0, opacity: 0, duration: 0.35, ease: 'power2.in', onComplete: () => { panel.hidden = true; gsap.set(panel, { clearProps: 'height,opacity' }); ScrollTrigger.refresh(); } });
    else { panel.hidden = true; ScrollTrigger.refresh(); }
  });
});

/* ---------------- pricing toggles ---------------- */
const plans = $$('.plan[data-m]');
if (plans.length) {
  let bill = 'a', hours = 160;
  const money = (n) => '$' + n.toFixed(2);
  const render = () => plans.forEach((p) => {
    const rate = +p.dataset[bill], el = $('[data-rate]', p);
    const from = parseFloat(el.textContent.slice(1)) || rate, o = { v: from };
    gsap.to(o, { v: rate, duration: reduced ? 0 : 0.5, ease: 'power2.out', onUpdate: () => (el.textContent = money(o.v)) });
    $('[data-est]', p).textContent = `≈ $${Math.round(rate * hours).toLocaleString('en-US')} / month at ${hours} hrs${bill === 'a' ? ' · billed annually' : ''}`;
  });
  const seg = (attr, cb) => $$(`[data-${attr}]`).forEach((b) => b.addEventListener('click', () => {
    $$(`[data-${attr}]`).forEach((x) => x.setAttribute('aria-pressed', x === b)); cb(b.dataset[attr]); render();
  }));
  seg('bill', (v) => (bill = v)); seg('hours', (v) => (hours = +v));
}

/* ---------------- filters: experts ---------------- */
$$('[data-filter-group]').forEach((g) => {
  const list = $(`[data-filter-list="${g.dataset.filterGroup}"]`), empty = list.parentElement.querySelector('[data-empty]');
  $$('button', g).forEach((b) => b.addEventListener('click', () => {
    $$('button', g).forEach((x) => { x.classList.toggle('on', x === b); x.setAttribute('aria-pressed', x === b); });
    const f = b.dataset.f; let shown = 0;
    $$('[data-team]', list).forEach((el) => { const on = f === 'all' || el.dataset.team === f; el.hidden = !on; if (on) { shown++; if (!reduced) gsap.fromTo(el, { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.45, delay: shown * 0.04 }); } });
    if (empty) empty.hidden = shown > 0;
    ScrollTrigger.refresh();
  }));
});

/* ---------------- careers: role filters ---------------- */
const roles = $$('li.role');
if (roles.length) {
  const q = $('[data-role-search]'), sels = $$('[data-role-f]'), count = $('[data-role-count]'), none = $('[data-role-empty]');
  const apply = () => {
    const term = q.value.trim().toLowerCase(); let n = 0;
    roles.forEach((r) => {
      const v = r.dataset.v.split('|');
      const ok = (!term || v.join(' ').toLowerCase().includes(term)) && sels.every((s) => !s.value || v[+s.dataset.roleF] === s.value);
      r.hidden = !ok; n += ok;
    });
    count.textContent = `${n} role${n === 1 ? '' : 's'}`; none.hidden = n > 0; ScrollTrigger.refresh();
  };
  q.addEventListener('input', apply); sels.forEach((s) => s.addEventListener('change', apply));
  $$('[data-apply]').forEach((a) => a.addEventListener('click', () => { const s = $('[data-form="apply"] select[name="role"]'); s.value = a.dataset.apply; s.dispatchEvent(new Event('change')); }));
}

/* ---------------- demo forms: validation + fake success ---------------- */
const MSG = { valueMissing: 'This field is required.', typeMismatch: 'Please enter a valid value.', tooShort: 'Please add a little more detail.' };
const errFor = (el) => (el.type === 'email' && el.validity.typeMismatch ? 'Please enter a valid email address.' : el.type === 'url' && el.validity.typeMismatch ? 'Please enter a full URL starting with https://' : el.type === 'checkbox' ? 'Please tick this box to continue.' : el.type === 'file' ? 'Please attach your resume.' : MSG[Object.keys(MSG).find((k) => el.validity[k])] || 'Please check this field.');
function showErr(el, msg) {
  const wrap = el.closest('label') || el.parentElement; let e = wrap.querySelector('.err');
  el.setAttribute('aria-invalid', msg ? 'true' : 'false');
  if (!msg) { e && e.remove(); return; }
  if (!e) { e = document.createElement('span'); e.className = 'err'; e.id = (el.name || 'f') + '-err-' + Math.random().toString(36).slice(2, 6); wrap.appendChild(e); el.setAttribute('aria-describedby', e.id); }
  e.textContent = msg;
}
$$('form[data-form]').forEach((form) => {
  const key = form.dataset.form, ok = $(`[data-success="${key}"]`), note = $('.form-note', form);
  const fields = $$('input, select, textarea', form).filter((el) => el.name);
  const group = $$('input[name="svc"]', form);
  const checkGroup = () => { if (!group.length) return true; const fs = group[0].closest('fieldset'); const good = group.some((c) => c.checked); fs.classList.toggle('bad', !good); let e = $('.err', fs); if (!good && !e) { e = document.createElement('span'); e.className = 'err'; e.textContent = 'Pick at least one service.'; fs.appendChild(e); } if (good && e) e.remove(); return good; };
  fields.forEach((el) => el.addEventListener(el.type === 'checkbox' || el.tagName === 'SELECT' || el.type === 'file' ? 'change' : 'blur', () => { if (el.name === 'svc') return checkGroup(); if (el.getAttribute('aria-invalid') || el.value) showErr(el, el.checkValidity() ? '' : errFor(el)); }));
  fields.forEach((el) => el.addEventListener('input', () => el.getAttribute('aria-invalid') === 'true' && el.checkValidity() && showErr(el, '')));
  const file = $('input[type=file]', form);
  if (file) {
    const ui = file.nextElementSibling, lbl = file.closest('label');
    file.addEventListener('change', () => (ui.innerHTML = file.files[0] ? `<b>${file.files[0].name.replace(/</g, '&lt;')}</b> attached` : '<b>Choose a file</b> or drop it here'));
    ['dragenter', 'dragover'].forEach((t) => lbl.addEventListener(t, () => lbl.classList.add('drag')));
    ['dragleave', 'drop'].forEach((t) => lbl.addEventListener(t, () => lbl.classList.remove('drag')));
  }
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    let first = null;
    fields.filter((el) => el.name !== 'svc').forEach((el) => { const bad = !el.checkValidity(); showErr(el, bad ? errFor(el) : ''); if (bad && !first) first = el; });
    const gOk = checkGroup(); if (!gOk && !first) first = group[0];
    if (first) { note.textContent = 'Please fix the highlighted fields.'; first.focus({ preventScroll: true }); scrollToEl(first, -140); return; }
    const btn = $('button[type=submit]', form); btn.disabled = true; btn.classList.add('loading'); note.textContent = 'Sending…';
    setTimeout(() => {
      btn.disabled = false; btn.classList.remove('loading'); note.textContent = '';
      form.hidden = true; ok.hidden = false;
      const nf = form.elements.namedItem('name'), nm = nf && nf.value.trim().split(' ')[0];
      if (nm) $('h3', ok).textContent = (key === 'apply' ? 'Application received, ' : 'Thanks, ') + nm + '!';
      if (!reduced) gsap.from(ok, { y: 30, opacity: 0, duration: 0.6, ease: 'power3.out' });
      ok.focus({ preventScroll: true }); ScrollTrigger.refresh(); scrollToEl(ok, -140);
    }, reduced ? 50 : 900);
  });
  $(`[data-reset="${key}"]`).addEventListener('click', () => {
    form.reset(); fields.forEach((el) => showErr(el, '')); if (file) file.dispatchEvent(new Event('change'));
    ok.hidden = true; form.hidden = false; ScrollTrigger.refresh(); fields[0].focus();
  });
});
