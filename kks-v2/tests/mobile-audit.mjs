// Mobile audit (Playwright, iPhone-like): console errors, horizontal overflow / clipped content,
// touch targets (>=44px), input font size (>=16px), mobile menu behaviour, WhatsApp-button overlap.
// Usage: node tests/mobile-audit.mjs <baseURL ending in /> <label> [--shots]
import { chromium } from 'playwright-core';
import fs from 'fs';
const BASE = process.argv[2] || 'http://127.0.0.1:4176/';
const LABEL = process.argv[3] || 'after';
const SHOTS = process.argv.includes('--shots');
const PAGES = JSON.parse(fs.readFileSync(new URL('../scripts/pages.json', import.meta.url), 'utf8')).filter((p) => p !== 'coming-soon.html');
const OUT = new URL('../screenshots/mobile-v2/', import.meta.url).pathname;
fs.mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', headless: true, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';
const ctxFor = (w, h, dpr = 2) => browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: dpr, isMobile: true, hasTouch: true, userAgent: UA });
const report = { base: BASE, label: LABEL, pages: {}, widths: {}, menu: {}, key: {} };

/* ------------ in-page probes ------------ */
const probe = () => {
  const vw = innerWidth;
  const vis = (el) => { const cs = getComputedStyle(el); if (cs.visibility === 'hidden' || cs.display === 'none' || +cs.opacity === 0) return false; const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0; };
  const hiddenAnc = (el) => el.closest('[hidden],[aria-hidden="true"],.mobile-menu,.dropdown,.main-nav,.sr-only,.skip');
  const scrollerAnc = (el) => { for (let p = el.parentElement; p && p !== document.body; p = p.parentElement) { const ox = getComputedStyle(p).overflowX; if (ox === 'auto' || ox === 'scroll' || ox === 'hidden' || ox === 'clip') return p; } return null; };
  // overflow: elements sticking out of the viewport that are not inside an intentional clipper/scroller
  const over = [];
  document.querySelectorAll('body *').forEach((el) => {
    if (hiddenAnc(el) || !vis(el)) return;
    const r = el.getBoundingClientRect();
    if (r.right > vw + 1 || r.left < -1) { if (!scrollerAnc(el)) over.push(`${el.tagName.toLowerCase()}.${[...el.classList].join('.')} [${Math.round(r.left)}→${Math.round(r.right)}]`); }
  });
  // text that is wider than its own box (long words) or runs past the viewport, even inside overflow:hidden sections
  document.querySelectorAll('h1,h2,h3,h4,p,li,a,button,dt,dd,td,th,label,span,b,strong,em,q').forEach((el) => {
    if (hiddenAnc(el) || !vis(el)) return;
    const own = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim()); if (!own) return;
    const r = el.getBoundingClientRect(); let sc = null;
    for (let p = el.parentElement; p && p !== document.body; p = p.parentElement) { const ox = getComputedStyle(p).overflowX; if (ox === 'auto' || ox === 'scroll') { sc = p; break; } }
    if (sc) return;
    if (r.right > vw + 1 || r.left < -1) over.push(`TEXT ${el.tagName.toLowerCase()}.${[...el.classList].join('.')} "${el.textContent.trim().slice(0, 24)}" [${Math.round(r.left)}→${Math.round(r.right)}]`);
    else if (getComputedStyle(el).display !== 'inline' && el.scrollWidth > el.clientWidth + 2 && el.clientWidth > 0) over.push(`WORD ${el.tagName.toLowerCase()}.${[...el.classList].join('.')} "${el.textContent.trim().slice(0, 24)}" ${el.scrollWidth}>${el.clientWidth}`);
  });
  // touch targets
  const small = [], inline = [];
  document.querySelectorAll('a[href],button,input:not([type=hidden]),select,textarea,summary,[role=button],[tabindex]:not([tabindex="-1"])').forEach((el) => {
    if (hiddenAnc(el) || !vis(el)) return;
    if (el.matches('input[type=checkbox],input[type=radio]') && el.closest('label')) { const l = el.closest('label').getBoundingClientRect(); if (l.height >= 44) return; }
    if (el.matches('input[type=file]')) return; // invisible overlay; label is the target
    const r = el.getBoundingClientRect();
    if (r.width >= 43.5 && r.height >= 43.5) return;
    const p = el.parentElement, own = (el.innerText || '').trim(), ctx = (p && p.innerText || '').trim();
    const desc = `${el.tagName.toLowerCase()}${el.className && typeof el.className === 'string' ? '.' + el.className.trim().split(/\s+/).join('.') : ''} "${own.slice(0, 28)}" ${Math.round(r.width)}x${Math.round(r.height)}`;
    if (el.tagName === 'A' && p && /^(P|SPAN|LI)$/.test(p.tagName) && ctx.length > own.length + 12 && getComputedStyle(el).display === 'inline') inline.push(desc); else small.push(desc);
  });
  const inputs = [...document.querySelectorAll('input:not([type=checkbox]):not([type=file]):not([type=hidden]),select,textarea')].filter((el) => !hiddenAnc(el)).map((el) => ({ n: el.name || el.type, fs: parseFloat(getComputedStyle(el).fontSize), type: el.type }));
  return { docOverflow: document.documentElement.scrollWidth > vw + 1, scrollW: document.documentElement.scrollWidth, over: [...new Set(over)].slice(0, 40), small: [...new Set(small)], inline: [...new Set(inline)], inputsBelow16: inputs.filter((i) => i.fs < 16), inputs };
};
// WhatsApp FAB must not sit on top of a button/CTA: move every button to the bottom-right zone and test.
const waProbe = async (page) => {
  const ids = await page.evaluate(() => { const els = [...document.querySelectorAll('main .btn, main button[type=submit], .site-footer a, .round')].filter((e) => !e.closest('[hidden],[aria-hidden="true"]') && e.getBoundingClientRect().height > 0); els.forEach((e, i) => e.setAttribute('data-audit', i)); return els.length; });
  const hits = [];
  for (let i = 0; i < ids; i++) {
    const r = await page.evaluate(async (i) => {
      const el = document.querySelector(`[data-audit="${i}"]`); const y = el.getBoundingClientRect().bottom + scrollY - innerHeight + 24;
      window.scrollTo(0, Math.max(0, y)); await new Promise((r) => setTimeout(r, 450));
      const fab = document.querySelector('.wa-float'); if (!fab) return null;
      const cs = getComputedStyle(fab); if (cs.visibility === 'hidden' || +cs.opacity < 0.2 || cs.pointerEvents === 'none') return null;
      const a = fab.getBoundingClientRect(), b = el.getBoundingClientRect();
      const ov = !(a.right <= b.left || a.left >= b.right || a.bottom <= b.top || a.top >= b.bottom);
      return ov ? `${el.className || el.tagName} "${el.innerText.trim().slice(0, 30)}"` : null;
    }, i);
    if (r) hits.push(r);
  }
  return [...new Set(hits)];
};

