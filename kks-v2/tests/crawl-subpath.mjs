// Crawl the built site served under a sub-path (as on GitHub Pages) and report broken links/assets.
// Usage: node tests/crawl-subpath.mjs http://127.0.0.1:8802/kks-insurance-services/
const START = process.argv[2] || 'http://127.0.0.1:8802/kks-insurance-services/';
const PREFIX = new URL(START).pathname;
const seen = new Map(); // url(no hash) -> status
const queue = [[START, '(start)'], [START + 'coming-soon.html', '(seed)'], [START + 'favicon.svg', '(seed)']];
const broken = [], outside = [], badHash = [], refs = new Map();
const ids = new Map(); // page url -> Set(ids)
const hashRefs = [];
const attr = /\b(?:href|src)\s*=\s*"([^"]+)"/g, cssUrl = /url\(\s*['"]?([^'")]+)['"]?\s*\)/g, jsImport = /(?:from|import)\s*\(?\s*["'](\.{1,2}\/[^"']+)["']/g;
const skip = (u) => /^(mailto:|tel:|data:|javascript:|#$)/.test(u) || /^https?:\/\//.test(u) && !u.startsWith(new URL(START).origin);
while (queue.length) {
  const [u, from] = queue.shift();
  const url = new URL(u); const hash = url.hash; url.hash = ''; const key = url.href;
  if (hash.length > 1) hashRefs.push([key, decodeURIComponent(hash.slice(1)), from]);
  if (!url.pathname.startsWith(PREFIX)) { outside.push(`${key} (from ${from})`); continue; }
  if (seen.has(key)) continue;
  const res = await fetch(key); seen.set(key, res.status);
  if (res.status !== 200) { broken.push(`${res.status} ${key} (from ${from})`); continue; }
  const type = res.headers.get('content-type') || '', body = await res.text();
  const found = [];
  if (type.includes('html')) {
    for (const m of body.matchAll(attr)) found.push(m[1]);
    ids.set(key, new Set([...body.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1])));
    // coming-soon redirect map
    const map = body.match(/var M=(\{.*?\});/); if (map) Object.values(JSON.parse(map[1])).forEach((v) => found.push(v));
  } else if (type.includes('css')) for (const m of body.matchAll(cssUrl)) found.push(m[1]);
  else if (type.includes('javascript')) for (const m of body.matchAll(jsImport)) found.push(m[1]);
  for (const f of found) { if (skip(f)) continue; const abs = new URL(f, key).href; queue.push([abs, key.replace(START, '')]); }
}
for (const [page, id, from] of hashRefs) { const s = ids.get(page); if (s && !s.has(id) && id !== 'top') badHash.push(`${page.replace(START, '')}#${id} (from ${from})`); else if (s && id === 'top' && !s.has('top')) badHash.push(`${page}#top (from ${from})`); }
const pages = [...seen.keys()].filter((k) => k.endsWith('.html') || k.endsWith('/'));
console.log(JSON.stringify({ start: START, fetched: seen.size, htmlPages: pages.length, assets: seen.size - pages.length, broken, outsideSubpath: [...new Set(outside)], missingAnchors: [...new Set(badHash)] }, null, 2));
process.exit(broken.length || outside.length || badHash.length ? 1 : 0);
