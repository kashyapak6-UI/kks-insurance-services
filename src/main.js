import { gsap, ScrollTrigger, SplitText, root, reduced, mobile, simple, $, $$, countUp } from './common.js';
import { hasWebGL, createGlobe, createOrbit } from './scenes.js';

/* ---------------- data ---------------- */
const REVIEWS = [
  ['Turned our quote backlog around in under two weeks. Our producers finally have time to sell.', 'Sample Reviewer A', 'Agency Owner · Commercial Lines'],
  ['Certificates come back fast and clean. Our contractors stopped calling to chase them.', 'Sample Reviewer B', 'Account Manager · Contractors Book'],
  ['They learned our carrier portals quickly and documented every step.', 'Sample Reviewer C', 'Operations Lead · Personal Lines'],
  ['Renewals are now on a calendar instead of in someone\'s head. Huge relief.', 'Sample Reviewer D', 'Principal · Independent Agency'],
  ['Clear communication, steady quality, and no hand-holding needed.', 'Sample Reviewer E', 'Broker · Property & Casualty'],
  ['Fleet schedules and filings handled with real attention to detail.', 'Sample Reviewer F', 'Agency Owner · Trucking'],
  ['Fast, professional, and easy to work with.', 'Sample Reviewer G', 'Producer · Small Business'],
  ['Our claims follow-ups no longer slip. Clients notice the difference.', 'Sample Reviewer H', 'Service Manager · P&C Agency'],
  ['Loss-run summaries were thorough and ready for underwriters.', 'Sample Reviewer I', 'Underwriting Assistant · MGA'],
  ['Felt like an extension of our own office from week one.', 'Sample Reviewer J', 'COO · Multi-State Agency'],
  ['Audit paperwork organized before the carrier even asked.', 'Sample Reviewer K', 'Account Executive · Commercial'],
  ['Long-term partner for our back office. Would recommend.', 'Sample Reviewer L', 'Founder · Insurance Brokerage'],
];
const PASTELS = ['#ffdf99', '#c6e8e8', '#d4d4ff', '#ffc4a6', '#e4f222', '#fffdf6'];
const HIGHLIGHTS = ['50+ trained operations specialists', 'Coverage experience in all 50 states', 'Personal, commercial & trucking lines', 'Fluent in 50+ carrier portals', 'Partnered with US-based agencies', 'Rates from $6/hr'];
const LOGOS = ['Alpha', 'Beta', 'Gamma', 'Delta', 'Epsilon', 'Zeta', 'Theta', 'Iota', 'Kappa', 'Lambda', 'Sigma', 'Omega'];
const SHAPES = ['<circle cx="12" cy="12" r="9"/>', '<rect x="3" y="3" width="18" height="18" rx="4"/>', '<path d="M12 2l10 18H2z"/>', '<path d="M12 2l9 5v10l-9 5-9-5V7z"/>'];
const esc = (s) => s.replace(/&/g, '&amp;');

const car = $('[data-carousel]');
car.innerHTML = REVIEWS.map(([q, n, r], i) => `<article class="rv" style="--c:${PASTELS[i % PASTELS.length]}" role="group" aria-roledescription="slide" aria-label="Review ${i + 1} of ${REVIEWS.length}"><div class="stars" aria-label="5 out of 5 stars">★★★★★</div><q>${q}</q><div class="who"><b>${n}</b>${esc(r)}</div></article>`).join('');
const tick = HIGHLIGHTS.map((h) => `<span>${esc(h)}</span>`).join('');
$('[data-ticker]').innerHTML = tick + tick.replace(/<span>/g, '<span data-dup>');
$$('[data-logos]').forEach((el) => {
  const row = +el.dataset.logos, list = row ? [...LOGOS].reverse() : LOGOS;
  const html = (hide) => list.map((n, i) => `<div class="logo"${hide ? ' aria-hidden="true"' : ''}><svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">${SHAPES[(i + row) % 4]}</svg>${n} ${row ? 'Rating' : 'Carrier'}</div>`).join('');
  el.innerHTML = html(false) + html(true);
});
$('[data-logo-list]').innerHTML = LOGOS.map((n) => `<li>${n} carrier portal (placeholder)</li>`).join('');

