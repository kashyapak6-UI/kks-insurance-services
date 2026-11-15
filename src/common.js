// Shared by every page: smooth scroll, header/nav, mobile menu, theme switching, counters, footer.
import './style.css';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import Lenis from 'lenis';

gsap.registerPlugin(ScrollTrigger, SplitText);
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
const header = $('#header'), burger = $('.burger', header), mMenu = $('#mobile-menu');
export const setMenu = (open) => { burger.setAttribute('aria-expanded', open); mMenu.hidden = !open; burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu'); if (lenis) open ? lenis.stop() : lenis.start(); };
burger.addEventListener('click', () => setMenu(burger.getAttribute('aria-expanded') !== 'true'));
const mDrop = $('.m-drop-btn', mMenu);
mDrop.addEventListener('click', () => { const o = mDrop.getAttribute('aria-expanded') !== 'true'; mDrop.setAttribute('aria-expanded', o); $('#m-svc').hidden = !o; });
const dropLi = $('.has-drop', header), dropBtn = $('.drop-btn', dropLi);
const closeDrop = () => { dropLi.classList.remove('open'); dropBtn.setAttribute('aria-expanded', 'false'); };
dropBtn.addEventListener('click', (e) => { e.stopPropagation(); const o = !dropLi.classList.contains('open'); dropLi.classList.toggle('open', o); dropBtn.setAttribute('aria-expanded', o); });
document.addEventListener('click', (e) => { if (!dropLi.contains(e.target)) closeDrop(); });
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') { closeDrop(); setMenu(false); } });
$$('a[href^="#"]').forEach((a) => a.addEventListener('click', (e) => {
  const id = a.getAttribute('href');
  if (id.length < 2) { e.preventDefault(); return; }
  const el = document.getElementById(id.slice(1)); if (!el) return;
  e.preventDefault(); setMenu(false); closeDrop();
  scrollToEl(el, id === '#top' ? 0 : -70);
  history.replaceState(null, '', id);
}));
const onScrollHeader = () => header.classList.toggle('scrolled', scrollY > 30);
addEventListener('scroll', onScrollHeader, { passive: true }); onScrollHeader();

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
