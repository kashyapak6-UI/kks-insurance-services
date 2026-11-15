// Playwright check for every page: console errors, internal links (crawl all hrefs), interactions, stitched screenshots.
// Usage: node test-pages.mjs [baseURL]   (default http://127.0.0.1:4176/ = `vite preview --port 4176`)
import { chromium } from 'playwright-core';
import fs from 'fs';
import { execFileSync } from 'child_process';
const BASE = process.argv[2] || 'http://127.0.0.1:4176/';
const PAGES = JSON.parse(fs.readFileSync('scripts/pages.json', 'utf8')).filter((p) => p !== 'coming-soon.html');
const OUT = 'screenshots/pages'; fs.rmSync(OUT, { recursive: true, force: true }); fs.mkdirSync(`${OUT}/.tiles`, { recursive: true });
const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', headless: true, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const report = { pages: {}, links: {}, interactions: {}, redirect: {} };
const hrefs = new Map(); // absolute url -> Set(source pages)
const VPS = [['desktop', { width: 1440, height: 900 }, false], ['mobile', { width: 390, height: 844 }, true]];

for (const [vpName, vp, mobile] of VPS) {
  const ctx = await browser.newContext({ viewport: vp, deviceScaleFactor: mobile ? 2 : 1, isMobile: mobile, hasTouch: mobile });
  for (const p of PAGES) {
    const page = await ctx.newPage();
    const errs = [], warns = [], failed = [];
    page.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); if (m.type() === 'warning') warns.push(m.text()); });
    page.on('pageerror', (e) => errs.push('PAGEERROR: ' + e.message));
    page.on('requestfailed', (r) => failed.push(r.url()));
    page.on('response', (r) => { if (r.status() >= 400) errs.push(`HTTP ${r.status()}: ${r.url()}`); });
    const res = await page.goto(BASE + p, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1600);
    // collect links
    const links = await page.$$eval('a[href]', (as) => as.map((a) => a.getAttribute('href')));
    links.forEach((h) => { if (/^(mailto:|tel:|https?:\/\/(?!127\.0\.0\.1))/.test(h)) return; const abs = new URL(h, BASE + p).href; if (!hrefs.has(abs)) hrefs.set(abs, new Set()); hrefs.get(abs).add(p); });
    // scroll through (triggers reveals/counters/pins) while capturing tiles
    const total = await page.evaluate(() => document.documentElement.scrollHeight);
    const tiles = [];
    for (let y = 0, i = 0; y < total; y += vp.height, i++) {
      await page.evaluate((y) => window.scrollTo(0, y), y);
      await page.waitForTimeout(i === 0 ? 300 : 750);
      if (i === 1) await page.addStyleTag({ content: '.site-header,.wa-float{visibility:hidden!important}' });
      const f = `${OUT}/.tiles/${vpName}-${p.replace(/\//g, '_')}-${String(i).padStart(3, '0')}.png`;
      await page.screenshot({ path: f });
      tiles.push([f, Math.min(vp.height, total - y)]);
    }
    const name = p.replace(/\.html$/, '').replace(/\//g, '__');
    fs.writeFileSync(`${OUT}/.tiles/${vpName}-${name}.json`, JSON.stringify({ tiles, w: vp.width, scale: mobile ? 2 : 1, out: `${OUT}/${vpName}/${name}.jpg` }));
    const info = await page.evaluate(() => ({ title: document.title, h1: document.querySelector('h1')?.innerText.replace(/\s+/g, ' '), height: document.documentElement.scrollHeight, overflowX: document.documentElement.scrollWidth > innerWidth + 1, hasHeader: !!document.querySelector('#header .burger'), hasFooter: !!document.querySelector('.site-footer'), hasWA: !!document.querySelector('.wa-float'), dropdown: document.querySelectorAll('#svc-menu a').length }));
    report.pages[`${vpName} ${p}`] = { status: res.status(), consoleErrors: errs, warnings: warns, failedRequests: failed, ...info };
    await page.close();
  }

  /* ---- interactions ---- */
  const page = await ctx.newPage(); const ix = {}; const ierr = [];
  page.on('pageerror', (e) => ierr.push(e.message)); page.on('console', (m) => m.type() === 'error' && ierr.push(m.text()));
  const go = async (u) => { await page.goto(BASE + u, { waitUntil: 'networkidle' }); await page.waitForTimeout(1200); };
  if (mobile) {
    await go('pricing.html'); await page.click('.burger'); await page.waitForTimeout(400); await page.click('.m-drop-btn'); await page.waitForTimeout(300);
    ix.mobileMenu = { open: await page.isVisible('#mobile-menu'), svcLinks: await page.locator('#m-svc a:visible').count() };
    await page.screenshot({ path: `${OUT}/mobile/_menu-open.png` });
    await page.click('#m-svc a >> nth=2'); await page.waitForLoadState('networkidle');
    ix.mobileMenu.navigatedTo = page.url().replace(BASE, '');
  } else {
    await go('services/claims.html'); await page.hover('.drop-btn'); await page.waitForTimeout(500);
    ix.dropdown = { visible: await page.evaluate(() => getComputedStyle(document.getElementById('svc-menu')).visibility), items: await page.locator('#svc-menu a').count() };
    await page.screenshot({ path: `${OUT}/desktop/_dropdown.png` });
    // pinned steps change while scrolling
    await go('how-it-works.html');
    const pin = [];
    for (const f of [0.05, 0.3, 0.5, 0.7, 0.95]) {
      await page.evaluate((f) => { const s = document.getElementById('process'); window.scrollTo(0, s.offsetTop + (s.offsetHeight - innerHeight) * f); }, f);
      await page.waitForTimeout(900);
      pin.push(await page.evaluate(() => [...document.querySelectorAll('#process .ps-card')].findIndex((c) => c.classList.contains('on'))));
    }
    ix.pinnedSteps = pin;
    await page.screenshot({ path: `${OUT}/desktop/_how-it-works-pinned.png` });
  }
  // FAQ
  await go('pricing.html');
  await page.locator('[data-faq] button').first().scrollIntoViewIfNeeded(); await page.locator('[data-faq] button').first().click(); await page.waitForTimeout(600);
  ix.faqOpens = await page.locator('[data-faq] .ans').first().isVisible();
  // pricing toggles
  await page.locator('[data-bill="a"]').scrollIntoViewIfNeeded(); await page.click('[data-bill="a"]'); await page.click('[data-hours="80"]'); await page.waitForTimeout(800);
  ix.pricing = await page.$$eval('.plan', (ps) => ps.map((p) => p.querySelector('[data-rate]').textContent + ' | ' + p.querySelector('[data-est]').textContent));
  // careers filter + apply preselect + validation
  await go('careers.html');
  await page.selectOption('[data-role-f="3"]', 'Part-time'); await page.waitForTimeout(300);
  ix.careersFilterPartTime = await page.locator('.role:visible').count();
  await page.selectOption('[data-role-f="3"]', ''); await page.fill('[data-role-search]', 'claims'); await page.waitForTimeout(300);
  ix.careersSearchClaims = await page.locator('.role:visible').count();
  await page.fill('[data-role-search]', '');
  await page.locator('[data-apply="QA Reviewer"]').click(); await page.waitForTimeout(1500);
  ix.applyPreselect = await page.inputValue('[data-form="apply"] select[name="role"]');
  await page.click('[data-form="apply"] button[type=submit]'); await page.waitForTimeout(500);
  ix.applyEmptyErrors = await page.locator('[data-form="apply"] .err').count();
  // experts filter
  await go('our-experts.html');
  await page.locator('[data-f="Claims & Loss"]').scrollIntoViewIfNeeded(); await page.click('[data-f="Claims & Loss"]'); await page.waitForTimeout(500);
  ix.expertsClaimsFilter = await page.locator('.person:visible').count();
  // contact validation + success
  await go('contact.html');
  await page.locator('[data-form="contact"] button[type=submit]').scrollIntoViewIfNeeded();
  await page.click('[data-form="contact"] button[type=submit]'); await page.waitForTimeout(500);
  ix.contactEmptyErrors = await page.locator('[data-form="contact"] .err').count();
  await page.screenshot({ path: `${OUT}/${vpName}/_contact-validation.png` });
  await page.fill('[name=name]', 'Test Person'); await page.fill('[name=email]', 'not-an-email'); await page.fill('[name=agency]', 'Sample Agency');
  await page.check('[name=svc][value=claims]'); await page.fill('[name=msg]', 'We need help with certificates and claims.'); await page.check('[name=consent]');
  await page.click('[data-form="contact"] button[type=submit]'); await page.waitForTimeout(400);
  ix.contactBadEmailMsg = await page.locator('[name=email] ~ .err').textContent().catch(() => null);
  await page.fill('[name=email]', 'test@agency.example'); await page.click('[data-form="contact"] button[type=submit]'); await page.waitForTimeout(1800);
  ix.contactSuccess = { visible: await page.isVisible('[data-success="contact"]'), heading: await page.textContent('[data-success="contact"] h3') };
  await page.screenshot({ path: `${OUT}/${vpName}/_contact-success.png` });
  ix.errors = ierr;
  report.interactions[vpName] = ix;
  // legacy redirect
  await page.goto(BASE + 'coming-soon.html?page=pricing'); await page.waitForURL(/pricing\.html/, { timeout: 5000 }).catch(() => {});
  report.redirect[vpName] = page.url().replace(BASE, '');
  await ctx.close();
}