/* ---------------- WebGL (with fallback) ---------------- */
let globe = null, orbit = null;
if (hasWebGL()) {
  try { globe = createGlobe($('#globe'), { mobile, reduced }); } catch (e) { console.warn('Globe disabled:', e.message); }
  try { orbit = createOrbit($('#orbit'), { mobile, reduced }); } catch (e) { console.warn('Orbit disabled:', e.message); }
}
if (!globe || !orbit) root.classList.add('no-webgl');
const io = new IntersectionObserver((es) => es.forEach((e) => {
  if (e.target.id === 'top' && globe) globe.state.visible = e.isIntersecting;
  if (e.target.id === 'teams' && orbit) orbit.state.visible = e.isIntersecting;
}), { rootMargin: '100px' });
io.observe($('#top')); io.observe($('#teams'));
if (globe) window.addEventListener('pointermove', (e) => { globe.state.px = e.clientX / innerWidth - 0.5; globe.state.py = e.clientY / innerHeight - 0.5; }, { passive: true });

/* ---------------- desk mock "live" moment ---------------- */
let deskLive = false;
function goLive() {
  if (deskLive) return; deskLive = true;
  $('.desk-stage').classList.add('live');
  $$('.desk .count').forEach((el) => countUp(el, 1.6));
  $$('.desk .st').forEach((el, i) => setTimeout(() => { el.textContent = el.dataset.st; el.classList.add('done'); }, reduced ? 0 : 500 + i * 450));
  if (!reduced) gsap.fromTo('.desk .bars i', { '--grow': 0 }, { '--grow': 1, duration: 1.2, stagger: 0.07, ease: 'power3.out' });
}

