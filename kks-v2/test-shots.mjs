import { chromium } from 'playwright-core';
import fs from 'fs';
const URL = process.argv[2] || 'http://127.0.0.1:4174/';
const ONLY = process.argv[3];
const out = 'screenshots'; fs.mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', headless: true, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const report = {};
const ids = [['trust', 0], ['platforms', 0], ['why', 0.35], ['workflow', 0.5], ['services', 0.55], ['teams', 0.5], ['results', 0], ['reviews', 0], ['leadership', 0], ['contact', 0]];
for (const [name, vp, mobile] of [['desktop', { width: 1440, height: 900 }, false], ['mobile', { width: 390, height: 844 }, true]]) {
  if (ONLY && ONLY !== name) continue;
  const ctx = await browser.newContext({ viewport: vp, deviceScaleFactor: mobile ? 2 : 1, isMobile: mobile, hasTouch: mobile });
  const page = await ctx.newPage();
  const errs = [];
  page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') errs.push(m.type() + ': ' + m.text()); });
  page.on('pageerror', (e) => errs.push('PAGEERROR: ' + e.message));
  page.on('requestfailed', (r) => errs.push('REQFAIL: ' + r.url()));
  await page.goto(URL, { waitUntil: 'networkidle' });
  await page.waitForTimeout(3500);
  await page.screenshot({ path: `${out}/${name}-hero.png` });
  // hero stage mid-scroll (desk zoom)
  await page.evaluate(() => window.scrollTo(0, innerHeight * 1.1)); await page.waitForTimeout(2500);
  await page.screenshot({ path: `${out}/${name}-hero-desk.png` });
  const secInfo = [];
  for (const [id, frac] of ids) {
    const info = await page.evaluate(([id, frac]) => { const el = document.getElementById(id); const r = el.getBoundingClientRect(); const top = r.top + scrollY; const y = frac ? top + (r.height - innerHeight) * frac : top - 20; window.scrollTo(0, y); return { id, h: Math.round(r.height), textLen: el.innerText.length, visible: r.height > 0 }; }, [id, frac]);
    await page.waitForTimeout(2300);
    await page.screenshot({ path: `${out}/${name}-sec-${id}.png` });
    info.theme = await page.evaluate(() => document.documentElement.dataset.theme);
    secInfo.push(info);
  }
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight)); await page.waitForTimeout(1500);
  await page.screenshot({ path: `${out}/${name}-sec-footer.png` });
  const webgl = await page.evaluate(() => !document.documentElement.classList.contains('no-webgl'));
  // stitched full page
  const total = await page.evaluate(() => document.documentElement.scrollHeight);
  const tiles = [];
  for (let y = 0, i = 0; y < total; y += vp.height, i++) {
    await page.evaluate((y) => window.scrollTo(0, y), y);
    await page.waitForTimeout(1100);
    if (i === 1) await page.addStyleTag({ content: '.site-header,.wa-float{visibility:hidden!important}' });
    const f = `${out}/.tile-${name}-${String(i).padStart(3, '0')}.png`;
    await page.screenshot({ path: f });
    tiles.push([f, Math.min(vp.height, total - y)]);
  }
  fs.writeFileSync(`${out}/.tiles-${name}.json`, JSON.stringify({ tiles, w: vp.width, scale: mobile ? 2 : 1 }));
  await page.addStyleTag({ content: '.site-header,.wa-float{visibility:visible!important}' });
  await page.evaluate(() => window.scrollTo(0, 0)); await page.waitForTimeout(800);
  const navOk = await page.evaluate(() => ({ dropdownItems: document.querySelectorAll('#svc-menu a').length, navLinks: document.querySelectorAll('.main-nav > ul > li').length, mobileLinks: document.querySelectorAll('#mobile-menu > ul > li').length, reviews: document.querySelectorAll('.rv').length, flips: document.querySelectorAll('.flip').length, flipped: document.querySelectorAll('.flip.flipped').length, svcCards: document.querySelectorAll('.svc').length, learnMore: document.querySelectorAll('.svc .text-link').length, wa: !!document.querySelector('.wa-float[href^="https://wa.me"]'), footerLinks: document.querySelectorAll('.site-footer a').length, totalHeight: document.documentElement.scrollHeight }));
  if (mobile) {
    await page.click('.burger'); await page.waitForTimeout(600);
    await page.click('.m-drop-btn'); await page.waitForTimeout(400);
    await page.screenshot({ path: `${out}/${name}-menu-open.png` });
    navOk.mobileMenuVisible = await page.isVisible('#mobile-menu');
    navOk.mobileSvcItems = await page.locator('#m-svc a').count();
  } else {
    await page.hover('.drop-btn'); await page.waitForTimeout(500);
    navOk.dropdownVisible = await page.evaluate(() => getComputedStyle(document.getElementById('svc-menu')).visibility);
    await page.screenshot({ path: `${out}/${name}-dropdown.png` });
    // reviews next button works
    await page.mouse.move(10, 10);
    const before = await page.evaluate(() => { const c = document.querySelector('[data-carousel]'); c.scrollIntoView(); return c.scrollLeft; });
    await page.waitForTimeout(800); await page.click('[data-next]', { force: true }); await page.waitForTimeout(900);
    navOk.reviewNextMoves = (await page.evaluate(() => document.querySelector('[data-carousel]').scrollLeft)) !== before;
  }
  report[name] = { errs, webgl, secInfo, navOk };
  await ctx.close();
}
if (!ONLY) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 }, reducedMotion: 'reduce' });
  const p = await ctx.newPage(); const e2 = [];
  p.on('pageerror', (e) => e2.push(e.message)); p.on('console', (m) => m.type() === 'error' && e2.push(m.text()));
  await p.goto(URL, { waitUntil: 'networkidle' }); await p.waitForTimeout(1500);
  await p.screenshot({ path: `${out}/reduced-motion-hero.png` });
  report.reducedMotion = { errs: e2, simpleClass: await p.evaluate(() => document.documentElement.className), heroCount: await p.textContent('.stats .count'), flipped: await p.locator('.flip.flipped').count() };
  await ctx.close();
  const b2 = await chromium.launch({ executablePath: '/usr/bin/google-chrome', headless: true, args: ['--disable-gpu', '--disable-webgl', '--disable-3d-apis'] });
  const c3 = await b2.newContext({ viewport: { width: 1440, height: 900 } }); const p3 = await c3.newPage(); const e3 = [];
  p3.on('pageerror', (e) => e3.push(e.message)); p3.on('console', (m) => m.type() === 'error' && e3.push(m.text()));
  await p3.goto(URL, { waitUntil: 'networkidle' }); await p3.waitForTimeout(2500);
  await p3.screenshot({ path: `${out}/no-webgl-hero.png` });
  await p3.evaluate(() => { const t = document.getElementById('teams'); scrollTo(0, t.offsetTop + t.offsetHeight * 0.4); }); await p3.waitForTimeout(2000);
  await p3.screenshot({ path: `${out}/no-webgl-teams.png` });
  report.noWebGL = { errs: e3, noWebglClass: await p3.evaluate(() => document.documentElement.classList.contains('no-webgl')) };
  await b2.close();
}
await browser.close();
console.log(JSON.stringify(report, null, 2));
