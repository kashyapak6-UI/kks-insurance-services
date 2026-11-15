import { chromium } from '/workspace/kks-3d/node_modules/playwright-core/index.mjs';
import fs from 'fs';
const sites = { mercury: 'https://mercury.com/', ramp: 'https://ramp.com/', corgi: 'https://corgi.com/', oscar: 'https://www.hioscar.com/' };
const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', headless: true, args: ['--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
const out = {};
for (const [k, url] of Object.entries(sites)) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, userAgent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36' });
  const page = await ctx.newPage();
  const scripts = new Set();
  page.on('request', r => { if (['script','media','font'].includes(r.resourceType())) scripts.add(r.resourceType()+': '+r.url().slice(0,160)); });
  try { await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 }); } catch (e) { out[k] = { err: e.message }; continue; }
  await page.waitForTimeout(4000);
  const H = await page.evaluate(() => document.documentElement.scrollHeight);
  const themeLog = [];
  let i = 0;
  for (let y = 0; y < H && i < 14; y += Math.max(900, Math.floor(H / 12)), i++) {
    for (let s = 0; s < 6; s++) { await page.mouse.wheel(0, 150); await page.waitForTimeout(120); }
    await page.evaluate(y => window.scrollTo(0, y), y);
    await page.waitForTimeout(1300);
    await page.screenshot({ path: `research-shots/${k}-${String(i).padStart(2,'0')}.png` });
    themeLog.push(await page.evaluate(() => { const b = getComputedStyle(document.body).backgroundColor; const el = document.elementFromPoint(720, 450); let bg='', e=el; while (e && (!bg || bg==='rgba(0, 0, 0, 0)')) { bg = getComputedStyle(e).backgroundColor; e = e.parentElement; } return { y: scrollY, body: b, center: bg }; }));
  }
  const info = await page.evaluate(() => {
    const fonts = new Set(); const colors = {};
    document.querySelectorAll('h1,h2,h3,p,a,button,span').forEach((e, i) => { if (i > 1500) return; const s = getComputedStyle(e); fonts.add(e.tagName+':'+s.fontFamily.split(',')[0]+' '+s.fontWeight+(s.fontStyle==='italic'?' italic':'')); const c = s.color; colors[c] = (colors[c]||0)+1; const bg = s.backgroundColor; if (bg !== 'rgba(0, 0, 0, 0)') colors['bg '+bg] = (colors['bg '+bg]||0)+1; });
    const g = window;
    const sticky = [...document.querySelectorAll('*')].filter(e => ['sticky','fixed'].includes(getComputedStyle(e).position)).slice(0,20).map(e => e.tagName+'.'+String(e.className).slice(0,60));
    const h = [...document.querySelectorAll('h1,h2')].slice(0,25).map(e => e.tagName+': '+e.innerText.slice(0,90).replace(/\n/g,' | ') + ' ['+getComputedStyle(e).fontFamily.split(',')[0]+' '+getComputedStyle(e).fontSize+']');
    return {
      title: document.title,
      libs: { gsap: !!g.gsap, ScrollTrigger: !!g.ScrollTrigger, lottie: !!(g.lottie||g.bodymovin)||!!document.querySelector('lottie-player,dotlottie-player,[data-lottie]'), lenis: !!document.querySelector('.lenis,html.lenis')||!!g.lenis, framer: !!document.querySelector('[data-framer-name],[data-projection-id]'), next: !!g.__NEXT_DATA__||!!document.querySelector('#__next'), three: !!g.THREE, rive: !!document.querySelector('canvas[class*=rive],rive-canvas') },
      canvas: document.querySelectorAll('canvas').length, video: document.querySelectorAll('video').length, svgs: document.querySelectorAll('svg').length, imgs: document.querySelectorAll('img').length,
      marquee: [...document.querySelectorAll('[class*=marquee i],[class*=ticker i],[class*=logo i]')].slice(0,5).map(e=>String(e.className).slice(0,60)),
      anims: [...new Set([...document.getAnimations()].map(a => a.animationName || a.constructor.name))].slice(0,30),
      transforms: [...document.querySelectorAll('*')].filter(e => { const t = getComputedStyle(e).transform; return t && t!=='none'; }).length,
      sticky, h, fonts: [...fonts].slice(0,40), colors: Object.entries(colors).sort((a,b)=>b[1]-a[1]).slice(0,22),
      cssVars: [...document.styleSheets].flatMap(s => { try { return [...s.cssRules].filter(r => r.selectorText===':root').map(r=>r.cssText.slice(0,1200)); } catch { return []; } }).slice(0,2),
    };
  });
  out[k] = { H, themeLog, info, scripts: [...scripts].filter(s=>!/google|facebook|segment|hotjar|doubleclick|analytics|gtm|clarity|linkedin|hubspot|intercom|onetrust|cookie/i.test(s)).slice(0,40) };
  await ctx.close();
}
await browser.close();
fs.writeFileSync('research-raw.json', JSON.stringify(out, null, 1));
console.log('done');