/* ---------------- text reveals ---------------- */
if (!reduced) {
  $$('h2.split').forEach((h) => {
    const s = SplitText.create(h, { type: 'words', mask: 'words', wordsClass: 'w' });
    gsap.from(s.words, { yPercent: 110, duration: 1, ease: 'power4.out', stagger: 0.045, scrollTrigger: { trigger: h, start: 'top 85%', toggleActions: 'play none none reverse' } });
  });
  const intro = gsap.timeline({ delay: 0.15 });
  const hs = SplitText.create('.hero-title span', { type: 'words', mask: 'words', wordsClass: 'w' });
  intro.from('.hero .eyebrow', { y: 20, opacity: 0, duration: 0.8, ease: 'power3.out' })
    .from(hs.words, { yPercent: 115, duration: 1.1, ease: 'power4.out', stagger: 0.06 }, '-=.5')
    .from('.hero .lead, .hero .ctas, .hero .stats', { y: 30, opacity: 0, duration: 0.9, stagger: 0.1, ease: 'power3.out' }, '-=.7')
    .from('#globe', { opacity: 0, scale: 0.92, duration: 1.8, ease: 'power2.out' }, 0);
  gsap.utils.toArray('.sec .lead:not(.hero .lead), .label, .highlights li, .badge, .team-stat, .rating-stats > div, .lead-grid, .cta .btn, .rv-foot, .logo-row').forEach((el) => {
    gsap.from(el, { y: 40, opacity: 0, duration: 0.9, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 90%', toggleActions: 'play none none reverse' } });
  });
  gsap.from('.rv', { x: 120, opacity: 0, duration: 1, stagger: 0.06, ease: 'power3.out', scrollTrigger: { trigger: '.rv-track', start: 'top 85%' } });
  gsap.fromTo('.res-bar', { '--g': 0 }, { '--g': 1, stagger: 0.12, ease: 'power2.out', scrollTrigger: { trigger: '.res-grid', start: 'top 85%', end: 'top 35%', scrub: 1 } });
}

/* ---------------- hero stage: Mercury-style zoom into product UI ---------------- */
if (!simple) {
  const desk = $('.desk-stage');
  gsap.set(desk, { y: () => innerHeight * 0.92, scale: 0.7 });
  const tl = gsap.timeline({ scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom bottom', scrub: 0.6, invalidateOnRefresh: true,
    onUpdate: (s) => { if (globe) globe.state.progress = s.progress; if (s.progress > 0.55) goLive(); } } });
  tl.to('.hero-copy', { y: -140, opacity: 0, filter: 'blur(8px)', ease: 'power1.in', duration: 0.45 }, 0)
    .to('.scroll-hint', { opacity: 0, duration: 0.1 }, 0)
    .to('#globe, .globe-fallback', { opacity: 0.35, duration: 0.6 }, 0)
    .to(desk, { y: 0, scale: 1, ease: 'power2.out', duration: 0.65 }, 0.05)
    .to({}, { duration: 0.3 });
} else {
  ScrollTrigger.create({ trigger: '.desk', start: 'top 85%', once: true, onEnter: goLive });
  if (reduced) goLive();
}

/* ---------------- why: Oscar numbered cards, stacking + problem→fix ---------------- */
const flips = $$('.flip');
flips.forEach((card, i) => {
  const set = (on) => { card.classList.toggle('flipped', on); card.setAttribute('aria-pressed', on); };
  card.addEventListener('click', () => set(!card.classList.contains('flipped')));
  if (reduced) return set(true);
  ScrollTrigger.create({ trigger: card, start: simple ? 'top 70%' : 'top 45%', onEnter: () => set(true), onLeaveBack: () => set(false) });
  if (!simple && i < flips.length - 1) {
    gsap.fromTo(card, { scale: 1, filter: 'brightness(1)' }, { scale: 0.93, filter: 'brightness(0.88)', ease: 'none', scrollTrigger: { trigger: flips[i + 1], start: 'top bottom', end: 'top 30%', scrub: true } });
  }
});

/* ---------------- workflow demo (Corgi-style 3 steps) ---------------- */
const steps = $$('.wf-steps li');
const typer = $('.p-quote .type'), fullText = typer.dataset.type;
const tlItems = $$('.timeline li');
const typeTween = (tl, at, dur) => { const o = { n: 0 }; tl.to(o, { n: fullText.length, duration: dur, ease: 'none', onUpdate: () => (typer.textContent = fullText.slice(0, Math.round(o.n))) }, at); };
const tlTween = (tl, at, dur) => { const o = { n: 0 }; tl.to(o, { n: tlItems.length, duration: dur, ease: 'none', onUpdate: () => tlItems.forEach((li, i) => li.classList.toggle('on', i < Math.round(o.n))) }, at); };
function quoteAnim(tl, at = 0) {
  typeTween(tl, at, 0.5);
  tl.from('.p-quote .chip', { scale: 0.6, opacity: 0, stagger: 0.08, duration: 0.25 }, at + 0.35)
    .from('.car', { x: 40, opacity: 0, stagger: 0.1, duration: 0.3 }, at + 0.5)
    .from('.car .bar i', { scaleX: 0, stagger: 0.1, duration: 0.4 }, at + 0.6)
    .from('.car.best', { scale: 0.96, duration: 0.2 }, at + 1)
    .from('.p-quote .btn-mock', { y: 14, opacity: 0, duration: 0.25 }, at + 1.05);
}
function coiAnim(tl, at = 0) {
  tl.from('.doc .ln', { scaleX: 0, stagger: 0.12, duration: 0.4 }, at)
    .from('.checks li', { x: -20, opacity: 0, stagger: 0.12, duration: 0.3 }, at + 0.35)
    .from('.stamp', { scale: 2.2, opacity: 0, rotate: -40, duration: 0.35, ease: 'back.out(2)' }, at + 0.8);
}
function renAnim(tl, at = 0) {
  tlTween(tl, at, 0.9);
  tl.from('.ren-meter .track i', { scaleX: 0, duration: 0.8 }, at + 0.2);
}
if (reduced) {
  tlItems.forEach((li) => li.classList.add('on'));
} else if (simple) {
  [['.p-quote', quoteAnim], ['.p-coi', coiAnim], ['.p-ren', renAnim]].forEach(([sel, fn]) => {
    const tl = gsap.timeline({ paused: true, defaults: { ease: 'power2.out' } });
    fn(tl); tl.duration() && tl.timeScale(1.2);
    ScrollTrigger.create({ trigger: sel, start: 'top 80%', once: true, onEnter: () => tl.play() });
  });
} else {
  const tl = gsap.timeline({ defaults: { ease: 'power2.out' }, scrollTrigger: { trigger: '#workflow', start: 'top top', end: 'bottom bottom', scrub: 0.8,
    onUpdate: (s) => { const idx = s.progress < 0.36 ? 0 : s.progress < 0.7 ? 1 : 2; steps.forEach((li, i) => li.classList.toggle('on', i === idx)); $('.wf-progress span').style.width = s.progress * 100 + '%'; } } });
  gsap.set(['.p-coi', '.p-ren'], { opacity: 0, y: 80, rotate: 3 });
  quoteAnim(tl, 0);
  tl.to('.p-quote', { y: -60, opacity: 0, scale: 0.94, rotate: -3, duration: 0.4 }, 1.6)
    .to('.p-coi', { y: 0, opacity: 1, rotate: 0, duration: 0.4 }, 1.7);
  coiAnim(tl, 2.1);
  tl.to('.p-coi', { y: -60, opacity: 0, scale: 0.94, rotate: -3, duration: 0.4 }, 3.4)
    .to('.p-ren', { y: 0, opacity: 1, rotate: 0, duration: 0.4 }, 3.5);
  renAnim(tl, 3.9);
  tl.to({}, { duration: 0.4 });
}

/* ---------------- services: Ramp black band, horizontal scroll ---------------- */
if (!simple) {
  const track = $('.svc-track');
  gsap.to(track, { x: () => -(track.scrollWidth - innerWidth), ease: 'none', scrollTrigger: { trigger: '#services', start: 'top top', end: 'bottom bottom', scrub: 0.6, invalidateOnRefresh: true,
    onUpdate: (s) => ($('.svc-progress span').style.width = s.progress * 100 + '%') } });
  $$('.tilt').forEach((el) => {
    el.addEventListener('pointermove', (e) => { const r = el.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5; el.style.transform = `perspective(900px) rotateX(${-y * 8}deg) rotateY(${x * 10}deg)`; });
    el.addEventListener('pointerleave', () => (el.style.transform = ''));
  });
} else if (!reduced) {
  $$('.svc').forEach((el) => gsap.from(el, { y: 60, opacity: 0, duration: 0.9, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 88%' } }));
}

/* ---------------- teams: pinned list + 3D orbit ---------------- */
const teamItems = $$('[data-teams] li'), teamBar = $('.team-progress span');
const setTeam = (i) => { teamItems.forEach((li, j) => li.classList.toggle('active', j === i)); if (orbit) orbit.state.active = i; };
if (!simple) {
  ScrollTrigger.create({ trigger: '#teams', start: 'top top', end: 'bottom bottom', onUpdate: (s) => { setTeam(Math.min(5, Math.floor(s.progress * 6))); teamBar.style.width = s.progress * 100 + '%'; } });
} else {
  let ti = 0; teamItems.forEach((li, i) => li.addEventListener('click', () => setTeam((ti = i))));
  if (!reduced) setInterval(() => { if (orbit && orbit.state.visible) setTeam((ti = (ti + 1) % 6)); }, 2600);
}

/* ---------------- reviews wall: buttons, auto-advance, drag ---------------- */
const step = () => (car.firstElementChild?.getBoundingClientRect().width || 360) + 18;
const go = (dir) => {
  const max = car.scrollWidth - car.clientWidth;
  if (dir > 0 && car.scrollLeft >= max - 4) car.scrollTo({ left: 0, behavior: reduced ? 'auto' : 'smooth' });
  else car.scrollBy({ left: dir * step(), behavior: reduced ? 'auto' : 'smooth' });
};
$('[data-prev]').addEventListener('click', () => go(-1));
$('[data-next]').addEventListener('click', () => go(1));
car.addEventListener('keydown', (e) => { if (e.key === 'ArrowRight') go(1); if (e.key === 'ArrowLeft') go(-1); });
let hover = false, carVisible = false;
car.addEventListener('pointerenter', () => (hover = true)); car.addEventListener('pointerleave', () => (hover = false));
new IntersectionObserver(([e]) => (carVisible = e.isIntersecting)).observe(car);
if (!reduced) setInterval(() => { if (carVisible && !hover && !document.hidden) go(1); }, 4200);
let drag = null;
car.addEventListener('pointerdown', (e) => { if (e.pointerType !== 'mouse') return; drag = { x: e.clientX, l: car.scrollLeft }; car.style.scrollSnapType = 'none'; });
addEventListener('pointermove', (e) => { if (drag) car.scrollLeft = drag.l - (e.clientX - drag.x); });
addEventListener('pointerup', () => { if (drag) { drag = null; car.style.scrollSnapType = ''; } });

/* ---------------- render loop / resize ---------------- */
gsap.ticker.add(() => { if (document.hidden) return; globe && globe.frame(); orbit && orbit.frame(); });
let rt;
addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(() => { globe && globe.resize(); orbit && orbit.resize(); ScrollTrigger.refresh(); }, 150); });