/* ---- link check ---- */
const ctx = await browser.newContext(); const req = ctx.request; const cache = {};
const broken = [];
for (const [abs, srcs] of hrefs) {
  const u = new URL(abs);
  if (abs === new URL('#', abs).href && !u.hash.slice(1)) continue;
  const pageUrl = u.origin + u.pathname;
  if (!cache[pageUrl]) { const r = await req.get(pageUrl); cache[pageUrl] = { status: r.status(), html: await r.text() }; }
  const c = cache[pageUrl];
  let ok = c.status === 200 && /<html/i.test(c.html);
  let why = ok ? '' : `HTTP ${c.status}`;
  if (ok && u.hash.length > 1 && !new RegExp(`id="${u.hash.slice(1)}"`).test(c.html)) { ok = false; why = `missing #${u.hash.slice(1)}`; }
  if (!ok) broken.push({ href: abs.replace(BASE, ''), why, from: [...srcs] });
}
const placeholders = [...hrefs.keys()].filter((h) => h.endsWith('#'));
report.links = { uniqueInternalHrefs: hrefs.size, checkedPages: Object.keys(cache).length, broken, placeholderHashLinks: placeholders.length };
await browser.close();
execFileSync('python3', ['-c', `
import json,glob,os
from PIL import Image
for j in sorted(glob.glob("${OUT}/.tiles/*.json")):
    d=json.load(open(j)); sc=d["scale"]; tiles=d["tiles"]
    H=sum(h for _,h in tiles)*sc; out=Image.new("RGB",(d["w"]*sc,H)); y=0
    for f,h in tiles:
        im=Image.open(f); hh=h*sc; out.paste(im.crop((0,im.height-hh,im.width,im.height)),(0,y)); y+=hh
    if sc==2: out=out.resize((out.width//2,out.height//2))
    os.makedirs(os.path.dirname(d["out"]),exist_ok=True); out.save(d["out"],quality=82,optimize=True)
import shutil; shutil.rmtree("${OUT}/.tiles")
`]);
fs.writeFileSync(`${OUT}/report.json`, JSON.stringify(report, null, 2));
const bad = Object.entries(report.pages).filter(([, v]) => v.consoleErrors.length || v.status !== 200 || v.overflowX);
console.log(JSON.stringify({ pagesTested: Object.keys(report.pages).length, pagesWithProblems: bad.map(([k, v]) => [k, v.consoleErrors, v.overflowX]), links: report.links, interactions: report.interactions, redirect: report.redirect, warnings: [...new Set(Object.values(report.pages).flatMap((v) => v.warnings))].slice(0, 10), failedRequests: [...new Set(Object.values(report.pages).flatMap((v) => v.failedRequests))].slice(0, 10) }, null, 2));