/* ------------ 375x812: every page ------------ */
const ctx = await ctxFor(375, 812);
for (const p of PAGES) {
  const page = await ctx.newPage(); const errs = [];
  page.on('console', (m) => m.type() === 'error' && errs.push(m.text()));
  page.on('pageerror', (e) => errs.push('PAGEERROR ' + e.message));
  page.on('response', (r) => r.status() >= 400 && errs.push(`HTTP ${r.status()} ${r.url()}`));
  await page.goto(BASE + p, { waitUntil: 'networkidle' }); await page.waitForTimeout(900);
  // scroll through to trigger reveals
  const H = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < H; y += 700) { await page.evaluate((y) => scrollTo(0, y), y); await page.waitForTimeout(110); }
  await page.evaluate(() => scrollTo(0, document.documentElement.scrollHeight)); await page.waitForTimeout(900);
  const r = await page.evaluate(probe);
  const wa = await waProbe(page);
  report.pages[p] = { consoleErrors: errs, ...r, inputs: undefined, waOverlaps: wa };
  await page.close();
}

/* ------------ other widths: overflow only ------------ */
for (const w of [320, 390]) {
  const c = await ctxFor(w, 780); report.widths[w] = {};
  for (const p of PAGES) {
    const page = await c.newPage(); const errs = [];
    page.on('pageerror', (e) => errs.push(e.message)); page.on('console', (m) => m.type() === 'error' && errs.push(m.text()));
    await page.goto(BASE + p, { waitUntil: 'networkidle' }); await page.waitForTimeout(500);
    const H = await page.evaluate(() => document.documentElement.scrollHeight);
    for (let y = 0; y < H; y += 900) { await page.evaluate((y) => scrollTo(0, y), y); await page.waitForTimeout(60); }
    await page.waitForTimeout(700);
    const r = await page.evaluate(probe);
    report.widths[w][p] = { errs: errs.length, docOverflow: r.docOverflow, over: r.over, small: r.small.length };
    await page.close();
  }
  await c.close();
}

