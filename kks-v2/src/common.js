// Shared by every page: smooth scroll, header/nav, mobile menu, theme switching, counters, footer.
import './style.css';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import Lenis from 'lenis';

gsap.registerPlugin(ScrollTrigger, SplitText);
ScrollTrigger.config({ ignoreMobileResize: true });
export { gsap, ScrollTrigger, SplitText };

export const root = document.documentElement;
export const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
export const mobile = matchMedia('(max-width: 900px), (pointer: coarse)').matches;
export const simple = reduced || mobile; // no sticky "stages" on phones or with reduced motion
root.classList.toggle('simple', simple);
export const $ = (s, c = document) => c.querySelector(s);
export const $$ = (s, c = document) => [...c.querySelectorAll(s)];

$$('[data-year]').forEach((e) => (e.textContent = new Date().getFullYear()));

/* ---------------- smooth scroll ---------------- */
export let lenis = null;
if (!reduced) {
  lenis = new Lenis({ duration: 1.1, smoothWheel: true });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((t) => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
}
export const scrollToEl = (el, offset = -70) => { if (lenis) lenis.scrollTo(el, { offset }); else el.scrollIntoView(); };

/* ---------------- header / nav ---------------- */
const header = $('#header'), burger = $('.burger', header), mMenu = $('#mobile-menu'), mDrop = $('.m-drop-btn', mMenu);
const focusables = () => [burger, ...$$('a[href],button:not([disabled])', mMenu).filter((el) => el.offsetParent !== null)];
let menuOpen = false;
// Scroll lock: overflow:hidden on <html>/<body> (honoured by iOS 16+ Safari and Android Chrome) plus
// overscroll-behavior:contain on the menu. Scroll position is never touched, so scroll-linked themes/reveals don't jump.
const lockScroll = (on) => root.classList.toggle('menu-open', on);
export const setMenu = (open, { restoreFocus = true } = {}) => {
  if (open === menuOpen) return;
  menuOpen = open;
  burger.setAttribute('aria-expanded', open);
  burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  mMenu.hidden = !open;
  header.classList.toggle('menu-open', open);
  if (lenis) open ? lenis.stop() : lenis.start();
  lockScroll(open);
  if (open) { mMenu.scrollTop = 0; requestAnimationFrame(() => burger.focus({ preventScroll: true })); }
  else {
    mDrop.setAttribute('aria-expanded', 'false'); $('#m-svc').hidden = true;
    if (restoreFocus) burger.focus({ preventScroll: true });
  }
};
burger.addEventListener('click', () => setMenu(!menuOpen));
mDrop.addEventListener('click', () => { const o = mDrop.getAttribute('aria-expanded') !== 'true'; mDrop.setAttribute('aria-expanded', o); $('#m-svc').hidden = !o; });
// Any link tapped inside the mobile menu closes it (same-page anchors are handled below, other pages navigate).
$$('a[href]', mMenu).forEach((a) => a.addEventListener('click', () => setMenu(false, { restoreFocus: false })));
// Keep keyboard focus inside the open menu (burger acts as the close button).
header.addEventListener('keydown', (e) => {
  if (!menuOpen || e.key !== 'Tab') return;
  const f = focusables(), first = f[0], last = f[f.length - 1];
  if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
  else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
});
// Close if the viewport grows to desktop, or when the page is restored from the back/forward cache.
matchMedia('(min-width: 1141px)').addEventListener('change', (m) => m.matches && setMenu(false, { restoreFocus: false }));
addEventListener('pageshow', (e) => { if (e.persisted) setMenu(false, { restoreFocus: false }); });
const dropLi = $('.has-drop', header), dropBtn = $('.drop-btn', dropLi);
const closeDrop = () => { dropLi.classList.remove('open'); dropBtn.setAttribute('aria-expanded', 'false'); };
dropBtn.addEventListener('click', (e) => { e.stopPropagation(); const o = !dropLi.classList.contains('open'); dropLi.classList.toggle('open', o); dropBtn.setAttribute('aria-expanded', o); });
document.addEventListener('click', (e) => { if (!dropLi.contains(e.target)) closeDrop(); });
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') { closeDrop(); if (menuOpen) setMenu(false); } });
$$('a[href^="#"]').forEach((a) => a.addEventListener('click', (e) => {
  const id = a.getAttribute('href');
  if (id.length < 2) { e.preventDefault(); return; }
  const el = document.getElementById(id.slice(1)); if (!el) return;
  e.preventDefault(); setMenu(false, { restoreFocus: false }); closeDrop();
  scrollToEl(el, id === '#top' ? 0 : -70);
  history.replaceState(null, '', id);
}));
const onScrollHeader = () => header.classList.toggle('scrolled', scrollY > 30);
addEventListener('scroll', onScrollHeader, { passive: true }); onScrollHeader();

/* ---------------- WhatsApp button never covers a CTA ---------------- */
const fab = $('.wa-float');
if (fab) {
  const targets = () => $$('main .btn, main button, main .round, main input:not([type=hidden]), main select, main textarea, main label.check, .site-footer a');
  let tg = targets(), raf = 0;
  const check = () => {
    raf = 0;
    if (!matchMedia('(max-width: 900px), (pointer: coarse)').matches) { fab.classList.remove('away'); return; }
    // phones: stay out of the way on the first screen (hero CTAs/stats), then appear
    if (scrollY < innerHeight * 0.6) { fab.classList.add('away'); return; }
    // resting box of the fixed button (offset* ignores the hide transform)
    const a = { left: fab.offsetLeft, top: fab.offsetTop, right: fab.offsetLeft + fab.offsetWidth, bottom: fab.offsetTop + fab.offsetHeight }, pad = 8;
    const hit = tg.some((el) => { if (!el.offsetParent) return false; const b = el.getBoundingClientRect(); return !(a.right + pad <= b.left || a.left - pad >= b.right || a.bottom + pad <= b.top || a.top - pad >= b.bottom); });
    fab.classList.toggle('away', hit);
  };
  const queue = () => { if (!raf) raf = requestAnimationFrame(check); };
  addEventListener('scroll', queue, { passive: true });
  addEventListener('resize', () => { tg = targets(); queue(); }, { passive: true });
  new MutationObserver(() => { tg = targets(); queue(); }).observe(document.querySelector('main') || document.body, { attributes: true, attributeFilter: ['hidden'], subtree: true });
  queue();
}

/* ---------------- theme switching on scroll (Mercury) ---------------- */
const setTheme = (t) => { if (root.dataset.theme !== t) root.dataset.theme = t; };
$$('[data-theme]').filter((el) => el !== root).forEach((el) => ScrollTrigger.create({
  trigger: el, start: 'top 50%', end: 'bottom 50%',
  onToggle: (s) => s.isActive && setTheme(el.dataset.theme),
}));

/* ---------------- counters ---------------- */
const fmt = (n, dec) => (dec ? n.toFixed(dec) : Math.round(n).toLocaleString('en-US'));
export function countUp(el, dur = 2) {
  const to = +el.dataset.to, suf = el.dataset.suffix || '', dec = +(el.dataset.dec || 0);
  if (reduced) { el.textContent = fmt(to, dec) + suf; return; }
  const o = { v: 0 };
  gsap.to(o, { v: to, duration: dur, ease: 'power3.out', onUpdate: () => (el.textContent = fmt(o.v, dec) + suf) });
}
$$('.count').filter((el) => !el.closest('.desk')).forEach((el) => {
  if (reduced) return countUp(el);
  ScrollTrigger.create({ trigger: el, start: 'top 92%', once: true, onEnter: () => countUp(el) });
});

/* ---------------- footer wordmark ---------------- */
if (!reduced && $('.giant')) gsap.from('.giant', { yPercent: 40, opacity: 0.2, ease: 'none', scrollTrigger: { trigger: '.site-footer', start: 'top bottom', end: 'bottom bottom', scrub: true } });

/* ---------------- deep links (#hash from another page) ---------------- */
export function settle() {
  ScrollTrigger.refresh();
  const h = location.hash && document.getElementById(location.hash.slice(1));
  if (h) requestAnimationFrame(() => scrollToEl(h, -70));
}
document.fonts && document.fonts.ready.then(() => ScrollTrigger.refresh());
addEventListener('load', () => setTimeout(settle, 60));