/* ------------ menu behaviour on 3 key pages ------------ */
for (const p of ['index.html', 'pricing.html', 'services/claims.html']) {
  const page = await ctx.newPage(); const m = {}; const errs = [];
  page.on('pageerror', (e) => errs.push(e.message));
  await page.goto(BASE + p, { waitUntil: 'networkidle' }); await page.waitForTimeout(700);
  await page.evaluate(() => scrollTo(0, 600)); await page.waitForTimeout(400);
  const y0 = await page.evaluate(() => scrollY);
  await page.tap('.burger'); await page.waitForTimeout(450);
  m.opens = await page.isVisible('#mobile-menu');
  m.expanded = await page.getAttribute('.burger', 'aria-expanded');
  m.closeLabel = await page.getAttribute('.burger', 'aria-label');
  m.focusAfterOpen = await page.evaluate(() => document.activeElement && (document.activeElement.className || document.activeElement.tagName) + ' ' + (document.activeElement.textContent || '').trim().slice(0, 20));
  // scroll lock: try to scroll page with touch/wheel
  await page.mouse.wheel(0, 900); await page.evaluate(() => window.scrollBy(0, 0)); await page.waitForTimeout(500);
  m.scrollLocked = (await page.evaluate(() => scrollY)) === y0 && (await page.evaluate(() => getComputedStyle(document.documentElement).overflowY === 'hidden' || getComputedStyle(document.body).overflowY === 'hidden' || getComputedStyle(document.body).position === 'fixed'));
  // focus trap: tab many times, focus must stay in header
  for (let i = 0; i < 30; i++) await page.keyboard.press('Tab');
  m.focusTrapped = await page.evaluate(() => !!document.activeElement.closest('#header'));
  // close button is focusable + visible
  m.closeBtnFocusable = await page.evaluate(() => { const b = document.querySelector('.burger'); b.focus(); return document.activeElement === b && b.getBoundingClientRect().height >= 44; });
  // services sub-list
  await page.tap('.m-drop-btn', { timeout: 5000 }).catch(() => {}); await page.waitForTimeout(350);
  m.svcOpen = await page.isVisible('#m-svc'); m.svcLinks = await page.locator('#m-svc a:visible').count();
  if (SHOTS) await page.screenshot({ path: `${OUT}${LABEL}-menu-${p.replace(/\W+/g, '_')}.png` });
  // menu items reachable (scrollable inside)
  m.menuScrollable = await page.evaluate(() => { const mm = document.getElementById('mobile-menu'); return mm.scrollHeight <= mm.clientHeight + 1 || getComputedStyle(mm).overflowY !== 'visible'; });
  // Escape closes + focus returns to burger
  await page.keyboard.press('Escape'); await page.waitForTimeout(350);
  m.escCloses = !(await page.isVisible('#mobile-menu'));
  m.focusReturns = await page.evaluate(() => document.activeElement === document.querySelector('.burger'));
  m.scrollRestored = (await page.evaluate(() => scrollY)) === y0;
  const step = async (k, fn) => { try { m[k] = await fn(); } catch (e) { m[k] = 'FAIL: ' + e.message.split('\n')[0]; } };
  const open = async () => { if (!(await page.isVisible('#mobile-menu'))) { await page.tap('.burger', { timeout: 3000 }); await page.waitForTimeout(350); } };
  await step('burgerCloses', async () => { await open(); await page.tap('.burger', { timeout: 3000 }); await page.waitForTimeout(300); return !(await page.isVisible('#mobile-menu')); });
  if (p === 'index.html') await step('hashLinkCloses', async () => { await open(); await page.tap('#mobile-menu li > a[href="#top"]', { timeout: 3000 }); await page.waitForTimeout(600); return !(await page.isVisible('#mobile-menu')) && await page.evaluate(() => getComputedStyle(document.documentElement).overflowY !== 'hidden' && getComputedStyle(document.body).position !== 'fixed'); });
  else await step('svcLinkNavigates', async () => { await open(); await page.tap('.m-drop-btn', { timeout: 3000 }); await page.waitForTimeout(300); await page.tap('#m-svc a >> nth=1', { timeout: 3000 }); await page.waitForLoadState('networkidle'); const u = page.url(); await page.goBack({ waitUntil: 'networkidle' }); await page.waitForTimeout(400); return /commercial-lines/.test(u); });
  await step('pageLinkNavigates', async () => { await open(); await page.tap('#mobile-menu li > a[href$="contact.html"]', { timeout: 3000 }); await page.waitForLoadState('networkidle'); await page.waitForTimeout(300); return page.url().endsWith('contact.html'); });
  await step('menuClosedAfterBack', async () => { await page.goBack({ waitUntil: 'networkidle' }); await page.waitForTimeout(500); return !(await page.isVisible('#mobile-menu')) && await page.evaluate(() => getComputedStyle(document.documentElement).overflowY !== 'hidden' && getComputedStyle(document.body).position !== 'fixed'); });
  m.errors = errs;
  report.menu[p] = m; await page.close();
}

/* ------------ key-page extra checks + screenshots ------------ */
{
  const page = await ctx.newPage();
  await page.goto(BASE + 'pricing.html', { waitUntil: 'networkidle' }); await page.waitForTimeout(700);
  report.key.pricingTable = await page.evaluate(() => { const w = document.querySelector('.tbl-wrap'), t = w.querySelector('table'); return { wrapW: Math.round(w.clientWidth), tableW: Math.round(t.scrollWidth), needsHScroll: t.scrollWidth > w.clientWidth + 1, display: getComputedStyle(t.querySelector('tr')).display }; });
  report.key.segButtons = await page.$$eval('.seg button', (b) => b.map((x) => Math.round(x.getBoundingClientRect().height)));
  await page.tap('[data-bill="m"]'); await page.waitForTimeout(700);
  report.key.pricingToggle = await page.textContent('.plan.pop [data-rate]');
  await page.close();
  const p2 = await ctx.newPage();
  await p2.goto(BASE + 'contact.html', { waitUntil: 'networkidle' }); await p2.waitForTimeout(600);
  report.key.contactInputs = await p2.evaluate(() => [...document.querySelectorAll('.kform input:not([type=checkbox]),.kform select,.kform textarea')].map((e) => `${e.name}:${e.type}:${getComputedStyle(e).fontSize}`));
  await p2.close();
}
if (SHOTS) {
  const shots = [['index.html', 'home'], ['pricing.html', 'pricing'], ['services/personal-lines.html', 'service'], ['contact.html', 'contact']];
  for (const [p, n] of shots) {
    const page = await ctx.newPage();
    await page.goto(BASE + p, { waitUntil: 'networkidle' }); await page.waitForTimeout(1500);
    await page.screenshot({ path: `${OUT}${LABEL}-${n}-top.png` });
    const sel = { pricing: '.tbl-wrap', service: '.deliver-grid', contact: '.kform', home: '#services' }[n];
    await page.evaluate((s) => { const e = document.querySelector(s); scrollTo(0, e.getBoundingClientRect().top + scrollY - 90); }, sel); await page.waitForTimeout(1200);
    await page.screenshot({ path: `${OUT}${LABEL}-${n}-detail.png` });
    if (n === 'home') { await page.evaluate(() => scrollTo(0, document.querySelector('.site-footer').getBoundingClientRect().top + scrollY - 200)); await page.waitForTimeout(1000); await page.screenshot({ path: `${OUT}${LABEL}-home-footer.png` }); }
    await page.close();
  }
  // full-page at 375: scroll + capture viewport tiles + stitch (fullPage capture breaks scroll-linked themes)
  const { execFileSync } = await import('child_process');
  for (const [p, n] of shots.slice(0, 3)) {
    const page = await ctx.newPage(); await page.goto(BASE + p, { waitUntil: 'networkidle' }); await page.waitForTimeout(900);
    const H = await page.evaluate(() => document.documentElement.scrollHeight); const tiles = [];
    for (let y = 0, i = 0; y < H; y += 812, i++) {
      await page.evaluate((y) => scrollTo(0, y), y); await page.waitForTimeout(i ? 700 : 300);
      if (i === 1) await page.addStyleTag({ content: '.site-header,.wa-float{visibility:hidden!important}' });
      const f = `/tmp/tile-${LABEL}-${n}-${String(i).padStart(3, '0')}.png`; await page.screenshot({ path: f }); tiles.push([f, Math.min(812, H - y)]);
    }
    fs.writeFileSync('/tmp/tiles.json', JSON.stringify({ tiles, out: `${OUT}${LABEL}-${n}-full.jpg` }));
    execFileSync('python3', ['-c', `import json;from PIL import Image\nd=json.load(open('/tmp/tiles.json'));ims=[(Image.open(f),h) for f,h in d['tiles']];W=ims[0][0].size[0]//2;H=sum(h for _,h in ims)\nS=Image.new('RGB',(W,H));y=0\nfor im,h in ims:\n  im=im.resize((W,im.size[1]//2));S.paste(im.crop((0,im.size[1]-h,W,im.size[1])),(0,y));y+=h\nS.save(d['out'],quality=72)`]);
    await page.close();
  }
  // 320 overview
  const c3 = await ctxFor(320, 700);
  for (const [p, n] of shots.slice(0, 3)) { const page = await c3.newPage(); await page.goto(BASE + p, { waitUntil: 'networkidle' }); await page.waitForTimeout(1300); await page.screenshot({ path: `${OUT}${LABEL}-${n}-320.png` }); await page.close(); }
}
await browser.close();
const sum = Object.entries(report.pages).map(([p, r]) => ({ p, errors: r.consoleErrors.length, docOverflow: r.docOverflow, clipped: r.over.length, smallTargets: r.small.length, inputs16: r.inputsBelow16.length, waOverlaps: r.waOverlaps.length }));
report.summary = sum;
fs.writeFileSync(`${OUT}${LABEL}-report.json`, JSON.stringify(report, null, 2));
console.table(sum);
console.log('widths', JSON.stringify(Object.fromEntries(Object.entries(report.widths).map(([w, o]) => [w, Object.entries(o).filter(([, v]) => v.errs || v.docOverflow || v.over.length).map(([p, v]) => `${p}: errs ${v.errs} docOv ${v.docOverflow} clipped ${v.over.length}`)]))));
console.log('menu', JSON.stringify(report.menu, null, 1));
console.log('key', JSON.stringify(report.key));
